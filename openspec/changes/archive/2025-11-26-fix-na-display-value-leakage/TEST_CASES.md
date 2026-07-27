# Manual Test Cases: Fix "N/A" Display Value Leakage

**Feature**: fix-na-display-value-leakage
**Test Date**: _[To be filled]_
**Tester**: _[To be filled]_
**Environment**: Local Development

---

## Test Environment Setup

**Before Testing**:
- [ ] Clear browser cache
- [ ] Open browser DevTools (F12)
- [ ] Enable Network tab in DevTools
- [ ] Prepare test data:
  - [ ] Organization with empty description
  - [ ] Organization with populated description
  - [ ] Sites with empty emailId
  - [ ] Sites with populated emailId
  - [ ] Users with empty phoneNumber
  - [ ] Users with populated phoneNumber

---

## Test Suite 1: Organization Management

### TC-ORG-001: Organization with Empty Description - Display View

**Priority**: P1 (High)
**Preconditions**: Organization exists in database with `description: ""` or `description: null`

**Test Steps**:
1. Navigate to organization details page (`/organization/{orgId}`)
2. Locate the description section in the overview tab
3. Inspect the DOM using browser DevTools

**Expected Results**:
- [ ] Description row (icon + text) is NOT rendered in the DOM
- [ ] No "N/A" text appears anywhere on the page
- [ ] Other fields (name, email, phone, segments) display correctly
- [ ] Page layout looks clean without empty description row

**Actual Results**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

### TC-ORG-002: Organization Edit - Empty Description (No Changes)

**Priority**: P0 (Critical)
**Preconditions**: Organization with empty description

**Test Steps**:
1. Navigate to organization details page
2. Click "Edit Organization" button
3. Verify description textarea content
4. Click "Save Changes" without modifying any fields
5. Open browser DevTools → Network tab
6. Inspect the PUT request to `/api/v1/organizations/{id}`
7. Check request payload body

**Expected Results**:
- [ ] Description textarea is empty (shows placeholder: "Enter organization description")
- [ ] No "N/A" text appears in textarea
- [ ] API payload contains: `"description": ""`
- [ ] API payload does NOT contain: `"description": "N/A"`
- [ ] Save operation succeeds without errors
- [ ] After save, description row is still hidden in display view

**Actual Results**: _[To be filled during testing]_

**API Payload Screenshot**: _[Attach if failure]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

### TC-ORG-003: Organization Edit - Add Description

**Priority**: P1 (High)
**Preconditions**: Organization with empty description

**Test Steps**:
1. Click "Edit Organization" button
2. Enter "Legal services for corporate clients" in description textarea
3. Click "Save Changes"
4. Inspect Network tab → PUT request payload
5. Verify display view after page refreshes

**Expected Results**:
- [ ] API payload contains: `"description": "Legal services for corporate clients"`
- [ ] Save operation succeeds (status 200/204)
- [ ] After save, description row IS visible in display view
- [ ] Description displays correct text: "Legal services for corporate clients"
- [ ] Description icon appears next to text

**Actual Results**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

### TC-ORG-004: Organization Edit - Clear Existing Description

**Priority**: P1 (High)
**Preconditions**: Organization with populated description

**Test Steps**:
1. Click "Edit Organization" button
2. Verify description textarea is pre-filled
3. Clear all text from description textarea (empty it)
4. Click "Save Changes"
5. Inspect Network tab → PUT request payload
6. Verify display view after save

**Expected Results**:
- [ ] Description textarea was pre-filled with existing value (not "N/A")
- [ ] API payload contains: `"description": ""`
- [ ] Save operation succeeds
- [ ] After save, description row is hidden (not rendered in DOM)
- [ ] No "N/A" appears anywhere

**Actual Results**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

### TC-ORG-005: Organization Edit - Required Field Validation (Name)

**Priority**: P0 (Critical)
**Preconditions**: Any organization

**Test Steps**:
1. Click "Edit Organization" button
2. Clear organization name field completely
3. Click "Save Changes" button
4. Observe form behavior and validation messages

**Expected Results**:
- [ ] Save is prevented (no API call is made - verify in Network tab)
- [ ] Error message appears: "Organization name is required"
- [ ] Name input field has red border (`border-red-500`)
- [ ] Error message is displayed in red text below name field
- [ ] Form remains in edit mode (doesn't close)

**Actual Results**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

### TC-ORG-006: Organization Edit - Required Field Validation (Email)

**Priority**: P0 (Critical)
**Preconditions**: Any organization

**Test Steps**:
1. Click "Edit Organization" button
2. Clear organization email field completely
3. Click "Save Changes" button
4. Observe form behavior and validation messages

**Expected Results**:
- [ ] Save is prevented (no API call is made - verify in Network tab)
- [ ] Error message appears: "Organization email is required"
- [ ] Email input field has red border (`border-red-500`)
- [ ] Error message is displayed in red text below email field
- [ ] Form remains in edit mode (doesn't close)

**Actual Results**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

## Test Suite 2: Site Management

### TC-SITE-001: Sites Grid View - Empty Email Field

**Priority**: P1 (High)
**Preconditions**: Site exists with `emailId: ""` but `phoneNumber: "9876543210"`

**Test Steps**:
1. Navigate to organization details page
2. Click "Sites" tab
3. Ensure view mode is "Grid" (card view icon selected)
4. Locate the site card for the test site
5. Inspect the card content

**Expected Results**:
- [ ] Email icon (MailOutlineIcon) is NOT rendered
- [ ] Email text field is NOT rendered
- [ ] Phone icon IS visible
- [ ] Phone number IS visible: "9876543210"
- [ ] No "N/A" text appears anywhere on the card
- [ ] Other fields (site name, address) display correctly
- [ ] Card layout looks clean and properly aligned

**Actual Results**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

### TC-SITE-002: Sites Grid View - Both Fields Populated

**Priority**: P2 (Medium)
**Preconditions**: Site with `emailId: "site@example.com"` and `phoneNumber: "9876543210"`

**Test Steps**:
1. Navigate to Sites tab
2. Ensure Grid view mode
3. Locate the site card with both fields populated
4. Verify all field displays

**Expected Results**:
- [ ] Email icon IS visible
- [ ] Email text IS visible: "site@example.com"
- [ ] Phone icon IS visible
- [ ] Phone number IS visible: "9876543210"
- [ ] Both fields display correctly with their respective icons

**Actual Results**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

### TC-SITE-003: Sites Table View - Empty Email Field

**Priority**: P1 (High)
**Preconditions**: Site with `emailId: ""`

**Test Steps**:
1. Navigate to Sites tab
2. Switch view mode to "Table" (table icon)
3. Locate the site row in the table
4. Observe the email column cell

**Expected Results**:
- [ ] Email column cell exists (table structure maintained)
- [ ] Email cell is empty (contains no text)
- [ ] No "N/A" text appears in email cell
- [ ] Phone number column displays value correctly
- [ ] Table alignment is maintained

**Actual Results**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

### TC-SITE-004: Sites Table View - Both Fields Populated

**Priority**: P2 (Medium)
**Preconditions**: Site with both email and phone populated

**Test Steps**:
1. View sites in table mode
2. Locate site row with populated fields
3. Verify column displays

**Expected Results**:
- [ ] Email column cell displays email address
- [ ] Phone column cell displays phone number
- [ ] Both values are properly aligned in their columns
- [ ] Text is readable and not truncated

**Actual Results**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

### TC-SITE-005: Site Edit - Description Required Validation

**Priority**: P0 (Critical)
**Preconditions**: Any site

**Test Steps**:
1. Navigate to site edit page (`/organization/{orgId}/sites/{siteId}/edit`)
2. Clear the description textarea completely
3. Click "Update" button
4. Observe validation behavior

**Expected Results**:
- [ ] Save is prevented (no API call - verify in Network tab)
- [ ] Error message appears below textarea: "Description is required."
- [ ] Description textarea has red border (`border-red-500`)
- [ ] Error message is displayed in red text (`text-red-500`)
- [ ] Form remains on edit page

**Actual Results**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

### TC-SITE-006: Site Edit - Landmark Required Validation

**Priority**: P0 (Critical)
**Preconditions**: Any site

**Test Steps**:
1. Navigate to site edit page
2. Clear the landmark input field completely
3. Click "Update" button
4. Observe validation behavior

**Expected Results**:
- [ ] Save is prevented (no API call - verify in Network tab)
- [ ] Error message appears below input: "Landmark is required."
- [ ] Landmark input field has red border (`border-red-500`)
- [ ] Error message is displayed in red text (`text-red-500`)
- [ ] Form remains on edit page

**Actual Results**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

## Test Suite 3: User Management

### TC-USER-001: Users Grid View - Empty Phone Number

**Priority**: P1 (High)
**Preconditions**: User with `phoneNumber: ""` or `phoneNumber: null`

**Test Steps**:
1. Navigate to organization details page
2. Click "Users" tab
3. Ensure view mode is "Grid" (card view)
4. Locate user card without phone number
5. Inspect card content

**Expected Results**:
- [ ] Phone icon is NOT rendered
- [ ] Phone number field is NOT rendered
- [ ] Email icon IS visible
- [ ] Email text IS visible
- [ ] Roles badge IS visible
- [ ] No "N/A" text appears on card
- [ ] Card layout adjusts properly without phone field

**Actual Results**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

### TC-USER-002: Users Grid View - Phone Number Populated

**Priority**: P2 (Medium)
**Preconditions**: User with `phoneNumber: "9123456789"`

**Test Steps**:
1. View users in grid mode
2. Locate user card with phone number
3. Verify all field displays

**Expected Results**:
- [ ] Phone icon IS visible
- [ ] Phone number IS visible: "9123456789"
- [ ] Email icon IS visible
- [ ] Email text IS visible
- [ ] Roles badge IS visible
- [ ] All fields display correctly with proper spacing

**Actual Results**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

### TC-USER-003: Site Users View - Empty Phone Number

**Priority**: P1 (High)
**Preconditions**: Navigate to site details page with users who have no phone number

**Test Steps**:
1. Navigate to `/organization/{orgId}/sites/{siteId}`
2. Scroll to "Site Users" section (or "Users" tab if exists)
3. Locate user card without phone number
4. Inspect card content

**Expected Results**:
- [ ] Phone icon is NOT rendered
- [ ] Phone number field is NOT rendered
- [ ] Email IS visible
- [ ] Roles badge IS visible
- [ ] No "N/A" text appears

**Actual Results**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

### TC-USER-004: Site Users View - Phone Number Populated

**Priority**: P2 (Medium)
**Preconditions**: Site users with phone numbers

**Test Steps**:
1. View site details page
2. Scroll to Site Users section
3. Locate user card with phone number
4. Verify field displays

**Expected Results**:
- [ ] Phone icon IS visible
- [ ] Phone number IS visible
- [ ] Email IS visible
- [ ] Roles badge IS visible

**Actual Results**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

## Test Suite 4: View Mode Toggle Consistency

### TC-VIEW-001: Sites - Grid to Table Toggle

**Priority**: P1 (High)
**Preconditions**: Mix of sites with empty and populated emailId

**Test Steps**:
1. Navigate to Sites tab
2. View sites in Grid mode
3. Note which sites show email fields
4. Switch to Table view mode
5. Compare email visibility for same sites
6. Switch back to Grid view
7. Verify data consistency

**Expected Results**:
- [ ] Grid view: Sites with empty email hide email row (icon + text)
- [ ] Table view: Sites with empty email show empty cell (no "N/A")
- [ ] Same sites handled consistently between views
- [ ] Switching between views maintains data state
- [ ] No data loss when toggling views

**Actual Results**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

### TC-VIEW-002: Users - Grid to Table Toggle

**Priority**: P2 (Medium)
**Preconditions**: Mix of users with empty and populated phoneNumber

**Test Steps**:
1. Navigate to Users tab
2. View users in Grid mode
3. Note which users show phone fields
4. Switch to Table view mode (if available)
5. Compare phone visibility for same users
6. Verify data consistency

**Expected Results**:
- [ ] Grid view: Users with empty phone hide phone row
- [ ] Table view (if exists): Consistent handling of empty phone
- [ ] Data remains consistent across view modes
- [ ] No "N/A" appears in either view

**Actual Results**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

## Test Suite 5: Data Integrity & API Payloads

### TC-API-001: Organization Update Payload Inspection

**Priority**: P0 (Critical)
**Preconditions**: Organization with empty description

**Test Steps**:
1. Open Browser DevTools → Network tab
2. Navigate to organization page
3. Click "Edit Organization"
4. Leave description empty
5. Click "Save Changes"
6. In Network tab, find PUT request to `/api/v1/organizations/{id}`
7. Click on request → Payload tab
8. Inspect request payload body JSON

**Expected Results**:
- [ ] Request method is PUT
- [ ] Request URL is `/api/v1/organizations/{id}`
- [ ] Payload contains: `"description": ""`
- [ ] Payload does NOT contain: `"description": "N/A"`
- [ ] Other fields (name, emailId) have correct values (not "N/A")
- [ ] Response status is 200 or 204

**Actual Results**: _[To be filled during testing]_

**Payload JSON**: _[Copy/paste actual payload]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

### TC-API-002: Verify No "N/A" in Any API Response

**Priority**: P0 (Critical)
**Preconditions**: Fresh browser session

**Test Steps**:
1. Clear browser cache and cookies
2. Navigate to organization page
3. Open DevTools → Network tab
4. Clear network log
5. Refresh page
6. Observe all GET requests:
   - GET `/api/v1/organizations/{id}`
   - GET `/api/v1/organizations/{id}/sites`
   - GET `/api/v1/organizations/{id}/users`
7. Inspect response bodies for each request

**Expected Results**:
- [ ] GET organization response: Empty fields contain `""` or `null`, NOT `"N/A"`
- [ ] GET sites response: Empty optional fields contain `""` or `null`, NOT `"N/A"`
- [ ] GET users response: Empty optional fields contain `""` or `null`, NOT `"N/A"`
- [ ] Frontend correctly transforms empty values (doesn't add "N/A")

**Actual Results**: _[To be filled during testing]_

**Response Examples**: _[Copy/paste sample responses if failures found]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

## Test Suite 6: Regression Testing

### TC-REG-001: Organization CRUD - All Fields Populated

**Priority**: P1 (High)
**Preconditions**: Organization with all fields filled (description, segments, etc.)

**Test Steps**:
1. View organization details page
2. Verify all fields display correctly
3. Click "Edit Organization"
4. Modify organization name to "Updated Org Name"
5. Modify description to "Updated description text"
6. Click "Save Changes"
7. Verify changes in display view

**Expected Results**:
- [ ] All fields display correctly in view mode
- [ ] Edit form loads with all values pre-filled correctly
- [ ] Save operation succeeds
- [ ] Updated values display correctly after save
- [ ] No "N/A" appears at any point
- [ ] Description remains visible (not hidden)

**Actual Results**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

### TC-REG-002: Organization Delete Functionality

**Priority**: P2 (Medium)
**Preconditions**: Test organization (safe to delete)

**Test Steps**:
1. Navigate to organization page
2. Click three-dot menu (⋮) or delete button
3. Click "Delete Organization"
4. Observe confirmation modal
5. Confirm deletion
6. Verify result

**Expected Results**:
- [ ] Delete confirmation modal appears
- [ ] Modal shows organization name
- [ ] Clicking confirm triggers delete
- [ ] Delete succeeds or shows appropriate error message
- [ ] No console errors related to "N/A" handling
- [ ] No side effects from changes made to API transformation

**Actual Results**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

### TC-REG-003: Tab Navigation

**Priority**: P2 (Medium)
**Preconditions**: Organization with users and sites

**Test Steps**:
1. Navigate to organization details page
2. Click "Overview" tab
3. Click "Users" tab
4. Click "Sites" tab
5. Return to "Overview" tab
6. Open browser console
7. Check for errors

**Expected Results**:
- [ ] All tabs navigate successfully
- [ ] Data displays correctly in each tab
- [ ] No console errors appear
- [ ] No visual glitches or layout issues
- [ ] Tab transitions are smooth
- [ ] Data loads correctly in each tab

**Actual Results**: _[To be filled during testing]_

**Console Errors**: _[Copy/paste any errors]_

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Blocked
**Notes**: _[Any observations]_

---

## Test Summary

### Execution Summary

**Total Test Cases**: 23
**Executed**: ___
**Passed**: ___
**Failed**: ___
**Blocked**: ___

### Test Case Distribution

| Suite | Test Cases | Passed | Failed | Blocked |
|-------|-----------|--------|--------|---------|
| Organization Management | 6 | ___ | ___ | ___ |
| Site Management | 6 | ___ | ___ | ___ |
| User Management | 4 | ___ | ___ | ___ |
| View Mode Toggle | 2 | ___ | ___ | ___ |
| API/Data Integrity | 2 | ___ | ___ | ___ |
| Regression Testing | 3 | ___ | ___ | ___ |

### Priority Breakdown

| Priority | Test Cases | Passed | Failed |
|----------|-----------|--------|--------|
| P0 (Critical) | 6 | ___ | ___ |
| P1 (High) | 11 | ___ | ___ |
| P2 (Medium) | 6 | ___ | ___ |

---

## Defects Found

### Defect Log

| ID | Severity | Test Case | Description | Status |
|----|----------|-----------|-------------|--------|
| BUG-001 | ___ | ___ | ___ | ___ |
| BUG-002 | ___ | ___ | ___ | ___ |

---

## Sign-off

**Tester Name**: _______________
**Date**: _______________
**Signature**: _______________

**Recommendations**: _[Any recommendations for further testing or improvements]_

**Overall Assessment**: ⬜ Ready for Production / ⬜ Needs Fixes / ⬜ Major Issues Found
