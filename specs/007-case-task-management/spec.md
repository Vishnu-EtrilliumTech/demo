# Feature Specification: Case Task Management

**Feature Branch**: `007-case-task-management`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow authorized users to create, view, update, and delete tasks within a legal case. Tasks represent specific work items assigned to team members with a due date and status. SiteCaseClient can view tasks but cannot create, edit, or delete them.

---

## Actors

| Actor | Create | View | Update | Delete |
|---|---|---|---|---|
| `OrganizationAdmin`, `SiteAdmin`, `SiteClerk`, `SiteSrLegalExpert`, `SiteLegalExpert` | Yes | Yes | Yes | Yes |
| `SiteCaseClient` | No | Yes (read-only) | No | No |
| `OrganizationClerk` | No | No | No | No |

---

## User Scenarios & Testing

### P1 — Create a Task (Priority: P1)

As an authorized user working on a case,
I want to add a task with a title, assignee, due date, and status,
So that specific work items are tracked and assigned.

**Independent Test**: Navigate to Case > Tasks tab > Add Task. Fill all fields and submit. Task appears in the tasks list.

**Acceptance Scenarios**:

1. **Given** an authorized user on the case Tasks tab,
   **When** they click "Add Task",
   **Then** a form (modal or inline) opens with: title (required), description (optional), assigned team member (required, user selector), due date (required, date-time picker), status (required, dropdown).

2. **Given** all required fields are filled,
   **When** the form is submitted,
   **Then** a success notification appears and the task appears in the task list.

3. **Given** a SiteCaseClient is on the case Tasks tab,
   **When** the tab loads,
   **Then** no "Add Task" button is visible and all task rows are read-only.

---

### P2 — View and Filter Tasks (Priority: P2)

As any authorized user,
I want to see all tasks for a case and optionally filter by assignee,
So that I can track workload across the team.

**Acceptance Scenarios**:

1. **Given** an authorized user on the Tasks tab,
   **When** the tab loads,
   **Then** all tasks for the case are listed with: title, assignee name, due date, status badge.

2. **Given** an empty task list,
   **When** the tab loads,
   **Then** an empty state message is shown (not an error).

3. **Given** a user selects "My Tasks" or filters by an assignee,
   **When** the filter is applied,
   **Then** only tasks matching that assignee are shown.

---

### P3 — Update a Task (Priority: P3)

As an authorized user,
I want to edit a task's status, assignee, or due date,
So that the task reflects the current state of work.

**Acceptance Scenarios**:

1. **Given** an authorized user clicks on a task to edit it,
   **When** an edit form opens with the current values pre-filled,
   **Then** the user can update any field and save successfully.

2. **Given** a status change from "Open" to "Done",
   **When** the user saves,
   **Then** the task list refreshes with the updated status badge.

---

### P4 — Delete a Task (Priority: P4)

As an authorized user,
I want to delete a task that is no longer needed,
So that the task list stays clean and relevant.

**Acceptance Scenarios**:

1. **Given** an authorized user clicks "Delete" on a task,
   **When** a confirmation dialog appears and is confirmed,
   **Then** the task is removed from the list.

---

### Edge Cases

- Due date in the past → accepted (historical records are valid)
- Task not found → 404 page or "Task not found" inline message
- SiteCaseClient clicking a task → view-only modal opens with no edit controls

---

## Requirements

### Functional Requirements

- **FR-001**: The Tasks tab MUST show all tasks for the case with: title, assignee, due date, status badge.
- **FR-002**: The Add Task form MUST include: title (required), description (optional), assignee selector (required, site users), due date picker (required), status dropdown (required).
- **FR-003**: The status dropdown MUST include at least: Open, In Progress, Done.
- **FR-004**: Past due dates MUST be allowed without showing a validation error.
- **FR-005**: SiteCaseClient MUST see a read-only view with no create/edit/delete controls.
- **FR-006**: Delete MUST require confirmation via a dialog.
- **FR-007**: An empty task list MUST display an empty state, not an error.

### Key Entities

- **Task**: A work item with title, description, assignee, due date, and status.
- **Task Status**: Tracks lifecycle — e.g., Open, In Progress, Done.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Authorized users can create a task in under 60 seconds.
- **SC-002**: Task list renders within 2 seconds of tab activation.
- **SC-003**: SiteCaseClient sees tasks but has zero visible write controls.
- **SC-004**: Past due dates are accepted without form validation errors.

---

## Assumptions

- Assignee picker loads the list of site users (same API used for case assignment).
- Status options for tasks may differ from case status — implementation defines the exact enum.
- Tasks are displayed in a list within the Tasks tab on the case detail page.

---

## Out of Scope

- Task documents — spec `008-case-document-management`
- Task comments — spec `012-case-comment-management`
