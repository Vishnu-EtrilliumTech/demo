# Change: Add Required Field Indicators to Site Details Card Edit Form

## Why

GitHub Issue [#46](https://github.com/eTrillium/Lawsome.Web.UI/issues/46) reports that mandatory fields are missing asterisk (`*`) indicators in the in-place edit form within the Site Details card on the site dashboard page.

**Current State:**
- The dedicated site edit page (`/organization/[id]/sites/[siteId]/edit`) correctly shows `*` for all required fields
- The in-place edit form in the Site Details card (on `/organization/[id]/sites/[siteId]`) is missing `*` indicators for several required fields
- The backend API (`UpdateSiteRequest.cs`) marks these fields as `[Required]`, causing validation errors when they're empty

**Fields Missing Required Indicators:**
1. Email Address (Line 941)
2. Phone Number (Line 956)
3. Description (Line 971)
4. Locality (Line 1005)
5. Landmark (Line 1062)

**Fields Already Having Indicators:**
1. Site Name (Line 925) ✓
2. Address (Line 990) ✓
3. District (Line 1020) ✓
4. State / Pincode (Line 1036) ✓

## What Changes

Add `<span className="text-red-500 ml-1">*</span>` to the following field labels in the in-place edit form:
- Email Address
- Phone Number
- Description
- Locality
- Landmark

This aligns the in-place edit form with:
- The dedicated edit page (`/organization/[id]/sites/[siteId]/edit`)
- The create site page (`/organization/[id]/sites/new`)
- Backend API validation requirements

## Impact

### Affected Specs
- `data-integrity` - UI consistency for required field indicators

### Affected Code
- `src/app/organization/[id]/sites/[siteId]/page.tsx` (lines 916-1074) - Site Details card edit form

### Breaking Changes
None - This is a visual enhancement to improve UX consistency

### User Impact
- **Positive**: Users can immediately see which fields are mandatory before attempting to save
- **Positive**: Consistent UX across all site forms (create, dedicated edit, and in-place edit)
- **Positive**: Prevents confusion when validation errors occur for unmarked fields
