# Change: Remove non-functional Switch Site from Personal Dashboard

## Why
The "Switch Site" dropdown on the Personal Dashboard is non-functional and misleading because the current system rules only allow users to be associated with a single site within an organization. Since users cannot be added to multiple sites, the site switcher is always disabled and serves no purpose.

GitHub Issue: [#100](https://github.com/eTrillium/Lawsome.Web.UI/issues/100)

## What Changes
- Remove the "Switch Site" dropdown field from the Personal Dashboard page (`/organization/{orgId}/sites/{siteId}/users/{userId}`)
- Remove related state variables (`availableSites`, `selectedSite`, `isSwitchingSite`)
- Remove the `loadAvailableSites()` function and `handleSiteChange()` handler
- Simplify the Site Switcher Card to only show the current site in the breadcrumb navigation

## Impact
- Affected specs: `ux-consistency` (adding new requirement for UI feature parity with system rules)
- Affected code: `src/app/organization/[id]/sites/[siteId]/users/[userId]/page.tsx`
- User impact: Cleaner UI that accurately reflects system capabilities - no disabled controls that confuse users
