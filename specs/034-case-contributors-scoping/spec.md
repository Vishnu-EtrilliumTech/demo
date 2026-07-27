# Feature Specification: Case Contributors — Org/Site Scoping & Eligible-Users Picker

**Feature Branch**: `034-case-contributors-scoping`
**Created**: 2026-06-17
**Status**: Draft
**Input**: User description: "In our case-contributors feature, we had a few gaps including not having the contributors organization scoped and site scoped in the DB and not having an endpoint for the adding contributors dropdown box. Now I have integrated them in the backend and I shall attach the report markdown file. We have to make the necessary changes in the frontend for the same."

## Overview

This feature refines the existing **Case Contributors** capability (feature 033). The backend
has been updated so that contributor membership is now organization- and site-scoped, and a
dedicated server-side endpoint now returns exactly the users who are eligible to be added as
contributors to a case. The frontend must adopt these backend changes so that the
"Add contributor" experience is driven by the authoritative eligibility list instead of
filtering the full site-member list in the browser.

The change is **additive and low-risk**: no existing route was removed or renamed, and no
existing request body changed shape. The frontend work is limited to (1) sourcing the picker
from the new eligibility endpoint, (2) keeping error handling robust for rejected adds, and
(3) optionally consuming new identifying fields on the contributor record.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a contributor from an authoritative eligibility list (Priority: P1)

A case manager (case creator, assigned user, or an admin who can manage contributors) opens the
Contributors tab of a case and clicks "Add Contributor". The member picker now shows only the
users who can actually be added — it never lists the case creator, the assigned user, anyone who
is already a contributor, or any admin. The manager selects a member, chooses an access level,
and adds them successfully without encountering a rejection.

**Why this priority**: This is the core of the change. Sourcing the picker from the backend
eligibility list removes the client-side filtering that could not detect admins, eliminating the
most common cause of a confusing "add rejected" error and guaranteeing the picker only offers
addable users.

**Independent Test**: Open the Contributors tab on a case as a manager, open the Add Contributor
picker, and confirm the listed members exclude the creator, assignee, existing contributors, and
admins; then add one of the offered members and confirm success.

**Acceptance Scenarios**:

1. **Given** a case with a creator, an assignee, several existing contributors, and at least one
   admin site member, **When** the manager opens the Add Contributor picker, **Then** none of
   those users appear in the list and only genuinely-addable members are shown.
2. **Given** the manager has selected an eligible member and an access level, **When** they
   confirm the add, **Then** the contributor is added, the list refreshes to include them, and a
   success notification is shown.
3. **Given** every site member is already a contributor, the creator, the assignee, or an admin,
   **When** the manager opens the picker, **Then** the picker shows an empty state indicating no
   eligible members remain.
4. **Given** the eligibility list is still loading, **When** the manager opens the picker,
   **Then** a loading indication is shown instead of an empty or stale list.

---

### User Story 2 - Graceful handling of a rejected add (Priority: P2)

In rare cases the picker data is stale (e.g., another manager just added the same member, or a
member was just promoted to admin). When the manager tries to add such a member, the backend
rejects the add. The manager sees a clear message explaining why and the list reflects reality
after the next refresh.

**Why this priority**: Even with an authoritative picker, concurrent edits can produce a
rejection. Surfacing the backend's reason keeps the manager informed rather than failing
silently. Lower priority than P1 because it is an edge-path safeguard.

**Independent Test**: Simulate a rejected add (e.g., adding a member who became ineligible) and
confirm the returned reason is displayed and the contributor list remains consistent.

**Acceptance Scenarios**:

1. **Given** a stale picker entry, **When** the manager attempts to add that member and the
   backend rejects it, **Then** the specific rejection reason from the backend is surfaced to the
   manager.
2. **Given** an add was rejected, **When** the manager re-opens the picker, **Then** the
   eligibility list reflects the current state.

---

### User Story 3 - Per-site contributor list correctness (Priority: P3)

When viewing a case that is associated with a specific site, the Contributors tab lists only the
contributors recorded against that site. For the common single-site case this is unchanged and
invisible; for a case linked under multiple sites, each site shows its own contributor list.

**Why this priority**: This is primarily a backend correctness change that the frontend inherits
for free. It only becomes user-visible in the uncommon multi-site case, so it is the lowest
priority to verify.

**Independent Test**: View a case's Contributors tab via a given site and confirm the listed
contributors are those scoped to that site.

**Acceptance Scenarios**:

1. **Given** a case viewed under a particular site, **When** the Contributors tab loads, **Then**
   the list shows the contributors scoped to that site.

---

### Edge Cases

- **Eligibility endpoint fails to load**: The picker shows an error/empty state and the manager
  cannot select a phantom member; adding is effectively blocked until the list can be retrieved.
- **Empty eligibility list**: The picker communicates that there are no members left to add
  rather than appearing broken.
- **Concurrent add of the same member**: The second add is rejected by the backend and the reason
  is surfaced; the list converges after refresh.
- **Member becomes an admin between list load and add**: The add is rejected with the admin
  reason and surfaced to the manager.
- **Viewer without manage permission**: No Add/Edit/Remove controls render and the eligibility
  list is not needed for them.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The "Add contributor" member picker MUST be populated from the backend
  eligible-users source for the case, rather than from the full site-member list filtered in the
  browser.
- **FR-002**: The picker MUST only offer users the backend deems addable — excluding the case
  creator, the assigned user, existing contributors, and all admins (system, organization, and
  site admins).
- **FR-003**: The eligibility list MUST be scoped to the same organization, site, and case the
  Contributors tab is being viewed under.
- **FR-004**: Each offered member MUST display a human-readable name and a secondary
  email/disambiguation value, and selecting a member MUST carry its user identifier into the add
  request.
- **FR-005**: While the eligibility list is loading, the picker MUST show a loading indication;
  when it resolves empty, the picker MUST show an explicit "no eligible members" state.
- **FR-006**: The eligibility list MUST be (re)fetched so that it reflects current state when the
  manager opens the picker, and MUST be refreshed after a contributor is successfully added so an
  added member no longer appears.
- **FR-007**: When an add is rejected by the backend, the system MUST surface the specific reason
  returned by the backend to the manager.
- **FR-008**: The contributor list shown on the Contributors tab MUST reflect the site-scoped set
  of contributors for the case as returned by the backend.
- **FR-009**: The system MUST continue to gate management controls (add/edit/remove) so they only
  render for users permitted to manage contributors; non-managers MUST NOT see the picker.
- **FR-010**: Existing add/update/remove request and response handling MUST continue to work
  unchanged aside from the picker data source; no existing request payload shape changes.
- **FR-011**: The frontend MAY consume newly-available identifying fields on a contributor record
  (the site and organization the membership is held against); ignoring them MUST NOT break
  existing behavior.
- **FR-012**: Task and hearing assignment flows MUST remain unchanged; no frontend change is
  required for the backend's revised auto-contribution behavior.

### Key Entities *(include if feature involves data)*

- **Eligible User**: A site member who can be added as a contributor to a specific case.
  Identified by a user id, a display name, and an email. Excludes the creator, assignee, existing
  contributors, and admins.
- **Case Contributor**: A user granted scoped access to a case at a given access level
  (View-only or Edit), now additionally identified by the site and organization the membership is
  recorded against, plus the existing user, access-level, added-by, and date-added details.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Add Contributor picker never offers a user that the add operation would reject
  under steady-state (non-concurrent) conditions — 0 rejections caused by the creator, assignee,
  existing contributors, or admins appearing in the list.
- **SC-002**: A manager can add an eligible contributor in under 30 seconds from opening the
  Contributors tab, with no manual filtering needed.
- **SC-003**: 100% of add rejections display a human-readable reason to the manager rather than
  failing silently.
- **SC-004**: The contributor list shown for a case matches the site under which the case is being
  viewed in 100% of single- and multi-site cases.
- **SC-005**: No regression in existing add/edit/remove contributor flows or in task/hearing
  assignment flows.

## Assumptions

- The backend exposes an endpoint that returns the eligible-to-add users for a case scoped by
  organization, site, and case, returning each user's id, full name, and email; this is the
  authoritative source for the picker.
- Authorization to view the eligibility list mirrors the rule for viewing/listing contributors;
  callers without a relationship to the case are denied and the picker is therefore unavailable
  to them.
- The contributor list endpoint is now site-scoped server-side; the frontend continues to call it
  with the current organization/site/case context and does not need to merge multiple sites.
- The added `siteId` and `organizationId` fields on the contributor record are optional for the
  UI to consume and are safe to ignore for current displays.
- No changes are required to task or hearing assignment request bodies or flows.
- This work builds on the existing feature 033 implementation (Contributors tab, modals,
  contributor data hook, and case API service layer) and reuses those structures.
