# DrayageOnboarding DevOps Handoff

## Current remediation status

| Finding | Status | Notes |
| --- | --- | --- |
| Hardcoded Supabase service-role-style key in `test_workflow.ts` | Resolved / Requires external rotation | The literal key was removed from source. Because it was previously committed, a Supabase project administrator must rotate the remote service-role key and verify consumers have been updated. |
| Hardcoded Azure database password | Resolved | `azure-setup.sh` now requires `DB_ADMIN_PASSWORD` from the environment and does not echo it. |
| Open Azure PostgreSQL public access | Resolved / Requires environment-specific DevOps input | `azure-setup.sh` requires `POSTGRES_ALLOWED_START_IP` and `POSTGRES_ALLOWED_END_IP`; production should prefer private endpoint/VNet integration once Azure architecture is approved. |
| Demo-specific checklist state inside generic rules | Resolved | Generic rules are in `src/onboardingRules.ts`; demo overrides and fixed seed dates live in `src/mockData.ts`. |
| Duplicate document checklist mapping | Resolved | `src/documentChecklistMapping.ts` is the canonical domain mapping imported by workflow and Supabase helpers. |
| Scaffold metadata/dependencies | Resolved | Package metadata was normalized, unused Gemini/Express dependencies were removed, Gemini capability metadata was removed, and `assets/.aistudio/` was deleted. |
| CI typecheck tolerated missing script | Resolved | CI now runs `npm run typecheck` as a required check on Node 22. |
| Formal secret scan | Resolved for repository pattern scan / Deferred for enterprise scanning | CI includes safe static secret-pattern checks. Enterprise scanning such as GitHub Advanced Security or gitleaks in centrally managed CI remains a platform decision. |

## Overview

DrayageOnboarding is a React/Vite/TypeScript customer onboarding CRM for drayage brokerages. It manages pipeline stages, account/contact/accessorial SOP details, compliance checklist progress, document vault uploads, and Supabase migrations/tests for database, storage, realtime, and RLS behavior.

## Setup

```bash
npm ci
cp .env.example .env
npm run dev
```

Frontend-safe variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Privileged manual smoke-test variables for `test_workflow.ts` only:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. It must never be committed, never use a `VITE_` prefix, and never be exposed to browser bundles.

## Validation commands

```bash
git diff --check
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm ls
bash -n azure-setup.sh
supabase start
supabase db reset
supabase test db
```

## Azure provisioning

`azure-setup.sh` now requires:

```env
DB_ADMIN_PASSWORD=
POSTGRES_ALLOWED_START_IP=
POSTGRES_ALLOWED_END_IP=
```

The script uses caller-supplied PostgreSQL firewall start/end IPs instead of unrestricted public access. It does not print database passwords, storage keys, PubSub connection strings, or database connection strings. DevOps must supply approved IP ranges or replace this with private endpoint/VNet integration for production.

## Remaining deployment blockers

- Rotate the previously exposed Supabase service-role key externally and audit project logs for misuse.
- Supply production frontend anon credentials and privileged service-role credentials through approved secret stores.
- Decide Azure subscription, resource naming, regions, network model, and private endpoint/VNet architecture.
- Configure production Supabase auth settings, redirect URLs, backups, monitoring, and incident response ownership.
- Run complete validation in a Node 22/Docker/Supabase/Azure-capable CI runner before release.

## Cleanup changelog

- Removed committed Supabase service-role literal from `test_workflow.ts`.
- Hardened `azure-setup.sh` with strict shell mode, required secret/network variables, quoting, and professional logging.
- Moved demo checklist seed metadata to `src/mockData.ts` and kept generic rules in `src/onboardingRules.ts`.
- Added canonical document/checklist mapping in `src/documentChecklistMapping.ts`.
- Normalized package metadata and removed unused Gemini/Express dependencies and AI Studio artifacts.
- Updated CI to require typecheck, lint, unit tests, build, diff checks, Supabase validation, and static secret-pattern scanning.
