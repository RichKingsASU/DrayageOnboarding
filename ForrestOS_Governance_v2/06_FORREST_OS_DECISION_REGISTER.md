# FORREST OS DECISION REGISTER

## 1. Purpose

This is the lightweight index of major Forrest OS architecture and engineering decisions.

Use individual ADR files for decisions requiring deeper context.

Status values:

```text
PROPOSED
ACCEPTED
SUPERSEDED
DEFERRED
REJECTED
```

---

## 2. Current Decisions

| ID | Decision | Status | Notes |
|---|---|---|---|
| ADR-001 | Modular monolith first | ACCEPTED | No microservices until justified |
| ADR-002 | Python 3.13.x backend baseline | ACCEPTED | Exact version pinned per repo |
| ADR-003 | Django 5.x backend framework | ACCEPTED | Exact supported release pinned per repo |
| ADR-004 | PostgreSQL primary application DB | ACCEPTED | Plain Postgres unless exception approved |
| ADR-005 | React retained as frontend | ACCEPTED | Shared Forrest UI direction |
| ADR-006 | Bootstrap 5.3.x UI baseline | ACCEPTED | Bootstrap 4 default superseded |
| ADR-007 | Vite removed from Forrest OS target | ACCEPTED | Legacy projects may retain during migration only |
| ADR-008 | Webpack 5 + Babel approved React build | ACCEPTED | Standard replacement for Vite |
| ADR-009 | Django Session Authentication | ACCEPTED | Future SSO may extend login |
| ADR-010 | Backend-enforced RBAC | ACCEPTED | Frontend checks are UX only |
| ADR-011 | DW2/MercuryGate SQL access read-only | ACCEPTED | Enforced at DB credential level |
| ADR-012 | Dev Box self-contained | ACCEPTED | Production topology remains separate/TBD |
| ADR-013 | Canonical identity distinct from authoritative source | ACCEPTED | Applies to Customer, Carrier, etc. |
| ADR-014 | External systems use integration adapters | ACCEPTED | Shared contract required |
| ADR-015 | Product repos remain separate during audit/refactor | ACCEPTED | Consolidation decision later |
| ADR-016 | Codex performs primary repo refactor work | ACCEPTED | Antigravity reserved mainly for local integration |
| ADR-017 | Product-specific business rules remain product-owned | ACCEPTED | Shared mechanisms only move into Forrest OS |
| ADR-018 | Production hosting architecture | DEFERRED | Decide after integrated validation |
| ADR-019 | Canonical Customer identity owner | PROPOSED | Requires cross-product audit |
| ADR-020 | Canonical Carrier identity owner | PROPOSED | Requires Risk/Transportation audit |
| ADR-021 | Final monorepo vs multi-repo | DEFERRED | Decide after all four audits |
| ADR-022 | Shared React shell implementation | DEFERRED | Build after product audits |

---

## 3. ADR File Standard

Path:

```text
ADR/
```

Naming:

```text
ADR-001-modular-monolith-first.md
```

Template:

```text
# Decision

## Status

## Context

## Decision

## Alternatives

## Consequences

## Security / Operational Impact

## Date
```

---

## 4. Superseded Decisions

Track old standards explicitly.

| Old Decision | Current Replacement |
|---|---|
| Bootstrap 4.3.1 as default | Bootstrap 5.3.x |
| Vite as React build | Webpack 5 + Babel |
| Supabase as target runtime backend | Django + PostgreSQL |

Do not delete historical rationale if it remains useful, but do not let it override the accepted standard.

---

## 5. Decision Rules

Create/update a decision when a choice:

- affects multiple products
- changes the platform standard
- changes security boundaries
- changes authoritative data ownership
- changes deployment architecture
- introduces a new shared service
- creates a significant exception

Do not create ADRs for routine implementation choices.

---

## 6. Immediate Decision Queue

Required after remaining audits:

```text
[ ] Customer canonical identity
[ ] Carrier canonical identity
[ ] Product 3 shared dependencies
[ ] Product 4 shared dependencies
[ ] shared document service final shape
[ ] notification architecture
[ ] repository consolidation
[ ] production deployment topology
```
