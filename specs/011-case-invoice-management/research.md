# Research & Design Decisions: Case Invoice Management

**Spec**: 011-case-invoice-management | **Date**: 2026-05-14

---

## 1. File Upload Strategy: Base64 vs Multipart

**Decision**: Use base64 encoding in JSON body (not `multipart/form-data`).

**Rationale**: The existing codebase uses base64 encoding for all file content (case documents, task documents). The `AddCaseDocumentRequest` and `AddTaskDocumentRequest` both use `content: string` (base64). The `CaseInvoice` type already has `invoiceContent: string` (base64). Deviating to multipart would require a different axios call pattern and backend endpoint change. Consistency with existing patterns is the overriding concern.

**Implementation**: Read file via `FileReader.readAsDataURL()`, strip the `data:...;base64,` prefix, store as `invoiceContent`.

---

## 2. Payment Received Date: Display Only, Never Editable

**Decision**: `paymentReceivedDate` is not a field in `AddCaseInvoiceRequest` or `UpdateCaseInvoiceRequest`. It is displayed in the invoice list if present on the `CaseInvoice` response object.

**Rationale**: The spec explicitly states this date is auto-recorded by the system on first transition to Paid. The backend sets it server-side. The UI must never render this as an input field. The existing `UpdateCaseInvoiceRequest` type does not include `paymentReceivedDate` as a writable field.

**Note**: The `CaseInvoice` type in `caseindex.ts` does not currently include `paymentReceivedDate`. This field must be added to the `CaseInvoice` interface when confirmed with the backend team that the GET response includes it.

---

## 3. "Mark as Paid" Quick Action vs. Full Edit

**Decision**: Implement "Mark as Paid" as a dedicated row action that calls `updateCaseInvoicePaymentStatus` with `{ paymentStatus: 'Paid' }`.

**Rationale**: The spec requires a fast path for payment status updates (FR-006). A full edit dialog requires the user to navigate multiple fields. The existing hook already has `handleUpdatePaymentStatus` wired to `updateCaseInvoicePaymentStatus`. This separate endpoint avoids sending the entire invoice payload just to change status.

**UX**: Show "Mark as Paid" only when current status is NOT already Paid. When status is Paid, the action button is hidden (not disabled — per constitution).

---

## 4. Amount Validation: Zero vs Positive

**Decision**: Update `CaseInvoiceSchemas.add` and `CaseInvoiceSchemas.update` to allow `amount >= 0` (not strictly `> 0`).

**Rationale**: The spec explicitly states "Amount of 0 → accepted (pro bono or internal tracking)". The current schema rule validates `value > 0`, which would incorrectly reject pro-bono invoices. The schema must be relaxed to `>= 0`.

---

## 5. INR Currency Formatting

**Decision**: Format using `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.

**Rationale**: The spec states "Amount is formatted as currency (INR by default) in the UI." Using the browser's built-in `Intl.NumberFormat` avoids adding a dependency (e.g., `currency.js`). This renders as "₹5,000.00" in the table.

---

## 6. Color-Coded Payment Status Badge

**Decision**: Use MUI `Chip` component with `color` mapped from `PaymentStatus` enum.

| Status | MUI color | Hex (approximate) |
|---|---|---|
| None | default (grey) | #9E9E9E |
| Pending | warning (orange) | #FF9800 |
| Failed | error (red) | #D32F2F |
| Paid | success (green) | #2E7D32 |

**Rationale**: MUI Chip's built-in semantic colors convey meaning at a glance. No custom CSS needed. Meets SC-002 (color-coded badge).

---

## 7. OrganizationClerk Access Gating

**Decision**: The Invoices tab entry in the case tab list must be conditionally excluded for OrganizationClerk — not just show an empty state.

**Rationale**: FR-007 is about SiteCaseClient read-only. But spec also states OrgClerk has "No" access to all invoice operations. This must be treated as "tab not visible" (consistent with constitution's "hidden not disabled" rule).

**Implementation**: In the case detail page's tab configuration array, filter out the Invoices tab when `isOrganizationClerk` is true.

---

## 8. Filename + File Content Validation

**Decision**: Custom cross-field validation: if `invoiceFileName` is non-empty AND `invoiceContent` is empty, block submission with "Please select a file to upload."

**Rationale**: FR-005. The inverse (file content without filename) is accepted per spec edge cases. The validation is directional: filename implies a file must be provided.

**Location**: This cross-field validation runs in the submit handler of `useCaseInvoices.handleAddInvoice`, not inside `useFormValidation` (which is per-field). A manual check before the `validate()` call is sufficient.

---

## 9. Edit Invoice Dialog Architecture

**Decision**: Create `EditInvoiceDialog.tsx` as a new sub-component inside `InvoiceTab/`. It manages its own local form state (pre-seeded from the selected invoice) and calls `handleUpdateInvoiceWithData` on save.

**Rationale**: The existing hook already provides `handleUpdateInvoiceWithData`. The edit dialog only needs local state for the editable fields; it does not need to share state with the add form. Keeping it separate avoids complexity in the main InvoiceTab component.

---

## 10. Download Pattern

**Decision**: Reuse the existing `handleDownloadInvoice` from `useCaseInvoices`. No changes needed.

**Rationale**: The existing implementation decodes base64 content, creates a Blob, and triggers a download via a temporary anchor element. This is the same pattern used elsewhere in the codebase. The function already handles the `data:...;base64,` prefix strip and falls back to `invoice_{id}.pdf` filename.
