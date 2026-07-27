# Implementation Tasks

## 1. Add Component Imports and State
- [x] 1.1 Import `AddressAutocomplete` component at the top of the file
- [x] 1.2 Add `addressInput` state variable using `useState('')`
- [x] 1.3 Review how create/edit pages implement `handleAddressSelect` for reference

## 2. Implement Address Selection Handler
- [x] 2.1 Create `handleAddressSelect` function that:
  - Takes address data from Google Maps API
  - Populates address, locality, district, state, pincode, landmark fields in `editFormData`
  - Captures longitude and latitude coordinates
  - Clears the address autocomplete search input
- [x] 2.2 Ensure the handler matches the pattern used in create/edit pages

## 3. Replace Address Input Field
- [x] 3.1 Replace the plain `<input>` field for address (lines ~995-1003) with:
  - `<AddressAutocomplete>` component for search
  - `<textarea>` for manual address entry (matching create/edit pages)
  - Helper text guiding users to use autocomplete
- [x] 3.2 Keep the same label and required indicator (`*`)
- [x] 3.3 Match the styling and layout from create/edit pages

## 4. Update State Management
- [x] 4.1 Ensure `editFormData` can handle longitude/latitude fields
- [x] 4.2 Update `handleSaveChanges` to include longitude/latitude in API payload if needed
- [x] 4.3 Verify state is properly reset when canceling edit

## 5. Testing & Verification
- [x] 5.1 Test address autocomplete shows Google Maps suggestions
- [x] 5.2 Test selecting an address auto-fills all fields (address, locality, district, state, pincode, landmark)
- [x] 5.3 Test longitude/latitude are captured when address is selected
- [x] 5.4 Test manual address entry still works if user prefers not to use autocomplete
- [x] 5.5 Test saving with autocomplete-filled data
- [x] 5.6 Test saving with manually entered data
- [x] 5.7 Compare UX with create and dedicated edit pages for consistency

## 6. Documentation
- [x] 6.1 No PRD update needed (aligns existing functionality)
