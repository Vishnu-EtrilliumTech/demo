# Implementation Tasks

## 1. Fix Personal Dashboard Case Delete Permission

- [x] 1.1 Verify `useUserRole` hook is imported and called correctly in personal dashboard
  - File: `src/app/organization/[id]/sites/[siteId]/users/[userId]/page.tsx`
  - Confirm `canDeleteCases` is destructured from hook (line 135-141)

- [x] 1.2 Update delete MenuItem to conditionally render based on `canDeleteCases` permission
  - File: `src/app/organization/[id]/sites/[siteId]/users/[userId]/page.tsx`
  - Location: Lines 1330-1347 (delete MenuItem in case actions menu)
  - Wrap MenuItem with `{canDeleteCases && ...}` conditional

- [x] 1.3 Ensure three-dot menu icon visibility follows action availability
  - If both `onEditCase` and `onDeleteCase` props exist but user lacks delete permission, menu should still show (Edit is available)
  - Menu icon should only hide when no actions are available

- [x] 1.4 Verify edit action remains visible for legal experts
  - Confirm edit MenuItem is NOT wrapped in `canDeleteCases` check
  - Edit should use `canEditCases` permission (already includes legal experts)

## 2. Verification and Testing

- [ ] 2.1 Manual testing with different roles
  - Test as SiteAdmin: verify both Edit and Delete are visible
  - Test as SiteClerk: verify both Edit and Delete are visible
  - Test as SiteLegalExpert: verify only Edit is visible
  - Test as SiteSrLegalExpert: verify only Edit is visible
  - Test as OrgAdmin: verify both Edit and Delete are visible
  - **NOTE**: Manual testing must be performed by developer

- [ ] 2.2 Verify consistency across dashboards
  - Check personal dashboard: `/organization/{orgId}/sites/{siteId}/users/{userId}`
  - Check site dashboard: `/organization/{orgId}/sites/{siteId}` (should already be correct)
  - Confirm permission logic is uniform
  - **NOTE**: Manual verification required

- [ ] 2.3 Test delete functionality for authorized roles
  - As SiteAdmin, verify delete actually removes the case
  - Verify confirmation modal appears (if implemented)
  - Verify case is removed from the list after successful deletion
  - **NOTE**: Manual testing must be performed by developer

## 3. Documentation Updates

- [ ] 3.1 Update PRD if needed
  - File: `docs/Lawsome_PRD.md`
  - Document role-based case deletion permissions if not already covered
  - **NOTE**: No PRD update needed - permission matrix is already documented in API_Permissions_Matrix.md

- [x] 3.2 Add comment in code explaining permission check
  - Add brief comment above delete MenuItem explaining role restriction
  - Example: `// Only users with canDeleteCases permission (Admin/Clerk roles) can delete cases`

## 4. Build Verification

- [x] 4.1 Run TypeScript compiler
  - Execute: `npx tsc --noEmit`
  - Verify no type errors introduced
  - **RESULT**: No errors detected

- [ ] 4.2 Run linter
  - Execute: `yarn lint`
  - Fix any linting issues
  - **NOTE**: User should run linter

- [ ] 4.3 Test development build
  - Execute: `yarn dev`
  - Verify app starts without errors
  - Test the fixed functionality in browser
  - **NOTE**: Manual testing by developer required

## Dependencies

- Task 1.2 depends on 1.1 (need to confirm hook is properly imported)
- Task 2.x depends on 1.x being complete (testing requires implementation)
- Task 4.1-4.3 must pass before marking implementation complete
