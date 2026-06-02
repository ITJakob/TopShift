# TopShift Deployment

## Vercel

Set these environment variables in Vercel Project Settings > Environment Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Important for Vite: `VITE_*` variables are embedded at build time. If a variable is added or changed after a deployment, trigger a new deployment. Also verify the variable is enabled for the exact scope you are viewing (`Production` and/or `Preview`).

Build command and output directory are defined in `vercel.json`. The build runs `scripts/validate-env.mjs` and fails on Vercel if `VITE_SUPABASE_ANON_KEY` is missing, so broken auth bundles are not deployed silently.

## Supabase

1. Apply database schema:

   ```bash
   supabase db push
   ```

2. Optional local seed:

   ```bash
   supabase db reset
   ```

3. Deploy Edge Functions when ready:

   ```bash
   supabase functions deploy send-notification
   supabase functions deploy send-invitation
   supabase functions deploy stripe-webhook
   supabase functions deploy create-checkout-session
   ```

4. Required Edge Function secrets:

   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
   supabase secrets set RESEND_API_KEY=...
   supabase secrets set STRIPE_WEBHOOK_SECRET=...
   supabase secrets set STRIPE_SECRET_KEY=...
   supabase secrets set STRIPE_PRICE_SMALL=...
   supabase secrets set STRIPE_PRICE_BUSINESS=...
   supabase secrets set TOPSHIFT_MAIL_FROM=...
   supabase secrets set APP_URL=...
   ```

Stripe and email delivery are intentionally prepared but not activated for live charging or sending until the corresponding provider keys and signature checks are configured.

## Live smoke test

After `supabase db push`, run `supabase/smoke_test.sql` in the Supabase SQL editor. See `docs/supabase-live-test.md` for the full checklist.
