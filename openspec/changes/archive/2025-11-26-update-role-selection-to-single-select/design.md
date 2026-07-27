# Design Document

## Overview

This change does not require a design document as it is a pure documentation update with no code changes, architectural decisions, or system modifications.

## Type of Change

**Documentation Only** - This change only modifies the PRD (`docs/Lawsome_PRD.md`) to correct the role selection field type from "Multi-select" to "Select" (single-select).

## No Specs Required

This change does not affect any capabilities or requirements. It simply corrects misleading documentation that described role selection as supporting multiple roles when:
- The UI only supports single role selection
- The system design assigns one role per user
- The backend API expects a single role

Therefore, no spec deltas are needed.

## Rationale for Documentation-Only Approach

The issue (#52) reports that users cannot select multiple roles, which led to discovering that the PRD documented role selection as "Multi-select" even though it was never implemented that way. The current implementation:

**System Design:**
- Each user within an organization has exactly one organization-level role
- Each user within a site has exactly one site-level role
- Roles determine access permissions and capabilities
- The permission system is built around single-role assignments

**UI Implementation:**
- Organization user creation: Dropdown with single-select
- Site user creation: Dropdown with single-select
- No checkboxes or multi-select UI components

**Backend API:**
- Expects a single role value per user
- No support for role arrays or multiple role assignments

Rather than:
- Implementing multi-role functionality (major architectural change)
- Keeping misleading documentation
- Building complex UI for multiple roles

We're correcting the PRD to accurately reflect the intentional single-role design of the system. This:
1. Sets correct expectations for users
2. Accurately documents current capabilities
3. Eliminates confusion about missing features
4. Aligns with the underlying permission model

## Terminology Clarification

- **"Multi-select"**: A UI component that allows selecting multiple options (checkboxes, multi-select dropdown)
- **"Select"**: A standard dropdown or single-choice field (radio buttons, single-select dropdown)

The change updates the PRD to use "Select" which accurately describes the single-role selection UI.
