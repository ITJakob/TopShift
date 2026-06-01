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

  // Wire RESEND_API_KEY here when email delivery is enabled. Until then the
  // function records a delivery timestamp so the workflow can be tested.
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
