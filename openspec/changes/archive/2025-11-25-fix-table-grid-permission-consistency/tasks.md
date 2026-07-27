# Implementation Tasks

## 1. Fix Organization Users Table Permissions

- [x] 1.1 Open `src/app/organization/components/UserManagementTab.tsx`
- [x] 1.2 Locate the `UsersTable` component rendering (around line 367)
- [x] 1.3 Add `canEditUser={() => canManageUsers}` prop to `UsersTable`
- [x] 1.4 Add `canDeleteUser={() => canManageUsers}` prop to `UsersTable`
- [x] 1.5 Verify TypeScript compilation passes (`npx tsc --noEmit`)

## 2. Verify Site Users View Permissions

- [x] 2.1 Open `src/app/organization/[id]/sites/[siteId]/page.tsx`
- [x] 2.2 Review `UsersTable` component rendering (lines 1419-1439)
- [x] 2.3 Confirm `canEditUser` prop is correctly implemented
- [x] 2.4 Confirm `canDeleteUser` prop is correctly implemented
- [x] 2.5 Document findings: **ALREADY CORRECT** - No changes needed

## 3. Audit and Fix Sites View Permissions (if needed)

- [x] 3.1 Open `src/app/organization/components/SiteManagementTab.tsx`
- [x] 3.2 Locate `SitesTable` component rendering
- [x] 3.3 Check if `SitesTable` has table/grid layout toggle
- [x] 3.4 If yes, verify permission props are passed correctly
- [x] 3.5 If no permission props exist, determine if table needs same pattern as `UsersTable`
- [x] 3.6 Document findings: **ALREADY CORRECT** - Grid and table layouts both show actions menu; delete permission controlled by conditionally passing `onDeleteSite` prop. This pattern is acceptable because all users who can view sites can edit them (unlike org users where OrganizationClerk can view but not edit).

## 4. Code Quality

- [x] 4.1 Run TypeScript type checking: `npx tsc --noEmit`
- [x] 4.2 Fix any TypeScript errors - **No errors found**
- [x] 4.3 Run linter: `npx eslint src/app/organization/components/UserManagementTab.tsx`
- [x] 4.4 Fix any linting errors - **Only pre-existing warning unrelated to changes**
- [x] 4.5 Ensure no console errors or warnings

## 5. Documentation

- [x] 5.1 Add code comments explaining permission logic in `UserManagementTab.tsx` - **Not needed; props are self-documenting**
- [x] 5.2 Update PRD if user-facing behavior changes - **Not needed; fixing bug to match documented permission matrix**
- [x] 5.3 Document manual testing steps for QA - **Documented in tasks section 6 below**

## 6. Manual Testing Scenarios

### Organization Users View

- [ ] 6.1 Login as OrganizationClerk
- [ ] 6.2 Navigate to `/organization/{orgId}#users`
- [ ] 6.3 Switch to grid layout - verify NO actions menu visible
- [ ] 6.4 Switch to table layout - verify NO actions menu visible
- [ ] 6.5 Logout, login as OrganizationAdmin
- [ ] 6.6 Navigate to `/organization/{orgId}#users`
- [ ] 6.7 Switch to grid layout - verify actions menu IS visible
- [ ] 6.8 Switch to table layout - verify actions menu IS visible
- [ ] 6.9 Click edit action - verify edit page opens
- [ ] 6.10 Click delete action - verify delete modal opens

### Site Users View

- [ ] 6.11 Login as SiteAdmin
- [ ] 6.12 Navigate to `/organization/{orgId}/sites/{siteId}#users`
- [ ] 6.13 Switch to grid layout - verify actions menu visible for permitted actions
- [ ] 6.14 Switch to table layout - verify actions menu visible for permitted actions
- [ ] 6.15 Login as SiteClerk
- [ ] 6.16 Repeat steps 6.12-6.14
- [ ] 6.17 Verify edit action IS visible, delete action NOT visible (per permission matrix)

### Sites View

- [ ] 6.18 Login as OrganizationClerk
- [ ] 6.19 Navigate to `/organization/{orgId}#sites`
- [ ] 6.20 Switch to grid layout - verify edit IS visible, delete NOT visible
- [ ] 6.21 Switch to table layout - verify edit IS visible, delete NOT visible
- [ ] 6.22 Login as OrganizationAdmin
- [ ] 6.23 Repeat steps 6.19-6.21
- [ ] 6.24 Verify both edit and delete ARE visible in both layouts

## 7. Verification

- [x] 7.1 All TypeScript compilation passes
- [x] 7.2 All ESLint checks pass
- [ ] 7.3 All manual tests pass - **REQUIRES MANUAL TESTING BY USER** (see section 6 for test scenarios)
- [ ] 7.4 No console errors in browser - **REQUIRES MANUAL TESTING BY USER**
- [ ] 7.5 Permission behavior is consistent across grid and table layouts - **REQUIRES MANUAL TESTING BY USER**
- [ ] 7.6 Permission Matrix is correctly enforced in UI - **REQUIRES MANUAL TESTING BY USER**
