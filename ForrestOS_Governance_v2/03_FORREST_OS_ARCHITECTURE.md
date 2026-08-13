# FORREST OS ARCHITECTURE

## 1. Objective

Forrest OS is the shared internal application platform for Forrest Logistics.

The initial architectural style is:

```text
MODULAR MONOLITH FIRST
```

This supports product consolidation without prematurely introducing distributed-system complexity.

---

## 2. Target Logical Architecture

```text
┌─────────────────────────────────────────────────────┐
│                     FORREST OS                      │
├─────────────────────────────────────────────────────┤
│ React Application Shell                            │
│ Webpack-built assets • Bootstrap • Navigation      │
├─────────────────────────────────────────────────────┤
│ Business Modules                                   │
│                                                     │
│ Onboarding │ Risk & Safety │ Product 3 │ Product 4 │
├─────────────────────────────────────────────────────┤
│ Shared Platform Services                           │
│                                                     │
│ Auth │ RBAC │ Documents │ Audit │ Health │ Notify  │
├─────────────────────────────────────────────────────┤
│ Django Application / API Layer                     │
├─────────────────────────────────────────────────────┤
│ PostgreSQL Application Data                        │
├─────────────────────────────────────────────────────┤
│ Integration Adapter Layer                          │
│                                                     │
│ DW2 │ MG │ FMCSA │ Teams │ Email │ Terminals etc.  │
└─────────────────────────────────────────────────────┘
```

---

## 3. Approved Technical Direction

```text
Frontend:
React
Webpack 5
Babel
Bootstrap 5.3.x

Backend:
Django 5.x
Python 3.13.x

Primary DB:
PostgreSQL

Auth:
Django Session Authentication
Django-enforced RBAC

Files:
Django-managed storage abstraction

External operational data:
Read-only SQL Server / DW2 / MercuryGate
```

---

## 4. Development vs Production

### Development

The Dev Box is a self-contained workstation environment.

```text
Windows
Local Django
Local PostgreSQL
Local React build
Local files
Selenium
Chrome/Edge
MCP
Optional read-only enterprise connections
```

It must support reliable demos without production infrastructure dependency.

### Production

Production topology is intentionally TBD.

Production must preserve the same:

- API contracts
- security model
- domain model
- storage abstraction
- integration adapter contracts

Managed/cloud services may replace local infrastructure later.

---

## 5. Backend Module Concept

Potential:

```text
backend/
├── config/
├── platform/
├── accounts/
├── audit/
├── documents/
├── notifications/
├── integrations/
│   ├── dw2/
│   ├── mercurygate/
│   ├── fmcsa/
│   ├── teams/
│   ├── email/
│   ├── terminals/
│   ├── chassis/
│   └── rail/
└── modules/
    ├── onboarding/
    ├── risk_safety/
    ├── product3/
    └── product4/
```

This is conceptual until all four audits are complete.

---

## 6. Frontend Concept

```text
frontend/
├── app/
├── api/
├── auth/
├── components/
├── layouts/
├── navigation/
├── shared/
└── modules/
    ├── onboarding/
    ├── risk-safety/
    ├── product3/
    └── product4/
```

Build:

```text
Webpack 5 + Babel
```

Do not add Vite back into the target architecture.

---

## 7. Platform Shell Ownership

Forrest OS should eventually own:

- session bootstrap
- global navigation
- user context
- permission-aware module discovery
- shared layout
- common components
- global error handling
- global notifications
- branding

Modules own domain workspaces.

---

## 8. Shared Platform Capabilities

Likely platform-owned:

```text
Authentication
RBAC mechanism
User identity
Navigation
Document framework
Audit framework
Notifications
Health / telemetry
Integration adapter conventions
```

Do not centralize business rules merely because two modules use similar words.

---

## 9. Canonical Identity Rule

Canonical identity does not equal authoritative data ownership.

Example:

```text
Carrier ID               → Forrest OS identity
DOT/MC facts             → FMCSA/designated authority
Operational history      → MercuryGate/DW2
Carrier risk assessment  → Risk & Safety
```

Likewise:

```text
Customer ID              → shared/canonical identity
Onboarding state         → Drayage Onboarding
Rates                    → designated pricing/rate domain
Operational history      → MercuryGate/DW2
```

---

## 10. Shared Entity Pattern

Preferred:

```text
Canonical Identity
+
Domain Profile
```

Example:

```text
Carrier
├── canonical_id
├── legal identity references
│
├── RiskSafetyProfile
├── TransportationProfile
└── other domain-specific data
```

---

## 11. Data Ownership Rule

Every authoritative field requires an owner.

Consumers should reference or request authoritative data instead of silently redefining it.

Document ownership in the Product Integration Register and ADRs where important.

---

## 12. PostgreSQL Direction

During migration, products may retain separate application databases.

After boundaries stabilize, Forrest OS may consolidate into one platform PostgreSQL database if beneficial.

Do not merge databases merely to appear integrated.

---

## 13. API Architecture

```text
React
  ↓
Django API
  ↓
Domain Service
  ↓
PostgreSQL / Integration Adapter
```

React must not directly query enterprise databases.

---

## 14. Module-to-Module Architecture

Preferred inside the modular monolith:

```text
Module A
   ↓
explicit service/domain interface
   ↓
Module B or shared entity
```

Avoid arbitrary cross-module table writes.

---

## 15. Integration Adapter Architecture

All external systems should be encapsulated.

```text
integrations/
    <system>/
```

Each adapter must specify:

```text
owner
authentication
access level
data contract
timeouts
retry
rate limits
logging
health
errors
mock/test strategy
```

Adapters own transport/system mechanics.

Business modules own domain interpretation.

---

## 16. DW2 / MercuryGate Architecture

```text
Business Module
      ↓
Shared Adapter
      ↓
Read-Only SQL Server Connection
      ↓
DW2 / MercuryGate
```

Do not duplicate direct SQL logic across modules.

---

## 17. Notification Architecture

Initial:

```text
Domain Event
   ↓
Shared Notification Service
   ↓
Teams / Email / In-App
```

Do not introduce message brokers until justified by real scale/reliability needs.

---

## 18. Authentication Flow

```text
User
 ↓
Forrest OS Login
 ↓
Django Session
 ↓
User/Role Context
 ↓
React Shell
 ↓
Permitted Modules
```

Future enterprise SSO may replace login while preserving downstream authorization.

---

## 19. Authorization Flow

```text
Request
 ↓
Authenticated User
 ↓
Platform Permission
 ↓
Module Permission
 ↓
Domain Rule
 ↓
Allow / Deny
```

Frontend visibility is never the final security check.

---

## 20. Document Architecture

```text
Module
 ↓
Shared Document Service
 ↓
Metadata in PostgreSQL
 ↓
Storage Backend
```

Development:

```text
Local filesystem
```

Production:

```text
Approved storage provider/TBD
```

---

## 21. Audit Architecture

Central framework, domain-specific events.

```text
Actor
Entity
Action
Time
Context
Before/After as appropriate
```

Avoid excessive sensitive data capture.

---

## 22. Health Architecture

Platform health should aggregate:

```text
Core
Database
Modules
Integrations
Storage
Automation
```

Use:

```text
PASS
WARN
FAIL
```

---

## 23. Repository Strategy During Migration

Keep:

```text
ForrestOS
DrayageOnboarding
RiskSafety
Product3
Product4
```

separate until audits/refactors clarify module boundaries.

---

## 24. Eventual Repository Options

### Preferred Candidate

A modular monorepo may ultimately simplify:

- shared tooling
- releases
- cross-module refactors
- local startup

But do not choose it before all product audits.

### Multi-Repo Alternative

Retain separate repos if independent deployment/security ownership requires it.

---

## 25. Product Migration Path

```text
Existing Product
      ↓
Audit
      ↓
Target Mapping
      ↓
Refactor
      ↓
Validate
      ↓
Formal Handoff
      ↓
Integrate Shared Services
      ↓
Expose in Forrest OS
```

---

## 26. Integration Readiness Gate

A product is integration-ready only when:

```text
[ ] target stack implemented
[ ] auth conforms
[ ] backend RBAC exists
[ ] PostgreSQL migration reconciled
[ ] critical workflows pass
[ ] shared entities identified
[ ] authoritative data ownership identified
[ ] integration adapters documented
[ ] sensitive boundaries documented
[ ] unsupported runtime dependencies removed
```

---

## 27. Security Boundaries

Authorization must remain independently enforceable for sensitive domains such as:

- customer rates
- claims
- insurance
- safety/compliance
- administrative controls

Access to one module must not imply access to all platform data.

---

## 28. Production Direction

Production should eventually support:

```text
React static bundles
Django
PostgreSQL
Approved storage
HTTPS
Secure sessions
Central logging/monitoring
Enterprise identity integration
Read-only enterprise adapters
```

Exact hosting is intentionally deferred.

---

## 29. Architecture Decisions

Important decisions belong in:

```text
06_FORREST_OS_DECISION_REGISTER.md
ADR/
```

---

## 30. Core Architecture Principles

1. Modular monolith first.
2. React remains.
3. Webpack 5 + Babel is the standard build.
4. Django owns backend/auth/business logic.
5. PostgreSQL owns application persistence.
6. DW2 remains read-only.
7. Canonical identity is distinct from authoritative data.
8. External systems use adapters.
9. Shared mechanisms belong in Forrest OS.
10. Product rules stay in products.
11. Integrate after understanding.
12. Production topology comes later.
