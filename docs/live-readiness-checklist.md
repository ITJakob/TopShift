# TopShift Live Readiness Checklist

## 1. Supabase database

- Run `supabase db push`.
- Confirm these tables exist: `companies`, `company_members`, `employees`, `locations`, `shifts`, `swap_requests`, `sick_reports`, `notifications`, `subscriptions`.
- In Authentication settings, configure the production URL and preview URL as allowed redirect URLs.
- Create a real admin account through the app.
- After first login, verify that the app creates:
  - one profile
  - one company
  - one admin membership
  - demo employees/templates for the first workspace

## 2. RLS smoke tests

- Admin can read and update company data.
- Admin can add employees and shifts.
- Employee can read published shifts.
- Employee cannot modify company settings.
- Employee can create sick reports and swap requests.

## 3. Vercel

- `VITE_SUPABASE_URL` exists for Production and Preview.
- `VITE_SUPABASE_ANON_KEY` exists for Production and Preview.
- Redeploy after every env change.
- Build should fail if `VITE_SUPABASE_ANON_KEY` is missing.

## 4. Notifications

- Deploy `send-notification`.
- Deploy `send-invitation`.
- Add `SUPABASE_SERVICE_ROLE_KEY`.
- Add provider key such as `RESEND_API_KEY`.
- Replace the placeholder delivery block with real provider API call.
- Trigger notification function from database webhook or server action.

## 5. Stripe

- Keep live charging disabled until products/prices are final.
- Add Stripe product metadata:
  - `topshift_plan=small`
  - `topshift_plan=business`
  - `company_id=<uuid>` on checkout/session/subscription metadata
- Deploy `create-checkout-session`.
- Confirm Stripe signature verification is active in `stripe-webhook`.
- Confirm server-side plan limits using the `subscriptions` table, not only frontend checks.

## 6. Product QA

- Test mobile login and schedule creation.
- Test legal violations for AT/DE/CH and each branch.
- Test published vs draft visibility.
- Export CSV/PDF from a real month.
- Test sick report -> affected shifts become unassigned.
- Test shift swap approval updates both shifts.
