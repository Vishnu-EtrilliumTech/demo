# Implementation Tasks

## 1. Backend API Verification
- [x] 1.1 Check swagger.json to verify the PUT /cases/{caseId} endpoint accepts 'status' field
  - ✅ Verified: UpdateCaseRequest schema requires 'status' field (line 7731 in swagger.json)
  - ✅ CaseStatus enum values: Open, InProgress, OnHold, Closed
- [x] 1.2 Review backend codebase at C:\Users\LENOVO\sabari\codebase\Lawsome\Code to confirm status field handling
  - ✅ Backend API accepts and requires the status field in update requests
- [x] 1.3 Document any backend changes needed (if API doesn't accept status field)
  - ✅ No backend changes needed - API already supports status field

## 2. Frontend Type Definitions
- [x] 2.1 Update the `updateCase` function parameter type in src/app/organization/services/api.ts to include `status: CaseStatus` field
  - ✅ Changed from optional to required to match backend API contract
- [x] 2.2 Verify CaseStatus enum is imported correctly in api.ts
  - ✅ Added CaseStatus to imports from '../types'

## 3. API Service Layer Update
- [x] 3.1 Modify `updateCase` function in src/app/organization/services/api.ts to accept status in caseData parameter
  - ✅ Updated caseData type to include `status: CaseStatus`
- [x] 3.2 Ensure status field is included in the axios.put payload when provided
  - ✅ Status field automatically included in caseData payload sent to backend
- [x] 3.3 Add JSDoc comment documenting the status parameter
  - ✅ Added comprehensive JSDoc with all parameter descriptions

## 4. Hook Layer Update
- [x] 4.1 Update `handleSaveTitleEdit` in src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/useCaseData.ts to pass status field to updateCase
  - ✅ Added `status: editTitleForm.status` to updateCase call (line 196)
- [x] 4.2 Ensure the status from editTitleForm.status is included in the API call at line 188-197
  - ✅ Status field now sent in API payload
- [x] 4.3 Update `handleSaveChanges` to include status field for consistency
  - ✅ Added `status: caseData.status` to updateCase call (line 253)

## 5. Verification
- [ ] 5.1 Test inline edit status change from case details page
  - ⚠️ Manual testing required by user
- [ ] 5.2 Verify status persists after save (check network request payload)
  - ⚠️ Manual testing required - check DevTools Network tab for status field in payload
- [ ] 5.3 Navigate away and back to verify status remains changed
  - ⚠️ Manual testing required by user
- [ ] 5.4 Test all status transitions (Open → InProgress → OnHold → Closed)
  - ⚠️ Manual testing required by user
- [ ] 5.5 Verify dedicated edit page at /organization/{id}/sites/{siteId}/cases/{caseId}/edit still works correctly
  - ✅ Code review confirms edit page already spreads form state including status field

## 6. Build Verification
- [x] 6.1 Run `npx tsc --noEmit` to ensure no TypeScript errors
  - ✅ Build passed with no errors
- [x] 6.2 Fix any type errors or linting issues
  - ✅ No errors found
- [x] 6.3 Verify build completes successfully
  - ✅ TypeScript compilation successful

## Dependencies
- Task 2 must complete before Task 3 ✅
- Task 3 must complete before Task 4 ✅
- Tasks 1-4 must complete before Task 5 ✅

## Validation Criteria
- ✅ Status field is sent in PUT request payload
- ⚠️ Backend successfully updates and returns updated case with new status (requires manual testing)
- ⚠️ UI reflects persisted status after page refresh (requires manual testing)
- ✅ No TypeScript compilation errors
- ✅ Consistent behavior between inline edit and dedicated edit page

## Summary

All code changes have been implemented successfully. The fix ensures that case status updates from the case details page inline edit are now properly sent to the backend API. Manual testing is required to verify the end-to-end functionality works as expected in the running application.

### Files Changed
1. **src/app/organization/services/api.ts**
   - Added `CaseStatus` to imports
   - Updated `updateCase` function signature to include required `status: CaseStatus` field
   - Added comprehensive JSDoc documentation

2. **src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/useCaseData.ts**
   - Updated `handleSaveTitleEdit` to pass `status: editTitleForm.status` to API
   - Updated `handleSaveChanges` to pass `status: caseData.status` to API for consistency
