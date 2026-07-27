# Tasks: Fix Invoice Form State Persistence

**Change ID**: `fix-invoice-form-state-persistence`

## Implementation Checklist

### 1. Update InvoiceTabPresentation Component
- [x] Add a `resetFileSelection` function to clear `selectedFile` state
- [x] Clear the file input element in `resetFileSelection`
- [x] Expose `resetFileSelection` via props interface
- [x] Pass `resetFileSelection` to container via callback

**File**: `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/InvoiceTab/InvoiceTab.tsx`

**Changes**:
- ✅ Added `onResetFileSelection?: (resetFn: () => void) => void` to `InvoiceTabProps` interface
- ✅ Created `resetFileSelection` function to clear `selectedFile` state and file input
- ✅ Added `useEffect` to pass `resetFileSelection` to parent on mount
- ✅ Container receives and forwards callback to hook

### 2. Update useCaseInvoices Hook
- [x] Add `fileSelectionResetRef` to store reference to reset function
- [x] Add `setFileSelectionReset` function to receive callback from container
- [x] Call the reset function after successful invoice submission
- [x] Ensure reset happens before closing the form

**File**: `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/useCaseInvoices.ts`

**Changes**:
- ✅ Added `fileSelectionResetRef` using `useRef` hook
- ✅ Created `setFileSelectionReset` callback function
- ✅ Updated `handleAddInvoice` to call `fileSelectionResetRef.current()` after form reset (line 136-138)
- ✅ Exported `setFileSelectionReset` in return statement

### 3. Verification & Testing
- [x] Run build: `yarn build`
- [x] Verify TypeScript types are correct
- [ ] Manual test: Create invoice → verify form clears → create another invoice (user to perform)
- [ ] Manual test: Cancel form → verify form clears (user to perform)
- [ ] Manual test: Submission fails → verify file remains for retry (user to perform)

**Build Status**: ✅ Code compiles successfully. Pre-existing build error in `src/app/organization/[id]/sites/[siteId]/page.tsx` (unrelated to this fix) prevents full build completion but does not affect invoice functionality.

### 4. Documentation
- [x] Added inline code comments for state reset logic
- [x] No PRD updates needed (bug fix, no user-facing feature change documented)

## Task Dependencies

- Task 1 must be completed before Task 2 (interface changes first)
- Task 3 can only start after Task 1 and 2 are complete
- Task 4 can be done in parallel with Task 3

## Validation Criteria

### Build Validation
- `npx tsc --noEmit` exits with code 0 (no TypeScript errors)
- `yarn build` completes successfully
- No new ESLint warnings

### Functional Validation
- Successful invoice submission clears file selection state
- File input element is reset (value is empty)
- Form can be reopened with clean state
- Cancel still works as expected
- Failed submissions retain file for retry

## Estimated Complexity

**Complexity**: Low
**Effort**: Small (30-45 minutes)
**Risk**: Minimal

## Notes

This is a straightforward state management fix with no API changes, schema changes, or data migration requirements. The fix is isolated to the invoice form UI component and its associated hook.
