---

description: "Task list for GUID Primary Key Migration (Frontend)"
---

# Tasks: GUID Primary Key Migration (Frontend)

**Input**: Design documents from `/specs/036-guid-primary-key-migration/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/id-response-contracts.md](contracts/id-response-contracts.md), [quickstart.md](quickstart.md)

**Tests**: This migration includes test-fixture/test-semantics updates because they are the safety net for a `number`→`string` correctness change (per plan.md Constitution Check, Principle III) — not net-new feature test coverage. No new test framework or golden-path E2E test is added.

**Organization**: Tasks are grouped by user story (per spec.md) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Every task includes exact file path(s)

## Path Conventions

Single Next.js frontend project — all paths are relative to the repository root (`src/`, `e2e/`), per plan.md's Project Structure. No `backend/`/`frontend/` split exists in this repo.

---

## Phase 1: Setup

**Purpose**: Confirm the environment is ready to develop and verify against a GUID-migrated backend

- [X] T001 Verify `.env`'s `NEXT_PUBLIC_API_BASE_URL` points at a backend already migrated to GUID primary keys (local Docker or a remote dev server such as `https://dev2.lawsome.in`), per plan.md Technical Context
- [X] T002 [P] Run `npm run type-check` and `npm run lint` at the repo root to capture the pre-migration baseline (expected clean, since only value types change in this feature)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Retype the shared entity fields (`Organization`, `Site`, `User`, `UserBasicInfo`, and the `searchProfile` Redux slice) that both User Story 1 and User Story 2 depend on for correct, consistent typing

**⚠️ CRITICAL**: Complete this phase before starting User Story 1 or User Story 2 — both stories' types reference these shared fields (e.g., Case's `assignedToId`/`createdById` are foreign keys into `User.id`)

- [X] T003 Retype `Organization.id`, `Organization.currentUser.id`, the `Site` relation's `organizationId`, `User.id`, `User.userId`, `User.organizationId`, `User.siteId`, and `UserBasicInfo.id` from `number`/`number?` to `string`/`string?` in `src/app/organization/types/index.ts` (per data-model.md Organization/Site/User sections; `User.siteId` drops its `0 = org-level / >0 = site-level` numeric sentinel in favor of `null`/absent vs. non-empty string)
- [X] T004 [P] Retype `profileSlice` state's `id`, `organizationId`, `userId` fields and the `setOrganizationRole` action payload's `organizationId`/`userId` from `number` to `string` in `src/app/redux/searchProfile/profileSlice.ts`
- [X] T005 [P] Verify `src/hooks/useUserRole.ts`'s `user.id.toString()` / `userId.toString()` calls remain correct now that the underlying ids are already `string` (expected no-op; no code change unless a residual numeric assumption is found)

**Checkpoint**: Foundation ready — User Story 1 and User Story 2 implementation can now begin

---

## Phase 3: User Story 1 - Core organization, site, and user workflows keep working (Priority: P1) 🎯 MVP

**Goal**: Every organization, site, and user create/view/edit/delete workflow continues to work correctly against GUID-typed ids, including the two response field-naming quirks and legacy-id "not found" handling

**Independent Test**: Log in, browse the organization list, open a site, open a user's profile, and successfully create/edit/delete an organization, a site, and a user — all without console errors, broken URLs, or unexpected "not found" pages; then confirm a legacy numeric-id URL correctly renders "not found."

### Implementation for User Story 1

- [X] T006 [US1] Fix `fetchOrganization`'s `orgPayload.id || 0` numeric fallback (`src/app/organization/services/api.ts:33`) to fall back to an empty/undefined value consistent with a `string` id, not `0`
- [X] T007 [US1] Implement the FR-006 organization-update id-field normalization contract (contracts/id-response-contracts.md §2) in `updateOrganization()` (`src/app/organization/services/api.ts:56-67`): confirm the actual returned field name against the live backend (candidates: `organizationId`, `organizationGuid`), read it, and normalize it into `Organization.id` so callers keep reading `result.id`
- [X] T008 [US1] Implement the FR-006 site-update id-field normalization contract (contracts/id-response-contracts.md §3) in `updateSite()` (`src/app/organization/services/api.ts:265-313`): confirm the actual returned field name (candidates: `siteId`, `siteGuid`) and normalize it into `Site.id`
- [X] T009 [US1] Remove the `Number(userId)` coercion in `fetchUserBasicInfo`'s 404/403 fallback (`src/app/organization/services/api.ts:376,380`), building `{ id: userId, fullName: 'Unknown User' }` with `userId` passed through as a `string`
- [X] T010 [P] [US1] Remove the `Number(organizationId)` coercion(s) in `src/app/organization/[id]/page.tsx` (e.g. line ~196)
- [X] T011 [P] [US1] Remove the `Number(organizationId)` coercion in `src/components/modals/AddSiteModal.tsx:155`
- [X] T012 [P] [US1] Remove the `Number(site.id)` comparison in `src/app/organization/components/SitesTable.tsx:127`
- [X] T013 [P] [US1] Remove the `Number(site.id)` comparisons in `src/app/organization/components/SiteManagementTab.tsx:375,518,535`
- [X] T014 [P] [US1] Replace the `siteId === 0` org-vs-site delete branch with a `null`/empty-string check in `src/app/organization/components/UserManagementTab.tsx:163,184-186`
- [X] T015 [P] [US1] Replace `userSiteId != null && userSiteId > 0` with a string-based non-empty check in `src/components/modals/EditUserModal.tsx:110`
- [X] T016 [P] [US1] Remove the `parseInt(siteId, 10)` comparisons against task/hearing `siteId` in `src/app/organization/[id]/sites/[siteId]/users/[userId]/page.tsx:143,236,433,871,881`
- [X] T017 [US1] Verify or add an explicit "not found" render (FR-005, contracts/id-response-contracts.md §7) for the organization detail (`src/app/organization/[id]/page.tsx`), site detail (`src/app/organization/[id]/sites/[siteId]/page.tsx`), and user detail (`src/app/organization/[id]/sites/[siteId]/users/[userId]/page.tsx`) routes when the id fails to resolve, including a malformed or legacy numeric id (depends on T010, T016)
- [ ] T018 [US1] Manually verify quickstart.md §1 end-to-end: organization/site/user create-edit-delete workflows and the legacy numeric-id "not found" path, against a GUID-migrated backend (depends on T006-T017)

**Checkpoint**: User Story 1 is fully functional and independently testable — organizations, sites, and users work end-to-end under GUID ids

---

## Phase 4: User Story 2 - Case management workflows keep working (Priority: P2)

**Goal**: Every case sub-resource (tasks, documents, hearings, comments, contributors, clients, invoices) continues to work correctly under GUID ids, with the authorization-critical `useCaseAccess` sentinel fixed and preserving fail-closed behavior

**Independent Test**: Open an existing case and independently exercise each tab (tasks, documents, hearings, comments, contributors, clients, invoices) to create, view, update, and delete a record in each, confirming correct data displays, correct chronological ordering, and no failed requests — including verifying case edit/delete/sub-resource permissions as both the case creator and a non-creator contributor.

### Case Core Types

- [X] T019 [US2] Retype `Case.assignedToId`, `Case.createdById`, `Case.siteId` from `number`/`number?` to `string`/`string?` in `src/app/organization/types/index.ts` (depends on Foundational T003 for `User.id`/`Site.id` consistency)
- [X] T020 [US2] Retype `CaseData.assignedToId`, `CaseData.createdById`, `EditTitleFormState.assignedTo`, `EditFormData.assignedTo` from `number` to `string` in `.../cases/[caseId]/types/case.ts`
- [X] T021 [US2] Replace the `assignedTo: 1` "no assignee" sentinel (there is no numeric-1 GUID equivalent) with `null`/`''` throughout `useCaseData.ts` (depends on T020)

### Authorization (`useCaseAccess`) — highest risk, do in one change

- [X] T022 [US2] Retype `ComputeCaseAccessInput.currentUserId`/`.createdById`/`.assignedToId` (lines 16-22) and `UseCaseAccessArgs.createdById`/`.assignedToId` (lines 93-94) from `number | null(|undefined)` to `string | null(|undefined)` in `src/hooks/useCaseAccess.ts`
- [X] T023 [US2] In `src/hooks/useCaseAccess.ts`: replace the `currentUserId !== null && currentUserId !== 0 ? currentUserId : null` sentinel (line 40) with a truthy/non-empty-string check, and delete the `numericUserId = Number(currentUserId)` / `Number.isNaN` coercion block (lines 136-148), passing `currentUserId` through as a `string` while preserving the existing fail-closed fallback — an unresolved/mismatched id must still deny, not grant, access (depends on T022)
- [X] T024 [US2] Rewrite `src/hooks/useCaseAccess.test.tsx`: replace `CREATOR_ID`/`ASSIGNEE_ID`/`CONTRIB_ID` numeric fixtures with GUID-shaped strings, replace the `'currentUserId 0 with createdById 0 never matches creator/assignee'` test with an equivalent `''`/`null` case, and add a new assertion that a matching GUID string *does* grant creator/assignee access (depends on T023)

### Tasks (`CaseTask`, `TaskDocument`)

- [X] T025 [US2] Retype `AddCaseTaskRequest.assignedToId`, `UpdateCaseTaskRequest.assignedToId`, `CaseTask.id`, `.caseId`, `.assignedToId`, `TaskDocument.id`, `.taskId`, `.createdById`, `.uploadedById` from `number` to `string` in `src/app/organization/types/caseindex.ts:219-297`
- [X] T026 [US2] Replace `assignedToId: 0` default/reset values and the falsy-numeric "no assignee" gate with `null`/`''` in `useCaseTasks.ts:93,168-173,220-225,322,342` (depends on T025)
- [X] T027 [US2] Remove the `parseInt(taskFilters.assignedToId)` filter comparison in `useCaseTasks.ts:529` (depends on T025)
- [X] T028 [P] [US2] Remove the `parseInt(...) || 0` pattern on the assignee `<select>` in `src/components/modals/EditTaskModal.tsx:161-162` and `src/components/modals/AddTaskModal.tsx:172-173` (depends on T025)

### Documents (`CaseDocument`)

- [X] T029 [US2] Retype `CaseDocument.id`, `.caseId`, `.createdById`, `.uploadedById`, `CaseDocumentResponse.id` from `number` to `string` in `src/app/organization/types/caseindex.ts:299-334`
- [X] T030 [US2] Rework the optimistic document-insert temp row in `useCaseDocuments.ts:123-141`: replace the `id: 0`/`createdById: 0`/`uploadedById: 0` placeholder with either a string-safe temporary marker distinct from any real GUID, or remove the optimistic row and rely on the existing refetch, consistent with Hearings/Comments/Contributors/Invoices (depends on T029)

### Hearings (`CaseHearing`, `Hearing`)

- [X] T031 [US2] Retype `AddCaseHearingRequest.assignedToId`, `UpdateCaseHearingRequest.assignedToId`, `CaseHearing.id`, `.caseId`, `.assignedToId` in `src/app/organization/types/caseindex.ts:343-385`, and `Hearing.assignedToId`/`.createdById`/`.siteId` in `src/app/organization/types/index.ts:120-134`
- [X] T032 [US2] Replace `assignedToId: 0` default/reset and the falsy-gate pattern in `useCaseHearings.ts:72,80,146-150,155,208-213,225,251` with `null`/`''` (depends on T031)
- [X] T033 [US2] Remove the `parseInt(...)` filter comparison at `useCaseHearings.ts:348` (depends on T031)
- [X] T034 [P] [US2] Verify the hearings tab sorts by `hearingDateTime` (or the equivalent explicit date field), not id/creation order (FR-002)

### Comments — Case Comments and Task Comments

- [X] T035 [US2] Retype `CaseComment.id`/`.userId`/`.caseId`/`.parentCommentId`, `CaseTaskComment.id`/`.taskId`/`.userId`/`.parentCommentId`, `AddCaseCommentResponse.id`, `AddCaseCommentReplyResponse.id` from `number` to `string` in `src/app/organization/types/caseindex.ts:427-496` (`userGuid` fields on both types are already `string` — no change)
- [X] T036 [US2] Change the `commentId`/`parentCommentId` parameters from `number` to `string` in `addCaseCommentReply`, `fetchCaseComment`, `updateCaseComment`, `deleteCaseComment`, `addTaskCommentReply`, `fetchTaskComment`, `updateTaskComment`, `deleteTaskComment` in `src/app/organization/services/caseapi.ts` (contracts/id-response-contracts.md §6) (depends on T035)
- [X] T037 [US2] Fix `TaskCommentsTab.tsx:144-160`'s `getUserFullName()` fallback to resolve the display name via `userGuid` (matching `CommentsTab.tsx`'s existing pattern) instead of the numeric-equality lookup against legacy `userId` (depends on T035)

### Contributors (`CaseContributor`)

- [X] T038 [US2] Retype `CaseContributor.id`/`.caseId`/`.siteId`/`.organizationId`/`.userId`/`.addedById`, `AvailableUser.id`, `AddCaseContributorRequest.userId` from `number` to `string` in `src/app/organization/types/caseindex.ts:66-119`
- [X] T039 [P] [US2] Retype the `onUpdate(contributorId: ...)` and `onRemove(contributorId: ...)` prop signatures from `number` to `string` in `src/app/organization/.../components/ContributorsCard.tsx:234` (and its `onRemove` counterpart) (depends on T038)

### Clients (attached to a Case) (`CaseClient`)

- [X] T040 [US2] Retype `CaseClient.id`/`.caseId`/`.clientId`, `ClientInvitationResponse.clientId`, `ClientAcceptInvitationRequest.clientId`, `ClientAcceptInvitationResponse.clientId` from `number` to `string` in `src/app/organization/types/caseindex.ts:139-208` (`invitationId` already `string`; `clientId`'s existing `null` = "no client" convention is unchanged)
- [X] T041 [P] [US2] Update `useCaseClients.ts`'s `deletingClientId`/`editingClientId`/`selectedClient` field types to `string | null` (the existing `null`-based sentinel convention is unchanged) (depends on T040)

### Invoices (`CaseInvoice`, `Invoice`)

- [X] T042 [US2] Retype `CaseInvoice.id`/`.caseId`/`.siteId`/`.createdById`, `Invoice.id`/`.caseId`/`.createdById` from `number` to `string` in `src/app/organization/types/caseindex.ts:498-555` and `src/app/organization/types/index.ts:213-249`
- [X] T043 [US2] Re-validate the extra `id` field built into `UpdateCaseInvoiceRequest` in `useCaseInvoices.ts:144-167` (currently only compiles via the type's `Record<string, unknown>` index signature) against the actual backend contract now that ids are GUIDs (depends on T042)

### Cross-Cutting for Case Module

- [X] T044 [US2] Verify or add an explicit "not found" render for the case-detail route (FR-005) when the case id fails to resolve, matching the existing pattern in `.../cases/[caseId]/page.tsx:399-423`
- [X] T045 [US2] Sweep the case sub-resource tabs (tasks, documents, hearings, comments, contributors, invoices) for any remaining id-based "greater than zero" or sort-by-id logic and confirm all list ordering uses an explicit date field (FR-002, FR-009) (depends on T025-T043)

### Test Fixtures

- [X] T046 [P] [US2] Replace numeric id literals with GUID-shaped strings in `src/hooks/useAvailableContributorUsers.test.tsx`
- [X] T047 [P] [US2] Replace numeric id literals with GUID-shaped strings in `src/components/modals/EditContributorAccessModal.test.tsx`

### Validation

- [ ] T048 [US2] Manually verify quickstart.md §2 end-to-end across all seven case sub-resource tabs (tasks, documents, hearings, comments, contributors, clients, invoices), testing permission-gated actions both as the case creator and as a non-creator/non-assignee contributor, confirming zero console errors and zero failed requests (depends on T019-T047)

**Checkpoint**: User Stories 1 AND 2 both work independently — organizations/sites/users and full case management function correctly under GUID ids

---

## Phase 5: User Story 3 - Legal expert, appointment, payment, and rating workflows keep working (Priority: P3)

**Goal**: Retype the id fields that exist today in admin-dashboard list DTOs, the legal-expert/client Redux slices, and e-Courts records; document the GUID-first contract for the deeper legal-expert/appointment/payment/rating flows that are not yet built

**Independent Test**: Open the admin-dashboard legal-expert, client, appointment, payment, and rating list views and confirm every row renders without a broken/`NaN` id and any per-row link builds a valid URL; for any deeper flow (address add, appointment booking, order/payment detail, rating replies) that has been built, confirm it loads and completes successfully.

### Implementation for User Story 3

- [X] T049 [P] [US3] Retype `LegalExpertListItem.id`, `ClientListItem.id`, `AppointmentListItem.id`, `PaymentListItem.id`, `RatingListItem.id`, `LegalExpertCaseListItem.id`, `LegalExpertCommunicationListItem.id` from `number` to `string` in `src/app/admin-dashboard/services/types.ts`
- [X] T050 [P] [US3] Retype `legalExpertSlice`'s `data.id`, `data.expertTypeId`, `data.legalExpertAddresses[].id` from `number` to `string` in `src/app/redux/legalExpert/legalExpertSlice.ts`
- [X] T051 [P] [US3] Retype `clientSlice`'s `data.id`, `data.systemUserId` from `number` to `string` in `src/app/redux/client/clientSlice.ts`
- [X] T052 [P] [US3] Retype the `id`/`siteId` fields (lines 328,332,357,369) from `number` to `string` in `src/app/organization/types/ecourtTypes.ts`
- [ ] T053 [US3] Verify the admin-dashboard legal-experts, clients, appointments, payments, and ratings list pages render each row without a broken/`NaN` id and any per-row "view detail" link builds a valid URL, now that the DTOs are string-typed (depends on T049)
- [ ] T054 [US3] When the legal-expert address-creation UI is built: implement the FR-007 plain-list response contract (contracts/id-response-contracts.md §4) — read `response.data` as `string[]` directly, not `response.data.map(item => item.id)`
- [ ] T055 [US3] When appointment booking, order/payment detail, or rating-reply-thread UI is built: design all new id fields as GUID strings from the start (no numeric id introduced), applying the FR-006 field-naming-quirk pattern (see T007/T008) and the FR-008 dual-identity-field pattern (see T035-T037) where the same shapes recur

**Checkpoint**: All user stories are independently functional — organizations/sites/users, case management, and the currently-live parts of legal-expert/appointment/payment/rating all work correctly under GUID ids

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cosmetic cleanup and full-repo regression validation (SC-001 through SC-005)

- [X] T056 [P] Update the illustrative numeric-id URLs in the comment at `e2e/helpers/env.ts` (`/organization/1/sites/2/cases/3`) to GUID-shaped examples (cosmetic only, no behavior change)
- [X] T057 Run `npm run type-check` and `npm run lint` at the repo root and fix any remaining call sites the retype surfaces (Constitution Principle VII — this is the primary correctness signal for this migration) (depends on all prior phases)
- [X] T058 Run `npm run build` and confirm it succeeds (depends on T057)
- [X] T059 Run `npm run test` and confirm all unit tests pass, including the rewritten `src/hooks/useCaseAccess.test.tsx` (depends on T057)
- [ ] T060 Run `npm run test:e2e` (with `npm run dev` running) and confirm all Playwright specs pass unchanged (depends on T057)
- [X] T061 Grep the full diff for any remaining `parseInt(`/`Number(` call against an id-like variable, and any remaining `=== 0`/`> 0`/`|| 0` pattern against an id-like variable — confirm zero hits outside genuinely non-id numeric fields (page numbers, amounts, phone numbers, years) (quickstart.md §4.4) (depends on all prior phases)
- [ ] T062 Perform the full quickstart.md regression walkthrough (§1-§4) end-to-end against a GUID-migrated backend and confirm zero defects (SC-001 through SC-005) (depends on T058-T061)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS User Story 1 and User Story 2 (both reference `Organization`/`Site`/`User` fields retyped here)
- **User Story 1 (Phase 3)**: Depends on Foundational — independent of User Story 2 and 3
- **User Story 2 (Phase 4)**: Depends on Foundational (specifically `User.id`/`Site.id` for FK consistency) — independent of User Story 1 and 3, though both can proceed in parallel once Foundational is done
- **User Story 3 (Phase 5)**: Depends only on Setup — does not depend on Foundational, User Story 1, or User Story 2 (its DTOs/Redux slices are self-contained files); can start in parallel with Phase 2-4 if staffed separately
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — no dependency on US2/US3
- **User Story 2 (P2)**: Can start after Foundational — no dependency on US1/US3 (independently testable per its own case-detail entry point)
- **User Story 3 (P3)**: Can start after Setup — no dependency on US1/US2

### Within Each User Story

- Type retyping (per file/entity group) before the consumer logic fixes that depend on it
- Authorization-critical `useCaseAccess` changes (T022-T024) must land together, not split across separate commits (per data-model.md)
- Sentinel/coercion fixes before the manual validation task that exercises them
- Story's manual quickstart validation task is last

### Parallel Opportunities

- T002 (Setup) can run alongside T001
- T004 and T005 (Foundational) can run in parallel with each other (different files) — T003 should complete first since T004/T005 don't depend on it but touch conceptually related shared state
- Within User Story 1: T010-T016 (7 tasks, 6 distinct files) can all run in parallel once T006-T009 (`api.ts`) are done
- Within User Story 2: T028, T034, T039, T041, T046, T047 are each independently parallelizable against their story's other tasks (distinct files, no incomplete dependency)
- Within User Story 3: T049-T052 (4 distinct files) can all run in parallel
- User Story 1, User Story 2, and User Story 3 can be staffed to different developers in parallel once Foundational (and, for US3, Setup) is complete

---

## Parallel Example: User Story 1

```bash
# After T006-T009 (api.ts changes) land, launch these together — 6 distinct files:
Task: "Remove Number(organizationId) coercion in src/app/organization/[id]/page.tsx"
Task: "Remove Number(organizationId) coercion in src/components/modals/AddSiteModal.tsx:155"
Task: "Remove Number(site.id) comparison in src/app/organization/components/SitesTable.tsx:127"
Task: "Remove Number(site.id) comparisons in src/app/organization/components/SiteManagementTab.tsx:375,518,535"
Task: "Replace siteId === 0 branch in src/app/organization/components/UserManagementTab.tsx:163,184-186"
Task: "Replace userSiteId > 0 check in src/components/modals/EditUserModal.tsx:110"
Task: "Remove parseInt(siteId, 10) comparisons in .../sites/[siteId]/users/[userId]/page.tsx"
```

## Parallel Example: User Story 3

```bash
# All four are independent files — launch together:
Task: "Retype admin-dashboard list DTOs in src/app/admin-dashboard/services/types.ts"
Task: "Retype legalExpertSlice in src/app/redux/legalExpert/legalExpertSlice.ts"
Task: "Retype clientSlice in src/app/redux/client/clientSlice.ts"
Task: "Retype ecourtTypes.ts id/siteId fields"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks US1 and US2)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run quickstart.md §1 independently
5. This alone fixes the highest-traffic, foundational-entity workflows

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → validate via quickstart.md §1 → deploy/demo (MVP)
3. Add User Story 2 → validate via quickstart.md §2 (pay special attention to `useCaseAccess` permission checks) → deploy/demo
4. Add User Story 3 → validate via quickstart.md §3 → deploy/demo
5. Polish: full regression per quickstart.md §4, type-check/lint/build/test gates

### Parallel Team Strategy

With multiple developers, after Setup + Foundational:

- Developer A: User Story 1 (Organizations/Sites/Users)
- Developer B: User Story 2 (Case Management) — start with T022-T024 (`useCaseAccess`) early given its risk profile
- Developer C: User Story 3 (Legal Expert/Appointment/Payment/Rating) — can start immediately after Setup, doesn't need to wait for Foundational

---

## Notes

- [P] tasks touch different files with no dependency on an incomplete task in the same phase
- [Story] label maps each task to its user story for traceability
- T022-T024 (`useCaseAccess`) are the single highest-risk change in this migration — per data-model.md, a partial retype here is the actual risk, not the retype itself; land all three together
- Every retype task should be immediately followed by `npm run type-check` locally to let `tsc` surface stale call sites before moving to the next task — this is the primary correctness signal for this feature (plan.md, Principle VII)
- Commit after each task or logical group, per repository convention
- Stop at each phase checkpoint to validate that story's quickstart.md section independently
- Avoid: retyping a field without also fixing its known consumer coercions/sentinels in the same change (see data-model.md's per-field consumer notes)
