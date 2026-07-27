# Tasks: Legal Expert — Registration Stage, Portfolios & Cases

**Feature**: `023-legal-expert-stage-portfolios-cases`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Status**: Everything new — three feature groups: onboarding progress, public expert types, and personal case CRUD.

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1]**: Onboarding Stage Progress (P1)
- **[US2]**: Browse Expert Types and Portfolios (P2)
- **[US3]**: Expert Manages Personal Case List (P3)

---

## Phase 1: Setup

**Purpose**: Define types, create API service scaffolds, and create directory structure.

- [ ] T001 Create `src/app/organization/types/expertCases.ts` — define `ExpertPersonalCase`, `ExpertType`, `Portfolio`, `RegistrationStage` (`"Registration" | "PersonalDetails" | "ProfessionalDetails" | "Schedule"`), `CreatePersonalCaseRequest`, `UpdatePersonalCaseRequest`
- [ ] T002 [P] Create `src/app/organization/services/expertCasesApi.ts` scaffold — empty exported functions: `fetchExpertPersonalCases`, `createExpertPersonalCase`, `updateExpertPersonalCase`, `deleteExpertPersonalCase`
- [ ] T003 [P] Create `src/app/organization/services/expertStageApi.ts` scaffold — empty exported functions: `fetchExpertRegistrationStage`, `fetchExpertTypes`
- [ ] T004 [P] Create directory structure:
  - `src/app/expert-types/page.tsx`
  - `src/app/expert-types/components/ExpertTypeCard.tsx`
  - `src/app/expert/[expertId]/profile/components/OnboardingProgress/`
  - `src/app/expert/[expertId]/cases/page.tsx`
  - `src/app/expert/[expertId]/cases/components/`
  - `src/app/expert/[expertId]/cases/hooks/usePersonalCases.ts`

**Checkpoint**: Types and structure in place — begin building

---

## Phase 2: UI

**Purpose**: Build all three feature group UI components.

**Group 1 — Registration Stage**
- [ ] T005 [US1] Create `src/app/expert/[expertId]/profile/components/OnboardingProgress/OnboardingProgress.tsx` — MUI `<Stepper orientation="horizontal" activeStep={stepIndex}>`; step labels: Registration, Personal Details, Professional Details, Schedule; completion banner when `stage === "Schedule"`: `<Alert severity="success">Your profile is complete. You are now discoverable in search.</Alert>`; step index read-only (no backward navigation)
- [ ] T006 [US1] Create `src/app/expert/[expertId]/profile/components/OnboardingProgress/index.ts` barrel export

**Group 2 — Expert Types (public)**
- [ ] T007 [US2] Create `src/app/expert-types/components/ExpertTypeCard.tsx` — expandable MUI `Accordion` or `Card`; shows expert type name and description; expands to list portfolio sub-specializations; no auth required
- [ ] T008 [US2] Create `src/app/expert-types/page.tsx` — Next.js Server Component (no `"use client"`); fetches expert types server-side via `fetchExpertTypes()`; renders grid/list of `ExpertTypeCard` components; no auth token sent (public endpoint)

**Group 3 — Personal Cases**
- [ ] T009 [US3] Create `src/app/expert/[expertId]/cases/components/PersonalCaseCard.tsx` — shows: title, case number, status `Chip`, created date; clickable → navigates to case detail or opens edit modal
- [ ] T010 [US3] Create `src/app/expert/[expertId]/cases/components/AddPersonalCaseModal.tsx` — MUI `Dialog`; fields: title (required), case number (required), description (optional), status (required, dropdown: same enum as org cases); validation via `useFormValidation`
- [ ] T011 [US3] Create `src/app/expert/[expertId]/cases/components/EditPersonalCaseModal.tsx` — same as `AddPersonalCaseModal` but pre-fills current `ExpertPersonalCase` values
- [ ] T012 [US3] Create `src/app/expert/[expertId]/cases/page.tsx` — PersonalCasesPage (`"use client"`); Keycloak auth guard; RBAC guard: only `LegalIndividualExpert` (own cases) or `SystemAdmin`; renders list of `PersonalCaseCard`; "Add Case" button; `AddPersonalCaseModal` + `EditPersonalCaseModal`; delete via shared `ConfirmDialog`; empty state: "You haven't added any personal cases yet."

**Checkpoint**: All UI components renderable — verify visually

---

## Phase 3: Logic

**Purpose**: Build all hooks and business logic.

- [ ] T013 [US1] Create component-level data fetch in `OnboardingProgress.tsx` — `useEffect` calls `fetchExpertRegistrationStage(expertId)` on mount; stage mapped to step index: `Registration=0, PersonalDetails=1, ProfessionalDetails=2, Schedule=3`; `loading` state shows `CircularProgress`
- [ ] T014 [US3] Create `src/app/expert/[expertId]/cases/hooks/usePersonalCases.ts` — state: `cases`, `loading`, `submitting`, `addModalOpen`, `editModalOpen`, `deleteModalOpen`, `caseToEdit`, `caseToDelete`; methods: `fetchCases()`, `createCase()`, `updateCase()`, `deleteCase()`
- [ ] T015 [US3] Implement `createCase` in `usePersonalCases` — calls `createExpertPersonalCase(expertId, payload)`; on 201 appends case to list; calls `showSuccess`; closes modal
- [ ] T016 [US3] Implement `updateCase` in `usePersonalCases` — calls `updateExpertPersonalCase(expertId, caseId, payload)`; on 200 updates case in list; calls `showSuccess`; closes modal
- [ ] T017 [US3] Implement `deleteCase` in `usePersonalCases` — requires `ConfirmDialog` confirmation before API call; on 204 removes case from list; calls `showSuccess`
- [ ] T018 [US3] Implement RBAC guard in `PersonalCasesPage` — `expertId` from URL params must match `keycloak.tokenParsed.sub` OR user must be SystemAdmin; otherwise show access denied

**Checkpoint**: All hooks implemented — wire to components

---

## Phase 4: API

**Purpose**: Implement all API service functions.

- [ ] T019 Implement all functions in `src/app/organization/services/expertCasesApi.ts`:
  - `fetchExpertPersonalCases(expertId: string)` → `GET /api/v1/legalexperts/{expertId}/cases`
  - `createExpertPersonalCase(expertId: string, payload: CreatePersonalCaseRequest)` → `POST /api/v1/legalexperts/{expertId}/cases` returns `ExpertPersonalCase` on 201
  - `updateExpertPersonalCase(expertId: string, caseId: string, payload: UpdatePersonalCaseRequest)` → `PUT /api/v1/legalexperts/{expertId}/cases/{caseId}`
  - `deleteExpertPersonalCase(expertId: string, caseId: string)` → `DELETE /api/v1/legalexperts/{expertId}/cases/{caseId}` — expects 204
- [ ] T020 Implement all functions in `src/app/organization/services/expertStageApi.ts`:
  - `fetchExpertRegistrationStage(expertId: string)` → `GET /api/v1/legalexperts/{expertId}/stage`; returns `{ data: { stage: RegistrationStage } }`
  - `fetchExpertTypes()` → `GET /api/v1/expertTypes` — no auth header (public endpoint); returns `ExpertType[]`
- [ ] T021 All personal case functions use `httpServices` (Bearer token); `fetchExpertTypes` uses plain `fetch` or `httpServices` without auth header for public access
- [ ] T022 All functions handle errors via `errorHandler.ts`; expert personal case 403 → show access denied, not generic error

**Checkpoint**: All API functions implemented and typed

---

## Phase 5: Backend

**Purpose**: Confirm backend contract — all endpoints are NEW (coordinate with backend team).

- [ ] T023 Confirm `GET /api/v1/legalexperts/{expertId}/stage` endpoint exists and returns `{ stage: "Registration" | "PersonalDetails" | "ProfessionalDetails" | "Schedule" }` — BLOCK frontend work on US1 until confirmed
- [ ] T024 Confirm `GET /api/v1/expertTypes` is a public endpoint (no `[Authorize]` attribute) — BLOCK frontend work on US2 until confirmed
- [ ] T025 Confirm `GET|POST|PUT|DELETE /api/v1/legalexperts/{expertId}/cases` endpoints exist — BLOCK frontend work on US3 until confirmed
- [ ] T026 Confirm personal cases endpoint URL does NOT conflict with org/site cases — separate namespace `/legalexperts/{expertId}/cases` vs `/organizations/{orgId}/sites/{siteId}/cases`
- [ ] T027 Confirm `ExpertPersonalCase` status enum values — check if they reuse `CaseStatus` or need a separate enum

---

## Phase 6: Security

**Purpose**: Enforce all security requirements from plan.md §6.

- [ ] T028 [US3] Verify `PersonalCasesPage` RBAC guard: `expertId` in URL compared to `keycloak.tokenParsed.sub`; access denied on mismatch (show error, not empty page)
- [ ] T029 [US2] Verify `ExpertTypesPage` is a Server Component with no auth token in the `fetchExpertTypes` call — unauthenticated access must work
- [ ] T030 [US1] Verify `OnboardingProgress` stepper has no backward navigation UI — `activeStep` is read-only, derived from API response only
- [ ] T031 [US3] Verify `ConfirmDialog` appears before `deleteExpertPersonalCase` API call — delete cannot be triggered without explicit user confirmation
- [ ] T032 [P] Verify personal cases never appear in org/site case search — separate URL namespace and separate API endpoint; no shared query or filter

---

## Phase 7: Testing

**Purpose**: Build all unit tests and E2E tests from plan.md §8.

- [ ] T033 [P] [US1] Create `src/app/expert/[expertId]/profile/components/OnboardingProgress/__tests__/OnboardingProgress.test.tsx`:
  - Stage = "Registration" → step 0 active in Stepper
  - Stage = "Schedule" → `<Alert>` completion banner in DOM
  - Stage = "PersonalDetails" → step 1 active
- [ ] T034 [P] [US3] Create `src/app/expert/[expertId]/cases/components/__tests__/PersonalCasesPage.test.tsx`:
  - Cases loaded → `PersonalCaseCard` count matches
  - No cases → empty state text visible
  - Add case → `createExpertPersonalCase` API mock invoked
  - Delete → `ConfirmDialog` visible before API call
  - Access by non-owner → access denied text shown
- [ ] T035 Create `e2e/023-legal-expert-stage-portfolios-cases.spec.ts` with all 7 E2E scenarios from plan.md §8: view onboarding progress, completion message, browse expert types unauthenticated, add personal case, edit personal case, delete personal case, cross-expert access blocked

**Checkpoint**: All tests written — run `npm run test` to verify unit tests pass

---

## Phase 8: Logging

**Purpose**: Add structured logging per plan.md §10.

- [ ] T036 [US1] Add `console.info` in `OnboardingProgress` on stage fetch: log `{ expertId, stage }`
- [ ] T037 [US2] Add `console.info` in `ExpertTypesPage` on types fetch: log `{ count: expertTypes.length }`
- [ ] T038 [US3] Add `console.info` in `usePersonalCases` on `createCase` success: log `{ expertId, caseId, status }` — do NOT log description
- [ ] T039 [US3] Add `console.info` in `usePersonalCases` on `updateCase` success: log `{ expertId, caseId, changedFields: Object.keys(payload) }` — do NOT log values
- [ ] T040 [US3] Add `console.info` in `usePersonalCases` on `deleteCase` success: log `{ expertId, caseId }`
- [ ] T041 Add `console.warn` in `PersonalCasesPage` on cross-expert access attempt: log `{ requesterId: tokenSub, targetExpertId: expertIdFromUrl }`

---

## Phase 9: Quality Gates

**Purpose**: Ensure code quality before finalization.

- [ ] T042 [P] Run `npm run type-check` — fix TypeScript errors in all new files under `src/app/expert/`, `src/app/expert-types/`, and new service files
- [ ] T043 [P] Run `npm run lint` — fix ESLint errors; verify Server Component (`ExpertTypesPage`) has no `"use client"` directive
- [ ] T044 Run `npm run test` — confirm all new unit tests pass
- [ ] T045 Run `npm run build` — confirm production build passes; verify `ExpertTypesPage` renders as Server Component without client-side auth errors

---

## Phase 10: Finalization

**Purpose**: Confirm all spec requirements are satisfied.

- [ ] T046 Verify SC-001: onboarding indicator is accurate on every page load — reflects current stage from API (no stale cache)
- [ ] T047 Verify SC-002: Expert Types page loads without authentication — open in incognito browser; page shows in under 2 seconds
- [ ] T048 Verify SC-003: expert can create and manage own cases in under 2 minutes per case
- [ ] T049 Verify SC-004: personal cases never appear in org/site case lists — check case search in org context; expert's personal cases should not appear
- [ ] T050 Verify "discoverable in search" message shows only at Schedule stage — not at Registration, PersonalDetails, or ProfessionalDetails

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: Start immediately — T001–T004 required before all other phases
- **Phase 2 (UI)**: Three independent groups (T005–T006, T007–T008, T009–T012) can run in parallel
- **Phase 3 (Logic)**: T013–T018 depend on Phase 4 API functions and Phase 2 components
- **Phase 4 (API)**: Depends on T001 (types); T019–T022 can build in parallel with Phase 2
- **Phase 5 (Backend)**: CRITICAL — backend endpoints are all NEW; confirm before frontend builds for each user story
- **Phase 6 (Security)**: Depends on Phases 2–3
- **Phase 7 (Testing)**: Depends on Phases 2–4 (and Phase 5 confirmation)
- **Phase 8 (Logging)**: Parallel with Phase 7
- **Phase 9 (Quality Gates)**: Depends on Phases 7–8
- **Phase 10 (Finalization)**: Depends on Phase 9
