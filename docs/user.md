# User Feature Change Log

## 2026-03-26 — Role-Based Users List Page

### Summary
Implemented the `/organization/[id]/users` page with full role-based access control per PRD Section 3.4.

### Changes

#### New / Modified Files
| File | Change |
|------|--------|
| `src/app/organization/[id]/users/page.tsx` | Replaced stub with full role-based users list |
| `src/app/organization/components/UsersTable.tsx` | Added optional `showPhoneColumn` and `showSiteColumn` props |
| `src/app/organization/types/index.ts` | Added optional `siteName?: string` to `User` type |

### Role-Based Behavior

**Org Mode** (OrganizationAdmin, OrganizationClerk):
- API: `GET /api/v1/organizations/{organizationId}/users`
- Columns: Full Name, Email, Phone, Site, Roles, Registered, Actions
- OrganizationAdmin: can view, add, edit, delete
- OrganizationClerk: view only

**Site Mode** (SiteAdmin, SiteClerk, SiteSrLegalExpert, SiteLegalExpert):
- API: `GET /api/v1/organizations/{organizationId}/sites/{siteId}/users`
  (siteId resolved via `GET /api/v1/organizations/{organizationId}/sites/users/{userId}`)
- Columns: Full Name, Email, Phone, Roles, Registered, Actions (no Site column)
- SiteAdmin: can view, add, edit, delete
- SiteClerk: can view and add
- SiteSrLegalExpert / SiteLegalExpert: can view, add, edit
- SiteCaseClient: no access
