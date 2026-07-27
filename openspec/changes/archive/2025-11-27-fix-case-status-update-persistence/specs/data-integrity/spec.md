# Data Integrity Spec Delta

## ADDED Requirements

### Requirement: Case Status Updates Must Persist Across All Update Interfaces

**Description:** When updating a case through any user interface (dedicated edit page or inline edit in case details header), the case status field MUST be included in the API update payload and persisted to the backend. All update interfaces MUST provide consistent data persistence behavior for all editable fields, including status.

**Rationale:** Users expect that changes made through any interface will be saved consistently. A bug where status updates work from one interface but not another creates confusion and undermines trust in the system. The case status is a critical field in legal case management - it tracks case lifecycle (Open, InProgress, OnHold, Closed) and must be reliably persisted.

**Root Cause:** The inline edit functionality in CaseHeader component (used on case details page) was not sending the `status` field in the API update payload. While the UI was updated locally to show the new status, the backend was never updated, causing the status to revert on page refresh or navigation.

**Acceptance Criteria:**
- The `updateCase` API function accepts an optional `status` field in its payload
- The `useCaseData` hook includes the status field when calling `updateCase` during inline edits
- Status updates from case details page (inline edit) are sent to the backend via PUT request
- Status persists after save, page refresh, and navigation
- Inline edit behavior matches dedicated edit page behavior for status field
- Network request payload includes `"status": "InProgress"` (or other CaseStatus value) when status is changed

#### Scenario: User updates case status from case details page inline edit

**Given:**
- User is viewing case details at `/organization/91/sites/162/cases/369`
- Case current status is "Open"
- User has permission to edit cases (canEditCases = true)

**When:**
- User clicks the three-dot menu icon in CaseHeader
- User selects "Edit Case" from the menu
- Inline edit form appears with current case data pre-filled
- User changes status dropdown from "Open" to "InProgress"
- User clicks "Save Changes" button

**Then:**
- PUT request is sent to `/api/v1/organizations/91/sites/162/cases/369`
- Request payload includes: `{ "title": "...", "caseNumber": "...", "status": "InProgress", "assignedToId": 123, "description": "..." }`
- Backend API processes the request and updates case status to "InProgress"
- API returns updated case data with `status: "InProgress"`
- UI displays success toast: "Case updated successfully"
- Case header shows status chip with "InProgress" label and primary color
- Inline edit form closes

**Validation:**
- Inspect network request in DevTools: verify payload contains `"status": "InProgress"`
- Check backend database: case record has status = "InProgress"
- Refresh page: case header still shows "InProgress" status
- Navigate to site cases list and back: status remains "InProgress"

#### Scenario: User updates case status along with other fields

**Given:**
- User is editing a case from the case details page
- Current case state: title="Contract Dispute", caseNumber="C-2024-001", status="Open", assignedToId=5

**When:**
- User changes multiple fields:
  - Title to "Contract Dispute Resolution"
  - Status to "InProgress"
  - Assigned To from User A (id=5) to User B (id=8)
- User clicks "Save Changes"

**Then:**
- PUT request payload includes all updated fields:
  ```json
  {
    "title": "Contract Dispute Resolution",
    "caseNumber": "C-2024-001",
    "status": "InProgress",
    "assignedToId": 8,
    "description": "..."
  }
  ```
- Backend updates all fields atomically
- UI reflects all changes after save
- Page refresh confirms all changes persisted

**Validation:**
- All modified fields (title, status, assignedTo) are included in API payload
- Backend receives and saves all fields correctly
- No data loss or partial updates occur

#### Scenario: Status update from dedicated edit page continues to work

**Given:**
- User navigates to dedicated edit page at `/organization/91/sites/162/cases/369/edit`
- Current case status is "InProgress"

**When:**
- User changes status dropdown from "InProgress" to "Closed"
- User clicks "Update Case" button

**Then:**
- PUT request is sent with payload including `"status": "Closed"`
- Backend updates case status to "Closed"
- User is redirected to case details page
- Case header shows status chip with "Closed" label and success color
- Success toast appears: "Case updated successfully"

**Validation:**
- Dedicated edit page functionality remains unchanged (no regression)
- Status field is consistently sent and persisted from both interfaces
- Both inline edit and dedicated edit page produce identical API behavior

#### Scenario: Status field is optional in update payload

**Given:**
- User edits a case but does NOT change the status field
- Current status is "InProgress"

**When:**
- User changes only the title field
- User clicks "Save Changes"

**Then:**
- PUT request payload includes current status value:
  ```json
  {
    "title": "New Title",
    "caseNumber": "C-2024-001",
    "status": "InProgress",
    "assignedToId": 5,
    "description": "..."
  }
  ```
- OR if API design allows, status field may be omitted and backend preserves existing value
- Either approach ensures status is not inadvertently changed or lost

**Validation:**
- When status is not changed by user, backend preserves the existing status value
- No accidental status changes occur when editing other fields

#### Scenario: Invalid status value is rejected

**Given:**
- CaseStatus enum defines valid values: Open, InProgress, OnHold, Closed
- User attempts to submit an invalid status (e.g., via API manipulation)

**When:**
- PUT request is sent with `"status": "InvalidStatus"`

**Then:**
- Backend API validation rejects the request
- API returns 400 Bad Request error
- Frontend displays appropriate error message
- Case status remains unchanged

**Validation:**
- TypeScript enum ensures frontend only sends valid status values
- Backend validation provides defense-in-depth against invalid data
- Error handling provides clear feedback to user
