# Feature Specification: Case Comment Management

**Feature Branch**: `012-case-comment-management`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow authorized users to add, view, reply to, edit, and delete comments on cases and on tasks. Comments support one level of nested replies. Edit and delete are restricted to the comment's author — non-authors can only add replies and read. SiteCaseClient has full comment participation. OrganizationClerk has no access to comments.

---

## Actors

| Actor | Add comment | Reply | View | Edit (own) | Delete (own) |
|---|---|---|---|---|---|
| `OrganizationAdmin`, `SiteAdmin`, `SiteClerk`, `SiteSrLegalExpert`, `SiteLegalExpert`, `SiteCaseClient` | Yes | Yes | Yes | Yes | Yes |
| `OrganizationClerk` | No | No | No | No | No |

---

## User Scenarios & Testing

### P1 — Add and View Comments on a Case (Priority: P1)

As an authorized user (including SiteCaseClient),
I want to add comments to a case and see comments from other team members,
So that we can communicate about the case within the platform.

**Independent Test**: Navigate to Case > Comments section. Type a comment and submit. The comment appears at the top of the thread.

**Acceptance Scenarios**:

1. **Given** an authorized user on the case Comments section,
   **When** they type a comment in the input box and submit,
   **Then** the comment appears in the thread with the author's name and timestamp.

2. **Given** a comment thread with nested replies,
   **When** the Comments section loads,
   **Then** top-level comments are shown with their replies indented underneath.

3. **Given** an OrganizationClerk navigating to a case,
   **When** the case detail page loads,
   **Then** the Comments section is not visible or shows an access restricted message.

---

### P2 — Reply to a Comment (Priority: P2)

As an authorized user,
I want to reply directly to an existing comment,
So that discussion threads are organized and easy to follow.

**Acceptance Scenarios**:

1. **Given** an authorized user reading a comment,
   **When** they click "Reply" on the comment,
   **Then** an inline reply input appears under the comment.

2. **Given** a reply is submitted,
   **When** the reply is saved,
   **Then** it appears nested under the parent comment with the author's name.

---

### P3 — Edit and Delete Own Comments (Priority: P3)

As the author of a comment,
I want to edit or delete my own comments,
So that I can correct mistakes or remove outdated information.

**Acceptance Scenarios**:

1. **Given** the logged-in user views their own comment,
   **When** the comment renders,
   **Then** an "Edit" and "Delete" option are visible on that comment only.

2. **Given** the user edits their comment and saves,
   **When** the edit succeeds,
   **Then** the comment text updates in place with an "edited" indicator.

3. **Given** the user deletes a parent comment and confirms,
   **When** deletion succeeds,
   **Then** the comment and all its replies are removed from the thread.

4. **Given** the user views another user's comment,
   **When** the comment renders,
   **Then** no Edit or Delete controls are visible (even for SystemAdmin viewing others' comments).

---

### Edge Cases

- Empty comment text → submit button disabled or inline error shown
- Deleting a parent comment removes all replies — confirmation dialog should mention this
- Task-level comments follow identical rules within the task detail view

---

## Requirements

### Functional Requirements

- **FR-001**: The Comments section MUST display a chronological thread with top-level comments and nested replies.
- **FR-002**: A comment input box with submit button MUST be available at the bottom or top of the thread for authorized users.
- **FR-003**: Each comment MUST show: author name, timestamp, comment text.
- **FR-004**: Edit and Delete controls MUST only appear on comments authored by the current user.
- **FR-005**: Deleting a parent comment MUST warn the user that replies will also be deleted.
- **FR-006**: Reply controls MUST appear on all visible top-level comments.
- **FR-007**: Task-level comments MUST follow the identical UI pattern, accessible from within the task detail view.
- **FR-008**: OrganizationClerk MUST NOT see the Comments section.
- **FR-009**: An empty comment string MUST NOT be submittable.

### Key Entities

- **Comment**: Text authored by a user, attached to a case or task. Has author, timestamp, and text.
- **Reply**: A nested comment linked to a parent comment (one level deep).

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: A user can add a comment and see it in the thread within 1 second.
- **SC-002**: Author-only controls (Edit, Delete) render correctly for 100% of comments — zero cases where a user sees controls on others' comments.
- **SC-003**: Deleting a parent comment removes all replies without manual cleanup required.
- **SC-004**: OrganizationClerk users see zero comment-related UI.

---

## Assumptions

- The Comments section is a scrollable thread on the case detail page (similar to a team chat).
- Comments are not paginated for MVP — all comments for a case are loaded at once.
- An "edited" marker (e.g., "(edited)") is shown on comments that have been updated.

---

## Out of Scope

- Comment notifications — not implemented
- Comment search — not implemented
- Comment pagination — not implemented
