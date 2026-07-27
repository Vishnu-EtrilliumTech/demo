# Tasks: Create Case

**Input**: `specs/005-create-case/`
**Branch**: `005-create-case`

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1=Authorized user creates case, US2=OrgClerk blocked, US3=Status selection at creation

---

## Phase 1: Setup

**Purpose**: Audit existing page and API to identify exact gaps before writing code.

- [ ] T001 Read `src/app/organization/[id]/sites/[siteId]/cases/new/page.tsx` — confirm existing fields (title, description, caseNumber, cnrNumber, status, assignedToId); identify `status` field presence in form state and API payload
- [ ] T002 [P] Read `createCase()` in `src/app/organization/services/api.ts` — confirm `status` is currently omitted from the POST body (confirmed gap from plan); confirm `assignedToId` is included
- [ ] T003 [P] Verify `CaseStatus` enum in `src/app/organization/types/index.ts` includes `Open`, `InProgress`, `OnHold`, `Closed`
- [ ] T004 [P] Verify `useUserRole` exports `isOrgClerk`, `isSiteCaseClient` flags

---

## Phase 2: UI

**Purpose**: Fix the existing page and site cases area — add RBAC button gate and upgrade assignee to Autocomplete.

- [ ] T005 [US1] Replace basic `<select>` for the assigned team member in `src/app/organization/[id]/sites/[siteId]/cases/new/page.tsx` with MUI `Autocomplete` — `options={users}`, `getOptionLabel={(u) => u.fullName}`, `onChange` sets `form.assignedToId`
- [ ] T006 [US3] Verify status dropdown in `new/page.tsx` renders all four options using `STATUS_LABELS` mapping: Open→"Open", InProgress→"In Progress", OnHold→"On Hold", Closed→"Closed"; default value is `CaseStatus.Open`
- [ ] T007 [US2] Add `canCreateCase` RBAC gate to site cases tab area in `src/app/organization/[id]/sites/[siteId]/page.tsx` — render "Create Case" button only when `canCreateCase = !isOrgClerk && !isSiteCaseClient`
- [ ] T008 [US1] Add "Loading users…" disabled state to the assignee Autocomplete in `new/page.tsx` while `loadingUsers=true` during initial `fetchSiteUsers` call

---

## Phase 3: Logic

**Purpose**: Add RBAC redirect guard, fix status in payload, and wire users fetch.

- [ ] T009 [US2] Add RBAC redirect at top of `src/app/organization/[id]/sites/[siteId]/cases/new/page.tsx` — `useEffect([isOrgClerk, isSiteCaseClient])` → if either is true call `router.replace(.../sites/${siteId})`
- [ ] T010 [US3] Add `status: CaseStatus.Open` as default in form state initialisation in `new/page.tsx`; include `status` field in the `handleSubmit` payload
- [ ] T011 [US1] Verify `useEffect` in `new/page.tsx` calls `fetchSiteUsers(orgId, siteId)` on mount and populates `users` state for the Autocomplete; set `loadingUsers=false` after fetch completes
- [ ] T012 Confirm `cnrNumber` handling — if backend allows null/empty, remove `cnrNumber` from required validation check; mark it as `optional` in the form state and payload type

---

## Phase 4: API

**Purpose**: Fix `createCase()` to include `status` in the POST body.

- [ ] T013 Update `createCase()` in `src/app/organization/services/api.ts` to include `status: caseData.status` in the POST body — this is the confirmed gap (status was previously omitted from the request payload)
- [ ] T014 [P] Update `CreateCasePayload` type to include `status: CaseStatus` as a required field and `cnrNumber?: string` as optional

---

## Phase 5: Backend

**Purpose**: Verify the backend accepts `status` in case creation and the users fetch works.

- [ ] T015 Confirm POST `/api/v1/organizations/{orgId}/sites/{siteId}/cases` with `status: 'Open'` returns `201` and the case appears in subsequent GET with correct status
- [ ] T016 [P] Confirm GET `/api/v1/organizations/{orgId}/sites/{siteId}/users` returns site users in a shape compatible with the `Autocomplete` options (`id`, `fullName` fields)

---

## Phase 6: Security

**Purpose**: Enforce RBAC for case creation access and validate input.

- [ ] T017 [US2] Verify RBAC redirect fires on direct URL access — `OrganizationClerk` navigating to `/cases/new` directly must be redirected without seeing the form; `useUserRole` redirect in `useEffect` covers this
- [ ] T018 [US1] Verify `assignedToId > 0` check before submit — empty assignee (0 or undefined) must produce a validation error before API is called; `isSiteCaseClient` redirect means this role never reaches the form
- [ ] T019 Verify `maxLength` validation on `title` (200) and `caseNumber` (50) fires on blur and prevents oversized payloads

---

## Phase 7: Testing

**Purpose**: Unit and E2E coverage for all three user stories.

- [ ] T020 [P] [US1] Write unit test `specs/005-create-case/__tests__/NewCasePage.test.tsx` — form renders title, case number, status, assigned to; status defaults to Open; valid submit calls `createCase` with correct payload including `status`; success navigates to `#cases`; API error renders `<ErrorAlert>`
- [ ] T021 [P] [US3] Write unit test for status dropdown — renders exactly 4 options (Open, In Progress, On Hold, Closed); submitting without status shows error
- [ ] T022 [P] [US2] Write unit test for RBAC redirect — mock `useUserRole` to `isOrgClerk=true`; assert `router.replace` called; form not rendered; same for `isSiteCaseClient=true`
- [ ] T023 [P] [US1] Write unit test for users fetch failure — mock `fetchSiteUsers` to reject; assert `users=[]` and Autocomplete still renders (no crash)
- [ ] T024 Write E2E test `e2e/005-create-case.spec.ts` — SiteClerk creates case golden path; submit without required fields shows inline errors; OrgClerk cannot see "Create Case" button; status dropdown shows all 4 options; new case appears in list

---

## Phase 8: Logging

**Purpose**: Structured logging per plan section 10.

- [ ] T025 Add `console.error(error)` before `setApiErrors` in `handleSubmit` on 4xx response in `new/page.tsx` (do not log title or case content); add `console.warn('[CreateCase] Unauthorized redirect')` on RBAC redirect — no PII

---

## Phase 9: Quality Gates

**Purpose**: Pre-commit checks must pass.

- [ ] T026 Run `npm run type-check` — fix TypeScript errors in `new/page.tsx`, `api.ts`, updated `CreateCasePayload` type
- [ ] T027 [P] Run `npm run lint` — fix all ESLint warnings
- [ ] T028 Run `npm run build` — production build passes
- [ ] T029 [P] Run `npm run test` — all new unit tests pass

---

## Phase 10: Finalization

**Purpose**: Final review and commit.

- [ ] T030 Verify `isSiteCaseClient` flag exists in `useUserRole.ts` — add if missing (plan flags this as a potential risk)
- [ ] T031 [P] Verify the "Create Case" button in the site cases tab area is hidden (not just disabled) for OrgClerk and SiteCaseClient — inspect rendered DOM in tests
- [ ] T032 Commit: `feat(005): add status to createCase payload; RBAC gate on Create Case button and redirect guard on form`

---

## Dependencies

- **Setup (Phase 1)**: Start immediately — read-only audit
- **UI (Phase 2)**: Depends on T001–T004; T005 depends on T002 (users fetch exists)
- **Logic (Phase 3)**: Depends on T001–T004; T010 depends on T003
- **API (Phase 4)**: Depends on T001–T002 (confirmed gaps); can run parallel with UI
- **Security (Phase 6)**: Depends on Logic (Phase 3)
- **Testing (Phase 7)**: Depends on all implementation phases

### Parallel Opportunities

```
After Setup:
  [Parallel] UI (T005-T008) + Logic (T009-T012) + API (T013-T014)

After Implementation:
  [Parallel] T026 (type-check) + T027 (lint) + T029 (tests)
  [Parallel] T020 + T021 + T022 + T023 (unit tests)
```
