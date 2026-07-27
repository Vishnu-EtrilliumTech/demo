# Feature Specification: Site Legal Expert Dashboard

**Feature Branch**: `020-site-legal-expert-dashboard`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Provide SiteLegalExpert and SiteSrLegalExpert users with a personal dashboard showing their assigned cases, tasks, and upcoming hearings. This dashboard is the landing page for org-based legal experts after login — giving them a consolidated view of their work without navigating into individual cases.

---

## Actors

| Actor | Dashboard access |
|---|---|
| `SiteLegalExpert` | Yes — own assigned work |
| `SiteSrLegalExpert` | Yes — same as SiteLegalExpert |
| `OrganizationAdmin` | Can view any user's dashboard |
| `SystemAdmin` | Can view any user's dashboard |

> SiteLegalExpert and SiteSrLegalExpert have identical dashboard capabilities.

---

## User Scenarios & Testing

### P1 — View Assigned Cases on Dashboard (Priority: P1)

As a SiteLegalExpert,
I want to see all cases assigned to me on my dashboard,
So that I can quickly identify what legal matters I need to work on today.

**Independent Test**: Log in as SiteLegalExpert. Dashboard loads and shows cards/sections for assigned cases, tasks, and upcoming hearings.

**Acceptance Scenarios**:

1. **Given** an authenticated SiteLegalExpert logs in,
   **When** the dashboard loads,
   **Then** a "My Cases" section shows all cases assigned to them with: case title, case number, status badge, and last updated date.

2. **Given** no cases are assigned to the expert,
   **When** the dashboard loads,
   **Then** the "My Cases" section shows an empty state message (not an error).

3. **Given** a SiteLegalExpert from Site A navigating to Site B's dashboard URL,
   **When** the page loads,
   **Then** an access denied error is shown.

---

### P2 — View Assigned Tasks on Dashboard (Priority: P2)

As a SiteLegalExpert,
I want to see tasks assigned to me across my cases,
So that I can track my pending work items.

**Acceptance Scenarios**:

1. **Given** the dashboard is loaded,
   **When** the "My Tasks" section renders,
   **Then** tasks assigned to the expert are listed with: task title, case name, due date, status badge.

2. **Given** tasks with past due dates,
   **When** the tasks load,
   **Then** overdue tasks are highlighted visually (e.g., red due date).

3. **Given** no tasks assigned to the expert,
   **When** the tasks section loads,
   **Then** an empty state message is shown.

---

### P3 — View Upcoming Hearings on Dashboard (Priority: P3)

As a SiteLegalExpert,
I want to see all upcoming court hearings in my site,
So that I can plan my court attendance.

**Acceptance Scenarios**:

1. **Given** the dashboard is loaded,
   **When** the "Upcoming Hearings" section renders,
   **Then** all future hearings in the site are shown ordered by date: hearing date/time, location, case name.

2. **Given** no upcoming hearings,
   **When** the hearings section loads,
   **Then** an empty state is shown.

---

### P4 — Quick Navigation from Dashboard (Priority: P4)

As a SiteLegalExpert,
I want to click on a case or task from my dashboard,
So that I can navigate directly to the relevant record without having to browse the full case list.

**Acceptance Scenarios**:

1. **Given** the expert clicks on a case card on the dashboard,
   **When** the click is registered,
   **Then** they are navigated to the full case detail page.

2. **Given** the expert clicks on a task on the dashboard,
   **When** the click is registered,
   **Then** they are navigated to the task detail within its case.

---

### Edge Cases

- Expert with cases but no tasks → Cases section shows, Tasks section shows empty state
- Dashboard loaded for the first time after site assignment → all sections may be empty with appropriate empty states
- SiteCaseClient trying to access the dashboard → redirected to case view (not dashboard)

---

## Requirements

### Functional Requirements

- **FR-001**: The dashboard MUST load all of the user's assigned cases, tasks, and upcoming hearings in one or parallel API calls.
- **FR-002**: "My Cases" section MUST display case cards with: title, number, status badge, last updated.
- **FR-003**: "My Tasks" section MUST display task rows with: title, case name, due date, status badge. Overdue tasks MUST be visually highlighted.
- **FR-004**: "Upcoming Hearings" section MUST display hearings ordered by date ascending with hearing date/time, location, and case name.
- **FR-005**: Each case and task in the dashboard MUST be clickable and navigate to the full detail page.
- **FR-006**: Each section MUST show an appropriate empty state when no data exists.
- **FR-007**: The dashboard MUST enforce site scope — legal experts see only data from their assigned site.

### Key Entities

- **My Cases**: Cases assigned to the logged-in SiteLegalExpert in their site.
- **My Tasks**: Tasks assigned to the expert across all cases in their site.
- **Upcoming Hearings**: All future hearings across the site (not just assigned to the expert).

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Dashboard loads within 3 seconds of login including all three sections.
- **SC-002**: Overdue tasks are visually distinct from on-time tasks (100% of overdue tasks highlighted).
- **SC-003**: All dashboard items are clickable and navigate to the correct detail page.
- **SC-004**: Zero cross-site data appears on any expert's dashboard.

---

## Assumptions

- The dashboard is the primary landing page for SiteLegalExpert and SiteSrLegalExpert users after login.
- Dashboard data is loaded from the personal summary API endpoint in one call, then supplemented by site hearings.
- OrganizationAdmin can access an equivalent view for any user's dashboard by navigating to that user's profile.

---

## Out of Scope

- Creating site legal experts (done by admins) — spec `004-site-user-creation`
- LegalIndividualExpert (freelance) dashboard — separate flow
- Case/task/hearing management — specs `005`–`009`
