# Feature Specification: Site Creation

**Feature Branch**: `003-site-creation`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow OrganizationAdmins and OrganizationClerks to create a new site (physical branch or location) under their organization. Sites are the operational unit within an org — all cases and site users belong to a site. The creation form captures full location details including geographic coordinates for map display.

---

## Actors

| Actor | Can create site? |
|---|---|
| `OrganizationAdmin` | Yes |
| `OrganizationClerk` | Yes |
| `SystemAdmin` | Yes (any organization) |
| Site-level roles | No — create site option is hidden from site users |

---

## User Scenarios & Testing

### P1 — Org Admin Creates a Site (Priority: P1)

As an OrganizationAdmin or OrganizationClerk,
I want to fill out a form to create a new site under my organization,
So that I can assign users to it and start managing cases there.

**Why this priority**: Sites are required before any cases or site users can be created. This is the critical setup step after org registration.

**Independent Test**: As OrgAdmin, navigate to Organization > Sites > Create Site. Fill all fields and submit. The new site appears in the sites list.

**Acceptance Scenarios**:

1. **Given** an authenticated OrganizationAdmin on the Sites management page,
   **When** they click "Create Site",
   **Then** a form is displayed with all required location fields: name, description, phone, email, address, pincode, district, state, landmark, locality, and a map-based coordinate picker.

2. **Given** all fields are filled with valid values,
   **When** the admin submits the form,
   **Then** a success notification is shown and the new site appears in the org's site list.

3. **Given** the submission is in progress,
   **When** the API call is pending,
   **Then** the submit button is disabled with a loading indicator.

---

### P2 — Site-Level Roles Cannot Access Create Site (Priority: P2)

As the platform,
I must hide or disable the site creation option for site-level users,
So that only org-level administrators can manage the organization's structure.

**Acceptance Scenarios**:

1. **Given** an authenticated SiteAdmin navigating to the organization's site management area,
   **When** the page loads,
   **Then** the "Create Site" button is not visible or is disabled with a tooltip explaining insufficient permissions.

---

### P3 — Coordinate Selection via Map (Priority: P3)

As an OrganizationAdmin creating a site,
I want to pick the site's location on a map,
So that the coordinates are accurate without requiring manual entry of decimal degrees.

**Acceptance Scenarios**:

1. **Given** the Create Site form is open,
   **When** the admin interacts with the map picker,
   **Then** clicking on the map sets the latitude and longitude fields automatically.

2. **Given** coordinates of 0.0, 0.0,
   **When** the form is submitted,
   **Then** the site is created successfully (zero coordinates are accepted).

---

### Edge Cases

- Site name at maximum length (100 chars) → accepted
- Two sites with the same name in the same org → both allowed (uniqueness not enforced)
- Email with uppercase letters → stored lowercase
- Pincode at maximum length (10 chars) → accepted

---

## Requirements

### Functional Requirements

- **FR-001**: The Create Site form MUST include all required fields: name (max 100), description (max 500), phone (10-digit), email (valid format), address (max 200), pincode (max 10), district (max 100), state (max 100), landmark (max 100), locality (max 100), latitude, longitude.
- **FR-002**: All fields are required — the form MUST prevent submission if any field is empty.
- **FR-003**: A map component MUST be provided to set latitude and longitude by clicking a location.
- **FR-004**: The Create Site action MUST be hidden or disabled for site-level roles.
- **FR-005**: On success, a toast notification MUST confirm site creation and the site list MUST refresh.
- **FR-006**: Inline validation MUST fire on field blur for required fields and email/phone format.
- **FR-007**: The state field SHOULD be a dropdown populated from the supported states reference data (spec `032`).

### Key Entities

- **Site**: A physical branch with full address, contact info, and geographic coordinates.
- **Site Location**: Latitude/longitude stored for map display.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: An authorized user can create a site in under 3 minutes including coordinate selection.
- **SC-002**: The map picker sets coordinates within 1 second of a click.
- **SC-003**: Site-level role users never see the Create Site option.
- **SC-004**: Newly created sites appear in the site list within 3 seconds of successful submission.

---

## Assumptions

- The map component uses Google Maps (NEXT_PUBLIC_GOOGLE_API_KEY is configured in the environment).
- All 12 fields are mandatory per the backend spec — the UI enforces this without exception.
- Coordinates can also be typed manually if the map picker is not used.

---

## Out of Scope

- Site edit/delete — spec `022-site-management`
- Adding users to the site — spec `004-site-user-creation`
- Creating cases under the site — spec `005-create-case`
