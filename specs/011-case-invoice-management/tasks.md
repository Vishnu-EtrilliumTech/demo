# Tasks: Case Invoice Management

**Input**: `specs/011-case-invoice-management/`
**Branch**: `011-case-invoice-management`

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1=Create invoice, US2=Update payment status, US3=Attach invoice file

---

## Phase 1: Setup

**Purpose**: Audit existing implementation to identify exactly what needs building vs. what already exists.

- [ ] T001 Read `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/InvoiceTab/InvoiceTab.tsx` — audit: SiteCaseClient read-only guard on Add/Edit/Delete/MarkAsPaid; OrgClerk tab hidden logic; `InvoicePaymentStatusBadge` sub-component existence; `AddInvoiceForm` and `EditInvoiceDialog` sub-components existence
- [ ] T002 [P] Read `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/useCaseInvoices.ts` — verify it is fully implemented per plan; check `handleDownloadInvoice` (base64 decode + Blob + download trigger); verify `PaymentStatus` enum used; verify validation blocks `invoiceFileName` set without `invoiceContent`
- [ ] T003 [P] Verify `CaseInvoiceSchemas.add` in `src/utils/caseValidationSchemas.ts` allows `amount >= 0` (spec says 0 is valid for pro-bono); update rule if it enforces `amount > 0`
- [ ] T004 [P] Verify `PaymentStatus` enum in `src/app/organization/types/caseindex.ts` includes: `None`, `Pending`, `Failed`, `Paid`

---

## Phase 2: UI

**Purpose**: Build or enhance sub-components: status badge, add invoice form, edit dialog.

- [ ] T005 [P] [US1] Create `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/InvoiceTab/InvoicePaymentStatusBadge.tsx` — MUI `Chip` with color prop: `None`→default, `Pending`→warning, `Failed`→error, `Paid`→success; prop `status: PaymentStatus`
- [ ] T006 [US1] Create `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/InvoiceTab/AddInvoiceForm.tsx` — MUI fields: DatePicker for dueDate (required), TextField type=number for amount (required, >= 0), Select for paymentStatus (required, options: None/Pending/Failed/Paid), TextField for invoiceFileName (required when file selected), hidden `<input type="file" />` for invoiceContent, multiline TextField for remarks (optional); submit button disabled during API call
- [ ] T007 [US3] Add file validation in `AddInvoiceForm.tsx` — if `invoiceFileName` is non-empty but `invoiceContent` is empty (no file selected), show inline error "Please select a file to upload." before submit
- [ ] T008 [US1] Create `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/InvoiceTab/EditInvoiceDialog.tsx` — MUI Dialog containing same fields as `AddInvoiceForm`; pre-populated with existing invoice data; show `paymentReceivedDate` as read-only text: "(auto-recorded: {date})" when `status=Paid`
- [ ] T009 [US2] Add per-row "Mark as Paid" quick-action button in `InvoiceTab.tsx` — calls `updateCaseInvoicePaymentStatus(orgId, siteId, caseId, invoiceId, 'Paid')`; hidden for `isReadOnly` (SiteCaseClient)
- [ ] T010 [US1] Confirm `InvoiceTab.tsx` accepts `isHidden: boolean` and `isReadOnly: boolean` props — `isHidden` (OrgClerk) → return null; `isReadOnly` (SiteCaseClient) → render list without Add/Edit/Delete/MarkAsPaid controls
- [ ] T011 [US1] Apply INR currency formatting in `InvoiceTab.tsx` amount column using `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(invoice.amount)`

---

## Phase 3: Logic

**Purpose**: Verify or fix amount validation, download handler, and RBAC rendering.

- [ ] T012 [US3] Update `CaseInvoiceSchemas.add` in `src/utils/caseValidationSchemas.ts` — change amount validation rule to `amount >= 0` (allows pro-bono zero amounts); revert if already correct
- [ ] T013 [US2] Verify `useCaseInvoices.ts` `handleDownloadInvoice` decodes base64 `invoiceContent` correctly: `atob(base64String)` → `Uint8Array` → `Blob` → `URL.createObjectURL` → `<a download>` click → `URL.revokeObjectURL`
- [ ] T014 [US2] Verify `paymentReceivedDate` is returned by the backend on `fetchCaseInvoices` and included in `CaseInvoice` type; add to type definition in `caseindex.ts` if missing
- [ ] T015 [US1] Verify `useCaseInvoices.ts` reloads invoices after `addCaseInvoice`, `updateCaseInvoice`, `updateCaseInvoicePaymentStatus`, and `deleteCaseInvoice` — or updates local state optimistically

---

## Phase 4: API

**Purpose**: Confirm all five invoice API functions are present and correctly typed.

- [ ] T016 [P] Confirm `fetchCaseInvoices`, `addCaseInvoice`, `updateCaseInvoice`, `updateCaseInvoicePaymentStatus`, `deleteCaseInvoice` in `src/app/organization/services/caseapi.ts` — verify `PATCH .../invoices/{invoiceId}/paymentstatus` endpoint URL for status update
- [ ] T017 [P] Confirm `addCaseInvoice` request body includes `invoiceContent` as base64 string (not multipart) and `generatedDate` as ISO8601 string; confirm response shape `{ data: CaseInvoice }`

---

## Phase 5: Backend

**Purpose**: Verify backend behaviour for payment status transitions and file upload.

- [ ] T018 Confirm PATCH `.../invoices/{invoiceId}/paymentstatus` with `Paid` auto-sets `paymentReceivedDate` on first transition; confirm re-sending `Paid` does NOT overwrite the original `paymentReceivedDate` (spec P2 scenario 2)
- [ ] T019 [P] Confirm OrgClerk cannot POST to the invoices endpoint — returns `403`; SiteCaseClient also returns `403` on any write operation

---

## Phase 6: Security

**Purpose**: Confirm RBAC gate hides Invoice tab for OrgClerk and write controls for SiteCaseClient.

- [ ] T020 [US1] Verify `isOrganizationClerk` check passes `isHidden={true}` to `InvoiceTab` in the case detail page — OrgClerk must not see the Invoices tab rendered at all in the DOM
- [ ] T021 [US1] Verify `isSiteCaseClient` passes `isReadOnly={true}` to `InvoiceTab` — Add/Edit/Delete/MarkAsPaid buttons absent from DOM; list renders with status badges
- [ ] T022 [US3] Verify file content is base64-encoded in the request payload — no raw binary data in HTTP request body; file content never appears in console logs

---

## Phase 7: Testing

**Purpose**: Unit and E2E coverage for all three user stories.

- [ ] T023 [P] [US1] Write unit test `hooks/__tests__/useCaseInvoices.test.ts` — loads invoices on mount; `handleAddInvoice` calls `addCaseInvoice` with correct payload; `handleUpdatePaymentStatus` calls `updateCaseInvoicePaymentStatus`; `confirmDeleteInvoice` calls `deleteCaseInvoice`; validation blocks submission when `invoiceFileName` set but `invoiceContent` empty; `handleDownloadInvoice` decodes base64 and triggers download
- [ ] T024 [P] [US1] Write unit test `InvoiceTab/__tests__/InvoiceTab.test.tsx` — SiteCaseClient: Add/Edit/Delete/MarkAsPaid buttons not rendered; OrgClerk: entire tab not rendered (`isHidden=true`); `InvoicePaymentStatusBadge` renders correct MUI Chip color per PaymentStatus value
- [ ] T025 Write E2E test `e2e/011-case-invoice-management.spec.ts` — authorized user creates invoice; invoice appears in list; Mark as Paid → payment received date appears in row; delete invoice → confirmation dialog → invoice removed; SiteCaseClient sees list but no write controls

---

## Phase 8: Logging

**Purpose**: Structured console logging per plan section 10.

- [ ] T026 Verify `useCaseInvoices.ts` logs: invoice loaded (count); invoice added/updated/deleted (invoiceId — not amount or filename); download (invoiceId — not content); API errors before `showError()` — never log `invoiceContent`, file binary, or token; amount may be logged for debugging only

---

## Phase 9: Quality Gates

**Purpose**: Pre-commit checks must pass.

- [ ] T027 Run `npm run type-check` — fix TypeScript errors in new `AddInvoiceForm.tsx`, `EditInvoiceDialog.tsx`, `InvoicePaymentStatusBadge.tsx`, and any updated `caseindex.ts` or `useCaseInvoices.ts`
- [ ] T028 [P] Run `npm run lint` — fix all ESLint warnings
- [ ] T029 Run `npm run build` — production build passes
- [ ] T030 [P] Run `npm run test` — all new unit tests pass

---

## Phase 10: Finalization

**Purpose**: Final review and commit.

- [ ] T031 Confirm `paymentReceivedDate` field is in `CaseInvoice` type — grep for `paymentReceivedDate` in `caseindex.ts`; add if missing (plan flags this as a medium risk)
- [ ] T032 [P] Confirm amount `0` is accepted by the updated `CaseInvoiceSchemas.add` — run a quick test with `amount: 0` to verify no validation error fires
- [ ] T033 Commit: `feat(011): build AddInvoiceForm, EditInvoiceDialog, InvoicePaymentStatusBadge; fix OrgClerk/SiteCaseClient RBAC; add invoice unit and E2E tests`

---

## Dependencies

- **Setup (Phase 1)**: Start immediately — audit to determine actual scope
- **UI (Phase 2)**: T005–T010 can run parallel after T001 audit; T007 depends on T006
- **Logic (Phase 3)**: T012 depends on T003; T014–T015 depend on T002 audit
- **API (Phase 4)**: Parallel — verification only
- **Backend (Phase 5)**: Depends on API (Phase 4)
- **Security (Phase 6)**: Depends on UI + Logic; T020–T021 depend on T010
- **Testing (Phase 7)**: Depends on all implementation phases

### Parallel Opportunities

```
After Setup:
  [Parallel] T005 (StatusBadge) + T006 (AddInvoiceForm) + T008 (EditInvoiceDialog) — different files
  [Parallel] Logic verification (T012-T015) + API check (T016-T017)

After Implementation:
  [Parallel] T023 + T024 (unit test files)
  [Parallel] T027 (type-check) + T028 (lint) + T030 (tests)
```

### Suggested MVP

Complete Setup (Phase 1) to confirm what already exists in `InvoiceTab.tsx` and `useCaseInvoices.ts`. Then build only the missing sub-components identified in T001. The hook is reportedly complete — if `InvoiceTab.tsx` is also complete, most work shifts to testing.
