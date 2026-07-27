# Tasks: Client Management

**Feature**: `015-client-management`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Status**: Partial — admin page exists with hardcoded data; registration/profile pages are new.

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1]**: Self-Registration as a Client (P1)
- **[US2]**: Client Views and Updates Own Profile (P2)
- **[US3]**: Admin Manages the Client List (P3)

---

## Phase 1: Setup

**Purpose**: Define types, extend existing service, confirm baseline.

- [ ] T001 Create `src/app/client/types/index.ts` — define `ClientRegistrationRequest`, `ClientProfile`, `ClientListItem`, `UpdateClientRequest`
- [ ] T002 [P] Audit `src/app/admin-dashboard/client-list/page.tsx` — document hardcoded `users` array and `fetch('your-api-endpoint')` stub to replace
- [ ] T003 [P] Audit `src/app/services/clientServices/services.ts` — note existing `registerUser()` and `getUserByEmail()`; do not break backward compat, add typed client functions alongside
- [ ] T004 [P] Check `src/utils/validation.ts` — verify Indian phone rule exists: `/^[6-9]\d{9}$/`; add `indianPhone` rule if missing
- [ ] T005 [P] Verify `src/app/redux/client/clientSlice.ts` — confirm `ClientProfile` type is separate from Redux slice shape (no type conflicts)

**Checkpoint**: Types defined, existing code audited — begin building

---

## Phase 2: UI

**Purpose**: Build all new UI components and pages.

- [ ] T006 [US1] Create `src/app/client/register/page.tsx` — Client Registration page (`"use client"`, Keycloak auth guard, renders `ClientRegistrationForm`)
- [ ] T007 [US1] Create `src/app/client/components/ClientRegistrationForm.tsx` — fields: fullName (req, max 100), email (read-only, pre-filled from Keycloak token), phone (req, 10-digit, starts 6–9), gender (req, dropdown: Male/Female/Transgender); loading spinner on submit button
- [ ] T008 [US2] Create `src/app/client/profile/page.tsx` — Client profile page (`"use client"`, Keycloak auth guard); view mode displays fullName, email (read-only), phone, gender; "Edit Profile" button toggles edit mode
- [ ] T009 [US2] Implement edit mode in `ClientProfilePage` — email remains read-only even in edit mode; Save calls `updateClient`; reverts to view mode on 200
- [ ] T010 [US3] Update `src/app/admin-dashboard/client-list/page.tsx` — replace hardcoded `users` and broken `fetch` stub with `useClientAdmin` hook; table columns: Sr No, Name, Mobile Number, Email, Gender, Registration Date; add search `TextField` (300ms debounce), `TablePagination`, Delete row action

**Checkpoint**: All UI pages and components renderable

---

## Phase 3: Logic

**Purpose**: Build all hooks and business logic.

- [ ] T011 [US1] Create `src/app/client/hooks/useClientRegistration.ts` — reads Keycloak email on mount for pre-fill; `useFormValidation(clientRegistrationSchema)`; calls `registerClient` on submit; handles 201 → `showSuccess` + `router.push('/legal-expert-search')`, 409 → "This email is already registered as a client.", 400 → form errors, 403 → "Access denied."
- [ ] T012 [US2] Create `src/app/client/hooks/useClientProfile.ts` — fetches `GET /api/v1/clients/me` on mount; state: `clientProfile`, `isEditMode`, `loading`; `updateClient` on save → updates local state on 200; shows `showError` on 403 (identity mismatch)
- [ ] T013 [US3] Create `src/app/admin-dashboard/client-list/hooks/useClientAdmin.ts` — state: `clients[]`, `loading`, `pagination`, `searchQuery`; debounced `fetchAllClients({ search, page, pageSize })` on search change; `deleteClient(id)` removes row from local state on 204; no Redux (admin-session-scoped)

**Checkpoint**: All hooks implemented — wire to components

---

## Phase 4: API

**Purpose**: Extend client service with all required API functions.

- [ ] T014 Extend `src/app/services/clientServices/services.ts` — add:
  - `registerClient(payload: ClientRegistrationRequest)` → `POST /api/v1/clients` — returns `ClientProfile` on 201
  - `fetchClientMe()` → `GET /api/v1/clients/me` — returns `ClientProfile`
  - `fetchAllClients(params: { search?, page, pageSize })` → `GET /api/v1/clients?search=&page=&pageSize=`
  - `fetchClientById(id: string)` → `GET /api/v1/clients/{id}`
  - `updateClient(id: string, payload: UpdateClientRequest)` → `PUT /api/v1/clients/{id}`
  - `deleteClient(id: string)` → `DELETE /api/v1/clients/{id}` — expects 204
- [ ] T015 All new functions use `httpServices` Axios client (Bearer token auto-injected); errors handled via `errorHandler.ts`
- [ ] T016 Keep existing `registerUser()` and `getUserByEmail()` intact — do not remove for backward compat

**Checkpoint**: All API functions added and typed

---

## Phase 5: Backend

**Purpose**: Document backend integration requirements (verification only).

- [ ] T017 Confirm `GET /api/v1/clients/me` endpoint exists (alternative: `GET /api/v1/clients/{id}` using session-derived client ID)
- [ ] T018 Confirm `POST /api/v1/clients` returns 409 for duplicate email, 403 for email mismatch against JWT claim
- [ ] T019 Confirm `PUT /api/v1/clients/{id}` validates ownership via JWT — returns 403 if `clientId` doesn't match session claim
- [ ] T020 Confirm `GET /api/v1/clients` and `DELETE /api/v1/clients/{id}` are gated with `[Authorize(Roles = "SystemAdmin")]`
- [ ] T021 Confirm phone validation rule on backend matches spec: 10 digits, starts with 6–9

---

## Phase 6: Security

**Purpose**: Enforce all security requirements from plan.md §6.

- [ ] T022 [US1] Verify email field in `ClientRegistrationForm` has `readOnly` attribute pre-filled from `keycloak.tokenParsed?.email`
- [ ] T023 [US2] Verify `ClientProfilePage` email field remains read-only even in edit mode (not just view mode)
- [ ] T024 [US2] Verify identity guard: if `/clients/me` returns 403, display access denied — do not render profile data
- [ ] T025 [US3] Verify admin page guard: `useUserRole()` check redirects non-SystemAdmin users from `/admin-dashboard/client-list`
- [ ] T026 [P] Verify no `dangerouslySetInnerHTML` in `ClientRegistrationForm` or `ClientProfilePage`
- [ ] T027 Remove `fetch('your-api-endpoint')` stub from admin page entirely — replace with `httpServices` Axios call that injects Bearer token

---

## Phase 7: Testing

**Purpose**: Build all unit tests and E2E tests from plan.md §8.

- [ ] T028 [P] [US1] Create `src/app/client/components/__tests__/ClientRegistrationForm.test.tsx`:
  - Email field has `readOnly` attribute
  - Submit with empty fullName → validation error
  - Phone starts with 5 → validation error
  - Phone is 9 digits → validation error
  - 201 response → `showSuccess` called; `router.push` invoked
  - 409 response → duplicate email error text shown
- [ ] T029 [P] [US3] Create `src/app/admin-dashboard/client-list/hooks/__tests__/useClientAdmin.test.ts`:
  - `fetchAllClients` success → `clients` state populated
  - `deleteClient` success → client removed (list length decreases)
  - Search query changes → `fetchAllClients` called with search param
- [ ] T030 Create `e2e/015-client-management.spec.ts` with all 9 E2E scenarios from plan.md §8: registration golden path, duplicate email, invalid phone, view profile, update phone, cross-profile access denied, admin views list, admin searches, admin deletes

**Checkpoint**: All tests written — run `npm run test` to verify unit tests pass

---

## Phase 8: Logging

**Purpose**: Add structured logging per plan.md §10.

- [ ] T031 [US1] Add `console.info` in `useClientRegistration` on success: log `{ clientId, timestamp }` — do NOT log name, email, or phone
- [ ] T032 [US2] Add `console.info` in `useClientProfile` on `updateClient` success: log `{ clientId, changedFields: Object.keys(payload) }` — do NOT log new values
- [ ] T033 [US3] Add `console.info` in `useClientAdmin` on `deleteClient` success: log `{ clientId, deletedBy: adminId }` — do NOT log name or email
- [ ] T034 Add `console.warn` in `useClientRegistration` on duplicate email attempt: log hashed email reference (no raw email value)
- [ ] T035 Add `console.warn` in `useClientRegistration` on email mismatch attempt: log `{ userId }` — do NOT log attempted email
- [ ] T036 Add `console.error` in API error handlers: log `{ httpStatus, clientId }` — do NOT log token or PII

---

## Phase 9: Quality Gates

**Purpose**: Ensure code quality before finalization.

- [ ] T037 [P] Run `npm run type-check` — fix TypeScript errors in all new `src/app/client/` files and updated `clientServices/services.ts`
- [ ] T038 [P] Run `npm run lint` — fix ESLint errors; confirm no `any` types introduced
- [ ] T039 Run `npm run test` — confirm all new unit tests pass
- [ ] T040 Run `npm run build` — confirm production build passes; verify admin page no longer references hardcoded data

---

## Phase 10: Finalization

**Purpose**: Confirm all spec requirements are satisfied.

- [ ] T041 Verify SC-001: client registration completes in under 2 minutes (form renders immediately; no async data on mount except email from token which is synchronous)
- [ ] T042 Verify SC-002: profile update reflected immediately after save (local state updated, no re-fetch)
- [ ] T043 Verify SC-003: duplicate email rejected with clear error before any record is created (409 handled)
- [ ] T044 Verify gender valid values are exactly: Male, Female, Transgender — check dropdown options match `ClientRegistrationRequest` spec
- [ ] T045 Verify admin table columns match spec: Sr No, Name, Mobile Number, Email, Gender, Registration Date

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: Start immediately — T001 types required before Phases 2–4
- **Phase 2 (UI)**: Depends on T001; T006–T010 largely parallel (different files)
- **Phase 3 (Logic)**: Depends on T001; T011–T013 depend on T014 (API functions) for import
- **Phase 4 (API)**: Depends on T001 (types); T014 is single file build
- **Phase 5 (Backend)**: Independent — run in parallel with Phases 2–4
- **Phase 6 (Security)**: Depends on Phase 2
- **Phase 7 (Testing)**: Depends on Phases 2–4
- **Phase 8 (Logging)**: Parallel with Phase 7
- **Phase 9 (Quality Gates)**: Depends on Phases 7–8
- **Phase 10 (Finalization)**: Depends on Phase 9
