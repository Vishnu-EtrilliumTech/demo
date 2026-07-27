# Feature Specification: Case Read, Update & Delete

**Feature Branch**: `006-case-read-update-delete`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow authorized users to view, search, filter, edit, and delete cases after creation. The case list provides a site-level overview, and the case detail page shows full information including all linked sub-entities. Status changes and reassignment are done via the edit flow.

---

## Actors

| Actor | List | View detail | Update | Delete |
|---|---|---|---|---|
| `OrganizationAdmin` | Yes | Yes | Yes | Yes |
| `OrganizationClerk` | Yes (list only) | No | No | No |
| `SiteAdmin` | Yes | Yes | Yes | Yes |
| `SiteClerk` | Yes | Yes | Yes | Yes |
| `SiteSrLegalExpert` | Yes | Yes | Yes | No |
| `SiteLegalExpert` | Yes | Yes | Yes | No |
| `SiteCaseClient` | No | Yes (own cases) | No | No |

---

## User Scenarios & Testing

### P1 — View Cases List with Status Filter (Priority: P1)

As any authorized user,
I want to see all cases for my site with an optional status filter,
So that I can quickly find the cases I need to work on.

**Independent Test**: As SiteClerk, navigate to Site > Cases. The list renders. Apply a "Open" filter — only open cases remain visible.

**Acceptance Scenarios**:

1. **Given** an authorized user on the site Cases page,
   **When** the page loads,
   **Then** a list of all cases for the site is displayed with case title, number, status, assigned team member, and last updated date.

2. **Given** the cases list is showing,
   **When** the user selects a status filter (Open, In Progress, On Hold, Closed),
   **Then** the list updates to show only cases with that status.

3. **Given** the site has no cases,
   **When** the cases page loads,
   **Then** an empty state message is displayed (not an error).

---

### P2 — View Case Detail Page (Priority: P2)

As an authorized user,
I want to click on a case and see all its details including tasks, hearings, documents, clients, invoices, and comments,
So that I have full context for the legal matter in one place.

**Acceptance Scenarios**:

1. **Given** an authorized user on the cases list,
   **When** they click on a case,
   **Then** the case detail page opens with: case header info, and tabs/sections for Tasks, Documents, Hearings, Clients, Invoices, and Comments.

2. **Given** a `SiteCaseClient` authenticated user,
   **When** they view a case they are assigned to,
   **Then** they see the case detail (read-only, no edit/delete controls visible).

---

### P3 — Update Case (Priority: P3)

As an authorized user,
I want to edit a case's details, status, or assigned team member,
So that the case record stays accurate as the matter progresses.

**Acceptance Scenarios**:

1. **Given** an authorized user on the case detail page,
   **When** they click "Edit Case",
   **Then** an edit form opens (modal or inline) with the current values pre-filled.

2. **Given** the user updates the status to "In Progress" and saves,
   **When** the save succeeds,
   **Then** the case detail page refreshes with the updated status.

3. **Given** the user submits an empty title field,
   **When** the save is attempted,
   **Then** the existing title is preserved (empty fields do not overwrite existing values).

---

### P4 — Delete Case (Priority: P4)

As an OrganizationAdmin, SiteAdmin, or SiteClerk,
I want to permanently delete a case and all its associated records,
So that closed or erroneous cases can be removed from the system.

**Acceptance Scenarios**:

1. **Given** an authorized user on the case detail page,
   **When** they click "Delete Case",
   **Then** a confirmation dialog appears: "Are you sure you want to permanently delete this case and all its associated data? This cannot be undone."

2. **Given** the user confirms deletion,
   **When** deletion succeeds,
   **Then** the user is redirected to the cases list and the deleted case is no longer visible.

3. **Given** a SiteSrLegalExpert or SiteLegalExpert is on the case detail page,
   **When** the page renders,
   **Then** no "Delete Case" button is visible.

---

### Edge Cases

- Invalid status filter value → UI prevents invalid values via dropdown control
- OrganizationClerk navigating to case detail URL directly → access denied page or redirect
- Deleted case URL visited → 404 page or "Case not found" message

---

## Requirements

### Functional Requirements

- **FR-001**: The Cases page MUST display a list of cases with title, case number, status badge, assignee name, and last updated date.
- **FR-002**: A status filter dropdown MUST allow filtering by: All, Open, In Progress, On Hold, Closed.
- **FR-003**: Clicking a case MUST navigate to the case detail page.
- **FR-004**: The case detail page MUST show case information and include tab sections for Tasks, Documents, Hearings, Clients, Invoices, and Comments.
- **FR-005**: Edit and Delete controls MUST be hidden for roles without those permissions.
- **FR-006**: Delete MUST require confirmation via a dialog before proceeding.
- **FR-007**: The edit form MUST pre-fill all current case values and preserve existing values for any empty submitted fields.
- **FR-008**: `OrganizationClerk` accessing a case detail URL MUST see an access denied message.

### Key Entities

- **Case List Item**: Title, number, status badge, assignee, last updated — displayed in a card or table row.
- **Case Detail**: Full case data plus linked sub-entities displayed in tabs.
- **Status Badge**: Color-coded visual indicator of current case status.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: The case list renders within 2 seconds of page load for a site with up to 100 cases.
- **SC-002**: Status filter applies within 1 second without a full page reload.
- **SC-003**: Delete confirmation prevents accidental deletion — zero deletion events without explicit confirmation.
- **SC-004**: Role-based action visibility is enforced on first render (no flash of unauthorized buttons).

---

## Assumptions

- The case detail page loads case data including all sub-entities in a single API call or in parallel calls per tab.
- Status badges use distinct colors: Open (blue), In Progress (yellow), On Hold (orange), Closed (grey/red).
- The cases list supports at least basic search by case title or case number.

---

## Out of Scope

- Case creation — spec `005-create-case`
- Case sub-entity management (tasks, documents, hearings, invoices, comments) — specs `007`–`012`
- Case AI summary/chat — spec `018-case-ai`
