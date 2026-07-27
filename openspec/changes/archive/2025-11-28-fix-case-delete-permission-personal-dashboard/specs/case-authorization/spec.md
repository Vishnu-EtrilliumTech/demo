## ADDED Requirements

### Requirement: Case Delete Actions Must Be Restricted by Role

**Description:** Delete action buttons for cases MUST only be visible and actionable by users with roles that have case deletion permissions according to the API Permissions Matrix. The system SHALL enforce role-based access control to ensure that SiteLegalExpert and SiteSrLegalExpert users cannot see or attempt to delete cases, as they lack the necessary permissions.

**Rationale:**
1. **Security and compliance**: Legal case data is critical and deletion must be restricted to administrative roles
2. **Principle of least privilege**: Legal experts need to work with cases but should not have destructive permissions
3. **Consistency with backend**: Frontend must match backend API permissions to prevent confusing error scenarios
4. **User experience**: Displaying non-functional delete buttons creates frustration when actions fail silently

According to the documented permission matrix:
- **Can delete cases**: SystemAdmin, OrgAdmin, SiteAdmin, SiteClerk
- **Cannot delete cases**: SiteLegalExpert, SiteSrLegalExpert

**Acceptance Criteria:**
- Delete button in case actions menu is visible only when `canDeleteCases` permission is true
- `canDeleteCases` permission evaluates to true for: SystemAdmin, OrgAdmin, SiteAdmin, SiteClerk
- `canDeleteCases` permission evaluates to false for: SiteLegalExpert, SiteSrLegalExpert
- Three-dot menu icon remains visible if other actions (Edit) are available to the user
- Three-dot menu icon is hidden when no actions are available to the user
- Edit button remains visible to all users with `canEditCases` permission (includes legal experts)
- Authorization check applies consistently across all case management interfaces:
  - Personal dashboard (`/organization/{orgId}/sites/{siteId}/users/{userId}`)
  - Site dashboard (`/organization/{orgId}/sites/{siteId}`)
  - Organization dashboard (`/organization/{orgId}`)

---

#### Scenario: SiteAdmin views cases on personal dashboard

**Given:**
- User is logged in as SiteAdmin (has `canDeleteCases: true` and `canEditCases: true`)
- User is viewing their personal dashboard at `/organization/91/sites/162/users/3674`
- Case list displays multiple cases assigned to or created by the user

**When:**
- Personal dashboard renders the cases table
- `useUserRole` hook evaluates user roles and returns `canDeleteCases: true`
- Cases table component checks `canDeleteCases` before rendering delete menu item

**Then:**
- Three-dot menu icon appears next to each case
- Clicking the menu reveals both "Edit" and "Delete" options
- Delete option is styled in red (#dc2626) to indicate destructive action
- User can successfully click Delete to remove a case
- Confirmation modal may appear before deletion (implementation detail)

**Validation:**
- Log in as SiteAdmin user
- Navigate to personal dashboard
- Inspect DOM: verify IconButton with MoreVertIcon is rendered for each case row
- Click menu: verify MenuItem elements exist for both Edit and Delete
- Verify delete functionality works correctly

---

#### Scenario: SiteLegalExpert views cases on personal dashboard

**Given:**
- User is logged in as SiteLegalExpert (has `canDeleteCases: false` but `canEditCases: true`)
- User is viewing their personal dashboard at `/organization/91/sites/162/users/3674`
- Case list displays cases the user is working on

**When:**
- Personal dashboard renders the cases table
- `useUserRole` hook evaluates user roles and returns `canDeleteCases: false`
- Cases table component checks `canDeleteCases` and conditionally hides delete menu item
- Edit action is still available because `canEditCases: true`

**Then:**
- Three-dot menu icon appears next to each case (because Edit is available)
- Clicking the menu reveals only "Edit" option
- Delete option is NOT present in the menu
- User can successfully click Edit to modify case details
- User cannot see or attempt case deletion

**Validation:**
- Log in as SiteLegalExpert user
- Navigate to personal dashboard at `/organization/{orgId}/sites/{siteId}/users/{userId}`
- Inspect DOM: verify IconButton with MoreVertIcon is rendered
- Click menu: verify only one MenuItem element exists (Edit)
- Verify no Delete MenuItem is present
- Verify Edit functionality works correctly

---

#### Scenario: SiteSrLegalExpert views cases on personal dashboard

**Given:**
- User is logged in as SiteSrLegalExpert (has `canDeleteCases: false` but `canEditCases: true`)
- User is viewing their personal dashboard
- Senior legal experts have elevated privileges but still cannot delete cases

**When:**
- Personal dashboard renders the cases table
- `useUserRole` hook evaluates roles and returns `canDeleteCases: false`
- Menu rendering logic excludes the delete MenuItem

**Then:**
- Three-dot menu icon appears (Edit is available)
- Menu displays only "Edit" option
- No Delete option is visible
- Behavior is identical to SiteLegalExpert (no special deletion privileges for senior role)

**Validation:**
- Log in as SiteSrLegalExpert user
- Verify menu structure matches SiteLegalExpert scenario
- Confirm senior role does not grant case deletion permission
- Verify permission matrix is consistently enforced

---

#### Scenario: SiteClerk views cases on personal dashboard

**Given:**
- User is logged in as SiteClerk (has both `canDeleteCases: true` and `canEditCases: true`)
- Site clerks have administrative permissions including case deletion

**When:**
- Personal dashboard renders the cases table
- `useUserRole` hook returns `canDeleteCases: true`

**Then:**
- Three-dot menu icon appears
- Menu displays both "Edit" and "Delete" options
- Delete option is available and functional
- Clerk can delete cases as part of their administrative duties

**Validation:**
- Log in as SiteClerk user
- Verify both Edit and Delete options are present
- Verify delete functionality works
- Confirm clerks have equivalent deletion permissions to admins

---

#### Scenario: Menu visibility when only Edit is available

**Given:**
- User is SiteLegalExpert with `canEditCases: true` and `canDeleteCases: false`
- Cases table has conditional menu rendering logic

**When:**
- Component evaluates available actions
- At least one action (Edit) is available

**Then:**
- Three-dot menu icon IS displayed
- Menu contains only the Edit option
- Icon remains visible to indicate available actions
- UI is clean and intuitive (menu icon only appears when actions exist)

**Validation:**
- Verify menu icon is present when Edit is available
- Verify menu is not empty
- Confirm good UX: icon presence indicates actionable items

---

#### Scenario: Permission consistency across all dashboards

**Given:**
- User is SiteLegalExpert
- User accesses cases from three different interfaces:
  1. Personal dashboard (`/organization/{orgId}/sites/{siteId}/users/{userId}`)
  2. Site dashboard (`/organization/{orgId}/sites/{siteId}`)
  3. Case detail view (`/organization/{orgId}/sites/{siteId}/cases/{caseId}`)

**When:**
- Each interface uses `useUserRole` hook to check `canDeleteCases`
- All interfaces implement the same authorization logic

**Then:**
- Delete button is hidden in all three interfaces
- Edit button is visible in all three interfaces
- User experiences consistent behavior regardless of entry point
- No confusion from inconsistent permission enforcement

**Validation:**
- Test same user role across all case management interfaces
- Verify permission checks are uniform
- Confirm no interface leaks delete actions to unauthorized roles
- Code review: verify all case tables use `canDeleteCases` permission

---

#### Scenario: Backend API rejects unauthorized delete attempts

**Given:**
- Frontend bug allows SiteLegalExpert to see delete button (current bug state)
- User clicks Delete and API request is sent
- Backend enforces permission matrix correctly

**When:**
- DELETE request reaches `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}`
- Backend validates user's role against permission matrix
- SiteLegalExpert role lacks delete permission (marked ❌ in matrix)

**Then:**
- Backend returns 403 Forbidden error
- Frontend displays error message (or fails silently in current bug)
- Case is NOT deleted
- User is confused why button was visible but action failed

**Validation:**
- This scenario demonstrates the current problem
- Frontend fix will prevent this scenario by hiding the button
- Backend security remains as defense-in-depth (frontend is not trusted)

---

### Requirement: Permission Checks Must Use Centralized Role Evaluation

**Description:** All case action authorization checks MUST use the `canDeleteCases` permission flag provided by the `useUserRole` hook rather than implementing custom role checks inline. This ensures consistency and maintainability across all case management interfaces.

**Rationale:**
1. **Single source of truth**: Role logic is centralized in `useUserRole` hook
2. **Consistency**: All components use the same permission evaluation
3. **Maintainability**: Permission changes only require updating the hook
4. **Testability**: Easier to test and verify permission logic

**Acceptance Criteria:**
- Personal dashboard uses `canDeleteCases` from `useUserRole` hook
- No inline role checks like `if (role === 'SiteAdmin' || role === 'OrgAdmin')`
- Permission hook is properly imported and utilized
- Hook receives correct `organizationId` parameter

---

#### Scenario: Personal dashboard uses centralized permission hook

**Given:**
- Personal dashboard component imports and uses `useUserRole` hook
- Hook is called with correct `organizationId` parameter
- Hook returns permission flags including `canDeleteCases`

**When:**
- Component renders cases table with action menu
- Component references `canDeleteCases` to conditionally render delete MenuItem

**Then:**
- Delete menu item is conditionally rendered: `{canDeleteCases && <MenuItem>Delete</MenuItem>}`
- No custom role evaluation logic exists in the component
- Permission logic is delegated to the centralized hook

**Validation:**
- Code review: verify `useUserRole` is imported and called
- Code review: verify `canDeleteCases` is destructured from hook return
- Code review: verify no inline role checks exist
- Verify component receives permission updates when roles change

---

#### Scenario: Permission hook correctly evaluates role combinations

**Given:**
- `useUserRole` hook receives `organizationId: "91"`
- User has roles: `["SiteLegalExpert"]`

**When:**
- Hook evaluates: `canDeleteCases = isOrganizationAdmin || isSiteAdmin || isSiteClerk`
- All three conditions are false

**Then:**
- Hook returns `canDeleteCases: false`
- Component correctly hides delete button
- Role evaluation is accurate and follows permission matrix

**Validation:**
- Unit test `useUserRole` with various role combinations
- Verify matrix alignment:
  - OrgAdmin → canDeleteCases: true
  - SiteAdmin → canDeleteCases: true
  - SiteClerk → canDeleteCases: true
  - SiteLegalExpert → canDeleteCases: false
  - SiteSrLegalExpert → canDeleteCases: false
