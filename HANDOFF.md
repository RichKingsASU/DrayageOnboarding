# DrayageOnboarding DevOps Handoff

## Security flags requiring review before release

- **Hardcoded Supabase service-role-style key:** `test_workflow.ts` contains a committed JWT-like key described as a `service_role` test key. Rotate/remove it before sharing the repository outside the trusted team, and replace it with secret-managed test configuration.
- **Hardcoded Azure database password:** `azure-setup.sh` sets `DB_ADMIN_PASSWORD="SuperSecurePassword123!"`. Treat this as a sample-only value and replace it with a required environment variable, Key Vault lookup, or CI/CD secret before use.
- **Open Azure PostgreSQL public access setting:** `azure-setup.sh` provisions PostgreSQL Flexible Server with `--public-access 0.0.0.0`. Confirm whether this is an intentional temporary development setting; production should use a VNet/private endpoint or restricted known IP ranges.
- **Final secret scan required:** Before external handoff, re-run a formal secret scan over source, migrations, JSON, shell scripts, and docs. The root `.gitignore` excludes `.env*` while allowing `.env.example`, but committed source still contains the flags above.

## Overview

DrayageOnboarding is a React/Vite/TypeScript customer onboarding CRM for drayage brokerages. It organizes customers through a five-stage onboarding pipeline, captures account/contact/accessorial SOP details, tracks compliance checklist progress, uploads onboarding documents to a Supabase-backed document vault, and includes Supabase migrations/tests for database, storage, realtime, and RLS behavior. The repository also contains Azure migration planning artifacts for a future move to Azure Database for PostgreSQL, Blob Storage, Data API Builder, and Web PubSub.

## Setup and run instructions

1. Install Node dependencies:

   ```bash
   npm install
   ```

2. Create a local `.env` using `.env.example` as the template. The frontend Supabase client requires:

   ```bash
   VITE_SUPABASE_URL="http://localhost:54321"
   VITE_SUPABASE_ANON_KEY="replace-with-local-or-project-anon-key"
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Build the application:

   ```bash
   npm run build
   ```

5. Run TypeScript checks and unit tests:

   ```bash
   npm run lint
   npm test
   ```

6. For local Supabase database validation, follow the CI workflow pattern if the Supabase CLI and Docker are available:

   ```bash
   supabase start
   supabase db reset
   supabase test db
   supabase stop
   ```

## Repository structure

- `src/` — React application source, shared TypeScript domain types, onboarding workflow/rule helpers, Supabase client helpers, and UI components.
- `src/components/` — Main UI surfaces for the Kanban board, customer dashboard, and secure document uploader.
- `src/hooks/` — React hooks for loading and synchronizing Supabase-backed account state.
- `src/lib/` — Supabase integration and database/storage normalization helpers.
- `tests/` — Node test-runner unit tests for workflow and Supabase payload/file-validation behavior.
- `supabase/migrations/` — Postgres/Supabase schema, workflow, realtime, storage, and RLS migrations.
- `supabase/tests/` — Local database/RLS verification SQL.
- `.github/workflows/` — CI validation workflow for npm checks and Supabase database tests.
- `docs/` — Azure migration and DevOps handoff planning documents.
- `azure-setup.sh` — Draft Azure CLI provisioning script for the proposed migration target.
- `dab-config.json` — Draft Azure Data API Builder configuration.

## Engineering strengths to highlight

- The document upload path validates extension, file size, and MIME type before upload, and sanitizes filenames for storage paths.
- If document metadata insertion fails after a storage upload, the storage object is removed to avoid orphaned files.
- Supabase migrations include RLS/storage hardening, and the repository includes a dedicated local RLS verification SQL script.
- CI runs npm checks and also starts Supabase, resets the database, and runs Supabase database tests.
- Azure migration planning is already documented in `docs/azure_migration_plan.md` and `docs/azure_devops_handoff.md`.

## Open questions and unclear areas

- Should `test_workflow.ts` remain in the repository after the hardcoded service-role-style key is removed, or should it be replaced with a documented local-only smoke-test script?
- Should `azure-setup.sh` be treated as a production-ready provisioning script or a draft migration artifact? Current security defaults suggest draft-only.
- Should demo/seed-specific onboarding defaults in `src/onboardingRules.ts` move into seed data or configuration so domain rules stay generic?
- Should `DOCUMENT_CHECKLIST_ITEM_BY_TYPE` have one source of truth? It currently exists in both the Supabase client layer and onboarding workflow layer.
- Should package metadata be updated from scaffold values such as `react-example` / `0.0.0` before formal handoff?
- Should the Gemini/AI Studio metadata and dependencies remain if no current application code imports them?
- Should the CI `Typecheck` step be aligned with the existing `lint` script or should a separate `typecheck` script be added?

## Known gaps and items not covered in this cleanup

- Functional fixes and refactors were intentionally not performed during this pass.
- Hardcoded credentials and permissive Azure network defaults were documented but not changed.
- Large components such as the customer dashboard and Kanban board were not split, because that would be a behavior-risking refactor.
- Dependency pruning, package renaming, lockfile updates, formatter/linter additions, and AI Studio scaffold cleanup were not performed.
- The Supabase-to-Azure migration is planned but not implemented.
- No formal secret-scanning tool was added to CI during this pass.

## Cleanup changelog

- `azure-setup.sh` — Added a file header documenting purpose, Azure dependencies, and security-sensitive defaults.
- `src/App.tsx` — Added a file header and JSDoc for the top-level app component.
- `src/components/CustomerDashboard.tsx` — Added a file header and JSDoc for the customer dashboard component.
- `src/components/KanbanBoard.tsx` — Added a file header and JSDoc for the Kanban board component.
- `src/components/SecureDocumentUploader.tsx` — Added a file header and JSDoc for the secure document uploader component.
- `src/hooks/useAccounts.ts` — Added a file header and JSDoc for the Supabase-backed account hook.
- `src/index.css` — Added a file header describing the Tailwind entry point.
- `src/lib/supabaseClient.ts` — Added a file header and JSDoc for exported Supabase client constants and helper functions.
- `src/main.tsx` — Added a file header documenting the React/Vite mount point.
- `src/mockData.ts` — Added a file header documenting demo/fallback data.
- `src/onboardingRules.ts` — Added a file header and JSDoc for checklist/stage rule helpers.
- `src/onboardingWorkflow.ts` — Added a file header and JSDoc for blank-account and document-checklist reconciliation helpers.
- `src/types.ts` — Added a file header documenting shared domain types.
- `src/vite-env.d.ts` — Added a header after the Vite triple-slash reference to preserve TypeScript behavior.
- `supabase/migrations/20260804000000_initial_schema.sql` — Added a migration header documenting schema purpose and dependencies.
- `supabase/migrations/20260805000000_onboarding_workflow_fixes.sql` — Added a migration header documenting checklist/document workflow changes.
- `supabase/migrations/20260805120000_onboarding_validation_fixes.sql` — Added a migration header documenting validation and policy-hardening purpose.
- `supabase/tests/onboarding_rls_verification.sql` — Added a header documenting local RLS verification intent.
- `test_workflow.ts` — Added a file header documenting manual smoke-test purpose and security-sensitive credential concerns.
- `tests/onboardingWorkflow.test.ts` — Added a file header and test fixture helper comment.
- `tests/supabaseClient.test.ts` — Added a file header documenting test setup assumptions.
- `vite.config.ts` — Added a file header documenting Vite/Tailwind/AI Studio HMR behavior.
