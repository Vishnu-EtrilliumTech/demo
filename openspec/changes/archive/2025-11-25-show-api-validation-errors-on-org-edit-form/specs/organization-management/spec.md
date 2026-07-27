# Organization Management - Spec Delta

## ADDED Requirements

### Requirement: Field-Level Validation Error Display on Organization Edit
The organization edit form SHALL display inline validation errors when the API returns HTTP 400 responses with field-specific error messages, allowing users to understand and correct validation failures without losing form state.

#### Scenario: Segments validation error displayed inline
- **GIVEN** a user is editing an organization
- **WHEN** the user saves changes with an empty segments array
- **AND** the API returns HTTP 400 with `{"errors": {"Segments": ["At least one segment is required."]}}`
- **THEN** the edit form SHALL remain visible and editable
- **AND** the error message "At least one segment is required." SHALL be displayed above the Segments field
- **AND** the Segments field SHALL be visually highlighted as invalid (red border or error styling)
- **AND** the form SHALL NOT navigate to an error page

#### Scenario: Multiple field validation errors displayed
- **GIVEN** a user is editing an organization
- **WHEN** the user saves changes with multiple invalid fields
- **AND** the API returns HTTP 400 with `{"errors": {"Segments": ["At least one segment is required."], "Name": ["Name is required."]}}`
- **THEN** the edit form SHALL remain visible
- **AND** each error message SHALL be displayed above its corresponding field
- **AND** all invalid fields SHALL be visually highlighted

#### Scenario: Non-validation API error shows error page
- **GIVEN** a user is editing an organization
- **WHEN** the API returns a non-validation error (HTTP 500, network error, etc.)
- **THEN** the system SHALL display the "Error Loading Organization Data" page
- **AND** provide a "Retry" button

#### Scenario: Successful save after fixing validation errors
- **GIVEN** a user has validation errors displayed on the form
- **WHEN** the user corrects the invalid fields
- **AND** submits the form again
- **AND** the API returns HTTP 200
- **THEN** all validation error messages SHALL be cleared
- **AND** the form SHALL exit edit mode
- **AND** the organization details SHALL display the updated values

## MODIFIED Requirements

### Requirement: Organization Edit Error Handling
The organization edit form error handling SHALL differentiate between validation errors (HTTP 400 with `errors` object) and other API errors, displaying appropriate feedback for each case.

**Previous behavior**: All errors during save displayed "Error Loading Organization Data" page.

**New behavior**:
- HTTP 400 responses with `errors` object: Display inline field-level errors, keep form editable
- Other errors (HTTP 500, network failures, etc.): Display "Error Loading Organization Data" page with retry option

#### Scenario: Validation error preserves form state
- **GIVEN** a user is editing an organization with form data filled in
- **WHEN** the API returns a validation error (HTTP 400)
- **THEN** all form fields SHALL retain their current values
- **AND** the user SHALL remain in edit mode
- **AND** the "Save Changes" and "Cancel" buttons SHALL remain visible and functional

#### Scenario: Critical error shows error page
- **GIVEN** a user attempts to save organization changes
- **WHEN** the API returns HTTP 500 or network error occurs
- **THEN** the system SHALL display the error page
- **AND** the error page SHALL show "Failed to update organization. Please try again."
- **AND** a "Retry" button SHALL reload the page
