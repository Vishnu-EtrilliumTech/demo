# Feature Specification: Case Invoice Management

**Feature Branch**: `011-case-invoice-management`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow authorized users to create, view, update, and delete invoices within a legal case. Invoices track financial obligations with due dates, amounts, payment status, and optional file attachments. When payment status is set to "Paid", the payment date is recorded automatically. SiteCaseClient can view invoices but cannot create, edit, or delete them.

---

## Actors

| Actor | Create | View | Update | Delete |
|---|---|---|---|---|
| `OrganizationAdmin`, `SiteAdmin`, `SiteClerk`, `SiteSrLegalExpert`, `SiteLegalExpert` | Yes | Yes | Yes | Yes |
| `SiteCaseClient` | No | Yes (read-only) | No | No |
| `OrganizationClerk` | No | No | No | No |

---

## User Scenarios & Testing

### P1 — Create an Invoice (Priority: P1)

As an authorized user,
I want to create an invoice for a case with an amount, due date, and payment status,
So that the firm can track billing and payment for the case.

**Independent Test**: Navigate to Case > Invoices tab > Add Invoice. Fill required fields and submit. Invoice appears in the list.

**Acceptance Scenarios**:

1. **Given** an authorized user on the Invoices tab,
   **When** they click "Add Invoice",
   **Then** a form opens with: due date (required), amount (required), payment status (required, dropdown), optional invoice file attachment, optional remarks.

2. **Given** payment status is set to "Paid" at creation,
   **When** the form is submitted successfully,
   **Then** the invoice shows a payment received date (auto-set by the system, not a user input).

3. **Given** a SiteCaseClient on the Invoices tab,
   **When** the tab loads,
   **Then** they see the invoice list read-only with no Add/Edit/Delete controls.

---

### P2 — Update Invoice Payment Status (Priority: P2)

As an authorized user,
I want to quickly update an invoice's payment status without editing all other fields,
So that marking invoices as paid is fast and simple.

**Acceptance Scenarios**:

1. **Given** an invoice with "Pending" status,
   **When** an authorized user clicks a "Mark as Paid" action or changes status to "Paid" in the edit form,
   **Then** the payment received date is automatically recorded and shown on the invoice.

2. **Given** an invoice where the payment date has already been recorded,
   **When** the status is changed to "Paid" again,
   **Then** the original payment received date is preserved (not overwritten).

---

### P3 — Attach Invoice File (Priority: P3)

As an authorized user,
I want to attach an invoice PDF or file to the invoice record,
So that the actual invoice document is stored alongside the financial record.

**Acceptance Scenarios**:

1. **Given** the Add or Edit Invoice form is open,
   **When** the user selects a file and provides a filename,
   **Then** the file uploads with the invoice.

2. **Given** the user provides a filename but no file content,
   **When** they try to submit,
   **Then** an error is shown: "Please select a file to upload."

---

### Edge Cases

- Amount of 0 → accepted (pro bono or internal tracking)
- Due date in the past → accepted (no restriction)
- Invalid payment status value → dropdown prevents it
- File content without filename → accepted (stored without name)

---

## Requirements

### Functional Requirements

- **FR-001**: The Invoices tab MUST display: due date, amount (formatted as currency), payment status badge, payment received date (if paid), remarks.
- **FR-002**: Payment status options MUST be: None, Pending, Failed, Paid.
- **FR-003**: When status is set to "Paid", the UI MUST display the auto-recorded payment date (not an editable field).
- **FR-004**: An optional file attachment field MUST allow uploading an invoice document.
- **FR-005**: Providing a filename without file content MUST show a validation error.
- **FR-006**: A "Mark as Paid" quick action on each invoice row SHOULD be available for fast payment status updates.
- **FR-007**: SiteCaseClient MUST see invoices in read-only mode with no write controls.
- **FR-008**: Delete MUST require confirmation.

### Key Entities

- **Invoice**: Financial record with due date, amount, payment status, optional file, and remarks.
- **Payment Status**: None (initial), Pending, Failed, Paid.
- **Payment Received Date**: Auto-set on first transition to Paid — not editable by users.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: An authorized user can create an invoice in under 2 minutes.
- **SC-002**: Payment status badge is color-coded (e.g., Paid = green, Pending = orange, Failed = red).
- **SC-003**: The payment received date appears immediately on the invoice after marking as Paid.
- **SC-004**: SiteCaseClient users see zero write controls on the Invoices tab.

---

## Assumptions

- Amount is formatted as currency (INR by default) in the UI.
- The payment received date is read-only in the UI — it's displayed but never editable by users.

---

## Out of Scope

- Payment gateway integration (appointment payments) — spec `016-orders-payments`
- Invoice PDF generation — not implemented
