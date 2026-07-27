# Feature Specification: Client Management

**Feature Branch**: `015-client-management`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow authenticated users to self-register as a Client on the Lawsome platform and manage their own profile. Clients are standalone users who book appointments with legal experts. SystemAdmin manages the full client list and can delete accounts.

---

## Actors

| Actor | Register | View/Edit own profile | View all clients | Delete |
|---|---|---|---|---|
| `AuthenticatedUser` | Yes (own email) | — | — | — |
| `Client` | — | Yes | — | — |
| `SystemAdmin` | Yes (any) | Yes | Yes | Yes |

---

## User Scenarios & Testing

### P1 — Self-Registration as a Client (Priority: P1)

As an authenticated user,
I want to register as a client on Lawsome,
So that I can book appointments with legal experts.

**Independent Test**: Log in as a new user, navigate to Client Registration. Fill all fields and submit. A success confirmation appears.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the Client Registration page,
   **When** the form renders,
   **Then** it shows: full name (required), email (pre-filled from session, read-only), phone (required), gender (required).

2. **Given** all required fields are filled validly,
   **When** the form is submitted,
   **Then** a success message is shown and the user gains the Client role.

3. **Given** the email is already registered as a client,
   **When** the form is submitted,
   **Then** an error is shown: "This email is already registered as a client."

4. **Given** an email that doesn't match the user's session,
   **When** the form is submitted (via form manipulation),
   **Then** an access denied error is shown.

---

### P2 — Client Views and Updates Own Profile (Priority: P2)

As a Client,
I want to view and update my profile information,
So that my contact details stay current.

**Acceptance Scenarios**:

1. **Given** an authenticated Client on their profile page,
   **When** the page loads,
   **Then** their current name, email, phone, and gender are displayed.

2. **Given** the client updates their phone number and saves,
   **When** the update succeeds,
   **Then** the updated phone is shown on the profile page.

3. **Given** a Client trying to access another client's profile URL,
   **When** the page loads,
   **Then** an access denied message is shown (identity match required).

---

### P3 — Admin Manages the Client List (Priority: P3)

As a SystemAdmin,
I want to see and manage all registered clients,
So that I can oversee the client base and remove accounts as needed.

**Acceptance Scenarios**:

1. **Given** a SystemAdmin on the Client Management page,
   **When** the page loads,
   **Then** all registered clients are listed with name, email, phone, and registration date.

2. **Given** the admin clicks "Delete" on a client and confirms,
   **When** deletion succeeds,
   **Then** the client is permanently removed and the list refreshes.

---

### Edge Cases

- Gender valid values: Male, Female, Transgender
- Phone number must be 10 digits starting with 6–9
- Admin can register a client with any email (no ownership requirement)

---

## Requirements

### Functional Requirements

- **FR-001**: The Client Registration form MUST show: full name (required, max 100), email (pre-filled from session, read-only), phone (required, 10-digit), gender (required, dropdown).
- **FR-002**: The client profile page MUST display current details with an Edit button.
- **FR-003**: The admin Client Management page MUST list all clients with search/filter capability.
- **FR-004**: Delete MUST require confirmation.
- **FR-005**: Email field MUST be read-only on registration (pre-filled from session) and on profile edit.
- **FR-006**: A client cannot edit another client's profile — identity check enforced.

### Key Entities

- **Client**: A standalone platform user who books appointments with legal experts.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: A new user can complete client registration in under 2 minutes.
- **SC-002**: Profile updates are reflected immediately after saving.
- **SC-003**: Duplicate email registration is rejected with a clear error before any record is created.

---

## Assumptions

- The Client Registration page is a separate flow from the Legal Expert Registration flow.
- After client registration, the user is redirected to the expert search page to browse and book appointments.

---

## Out of Scope

- Case client management (adding clients to cases) — spec `010-case-client-management`
- Appointment booking — spec `014-appointments`
- Client payment history — spec `016-orders-payments`
