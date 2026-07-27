# Change: Fix Case Status Update Persistence from Case Details Page

## Why

Users report that when updating the case status from the case details summary page (using inline edit in CaseHeader), the status change is not persisted to the backend. The status appears to update temporarily in the UI but reverts to the original value after navigation or page refresh.

This is a critical data integrity bug affecting case management workflows. Users expect status changes made from any interface (dedicated edit page or inline edit) to be persisted consistently.

**Issue Reference**: GitHub Issue #71 - https://github.com/eTrillium/Lawsome.Web.UI/issues/71

## What Changes

- Add `status` field to the `updateCase` API function signature to accept CaseStatus parameter
- Update `useCaseData` hook to include `status` when calling `updateCase` during inline header edits
- Ensure the status field is sent in the HTTP PUT request payload to persist backend changes
- Verify the backend API supports the status field in the update endpoint (check swagger.json and backend codebase)

## Impact

### Affected Specs
- `data-integrity` - Ensures case status updates are persisted correctly across all update interfaces

### Affected Code
- `src/app/organization/services/api.ts` - Update `updateCase` function signature and payload
- `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/useCaseData.ts` - Pass status field in `handleSaveTitleEdit` function
- `src/app/organization/types/index.ts` - Update TypeScript interface for case update payload

### User Impact
- **Fixed**: Case status updates from case details page now persist correctly
- **Consistency**: All update interfaces (dedicated edit page and inline edit) now behave consistently
- **No Breaking Changes**: This is a bug fix that restores expected behavior
