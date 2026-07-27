# Proposal: Fix Invoice Form State Persistence

**Change ID**: `fix-invoice-form-state-persistence`
**Status**: Draft
**Created**: 2025-11-26
**GitHub Issue**: [#66](https://github.com/eTrillium/Lawsome.Web.UI/issues/66)

## Problem Statement

When a user generates an invoice in the case management system by uploading an attachment (e.g., "Purchase_bill.jpeg"), then clicks "Generate Invoice" again to create a new invoice, the previously uploaded attachment from the first invoice is automatically pre-populated in the new invoice form. This creates a confusing user experience where users may accidentally submit duplicate attachments or need to manually clear the previous attachment.

### Current Behavior

1. User navigates to Case → Invoice page
2. User clicks "Generate Invoice"
3. User uploads attachment "Purchase_bill.jpeg" and fills form
4. User submits invoice successfully
5. User clicks "Generate Invoice" again
6. **BUG**: The form still contains "Purchase_bill.jpeg" from step 3

### Expected Behavior

When the "Generate Invoice" button is clicked after a successful invoice submission, the form should be completely clean with no pre-populated data from previous submissions.

## Root Cause Analysis

The issue is in the `InvoiceTab.tsx` component where local React state (`selectedFile`) manages the file upload UI, but this state is not being reset when the form is reopened after a successful submission.

Current flow:
1. `handleAddInvoice` in `useCaseInvoices.ts:104-140` successfully resets the `invoiceForm` state (line 121-129)
2. However, the `selectedFile` local state in `InvoiceTabPresentation` component (line 124) is NOT reset
3. When user clicks "Generate Invoice" again, `onSetShowAddInvoice(true)` is called (line 275)
4. The `selectedFile` state persists across form open/close cycles
5. The Cancel button handler (line 504-509) does reset `selectedFile`, but the successful submission path does not

## Proposed Solution

Reset the `selectedFile` local state when the invoice form is successfully submitted and closed. This can be achieved by:

1. Exposing a callback from the presentation component to reset file selection state
2. Calling this callback from the hook after successful invoice submission
3. Ensuring the file input element is also cleared

### Alternative Considered

Move `selectedFile` state management into the `useCaseInvoices` hook to have centralized state control. This was rejected because:
- The file state is purely presentational (UI feedback for file selection)
- It doesn't need to be shared across components
- Keeping it in the presentation component follows the existing architecture pattern

## Scope

This change affects:
- **Component**: `InvoiceTab.tsx` (presentation layer)
- **Hook**: `useCaseInvoices.ts` (state management)
- **User Impact**: Fixes confusion when creating multiple invoices sequentially

## Success Criteria

1. After successfully creating an invoice, clicking "Generate Invoice" again shows a clean form
2. No previously selected file is displayed
3. All form fields are reset to their default values
4. The file input element is cleared
5. Canceling the form also properly clears all state (existing behavior maintained)

## Testing Strategy

### Manual Testing Steps
1. Login as Site Admin
2. Navigate to a case Invoice page
3. Click "Generate Invoice"
4. Upload file "Purchase_bill.jpeg"
5. Fill in required fields (amount, due date, payment status)
6. Submit invoice
7. Verify invoice appears in list
8. Click "Generate Invoice" again
9. **Verify**: No file is shown, all fields are empty
10. Upload a different file "Invoice_2.pdf"
11. Submit invoice
12. Repeat steps 8-9 to verify consistent behavior

### Edge Cases
- User uploads file, cancels form, reopens form → should be clean
- User uploads file, submits invoice, immediately submits another → should be clean
- User uploads file, submission fails → file should remain for retry

## Risk Assessment

**Risk Level**: Low

- **Impact**: Single component, isolated state management change
- **Complexity**: Simple state reset logic
- **Breaking Changes**: None
- **User Experience**: Improvement only, no negative impact
- **Data Integrity**: No changes to API calls or data persistence

## Dependencies

None. This is an isolated frontend bug fix.

## Related Changes

None.

## Rollout Plan

Standard deployment process:
1. Implement fix
2. Run build verification (`yarn build`)
3. Manual testing in dev environment
4. Deploy to production

No feature flags or gradual rollout needed.
