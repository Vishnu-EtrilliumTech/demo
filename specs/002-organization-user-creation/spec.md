# Feature Specification: Organization User Creation

**Feature Branch**: `002-organization-user-creation`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow OrganizationAdmins to add new staff members (admins or clerks) to their organization through a form. After successful creation, the new user receives an invitation email with their login credentials. This is admin-driven — not self-registration.

---

## Actors

| Actor | Role |
|---|---|
| `OrganizationAdmin` | Primary actor. Accesses the Add User form within their organization settings and submits the new user's details. |
| `SystemAdmin` | Can add users to any organization via the same form. |

---

## User Scenarios & Testing

### P1 — OrganizationAdmin Adds a New User (Priority: P1)

As an OrganizationAdmin,
I want to fill out a form to add a new staff member to my organization,
So that they can log in and start working.

**Why this priority**: Organizations cannot function without staff accounts. This is required immediately after org creation.

**Independent Test**: As an OrgAdmin, navigate to Organization > Users > Add User. Fill out the form, submit. A success notification appears and the new user appears in the user list.

**Acceptance Scenarios**:

1. **Given** an authenticated OrganizationAdmin on the Users management page,
   **When** they click "Add User" or equivalent,
   **Then** a form/modal appears with fields for full name, email, phone, role, gender, and enabled status.

2. **Given** all required fields are filled with valid values,
   **When** the admin submits the form,
   **Then** a success notification is shown: "User [name] has been added. An invitation email has been sent."
   **And** the new user appears in the organization user list.

3. **Given** the submission is in progress,
   **When** the API call is pending,
   **Then** the submit button shows a loading state and is not clickable.

---

### P2 — Duplicate Email Is Rejected (Priority: P2)

As an OrganizationAdmin,
I want to see an error if the email address is already in use,
So that I don't accidentally create duplicate accounts.

**Acceptance Scenarios**:

1. **Given** an email that already belongs to a platform user,
   **When** the admin submits the Add User form with that email,
   **Then** an error is displayed: "This email address is already registered in the system."
   **And** no user is created.

---

### P3 — Invalid Role Assignment Prevented (Priority: P3)

As the platform UI,
I must only present valid organization-level roles for selection,
So that admins cannot accidentally assign site-level roles in an org user context.

**Acceptance Scenarios**:

1. **Given** the role selector in the Add User form,
   **When** the admin opens the role dropdown,
   **Then** only "Organization Admin" and "Organization Clerk" are available options.

---

### Edge Cases

- If the invitation email fails to send, the user sees an error and the user is not created (platform rolls back automatically)
- Phone number starting with 5 → inline error before submit
- Full name with fewer than 2 characters → inline error

---

## Requirements

### Functional Requirements

- **FR-001**: The Add User form MUST include: full name (required, 2–100 chars), email (required, valid format), phone (required, 10-digit), role selector (required, options: OrganizationAdmin, OrganizationClerk), gender selector (optional, defaults to Male), enabled toggle (optional, defaults to false).
- **FR-002**: The role dropdown MUST only show organization-level roles (`OrganizationAdmin`, `OrganizationClerk`).
- **FR-003**: All required fields MUST display inline validation errors on blur and on submission attempt.
- **FR-004**: On success, a toast notification MUST confirm the user was added and an email was sent.
- **FR-005**: On API error (e.g., duplicate email), the error message MUST be displayed to the admin without navigating away.
- **FR-006**: The Add User action MUST only be accessible to users with `OrganizationAdmin` or `SystemAdmin` role — the button/option must be hidden or disabled for OrganizationClerk.
- **FR-007**: The organization user list MUST refresh automatically after a successful user addition.

### Key Entities

- **Organization User**: The new user record created with their role, name, email, and phone.
- **Org-Level Roles**: `OrganizationAdmin` (full control) and `OrganizationClerk` (operational tasks).
- **Invitation Email**: Auto-sent after creation with the new user's login credentials.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: An OrganizationAdmin can add a new user in under 2 minutes from clicking "Add User" to seeing the confirmation.
- **SC-002**: Duplicate email errors appear immediately after form submission without a full page reload.
- **SC-003**: The new user appears in the user list within 3 seconds of successful submission.
- **SC-004**: 100% of invalid phone numbers are caught with inline validation before the API is called.

---

## Assumptions

- The Add User form is rendered as a modal dialog or a side panel within the Organization Users page.
- The enabled/disabled toggle defaults to "Disabled" — the admin must explicitly enable the user if they should have immediate access.
- Gender field defaults to "Male" if not selected.
- The invitation email content is managed server-side — the UI only triggers the creation.

---

## Out of Scope

- Edit or delete org users — spec `025-org-user-management`
- Site user creation — spec `004-site-user-creation`
- Password reset — separate feature
