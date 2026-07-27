# Feature Specification: Organization Hearings (Org-Level View)

**Feature Branch**: `024-organization-hearings`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Provide OrganizationAdmins and OrganizationClerks with an aggregated view of all upcoming hearings across all sites within their organization. This is the org-level hearing overview, complementing the site-level hearing view (spec `009`).

---

## Actors

| Actor | Access |
|---|---|
| `OrganizationAdmin` | Yes — own org |
| `OrganizationClerk` | Yes — own org |
| `SystemAdmin`, `SupportEngineer` | Yes — any org |
| Site-level roles | No — use site-level hearing view (spec `009`) |

---

## User Scenarios & Testing

### P1 — Org Admin Views All Upcoming Hearings (Priority: P1)

As an OrganizationAdmin or OrganizationClerk,
I want to see all upcoming court hearings across all sites in my organization,
So that I can oversee the firm's court schedule holistically.

**Independent Test**: As OrgAdmin, navigate to Organization > Hearings. All future hearings across all org sites appear ordered by date.

**Acceptance Scenarios**:

1. **Given** an authenticated OrganizationAdmin on the org-level Hearings page,
   **When** the page loads,
   **Then** all future hearings across all sites are shown ordered by date ascending, with: date/time, location, case name, site name, assigned attendee.

2. **Given** the org has no upcoming hearings,
   **When** the page loads,
   **Then** an empty state message is shown: "No upcoming hearings across your organization."

3. **Given** a SiteAdmin trying to access the org hearings URL,
   **When** the page loads,
   **Then** an access denied error is shown.

---

### P2 — Navigate to Case from Hearing (Priority: P2)

As an org-level administrator,
I want to click on a hearing to go to the case it belongs to,
So that I can quickly act on a specific matter.

**Acceptance Scenarios**:

1. **Given** the org hearings list is showing,
   **When** the admin clicks on a hearing entry,
   **Then** they navigate to the full case detail page for that hearing's case.

---

### Edge Cases

- Past hearings excluded — only future hearings shown
- All hearings returned in one response (no pagination — known limitation for large orgs)
- OrgAdmin from Org A cannot see Org B's hearings

---

## Requirements

### Functional Requirements

- **FR-001**: The Org Hearings page MUST show only future hearings, ordered by date ascending.
- **FR-002**: Each hearing entry MUST include: date/time, location, case name, site name, assigned attendee.
- **FR-003**: Access MUST be restricted to `OrganizationAdmin`, `OrganizationClerk`, `SystemAdmin`, `SupportEngineer`.
- **FR-004**: Site-level roles MUST see an access denied message if they reach this page.
- **FR-005**: An empty list MUST show a friendly empty state (not an error or 404).
- **FR-006**: Each hearing MUST be clickable, navigating to the case detail page.

### Key Entities

- **Org-Level Hearing View**: All future hearings across all sites, with site context in each entry.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Org hearings page renders within 3 seconds for up to 50 upcoming hearings.
- **SC-002**: Hearings always display in date-ascending order on first render.
- **SC-003**: Site-level roles never see this page.
- **SC-004**: Past hearings are never included in the results.

---

## Assumptions

- Accessed from org-level navigation (not from within a specific site).
- Site name included in each entry so users can identify the source site.
- No pagination for MVP — all future hearings returned in one response.

---

## Out of Scope

- Scheduling or editing hearings — spec `009-case-hearing-management`
- Past hearing history — not included in this view
- Hearing notifications — not implemented
