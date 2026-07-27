# Tasks: Legal Expert Profile (Onboarding)

**Feature Branch**: `027-legal-expert-profile`
**Input**: `specs/027-legal-expert-profile/plan.md`, `specs/027-legal-expert-profile/spec.md`

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = Complete Addresses, US2 = Complete Personal Details, US3 = Complete Professional Details, US4 = Complete Schedule, US5 = Set Out-of-Office Dates

---

## Phase 1: Setup

**Purpose**: Create directory structure and verify prerequisites.

- [ ] T001 Create directory structure per plan.md §3: `src/app/profile/components/ProfileOnboardingStepper/`, `AddressSection/`, `PersonalDetailsSection/`, `ProfessionalDetailsSection/`, `ScheduleSection/`
- [ ] T002 [P] Create `src/app/profile/services/api.ts` — profile-scoped API service file (new module)
- [ ] T003 [P] Create directory `src/app/expert/[expertId]/schedule/` for public schedule page
- [ ] T004 [P] Confirm exact `stage` field name in `GET /api/v1/legal-experts/{expertId}` API response (risk: `stage` vs `onboardingStage` per plan.md §11)
- [ ] T005 [P] Confirm `/expert/*` routes are NOT gated by Keycloak middleware in `next.config.ts` or `middleware.ts` (risk per plan.md §11)

---

## Phase 2: UI

**Purpose**: Build all section components and stepper UI.

- [ ] T006 [US1] Create `src/app/profile/components/AddressSection/AddressCard.tsx` — displays single address (type, city, state, country, pincode); delete button; `React.memo`
- [ ] T007 [US1] Create `src/app/profile/components/AddressSection/AddressForm.tsx` — form fields: address type (dropdown), city, state, country, pincode; `useFormValidation`; used for both add and edit
- [ ] T008 [US1] Create `src/app/profile/components/AddressSection/AddressSection.tsx` — renders list of `AddressCard` components + "Add Address" button; delete guard flow per plan.md §4.2
- [ ] T009 [US2] Create `src/app/profile/components/PersonalDetailsSection/PersonalDetailsSection.tsx` — bio, languages, personal info form; save triggers stage re-fetch without stage regression
- [ ] T010 [US3] Create `src/app/profile/components/ProfessionalDetailsSection/ProfessionalDetailsSection.tsx` — portfolio multi-select from reference data; client-side uniqueness + non-empty validation; save advances stage
- [ ] T011 [US4] Create `src/app/profile/components/ScheduleSection/ScheduleSection.tsx` — weekly availability schedule form; renders `OutOfOfficeForm` for US5; save triggers stage advancement + "discoverable" banner
- [ ] T012 [US5] Create `src/app/profile/components/ScheduleSection/OutOfOfficeForm.tsx` — MUI `DatePicker` for start/end dates; inline validation errors; props `{ onSuccess: () => void }`
- [ ] T013 Create `src/app/profile/components/ProfileOnboardingStepper/ProfileOnboardingStepper.tsx` — MUI `<Stepper>` with steps: Addresses, Personal Details, Professional Details, Schedule; stage-to-index mapping; MUI `<Alert severity="success">` banner when `stage === 'Schedule'`; loading skeleton until stage fetched; props `{ currentStage: string }`
- [ ] T014 [US4] Create `src/app/expert/[expertId]/schedule/page.tsx` — public schedule page; NO Keycloak check; `next/dynamic` for schedule grid; renders `WeeklyScheduleView`; out-of-office periods shown as blocked ranges
- [ ] T015 Update `src/app/profile/page.tsx` — integrate `ProfileOnboardingStepper`; wire `ProfileContent.tsx` integration per plan.md §3

---

## Phase 3: Logic

**Purpose**: Implement hook logic, validation, and state flows.

- [ ] T016 [US1] Implement delete guard in `AddressSection.tsx` — before confirm dialog: call `checkAddressAppointments(expertId, addressId)`; if `hasActiveAppointments` → `showError("This address has active appointments. Please reschedule or cancel them before deleting.")`; else open `ConfirmDialog`
- [ ] T017 [US3] Implement portfolio validation in `ProfessionalDetailsSection.tsx` — before submit: check `new Set(portfolios).size !== portfolios.length` (duplicates) or `portfolios.some(p => !p.trim())` (empty); show error "Portfolio entries must be unique and non-empty."
- [ ] T018 [US5] Implement out-of-office date validation in `OutOfOfficeForm.tsx` using `date-fns`:
  - `isBefore(startDate, startOfDay(new Date()))` → "Start date must be today or in the future."
  - `isBefore(endDate, startDate)` → "End date must be on or after the start date."
- [ ] T019 Implement stage advancement: after any successful section save, re-fetch `fetchExpertProfile(expertId)` and update `ProfileOnboardingStepper` — stage display never regresses
- [ ] T020 [P] Add `src/app/profile/services/api.ts` functions: `fetchExpertProfile(expertId)`, `addAddress(expertId, payload)`, `updateAddress(expertId, addressId, payload)`, `deleteAddress(expertId, addressId)`, `savePersonalDetails(expertId, payload)`, `saveProfessionalDetails(expertId, payload)`, `saveSchedule(expertId, payload)`, `addOutOfOffice(expertId, payload)`

---

## Phase 4: API

**Purpose**: Wire API service to each section component.

- [ ] T021 Verify `GET /api/v1/legal-experts/{expertId}` returns `{ stage, addresses, personalDetails, professionalDetails, schedule }` in `src/app/profile/services/api.ts`
- [ ] T022 [P] Verify `POST /api/v1/legal-experts/{expertId}/addresses` → 201 with `{ data: Address }` (add `AddAddressRequest` type: type, city, state, country, pincode)
- [ ] T023 [P] Verify `PUT /api/v1/legal-experts/{expertId}/addresses/{id}` → 200 with updated address
- [ ] T024 [P] Verify `DELETE /api/v1/legal-experts/{expertId}/addresses/{id}` → 204 or 409 (active appointments); add explicit 409 handler in `AddressSection.tsx` (risk per plan.md §11)
- [ ] T025 [P] Verify `PUT /api/v1/legal-experts/{expertId}/personal-details` → 200
- [ ] T026 [P] Verify `PUT /api/v1/legal-experts/{expertId}/professional-details` → 200
- [ ] T027 [P] Verify `PUT /api/v1/legal-experts/{expertId}/schedule` → 200
- [ ] T028 Verify `POST /api/v1/legal-experts/{expertId}/out-of-office` → 201 (needs verification per plan.md §5)
- [ ] T029 Verify `GET /api/v1/legal-experts/{expertId}/schedule/public` → 200 (no auth, needs verification per plan.md §5)

---

## Phase 5: Backend

**Purpose**: Validate backend contract assumptions.

- [ ] T030 Confirm backend manages stage advancement — UI reads `stage` from API response; cannot set stage lower; verify backend ignores regressive stage values (plan.md §2.5)
- [ ] T031 [P] Confirm `DELETE /api/v1/legal-experts/{expertId}/addresses/{id}` returns 409 when active appointments exist — add 409 status code to error handler in `AddressSection.tsx`
- [ ] T032 [P] Confirm portfolio reference data endpoint path — `/api/v1/reference-data/specializations` or equivalent — needed for `ProfessionalDetailsSection` dropdown
- [ ] T033 [P] Confirm public schedule endpoint `/api/v1/legal-experts/{expertId}/schedule/public` is publicly accessible (no auth token required by backend)

---

## Phase 6: Security

**Purpose**: Enforce authentication scoping and data protection.

- [ ] T034 Verify all profile API calls in `src/app/profile/services/api.ts` are scoped to authenticated `expertId` — backend validates JWT owner matches expert
- [ ] T035 [P] Verify public schedule page (`/expert/[expertId]/schedule/page.tsx`) contains NO `initKeycloak()` or Keycloak auth check — must be publicly accessible
- [ ] T036 [P] Verify portfolio entries rendered as React text nodes in `ProfessionalDetailsSection.tsx` — no `dangerouslySetInnerHTML`
- [ ] T037 [P] Normalize all date values to UTC before submission in `OutOfOfficeForm.tsx`; display in local timezone (plan.md §11)

---

## Phase 7: Testing

**Purpose**: Unit and E2E test coverage.

- [ ] T038 [US1] Create `src/app/profile/components/AddressSection/__tests__/AddressSection.test.tsx` — tests: add address submits POST; delete with active appointments shows error toast; delete without appointments opens confirm dialog
- [ ] T039 [US2] Create `src/app/profile/components/PersonalDetailsSection/__tests__/PersonalDetailsSection.test.tsx` — tests: save personal details does not regress stage when already at Schedule
- [ ] T040 [US3] Create `src/app/profile/components/ProfessionalDetailsSection/__tests__/ProfessionalDetailsSection.test.tsx` — tests: duplicate portfolio entry shows validation error; empty portfolio entry shows validation error
- [ ] T041 [US4] [US5] Create `src/app/profile/components/ScheduleSection/__tests__/ScheduleSection.test.tsx` — tests: out-of-office past start date shows error; end date before start date shows error; schedule completion shows discoverable banner
- [ ] T042 Create `e2e/027-legal-expert-profile.spec.ts` — E2E: complete all 4 onboarding steps in one session; stage does not regress on re-edit; delete address with active appointment shows error; out-of-office past start date validation; public schedule page loads without auth; discoverable banner shown after schedule step

---

## Phase 8: Logging

**Purpose**: Instrument observability events per plan.md §10.

- [ ] T043 Add INFO log on expert profile load: `expertId`, `stage`, `requesterId` — not bio/personal content
- [ ] T044 [P] Add INFO log on address add/update: `expertId`, `addressId`, action — not full address text
- [ ] T045 [P] Add WARN log on address delete blocked (active appointments): `expertId`, `addressId`, appointment count
- [ ] T046 [P] Add INFO log on professional details save: `expertId`, portfolio item count — not portfolio content
- [ ] T047 [P] Add INFO log on schedule save: `expertId`, `newStage` — not schedule JSON
- [ ] T048 [P] Add INFO log on out-of-office period added: `expertId`, start date, end date
- [ ] T049 [P] Add INFO log on public schedule page access: `expertId`

---

## Phase 9: Quality Gates

**Purpose**: Ensure all pre-commit checks pass.

- [ ] T050 Run `npm run type-check` — zero TypeScript errors across all new files in `src/app/profile/components/`
- [ ] T051 [P] Run `npm run lint` — zero ESLint errors; no `any` types
- [ ] T052 [P] Run `npm run build` — production build succeeds; `src/app/expert/[expertId]/schedule/page.tsx` loads without SSR errors

---

## Phase 10: Finalization

**Purpose**: Polish and branch readiness.

- [ ] T053 Apply `React.memo` to `AddressCard` components to prevent re-renders when unrelated sections update (plan.md §9)
- [ ] T054 [P] Confirm stepper skeleton renders until `stage` API response is received (no flash of wrong step per plan.md §11)
- [ ] T055 [P] Confirm `next/dynamic` with `ssr: false` applied to schedule grid component in public schedule page

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: Start immediately
- **UI (Phase 2)**: Requires Phase 1 directory creation
- **Logic (Phase 3)**: Requires Phase 2 components
- **API (Phase 4)**: Can run in parallel with Phase 2
- **Backend (Phase 5)**: Can run immediately — verification only
- **Security (Phase 6)**: Requires Phase 3 complete
- **Testing (Phase 7)**: Requires Phase 2, 3, 4 complete
- **Logging (Phase 8)**: Requires Phase 3 complete
- **Quality Gates (Phase 9)**: Requires all prior phases
- **Finalization (Phase 10)**: Requires Phase 9 passing

## Total Task Count: 55
- US1 tasks: 11 | US2 tasks: 4 | US3 tasks: 6 | US4 tasks: 6 | US5 tasks: 5 | Cross-cutting: 23
