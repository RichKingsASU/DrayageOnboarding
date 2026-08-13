# FORREST PLATFORM STANDARD

## 1. Purpose

This document defines the default engineering standard for Forrest Logistics internal software products built on or integrated into Forrest OS.

Unless a documented architectural exception is approved, all new Forrest applications and all refactored legacy applications should conform to this standard.

---

## 2. Governing Principle

Forrest OS provides the shared platform standards and reusable capabilities.

Business products remain responsible for their own domain-specific rules, workflows, screens, metrics, and operational logic.

The platform standard exists to prevent each product from independently choosing:

- authentication
- authorization
- frontend tooling
- backend framework
- databases
- file storage
- logging
- integration patterns
- testing strategy
- developer environment
- AI-assisted engineering workflow

---

## 3. Approved Technology Stack

### Backend

```text
Python 3.13.x
Django 5.x
Django ORM
Django Session Authentication
Django-enforced RBAC
REST-style Django APIs where frontend/API separation is required
```

### Frontend

```text
React
Bootstrap 5.3.x
JavaScript by default
TypeScript permitted for existing applications or justified new modules
Webpack 5
Babel
```

### Primary Application Database

```text
PostgreSQL
```

Requirements:

- plain PostgreSQL unless an extension is formally approved
- Django migrations control application schema changes
- application writes occur only against application-owned databases
- exact dependency versions are pinned per repository

### Enterprise / Warehouse Data

```text
Microsoft SQL Server / DW2 / MercuryGate
READ ONLY
```

Preferred access:

```text
ODBC Driver 18 for SQL Server
pyodbc
shared Forrest integration adapters
```

### File Storage

```text
Django-managed storage abstraction
```

Development uses local filesystem storage.

Production storage remains an infrastructure decision and must preserve the same application contract.

### Browser Automation

```text
Python
Selenium
Chrome
Edge
```

### Source Control

```text
Git
GitHub
```

### Developer AI

```text
ChatGPT
Codex
Antigravity
MCP
```

---

## 4. Superseded Frontend Standards

For Forrest OS applications, the following older guidance is superseded unless a documented legacy exception exists:

```text
Bootstrap 4.3.1 as the default Forrest UI standard
Vite as the standard React build system
Supabase as the target backend/runtime platform
```

The Forrest OS target is:

```text
React
Bootstrap 5.3.x
Webpack 5 + Babel
Django
PostgreSQL
```

Do not globally load Bootstrap 4 and Bootstrap 5 on the same production page.

---

## 5. React Build Standard

The approved Forrest OS React build toolchain is:

```text
React
Webpack 5
Babel
Node.js development/build tooling
```

Webpack produces static JavaScript, CSS, and asset bundles.

Target architecture:

```text
React source
   ↓
Webpack + Babel
   ↓
Static application assets
   ↓
Approved Forrest web/deployment layer
```

Django provides:

- backend
- API
- authentication
- authorization
- business logic

React remains the user-facing application layer.

### Not Approved as Default

Do not independently introduce:

```text
Vite
Create React App
Next.js
another frontend framework/bundler
```

without an approved ADR.

---

## 6. Version Policy

Platform documentation defines approved version families.

Repositories pin exact versions.

### Platform Baseline

```text
Python       3.13.x
Django       approved 5.x release
React        approved current Forrest release
Webpack      5.x
Bootstrap    5.3.x
PostgreSQL   approved supported local/production release
Selenium     approved current compatible 4.x release
```

### Repository Requirement

Each repository must pin exact application dependencies through the appropriate package/lock files.

Examples:

```text
requirements.txt / pyproject.toml
package.json
package-lock.json
```

### Upgrade Policy

Patch/minor upgrades should be:

1. tested locally;
2. validated against the application test suite;
3. documented in the PR;
4. rolled back if compatibility fails.

Major framework changes require architecture review.

---

## 7. Development vs Production Architecture

### Dev Box

Purpose:

```text
fully self-contained Forrest development/demonstration environment
```

Target:

```text
Windows workstation
Local Python/Django
Local PostgreSQL
Local React build tooling
Local Django file storage
Chrome/Edge
Selenium
Git
Antigravity/MCP
Optional read-only enterprise connectivity
Local/sanitized DW2 mimic or snapshots where available
```

Requirements:

- product can be demonstrated without production cloud dependency
- developers can test safely
- local data is clearly separated from production
- enterprise access remains read-only

### Production

Production architecture is intentionally not locked to the Dev Box topology.

Production must preserve:

- Django application contracts
- React application contracts
- PostgreSQL-compatible application persistence
- backend authorization
- storage abstraction
- integration adapter interfaces
- observability/security requirements

Production infrastructure will be selected after integrated Forrest OS validation.

---

## 8. Standard Repository Expectations

Each Forrest repository should contain or reference:

```text
AGENTS.md
README.md
.env.example
.gitignore
documentation/
scripts/
tests/
```

Where appropriate:

```text
backend/
frontend/
automation/
```

Each repository should document:

- purpose
- ownership
- startup
- architecture
- dependencies
- environment variables
- data ownership
- external integrations
- security boundaries
- tests
- known limitations

---

## 9. Environment Variable and Secret Standard

Never commit real secrets.

Repositories should provide:

```text
.env.example
```

with safe placeholders.

Protect at minimum:

```text
.env
.env.*
!.env.example
*.pem
*.key
credentials.json
secrets.json
```

Do not place real:

- passwords
- PATs
- service-role keys
- API keys
- bearer tokens
- private keys

in source or documentation.

---

## 10. Authentication Standard

Default:

```text
Django Session Authentication
```

Requirements:

- Django owns session identity
- backend `/me/` or equivalent is authoritative
- secure password hashing
- CSRF protection
- inactive-user enforcement
- secure-cookie support for production
- frontend does not create a parallel identity model

Future enterprise SSO may replace or extend the login entry point while retaining Forrest OS authorization.

---

## 11. Authorization Standard

Authorization must be enforced by Django/backend services.

Frontend role checks improve UX but are not security controls.

Forrest OS should provide shared mechanisms for:

```text
User
Role
Permission
Team / Department when required
```

Product modules define product permissions.

Example:

```text
Onboarding:
SALES
PRICING

Risk & Safety:
SAFETY
RISK_MANAGER
```

---

## 12. Ownership vs Authorization

These must remain distinct:

```text
Authorization = what a user may access
Ownership = who is responsible
```

Ownership fields may drive:

- filters
- assignments
- queues
- reporting

They must not silently become visibility restrictions.

---

## 13. API Standard

Preferred API form:

```text
/api/v1/<resource>/
```

Requirements:

- explicit payload contracts
- explicit serializer fields
- backend authorization
- validation
- predictable errors
- documented nullability
- consistent date/time formats
- sensitive field filtering
- automated tests

Do not expose database models blindly.

---

## 14. Canonical Identity vs Authoritative Data

Forrest OS may own a canonical identifier without owning the authoritative business data behind that entity.

Example:

```text
Carrier ID                  → Forrest OS canonical identity
DOT/MC authority facts      → FMCSA / designated authoritative source
Operational load history    → MercuryGate / DW2
Carrier risk profile        → Risk & Safety
Insurance evaluation        → Risk & Safety
```

Likewise:

```text
Customer ID                 → Forrest OS/shared identity
Customer onboarding state   → Drayage Onboarding
Operational load history    → MercuryGate/DW2
Sensitive rate information  → designated rate/pricing system
```

Canonical identity must not be confused with master-data ownership.

---

## 15. Shared Entity Candidates

Forrest OS may progressively standardize identifiers for:

```text
User
Customer
Carrier
Vendor
Location
Load
Document
```

Ownership of authoritative attributes must be explicitly documented.

---

## 16. Database Ownership Standard

Each table/entity must have a clear owning module.

Applications should not directly mutate another module's tables.

Preferred:

```text
Module A
  ↓
Shared service / domain contract
  ↓
Owning module
```

Avoid:

```text
Module A directly updates Module B tables
```

---

## 17. Integration Adapter Standard

External system access must use explicit adapters.

Preferred structure:

```text
integrations/
├── dw2/
├── mercurygate/
├── fmcsa/
├── teams/
├── email/
├── terminals/
├── chassis/
└── rail/
```

Each adapter must define:

```text
Owner
Source system
Authentication method
Access level
Data contract
Timeouts
Retry policy
Rate limits
Logging
Health status
Error handling
Mock/test strategy
```

Adapters must separate external-system mechanics from domain logic.

---

## 18. DW2 / MercuryGate Standard

Real enterprise DW2/MercuryGate SQL access is:

```text
READ ONLY
```

Primary enforcement must be database permissions.

Application SQL validation may remain defense-in-depth.

Real DW2 application credentials must not have:

```text
INSERT
UPDATE
DELETE
MERGE
ALTER
DROP
CREATE
TRUNCATE
```

except narrowly approved read-only stored-procedure execution where necessary.

---

## 19. Document Standard

Shared document metadata should support as applicable:

```text
document_id
document_type
related_entity_type
related_entity_id
file_name
content_type
uploaded_by
uploaded_at
status
version
```

Requirements:

- backend authorization
- controlled downloads
- auditability
- replaceable storage backend
- product-specific retention/approval rules

---

## 20. Audit Standard

Important domain models should support:

```text
created_at
created_by
updated_at
updated_by
```

Important changes may generate:

```text
AuditEvent
```

with:

```text
actor
entity_type
entity_id
action
previous_value
new_value
metadata
created_at
```

Never log secrets or unnecessary sensitive content.

---

## 21. Logging Standard

Applications should log:

- application errors
- auth failures
- permission failures
- database failures
- integration failures
- migration results
- automation failures

Logs must not expose credentials or tokens.

---

## 22. Health Standard

Every module/application should contribute health information for:

```text
application
database
migration state
integration status
storage where relevant
environment/version
```

Use:

```text
PASS
WARN
FAIL
```

where useful.

---

## 23. UI / UX Standard

Forrest applications should share:

- common shell
- left navigation
- header/user controls
- Bootstrap 5.3.x
- consistent tables/forms
- loading states
- empty states
- errors
- modals
- responsive behavior
- accessibility-conscious interaction

Domain-specific UI may vary without creating a separate design system.

---

## 24. Demo / Developer Content Standard

Developer/demo controls must not appear in normal production-facing UI.

Examples:

```text
Reset Demo
Bypass Login
Demo User Switcher
Workflow Guide
Placeholder Executive Metrics
Debug Notes
```

Development-only features must be environment-gated.

---

## 25. Testing Standard

### Backend

- model tests
- auth tests
- RBAC tests
- API tests
- migration tests
- integration tests

### Frontend

- critical state/component tests
- API contract tests where practical

### End-to-End

- Selenium for critical workflows
- Chrome validation
- Edge validation

### Environment

- Forrest Dev Box health
- app-specific health

A successful build alone is not completion.

---

## 26. Migration Standard

Use:

```text
DISCOVER
→ INVENTORY
→ MAP
→ BUILD
→ MIGRATE
→ RECONCILE
→ TEST
→ UAT
→ CUTOVER
```

Migration tooling should be:

- repeatable
- logged
- idempotent where practical
- count-reconciled
- relationship-aware
- non-destructive to source

---

## 27. Git / Change Management

Preferred:

```text
Work Package
→ Feature Branch
→ Implementation
→ Tests
→ Review
→ PR
→ Local Integration Validation
→ UAT
```

Avoid:

- force pushing shared history
- secrets in commits
- giant unreviewable rewrites
- mixing unrelated migrations

---

## 28. Codex Standard

Use Codex primarily for:

- repository audits
- code refactors
- framework migrations
- API/model work
- tests
- issue-sized implementation
- PR preparation
- CI fixes

Prefer small work packages.

---

## 29. Antigravity Standard

Use Antigravity primarily for:

- Dev Box configuration
- local services
- MCP
- local DB validation
- browser testing
- Selenium
- local migrations
- full-stack startup/validation

Keep prompts concise once context exists.

---

## 30. Architectural Exception Process

Any deviation should document:

```text
Requirement
Reason
Proposed exception
Security impact
Operational impact
Migration impact
Approval
Review date
```

Legacy code alone is not a permanent exception.

---

## 31. Definition of Done

A product is Forrest OS aligned when:

```text
[ ] approved target stack implemented
[ ] exact dependencies pinned
[ ] backend authorization enforced
[ ] PostgreSQL is primary app DB
[ ] unsupported runtime dependencies removed
[ ] secret management compliant
[ ] migrations reconcile
[ ] automated tests pass
[ ] browser workflows pass
[ ] health checks pass
[ ] shared boundaries respected
[ ] integration adapters follow standard
[ ] user acceptance completed
[ ] docs are current
```

---

## 32. Guiding Principle

Build modules independently enough to remain understandable, but consistently enough to operate as one Forrest platform.
