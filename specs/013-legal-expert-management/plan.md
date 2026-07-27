# Implementation Plan: Legal Expert Management

**Branch**: `013-legal-expert-management` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)

---

## 1. Overview

### What Exists
- `src/app/admin-dashboard/legal-experts/page.tsx` — admin list page (UI shell only; hardcoded test data, `fetch('your-api-endpoint')` stub).
- `src/app/redux/legalExpert/legalExpertSlice.ts` — Redux slice for legal expert state.
- `fetchLegalExpertByEmail()` in `src/app/organization/services/api.ts` — single API function (email lookup only).

### Gaps to Close
1. No legal expert registration form page (`/legal-expert/register`).
2. No legal expert profile page (`/legal-expert/[id]` or admin view).
3. Admin list page wired to hardcoded data — needs real API integration: fetch all experts, activate/deactivate, delete.
4. Missing API service functions: `registerLegalExpert`, `fetchAllLegalExperts`, `activateLegalExpert`, `deactivateLegalExpert`, `deleteLegalExpert`, `updateLegalExpert`.
5. Missing TypeScript types: `LegalExpertRegistrationRequest`, `LegalExpertListItem`, `LegalExpertDetail`.
6. No Keycloak session email pre-fill on registration form.
7. No unit or E2E tests.

### What Is New
- Registration form page: `src/app/legal-expert/register/page.tsx`
- Legal expert profile page (own): `src/app/legal-expert/profile/page.tsx`
- API service module: `src/app/services/legalExpertServices/services.ts`
- Types: `src/app/legal-expert/types/index.ts`
- Unit tests: `LegalExpertRegistrationForm.test.tsx`
- E2E test: `e2e/013-legal-expert-management.spec.ts`

---

## 2. Architecture Flow

### 2.1 Self-Registration

```
AuthenticatedUser navigates to /legal-expert/register
  → page.tsx renders LegalExpertRegistrationForm
  → useLegalExpertRegistration()
  → onMount: read session email from Keycloak token → pre-fill email (read-only)
  → fetch expert types from API → populate expertType dropdown
  → User fills: fullName (req), phone (req), gender (req), expertType (req)
  → blur → formValidation.validateSingleField(field, value)
  → Submit → formValidation.validate(formData)
  → registerLegalExpert(payload)
      → POST /api/v1/legalexperts
  → 201 → showSuccess("Your legal expert account has been created and is pending approval.")
         → redirect to /legal-expert/profile
  → 409 (duplicate email) → showError("This email is already registered as a legal expert.")
  → 400 → extractApiErrors → setFormApiErrors
```

### 2.2 Admin — View and Filter Experts

```
SystemAdmin navigates to /admin-dashboard/legal-experts
  → useLegalExpertAdmin()
  → fetchAllLegalExperts({ status?, expertType?, page, pageSize })
      → GET /api/v1/legalexperts?status=&expertType=&page=&pageSize=
  → render paginated table: name, email, phone, expertType, status badge, onboardingStage
  → Filter by Active / Pending Approval → refetch with status param
```

### 2.3 Admin — Activate Expert

```
Admin clicks "Activate" on a Pending expert row
  → activateLegalExpert(expertId)
      → PUT /api/v1/legalexperts/{expertId}/activate
  → 200 → showSuccess → update expert row status to "Active" in local state
  → error → showError
```

### 2.4 Admin — Delete Expert

```
Admin clicks "Delete" → ConfirmDialog: "Permanently delete this expert?"
  → User confirms → deleteLegalExpert(expertId)
      → DELETE /api/v1/legalexperts/{expertId}
  → 204 → showSuccess → remove expert row from list
  → error → showError
```

### 2.5 Expert — Update Own Profile

```
LegalIndividualExpert navigates to /legal-expert/profile
  → fetchLegalExpertByEmail(session.email) → pre-populate form
  → User edits: fullName, phone, expertType
  → Submit → updateLegalExpert(expertId, payload)
      → PUT /api/v1/legalexperts/{expertId}
  → 200 → showSuccess → update local state
  → error → showError
```

---

## 3. File Structure

### Documentation
```
specs/013-legal-expert-management/
  spec.md                          NO CHANGE
  plan.md                          NEW (this file)
  research.md                      NEW
  data-model.md                    NEW
  contracts/
    api-contracts.md               NEW
```

### Source Tree
```
src/app/legal-expert/
  register/
    page.tsx                       NEW — registration form page
  profile/
    page.tsx                       NEW — expert's own profile view/edit
  types/
    index.ts                       NEW — LegalExpertRegistrationRequest, LegalExpertListItem, LegalExpertDetail
  hooks/
    useLegalExpertRegistration.ts  NEW — form state, validation, submit
    useLegalExpertProfile.ts       NEW — fetch and update own profile
  components/
    LegalExpertRegistrationForm.tsx  NEW — presentational registration form
    ExpertStatusBadge.tsx            NEW — Active / Pending Approval badge chip

src/app/admin-dashboard/legal-experts/
  page.tsx                         UPDATE — wire to real API via useLegalExpertAdmin hook
  hooks/
    useLegalExpertAdmin.ts         NEW — fetch list, activate, delete, pagination

src/app/services/legalExpertServices/
  services.ts                      NEW — registerLegalExpert, fetchAllLegalExperts,
                                         activateLegalExpert, deactivateLegalExpert,
                                         deleteLegalExpert, updateLegalExpert

src/app/redux/legalExpert/
  legalExpertSlice.ts              NO CHANGE (existing slice)

e2e/
  013-legal-expert-management.spec.ts  NEW
```

---

## 4. Component Design

### 4.1 `LegalExpertRegistrationForm`
- **Fields**: fullName (required, max 100), email (pre-filled from Keycloak session, read-only), phone (required, 10-digit, 6–9 start), gender (required, dropdown: Male/Female/Transgender), expertType (required, dropdown from API reference data).
- **Validation**: `useFormValidation(legalExpertRegistrationSchema)` using existing rules from `src/utils/validation.ts`.
- **Submit state**: Loading spinner on button; disabled during submission.
- **Status message**: After success, display "Pending Approval" notice before redirect.

### 4.2 `ExpertStatusBadge`
- **Props**: `{ status: 'Active' | 'PendingApproval' | 'Inactive' }`
- **Renders**: MUI `Chip` — Active=green, PendingApproval=amber, Inactive=grey.
- Reusable across admin list and profile page.

### 4.3 Admin List Page (`/admin-dashboard/legal-experts/page.tsx`)
- **Replace**: hardcoded `users` array with `useLegalExpertAdmin()` hook data.
- **Pagination**: MUI `TablePagination`; page/pageSize params forwarded to API.
- **Filters**: Status (All / Active / Pending Approval), Expert Type dropdown.
- **Row actions**: Activate button (only for Pending), Delete button (all).
- **Delete**: Uses existing shared `ConfirmDialog` component.

### 4.4 `useLegalExpertAdmin` Hook
- **State**: `experts[]`, `loading`, `pagination`, `statusFilter`, `typeFilter`
- **Actions**: `fetchExperts()`, `activateExpert(id)`, `deleteExpert(id)`, `setFilter()`
- **No Redux**: List state is admin-session-scoped; local state sufficient.

### 4.5 `LegalExpertProfilePage` (`/legal-expert/profile`)
- **Auth guard**: `useKeycloak()` — redirect to login if unauthenticated.
- **Pre-fill**: `fetchLegalExpertByEmail(session.email)` on mount.
- **Editable fields**: fullName, phone, expertType (email read-only always).
- **Onboarding stage display**: Read-only badge showing current stage (Registration → PersonalDetails → ProfessionalDetails → Schedule).

---

## 5. API Plan

| Method | URL | Auth | Request | Success | Error Codes | Status |
|--------|-----|------|---------|---------|-------------|--------|
| `POST` | `/api/v1/legalexperts` | Bearer | `LegalExpertRegistrationRequest` | `{ data: LegalExpertDetail }` 201 | 400, 401, 409 | New |
| `GET` | `/api/v1/legalexperts` | Bearer (SystemAdmin) | `?status&expertType&page&pageSize` | `{ items[], totalCount, page, pageSize }` | 401, 403 | New |
| `GET` | `/api/v1/legalexperts/email/{email}` | Bearer | — | `{ data: LegalExpertDetail }` | 401, 403, 404 | Existing |
| `GET` | `/api/v1/legalexperts/{id}` | Bearer | — | `{ data: LegalExpertDetail }` | 401, 403, 404 | New |
| `PUT` | `/api/v1/legalexperts/{id}` | Bearer | `UpdateLegalExpertRequest` | `{ data: LegalExpertDetail }` 200 | 400, 401, 403, 404 | New |
| `PUT` | `/api/v1/legalexperts/{id}/activate` | Bearer (SystemAdmin) | — | `{ data: LegalExpertDetail }` 200 | 401, 403, 404 | New |
| `PUT` | `/api/v1/legalexperts/{id}/deactivate` | Bearer (SystemAdmin) | — | `{ data: LegalExpertDetail }` 200 | 401, 403, 404 | New |
| `DELETE` | `/api/v1/legalexperts/{id}` | Bearer (SystemAdmin) | — | 204 | 401, 403, 404 | New |
| `GET` | `/api/v1/legalexperts/types` | Bearer | — | `{ data: ExpertType[] }` | 401 | New (reference data) |

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| Email mismatch on registration | Email pre-filled from Keycloak token server-side; field is read-only in UI; backend validates email === session claim |
| Duplicate expert registration | Backend returns 409; frontend surfaces `showError("This email is already registered...")` |
| Expert editing another expert's profile | Backend enforces identity check; frontend `fetchLegalExpertByEmail(session.email)` only loads own record |
| Non-admin accessing expert management | `[Authorize(Roles = "SystemAdmin")]` on admin endpoints; frontend route guard via `useUserRole()` |
| XSS via expert name or phone | Controlled MUI inputs; no `dangerouslySetInnerHTML` |
| Expert type referencing invalid ID | Dropdown populated from `/legalexperts/types` API; no free-text entry |
| Inactive expert visible in search | Backend filters discoverability; activation state enforced server-side |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| Registration form fields | `useLegalExpertRegistration` (local) | Ephemeral form state |
| Expert profile data | `useLegalExpertProfile` (local) | Session-scoped; loaded from API |
| Admin expert list, pagination, filters | `useLegalExpertAdmin` (local) | Admin-session-scoped; no cross-route sharing |
| `legalExpert` Redux slice | Redux (persisted) | Existing slice for auth-flow expert state; no change needed |
| Expert types reference data | Local state in registration hook | Loaded once on mount; no persistence needed |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `LegalExpertRegistrationForm.test.tsx` | Email field is read-only | Input has `readOnly` attribute |
| `LegalExpertRegistrationForm.test.tsx` | Submit with empty fullName → validation error | Error message shown |
| `LegalExpertRegistrationForm.test.tsx` | Submit with invalid phone → validation error | Phone error shown |
| `LegalExpertRegistrationForm.test.tsx` | 201 response → success toast + redirect | showSuccess called |
| `LegalExpertRegistrationForm.test.tsx` | 409 response → duplicate email error | Error message matches spec text |
| `useLegalExpertAdmin.test.ts` | fetchAllLegalExperts success → list populated | State contains returned experts |
| `useLegalExpertAdmin.test.ts` | activateExpert success → expert status updated | Status changes to Active |
| `useLegalExpertAdmin.test.ts` | deleteExpert success → expert removed from list | List length decreases |

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| Register as legal expert — golden path | AuthenticatedUser | Nav to /legal-expert/register, fill all fields, submit | Success message; status shows Pending Approval |
| Duplicate email rejected | AuthenticatedUser | Submit form with already-registered email | Error message shown |
| Admin views pending experts | SystemAdmin | Nav to /admin-dashboard/legal-experts, filter Pending | Pending experts listed |
| Admin activates expert | SystemAdmin | Click Activate on pending expert | Status badge changes to Active |
| Admin deletes expert | SystemAdmin | Click Delete, confirm | Expert removed from list |
| Expert updates own profile | LegalIndividualExpert | Nav to /legal-expert/profile, change fullName | Updated name shown |

Test file: `e2e/013-legal-expert-management.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-001: Registration form completes in under 3 min | Form renders immediately; expert types loaded async with loading indicator |
| SC-002: Admin activates expert in under 1 min | Optimistic status update in local state on 200; no full list re-fetch |
| Expert types dropdown | Loaded once on mount via `useEffect`; cached in local state for session |
| Admin list pagination | Server-side pagination via `page`/`pageSize` params; no full list loaded at once |
| Large expert list | MUI `TablePagination` + server-side paging; `pageSize` default 20 |
| Admin list `.Select()` projection | Backend must return list DTOs (not full expert entities) to avoid N+1 |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| Expert registered | INFO | `expertId`, `expertType`, `onboardingStage` | Email, phone, name |
| Expert activated | INFO | `expertId`, activatedBy (`adminId`) | — |
| Expert deactivated | INFO | `expertId`, deactivatedBy | — |
| Expert deleted | INFO | `expertId`, deletedBy | Name, email |
| Expert profile updated | INFO | `expertId`, fields changed (keys only) | New field values |
| Registration with mismatched email blocked | WARN | `userId`, attempted email | — |
| Duplicate email registration attempt | WARN | attempted email (hashed) | — |
| API error (any expert operation) | ERROR | HTTP status, `expertId` | Token value, PII |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Admin list page has hardcoded data and broken fetch stub | High | High | Replace `users` array and `fetch('your-api-endpoint')` with `useLegalExpertAdmin` hook immediately |
| Keycloak email claim unavailable on registration page | Medium | High | Test email extraction from `keycloak.tokenParsed?.email`; fallback to empty with validation error |
| Expert type reference data not yet seeded on backend | Medium | Medium | Implement loading state + empty-dropdown fallback; coordinate with backend for seed data |
| `fetchLegalExpertByEmail` returns `User` type, not `LegalExpertDetail` | Medium | Low | Define `LegalExpertDetail` type separately; add adapter or update API function return type |
| Onboarding stage display source unclear | Low | Low | Confirm `onboardingStage` field is returned in expert GET response; display as read-only badge |
| SystemAdmin bypass email check on registration | Low | Low | Backend must allow any email for SystemAdmin role explicitly; document in backend API contract |
