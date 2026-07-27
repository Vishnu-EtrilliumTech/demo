# Change: Mark Case Client Invitation System as Future Implementation

## Why

GitHub Issue #64 reports that newly added case clients are not receiving email invitations. Upon thorough investigation:

1. **The PRD contains outdated/aspirational documentation** that references:
   - "Invite Client" button (not implemented)
   - Client invitation status fields: "Pending", "Active", "Inactive" (not implemented)
   - "Invitation Sent Date" and "Joined Date" columns (not implemented)
   - Client portal access and authentication (not implemented)

2. **The current implementation only supports:**
   - Creating case client records via `POST /api/.../caseclients`
   - Storing client information (name, email, phone, gender, remarks)
   - Basic CRUD operations (add, view, edit, delete)
   - **Clients are informational records only - no portal access, no invitations, no authentication**

3. **The entire client invitation system does not exist:**
   - No "Invite Client" button in the UI
   - No email invitation functionality
   - No client login or portal access
   - The SiteCaseClient role exists in data model but clients cannot use it to login

This creates significant confusion between what the PRD documents and what actually exists. The PRD needs correction to accurately reflect current implementation and mark the entire invitation/portal system as future functionality.

## What Changes

- **Update PRD Section 6.3.1** "View Case Clients":
  - Remove references to invitation status, sent date, joined date columns
  - Remove "Invite Client" button from features list
  - Add "Current Implementation Notes" explaining clients are informational records only
  - Mark invitation system and portal access as **[Planned for Future Implementation]**

- **Update PRD Section 6.3.2** "Add Case Client":
  - Remove business rule about "Client does not have access until invitation is accepted"
  - Add clarification that clients are informational records with no system access
  - Update Add Flow to remove references to "Pending" status
  - Add note about current limitation: no invitations, no portal access
  - List planned future API endpoints for invitation system

- **Document planned future enhancements**:
  - Client invitation system with email notifications
  - Client portal access for case viewing
  - Client authentication and login functionality
  - Status tracking (Pending/Active/Inactive)

## Impact

- **Affected Documentation**: `docs/Lawsome_PRD.md` (Sections 6.3.1, 6.3.2)
- **Affected Code**: None (documentation correction only)
- **User Expectations**: Aligns PRD with actual implementation - clients are informational records only
- **Related GitHub Issue**: Addresses #64 by clarifying that the entire invitation system is not yet implemented
- **Breaking Change**: No - this is a documentation correction, not a code change
