# Specification: Organization Edit Permissions

**Capability:** organization-permissions
**Change ID:** enable-orgclerk-edit-permissions
**Status:** Draft

## Overview

This specification defines the permissions for editing organization details in the Lawsome platform. It clarifies which user roles can view and modify organization information through the web UI.

## MODIFIED Requirements

### Requirement ORG-PERM-001: OrganizationClerk Edit Access

**Description:** OrganizationClerk users must be able to edit organization details through the UI.

**Rationale:** The Permission Matrix in the PRD (line 509) explicitly grants "Edit org details" permission to OrganizationClerk role. The UI must honor this documented permission to maintain consistency between documentation and implementation.

**Acceptance Criteria:**
- OrganizationClerk users can access the edit menu on the organization details page
- OrganizationClerk users can modify organization name, description, email, phone, and segments
- Changes made by OrganizationClerk users are successfully saved to the backend
- OrganizationClerk users cannot delete organizations (restricted to SystemAdmin)

#### Scenario: OrganizationClerk views organization details page

**Given:**
- User is authenticated with OrganizationClerk role
- User navigates to `/organization/{orgId}` page

**When:**
- Page loads and displays organization details card

**Then:**
- Three-dot menu icon (MoreVert) is visible in the top-right corner of organization details card
- User can click the menu icon
- Menu displays "Edit" option
- Menu does NOT display "Delete" option

**Validation:**
- Menu visibility matches OrganizationAdmin behavior
- UI element inspection confirms icon is clickable
- No console errors appear

#### Scenario: OrganizationClerk enters edit mode

**Given:**
- User is authenticated with OrganizationClerk role
- User is on organization details page
- Three-dot menu is visible

**When:**
- User clicks the three-dot menu icon
- User clicks "Edit" option from the menu

**Then:**
- Organization details card enters edit mode
- All editable fields are displayed as input controls:
  - Organization Name (text input)
  - Description (textarea)
  - Email (text input)
  - Phone (text input)
  - Segments (multi-select dropdown)
- "Save Changes" button is enabled (not disabled)
- "Cancel" button is visible

**Validation:**
- Form inputs are interactive and can accept user input
- Save button is not greyed out
- No permission error messages appear

#### Scenario: OrganizationClerk saves organization changes

**Given:**
- User is authenticated with OrganizationClerk role
- Organization details card is in edit mode
- User has modified one or more fields (e.g., changed organization name)

**When:**
- User clicks "Save Changes" button

**Then:**
- PUT request is sent to `/api/v1/organizations/{orgId}` endpoint
- API responds with success status (200 or 204)
- Success message is displayed to user
- Form exits edit mode
- Updated values are displayed in read-only view
- Changes persist after page reload

**Validation:**
- Network tab shows successful API call (no 403 Forbidden)
- Database reflects the updated organization details
- No error messages appear in UI or console

#### Scenario: OrganizationClerk cancels edit operation

**Given:**
- User is authenticated with OrganizationClerk role
- Organization details card is in edit mode
- User has modified fields but not saved

**When:**
- User clicks "Cancel" button

**Then:**
- Form exits edit mode
- All changes are discarded
- Original values are displayed
- No API calls are made

**Validation:**
- Form returns to read-only state
- Modified values are not saved
- No network requests occur

### Requirement ORG-PERM-002: Delete Restriction for OrganizationClerk

**Description:** OrganizationClerk users must NOT be able to delete organizations.

**Rationale:** Organization deletion is a destructive operation that should only be performed by system administrators. The PRD permission matrix does not grant delete permissions to OrganizationClerk.

**Acceptance Criteria:**
- Delete option is NOT visible in the menu for OrganizationClerk users
- OrganizationClerk cannot access delete functionality through any UI path
- Only SystemAdmin role can see and execute delete operation

#### Scenario: OrganizationClerk views action menu

**Given:**
- User is authenticated with OrganizationClerk role
- User is on organization details page

**When:**
- User clicks the three-dot menu icon

**Then:**
- Menu displays "Edit" option only
- Menu does NOT display "Delete" option
- No delete-related UI elements are accessible

**Validation:**
- Menu inspection confirms delete option is absent
- Attempting to manually trigger delete (via console) is prevented
- Backend enforces authorization regardless of UI

#### Scenario: SystemAdmin views action menu

**Given:**
- User is authenticated with SystemAdmin role
- User is on organization details page

**When:**
- User clicks the three-dot menu icon

**Then:**
- Menu displays both "Edit" and "Delete" options
- Delete option is clearly visible and accessible

**Validation:**
- Menu contains delete option for authorized users
- Delete functionality works as expected for SystemAdmin

### Requirement ORG-PERM-003: OrganizationAdmin Edit Access Unchanged

**Description:** OrganizationAdmin users must retain all existing edit and delete permissions.

**Rationale:** Extending edit permissions to OrganizationClerk should not reduce OrganizationAdmin capabilities. This ensures no regression for existing admin users.

**Acceptance Criteria:**
- OrganizationAdmin can edit organization details (same as before)
- OrganizationAdmin with SystemAdmin role can delete organizations (same as before)
- No changes to OrganizationAdmin user experience

#### Scenario: OrganizationAdmin edits organization details

**Given:**
- User is authenticated with OrganizationAdmin role
- User is on organization details page

**When:**
- User accesses the edit menu and enters edit mode
- User modifies organization details
- User saves changes

**Then:**
- Edit functionality works identically to previous behavior
- All fields can be edited
- Changes are saved successfully
- No permission errors occur

**Validation:**
- Existing OrganizationAdmin workflows are not disrupted
- No regression in admin functionality

### Requirement ORG-PERM-004: Site-Level Roles Cannot Edit Organization

**Description:** Users with only site-level roles (SiteAdmin, SiteClerk, SiteLegalExpert, SiteSrLegalExpert) must NOT be able to edit organization details.

**Rationale:** Organization editing requires organization-level permissions. Site-level roles are scoped to their assigned site and should not have cross-organization privileges.

**Acceptance Criteria:**
- Edit menu is NOT visible to site-level roles
- Organization details are displayed in read-only mode for site-level roles
- Attempting to access edit endpoints directly is prevented by backend

#### Scenario: SiteAdmin views organization details page

**Given:**
- User is authenticated with SiteAdmin role (no OrganizationAdmin or OrganizationClerk role)
- User navigates to organization details page

**When:**
- Page loads and displays organization details

**Then:**
- Three-dot menu icon is NOT visible
- Organization details are displayed in read-only mode
- No edit controls are accessible

**Validation:**
- UI confirms read-only state for site-level users
- Menu element is not rendered in DOM
- Backend rejects unauthorized edit attempts

## ADDED Requirements

### Requirement ORG-PERM-005: Permission Hook Separation

**Description:** The frontend permission system must distinguish between "edit organization details" and "manage organization users" permissions.

**Rationale:** These are separate capabilities that should be controlled independently. OrganizationClerk can edit org details but cannot manage org users. Conflating these permissions creates incorrect access control.

**Acceptance Criteria:**
- `useUserRole` hook exports distinct permission flags:
  - `canEditOrganizationDetails`: true for OrganizationAdmin and OrganizationClerk
  - `canManageOrganizationUsers`: true for OrganizationAdmin only
- Frontend components use the appropriate permission flag based on the action being performed

#### Scenario: useUserRole hook returns correct permissions for OrganizationClerk

**Given:**
- User is authenticated with OrganizationClerk role (no OrganizationAdmin role)
- `useUserRole` hook is called with valid organizationId

**When:**
- Hook evaluates user permissions

**Then:**
- `canEditOrganizationDetails` returns `true`
- `canManageOrganizationUsers` returns `false`
- `isOrganizationClerk` returns `true`
- `isOrganizationAdmin` returns `false`

**Validation:**
- Hook correctly separates edit and user management permissions
- TypeScript types correctly reflect the return value
- No undefined or null values are returned

#### Scenario: useUserRole hook returns correct permissions for OrganizationAdmin

**Given:**
- User is authenticated with OrganizationAdmin role
- `useUserRole` hook is called with valid organizationId

**When:**
- Hook evaluates user permissions

**Then:**
- `canEditOrganizationDetails` returns `true`
- `canManageOrganizationUsers` returns `true`
- `isOrganizationAdmin` returns `true`
- `isOrganizationClerk` returns `false`

**Validation:**
- OrganizationAdmin has both permissions
- All permission flags return expected boolean values

#### Scenario: useUserRole hook returns correct permissions for site-level roles

**Given:**
- User is authenticated with SiteAdmin role (no organization-level roles)
- `useUserRole` hook is called with valid organizationId

**When:**
- Hook evaluates user permissions

**Then:**
- `canEditOrganizationDetails` returns `false`
- `canManageOrganizationUsers` returns `false`
- `isSiteAdmin` returns `true`
- `isOrganizationAdmin` returns `false`
- `isOrganizationClerk` returns `false`

**Validation:**
- Site-level roles do not receive organization edit permissions
- Hook correctly identifies site-level vs organization-level roles

## Implementation Notes

### Files to Modify

1. **`src/hooks/useUserRole.ts`**
   - Add `canEditOrganizationDetails` constant
   - Export in return statement
   - Add JSDoc documentation

2. **`src/app/organization/[id]/page.tsx`**
   - Import `canEditOrganizationDetails` from `useUserRole`
   - Replace `canManageOrganizationUsers` with `canEditOrganizationDetails` for:
     - Menu visibility check (line ~578)
     - Save button disabled state (line ~557)

### Backend Validation

- Backend API already enforces these permissions correctly
- No backend changes required
- Frontend must align with backend permission model

### Testing Focus

- Permission matrix compliance
- Role-based UI rendering
- API authorization enforcement
- No permission escalation
- Backward compatibility for OrganizationAdmin

## Cross-References

- **Related PRD Section:** Section 4.2.2 - Edit Organization Details (lines 707-740)
- **Permission Matrix:** Section 3.4 - Permission Matrix (line 509)
- **Backend Permission Docs:** `C:\Users\LENOVO\sabari\codebase\Lawsome\Docs\API_Permissions_Matrix.md`

## Compliance

This specification ensures:
- **PRD Alignment:** UI behavior matches documented Permission Matrix
- **Principle of Least Privilege:** Each role has appropriate permissions, no more
- **Role Separation:** Edit organization details is distinct from user management
- **Backward Compatibility:** Existing OrganizationAdmin workflows unchanged
