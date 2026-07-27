# Feature Specification: Organization Management

**Feature Branch**: `021-organization-management`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow org members to view and update their organization's details, and give OrganizationAdmins and Clerks access to org-wide case aggregation. SystemAdmin can manage any organization. This spec covers read, update, and delete operations; creation is in spec `001`.

---

## Actors

| Actor | View org | View all org cases | Update org | Delete org |
|---|---|---|---|---|
| `OrganizationAdmin` | Yes | Yes | Yes | No |
| `OrganizationClerk` | Yes | Yes | Yes | No |
| `SiteAdmin` / site roles | Yes (read) | No | No | No |
| `SystemAdmin` | Yes | Yes | Yes | Yes |

---

## User Scenarios & Testing

### P1 — View Organization Details (Priority: P1)

As any org or site member,
I want to see my organization's details on the organization settings page,
So that I know the firm's contact information and structure.

**Acceptance Scenarios**:

1. **Given** an authenticated org or site member,
   **When** they navigate to Organization Settings,
   **Then** the page shows: org name, contact email, contact phone, description, segments, and active status.

2. **Given** a SystemAdmin,
   **When** they navigate to System > Organizations,
   **Then** a list of all organizations on the platform is shown.

---

### P2 — View All Cases Across the Organization (Priority: P2)

As an OrganizationAdmin or OrganizationClerk,
I want to see all cases across all sites in my organization in one view,
So that I have a complete picture of the firm's active work.

**Acceptance Scenarios**:

1. **Given** an OrganizationAdmin on the org-level Cases view,
   **When** the page loads,
   **Then** all cases from all sites within the org are listed.

2. **Given** no cases exist yet,
   **When** the org Cases view loads,
   **Then** an empty state message is shown.

3. **Given** a SiteAdmin trying to access the org-level cases view,
   **When** the page loads,
   **Then** an access denied message is shown.

---

### P3 — Personal Dashboard Summary (Priority: P3)

As any authorized user,
I want a personal dashboard that shows my assigned cases, tasks, and hearings in one place,
So that I can quickly see my current workload without navigating through multiple pages.

**Acceptance Scenarios**:

1. **Given** a SiteLegalExpert who logs in,
   **When** their dashboard loads,
   **Then** the summary endpoint returns their cases, tasks, and hearings in one call.

2. **Given** an OrganizationAdmin,
   **When** they view a user's dashboard,
   **Then** they see that user's assigned cases, tasks, and hearings.

---

### P4 — Update Organization Details (Priority: P4)

As an OrganizationAdmin or OrganizationClerk,
I want to update my organization's name, contact details, and description,
So that the org's information stays accurate.

**Acceptance Scenarios**:

1. **Given** an OrganizationAdmin on the org settings page,
   **When** they click "Edit Organization" and update the name,
   **Then** the updated name is saved and displayed.

2. **Given** a SiteAdmin trying to access the edit function,
   **When** the page renders,
   **Then** no edit button is visible (site roles cannot update org details).

3. **Given** the admin updates the contact email to one already used by another org,
   **When** the form is submitted,
   **Then** an error is shown: "This contact email is already in use by another organization." (or a generic server error if no pre-check).

---

### P5 — Admin Deletes an Organization (Priority: P5)

As a SystemAdmin,
I want to permanently delete an organization and all its associated data,
So that terminated organizations are fully removed from the platform.

**Acceptance Scenarios**:

1. **Given** a SystemAdmin on the org management page,
   **When** they click "Delete Organization" and confirm,
   **Then** the org is permanently deleted and removed from the system.

2. **Given** an OrganizationAdmin trying to delete their own org,
   **When** the page renders,
   **Then** no delete button is visible.

---

## Requirements

### Functional Requirements

- **FR-001**: The Organization Settings page MUST display: name, contact email, phone, description, segments, active status.
- **FR-002**: The org-level Cases view MUST be accessible from org navigation, restricted to OrgAdmin and OrgClerk.
- **FR-003**: The edit form MUST pre-fill current org values and support updating all fields.
- **FR-004**: Delete MUST require a confirmation dialog with a warning about permanent data loss.
- **FR-005**: Delete is visible only to SystemAdmin — all other roles see a read/edit-only view.
- **FR-006**: The segments field MUST support multiple values (multi-select or tag chips).

### Key Entities

- **Organization**: Top-level entity with name, contact details, segments, and active status.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Org details page loads within 2 seconds.
- **SC-002**: Org-level cases list loads within 3 seconds for orgs with up to 10 sites.
- **SC-003**: Delete confirmation prevents accidental deletion of organization data.
- **SC-004**: Site-level roles never see the org edit or delete controls.

---

## Assumptions

- The org edit form includes a Segments field that uses the same multi-value UI as the registration form.
- Org contact email uniqueness is enforced server-side — the UI shows whatever error the API returns.

---

## Out of Scope

- Organization registration — spec `001-organization-registration`
- Site management — spec `022-site-management`
- Org user management — spec `025-org-user-management`
