# Tasks: Legal Expert Management

**Feature**: `013-legal-expert-management`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Status**: Partial — admin list page exists with hardcoded data; registration/profile pages are new.

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1]**: Self-Registration as a Legal Expert (P1)
- **[US2]**: Admin Reviews and Activates Experts (P2)
- **[US3]**: Expert Updates Own Profile (P3)

---

## Phase 1: Setup

**Purpose**: Define types and confirm existing code baseline.

- [ ] T001 Create `src/app/legal-expert/types/index.ts` — define `LegalExpertRegistrationRequest`, `LegalExpertListItem`, `LegalExpertDetail`, `UpdateLegalExpertRequest`, `ExpertType` interfaces
- [ ] T002 [P] Verify existing `src/app/redux/legalExpert/legalExpertSlice.ts` — confirm no type conflicts with new `LegalExpertDetail` type
- [ ] T003 [P] Verify `fetchLegalExpertByEmail()` in `src/app/organization/services/api.ts` — confirm return type and adapt if needed for profile page use
- [ ] T004 [P] Audit `src/app/admin-dashboard/legal-experts/page.tsx` — document all hardcoded data and broken `fetch('your-api-endpoint')` stubs to replace

**Checkpoint**: Types defined, gaps documented — begin building

---

## Phase 2: UI

**Purpose**: Build all new UI components and pages.

- [ ] T005 [US1] Create `src/app/legal-expert/register/page.tsx` — Legal Expert Registration page (`"use client"`, Keycloak auth guard, renders `LegalExpertRegistrationForm`)
- [ ] T006 [US1] Create `src/app/legal-expert/components/LegalExpertRegistrationForm.tsx` — form fields: fullName (req, max 100), email (read-only, pre-filled from Keycloak token), phone (req), gender (req, dropdown: Male/Female/Transgender), expertType (req, dropdown from API)
- [ ] T007 [US1] Add loading state to expertType dropdown in `LegalExpertRegistrationForm` — skeleton or disabled placeholder while expert types fetch
- [ ] T008 [US1] Add post-success "Pending Approval" notice in `LegalExpertRegistrationForm` before redirect to `/legal-expert/profile`
- [ ] T009 [US2] Create `src/app/legal-expert/components/ExpertStatusBadge.tsx` — MUI `Chip`: Active=green, PendingApproval=amber, Inactive=grey; props: `{ status: 'Active' | 'PendingApproval' | 'Inactive' }`
- [ ] T010 [US2] Update `src/app/admin-dashboard/legal-experts/page.tsx` — replace hardcoded `users` array and `fetch('your-api-endpoint')` with `useLegalExpertAdmin` hook; add `ExpertStatusBadge`, Activate button, Delete button, status filter, MUI `TablePagination`
- [ ] T011 [US3] Create `src/app/legal-expert/profile/page.tsx` — expert's own profile view/edit page (`"use client"`, Keycloak auth guard, pre-fills from `fetchLegalExpertByEmail`)
- [ ] T012 [US3] Add onboarding stage display on profile page — read-only badge showing current stage (Registration → PersonalDetails → ProfessionalDetails → Schedule)

**Checkpoint**: All UI pages and components renderable

---

## Phase 3: Logic

**Purpose**: Build all hooks and business logic.

- [ ] T013 [US1] Create `src/app/legal-expert/hooks/useLegalExpertRegistration.ts` — state: form fields, validation errors, submitting flag; reads Keycloak email on mount for pre-fill; calls `registerLegalExpert` on submit; handles 201, 409, 400 responses
- [ ] T014 [US1] Integrate `useFormValidation(legalExpertRegistrationSchema)` in `useLegalExpertRegistration` — validation rules from `src/utils/validation.ts`: fullName required/max100, phone `/^[6-9]\d{9}$/`, gender required, expertType required
- [ ] T015 [US2] Create `src/app/admin-dashboard/legal-experts/hooks/useLegalExpertAdmin.ts` — state: `experts[]`, `loading`, `pagination`, `statusFilter`, `typeFilter`; methods: `fetchExperts()`, `activateExpert(id)`, `deleteExpert(id)`, `setFilter()`; no Redux (admin-session-scoped)
- [ ] T016 [US2] Implement optimistic status update in `useLegalExpertAdmin.activateExpert` — update expert row status to "Active" in local state on 200 (no full list re-fetch)
- [ ] T017 [US3] Create `src/app/legal-expert/hooks/useLegalExpertProfile.ts` — fetches `fetchLegalExpertByEmail(session.email)` on mount; exposes edit mode toggle; calls `updateLegalExpert` on save; handles 200, 400, 403 responses

**Checkpoint**: All hooks implemented and wired to components

---

## Phase 4: API

**Purpose**: Build all new API service functions.

- [ ] T018 Create `src/app/services/legalExpertServices/services.ts` with all required functions:
  - `registerLegalExpert(payload: LegalExpertRegistrationRequest)` → `POST /api/v1/legalexperts`
  - `fetchAllLegalExperts(params: { status?, expertType?, page, pageSize })` → `GET /api/v1/legalexperts`
  - `fetchLegalExpertById(id: string)` → `GET /api/v1/legalexperts/{id}`
  - `updateLegalExpert(id: string, payload: UpdateLegalExpertRequest)` → `PUT /api/v1/legalexperts/{id}`
  - `activateLegalExpert(id: string)` → `PUT /api/v1/legalexperts/{id}/activate`
  - `deactivateLegalExpert(id: string)` → `PUT /api/v1/legalexperts/{id}/deactivate`
  - `deleteLegalExpert(id: string)` → `DELETE /api/v1/legalexperts/{id}`
  - `fetchExpertTypes()` → `GET /api/v1/legalexperts/types`
- [ ] T019 All functions in `services.ts` use `httpServices` (Axios with Bearer token injected) — no raw `fetch()` calls
- [ ] T020 All functions handle errors using `src/utils/errorHandler.ts` pattern; surface via `useToast().showError()`

**Checkpoint**: All API functions built and typed

---

## Phase 5: Backend

**Purpose**: Document backend integration requirements (no frontend code).

- [ ] T021 Confirm `POST /api/v1/legalexperts` returns 409 for duplicate email and 400 for validation errors
- [ ] T022 Confirm `GET /api/v1/legalexperts/types` returns expert type reference data (no auth required or Bearer accepted)
- [ ] T023 Confirm `PUT /api/v1/legalexperts/{id}/activate` returns 200 with updated `LegalExpertDetail` including new status
- [ ] T024 Confirm backend validates email === Keycloak session claim on `POST` — blocks email mismatch for non-SystemAdmin
- [ ] T025 Confirm `GET /api/v1/legalexperts` and admin-only endpoints are gated with `[Authorize(Roles = "SystemAdmin")]`

---

## Phase 6: Security

**Purpose**: Enforce all security requirements from plan.md §6.

- [ ] T026 [US1] Verify email field in `LegalExpertRegistrationForm` has `readOnly` attribute and is pre-filled from `keycloak.tokenParsed?.email` — cannot be edited
- [ ] T027 [US2] Add admin route guard in `src/app/admin-dashboard/legal-experts/page.tsx` — redirect non-SystemAdmin users via `useUserRole()` check
- [ ] T028 [US3] Verify `useLegalExpertProfile` uses `fetchLegalExpertByEmail(session.email)` — expert can only load their own record
- [ ] T029 [P] Confirm all MUI `TextField` inputs in registration and profile forms use controlled components — no `dangerouslySetInnerHTML`
- [ ] T030 [US1] Add error handling for Keycloak email unavailable: if `keycloak.tokenParsed?.email` is undefined, show validation error before form submission

---

## Phase 7: Testing

**Purpose**: Build all unit tests and E2E tests from plan.md §8.

- [ ] T031 [P] [US1] Create `src/app/legal-expert/components/__tests__/LegalExpertRegistrationForm.test.tsx`:
  - Email field has `readOnly` attribute
  - Submit with empty fullName → validation error shown
  - Submit with invalid phone → phone error shown
  - 201 response → `showSuccess` called
  - 409 response → "This email is already registered as a legal expert." error shown
- [ ] T032 [P] [US2] Create `src/app/admin-dashboard/legal-experts/hooks/__tests__/useLegalExpertAdmin.test.ts`:
  - `fetchAllLegalExperts` success → `experts` state populated
  - `activateExpert` success → expert status updated to Active in state
  - `deleteExpert` success → expert removed from list (length decreases)
- [ ] T033 Create `e2e/013-legal-expert-management.spec.ts` with all 6 E2E scenarios from plan.md §8: registration golden path, duplicate email rejected, admin views pending, admin activates, admin deletes, expert updates own profile

**Checkpoint**: All tests written — run `npm run test` to verify unit tests pass

---

## Phase 8: Logging

**Purpose**: Add structured logging per plan.md §10.

- [ ] T034 [US1] Add `console.info` in `useLegalExpertRegistration` on registration success: log `{ expertId, expertType, onboardingStage }` — do NOT log email, phone, or name
- [ ] T035 [US2] Add `console.info` in `useLegalExpertAdmin` on `activateExpert` success: log `{ expertId, activatedBy: adminId }`
- [ ] T036 [US2] Add `console.info` in `useLegalExpertAdmin` on `deleteExpert` success: log `{ expertId, deletedBy: adminId }` — do NOT log name or email
- [ ] T037 [US3] Add `console.info` in `useLegalExpertProfile` on `updateLegalExpert` success: log `{ expertId, changedFields: Object.keys(payload) }` — do NOT log new values
- [ ] T038 Add `console.warn` in `useLegalExpertRegistration` when email mismatch detected: log `{ userId }` — do NOT log attempted email
- [ ] T039 Add `console.error` in API service error handlers: log `{ httpStatus, expertId }` — do NOT log token or PII

---

## Phase 9: Quality Gates

**Purpose**: Ensure code quality before finalization.

- [ ] T040 [P] Run `npm run type-check` — fix any TypeScript errors in all new files under `src/app/legal-expert/` and `src/app/admin-dashboard/legal-experts/`
- [ ] T041 [P] Run `npm run lint` — fix any ESLint errors in modified and new files
- [ ] T042 Run `npm run test` — confirm all new unit tests pass
- [ ] T043 Run `npm run build` — confirm production build passes; verify admin page no longer references hardcoded `users` array

---

## Phase 10: Finalization

**Purpose**: Confirm all spec requirements are satisfied.

- [ ] T044 Verify SC-001: registration form completes in under 3 minutes (form renders immediately, expert types load async)
- [ ] T045 Verify SC-002: admin can view pending experts and activate in under 1 minute
- [ ] T046 Verify SC-003: registration form never allows submission with email that doesn't match session
- [ ] T047 Verify SC-004: Active/Pending status badges accurate on page load — confirm `ExpertStatusBadge` renders correct chip color for each status

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: No dependencies — start immediately; T001 must complete before all other phases
- **Phase 2 (UI)**: Depends on T001 (types); T005–T012 can largely run in parallel
- **Phase 3 (Logic)**: Depends on Phase 1; T013–T017 depend on T018 (API) for import
- **Phase 4 (API)**: Depends on Phase 1 types; T018 is single file — build completely then import in hooks
- **Phase 5 (Backend)**: Independent verification — run in parallel with Phases 2–4
- **Phase 6 (Security)**: Depends on Phase 2 (UI)
- **Phase 7 (Testing)**: Depends on Phases 2–4
- **Phase 8 (Logging)**: Can run in parallel with Phase 7
- **Phase 9 (Quality Gates)**: Depends on Phases 7–8
- **Phase 10 (Finalization)**: Depends on Phase 9
