# Feature Specification: Pagination, Sorting & Filtering for List Views

**Feature Branch**: `035-pagination-sorting-filtering`  
**Created**: 2026-06-23  
**Status**: Draft  
**Input**: User description: "We have implemented pagination with sorting and filtering in the backend. I shall attach the report of the Changes made and we have to incorporate these changes in the frontend"

## Clarifications

### Session 2026-06-23

- Q: Rollout scope of the paging/sorting/filtering controls in this feature → A: Full paging + sorting + filtering controls on every in-scope list in this feature (single sweep), in addition to P1 correctness everywhere.
- Q: Pagination interaction pattern to use consistently across in-scope lists → A: Numbered pager in the list/table footer — previous/next plus page numbers, a page-size selector, and a visible total count.
- Q: Should a list's page/sort/filter view state persist across navigation and refresh → A: Yes — encode it in the URL query string so it survives refresh and back-navigation and is shareable/bookmarkable.

## User Scenarios & Testing *(mandatory)*

The backend has changed the response shape of every high-volume and entity-scoped **list** endpoint. Instead of returning a plain array, these endpoints now return a **paged result** containing the current page of items plus paging metadata (total count, current page, page size, total pages, has-next / has-previous flags). They also accept new optional request parameters for page, page size, sort field, sort direction, and resource-specific filters.

The frontend must (a) keep working with the new response shape, (b) let users page through long lists instead of loading everything at once, and (c) let users sort and filter those lists from the UI. Because the response shape change is breaking, the highest-priority work is restoring correct data display; richer paging/sorting/filtering UX builds on top of that.

### User Story 1 - Lists keep displaying correctly after the response-shape change (Priority: P1)

As any authenticated user (organization admin, site user, legal expert, or client), when I open a screen that shows a list affected by this change (cases, users, sites, hearings, tasks, documents, comments, contributors, appointments, orders, ratings, invoices, clients, legal experts, eCourts saved/search results, etc.), the list loads and shows the correct records without errors.

**Why this priority**: The backend change is a breaking response-shape change. Without this, affected lists break (empty screens, runtime errors, or "no data" where data exists). This is the minimum required to keep the application functional after the backend deploys.

**Independent Test**: Point the frontend at a backend build that returns the new paged shape, open each affected list screen, and confirm records render exactly as before with no console/runtime errors and no false "empty" states.

**Acceptance Scenarios**:

1. **Given** an affected list endpoint returns a paged result with items, **When** the user opens that screen, **Then** the items render the same way they did before the change.
2. **Given** an affected list endpoint returns a paged result with an empty `items` array (and a status of success), **When** the user opens that screen, **Then** the UI shows a normal "no results" empty state and does **not** treat it as an error.
3. **Given** an out-of-scope endpoint that still returns a plain array or single object (reference-data lookups, single-record reads), **When** the user opens a screen that uses it, **Then** that screen continues to work unchanged.

---

### User Story 2 - Users can page through long lists (Priority: P2)

As a user viewing a long list, I can move between pages and choose how many records appear per page, so that large lists load quickly and remain navigable.

**Why this priority**: Once data displays correctly, paging delivers the core performance and usability benefit of the backend change — large lists no longer load in full.

**Independent Test**: Open a list with more records than one page, use the paging controls to move forward and back and change page size, and confirm the displayed records and the paging indicators (current page, total pages/records, next/previous availability) update correctly.

**Acceptance Scenarios**:

1. **Given** a list with more records than the current page size, **When** the user advances to the next page, **Then** the next set of records is shown and no record appears on two pages.
2. **Given** the user is on the last page, **When** they view the paging controls, **Then** the "next page" action is disabled/unavailable.
3. **Given** the user is on the first page, **When** they view the paging controls, **Then** the "previous page" action is disabled/unavailable.
4. **Given** a list, **When** the user changes the page size, **Then** the list reloads from the first page using the new page size.
5. **Given** the user requests a page beyond the end of the data, **When** the response returns no items, **Then** the UI shows an empty state rather than an error.

---

### User Story 3 - Users can sort lists by supported columns (Priority: P3)

As a user viewing a list, I can sort it by the columns the backend supports for that list, in ascending or descending order, so that I can find records faster.

**Why this priority**: Sorting improves findability but is not required for correctness or basic navigation.

**Independent Test**: On a list that supports sorting, choose a sortable column and toggle direction, then confirm the order of returned records changes accordingly and paging continues to work under the chosen sort.

**Acceptance Scenarios**:

1. **Given** a list with sortable columns, **When** the user sorts by a supported column ascending, **Then** records are returned in that ascending order across all pages.
2. **Given** a sorted list, **When** the user toggles to descending, **Then** the order reverses.
3. **Given** a list, **When** the user has not chosen a sort, **Then** the list uses that list's default sort order.
4. **Given** a list, **When** the UI offers sortable columns, **Then** only the columns supported for that list are offered as sortable.

---

### User Story 4 - Users can filter lists by supported criteria (Priority: P3)

As a user viewing a list, I can narrow it using the filters supported for that list (for example status, role, site, assignee, date range, or a text search), so that I see only relevant records.

**Why this priority**: Filtering further improves findability for large datasets but, like sorting, is additive to correctness and basic paging.

**Independent Test**: On a list that supports filters, apply each supported filter (and combinations) and confirm the returned records and total count reflect the filtered set, that paging operates over the filtered set, and that clearing filters restores the full list.

**Acceptance Scenarios**:

1. **Given** a list that supports filtering, **When** the user applies a supported filter, **Then** only matching records are shown and the total-records indicator reflects the filtered count.
2. **Given** multiple filters are applied, **When** the list reloads, **Then** records match **all** applied filters together (combined narrowing).
3. **Given** a filter is applied, **When** the user pages forward, **Then** paging operates over the filtered set only.
4. **Given** active filters, **When** the user clears them, **Then** the list returns to its unfiltered default.
5. **Given** the user enters an invalid filter value, **When** the backend rejects it, **Then** the UI shows a clear, user-friendly message and the previously displayed list is not corrupted.

---

### Edge Cases

- **Empty results**: An affected list returning zero items is a normal success, not a "not found" error — the UI must show an empty state.
- **Parent not found**: When the parent resource (organization, site, or case) does not exist, the screen shows an appropriate not-found/error state distinct from an empty list.
- **Page past the end**: Navigating beyond the last page returns an empty page with the correct total; the UI should keep the pager usable (e.g., allow returning to a valid page).
- **Filter/sort interaction with paging**: Changing a filter or sort resets to the first page so the user is not stranded on a now-out-of-range page.
- **Unsupported sort/filter token**: If an unsupported sort field is sent, the backend silently falls back to the default sort; the UI should avoid offering unsupported options so the user's intent is not silently ignored.
- **Mixed-shape endpoints**: Screens that combine affected list endpoints with unchanged reference-data lookups must handle each shape correctly.
- **Stale page after deletion**: When a record is removed from a list, refreshing should reflect the new totals and not leave the user on an empty trailing page.
- **Cutover timing**: The frontend changes must be released in coordination with the backend so users never hit a mismatched response shape.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The frontend MUST read list data from the new paged result structure (the page of items plus paging metadata) for every affected list endpoint, instead of treating the response as a plain array.
- **FR-002**: The frontend MUST continue to handle unaffected endpoints (reference-data lookups and single-record reads) using their existing plain-array / single-object shapes.
- **FR-003**: The frontend MUST treat a successful response with an empty item set as a valid empty list and present an empty state, never an error.
- **FR-004**: The frontend MUST distinguish an empty list (success) from a missing parent resource (not-found) and from an authorization failure, presenting an appropriate state for each.
- **FR-005**: Affected list views MUST allow the user to navigate between pages and reflect the current page, total pages, and/or total record count using the paging metadata returned by the backend. The pagination control MUST be a numbered footer pager (previous/next, page numbers, a page-size selector, and a visible total record count), applied consistently across in-scope lists.
- **FR-006**: Affected list views MUST disable or hide "next page" when on the last page and "previous page" when on the first page, based on the returned paging metadata.
- **FR-007**: Affected list views MUST allow the user to select a page size within the supported range, defaulting to the backend default page size, and MUST reset to the first page when page size changes.
- **FR-008**: Affected list views MUST send the user's current page and page size to the backend when requesting list data.
- **FR-009**: For lists that support sorting, the frontend MUST let the user choose a sort field and direction limited to the fields supported for that specific list, and MUST send the chosen sort to the backend.
- **FR-010**: When no sort is chosen, the frontend MUST rely on the backend's default sort for that list (no client-side reordering that contradicts it).
- **FR-011**: For lists that support filtering, the frontend MUST expose controls for that list's supported filters and send the chosen filter values to the backend.
- **FR-012**: The frontend MUST combine multiple active filters as a single narrowing request (all filters applied together) and reflect the resulting filtered total count.
- **FR-013**: The frontend MUST reset to the first page whenever the user changes any filter or sort selection.
- **FR-014**: The frontend MUST allow the user to clear active filters and return the list to its default unfiltered state.
- **FR-015**: When the backend rejects an invalid filter value, the frontend MUST present a clear, user-friendly message and preserve the last valid list state.
- **FR-016**: Date-range filters MUST submit dates in the format the backend expects and MUST prevent or clearly handle invalid ranges (e.g., end before start).
- **FR-017**: The frontend MUST preserve existing authorization behavior — paging, sorting, and filtering operate only over records the user is already permitted to see.
- **FR-018**: The set of frontend changes MUST be deployable together with (or behind a coordinated switch with) the backend change so users do not encounter a mismatched response shape.
- **FR-019**: Loading and error indicators MUST be shown during page/sort/filter changes so the user understands when the list is updating.
- **FR-020**: A list's current page, page size, sort selection, and active filters MUST be reflected in the URL query string so the view state survives page refresh and back-navigation and can be shared or bookmarked; opening such a URL MUST reconstruct the same filtered/sorted page.

### Key Entities *(include if feature involves data)*

- **Paged List Result**: A single page of a larger list. Holds the page's items plus metadata: total records in the filtered set, current page number, page size, total page count, and whether next/previous pages exist.
- **List Query**: The user's current view request for a list — page number, page size, chosen sort field and direction, and the set of active filter values.
- **Sort Option**: A field a given list can be ordered by, plus a direction (ascending/descending). Each list has its own supported set and a default.
- **Filter Set**: The resource-specific criteria available for a given list (e.g., status, role, site, assignee, client, court, rating value, date range, free-text search). Available filters differ per list.
- **Affected List View**: A screen presenting one of the in-scope lists (cases, organization/site/system users, sites, organizations, legal experts, clients, hearings, appointments, orders, payment settlements, ratings, and case-scoped documents/comments/tasks/invoices/hearings/clients/contributors, plus eCourts saved/search lists).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of affected list screens display their records correctly against the new paged response shape, with zero runtime/rendering errors attributable to the shape change.
- **SC-002**: No affected list screen shows a false "empty" or error state when the backend returns valid records.
- **SC-003**: Long lists load their first page noticeably faster than loading the entire list; users can reach any page of a large list in under 2 seconds per page navigation under normal conditions.
- **SC-004**: On every list that supports paging, users can move to the next/previous page and change page size, with paging indicators always matching the data shown (no duplicate or skipped records across pages).
- **SC-005**: On every list that supports sorting, users can reorder by each supported field in both directions and see the order change accordingly.
- **SC-006**: On every list that supports filtering, applying filters reduces the visible records and the displayed total to the correct filtered set, and clearing restores the full list.
- **SC-007**: Invalid filter inputs never corrupt the displayed list; users receive an understandable message and can recover without reloading the page.
- **SC-008**: After coordinated release, there are no reported incidents of mismatched response-shape handling between frontend and backend.

## Assumptions

- The exact list of in-scope endpoints, their supported sort fields, and their supported filters are taken from the attached backend integration guide (Endpoint matrix); that matrix is the source of truth for which lists get which controls.
- Backend defaults and limits apply as documented: default page size of 20 and a maximum of 100; out-of-range page/size values are normalized by the backend.
- Out-of-scope endpoints explicitly listed as unchanged (reference-data lookups such as states, eCourt states/districts, legal-expert types/portfolios, schedules, addresses, capabilities, and single-record reads) require no frontend change.
- Existing authentication, authorization, and error-handling patterns in the frontend are reused; this feature does not change who can see which records.
- Paging, sorting, and filtering are server-driven; the frontend does not re-sort or re-filter a page client-side in ways that contradict the backend result.
- Sorting and filtering UI is only offered for the fields/filters each list actually supports per the backend allow-lists, to avoid silent fallback behavior.
- Every in-scope list receives full paging, sorting, and filtering controls within this feature (single sweep); P1 correct-display work is a prerequisite delivered for all affected lists, but no in-scope list is left with only P1.
- Frontend and backend releases for in-scope endpoints are coordinated (deployed together or behind a coordinated switch).

## Dependencies

- Depends on the backend change "Pagination, Sorting & Filtering for List Endpoints" being deployed for the in-scope endpoints.
- Requires the finalized endpoint matrix (sort allow-lists and filters per endpoint) and confirmation of accepted filter value formats for enum-style filters (status, role, type, priority) and date formats.
- Requires agreement on release sequencing/cutover between frontend and backend teams.
