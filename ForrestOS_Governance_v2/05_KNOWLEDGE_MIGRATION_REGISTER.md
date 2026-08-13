# KNOWLEDGE MIGRATION REGISTER

## 1. Purpose

Defines what knowledge belongs in Forrest OS versus individual product projects.

Goal:

```text
Forrest OS = HOW Forrest software is built and connected
Product = WHAT the business application does
```

---

## 2. Classification

Use:

```text
PLATFORM
PRODUCT
SHARED REFERENCE
SUPERSEDED
TEMPORARY
```

---

## 3. Move to Forrest OS

Move/summarize:

- platform architecture
- technology standards
- authentication pattern
- RBAC mechanism
- shared UI shell/design system
- canonical identity rules
- authoritative data ownership principles
- integration adapter standards
- document framework
- audit framework
- notification architecture
- health/telemetry
- Dev Box
- Git/testing
- Codex/Antigravity/MCP
- production architecture decisions
- cross-product security rules

---

## 4. Keep in Products

Keep:

- business workflows
- domain rules
- product statuses
- screens
- product metrics
- raw discovery
- UAT
- defects
- domain-specific APIs
- product-specific integrations
- detailed implementation
- product release notes

---

## 5. Migration Method

Do not copy full conversation histories by default.

Use:

```text
Conversation
   ↓
Durable decision?
   ├─ Yes, cross-product → Forrest OS
   ├─ Yes, product-specific → Product
   └─ No → leave/archive
```

---

## 6. Product Handoff

Each product creates:

```text
<PRODUCT>_FORREST_OS_HANDOFF.md
```

Include:

```text
Purpose
Users
Workflows
Current technology
Target technology
Repository
Data ownership
Canonical/shared entities
Authoritative data sources
External integrations
Shared Forrest dependencies
Security boundaries
Migration state
Durable decisions
Open questions
Forrest OS implications
```

---

## 7. Current Register

| Source | Knowledge | Class | Move? | Destination |
|---|---|---|---:|---|
| Dev Box | Python/Django/Postgres standard | PLATFORM | Yes | Platform Standard |
| Dev Box | React/Webpack/Bootstrap standard | PLATFORM | Yes | Platform Standard |
| Dev Box | DW2 read-only | PLATFORM | Yes | Standard/Architecture |
| Dev Box | Selenium | PLATFORM | Yes | Platform Standard |
| Dev Box | MCP | PLATFORM | Yes | Platform Standard |
| Dev Box | debug/install logs | TEMPORARY | No | Source only |
| Onboarding | Django session auth | SHARED REFERENCE | Yes | Platform auth |
| Onboarding | RBAC pattern | SHARED REFERENCE | Yes | Platform RBAC |
| Onboarding | ownership vs visibility | SHARED REFERENCE | Yes | Standard |
| Onboarding | onboarding workflow | PRODUCT | No | Onboarding |
| Onboarding | liability rules | PRODUCT | No | Onboarding |
| Onboarding | SOP workflow | PRODUCT | No | Onboarding |
| Onboarding | demo/UAT defects | PRODUCT | No | Onboarding |
| Onboarding | document pattern | SHARED REFERENCE | Yes | Document standard |
| Onboarding | audit pattern | SHARED REFERENCE | Yes | Audit standard |
| Onboarding | rate security boundary | SHARED REFERENCE | Yes | Security standard |
| Risk & Safety | risk scoring | PRODUCT | No | Risk & Safety |
| Risk & Safety | FMCSA workflow | PRODUCT | No | Risk & Safety |
| Risk & Safety | claims | PRODUCT | No | Risk & Safety |
| Risk & Safety | carrier identity need | SHARED REFERENCE | Yes | Data architecture |
| Cross-product | adapter contract | PLATFORM | Yes | Standard/Architecture |
| Cross-product | Teams/email | PLATFORM | Yes | Integration architecture |
| Legacy Supabase | debugging | SUPERSEDED/TEMPORARY | No | Product history |
| Legacy Supabase | migration lessons | SHARED REFERENCE | Yes | Durable decisions only |

---

## 8. Superseded Knowledge

Do not allow old decisions to remain equally authoritative.

Example:

```text
SUPERSEDED:
Supabase target runtime
Vite target bundler
Bootstrap 4 default

CURRENT:
Django/PostgreSQL
Webpack 5 + Babel
Bootstrap 5.3.x
```

---

## 9. Authoritative Data Knowledge

Forrest OS should capture ownership rules such as:

```text
canonical identity ≠ authoritative source
```

Product projects retain detailed field-level rules.

---

## 10. Conversation Rule

Move/summarize a conversation only when it contains:

- platform governance
- reusable architecture
- security standard
- shared integration
- canonical identity/data ownership
- cross-product engineering standard

Otherwise keep it in its product.

---

## 11. Source Hierarchy

When sources conflict:

```text
1. Approved Forrest OS standards
2. Accepted ADRs/Decision Register
3. Current product handoff
4. Current product documentation
5. Accepted UAT/business decision
6. Historical conversations
7. Superseded/debug history
```

---

## 12. Handoff Priority

```text
1. Drayage Onboarding
2. Risk & Safety
3. Product 3
4. Product 4
5. Cross-product comparison
6. Shared-service extraction
```

---

## 13. Immediate Actions

```text
[ ] Add this register
[ ] Create Onboarding handoff
[ ] Create Risk & Safety handoff
[ ] Identify Product 3
[ ] Identify Product 4
[ ] Audit remaining repos
[ ] Update Product Register
[ ] Compare shared services
```
