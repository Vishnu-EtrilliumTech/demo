## Context

The application has a hierarchical structure: **Organization → Sites → Users/Cases**. Site users are mapped via the `SiteUserMap` table, which links users to sites.

**Current Behavior**:
- `SitesController.Delete()` allows deletion if:
  1. User is authorized (OrganizationAdmin or OrganizationClerk)
  2. Site exists
- No check for existing site users
- Frontend displays error toast if backend returns 400

**Related Patterns**:
- `deleteCase` in API already handles 400 errors with backend message extraction
- `deleteSite` in frontend API already extracts error messages from response: `response.data?.errors[0]`
- Backend error format: `{"data":null,"errors":["message"],"meta":{}}`

## Goals / Non-Goals

### Goals
- Prevent site deletion when users are assigned to the site
- Return clear error message indicating how many users exist
- Maintain consistency with existing error handling patterns

### Non-Goals
- Pre-flight user count check (adds extra API call, not needed)
- Cascading delete of users (too dangerous)
- UI changes to show user count before delete (backend validation is sufficient)

## Decisions

### Decision 1: Backend Validation Only

**Rationale**: The backend should be the single source of truth for business rules. Frontend already handles backend errors gracefully. Adding a pre-flight check would:
- Require an extra API call
- Create a race condition window
- Duplicate validation logic

### Decision 2: Error Message Format

**Message**: "Cannot delete site. {N} user(s) are still assigned to this site. Please remove all users before deleting the site."

This follows the pattern used in case deletion: clear, actionable, user-friendly.

### Decision 3: Check SiteUserMap Table

The `SiteUserMap` entity links users to sites. Query: `siteUserMapRepos.GetAllByConditionAsync(m => m.SiteId == siteId)`

If count > 0, return 400 Bad Request.

## Implementation Approach

### Backend Changes (SitesController.cs)

```csharp
// In Delete method, after authorization check and site existence check:

var siteUserMapRepos = repositoryFactory.Create<SiteUserMap>();
var siteUsersResult = await siteUserMapRepos.GetAllByConditionAsync(m => m.SiteId == siteId);

if (siteUsersResult.IsSuccess && siteUsersResult.Data != null && siteUsersResult.Data.Any())
{
    var userCount = siteUsersResult.Data.Count();
    var errorMessage = $"Cannot delete site. {userCount} user(s) are still assigned to this site. Please remove all users before deleting the site.";
    return BadRequestResult([errorMessage]);
}
```

### Frontend Changes (None Required)

The existing `deleteSite` function in `api.ts` already handles 400 responses:

```typescript
if (response.status === 400) {
  const errors = response.data?.errors;
  const errorMessage = (Array.isArray(errors) && errors.length > 0)
    ? errors[0]
    : (response.data?.message || response.data?.error || 'Invalid request. Unable to delete this site.');
  throw new Error(errorMessage);
}
```

And `SiteManagementTab.tsx` displays the error:

```typescript
catch (err) {
  console.error('Error deleting site:', err);
  const errorMessage = err instanceof Error ? err.message : 'Failed to delete site. Please try again.';
  showError(errorMessage);
}
```

## Risks / Trade-offs

### Risk 1: Admin Frustration
If an admin wants to delete a site quickly, they must first remove all users.
- **Mitigation**: Clear error message tells them exactly what to do
- **Mitigation**: Future enhancement could offer "Remove all users and delete" option

### Risk 2: User Count Query Performance
For sites with many users, counting could be slow.
- **Mitigation**: `SiteUserMap` table should be indexed on `SiteId`
- **Mitigation**: Use `Any()` instead of `Count()` if only checking existence (optimization)

## Migration Plan

No data migration required. This is a pure validation addition.

**Testing**:
1. Try to delete a site with users → Should fail with clear error message
2. Remove all users from site → Delete should succeed
3. Delete site with no users → Should succeed (no regression)
