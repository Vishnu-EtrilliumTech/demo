# Implementation Plan: Organization Registration

**Branch**: `001-organization-registration` | **Date**: 2026-05-14 | **Spec**: [spec.md](./spec.md)

## Summary

Build a dedicated organization registration page at `src/app/register/` (extending the existing route) that allows an authenticated user without an existing org to submit a guided two-section form (Organization Details + Administrator Details) via `POST /api/v1/organizations/register`, which grants them the OrganizationAdmin role on success and redirects to the org dashboard.

## Technical Context

| Category | Detail |
|---|---|
| Language/Version | TypeScript 5 strict, React 19 |
| Primary Dependencies | Next.js 15 App Router, MUI 6, Tailwind CSS 3, Keycloak.js 26 |
| Storage | No Redux state needed — one-time submission; redirect on success |
| Testing | Vitest + React Testing Library (unit), Playwright (E2E) |
| Target Platform | Web (desktop-first, mobile responsive) |
| Project Type | Next.js App Router page extending existing `src/app/register/` route |
| Performance Goals | SC-001: form complete in <2 min; SC-002: validation <200ms; SC-003: redirect <3s post-success |
| Constraints | Must call `fetchOrganizationByUserEmail` on load to guard existing-org users; existing `registerOrganization` API function already exists |
| Scale/Scope | Single page, one API call, no pagination |

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| I — Type Safety | PASS | No `any`; `OrganizationRegistrationPayload` type already defined in `src/app/organization/types/index.ts` |
| II — Security | PASS | Form validated client-side via `useFormValidation`; server validates again |
| III — Auth Consistency | PASS | Page checks Keycloak auth and redirects existing-org users before rendering form |
| IV — API Contract Discipline | PASS | `registerOrganization()` already exists in `src/app/organization/services/api.ts`; no breaking changes needed |
| V — Pre-commit Gates | PASS | No `--no-verify`; fix any tsc/lint/build errors before committing |
| VI — API Response Standards | PASS | All errors shown via `useToast().showError()`; no silent swallowing |
| VII — No dangerouslySetInnerHTML | PASS | Not applicable to this form |
| VIII — RBAC | PASS | Page guards against existing-org users; OrganizationAdmin role assigned server-side |
| IX — Shared Components | PASS | Form co-located in `src/app/register/` since it appears only on this route |
| X — Business Logic Location | PASS | Form logic in custom hook `useOrgRegistrationForm`; component is thin |
| XI — Delete Confirmation | N/A | No delete action in this feature |
| XII — Notifications | PASS | Success → `showSuccess()`; API errors → `showError()` |
| XIII — Redux for Cross-cutting | PASS | No Redux needed; data is ephemeral |
| XIV — API Envelope | PASS | Response unwrapped via `response.data.data` pattern |

## 1. Overview

**What exists today**:
- `src/app/register/page.tsx` — a multi-role registration page that already handles `?role=organizationuser` with a working org registration form section. It uses inline `validateForm()`, manual `useState` for errors, and stores result in `localStorage` before redirecting to `/success`.
- `registerOrganization()` in `src/app/organization/services/api.ts` — already calls `POST /api/v1/organizations/register` (note: endpoint is base URL without `/register` suffix — see line 689: `axios.post(ORG_API_BASE_URL, payload, ...)`).
- `OrganizationRegistrationPayload` type in `src/app/organization/types/index.ts`.
- `fetchOrganizationByUserEmail()` exists to check if user already has an org.

**Gaps to close**:
1. The existing page uses a bespoke `validateForm()` instead of the project-standard `useFormValidation` hook.
2. No redirect guard — a user with an existing org can access the form.
3. Errors go into a `setError(string)` div, not `useToast()`.
4. The existing multi-role page conflates client, legal expert, and org registration — the org registration section should either be extracted or the existing page refactored to follow architecture patterns.
5. Phone validation uses a loose `replace()` pattern rather than the strict `/^[6-9]\d{9}$/` validator from `src/utils/validation.ts`.
6. Success redirect goes to `/success` (a generic page) rather than the org dashboard.

**What is new**:
- `useOrgRegistrationForm` hook encapsulating all form state, validation schema, and submit handler.
- Redirect guard at page load using `fetchOrganizationByUserEmail`.
- Proper `useToast()` integration for API error display.
- Redirect to `/organization/[id]` on success.

## 2. Architecture Flow

### Scenario 1: Successful Registration
```
User navigates to /register?role=organizationuser
    |
    v
Page mounts → initKeycloak() check → user is authenticated
    |
    v
fetchOrganizationByUserEmail(user.email)
    |
    +-- org found? → showInfo("You already have an organization") → router.push(/organization/[orgId])
    |
    +-- no org? → render OrganizationRegistrationForm
                        |
                        v
              User fills form (2 sections: Org Details + Admin Details)
                        |
                        v
              onChange → validateSingleField(field, value) → inline error or clear
                        |
                        v
              Submit → validate(formData) → all valid?
                        |
                        +-- invalid → show inline errors, abort
                        |
                        +-- valid → setIsSubmitting(true) → disable Submit button
                                        |
                                        v
                                registerOrganization(payload)
                                        |
                                        +-- 201 → showSuccess("Organization registered!") → router.push(/organization/[orgId])
                                        +-- 400 → extract errors → showError(message) → re-enable form
                                        +-- network error → showError("Unable to register...") → re-enable form
```

### Scenario 2: Existing Org User — Redirect
```
User navigates to /register?role=organizationuser
    |
    v
Page loads → fetchOrganizationByUserEmail → org exists
    |
    v
router.push(/organization/[orgId])   (no form rendered)
```

## 3. File Structure

### Documentation Tree
```
specs/001-organization-registration/
  spec.md                    NO CHANGE
  plan.md                    NEW (this file)
  research.md                NEW
  data-model.md              NEW
  contracts/
    api-contracts.md         NEW
```

### Source Code Tree
```
src/app/register/
  page.tsx                   MODIFY — refactor org section to use useFormValidation + useToast + redirect guard
  _components/               NEW directory (co-located, single-route)
    OrgRegistrationForm.tsx  NEW — presentational form component
  _hooks/                    NEW directory
    useOrgRegistrationForm.ts NEW — all form state, validation, submit logic

src/app/organization/
  services/api.ts            NO CHANGE — registerOrganization() already exists
  types/index.ts             NO CHANGE — OrganizationRegistrationPayload already defined

src/utils/validation.ts      NO CHANGE — ValidationPatterns.phone already has /^[6-9]\d{9}$/
```

## 4. Component Design

### `OrgRegistrationForm` (NEW — `src/app/register/_components/OrgRegistrationForm.tsx`)

**Purpose**: Renders the two-section organization registration form (Organization Details + Administrator Details). Presentational only — receives state and handlers from hook.

**Props Interface**:
```typescript
interface OrgRegistrationFormProps {
  formData: OrgRegistrationFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  onChange: (name: string, value: string | string[]) => void;
  onSubmit: (e: React.FormEvent) => void;
}
```

**State**: None — fully controlled by parent hook.

**Render Paths**:
1. Default: renders two-section form with MUI TextField, Select, and a custom segments multi-select.
2. Submitting: Submit button shows `CircularProgress`, is `disabled`.
3. Field error: TextField `error` + `helperText` props display inline messages.

**Key Behaviors**:
- Segments field: MUI `Autocomplete` with `multiple` prop against predefined list `['Legal', 'Insurance']` — no custom dropdown reinvented.
- Admin email field: read-only, pre-populated from Keycloak session.
- Phone fields: `inputMode="numeric"` + `onChange` strips non-digit characters before calling `onChange`.
- Gender: MUI `Select` with options Male / Female / Non-Binary (maps to Male/Female/Transgender for API).

### `useOrgRegistrationForm` (NEW — `src/app/register/_hooks/useOrgRegistrationForm.ts`)

**Purpose**: Encapsulates all form logic, keeping the component thin.

**Signature**:
```typescript
export function useOrgRegistrationForm(userEmail: string): {
  formData: OrgRegistrationFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isCheckingOrg: boolean;
  existingOrgId: string | null;
  handleChange: (name: string, value: string | string[]) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}
```

**Internal state**:
- `formData` — all 9 form fields
- `isSubmitting` — prevents double-submit
- `isCheckingOrg` — loading spinner while guard check runs

**Key behaviors**:
1. On mount: `fetchOrganizationByUserEmail(userEmail)` → sets `existingOrgId` if found.
2. `handleChange`: calls `validateSingleField(name, value)` for immediate inline feedback.
3. `handleSubmit`: calls `validate(formData)` → on valid calls `registerOrganization()` → success redirects, error calls `showError()`.

## 5. API Plan

| Method | URL | Auth | Request Body | Success Response | Error Codes | Status |
|---|---|---|---|---|---|---|
| POST | `/api/v1/organizations` | Bearer token | `OrganizationRegistrationPayload` | 201 `{ data: { id: number, name: string, ... } }` | 400 (validation), 401 (unauth), 409 (duplicate) | EXISTING (`registerOrganization()`) |
| GET | `/api/v1/organizations/users/{email}` | Bearer token | — | 200 `{ data: Organization }` or 404 | 401, 403 | EXISTING (`fetchOrganizationByUserEmail()`) |

Note: The existing `registerOrganization()` POSTs to the base `ORG_API_BASE_URL` (i.e., `POST /api/v1/organizations`), not `/api/v1/organizations/register`. The spec mentions `/api/v1/organizations/register` but the implementation uses the base URL. The contracts document will reflect the actual endpoint.

## 6. Security Plan

| Concern | Mitigation |
|---|---|
| Unauthenticated access | Keycloak auth check before rendering form; redirect to login if not authenticated |
| Existing org bypass | `fetchOrganizationByUserEmail` on page load; redirect away if org found |
| XSS | No `dangerouslySetInnerHTML`; MUI TextField sanitizes output |
| Double submission | `isSubmitting` flag disables Submit button during in-flight request |
| Token exposure | `getToken()` via Keycloak service; never stored in component state |
| Mass assignment | API payload constructed from typed `OrganizationRegistrationPayload`; no spread of raw form |
| Phone injection | Digits-only filter on change + `/^[6-9]\d{9}$/` validation |

## 7. State Management

| State | Location | Rationale |
|---|---|---|
| Form field values | `useState` in `useOrgRegistrationForm` hook | Page-specific, ephemeral |
| Validation errors | `useFormValidation` hook (returned `errors`) | Page-specific |
| `isSubmitting` | `useState` in `useOrgRegistrationForm` hook | Page-specific UI |
| `isCheckingOrg` | `useState` in `useOrgRegistrationForm` hook | Page-specific guard loading |
| `existingOrgId` | `useState` in `useOrgRegistrationForm` hook | Needed for redirect URL |
| User email | Prop passed from page (obtained via Keycloak) | Keycloak session, not Redux |
| Redux | Not used | One-time form; no cross-cutting persistence needed |

## 8. Testing Plan

### Unit Tests

| File | Tests |
|---|---|
| `src/app/register/_hooks/useOrgRegistrationForm.test.ts` | renders with empty form; `handleChange` updates field and clears error; submit with invalid data shows errors; submit with valid data calls `registerOrganization`; API 400 calls `showError`; existing org sets `existingOrgId` |
| `src/app/register/_components/OrgRegistrationForm.test.tsx` | renders all 9 fields; submit button disabled when `isSubmitting=true`; inline error renders for invalid field; segments multi-select onChange fires with array |

### E2E Tests

| Scenario | Priority | Steps |
|---|---|---|
| Full happy path registration | P0 | 1. Login as new user 2. Navigate to `/register?role=organizationuser` 3. Fill all fields with valid data 4. Submit 5. Assert redirect to `/organization/[id]` and success toast |
| Validation — empty required fields | P1 | 1. Navigate to form 2. Click Submit without filling 3. Assert inline errors on all required fields |
| Phone validation | P1 | 1. Enter phone starting with `5` 2. Blur 3. Assert error message |
| Existing org redirect | P1 | 1. Login as existing OrgAdmin 2. Navigate to `/register?role=organizationuser` 3. Assert immediate redirect, no form rendered |
| Duplicate org email | P2 | 1. Submit with email already registered 2. Assert `showError` toast appears |

## 9. Performance

| Criterion | How Met |
|---|---|
| SC-001: <2min completion | Form is single-page, all fields visible; no pagination or multi-step wizard adds latency |
| SC-002: <200ms validation | `validateSingleField` runs synchronously in memory; no network calls on field blur |
| SC-003: <3s post-success redirect | `router.push()` called immediately after 201 response; org dashboard uses existing cached fetch |
| SC-004: 100% required field coverage | `validate(formData)` checks all schema fields before any API call |
| Rendering | `OrgRegistrationForm` is a pure presentational component; memo not needed at this scale |

## 10. Logging

| Event | Log Level | What to Log | What NOT to Log |
|---|---|---|---|
| Org check on load | `console.log` (dev only) | "Checking org for user email" (no email value) | Email address, token |
| Registration submit | `console.log` (dev only) | "Organization registration submitted" | Payload contents, token |
| Registration success | `console.log` (dev only) | "Organization registered, id: [id]" | Name, email, phone |
| Registration 400 error | `console.error` | Error message from API | User-entered form data |
| Network error | `console.error` | Error object message | Token, payload |

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `fetchOrganizationByUserEmail` returns false-negative (user has org but 404 for transient reason) | Low | Medium — user sees form they shouldn't | Guard only blocks on 200 + org data; transient 404 falls through to form, API rejects with 409 |
| Keycloak email not available on first load | Low | High — guard check fails, email field blank | Await `getUserInfo()` before rendering form; show spinner during check |
| Segments list expands (backend adds new values) | Medium | Low — form shows stale options | Hardcoded list `['Legal', 'Insurance']` to be replaced with API call in future spec |
| Double submit race condition | Low | Medium — duplicate org created | `isSubmitting` flag set before async call; Submit button disabled |
| API endpoint mismatch (spec says `/register`, code uses base URL) | Medium | Low | Confirmed actual code uses `ORG_API_BASE_URL` (no `/register`); contract doc reflects reality |
