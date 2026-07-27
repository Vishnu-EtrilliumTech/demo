# Case Management - Case Client System (Documentation Correction)

## MODIFIED Requirements

### Requirement: View Case Clients
The system SHALL allow authorized users to view a list of case clients. **Current implementation provides basic informational client records only. Client invitation system, status tracking, and portal access are [Planned for Future Implementation].**

**Current Features:**
- Display client list with: Full Name, Email ID, Phone Number, Gender, Remarks
- Search by name, email, or phone number
- "Add Client" button to create new client records
- Edit/Delete actions for each client record
- Client count display

**Current Limitations:**
- No invitation status tracking (Pending/Active/Inactive)
- No "Invitation Sent Date" or "Joined Date" columns
- No "Invite Client" button
- Clients cannot login or access any portal
- Client records are informational only for law firm use

**Planned Future Enhancements [Planned for Future Implementation]:**
- Client invitation system with email notifications
- Client portal access for viewing case information
- Client authentication and login functionality
- Status tracking (Pending/Active/Inactive)
- Invitation date and acceptance date tracking

#### Scenario: View current client list (informational records only)
- **GIVEN** user has permission to view case clients
- **WHEN** user navigates to the Clients Tab
- **THEN** system displays list of client records
- **AND** each record shows: full name, email, phone, gender, remarks
- **AND** no invitation status or dates are shown
- **AND** only Edit and Delete actions are available (no Invite button)

#### Scenario: Search for clients
- **GIVEN** case has multiple client records
- **WHEN** user enters search query in search box
- **THEN** system filters clients by name, email, or phone number
- **AND** displays matching results

### Requirement: Add Case Client
The system SHALL allow authorized users to add client records to cases. **Current implementation creates informational records only. Client portal access and invitation system are [Planned for Future Implementation].**

**Business Rules:**
1. Email must be unique within the case
2. One client can be added to multiple cases
3. Client automatically gets SiteCaseClient role for this case (in data model only - cannot login)
4. Client data stored in system as informational record
5. **Client portal access and invitation system is [Planned for Future Implementation]**
6. Currently, case clients are informational records only - they cannot login or access the system

**Add Flow:**
1. User clicks "Add Client"
2. Modal/form appears
3. User fills client information (Full Name, Email ID, Phone Number, Gender, Remarks)
4. User clicks "Save" or "Add"
5. System validates input
6. API creates case client record via `POST /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/caseclients`
7. Client appears in list
8. Success message displayed: "Client added successfully"
9. **Current Limitation:** Client record is informational only - no invitation sent, no client portal access

**API Endpoint:** `POST /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/caseclients`

**Planned Future API Endpoints [Planned for Future Implementation]:**
- `POST /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/caseclients/{clientId}/invite` - Send invitation
- `POST /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/caseclients/{clientId}/invitation/{invitationId}/accept` - Accept invitation

**Access Control:**
- OrganizationAdmin: Can add clients
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: Can add clients
- Site roles: Can add clients
- SiteCaseClient: Cannot add clients (and cannot login to system)

#### Scenario: Successfully add client as informational record
- **GIVEN** user has permission to add case clients
- **WHEN** user fills out client form with valid data (name, email, phone, gender, remarks)
- **AND** clicks "Add Client"
- **THEN** system creates case client record
- **AND** client appears in list
- **AND** success message is displayed
- **AND** client record is informational only (no invitation, no portal access)

#### Scenario: Client record validation
- **GIVEN** user attempts to add a client
- **WHEN** user provides email that already exists for this case
- **THEN** system displays validation error
- **AND** prevents duplicate client creation

## REMOVED Requirements

### Requirement: Invite Case Client
**Reason**: This requirement was aspirational/future-planned but documented as if it existed. The "Invite Client" button, invitation email system, and client portal access are not implemented. Removing from current requirements and documenting as [Planned for Future Implementation] in the MODIFIED requirements above.

**Migration**: No migration needed - feature never existed in implementation, only in PRD documentation.

## ADDED Requirements

### Requirement: Future Client Portal System (Planned)
When implemented, the system SHALL provide a complete client invitation and portal access system. **This is [Planned for Future Implementation]** and does not exist in the current system.

**Planned Features:**
- Email invitation system with customizable invitation templates
- "Invite Client" button in Clients Tab for pending clients
- Client portal with case viewing permissions
- Client authentication and login functionality
- Invitation status tracking (Pending/Active/Inactive)
- Invitation sent date and acceptance date tracking
- Client dashboard showing assigned cases
- Secure document viewing for clients
- Case update notifications for clients

**Planned Business Rules:**
1. Only clients with "Pending" status can receive invitations
2. Invitation emails include secure link to accept and set up account
3. Upon accepting invitation, client gains access to case information
4. Client status changes from "Pending" to "Active" after acceptance
5. Clients can view but not modify case information
6. Clients can upload documents to their cases (with permission)

#### Scenario: Future invitation workflow (when implemented)
- **GIVEN** case client has been added to the system
- **WHEN** authorized user clicks "Invite Client" button
- **THEN** system sends invitation email to client's email address
- **AND** creates secure invitation token with expiration
- **AND** updates invitation sent date
- **AND** changes client status to "Pending"

#### Scenario: Future client portal access (when implemented)
- **GIVEN** client has accepted invitation
- **AND** set up their account credentials
- **WHEN** client logs into the portal
- **THEN** client can view their assigned cases
- **AND** see case details, documents, and updates
- **AND** receive notifications about case progress
