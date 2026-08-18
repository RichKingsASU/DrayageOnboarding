# OnDray Remaining Parity Work

## 1. Onboarding Compliance & Meetings Workspace
* **React Source:** `src/components/kanban/AuditChecklist.tsx` (or similar compliance component inside Kanban/CustomerDashboard) and `src/onboardingRules.ts`
* **Django Destination:** `backend/ondray/templates/partials/_compliance_workspace.html`, `backend/ondray/ui_views.py`, `backend/ondray/services/mock_service.py`
* **User Purpose:** Track onboarding checklist items, required actions, due dates, meetings, and follow-ups.
* **Data Inputs/Fields:** Checklist groups, items, status (Done/Pending/N/A), due dates, owner, meeting notes, completion percentage.
* **Backend/Service Methods:** `get_compliance_workspace`, `update_checklist_item`, `update_meeting_notes`
* **PostgreSQL Dependency:** None (use mock service).
* **Mock Implementation Status:** Pending implementation.

## 2. Customer 360 Advanced Editing
* **React Source:** `src/components/CustomerDashboard.tsx`
* **Django Destination:** `backend/ondray/templates/dashboard.html` (or separate partials), `backend/ondray/ui_views.py`, `backend/ondray/forms.py`
* **User Purpose:** Edit core account details, add/edit contacts, edit SOP delivery rules, update billing codes, etc.
* **Data Inputs/Fields:** Company Name, Bill-To Code, Credit Terms, Commodity, Equipment Setting, Load Layout, Expected Weight, Bonded (Y/N), Hazmat Class, Cargo Valuation, Communication Channel, EDI Required, Invoice Docs, Accept Sequence Bills. Contacts details.
* **Backend/Service Methods:** `update_account_details`, `add_contact`, `edit_contact`, `update_sop`
* **PostgreSQL Dependency:** None (use mock service).
* **Mock Implementation Status:** Pending implementation.

## 3. Red Flag Alert System
* **React Source:** `src/components/CustomerDashboard.tsx`
* **Django Destination:** `backend/ondray/templates/dashboard.html`, `backend/ondray/templates/partials/_red_flags.html`
* **User Purpose:** Warn operators of critical account constraints, compliance issues, or special rules.
* **Data Inputs/Fields:** Alert text message, Severity (Critical, Warning, Info).
* **Backend/Service Methods:** `add_account_alert`, `remove_account_alert`
* **PostgreSQL Dependency:** None (use mock service).
* **Mock Implementation Status:** Pending implementation.

## 4. Document Vault Upload and Document Actions
* **React Source:** `src/components/SecureDocumentUploader.tsx`, `src/components/CustomerDashboard.tsx`
* **Django Destination:** `backend/ondray/templates/dashboard.html` (Document Vault section), `backend/ondray/ui_views.py`, `backend/ondray/forms.py`
* **User Purpose:** Upload, delete, preview, and download secure documents related to customer compliance.
* **Data Inputs/Fields:** File attachment, Document Type, Custom File Name.
* **Backend/Service Methods:** `upload_document`, `delete_document`, `download_document`
* **PostgreSQL Dependency:** None (Local media storage for binaries + mock service for metadata).
* **Mock Implementation Status:** Pending implementation.
