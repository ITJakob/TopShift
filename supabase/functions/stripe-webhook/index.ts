import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') ?? '';
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (webhookSecret && !(await verifyStripeSignature(payload, signature, webhookSecret))) {
    return json({ error: 'Invalid Stripe signature' }, 400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const event = JSON.parse(payload);
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

async function verifyStripeSignature(payload: string, signatureHeader: string, secret: string) {
  const timestamp = signatureHeader
    .split(',')
    .find((part) => part.startsWith('t='))
    ?.slice(2);
  const expectedSignatures = signatureHeader
    .split(',')
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3));

  if (!timestamp || expectedSignatures.length === 0) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const hex = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return expectedSignatures.some((expected) => timingSafeEqual(hex, expected));
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}
