import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // Stripe signature verification should be enabled before activating billing.
  // This placeholder keeps the data contract ready without charging customers.
  const event = await request.json();
  const subscription = event.data?.object;
  const companyId = subscription?.metadata?.company_id;

  if (!companyId) {
    return json({ ignored: true, reason: 'missing company_id metadata' });
  }

  const plan = subscription?.metadata?.topshift_plan ?? 'free';
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  const { error } = await supabase.from('subscriptions').upsert(
    {
      company_id: companyId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      plan,
      current_period_end: periodEnd,
    },
    { onConflict: 'company_id' },
  );

  if (error) {
    return json({ error: error.message }, 500);
  }

  await supabase.from('companies').update({ plan }).eq('id', companyId);

  return json({ ok: true });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
