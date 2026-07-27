# session-management Specification

## Purpose
TBD - created by archiving change fix-expired-session-handling. Update Purpose after archive.
## Requirements
### Requirement: Forced Logout on Keycloak Session Expiration

The system SHALL force a complete logout when the Keycloak session has expired (detected via token refresh failure), preventing users from continuing to perform authenticated operations.

#### Scenario: Token refresh fails due to expired session
- **WHEN** the system attempts to refresh the access token
- **AND** Keycloak returns an error indicating the refresh token is not active (session expired)
- **THEN** the system SHALL clear the access token from localStorage
- **AND** the system SHALL clear the refresh token from localStorage
- **AND** the system SHALL redirect the user to the Keycloak login page
- **AND** the system SHALL preserve the current URL as the redirect destination after login

#### Scenario: onAuthRefreshError triggers forced logout
- **WHEN** the Keycloak `onAuthRefreshError` event fires
- **THEN** the system SHALL invoke the forced logout flow
- **AND** the user SHALL be redirected to the login page

#### Scenario: Periodic token refresh detects expired session
- **WHEN** the periodic token refresh interval detects the token is expired
- **AND** the refresh attempt fails
- **THEN** the system SHALL invoke the forced logout flow

### Requirement: Prevent Multiple Concurrent Logout Attempts

The system SHALL prevent race conditions when multiple API calls fail simultaneously due to session expiration.

#### Scenario: Multiple failures trigger single logout
- **WHEN** multiple API calls fail with 401 simultaneously
- **AND** each failure attempts to trigger logout
- **THEN** only the first logout attempt SHALL execute
- **AND** subsequent logout attempts SHALL be ignored until the redirect completes

#### Scenario: Guard flag prevents re-entry
- **WHEN** the forced logout function is called
- **AND** a logout is already in progress
- **THEN** the function SHALL return immediately without taking action

### Requirement: HTTP 401 Response Triggers Logout After Refresh Failure

The HTTP client SHALL trigger forced logout when receiving a 401 response and the subsequent token refresh fails.

#### Scenario: 401 response with failed refresh triggers logout
- **WHEN** an API call returns HTTP 401 Unauthorized
- **AND** the system attempts to refresh the token
- **AND** the token refresh fails
- **THEN** the system SHALL invoke the forced logout flow
- **AND** the system SHALL NOT retry the original API request

#### Scenario: 401 response with successful refresh retries request
- **WHEN** an API call returns HTTP 401 Unauthorized
- **AND** the system attempts to refresh the token
- **AND** the token refresh succeeds
- **THEN** the system SHALL retry the original API request with the new token
- **AND** the system SHALL NOT invoke the forced logout flow

### Requirement: Preserve Return URL on Session Expiration

The system SHALL preserve the user's current location when redirecting to login due to session expiration, enabling seamless return after re-authentication.

#### Scenario: Return URL preserved in login redirect
- **WHEN** the forced logout flow redirects to the login page
- **THEN** the current page URL SHALL be passed as the redirect URI to Keycloak
- **AND** after successful re-authentication, the user SHALL be returned to their original page

