## ADDED Requirements

### Requirement: Site Deletion Must Validate No Users Exist

**Description:** The system SHALL prevent deletion of a site when one or more users are still assigned to that site. This validation protects against accidental data loss and ensures administrators explicitly manage user assignments before removing a site from the organization.

**Rationale:** Sites contain users who may have associated cases, tasks, hearings, and other data. Allowing site deletion with active users could lead to orphaned data, cascading deletes, or data integrity violations. By requiring all users to be removed first, we ensure administrators make conscious decisions about user data before site deletion.

#### Scenario: Attempt to delete site with assigned users

- **GIVEN** a site exists with ID 123 in organization 75
- **AND** the site has 3 users assigned via SiteUserMap
- **WHEN** an organization admin calls DELETE `/api/v1/organizations/75/sites/123`
- **THEN** the API SHALL return HTTP 400 Bad Request
- **AND** the response body SHALL contain error message: "Cannot delete site. 3 user(s) are still assigned to this site. Please remove all users before deleting the site."
- **AND** the site SHALL NOT be deleted from the database

#### Scenario: Delete site after all users removed

- **GIVEN** a site exists with ID 123 in organization 75
- **AND** the site previously had users but all have been removed
- **AND** the site has 0 users in SiteUserMap
- **WHEN** an organization admin calls DELETE `/api/v1/organizations/75/sites/123`
- **THEN** the API SHALL return HTTP 204 No Content
- **AND** the site SHALL be deleted from the database

#### Scenario: Delete site that never had users

- **GIVEN** a newly created site exists with ID 124 in organization 75
- **AND** no users have ever been assigned to this site (except the creator who was auto-assigned)
- **AND** the creator has been removed from the site
- **WHEN** an organization admin calls DELETE `/api/v1/organizations/75/sites/124`
- **THEN** the API SHALL return HTTP 204 No Content
- **AND** the site SHALL be deleted from the database

#### Scenario: Frontend displays deletion error

- **GIVEN** a user is viewing the site management tab for organization 75
- **AND** site "Downtown Office" has 5 users assigned
- **WHEN** the user clicks delete on "Downtown Office" and confirms
- **AND** the backend returns 400 with error message
- **THEN** the frontend SHALL display an error toast with the message: "Cannot delete site. 5 user(s) are still assigned to this site. Please remove all users before deleting the site."
- **AND** the site SHALL remain in the site list
- **AND** the delete confirmation modal SHALL close
