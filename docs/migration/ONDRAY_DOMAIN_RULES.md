# OnDray Domain Rules

## Business Invariants Extracted from Source (Phase 2)

### Account Setup & Pipeline Stage Rules
1. **Agreement Stage**: An account requires the `credit_app`, `db`, and `contract` toggles checked to enter the Agreement stage.
2. **Account Setup Stage**: Transition requires `billToCodeCreated` and `auditCompleted`, OR `fuelAgreement` and `accessorialAgreement`.
3. **Operational Kickoff Stage**: Requires ALL onboarding toggles checked (creditApp, db, contract, fuelAgreement, accessorialAgreement, auditCompleted), plus ALL 4 document types uploaded (Credit Application, Liability Agreement, SOP Document, Other). Alternatively, the `onboardingCallCompleted` toggle overrides this condition.
4. **Ongoing Support Stage**: Achieved when `workOrderReceived` toggle is clicked.

### Invoicing and Accessorials
- Pre-paid accounts automatically bypass certain agreement requirements.
- Hazardous Materials accounts require Class 3 UN1263 placarding and continuous driver credentials.
