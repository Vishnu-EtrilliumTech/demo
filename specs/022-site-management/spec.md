# Feature Specification: Site Management

**Feature Branch**: `022-site-management`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow authorized users to view, update, and delete sites within an organization. Site creation is in spec `003`. This spec covers the full lifecycle management of existing sites including viewing all org sites, updating location and contact info, and deleting sites (with guard against sites that still have users).

---

## Actors

| Actor | View site | View all sites | Update | Delete |
|---|---|---|---|---|
| `OrganizationAdmin` | Yes | Yes | Yes | Yes |
| `OrganizationClerk` | Yes (assigned) | Yes | Yes | No |
| `SiteAdmin` | Yes (own) | No | Yes | No |
| `SiteClerk` | Yes (own) | No | Yes | No |
| `SiteSrLegalExpert`, `SiteLegalExpert` | Yes (own) | No | No | No |
| `SystemAdmin` | Yes | Yes | Yes | Yes |

---

## User Scenarios & Testing

### P1 — View Sites in the Organization (Priority: P1)

As an OrganizationAdmin,
I want to see all sites in my organization,
So that I can manage the firm's physical branch network.

**Acceptance Scenarios**:

1. **Given** an OrganizationAdmin on the Sites Management page,
   **When** the page loads,
   **Then** all sites in the org are listed with: site name, address, contact info, and status badge (Active/Inactive).

2. **Given** a SiteAdmin on the same page,
   **When** the page loads,
   **Then** they see only their own site details (no list of all sites).

---

### P2 — Update Site Details (Priority: P2)

As an OrganizationAdmin, OrganizationClerk, SiteAdmin, or SiteClerk,
I want to update a site's name, address, and contact information,
So that the site record stays accurate as the business evolves.

**Acceptance Scenarios**:

1. **Given** an authorized user on the site's Settings page,
   **When** they click "Edit Site" and update the site name,
   **Then** the updated name is saved and displayed.

2. **Given** a SiteLegalExpert navigating to site settings,
   **When** the page renders,
   **Then** no edit button is visible (legal experts can view but not update).

3. **Given** the user updates the site's coordinates via the map picker,
   **When** the edit form is submitted,
   **Then** the new coordinates are saved.

---

### P3 — Delete a Site (Priority: P3)

As an OrganizationAdmin or OrganizationClerk,
I want to delete a site that is no longer active,
So that the organization's site list is clean and accurate.

**Acceptance Scenarios**:

1. **Given** an OrganizationAdmin on the site management page,
   **When** they click "Delete Site" and confirm,
   **Then** the site and all its cases are permanently deleted.

2. **Given** a site that still has users assigned to it,
   **When** the admin tries to delete it,
   **Then** an error is shown: "This site has assigned users. Please remove all users before deleting the site."

3. **Given** a SiteAdmin trying to delete their site,
   **When** the page renders,
   **Then** no delete button is visible (site roles cannot delete sites).

---

### P4 — View Sites by User Assignment (Priority: P4)

As a site user with multiple site assignments,
I want to see all sites I am assigned to,
So that I can navigate between them.

**Acceptance Scenarios**:

1. **Given** a site user assigned to multiple sites,
   **When** they view the site selector in navigation,
   **Then** all their assigned sites are available to switch between.

---

### Edge Cases

- Deleting a site with cases but no users → allowed (cases are cascade-deleted)
- Contact email in update → stored lowercase
- Site name uniqueness is not enforced — duplicates are allowed

---

## Requirements

### Functional Requirements

- **FR-001**: The Sites list MUST show all org sites with name, address summary, status, and action buttons (filtered by role).
- **FR-002**: The site edit form MUST include all fields from creation plus active status toggle, pre-filled with current values.
- **FR-003**: The map picker MUST be available for coordinate updates on edit.
- **FR-004**: Delete MUST require a confirmation dialog warning about permanent cascade deletion.
- **FR-005**: Delete action MUST be hidden for all site-level roles and OrganizationClerk.
- **FR-006**: The error "site has users" MUST be displayed when attempting to delete a site with assigned users.
- **FR-007**: Site-level roles MUST only see their own site — the "all sites" list is restricted to org and system roles.

### Key Entities

- **Site**: A physical branch with full address, contact info, coordinates, and active status.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: The sites list renders within 2 seconds for an org with up to 20 sites.
- **SC-002**: The "has users" delete guard prevents data loss — zero sites deleted while users are assigned.
- **SC-003**: Edit form pre-fills all current values correctly on first render.
- **SC-004**: Site legal experts see their site in read-only mode with no edit controls.

---

## Assumptions

- The state field in the site edit form uses the supported states reference data (spec `032`).
- The map coordinate picker uses Google Maps (same as site creation).

---

## Out of Scope

- Site creation — spec `003-site-creation`
- Site user management — spec `026-site-user-management`
- Site case management — specs `005`–`012`
