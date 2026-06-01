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

  const { companyId, plan } = await request.json();
  if (!companyId || !['small', 'business', 'enterprise'].includes(plan)) {
    return json({ error: 'companyId and paid plan are required' }, 400);
  }

  const authHeader = request.headers.get('Authorization');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader ?? '' } } },
  );

  const { data: isAdmin, error } = await supabase.rpc('is_company_admin', {
    target_company_id: companyId,
  });
  if (error || !isAdmin) {
    return json({ error: 'Only company admins can start checkout' }, 403);
  }

  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  const priceId = Deno.env.get(`STRIPE_PRICE_${plan.toUpperCase()}`);
  if (!stripeSecret || !priceId) {
    return json({ error: 'Stripe is not configured yet' }, 501);
  }

  const params = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: `${Deno.env.get('APP_URL') ?? 'https://topshift.app'}/?checkout=success`,
    cancel_url: `${Deno.env.get('APP_URL') ?? 'https://topshift.app'}/?checkout=cancelled`,
    'subscription_data[metadata][company_id]': companyId,
    'subscription_data[metadata][topshift_plan]': plan,
  });

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    return json({ error: await response.text() }, 502);
  }

  const session = await response.json();
  return json({ url: session.url });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
