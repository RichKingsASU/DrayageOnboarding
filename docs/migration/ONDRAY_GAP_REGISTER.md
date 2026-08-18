# OnDray Gap Register

| ID | Area | Prototype Behavior | Current Behavior | Severity | User Impact | Required Fix | Dependency | Status | Verification Evidence |
|---|---|---|---|---|---|---|---|---|---|
| GAP-001 | Architecture | React SPA with Vite | Django REST Framework (API only) | P0 | Cannot use the application | Implement Django server-rendered templates, views, and forms for the Kanban and Dashboard | None | Closed | Implemented via Django templates and views |
| GAP-002 | Persistence | Browser memory / Mock data / Azure | Django models backed by DB/Mock | P1 | Data not persisting | Implement mock service boundaries to simulate DB until PostgreSQL is available | PostgreSQL | Closed | Implemented mock service layer boundary |
| GAP-003 | Navigation | Client-side routing via URL search params | None | P1 | Cannot navigate between views | Implement Django routing for `kanban/` and `dashboard/<id>/` | None | Closed | Routes implemented and active |
| GAP-004 | UI / Styling | Bootstrap 5.3 + Lucide Icons | None | P2 | No visual styling | Integrate Bootstrap 5.3 and icons into Django base template | None | Closed | Bootstrap integrated and styled |
| GAP-005 | Application Parity | Missing Compliance, Red Flags, Vault Uploads, Advanced Editing | None | P1 | Missing core business features | Recreate missing components in Django | None | Closed | Implemented in Customer 360 Django Templates |
