# Implementation Plan: Client Management

**Branch**: `015-client-management` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)

---

## 1. Overview

### What Exists
- `src/app/admin-dashboard/client-list/page.tsx` — admin client list (UI shell; hardcoded `users` array, `fetch('your-api-endpoint')` stub).
- `src/app/services/clientServices/services.ts` — `UserService` with `getUserByEmail()` and `registerUser()` (generic user registration, not client-specific).
- `src/app/redux/client/clientSlice.ts` — Redux slice for client state.
- Case-level `ClientsTab` and `useCaseClients` — **out of scope** (spec `010`); client list and CRUD here are standalone platform clients, not case-attached.

### Gaps to Close
1. No client self-registration page (`/client/register`).
2. No client profile page (`/client/profile`) for own view/edit.
3. Admin client list page wired to hardcoded data — needs real API integration.
4. `clientServices/services.ts` has generic `registerUser`, not a typed `registerClient` call.
5. Missing API service functions: `registerClient`, `fetchAllClients`, `fetchClientById`, `updateClient`, `deleteClient`.
6. Missing TypeScript types: `ClientRegistrationRequest`, `ClientProfile`, `ClientListItem`.
7. Keycloak session email pre-fill missing from any registration flow.
8. No unit or E2E tests.

### What Is New
- Client registration page: `src/app/client/register/page.tsx`
- Client profile page: `src/app/client/profile/page.tsx`
- Extended API service: `src/app/services/clientServices/services.ts` (extend existing)
- Types: `src/app/client/types/index.ts`
- Hooks: `useClientRegistration.ts`, `useClientProfile.ts`, `useClientAdmin.ts`
- Unit tests: `ClientRegistrationForm.test.tsx`
- E2E test: `e2e/015-client-management.spec.ts`

---

## 2. Architecture Flow

### 2.1 Self-Registration as Client

```
AuthenticatedUser navigates to /client/register
  → page.tsx renders ClientRegistrationForm
  → useClientRegistration()
  → onMount: read session email from Keycloak token → pre-fill email (read-only)
  → User fills: fullName (req), phone (req), gender (req)
  → blur → formValidation.validateSingleField(field, value)
  → Submit → formValidation.validate(formData)
  → registerClient(payload)
      → POST /api/v1/clients
  → 201 → showSuccess → user gains Client role → redirect to /legal-expert-search
  → 409 (duplicate email) → showError("This email is already registered as a client.")
  → 400 → extractApiErrors → setFormApiErrors
  → 403 (email mismatch) → showError("Access denied.")
```

### 2.2 Client Views and Edits Own Profile

```
Client navigates to /client/profile
  → useClientProfile()
  → onMount: fetchClientByEmail(session.email) or fetchClientById(session.clientId)
      → GET /api/v1/clients/me
  → Render current: fullName, email (read-only), phone, gender
  → User clicks "Edit Profile" → inline edit mode
  → User updates phone → formValidation.validateSingleField('phone', value)
  → Submit → updateClient(clientId, { fullName, phone, gender })
      → PUT /api/v1/clients/{id}
  → 200 → showSuccess → update local state → exit edit mode
  → 403 (identity mismatch) → showError("Access denied.")
```

### 2.3 Admin Views All Clients

```
SystemAdmin navigates to /admin-dashboard/client-list
  → useClientAdmin()
  → fetchAllClients({ search?, page, pageSize })
      → GET /api/v1/clients?search=&page=&pageSize=
  → Render paginated table: name, email, phone, gender, registration date
  → Search field → refetch with search param
```

### 2.4 Admin Deletes Client

```
Admin clicks "Delete" on a client row
  → ConfirmDialog: "Permanently delete this client? This cannot be undone."
  → User confirms → deleteClient(clientId)
      → DELETE /api/v1/clients/{id}
  → 204 → showSuccess → remove client row from list
  → error → showError → dialog stays open
```

---

## 3. File Structure

### Documentation
```
specs/015-client-management/
  spec.md                          NO CHANGE
  plan.md                          NEW (this file)
  research.md                      NEW
  data-model.md                    NEW
  contracts/
    api-contracts.md               NEW
```

### Source Tree
```
src/app/client/
  register/
    page.tsx                       NEW — client registration form page
  profile/
    page.tsx                       NEW — client's own profile view/edit
  types/
    index.ts                       NEW — ClientRegistrationRequest, ClientProfile, ClientListItem
  hooks/
    useClientRegistration.ts       NEW — form state, validation, submit
    useClientProfile.ts            NEW — fetch and update own profile

src/app/admin-dashboard/client-list/
  page.tsx                         UPDATE — replace hardcoded data + fetch stub with useClientAdmin hook
  hooks/
    useClientAdmin.ts              NEW — fetch list, delete, search, pagination

src/app/services/clientServices/
  services.ts                      UPDATE — add registerClient, fetchAllClients,
                                            fetchClientById, updateClient, deleteClient

e2e/
  015-client-management.spec.ts    NEW
```

---

## 4. Component Design

### 4.1 `ClientRegistrationForm`
- **Fields**: fullName (required, max 100), email (pre-filled from Keycloak session, read-only), phone (required, 10-digit, starts 6–9), gender (required, dropdown: Male/Female/Transgender).
- **Validation**: `useFormValidation(clientRegistrationSchema)`.
  - Phone rule: `/^[6-9]\d{9}$/`
  - Gender values: `['Male', 'Female', 'Transgender']`
- **Submit state**: Loading spinner on button; disabled during submission.
- **Post-success**: `showSuccess` toast then `router.push('/legal-expert-search')`.

### 4.2 `ClientProfilePage` (`/client/profile`)
- **Auth guard**: `useKeycloak()` — redirect to login if unauthenticated.
- **View mode**: Displays fullName, email (read-only), phone, gender.
- **Edit mode**: Toggled by "Edit Profile" button; email remains read-only even in edit mode.
- **Save**: Calls `updateClient`; reverts to view mode on success.
- **Identity guard**: If `fetchClientById` returns 403/404 for the session user, show access denied.

### 4.3 Admin Client List Page (`/admin-dashboard/client-list/page.tsx`)
- **Replace**: hardcoded `users` array and `fetch('your-api-endpoint')` with `useClientAdmin()` data.
- **Table columns**: Sr No, Name, Mobile Number, Email, Gender, Registration Date.
- **Search**: MUI `TextField` with debounce → `fetchAllClients({ search })`.
- **Pagination**: MUI `TablePagination`; server-side.
- **Delete**: Row action → `ConfirmDialog` → `deleteClient(id)`.

### 4.4 `useClientAdmin` Hook
- **State**: `clients[]`, `loading`, `pagination`, `searchQuery`
- **Actions**: `fetchClients()`, `deleteClient(id)`, `setSearch(query)`
- **No Redux**: Admin-session-scoped; local state sufficient.

---

## 5. API Plan

| Method | URL | Auth | Request | Success | Error Codes | Status |
|--------|-----|------|---------|---------|-------------|--------|
| `POST` | `/api/v1/clients` | Bearer | `ClientRegistrationRequest` | `{ data: ClientProfile }` 201 | 400, 401, 403, 409 | New |
| `GET` | `/api/v1/clients/me` | Bearer (Client) | — | `{ data: ClientProfile }` | 401, 403 | New |
| `GET` | `/api/v1/clients` | Bearer (SystemAdmin) | `?search&page&pageSize` | `{ items[], totalCount, page, pageSize }` | 401, 403 | New |
| `GET` | `/api/v1/clients/{id}` | Bearer (SystemAdmin) | — | `{ data: ClientProfile }` | 401, 403, 404 | New |
| `PUT` | `/api/v1/clients/{id}` | Bearer | `UpdateClientRequest` | `{ data: ClientProfile }` 200 | 400, 401, 403, 404 | New |
| `DELETE` | `/api/v1/clients/{id}` | Bearer (SystemAdmin) | — | 204 | 401, 403, 404 | New |

**`ClientRegistrationRequest`**:
```json
{
  "fullName": "string",
  "emailId": "string",
  "phoneNumber": "string",
  "gender": "Male | Female | Transgender"
}
```

**`UpdateClientRequest`**:
```json
{
  "fullName": "string",
  "phoneNumber": "string",
  "gender": "Male | Female | Transgender"
}
```

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| Email mismatch on registration | Email pre-filled from Keycloak token; field read-only in UI; backend validates email === JWT claim |
| Duplicate client registration | Backend returns 409; frontend shows `showError("This email is already registered as a client.")` |
| Client editing another client's profile | `/clients/me` endpoint scoped to JWT claim; `PUT /clients/{id}` validates ownership; returns 403 |
| Client accessing another client's profile URL | Backend enforces ownership on `GET /clients/{id}`; 403 if not owner or admin |
| Admin-only list and delete | `[Authorize(Roles = "SystemAdmin")]` on `GET /clients` and `DELETE /clients/{id}` |
| XSS via client name or phone | Controlled MUI `TextField` inputs; no `dangerouslySetInnerHTML` |
| Phone validation bypass | Client-side: `useFormValidation` regex rule; backend: server-side format validation |
| Hardcoded `fetch('your-api-endpoint')` stub | Remove entirely; replace with `httpServices` Axios client which injects Bearer token |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| Registration form fields | `useClientRegistration` (local) | Ephemeral form state |
| `clientProfile`, `isEditMode` | `useClientProfile` (local) | Session-scoped; loaded from API |
| Admin client list, pagination, search | `useClientAdmin` (local) | Admin-session-scoped; no cross-route sharing |
| `client` Redux slice | Redux (persisted) | Existing slice for client auth state; no change needed |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `ClientRegistrationForm.test.tsx` | Email field is read-only | Input has `readOnly` attribute |
| `ClientRegistrationForm.test.tsx` | Submit with empty fullName → validation error | Error message shown |
| `ClientRegistrationForm.test.tsx` | Phone starts with 5 → validation error | Phone error shown |
| `ClientRegistrationForm.test.tsx` | Phone is 9 digits → validation error | Phone error shown |
| `ClientRegistrationForm.test.tsx` | 201 response → success toast + redirect | showSuccess called; router.push invoked |
| `ClientRegistrationForm.test.tsx` | 409 response → duplicate error message | Specific error text shown |
| `useClientAdmin.test.ts` | fetchAllClients success → list populated | State contains returned clients |
| `useClientAdmin.test.ts` | deleteClient success → client removed | List length decreases |
| `useClientAdmin.test.ts` | search query changes → fetchAllClients called with search param | API mock called with correct param |

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| Register as client — golden path | AuthenticatedUser | Nav to /client/register, fill all fields, submit | Success message; redirect to expert search |
| Duplicate email rejected | AuthenticatedUser | Submit with already-registered email | Duplicate email error shown |
| Invalid phone rejected | AuthenticatedUser | Enter phone starting with 5 | Validation error shown |
| Client views own profile | Client | Nav to /client/profile | Name, email, phone, gender displayed |
| Client updates phone number | Client | Click Edit, change phone, save | Updated phone shown |
| Client cannot access other profile | Client | Navigate to /client/{otherId} | Access denied shown |
| Admin views client list | SystemAdmin | Nav to /admin-dashboard/client-list | Real client data listed (not hardcoded) |
| Admin searches for client | SystemAdmin | Enter name in search | Filtered results shown |
| Admin deletes client | SystemAdmin | Click Delete, confirm | Client removed from list |

Test file: `e2e/015-client-management.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-001: Registration in under 2 min | Form renders immediately; no async data needed on mount (email from token, gender is static) |
| SC-002: Profile updates reflected immediately | Update local state on 200; no re-fetch required |
| SC-003: Duplicate email rejected before record created | Backend validates at `POST` before insert; 409 returned immediately |
| Admin list search debounce | 300ms debounce on search `TextField` change before API call |
| Admin list pagination | Server-side; `pageSize` default 20; no full collection loaded at once |
| Profile page fetch | Single `GET /clients/me` on mount; no polling |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| Client registered | INFO | `clientId`, registration timestamp | Name, email, phone |
| Client profile updated | INFO | `clientId`, fields changed (keys only) | New field values |
| Client deleted | INFO | `clientId`, deletedBy (`adminId`) | Name, email |
| Duplicate email registration attempt | WARN | attempted email (hashed) | — |
| Email mismatch registration attempt | WARN | `userId` | Attempted email value |
| Unauthorized profile access attempt | WARN | `requestorId`, target `clientId` | — |
| API error (any client operation) | ERROR | HTTP status, `clientId` | Token value, PII |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Admin list page has hardcoded data and broken `fetch` stub | High | High | Remove `users` array and `fetch('your-api-endpoint')` from `page.tsx`; replace with `useClientAdmin` hook |
| `clientServices/services.ts` has `registerUser` not `registerClient` | High | Medium | Extend existing service; add typed `registerClient` function; keep `registerUser` for backward compat or deprecate |
| `/api/v1/clients/me` endpoint may not exist | Medium | High | Confirm endpoint availability with backend team; fallback to `GET /clients/{id}` using session-derived client ID |
| `client` Redux slice shape conflicts with new `ClientProfile` type | Low | Medium | Audit existing slice; `ClientProfile` type is separate — Redux slice stores auth/session state, not profile CRUD |
| Phone validation rule differs between spec (6–9 start) and existing validation.ts | Medium | Low | Check `src/utils/validation.ts` for existing phone rule; align with spec requirement (starts 6–9, 10 digits) |
| Gender API values: spec says Male/Female/Transgender but existing `CaseClient` has Non-Binary | Low | Low | Align with spec (3 values for global Client entity); case client may differ — do not share enum |
