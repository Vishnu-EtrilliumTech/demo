# Implementation Plan: Case Task Management

**Branch**: `007-case-task-management` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)

---

## 1. Overview

### What Exists
- `TasksTab/TasksTab.tsx` — full task list, add/edit/delete actions, task detail expansion with document sub-section and comments.
- `useCaseTasks.ts` — complete hook: fetch, add, update, delete tasks; fetch/upload/download/delete task documents; filtering, sorting, search, form validation.
- `AddTaskModal`, `EditTaskModal`, `DeleteConfirmationModal` in `@/components/modals/`.
- API functions in `src/app/organization/services/caseapi.ts`: `fetchCaseTasks`, `addTaskToCase`, `updateCaseTask`, `deleteCaseTask`, `fetchTasksByAssignee`, plus five task document variants.
- Types: `TaskStatus` enum (Open, InProgress, OnHold, Blocked, Closed), `CaseTask`, `AddCaseTaskRequest`, `UpdateCaseTaskRequest`, `TaskDocument`, `AddTaskDocumentRequest`, `UpdateTaskDocumentRemarksRequest` in `src/app/organization/types/caseindex.ts`.
- Shared UI: `EmptyState`, `LoadingState`, `ConfirmDialog` in `../shared/`.

### Gaps to Close
1. Verify `SiteCaseClient` RBAC guards on Add/Edit/Delete buttons in `TasksTab` — must be hidden (not disabled).
2. Verify `updateTaskDocumentRemarks` is wired in `useCaseTasks`; add if missing.
3. No unit tests for `TasksTab` or `useCaseTasks`.
4. No E2E tests for the tasks golden path.

### What Is New
- Unit tests: `TasksTab.test.tsx`, `useCaseTasks.test.ts`
- E2E test: `e2e/007-case-task-management.spec.ts`

---

## 2. Architecture Flow

### 2.1 View Tasks

```
Case detail page mounts Tasks tab
  → TasksTabContainer renders
  → useCaseTasks(orgId, siteId, caseId, undefined, siteUsers)
  → useEffect: fetchCaseTasks() → GET /tasks
  → setTasks(data)
  → if tasks.length === 0 → <EmptyState>
  → else → <Table> with task rows
```

### 2.2 Add Task

```
Authorized user clicks "Add Task" (hidden for SiteCaseClient)
  → setShowAddTask(true) → AddTaskModal opens
  → User fills: title (req), description, assignedToId (req), dueDate (req), status (req)
  → blur → addTaskValidation.validateSingleField(field, value)
  → Submit → addTaskValidation.validate(form)
  → addTaskToCase(orgId, siteId, caseId, payload)
      → POST /tasks
  → 201 → showSuccess → setTasks([...tasks, newTask])
  → 400 → extractApiErrors → setTaskApiErrors
```

### 2.3 Update Task

```
Authorized user clicks edit icon on a task row
  → EditTaskModal opens with current values pre-filled
  → User edits fields
  → Submit → updateCaseTask(orgId, siteId, caseId, taskId, payload)
      → PUT /tasks/{taskId}
  → 200 → showSuccess → refetch/update local state
  → error → showError
```

### 2.4 Delete Task

```
Authorized user clicks delete icon
  → setTaskToDelete(task) → setDeleteTaskModalOpen(true)
  → DeleteConfirmationModal renders
  → User confirms → deleteCaseTask(orgId, siteId, caseId, taskId)
      → DELETE /tasks/{taskId}
  → 204 → showSuccess → remove task from local state
  → error → showError → modal stays open
```

### 2.5 RBAC Gate

```
TasksTab renders
  → useUserRole(orgId) → isSiteCaseClient
  → {!isSiteCaseClient && <Button>Add Task</Button>}
  → {!isSiteCaseClient && <IconButton>Edit</IconButton>}
  → {!isSiteCaseClient && <IconButton>Delete</IconButton>}
  → SiteCaseClient sees read-only task rows only
```

---

## 3. File Structure

### Documentation
```
specs/007-case-task-management/
  spec.md                          NO CHANGE
  plan.md                          NEW (this file)
  research.md                      NEW
  data-model.md                    NEW
  contracts/
    api-contracts.md               NEW
```

### Source Tree
```
src/app/organization/[id]/sites/[siteId]/cases/[caseId]/
  components/
    TasksTab/
      TasksTab.tsx                 VERIFY — SiteCaseClient RBAC guards on all action buttons
      TasksTab.module.css          NO CHANGE
      index.ts                     NO CHANGE
  hooks/
    useCaseTasks.ts                VERIFY — updateTaskDocumentRemarks wiring; wire if missing
  types/
    index.ts                       NO CHANGE (TaskFiltersState defined here)

src/app/organization/
  types/
    caseindex.ts                   NO CHANGE (all task types already defined)
  services/
    caseapi.ts                     NO CHANGE (all task + task document API functions exist)

src/components/modals/
  AddTaskModal.tsx                 NO CHANGE
  EditTaskModal.tsx                NO CHANGE
  DeleteConfirmationModal.tsx      NO CHANGE

src/utils/
  caseValidationSchemas.ts         NO CHANGE (CaseTaskSchemas.add/update already defined)

e2e/
  007-case-task-management.spec.ts NEW
```

---

## 4. Component Design

### 4.1 `TasksTabContainer` (entry point in `TasksTab.tsx`)
- **Purpose**: Instantiates `useCaseTasks` and passes all state/handlers as props to the presentational `TasksTab`.
- **Props**: `{ caseId, siteId, organizationId, siteUsers, initialStatusFilter? }`
- **Role check**: `useUserRole(organizationId)` → `isSiteCaseClient`

### 4.2 `TasksTab` (presentational layer in `TasksTab.tsx`)
- **Purpose**: Renders task table, add/edit/delete modals, task detail expansion.
- **RBAC rendering**:
  ```typescript
  {!isSiteCaseClient && (
    <Button startIcon={<AddTaskIcon />} onClick={onShowAddTask}>Add Task</Button>
  )}
  // per-row:
  {!isSiteCaseClient && <IconButton onClick={() => onEditTask(task)}><EditIcon /></IconButton>}
  {!isSiteCaseClient && <IconButton onClick={() => onDeleteTask(task)}><DeleteIcon /></IconButton>}
  ```
- **Empty state**: `tasks.length === 0 && !loadingTasks → <EmptyState message="No tasks yet" />`
- **Status badge**: Existing `Chip` color mapping in component (Open=blue, InProgress=amber, OnHold=orange, Blocked=red, Closed=grey).

### 4.3 `AddTaskModal`
- **Fields**: title (required), description (optional), assignee dropdown (required, `siteUsers`), due date picker (required, past allowed), status dropdown (required, default Open).
- **Validation**: `CaseTaskSchemas.add` via `useFormValidation`.

### 4.4 `EditTaskModal`
- **Pre-fills**: all current task values.
- **Validation**: `CaseTaskSchemas.update`.

### 4.5 Task Document Sub-section (within task detail expansion in `TasksTab`)
- **Purpose**: Upload, list, download, delete documents attached to a specific task.
- **RBAC**: SiteCaseClient can view and download; Delete and remarks-update hidden.
- **Empty-file guard**: `file.size === 0` check before calling `addTaskDocument`.

---

## 5. API Plan

| Method | URL (relative to case base) | Auth | Request | Success | Error Codes | Status |
|--------|-----------------------------|------|---------|---------|-------------|--------|
| `GET` | `/tasks` | Bearer | — | `{ data: CaseTask[] }` | 401, 403 | Existing |
| `POST` | `/tasks` | Bearer | `AddCaseTaskRequest` | `{ data: CaseTask }` 201 | 400, 401, 403 | Existing |
| `PUT` | `/tasks/{taskId}` | Bearer | `UpdateCaseTaskRequest` | `{ data: CaseTask }` 200 | 400, 401, 403, 404 | Existing |
| `DELETE` | `/tasks/{taskId}` | Bearer | — | 204 | 401, 403, 404 | Existing |
| `GET` | `/tasks/assignee/{assigneeId}` | Bearer | — | `{ data: CaseTask[] }` | 401, 403 | Existing |
| `GET` | `/tasks/{taskId}/documents` | Bearer | — | `{ data: TaskDocument[] }` | 401, 403, 404 | Existing |
| `POST` | `/tasks/{taskId}/documents` | Bearer | `AddTaskDocumentRequest` | `{ data: TaskDocument }` 201 | 400, 401, 403, 404 | Existing |
| `GET` | `/tasks/{taskId}/documents/{docId}` | Bearer | — | `{ data: TaskDocument }` with content | 401, 403, 404 | Existing |
| `DELETE` | `/tasks/{taskId}/documents/{docId}` | Bearer | — | 204 | 401, 403, 404 | Existing |
| `PUT` | `/tasks/{taskId}/documents/{docId}/remarks` | Bearer | `{ remarks }` | `{ data: TaskDocument }` | 400, 401, 403, 404 | Existing |

All URLs are prefixed: `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}`

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| SiteCaseClient seeing Add/Edit/Delete controls | `{!isSiteCaseClient && ...}` in `TasksTab`; backend enforces `[Authorize]` as security gate |
| SiteCaseClient reaching task write API directly | Backend role enforcement; frontend guard is defense-in-depth only |
| XSS via task title/description | Controlled React inputs; values never injected via `dangerouslySetInnerHTML` |
| Empty-file upload (0 bytes) | `file.size === 0` guard in `useCaseTasks` before calling `addTaskDocument` |
| Task document from different case/task | Backend validates ownership; 404 returned if mismatch |
| Token expiry during upload | `getTaskToken()` fetched per-request; 401 triggers refresh or logout via `httpServices` interceptor |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `tasks`, `loadingTasks` | `useCaseTasks` (local) | Case-scoped; not shared across routes |
| `taskForm`, `editTaskForm` | `useCaseTasks` (local) | Form state; ephemeral |
| `taskFilters` (`TaskFiltersState`) | `useCaseTasks` (local) | UI-only filter; no persistence needed |
| `deleteTaskModalOpen`, `taskToDelete` | `useCaseTasks` (local) | Dialog visibility; ephemeral |
| `taskDocuments` per task | `useCaseTasks` (local) | Loaded on task expansion; scoped to session |
| Role flags (`isSiteCaseClient`, etc.) | `useUserRole` (local, derived from Redux profile) | Per-session; no persist needed |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `TasksTab.test.tsx` | SiteAdmin role → Add Task button visible | Button renders |
| `TasksTab.test.tsx` | SiteCaseClient role → Add/Edit/Delete hidden | Zero action controls in DOM |
| `TasksTab.test.tsx` | Empty task list → EmptyState shown | EmptyState component renders |
| `TasksTab.test.tsx` | Delete button click → DeleteConfirmationModal opens | Modal in DOM |
| `TasksTab.test.tsx` | Confirm delete → deleteCaseTask called | API mock called once |
| `useCaseTasks.test.ts` | fetchCaseTasks success → tasks populated | State contains returned tasks |
| `useCaseTasks.test.ts` | addTaskToCase success → task appended to list | List length increases by 1 |
| `useCaseTasks.test.ts` | addTaskToCase 400 → taskApiErrors set | Error state populated |
| `useCaseTasks.test.ts` | Empty file upload → API not called | `addTaskDocument` mock not invoked |

Test files: `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/TasksTab/__tests__/TasksTab.test.tsx`

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| Create a task — golden path | SiteClerk | Nav to case > Tasks, click Add Task, fill all fields, submit | Task appears in list with correct status badge |
| SiteCaseClient sees read-only | SiteCaseClient | Nav to case > Tasks | No Add/Edit/Delete buttons in DOM |
| Edit task status | SiteAdmin | Click edit on task, change status to InProgress, save | Updated status badge shown |
| Delete task | SiteAdmin | Click delete, confirm in dialog | Task removed from list |
| Empty task list | SiteAdmin | Nav to case with no tasks | Empty state message visible (not an error) |
| Filter tasks by assignee | SiteClerk | Apply My Tasks filter | Only assigned tasks shown |

Test file: `e2e/007-case-task-management.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-002: Task list renders within 2s | `fetchCaseTasks` called on tab mount; `LoadingState` spinner shown during fetch |
| Assignee search | MUI Autocomplete on `siteUsers` array (client-side); no extra API calls |
| Status filter | Client-side filter on already-fetched `tasks` array; no re-fetch |
| Task documents on expansion | Fetched lazily on task row expansion — not eagerly with the task list |
| Large task lists | `React.memo` on task row component; consider virtualization if > 100 tasks |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| Tasks list fetched | INFO | `caseId`, count returned | Task titles, descriptions |
| Task created | INFO | `caseId`, `taskId`, `status` | Task title, assignee name |
| Task updated | INFO | `taskId`, fields changed (keys only) | New field values |
| Task deleted | INFO | `taskId` | Task title |
| Task document uploaded | INFO | `taskId`, `documentId`, file size | Filename, file content |
| Task document deleted | INFO | `taskId`, `documentId` | Filename |
| SiteCaseClient write attempt blocked | WARN | `userId`, `caseId` | — |
| API error (any task operation) | ERROR | HTTP status, `taskId` | Token value |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SiteCaseClient RBAC guard missing or incomplete in `TasksTab` | Medium | High | Audit every action button; add `{!isSiteCaseClient && ...}` guard before any render |
| `updateTaskDocumentRemarks` not wired in `useCaseTasks` | Medium | Low | Check hook; add `PUT /remarks` call if absent |
| `TaskStatus.Blocked` not in spec but returned from API | Low | Low | Display as-is with red badge; no special handling needed |
| Task due date timezone mismatch (API vs display) | Medium | Medium | Use `formatDateForInput` / `formatDateForAPI` utilities consistently — do not construct raw ISO strings inline |
| Large `siteUsers` list causing slow assignee dropdown | Low | Low | MUI Autocomplete handles client-side filtering; no change needed unless list exceeds 500 users |
| Task delete cascades to task documents/comments without user awareness | Medium | Medium | Delete confirmation dialog should state "This will also delete all documents and comments attached to this task." |
