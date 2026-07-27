# Feature Specification: Current User Profile & Reference Data

**Feature Branch**: `032-current-user-profile`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Provide two utility features used throughout the platform: (1) allow any authenticated user to retrieve their own profile and org membership context without knowing their user ID, and (2) expose the list of supported Indian states as reference data for address and location dropdowns across all forms.

---

## Actors

| Actor | Get own profile | Get states list |
|---|---|---|
| Any authenticated user | Yes | Yes |
| Unauthenticated user | No | No |

---

## User Scenarios & Testing

### P1 — User Views Their Own Profile (Priority: P1)

As any authenticated user,
I want to view my own account profile including my organization membership,
So that I can verify my details and understand my access context.

**Independent Test**: Log in as any role. Navigate to Profile or Account Settings. Your personal details and org membership context are shown without needing to know your user ID.

**Acceptance Scenarios**:

1. **Given** any authenticated user on their profile/account page,
   **When** the page loads,
   **Then** their personal details (name, email, phone, gender, role) and organization context (org name, site name if applicable) are shown.

2. **Given** the user's account cannot be found (edge case),
   **When** the profile page loads,
   **Then** an error message is shown and they are prompted to contact support.

---

### P2 — State Dropdown Populates in Address Forms (Priority: P2)

As any authenticated user filling out an address form,
I want to see a dropdown list of supported Indian states,
So that I can select the correct state without free-typing.

**Acceptance Scenarios**:

1. **Given** an authenticated user on any form that includes a State field (site creation, expert address, etc.),
   **When** the form loads,
   **Then** the State dropdown is pre-populated with all supported Indian states from the reference data.

2. **Given** the states reference data fails to load,
   **When** the form renders,
   **Then** the State field gracefully falls back (e.g., a text input) or shows an error — the form does not break.

---

### Edge Cases

- The `/me` profile endpoint identifies the user from their login session — no user ID is passed in the URL
- Unauthenticated users cannot access either the profile page or the states list
- States are pre-seeded reference data — they do not change and are not editable through the UI

---

## Requirements

### Functional Requirements

- **FR-001**: Any authenticated user MUST be able to view their own profile (name, email, phone, gender, role, org/site context) from a dedicated profile or account settings page.
- **FR-002**: The profile page MUST load the user's data without requiring the user to know or supply their user ID.
- **FR-003**: All address/location forms across the platform that include a State field MUST use the supported states reference data to populate a dropdown, not a free-text field.
- **FR-004**: The states dropdown MUST be loaded at form render time and cached — it should not cause a delay in form interaction.
- **FR-005**: If the states data fails to load, the form MUST degrade gracefully rather than blocking the user.

### Key Entities

- **Current User**: The authenticated user's profile including org membership context, identified by their login session.
- **Supported State**: Reference data for an Indian state, used to populate state dropdowns across address and location forms.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: The user profile page loads within 2 seconds after login for any role.
- **SC-002**: State dropdowns load and are interactive within 1 second of form render.
- **SC-003**: No address or location form on the platform uses a free-text state field — all use the reference dropdown.

---

## Assumptions

- The "current user" profile uses the authenticated session token — there is no URL parameter for user ID on the personal profile page.
- The supported states list is pre-seeded and static — it is safe to cache across the session.
- Org membership context shown on the profile (org name, site name) is read-only — changes are made through org or site management pages.

---

## Out of Scope

- Updating user profile fields — managed per role via: org users (spec `025`), site users (spec `026`), legal experts (spec `027`), clients (spec `015`)
- Creating user accounts — handled in respective registration/creation specs
