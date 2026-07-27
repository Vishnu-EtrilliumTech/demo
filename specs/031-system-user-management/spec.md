# Feature Specification: System User Management

**Feature Branch**: `031-system-user-management`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow SystemAdmins to create, view, update, and delete platform-level staff accounts (SystemAdmin and SupportEngineer). Two creation paths exist: self-registration (where the admin registers using their own email) and admin-add (where the admin creates an account for any email). SupportEngineers can view all system users and update only their own profile. Roles can only be changed to other system-level roles — no escalation to org or site roles.

---

## Actors

| Actor | Self-register | Create for others | List/view | Edit any | Edit own | Delete |
|---|---|---|---|---|---|---|
| `SystemAdmin` | Yes | Yes | Yes | Yes | Yes | Yes |
| `SupportEngineer` | No | No | Yes | No | Yes | No |

---

## User Scenarios & Testing

### P1 — Admin Creates a System User Account (Priority: P1)

As a SystemAdmin,
I want to create accounts for other platform staff members,
So that they can log in and perform their assigned duties.

**Independent Test**: Log in as SystemAdmin, navigate to System > Users. Click "Add User," enter name and email, select role (SystemAdmin or SupportEngineer), and save. The new user appears in the system users list.

**Acceptance Scenarios**:

1. **Given** a SystemAdmin on the System Users page,
   **When** they click "Add User," fill in the form (full name, email, role), and submit,
   **Then** the new system user account is created and appears in the list.

2. **Given** the admin enters an email already used by an existing system user,
   **When** they submit the form,
   **Then** an error is shown: "This email is already registered."

3. **Given** a SystemAdmin wants to register their own account using their login email,
   **When** they use the self-register flow,
   **Then** the system creates the account linked to their current email session.

4. **Given** a SupportEngineer trying to access the System Users creation page,
   **When** the page renders,
   **Then** no "Add User" button is shown — creation is restricted to SystemAdmin.

---

### P2 — View System Users (Priority: P2)

As a SystemAdmin or SupportEngineer,
I want to see all system-level staff accounts,
So that I know who has platform access.

**Acceptance Scenarios**:

1. **Given** a SystemAdmin on the System Users list,
   **When** the page loads,
   **Then** all system users are shown with: full name, email, role (SystemAdmin / SupportEngineer), and enabled status.

2. **Given** a SupportEngineer on the System Users list,
   **When** the page loads,
   **Then** the list is shown in read-only mode (no edit or delete controls for other users).

---

### P3 — Update a System User's Profile (Priority: P3)

As a SystemAdmin,
I want to update a system user's name, email, phone, gender, role, and enabled status,
So that staff records stay accurate.

**Acceptance Scenarios**:

1. **Given** a SystemAdmin on a system user's detail/edit page,
   **When** they update fields and save,
   **Then** the updated values are reflected immediately.

2. **Given** the admin tries to change a system user's role to a non-system role (e.g., OrganizationAdmin),
   **When** they select that option and save,
   **Then** an error is shown: "Roles must be system-level only (SystemAdmin or SupportEngineer)."

3. **Given** a SupportEngineer on their own profile edit page,
   **When** they update their own details and save,
   **Then** the update succeeds.

4. **Given** a SupportEngineer trying to edit another user's profile,
   **When** they navigate to that user's edit page,
   **Then** the edit form is not accessible (read-only view or access denied).

---

### P4 — Delete a System User (Priority: P4)

As a SystemAdmin,
I want to remove a system user account,
So that staff who have left no longer have platform access.

**Acceptance Scenarios**:

1. **Given** a SystemAdmin on a system user's detail page,
   **When** they click "Delete User" and confirm,
   **Then** the user is removed and the list updates.

2. **Given** a SupportEngineer viewing any system user's profile,
   **When** the page renders,
   **Then** no delete button is visible.

---

### Edge Cases

- Role dropdown in the edit form MUST only show SystemAdmin and SupportEngineer — org/site roles are not available
- SupportEngineer can only edit their own profile — no controls for other accounts
- Duplicate email check applies to both self-register and admin-add flows

---

## Requirements

### Functional Requirements

- **FR-001**: The System Users list MUST display all platform staff with: full name, email, role, and enabled status.
- **FR-002**: The "Add User" button MUST be visible only to SystemAdmin.
- **FR-003**: The role dropdown in the create/edit form MUST be limited to SystemAdmin and SupportEngineer — no other roles available.
- **FR-004**: Duplicate email MUST be caught and shown as a validation error before or after submission.
- **FR-005**: Edit controls for other users MUST be hidden for SupportEngineer — they can only edit their own profile.
- **FR-006**: Delete MUST require a confirmation dialog and MUST be visible only to SystemAdmin.
- **FR-007**: SupportEngineer's own profile edit page MUST pre-fill current values and allow updates to personal details.

### Key Entities

- **System User**: A platform staff account with SystemAdmin or SupportEngineer role. Not linked to any org or site.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: The system users list renders within 2 seconds.
- **SC-002**: Role dropdown never presents non-system roles — preventing any privilege escalation through the UI.
- **SC-003**: SupportEngineer accounts cannot delete or edit other system users — zero unauthorized edit actions possible through the UI.

---

## Assumptions

- System users are entirely separate from org users, site users, clients, and legal experts — they are platform staff only.
- The self-register flow is used by a SystemAdmin who is registering themselves under their current login session email.
- The admin-add flow is for adding another person — their email does not need to match the currently logged-in admin.

---

## Out of Scope

- Organization user management — spec `025-org-user-management`
- Site user management — spec `026-site-user-management`
- Legal expert management — spec `013-legal-expert-management`
