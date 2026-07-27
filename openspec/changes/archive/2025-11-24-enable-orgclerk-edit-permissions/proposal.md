# Proposal: Enable OrganizationClerk Edit Permissions for Organization Details

**Change ID:** `enable-orgclerk-edit-permissions`
**Status:** Draft
**Created:** 2025-01-24
**Author:** creativecoder

## Why

Currently, the organization details page (`/organization/{orgId}`) does not display the edit actions menu for users with the **OrganizationClerk** role. The edit button and associated actions (Edit, Delete) are only visible to users with the **OrganizationAdmin** role.

According to the **Permission Matrix** in the Lawsome PRD (line 509), **OrganizationClerk** should have permission to **edit organization details** (marked with ✓ in the matrix).

### Current Behavior

1. **OrganizationAdmin users:**
   - Can see the three-dot menu (MoreVert icon) in the organization details card
   - Can click the menu to access "Edit" and "Delete" actions
   - Can edit organization details (name, description, email, phone, segments)

2. **OrganizationClerk users:**
   - Cannot see the three-dot menu at all
   - Cannot access organization edit functionality
   - This contradicts the PRD permission matrix

### Root Cause

In `src/app/organization/[id]/page.tsx`:
- Line 578: The edit menu visibility is controlled by `canManageOrganizationUsers` permission
- In `src/hooks/useUserRole.ts` (line 83): `canManageOrganizationUsers` is defined as `isOrganizationAdmin` only
- This excludes OrganizationClerk from editing organization details

## Design Principle

The system should respect the documented **Permission Matrix** in the PRD. When the PRD explicitly grants a permission to a role, the frontend UI must honor that permission.

**Separation of Concerns:**
- **Organization Details Editing** (name, description, email, phone, segments) is a separate permission from **User Management**
- OrganizationClerk can edit org details but CANNOT manage organization-level users
- The current implementation incorrectly conflates these two permissions

## What Changes

### 1. Add New Permission Flag in `useUserRole` Hook

**File:** `src/hooks/useUserRole.ts`

Add a new permission flag specifically for editing organization details:

```typescript
const canEditOrganizationDetails = isOrganizationAdmin || isOrganizationClerk;
```

This separates "edit organization details" from "manage organization users", which are distinct permissions according to the PRD.

### 2. Update Organization Details Page

**File:** `src/app/organization/[id]/page.tsx`

**Changes:**
1. Import the new `canEditOrganizationDetails` permission from `useUserRole` hook
2. Replace `canManageOrganizationUsers` with `canEditOrganizationDetails` for:
   - Menu visibility (line 578)
   - Save button disabled state (line 557)

**Note:** Delete functionality remains restricted to OrganizationAdmin only (via `canDeleteOrganization()` function which checks for SystemAdmin role).

### 3. UI Behavior After Changes

**OrganizationClerk users will be able to:**
- ✓ See the three-dot menu in organization details card
- ✓ Click "Edit" to enter edit mode
- ✓ Modify organization name, description, email, phone, segments
- ✓ Save changes successfully
- ✗ Delete organization (restricted to SystemAdmin only)

**OrganizationAdmin users will continue to:**
- ✓ Have all edit permissions
- ✓ See delete option in menu (if SystemAdmin)

## Impact Assessment

### User Impact

**Positive:**
- OrganizationClerk users gain the ability to edit organization details as documented in PRD
- Aligns UI behavior with documented permissions
- Reduces dependency on OrganizationAdmin for routine organization updates

**No Negative Impact:**
- OrganizationAdmin permissions remain unchanged
- No existing functionality is removed or restricted
- Backend API already supports this (returns ✓ for OrganizationClerk in permission matrix)

### Technical Impact

**Frontend Changes:**
- 1 hook file modified (`useUserRole.ts`)
- 1 page component modified (`organization/[id]/page.tsx`)
- No breaking changes
- No database migrations required

**Backend Impact:**
- **None** - Backend API already allows OrganizationClerk to edit organization details
- This is purely a frontend permission alignment fix

### Security Impact

**Low Risk:**
- Change aligns frontend with backend permissions (no permission escalation)
- Delete functionality remains restricted to SystemAdmin
- No new attack vectors introduced
- Follows principle of least privilege correctly as per PRD

## Alternatives Considered

### Alternative 1: Keep current behavior and update PRD

**Pros:**
- No code changes needed

**Cons:**
- PRD would be incorrect
- OrganizationClerk would lose documented functionality
- Contradicts the role's purpose (administrative support)

### Alternative 2: Create separate "canEditOrganization" API permission check

**Pros:**
- More explicit permission checking

**Cons:**
- Unnecessary API call overhead
- Backend already validates permissions
- Adds complexity without benefit

**Selected Approach:** Add new frontend permission flag (Original Proposal)

**Reasoning:**
1. Aligns with documented PRD permissions
2. Minimal code changes
3. No API overhead
4. Clear separation of concerns

## Success Criteria

1. OrganizationClerk users can see the edit menu (three-dot icon) on organization details page
2. OrganizationClerk users can click "Edit" and enter edit mode
3. OrganizationClerk users can save changes to organization details
4. Delete option remains hidden from OrganizationClerk (only SystemAdmin can delete)
5. OrganizationAdmin permissions remain unchanged
6. No TypeScript or linting errors
7. Manual testing confirms expected behavior

## Questions & Clarifications

**Q: Should OrganizationClerk be able to delete organizations?**
A: No. The PRD Permission Matrix (line 509) shows ✓ for "Edit org details" but the delete functionality is separate and controlled by SystemAdmin role check (line 306 in page.tsx).

**Q: Will this change affect site editing permissions?**
A: No. Site editing permissions are separate and already correctly implemented. OrganizationClerk already has permission to edit sites per PRD line 514.

**Q: Does backend support this permission?**
A: Yes. The Permission Matrix in the PRD documents the backend API permissions. The backend already allows OrganizationClerk to edit organization details. This is purely a frontend UI fix.

## Dependencies

- None - this is a standalone UI permission alignment

## Risks

**Low Risk:**
- Change is minimal and localized to 2 files
- Aligns with documented requirements
- No breaking changes
- Backend already supports this permission

**Mitigation:**
- Manual testing with OrganizationClerk role before deployment
- Verify OrganizationAdmin permissions remain unchanged
- Confirm delete remains restricted to SystemAdmin
