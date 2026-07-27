# Tasks: Case Comment Management

**Feature**: `012-case-comment-management`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Status**: Most UI and API already exist — tasks focus on gap verification and new tests.

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1]**: Add and View Comments on a Case (P1)
- **[US2]**: Reply to a Comment (P2)
- **[US3]**: Edit and Delete Own Comments (P3)

---

## Phase 1: Setup

**Purpose**: Confirm existing code is in place and compliant with spec before gap work begins.

- [ ] T001 Review `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/CommentsTab/CommentsTab.tsx` against spec requirements (thread layout, author detection, guards)
- [ ] T002 [P] Review `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/useCaseComments.ts` against spec (empty guard, cascade confirm, RBAC)
- [ ] T003 [P] Review `TaskCommentsTab/TaskCommentsTab.tsx` and `useTaskComments.ts` — confirm identical patterns to case comments
- [ ] T004 [P] Verify TypeScript types in `src/app/organization/types/caseindex.ts`: `CaseComment`, `AddCaseCommentRequest`, `AddCaseCommentReplyRequest`, `UpdateCaseCommentRequest`, `CaseTaskComment` all present

**Checkpoint**: Setup review complete — proceed to UI/Logic gap fixes

---

## Phase 2: UI

**Purpose**: Verify and fix all UI rendering rules per spec.

- [ ] T005 [US1] Verify case detail page tab list: `{!isOrganizationClerk && <CommentsTab ... />}` — tab is fully hidden for OrganizationClerk (not just disabled) in `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/page.tsx` or equivalent case detail component
- [ ] T006 [US1] Verify `CommentsTab` renders thread in chronological order with top-level comments and replies indented underneath (FR-001, FR-002)
- [ ] T007 [US1] Verify each comment shows author name, timestamp, and comment text (FR-003)
- [ ] T008 [US1] Verify submit button has `disabled={newCommentText.trim() === ''}` — empty comment guard enforced in `CommentsTab.tsx` (FR-009)
- [ ] T009 [US2] Verify "Reply" inline input appears on all visible top-level comments for authorized users (FR-006)
- [ ] T010 [US3] Verify Edit and Delete controls render only for `isAuthor === true` per comment — `{isAuthor && <EditButton />}` pattern in `CommentsTab.tsx` (FR-004)
- [ ] T011 [US3] Verify `(edited)` marker renders when `comment.isEdited === true` (spec assumption)
- [ ] T012 [US3] Verify `DeleteConfirmationModal` message explicitly states replies will also be deleted (FR-005) — update text if needed: "Deleting this comment will also permanently remove all replies. This cannot be undone."
- [ ] T013 Verify `TaskCommentsTab` is hidden for OrganizationClerk within task detail view (identical RBAC gate as CommentsTab)

**Checkpoint**: All UI rendering rules verified and corrected

---

## Phase 3: Logic

**Purpose**: Verify and fix all hook business logic per spec.

- [ ] T014 [US1] Verify `useCaseComments`: `fetchCaseComments` populates `comments` state on mount; `loadingComments` set during fetch
- [ ] T015 [US1] Verify `addCaseComment` in `useCaseComments`: on 201 prepends new comment to list and calls `showSuccess`; on error calls `showError`
- [ ] T016 [US1] Verify `addCaseComment` in `useCaseComments`: guards against blank text — does not call API if `newCommentText.trim() === ''`
- [ ] T017 [US2] Verify `onToggleReply(commentId)` in `useCaseComments` toggles inline reply input; `addCaseCommentReply` appends reply under parent on 201
- [ ] T018 [US3] Verify `updateCaseComment` in `useCaseComments`: on 200 updates comment text in state and sets `isEdited` marker
- [ ] T019 [US3] Verify `deleteCaseComment` in `useCaseComments`: on 204 removes comment and all nested replies from local state; `deleteCommentModalOpen` logic correct
- [ ] T020 Verify `useTaskComments` has all identical guards (empty text, RBAC, delete cascade) as `useCaseComments`

**Checkpoint**: All hook logic verified and corrected

---

## Phase 4: API

**Purpose**: Confirm all required API functions exist with correct signatures in `caseapi.ts`.

- [ ] T021 [P] Verify `fetchCaseComments(orgId, siteId, caseId)` → `GET /organizations/{orgId}/sites/{siteId}/cases/{caseId}/comments` in `src/app/organization/services/caseapi.ts`
- [ ] T022 [P] Verify `addCaseComment(orgId, siteId, caseId, payload: AddCaseCommentRequest)` → `POST .../comments` returns `CaseComment`
- [ ] T023 [P] Verify `addCaseCommentReply(orgId, siteId, caseId, commentId, payload: AddCaseCommentReplyRequest)` → `POST .../comments/{commentId}/replies`
- [ ] T024 [P] Verify `updateCaseComment(orgId, siteId, caseId, commentId, payload: UpdateCaseCommentRequest)` → `PUT .../comments/{commentId}`
- [ ] T025 [P] Verify `deleteCaseComment(orgId, siteId, caseId, commentId)` → `DELETE .../comments/{commentId}` — expects 204
- [ ] T026 [P] Verify all 5 task-comment API variants (`fetchTaskComments`, `addTaskComment`, `addTaskCommentReply`, `updateTaskComment`, `deleteTaskComment`) in `caseapi.ts`

**Checkpoint**: All API functions confirmed present and correctly typed

---

## Phase 5: Backend

**Purpose**: Document backend integration points and confirm contract alignment (no frontend code changes — verification only).

- [ ] T027 Confirm backend enforces `[Authorize]` to prevent OrganizationClerk from reading or writing comments (frontend RBAC is defense-in-depth only)
- [ ] T028 Confirm backend validates comment author ownership on `PUT /comments/{commentId}` and `DELETE /comments/{commentId}` — returns 403 on mismatch
- [ ] T029 Confirm backend rejects blank/empty comment text with 400 on `POST /comments` and `PUT /comments/{id}`
- [ ] T030 Confirm `DELETE /comments/{commentId}` cascade-deletes all replies server-side (frontend removes them from local state after 204)

---

## Phase 6: Security

**Purpose**: Audit and enforce all security requirements from plan.md §6.

- [ ] T031 Audit case detail tab list: confirm `CommentsTab` is **not rendered** (not just hidden via CSS) for OrganizationClerk — component must not mount
- [ ] T032 Audit `isAuthor` check in `CommentsTab`: confirm `comment.authorId` is compared to Keycloak `tokenParsed.sub` — not to a display name or email
- [ ] T033 [P] Audit all comment text rendering: confirm no `dangerouslySetInnerHTML` used anywhere in `CommentsTab` or `TaskCommentsTab`
- [ ] T034 [P] Audit `newCommentText.trim() === ''` guard: confirm it is checked in both the `disabled` prop AND in the `onAddComment` handler (double guard)
- [ ] T035 Audit `TaskCommentsTab` RBAC: identical `{!isOrganizationClerk && <TaskCommentsTab />}` gate must exist in task detail view

---

## Phase 7: Testing

**Purpose**: Build all unit tests and E2E tests specified in plan.md §8.

- [ ] T036 [P] [US1] Create `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/CommentsTab/__tests__/CommentsTab.test.tsx` — test: OrganizationClerk role → zero comment UI in DOM
- [ ] T037 [P] [US1] Add test to `CommentsTab.test.tsx` — test: authorized role → comment thread renders with author name and timestamp
- [ ] T038 [P] [US1] Add test to `CommentsTab.test.tsx` — test: empty input → submit button has `disabled` attribute
- [ ] T039 [P] [US3] Add test to `CommentsTab.test.tsx` — test: author views own comment → Edit and Delete icons in DOM
- [ ] T040 [P] [US3] Add test to `CommentsTab.test.tsx` — test: non-author views comment → no Edit or Delete icons
- [ ] T041 [P] [US3] Add test to `CommentsTab.test.tsx` — test: delete parent comment → confirmation modal shows cascade warning text
- [ ] T042 [P] [US1] Create `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/__tests__/useCaseComments.test.ts` — test: `fetchCaseComments` success → `comments` state populated
- [ ] T043 [P] [US1] Add test to `useCaseComments.test.ts` — test: `addCaseComment` success → list length increases (prepended)
- [ ] T044 [P] [US1] Add test to `useCaseComments.test.ts` — test: `addCaseComment` with blank text → API mock not invoked
- [ ] T045 [P] [US3] Add test to `useCaseComments.test.ts` — test: `deleteCaseComment` success → list length decreases
- [ ] T046 Create `e2e/012-case-comment-management.spec.ts` with all 7 E2E scenarios from plan.md §8: golden path add, OrganizationClerk denied, reply, edit, delete cascade warning, empty blocked, non-author no controls

**Checkpoint**: All tests written — run `npm run test` to verify unit tests pass

---

## Phase 8: Logging

**Purpose**: Add structured logging as specified in plan.md §10.

- [ ] T047 [US1] Add `console.info` in `useCaseComments` on successful `fetchCaseComments`: log `{ caseId, count }` — do NOT log comment text
- [ ] T048 [US1] Add `console.info` in `useCaseComments` on `addCaseComment` success: log `{ caseId, commentId, authorId }` — do NOT log comment text
- [ ] T049 [US3] Add `console.info` in `useCaseComments` on `updateCaseComment` success: log `{ commentId, authorId }` — do NOT log new text
- [ ] T050 [US3] Add `console.info` in `useCaseComments` on `deleteCaseComment` success: log `{ commentId }` — do NOT log text
- [ ] T051 Add `console.warn` in `CommentsTab` or RBAC gate: OrganizationClerk write attempt blocked: log `{ userId, caseId }`
- [ ] T052 Add `console.error` in `useCaseComments` API error handler: log `{ httpStatus, commentId }` — do NOT log token or comment text

---

## Phase 9: Quality Gates

**Purpose**: Ensure code quality before finalization.

- [ ] T053 [P] Run `npm run type-check` — fix any TypeScript errors in `CommentsTab.tsx`, `TaskCommentsTab.tsx`, `useCaseComments.ts`, `useTaskComments.ts`
- [ ] T054 [P] Run `npm run lint` — fix any ESLint errors in modified files
- [ ] T055 Run `npm run test` — confirm all new unit tests pass
- [ ] T056 Run `npm run build` — confirm production build passes with no errors

---

## Phase 10: Finalization

**Purpose**: Confirm all spec requirements are satisfied.

- [ ] T057 Manually verify SC-001: comment appears in thread within 1 second of submit (optimistic prepend)
- [ ] T058 Manually verify SC-002: author-only controls render correctly — check own comment shows Edit/Delete, others' do not
- [ ] T059 Verify SC-003: deleting a parent comment removes all replies without manual cleanup
- [ ] T060 Verify SC-004: OrganizationClerk user sees zero comment-related UI on case detail page

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phases 2–4 (UI, Logic, API)**: Depend on Phase 1 completion; can run in parallel across phases
- **Phase 5 (Backend)**: Independent verification — can run in parallel with Phases 2–4
- **Phase 6 (Security)**: Depends on Phase 2 (UI) completion
- **Phase 7 (Testing)**: Depends on Phases 2–4 completion (tests verify fixed behavior)
- **Phase 8 (Logging)**: Can run in parallel with Phase 7
- **Phase 9 (Quality Gates)**: Depends on Phases 7–8
- **Phase 10 (Finalization)**: Depends on Phase 9

## Notes
- Most code exists — majority of tasks are verification (VERIFY) not build (NEW)
- New deliverables: `CommentsTab.test.tsx`, `useCaseComments.test.ts`, `e2e/012-case-comment-management.spec.ts`
- Do not add pagination — spec explicitly excludes it for MVP
- Comment text must never appear in logs (privileged legal information)
