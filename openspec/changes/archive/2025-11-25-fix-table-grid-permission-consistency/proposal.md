# Proposal: Fix Table/Grid Permission Consistency for User and Site Actions

**Change ID:** `fix-table-grid-permission-consistency`
**Status:** Draft
**Created:** 2025-01-25
**Author:** creativecoder

## Why

Permission-based action visibility is inconsistent between grid and table layouts across three views in the application:

1. **Organization Users View** (`/organization/{orgId}#users`): Grid layout correctly hides edit/delete actions from OrganizationClerk (who lacks these permissions per the Permission Matrix), but table layout shows these actions to everyone.

2. **Site Users View** (`/organization/{orgId}/sites/{siteId}#users`): Grid layout correctly applies permission checks, but table layout may have similar inconsistencies.

3. **Sites View** (`/organization/{orgId}#sites`): Grid and table layouts need permission consistency verification for edit/delete actions.

According to the Permission Matrix (PRD line 516-520):
- **OrganizationClerk**: Can view org users but **cannot** edit or delete them
- **OrganizationAdmin**: Can add, view, edit, and delete org users
- **Site users**: Different permissions apply based on roles (SiteAdmin, SiteClerk, etc.)

**Current Behavior:**
- Grid layout: Actions menu (three-dot icon) visibility controlled by `canManageUsers` prop
- Table layout: Actions menu **always visible** regardless of permissions, allowing unauthorized actions

**Root Cause:**
The `UserManagementTab` component passes edit/delete callbacks to `UsersTable` but doesn't pass the permission check functions (`canEditUser`, `canDeleteUser` props). The table component has these props available but they're not being utilized, causing the actions menu to render for all users.

## What Changes

### 1. Fix Organization Users View Permissions

**File:** `src/app/organization/components/UserManagementTab.tsx`

Add permission check functions when rendering `UsersTable`:

```typescript
<UsersTable
  users={filteredUsers}
  onEditUser={handleEditUser}
  onDeleteUser={handleDeleteUser}
  deletingUserId={deletingUserId}
  hideLastLogin
  canEditUser={() => canManageUsers}  // NEW: Pass edit permission
  canDeleteUser={() => canManageUsers}  // NEW: Pass delete permission
/>
```

### 2. Verify Site Users View Permissions

**File:** `src/app/organization/[id]/sites/[siteId]/page.tsx` (lines 1419-1439)

The site users view **already correctly** passes permission checks to `UsersTable`:
- `canEditUser`: Checks `siteCanEditUsers`, `isOrganizationAdmin`, or `isOrganizationClerk` (excluding OrganizationAdmin users)
- `canDeleteUser`: Checks `siteCanDeleteUsers` or `canDeleteSiteUsers`

**Action:** Verify through manual testing that permissions work correctly.

### 3. Verify Sites View Permissions

**File:** `src/app/organization/components/SiteManagementTab.tsx`

Audit the `SitesTable` component (if it exists and has similar table/grid views) to ensure:
- Grid layout uses permission checks for actions menu visibility
- Table layout receives and uses `canEditSite` and `canDeleteSite` permission functions

**Note:** Based on code review, `SitesTable` component doesn't have the same permission prop pattern as `UsersTable`. Verify if this needs fixing.

## Impact Assessment

### User Impact

**Positive:**
- OrganizationClerk users will no longer see edit/delete actions they cannot perform
- Consistent permission enforcement across grid and table layouts
- Prevents confusion and unauthorized action attempts
- Aligns UI behavior with documented Permission Matrix

**Security Impact:**
- **LOW RISK**: This is a UI-only fix; backend API already enforces permissions
- Prevents users from attempting unauthorized actions (which would fail at API level)
- Reduces potential for accidental permission violation attempts

### Technical Impact

**Frontend Changes:**
- 1 component modified (`UserManagementTab.tsx`) - 2 lines added
- 0 breaking changes
- No API or backend changes required

**Affected Views:**
1. Organization users view (grid and table layouts)
2. Site users view (verification only, may already be correct)
3. Sites view (verification required)

## Alternatives Considered

### Alternative 1: Hide entire table view for users without permissions

**Pros:**
- Simpler implementation

**Cons:**
- Removes useful functionality (viewing users in table format)
- OrganizationClerk can view users, just not edit/delete them
- Overly restrictive

### Alternative 2: Add permission checks in UsersTable component internally

**Pros:**
- Self-contained logic within table component

**Cons:**
- UsersTable is a reusable component used in multiple contexts
- Different contexts have different permission requirements
- Parent component should control permissions (separation of concerns)

**Selected Approach:** Pass permission functions as props (Original Proposal)

**Reasoning:**
1. Follows existing component design (props already exist)
2. Maintains component reusability
3. Clear separation of concerns
4. Minimal code changes
5. Consistent with site users view implementation

## Success Criteria

1. OrganizationClerk users do NOT see actions menu (three-dot icon) in organization users table view
2. OrganizationAdmin users continue to see actions menu in both grid and table views
3. Site users view permissions work correctly in both grid and table layouts
4. Sites view permissions work correctly in both grid and table layouts (if applicable)
5. No TypeScript or linting errors
6. Manual testing confirms expected behavior across all three views

## Questions & Clarifications

**Q: Should OrganizationClerk be able to view organization users?**
A: Yes. Per Permission Matrix line 518, OrganizationClerk can "View org users" (✓) but cannot edit or delete them (✗).

**Q: Does backend enforce these permissions?**
A: Yes. The backend API enforces permissions regardless of UI. This fix prevents UI confusion and unauthorized action attempts.

**Q: Are there other views with similar grid/table layout permission issues?**
A: This proposal specifically addresses organization users, site users, and sites views. Other views should be audited in future work if needed.

## Dependencies

- None - this is a standalone UI permission consistency fix

## Risks

**LOW RISK:**
- Change is minimal and localized
- Backend already enforces permissions (defense in depth)
- Existing site users view demonstrates the correct pattern
- No breaking changes or API modifications
