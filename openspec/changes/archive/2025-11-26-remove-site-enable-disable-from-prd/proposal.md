# Proposal: Mark Site Enable/Disable as Planned for Future Implementation

## Problem Statement

GitHub Issue #49 reports that the option to disable a site is not present in the system. The PRD currently documents a site enable/disable feature, but this feature is not implemented in the UI. Specifically:

1. **Line 962 in PRD**: States "**Default Status:** Sites are enabled by default"
2. **Line 1055 in PRD**: Lists "Enabled status" as an editable field in the Edit Site section
3. **Line 1079 in PRD**: States "Disabling site does not delete users or cases" as a business rule

However, upon investigation:
- The backend API does support an `Enabled` field in both `GetSiteResponse` and `UpdateSiteRequest`
- The frontend UI has NO controls for enabling/disabling sites
- The edit site page (`/organization/[id]/sites/[siteId]/edit`) does not include any toggle or checkbox for the enabled status
- The in-place edit form in the site details page also lacks this control

## Current Behavior

**Backend API:**
- `GetSiteResponse` includes `public bool Enabled { get; set; }`
- `UpdateSiteRequest` includes `public bool Enabled { get; set; }`
- The API fully supports the enabled/disabled state

**Frontend UI:**
- Site creation form: No enabled status field
- Site edit page: No enabled status field
- Site details in-place edit: No enabled status field
- Sites are always treated as enabled in the UI

**PRD Documentation:**
- Documents the enabled status as a feature
- Describes business rules around disabling sites
- Creates expectation that this feature exists

## Proposed Solution

Update the PRD to clearly mark the site enable/disable feature as "[Planned for Future Implementation]" instead of documenting it as an existing feature. This preserves the feature documentation while accurately indicating that it is not yet available in the UI.

This approach:
- Maintains the feature specification for future development
- Clearly communicates to readers that the feature is not currently implemented
- Preserves the backend API compatibility
- Sets proper expectations about current system capabilities

## Scope

**In Scope:**
- Add "[Planned for Future Implementation]" marker to site enable/disable documentation in PRD
- Update business rules to indicate planned status
- Update editable fields list to mark "Enabled status" as planned
- Preserve all feature specifications for future implementation

**Out of Scope:**
- No code changes to frontend
- No code changes to backend API
- No implementation of the enable/disable feature
- No database changes
- No removal of feature documentation

## Success Criteria

1. PRD clearly marks site enable/disable as a planned feature, not a current one
2. Feature documentation is preserved for future implementation
3. Readers understand this feature is not yet available in the UI
4. No misleading claims that the feature exists today

## Open Questions

None. This is a straightforward documentation update to remove a feature that was documented but never implemented in the UI.

## Related Issues

- GitHub Issue #49: [BUG] The option to disable a site is not present in the system
