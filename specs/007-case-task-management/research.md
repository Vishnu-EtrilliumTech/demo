# Research: Case Task Management

**Branch**: `007-case-task-management` | **Date**: 2026-05-15

---

## 1. Existing Infrastructure

### Decision: Use existing `useCaseTasks` hook
- **Rationale**: `useCaseTasks.ts` already implements full CRUD for tasks and task documents with filtering, sorting, search, and form validation. No new hook required.
- **Alternatives considered**: New dedicated hook — rejected; existing hook is feature-complete.

### Decision: Use existing `caseapi.ts` service functions
- **Rationale**: All ten task-related API functions are already implemented in `src/app/organization/services/caseapi.ts` (`fetchCaseTasks`, `addTaskToCase`, `updateCaseTask`, `deleteCaseTask`, `fetchTasksByAssignee`, and five task document variants).
- **Alternatives considered**: Separate task service file — rejected; co-location in `caseapi.ts` is the established pattern.

### Decision: Use existing modals from `@/components/modals/`
- **Rationale**: `AddTaskModal`, `EditTaskModal`, and `DeleteConfirmationModal` are already wired in `TasksTab.tsx`. Reusing them avoids duplication.

---

## 2. RBAC Pattern

### Decision: Conditional rendering via `useUserRole` hook
- **Rationale**: The `useUserRole(orgId)` hook returns `isSiteCaseClient`, `canEditCases`, and `canDeleteCases`. Action buttons must be wrapped in `{!isSiteCaseClient && ...}` guards — hidden, not disabled.
- **Alternatives considered**: CSS visibility — rejected; hidden elements can still be reached by keyboard or programmatic access.

---

## 3. TaskStatus Enum

The existing `TaskStatus` enum in `src/app/organization/types/caseindex.ts` defines five values:
`Open | InProgress | OnHold | Blocked | Closed`

The spec requires at minimum: Open, In Progress, Done. The existing enum supersedes the spec's minimum — `Closed` maps to "Done" in the UI display label, `Blocked` is an additional operational state.

**Decision**: Use the existing five-value enum as-is. Display labels map:
- `Open` → "Open"
- `InProgress` → "In Progress"
- `OnHold` → "On Hold"
- `Blocked` → "Blocked"
- `Closed` → "Done / Closed"

---

## 4. Task Document Sub-feature

Task documents (attach files to a task) are managed within `useCaseTasks` alongside task CRUD. The `TasksTab` renders task documents in a task detail expansion row. This satisfies spec 007's scope boundary with spec 008.

**Decision**: Task document APIs live in `useCaseTasks` / `caseapi.ts`. The `DocumentsTab` handles case-level documents only (spec 008).

---

## 5. Assignee Picker

The assignee dropdown uses `siteUsers` prop passed down from the case detail page, which fetches via `fetchSiteUsers`. This is consistent with the case creation (spec 005) and hearing assignee patterns.

---

## 6. Date Handling

- Due dates use `formatDateForInput` / `formatDateForAPI` utilities from `../utils`.
- Past due dates are allowed per spec FR-004.

---

## 7. Gaps Identified

| Gap | Severity | Disposition |
|-----|----------|-------------|
| SiteCaseClient RBAC enforcement in `TasksTab` | High | Verify `{!isSiteCaseClient && ...}` guards on Add/Edit/Delete buttons |
| Unit tests for `TasksTab` and `useCaseTasks` | Medium | Create as part of this spec |
| E2E tests for tasks golden path | Medium | Create as part of this spec |
| `updateTaskDocumentRemarks` not wired in `useCaseTasks` | Low | Verify; wire if missing |
