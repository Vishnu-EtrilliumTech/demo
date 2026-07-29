# Quickstart: Unified Calendar, Case Favourites & Archive, and eCourts Onboarding Import

This is a mock-data-only frontend feature. Once implemented, verify it manually against the running prototype:

## Setup

```powershell
yarn install   # if not already
yarn dev       # or: npm run dev
```

Open `http://localhost:3000`, sign-in is auto-mocked (per `src/prototype/install.ts`) as the demo Organization Admin, "Ananya Sharma" (org id `1`).

## Golden path walkthrough

1. **Calendar (Org scope)** — Navigate to `Organization > Calendar` in the sidebar (was "Diary"). Confirm Month view shows a mix of Hearing/Task/Note items, each color-bordered by Priority (red/orange/yellow/green).
2. **Switch views** — Toggle Month → Week → Day; confirm the same filtered set re-renders at each granularity.
3. **Filter** — Pick a Site from the Site dropdown; confirm the item set narrows. Toggle "Favourites only"; confirm non-case-linked items disappear. Uncheck "Note"; confirm Notes disappear.
4. **Quick-create a Task** — Click "+Add" → Task, pick "Site" scope, fill title/due date/assignee, save; confirm it appears on the grid at its due date.
5. **Quick-create a Note** — "+Add" → Note, pick "Case" scope (triggers `CasePickerAutocomplete`), tag 2+ people, save; confirm it appears with the tagged-people indicator.
6. **Create a Hearing with inline case-create** — "+Add" → Hearing, search a case title that doesn't exist, use "Case not found — create new case," confirm the Hearing form opens with the new case prefilled, save, confirm it appears on the grid.
7. **Priority quick-set** — Click the color swatch on any Calendar item (not the item body); pick a new color; confirm it recolors immediately without opening the full edit form.
8. **Site-level Calendar** — Navigate to a Site's Calendar; confirm no Site dropdown is present and only that Site's + org-wide items show.
9. **Org Settings — default filters** — As Organization Admin, go to `Organization > Settings`, set "Default Calendar Filters" to Hearings-only, save; open the Calendar in a fresh session and confirm only the Hearing checkbox is pre-checked (Task/Note still togglable per-session without changing this default).
10. **Case Favourites** — Open a case list, star a case, confirm the star fills; toggle "Favourites only," confirm only starred cases remain; unstar, confirm it drops out of the favourites-only list.
11. **Case Archive** — From a case row's ⋮ menu, Archive a case; confirm it disappears from the default list. Toggle "Include archived," confirm it reappears marked as archived with an "Unarchive" option. Open the Calendar and confirm that case's existing Hearings/Tasks/Notes still show by date.
12. **eCourts bulk import** — Go to `Organization > eCourts`, use the onboarding bulk-import panel, search by advocate name, check 3+ results, click "Import selected"; confirm each row shows its own Created/Already Linked/Error result independently.
13. **Reminders** — From the Calendar, open "Reminders"; confirm it lists only the current user's own Tasks, Hearings, Notes, and favourite cases grouped by type, with an empty-state message for any type with nothing to show.

## Automated checks

```powershell
npx playwright test e2e/calendar.spec.ts
npx playwright test e2e/ecourts-bulk-import.spec.ts
npx tsc --noEmit
npx eslint .
npx next build
```

All three quality gates (`tsc`, `eslint`, `next build`) must pass per Constitution VII before considering this feature done.
