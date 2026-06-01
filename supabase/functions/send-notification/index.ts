import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { notificationId } = await request.json();
  if (!notificationId) {
    return json({ error: 'notificationId is required' }, 400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data: notification, error } = await supabase
    .from('notifications')
    .select('id, text_key, payload, recipient_profile_id, profiles:recipient_profile_id(email, preferred_language)')
    .eq('id', notificationId)
    .single();

  if (error) {
    return json({ error: error.message }, 500);
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (resendApiKey && notification.profiles?.email) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('TOPSHIFT_MAIL_FROM') ?? 'TopShift <noreply@topshift.app>',
        to: notification.profiles.email,
        subject: `TopShift: ${notification.text_key}`,
        html: `<p>${notification.text_key}</p><pre>${JSON.stringify(notification.payload ?? {}, null, 2)}</pre>`,
      }),
    });

    if (!response.ok) {
      return json({ error: await response.text() }, 502);
    }
  }

  const { error: updateError } = await supabase
    .from('notifications')
    .update({ delivered_email_at: new Date().toISOString() })
    .eq('id', notification.id);

  if (updateError) {
    return json({ error: updateError.message }, 500);
  }

  return json({
    ok: true,
    notificationId: notification.id,
    language: notification.profiles?.preferred_language ?? 'de',
  });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
