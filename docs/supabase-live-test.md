# Supabase Live Test

Use this checklist after deploying the latest schema and Edge Functions.

## 1. Apply schema and smoke test

```bash
supabase db push
```

Then run `supabase/smoke_test.sql` in the Supabase SQL editor. Every required relation/RPC should report `ok`, and RLS should be enabled for protected tables.

## 2. Deploy functions

```bash
supabase functions deploy send-notification
supabase functions deploy send-invitation
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

## 3. Required secrets

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set SUPABASE_ANON_KEY=...
supabase secrets set APP_URL=https://top-shift.vercel.app
supabase secrets set RESEND_API_KEY=...
supabase secrets set TOPSHIFT_MAIL_FROM='TopShift <noreply@your-domain>'
supabase secrets set STRIPE_SECRET_KEY=...
supabase secrets set STRIPE_WEBHOOK_SECRET=...
supabase secrets set STRIPE_PRICE_SMALL=...
supabase secrets set STRIPE_PRICE_BUSINESS=...
```

## 4. Functional checks

1. Register a new admin account.
2. Complete onboarding.
3. Add an employee and confirm an invitation email is sent.
4. Open `/invite/:token`, create an employee account, and verify the account is linked to the company.
5. Create a draft shift, publish it, and confirm the employee sees it.
6. Submit an absence request as employee and approve it as admin.
7. Submit a shift swap and confirm peer approval before admin approval.
8. Start/end a shift in time tracking and confirm actual hours update.
9. Run Stripe checkout in test mode and verify `subscriptions` and `companies.plan` update through the webhook.
