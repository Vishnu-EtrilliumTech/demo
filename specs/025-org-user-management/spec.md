# Feature Specification: Organization User Management

**Feature Branch**: `025-org-user-management`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow OrganizationAdmins to view, search, update, and remove user accounts across their organization. The list includes both org-level users (OrgAdmin, OrgClerk) and all site users across all sites in the org. OrganizationClerks have read-only access. Site-level roles see only the basic name lookup (used when displaying assignees on tasks and hearings). User creation is in spec `002`.

---

## Actors

| Actor | List users | View user detail | Search by email | Edit user | Delete user |
|---|---|---|---|---|---|
| `OrganizationAdmin` | Yes | Yes | Yes | Yes | Yes |
| `OrganizationClerk` | Yes | Yes | Yes | No | No |
| `SiteAdmin`, `SiteClerk`, `SiteLegalExpert`, `SiteSrLegalExpert` | No — name lookup only | No | No | No | No |
| `SystemAdmin`, `SupportEngineer` | Yes | Yes | Yes | Yes (SystemAdmin) | Yes (SystemAdmin) |

> Site-level roles have access to a name-only lookup (ID + full name) used when displaying task assignees or hearing attendees. They cannot view full user profiles or the user list.

---

## User Scenarios & Testing

### P1 — View All Users in Organization (Priority: P1)

As an OrganizationAdmin or OrganizationClerk,
I want to see all users across my entire organization,
So that I can understand who belongs to the firm and which site they are assigned to.

**Independent Test**: Log in as OrgAdmin, navigate to Organization > Users. A list of all org users and site users appears, each showing site name for site-assigned users.

**Acceptance Scenarios**:

1. **Given** an OrganizationAdmin on the Org Users page,
   **When** the page loads,
   **Then** all users in the organization are shown — including both org-level users and site users — each with: full name, email, role, site name (if site-assigned), and enabled/disabled status badge.

2. **Given** the organization has no users (empty state),
   **When** the page loads,
   **Then** a friendly empty state message is shown (not an error).

3. **Given** a SiteAdmin trying to access the org-level user list URL,
   **When** the page loads,
   **Then** an access denied message is shown.

---

### P2 — Search for a User by Email (Priority: P2)

As an OrganizationAdmin,
I want to look up a specific user by their email address,
So that I can quickly find their profile without scrolling through the full list.

**Acceptance Scenarios**:

1. **Given** an OrganizationAdmin on the Org Users page,
   **When** they enter a valid email in the search field,
   **Then** the matching user's profile is shown (or a "not found" message if no match).

2. **Given** an invalid email format is entered,
   **When** the search is submitted,
   **Then** a validation error appears: "Please enter a valid email address."

---

### P3 — View and Edit a User's Profile (Priority: P3)

As an OrganizationAdmin,
I want to view and update a user's name, phone, email, gender, and enabled status,
So that I can keep user records accurate.

**Acceptance Scenarios**:

1. **Given** an OrganizationAdmin clicks on a user,
   **When** the detail page or panel opens,
   **Then** all editable fields are shown pre-filled: full name, phone number, email, gender (dropdown), and enabled toggle.

2. **Given** the admin updates the user's name and saves,
   **When** the save succeeds,
   **Then** a success toast appears and the user list reflects the updated name.

3. **Given** an OrganizationClerk viewing a user's detail page,
   **When** the page renders,
   **Then** no edit button or form inputs are shown — the view is read-only.

4. **Given** the admin tries to change the user's role via the edit form,
   **When** the form renders,
   **Then** there is no role field — roles are not editable on this form.

---

### P4 — Delete a User (Priority: P4)

As an OrganizationAdmin,
I want to remove a user from the organization,
So that ex-employees or incorrect accounts are cleaned up.

**Acceptance Scenarios**:

1. **Given** an OrganizationAdmin on the user detail page,
   **When** they click "Delete User" and confirm,
   **Then** the user is removed and the list updates without them.

2. **Given** the admin tries to delete their own account,
   **When** they click "Delete User",
   **Then** the delete button is disabled or an error is shown: "You cannot delete your own account."

3. **Given** an OrganizationClerk viewing a user's profile,
   **When** the page renders,
   **Then** no delete button is visible.

---

### Edge Cases

- Email search is case-insensitive — searching `USER@EXAMPLE.COM` finds `user@example.com`
- Site users appear in the org list with their site name shown; org-level users show no site name
- Email is stored lowercase on update — the display normalizes after save
- A user cannot delete their own account regardless of role

---

## Requirements

### Functional Requirements

- **FR-001**: The Org Users list MUST display all users (org-level and site-level) with: full name, email, role, site name (if applicable), and enabled status.
- **FR-002**: The email search field MUST validate format before submitting and show a validation error for malformed input.
- **FR-003**: The user detail/edit form MUST pre-fill all current values: full name, phone, email, gender, enabled.
- **FR-004**: The edit form MUST NOT include a role field — roles are not editable.
- **FR-005**: Edit controls MUST be hidden for OrganizationClerk (read-only view only).
- **FR-006**: Delete MUST require a confirmation dialog warning about permanent removal.
- **FR-007**: The delete button MUST be disabled or hidden when viewing your own account.
- **FR-008**: Site-level roles MUST be shown access denied when trying to reach the org user list.

### Key Entities

- **Org User**: A user registered at org level (OrgAdmin, OrgClerk). Shown without a site name.
- **Site User (org view)**: A user assigned to a site within the org. Shown with their site name in the list.
- **User Basic Info**: ID + full name only — available to site-level roles for displaying assignee names on tasks and hearings.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: The org user list renders within 2 seconds for an org with up to 50 users.
- **SC-002**: OrgClerk users see the list in read-only mode — no edit or delete controls appear.
- **SC-003**: Self-deletion is always blocked — no user can delete their own account through the UI.
- **SC-004**: Email search returns results or a "not found" message within 2 seconds.

---

## Assumptions

- The user list is accessed from the Organization section of the nav, not from within a specific site.
- The org user list shows both org-level and site-level users in one combined view, with site names as a column.
- Role changes are a separate admin operation — not exposed in this UI.

---

## Out of Scope

- Creating org users — spec `002-organization-user-creation`
- Site user management — spec `026-site-user-management`
- Organization profile management — spec `021-organization-management`
