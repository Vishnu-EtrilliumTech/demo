---

description: "Task list for Unified Calendar, Case Favourites & Archive, and eCourts Onboarding Import"
---

# Tasks: Unified Calendar, Case Favourites & Archive, and eCourts Onboarding Import

**Input**: Design documents from `specs/038-calendar-favourites-archive-ecourts/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested in spec.md. Constitution III (RECOMMENDED, not NON-NEGOTIABLE) calls for Playwright E2E coverage of new user-facing features — included as Polish-phase tasks (T039-T041) rather than blocking per-story tasks.

**Organization**: Tasks are grouped by user story (US1-US5, matching spec.md's P1-P4 priorities; Favourites and Archive are both P2, split into two independently-testable stories per spec.md).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps task to its user story (US1-US5) for traceability
- All descriptions include exact file paths

## Path Conventions

Single Next.js frontend project (this repo). All paths are relative to the repository root `c:\Products\Lawsome\Lawsome.Web.UI-prototype`.

---

## Phase 1: Setup

**Purpose**: Prepare directory scaffolding referenced by later tasks. No new npm dependencies are required (per research.md R1, the Calendar grid is ported from the existing Diary components rather than adding `@fullcalendar/*`).

- [X] T001 Create empty directory `src/app/organization/components/calendar/` for the new co-located Calendar UI components
- [X] T002 [P] Confirm route stubs `src/app/organization/[id]/calendar/` and `src/app/organization/[id]/sites/[siteId]/calendar/` exist (already present, empty) and create `src/app/organization/[id]/settings/` for the new minimal Org Settings page

**Checkpoint**: Directories ready for Foundational and per-story work.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, mock-data/router extensions, permission hook additions, and shared UI pieces every user story depends on.

**⚠️ CRITICAL**: No user story task may start until this phase is complete.

- [X] T003 Create `src/app/organization/types/calendarTypes.ts` with `Priority`, `PRIORITY_COLORS`, `CalendarItemType`, `CalendarItemBase`/`HearingCalendarItem`/`TaskCalendarItem`/`NoteCalendarItem`/`CalendarItem`, `Note`, `AddNoteRequest`/`UpdateNoteRequest`, `OrgTask`, `EcourtsImportRowResult`/`EcourtsImportResponse`, `ReminderSet` per data-model.md
- [X] T004 [P] Add optional `priority?: Priority` field to `CaseHearing`/`Hearing` in `src/app/organization/types/caseindex.ts` and `src/app/organization/types/index.ts`
- [X] T005 [P] Add optional `priority?: Priority` field to `CaseTask`/`Task` in `src/app/organization/types/caseindex.ts` and `src/app/organization/types/index.ts`
- [X] T006 [P] Add `archivedDate: string | null` to `Case` in `src/app/organization/types/index.ts` and `defaultCalendarItemTypes: CalendarItemType[] | null` to the `Organization` type
- [X] T007 Extend `src/prototype/mockData.ts`: seed a `notes: Note[]` array (mixing org/site/case-scoped notes with tagged users), seed `caseFavourites: CaseFavourite[]`, set `archivedDate: null` on all seeded `cases`, set `defaultCalendarItemTypes: null` on `organization`, backfill a spread of `priority` values across seeded `hearings`/`tasks` for visual variety, and add a helper for building `EcourtsImportRowResult`s (including at least one deterministic `AlreadyLinked` and one `Error` case for edge-case demoing)
- [X] T008 Extend `src/prototype/router.ts`: add routes for `GET /organizations/:orgId/calendar`, Notes CRUD (`/organizations/:orgId/notes`, `/organizations/:orgId/sites/:siteId/notes`), Org/Site Task CRUD (`/organizations/:orgId/tasks`, `/organizations/:orgId/sites/:siteId/tasks`), Priority quick-set (`PUT .../priority` for hearings/tasks/notes), Favourite (`PUT`/`DELETE .../cases/:caseId/favourite`), Archive (`PUT .../cases/:caseId/archive` and `/unarchive`), Org settings update (`PUT /organizations/:orgId` accepting `defaultCalendarItemTypes`), and eCourts bulk import (`POST /organizations/:orgId/sites/:siteId/ecourts/import`)
- [X] T009 [P] Add `canViewCalendar`, `canCreateNote`, `canCreateTask`, `canArchiveCase`, `canConfigureCalendarDefaults` booleans to `src/hooks/useUserRole.ts`, following the existing `roleA || roleB` pattern
- [X] T010 [P] Build shared `src/components/modals/PriorityPicker.tsx` — a small color-swatch trigger + 4-option (Red/Orange/Yellow/Green) popover, backed by `PRIORITY_COLORS`, usable both as a Calendar-item quick-set control and embedded inside item forms
- [X] T011 [P] Build shared `src/components/modals/CasePickerAutocomplete.tsx` — async case search within the current org/site; on no match, an inline "Case not found — create new case" option that opens the existing `QuickAddCaseDialog.tsx` (seeded to its manual-entry step), auto-selecting the newly created case on completion

**Checkpoint**: Foundation ready — all user stories below may now proceed.

---

## Phase 3: User Story 1 - Unified Calendar of Hearings, Tasks, and Notes (Priority: P1) 🎯 MVP

**Goal**: A single Org-scope and Site-scope Calendar showing Hearings/Tasks/Notes color-coded by Priority, filterable, with inline creation and quick Priority-set, replacing the Diary placeholder.

**Independent Test**: Open the Organization-level Calendar, confirm mock Hearings/Tasks/Notes render on their dates with correct Priority colors, create a new Task via "+Add", and confirm it appears on the grid — all without any Favourites/Archive/eCourts/Reminders work being done.

### Implementation for User Story 1

- [X] T012 [US1] Delete `src/app/organization/[id]/diary/` in full (`page.tsx`, `DiaryMock.tsx`, `MiniCalendar.tsx`, `MonthView.tsx`, `TimeGridView.tsx`, `EventPopovers.tsx`, `diaryData.ts`, `googleCalendar.css`) per FR-023
- [X] T013 [US1] Create `src/app/organization/services/calendarApi.ts`: `fetchCalendar`, `addNote`/`updateNote`/`deleteNote`, `addTask`/`updateTask`/`deleteTask` (Org/Site scope), `setHearingPriority`/`setTaskPriority`/`setNotePriority`, and `updateOrganizationDefaultCalendarItemTypes`, following the existing axios + `getToken()` pattern in `caseapi.ts`
- [X] T014 [US1] Build `src/app/organization/hooks/useCalendarItems.ts`: fetch + filter state (`siteId`, `favouritesOnly`, `types`, seeded from the org's `defaultCalendarItemTypes`), refetch on date-range navigation. Per FR-017, the calendar feed query MUST NOT filter out items whose linked case is archived — archived-case items still appear by date; only the case list itself hides archived cases
- [X] T015 [US1] Build `src/app/organization/hooks/useNotes.ts`: create/update/delete Notes via `calendarApi.ts`
- [X] T016 [US1] Build `src/app/organization/hooks/useTasks.ts`: create/update/delete Org/Site-scope Tasks via `calendarApi.ts`
- [X] T017 [P] [US1] Build `src/app/organization/components/calendar/MiniCalendar.tsx` (MUI-based port of the retired `diary/MiniCalendar.tsx` month-picker widget)
- [X] T018 [P] [US1] Build `src/app/organization/components/calendar/CalendarMonthView.tsx` (MUI-based port of `diary/MonthView.tsx`'s grid/overflow logic, rendering `CalendarItem`s colored by Priority instead of Diary's type-based `CALENDAR_META`). Per the spec's tagged-people edge case, any Note item's tagged-user display on a calendar cell MUST truncate with a "+N more" indicator rather than overflowing the cell
- [X] T019 [P] [US1] Build `src/app/organization/components/calendar/CalendarWeekView.tsx` and `CalendarDayView.tsx` (MUI-based port of `diary/TimeGridView.tsx`'s hourly-row logic)
- [X] T020 [US1] Build `src/app/organization/components/calendar/CalendarFilterBar.tsx`: Site dropdown (org-scope only), "Favourites only" toggle, Hearing/Task/Note checkboxes
- [X] T021 [US1] Build `src/app/organization/components/calendar/NoteModal.tsx`: title/body/date, Org/Site/Case scope picker (using `CasePickerAutocomplete` from T011), unlimited tagged-people multi-select with a "+N more" truncated display once the tagged-people list exceeds a few visible chips (per the spec's tagged-people edge case), `PriorityPicker` (T010)
- [X] T022 [US1] Build `src/app/organization/components/calendar/TaskModal.tsx`: title/description/due date/status/assignee, Org/Site/Case scope picker (`CasePickerAutocomplete`), `PriorityPicker`
- [X] T023 [US1] Extend `src/components/modals/HearingModal.tsx`: add a `PriorityPicker` control (no other field changes); confirm its existing case-selection entry point can be driven by `CasePickerAutocomplete`'s inline-create flow when opened from the Calendar
- [X] T024 [US1] Build `src/app/organization/components/calendar/CalendarView.tsx`: orchestrates `MiniCalendar`/`CalendarMonthView`/`CalendarWeekView`/`CalendarDayView`/`CalendarFilterBar`, a "+Add" menu (Hearing → case picker → `HearingModal`; Task → `TaskModal`; Note → `NoteModal`), and the on-item Priority quick-set swatch (using `PriorityPicker`, calling `setHearingPriority`/`setTaskPriority`/`setNotePriority` with optimistic recoloring)
- [X] T025 [US1] Create `src/app/organization/[id]/calendar/page.tsx`: org-scope route rendering `<CalendarView scope="org" organizationId={id} />`, gated by `canViewCalendar`
- [X] T026 [US1] Create `src/app/organization/[id]/sites/[siteId]/calendar/page.tsx`: site-scope route rendering `<CalendarView scope="site" organizationId={id} siteId={siteId} />` (no Site dropdown), gated by `canViewCalendar`
- [X] T027 [US1] Build `src/app/organization/[id]/settings/page.tsx`: minimal Org Settings page gated by `canConfigureCalendarDefaults`, with a "Default Calendar Filters" item-type multi-select calling `updateOrganizationDefaultCalendarItemTypes`
- [X] T028 [US1] Update `src/components/org/OrgSidebar.tsx`: replace the `"diary"` `NavKey`/nav item with `"calendar"` (reuse the `CalendarDays` icon, point at `/organization/{id}/calendar` for org roles and the site-scoped calendar route for site-only roles), and enable the previously-disabled `"settings"` nav item to point at `/organization/{id}/settings`
- [X] T029 [US1] Update `src/components/org/OrgAppShell.tsx`: mirror the identical `NavKey`/`roleNavMap`/`defs`/group changes made in T028, per the file's existing "mirror of OrgSidebar" convention

**Checkpoint**: User Story 1 is fully functional and independently testable (Calendar view, filters, creation, Priority quick-set, Diary retired).

---

## Phase 4: User Story 2 - Case Favourites (Priority: P2)

**Goal**: Users can star/unstar cases from a case list and filter to favourites only.

**Independent Test**: Star a case in `CasesNew.tsx`, confirm the star fills and the case is retrievable via "Favourites only"; unstar it and confirm it drops out — independent of Archive, eCourts, or Reminders work.

### Implementation for User Story 2

- [X] T030 [US2] Extend `src/app/organization/services/caseapi.ts`: add `favouriteCase`/`unfavouriteCase` calls, and add `favouritesOnly` query param support + `isFavourite` field to the existing case-list fetch function(s)
- [X] T031 [US2] Update `src/app/organization/[id]/cases/CasesNew.tsx`: add a favourite-star icon column (calling `favouriteCase`/`unfavouriteCase`, using `Column<T>.render`), a "Favourites only" filter control alongside the existing Status/Site/Assigned-To filters, and extend `CaseListFilters`/`SiteCaseListFilters` with `favouritesOnly` wherever those types are actually declared today (confirm the exact filter-types file path in this repo first — it may not be literally named `listFilterTypes.ts` — before editing)

**Checkpoint**: User Stories 1 AND 2 both work independently.

---

## Phase 5: User Story 3 - Case Archive (Priority: P2)

**Goal**: Users can archive/unarchive cases; default case lists exclude archived cases; Calendar items for archived cases remain visible.

**Independent Test**: Archive a case from its row menu in `CasesNew.tsx`, confirm it disappears from the default list; toggle "Include archived," confirm it reappears marked as archived with an Unarchive action; confirm its Hearings/Tasks/Notes still show on the Calendar — independent of Favourites/eCourts/Reminders work.

### Implementation for User Story 3

- [X] T032 [US3] Extend `src/app/organization/services/caseapi.ts`: add `archiveCase`/`unarchiveCase` calls and `includeArchived` query param support on the case-list fetch function(s)
- [X] T033 [US3] Update `src/app/organization/[id]/cases/CasesNew.tsx`: add an MUI `Menu`/`IconButton`-based row "Actions" column (Archive when active / Unarchive when archived, per research.md R6), an "Include archived" toggle (default off) alongside the Favourites-only filter, and a visual "Archived" indicator (e.g. a muted `Chip`) on archived rows

**Checkpoint**: User Stories 1, 2, AND 3 all work independently.

---

## Phase 6: User Story 4 - eCourts Onboarding Bulk Import (Priority: P3)

**Goal**: Multi-select eCourts search results and bulk-import them, with a per-row Created/Already Linked/Error result.

**Independent Test**: Search eCourts by advocate name (existing capability, per research.md R3), select 3+ results, click "Import selected," confirm each row shows its own independent result — independent of Calendar/Favourites/Archive/Reminders work.

### Implementation for User Story 4

- [X] T034 [US4] Add `importEcourtsCases(organizationId, siteId, cnrNumbers)` to `src/app/organization/services/ecourtapi.ts`, calling the `POST .../ecourts/import` route added in T008
- [X] T035 [US4] Build `src/app/organization/[id]/ecourts/components/BulkImportPanel.tsx`: reuses `SearchTabNew.tsx`'s search-type tabs/jurisdiction cascade for search, renders results as checkbox rows (not single-click cards), an "Import selected" action, and a per-row status column (Created/Already Linked/Error) populated from the import response
- [X] T036 [US4] Wire `BulkImportPanel.tsx` into the eCourts hub (`src/app/organization/[id]/ecourts/page.tsx` or `EcourtsNew.tsx`) as a new "Bulk Import" tab/section, gated by `canManageOrganizationUsers`/`isOrganizationAdmin`-style onboarding-appropriate role check

**Checkpoint**: User Stories 1-4 all work independently.

---

## Phase 7: User Story 5 - Reminders: "My Items" View (Priority: P4)

**Goal**: A "my items" panel showing the current user's own Tasks, Hearings, Notes, and favourite cases.

**Independent Test**: As the mock logged-in user, open Reminders from the Calendar and confirm it lists only that user's own items grouped by type, with empty-state messaging where a type has nothing — depends on US1's `useCalendarItems` and US2's favourites data existing, but is itself independently verifiable once both are in place.

### Implementation for User Story 5

- [X] T037 [US5] Build `src/app/organization/hooks/useReminders.ts`: combines `useCalendarItems` (unfiltered by site/type, scoped to the current user per the access-scoping rule in data-model.md) with a `favouritesOnly` case fetch (from T030), per research.md's Option-A-style client-side composition
- [X] T038 [US5] Build `src/app/organization/components/calendar/RemindersPanel.tsx`: grouped sections (Tasks/Hearings/Notes/Favourite Cases) each with an empty-state message when empty
- [X] T039 [US5] Add a "Reminders" entry point button to `CalendarView.tsx` (T024) that opens `RemindersPanel.tsx`

**Checkpoint**: All five user stories independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Test coverage and quality-gate verification per Constitution III/VII, spanning all stories above.

- [X] T040 [P] Playwright E2E `e2e/calendar.spec.ts`: golden path (view Calendar, filter, create a Task, quick-set Priority) plus 3 edge cases (empty filter selection, "Favourites only" hiding non-case-linked items, and an archived case's Hearings/Tasks/Notes still rendering on the Calendar per FR-017)
- [X] T041 [P] Playwright E2E `e2e/ecourts-bulk-import.spec.ts`: golden path (multi-select + import) plus the partial-failure edge case (one row Errors, others still show Created)
- [ ] T042 [P] React Testing Library unit tests for `src/components/modals/PriorityPicker.tsx` and `src/components/modals/CasePickerAutocomplete.tsx` — NOT done (Constitution III is RECOMMENDED, not NON-NEGOTIABLE; deprioritized in favor of the E2E coverage in T040/T041, which exercises both components through real user flows)
- [X] T043 Ran `specs/038-calendar-favourites-archive-ecourts/quickstart.md`'s golden paths via the automated Playwright suite (T040/T041) rather than a manual click-through — this caught and fixed two real bugs: (1) a Task created with no due date was silently invisible on the Calendar (now defaults to today), (2) the Month view's row count was computed dynamically (4-6 rows depending on the month) while the data-fetch range always assumed a fixed 6-row window, so months needing only 4-5 rows silently dropped trailing-week items (now always renders 6 rows)
- [X] T044 Ran `tsc --noEmit`, `next lint`, and `next build` (Constitution VII quality gates) — all pass with zero errors/warnings

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (T003-T011 touch shared types/mock-data/router/hooks that every story's components import)
- **User Stories (Phase 3-7)**: All depend on Foundational completion
  - US1 (Calendar) has no dependency on US2-US5
  - US2 (Favourites) and US3 (Archive) both touch `CasesNew.tsx` — do sequentially (US2 then US3) to avoid merge conflicts within the same file, even though neither depends on the other's *logic*
  - US4 (eCourts Import) has no dependency on US1-US3
  - US5 (Reminders) depends on US1 (`useCalendarItems`) and US2 (`favouriteCase`/favourites fetch) being implemented — build last
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### Within Each User Story

- Types/services before hooks; hooks before components; components before pages
- `CalendarView.tsx` (T024) depends on T017-T023 (its child components) being built first
- T028/T029 (sidebar updates) depend on T025/T026 (routes existing) so nav links resolve to real pages

### Parallel Opportunities

- T003-T006 (type additions) can run in parallel — different files/sections
- T009-T011 (permissions hook, PriorityPicker, CasePickerAutocomplete) can run in parallel — different files, no shared dependency
- T017-T019 (MiniCalendar, MonthView, Week/DayView) can run in parallel — independent presentational components
- T040-T042 (Polish-phase tests) can run in parallel — independent test files

---

## Parallel Example: User Story 1

```bash
# After T013-T016 (service + hooks) are done, these can run together:
Task: "Build MiniCalendar.tsx in src/app/organization/components/calendar/MiniCalendar.tsx"
Task: "Build CalendarMonthView.tsx in src/app/organization/components/calendar/CalendarMonthView.tsx"
Task: "Build CalendarWeekView.tsx and CalendarDayView.tsx in src/app/organization/components/calendar/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Calendar) — Diary is retired, Calendar is live
4. **STOP and VALIDATE**: Walk through quickstart.md steps 1-9 independently
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 (Calendar) → validate → demo (MVP)
3. US2 (Favourites) → validate → demo
4. US3 (Archive) → validate → demo
5. US4 (eCourts Bulk Import) → validate → demo
6. US5 (Reminders) → validate → demo
7. Polish (tests + quality gates) → done

### Notes

- Commit after each task or logical group, per repository convention
- Stop at any checkpoint to validate a story independently before continuing
- US2/US3 both editing `CasesNew.tsx` is the one deliberate exception to "different files, no dependencies" parallelism — sequence those two stories rather than parallelizing them
