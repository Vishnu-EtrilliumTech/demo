# Implementation Plan: Unified Calendar, Case Favourites & Archive, and eCourts Onboarding Import

**Branch**: `038-calendar-favourites-archive-ecourts` | **Date**: 2026-07-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/038-calendar-favourites-archive-ecourts/spec.md`

## Summary

Build a mock-data-only frontend feature set for the Lawsome.Web.UI prototype: a unified Calendar (Org + Site scope) rendering Hearings/Tasks/Notes color-coded by a new Priority field, with inline quick-set and org-configurable default filters; Case Favourites and Case Archive controls on the active (MUI) case list; a bulk eCourts import flow (checkbox multi-select + per-row result) layered on the existing eCourts search; and a Reminders "my items" panel. The existing placeholder Diary feature (`.../diary/`) is retired and replaced by the (currently empty) `.../calendar/` route. All data — Notes, Priority, Favourites, Archive status, import results, Reminders — is served through the prototype's existing axios-shaped mock service + router layer (`src/prototype/mockData.ts` / `router.ts`), not real APIs, so it behaves like production code but resolves against in-memory seed data. A minimal net-new Org Settings page is introduced (none exists today) to host the "Default Calendar Filters" control, per user decision.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode), Next.js 15 App Router, React 19
**Primary Dependencies**: MUI 6 (component library — new modals/pages must use it, no new raw HTML per Constitution VI), Redux Toolkit 2 (only if a new slice is needed for cross-page favourite/archive state), Axios 1 (service layer), `lucide-react` (nav icons, matching existing sidebar)
**Storage**: N/A (browser-only) — mock data lives in `src/prototype/mockData.ts` (module-level in-memory arrays, reset on hard reload) and is served via `src/prototype/router.ts`, exactly like every other existing feature in this prototype
**Testing**: Playwright E2E (golden path + 2 edge cases per Constitution III), React Testing Library for new shared components in `src/components/`
**Target Platform**: Web (desktop + mobile-responsive, per ongoing 037-mui-migration work)
**Project Type**: Web application frontend only (this repo, `Lawsome.Web.UI`) — no backend/API repo changes; the API design in the source proposal document is out of scope here
**Performance Goals**: Calendar month view renders 100+ mixed items without jank; no Lighthouse regression below 70 (Constitution X)
**Constraints**: No new raw HTML elements where an MUI equivalent exists (Constitution VI); all new pages must pass `tsc --noEmit` / `eslint` / `next build` gates (Constitution VII); strict TypeScript, no untyped API payloads (Constitution I)
**Scale/Scope**: ~1 new top-level route family (Calendar, Org + Site), 1 new minimal Org Settings route, ~6 new modals/components, ~4 extended existing screens (case list, eCourts search, sidebar x2), 1 new mock-data domain (Notes, Favourites, Archive, Priority, Reminders, eCourts import results)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applicability | Compliance approach |
|---|---|---|
| I. Type Safety First | Applies | New `calendarTypes.ts` under `src/app/organization/types/` declares all new shapes (`CalendarItem`, `Priority`, `Note`, favourite/archive fields, import result). No `any`. |
| II. Security by Default (XSS) | Applies narrowly | Note bodies/Task descriptions are plain text rendered via standard JSX (no `dangerouslySetInnerHTML`, no markdown rendering introduced). |
| III. Test Coverage | Recommended | Playwright E2E for Calendar (golden path: view+filter+create+priority-set) and eCourts bulk import (golden path + partial-failure edge case); RTL unit tests for new shared components placed in `src/components/` (Priority swatch picker, if promoted there). |
| IV. Auth/Authorization Consistency | Applies | All new routes gated by `useUserRole()` booleans (new: `canViewCalendar`, `canCreateNote`, `canCreateTask`, `canArchiveCase`, `canConfigureCalendarDefaults`), following the exact existing boolean-OR pattern in `useUserRole.ts`. |
| V. API Contract Discipline | Applies | New calls added to domain-scoped `services/` files (`calendarApi.ts` new; `caseapi.ts` extended), never called directly from components; errors routed through existing `errorHandler.ts`/`useToast()`. |
| VI. Component Architecture | Applies | MUI 6 components only for new UI; business logic in new hooks (`useCalendarItems`, `useNotes`, `useTasks`, `useReminders`), not inline in components; feature-specific UI stays co-located under its route, not promoted to `src/components/` unless reused by 2+ routes (the Priority swatch picker and CasePickerAutocomplete qualify, since both Calendar and case-linked modals use them). |
| VII. Pre-commit Quality Gates | Applies | No `--no-verify`; all new code must pass `tsc`/`eslint`/`next build` before considered done. |
| VIII/IX/X/XI/XII | Not applicable | Backend-only principles (API envelopes, Serilog, EF Core migrations, Twilio/Razorpay) — this feature makes no backend changes. |
| XIII. PR Standards | Applies at merge time | Out of scope for planning artifacts; noted for the eventual PR. |
| XIV. Specification Governance | Applies | This plan + upcoming `tasks.md` are produced via Speckit before implementation, per this principle; `/speckit-analyze` will run after `tasks.md`. |

No violations requiring justification — see Complexity Tracking (empty).

## Project Structure

### Documentation (this feature)

```text
specs/038-calendar-favourites-archive-ecourts/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks — not created by /speckit-plan)
```

No `contracts/` directory: this feature has no external interface (no backend/API repo change) — the "contract" is the mock service layer itself, documented in `data-model.md` instead.

### Source Code (repository root)

This is a **single Next.js frontend project** (`Option 1`-style, adapted to this repo's actual layout — there is no separate backend in this repo). Existing directories are extended; new ones are marked **NEW**:

```text
src/
├── app/
│   └── organization/
│       ├── [id]/
│       │   ├── calendar/                          # NEW — was empty; org-level Calendar route
│       │   │   └── page.tsx
│       │   ├── settings/                           # NEW — minimal Org Settings page (none existed)
│       │   │   └── page.tsx
│       │   ├── sites/[siteId]/
│       │   │   └── calendar/                        # NEW — was empty; site-level Calendar route
│       │   │       └── page.tsx
│       │   ├── diary/                               # REMOVED entirely (retired per FR-023)
│       │   ├── cases/
│       │   │   └── CasesNew.tsx                      # EXTENDED — star toggle, Favourites-only, Archive row action, Include-archived toggle
│       │   └── ecourts/
│       │       └── components/
│       │           ├── SearchTabNew.tsx              # Advocate search tab already exists — no change needed (see research.md)
│       │           └── BulkImportPanel.tsx           # NEW — checkbox multi-select + "Import selected" + per-row result
│       ├── components/
│       │   └── calendar/                             # NEW — feature-local Calendar UI (co-located, not in src/components/)
│       │       ├── CalendarView.tsx
│       │       ├── CalendarFilterBar.tsx
│       │       ├── CalendarMonthView.tsx / CalendarWeekView.tsx / CalendarDayView.tsx  (adapted from diary/MonthView.tsx, TimeGridView.tsx)
│       │       ├── MiniCalendar.tsx                   (ported from diary/MiniCalendar.tsx)
│       │       ├── NoteModal.tsx
│       │       ├── TaskModal.tsx                      (Org/Site-scope task modal — distinct from case-scoped AddTaskModal/EditTaskModal)
│       │       └── RemindersPanel.tsx
│       ├── hooks/
│       │   ├── useCalendarItems.ts                    # NEW
│       │   ├── useNotes.ts                             # NEW
│       │   ├── useTasks.ts                             # NEW (Org/Site-scope tasks; case-scoped useCaseTasks.ts untouched)
│       │   └── useReminders.ts                          # NEW
│       ├── services/
│       │   ├── calendarApi.ts                          # NEW — fetchCalendar, notes/tasks CRUD, setPriority, favourite/archive, import
│       │   └── caseapi.ts                               # EXTENDED — favourite/archive endpoints added alongside existing case calls
│       └── types/
│           └── calendarTypes.ts                        # NEW — CalendarItem, Priority, PRIORITY_COLORS, Note, Task (org/site), ImportResult
├── components/
│   ├── modals/
│   │   ├── HearingModal.tsx                            # EXTENDED — add Priority swatch control only
│   │   ├── CasePickerAutocomplete.tsx                   # NEW (net-new, shared by Hearing +Add and Note/Task case-link)
│   │   └── PriorityPicker.tsx                            # NEW — shared 4-color swatch + popover, used by Calendar quick-set and all item modals
│   └── org/
│       ├── OrgSidebar.tsx                               # EXTENDED — replace "diary" NavKey with "calendar"; site-aware href
│       └── OrgAppShell.tsx                              # EXTENDED — same change, mirrored per existing comment convention
├── prototype/
│   ├── mockData.ts                                      # EXTENDED — notes[], caseFavourites[], priority fields, cases[].archivedDate, organization.defaultCalendarItemTypes, ecourts import result builder
│   └── router.ts                                        # EXTENDED — routes for notes/tasks(org+site)/priority-set/favourite/archive/ecourts-import
└── hooks/
    └── useUserRole.ts                                   # EXTENDED — canViewCalendar, canCreateNote, canCreateTask, canArchiveCase, canConfigureCalendarDefaults

e2e/                                                       # EXTENDED — new Playwright specs for Calendar and bulk import
```

**Structure Decision**: Follow the prototype's established conventions exactly rather than introducing new architectural patterns: feature UI co-located under its route (`app/organization/components/calendar/`), cross-route-reused pieces promoted to `src/components/` (Priority picker, Case picker — used by both Calendar and existing Hearing modal), business logic in hooks, all persistent-looking data (Notes, Priority, Favourites, Archive, import results) routed through the existing mock service+router+mockData layer (not local component state, since Favourites/Archive/Priority must stay consistent across Calendar, case lists, and Reminders simultaneously — see research.md for why the Diary precedent's local-`useState` approach is rejected here). The Diary route is deleted outright, not kept as dead code, per FR-023 and the explicit user decision to treat Calendar as its full replacement.

## Complexity Tracking

*No Constitution Check violations — table intentionally empty.*
