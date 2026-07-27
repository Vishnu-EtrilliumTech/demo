# Tasks: Limit Invoice Document Upload Size to 1MB

## Implementation Tasks

### 1. Add file size validation to new invoice upload
**File**: `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/InvoiceTab/InvoiceTab.tsx`
**Function**: `handleFileChange` (line ~173)

- [x] Import `useToast` hook (if not already imported)
- [x] Add file size validation at the start of `handleFileChange`
- [x] Check if `file.size > 1048576` (1MB in bytes)
- [x] Display error message using `showError()`: "File size exceeds 1MB limit. Please upload a smaller file."
- [x] Return early to prevent further processing
- [x] Reset file input element

### 2. Add file size validation to edit mode invoice upload
**File**: `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/InvoiceTab/InvoiceTab.tsx`
**Function**: `handleEditFileChange` (line ~223)

- [x] Add file size validation at the start of `handleEditFileChange`
- [x] Check if `file.size > 1048576` (1MB in bytes)
- [x] Display error message using `showError()`: "File size exceeds 1MB limit. Please upload a smaller file."
- [x] Return early to prevent further processing
- [x] Reset edit file input element

## Verification Tasks

### 3. Manual Testing
- [ ] Test new invoice upload with file > 1MB - should show error toast
- [ ] Test new invoice upload with file < 1MB - should upload successfully
- [ ] Test edit mode file replacement with file > 1MB - should show error toast
- [ ] Test edit mode file replacement with file < 1MB - should upload successfully
- [ ] Verify no network requests are made for oversized files (check Network tab)

## Implementation Notes

- **File Size Constant**: 1MB = 1,048,576 bytes (1024 * 1024)
- **Error Message**: Must match existing pattern: "File size exceeds 1MB limit. Please upload a smaller file."
- **Toast Context**: Component may need to access Toast context for `showError()`
- **Pattern Reference**: See `useCaseDocuments.ts` lines 89-93 for existing implementation

## Dependencies

- Toast notification context (`useToast` from `@/contexts/ToastContext`)
- Existing file upload infrastructure (no changes needed)

## Estimated Effort

- Implementation: ~30 minutes
- Testing: ~15 minutes
