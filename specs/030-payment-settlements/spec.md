# Feature Specification: Payment Settlements

**Feature Branch**: `030-payment-settlements`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow legal experts to view the payment settlements associated with their completed appointments, and allow SystemAdmins to view and delete any settlement. Settlements are created automatically when an appointment is booked — they cannot be created manually through the UI.

---

## Actors

| Actor | View own settlements | View any settlement | Delete settlement |
|---|---|---|---|
| `LegalIndividualExpert` | Yes | No | No |
| `SystemAdmin` | Yes | Yes | Yes |

---

## User Scenarios & Testing

### P1 — Expert Views Their Payment Settlements (Priority: P1)

As a LegalIndividualExpert,
I want to see a list of payment settlements for my appointments,
So that I know when I can expect to receive payment.

**Independent Test**: Log in as a LegalIndividualExpert who has at least one completed appointment. Navigate to Payments > Settlements. The list shows the appointment, settlement date (appointment date + 3 days), and status.

**Acceptance Scenarios**:

1. **Given** an authenticated LegalIndividualExpert on their Settlements page,
   **When** the page loads,
   **Then** all payment settlements linked to their appointments are listed with: appointment reference, settlement date, amount, and status (e.g., Pending).

2. **Given** an expert with no settlements,
   **When** the page loads,
   **Then** an empty state message is shown: "No payment settlements yet. Settlements appear automatically after appointments are booked."

3. **Given** an expert trying to view another expert's settlements by manipulating the URL,
   **When** the page loads,
   **Then** an access denied error is shown.

---

### P2 — Admin Views and Manages Settlements (Priority: P2)

As a SystemAdmin,
I want to view and delete payment settlements,
So that I can manage the platform's financial records.

**Acceptance Scenarios**:

1. **Given** a SystemAdmin on the Settlements management page,
   **When** they search or browse settlements for a specific expert,
   **Then** all settlements for that expert are listed.

2. **Given** a SystemAdmin viewing a specific settlement,
   **When** they click "Delete Settlement" and confirm,
   **Then** the settlement is permanently deleted and removed from the list.

---

### Edge Cases

- Settlements are read-only for experts — no create, edit, or delete controls shown
- Settlement date is automatically set to appointment date + 3 days (displayed, not editable)
- An expert can only see their own settlements — cross-expert access is blocked

---

## Requirements

### Functional Requirements

- **FR-001**: The Settlements page for a LegalIndividualExpert MUST list all their settlements with: appointment reference, settlement date, amount, and status.
- **FR-002**: An empty settlement list MUST show a friendly empty state with context explaining that settlements are created automatically.
- **FR-003**: Experts MUST NOT see any create, edit, or delete controls on the Settlements page — the view is strictly read-only for them.
- **FR-004**: SystemAdmin MUST be able to view any expert's settlements and delete individual settlements.
- **FR-005**: Delete MUST require a confirmation dialog warning about permanent removal.
- **FR-006**: Cross-expert access MUST be blocked — an expert seeing another expert's settlements via URL manipulation MUST be shown access denied.

### Key Entities

- **Payment Settlement**: Auto-created when an appointment is booked. Shows settlement date (appointment date + 3 days), amount, and a Pending status. Linked to the appointment and the legal expert.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: The settlement list loads within 2 seconds for an expert with up to 50 settlements.
- **SC-002**: Experts cannot create, edit, or delete settlements — zero write controls visible in the expert view.
- **SC-003**: Cross-expert settlement access is blocked at the UI routing level.

---

## Assumptions

- Settlement creation happens automatically in the Appointments feature (spec `014`) — this UI only exposes the read and admin-delete operations.
- Settlement status starts as "Pending" and may update through other payment processing flows — status display is informational.

---

## Out of Scope

- Appointment booking (which creates the settlement) — spec `014-appointments`
- Payment orders and Razorpay integration — spec `016-orders-payments`
