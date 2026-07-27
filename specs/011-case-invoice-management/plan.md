# Implementation Plan: Case Invoice Management

**Branch**: `011-case-invoice-management` | **Date**: 2026-05-14 | **Spec**: [spec.md](./spec.md)

---

## Summary

Implement CRUD operations for invoices within a legal case. Invoices track financial obligations with due dates, amounts, payment status, and optional file attachments. When payment status transitions to "Paid", the payment received date is auto-recorded by the backend. SiteCaseClient sees invoices read-only; OrganizationClerk has no access. The core hook (`useCaseInvoices.ts`), types (`CaseInvoice`, `PaymentStatus`), validation schemas (`CaseInvoiceSchemas`), and API service functions in `caseapi.ts` already exist — this plan specifies what remains to be built or enhanced.

---

## Technical Context

- **Route**: `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/` — Invoices tab inside the existing case detail page
- **Existing hook**: `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/useCaseInvoices.ts` — ALREADY EXISTS, fully implemented
- **Existing component**: `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/InvoiceTab/` — ALREADY EXISTS (InvoiceTab.tsx + InvoiceTab.module.css)
- **Existing types**: `CaseInvoice`, `AddCaseInvoiceRequest`, `UpdateCaseInvoiceRequest`, `UpdateCaseInvoicePaymentStatusRequest`, `PaymentStatus` enum — defined in `src/app/organization/types/caseindex.ts`
- **Existing API functions**: `fetchCaseInvoices`, `addCaseInvoice`, `updateCaseInvoice`, `updateCaseInvoicePaymentStatus`, `deleteCaseInvoice` — in `src/app/organization/services/caseapi.ts`
- **Existing validation**: `CaseInvoiceSchemas.add` and `CaseInvoiceSchemas.update` — in `src/utils/caseValidationSchemas.ts`
- **File upload pattern**: Base64 encoding (matches case/task document pattern — content stored as base64 string, `invoiceContent` field)
- **Auth**: `useUserRole()` from `src/hooks/useUserRole.ts` for RBAC; `isSiteCaseClient` gates read-only mode
- **Currency**: INR formatting via `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`

---

## Constitution Check

| Principle | Applied? | Notes |
|---|---|---|
| Forms use `useFormValidation(schema)` | Yes | `CaseInvoiceSchemas.add/update` passed to hook |
| API calls only in service files | Yes | All calls in `caseapi.ts`, no direct axios in components |
| Errors via `useToast()` | Yes | `showSuccess`/`showError` in hook |
| Auth via `initKeycloak()` + `useUserRole()` | Yes | `isSiteCaseClient` hides write controls |
| MUI 6 for all UI | Yes | Table, Dialog, Select, DatePicker, Chip for status badge |
| Business logic in hooks/services | Yes | `useCaseInvoices` handles all logic |
| `src/components/` only if 2+ routes reuse | Yes | Invoice components stay in case route folder |
| API envelope `{ success, data }` | Yes | Typed in `CaseInvoiceResponse` |
| Delete requires MUI Dialog confirmation | Yes | `deleteInvoiceModalOpen` state in hook |
| Role-gated actions hidden (not disabled) | Yes | Write controls conditionally rendered |

---

## 1. Overview

The Invoices tab is an existing tab within the case detail page. The tab renders a list of invoices for the current case with the following capabilities:

- Full CRUD for authorized roles (OrgAdmin, SiteAdmin, SiteClerk, SiteSrLE, SiteLE)
- Read-only view for SiteCaseClient
- No access for OrgClerk (tab hidden)
- "Mark as Paid" quick action per row
- Optional invoice file attachment (base64 encoded)
- Payment received date displayed (read-only) when status is Paid
- MUI Dialog confirmation before delete

---

## 2. Architecture Flow

```
Case Detail Page (page.tsx)
  └── InvoiceTab (components/InvoiceTab/InvoiceTab.tsx)
        └── useCaseInvoices(orgId, siteId, caseId)   [hook — EXISTING]
              ├── fetchCaseInvoices()                 [caseapi.ts — EXISTING]
              ├── addCaseInvoice()                    [caseapi.ts — EXISTING]
              ├── updateCaseInvoice()                 [caseapi.ts — EXISTING]
              ├── updateCaseInvoicePaymentStatus()    [caseapi.ts — EXISTING]
              └── deleteCaseInvoice()                 [caseapi.ts — EXISTING]
```

Role check flow:
```
useUserRole(orgId) → { isSiteCaseClient, isOrganizationClerk }
  → isSiteCaseClient: show list, hide Add/Edit/Delete/MarkAsPaid
  → isOrganizationClerk: hide entire Invoices tab
```

---

## 3. File Structure

```
src/app/organization/[id]/sites/[siteId]/cases/[caseId]/
  components/
    InvoiceTab/
      InvoiceTab.tsx            [EXISTING — enhance]
      InvoiceTab.module.css     [EXISTING — enhance if needed]
      index.ts                  [EXISTING]
      AddInvoiceForm.tsx        [NEW — extract add form into sub-component if not present]
      EditInvoiceDialog.tsx     [NEW — MUI Dialog for editing]
      InvoicePaymentStatusBadge.tsx  [NEW — color-coded Chip]
  hooks/
    useCaseInvoices.ts          [EXISTING — complete, no changes needed]

src/app/organization/services/
  caseapi.ts                    [EXISTING — all invoice functions present]

src/app/organization/types/
  caseindex.ts                  [EXISTING — all invoice types present]

src/utils/
  caseValidationSchemas.ts      [EXISTING — CaseInvoiceSchemas present]
```

---

## 4. Component Design

### InvoiceTab (enhanced)

Props: `{ organizationId, siteId, caseId, isReadOnly: boolean, isHidden: boolean }`

Render logic:
- `isHidden` (OrgClerk) → return null
- `isReadOnly` (SiteCaseClient) → render list without Add/Edit/Delete/MarkAsPaid controls
- Otherwise → full CRUD UI

MUI Table columns:
| Column | Notes |
|---|---|
| Due Date | Formatted `dd MMM yyyy` |
| Amount | INR currency format |
| Payment Status | `InvoicePaymentStatusBadge` Chip |
| Payment Received Date | Shown only when status = Paid; text "(auto-recorded)" |
| Remarks | Truncated to 60 chars, tooltip for full text |
| Actions | Edit / Delete / Mark as Paid (hidden for read-only) |

### InvoicePaymentStatusBadge

MUI `Chip` with `color` prop:
- `None` → `default`
- `Pending` → `warning`
- `Failed` → `error`
- `Paid` → `success`

### AddInvoiceForm

MUI fields:
- `dueDate`: MUI DatePicker (required)
- `amount`: MUI TextField type=number (required)
- `paymentStatus`: MUI Select with PaymentStatus enum options (required)
- `invoiceFileName`: MUI TextField (required when file selected)
- `invoiceContent`: File input (hidden, triggers base64 conversion)
- `remarks`: MUI TextField multiline (optional)

File validation: if `invoiceFileName` is non-empty but `invoiceContent` is empty → validation error "Please select a file to upload."

### EditInvoiceDialog

MUI Dialog containing same fields as AddInvoiceForm. Pre-populated with existing invoice data. `paymentReceivedDate` shown as read-only text if status = Paid.

---

## 5. API Plan

All endpoints follow the pattern:
`/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/invoices`

| Operation | Function | Endpoint |
|---|---|---|
| List | `fetchCaseInvoices` | `GET .../invoices` |
| Create | `addCaseInvoice` | `POST .../invoices` |
| Update | `updateCaseInvoice` | `PUT .../invoices/{invoiceId}` |
| Update status | `updateCaseInvoicePaymentStatus` | `PATCH .../invoices/{invoiceId}/paymentstatus` |
| Delete | `deleteCaseInvoice` | `DELETE .../invoices/{invoiceId}` |

File content is base64-encoded in the request body (not multipart). The `invoiceContent` field carries the base64 string.

Request envelope for create:
```json
{
  "generatedDate": "ISO8601",
  "dueDate": "ISO8601",
  "paymentStatus": "Pending",
  "amount": 5000.00,
  "invoiceFileName": "invoice_jan.pdf",
  "invoiceContent": "<base64>",
  "remarks": "Q1 billing"
}
```

Response on success: `{ data: CaseInvoice, errors: [], meta: {} }`

---

## 6. Security Plan

| Role | Invoices Tab visible | Write controls visible |
|---|---|---|
| OrgAdmin, SiteAdmin, SiteClerk, SiteSrLE, SiteLE | Yes | Yes |
| SiteCaseClient | Yes | No (hidden) |
| OrgClerk | No | No |

- Role check done in the rendering component using `useUserRole(orgId)`
- `isSiteCaseClient` → pass `isReadOnly={true}` to InvoiceTab
- `isOrganizationClerk` → pass `isHidden={true}` to InvoiceTab, or conditionally exclude tab from tab list
- No client-side role bypasses: backend enforces authorization on all write endpoints

---

## 7. State Management

State lives entirely in `useCaseInvoices` hook (local React state). No Redux slice required — invoices are case-scoped and not shared across routes.

Key state:
- `invoices: CaseInvoice[]` — list
- `showAddInvoice: boolean` — add form visibility
- `deleteInvoiceModalOpen: boolean` — delete confirmation dialog
- `invoiceToDelete: CaseInvoice | null` — invoice queued for deletion
- `invoiceForm: AddCaseInvoiceRequest` — controlled form state
- `invoiceErrors` — from `useFormValidation`
- `invoiceApiErrors: string[] | null` — server-side errors

---

## 8. Testing Plan

### Unit Tests (`src/app/organization/.../hooks/__tests__/useCaseInvoices.test.ts`)

- Loads invoices on mount
- `handleAddInvoice` calls `addCaseInvoice` with correct payload
- `handleUpdatePaymentStatus` calls `updateCaseInvoicePaymentStatus`
- `confirmDeleteInvoice` calls `deleteCaseInvoice` and reloads
- Validation blocks submission when `invoiceFileName` set but `invoiceContent` empty
- `handleDownloadInvoice` decodes base64 and triggers download

### Unit Tests (`InvoiceTab.test.tsx`)

- SiteCaseClient: Add/Edit/Delete buttons not rendered
- OrgClerk: entire tab not rendered
- InvoicePaymentStatusBadge renders correct MUI Chip color per status

### E2E Tests (`e2e/case-invoices.spec.ts`)

- Authorized user creates invoice, invoice appears in list
- Mark as Paid → payment received date appears
- Delete invoice → confirmation dialog → invoice removed
- SiteCaseClient sees list but no write controls

---

## 9. Performance

- Invoices loaded once on tab mount, reloaded only after mutations
- File content (base64) excluded from list response — only fetched individually on download action
- MUI Table used (no virtualization needed — invoice count per case is low)

---

## 10. Logging

- `console.log` in `useCaseInvoices` for load/add/update/delete operations (existing pattern)
- `console.error` on API failures before `showError()` toast
- No PII logged (amount and invoice filename logged for debugging only)

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `paymentReceivedDate` not returned by backend on GET | Medium | Medium | Check API response shape; add to `CaseInvoice` type if missing |
| File base64 round-trip causes corruption | Low | High | Test with known PDF; validate atob/btoa in download handler |
| Amount validation: 0 allowed per spec but schema requires positive | Medium | Low | Update `CaseInvoiceSchemas.add` amount rule to `>= 0` |
| OrgClerk tab visibility not currently gated | Medium | Medium | Verify `isOrganizationClerk` check added to tab render logic |
