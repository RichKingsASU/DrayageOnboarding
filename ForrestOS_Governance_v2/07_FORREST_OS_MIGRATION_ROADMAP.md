# FORREST OS MIGRATION ROADMAP

## 1. Objective

Move existing Forrest products into a governed, shared platform without losing product-specific business behavior or creating premature architectural complexity.

---

## 2. Program Flow

```text
FOUNDATION
   ↓
PRODUCT AUDITS
   ↓
PRODUCT REFACTORING
   ↓
SHARED CORE DEFINITION
   ↓
FORREST OS INTEGRATION
   ↓
CROSS-PRODUCT VALIDATION
   ↓
UAT
   ↓
PRODUCTION ARCHITECTURE
   ↓
DEPLOYMENT
```

---

## 3. Wave 0 — Governance Foundation

Status:

```text
IN PROGRESS / NEAR COMPLETE
```

Deliverables:

```text
00_PROJECT.md
01_CHARTER.md
02_FORREST_PLATFORM_STANDARD.md
03_FORREST_OS_ARCHITECTURE.md
04_PRODUCT_INTEGRATION_REGISTER.md
05_KNOWLEDGE_MIGRATION_REGISTER.md
06_FORREST_OS_DECISION_REGISTER.md
07_FORREST_OS_MIGRATION_ROADMAP.md
```

Exit:

```text
Codex/Antigravity have one authoritative platform standard.
```

---

## 4. Wave 1 — Drayage Onboarding

Current state:

```text
furthest along
```

Work remaining:

```text
manual functional/UAT testing
full-stack hardening
remaining Supabase/Vite cleanup if any
Webpack build validation
formal Forrest OS handoff
integration readiness review
```

Exit criteria:

```text
[ ] target stack stable
[ ] critical user workflow passes
[ ] shared dependencies documented
[ ] authoritative/shared data identified
[ ] handoff complete
[ ] integration-ready decision made
```

---

## 5. Wave 2 — Risk & Safety Audit

Use Codex first.

Read-only audit:

```text
repo → architecture → dependencies → business modules → integrations → data ownership → migration work packages
```

Deliver:

```text
RISK_SAFETY_FORREST_OS_HANDOFF.md
```

Then update:

```text
04_PRODUCT_INTEGRATION_REGISTER.md
06_FORREST_OS_DECISION_REGISTER.md
```

Do not refactor before audit approval.

---

## 6. Wave 3 — Product 3 Audit

Identify repository/product.

Run same standard Codex audit.

Deliver handoff.

Update registers.

---

## 7. Wave 4 — Product 4 Audit

Identify repository/product.

Run same standard Codex audit.

Deliver handoff.

Update registers.

---

## 8. Wave 5 — Cross-Product Comparison

After all four audits:

Compare:

```text
auth needs
user/team identity
customer identity
carrier identity
documents
audit
notifications
DW2/MG
other adapters
navigation/UI
health
shared data
sensitive boundaries
```

Decide what truly belongs in Forrest OS.

Do not build shared services solely from assumptions.

---

## 9. Wave 6 — Refactor Remaining Products

Use small Codex work packages.

Pattern:

```text
WP1 Foundation
WP2 Models/PostgreSQL
WP3 Auth/RBAC
WP4 Migration tooling
WP5 APIs
WP6 React/Django integration
WP7 Documents/adapters
WP8 Legacy dependency removal
WP9 Tests
WP10 UAT
```

Target stack:

```text
React
Webpack 5
Babel
Bootstrap 5.3.x
Django
Python 3.13.x
PostgreSQL
Django Session Auth
Forrest RBAC
Shared adapters
```

---

## 10. Wave 7 — Shared Forrest OS Core

Build only after product audits confirm needs.

Likely:

```text
Authentication/RBAC
User identity
Navigation shell
Document framework
Audit
Health
Notifications
Integration adapter framework
```

Do not build speculative generic services.

---

## 11. Wave 8 — Module Integration

Expose modules through Forrest OS.

Target:

```text
One login
One navigation shell
Permission-aware modules
Shared identities
Shared platform services
Independent domain ownership
```

---

## 12. Wave 9 — Cross-Product Validation

Validate:

- auth
- RBAC
- navigation
- shared identities
- module isolation
- documents
- integrations
- adapter failures
- audit
- health
- performance
- sensitive-data boundaries

---

## 13. Wave 10 — UAT

Business owners validate their modules.

Defects stay product-owned unless they expose a platform issue.

Platform defects update Forrest OS.

---

## 14. Wave 11 — Production Architecture

Only after integrated local validation.

Decide:

```text
hosting
production PostgreSQL
storage
SSO
HTTPS
logging/monitoring
CI/CD
backup/recovery
network architecture
deployment topology
```

Preserve application contracts from Dev Box.

---

## 15. Wave 12 — Deployment

Use staged release gates.

```text
development
→ integration
→ UAT
→ production readiness
→ controlled production release
```

---

## 16. Codex / Antigravity Work Split

### Codex

Use for:

```text
audits
refactors
models
APIs
tests
migration scripts
frontend rewiring
Webpack conversion
PRs
CI
```

### Antigravity

Use for:

```text
local environment
MCP
services
database validation
running migrations
browser/Selenium validation
Dev Box integration
```

### ChatGPT

Use for:

```text
requirements
architecture
work packages
acceptance criteria
audit review
UAT synthesis
```

---

## 17. Token / Cost Efficiency Rule

Do not use Antigravity for long-form planning already captured in Forrest OS documentation.

Provide Antigravity short execution instructions referencing governing files.

Example:

```text
Use Forrest OS standard.
Pull approved Codex branch.
Run migrations.
Start app.
Run health.
Run Selenium.
Return PASS/FAIL + blockers only.
```

---

## 18. Program Gates

### Gate A — Audit Complete

No refactor before current-state architecture is documented.

### Gate B — Target Mapping Approved

No mass rewrite before source→target mapping exists.

### Gate C — Product Stable

No Forrest OS integration before product workflows pass independently.

### Gate D — Shared Boundary Approved

No shared service extraction without at least two confirmed consumers or strong platform rationale.

### Gate E — Production Architecture

No production topology lock before integrated platform validation.

---

## 19. Current Immediate Sequence

```text
1. Add/approve governance docs 00–07
2. Finish Drayage Onboarding UAT/hardening
3. Create Onboarding handoff
4. Codex audit Risk & Safety
5. Create Risk & Safety handoff
6. Identify/audit Product 3
7. Identify/audit Product 4
8. Compare all four
9. Lock shared boundaries
10. Build Forrest OS core
```

---

## 20. Program Success Definition

Forrest OS succeeds when Forrest products:

- use the approved stack
- share common platform mechanisms
- preserve domain ownership
- reuse integration adapters
- reference canonical identities
- respect authoritative data sources
- are testable locally
- can be integrated without tight coupling
- can later move to production infrastructure without rewriting business logic
