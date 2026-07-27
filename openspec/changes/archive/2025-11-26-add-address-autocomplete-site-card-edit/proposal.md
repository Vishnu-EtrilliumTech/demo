# Change: Add Address Autocomplete to Site Details Card Edit Form

## Why

GitHub Issue [#47](https://github.com/eTrillium/Lawsome.Web.UI/issues/47) reports that map address suggestions are not appearing on the Edit Site page, making it difficult for users to enter accurate addresses with proper geographic coordinates.

**Root Cause:**
The in-place edit form in the Site Details card (`/organization/[id]/sites/[siteId]`) uses a plain `<input>` field for address, while the create site page and dedicated edit page use the `<AddressAutocomplete>` component that provides:
- Google Maps API address suggestions
- Automatic population of locality, district, state, pincode, landmark fields
- Automatic capture of longitude/latitude coordinates

**Current State:**
- **Create Site** (`/organization/[id]/sites/new`) - ✓ Has AddressAutocomplete
- **Dedicated Edit** (`/organization/[id]/sites/[siteId]/edit`) - ✓ Has AddressAutocomplete
- **In-place Edit** (`/organization/[id]/sites/[siteId]` - Site Details card) - ❌ Plain input field

**User Impact:**
- Users cannot search for addresses using Google Maps suggestions
- Manual entry of address, locality, district, state, pincode, landmark is tedious and error-prone
- Longitude/latitude coordinates cannot be automatically captured
- Inconsistent UX across site forms

## What Changes

Replace the plain address `<input>` field in the in-place edit form with the `<AddressAutocomplete>` component to match the create and dedicated edit pages.

**Implementation:**
1. Import `AddressAutocomplete` component
2. Add `addressInput` state for the autocomplete search value
3. Add `handleAddressSelect` callback to populate fields when user selects an address
4. Replace the plain address input with `<AddressAutocomplete>` + textarea pattern (matching create/edit pages)
5. Ensure proper state management for longitude/latitude coordinates

## Impact

### Affected Specs
- `ux-consistency` - Form consistency across create/edit interfaces

### Affected Code
- `src/app/organization/[id]/sites/[siteId]/page.tsx` (lines 989-1004) - Site Details card address input

### Breaking Changes
None - This is an enhancement that improves existing functionality

### User Impact
- **Positive**: Users can search for addresses with Google Maps suggestions
- **Positive**: Address fields are automatically populated, reducing manual entry
- **Positive**: Geographic coordinates are captured automatically
- **Positive**: Consistent UX across all site forms
- **No Negative Impact**: Users can still manually enter addresses if they prefer
