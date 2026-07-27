# Data Integrity Spec Delta

## ADDED Requirements

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
