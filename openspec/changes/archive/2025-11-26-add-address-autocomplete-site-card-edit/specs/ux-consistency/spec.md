# UX Consistency Spec Delta

## ADDED Requirements

### Requirement: Site Form Address Input Consistency
All site forms (create, edit, and in-place edit) SHALL provide the same address input experience using the `AddressAutocomplete` component with Google Maps API integration.

#### Scenario: In-place edit form provides address autocomplete
- **WHEN** user clicks "Edit Site" in the Site Details card menu
- **AND** the in-place edit form is displayed
- **THEN** the address input section SHALL include:
  - An `AddressAutocomplete` component for searching addresses via Google Maps
  - A `textarea` field for manual address entry or viewing the selected address
  - Helper text guiding users to use autocomplete for convenience
- **AND** the address input experience SHALL match the create and dedicated edit pages

#### Scenario: Address autocomplete populates all location fields
- **WHEN** user types an address in the autocomplete search field
- **AND** Google Maps API returns address suggestions
- **AND** user selects an address from the dropdown
- **THEN** the following fields SHALL be automatically populated:
  - Address (full formatted address)
  - Locality (neighborhood/area)
  - District (administrative area level 2)
  - State (administrative area level 1)
  - Pincode (postal code)
  - Landmark (prominent nearby place name, if available)
  - Longitude (geographic coordinate)
  - Latitude (geographic coordinate)

#### Scenario: User can still manually enter address
- **WHEN** user chooses not to use the address autocomplete
- **AND** manually types directly into the address textarea field
- **THEN** the form SHALL accept manual input
- **AND** other fields (locality, district, etc.) can be manually filled
- **BUT** longitude/latitude will not be automatically captured (user must use autocomplete for coordinates)

#### Scenario: Address autocomplete consistency across all forms
- **WHEN** comparing address input across create site, dedicated edit, and in-place edit forms
- **THEN** all three forms SHALL:
  - Use the `AddressAutocomplete` component
  - Have identical layout: autocomplete search above textarea
  - Show the same helper text guiding users
  - Auto-populate the same fields when an address is selected
  - Capture longitude/latitude coordinates from Google Maps
- **AND** visual styling and behavior SHALL be consistent
