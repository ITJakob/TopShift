# TopShift

B2B Schichtmanagement-Web-App fuer DACH mit React, Vite und Supabase-Auth-Vorbereitung.

## Entwicklung

```bash
npm install
npm run dev
```

Fuer echte Supabase-Authentifizierung muss `VITE_SUPABASE_ANON_KEY` gesetzt werden. Die Supabase-URL ist bereits auf das bereitgestellte Projekt vorkonfiguriert.

## Build

```bash
npm run build
```

## Supabase und Deployment

- Datenbankschema/RLS: `supabase/migrations/0001_initial_schema.sql`
- Optionaler Seed: `supabase/seed.sql`
- Edge-Function-Skelette: `supabase/functions/send-notification` und `supabase/functions/stripe-webhook`
- Vercel-Konfiguration: `vercel.json`
- Details: `docs/deployment.md`

Die App nutzt Supabase, sobald `VITE_SUPABASE_ANON_KEY` gesetzt ist und ein echter Login verwendet wird. Demo-Logins bleiben lokal und speichern im Browser.

