# TopShift Deployment

## Vercel

Set these environment variables in Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Build command and output directory are defined in `vercel.json`.

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
   supabase functions deploy stripe-webhook
   ```

4. Required Edge Function secrets:

   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
   supabase secrets set RESEND_API_KEY=...
   supabase secrets set STRIPE_WEBHOOK_SECRET=...
   ```

Stripe and email delivery are intentionally prepared but not activated for live charging or sending until the corresponding provider keys and signature checks are configured.
