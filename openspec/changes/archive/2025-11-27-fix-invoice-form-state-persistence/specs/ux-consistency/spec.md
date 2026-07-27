# Spec Delta: ux-consistency

**Change ID**: `fix-invoice-form-state-persistence`
**Related Spec**: `ux-consistency`

## ADDED Requirements

### Requirement: Form State Reset Behavior Consistency

**Description:** All forms in the application MUST provide consistent state reset behavior across different exit paths (successful submission, cancellation, and error scenarios). Users MUST experience predictable form state management where successful submission leads to clean forms on subsequent openings, cancel operations clear all entered data, and failed submissions preserve data for correction.

**Rationale:** Inconsistent form state behavior creates poor user experience and erodes user trust in the application. When some forms clear state properly while others don't, users develop incorrect mental models and make mistakes. Specifically:
1. **Predictability**: Users expect forms to be "fresh" when opened after completing a previous action
2. **Error Prevention**: Residual state can cause users to accidentally submit duplicate or incorrect data
3. **Cognitive Load**: Users shouldn't need to remember to manually clear fields between submissions
4. **Consistency**: All forms should behave the same way to reduce learning curve

**Acceptance Criteria:**
- All forms reset to clean state after successful submission
- All forms reset to clean state after cancel action
- All forms preserve state after failed submission (for user correction)
- State reset includes both visible form fields and hidden state (file selections, temporary flags)
- Form reset behavior is consistent across create, edit, and other form types
- Users see empty/default fields when reopening a form after successful submission

#### Scenario: Invoice form provides consistent state reset experience

**Given:**
- User is creating invoices in the case management system
- Invoice form follows the standard state reset pattern

**When:**
- User completes the invoice creation workflow:
  1. Opens form (clean state)
  2. Uploads file and fills fields
  3. Submits successfully
  4. Form closes
  5. Opens form again

**Then:**
- Form reopens in clean state matching the initial open (step 1)
- No residual file selections from previous submission (step 2)
- No residual field values from previous submission (step 2)
- User can immediately start entering new invoice data
- Behavior matches other forms in the application (site forms, organization forms, etc.)

**Validation:**
- Visual inspection: form appears empty/default on reopen
- State inspection: all form state variables are at initial values
- File input: no file selected indicator shown
- Consistency check: invoice form behavior matches other entity creation forms

#### Scenario: Cancel operation clears form state consistently

**Given:**
- User opens a form (invoice, site, organization, etc.)
- User enters some data but decides not to proceed

**When:**
- User clicks "Cancel" button

**Then:**
- Form closes immediately
- All entered data is discarded:
  - Text fields cleared
  - File selections removed
  - Dropdowns reset to defaults
  - Validation errors cleared
- No confirmation dialog needed (data wasn't submitted)
- Reopening the form shows clean state

**Validation:**
- Cancel behavior is identical across all form types
- No data leakage from canceled forms
- Clean state on form reopen after cancel

#### Scenario: Failed submission preserves data for correction

**Given:**
- User fills out a form with valid file attachments and field values
- API validation fails (e.g., duplicate invoice number, invalid date range)

**When:**
- Form submission fails with error message
- Form remains open to allow corrections

**Then:**
- All user-entered data is preserved:
  - File selections remain
  - Text field values remain
  - Dropdown selections remain
- Error messages are displayed clearly
- User can fix errors and resubmit
- User does NOT need to re-upload files or re-enter data
- Behavior is consistent across all form types

**Validation:**
- Failed submission does not trigger state reset
- User can immediately retry after fixing validation errors
- No data loss on submission failure
- Consistent error preservation across all forms

#### Scenario: Form state isolation between form instances

**Given:**
- User is creating multiple records of the same type sequentially
- Each form instance should be independent

**When:**
- User creates Record A → Success → Form closes
- User creates Record B → Form opens
- User fills Record B form
- User creates Record B → Success → Form closes
- User creates Record C → Form opens

**Then:**
- Record B form does NOT contain data from Record A
- Record C form does NOT contain data from Record B
- Each form instance starts with clean state
- No state leakage between form instances
- User can create multiple records without interference

**Validation:**
- Each created record has the correct data (no cross-contamination)
- Form state is properly isolated between instances
- No memory leaks from unreset state

#### Scenario: Form reopen after navigation maintains clean state

**Given:**
- User submits a form successfully
- User navigates to a different page
- User returns to the original page

**When:**
- User clicks to open the form again

**Then:**
- Form opens in clean state
- No residual data from the pre-navigation submission
- Navigation does not affect form state reset behavior
- Behavior is consistent with same-page form reopening

**Validation:**
- Form state survives navigation without retention issues
- Clean state after browser back/forward
- Consistent behavior across different navigation patterns

---

## Notes

This requirement establishes consistency in form state management UX across the application. It complements the existing UX consistency requirements for:
- Address input consistency across forms
- Required field indicator consistency

By ensuring all forms follow the same state reset patterns, we create a predictable and professional user experience that reduces errors and improves user confidence.

The invoice form bug fix serves as the implementation of this requirement and sets the pattern for other forms to follow.
