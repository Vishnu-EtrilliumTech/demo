---
description: "Task list for Case Access Control & Contributors (frontend)"
---

# Tasks: Case Access Control & Contributors

**Input**: Design documents from `/specs/033-case-access-contributors/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/contributors-api.md, contracts/access-ladder.md, quickstart.md

**Tests**: INCLUDED — the spec/plan explicitly request them (Constitution III): Vitest unit tests for the access-ladder pure function and Playwright E2E for the Contributors tab.

**Organization**: Tasks are grouped by user story (P1 → P3) to enable independent implementation and testing. This is a frontend-only feature (backend already delivered).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1–US4)
- File paths use the literal Next.js route segment names (`[id]`, `[siteId]`, `[caseId]`)

## Path Conventions

- Single Next.js frontend project; all source under `src/` at repository root
- Case detail route: `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/`
- Shared hooks: `src/hooks/`; shared modals: `src/components/modals/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm environment and locate target files before edits

- [ ] T001 Point `NEXT_PUBLIC_API_BASE_URL` in `.env` at a backend with the contributors feature deployed (e.g. `https://dev2.lawsome.in`) and confirm `npm run dev` boots, per [quickstart.md](quickstart.md) Prerequisites
- [X] T002 [P] Verify baseline gates pass before changes: run `npm run type-check`, `npm run lint`, `npm run test` and record a clean baseline

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, service layer, and the cross-cutting access-ladder hook that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Extend types in `src/app/organization/types/caseindex.ts`: add `ContributorAccessLevel` enum (`ViewOnly=0, Edit=1`), `CaseAccessLevel` enum (`None=0, View=1, Edit=2, Full=3`), `CaseContributor`, `AddCaseContributorRequest`, `UpdateCaseContributorRequest`, `CaseContributorResponse`, `CaseContributorsListResponse`, and `CaseAccess` interfaces per [data-model.md](data-model.md)
- [X] T004 [US4] Add optional `newAssigneeContributorAccessLevel?: ContributorAccessLevel` field to `AddCaseTaskRequest`, `UpdateCaseTaskRequest`, `AddCaseHearingRequest`, `UpdateCaseHearingRequest` in `src/app/organization/types/caseindex.ts` (omit-when-unset semantics) per [data-model.md](data-model.md)
- [X] T005 Add four contributor service functions to `src/app/organization/services/api.ts` — `fetchCaseContributors` (GET, 200/404 → `data ?? []`), `addCaseContributor` (POST, 201/400, throws envelope error on non-201), `updateCaseContributor` (PUT, 200/400), `removeCaseContributor` (DELETE, 204) — matching the existing Axios + `getToken()` + `validateStatus` pattern per [contracts/contributors-api.md](contracts/contributors-api.md)
- [X] T006 [P] Implement pure `computeCaseAccess({ roles, currentUserId, createdById, assignedToId, contributors })` returning `{ entityLevel, resourceLevel, contributorLevel, canManageContributors }` with first-match-wins rows 1–9 (incl. `id===0`/null no-match and SiteClerk-creator exclusion) in `src/hooks/useCaseAccess.ts` per [contracts/access-ladder.md](contracts/access-ladder.md)
- [X] T007 Wrap the pure function in a memoized `useCaseAccess` hook in `src/hooks/useCaseAccess.ts` that sources roles/`currentUserId` from `useUserRole(organizationId)`, exposes derived predicates (`canViewCase`, `canEditCase`, `canDeleteCase`, `canCreateOrEditResource`, `canDeleteResource`, `canManageContributors`) and `isLoading` (read-only until access resolves)
- [X] T008 [P] [US2] Write Vitest unit tests covering all 14 ladder cases (rows + nuances: Sr.LE resource>entity, Edit-contributor caps, SiteClerk creator falls through, id=0 no-match, multi-match highest-wins) in `src/hooks/useCaseAccess.test.tsx` per [contracts/access-ladder.md](contracts/access-ladder.md)

**Checkpoint**: Types, contributor service, and access computation exist and unit-tested — user stories can begin

---

## Phase 3: User Story 1 - View and manage a case's contributors (Priority: P1) 🎯 MVP

**Goal**: A Contributors tab (next to Clients) where admins/creator/assignee list, add, change-level, and remove contributors; everyone with view access can see the list.

**Independent Test**: Sign in as a case creator, open a case → Contributors tab; add a site member at Edit, change to View-only, remove them — list updates after each action.

### Implementation for User Story 1

- [X] T009 [US1] Create `useCaseContributors` data hook (list + add + update + remove with loading/error state, refresh after each mutation, errors via `useToast().showError` + `errorHandler.ts`) in `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/useCaseContributors.ts`
- [X] T010 [US1] Export `useCaseContributors` from `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/index.ts`
- [X] T011 [P] [US1] Create `AddContributorModal` (MUI `Autocomplete` over site members filtered to exclude existing contributors + creator + assignee, plus access-level `Select`; loading/empty states; surfaces backend 400 verbatim) in `src/components/modals/AddContributorModal.tsx`
- [X] T012 [P] [US1] Create `EditContributorAccessModal` (access-level `Select` View-only/Edit) in `src/components/modals/EditContributorAccessModal.tsx`
- [X] T013 [US1] Create `ContributorsTab` (MUI `Table` mirroring `ClientsTab` showing name/email/level/added-by/date, empty-state message, and `Add`/per-row edit & remove controls shown only when `canManageContributors`, reusing `DeleteConfirmationModal` for removal) in `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/ContributorsTab/ContributorsTab.tsx` + `ContributorsTab.module.css`
- [X] T014 [US1] Export `ContributorsTab` from `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/index.ts`
- [X] T015 [US1] Wire the Contributors tab into `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/page.tsx`: insert `<Tab label="Contributors">` + `<TabPanel>` adjacent to Clients, refactor the hardcoded tab-index arithmetic (the `hasCnrNumber` offsets) into a single ordered tab list / derived index map to avoid off-by-one regressions, and pass `useCaseAccess` + `useCaseContributors` data into the tab
- [X] T016 [P] [US1] Playwright E2E for the Contributors golden path (add → change level → remove, list updates) plus empty-state and an add-validation-error (creator/assignee or duplicate) case in `e2e/contributors.spec.ts`
- [X] T037 [P] [US1] React Testing Library unit tests for the two new shared modals — `AddContributorModal` (member filtering excludes existing contributors/creator/assignee, access-level select, backend-error surfacing, loading/empty states) and `EditContributorAccessModal` (level select + submit) — in `src/components/modals/AddContributorModal.test.tsx` and `src/components/modals/EditContributorAccessModal.test.tsx` (Constitution III: shared `src/components/` components MUST have RTL tests)

**Checkpoint**: Contributors tab fully functional and independently testable (MVP)

---

## Phase 4: User Story 2 - Controls match each user's actual access level (Priority: P1)

**Goal**: Mutation controls across every case tab are hidden unless the user's computed resource/entity level permits the action; 401s surface a readable message.

**Independent Test**: As View-only contributor → no mutation controls anywhere; as Edit contributor → add/update but no deletes; as site admin → all controls incl. Delete Case.

### Implementation for User Story 2

- [X] T017 [US2] Gate "Delete Case" (show only when `canDeleteCase`/entity===Full) and case edit affordances (show when `canEditCase`) in `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/page.tsx` and `.../components/CaseHeader/` — hidden, not disabled (FR-013a)
- [X] T018 [P] [US2] Gate create/update (`canCreateOrEditResource`) and delete (`canDeleteResource`) controls in `.../components/TasksTab/`
- [X] T019 [P] [US2] Gate create/update and delete controls in `.../components/HearingsTab/`
- [X] T020 [P] [US2] Gate create/update and delete controls in `.../components/DocumentsTab/`
- [X] T021 [P] [US2] Gate create/update and delete controls in `.../components/CommentsTab/` (and `TaskCommentsTab/` if applicable)
- [X] T022 [P] [US2] Gate create/update and delete controls in `.../components/InvoiceTab/`
- [X] T023 [P] [US2] Gate create/update and delete controls in `.../components/ClientsTab/`
- [X] T024 [US2] Ensure case-scoped 401 responses surface a clear permission toast (not a raw/crashing error) via `errorHandler.ts` mapping across the contributor and resource mutation flows
- [X] T025 [P] [US2] Playwright E2E verifying control visibility per role (View-only contributor / Edit contributor / SrLegalExpert-creator-assignee / admin) and a stale-permission 401 toast in `e2e/case-access.spec.ts`

**Checkpoint**: UI affordances match backend permissions for all roles (SC-002, SC-003)

---

## Phase 5: User Story 3 - Case list shows only accessible cases (Priority: P2)

**Goal**: Render the backend's row-filtered case list as-returned, with a helpful empty-state and a no-permission message on case-load 401.

**Independent Test**: Sign in as a legal expert with limited access → list shows only their cases; empty set → guidance message; admin → full list unchanged.

### Implementation for User Story 3

- [X] T026 [P] [US3] Add empty-state guidance (hints the user may need contributor access) and render the list as-returned (no client-side filtering) in `src/app/organization/[id]/cases/page.tsx`
- [X] T027 [P] [US3] Add the same empty-state guidance to the cases section of `src/app/organization/[id]/sites/[siteId]/page.tsx`
- [X] T028 [US3] Ensure the case detail page (`.../cases/[caseId]/page.tsx`) shows a "no permission to view this case" message on a 401/load failure consistent with existing not-found messaging (FR-023)

**Checkpoint**: Filtered lists and permission messaging behave correctly (SC-004)

---

## Phase 6: User Story 4 - Choose contributor access when assigning a task or hearing (Priority: P3)

**Goal**: An optional View-only/Edit selector on task/hearing assignment forms, shown whenever an assignee is selected, submitted as `newAssigneeContributorAccessLevel` (omitted when unset).

**Independent Test**: Edit a task assigning an outside-team member, choose Edit, save → member appears as Edit contributor; leave a hearing's selector unset → member appears View-only.

### Implementation for User Story 4

- [X] T029 [P] [US4] Add the access-level `Select` (View-only/Edit, default unset, shown when an assignee is selected, labeled as granting case access) to `src/components/modals/AddTaskModal.tsx` and `src/components/modals/EditTaskModal.tsx`
- [X] T030 [P] [US4] Add the same access-level `Select` to `src/components/modals/HearingModal.tsx`
- [X] T031 [US4] Wire the selected value into the task submit path so `newAssigneeContributorAccessLevel` is included only when set (omitted otherwise) in `.../cases/[caseId]/hooks/useCaseTasks.ts`
- [X] T032 [US4] Wire the selected value into the hearing submit path (omit when unset) in `.../cases/[caseId]/hooks/useCaseHearings.ts`
- [X] T038 [P] [US4] Playwright E2E for the assignment auto-grant: assign a task to an outside-team member, choose Edit → save → member appears as an **Edit** contributor on the Contributors tab; repeat for a hearing leaving the selector unset → member appears as **View-only** (backend default) — in `e2e/assignment-contributor.spec.ts` (Constitution III E2E; covers SC-005)

**Checkpoint**: Assignment auto-grant selector works and degrades to ViewOnly default (SC-005)

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T033 Run `npm run type-check`, `npm run lint`, `npm run build` (pre-commit gates) and fix any issues — no `--no-verify`
- [~] T034 [P] Run `npm run test` and `npm run test:e2e` (dev server running) and confirm access-ladder unit tests (T008), modal RTL tests (T037), and all E2E suites (T016 contributors, T025 case-access, T038 assignment-contributor) pass — Vitest unit + RTL (21 tests) PASS; Playwright E2E suites authored and self-skip unless `E2E_CASE_URL`/`E2E_STORAGE_STATE` point at a deployed backend with an authenticated session (cannot execute in this environment)
- [ ] T035 Execute the [quickstart.md](quickstart.md) manual verification steps and confirm Success Criteria SC-001…SC-007 — MANUAL: requires a deployed backend with the contributors feature + multi-role test users (cannot run in this environment)
- [X] T036 Run `/speckit-analyze` for cross-artifact consistency (spec ↔ plan ↔ tasks) per Constitution XIV — PASS (100% requirement coverage, 0 critical/high; 1 LOW doc nit: service fns live in `caseapi.ts`, not `api.ts`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3–6)**: All depend on Foundational completion
  - US1 (P1) and US2 (P1) are both critical and may proceed in parallel after Phase 2
  - US3 (P2) and US4 (P3) are independent of US1/US2
- **Polish (Phase 7)**: Depends on the desired user stories being complete

### User Story Dependencies

- **US1**: Needs T003 (types), T005 (service), T007 (access hook for `canManageContributors`)
- **US2**: Needs T006/T007 (access hook). Independent of US1
- **US3**: Needs nothing beyond existing list services. Fully independent
- **US4**: Needs T004 (request-type field). Independent of US1–US3

### Within Each User Story

- Data hook → modals → tab component → page wiring → E2E
- Story complete before moving to next priority

### Parallel Opportunities

- T002 runs alongside Phase 1
- Foundational: T003, T006, T008 are [P] (T004 edits same file as T003 → sequence after T003; T005 independent; T007 follows T006)
- US1: T011 and T012 (separate modal files), T016 (E2E), and T037 (modal RTL tests) are [P]
- US2: T018–T023 (separate tab folders) and T025 (E2E) are [P]
- US3: T026 and T027 are [P]
- US4: T029 and T030 are [P]; T038 (E2E) is [P] but depends on T029–T032 being implemented

---

## Parallel Example: User Story 2

```bash
# After Phase 2, gate each resource tab in parallel (different folders):
Task: "Gate controls in TasksTab"        # T018
Task: "Gate controls in HearingsTab"     # T019
Task: "Gate controls in DocumentsTab"    # T020
Task: "Gate controls in CommentsTab"     # T021
Task: "Gate controls in InvoiceTab"      # T022
Task: "Gate controls in ClientsTab"      # T023
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1: Setup
2. Phase 2: Foundational (CRITICAL — blocks all stories)
3. Phase 3: User Story 1 — Contributors tab
4. **STOP and VALIDATE**: add/edit/remove a contributor end-to-end
5. Demo

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 (Contributors tab) → test → demo (MVP)
3. US2 (access gating) → test → demo (co-critical P1)
4. US3 (list filtering/empty states) → test → demo
5. US4 (assignment selector) → test → demo

### Parallel Team Strategy

After Phase 2: Dev A → US1, Dev B → US2, Dev C → US3, Dev D → US4 (stories are independently testable).

---

## Notes

- [P] = different files, no incomplete dependencies
- Client-side gating is UX-only; the backend remains the authorization source of truth (Constitution IV) — never rely on hidden controls for security
- Controls unavailable due to access are **hidden**, not disabled (FR-013a); disabled is reserved for transient/in-flight states
- Components must call the domain service functions only — never import `httpServices`/Axios directly (Constitution V)
- Commit after each task or logical group; do not bypass pre-commit gates
