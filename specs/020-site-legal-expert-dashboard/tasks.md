# Tasks: Site Legal Expert Dashboard

**Feature**: `020-site-legal-expert-dashboard`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Status**: Everything new — no dashboard page, components, or hooks exist yet.

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1]**: View Assigned Cases on Dashboard (P1)
- **[US2]**: View Assigned Tasks on Dashboard (P2)
- **[US3]**: View Upcoming Hearings on Dashboard (P3)
- **[US4]**: Quick Navigation from Dashboard (P4)

---

## Phase 1: Setup

**Purpose**: Verify data source API and create directory structure.

- [ ] T001 Verify `fetchUserCaseSummary(orgId, siteId, userId)` in `src/app/organization/services/api.ts` — confirm exact signature and response shape: `{ data: { cases: CaseSummary[], caseTasks: CaseTask[], caseHearings: Hearing[] } }`
- [ ] T002 [P] Confirm `CaseSummary`, `CaseTask`, `Hearing` types are defined in `src/app/organization/types/` — add if missing
- [ ] T003 [P] Create directory: `src/app/organization/[id]/sites/[siteId]/dashboard/` with subdirs `components/MyCasesSection/`, `components/MyTasksSection/`, `components/UpcomingHearingsSection/`, `hooks/`

**Checkpoint**: API and types confirmed — begin building

---

## Phase 2: UI

**Purpose**: Build all dashboard page and section components.

- [ ] T004 [US1] Create `src/app/organization/[id]/sites/[siteId]/dashboard/components/MyCasesSection/CaseDashboardCard.tsx` — props: `{ case: CaseSummary, onClick: () => void }`; shows title, case number, MUI `Chip` status badge, "Last updated: {date}"; apply `React.memo`
- [ ] T005 [US1] Create `src/app/organization/[id]/sites/[siteId]/dashboard/components/MyCasesSection/MyCasesSection.tsx` — props: `{ cases: CaseSummary[], orgId, siteId, loading }`; MUI `Grid container spacing={2}` with 3 columns; empty state: "No cases assigned to you yet." when `cases.length === 0`; `<LoadingState />` when `loading`
- [ ] T006 [US2] Create `src/app/organization/[id]/sites/[siteId]/dashboard/components/MyTasksSection/TaskDashboardRow.tsx` — props: `{ task: CaseTask, onClick: () => void }`; shows task title, case name, due date, status badge; overdue detection: `task.status !== "Closed" && new Date(task.dueDate) < new Date()` → due date text `<Typography color="error">`; apply `React.memo`
- [ ] T007 [US2] Create `src/app/organization/[id]/sites/[siteId]/dashboard/components/MyTasksSection/MyTasksSection.tsx` — props: `{ tasks: CaseTask[], orgId, siteId, loading }`; list of `TaskDashboardRow`; empty state: "No tasks assigned to you."; `<LoadingState />` when `loading`
- [ ] T008 [US3] Create `src/app/organization/[id]/sites/[siteId]/dashboard/components/UpcomingHearingsSection/HearingDashboardRow.tsx` — props: `{ hearing: Hearing, onClick: () => void }`; shows hearing date/time (formatted), location, case name; apply `React.memo`
- [ ] T009 [US3] Create `src/app/organization/[id]/sites/[siteId]/dashboard/components/UpcomingHearingsSection/UpcomingHearingsSection.tsx` — props: `{ hearings: Hearing[], orgId, siteId, loading }`; list of `HearingDashboardRow` sorted ascending; empty state: "No upcoming hearings in your site."
- [ ] T010 Create all `index.ts` barrel exports for each section component directory
- [ ] T011 Create `src/app/organization/[id]/sites/[siteId]/dashboard/page.tsx` — root dashboard page (`"use client"`); three stacked sections (`MyCasesSection`, `MyTasksSection`, `UpcomingHearingsSection`) with section headers; RBAC check on mount; redirect to access denied if not `SiteLegalExpert` or `SiteSrLegalExpert`

**Checkpoint**: All dashboard UI renderable — verify visually

---

## Phase 3: Logic

**Purpose**: Build `useDashboard` hook and navigation handlers.

- [ ] T012 Create `src/app/organization/[id]/sites/[siteId]/dashboard/hooks/useDashboard.ts` — params: `orgId: string, siteId: string, userId: string`; returns `{ cases, tasks, hearings, loading, error }`; single call to `fetchUserCaseSummary(orgId, siteId, userId)` on mount; post-processes hearings: filter `date > now`, sort ascending by `hearingDateTime`
- [ ] T013 [US4] Implement click navigation in `CaseDashboardCard`: `router.push(\`/organization/{orgId}/sites/{siteId}/cases/{caseId}\`)`
- [ ] T014 [US4] Implement click navigation in `TaskDashboardRow`: `router.push` to case detail tasks tab (using `caseId` from task)
- [ ] T015 [US4] Implement click navigation in `HearingDashboardRow`: `router.push` to case detail hearings tab
- [ ] T016 [US5] Implement RBAC guard in `page.tsx`: `useUserRole(orgId)` → if NOT `isSiteLegalExpert` AND NOT `isSiteSrLegalExpert` → redirect to access denied (use `router.replace`)

**Checkpoint**: Full dashboard data flow working

---

## Phase 4: API

**Purpose**: Confirm existing API endpoint sufficiency (no new API needed).

- [ ] T017 Verify `fetchUserCaseSummary` URL includes `siteId`: `GET /organizations/{orgId}/sites/{siteId}/users/{userId}/cases/summary` — update if existing function uses old URL without `siteId`
- [ ] T018 Confirm response includes `caseHearings` field (not just `cases` and `caseTasks`) — no second API call needed for hearings
- [ ] T019 Note: hearing filtering and sorting is done client-side in `useDashboard` — no additional API parameters needed

---

## Phase 5: Backend

**Purpose**: Document backend integration requirements (verification only).

- [ ] T020 Confirm `GET /organizations/{orgId}/sites/{siteId}/users/{userId}/cases/summary` is scoped to the user's assigned site — backend validates site membership
- [ ] T021 Confirm `userId` in URL is validated against JWT `sub` claim — OrgAdmin viewing another user's dashboard passes `userId` query param; backend validates OrgAdmin role
- [ ] T022 Confirm response includes enough fields for `CaseDashboardCard`: `id`, `title`, `caseNumber`, `status`, `updatedAt`

---

## Phase 6: Security

**Purpose**: Enforce all security requirements from plan.md §6.

- [ ] T023 Verify RBAC guard on dashboard page: `SiteCaseClient` navigating to `/dashboard` URL → redirected (not just shows empty page)
- [ ] T024 Verify `userId` in `fetchUserCaseSummary` call is derived from Keycloak token (`tokenParsed.sub`), not from URL or user input
- [ ] T025 Verify hearing sort is `hearingDateTime` ascending (matches backend sort if applicable)
- [ ] T026 Verify `OrganizationAdmin` viewing another user's dashboard via `?userId=` passes correct `userId` from that user's profile — not the admin's own ID

---

## Phase 7: Testing

**Purpose**: Build all unit tests and E2E tests from plan.md §8.

- [ ] T027 [P] [US1] Create `src/app/organization/[id]/sites/[siteId]/dashboard/__tests__/MyCasesSection.test.tsx`:
  - No cases → EmptyState text visible
  - Cases array → card count matches array length
  - Case card click → `router.push` mock invoked
- [ ] T028 [P] [US2] Create `src/app/organization/[id]/sites/[siteId]/dashboard/__tests__/MyTasksSection.test.tsx`:
  - Task with past due date (not Closed) → `Typography color="error"` rendered
  - Closed task past due → no error color
  - No tasks → EmptyState visible
- [ ] T029 [P] [US3] Add tests for `UpcomingHearingsSection` in same test file or separate `__tests__/UpcomingHearingsSection.test.tsx`:
  - Past hearing → not rendered in list
  - Hearings sorted ascending by date
- [ ] T030 Create `e2e/020-site-legal-expert-dashboard.spec.ts` with all 8 E2E scenarios from plan.md §8: golden path load, cases populated, overdue task highlighted, navigate from case card, navigate from task row, empty sections, SiteCaseClient access denied, cross-site blocked

**Checkpoint**: All tests written — run `npm run test` to verify unit tests pass

---

## Phase 8: Logging

**Purpose**: Add structured logging per plan.md §10.

- [ ] T031 Add `console.info` in `useDashboard` on successful data load: log `{ userId, siteId, caseCount: cases.length, taskCount: tasks.length, hearingCount: hearings.length }` — do NOT log case/task content
- [ ] T032 Add `console.error` in `useDashboard` on fetch failure: log `{ userId, siteId, httpStatus }`
- [ ] T033 Add `console.warn` in dashboard page RBAC guard on unauthorized role access: log `{ userId, role, siteId }`
- [ ] T034 Add `console.info` on navigation from dashboard: log `{ userId, entityType: 'case' | 'task' | 'hearing', entityId }`

---

## Phase 9: Quality Gates

**Purpose**: Ensure code quality before finalization.

- [ ] T035 [P] Run `npm run type-check` — fix TypeScript errors in all new dashboard files
- [ ] T036 [P] Run `npm run lint` — fix ESLint errors; verify `React.memo` usage is correct
- [ ] T037 Run `npm run test` — confirm all new unit tests pass
- [ ] T038 Run `npm run build` — confirm production build passes

---

## Phase 10: Finalization

**Purpose**: Confirm all spec requirements are satisfied.

- [ ] T039 Verify SC-001: dashboard loads within 3 seconds — single API call, `<LoadingState />` per section during fetch
- [ ] T040 Verify SC-002: overdue tasks visually distinct — red due date text for 100% of overdue tasks; closed past-due tasks not highlighted
- [ ] T041 Verify SC-003: all dashboard items clickable and navigate to correct detail pages
- [ ] T042 Verify SC-004: zero cross-site data on dashboard — confirm cases, tasks, hearings all belong to user's assigned site

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: Start immediately — T001–T002 type/API verification required first
- **Phase 2 (UI)**: Depends on Phase 1; T004–T010 largely parallel (different component files); T011 (page) depends on all sections
- **Phase 3 (Logic)**: T012 `useDashboard` depends on Phase 1 API confirmation; T013–T016 depend on Phase 2 components
- **Phase 4 (API)**: Verification only — runs in parallel with Phase 2
- **Phase 5 (Backend)**: Independent — run in parallel
- **Phase 6 (Security)**: Depends on Phases 2–3
- **Phase 7 (Testing)**: Depends on Phases 2–3
- **Phase 8 (Logging)**: Parallel with Phase 7
- **Phase 9 (Quality Gates)**: Depends on Phases 7–8
- **Phase 10 (Finalization)**: Depends on Phase 9
