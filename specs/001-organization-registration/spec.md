# Feature Specification: Organization Registration

**Feature Branch**: `001-organization-registration`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow an authenticated user who has no existing organization to register their law firm on the Lawsome platform through a guided form. This is the first step every new law firm takes — after completing the form they become the Organization Admin with full access to sites, users, and cases.

---

## Actors

| Actor | Role in this feature |
|---|---|
| `AuthenticatedUser` | Any logged-in user without an existing organization. Fills out and submits the registration form. |

---

## User Scenarios & Testing

### P1 — User Registers an Organization Successfully (Priority: P1)

As an authenticated user with no existing organization,
I want to fill out and submit the organization registration form,
So that my law firm has a workspace on Lawsome.

**Why this priority**: This is the entry point for the entire platform. No other feature works without an organization existing first.

**Independent Test**: Log in as a new user, navigate to the registration page, fill out all required fields, submit. A success confirmation is shown and the user is redirected to the organization dashboard.

**Acceptance Scenarios**:

1. **Given** an authenticated user without an existing organization,
   **When** they navigate to the registration page,
   **Then** a form is displayed with fields for organization name, segments, contact email, contact phone, description, administrator name, administrator phone, and administrator gender.

2. **Given** all required fields are filled with valid values,
   **When** the user submits the form,
   **Then** a success message is shown and the user is redirected to their new organization dashboard with the OrganizationAdmin role.

3. **Given** the submission is in progress,
   **When** the API call is pending,
   **Then** the submit button is disabled and a loading indicator is shown.

---

### P2 — User Who Already Has an Organization Is Redirected (Priority: P2)

As the platform,
I must prevent a user who already has an organization from accessing the registration form,
So that one user account maps to exactly one organization.

**Why this priority**: Duplicate organizations would break billing and identity management.

**Independent Test**: Log in as an existing OrganizationAdmin and navigate to the registration URL. The form must not be accessible — the user should be redirected.

**Acceptance Scenarios**:

1. **Given** an authenticated user who already belongs to an organization,
   **When** they try to navigate to the registration page,
   **Then** they are redirected to their organization dashboard with an informational message.

---

### P3 — Validation Feedback for Invalid Input (Priority: P3)

As a user filling out the form,
I want to see clear validation messages for invalid fields,
So that I can correct my input without confusion.

**Acceptance Scenarios**:

1. **Given** the form is displayed,
   **When** the user submits with the organization name left empty,
   **Then** an inline error appears under the Organization Name field: "Organization name is required."

2. **Given** the user enters a phone number that doesn't start with 6, 7, 8, or 9,
   **When** the field loses focus or the form is submitted,
   **Then** an error message is shown: "Phone number must be a valid 10-digit mobile number."

3. **Given** the user enters an invalid email format,
   **When** the field loses focus or the form is submitted,
   **Then** an error message is shown: "Please enter a valid email address."

4. **Given** the user leaves the Segments field empty,
   **When** the form is submitted,
   **Then** an error message is shown: "At least one segment is required."

---

### Edge Cases

- Organization name at maximum length (100 chars) → accepted
- Description is optional — form can be submitted without it
- Contact email with uppercase letters → accepted; stored lowercase
- If a duplicate organization contact email already exists in the system, the user sees a generic error message: "Unable to register the organization. Please try again or contact support."
- Submitting the form twice quickly (double-click) → second submission is prevented

---

## Requirements

### Functional Requirements

- **FR-001**: The registration form MUST include fields for: organization name (required, max 100), segments (required, multi-select or tag input), contact email (required, valid email), contact phone (required, 10-digit), description (optional, max 500), administrator name (required, max 100), administrator phone (required, 10-digit), administrator gender (required, enum).
- **FR-002**: All required fields MUST display inline validation errors before form submission is allowed.
- **FR-003**: The submit button MUST be disabled while the registration API call is in flight.
- **FR-004**: On success, the user MUST be redirected to the organization dashboard with a success notification.
- **FR-005**: If the user already belongs to an organization, the registration page MUST redirect them away without rendering the form.
- **FR-006**: Form errors returned by the API (e.g., duplicate email) MUST be displayed to the user in a notification toast or inline form message.
- **FR-007**: Phone number fields MUST accept only numeric input and validate 10-digit format starting with 6–9.

### Key Entities

- **Organization**: Created upon successful submission. The form captures the name, contact details, segments, and optional description.
- **OrganizationAdmin**: The role automatically assigned to the submitting user after successful registration.
- **Segments**: Multi-value field representing the legal domains the firm operates in (e.g., "Corporate", "Criminal").

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: A user can complete the organization registration form and submit in under 2 minutes on their first attempt.
- **SC-002**: Validation errors appear within 200ms of field blur or form submission, with no page reload required.
- **SC-003**: After successful registration, the user lands on the organization dashboard within 3 seconds.
- **SC-004**: 100% of required field omissions result in a visible error message before reaching the API.

---

## Assumptions

- The authenticated user's login email is obtained automatically from their session — it does not appear as an editable form field.
- The Segments field uses a predefined list or free-text tagging — the exact UI control (multi-select vs. tag chip input) is determined during implementation.
- The form lives on a dedicated registration route that guards against access by existing org members.
- Error messages from the API are user-friendly and do not expose internal system details.

---

## Out of Scope

- Identity/Keycloak account creation — happens before this form is accessed
- Organization settings edit — separate feature (spec `021-organization-management`)
- Site creation — separate feature (spec `003-site-creation`)
- Adding org users — separate feature (spec `002-organization-user-creation`)
