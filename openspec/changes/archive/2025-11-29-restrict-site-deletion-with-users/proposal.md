# Change: Restrict site deletion when users exist

## Why

Currently, the system allows organization admins to delete a site even when users are still assigned to it. This creates data integrity issues:

1. **Orphaned user references**: Site users have cases, tasks, and hearings linked to them. Deleting the site without first removing users can lead to orphaned data or cascading deletes that lose important information.
2. **Accidental data loss**: Admins may not realize users exist in a site before deleting, causing unintended loss of user-related data.
3. **Inconsistent with case deletion**: The system already prevents case deletion when it has dependencies (clients, tasks, etc.). Site deletion should follow the same pattern.

## What Changes

**Backend (SitesController.cs)**:
- Add validation in the `Delete` endpoint to check if the site has any users assigned via `SiteUserMap`
- Return HTTP 400 Bad Request with a clear error message if users exist

**Frontend (SiteManagementTab.tsx)**:
- Display the backend error message in a toast notification
- No pre-flight check needed - rely on backend validation (consistent with existing patterns)
- Optionally show user count in deletion confirmation dialog for awareness

## Impact

- Affected specs: `data-integrity` (adding new requirement for site deletion validation)
- Affected code:
  - Backend: `SitesController.cs` - Add user count check before deletion
  - Frontend: Error handling already exists, will display backend error message
- Security: **IMPROVES** - Prevents accidental data loss
- User Experience: Clear error message guides admin to remove users first
