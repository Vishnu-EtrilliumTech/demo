# Tasks: Case Task Management

**Input**: `specs/007-case-task-management/`
**Branch**: `007-case-task-management`

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1=Create task, US2=View and filter tasks, US3=Update task, US4=Delete task

---

## Phase 1: Setup

**Purpose**: Audit existing implementation to identify the specific gaps (RBAC guards, updateTaskDocumentRemarks wiring).

- [ ] T001 Read `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/TasksTab/TasksTab.tsx` — audit every Add/Edit/Delete button for `{!isSiteCaseClient && ...}` conditional render; list any missing guards
- [ ] T002 [P] Read `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/useCaseTasks.ts` — verify `updateTaskDocumentRemarks` is wired (calls `PUT /tasks/{taskId}/documents/{docId}/remarks`); verify `EmptyState` is rendered when `tasks.length === 0`
- [ ] T003 [P] Verify `AddTaskModal.tsx`, `EditTaskModal.tsx`, `DeleteConfirmationModal.tsx` exist in `src/components/modals/` and export correctly
- [ ] T004 [P] Verify `CaseTaskSchemas.add` and `CaseTaskSchemas.update` in `src/utils/caseValidationSchemas.ts` include all required fields: title, assignedToId, dueDate, status

---

## Phase 2: UI

**Purpose**: Fix any missing RBAC guards on action buttons in `TasksTab`.

- [ ] T005 [US1] Add `{!isSiteCaseClient && <Button>Add Task</Button>}` guard in `TasksTab.tsx` if missing — "Add Task" button must not render for `SiteCaseClient` role
- [ ] T006 [US1] Add `{!isSiteCaseClient && <IconButton>Edit</IconButton>}` guard on each task row in `TasksTab.tsx` if missing
- [ ] T007 [US4] Add `{!isSiteCaseClient && <IconButton>Delete</IconButton>}` guard on each task row in `TasksTab.tsx` if missing
- [ ] T008 [US2] Verify `EmptyState` component renders when `tasks.length === 0 && !loadingTasks` in `TasksTab.tsx` with message "No tasks yet" — add if missing

---

## Phase 3: Logic

**Purpose**: Wire `updateTaskDocumentRemarks` if missing and verify task filter logic.

- [ ] T009 [US2] Verify `useCaseTasks.ts` calls `updateTaskDocumentRemarks(orgId, siteId, caseId, taskId, docId, { remarks })` via `PUT /tasks/{taskId}/documents/{docId}/remarks` — add the call if missing
- [ ] T010 [US2] Verify task filter (`taskFilters`) in `useCaseTasks.ts` filters by assignee — `filteredTasks = tasks.filter(t => !taskFilters.assigneeId || t.assignedToId === taskFilters.assigneeId)`; wire "My Tasks" filter to current user's ID
- [ ] T011 [US1] Verify `AddTaskModal` validates: title (required), assignedToId (required, > 0), dueDate (required), status (required); past due dates accepted without error (no future-date validation)
- [ ] T012 [US4] Verify `DeleteConfirmationModal` dialog text explicitly mentions "This will also delete all documents and comments attached to this task" before calling `deleteCaseTask`

---

## Phase 4: API

**Purpose**: Confirm all task API functions exist and cover the full CRUD + document operations.

- [ ] T013 [P] Verify `fetchCaseTasks`, `addTaskToCase`, `updateCaseTask`, `deleteCaseTask` in `src/app/organization/services/caseapi.ts` — confirm all are present with correct URL patterns
- [ ] T014 [P] Verify task document API functions exist in `caseapi.ts`: `fetchTaskDocuments`, `addTaskDocument`, `fetchTaskDocument`, `deleteTaskDocument`, `updateTaskDocumentRemarks` (the last one may be missing — confirm)

---

## Phase 5: Backend

**Purpose**: Verify backend enforces SiteCaseClient restrictions on task write operations.

- [ ] T015 Confirm POST `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/tasks` with `SiteCaseClient` Bearer token returns `403` — backend is the security gate for task creation
- [ ] T016 [P] Confirm PUT `/api/v1/.../tasks/{taskId}/documents/{docId}/remarks` with valid payload returns `200 { data: TaskDocument }` with updated remarks

---

## Phase 6: Security

**Purpose**: Confirm all write controls are hidden (not just disabled) for SiteCaseClient.

- [ ] T017 [US1] Verify `SiteCaseClient` has zero visible write controls in `TasksTab` — inspect DOM in unit tests; Add Task button, per-row Edit and Delete buttons must all be absent from rendered output
- [ ] T018 [US1] Verify empty-file guard in `useCaseTasks.ts` — `file.size === 0` check before calling `addTaskDocument`; assert `addTaskDocument` is not called for empty files
- [ ] T019 Verify no task title, description, or assignee name is logged to console — only log safe IDs (taskId, caseId, documentId)

---

## Phase 7: Testing

**Purpose**: Unit and E2E coverage for all four user stories.

- [ ] T020 [P] [US1] Write unit test `TasksTab/__tests__/TasksTab.test.tsx` — SiteAdmin role: Add Task button visible; `SiteCaseClient` role: Add/Edit/Delete hidden; empty task list: EmptyState rendered; Delete click: DeleteConfirmationModal opens; Confirm delete: `deleteCaseTask` mock called once
- [ ] T021 [P] [US1] Write unit test `hooks/__tests__/useCaseTasks.test.ts` — `fetchCaseTasks` success populates tasks; `addTaskToCase` success appends task to list; `addTaskToCase` 400 sets `taskApiErrors`; empty file upload does not call `addTaskDocument`
- [ ] T022 Write E2E test `e2e/007-case-task-management.spec.ts` — SiteClerk creates task golden path; SiteCaseClient sees read-only; SiteAdmin edits task status to InProgress; SiteAdmin deletes task; empty task list shows empty state; filter tasks by assignee

---

## Phase 8: Logging

**Purpose**: Structured logging per plan section 10.

- [ ] T023 Verify `useCaseTasks.ts` logs: task created (caseId, taskId, status — not title); task deleted (taskId — not title); task document uploaded (taskId, documentId, file size — not filename/content); API errors (HTTP status, taskId — not token); `console.warn` for SiteCaseClient write attempt blocked — no PII

---

## Phase 9: Quality Gates

**Purpose**: Pre-commit checks must pass.

- [ ] T024 Run `npm run type-check` — fix TypeScript errors in modified `TasksTab.tsx` and `useCaseTasks.ts` if guards or wiring were added
- [ ] T025 [P] Run `npm run lint` — fix all ESLint warnings
- [ ] T026 Run `npm run build` — production build passes
- [ ] T027 [P] Run `npm run test` — all new unit tests pass

---

## Phase 10: Finalization

**Purpose**: Final review and commit.

- [ ] T028 Confirm `TaskStatus.Blocked` from API is displayed with red badge in `TasksTab` even though it is not in the spec's status list — should render as-is, not crash
- [ ] T029 [P] Confirm `formatDateForInput` / `formatDateForAPI` utilities are used consistently for due dates in `AddTaskModal` and `EditTaskModal` — no raw `new Date()` ISO string construction
- [ ] T030 Commit: `feat(007): fix SiteCaseClient RBAC guards in TasksTab; wire updateTaskDocumentRemarks; add task unit and E2E tests`

---

## Dependencies

- **Setup (Phase 1)**: Start immediately — audit only
- **UI (Phase 2)**: Depends on T001 (audit findings); tasks may be no-ops if guards already exist
- **Logic (Phase 3)**: Depends on T002 (audit findings)
- **API (Phase 4)**: Parallel with UI/Logic — verification only
- **Security (Phase 6)**: Depends on UI (Phase 2) + Logic (Phase 3)
- **Testing (Phase 7)**: Depends on all implementation phases

### Parallel Opportunities

```
After Setup:
  [Parallel] UI fixes (T005-T008) + Logic fixes (T009-T012) + API verification (T013-T014)

After Implementation:
  [Parallel] T020 + T021 (unit tests) written simultaneously
  [Parallel] T024 (type-check) + T025 (lint) + T027 (tests)
```

### Suggested MVP

Most work here is verification and gap-filling. Complete Setup (Phase 1) first to know actual scope. Many tasks may be no-ops if the existing code is already correct.
