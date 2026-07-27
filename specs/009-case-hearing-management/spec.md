# Feature Specification: Case Hearing Management

**Feature Branch**: `009-case-hearing-management`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow authorized users to schedule, view, update, and delete court hearings attached to legal cases. The Hearings tab on the case detail page manages case-level hearings. A site-level "Upcoming Hearings" view aggregates all future hearings across the site's cases. Past hearing dates are accepted to support historical records.

---

## Actors

| Actor | Schedule | View case hearings | Upcoming site view | Update | Delete |
|---|---|---|---|---|---|
| `OrganizationAdmin` | Yes | Yes | Yes | Yes | Yes |
| `OrganizationClerk` | No | No | Yes (site view) | No | No |
| `SiteAdmin`, `SiteClerk`, `SiteSrLegalExpert`, `SiteLegalExpert` | Yes | Yes | Yes | Yes | Yes |
| `SiteCaseClient` | No | Yes (read-only) | No | No | No |

---

## User Scenarios & Testing

### P1 — View Upcoming Hearings Across the Site (Priority: P1)

As an OrganizationAdmin or site user,
I want to see all upcoming court hearings across all cases in my site in one view,
So that I can plan court attendance and avoid scheduling conflicts.

**Independent Test**: Navigate to Site > Hearings. The list shows all future hearings ordered by date, with case and location info.

**Acceptance Scenarios**:

1. **Given** an authenticated SiteAdmin on the site overview,
   **When** they navigate to the site-level Hearings view,
   **Then** all future hearings across all cases are displayed ordered by date (earliest first), showing: hearing date/time, location, assigned attendee, case name.

2. **Given** no upcoming hearings exist,
   **When** the Hearings view loads,
   **Then** an empty state message is shown (not an error).

3. **Given** an OrganizationClerk navigating to the site hearings view,
   **When** the page loads,
   **Then** they can see upcoming hearings but have no schedule/edit/delete controls.

---

### P2 — Schedule a Hearing on a Case (Priority: P2)

As an authorized user,
I want to schedule a hearing for a specific case,
So that the court date is tracked in the system.

**Acceptance Scenarios**:

1. **Given** an authorized user on the case Hearings tab,
   **When** they click "Schedule Hearing",
   **Then** a form opens with: hearing date/time picker, location/court name, assigned attendee, notes (optional), status dropdown.

2. **Given** all required fields are filled (including a past date for historical record),
   **When** the form is submitted,
   **Then** the hearing is created successfully and appears in the hearings list.

3. **Given** a SiteCaseClient viewing the Hearings tab,
   **When** the tab loads,
   **Then** they see hearing records read-only — no "Schedule Hearing" button is visible.

---

### P3 — Update and Delete Hearings (Priority: P3)

As an authorized user,
I want to edit or delete a scheduled hearing,
So that court date changes are reflected accurately.

**Acceptance Scenarios**:

1. **Given** an authorized user on the case Hearings tab,
   **When** they click edit on a hearing,
   **Then** an edit form opens with current values pre-filled.

2. **Given** the user changes the hearing date and saves,
   **When** the update succeeds,
   **Then** the updated hearing date is shown in the list.

3. **Given** an authorized user deletes a hearing and confirms,
   **When** deletion succeeds,
   **Then** the hearing is removed from the list.

---

### Edge Cases

- Past hearing dates accepted on create and update (historical records)
- Empty hearing list → empty state, not an error
- SiteCaseClient accessing the Hearings tab → read-only list with no action buttons

---

## Requirements

### Functional Requirements

- **FR-001**: A site-level Upcoming Hearings view MUST show all future hearings across all cases, ordered by date ascending.
- **FR-002**: The case Hearings tab MUST show all hearings for the case (past and future).
- **FR-003**: The Schedule Hearing form MUST include: date/time picker, location field, attendee selector (site users), notes (optional), status dropdown.
- **FR-004**: Past hearing dates MUST be accepted without validation errors.
- **FR-005**: SiteCaseClient MUST see the Hearings tab in read-only mode with no write controls.
- **FR-006**: OrganizationClerk MUST see the site-level upcoming hearings but have no write access.
- **FR-007**: Delete MUST require confirmation.
- **FR-008**: An empty hearings list MUST display an empty state, not an error.

### Key Entities

- **Hearing**: A scheduled court appearance with date/time, location, assignee, notes, and status.
- **Site Upcoming Hearings**: Future-only aggregated view across all cases in the site.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: The upcoming hearings list renders within 2 seconds for a site with up to 50 active cases.
- **SC-002**: Hearings are displayed in chronological order (earliest first) without any client-side sorting required.
- **SC-003**: SiteCaseClient users see zero write controls on the Hearings tab.
- **SC-004**: Past hearing dates are scheduled without form errors.

---

## Assumptions

- The site-level upcoming hearings view is accessible from the site dashboard or navigation, not only from within a case.
- The attendee picker for hearings uses the same site user list as the case and task assignee pickers.

---

## Out of Scope

- Organization-level hearing view (all orgs' hearings) — spec `024-organization-hearings`
- Calendar/notification integrations — not implemented
