## ADDED Requirements

### Requirement: UI Feature Parity with System Rules
UI components SHALL only display interactive controls that correspond to actions the system actually supports. Disabled controls that can never become enabled SHALL be removed rather than shown in a perpetually disabled state.

#### Scenario: Personal Dashboard reflects single-site user constraint
- **WHEN** user views the Personal Dashboard (`/organization/{orgId}/sites/{siteId}/users/{userId}`)
- **AND** the system only allows users to be associated with a single site
- **THEN** the dashboard SHALL NOT display a "Switch Site" dropdown control
- **AND** the current site SHALL be displayed in a read-only breadcrumb format
- **AND** the user experience SHALL clearly indicate which site they are viewing without suggesting they can switch

#### Scenario: Breadcrumb shows organization and site context
- **WHEN** user views the Personal Dashboard
- **THEN** the site context card SHALL display:
  - Organization name with icon
  - Site name with icon
- **AND** both items SHALL be displayed in a breadcrumb navigation format
- **AND** no interactive site selection controls SHALL be present
