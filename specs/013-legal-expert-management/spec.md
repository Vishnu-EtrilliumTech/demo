# Feature Specification: Legal Expert Management

**Feature Branch**: `013-legal-expert-management`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow authenticated users to self-register as independent legal experts on the Lawsome platform, and allow system administrators to manage the full list of experts. Legal experts start as inactive and must be approved by an admin before becoming discoverable. This is for `LegalIndividualExpert` — standalone freelance professionals, not org-based site users.

---

## Actors

| Actor | Register | View own profile | View all experts | Update own profile | Admin manage |
|---|---|---|---|---|---|
| `AuthenticatedUser` | Yes (own email) | — | — | — | — |
| `LegalIndividualExpert` | — | Yes | — | Yes | — |
| `SystemAdmin` | Yes (any) | Yes | Yes | Yes | Yes (activate/delete) |
| `Client` | — | View by ID | — | — | — |

---

## User Scenarios & Testing

### P1 — Self-Registration as a Legal Expert (Priority: P1)

As an authenticated user,
I want to fill out a registration form to become a legal expert on Lawsome,
So that I can offer my legal services to clients on the platform.

**Independent Test**: Log in as a new user, navigate to Legal Expert Registration. Fill all fields and submit. A confirmation message appears; account is created as inactive.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the Legal Expert Registration page,
   **When** they see the form,
   **Then** the form shows: full name, email (pre-filled from session, read-only), phone, gender, and expert type selector.

2. **Given** all required fields are filled with valid values and the email matches the user's session,
   **When** the form is submitted,
   **Then** a success message appears: "Your legal expert account has been created and is pending approval."

3. **Given** an email that doesn't match the user's session email,
   **When** the form is submitted (e.g., manipulated form),
   **Then** an error is shown: "The email address must match your account email."

4. **Given** a user who has already registered as a legal expert,
   **When** they try to register again with the same email,
   **Then** an error is shown: "This email is already registered as a legal expert."

---

### P2 — Admin Reviews and Activates Experts (Priority: P2)

As a SystemAdmin,
I want to see a list of pending (inactive) experts and activate or delete them,
So that only verified professionals are discoverable on the platform.

**Acceptance Scenarios**:

1. **Given** a SystemAdmin on the Legal Expert Management page,
   **When** they filter by "Pending Approval",
   **Then** a list of inactive experts is shown with their registration date and details.

2. **Given** the admin clicks "Activate" on a pending expert,
   **When** the action succeeds,
   **Then** the expert's status changes to "Active" and they become discoverable in search.

3. **Given** the admin clicks "Delete" on an expert and confirms,
   **When** deletion succeeds,
   **Then** the expert is permanently removed from the system.

---

### P3 — Expert Updates Own Profile (Priority: P3)

As a LegalIndividualExpert,
I want to update my name, phone, and expert type,
So that my profile stays accurate.

**Acceptance Scenarios**:

1. **Given** an authenticated LegalIndividualExpert on their profile page,
   **When** they click "Edit Profile" and update their full name,
   **Then** the updated name is saved and shown.

2. **Given** an expert trying to update another expert's profile,
   **When** the request is submitted,
   **Then** an access denied error is shown.

---

### Edge Cases

- Expert type must reference a valid pre-existing type (loaded from reference data)
- New expert is always inactive at creation — the UI clearly indicates "Pending Approval" status
- `SystemAdmin` can register with a different email (admin bypass applies)

---

## Requirements

### Functional Requirements

- **FR-001**: The Legal Expert Registration form MUST show: full name (required), email (pre-filled from session, read-only), phone (required), gender (required), expert type selector (required, dropdown from reference data).
- **FR-002**: The admin Expert Management page MUST include filter controls for Active / Pending Approval.
- **FR-003**: Each expert in the admin list MUST have an Activate/Deactivate toggle and a Delete action.
- **FR-004**: Newly registered experts MUST display a "Pending Approval" status badge on their profile.
- **FR-005**: The expert profile page MUST show the current onboarding stage (Registration, PersonalDetails, ProfessionalDetails, Schedule).
- **FR-006**: Delete MUST require confirmation.

### Key Entities

- **Legal Expert**: A standalone legal professional. Starts inactive. Onboarding stage tracks profile completion.
- **Expert Type**: Legal specialization category (e.g., Corporate, Criminal). Must be pre-seeded.
- **Onboarding Stage**: Registration → PersonalDetails → ProfessionalDetails → Schedule. Experts searchable only at Schedule stage.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: A new expert can complete the registration form in under 3 minutes.
- **SC-002**: Admin can view all pending experts and activate one in under 1 minute.
- **SC-003**: The registration form never allows submission with an email that doesn't match the user's session.
- **SC-004**: Status badges (Active/Pending) are always accurate on page load.

---

## Assumptions

- Expert type reference data is loaded from the API at form render time.
- The expert's session email is pre-filled and read-only to prevent email mismatch.
- After registration, the user is shown an onboarding prompt to complete their full profile (spec `027`).

---

## Out of Scope

- Legal expert profile onboarding (address, personal details, professional details, schedule) — spec `027-legal-expert-profile`
- Legal expert search — spec `028-legal-expert-search`
- Appointments — spec `014-appointments`
