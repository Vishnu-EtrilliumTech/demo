# Feature Specification: GUID Primary Key Migration (Frontend)

**Feature Branch**: `036-guid-primary-key-migration`
**Created**: 2026-07-02
**Status**: Draft
**Input**: User description: "We have updated the backend to migrate from Primary keys Int to GUID. THe changes made are present in the attached file. We have to make appropriate changes in frontend to accomadate the same."

## Clarifications

### Session 2026-07-02

- Q: How should stale pre-migration cached state (Redux-Persist data in browser localStorage, potentially holding old numeric IDs) be handled once this ships? → A: No automatic cleanup logic. Rely on developers/testers manually clearing browser cache/site data after this ships. The application is still in development with a small number of developers testing it, so automatic persisted-state version bumping (or similar auto-purge logic) is deliberately out of scope to avoid adding complexity that could cause unintended cache clears once the app reaches production.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Core organization, site, and user workflows keep working (Priority: P1)

As any signed-in user (system admin, organization admin, site user, or legal expert), I need to view, create, update, and delete organizations, sites, and user accounts without errors, broken links, or missing data, now that the backend identifies every record with a new identifier format instead of a number.

**Why this priority**: Organizations, sites, and users are the foundational entities every other part of the application depends on. If navigation, lookups, or forms for these break, nothing else in the product is usable.

**Independent Test**: Can be fully tested by logging in, browsing the organization list, opening a site, opening a user's profile, and successfully creating/editing/deleting an organization, a site, and a user — all without console errors, broken URLs, or "not found" pages appearing unexpectedly.

**Acceptance Scenarios**:

1. **Given** an existing organization, **When** a user opens its details page, **Then** the correct organization loads and all its identifying links (to its sites, its users) work correctly.
2. **Given** a user creates a new site under an organization, **When** the form is submitted, **Then** the new site is created successfully and the user is navigated to the new site's page using its returned identifier.
3. **Given** a user edits an organization's or a site's details, **When** the update is saved, **Then** the UI reflects the saved changes correctly (including cases where the update response labels the identifier field differently than usual).
4. **Given** a user attempts to open a record using an old-style bookmarked or shared link that references a legacy identifier, **When** the page loads, **Then** the user sees a clear "not found" message rather than a broken or blank page.

---

### User Story 2 - Case management workflows keep working (Priority: P2)

As a site user or legal expert working a case, I need to view, create, update, and delete cases and everything attached to a case — tasks, documents, hearings, comments, contributors, clients, and invoices — without errors, so that day-to-day casework is not disrupted by the identifier format change.

**Why this priority**: Case management is the primary daily-use workflow of the application. It depends on the most identifier relationships (case, site, organization, assignee, creator, client, contributor) of any area of the app, making it the highest-risk area for subtle breakage.

**Independent Test**: Can be fully tested by opening an existing case, and independently exercising each tab (tasks, documents, hearings, comments, contributors, clients, invoices) to create, view, update, and delete a record in each, confirming correct data displays and no failed requests.

**Acceptance Scenarios**:

1. **Given** a case with existing tasks, documents, hearings, comments, contributors, and invoices, **When** the case page loads, **Then** every tab correctly displays its items with correct assignee/creator/author names resolved from the new identifier values.
2. **Given** a user adds a new task, document, hearing, comment, contributor, or invoice to a case, **When** the item is saved, **Then** it appears immediately in the corresponding list without requiring a page refresh, and any list ordering reflects true chronological order rather than identifier order.
3. **Given** a user filters or searches within a case sub-list (e.g., tasks by assignee, documents by uploader), **When** a filter is applied, **Then** the results are correctly scoped using the selected identifier.
4. **Given** a case comment or task comment record, **When** it is displayed, **Then** the author's identity is resolved correctly even though the record carries two different identity-related fields for the same user.

---

### User Story 3 - Legal expert, appointment, payment, and rating workflows keep working (Priority: P3)

As a legal expert, client, or admin, I need legal expert profiles, appointments, orders/payments, and ratings to continue to load and function correctly, including nested replies and history, so that the scheduling and billing side of the product is unaffected by the identifier change.

**Why this priority**: These workflows are important but are used less frequently per session than core case management, and several of them (address list, communications) have known response-shape quirks that are easy to miss and should be verified explicitly.

**Independent Test**: Can be fully tested by opening a legal expert's profile (including addresses, schedule, and portfolios), booking/viewing an appointment, viewing an order/payment, and posting/reading a rating with a reply — confirming each screen loads and each action completes successfully.

**Acceptance Scenarios**:

1. **Given** a legal expert's address list, **When** a new address is added, **Then** the UI correctly reads the plain list of new identifiers returned by the save action (not a list of objects) and updates the address list accordingly.
2. **Given** an appointment, order, or payment settlement associated with a legal expert and a client, **When** the relevant list is opened, **Then** all records display correctly linked to the right legal expert and client.
3. **Given** a rating with nested replies, **When** the rating detail is viewed, **Then** the reply thread displays in the correct parent-child structure.

---

### Edge Cases

- What happens when a user follows a link or has cached UI state containing a legacy identifier? The system must show a clear "not found" experience rather than crashing or displaying a blank/broken screen. No automatic cache-purge logic is built for this; browser cache/site data is cleared manually by developers/testers after this ships (see Clarifications).
- How does the system behave when a user attempts an action with no record selected (a previously-used "zero" or blank-number sentinel no longer applies)? The system must treat this as "nothing selected" using an empty/blank state, not a numeric comparison.
- How are lists that previously appeared to sort "newest first" by identifier affected? They must be re-verified to sort by an explicit date field, since identifiers no longer carry any chronological meaning.
- What happens when a response uses a non-standard field name for a record's own identifier (organization and site update responses) or returns a plain list instead of a list of objects (address creation)? The UI must still correctly extract and use the identifier(s) in these specific cases.
- What happens if a user pastes or types a malformed identifier into a URL? The system must show a "not found" page consistently, matching the uniform not-found behavior on the backend.
- How do locally-generated, not-yet-saved list rows (optimistic UI updates, if any exist) get a temporary identifier that won't collide with or be confused for a real saved record's identifier?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST correctly display, store, and transmit the new identifier format for every entity (organizations, sites, users of every type, clients, cases and all case sub-resources, legal experts and all their sub-resources, appointments, orders, payment settlements, ratings, and court/e-courts records) throughout the application.
- **FR-002**: System MUST NOT use a record's identifier to determine or display chronological order, recency, or "latest" status anywhere in the UI; any such logic MUST use an explicit date field (e.g., created date, modified date, or the relevant business date such as hearing date) instead.
- **FR-003**: System MUST represent "no record selected" or "not yet assigned" states using an empty/blank value rather than a numeric sentinel (e.g., zero), across all forms, filters, and guard conditions.
- **FR-004**: System MUST correctly build every in-app navigation link and every outgoing data request using the new identifier format for all entity relationships currently referenced in the application (including parent/child links such as organization→site→case, and cross-references such as assignee, creator, uploader, author, and contributor).
- **FR-005**: System MUST present a clear, user-friendly "not found" experience when a requested record cannot be resolved (including when a legacy-style or malformed identifier is encountered), instead of a broken page, blank screen, or unhandled error.
- **FR-006**: System MUST correctly read a record's own identifier from responses that label it with a non-standard field name, specifically the organization update and site update actions.
- **FR-007**: System MUST correctly read the legal expert address-creation response as a plain list of identifiers, not a list of identifier-bearing objects.
- **FR-008**: System MUST correctly distinguish and independently use the two different identity-related fields present together on case comments and case task comments (the pre-existing identity value and the newer identifier field), using each for its correct purpose without conflating them.
- **FR-009**: System MUST continue to support all existing sorting, filtering, searching, and pagination behavior across every list view without regression, correctly using the new identifier format wherever an identifier is used as a filter or sort input.
- **FR-010**: All sample/demo data, UI mock data, and automated test scenarios used within the application and its test suites MUST use valid values in the new identifier format rather than sequential numbers.
- **FR-011**: System MUST NOT rely on a "greater than zero" or similar numeric-only validity check to determine whether an identifier is valid or present; validity checks must work correctly with the new identifier format.

### Key Entities *(include if feature involves data)*

- **Organization**: A top-level tenant entity; owns sites and organization users. Its own identifier and its users' identifiers change format.
- **Site**: Belongs to an organization; owns site users and cases. Its identifier and its organization reference change format.
- **User (Organization User, Site User, System User, Legal Expert, Client)**: Any person interacting with the system; identifier and all role/organization/site relationship references change format.
- **Case and case sub-resources (Tasks, Documents, Hearings, Comments, Contributors, Clients, Invoices)**: Records scoped to a case; each carries its own identifier plus references to the case, site, organization, assignee, creator, and/or uploader, all changing format.
- **Legal Expert sub-resources (Addresses, Schedule, Type Portfolios, Communications)**: Records scoped to a legal expert profile; identifiers and legal-expert references change format, with the address list carrying a known response-shape quirk.
- **Appointment, Order, Payment Settlement**: Scheduling and billing records linking a legal expert and a client; identifiers and both relationship references change format.
- **Rating (and Rating Replies)**: Feedback records linking a legal expert and a client, with a threaded reply structure; identifiers, relationship references, and parent-reply references change format.
- **Court / e-Courts records**: Organization- and case-linked court data records; identifiers on linked/persisted records and search history change format (case number and file name identifiers remain text-based and are unaffected).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of existing user-facing workflows (create, view, edit, delete) across organizations, sites, users, cases and its sub-resources, legal experts, appointments, payments, and ratings complete successfully with zero identifier-related failures after the change.
- **SC-002**: Zero instances of list views displaying items out of true chronological order; "most recent" and default list ordering match the underlying date fields in 100% of spot checks across all list screens.
- **SC-003**: Zero unhandled errors or broken/blank screens occur when following any in-app link or reference across a full manual walkthrough of every major module (Organizations, Sites, Cases, Legal Experts, Appointments, Payments, Ratings, Court data).
- **SC-004**: 100% of automated frontend test suites (unit and end-to-end) pass using the new identifier format, with zero remaining hardcoded legacy-style sample identifiers in fixtures or mocks.
- **SC-005**: A dedicated regression pass across all modules listed in SC-003 finds zero defects attributable to the identifier format change before release.

## Assumptions

- The backend migration described in the reference document is fully shipped, stable, and requires no further backend changes; this feature is frontend-only.
- No backward compatibility with the old numeric identifier format is required or expected; any old link, bookmark, or cached reference using the legacy format is expected to resolve to a "not found" state, consistent with the backend's own behavior.
- Existing visual design, layout, and user experience are unchanged — this is a data-handling and correctness update, not a redesign.
- The two response field-naming irregularities (organization/site update responses using a differently-named identifier field) and the address-creation endpoint's plain-list response are permanent, intentional API behaviors (per the reference document) and must be accommodated as-is rather than treated as defects to report upstream.
- All areas enumerated in the backend reference document (organizations, sites, users of every type, clients, cases and all sub-resources, legal experts and all sub-resources, orders/payments/settlements, ratings, appointments, and court/e-courts data) are in scope for this single coordinated update, matching the backend's own single coordinated release.
- Automated test fixtures, mock data, and end-to-end test data are updated as part of this effort so the test suite remains a reliable signal of correctness.
- No automatic cleanup of stale, pre-migration persisted browser state (e.g., Redux-Persist data in localStorage) is built as part of this feature; developers/testers manually clear browser cache/site data after this ships. This is acceptable because the application is still in development with a small number of developers on it — automatic persisted-state versioning/purge logic is deliberately deferred to avoid adding complexity that could cause unintended cache clears in production later.
