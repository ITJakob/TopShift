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

  const { invitationId } = await request.json();
  if (!invitationId) {
    return json({ error: 'invitationId is required' }, 400);
  }

  const authHeader = request.headers.get('Authorization') ?? '';
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data: invitation, error } = await serviceClient
    .from('employee_invitations')
    .select('id, company_id, email, token, role, status, companies:company_id(name)')
    .eq('id', invitationId)
    .single();

  if (error) {
    return json({ error: error.message }, 500);
  }
  if (invitation.status !== 'pending') {
    return json({ error: 'Only pending invitations can be sent' }, 409);
  }

  const { data: isAdmin, error: adminError } = await userClient.rpc('is_company_admin', {
    target_company_id: invitation.company_id,
  });
  if (adminError || !isAdmin) {
    return json({ error: 'Only company admins can send invitations' }, 403);
  }

  const appUrl = Deno.env.get('APP_URL') ?? request.headers.get('origin') ?? 'https://topshift.app';
  const inviteUrl = `${appUrl.replace(/\/$/, '')}/invite/${invitation.token}`;
  const resendApiKey = Deno.env.get('RESEND_API_KEY');

  if (resendApiKey) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('TOPSHIFT_MAIL_FROM') ?? 'TopShift <noreply@topshift.app>',
        to: invitation.email,
        subject: `TopShift Einladung - ${invitation.companies?.name ?? 'TopShift'}`,
        html: `
          <p>Du wurdest zu <strong>${invitation.companies?.name ?? 'TopShift'}</strong> eingeladen.</p>
          <p><a href="${inviteUrl}">Einladung annehmen</a></p>
          <p>Falls der Button nicht funktioniert, kopiere diesen Link: ${inviteUrl}</p>
        `,
      }),
    });

    if (!response.ok) {
      return json({ error: await response.text() }, 502);
    }
  }

  const { error: updateError } = await serviceClient
    .from('employee_invitations')
    .update({ emailed_at: new Date().toISOString() })
    .eq('id', invitation.id);
  if (updateError) {
    return json({ error: updateError.message }, 500);
  }

  return json({ ok: true, inviteUrl, emailSent: Boolean(resendApiKey) });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
