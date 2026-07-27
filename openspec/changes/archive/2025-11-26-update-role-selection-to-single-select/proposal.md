# Proposal: Update Role Selection to Single-Select in PRD

## Problem Statement

GitHub Issue #52 reports that the site user creation page only allows selecting one role at a time, but the user expected multi-select functionality based on the PRD documentation.

Upon investigation:
- **PRD Line 802**: Documents organization user creation with "Roles | Multi-select"
- **PRD Line 1164**: Documents site user creation with "Roles | Multi-select"
- **Current UI Implementation**: Only supports single-select for roles (one role per user)
- **User Expectation**: Based on PRD, users expect to assign multiple roles

The PRD incorrectly documents role selection as "Multi-select" when the actual system design and implementation only supports assigning a single role to each user.

## Current Behavior

**PRD Documentation:**
- Organization user creation form: "Roles | Multi-select | Yes"
- Site user creation form: "Roles | Multi-select | Yes"
- Creates expectation that multiple roles can be assigned

**UI Implementation:**
- Organization user creation: Single role dropdown/select
- Site user creation: Single role dropdown/select
- Only one role can be assigned per user

**System Design:**
- Each user has exactly one role within their scope (organization or site)
- Role determines access permissions and capabilities
- No support for multiple roles per user in backend or frontend

## Proposed Solution

Update the PRD to accurately document that role selection is **single-select** (not multi-select). This aligns the documentation with the actual system implementation and sets correct expectations.

This is a documentation-only change that corrects misleading information about role assignment capabilities.

## Scope

**In Scope:**
- Update organization user creation form field from "Multi-select" to "Select" (single)
- Update site user creation form field from "Multi-select" to "Select" (single)
- Clarify that each user has exactly one role

**Out of Scope:**
- No code changes to frontend
- No code changes to backend API
- No implementation of multi-role functionality
- No database changes

## Success Criteria

1. PRD accurately documents role selection as single-select
2. Documentation matches actual UI behavior
3. No misleading information about assigning multiple roles
4. Clear expectations for users and developers

## Open Questions

None. This is a straightforward documentation correction to match the implemented behavior.

## Related Issues

- GitHub Issue #52: [BUG] Site-level roles multiselect option is missing in create user page
