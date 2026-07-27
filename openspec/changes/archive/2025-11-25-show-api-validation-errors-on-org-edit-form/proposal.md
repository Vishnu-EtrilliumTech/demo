# Change: Show API Validation Errors on Organization Edit Form

## Why

When editing an organization and the backend API returns validation errors (HTTP 400), the UI currently shows a generic "Error Loading Organization Data" error page instead of displaying field-specific validation messages. This poor UX prevents users from understanding what went wrong and how to fix it.

Specifically, when an organization edit PUT request fails with validation errors like:
```json
{
  "status": 400,
  "errors": {
    "Segments": ["At least one segment is required."]
  }
}
```

The UI should display this error inline above the Segments field in the edit form, not replace the entire page with an error screen.

## What Changes

- Parse API validation error responses (HTTP 400) to extract field-specific error messages from the `errors` object
- Display field-level validation errors inline within the edit form (e.g., above the Segments field)
- Preserve the edit form state when validation errors occur (don't navigate away or show error page)
- Maintain general error handling for other types of API failures (network errors, 500s, etc.)
- Differentiate between validation errors (show inline) and critical errors (show error page)

## Impact

### Affected Capabilities
- `organization-management` - Organization edit form error handling

### Affected Code
- `src/app/organization/[id]/page.tsx` - Organization detail page with edit functionality
  - Lines 220-257: `handleSaveEdit` function needs validation error parsing
  - Lines 343-363: Generic error display logic needs to differentiate error types
  - Lines 596-704: Edit form JSX needs inline error display for Segments field
- `src/app/organization/services/api.ts` - May need enhanced error response handling
  - Lines 46-57: `updateOrganization` function error handling

### User Experience Changes
- **Before**: Any API validation error shows "Error Loading Organization Data" page, losing form state
- **After**: Validation errors display inline above the relevant field, form remains editable

### Breaking Changes
None - this is a pure UI enhancement that improves existing functionality
