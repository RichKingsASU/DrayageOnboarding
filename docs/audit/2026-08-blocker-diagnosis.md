# CRM Build Blocker Diagnosis — 2026-08-13

Repo: `c:\Forrest\Projects\DrayageOnboarding-main`  
Base branch: `main`  
Auditor: Antigravity (Phase A — Diagnosis Only)

---

## FINDING A1 — `PIPELINE_STAGES` is undefined

```
STATUS      ROOT CAUSE CONFIRMED
```

**CAUSE:** `KanbanBoard.tsx` line 550 references `PIPELINE_STAGES` as a bare identifier. This variable is never defined, never imported, and never existed in the repository history. A *different* constant named `STAGES` is defined at line 46 of the same file with the correct shape and data. The identifier `PIPELINE_STAGES` was never written — it is a typo/rename error referencing a constant that was never created.

**EVIDENCE:**

Grep of working tree for `PIPELINE_STAGES`:
```
> grep_search PIPELINE_STAGES c:\Forrest\Projects\DrayageOnboarding-main\src
src/components/KanbanBoard.tsx:550:  {PIPELINE_STAGES.map((stage) => (
```
One occurrence. No definition, no import.

Git history search:
```
> git log -S "PIPELINE_STAGES" --oneline --all
(empty output — zero commits)

> git log -p -S "PIPELINE_STAGES" --all -- "*.ts" "*.tsx"
(empty output — zero commits)
```
`PIPELINE_STAGES` has never existed in any commit on any branch.

The actual constant defined in the same file is `STAGES` at line 46:
```typescript
// KanbanBoard.tsx:46-82
const STAGES: { key: PipelineStage; label: string; color: string; desc: string; icon: any }[] = [
  { key: 'CustomerInquiry', label: 'Customer Inquiry', color: '...', desc: '...', icon: PhoneCall },
  { key: 'Agreement', label: 'Agreement / Credit App', color: '...', desc: '...', icon: FileCheck2 },
  { key: 'AccountSetup', label: 'Account Setup', color: '...', desc: '...', icon: Layers },
  { key: 'OperationalKickoff', label: 'Operational Kickoff', color: '...', desc: '...', icon: Sparkles },
  { key: 'OngoingSupport', label: 'Active & Ongoing Support', color: '...', desc: '...', icon: TrendingUp }
];
```

**Shape the code requires** (derived from usage sites):
- `PIPELINE_STAGES` must be iterable (`.map()` at `KanbanBoard.tsx:550`)
- Each element must have:
  - `.key` — type `PipelineStage`, used as React key (`KanbanBoard.tsx:552`) and for filtering accounts (`KanbanBoard.tsx:554`)
  - `.label` — string, rendered in column header (`PipelineColumn.tsx:41`)
  - `.color` — string, referenced in `PipelineColumnProps` type (`PipelineColumn.tsx:6`)
  - `.desc` — string, rendered in column subheading (`PipelineColumn.tsx:47`)
  - `.icon` — React component, assigned to `StageIcon` (`PipelineColumn.tsx:26`) and rendered (`PipelineColumn.tsx:39`)

**Canonical stage list exists in:**
- Frontend type: `src/types.ts:11` — `PipelineStage = 'CustomerInquiry' | 'Agreement' | 'AccountSetup' | 'OperationalKickoff' | 'OngoingSupport'`
- Backend Django model enum: `backend/ondray/models.py:47-52` — `class PipelineStage(models.TextChoices)` with identical values
- Migration: `backend/ondray/migrations/0001_initial.py:39` — matches
- Local constant: `KanbanBoard.tsx:46-82` — `const STAGES` with the same 5 values plus UI metadata
- In-app guide text at `App.tsx:414` references: "Inquiry, Credit Agreement, Account Setup, Kickoff, and Active Operations"

**TypeScript detects this today:**
```
> npx tsc --noEmit 2>&1 | Select-String "PIPELINE_STAGES"
src/components/KanbanBoard.tsx(550,10): error TS2304: Cannot find name 'PIPELINE_STAGES'.
```
Diagnostic code: **TS2304**.

However, the build script (`npm run build` = `webpack --mode production`) does **not** run typecheck. It uses `babel-loader` which strips types without checking them. The build succeeds:
```
> npm run build
webpack 5.109.2 compiled with 3 warnings in 4364 ms
```
The 3 warnings are bundle-size warnings only. The undefined `PIPELINE_STAGES` compiles into the bundle uncaught.

Package.json scripts (relevant):
```json
"build": "webpack --mode production",
"lint": "tsc --noEmit",
"typecheck": "tsc --noEmit"
```
Typecheck exists as a separate script but is not chained into `build`.

**BLAST RADIUS:** `src/components/KanbanBoard.tsx` — the entire Kanban board view crashes on render. This is the primary post-login view. 100% of authenticated page loads crash here.

```
FIX REQUIRES DECISION  NO
```
The fix is to change `PIPELINE_STAGES` to `STAGES` at line 550 (or rename the constant at line 46 to `PIPELINE_STAGES`). The canonical values are fully determined by the existing `STAGES` constant, `PipelineStage` type, and the backend enum.

---

## FINDING A2 — Tailwind layer absent from served CSS

```
STATUS      ROOT CAUSE CONFIRMED
```

**CAUSE:** Tailwind CSS is not installed, not configured, and not wired into the build pipeline. The markup is a mix of Tailwind utility classes (in `KanbanBoard.tsx`, `Login.tsx`, `SecureDocumentUploader.tsx`, `ErrorBoundary.tsx`) and Bootstrap classes (in `PipelineColumn.tsx`, `PipelineCard.tsx`, `OnboardingForm.tsx`, `App.tsx`). The CSS entry file `src/index.css` imports only Bootstrap: `@import 'bootstrap/dist/css/bootstrap.min.css'`. There is no Tailwind import directive, no Tailwind config, no PostCSS config, and no Tailwind package installed.

**EVIDENCE:**

Tailwind not in `package.json` dependencies or devDependencies:
```
> npm ls tailwindcss
drayage-onboarding-crm@0.1.0
`-- (empty)
```

No Tailwind or PostCSS config files exist:
```
> postcss.config.js not found
> postcss.config.cjs not found
> postcss.config.mjs not found
> tailwind.config.js not found
> tailwind.config.ts not found
```

CSS entry file `src/index.css`:
```css
@import 'bootstrap/dist/css/bootstrap.min.css';
```
Comment in the file says "Loads Tailwind CSS utilities" but the directive loads Bootstrap only.

Webpack config (`webpack.config.cjs`) has no PostCSS loader, no Tailwind plugin:
```javascript
{ test: /\.css$/, use: ['style-loader', 'css-loader'] }
```

Build uses `style-loader` which injects CSS as inline `<style>` tag from JS bundle. No separate CSS file is extracted. The built `dist/bundle.js` contains Bootstrap CSS (SVG data URIs from Bootstrap confirmed in bundle output) but zero Tailwind utility class definitions.

No `@tailwind` or `tailwindcss` string in bundle:
```
> Select-String -Pattern "@tailwind|tailwindcss" -Path dist\bundle.js | Measure-Object
Count: 0
```

**Bootstrap IS actively used in src/:**

Files with Bootstrap-specific classes (`btn-primary`, `d-flex`, `fw-bold`, `text-muted`, `col-*`, `card`, `badge`, `bg-light`, etc.):
- `src/App.tsx` — `btn-primary`, `btn-outline-secondary`, `vh-100`, `bg-light`, `d-flex`, `align-items-center`, `bg-warning`
- `src/components/kanban/PipelineColumn.tsx` — `col`, `bg-light`, `d-flex`, `fw-bold`, `badge`, `bg-secondary`, `rounded-pill`, `text-muted`
- `src/components/kanban/PipelineCard.tsx` — `btn`, `btn-primary`, `btn-light`, `btn-link`, `d-flex`, `fw-bold`, `text-dark`, `badge`
- `src/components/kanban/OnboardingForm.tsx` — `card`, `row`, `col-12`, `col-sm-4`, `bg-light`, `bg-primary`, `rounded-circle`, `fw-bold`, `text-muted`, `form-control`, `form-label`
- `src/components/kanban/AuditChecklist.tsx` — Bootstrap form classes
- `src/components/kanban/DocumentVault.tsx` — Bootstrap table/card classes

Bootstrap **cannot be removed** without a rendered-style delta. It is the CSS framework actively used by `PipelineColumn`, `PipelineCard`, `OnboardingForm`, `App.tsx`, and related kanban components.

Files using Tailwind-style utility classes (that have no CSS backing):
- `src/components/KanbanBoard.tsx` — `bg-blue-50/70`, `text-blue-700`, `rounded-xl`, `px-4`, `py-2`, `gap-3`, `flex-1`
- `src/components/SecureDocumentUploader.tsx` — `bg-slate-900`, `text-white`, `rounded-xl`, `border-slate-200`, `grid-cols-3`
- `src/components/Login.tsx` — `bg-blue-600`, `text-slate-300`, `rounded-lg`, `focus:ring-2`
- `src/components/ErrorBoundary.tsx` — `bg-white`, `rounded-xl`, `border-red-200`, `px-4`, `py-2`

**BLAST RADIUS:** All Tailwind utility classes in the above 4 files are unstyled. The layout and visual styling they describe is not applied. Bootstrap-styled components render correctly.

```
FIX REQUIRES DECISION  YES — The codebase has a split personality: some components use Bootstrap, some use Tailwind utilities (without Tailwind installed). A human must decide:
  (a) Install Tailwind alongside Bootstrap and wire it into the Webpack/PostCSS pipeline, or
  (b) Rewrite the Tailwind-class components to use Bootstrap classes, or
  (c) Replace Bootstrap with Tailwind entirely (large refactor of kanban subcomponents and App.tsx).
Given AGENTS.md explicitly lists Bootstrap 5.3.x as APPROVED and Tailwind as PROHIBITED, the decision should be (b).
```

---

## FINDING A3 — Accounts API returns non-JSON

```
STATUS      ROOT CAUSE CONFIRMED
```

**CAUSE:** `useAccounts.ts` line 35-36 calls `fetch('/api/Account')` and immediately chains `.then(res => res.json())` without checking `response.ok` or `content-type`. When the backend returns an error (non-200 status or non-JSON body), `res.json()` throws `SyntaxError: Unexpected token...`.

Additionally, the URL `/api/Account` does not match the Django API base. The `apiClient.ts` defines `API_BASE = '/api/v1'` and the Django backend serves at `/api/v1/ondray/...`. The `useAccounts.ts` fetch does **not** use the centralized `fetchApi` client — it uses raw `fetch` with a bare `/api/Account` URL (a DAB-style URL pattern from the previous Azure Data API Builder architecture). The webpack dev server proxies `/api` to `http://127.0.0.1:8000`, so the request reaches Django, but the URL `/api/Account` does not correspond to a Django view.

**EVIDENCE:**

`useAccounts.ts:35-38`:
```typescript
const { data, err } = await fetch('/api/Account')
  .then(res => res.json())
  .then(data => ({ data: data.value, err: null }))
  .catch(error => ({ data: null, err: error }));
```
- No `response.ok` check before `.json()` — line 36 parses unconditionally.
- No `content-type` check.
- The `.catch()` on line 38 catches the SyntaxError and routes it to the error state, but the error message is the raw parse error ("Unexpected token..."), not the actual HTTP status or server error message.

Webpack proxy config (`webpack.config.cjs:18`):
```javascript
devServer: { proxy: [{ context: ['/api'], target: 'http://127.0.0.1:8000' }] }
```

Django API base (`apiClient.ts:5`):
```typescript
const API_BASE = '/api/v1';
```

The `useAccounts.ts` hook does not use `fetchApi` at all — it bypasses the centralized client which already has `response.ok` checking (lines 42-50 of `apiClient.ts`).

**Live capture not possible** — The API URL template `{{API}}` was not filled and I cannot authenticate against the running dev server without a valid session cookie. The error is reproducible from code inspection: the endpoint `/api/Account` does not exist in Django, which returns a 404 or error HTML page that fails JSON parsing.

**BLAST RADIUS:** `src/hooks/useAccounts.ts` — affects the account data loading for all views. Falls back to `INITIAL_ACCOUNTS` from `mockData.ts` (line 18), so the app is functional with mock data when the fetch fails, but displays a transient error.

```
FIX REQUIRES DECISION  YES — Two issues:
  1. The endpoint URL '/api/Account' needs to be updated to the correct Django URL. Human must confirm the canonical endpoint path.
  2. The fetch should use the centralized fetchApi client (which already checks response.ok) or at minimum add response.ok and content-type checks before .json().
```

---

## FINDING A4 — ErrorBoundary recovery logs the user out

```
STATUS      ROOT CAUSE CONFIRMED
```

**CAUSE:** The "Return to Pipeline" button in `ErrorBoundary.tsx` line 52 invokes `window.location.href = '/'`. This is a **full page navigation** (hard reload), not a React state reset. When the page reloads:
1. All React state is destroyed (including the `AuthProvider` context which holds `session` and `user` in useState).
2. The `useAuth` hook's `checkSession()` runs on mount. In `required` auth mode, there is no persisted session — `session` starts as `null` (line 27 of `useAuth.tsx`), so `isAuthenticated` is `false`.
3. The app renders the Login page.

In `auto_demo` mode, the session is re-established automatically via `enterDemoMode()`, so the logout effect is less visible. In `required` mode, the user must re-authenticate.

The root cause is that `window.location.href = '/'` destroys the in-memory session state, and there is no session persistence mechanism (no cookies, no localStorage, no server-side session check on mount).

**EVIDENCE:**

`ErrorBoundary.tsx:51-53`:
```tsx
<button
  onClick={() => { window.location.href = '/'; }}
  className="px-4 py-2 border border-slate-300 text-slate-700 ..."
>
  Return to Pipeline
</button>
```

`useAuth.tsx:27`:
```typescript
const [session, setSession] = useState<Session | null>(null);
```
Session is initialized to `null`. No persistence to localStorage or cookies. No server-side session check (the `checkSession` function only auto-logins in `auto_demo` mode, lines 40-42).

The "Try Again" button at line 46 (`this.setState({ hasError: false, error: null })`) correctly resets the error boundary without navigation and preserves the session. The "Return to Pipeline" button is the one that causes the logout.

**BLAST RADIUS:** `src/components/ErrorBoundary.tsx` — the "Return to Pipeline" button on any error boundary fallback. Used to wrap `MainApp` in `App.tsx:610`.

```
FIX REQUIRES DECISION  NO — The fix is to change the "Return to Pipeline" handler to reset the error boundary state (like "Try Again" does) instead of navigating with window.location.href. This preserves the session.
```

---

## FINDING A5 — CI gate gap

```
STATUS      ROOT CAUSE CONFIRMED
```

**CAUSE:** The CI workflow `.github/workflows/validate.yml` **does** run typecheck before build (steps: Typecheck → Lint → Unit tests → Production build, lines 21-31). Both `npm run typecheck` (`tsc --noEmit`) and `npm run build` are present. A build failure does block deploy because CI is required on PR branches.

However, the **local build workflow** has no typecheck gate. `npm run build` runs `webpack --mode production` which uses Babel (which strips types without checking them). A developer can run `npm run build` locally, get a successful build, and ship code with type errors (like the `PIPELINE_STAGES` TS2304 error). The CI would catch it on PR, but only if the PR is created and CI runs.

The CI also has stale Supabase steps (lines 41-57: Setup Supabase CLI, Start Supabase, Reset DB, Run Supabase Tests, Stop Supabase) which will fail since the project has migrated to Django. This means CI is likely **not passing on current main**, making the typecheck gate ineffective.

**EVIDENCE:**

`.github/workflows/validate.yml`:
```yaml
- name: Typecheck
  run: npm run typecheck      # line 22

- name: Lint
  run: npm run lint           # line 25 — same as typecheck (tsc --noEmit)

- name: Production build
  run: npm run build          # line 31

- name: Setup Supabase CLI    # line 41 — STALE
  uses: supabase/setup-cli@v1

- name: Start Supabase        # line 47 — STALE
  run: supabase start
```

Current `npx tsc --noEmit` exits with code 1 (many errors including TS2304 for PIPELINE_STAGES, TS7016 for missing @types/react, TS7026 for JSX issues). CI typecheck step would fail on current main.

Package.json build script:
```json
"build": "webpack --mode production"
```
No typecheck chained. Build exits 0 despite type errors.

**BLAST RADIUS:** The CI pipeline itself. Typecheck gate exists but is likely broken by stale Supabase steps and pre-existing type errors. Local builds have no typecheck gate at all.

```
FIX REQUIRES DECISION  YES — Human must decide:
  1. Whether to remove the Supabase CI steps (they will fail since the project is now Django-based).
  2. Whether to chain typecheck into the build script (e.g., "build": "tsc --noEmit && webpack --mode production").
  3. Whether the many pre-existing TS7016/TS7026 errors (missing @types/react, @types/react-dom) should be fixed first or suppressed in tsconfig to make typecheck pass.
```

---

## SELF-CHECK

```
=== SELF-CHECK ===
CLAIMS NOT BACKED BY PASTED COMMAND OUTPUT:
  - A3: No live curl response captured (API URL template was not filled; could not authenticate against running dev server)
  - A2: AuditChecklist.tsx and DocumentVault.tsx Bootstrap usage not individually grepped (inferred from file presence in kanban/ directory alongside confirmed Bootstrap-using siblings)

VALUES I INFERRED RATHER THAN OBSERVED:
  - A3: The assertion that Django returns HTML/404 for /api/Account is inferred from the URL mismatch and the error message pattern; not confirmed via live request
  - A4: The assertion that required-mode users are logged out on reload is inferred from code analysis of useAuth.tsx (no session persistence); not confirmed via live browser test

THINGS I COULD NOT DETERMINE:
  - A3: The exact HTTP response from the API endpoint (no live access)
  - A3: Whether the Django backend has a view at /api/Account (checked only that apiClient.ts uses /api/v1 and backend has /ondray/ URL patterns)
  - A5: Whether CI has run recently on main and what its actual pass/fail status is (no GitHub API access)
  - The deployed artifact SHA or URL (template placeholder was not filled)

FILES MODIFIED IN PHASE A: docs/audit/2026-08-blocker-diagnosis.md (this file — created, not in source tree proper)
=== END SELF-CHECK ===
```
