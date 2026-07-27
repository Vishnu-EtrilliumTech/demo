# Change: Fix Case Delete Permission on Personal Dashboard

## Why

The personal dashboard (`/organization/{orgId}/sites/{siteId}/users/{userId}`) incorrectly displays the "Delete Case" action button to Legal Expert and Sr. Legal Expert users. According to the permission matrix documented in `API_Permissions_Matrix.md`, only SystemAdmin, OrgAdmin, SiteAdmin, and SiteClerk roles have permission to delete cases. Legal experts (SiteLegalExpert and SiteSrLegalExpert) should only be able to view and edit cases, not delete them.

This is a security issue that violates the principle of least privilege and creates inconsistency with the backend API permissions, which correctly reject delete requests from legal expert roles.

## What Changes

- Fix the personal dashboard cases table to hide the "Delete Case" menu item for Legal Expert and Sr. Legal Expert users
- Ensure that the existing `canDeleteCases` permission from `useUserRole` hook is properly utilized to control delete action visibility
- Maintain consistency with other dashboards (site dashboard, org dashboard) that already implement this permission check correctly

## Impact

- Affected specs: `case-authorization` (new capability)
- Affected code:
  - `src/app/organization/[id]/sites/[siteId]/users/[userId]/page.tsx` (personal dashboard) - lines 1330-1347
  - Uses existing `useUserRole` hook which already provides `canDeleteCases` permission (line 92 in `useUserRole.ts`)
- User impact: Legal Expert and Sr. Legal Expert users will no longer see the delete button on their personal dashboard, preventing confusion when the delete action fails silently
- Breaking change: **NO** - This fixes incorrect behavior to match documented permissions
