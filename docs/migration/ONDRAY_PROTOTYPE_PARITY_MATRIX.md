# OnDray Prototype Parity Matrix

| Prototype Screen / Workflow | URL / Route | Primary Purpose | UI Components | Current OnDray Target Implementation | Parity Status | Known Gaps | Database Dependency | Test Status |
|---|---|---|---|---|---|---|---|---|
| Main App Layout | `/` | Header, user profile switcher, navigation | Header, Navigation tabs, User profile dropdown | DRF API only | NOT STARTED | Complete UI missing; no Django templates exist | - | NOT STARTED |
| Kanban Board | `/?tab=kanban` | Pipeline stages, drag-and-drop accounts | Kanban columns, Account cards, Add Account button | DRF API only | NOT STARTED | No Kanban view in Django | PostgreSQL / Mock | NOT STARTED |
| Customer Dashboard | `/?tab=dashboard&account={id}`| 360-View, Forms, SOPs, Vault | Tabs, Forms, Document Vault, Contacts table, Alerts | DRF API only | NOT STARTED | No dashboard view in Django | PostgreSQL / Mock | NOT STARTED |
| Document Vault (Dashboard Tab) | `/?tab=dashboard` | Upload, view, and manage documents | File uploader, Document list, Lightbox preview | DRF API (`OnboardingDocumentViewSet`) | PARTIAL | Missing UI; DRF endpoints exist | PostgreSQL / Mock | NOT STARTED |
| Accessorial SOP (Dashboard Tab)| `/?tab=dashboard` | Manage terminal SOP rules and fees | Form fields for fees, rules, toggles | DRF API (`AccessorialSOPViewSet`) | PARTIAL | Missing UI; DRF endpoints exist | PostgreSQL / Mock | NOT STARTED |
| Contacts (Dashboard Tab) | `/?tab=dashboard` | Manage account contacts | Contacts table, Add Contact modal | DRF API (`ContactViewSet`) | PARTIAL | Missing UI; DRF endpoints exist | PostgreSQL / Mock | NOT STARTED |

*Note: Parity statuses will be updated as UI implementation progresses.*
