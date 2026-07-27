# data-integrity Specification Delta

## ADDED Requirements

### Requirement: Site Cascade Deletion
The system SHALL cascade delete all site-related entities when a site is deleted, provided no site-level users are assigned.

#### Scenario: Delete site with only org-level users
- **WHEN** an OrganizationAdmin attempts to delete a site
- **AND** the site has users in site_user_map with only org-level roles (OrganizationAdmin, OrganizationClerk)
- **THEN** the site is deleted
- **AND** all site_user_map entries for the site are deleted
- **AND** all cases associated with the site are deleted
- **AND** all case-related entities (tasks, comments, documents, hearings, invoices, clients) are deleted

#### Scenario: Block deletion when site-level users exist
- **WHEN** an OrganizationAdmin attempts to delete a site
- **AND** the site has users in site_user_map with site-level roles (SiteAdmin, SiteClerk, SiteLegalExpert, SiteSrLegalExpert)
- **THEN** the deletion is blocked
- **AND** an error message is returned indicating site-level users must be removed first

#### Scenario: Delete site with no users
- **WHEN** an OrganizationAdmin attempts to delete a site
- **AND** the site has no users in site_user_map
- **THEN** the site is deleted
- **AND** all cases associated with the site are deleted
- **AND** all case-related entities are deleted

#### Scenario: Cascade deletion order
- **WHEN** a site is being deleted with cascade
- **THEN** entities are deleted in order: task comments/documents, tasks, case clients/comments/documents/hearings/invoices, legal expert mappings, cases, site-case mappings, site-user mappings, site

#### Scenario: Transaction rollback on failure
- **WHEN** a site deletion is in progress
- **AND** any entity deletion fails
- **THEN** all deletions are rolled back
- **AND** the site and all related data remain intact
- **AND** an error message is returned
