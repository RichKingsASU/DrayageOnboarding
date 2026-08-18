# OnDray Final Acceptance Matrix

This matrix tracks the mapping of original React prototype routes to Django template routes, serving as the definitive baseline for the Final Pre-PostgreSQL Acceptance Audit.

| Prototype Route / Screen | User Purpose | Expected UI / Actions | Expected Data | Django Route | Current Implementation | Status | PostgreSQL Dependency | Defects / Notes |
|---|---|---|---|---|---|---|---|---|
| `/` (Main Layout) | App shell, navigation, profile switching | Header, Tabs, Active Profile Dropdown | `PROFILES` array | `base.html` (inherited by all) | Renders header/nav | PASS WITH MOCKS | No | Profile switcher needs validation |
| `/?tab=kanban` | View pipeline, drag-and-drop accounts | Kanban columns, Account cards, Add Account | Accounts mapped to Pipeline Stages | `/` (`kanban_view`) | HTML5 drag/drop with POST endpoints. Added metrics banner for visual parity. | PASS WITH MOCKS | Yes (persistence) | None |
| `/?tab=dashboard` | Manage single account | Customer 360, Contacts, Documents, SOPs | Account, Contacts, SOP data, Documents | `/dashboard/` (`dashboard_view`) | Contact Directory, Vault embedded, Red Flags, Compliance checklist | PASS WITH MOCKS | Yes (Vault storage, relations) | None |
| `/?tab=dashboard&account={id}` | Manage specific account | Same as dashboard | Filtered to account | `/dashboard/<account_id>/` | Supports advanced editing, alerts, document upload | PASS WITH MOCKS | Yes | None |
| Login Screen | Authentication | Username/password form | Credentials | N/A (Django session auth) | Not implemented explicitly yet | BLOCKED — POSTGRESQL | Yes (User models) | Depends on Django auth setup |
| Config Error Screen | Missing env vars | Warning card | `isAzureConfigured` boolean | N/A | Mock mode overrides need checking | NOT APPLICABLE | No | Not needed in Django if configured correctly |

**Verification Evidence:** 
- The React SPA uses `window.location.search` (`?tab=...`) for routing (see `src/App.tsx`).
- The Django implementation uses explicit path routing (`/` and `/dashboard/`).
- No missing screens were found; all primary React views map to the two Django templates (`kanban.html` and `dashboard.html`), wrapped in `base.html`.
