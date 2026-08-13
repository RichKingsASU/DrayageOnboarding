# PRODUCT INTEGRATION REGISTER

## 1. Purpose

Tracks all products being standardized and integrated into Forrest OS.

This register is the cross-product source of truth for:

- repository
- current technology
- target technology
- migration status
- domain ownership
- shared dependencies
- external integrations
- data ownership
- security boundaries
- readiness

---

## 2. Status Definitions

```text
NOT STARTED
DISCOVERY
MAPPED
REFACTORING
VALIDATING
INTEGRATION READY
INTEGRATED
```

---

## 3. Portfolio

| Product | Repository | Current Stack | Target Stack | Migration | Integration |
|---|---|---|---|---|---|
| Drayage Onboarding | `RichKingsASU/DrayageOnboarding` + V2 workspace | React 19 / Vite / Supabase legacy; V2 Django/PostgreSQL | React / Webpack 5 / Babel / Bootstrap 5.3 / Django / PostgreSQL | REFACTORING / VALIDATING | Not integrated |
| Risk & Safety | `RichKingsASU/RiskSafety` | Audit required | Forrest Standard | DISCOVERY REQUIRED | Not integrated |
| Product 3 | TBD | TBD | Forrest Standard | NOT STARTED | Not integrated |
| Product 4 | TBD | TBD | Forrest Standard | NOT STARTED | Not integrated |

---

## 4. Drayage Onboarding

### Purpose

Customer onboarding governance and documentation.

Not a CRM.

### Known Product-Owned Capabilities

- onboarding board
- customer onboarding state
- onboarding requirements
- accessorial SOP workflow
- onboarding documents
- ownership/assignment
- completion controls

### Current Migration State

Completed/substantially completed:

- legacy audit
- Supabase inventory
- V1→V2 map
- Django backend
- custom user/RBAC
- session auth
- PostgreSQL
- migration tooling
- backend tests
- frontend auth integration
- demo cleanup
- smoke testing

Current focus:

```text
manual functional testing / full-stack hardening
```

### Shared Dependencies

- auth
- RBAC
- user identity
- documents
- audit
- navigation
- design system
- health
- future Teams/email
- DW2 adapter where required

### Sensitive Boundaries

Customer rate data remains independently authorized.

### Integration Readiness

Not yet.

Complete UAT/hardening first.

---

## 5. Risk & Safety

### Repository

```text
RichKingsASU/RiskSafety
```

### Purpose

Known scope includes:

- carrier risk
- compliance
- FMCSA / SAFER / SMS
- inspections
- insurance
- claims
- authority monitoring
- risk thresholds

Validate through audit.

### Target

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
```

### Likely Shared Dependencies

- user/auth
- carrier canonical identity
- documents
- audit
- notifications
- DW2
- common shell
- health
- FMCSA adapter

### Security

Risk/claims/insurance data may require restrictive permissions.

### Next Action

Codex read-only audit against Forrest Platform Standard.

---

## 6. Product 3

```text
Name: TBD
Repo: TBD
Purpose: TBD
Current stack: TBD
Target: Forrest Standard
Shared dependencies: TBD
Authoritative data: TBD
External integrations: TBD
Security: TBD
```

Do not populate from memory.

Audit first.

---

## 7. Product 4

```text
Name: TBD
Repo: TBD
Purpose: TBD
Current stack: TBD
Target: Forrest Standard
Shared dependencies: TBD
Authoritative data: TBD
External integrations: TBD
Security: TBD
```

Do not populate from memory.

Audit first.

---

## 8. Shared Capability Register

| Capability | Platform-Owned? | Status |
|---|---:|---|
| Authentication | Yes | Pattern proven |
| RBAC mechanism | Yes | Needs normalization |
| User identity | Yes | Needs canonical model |
| Shared React shell | Yes | Not built |
| React build standard | Yes | Webpack 5 + Babel |
| Bootstrap design system | Yes | Standard defined |
| Documents | Yes | Needs extraction |
| Audit | Yes | Needs extraction |
| Health | Yes | Pattern proven |
| DW2/MG adapter | Yes | Dev pattern exists |
| Teams notifications | Yes | Planned |
| Email notifications | Yes | Planned |
| Customer canonical identity | Likely | Ownership decision needed |
| Carrier canonical identity | Likely | Ownership decision needed |

---

## 9. Entity / Authoritative Source Register

| Entity / Fact | Canonical Identity Owner | Authoritative Data Owner | Consumers | Status |
|---|---|---|---|---|
| User | Forrest OS | Forrest identity system | All | Recommended |
| Customer ID | Forrest OS/shared | TBD | Multiple | Decision needed |
| Customer onboarding state | Onboarding identity ref | Drayage Onboarding | Onboarding | Clear |
| Carrier ID | Forrest OS/shared | TBD | Multiple | Decision needed |
| DOT/MC facts | Carrier identity ref | FMCSA/designated source | Risk/Transport | Recommended |
| Carrier risk profile | Carrier identity ref | Risk & Safety | Permitted modules | Clear |
| Load/shipment history | Shared reference | MercuryGate/DW2 | Multiple | Recommended |
| Document metadata | Forrest OS framework | owning module + shared service | Multiple | Recommended |
| Customer rates | Customer identity ref | rate/pricing domain TBD | Restricted | Decision needed |

---

## 10. Integration Register

| Adapter | Source | Access | Shared? | Status |
|---|---|---|---:|---|
| DW2 | SQL Server | Read-only | Yes | Pattern exists |
| MercuryGate | Enterprise system | Read-only initially | Yes | Define adapter |
| FMCSA | External | Read/query | Yes | Audit required |
| Teams | Microsoft | Notify/HITL | Yes | Planned |
| Email | Forrest enterprise | Notify/workflow | Yes | Planned |
| Terminals | External portals/APIs | Varies | Likely | Future |
| Chassis providers | External | Varies | Likely | Future |
| Rail | External | Varies | Likely | Future |
| Supabase | Legacy | Migration source | No | Remove from target runtime |

---

## 11. Adapter Contract Required Fields

Every integration must document:

```text
owner
source
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

---

## 12. Product Integration Readiness Checklist

```text
[ ] repository audited
[ ] handoff created
[ ] target stack mapped
[ ] domain ownership defined
[ ] canonical identities identified
[ ] authoritative sources identified
[ ] shared dependencies identified
[ ] integration adapters identified
[ ] auth/RBAC requirements documented
[ ] security boundaries documented
[ ] migration strategy defined
[ ] health/tests exist
[ ] unsupported runtime dependencies identified
```

---

## 13. Standard Codex Audit

```text
Audit this repository against 02_FORREST_PLATFORM_STANDARD.md.

Do not modify code.

Return:
- current architecture
- dependencies
- frontend
- backend
- database/storage
- auth/RBAC
- domain modules
- workflows
- integrations
- authoritative data sources
- shared-platform candidates
- security boundaries
- technical debt
- tests
- target mapping
- migration work packages
- blockers
```

---

## 14. Migration Work Packages

Preferred:

```text
WP1 Foundation
WP2 Database/models
WP3 Auth/RBAC
WP4 Migration tooling
WP5 APIs/services
WP6 Frontend integration
WP7 Documents/integrations
WP8 Legacy removal
WP9 Regression tests
WP10 UAT
WP11 Forrest OS integration
```

---

## 15. Current Priority

```text
1. Finish Drayage Onboarding functional testing
2. Audit Risk & Safety
3. Audit Product 3
4. Audit Product 4
5. Compare all four
6. Lock shared boundaries
7. Build Forrest OS core
8. Integrate products
```

Do not build the entire Forrest OS shell before product audits establish the real shared requirements.
