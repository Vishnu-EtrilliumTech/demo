# Change: Fix DateTime Format Consistency Across Task and Hearing Pages

## Why
Users currently experience inconsistent time display formats when viewing and editing tasks and hearings:
- **Details View**: Displays date/time in 24-hour format (e.g., "11/27/2025, 14:30:00")
- **Edit Form**: Uses HTML5 `datetime-local` input which renders in 12-hour AM/PM format by default (e.g., "2:30 PM")

This inconsistency creates a confusing user experience where the same datetime value appears differently depending on whether the user is viewing or editing the record. The issue affects both the Task Details page and Hearing Details page.

## What Changes
- Standardize datetime display format to consistently use 12-hour AM/PM format across all task and hearing interfaces
- Update the `formatDisplayDateTime` utility function to enforce 12-hour time format with AM/PM indicators
- Apply consistent formatting to both:
  - Task due date display (details view and table view)
  - Hearing date/time display (details view and table view)
- Ensure datetime inputs in edit forms align with the display format used in view mode

## Impact
- **Affected specs**: `ux-consistency`
- **Affected code**:
  - `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/utils/dateFormatters.ts` - Update `formatDisplayDateTime` function
  - `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/TasksTab/TasksTab.tsx` - Task details view (line 617), table view (line 463-466)
  - `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/HearingsTab/HearingsTab.tsx` - Hearing details view (line 546), table view (lines 420-424)
- **User impact**: Low severity - Cosmetic fix that improves consistency, no functional changes
- **Breaking changes**: None - purely presentational change
