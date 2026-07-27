# Implementation Tasks

## 1. Add Validation Error State Management
- [x] 1.1 Add `validationErrors` state variable to store field-level errors as `{ [fieldName: string]: string }`
- [x] 1.2 Add helper function to clear validation errors when entering edit mode
- [x] 1.3 Add helper function to clear validation errors on successful save

## 2. Enhance API Error Handling in handleSaveEdit
- [x] 2.1 Wrap API call in try-catch to parse error response
- [x] 2.2 Check if error response has status 400 and contains `errors` object
- [x] 2.3 Extract field-specific errors from `response.data.errors` object
- [x] 2.4 Map API field names (e.g., "Segments") to UI state keys (e.g., "segments")
- [x] 2.5 Set validation errors state with extracted errors
- [x] 2.6 Preserve form state (don't navigate away or reset loading state inappropriately)
- [x] 2.7 For non-validation errors (non-400 or missing errors object), maintain current error page behavior

## 3. Update Edit Form UI to Display Validation Errors
- [x] 3.1 Add error message display above Segments field when `validationErrors.segments` exists
- [x] 3.2 Apply error styling (red border, error text color) to Segments field when validation error present
- [x] 3.3 Add error message displays for other editable fields (name, email, phone, description) if they have validation errors
- [x] 3.4 Ensure error messages use consistent styling (red text, appropriate spacing)
- [x] 3.5 Add ARIA attributes for accessibility (aria-invalid, aria-describedby)

## 4. Test Error Scenarios
- [ ] 4.1 Manually test empty segments validation error displays correctly
- [ ] 4.2 Verify form state is preserved when validation error occurs
- [ ] 4.3 Test multiple simultaneous field validation errors
- [ ] 4.4 Verify validation errors clear when user fixes issues and successfully saves
- [ ] 4.5 Test that non-validation errors (500, network failure) still show error page
- [ ] 4.6 Verify error page "Retry" button still works for critical errors

## 5. Code Quality
- [x] 5.1 Add TypeScript interface for validation error structure
- [x] 5.2 Add code comments explaining validation error parsing logic
- [x] 5.3 Ensure no console errors or warnings
- [x] 5.4 Verify consistent error message formatting with existing UI patterns

## 6. Documentation
- [x] 6.1 Update PRD (`docs/Lawsome_PRD.md`) with improved validation error handling behavior if user-impacting
