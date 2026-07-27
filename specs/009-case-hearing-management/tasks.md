# Tasks: Case Hearing Management

**Input**: `specs/009-case-hearing-management/`
**Branch**: `009-case-hearing-management`

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1=View upcoming hearings site-wide, US2=Schedule hearing on case, US3=Update and delete hearings

---

## Phase 1: Setup

**Purpose**: Audit existing components to identify exact RBAC gaps before writing fixes.

- [ ] T001 Read `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/HearingsTab/HearingsTab.tsx` — audit every Schedule/Edit/Delete button for `{!isSiteCaseClient && ...}` conditional render; list missing guards
- [ ] T002 [P] Read `src/app/organization/[id]/sites/[siteId]/hearings/page.tsx` — verify `canScheduleHearings` prop gates Schedule/Edit/Delete buttons; confirm OrgClerk sees list but has no write controls; verify `canViewHearings` check exists
- [ ] T003 [P] Verify `fetchCaseHearings`, `addCaseHearing`, `updateCaseHearing`, `deleteCaseHearing` in `src/app/organization/services/caseapi.ts` and `fetchSiteHearings` in `src/app/organization/services/api.ts` all exist
- [ ] T004 [P] Verify `HearingStatus` enum in `src/app/organization/types/caseindex.ts` and confirm `useCaseHearings.ts` hook manages all 8 status values

---

## Phase 2: UI

**Purpose**: Fix any missing RBAC guards on action buttons in HearingsTab and site hearings page.

- [ ] T005 [US2] Add `{!isSiteCaseClient && <Button>Schedule Hearing</Button>}` guard in `HearingsTab.tsx` if missing — SiteCaseClient must see read-only hearing list with no write controls (FR-005)
- [ ] T006 [US2] Add `{!isSiteCaseClient && <IconButton>Edit</IconButton>}` guard on each hearing row in `HearingsTab.tsx` if missing
- [ ] T007 [US3] Add `{!isSiteCaseClient && <IconButton>Delete</IconButton>}` guard on each hearing row in `HearingsTab.tsx` if missing
- [ ] T008 [US1] Add `{canScheduleHearings && <Button>Schedule Hearing</Button>}` guard in `src/app/organization/[id]/sites/[siteId]/hearings/page.tsx` if missing — OrgClerk has `canViewHearings=true` but `canScheduleHearings=false`
- [ ] T009 [US1] Verify `EmptyState` component renders with message "No upcoming hearings scheduled" when hearings list is empty in both `HearingsTab.tsx` and site hearings `page.tsx` (FR-008)

---

## Phase 3: Logic

**Purpose**: Confirm hearing form validation, date handling, and filter logic.

- [ ] T010 [US2] Verify `useCaseHearings.ts` uses `useFormValidation` with schema requiring: `hearingDateTime` (required, past dates accepted without error — no future-date check), `location` (required), `assignedToId` (required, > 0)
- [ ] T011 [US1] Verify site hearings page in `hearings/page.tsx` fetches `fetchSiteHearings(orgId, siteId)` on mount and displays hearings ordered ascending by date (server-side ordering); client-side sort not required
- [ ] T012 [US3] Verify delete in `useCaseHearings.ts` routes through a `DeleteConfirmationModal` before calling `deleteCaseHearing` — direct deletion without dialog must not be possible (FR-007)
- [ ] T013 [US2] Verify `formatHearingDate` or equivalent utility is used consistently for `hearingDateTime` display — no raw `new Date()` without locale formatting

---

## Phase 4: API

**Purpose**: Confirm all hearing API functions match the expected contract.

- [ ] T014 [P] Confirm POST `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/hearings` accepts `AddCaseHearingRequest` with past date and returns `201 { data: CaseHearing }`
- [ ] T015 [P] Confirm GET `/api/v1/organizations/{orgId}/sites/{siteId}/hearings` returns future hearings ordered ascending by `hearingDateTime` (server-side, not client-sorted)

---

## Phase 5: Backend

**Purpose**: Verify backend enforces role restrictions on hearing write operations.

- [ ] T016 Confirm POST `...cases/{caseId}/hearings` with `SiteCaseClient` Bearer token returns `403` — backend enforces independently of frontend guard
- [ ] T017 [P] Confirm OrgClerk cannot POST to case hearings endpoint (should return `403`) — OrgClerk has read access to site-level hearings via a separate endpoint but not case-level write access

---

## Phase 6: Security

**Purpose**: Confirm all write controls are hidden and past dates are accepted.

- [ ] T018 [US2] Verify `SiteCaseClient` has zero visible write controls in `HearingsTab` — Add/Edit/Delete buttons absent from DOM in unit tests
- [ ] T019 [US1] Verify `OrgClerk` sees the site hearings list but has no Schedule/Edit/Delete buttons — `canScheduleHearings=false` for OrgClerk confirmed in `useUserRole`
- [ ] T020 [US2] Verify no frontend validation rejects past hearing dates — `hearingDateTime` field validation only checks `required`, not `isAfter(today)`; confirm schedule form does not have a min-date constraint

---

## Phase 7: Testing

**Purpose**: Unit and E2E coverage for all three user stories.

- [ ] T021 [P] [US2] Write unit test `HearingsTab/__tests__/HearingsTab.test.tsx` — SiteAdmin: Schedule button visible; SiteCaseClient: Schedule/Edit/Delete hidden; empty hearing list: EmptyState rendered; Delete click: confirmation dialog opens; past date submitted: no validation error
- [ ] T022 [P] [US1] Write unit test `hearings/__tests__/SiteHearingsPage.test.tsx` — OrgClerk: list visible, no Schedule button; SiteAdmin: list and Schedule button visible; empty list: EmptyState message shown
- [ ] T023 [P] [US1] Write unit test `hooks/__tests__/useCaseHearings.test.ts` — `addCaseHearing` success appends hearing; past date submitted without validation error
- [ ] T024 Write E2E test `e2e/009-case-hearing-management.spec.ts` — SiteAdmin views upcoming hearings; OrgClerk sees read-only site hearings; SiteClerk schedules hearing; SiteCaseClient sees read-only hearings tab; past hearing date accepted; SiteAdmin deletes hearing with confirmation

---

## Phase 8: Logging

**Purpose**: Structured logging per plan section 10.

- [ ] T025 Verify `useCaseHearings.ts` and `hearings/page.tsx` log: hearing scheduled (caseId, hearingId, status — not location/notes); hearing deleted (hearingId — not location); API errors (HTTP status — not token); `console.warn` for SiteCaseClient/OrgClerk write attempts blocked — no PII

---

## Phase 9: Quality Gates

**Purpose**: Pre-commit checks must pass.

- [ ] T026 Run `npm run type-check` — fix TypeScript errors in modified `HearingsTab.tsx` and `hearings/page.tsx`
- [ ] T027 [P] Run `npm run lint` — fix all ESLint warnings
- [ ] T028 Run `npm run build` — production build passes
- [ ] T029 [P] Run `npm run test` — all new unit tests pass

---

## Phase 10: Finalization

**Purpose**: Final review and commit.

- [ ] T030 Confirm all 8 `HearingStatus` values are mapped to distinct colors in `STATUS_STYLES` in `HearingsTab.tsx` and site hearings page — no status renders as plain text without a colored chip
- [ ] T031 [P] Confirm `formatHearingDate` is used everywhere `hearingDateTime` is displayed — search codebase for raw `new Date(hearing.hearingDateTime)` calls and replace with the utility
- [ ] T032 Commit: `feat(009): fix SiteCaseClient and OrgClerk RBAC guards in HearingsTab and site hearings page; add hearing unit and E2E tests`

---

## Dependencies

- **Setup (Phase 1)**: Start immediately — audit only
- **UI (Phase 2)**: Depends on T001–T002 audit findings; tasks may be no-ops
- **Logic (Phase 3)**: Depends on T004 audit
- **API (Phase 4)**: Parallel — verification only
- **Security (Phase 6)**: Depends on UI + Logic fixes
- **Testing (Phase 7)**: Depends on all implementation phases

### Parallel Opportunities

```
After Setup:
  [Parallel] UI fixes (T005-T009) + Logic verification (T010-T013) + API check (T014-T015)

After Implementation:
  [Parallel] T021 + T022 + T023 (unit test files)
  [Parallel] T026 (type-check) + T027 (lint) + T029 (tests)
```

### Note on Scope

Most work is verification and gap-filling. If RBAC guards already exist for both `SiteCaseClient` in `HearingsTab` and `canScheduleHearings` in site hearings page, the primary deliverables are the unit tests (T021–T023) and E2E test (T024).
