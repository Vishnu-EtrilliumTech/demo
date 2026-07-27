# User Management

**Capability:** User Management
**Change ID:** `remove-enabled-from-user-creation`
**Type:** Spec Delta

This spec defines the requirements for creating and managing users in the Lawsome multi-tenant legal practice management platform. The "enabled" property is a backend implementation detail and should never be exposed in the UI.

---

## MODIFIED Requirements

### Requirement: User Management UI Must Not Expose Account Status Flag

**ID:** `UM-001`
**Priority:** High
**Rationale:** The "enabled" field is a low-level backend implementation detail that should not be exposed to UI users. Administrators should manage users through high-level operations, not by toggling technical flags. If account suspension becomes a business requirement, it should be implemented as a proper feature with appropriate UI/UX, workflows, and terminology.

#### Scenario: Organization Administrator Creates New Organization User

**Given** an organization administrator is on the "Add New User" page for their organization
**When** they view the user creation form
**Then** the form should display fields for:
- Full Name (required)
- Email (required)
- Phone Number (required)
- Gender (required)
- Role (required)

**And** the form should NOT display an "enabled" or "active" checkbox or toggle
**And** when the form is submitted successfully
**Then** the API request should include `enabled: true`
**And** the new user should be created with `enabled: true` in the backend

#### Scenario: Site Administrator Creates New Site User

**Given** a site administrator is on the "Add New User" page for their site
**When** they view the user creation form
**Then** the form should display fields for:
- Full Name (required)
- Email (required)
- Phone Number (required)
- Gender (required)
- Role (required, filtered by permissions)

**And** the form should NOT display an "enabled" or "active" checkbox or toggle
**And** when the form is submitted successfully
**Then** the API request should include `enabled: true`
**And** the new user should be created with `enabled: true` in the backend

#### Scenario: Organization Administrator Edits Organization User

**Given** an organization administrator is on the edit page for an organization user
**When** they view the user edit form
**Then** the form should display editable fields:
- Full Name
- Email
- Phone Number
- Gender
- Role (disabled/read-only)

**And** the form should NOT display an "enabled" or "active" checkbox or toggle
**And** when the form is submitted successfully
**Then** the API request should include `enabled: true`
**And** the user should be updated with `enabled: true` in the backend

#### Scenario: Site Administrator Edits Site User

**Given** a site administrator is on the edit page for a site user
**When** they view the user edit form
**Then** the form should display editable fields:
- Full Name
- Email
- Phone Number
- Gender
- Role (disabled/read-only)

**And** the form should NOT display an "enabled" or "active" checkbox or toggle
**And** when the form is submitted successfully
**Then** the API request should include `enabled: true`
**And** the user should be updated with `enabled: true` in the backend

#### Scenario: UI Receives User Data With Enabled Status From Backend

**Given** the backend API returns user data that includes an `enabled` field
**When** the UI processes this user data
**Then** the UI should ignore the `enabled` field completely
**And** the user should be displayed normally in all lists and views
**And** no visual indicator of enabled/disabled status should be shown

---

### Requirement: User Lists Must Not Display Account Status

**ID:** `UM-002`
**Priority:** High
**Rationale:** Since the UI does not manage account status, it should not display it to avoid confusion and maintain consistency with the simplified user management model.

#### Scenario: Administrator Views Organization Users List

**Given** an administrator is viewing the list of organization users
**When** the user list is displayed
**Then** each user entry should display:
- Full Name
- Email
- Role(s)
- Registration Date
- Other relevant user information

**And** the list should NOT display:
- "Enabled" status column
- "Active/Inactive" status column
- Status badges or icons indicating enabled/disabled state
- Any visual distinction based on `enabled` field

#### Scenario: Administrator Views Site Users List

**Given** an administrator is viewing the list of site users
**When** the user list is displayed
**Then** each user entry should display:
- Full Name
- Email
- Role(s)
- Registration Date
- Other relevant user information

**And** the list should NOT display:
- "Enabled" status column
- "Active/Inactive" status column
- Status badges or icons indicating enabled/disabled state
- Any visual distinction based on `enabled` field

#### Scenario: Users With Disabled Status in Backend Are Displayed Normally

**Given** some users in the backend have `enabled: false`
**When** the administrator views the user list
**Then** all users should be displayed normally without any distinction
**And** users with `enabled: false` should appear the same as users with `enabled: true`
**And** no filtering or sorting by enabled status should be available

---

### Requirement: API Requests Must Always Set Enabled to True

**ID:** `UM-003`
**Priority:** High
**Rationale:** Ensure all users managed through the UI are always enabled. This maintains backend compatibility while completely hiding the implementation detail from UI users.

#### Scenario: Frontend Sends User Creation Request

**Given** the frontend sends a POST request to create an organization user
**When** the request is constructed
**Then** the request payload must explicitly include `enabled: true`
**And** the backend should create the user with `enabled: true`
**And** the user should be accessible and functional immediately

#### Scenario: Frontend Sends Site User Creation Request

**Given** the frontend sends a POST request to create a site user
**When** the request is constructed
**Then** the request payload must explicitly include `enabled: true`
**And** the backend should create the user with `enabled: true`
**And** the user should be accessible and functional immediately

#### Scenario: Frontend Sends User Update Request

**Given** the frontend sends a PUT request to update an organization or site user
**When** the request is constructed
**Then** the request payload must explicitly include `enabled: true`
**And** the backend should update the user with `enabled: true`
**And** the user should remain accessible and functional

#### Scenario: API Call Fails Without Enabled Field

**Given** the backend API requires the `enabled` field in requests
**When** a request is sent without the `enabled` field
**Then** the frontend must always include `enabled: true` to prevent this scenario
**And** all API service functions must explicitly set `enabled: true` in payloads

---

### Requirement: UI Code Must Not Reference Enabled Property

**ID:** `UM-004`
**Priority:** Medium
**Rationale:** Prevent accidental exposure of the enabled property through code or UI. The enabled field should be treated as non-existent from the UI perspective.

#### Scenario: FormData Interface Does Not Include Enabled

**Given** a user creation or edit form component
**When** the FormData TypeScript interface is defined
**Then** the interface must NOT include an `enabled` property
**And** the form state must NOT track `enabled` value
**And** no form inputs should bind to an `enabled` field

#### Scenario: API Service Functions Handle Enabled Internally

**Given** an API service function for creating or updating users
**When** the function is implemented
**Then** the function signature should NOT accept `enabled` as a parameter
**And** the function should internally set `enabled: true` in the request payload
**And** the caller should not be able to specify the enabled value

#### Scenario: TypeScript Interfaces Exclude Enabled From UI Payloads

**Given** TypeScript interfaces for user creation and update payloads
**When** these interfaces are defined
**Then** they should NOT include `enabled` as a property
**And** TypeScript should prevent accidental inclusion of `enabled` in form data
**And** only the API service layer should add `enabled: true` to requests

---

## REMOVED Requirements

None - no existing requirements are being removed. This change modifies existing user creation and editing behavior to hide the enabled property from the UI layer.

---

## ADDED Requirements

None - this change modifies existing functionality rather than adding new requirements. The "enabled" field continues to exist in the backend; it's simply hidden from the UI.

---

## Notes

### Implementation Considerations

1. **Backend Compatibility**: The backend API continues to accept and store the `enabled` field. This change only affects the frontend UI - all API calls will explicitly set `enabled: true`.

2. **No Data Migration**: No database changes or data migration required. Existing user records remain unchanged.

3. **Future Account Suspension**: If account suspension becomes a business requirement, it should be implemented as a proper feature:
   - Dedicated UI with "Suspend Account" / "Reactivate Account" actions
   - Reason tracking and audit trail
   - Email notifications to suspended users
   - Clear workflows for suspension and reactivation
   - User-facing terminology (not "enabled/disabled")

4. **TypeScript Type Safety**: TypeScript interfaces should prevent accidental exposure of the `enabled` field:
   ```typescript
   // FormData should not include enabled
   interface FormData {
     fullName: string;
     emailId: string;
     phoneNumber: string;
     gender: string;
     roles: string[];
     // enabled is NOT included here
   }

   // API service adds enabled internally
   const createUser = async (orgId: string, userData: FormData) => {
     const payload = {
       ...userData,
       enabled: true,  // Always set to true
       organizationId: orgId
     };
     // send payload to backend
   };
   ```

5. **Backend API Users**: This change does not affect:
   - Direct API calls from other clients
   - Bulk user import operations
   - Administrative tools outside the web UI
   - Backend services that may need to set `enabled: false`

### Related Capabilities

- **Authentication**: User account status (enabled/disabled) affects authentication in the backend
- **User Management**: This capability is part of the broader user management system
- **Role-Based Access Control**: Different roles have different permissions to create and manage users
- **Future Account Suspension**: May be implemented as a separate capability with proper UI/UX

### Security Considerations

- Only the backend should enforce authentication based on the `enabled` flag
- The UI should not be responsible for hiding disabled users
- If a disabled user exists in the backend, the UI will display them normally
- This follows the principle of "security in depth" - UI is not a security boundary

### Testing Strategy

1. **Unit Tests**: Verify FormData interfaces don't include `enabled`
2. **Integration Tests**: Verify all API calls include `enabled: true`
3. **Manual Testing**: Verify no UI references to enabled status
4. **Backend Testing**: Verify backend accepts and stores `enabled: true` correctly
5. **Edge Case Testing**: Create users, verify they're enabled; test with backend users that have `enabled: false`

### Documentation Updates Required

- Update user management documentation to remove references to enabled/disabled status in UI
- Document that all users created through UI are enabled by default
- Note that account suspension is not currently a UI feature
- If suspension becomes necessary, document it as a new feature requirement
