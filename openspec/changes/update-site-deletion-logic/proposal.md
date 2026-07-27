# Change: Update Site Deletion Logic to Allow Cascade Delete for Org-Level Users

## Why
Currently, the site deletion endpoint (`DELETE /api/v1/organizations/{orgId}/sites/{siteId}`) blocks deletion if **any** users are in the `site_user_map` table, including org-level users (OrganizationAdmin, OrganizationClerk) who have implicit access to all sites anyway via `OrganizationUserMap`. This is overly restrictive.

The error message "Cannot delete site. {userCount} user(s) are still assigned to this site. Please remove all users before deleting the site." should only appear when **site-level users** (SiteAdmin, SiteClerk, SiteLegalExpert, SiteSrLegalExpert, SiteCaseClient) are assigned.

## What Changes

### Backend (SitesController.cs)
1. Modify the deletion check to distinguish between org-level and site-level users in `site_user_map`
2. **Block deletion only if site-level users exist** (SiteAdmin, SiteClerk, SiteLegalExpert, SiteSrLegalExpert) in `site_user_map`
3. **Allow deletion if only org-level users exist** (OrganizationAdmin, OrganizationClerk) - automatically clean up their `site_user_map` entries
4. Implement cascade deletion for all site-related entities:
   - `SiteUserMap` entries (for org-level users only)
   - `SiteCaseMap` entries
   - `Case` records and all nested entities:
     - `CaseClient`
     - `CaseTask` (and `CaseTaskComment`, `CaseTaskDocument`)
     - `CaseComment`
     - `CaseDocument`
     - `CaseHearing`
     - `CaseInvoice`
     - `LegalExpertCaseMap`

### Logic Flow
```
DELETE /api/v1/organizations/{orgId}/sites/{siteId}

1. Validate user authorization (must be OrgAdmin)
2. Validate site exists and belongs to organization
3. Get all users in site_user_map for this site
4. Check each user's roles:
   - If ANY user has site-level roles (SiteAdmin, SiteClerk, SiteLegalExpert, etc.)
     → BLOCK deletion with current error message
   - If ALL users have only org-level roles (OrganizationAdmin, OrganizationClerk)
     → PROCEED with cascade deletion
5. Delete in order (respecting FK constraints):
   a. CaseTaskComment, CaseTaskDocument
   b. CaseTask
   c. CaseClient, CaseComment, CaseDocument, CaseHearing, CaseInvoice
   d. LegalExpertCaseMap
   e. Case
   f. SiteCaseMap
   g. SiteUserMap (org-level users only)
   h. Site
```

## Impact
- Affected specs: `data-integrity`
- Affected code (Backend): `SitesController.cs` in Lawsome.Api
- **BREAKING**: None - this relaxes a restriction, existing behavior preserved for site-level users
- **Data Impact**: Site deletion will now cascade delete all associated cases and related data
