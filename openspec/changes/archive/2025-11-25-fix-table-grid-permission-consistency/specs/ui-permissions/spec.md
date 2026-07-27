# Specification: UI Permission Consistency Across Layouts

**Capability:** ui-permissions
**Change ID:** fix-table-grid-permission-consistency
**Status:** Draft

## Overview

This specification ensures that permission-based action visibility is consistent across different UI layouts (grid view and table view) for user and site management interfaces. When a user lacks permission to perform an action, the UI MUST NOT display that action regardless of which layout view is selected.

## MODIFIED Requirements

### Requirement: Organization Users Action Visibility

**Description:** The organization users view MUST enforce role-based permissions consistently across both grid and table layouts. Users without edit or delete permissions SHALL NOT see action menus for those operations.

**Rationale:** Permission Matrix (PRD line 516-520) specifies that OrganizationClerk can view organization users but cannot edit or delete them. Only OrganizationAdmin can manage (edit/delete) organization users. The UI must reflect these permissions consistently.

**Acceptance Criteria:**
- OrganizationAdmin users can see edit and delete actions in both grid and table layouts
- OrganizationClerk users can view users but cannot see edit or delete actions in either layout
- Action menu (three-dot icon) is hidden when user has no permitted actions
- Backend API enforces permissions regardless of UI (defense in depth)

#### Scenario: OrganizationClerk views organization users in grid layout

**Given:**
- User is authenticated with OrganizationClerk role
- User navigates to `/organization/{orgId}#users` page
- Grid layout is selected

**When:**
- Page renders user cards in grid layout

**Then:**
- User cards display user information (name, email, phone, roles, status)
- Three-dot actions menu icon is NOT visible on any user card
- No edit or delete buttons are accessible
- Hovering over cards does not reveal hidden action buttons

**Validation:**
- DOM inspection confirms no action menu elements are rendered
- No JavaScript errors in console
- Backend API permissions remain enforced

#### Scenario: OrganizationClerk views organization users in table layout

**Given:**
- User is authenticated with OrganizationClerk role
- User navigates to `/organization/{orgId}#users` page
- Table layout is selected (user clicked table view toggle)

**When:**
- Page renders users in table layout

**Then:**
- Table displays user information in rows (name, email, roles, registered date)
- Actions column exists but shows no action buttons
- Three-dot actions menu icon is NOT visible in any table row
- Clicking on user rows does not open edit/delete menus

**Validation:**
- UsersTable component receives `canEditUser` and `canDeleteUser` props
- Props are evaluated as `false` for OrganizationClerk
- No action menu is rendered when permissions are false
- Table remains functional for viewing data only

#### Scenario: OrganizationAdmin views organization users in grid layout

**Given:**
- User is authenticated with OrganizationAdmin role
- User navigates to `/organization/{orgId}#users` page
- Grid layout is selected

**When:**
- Page renders user cards in grid layout

**Then:**
- User cards display user information
- Three-dot actions menu icon IS visible in top-right corner of each card
- Clicking the icon opens a menu with "Edit" and "Delete" options
- Edit action navigates to edit page
- Delete action opens confirmation modal

**Validation:**
- `canManageUsers` permission evaluates to `true`
- Action menu renders correctly
- Edit and delete actions work as expected

#### Scenario: OrganizationAdmin views organization users in table layout

**Given:**
- User is authenticated with OrganizationAdmin role
- User navigates to `/organization/{orgId}#users` page
- Table layout is selected

**When:**
- Page renders users in table layout

**Then:**
- Table displays user information in rows
- Actions column contains three-dot menu icon for each user
- Clicking the icon opens a menu with "Edit" and "Delete" options
- Actions function identically to grid layout

**Validation:**
- UsersTable component receives `canEditUser={() => true}` and `canDeleteUser={() => true}`
- Action menu renders in each table row
- Edit and delete actions work correctly
- No permission-related errors occur

### Requirement: Site Users Action Visibility

**Description:** The site users view MUST enforce role-based permissions consistently across both grid and table layouts. Permission checks SHALL consider site-level roles (SiteAdmin, SiteClerk, SiteSrLegalExpert, SiteLegalExpert) and organization-level roles.

**Rationale:** Permission Matrix (PRD line 521-524) specifies complex permission rules:
- SiteAdmin: Can edit and delete site users
- SiteClerk: Cannot edit or delete site users
- SiteSrLegalExpert: Can edit site users, cannot delete
- SiteLegalExpert: Can edit site users, cannot delete
- OrganizationAdmin: Can edit site users, can delete
- OrganizationClerk: Can edit non-admin site users, cannot delete

**Acceptance Criteria:**
- Site-level permissions are correctly evaluated for each role
- Organization-level permissions override site-level when appropriate
- Action visibility matches permission matrix exactly
- Grid and table layouts show identical permissions

#### Scenario: SiteAdmin views site users in table layout

**Given:**
- User is authenticated with SiteAdmin role for the current site
- User navigates to `/organization/{orgId}/sites/{siteId}#users`
- Table layout is selected

**When:**
- UsersTable component renders with site users

**Then:**
- Table displays all site users
- Actions menu IS visible for all users
- Menu contains both "Edit" and "Delete" options
- Both actions are functional

**Validation:**
- `canEditUser` prop evaluates to `true` (via `siteCanEditUsers`)
- `canDeleteUser` prop evaluates to `true` (via `siteCanDeleteUsers`)
- Action menu renders correctly
- Backend enforces permissions on action execution

#### Scenario: SiteClerk views site users in table layout

**Given:**
- User is authenticated with SiteClerk role for the current site
- User navigates to `/organization/{orgId}/sites/{siteId}#users`
- Table layout is selected

**When:**
- UsersTable component renders with site users

**Then:**
- Table displays all site users
- Actions column is empty (no menu icon)
- No edit or delete actions are accessible

**Validation:**
- `canEditUser` prop evaluates to `false`
- `canDeleteUser` prop evaluates to `false`
- Action menu does NOT render
- Permission Matrix line 523 is correctly enforced

#### Scenario: SiteLegalExpert views site users in table layout

**Given:**
- User is authenticated with SiteLegalExpert role
- User navigates to `/organization/{orgId}/sites/{siteId}#users`
- Table layout is selected

**When:**
- UsersTable component renders with site users

**Then:**
- Table displays all site users
- Actions menu IS visible
- Menu contains "Edit" option only (no Delete)
- Edit action is functional

**Validation:**
- `canEditUser` prop evaluates to `true` (via `siteCanEditUsers` includes SiteLegalExpert)
- `canDeleteUser` prop evaluates to `false`
- Only edit menu item renders
- Permission Matrix line 523 is correctly enforced

#### Scenario: OrganizationClerk views site users and attempts to edit OrganizationAdmin

**Given:**
- User is authenticated with OrganizationClerk role
- User navigates to `/organization/{orgId}/sites/{siteId}#users`
- Site users list includes a user with OrganizationAdmin role
- Table layout is selected

**When:**
- UsersTable component evaluates permissions for each user

**Then:**
- For users WITHOUT OrganizationAdmin role: Actions menu IS visible with "Edit" option
- For users WITH OrganizationAdmin role: Actions menu is NOT visible
- OrganizationClerk cannot edit other organization admins

**Validation:**
- `canEditUser` function checks `!user.roles?.includes('OrganizationAdmin')` for OrganizationClerk
- Permission logic correctly prevents editing higher-privileged users
- This implements security best practice (privilege escalation prevention)

### Requirement: Sites Action Visibility

**Description:** The sites view MUST enforce role-based permissions consistently across both grid and table layouts for site management actions (edit and delete).

**Rationale:** Permission Matrix (PRD line 514-515) specifies:
- OrganizationClerk: Can edit sites, cannot delete sites
- OrganizationAdmin: Can edit sites, can delete sites
- Site-level roles (SiteAdmin, SiteClerk): Can edit assigned sites only, cannot delete

**Acceptance Criteria:**
- OrganizationClerk can edit sites but not delete them
- OrganizationAdmin can both edit and delete sites
- Site-level roles have appropriate edit permissions
- Permissions are consistent across grid and table layouts

#### Scenario: OrganizationClerk views sites in grid layout

**Given:**
- User is authenticated with OrganizationClerk role
- User navigates to `/organization/{orgId}#sites`
- Grid layout is selected

**When:**
- Page renders site cards in grid layout

**Then:**
- Site cards display site information (name, location, contact)
- Three-dot actions menu icon IS visible on each site card
- Clicking the icon opens a menu with "Edit" option only
- "Delete" option is NOT present in the menu
- Edit action navigates to site edit page

**Validation:**
- `canEditSites` permission evaluates to `true` for OrganizationClerk
- `canDeleteSites` permission evaluates to `false`
- Action menu renders with edit only
- Permission Matrix line 514 is correctly enforced

#### Scenario: OrganizationClerk views sites in table layout

**Given:**
- User is authenticated with OrganizationClerk role
- User navigates to `/organization/{orgId}#sites`
- Table layout is selected

**When:**
- SitesTable component renders (if table layout exists)

**Then:**
- Table displays sites information in rows
- Actions column contains three-dot menu icon for each site
- Clicking the icon opens a menu with "Edit" option only
- "Delete" option is NOT present
- Permission behavior matches grid layout exactly

**Validation:**
- If SitesTable component has permission props, they are correctly passed
- If not, component internally respects `canEditSites` and `canDeleteSites` context
- Table and grid layouts show identical permissions
- No permission inconsistencies exist

#### Scenario: OrganizationAdmin views sites in both layouts

**Given:**
- User is authenticated with OrganizationAdmin role
- User navigates to `/organization/{orgId}#sites`

**When:**
- User toggles between grid and table layouts

**Then:**
- In both layouts, actions menu contains "Edit" and "Delete" options
- Both actions are fully functional
- Permission behavior is identical across layouts

**Validation:**
- `canEditSites` evaluates to `true`
- `canDeleteSites` evaluates to `true`
- Both actions appear in menu in both layouts
- Permission Matrix line 514-515 is correctly enforced

## ADDED Requirements

### Requirement: Permission Prop Pattern for Table Components

**Description:** All table components that display actionable items (users, sites, cases) MUST accept `canEditItem` and `canDeleteItem` permission check functions as optional props to control action visibility.

**Rationale:** Table components are reusable across different contexts with different permission requirements. Permission logic should be controlled by the parent component that understands the user's role and the specific permission rules for that context. This follows separation of concerns and component reusability principles.

**Acceptance Criteria:**
- Table components define TypeScript interfaces with optional permission props
- Permission props are function types: `(item: T) => boolean`
- Default behavior when props are omitted: show all actions (backward compatible)
- When props are provided, action visibility is controlled by function return value
- Action menu is hidden entirely when no actions are permitted

#### Scenario: UsersTable component receives permission props

**Given:**
- Parent component renders `UsersTable` with permission functions
- `canEditUser` prop is provided as `(user) => userHasEditPermission(user)`
- `canDeleteUser` prop is provided as `(user) => userHasDeletePermission(user)`

**When:**
- UsersTable renders each user row

**Then:**
- For each user, permission functions are called with user object as parameter
- If both functions return `false`, no action menu is rendered for that row
- If `canEditUser` returns `true` and `canDeleteUser` returns `false`, menu shows only "Edit"
- If both return `true`, menu shows both "Edit" and "Delete"
- Menu rendering logic correctly evaluates permissions per user

**Validation:**
- TypeScript types enforce correct function signatures
- Permission functions are called for each table row
- Action menu rendering logic respects permission function return values
- No actions are rendered when all permissions are false

#### Scenario: UsersTable component without permission props (backward compatibility)

**Given:**
- Parent component renders `UsersTable` without providing permission props
- `canEditUser` and `canDeleteUser` are undefined

**When:**
- UsersTable renders user rows

**Then:**
- All action menus are visible (default behavior)
- Both "Edit" and "Delete" options appear for all users
- Existing usage is not broken

**Validation:**
- Undefined permission props default to allowing all actions
- Backward compatibility is maintained
- Existing implementations continue to work

## Implementation Notes

### Files to Modify

1. **`src/app/organization/components/UserManagementTab.tsx`** (lines 367-376)
   - Add `canEditUser={() => canManageUsers}` prop to `UsersTable` component
   - Add `canDeleteUser={() => canManageUsers}` prop to `UsersTable` component

2. **`src/app/organization/[id]/sites/[siteId]/page.tsx`** (lines 1419-1439)
   - Already correctly implemented - verify through testing
   - No code changes needed unless testing reveals issues

3. **`src/app/organization/components/SiteManagementTab.tsx`**
   - Audit `SitesTable` component rendering
   - If table layout exists and lacks permission props, add them similar to UserManagementTab

### Permission Logic Reference

**Organization Users:**
```typescript
canManageUsers = isOrganizationAdmin  // line 83 in useUserRole.ts
```

**Site Users:**
```typescript
canEditUser = (user) => {
  if (siteCanEditUsers) return true;  // SiteAdmin, SiteSrLegal, SiteLegal
  if (isOrganizationAdmin) return true;
  if (isOrganizationClerk && !user.roles?.includes('OrganizationAdmin')) return true;
  return false;
}

canDeleteUser = () => siteCanDeleteUsers || canDeleteSiteUsers
// siteCanDeleteUsers = isSiteAdmin (line 96)
// canDeleteSiteUsers = isOrganizationAdmin (line 91)
```

**Sites:**
```typescript
canEditSites = isOrganizationAdmin || isOrganizationClerk || isSiteAdmin || isSiteClerk  // line 88
canDeleteSites = isOrganizationAdmin  // line 87
```

## Cross-References

- **Related PRD Section:** Section 3.4 - Permission Matrix (lines 501-549)
- **Permission Hook:** `src/hooks/useUserRole.ts`
- **Backend Permission Docs:** `C:\Users\LENOVO\sabari\codebase\Lawsome\Docs\API_Permissions_Matrix.md`

## Compliance

This specification ensures:
- **Permission Matrix Alignment:** UI behavior matches documented permissions exactly
- **Consistency:** Same permissions apply regardless of layout (grid or table)
- **Security:** Defense in depth - UI prevents unauthorized attempts, backend enforces
- **Usability:** Clear, predictable behavior across all views and layouts
