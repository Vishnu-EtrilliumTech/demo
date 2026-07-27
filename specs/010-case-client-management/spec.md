# Feature Specification: Case Client Management

**Feature Branch**: `010-case-client-management`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow authorized users to add informational client records to a case, invite them to gain platform access, and manage those records. Clients start as informational records with no login access. The two-step invite/accept flow converts them into active `SiteCaseClient` users who can view their case.

---

## Actors

| Actor | Add/Edit/Delete clients | Invite | Accept invitation |
|---|---|---|---|
| `OrganizationAdmin`, `SiteAdmin`, `SiteClerk`, `SiteSrLegalExpert`, `SiteLegalExpert` | Yes | Yes | No |
| `Client` (invited person) | No | No | Yes |
| `OrganizationClerk`, `SiteCaseClient` | No | No | No |

---

## User Scenarios & Testing

### P1 — Add a Client Record to a Case (Priority: P1)

As an authorized user,
I want to add a client's details to a case,
So that the case record is linked to the person it's representing.

**Independent Test**: Navigate to Case > Clients tab > Add Client. Fill the form and submit. The client appears in the clients list.

**Acceptance Scenarios**:

1. **Given** an authorized user on the case Clients tab,
   **When** they click "Add Client",
   **Then** a form opens with: full name (required), email (required), phone (optional), gender (optional, defaults to Male), remarks (optional).

2. **Given** all required fields are filled,
   **When** the form is submitted,
   **Then** the client record appears in the list with a "Not Invited" status.

3. **Given** an OrganizationClerk or SiteCaseClient viewing the Clients tab,
   **When** the tab loads,
   **Then** no "Add Client" or action buttons are visible.

---

### P2 — Invite a Client to Gain Case Access (Priority: P2)

As an authorized user,
I want to send an invitation email to a client,
So that they can create or connect their platform account and view their case.

**Acceptance Scenarios**:

1. **Given** a client record with an email address that is NOT in the system,
   **When** the authorized user clicks "Invite Client",
   **Then** an invitation email is sent with a registration link and the client status updates to "Invited".

2. **Given** a client record with an email that IS already a platform user,
   **When** the authorized user clicks "Invite Client",
   **Then** a notification email is sent to that user and the client status updates to "Invited".

3. **Given** a client who has already accepted their invitation,
   **When** an authorized user clicks "Invite Again",
   **Then** an error is displayed: "This client has already accepted their invitation."

4. **Given** a client with no email address,
   **When** an authorized user clicks "Invite",
   **Then** an error is displayed: "An email address is required to send an invitation."

---

### P3 — Client Accepts an Invitation (Priority: P3)

As an invited client,
I want to click my invitation link and accept access to my case,
So that I can log in and view my case details.

**Acceptance Scenarios**:

1. **Given** an invited client clicks their invitation link,
   **When** they are on the accept invitation page and confirm,
   **Then** they are granted `SiteCaseClient` access to the case and the client record shows "Accepted" status.

2. **Given** an invitation that has expired,
   **When** the client clicks the link,
   **Then** an error message is shown: "This invitation has expired. Please ask your legal team to resend the invitation."

3. **Given** an already-accepted invitation,
   **When** the client clicks the link again,
   **Then** an error message is shown: "This invitation has already been accepted."

---

### Edge Cases

- Client record with no email → invite button is disabled/greyed out
- Email send failure during invite → error shown, no invitation state saved
- Gender defaults to Male if not selected

---

## Requirements

### Functional Requirements

- **FR-001**: The Clients tab MUST display clients with: name, email, phone, invitation status (Not Invited / Invited / Accepted).
- **FR-002**: The Add Client form MUST include: full name (required), email (required), phone (optional), gender (optional), remarks (optional).
- **FR-003**: Each client row MUST show an "Invite" button if not yet invited, disabled if already accepted.
- **FR-004**: Invitation state MUST update in the UI after successful invite (e.g., status chip changes from "Not Invited" to "Invited").
- **FR-005**: The invitation acceptance page MUST validate the link, show a confirmation step, and display a clear success or error message.
- **FR-006**: `OrganizationClerk` and `SiteCaseClient` MUST NOT see add/edit/delete/invite controls.
- **FR-007**: Delete MUST require a confirmation dialog.

### Key Entities

- **Case Client**: An informational record linking a person to a case. Has invitation status: Not Invited, Invited, Accepted.
- **Invitation**: A time-limited email link that grants the client the SiteCaseClient role on acceptance.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: An authorized user can add a client and send an invitation in under 3 minutes.
- **SC-002**: Invitation status updates in the UI within 3 seconds of a successful invite action.
- **SC-003**: The acceptance page handles expired and already-accepted invitations with clear, user-friendly messages.
- **SC-004**: Zero invite buttons are visible to OrganizationClerk or SiteCaseClient users.

---

## Assumptions

- The invitation acceptance page is a publicly accessible route (no login required to reach it, though the user must log in or register to complete acceptance).
- Invitation expiry duration is configured server-side — the UI does not display or manage this.

---

## Out of Scope

- Client self-registration (standalone client account) — spec `015-client-management`
- SiteCaseClient portal features beyond viewing their case — not implemented
