# Feature Specification: Unified Calendar, Case Favourites & Archive, and eCourts Onboarding Import

**Feature Branch**: `038-calendar-favourites-archive-ecourts`
**Created**: 2026-07-29
**Status**: Draft
**Input**: User description: "Unified Calendar (Hearings/Tasks/Notes; Events in Phase 2), Case Favourites & Archive, and eCourts Onboarding Import — mock UI implementation for the Lawsome.Web.UI prototype, based on the 'LawsomeCalendar Feature Solution Proposal' (Revision 2, 2026-07-29). This is a UI prototype repo (mock data only, no real backend calls) — the spec describes user-facing behavior to mock in the frontend, not backend API/DB design. Phase 1 only; Calendar Events/Meetings are explicitly out of scope (Phase 2). Covers: a unified Calendar (Org and Site scope) showing Hearings/Tasks/Notes with Priority color-coding and quick-set, an org-level default item-type filter, Case Favourites, Case Archive, eCourts advocate-name search with bulk import, and a Reminders 'my items' panel. Retires the existing placeholder Diary scaffolding in favor of the new Calendar."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unified Calendar of Hearings, Tasks, and Notes (Priority: P1)

An Organization or Site staff member opens a single Calendar view (available both at the Organization level and, scoped to one Site, at the Site level) and sees their Hearings, Tasks, and Notes together on a Month/Week/Day grid, each color-coded by Priority. From this view they can filter by Site (org-level view only), by "favourite cases only," and by item type, and can create a new Hearing, Task, or Note directly from the grid without navigating elsewhere.

**Why this priority**: This is the core deliverable — without one merged view of dated items, users must keep checking separate case, task, and note screens to know what's coming up. Every other story in this feature builds on this view existing.

**Independent Test**: Can be fully tested by opening the Calendar at the Organization level, confirming Hearings, Tasks, and Notes from mock data all appear on their correct dates with the correct Priority color, and creating one new Task from the "+Add" action that then appears on the grid.

**Acceptance Scenarios**:

1. **Given** the Organization-level Calendar, **When** the page loads, **Then** the Month view shows all Hearings, Tasks, and Notes the current user has access to, each labeled by item type and color-coded by Priority (Critical=Red, High=Orange, Medium=Yellow, Low/unset=Green).
2. **Given** the Calendar in Month view, **When** the user switches to Week or Day view, **Then** the same filtered set of items renders at the finer granularity, correctly placed on their date/time.
3. **Given** the Organization-level Calendar, **When** the user picks a Site from the Site filter dropdown, **Then** only items scoped to that Site (plus Org-wide items) remain visible.
4. **Given** the Calendar filter bar, **When** the user toggles "Favourites only," **Then** only case-linked items whose case is one of the user's favourites remain visible, and pure Org/Site items with no case link are hidden.
5. **Given** the Calendar filter bar, **When** the user unchecks the "Note" item-type checkbox, **Then** Notes disappear from the grid while Hearings and Tasks remain, and this change does not alter what any other user sees.
6. **Given** the "+Add" action on the Calendar, **When** the user chooses "Task," **Then** a Task form opens where they pick a scope (Org, Site, or Case), enter a title/due date/assignee, optionally set a Priority, and on save the new Task appears on the grid on its due date.
7. **Given** the "+Add" action on the Calendar, **When** the user chooses "Note," **Then** a Note form opens where they pick a scope (Org, Site, or Case), enter a title/body/date, tag any number of people with no upper limit, optionally set a Priority, and on save the new Note appears on the grid on its date.
8. **Given** the "+Add" action on the Calendar, **When** the user chooses "Hearing," **Then** a case picker opens first; selecting an existing case proceeds into the existing Hearing creation form with that case prefilled.
9. **Given** the Hearing case picker, **When** the user searches for a case that doesn't exist yet, **Then** an inline "Case not found — create new case" option lets them quick-create a case, after which the flow auto-selects the new case and continues into the Hearing form.
10. **Given** any Hearing, Task, or Note shown on the Calendar, **When** the user clicks its small color-swatch control (not the item itself), **Then** a 4-color picker (Red/Orange/Yellow/Green) opens, and picking a color immediately recolors that item on the grid without opening its full edit form.
11. **Given** an Organization Settings screen, **When** an Organization Admin sets the "Default Calendar Filters" to a subset of item types (e.g. Hearings only), **Then** any user opening the Calendar for the first time in a session sees only that subset checked by default, though they may still check/uncheck types for their own session.

---

### User Story 2 - Case Favourites (Priority: P2)

A staff member marks the cases they work with most often as favourites from any case list, so they can quickly filter down to just those cases and so the Calendar can offer a "favourites only" view.

**Why this priority**: Favouriting is a small, self-contained enhancement to existing case lists, and is a dependency for the "favourites only" Calendar filter in User Story 1, but the Calendar itself remains useful without it, so it is ranked below the core Calendar view.

**Independent Test**: Can be fully tested by opening any case list, starring one case, confirming its star indicator fills in and persists across navigation, then toggling "Favourites only" and confirming only starred cases remain listed.

**Acceptance Scenarios**:

1. **Given** a case list (Organization or Site scope), **When** the user clicks the star icon on a case row, **Then** the icon fills in immediately to indicate the case is now a favourite for that user.
2. **Given** a case already marked as a favourite, **When** the user clicks its filled star again, **Then** it unmarks as a favourite and the icon reverts to its unfilled state.
3. **Given** a case list with a mix of favourited and non-favourited cases, **When** the user enables the "Favourites only" filter, **Then** only favourited cases remain in the list.

---

### User Story 3 - Case Archive (Priority: P2)

A staff member archives cases that are closed or otherwise inactive so that default case lists stay focused on current work, while still being able to view archived cases and their history on demand.

**Why this priority**: Like Favourites, this is a self-contained case-list enhancement that doesn't block the Calendar view, but materially improves usability for organizations with a large case backlog — ranked alongside Favourites.

**Independent Test**: Can be fully tested by archiving one case from a case list, confirming it disappears from the default list, then enabling "Include archived" and confirming it reappears with a visual archived indicator, and confirming its Hearings/Tasks/Notes still appear on the Calendar by date.

**Acceptance Scenarios**:

1. **Given** a case list row menu, **When** the user selects "Archive," **Then** the case is removed from the default case list view.
2. **Given** the case list with "Include archived" toggled off (the default), **When** the list loads, **Then** archived cases are not shown.
3. **Given** the case list with "Include archived" toggled on, **When** the list loads, **Then** archived cases reappear, visually marked as archived, with an "Unarchive" action available in their row menu.
4. **Given** an archived case with existing Hearings, Tasks, or Notes, **When** the user views the Calendar, **Then** those items still appear on their scheduled dates, unaffected by the case's archived status.

---

### User Story 4 - eCourts Onboarding Bulk Import (Priority: P3)

During org onboarding, a staff member searches eCourts data by advocate name (in addition to the existing court/CNR search), selects multiple matching cases via checkboxes, and imports them into Lawsome in one action instead of creating cases one at a time.

**Why this priority**: This speeds up a one-time onboarding workflow rather than day-to-day usage, so it's valuable but lower-frequency than the Calendar and case-list stories above.

**Independent Test**: Can be fully tested by searching eCourts mock data by advocate name, selecting two or more result rows, clicking "Import selected," and confirming a per-row result (Created / Already Linked / Error) displays for each selected row.

**Acceptance Scenarios**:

1. **Given** the eCourts search screen, **When** the user enters an advocate name and searches, **Then** matching mock eCourts results display alongside the existing court/CNR search results.
2. **Given** a list of eCourts search results, **When** the user checks multiple rows and clicks "Import selected," **Then** each selected row shows an individual result status (Created, Already Linked, or Error) once the import completes.
3. **Given** an import batch where one row returns "Already Linked" or "Error," **When** the batch completes, **Then** the remaining rows that succeeded still show "Created" — one row's failure does not block or hide the others' results.

---

### User Story 5 - Reminders: "My Items" View (Priority: P4)

A staff member opens a "Reminders" panel reachable from the Calendar to see, in one place, only the Tasks, Hearings, Notes, and favourite cases that belong to or are relevant to them personally, without applying any Calendar filters.

**Why this priority**: This is a convenience view layered on top of data already surfaced by the Calendar and case-list stories above, so it depends on those existing first and is the lowest-priority story in this feature.

**Independent Test**: Can be fully tested by opening the Reminders panel as a specific mock user and confirming it lists exactly that user's own Tasks (created by or assigned to them), Hearings they have access to, Notes they created or are tagged in, and their favourite cases — and no one else's.

**Acceptance Scenarios**:

1. **Given** the Calendar view, **When** the user opens "Reminders," **Then** a panel/view lists their own Tasks, Hearings, Notes, and favourite cases grouped by type.
2. **Given** the Reminders panel, **When** it loads, **Then** it reflects only the current logged-in user's items — not the full org or site list.
3. **Given** the Reminders panel, **When** no items exist for a given type (e.g. the user has no favourite cases), **Then** that section shows an empty-state message rather than an error.

---

### Edge Cases

- What happens when a Task, Note, or Hearing has no Priority set? It renders with the Green/default color, identical in appearance to an explicit "Low" priority.
- What happens when a user removes all item-type filter checkboxes on the Calendar? The grid shows an empty state for the selected range rather than falling back to showing everything.
- What happens when the "Favourites only" filter is on and a pure Org/Site Task or Note (no case link) exists in range? It is hidden, since favourite status is a case-level concept and such items have no case to match against.
- What happens when a Note is tagged with a very large number of people? The UI must still render legibly (e.g. truncating the visible list with a "+N more" indicator) since there is no cap on tagged users.
- What happens when the user tries to quick-create a case from the Hearing case picker using a case number/title that already exists? The picker should surface the existing case as a search match before offering "create new," so users aren't led to create duplicates.
- What happens when a case is both archived and a favourite? Archiving does not clear favourite status; if "Include archived" and "Favourites only" are both on, it still appears.
- What happens on the Site-level Calendar route — can the user switch to a different Site? No; the Site filter dropdown only appears on the Organization-level Calendar. The Site-level Calendar is scoped to its one Site.
- What happens to the existing placeholder "Diary" screens once this feature ships? They are retired/removed in favor of the new Calendar under the same route family, so only one such feature exists in the app at a time.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a Calendar view at the Organization scope showing Hearings, Tasks, and Notes on a Month/Week/Day grid.
- **FR-002**: System MUST provide an equivalent Calendar view at the Site scope, scoped to that Site's items plus Org-wide items, without a Site-switcher.
- **FR-003**: System MUST color-code every Hearing, Task, and Note on the Calendar by its Priority (Critical=Red, High=Orange, Medium=Yellow, Low or unset=Green/default).
- **FR-004**: Users MUST be able to set Priority on a Hearing, Task, or Note from that item's create/edit form.
- **FR-005**: Users MUST be able to change an item's Priority directly from the Calendar via a dedicated color-swatch control, without opening the item's full edit form, with the item recoloring immediately.
- **FR-006**: System MUST provide a Calendar filter bar with a Site dropdown (Organization-level view only), a "Favourites only" toggle, and item-type checkboxes for Hearing/Task/Note.
- **FR-007**: System MUST let an Organization Admin configure a default set of item types shown on the Calendar (Org Settings), used as the initial filter-bar state for any user opening the Calendar.
- **FR-008**: Users MUST be able to override the default item-type filter for their own session without changing the org-wide default.
- **FR-009**: Users MUST be able to create a Task from the Calendar, scoped to Organization, Site, or Case, with a title, optional description, due date, assignee, and optional Priority.
- **FR-010**: Users MUST be able to create a Note from the Calendar, scoped to Organization, Site, or Case, with a title, optional body, date, any number of tagged people (no cap), and optional Priority.
- **FR-011**: Users MUST be able to create a Hearing from the Calendar by first selecting a Case, reusing the existing Hearing creation form.
- **FR-012**: System MUST let a user create a new Case inline from the Hearing case picker when the desired case does not yet exist, then continue into the Hearing form with that case prefilled.
- **FR-013**: System MUST let any user mark or unmark a case as a favourite from a case list, with a visible indicator reflecting current favourite status.
- **FR-014**: System MUST provide a "Favourites only" filter on case lists that restricts the list to the current user's favourited cases.
- **FR-015**: System MUST let a user archive a case from its case-list row menu, and unarchive a previously archived case.
- **FR-016**: System MUST exclude archived cases from the default case list view, and MUST provide an "Include archived" toggle (default off) that reveals them, visually marked as archived, when enabled.
- **FR-017**: System MUST continue showing an archived case's Hearings, Tasks, and Notes on the Calendar by date, unaffected by the case's archived status.
- **FR-018**: System MUST let a user search eCourts data by advocate name, in addition to the existing court/CNR search.
- **FR-019**: System MUST let a user select multiple eCourts search results via checkboxes and import them in one "Import selected" action.
- **FR-020**: System MUST show a per-row result (Created / Already Linked / Error) for each imported row, independent of other rows' outcomes in the same batch.
- **FR-021**: System MUST provide a "Reminders" panel/view, reachable from the Calendar, showing the current user's own Tasks, Hearings, Notes, and favourite cases in one place.
- **FR-022**: Reminders MUST reflect only the current logged-in user's items (Tasks they created or are assigned to, Hearings they can access, Notes they created or are tagged in, cases they favourited) — not full org/site lists.
- **FR-023**: System MUST retire the existing placeholder Diary scaffolding, replacing it with the new Calendar feature under the corresponding Organization and Site routes, so both do not coexist.
- **FR-024**: Calendar Events/Meetings are explicitly OUT of scope for this feature and MUST NOT be built; the Calendar's data model and filter UI MAY be structured to accommodate a future fourth item type without requiring rework, but no Event creation, display, or filtering is implemented.

### Key Entities

- **Calendar Item**: A unified, display-only representation of a Hearing, Task, or Note as it appears on the Calendar grid — carries a date, an item type, a title, a Priority, and scope (Organization/Site/Case) information used for filtering.
- **Task**: A to-do item scoped to an Organization, a Site, or a Case, with a title, optional description, due date, status, assignee, and optional Priority.
- **Note**: A dated note scoped to an Organization, a Site, or a Case, with a title, optional body, date, any number of tagged people, and optional Priority.
- **Priority**: One of Critical, High, Medium, Low (or unset), mapped to a fixed color (Red/Orange/Yellow/Green) applied consistently across Hearings, Tasks, and Notes.
- **Case Favourite**: A per-user marker on a Case indicating it is starred/favourited by that user.
- **Case Archive Status**: A per-Case flag indicating whether the case is archived (soft-hidden from default lists) or active.
- **eCourts Import Result**: The per-row outcome (Created / Already Linked / Error) of attempting to bulk-import a searched eCourts case into Lawsome.
- **Reminder Set**: The current user's own aggregated Tasks, Hearings, Notes, and favourite Cases, shown together in the Reminders view.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can locate today's Hearings, Tasks, and Notes across their Organization or Site in a single view without navigating to any other screen.
- **SC-002**: A user can change an item's Priority from the Calendar grid in two clicks or fewer (open swatch, pick color) without opening a full edit form.
- **SC-003**: A user can create a Task or Note directly from the Calendar and see it appear on the grid without a full page reload.
- **SC-004**: A user attempting to schedule a Hearing for a case that doesn't exist yet can create the case and complete the Hearing form in one continuous flow, without restarting the "+Add" action.
- **SC-005**: A user can narrow a case list from "all cases" to "just my favourites" in a single toggle action.
- **SC-006**: An organization with a large volume of closed cases can reduce their default case list to only active cases via archiving, while retaining full access to archived cases' history on demand.
- **SC-007**: A user onboarding an organization can import 10+ eCourts cases in one bulk action rather than 10+ individual case-creation steps, and can identify which specific cases failed to import without losing the results of the ones that succeeded.
- **SC-008**: A user can see all of their own outstanding items (Tasks, Hearings, Notes, favourite cases) in one Reminders view without manually filtering the Calendar or case lists to themselves.

## Assumptions

- This feature is scoped to the frontend prototype only: all data (Calendar items, favourites, archive status, eCourts search results, import outcomes, Reminders) is mocked in-memory/local mock data sources, not fetched from a real backend API.
- The existing Hearing creation form and case-creation form are reused as-is for the Hearing "+Add" and inline "create case" flows, with a Priority control added to the Hearing form.
- The four Priority levels and their color mapping (Critical=Red, High=Orange, Medium=Yellow, Low/unset=Green) are fixed and organization-wide; no per-user color override is in scope for this feature.
- Reminders is an on-demand, pull-based view only; no proactive notifications, badges, or digest delivery are in scope.
- "Favourites only" filtering, when applied to the Calendar, hides items with no case link (pure Org/Site Tasks/Notes), since favourite status only exists at the case level.
- Existing user roles/permissions in the prototype are reused to gate visibility of Organization vs. Site scoped actions; no new role types are introduced by this feature.
- The existing placeholder Diary route and its supporting files are replaced by the new Calendar feature rather than kept as a second, parallel feature.
