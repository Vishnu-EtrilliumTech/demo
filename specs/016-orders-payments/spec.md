# Feature Specification: Orders & Payments

**Feature Branch**: `016-orders-payments`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow clients to pay for appointments using an integrated payment gateway (Razorpay). The flow involves creating a payment order, completing payment in the Razorpay checkout UI, and confirming the payment result back to the platform. Clients and experts can view their order history.

---

## Actors

| Actor | Pay for appointment | View own orders | View all orders | Delete order |
|---|---|---|---|---|
| `Client` | Yes | Yes | No | No |
| `LegalIndividualExpert` | No | Yes (own) | No | No |
| `SystemAdmin` | No | Yes | Yes | Yes |

---

## User Scenarios & Testing

### P1 — Client Pays for an Appointment (Priority: P1)

As a client,
I want to pay for my appointment using my debit/credit card or UPI,
So that the appointment is confirmed and the expert is compensated.

**Independent Test**: As a Client with a booked appointment, navigate to Appointments > Pay Now. Complete the Razorpay checkout. Return to the platform and see a "Payment Successful" confirmation.

**Acceptance Scenarios**:

1. **Given** a client with an unpaid appointment,
   **When** they click "Pay Now" on the appointment,
   **Then** the Razorpay payment modal/page opens with the correct amount.

2. **Given** the client completes payment in the Razorpay UI,
   **When** the payment is confirmed and the platform verifies the signature,
   **Then** the appointment shows a "Payment Successful" status and the order history is updated.

3. **Given** the payment gateway is unavailable,
   **When** the client tries to initiate payment,
   **Then** an error is shown: "Payment service is temporarily unavailable. Please try again later."

4. **Given** the payment is completed but signature verification fails,
   **When** the confirmation is submitted,
   **Then** an error is shown: "Payment verification failed. Please contact support."

---

### P2 — View Payment/Order History (Priority: P2)

As a client or legal expert,
I want to view my past orders and payment statuses,
So that I have a record of all my transactions.

**Acceptance Scenarios**:

1. **Given** a client on their Orders/Payments page,
   **When** the page loads,
   **Then** a list of all their orders is shown with: appointment details, amount, date, payment status (Created/Success/Failed).

2. **Given** a legal expert on their earnings page,
   **When** the orders section loads,
   **Then** they see orders linked to their appointments with amounts and statuses.

3. **Given** a client trying to view another client's orders,
   **When** the request is made,
   **Then** an access denied error is shown.

---

### P3 — Admin Manages Orders (Priority: P3)

As a SystemAdmin,
I want to view all orders and delete erroneous records,
So that I can manage platform-level payment data.

**Acceptance Scenarios**:

1. **Given** a SystemAdmin on the Orders Management page,
   **When** the page loads,
   **Then** all orders are listed with client name, expert name, appointment date, amount, status.

2. **Given** the admin deletes an order and confirms,
   **When** deletion succeeds,
   **Then** the order is permanently removed.

---

### Edge Cases

- Payment session timeout in Razorpay → user is returned to the app with no order created; a "Payment cancelled" message appears
- Invalid order ID on admin delete → error message shown

---

## Requirements

### Functional Requirements

- **FR-001**: A "Pay Now" button MUST be available on unpaid appointment records.
- **FR-002**: The Razorpay SDK/checkout MUST be integrated client-side to open the payment modal.
- **FR-003**: After payment completion, the platform MUST verify the payment signature server-side before updating status.
- **FR-004**: Payment status MUST update to "Success" on the appointment and order records after confirmed payment.
- **FR-005**: Clients and experts MUST see their own orders only — cross-user access is blocked.
- **FR-006**: Admin order list MUST support search by client name or appointment.
- **FR-007**: Delete MUST require confirmation.

### Key Entities

- **Order**: A payment record linked to an appointment. Has status: Created, Success, or Failed.
- **Gateway Order Reference**: The external ID returned by Razorpay — used for confirmation.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: The Razorpay payment modal opens within 2 seconds of clicking "Pay Now".
- **SC-002**: Payment status updates on the platform within 5 seconds of completing payment in Razorpay.
- **SC-003**: Invalid payment signatures are rejected with a user-friendly error (no silent failures).
- **SC-004**: Order history renders within 2 seconds for up to 50 orders.

---

## Assumptions

- Razorpay SDK is loaded from a CDN or bundled into the frontend app.
- The RAZORPAY_KEY_ID is available in the frontend environment configuration.
- Commission and platform charge calculations happen server-side — the client-facing amount is the final amount to pay.

---

## Out of Scope

- Payment settlement processing — spec `030-payment-settlements`
- Refunds — not implemented
- Razorpay webhook handling — server-side only, no frontend involvement
- Invoice PDF generation — not implemented
