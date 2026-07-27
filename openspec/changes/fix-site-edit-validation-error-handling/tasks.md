# Tasks: fix-site-edit-validation-error-handling

## Implementation Tasks

### 1. Update `updateSite` API function
- **File**: `src/app/organization/services/api.ts`
- **Action**: Add `validateStatus` configuration to handle 400 responses
- **Pattern**: Follow existing pattern from `updateCase`, `addInvoice` functions
- **Verification**: Function signature and behavior matches other update operations
- **Status**: DONE

### 2. Add error status handling in `updateSite`
- **File**: `src/app/organization/services/api.ts`
- **Action**: Check response status and throw appropriate error for 400 responses
- **Pattern**: Extract error message from backend response format `{"data":null,"errors":["message"],"meta":{}}`
- **Verification**: Error messages are properly extracted and thrown
- **Status**: DONE

### 3. Fix inline site edit error handling
- **File**: `src/app/organization/[id]/sites/[siteId]/page.tsx`
- **Action**: Add `editError` state and inline error display for inline site editing
- **Changes**:
  - Added `editError` state variable
  - Updated `handleSaveChanges` to extract error message and set `editError`
  - Updated `handleEditClick` and `handleCancelEdit` to clear `editError`
  - Added inline error alert box in the edit form Grid
- **Status**: DONE

### 4. Manual Testing - Valid Input
- **Action**: Test site edit with valid input data
- **Expected**: Site updates successfully, success toast appears, user remains on page in view mode
- **Verification**: No regression in happy path

### 5. Manual Testing - Invalid Phone Number
- **Action**: Test site edit with invalid phone number (as per bug report)
- **Expected**: Validation error displays inline in form, user remains on edit page
- **Verification**: Bug is fixed

### 6. Manual Testing - Multiple Validation Errors
- **Action**: Test site edit with multiple invalid fields
- **Expected**: All validation errors display inline, form preserves user input
- **Verification**: All errors are shown, user can correct and resubmit

## Validation Checklist
- [x] `updateSite` has `validateStatus` handling 200 and 400 responses
- [x] 400 response extracts and throws error with proper message
- [x] Inline site edit (`handleSaveChanges`) catches errors and displays inline
- [x] Dedicated edit page (`/edit/page.tsx`) properly catches and displays errors
- [x] Success path still works (200 response)
- [ ] General API errors display in error alert box (requires manual testing)
- [ ] User can correct errors and successfully resubmit (requires manual testing)
