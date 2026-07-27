# Spec Delta: data-integrity

**Change ID**: `fix-invoice-form-state-persistence`
**Related Spec**: `data-integrity`

## ADDED Requirements

### Requirement: Form State Must Be Completely Reset After Successful Submission

**Description:** When a form is successfully submitted and closed, all form-related state including both hook-managed state (form data, validation errors) and component-managed state (file selections, UI feedback) MUST be completely reset to their initial empty values. Subsequent reopening of the form MUST show a clean state with no residual data from previous submissions.

**Rationale:** Form state persistence across submission cycles creates data integrity issues and user confusion. When users create multiple records sequentially, residual state from previous submissions can lead to:
1. **Accidental data duplication**: Previous file attachments or field values being resubmitted unintentionally
2. **User confusion**: Seeing pre-filled fields when expecting a clean form
3. **Inconsistent behavior**: Cancel properly clears state but successful submission does not
4. **Data integrity violations**: Unintended data being sent to API

A complete state reset ensures the form accurately reflects a "new record" state and prevents stale data from leaking across submission boundaries.

**Acceptance Criteria:**
- After successful form submission, hook-managed state (form data, validation errors, loading flags) is reset to initial values
- After successful form submission, component-managed state (file selections, temporary UI state) is reset to initial values
- File input DOM elements are cleared (value set to empty string)
- Reopening the form after submission shows all fields empty with default values
- Cancel button continues to properly clear all state (existing behavior maintained)
- Failed submissions retain form state to allow user corrections

#### Scenario: Invoice form file selection cleared after successful submission

**Given:**
- User is on the Case Invoice page
- User clicks "Generate Invoice" button
- Invoice form opens in clean state

**When:**
- User uploads invoice file "Purchase_bill.jpeg"
- Component state `selectedFile` contains File object for "Purchase_bill.jpeg"
- User fills in required fields: amount, due date, payment status
- User clicks "Generate Invoice" submit button
- API request succeeds and invoice is created
- Hook resets `invoiceForm` state to initial values
- Hook calls `resetFileSelection` callback
- Component clears `selectedFile` state to null
- Component clears file input element value
- Form closes (`showAddInvoice` set to false)

**Then:**
- Invoice appears in the invoice list
- All hook state is reset:
  - `invoiceForm.amount = 0`
  - `invoiceForm.dueDate = ''`
  - `invoiceForm.invoiceFileName = ''`
  - `invoiceForm.invoiceContent = ''`
  - `invoiceForm.remarks = ''`
  - Validation errors cleared
- All component state is reset:
  - `selectedFile = null`
  - File input element value is `''`
- Success toast message displays

**Validation:**
- Inspect hook state after submission: all form fields at initial values
- Inspect component state after submission: `selectedFile === null`
- Inspect file input DOM element: `value === ''`
- No console errors related to state management

#### Scenario: Reopening invoice form after successful submission shows clean state

**Given:**
- User has successfully submitted an invoice with file "Purchase_bill.jpeg"
- Form was properly closed and all state was reset (from previous scenario)

**When:**
- User clicks "Generate Invoice" button again
- Form reopens (`showAddInvoice` set to true)

**Then:**
- Form displays with completely clean state:
  - No file selected or displayed
  - File upload button shows "Choose File"
  - Amount field is empty (showing ₹0 or empty based on component)
  - Due date field is empty
  - Payment status defaults to "Pending"
  - Remarks field is empty
- No residual data from previous submission
- User can upload a different file (e.g., "Invoice_002.pdf") without any interference

**Validation:**
- Visual check: no file name displayed in form
- Visual check: all form fields appear empty/default
- Upload a new file: new file is displayed, not previous file
- Submit new invoice: correct file is submitted, not previous file

#### Scenario: Invoice form cancel button clears all state (existing behavior maintained)

**Given:**
- User opens invoice form
- User uploads file "Test.pdf"
- User fills in some fields

**When:**
- User clicks "Cancel" button

**Then:**
- Form closes
- All state is cleared:
  - `selectedFile = null`
  - File input element value cleared
  - Hook form state reset
- Reopening form shows clean state

**Validation:**
- Cancel behavior is unchanged by the fix
- Cancel still properly clears all state
- No regression in cancel functionality

#### Scenario: Failed invoice submission retains form state for retry

**Given:**
- User opens invoice form
- User uploads file "Invoice.pdf"
- User fills in form fields
- API validation fails (e.g., amount is invalid)

**When:**
- API returns error response
- Hook does NOT reset form state
- Hook does NOT call `resetFileSelection`
- Form remains open to allow corrections

**Then:**
- Form state is preserved:
  - `selectedFile` still contains File object for "Invoice.pdf"
  - File name still displayed in UI
  - All form field values retained
  - Validation errors displayed
- User can correct errors and resubmit
- User does not need to re-upload the file

**Validation:**
- Form data is not cleared on API error
- File selection is not cleared on API error
- User can immediately retry without re-entering data
- No state reset occurs until successful submission

#### Scenario: Multiple sequential invoice submissions maintain clean state

**Given:**
- User needs to create 3 invoices in sequence

**When:**
1. User creates invoice #1 with file "Invoice_A.pdf" → Success → Form closes
2. User clicks "Generate Invoice" → Form opens clean
3. User creates invoice #2 with file "Invoice_B.pdf" → Success → Form closes
4. User clicks "Generate Invoice" → Form opens clean
5. User creates invoice #3 with file "Invoice_C.pdf" → Success → Form closes

**Then:**
- Each form opening shows clean state with no residual data
- Invoice #2 is NOT created with "Invoice_A.pdf"
- Invoice #3 is NOT created with "Invoice_B.pdf"
- Each invoice has the correct file attachment
- User experience is consistent and predictable

**Validation:**
- Verify each invoice in the list has the correct file name
- Verify no accidental file duplication across invoices
- Verify form is clean on each reopening
- No state leakage between form instances

---

## Notes

This requirement extends the existing data integrity principles to form state management. It complements the existing requirements about:
- API transformation not inserting display values
- Edit forms using raw data values
- Display formatting being applied in JSX only

By ensuring form state is completely reset after successful submission, we prevent stale UI state from causing data integrity issues similar to how "N/A" placeholder values caused issues in edit forms.
