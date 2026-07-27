# user-feedback Specification

## Purpose
TBD - created by archiving change add-success-toasts-for-update-operations. Update Purpose after archive.
## Requirements
### Requirement: Update Operations Must Show Success Feedback

**Description:** When a user successfully updates an entity (organization, site, user, case, etc.), the application MUST display a success toast notification to confirm the operation completed successfully. Success toasts provide immediate, non-intrusive feedback that reassures users their changes were saved.

**Rationale:** Users need clear confirmation that their update operations succeeded. Without visual feedback, users are left uncertain whether their changes were saved, leading to confusion, repeated save attempts, and reduced confidence in the application. Success toasts are the standard pattern already used for delete operations in this application, and extending it to updates ensures consistency.

**Acceptance Criteria:**
- Success toast appears immediately after successful update API call
- Toast message clearly indicates what was updated (e.g., "Organization updated successfully")
- Toast auto-dismisses after 3 seconds (consistent with existing toast behavior)
- Toast does NOT appear if validation fails or API returns an error
- Toast uses the existing `useToast` hook and `ToastContext`
- Toast wording follows existing pattern: "{Entity} updated successfully"

#### Scenario: User updates organization successfully

**Given:**
- User is logged in as Organization Admin
- Organization page is displayed in view mode
- User clicks "Edit Organization" button
- Edit form is displayed with current organization data

**When:**
- User modifies organization name from "Legal Firm" to "Legal Services Firm"
- User modifies description from "A law firm" to "A comprehensive legal services firm"
- User clicks "Save" button
- API PUT request to `/api/v1/organizations/{id}` succeeds (HTTP 200)

**Then:**
- Success toast appears with message: "Organization updated successfully"
- Toast is visible at bottom-left of screen (existing toast position)
- Toast has green background (success severity)
- Toast auto-dismisses after 3 seconds
- Edit mode exits and view mode displays updated data
- No error messages are shown

**Validation:**
- Visual inspection: Toast appears with correct message and styling
- Console: No errors logged
- Network tab: PUT request succeeded with HTTP 200
- UI state: Edit mode closed, updated values visible in view mode

#### Scenario: User updates site successfully with navigation

**Given:**
- User is on site edit page (`/organization/{orgId}/sites/{siteId}/edit`)
- Site edit form is populated with current site data

**When:**
- User modifies site name from "Downtown Office" to "Downtown Legal Office"
- User modifies site phone number
- User clicks "Save" button
- API PUT request to `/api/v1/organizations/{orgId}/sites/{siteId}` succeeds (HTTP 200)

**Then:**
- Success toast appears with message: "Site updated successfully"
- Toast is visible during navigation transition
- User is redirected to organization page sites tab (`/organization/{orgId}#sites`)
- Toast remains visible for full 3-second duration
- Updated site appears in sites list with new name

**Validation:**
- Visual inspection: Toast appears before navigation and remains visible
- Network tab: PUT request succeeded
- Timing check: Toast visible for at least 2 seconds despite navigation
- Sites list: Updated site shows new values

#### Scenario: User updates user profile successfully

**Given:**
- User is on user edit page (`/organization/{orgId}/users/{userId}/edit`)
- User edit form is populated with current user data

**When:**
- User modifies user email from "john@example.com" to "john.doe@example.com"
- User modifies user phone number
- User clicks "Save" button
- API PUT request to `/api/v1/organizations/{orgId}/users/{userId}` succeeds (HTTP 200)

**Then:**
- Success toast appears with message: "User updated successfully"
- Toast is visible during navigation transition
- User is redirected to organization page users tab (`/organization/{orgId}#users`)
- Toast remains visible for full 3-second duration
- Updated user appears in users list with new email

**Validation:**
- Visual inspection: Toast appears before navigation
- Network tab: PUT request succeeded
- Users list: Updated user shows new values

#### Scenario: Update fails validation - no success toast shown

**Given:**
- User is on organization edit page
- Edit form is displayed

**When:**
- User clears the organization name field (required field)
- User clicks "Save" button
- Frontend validation fails before API call

**Then:**
- NO success toast appears
- Validation error message appears inline: "Organization name is required"
- Form remains in edit mode
- No API call is made
- User can correct the error and try again

**Validation:**
- Visual inspection: No green success toast visible
- Visual inspection: Red validation error visible under name field
- Network tab: No PUT request made (validation prevented it)
- Form state: Still in edit mode

#### Scenario: Update fails due to API error - no success toast shown

**Given:**
- User is on organization edit page
- User has made valid changes

**When:**
- User clicks "Save" button
- Frontend validation passes
- API PUT request to `/api/v1/organizations/{id}` is made
- API returns HTTP 400 or 500 error

**Then:**
- NO success toast appears
- Error message displays: "Failed to update organization. Please try again."
- Form remains in edit mode with user's changes intact
- User can modify and retry

**Validation:**
- Visual inspection: No green success toast visible
- Visual inspection: Error message visible
- Network tab: PUT request failed with 4xx or 5xx status
- Form state: Still in edit mode, data preserved

---

### Requirement: Success Feedback Must Be Consistent Across All Update Operations

**Description:** All entity update operations (organization, site, user, case, task, hearing, etc.) MUST follow the same success feedback pattern. This ensures users develop consistent mental models and expectations across different parts of the application.

**Rationale:** Consistency in UX reduces cognitive load and builds user confidence. If some update operations show success feedback while others don't, users become confused about whether their actions succeeded. Consistent feedback establishes trust and makes the application feel polished and reliable.

**Acceptance Criteria:**
- All update operations use the same success toast mechanism (`useToast` hook)
- Toast messages follow consistent wording pattern: "{EntityType} updated successfully"
- Toast styling, positioning, and duration are identical across all operations
- Success feedback matches existing delete operation pattern
- No update operation silently succeeds without user feedback

#### Scenario: Verify consistency between update and delete feedback

**Given:**
- User has performed various CRUD operations
- Delete operations already show success toasts

**When:**
- User deletes a site
- Then user updates a different site
- Then user deletes a user
- Then user updates a different user

**Then:**
- Delete site toast: "Site deleted successfully" (existing behavior)
- Update site toast: "Site updated successfully" (new behavior)
- Delete user toast: "User deleted successfully" (existing behavior)
- Update user toast: "User updated successfully" (new behavior)
- All toasts have identical styling (green background, white text, same position)
- All toasts have identical duration (3 seconds)
- All toasts use identical animation and positioning

**Validation:**
- Visual inspection: All toasts look and behave the same
- Wording pattern: "{Entity} {action}ed successfully"
- Code inspection: All use `showSuccess()` from `useToast` hook
- Timing: All auto-dismiss after 3 seconds

#### Scenario: Success toast persists across component updates

**Given:**
- User is updating an organization
- Update involves both navigation and state changes

**When:**
- User saves organization update
- Success toast is triggered
- React component re-renders due to state update
- Navigation occurs (for site/user updates)

**Then:**
- Toast remains visible throughout all React updates
- Toast is not dismissed by component re-renders
- Toast completes full 3-second display duration
- Only one toast appears (no duplicates)

**Validation:**
- Visual inspection: Toast visible for full duration despite re-renders
- Code inspection: Toast state managed in `ToastContext` (outside component)
- No duplicate toasts appear
- Console: No warnings about unmounted components

---

### Requirement: Success Feedback Must Not Appear on Failures

**Description:** Success toast notifications MUST ONLY appear when update operations genuinely succeed. They MUST NOT appear when validation fails, API calls fail, or any error condition occurs. This ensures success feedback is trustworthy and meaningful.

**Rationale:** Showing success feedback when an operation actually failed destroys user trust and leads to data confusion. Users rely on success messages to know their changes were saved. False positive feedback is worse than no feedback at all.

**Acceptance Criteria:**
- Success toast appears ONLY after successful API response (HTTP 2xx)
- Success toast does NOT appear if:
  - Frontend validation fails
  - API returns 4xx error (client error)
  - API returns 5xx error (server error)
  - Network request fails
  - Timeout occurs
- Error feedback takes precedence over success feedback
- Try-catch blocks ensure success path is only executed on actual success

#### Scenario: Frontend validation prevents API call - no success toast

**Given:**
- User is editing organization
- Form has frontend validation rules

**When:**
- User enters invalid email format: "notanemail"
- User clicks "Save"
- Validation hook detects invalid email
- `validate(formData)` returns false
- Function returns early before API call

**Then:**
- NO success toast appears
- Validation error shows: "Invalid email format"
- Form remains in edit mode
- No API call is made
- User sees only validation error, no success message

**Validation:**
- Code inspection: `return` statement before `showSuccess()` call
- Network tab: No PUT request made
- Visual: Only error message visible, no green toast

#### Scenario: API returns 400 validation error - no success toast

**Given:**
- User is editing organization
- Frontend validation passes
- Backend has additional validation rules

**When:**
- User enters organization name that already exists
- User clicks "Save"
- Frontend validation passes
- API call is made
- API returns HTTP 400 with validation error: "Organization name already exists"
- Code enters catch block

**Then:**
- NO success toast appears
- Error handling displays: "Organization name already exists"
- Form remains in edit mode with user's input
- Success code path is not executed

**Validation:**
- Code inspection: `showSuccess()` is in try block, not reached
- Code inspection: catch block handles error
- Network tab: PUT request returned 400
- Visual: Only error message visible

#### Scenario: Network failure during update - no success toast

**Given:**
- User is editing site
- Network connection is unstable

**When:**
- User clicks "Save"
- API call is initiated
- Network request fails (timeout or connection error)
- Axios throws network error
- Code enters catch block

**Then:**
- NO success toast appears
- Error message displays: "Failed to update site. Please try again."
- Form remains in edit mode
- User can retry when network recovers

**Validation:**
- Code inspection: `showSuccess()` only in try block after `await updateSite()`
- Catch block handles network errors without calling `showSuccess()`
- Visual: Only error message visible, no success toast

---

