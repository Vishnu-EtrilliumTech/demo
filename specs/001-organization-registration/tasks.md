# Tasks: Organization Registration

**Input**: `specs/001-organization-registration/`
**Branch**: `001-organization-registration`

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1=Register org, US2=Redirect existing org user, US3=Validation feedback

---

## Phase 1: Setup

**Purpose**: Verify existing code and create directory scaffolding before any new files are written.

- [ ] T001 Verify `OrganizationRegistrationPayload` type in `src/app/organization/types/index.ts` covers all 9 fields (organizationName, segments, contactEmail, contactPhone, description, adminName, adminPhone, adminGender, adminEmail)
- [ ] T002 [P] Verify `registerOrganization()` in `src/app/organization/services/api.ts` POSTs to `ORG_API_BASE_URL` (no `/register` suffix) and accepts `OrganizationRegistrationPayload`
- [ ] T003 [P] Verify `fetchOrganizationByUserEmail(email)` in `src/app/organization/services/api.ts` handles 200 (returns org object) and 404 (returns null or throws) correctly
- [ ] T004 Create directory `src/app/register/_components/` for presentational form component
- [ ] T005 [P] Create directory `src/app/register/_hooks/` for form logic hook

---

## Phase 2: UI

**Purpose**: Build the two-section registration form component and page loading state.

- [ ] T006 [US1] Create `src/app/register/_components/OrgRegistrationForm.tsx` — render two MUI sections (Organization Details + Administrator Details) with TextField for name/phone/email/description, MUI Autocomplete (multiple) for segments against `['Legal', 'Insurance']` list, MUI Select for gender (Male/Female/Non-Binary), read-only email field pre-populated from Keycloak session
- [ ] T007 [US1] Add submit button to `OrgRegistrationForm.tsx` that renders MUI `CircularProgress` inside button and sets `disabled={isSubmitting}` during API call
- [ ] T008 [US2] Add `isCheckingOrg` loading spinner (MUI `CircularProgress` full-page overlay) to `src/app/register/page.tsx` shown while `fetchOrganizationByUserEmail` resolves on mount
- [ ] T009 [US3] Wire `errors` object from `useOrgRegistrationForm` to each MUI TextField's `error` and `helperText` props in `OrgRegistrationForm.tsx`

---

## Phase 3: Logic

**Purpose**: Implement the `useOrgRegistrationForm` hook that encapsulates all form state, validation, and submission.

- [ ] T010 [US1] Create `src/app/register/_hooks/useOrgRegistrationForm.ts` — initialise `formData` state for all 9 fields, `isSubmitting: boolean`, `isCheckingOrg: boolean`, `existingOrgId: string | null`
- [ ] T011 [US2] Add `useEffect` in `useOrgRegistrationForm.ts` that calls `fetchOrganizationByUserEmail(userEmail)` on mount, sets `existingOrgId` if org found, sets `isCheckingOrg` to `false` after resolution
- [ ] T012 [US1] Implement `handleChange(name, value)` in `useOrgRegistrationForm.ts` — updates `formData[name]`, calls `validateSingleField(name, value)` from `useFormValidation` for immediate inline error or clear
- [ ] T013 [US1] Build validation schema in `useOrgRegistrationForm.ts` using `required`, `email`, `phone` validators from `src/utils/validation.ts`; add custom min-1 check for segments array
- [ ] T014 [US1] Implement `handleSubmit(e)` in `useOrgRegistrationForm.ts` — call `validate(formData)`, abort if invalid; set `isSubmitting=true`; call `registerOrganization(payload)`; on 201 call `showSuccess` + `router.push(/organization/[id])`; on error call `showError`; always reset `isSubmitting=false`
- [ ] T015 [US2] Add `useEffect` in `src/app/register/page.tsx` — when `existingOrgId !== null` call `showInfo("You already have an organization")` then `router.push(/organization/[existingOrgId])`

---

## Phase 4: API

**Purpose**: Confirm API service layer is wired correctly and types match the backend contract.

- [ ] T016 Confirm POST `/api/v1/organizations` contract in `specs/001-organization-registration/contracts/api-contracts.md` matches `registerOrganization()` signature — request body `OrganizationRegistrationPayload`, success `201 { data: { id, name } }`, duplicate email `409`
- [ ] T017 [P] Confirm GET `/api/v1/organizations/users/{email}` contract — returns `200 { data: Organization }` when org exists, `404` when no org found; ensure `fetchOrganizationByUserEmail` does not throw on 404

---

## Phase 5: Backend

**Purpose**: Integration verification tasks — confirm actual backend behaviour matches the plan.

- [ ] T018 Manually test POST `/api/v1/organizations` with a valid payload against the dev API (`NEXT_PUBLIC_API_BASE_URL`) to confirm 201 response shape and `id` field is present in `data`
- [ ] T019 [P] Manually test GET `/api/v1/organizations/users/{email}` for a non-existent email — confirm 404 returned (not 500) so the guard fallback logic is safe

---

## Phase 6: Security

**Purpose**: Enforce RBAC guard, prevent double-submit, sanitise phone input.

- [ ] T020 [US2] Verify redirect guard fires before the form renders — `src/app/register/page.tsx` must not call `registerOrganization` or render `OrgRegistrationForm` while `isCheckingOrg=true` or when `existingOrgId !== null`
- [ ] T021 [US3] Add `inputMode="numeric"` on all phone TextFields in `OrgRegistrationForm.tsx`; strip non-digit characters in the `onChange` handler before calling the parent `onChange` prop (prevents phone injection via paste)
- [ ] T022 [US1] Verify `isSubmitting` is set to `true` before the async `registerOrganization` call and remains true until the promise resolves — confirm the Submit button cannot be clicked twice even with fast double-click
- [ ] T023 Verify no token or form payload values are logged to the console in `useOrgRegistrationForm.ts` (check `console.log`/`console.error` calls only log safe IDs)

---

## Phase 7: Testing

**Purpose**: Unit and E2E test coverage for all three user stories.

- [ ] T024 [P] [US1] Write unit test `src/app/register/_hooks/__tests__/useOrgRegistrationForm.test.ts` — renders with empty form; `handleChange` updates field and clears error; submit with missing required field shows error; valid submit calls `registerOrganization` once; API 400 calls `showError`; existing org sets `existingOrgId`
- [ ] T025 [P] [US1] Write unit test `src/app/register/_components/__tests__/OrgRegistrationForm.test.tsx` — all 9 fields render; submit button disabled when `isSubmitting=true`; inline error renders on invalid field; segments Autocomplete `onChange` fires with array value
- [ ] T026 [P] [US2] Write unit test for redirect scenario — mock `fetchOrganizationByUserEmail` to return an org; assert `router.push` called with org id and form is not rendered
- [ ] T027 [P] [US3] Write unit test for phone validation — phone number starting with `5` triggers error message; starting with `9` with 10 digits passes
- [ ] T028 Write E2E test `e2e/001-organization-registration.spec.ts` — golden path registration; submit empty form shows all required field errors; existing org admin is redirected without seeing form; duplicate email shows API error toast

---

## Phase 8: Logging

**Purpose**: Add structured console logging per the plan with no PII.

- [ ] T029 Add `console.log('[OrgReg] Checking existing org')` (no email value) on mount in `useOrgRegistrationForm.ts`; `console.log('[OrgReg] Registration submitted')` on submit; `console.log('[OrgReg] Registered, id:', data.id)` on success; `console.error('[OrgReg] Error:', error.message)` on 400 or network error — never log email, phone, or token

---

## Phase 9: Quality Gates

**Purpose**: Ensure all pre-commit checks pass before finalising.

- [ ] T030 Run `npm run type-check` — fix all TypeScript errors in `OrgRegistrationForm.tsx`, `useOrgRegistrationForm.ts`, and modified `src/app/register/page.tsx`
- [ ] T031 [P] Run `npm run lint` — fix all ESLint errors and warnings in new and modified files
- [ ] T032 Run `npm run build` — production build must complete without errors
- [ ] T033 [P] Run `npm run test` — all new unit tests must pass

---

## Phase 10: Finalization

**Purpose**: Final checks and commit.

- [ ] T034 Confirm `"use client"` directive is present on `src/app/register/page.tsx` (required for Keycloak + hooks)
- [ ] T035 [P] Confirm `src/app/register/_components/OrgRegistrationForm.tsx` and `src/app/register/_hooks/useOrgRegistrationForm.ts` have no unused imports or dead code
- [ ] T036 Commit: `feat(001): refactor org registration page with useOrgRegistrationForm hook and redirect guard`

---

## Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **UI (Phase 2)**: Depends on Setup (T001–T005)
- **Logic (Phase 3)**: Depends on Setup (T001–T005); T011 depends on T010
- **API (Phase 4)**: Depends on Setup (T001–T003); can run parallel with UI/Logic
- **Backend (Phase 5)**: Depends on API (Phase 4)
- **Security (Phase 6)**: Depends on Logic (Phase 3)
- **Testing (Phase 7)**: Depends on UI + Logic + Security
- **Logging (Phase 8)**: Depends on Logic (Phase 3)
- **Quality Gates (Phase 9)**: Depends on all implementation phases
- **Finalization (Phase 10)**: Depends on Quality Gates (Phase 9)

### Parallel Opportunities

```
After Setup:
  [Parallel] UI (T006-T009) + Logic (T010-T015) + API (T016-T017)

After Logic:
  [Parallel] Security (T020-T023) + Logging (T029)

After Implementation:
  [Parallel] T030 (type-check) + T031 (lint) + T033 (tests)
```

### Suggested MVP

Complete Phases 1–4 + Phase 6 (US1 + guard) first. Validate full registration flow. Then add testing and logging.
