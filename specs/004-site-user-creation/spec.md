# Feature Specification: Site User Creation

**Feature Branch**: `004-site-user-creation`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow authorized org-level and site-level users to add a new user to a site. The form captures the new user's details and the role to assign. A password is auto-generated — the new user receives an invitation email with their credentials and site details.

---

## Actors

| Actor | Can add site user? | Can assign SiteAdmin role? |
|---|---|---|
| `OrganizationAdmin` | Yes | Yes |
| `OrganizationClerk` | Yes | Yes |
| `SiteAdmin` | Yes (own site) | Yes |
| `SiteClerk` | Yes (own site) | No |
| `SiteSrLegalExpert` | Yes (own site) | No |
| `SiteLegalExpert` | Yes (own site) | No |

---

## User Scenarios & Testing

### P1 — Admin Adds a Site User with Any Role (Priority: P1)

As an OrganizationAdmin, OrganizationClerk, or SiteAdmin,
I want to add a new user to my site with the appropriate role,
So that they can log in and begin working on cases.

**Independent Test**: As SiteAdmin, navigate to Site > Users > Add User. Fill out the form with a SiteClerk role, submit. A success notification appears and the user appears in the site user list.

**Acceptance Scenarios**:

1. **Given** an authenticated SiteAdmin on their site's Users page,
   **When** they click "Add User",
   **Then** a form appears with: full name, email, phone, role selector (all valid site roles), gender, enabled toggle.

2. **Given** all required fields are filled validly,
   **When** the admin submits the form,
   **Then** a success notification appears: "User [name] has been added and an invitation email has been sent."
   **And** the new user appears in the site user list.

---

### P2 — Non-Admin Site Users Cannot Assign SiteAdmin Role (Priority: P2)

As the platform,
I must prevent SiteClerk, SiteSrLegalExpert, and SiteLegalExpert from assigning the SiteAdmin role,
So that privilege escalation is prevented in the UI.

**Acceptance Scenarios**:

1. **Given** an authenticated SiteClerk opens the Add User form,
   **When** they view the role selector,
   **Then** "Site Admin" is NOT available in the dropdown — only SiteClerk, SiteSrLegalExpert, SiteLegalExpert are shown.

2. **Given** the SiteClerk submits a form (if somehow SiteAdmin role is submitted programmatically),
   **Then** the API returns 401 and the UI displays an error message.

---

### P3 — Duplicate Email Rejected (Priority: P3)

As an admin adding a site user,
I want to see a clear error if the email is already registered,
So that I can provide a different email or contact the existing user.

**Acceptance Scenarios**:

1. **Given** the admin enters an email that is already registered in the platform,
   **When** the form is submitted,
   **Then** an error is displayed: "This email address is already registered in the system."

---

### Edge Cases

- If invitation email send fails → API rolls back and UI shows an error; no user is left in a partial state
- Full name with 1 character → inline error: "Full name must be at least 2 characters"

---

## Requirements

### Functional Requirements

- **FR-001**: The Add User form MUST include: full name (required, 2–100), email (required, valid format), phone (required, 10-digit), role selector (required, filtered by caller's permissions), gender (required), enabled toggle (optional).
- **FR-002**: The role dropdown MUST only show site-level roles: `SiteAdmin`, `SiteClerk`, `SiteSrLegalExpert`, `SiteLegalExpert`. For non-admin site users, `SiteAdmin` MUST be excluded.
- **FR-003**: Inline validation MUST run on blur and on submission for all required fields.
- **FR-004**: On success, a toast notification MUST confirm creation and the user list MUST refresh.
- **FR-005**: API error messages (duplicate email, invitation failure) MUST be shown inline or as a toast.
- **FR-006**: The enabled toggle defaults to off (user is created disabled unless explicitly enabled).

### Key Entities

- **Site User**: A staff member assigned to a specific site with one or more site-level roles.
- **Valid Site Roles**: `SiteAdmin`, `SiteClerk`, `SiteSrLegalExpert`, `SiteLegalExpert`.
- **Invitation Email**: Sent to the new user with their site name, org name, email, and auto-generated password.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: An authorized user can add a new site user in under 2 minutes.
- **SC-002**: Role dropdown only ever shows roles the caller is permitted to assign.
- **SC-003**: 100% of duplicate email attempts result in a visible error before the user list refreshes.
- **SC-004**: Newly created site users appear in the list within 3 seconds of success.

---

## Assumptions

- Gender defaults to Male if not selected (matching backend default).
- The form is rendered as a modal or side panel on the Site Users page.

---

## Out of Scope

- Edit/delete site users — spec `026-site-user-management`
- Create org user — spec `002-organization-user-creation`
