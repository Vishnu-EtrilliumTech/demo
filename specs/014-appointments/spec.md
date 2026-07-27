# Feature Specification: Appointments

**Feature Branch**: `014-appointments`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow clients and legal experts to book and manage appointments. Appointments can be online (a video meeting link is auto-generated) or offline (a physical address is required). Both parties can independently decline an appointment. A payment settlement is automatically created when an appointment is booked.

---

## Actors

| Actor | Book appointment | View own appointments | Decline own | Admin access |
|---|---|---|---|---|
| `Client` | Yes | Yes | Yes (client side) | No |
| `LegalIndividualExpert` | Yes | Yes (own) | Yes (expert side) | No |
| `SystemAdmin` | Yes | Yes (all) | Yes (either side) | Delete |

---

## User Scenarios & Testing

### P1 — Client Books an Online Appointment (Priority: P1)

As a client,
I want to book an online appointment with a legal expert,
So that I can consult with them via video call on my chosen date and time slot.

**Independent Test**: As a Client, navigate to a legal expert's profile, choose a date and slot, select "Online", submit. A confirmation with a video meeting link appears.

**Acceptance Scenarios**:

1. **Given** a client on a legal expert's availability page,
   **When** they select a date, available time slot, and "Online" meeting type,
   **Then** the booking form submits and a confirmation page shows: appointment details, video meeting link, and payment settlement info.

2. **Given** the selected expert, date, and slot is already booked,
   **When** the client tries to book,
   **Then** an error is shown: "This time slot is no longer available. Please choose a different slot."

3. **Given** an online appointment is being booked and the video meeting service fails,
   **When** the booking is submitted,
   **Then** an error is shown: "Unable to create the video meeting. Please try again."

---

### P2 — Client Books an Offline Appointment (Priority: P2)

As a client,
I want to book an in-person appointment at a specific office address,
So that I can meet the legal expert face-to-face.

**Acceptance Scenarios**:

1. **Given** the client selects "Offline" meeting type,
   **When** the booking form renders,
   **Then** an address selector appears (showing the expert's registered office addresses).

2. **Given** the client selects an address and submits,
   **When** the booking succeeds,
   **Then** a confirmation page shows the appointment details with the selected office address.

3. **Given** the client selects "Offline" but no address is selected,
   **When** the form is submitted,
   **Then** an error is shown: "Please select an office address for the in-person appointment."

---

### P3 — View My Appointments (Priority: P3)

As a client or legal expert,
I want to see my upcoming and past appointments in one place,
So that I can manage my schedule.

**Acceptance Scenarios**:

1. **Given** a client on their Appointments page,
   **When** the page loads,
   **Then** upcoming appointments are shown with: expert name, date/time, meeting type (online/offline), status.

2. **Given** a legal expert on their dashboard,
   **When** they view appointments,
   **Then** upcoming and past appointments are listed with client names and meeting details.

---

### P4 — Decline an Appointment (Priority: P4)

As a client or legal expert,
I want to decline an appointment I can no longer attend,
So that the other party is informed.

**Acceptance Scenarios**:

1. **Given** an upcoming appointment for the client,
   **When** they click "Decline" and provide a reason,
   **Then** a confirmation dialog appears and on confirm, the appointment is marked declined (client side) and the reason is recorded.

2. **Given** an appointment that has already passed,
   **When** the client tries to decline,
   **Then** an error is shown: "You cannot decline a past appointment."

3. **Given** an appointment already declined by the client,
   **When** they try to decline again,
   **Then** an error is shown: "This appointment has already been declined."

---

### Edge Cases

- Meeting date in the past → accepted (historical records)
- Expert is inactive → booking not allowed; error shown
- Both sides can independently decline — a decline by one party does not prevent the other from also declining

---

## Requirements

### Functional Requirements

- **FR-001**: The appointment booking form MUST show: expert selector (or pre-selected from expert profile), date picker, time slot selector (based on expert availability), meeting type toggle (Online/Offline), address selector (if Offline).
- **FR-002**: Online appointment MUST auto-generate a video meeting link — this link MUST be shown in the confirmation.
- **FR-003**: Time slot availability MUST be checked in real-time against the expert's schedule (no double-booking).
- **FR-004**: The Appointments page MUST show separate tabs or sections for Upcoming and Past appointments.
- **FR-005**: Decline action MUST include a reason text field and a confirmation dialog.
- **FR-006**: Declined appointments MUST remain visible with a "Declined" status badge (not deleted).
- **FR-007**: A payment settlement record is auto-created on booking — users see the settlement due date in the confirmation.

### Key Entities

- **Appointment**: A scheduled meeting between client and expert. Online (video link) or Offline (address). Has decline status for each party.
- **Time Slot**: A bookable unit within the expert's availability schedule. Prevents double-booking.
- **Payment Settlement**: Auto-created on appointment booking — due 3 days after meeting date.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: A client can complete an appointment booking in under 3 minutes.
- **SC-002**: Double-booking is prevented — the time slot selector shows only available slots.
- **SC-003**: Video meeting link is displayed in the confirmation within the same request.
- **SC-004**: Decline confirmation dialog appears before any decline action is sent.

---

## Assumptions

- The time slot selector fetches the expert's availability calendar before rendering.
- Video meeting is created by an external service configured server-side.
- The appointment booking page is accessible from the expert's profile page.

---

## Out of Scope

- Appointment rescheduling — not implemented
- Video meeting account management — external service
- Payment processing for appointments — spec `016-orders-payments`
