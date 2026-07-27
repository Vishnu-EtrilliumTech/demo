# Specification: Data Integrity for Display Values

**Capability:** data-integrity
**Change ID:** fix-na-display-value-leakage
**Status:** Draft

## Overview

This specification ensures that UI-only display values (such as "N/A" placeholders) never leak into API request payloads or persist in the database. The frontend must maintain clear separation between data transformation (preserving integrity) and display formatting (user-facing presentation).

## ADDED Requirements

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

## Implementation Checklist

### API Transformation Layer (`src/app/organization/services/api.ts`)
- [ ] Remove `|| 'N/A'` from `name` field transformation
- [ ] Remove `|| 'N/A'` from `description` field transformation
- [ ] Remove `|| 'N/A'` from `emailId` field transformation
- [ ] Remove `'N/A'` from `currentUser` fallback object fields
- [ ] Ensure all transformations use type-safe empty values (`""`, `0`, `[]`)

### Edit Forms (`src/app/organization/[id]/page.tsx`)
- [ ] Verify `handleEditClick` uses `|| ''` fallbacks (not `|| 'N/A'`)
- [ ] Verify `handleSaveEdit` sends raw form values
- [ ] Test: empty field submission sends empty string to API
- [ ] Test: form does not pre-fill with "N/A"

### Display Components
- [ ] Organization description: use conditional rendering (Pattern A)
- [ ] Site fields: decide Pattern A or B, apply consistently
- [ ] User fields: decide Pattern A or B, apply consistently
- [ ] Document which pattern is used for each field type

### Testing
- [ ] Unit test: API transformation with empty/null values
- [ ] Integration test: edit form with empty fields
- [ ] Manual test: full CRUD cycle with empty optional fields
- [ ] Regression test: existing functionality unaffected

## Cross-References

- **Related Proposal:** `fix-na-display-value-leakage/proposal.md`
- **Related Tasks:** `fix-na-display-value-leakage/tasks.md`
- **Implementation Files:**
  - `src/app/organization/services/api.ts`
  - `src/app/organization/[id]/page.tsx`
  - `src/app/organization/components/SiteManagementTab.tsx`
  - `src/app/organization/components/SitesTable.tsx`
  - `src/app/organization/components/UserManagementTab.tsx`
