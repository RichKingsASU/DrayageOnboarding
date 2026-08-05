# Drayage Customer Onboarding CRM

## Purpose

Drayage Customer Onboarding CRM is a React/Vite application for managing drayage customer onboarding from inquiry through ongoing support. It tracks customer profile data, onboarding documents, compliance checklist status, SOP alerts, and Supabase-backed workflow state.

## Architecture and stack

- React 19, TypeScript, Vite, Tailwind CSS, and Supabase JavaScript client.
- Supabase local development for Postgres, Storage, Realtime, Auth, migrations, seed data, and RLS tests.
- Azure migration artifacts for future PostgreSQL Flexible Server, Blob Storage, Web PubSub, and Data API Builder work.

## Prerequisites

- Node.js 22 for compatibility with the installed Supabase JavaScript packages.
- npm.
- Docker and Supabase CLI for local database validation.
- Azure CLI for `azure-setup.sh`.

## Fresh-clone setup

```bash
npm ci
cp .env.example .env
npm run dev
```

Populate `.env` with local Supabase values from `supabase start` or a securely managed project.

## Environment variables

### Frontend-safe Supabase variables

These may be used by browser-side Vite code:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Privileged manual smoke-test variables

`test_workflow.ts` is a manual/admin smoke-test script only. It is not imported by frontend code and must run only in trusted local or CI environments.

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` bypasses Row-Level Security. Never give it a `VITE_` prefix, never commit it, and never expose it to browser bundles. Any service-role key previously committed to this repository must be rotated in Supabase immediately by a project administrator.

### Azure infrastructure variables

`azure-setup.sh` requires these secure inputs before provisioning:

```env
DB_ADMIN_PASSWORD=
POSTGRES_ALLOWED_START_IP=
POSTGRES_ALLOWED_END_IP=
```

Use a CI/CD secret store, password manager, or Key Vault-backed workflow for `DB_ADMIN_PASSWORD`. The PostgreSQL allow-list values must be environment-specific public egress IPs approved by DevOps. Production should prefer private endpoint/VNet integration when the target Azure architecture is finalized.

## Local development

```bash
npm run dev
npm run preview
```

## Local Supabase setup

```bash
supabase start
supabase db reset
supabase test db
supabase stop
```

## Test and validation commands

```bash
git diff --check
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm ls
bash -n azure-setup.sh
```

## Azure provisioning

Authenticate with Azure CLI, select the correct subscription, export the required Azure variables, then run:

```bash
./azure-setup.sh
```

The script restricts PostgreSQL public access to the supplied start/end IP range and does not print database passwords, storage keys, PubSub connection strings, or connection strings.

## Security model

- Frontend uses only Supabase anon credentials and relies on RLS policies.
- Service-role credentials are reserved for trusted administrative tooling only.
- Document uploads are validated by extension, MIME type, and size.
- Supabase migrations include RLS/storage policy checks validated by local SQL tests.
- CI includes dependency installation, typecheck, lint, unit tests, build, whitespace checks, Supabase reset/tests, and a safe secret-pattern scan.

## Repository structure

- `src/` React UI, domain workflow rules, fixtures, and Supabase helpers.
- `tests/` Node test-runner unit tests.
- `supabase/migrations/` database migrations.
- `supabase/tests/` local RLS/database tests.
- `docs/` Azure migration and handoff notes.
- `azure-setup.sh` draft Azure provisioning script.

## Known limitations and deployment status

The application is not fully production-deployed from this repository. DevOps still must rotate the previously exposed Supabase service-role key, supply production Supabase/Azure secrets, decide final Azure networking, configure production auth/redirects, and validate the target subscription/resource naming strategy.
