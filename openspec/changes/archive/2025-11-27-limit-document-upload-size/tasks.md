# Tasks: Limit Document Upload Size to 1MB

## Implementation Tasks

### 1. Add file size validation to Case Documents upload
**File**: `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/useCaseDocuments.ts`

- [x] Add file size validation in `handleCaseDocumentUpload` function (before line 88)
- [x] Check if `file.size > 1048576` (1MB in bytes)
- [x] If validation fails, use `showError()` from `useToast` hook
- [x] Display error message: "File size exceeds 1MB limit. Please upload a smaller file."
- [x] Return early without processing the file
- [x] Import `useToast` hook at the top of the file

**Dependencies**: None
**Parallel work**: Can be done independently of task 2

### 2. Add file size validation to Task Documents upload
**File**: `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/useCaseTasks.ts`

- [x] Add file size validation in `handleDocumentUpload` function (before line 311)
- [x] Check if `file.size > 1048576` (1MB in bytes)
- [x] If validation fails, use `showError()` from `useToast` hook (already imported)
- [x] Display error message: "File size exceeds 1MB limit. Please upload a smaller file."
- [x] Return early without processing the file

**Dependencies**: None
**Parallel work**: Can be done independently of task 1

### 3. Testing & Validation

- [ ] Manual test: Attempt to upload a file > 1MB in Case Documents
- [ ] Verify: Toast error notification appears with correct message
- [ ] Verify: File upload does not proceed
- [ ] Verify: Upload button returns to normal state (not stuck in loading)
- [ ] Manual test: Attempt to upload a file > 1MB in Task Documents
- [ ] Verify: Toast error notification appears with correct message
- [ ] Verify: File upload does not proceed
- [ ] Manual test: Upload a file < 1MB in both locations
- [ ] Verify: Upload proceeds normally without errors

**Dependencies**: Tasks 1 and 2 must be complete
**Notes**: Human developer must perform manual testing (no automated UI testing)

## Validation Steps

Each task should be validated by:
1. Code review to ensure:
   - File size is checked before processing begins
   - Error message is user-friendly and actionable
   - Toast notification is used (not `alert()`)
   - Early return prevents unnecessary processing
   - No breaking changes to existing functionality

2. Manual testing to ensure:
   - Large file uploads are blocked with clear error message
   - Small file uploads work as expected
   - UI remains responsive and doesn't get stuck in loading state
   - Error messages appear in the standard Toast position (bottom-left)

## Notes

- **Implementation Pattern**: Use the existing Toast notification system (`showError()`) instead of `alert()`
- **Error Message**: Keep consistent across both upload locations
- **File Size Constant**: 1MB = 1,048,576 bytes (1024 * 1024)
- **No Breaking Changes**: Existing uploads for files under 1MB should work exactly as before
- **Performance**: Validation happens immediately in the browser, no server round-trip needed
