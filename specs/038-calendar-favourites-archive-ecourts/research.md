# Phase 0 Research: Unified Calendar, Case Favourites & Archive, and eCourts Onboarding Import

## R1: Where should the new Calendar UI live relative to the existing Diary scaffolding?

- **Decision**: Delete `src/app/organization/[id]/diary/` entirely (`page.tsx`, `DiaryMock.tsx`, `MiniCalendar.tsx`, `MonthView.tsx`, `TimeGridView.tsx`, `EventPopovers.tsx`, `diaryData.ts`, `googleCalendar.css`). Build the real Calendar under the already-empty `src/app/organization/[id]/calendar/` and `src/app/organization/[id]/sites/[siteId]/calendar/` route stubs.
- **Rationale**: FR-023 requires retiring Diary in favor of Calendar so the two don't coexist as competing features. `MonthView.tsx`, `TimeGridView.tsx`, and `MiniCalendar.tsx` are close enough to reusable that their *logic* (date-grid math, hour-row rendering, mini-month picker) is ported into the new `src/app/organization/components/calendar/` components, but rebuilt against MUI (Constitution VI) instead of the hand-rolled `googleCalendar.css` clone, and against the unified `CalendarItem` shape (Hearing/Task/Note by Priority) instead of Diary's type-based color scheme (`CALENDAR_META`).
- **Alternatives considered**: Keep Diary alongside Calendar during a transition period — rejected per explicit spec requirement (FR-023) and user confirmation that Diary is a throwaway placeholder, not in-flight work to preserve.

## R2: Should Priority/Favourite/Archive/Notes state live in component state, a mock-data module, or Redux?

- **Decision**: Extend `src/prototype/mockData.ts` (seed arrays + mutation helpers) and `src/prototype/router.ts` (new routes), following the exact same pattern as every other existing domain (cases, hearings, tasks, documents). New service functions in `calendarApi.ts`/`caseapi.ts` call these routes via axios, exactly like existing code.
- **Rationale**: Favourites, Archive status, and Priority must render identically and consistently whether viewed from the Calendar, a case list, or the Reminders panel — this requires state that outlives a single component's mount, which rules out local `useState` (the Diary precedent's approach, explicitly flagged as insufficient for this reason). `mockData.ts` module-level state already satisfies this for every other feature in the app (session-durable, resets on hard reload, which matches how the rest of the prototype behaves) and requires no new state-management pattern.
- **Alternatives considered**: A new Redux slice (would survive hard reload via redux-persist, but no other domain entity — cases, hearings, tasks — uses Redux for its data today; introducing it only for this feature would be an inconsistent one-off). Component-local state (rejected, see above).

## R3: Does "advocate name eCourts search" (FR-018) already exist?

- **Decision**: Yes — `SearchTabNew.tsx` already has an "Advocate" search tab wired to `searchType: 'advocates'`, and `buildEcourtSearchResults()` in `mockData.ts` already seeds advocate-name results. No new search field is needed to satisfy "search eCourts by advocate name."
- **Rationale**: Confirmed by direct code inspection. Building a duplicate advocate search field would violate the "don't add what already exists" principle and create two inconsistent search UIs.
- **Remaining net-new work for User Story 4**: only the **bulk multi-select + import** part (FR-019/FR-020) is missing — there is no checkbox/multi-select pattern anywhere in the eCourts screens today (`SearchResults.tsx` renders single-click cards; `EcourtsImportPanel.tsx` inside `QuickAddCaseDialog.tsx` is single-select-only). A new `BulkImportPanel.tsx` is built, reusing the same search-tabs/jurisdiction-cascade UI as `SearchTabNew.tsx` but rendering results as checkbox rows with an "Import selected" action and a per-row status column (Created/Already Linked/Error), backed by a new mock `importEcourtsCases()` call.
- **Alternatives considered**: Retrofitting checkboxes directly into `SearchResults.tsx`/`CaseResultCard` — rejected because that component's click-through-to-link-one-case behavior is a different, still-needed flow (linking a single CNR to an existing case); conflating "select many to bulk-import new cases" into the same component risks breaking its existing single-case-link use.

## R4: How to add "Default Calendar Filters" given there is no Org Settings screen today?

- **Decision** (per user confirmation): Build a minimal net-new Org Settings page at `src/app/organization/[id]/settings/page.tsx`, gated to Organization Admins, whose first (and for this feature, only) control is "Default Calendar Filters" (item-type multi-select). Enable the currently-disabled "Settings" sidebar entry to point at this route instead of remaining a disabled placeholder.
- **Rationale**: The proposal explicitly specifies Org Settings as the configuration surface; the sidebar and design-system flags already anticipate a Settings screen (both nav shells define — but disable — a Settings `NavItem`), so this is completing an already-scaffolded intent rather than inventing a new one.
- **Alternatives considered**: A lightweight gear-icon dialog directly on the Calendar page — simpler, but rejected by the user in favor of the more proposal-faithful standalone Settings page.

## R5: Where do Favourites/Archive controls land given two parallel case-list implementations?

- **Decision** (per user confirmation): Add the star toggle, "Favourites only" filter, Archive/Unarchive row action, and "Include archived" toggle only to `CasesNew.tsx` (the active, MUI/design-system, feature-flag-default-ON implementation). `CasesLegacy.tsx` is left unchanged.
- **Rationale**: `CasesLegacy.tsx` is already being phased out by the in-progress 037-mui-migration effort; duplicating new functionality into a screen on its way out would be wasted work and a future merge-conflict/consistency risk.
- **Alternatives considered**: Building into both — rejected as unnecessary duplication given the explicit migration-away-from-Legacy trajectory already underway in this repo.

## R6: What is the row-action pattern for Archive/Unarchive (no kebab menu exists on the case list today)?

- **Decision**: Reuse the hand-rolled 3-dot menu pattern already implemented in `CommentsTab.tsx` (`openMenuId` state, `MoreVertical` icon trigger, backdrop-to-close, `role="menu"` panel) as a new "Actions" column `render(row)` in `CasesNew.tsx`'s `DataTable` columns array. The Favourite star is rendered as its own dedicated icon (not buried in the menu, since it's the single most frequent action), with Archive/Unarchive inside the 3-dot menu.
- **Rationale**: `DataTable`'s `Column<T>` type already supports arbitrary cell renderers, so no `DataTable` API change is needed. Reusing an existing in-repo interaction pattern (rather than introducing MUI `Menu` freshly) keeps interaction behavior consistent with `CommentsTab.tsx`'s already-shipped equivalent — though since MUI `Menu`/`IconButton` are the constitution-mandated component set (VI), the new Actions-column menu is implemented with MUI `Menu`/`MenuItem`/`IconButton` components (not another hand-rolled `role="menu"` div), matching `CommentsTab.tsx`'s *interaction* pattern while using proper MUI primitives per Constitution VI.
- **Alternatives considered**: Two separate always-visible icon buttons (star + archive) with no menu — simpler, but doesn't scale if more per-row actions are added later, and unarchive needs to be conditionally shown only for archived rows, which reads more clearly inside a menu.

## R7: Should the case-scoped Task modal (`AddTaskModal.tsx`/`EditTaskModal.tsx`) be reused for Org/Site-scope tasks, or is a new modal needed?

- **Decision**: New `TaskModal.tsx` (co-located under `app/organization/components/calendar/`) is built for Calendar-originated Task creation, supporting an Org/Site/Case scope picker (via `CasePickerAutocomplete` when "Case" is chosen) plus the shared Priority control. The existing case-scoped `AddTaskModal.tsx`/`EditTaskModal.tsx` (used inside `TasksTab.tsx`) are left as-is, since they're accessed from within an already-known Case context and don't need a scope picker.
- **Rationale**: The two entry points have different fixed-vs-choosable scope needs (case-workspace Task creation has an implicit Case; Calendar-originated Task creation needs the user to pick a scope first) — forcing one shared modal to handle both would complicate its prop surface for no reuse benefit, since the two are never rendered from the same place.
- **Alternatives considered**: Retrofitting `AddTaskModal.tsx` with an optional scope picker — rejected; would add conditional complexity to a component with an already-established, simpler contract used elsewhere.

## R8: Priority — dedicated field addition, not a rename of the existing (unused) `priority` sort option

- **Decision**: `TasksTab.tsx`'s toolbar already lists `priority:asc`/`priority:desc` as a sort option even though no `CaseTask`/`Task` type has a `priority` field today (dead/forward-looking code). This feature adds a real `priority?: Priority` field to `CaseTask`/`Task`, `CaseHearing`/`Hearing`, and the new `Note` type, making that sort option finally functional for case-scoped tasks as an incidental side effect, without needing separate work to "activate" it.
- **Rationale**: Avoids scope creep of building new sort UI while still resolving a small piece of existing tech debt as a natural byproduct.
