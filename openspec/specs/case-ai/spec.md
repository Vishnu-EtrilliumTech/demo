# case-ai Specification

## Purpose
TBD - created by archiving change add-case-ai-chat. Update Purpose after archive.
## Requirements
### Requirement: AI Chat Interface
The system SHALL provide an interactive AI chat interface on the case page that allows authorized users to ask questions about the case.

#### Scenario: Organization Admin opens chat in AI-enabled organization
- **WHEN** an Organization Admin views a case page for an organization that has AI features enabled
- **THEN** a floating chat button is visible
- **AND** clicking the button opens a chat drawer

#### Scenario: Organization Admin opens chat in non-AI-enabled organization
- **WHEN** an Organization Admin views a case page for an organization that does NOT have AI features enabled
- **THEN** the floating chat button is NOT visible

#### Scenario: User sends a message
- **WHEN** a user types a message and submits
- **THEN** the message is displayed in the chat
- **AND** a loading indicator appears
- **AND** the AI response is displayed when received

#### Scenario: AI response includes case context
- **WHEN** a user asks a question about the case
- **THEN** the AI response is based on full case context (clients, tasks, hearings, documents, invoices, comments)

#### Scenario: Session-only conversation
- **WHEN** a user navigates away from the case page
- **THEN** the chat history is cleared
- **AND** returning to the page shows an empty chat

#### Scenario: Unauthorized user cannot access chat
- **WHEN** a user without OrganizationAdmin or SystemAdmin role views a case page
- **THEN** the chat button is not visible

### Requirement: Chat API Endpoint
The system SHALL expose a POST endpoint for sending chat messages to the AI.

#### Scenario: Successful chat request
- **WHEN** a valid POST request is sent to `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/chat`
- **AND** the request body contains a `message` field
- **AND** the user has OrganizationAdmin or SystemAdmin role
- **THEN** the response contains the AI-generated reply
- **AND** the response includes a timestamp

#### Scenario: Unauthorized chat request
- **WHEN** a user without proper authorization sends a chat request
- **THEN** a 403 Forbidden response is returned

#### Scenario: Invalid case ID
- **WHEN** a chat request is sent for a non-existent case
- **THEN** a 404 Not Found response is returned

#### Scenario: OpenAI service error
- **WHEN** the OpenAI API call fails
- **THEN** a 500 Internal Server Error is returned
- **AND** the error is logged

### Requirement: Unified AI Controller
The system SHALL consolidate all case-related AI features under a single controller named `CaseAIController`.

#### Scenario: Summary endpoint remains accessible
- **WHEN** a GET request is sent to `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/summary`
- **THEN** the existing AI summary functionality works as before

#### Scenario: Chat endpoint is accessible
- **WHEN** a POST request is sent to `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/chat`
- **THEN** the new AI chat functionality is available

### Requirement: Organization-based AI Feature Enablement
The system SHALL enable AI features (chat and summary) at the organization level rather than at the individual case level.

#### Scenario: AI features enabled for organization
- **WHEN** an organization ID is included in the `NEXT_PUBLIC_AI_ENABLED_ORG_IDS` environment variable
- **THEN** all cases within that organization display AI features (chat button and summary section)

#### Scenario: AI features disabled for organization
- **WHEN** an organization ID is NOT included in the `NEXT_PUBLIC_AI_ENABLED_ORG_IDS` environment variable
- **THEN** no cases within that organization display AI features

#### Scenario: Multiple organizations enabled
- **WHEN** multiple organization IDs are specified as a comma-separated list in `NEXT_PUBLIC_AI_ENABLED_ORG_IDS`
- **THEN** AI features are available for all cases in all specified organizations

#### Scenario: Empty environment variable
- **WHEN** `NEXT_PUBLIC_AI_ENABLED_ORG_IDS` is empty or not set
- **THEN** AI features are disabled for all organizations

