# Spec Delta: user-feedback

## MODIFIED Requirements

### Requirement: Update Operations Must Show Success Feedback

**Description:** When update operations encounter backend validation errors (HTTP 400), the application MUST display error messages inline in the form without redirecting to an error page. The user MUST remain on the edit page with their input preserved, allowing them to correct errors and resubmit. This ensures consistent error handling across all update operations.

#### Scenario: Site edit validation error displays inline in form

**Given:**
- User is logged in as Organization Admin
- User is on site edit page (`/organization/{orgId}/sites/{siteId}/edit`)
- Site edit form is populated with current site data

**When:**
- User modifies phone number to an invalid value (e.g., "abc123" or too short)
- User clicks "Update" button
- Frontend validation passes (phone field format is client-side validated)
- API PUT request to `/api/v1/organizations/{orgId}/sites/{siteId}` is made
- API returns HTTP 400 with validation error: `{"data":null,"errors":["Phone number is invalid"],"meta":{}}`

**Then:**
- NO success toast appears
- NO redirect to error page occurs
- User MUST remain on the site edit page
- Error message MUST display in the red error alert box at top of form
- Form MUST preserve all user-entered values
- User can correct the phone number and click "Update" again

**Validation:**
- Visual inspection: No page redirect, error displayed inline
- Network tab: PUT request returned 400
- Form state: All field values preserved, form still editable
- User can fix and resubmit successfully

#### Scenario: Site edit API returns multiple validation errors

**Given:**
- User is on site edit page
- User has modified multiple fields with invalid values

**When:**
- User clicks "Update" button
- API returns HTTP 400 with multiple validation errors: `{"data":null,"errors":["Phone number is invalid","Email format is incorrect"],"meta":{}}`

**Then:**
- All error messages MUST display in the error alert box
- Error messages MUST be shown as a bulleted list
- User MUST remain on edit page
- All form values MUST be preserved
- User can correct errors and resubmit

**Validation:**
- Visual inspection: Multiple errors listed
- Form still editable with original values
- Can resubmit after corrections

#### Scenario: Site edit field-specific validation errors display inline

**Given:**
- User is on site edit page
- Backend returns field-specific validation errors in ASP.NET format

**When:**
- User submits form
- API returns HTTP 400 with field errors: `{"errors":{"PhoneNumber":["Must be exactly 10 digits"]}}`

**Then:**
- Field-specific error MUST display below the phone number input field
- Error styling MUST be applied to the field (red border)
- General error alert may also appear
- User can clear error by modifying the field

**Validation:**
- Visual inspection: Error appears next to specific field
- Field has red border indicating error
- Typing in field clears the error message
