# Feature Specification: Legal Expert Search

**Feature Branch**: `028-legal-expert-search`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Provide a public search page where anyone — authenticated or unauthenticated — can find legal experts by location proximity and/or specialization. Only active experts who have fully completed their onboarding profile (reached the Schedule stage) appear in results. This is the primary discovery mechanism for clients before booking an appointment.

---

## Actors

| Actor | Search |
|---|---|
| Public (unauthenticated) | Yes |
| Any authenticated user | Yes |

Search is fully public — no login required.

---

## User Scenarios & Testing

### P1 — Search by Location (Priority: P1)

As an unauthenticated user or client,
I want to search for legal experts near a specific location,
So that I can find professionals who can meet me in person.

**Independent Test**: Open the Expert Search page without logging in. Enter a location and search radius. Results show only Schedule-stage active experts ordered by proximity.

**Acceptance Scenarios**:

1. **Given** a user on the Expert Search page,
   **When** they enter a location and select a search radius, then click Search,
   **Then** matching legal experts within that radius are shown ordered by distance, each with: name, specialization, address, and rating summary.

2. **Given** no experts are within the specified radius,
   **When** the search returns,
   **Then** an empty state message is shown: "No legal experts found in this area. Try expanding your search radius."

3. **Given** a user searches with an extremely small radius (e.g., 0 km),
   **When** results load,
   **Then** only experts at the exact coordinates appear (or an empty state if none).

---

### P2 — Search by Specialization (Priority: P2)

As a user looking for a specific type of legal help,
I want to filter experts by their area of legal specialization,
So that I can find someone qualified for my specific need.

**Acceptance Scenarios**:

1. **Given** a user selects a specialization from the filter dropdown,
   **When** they search,
   **Then** only experts matching that specialization are shown.

2. **Given** a user applies both a location and a specialization filter,
   **When** they search,
   **Then** only experts matching both criteria are shown.

---

### P3 — Search with No Filters (Priority: P3)

As a user browsing the platform,
I want to see all available legal experts,
So that I can get an overview of who is available before narrowing down.

**Acceptance Scenarios**:

1. **Given** a user submits the search form with no filters,
   **When** results load,
   **Then** all active Schedule-stage legal experts are shown.

---

### Edge Cases

- Incomplete-profile experts (Registration, PersonalDetails, ProfessionalDetails stage) never appear in results
- Inactive (disabled) experts never appear in results
- Experts without a registered address are excluded from location-based results
- No login required — the page is fully accessible to unauthenticated users

---

## Requirements

### Functional Requirements

- **FR-001**: The Expert Search page MUST be accessible without login — no authentication gate.
- **FR-002**: The search form MUST support filtering by: geographic location (with radius selector) and legal specialization (dropdown from reference data).
- **FR-003**: Results MUST only include active experts at the Schedule onboarding stage — incomplete or inactive experts are excluded.
- **FR-004**: Location-based results MUST be ordered by proximity (nearest first).
- **FR-005**: Each result card MUST show: expert name, specialization(s), address, and rating summary.
- **FR-006**: An empty result MUST show a user-friendly empty state message with suggestions (e.g., expand radius), not an error.
- **FR-007**: Submitting with no filters MUST return all qualifying experts.

### Key Entities

- **Search Result**: An active, Schedule-stage expert with name, specialization, address, and rating summary.
- **Proximity Filter**: Geospatial radius search using expert address coordinates.
- **Specialization Filter**: Filter against the expert's portfolio/legal type.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: The search page loads within 2 seconds without login.
- **SC-002**: Search results appear within 2 seconds of submitting the form.
- **SC-003**: Incomplete or inactive experts never appear in any search result set.
- **SC-004**: An empty result always shows a human-readable message — never a blank page or error.

---

## Assumptions

- Legal specialization options in the filter dropdown are the same reference data as expert portfolios (pre-seeded on the platform).
- Location input uses the device's geolocation API or a text-based address lookup — the exact implementation is determined during build.
- Rating summary shown in results is an aggregate (average score + count) — individual ratings are on the expert's full profile page.

---

## Out of Scope

- Legal expert profile and onboarding — spec `027-legal-expert-profile`
- Appointment booking (post-search) — spec `014-appointments`
- Expert registration and admin management — spec `013-legal-expert-management`
