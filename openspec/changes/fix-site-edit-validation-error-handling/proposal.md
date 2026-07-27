# Proposal: fix-site-edit-validation-error-handling

## Summary
Fix the bug where editing site details redirects users to an error page when backend validation fails, instead of displaying validation errors inline in the form.

## Problem Statement
When editing site details and providing invalid data (e.g., invalid phone number), the user is redirected to an error page instead of seeing validation error messages inline in the form. This breaks the expected user experience where validation errors should be displayed within the form, allowing users to correct their input and resubmit.

### Root Cause Analysis
The `updateSite` API function in `src/app/organization/services/api.ts` does not include the `validateStatus` configuration option. By default, Axios throws an error for any non-2xx HTTP response status. When the backend returns a 400 validation error:

1. Axios throws an unhandled exception during the axios.put() call
2. While the edit page has a try-catch block, the error may not be properly caught if axios rejects the promise before returning
3. This causes Next.js to treat it as an unhandled error and redirect to the error boundary/page

Other similar API functions in the same file (e.g., `updateCase`, `addInvoice`) properly handle 400 responses by including `validateStatus: (status) => status === 200 || status === 400`.

## Proposed Solution
Add `validateStatus` configuration to the `updateSite` function to properly handle 400 validation error responses from the backend. This ensures:
1. Axios does not throw on 400 responses
2. The error response is accessible for extraction via `extractApiErrors` and `extractFieldErrors`
3. Validation errors are displayed inline in the form as expected

## Related Issues
- GitHub Issue: https://github.com/eTrillium/Lawsome.Web.UI/issues/97

## Impact Assessment
- **User Impact**: High - Users currently cannot edit site details when validation errors occur
- **Risk Level**: Low - Change is isolated to one API function and follows existing patterns
- **Testing Required**: Manual testing of site edit with valid and invalid inputs

## Dependencies
None - this is a bug fix using existing patterns already established in the codebase.
