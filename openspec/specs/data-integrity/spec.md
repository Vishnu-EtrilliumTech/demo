# data-integrity Specification

## Purpose
TBD - created by archiving change fix-na-display-value-leakage. Update Purpose after archive.
## Requirements
### Requirement: API Response Transformation Must Preserve Data Integrity

**Description:** When transforming API responses to frontend models, the transformation layer MUST NOT apply UI display logic or insert placeholder values. Empty, null, or undefined values from the API MUST be transformed to semantically correct empty values (empty string `""`, empty array `[]`, etc.) without inserting display-only placeholders like "N/A".

**Rationale:** The data transformation layer is responsible for type conversion and structure mapping, not UI presentation. Inserting placeholder values at this layer causes data corruption when those values are later used in edit forms and sent back to the API. This violates the principle of data integrity and creates a leaky abstraction where display concerns pollute the data layer.

**Acceptance Criteria:**
- API transformation functions do NOT contain `|| 'N/A'` or similar display fallbacks for string fields
- Empty or null values from API are transformed to empty strings (`""`) for string fields
- Empty or null values from API are transformed to `0` for numeric fields
- Empty or null arrays from API are transformed to empty arrays (`[]`)
- Transformation logic focuses solely on type safety and structure mapping
- Display formatting is deferred to UI components

#### Scenario: Organization API response with empty description

**Given:**
- Backend API returns organization data: `{ "id": 75, "name": "Legal Firm", "description": "", "emailId": "contact@firm.com" }`
- Frontend calls `fetchOrganization("75")`

**When:**
- The `fetchOrganization` function transforms the API response

**Then:**
- The returned organization object contains:
  - `id: 75`
  - `name: "Legal Firm"`
  - `description: ""` (empty string, NOT "N/A")
  - `emailId: "contact@firm.com"`
- No placeholder values ("N/A") are inserted during transformation
- The organization object accurately represents the backend state

**Validation:**
- Inspect the returned object: `console.log(await fetchOrganization("75"))`
- Verify `description` field is empty string, not "N/A"
- TypeScript types allow empty strings for optional fields

#### Scenario: Organization API response with null description

**Given:**
- Backend API returns organization data: `{ "id": 75, "name": "Legal Firm", "description": null, "emailId": null }`
- Frontend calls `fetchOrganization("75")`

**When:**
- The `fetchOrganization` function transforms the API response

**Then:**
- The returned organization object contains:
  - `description: ""` (null transformed to empty string)
  - `emailId: ""` (null transformed to empty string)
- Null values are coerced to empty strings for type safety
- No "N/A" placeholders are inserted

**Validation:**
- Transformation handles null gracefully without inserting placeholders
- Resulting object has consistent string types (no nulls or "N/A")

---

### Requirement: Edit Forms Must Use Raw Data Values

**Description:** When initializing edit forms with data from the backend, form state MUST be populated with the raw, untransformed values from the data model. Forms MUST NOT pre-fill with UI display values like "N/A". Empty fields in forms should display as empty (showing placeholder text) rather than containing "N/A" as actual form content.

**Rationale:** Edit forms are bidirectional - they both display current values and capture user input. If forms are pre-filled with display-only values like "N/A", those values will be submitted back to the API when the user saves, causing data corruption. Forms must work with raw data values and let native HTML placeholder attributes provide user guidance for empty fields.

**Acceptance Criteria:**
- Form initialization uses raw data values from the model
- Empty string values result in empty form fields (not "N/A" text)
- Form field placeholders (HTML `placeholder` attribute) provide guidance for empty fields
- Form submission payloads contain only user input or empty strings, never display placeholders
- `|| ''` fallbacks in form initialization ensure empty strings, not "N/A"

#### Scenario: Edit organization with empty description field

**Given:**
- Organization object has `description: ""` (empty string, from Task 1 fix)
- User clicks "Edit Organization" button
- `handleEditClick` is called

**When:**
- Edit form state is initialized: `setEditFormData({ ..., description: organization.description || '' })`

**Then:**
- `editFormData.description` equals `""` (empty string)
- Description textarea element shows:
  - Empty content (no "N/A" text)
  - Placeholder text: "Enter organization description" (from HTML placeholder attribute)
- Form is ready for user input without pre-filled placeholder values

**Validation:**
- Inspect `editFormData` state: description should be `""`, not "N/A"
- Inspect textarea DOM element: value should be empty string
- Visual check: textarea shows placeholder text, not "N/A" as editable content

#### Scenario: Save organization without modifying empty description

**Given:**
- Edit form is open with empty description field
- `editFormData.description === ""`
- User clicks "Save" without typing in description field

**When:**
- `handleSaveEdit` constructs API payload: `{ description: editFormData.description }`
- PUT request is sent to `/api/v1/organizations/75`

**Then:**
- API request payload contains: `{ "description": "" }`
- Payload does NOT contain `"description": "N/A"`
- Backend receives and stores empty string (or null, depending on backend handling)
- No data corruption occurs

**Validation:**
- Inspect network request in browser DevTools
- Verify payload body contains `"description": ""`, not `"description": "N/A"`
- After save, re-fetch organization and verify description is still empty

---

### Requirement: Display Components Apply Formatting in JSX

**Description:** UI display formatting, including fallback values like "N/A", MUST be applied in JSX rendering logic only. Display components SHALL use one of two approved patterns: (A) Conditional Rendering to hide empty fields entirely, or (B) Inline Display Fallback to show "N/A" or "Not provided" text. Display fallbacks MUST be read-only and MUST NOT be stored in component state or passed back to the API.

**Rationale:** Display formatting is a presentation concern, not a data concern. By keeping fallback values in JSX expressions (`|| 'N/A'`), we ensure they are ephemeral and cannot leak into forms or API requests. This creates a clear boundary between data (always reflects backend truth) and presentation (applies user-friendly formatting).

**Acceptance Criteria:**
- Display fallbacks (`|| 'N/A'`) appear only in JSX `{}` expressions
- Display fallbacks never appear in:
  - State initialization
  - API transformation functions
  - Form state
  - API request payloads
- Two approved patterns:
  - **Pattern A (Conditional Rendering)**: `{field && <Component>{field}</Component>}` - hides entire UI element when empty
  - **Pattern B (Inline Fallback)**: `<Typography>{field || 'N/A'}</Typography>` - shows "N/A" in place of empty field
- Components using Pattern B are read-only displays (not editable forms)

#### Scenario: Display organization description using conditional rendering (Pattern A)

**Given:**
- Organization object has `description: ""` (empty string)
- User views organization detail page in read-only mode

**When:**
- Component renders description section using conditional rendering:
  ```jsx
  {organization.description && (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
      <DescriptionIcon color="action" sx={{ fontSize: 16, mr: 1 }} />
      <Typography>{organization.description}</Typography>
    </Box>
  )}
  ```

**Then:**
- The description row (icon + text) is NOT rendered in the DOM
- No empty space or "N/A" placeholder is shown
- Page looks clean without showing irrelevant empty fields
- User does not see misleading "N/A" for a field that was never filled

**Validation:**
- Inspect DOM: verify no DescriptionIcon or Typography element exists for description
- Visual check: no description row visible on page
- If description has value, row appears correctly

#### Scenario: Display user phone number using inline fallback (Pattern B)

**Given:**
- User object has `phoneNumber: ""` (empty string) or `phoneNumber: null`
- User management grid view displays user cards

**When:**
- Component renders phone number field with inline fallback:
  ```jsx
  <Typography variant="body2" color="textSecondary">
    {user.phoneNumber || 'N/A'}
  </Typography>
  ```

**Then:**
- Typography element displays text: "N/A"
- "N/A" is a transient display value, not stored anywhere
- User object still contains `phoneNumber: ""` unchanged
- If user edits this user, form will show empty phone field (not "N/A")

**Validation:**
- Inspect component state/props: `user.phoneNumber` should be `""`, not "N/A"
- Visual check: UI shows "N/A" text
- Edit form for this user: phone field should be empty, not pre-filled with "N/A"

#### Scenario: Verify display fallback does not leak into edit form

**Given:**
- Site object has `emailId: ""` (empty string)
- Site management page displays site in grid view: `{site.emailId || 'N/A'}`
- Displays "N/A" to user

**When:**
- User clicks "Edit" on the site
- Edit form is initialized with: `setEditFormData({ email: site.emailId || '' })`

**Then:**
- `editFormData.email` equals `""` (empty string), NOT "N/A"
- Email input field is empty (shows placeholder)
- Clicking Save without modification sends `{ "emailId": "" }` to API, NOT `{ "emailId": "N/A" }`

**Validation:**
- Verify site object is unchanged by display logic: `site.emailId === ""`
- Verify form state uses raw value: `editFormData.email === ""`
- Verify no "N/A" appears in form input or API payload

---

### Requirement: Site Form Required Field Indicator Consistency
All site forms (create, edit, and in-place edit) SHALL display consistent required field indicators (`*`) for fields marked as `[Required]` in the backend API.

#### Scenario: In-place edit form shows all required indicators
- **WHEN** user clicks "Edit Site" in the Site Details card menu
- **AND** the in-place edit form is displayed
- **THEN** all backend-required fields SHALL display a red asterisk (`*`) next to their labels
- **AND** the asterisks SHALL match the dedicated edit page and create page

#### Scenario: Required field indicators match backend validation
- **WHEN** reviewing the in-place edit form field labels
- **THEN** the following fields SHALL have asterisk indicators:
  - Site Name
  - Email Address
  - Phone Number
  - Description
  - Address
  - Locality
  - District
  - State
  - Pincode
  - Landmark

#### Scenario: Visual consistency across all site forms
- **WHEN** comparing the in-place edit form, dedicated edit page, and create page
- **THEN** all three forms SHALL show identical required field indicators
- **AND** the asterisk styling SHALL be consistent (red color, positioned after label)

### Requirement: Case Status Updates Must Persist Across All Update Interfaces

**Description:** When updating a case through any user interface (dedicated edit page or inline edit in case details header), the case status field MUST be included in the API update payload and persisted to the backend. All update interfaces MUST provide consistent data persistence behavior for all editable fields, including status.

**Rationale:** Users expect that changes made through any interface will be saved consistently. A bug where status updates work from one interface but not another creates confusion and undermines trust in the system. The case status is a critical field in legal case management - it tracks case lifecycle (Open, InProgress, OnHold, Closed) and must be reliably persisted.

**Root Cause:** The inline edit functionality in CaseHeader component (used on case details page) was not sending the `status` field in the API update payload. While the UI was updated locally to show the new status, the backend was never updated, causing the status to revert on page refresh or navigation.

**Acceptance Criteria:**
- The `updateCase` API function accepts an optional `status` field in its payload
- The `useCaseData` hook includes the status field when calling `updateCase` during inline edits
- Status updates from case details page (inline edit) are sent to the backend via PUT request
- Status persists after save, page refresh, and navigation
- Inline edit behavior matches dedicated edit page behavior for status field
- Network request payload includes `"status": "InProgress"` (or other CaseStatus value) when status is changed

#### Scenario: User updates case status from case details page inline edit

**Given:**
- User is viewing case details at `/organization/91/sites/162/cases/369`
- Case current status is "Open"
- User has permission to edit cases (canEditCases = true)

**When:**
- User clicks the three-dot menu icon in CaseHeader
- User selects "Edit Case" from the menu
- Inline edit form appears with current case data pre-filled
- User changes status dropdown from "Open" to "InProgress"
- User clicks "Save Changes" button

**Then:**
- PUT request is sent to `/api/v1/organizations/91/sites/162/cases/369`
- Request payload includes: `{ "title": "...", "caseNumber": "...", "status": "InProgress", "assignedToId": 123, "description": "..." }`
- Backend API processes the request and updates case status to "InProgress"
- API returns updated case data with `status: "InProgress"`
- UI displays success toast: "Case updated successfully"
- Case header shows status chip with "InProgress" label and primary color
- Inline edit form closes

**Validation:**
- Inspect network request in DevTools: verify payload contains `"status": "InProgress"`
- Check backend database: case record has status = "InProgress"
- Refresh page: case header still shows "InProgress" status
- Navigate to site cases list and back: status remains "InProgress"

#### Scenario: User updates case status along with other fields

**Given:**
- User is editing a case from the case details page
- Current case state: title="Contract Dispute", caseNumber="C-2024-001", status="Open", assignedToId=5

**When:**
- User changes multiple fields:
  - Title to "Contract Dispute Resolution"
  - Status to "InProgress"
  - Assigned To from User A (id=5) to User B (id=8)
- User clicks "Save Changes"

**Then:**
- PUT request payload includes all updated fields:
  ```json
  {
    "title": "Contract Dispute Resolution",
    "caseNumber": "C-2024-001",
    "status": "InProgress",
    "assignedToId": 8,
    "description": "..."
  }
  ```
- Backend updates all fields atomically
- UI reflects all changes after save
- Page refresh confirms all changes persisted

**Validation:**
- All modified fields (title, status, assignedTo) are included in API payload
- Backend receives and saves all fields correctly
- No data loss or partial updates occur

#### Scenario: Status update from dedicated edit page continues to work

**Given:**
- User navigates to dedicated edit page at `/organization/91/sites/162/cases/369/edit`
- Current case status is "InProgress"

**When:**
- User changes status dropdown from "InProgress" to "Closed"
- User clicks "Update Case" button

**Then:**
- PUT request is sent with payload including `"status": "Closed"`
- Backend updates case status to "Closed"
- User is redirected to case details page
- Case header shows status chip with "Closed" label and success color
- Success toast appears: "Case updated successfully"

**Validation:**
- Dedicated edit page functionality remains unchanged (no regression)
- Status field is consistently sent and persisted from both interfaces
- Both inline edit and dedicated edit page produce identical API behavior

#### Scenario: Status field is optional in update payload

**Given:**
- User edits a case but does NOT change the status field
- Current status is "InProgress"

**When:**
- User changes only the title field
- User clicks "Save Changes"

**Then:**
- PUT request payload includes current status value:
  ```json
  {
    "title": "New Title",
    "caseNumber": "C-2024-001",
    "status": "InProgress",
    "assignedToId": 5,
    "description": "..."
  }
  ```
- OR if API design allows, status field may be omitted and backend preserves existing value
- Either approach ensures status is not inadvertently changed or lost

**Validation:**
- When status is not changed by user, backend preserves the existing status value
- No accidental status changes occur when editing other fields

#### Scenario: Invalid status value is rejected

**Given:**
- CaseStatus enum defines valid values: Open, InProgress, OnHold, Closed
- User attempts to submit an invalid status (e.g., via API manipulation)

**When:**
- PUT request is sent with `"status": "InvalidStatus"`

**Then:**
- Backend API validation rejects the request
- API returns 400 Bad Request error
- Frontend displays appropriate error message
- Case status remains unchanged

**Validation:**
- TypeScript enum ensures frontend only sends valid status values
- Backend validation provides defense-in-depth against invalid data
- Error handling provides clear feedback to user

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

### Requirement: Site Deletion Must Validate No Users Exist

**Description:** The system SHALL prevent deletion of a site when one or more users are still assigned to that site. This validation protects against accidental data loss and ensures administrators explicitly manage user assignments before removing a site from the organization.

**Rationale:** Sites contain users who may have associated cases, tasks, hearings, and other data. Allowing site deletion with active users could lead to orphaned data, cascading deletes, or data integrity violations. By requiring all users to be removed first, we ensure administrators make conscious decisions about user data before site deletion.

#### Scenario: Attempt to delete site with assigned users

- **GIVEN** a site exists with ID 123 in organization 75
- **AND** the site has 3 users assigned via SiteUserMap
- **WHEN** an organization admin calls DELETE `/api/v1/organizations/75/sites/123`
- **THEN** the API SHALL return HTTP 400 Bad Request
- **AND** the response body SHALL contain error message: "Cannot delete site. 3 user(s) are still assigned to this site. Please remove all users before deleting the site."
- **AND** the site SHALL NOT be deleted from the database

#### Scenario: Delete site after all users removed

- **GIVEN** a site exists with ID 123 in organization 75
- **AND** the site previously had users but all have been removed
- **AND** the site has 0 users in SiteUserMap
- **WHEN** an organization admin calls DELETE `/api/v1/organizations/75/sites/123`
- **THEN** the API SHALL return HTTP 204 No Content
- **AND** the site SHALL be deleted from the database

#### Scenario: Delete site that never had users

- **GIVEN** a newly created site exists with ID 124 in organization 75
- **AND** no users have ever been assigned to this site (except the creator who was auto-assigned)
- **AND** the creator has been removed from the site
- **WHEN** an organization admin calls DELETE `/api/v1/organizations/75/sites/124`
- **THEN** the API SHALL return HTTP 204 No Content
- **AND** the site SHALL be deleted from the database

#### Scenario: Frontend displays deletion error

- **GIVEN** a user is viewing the site management tab for organization 75
- **AND** site "Downtown Office" has 5 users assigned
- **WHEN** the user clicks delete on "Downtown Office" and confirms
- **AND** the backend returns 400 with error message
- **THEN** the frontend SHALL display an error toast with the message: "Cannot delete site. 5 user(s) are still assigned to this site. Please remove all users before deleting the site."
- **AND** the site SHALL remain in the site list
- **AND** the delete confirmation modal SHALL close

