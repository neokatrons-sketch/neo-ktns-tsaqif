# Neo KTNS

Editable source snapshot of the current Neo KTNS production Site, prepared for import into a GitHub repository. The export preserves the working storefront, configurator, checkout, Supabase integration, private design uploads, admin authentication, pricing, promotions, WhatsApp handoff, and Cloudflare Worker/Vinext runtime architecture.

No production database rows, uploaded customer files, runtime secrets, local build output, or Git history are included.

## Requirements

- Node.js 22.13 or newer
- npm (the committed `package-lock.json` is authoritative)
- A Supabase project when database-backed features are required
- A Cloudflare Worker-compatible runtime for production

## Architecture

- **Next.js 16 App Router** provides storefront, admin, and API routes.
- **Vinext + Vite** compile the application to a Cloudflare Worker-compatible ESM artifact.
- **Cloudflare Worker bindings** provide runtime environment variables through `cloudflare:workers`.
- **Supabase Postgres** stores catalog, pricing, customers, orders, promotions, settings, and admin authorization data.
- **Supabase Auth** manages administrator sessions. Authorization additionally requires an active `admin_users` row.
- **Supabase Storage** stores customer design files in the private `design-files` bucket.
- **Server-side checkout** validates placements, resolves existing embroidery packages, calculates authoritative pricing, applies promos, snapshots order totals, and finalizes orders idempotently.

### Main directories

```text
app/                    Next.js routes, layouts, server actions, and API routes
  (store)/              Public storefront and checkout pages
  admin/                Supabase-authenticated administration routes
  api/                  Checkout, promo, upload, and signed-file endpoints
components/             Reusable storefront, product, checkout, admin, UI, and motion components
lib/                    Catalog, pricing, checkout, promotions, settings, auth, storage, and Supabase helpers
public/                 Favicons, product imagery, and required static assets
supabase/migrations/    PostgreSQL schema, functions, constraints, RLS, and storage policies
supabase/seed.sql       Initial product, variants, packages, pricing rules, and settings
tests/                  Security, checkout boundary, placement, upload, rendering, and motion tests
worker/index.ts         Cloudflare Worker entry point used by Vinext
build/                  Sites/Vite integration used by the current build
scripts/                Reproducible install, build, and artifact validation helpers
```

## Routes

Public storefront routes include `/`, `/collection`, `/products/premium-polo`, `/custom`, `/checkout`, `/how-to-custom`, `/size-guide`, `/our-story`, `/faq`, and `/track-order`.

Administration routes live under `/admin`. Customer checkout remains guest-based; customers do not need an account.

API routes:

- `POST /api/checkout/create` — create/recover an idempotent draft with authoritative prices
- `POST /api/checkout/promo` — validate a promo against server-calculated totals
- `POST /api/design-files` — validate and upload one private design file for a draft order
- `POST /api/checkout/finalize` — atomically finalize the order and return the WhatsApp handoff
- `GET /api/admin/design-files/:id/signed-url` — short-lived admin-only download URL

## Environment variables

The application requires these bindings when Supabase-backed features are used:

| Variable | Purpose | Exposure rule |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Deployment configuration; do not hard-code it in source |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key used for server session/auth operations | Keep external to the repository in this project |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged checkout, pricing, storage, and admin server access | Secret; server/Worker binding only; never expose to browser code |

Safe placeholders are provided in `.env.example`. No real values are included.

## Local development

The production code intentionally does **not** read Supabase credentials from `process.env`. It imports `env` from `cloudflare:workers`, so local development should emulate the same Worker binding model.

1. Install the locked dependencies:

   ```bash
   npm ci
   ```

2. Copy the safe template to Wrangler's local binding file:

   ```bash
   cp .env.example .dev.vars
   ```

3. Put development or test Supabase values in `.dev.vars`. This file is ignored by Git. Using a separate development Supabase project is recommended because checkout and admin operations write real data.

4. Start the local Vinext/Vite Worker runtime:

   ```bash
   npm run dev
   ```

The application fails closed or uses documented non-critical storefront fallbacks when Worker bindings are absent. Do not add a `process.env` fallback for the service-role key.

## Supabase setup

For a new Supabase project, run the SQL files in this exact order:

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_harden_checkout_schema.sql`
3. `supabase/migrations/0003_admin_order_payments.sql`
4. `supabase/migrations/0004_promos_statistics_settings.sql`
5. `supabase/seed.sql`

Migration 0001 creates the tables, RLS policies, private `design-files` bucket, and initial storage policies. Later migrations add checkout idempotency, race-safe order numbers, payment operations, promotion/settings support, order snapshots, and the current six-parameter `finalize_checkout_order` function.

After creating administrators in Supabase Auth, explicitly insert their Auth user IDs into `public.admin_users`. An authenticated user without an active row remains unauthorized.

Do not disable RLS. Do not make the `design-files` bucket public. Do not grant the service-role key to the browser. Existing finalized orders rely on stored price/business snapshots and must not be recalculated after pricing changes.

## Checkout and pricing security

- Customer-submitted prices are never authoritative.
- Placements are validated against an existing embroidery package and its allowed placement sets.
- Selling prices resolve from active size/package rules plus the current margin or override.
- Promo validation is repeated atomically during finalization.
- Draft creation and finalization use idempotency keys to prevent duplicate orders.
- Design uploads use a short-lived, hashed, one-time order upload token and strict type/size validation.
- Base cost, margin, service-role credentials, and profit values stay server-side/admin-only.

## Production runtime

`lib/supabase/server-config.ts` dynamically reads the three Supabase values from `cloudflare:workers` bindings. Preserve this behavior in production.

The build emits:

- `dist/server/index.js` — ESM Worker with a default `fetch` handler
- `dist/.openai/hosting.json` — validated Sites hosting manifest
- static assets required by the Worker

The current `vite.config.ts`, `worker/index.ts`, and build scripts preserve the existing ChatGPT Sites/Cloudflare compatibility. The included `.openai/hosting.json` is deployment identity metadata, not a credential. Importing the repository into GitHub does not deploy it. If moving to an independent Cloudflare deployment pipeline, configure equivalent Worker variables/secrets and Vinext asset/image bindings without committing their values.

## Quality commands

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

`npm test` runs the production build and the Node test suite. `npm run build` also validates that the generated Worker has a callable default `fetch` export and that the hosting manifest is present.

## GitHub import

After extracting this archive:

```bash
git init
git add .
git commit -m "Import Neo KTNS production source"
git branch -M main
git remote add origin <your-github-repository-url>
git push -u origin main
```

Review `.env.example`, create your local ignored `.dev.vars`, and configure production Worker bindings in your chosen hosting platform before enabling live checkout.

## Security checklist

- Never commit `.env`, `.env.local`, `.env.*.local`, `.dev.vars`, database passwords, access tokens, or service-role keys.
- Keep `SUPABASE_SERVICE_ROLE_KEY` available only to server-side Worker code.
- Keep RLS enabled on all business tables.
- Keep the design bucket private and use signed admin downloads.
- Treat `supabase/seed.sql` as business configuration: it intentionally contains catalog prices and settings, but no credentials.
- Rotate a credential immediately if it is ever committed to Git history; deleting it in a later commit is insufficient.
