# Feature Specification: Site User Management

**Feature Branch**: `026-site-user-management`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow authorized users to view, update, and remove users within a specific site. All site and org roles can see the site user list. SiteClerk is read-only. Only OrgAdmin, SiteAdmin, and SystemAdmin can delete users. User creation is in spec `004`.

---

## Actors

| Actor | List site users | View user detail | Edit user | Delete user |
|---|---|---|---|---|
| `OrganizationAdmin` | Yes | Yes | Yes | Yes |
| `OrganizationClerk` | Yes | Yes | Yes | No |
| `SiteAdmin` | Yes | Yes | Yes | Yes |
| `SiteClerk` | Yes | Yes | No | No |
| `SiteSrLegalExpert`, `SiteLegalExpert` | Yes | Yes | Yes | No |
| `SystemAdmin`, `SupportEngineer` | Yes | Yes | Yes | SystemAdmin only |

---

## User Scenarios & Testing

### P1 — View All Users in a Site (Priority: P1)

As a SiteAdmin, OrganizationAdmin, or any site user,
I want to see who is assigned to this site,
So that I can understand the team composition.

**Independent Test**: Log in as SiteAdmin, navigate to Site > Users. All users assigned to the site appear with their roles and statuses.

**Acceptance Scenarios**:

1. **Given** any site or org user on the Site Users page,
   **When** the page loads,
   **Then** all users assigned to the site are shown with: full name, email, role, and enabled/disabled status badge.

2. **Given** a site with no users (empty state),
   **When** the page loads,
   **Then** a friendly empty state message is shown.

---

### P2 — View and Edit a Site User's Profile (Priority: P2)

As a SiteAdmin, OrganizationAdmin, SiteSrLegalExpert, or SiteLegalExpert,
I want to update a site user's personal details,
So that contact records stay accurate.

**Acceptance Scenarios**:

1. **Given** an authorized user clicks on a site user,
   **When** the detail page or panel opens,
   **Then** all editable fields are shown pre-filled: full name, phone number, email, gender (dropdown), and enabled toggle.

2. **Given** the user updates the site user's name and saves,
   **When** the save succeeds,
   **Then** a success toast appears and the site user list reflects the updated name.

3. **Given** a SiteClerk viewing a site user's detail,
   **When** the page renders,
   **Then** no edit button or form inputs are shown — the view is read-only.

4. **Given** any authorized editor attempting to change the user's role,
   **When** the edit form renders,
   **Then** there is no role field — roles are not editable through this form.

---

### P3 — Delete a Site User (Priority: P3)

As a SiteAdmin or OrganizationAdmin,
I want to remove a user from the site,
So that users who have left the team are no longer listed.

**Acceptance Scenarios**:

1. **Given** a SiteAdmin on the user detail page,
   **When** they click "Remove User" and confirm,
   **Then** the user is removed from the site and the list updates.

2. **Given** the user tries to remove their own account,
   **When** they click "Remove User",
   **Then** the button is disabled or an error is shown: "You cannot delete your own account."

3. **Given** an OrganizationClerk, SiteClerk, SiteSrLegalExpert, or SiteLegalExpert viewing a user's profile,
   **When** the page renders,
   **Then** no delete or remove button is visible.

---

### Edge Cases

- SiteClerk sees all users in the list but has no edit or delete controls
- Role is not editable — the role shown on the user card is display-only
- Self-deletion is blocked for all roles including SiteAdmin and OrgAdmin
- Email is stored lowercase on update

---

## Requirements

### Functional Requirements

- **FR-001**: The Site Users list MUST display all users assigned to the site with: full name, email, role, and enabled status badge.
- **FR-002**: The user detail/edit form MUST pre-fill all current values: full name, phone, email, gender, enabled.
- **FR-003**: The edit form MUST NOT include a role field.
- **FR-004**: SiteClerk MUST see the list and user details in read-only mode — no edit controls visible.
- **FR-005**: Delete/remove controls MUST be visible only to SiteAdmin, OrganizationAdmin, and SystemAdmin.
- **FR-006**: Delete MUST require a confirmation dialog warning about permanent removal.
- **FR-007**: The delete button MUST be disabled or hidden when viewing your own account.

### Key Entities

- **Site User**: A user assigned to a specific site with a site-level role (SiteAdmin, SiteClerk, SiteSrLegalExpert, SiteLegalExpert).

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: The site user list renders within 2 seconds for a site with up to 20 users.
- **SC-002**: SiteClerk users see the full list in read-only mode — zero edit or delete controls visible.
- **SC-003**: Self-deletion is always blocked — no user can delete their own account through the UI.
- **SC-004**: Edit save and user list refresh complete within 2 seconds.

---

## Assumptions

- The site user management page is accessible from the Site Settings or Site > Users section.
- Role display is read-only and informational — role changes require re-creation of the user via spec `004`.

---

## Out of Scope

- Creating site users — spec `004-site-user-creation`
- Org-level user management — spec `025-org-user-management`
- Site configuration management — spec `022-site-management`
