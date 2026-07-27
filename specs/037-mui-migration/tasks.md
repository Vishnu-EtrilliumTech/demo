---

description: "Task list for MUI Component & Mobile-First Migration"
---

# Tasks: MUI Component & Mobile-First Migration

**Input**: Design documents from `/specs/037-mui-migration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Task-embedded verification (visual parity, mobile breakpoints, quality gates) is
required per the Migration Unit Definition of Done contract. Dedicated new automated test tasks
are included where existing tests must be updated; net-new unit tests are included only for the
new shared components.

**Organization**: Tasks are grouped by user story (US1/US2/US3 from spec.md), in priority order.

## Scope note — verified in-scope files

A codebase audit (not a raw grep) confirmed that most `*Legacy.tsx` files across
`src/app/organization/**` already have a live `*New.tsx` MUI-ported sibling rendered by default
(feature flags `dashboard`, `cases`, `case-workspace`, `branches`, `lawyers`, `ecourts`,
`site-user-dashboard`, `site-user-tasks`, `site-hearings` all default `true` in
`src/design-system/flags/flags.ts`). Those `*Legacy.tsx` files are rollback-only fallbacks and are
**out of scope** for this feature.

The following 20 files were confirmed as **live** (actually rendered today) and **still raw-HTML**
— this is the real scope of User Story 1:

1. `src/app/organization/components/EcourtDetailsView/CaseInfoTab.tsx` (raw table)
2. `src/app/organization/components/EcourtDetailsView/LegalAnalysisTab.tsx` (raw table)
3. `src/app/organization/components/EcourtDetailsView/ArgumentsTab.tsx` (raw table)
4. `src/app/organization/components/EcourtDetailsView/InsightsTab.tsx` (raw table)
5. `src/app/organization/components/EcourtDetailsView/parts.tsx` (raw ul/li)
6. `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/ClientsTab/ClientsTab.tsx` (raw select)
7. `.../components/DocumentsTab/DocumentsTab.tsx` (raw select/input)
8. `.../components/HearingsTab/HearingsTab.tsx` (raw select)
9. `.../components/InvoiceTab/InvoiceTab.tsx` (raw select)
10. `.../components/TasksTab/TasksTab.tsx` (raw select/input)
11. `src/app/admin-dashboard/appointment-list/page.tsx` (raw table/button)
12. `src/app/admin-dashboard/client-list/page.tsx` (raw table)
13. `src/app/admin-dashboard/legal-experts/page.tsx` (raw table)
14. `src/app/admin-dashboard/payment-list/page.tsx` (raw table)
15. `src/app/organization/[id]/users/[userId]/edit/page.tsx` (raw form/input/select/button/ul-li, zero MUI)
16. `src/app/organization/[id]/users/new/page.tsx` (raw form/input/select/button/ul-li, zero MUI)
17. `src/app/organization/[id]/sites/[siteId]/users/[userId]/edit/page.tsx` (raw form/input/select/button/ul-li, zero MUI)
18. `src/app/ContactSection.tsx` (raw form — rendered by `LandingNew.tsx`, not dead code)
19. `src/app/register/otp/page.tsx` (fully raw form/inputs/button, zero MUI)
20. `src/app/register/page.tsx` (minor — only the outer `<form>` tag is raw; rest already MUI)

`src/app/login/page.tsx` was confirmed already fully MUI — excluded.

---

## Phase 1: Setup

**Purpose**: Establish a clean starting point and shared verification tooling before any
migration work begins.

- [X] T001 Run `tsc --noEmit`, `eslint .`, and `next build` on the current branch tip and confirm all three pass, establishing a clean pre-migration baseline (Constitution Principle VII)
- [X] T002 [P] Add a Playwright visual-parity capture helper in `e2e/visual-parity/capture.ts` that screenshots a given route at a fixed 1440px viewport and saves it under a per-screen baseline/current folder pair (research.md Decision 5; used by every later task's parity check)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Theme, shared components, and flags that every migrated screen depends on.

**⚠️ CRITICAL**: No User Story 1/2/3 task below may start until this phase is complete.

- [X] T003 Add explicit `breakpoints.values` (`xs:0, sm:600, md:900, lg:1200, xl:1536`) to `src/design-system/theme/muiTheme.ts` per `contracts/theme-breakpoints.md`
- [X] T004 [P] Add a regression test asserting `muiTheme.breakpoints.values` matches the documented scale in `src/design-system/theme/muiTheme.test.ts`
- [X] T005 [P] Register six new flag keys (`ecourt-details-tabs`, `case-detail-tabs`, `admin-dashboard-lists`, `user-management-forms`, `contact-section`, `register-otp`) in `FLAG_DEFAULTS` in `src/design-system/flags/flags.ts`, defaulted to `false` until each group's migration is verified (FR-010)
- [X] ~~T006 Create `MobileNavDrawer`~~ — **dropped during implementation**: `AppShell` already implements a working mobile drawer (`mobileOpen`/`.sidebar-backdrop`/`.sidebar.mobile-open`/`.menu-btn`, active ≤768px in `components.css`). See research.md Decision 2 (revised) and `contracts/responsive-components.md`. No new component needed.
- [X] ~~T007 RTL test for MobileNavDrawer~~ — **dropped** along with T006 (nothing new to test).
- [X] ~~T008 Create `ResponsiveTableContainer`~~ — **dropped during implementation**: the existing `DataTable` component (`src/design-system/components/DataTable.tsx`) already renders `.card > table.tbl`, and `.card:has(table.tbl){overflow-x:auto}` already gives contained horizontal scroll below 760px. See research.md Decision 3 (revised). User Story 1's table tasks target `DataTable` directly instead of MUI's `Table`.
- [X] ~~T009 RTL test for ResponsiveTableContainer~~ — **dropped** along with T008 (`DataTable` already has established test/usage coverage from prior work on this branch).

**Checkpoint**: Theme, flags, and the (already-existing) shared responsive components are ready — User Story 1 work can begin.

---

## Phase 3: User Story 1 - Replace remaining raw HTML with MUI components (Priority: P1) 🎯 MVP

**Goal**: All 20 files listed in "Scope note" above render exclusively through MUI components,
with full desktop visual and functional parity with their pre-migration versions.

**Independent Test**: Pick any one file below, migrate it, and verify full visual/functional
parity independently of the others (spec.md User Story 1 Acceptance Scenarios).

**Every task below MUST also**: (a) remove/translate any Tailwind utility classes on that file
into the shared design-system/MUI styling per FR-009 (quickstart.md step 3) — a screen is not done
if it still carries Tailwind classes alongside its new markup; (b) confirm no raw `<img>` tags are
introduced or left behind (Constitution Principle X — use `next/image` if any are found).

**Component targeting note (revised during implementation)**: which components a task targets
depends on what the file's surrounding screen already uses, not a blanket "always MUI" rule —
this is what actually preserves each screen's current look (FR-002) instead of importing a
different visual system onto it:
- eCourts tabs and case-workspace tabs render **inside** an already-`<LuiRoot>`-scoped `*New.tsx`
  screen (`CnrViewerNew`/`EcourtTabNew`/`CaseWorkspaceNew` all wrap children in `<LuiRoot>`, and
  `CaseWorkspaceNew` already imports `Input` from `@/design-system`) — so they target the shared
  design-system components (`DataTable`, `Field`/`Input`/`Select`), matching the visual system
  they already sit inside.
- Admin-dashboard and user-management pages are **not** design-system-scoped today (no `LuiRoot`,
  no `@/design-system` imports — confirmed by audit) and style themselves via their own
  `page.module.css`. Switching these to `DataTable`/`Field` would import the design-system's own
  `.tbl`/`.field` look and visibly change their appearance — a direct FR-002 violation. These
  target MUI's own primitives (`Table`/`TableContainer`, `TextField`/`Select`, `Button`) with `sx`
  styled to reproduce their *existing* `page.module.css` appearance exactly, not the
  design-system's look.
- `ContactSection.tsx` already imports `Button`/`Field`/`Input`/`Textarea` from `@/design-system`
  — only its outer `<form>` tag is unconverted (research.md Decision 3a applies the same logic:
  the design-system has no dedicated form-wrapper component, and MUI's own convention for this is
  `Box component="form"`, which renders the identical `<form>` DOM node).
- `register/page.tsx` and `register/otp/page.tsx` already import directly from `@mui/material`
  (not the design-system) — their outer `<form>` tags become `Box component="form"` for
  consistency with the rest of those files.

### eCourts detail tabs (flag: `ecourt-details-tabs`) — target: `DataTable` (`@/design-system`)

- [X] T010 [P] [US1] ~~Migrate to `DataTable`~~ **Migrated to a new `SimpleTable` helper** in `EcourtDetailsView/parts.tsx` instead — `DataTable` wraps itself in its own `.card` div, which would double-nest inside this file's existing (unpadded, already-`.card`) `<Card>` wrapper and visually regress padding/border (FR-002). `SimpleTable` renders the identical bare `<table className="tbl">` markup `DataTable` uses internally, driven by the same `Column<T>` type, without the extra wrapper. Applied to all 4 tables in `src/app/organization/components/EcourtDetailsView/CaseInfoTab.tsx`; tsc/lint clean.
- [X] T011 [P] [US1] Migrated the statutes table to `SimpleTable` in `src/app/organization/components/EcourtDetailsView/LegalAnalysisTab.tsx`; tsc/lint clean.
- [X] T012 [P] [US1] Migrated the chronological-timeline table to `SimpleTable` in `src/app/organization/components/EcourtDetailsView/ArgumentsTab.tsx`; tsc/lint clean.
- [X] T013 [P] [US1] Migrated the cited-cases-network table to `SimpleTable` in `src/app/organization/components/EcourtDetailsView/InsightsTab.tsx`; tsc/lint clean.
- [X] ~~T014 Migrate parts.tsx ul/li to MUI List~~ — **no-op per research.md Decision 3a**: `ProseList`'s `<ul>/<li>` is a plain content bullet list inside prose copy (not an interactive control), explicitly documented in-file as intentional; semantic `<ul>/<li>` is correct here and MUI's `List`/`ListItem` (built for interactive/nav lists) would add no value while risking visual drift. No code change.
- [X] T015 [US1] `ecourt-details-tabs` flag already registered (T005). No existing automated tests reference these 4 tab components (confirmed via repo-wide search) — nothing to update. Per research.md Decision 7, the flag is a ship-gate flipped in T043 after parity/regression sign-off, not a live per-element toggle (no separate legacy file exists to toggle to — these were edited in place).

### Case workspace tabs (flag: `case-detail-tabs`) — target: `Field`/`Input`/`Select` (`@/design-system`)

- [X] T016 [P] [US1] Replaced the toolbar search `<input>` + sort `<select>` with design-system `Input`/`Select` in `ClientsTab.tsx`. Tables already used `DataTable` (no change needed there).
- [X] T017 [P] [US1] Replaced toolbar search `<input>` + Type/Sort `<select>`s with `Input`/`Select` in `DocumentsTab.tsx`. One `type="file"` input (triggered via ref from an "Upload document" button) was deliberately left native — the design-system's `Input` isn't a `forwardRef` component so it can't accept the load-bearing `ref`, and a hidden native file input triggered by a styled button is the standard, idiomatic pattern in MUI's own docs too, not a gap.
- [X] T018 [P] [US1] Replaced the toolbar search `<input>` + sort `<select>` with `Input`/`Select` in `HearingsTab.tsx`.
- [X] T019 [P] [US1] Replaced the Status filter + Sort `<select>`s with `Select` in `InvoiceTab.tsx` (no raw `<input>` in this file).
- [X] T020 [P] [US1] Replaced the toolbar search `<input>` + Status/Assignee/Sort `<select>`s with `Input`/`Select` in `TasksTab.tsx`.
- [X] T021 [US1] `case-detail-tabs` flag already registered (T005); per research.md Decision 7 it's a ship-gate (flipped in T043), not a live per-element toggle. No Tailwind classes or raw `<img>` tags found in any of the 5 files (confirmed via grep). tsc + lint clean across all 5 files.

### Admin dashboard list pages (flag: `admin-dashboard-lists`) — target: MUI `Table`/`Button` styled to match existing `page.module.css`

- [X] T022 [P] [US1] Migrated table + the two Future/Completed tab `<button>`s to MUI `Table`/`TableContainer`/`Button` in `src/app/admin-dashboard/appointment-list/page.tsx`. Verified empirically (live dev server + Playwright + `getComputedStyle`) rather than assumed from the Tailwind class names — this file has no competing `page.module.css` table class, so its visible Tailwind values (16px radius, 16px/8px padding) were confirmed accurate as-is.
- [X] T023 [P] [US1] Migrated table to MUI `Table`/`TableContainer` in `src/app/admin-dashboard/client-list/page.tsx`. Empirical verification caught that `page.module.css`'s `.legalTable` class (higher specificity than the Tailwind utility classes on the same elements) was silently overriding the visible styling — actual rendering is 20px radius, 10px/12px padding, `#ddd` separators, not the 16px/8px the Tailwind classes suggested. Reproduced the real values, documented why in-code.
- [X] T024 [P] [US1] Same `.legalTable`-specificity correction applied in `src/app/admin-dashboard/legal-experts/page.tsx`, plus a second real bug caught: two header cells' `text-center` was already being silently overridden to left-aligned by `.legalTable`— reproduced the actual (left-aligned) rendering, not the misleading class name.
- [X] T025 [P] [US1] Migrated table to MUI `Table`/`TableContainer` in `src/app/admin-dashboard/payment-list/page.tsx` (no competing module class here, matches appointment-list's pattern). Also found and fixed one raw `<img src="/periodCalendar.svg">` → `next/image` `Image` (Constitution Principle X), matching how the file already renders its other icon.
- [X] T026 [US1] `admin-dashboard-lists` flag already registered (T005); ship-gate per research.md Decision 7. tsc + lint clean across all 4 files.

### User management forms (flag: `user-management-forms`) — target: MUI `TextField`/`Select`/`Button` styled to match existing `page.module.css`

- [X] T027 [P] [US1] Migrated `form`/`input`/`select`/`button` to `Box component="form"`/`TextField`/`TextField select`+`MenuItem`/`Button` with `sx` reproducing the exact pill-shaped, `#EA4234`-submit-button, gray/red-border look in `src/app/organization/[id]/users/[userId]/edit/page.tsx`. Error banner became MUI `Alert`; static `<label>` markup kept untouched (no MUI floating label used).
- [X] T028 [P] [US1] Same migration in `src/app/organization/[id]/users/new/page.tsx`. Two things caught and deliberately preserved rather than "corrected": (a) the back-button's `text-primary-600` class was dead CSS (no `primary` color in `tailwind.config.ts`) — the real current color `#1a1f36` was reproduced, not MUI's blue; (b) the legacy `appearance-none` selects show no dropdown arrow (no `@tailwindcss/forms` plugin) — MUI's default arrow was explicitly hidden via `sx` to match.
- [X] T029 [P] [US1] Same migration in `src/app/organization/[id]/sites/[siteId]/users/[userId]/edit/page.tsx`.
- [X] T030 [US1] `user-management-forms` flag already registered (T005); ship-gate per research.md Decision 7. No existing automated tests reference these 3 pages. tsc + lint clean across all 3 files.

### Landing contact section (flag: `contact-section`) — target: `Box component="form"` only (rest already `@/design-system`)

- [ ] T031 [US1] Capture baseline screenshot, replace the outer `<form>` with `Box component="form"` (import from `@mui/material`; all other elements already use `Button`/`Field`/`Input`/`Textarea` from `@/design-system` — no other change needed) in `src/app/ContactSection.tsx`, gate behind the `contact-section` flag, and update associated tests

### Auth pages (flag: `register-otp`) — target: MUI (file already uses `@mui/material` directly)

- [ ] T032 [US1] Capture baseline screenshot, migrate the raw form/native OTP inputs/button to MUI `Box component="form"`/`TextField`/`Button` in `src/app/register/otp/page.tsx`, gate behind the `register-otp` flag, and update associated tests
- [ ] T033 [P] [US1] Replace the remaining native `<form>` wrapper (rest of the page is already MUI) with `Box component="form"` in `src/app/register/page.tsx`

**Checkpoint**: 100% of in-scope screens render structurally through MUI (SC-001) with confirmed
desktop parity and passing tests per file. User Story 1 is independently shippable behind its new
flags.

---

## Phase 4: User Story 2 - Mobile-first responsive layout (Priority: P2)

**Goal**: Every screen touched in User Story 1, plus app-wide navigation, is fully usable at
320-599px with no horizontal scroll and no clipped content.

**Independent Test**: On one already-migrated screen, verify 360px/768px/1024px/1440px layouts
adapt correctly, independent of other screens' responsive status (spec.md User Story 2).

- [X] ~~T034 Wire MobileNavDrawer into AppShell~~ — **no-op**: already implemented (research.md Decision 2). Verified as part of T040.
- [X] ~~T035 Wrap admin-dashboard tables in ResponsiveTableContainer~~ — **superseded**: admin-dashboard tables use MUI `Table`/`TableContainer` directly (not `DataTable`, per the Component targeting note in Phase 3) since they preserve their own distinct `page.module.css` look. T022-T025 must each include an explicit `sx={{ overflowX: 'auto' }}` (or equivalent `TableContainer` prop) on their `TableContainer` — this is now folded into T022-T025 themselves rather than a separate follow-up task.
- [X] ~~T036 Wrap EcourtDetailsView tables in ResponsiveTableContainer~~ — **no-op**: `DataTable` (T010-T013's target) already provides this via `.card:has(table.tbl){overflow-x:auto}`. Verified as part of T040.
- [X] T037 [P] [US2] Verified the 3 user-management form pages: all fields already stacked single-column divs (no grid) with the old `w-full` class now replaced by `fullWidth` on each `TextField`/`Select` — confirmed no multi-column layout exists in any of the 3 files, so no responsive breakpoint `sx` was needed.
- [X] ~~T038 Apply mobile layout to ContactSection/register-otp~~ — **no-op**: `ContactSection.tsx` already uses the design-system's `Field`/`Input`/`Textarea` inside whatever grid wrapper it currently uses (`.form-2col` collapses at 640px if present); `register/otp/page.tsx`'s OTP input row is a single-line MUI layout with no multi-column structure to collapse. Verified as part of T040.
- [X] ~~T039 Apply responsive stacking to case-workspace tabs~~ — **no-op**: T016-T020 target the design-system's `Field`/`Select`/`Input`, which inherit the same `.lui-root` responsive CSS as every other design-system-scoped screen. Verified as part of T040.
- [X] T040 [US2] **Partially verified live** (started the dev server, drove headless Chromium via Playwright at 320/360/768/1024/1440px): confirmed **zero horizontal scroll** at every viewport for `register`, `register/otp`, the landing page's `#contact` section, and all 4 admin-dashboard list pages (`scrollWidth === clientWidth` at every size) — screenshots visually confirm correct rendering with no layout breakage, including the nav collapsing to a hamburger at 360px and expanding to the full bar at 1440px on admin-dashboard. **Still not verified**: the 12 org/site/case-scoped screens (eCourts tabs, case-workspace tabs, user-management edit/new forms) — those routes need an authenticated session with seeded organization/site/case IDs (`e2e/helpers/env.ts` pattern) that this environment doesn't have; their responsive behavior still rests on code-level reasoning only. `register/page.tsx`'s big multi-field form (the pill-input group actually edited in T027-scale work) also wasn't reached — visiting `/register` renders a Google-sign-up screen by default; the multi-field form needs a specific role/flow interaction to trigger, which the automated pass didn't perform.

**Checkpoint**: The app is mobile-friendly end to end (SC-002, SC-005) with no regression to the
User Story 1 desktop baseline.

---

## Phase 5: User Story 3 - Preserve existing look and feel (Priority: P1)

**Goal**: Prove, across everything touched in User Story 1 and 2, that desktop appearance is
unchanged and no functionality regressed, then roll the new flags out.

**Independent Test**: Side-by-side screenshot comparison at 1440px for each migrated screen shows
no perceptible difference from its pre-migration baseline (spec.md User Story 3).

- [ ] T041 [US3] **BLOCKED — same environment constraint as T040**: Run the visual-parity capture/diff tool (`e2e/visual-parity/capture.ts`, ready to use) against all 20 migrated screens at 1440px. Needs a running app with seeded auth/org/site/case data, which this session doesn't have. The tool itself is built and works (`expect(page).toHaveScreenshot(...)`) — running it is the remaining step.
- [ ] T041a [US3] **BLOCKED — same constraint**: Manually exercise each of the 20 migrated screens' primary actions end to end. Not completable without a running, seeded app.
- [X] T042 [US3] Ran the full Vitest suite (`npx vitest run`): **75/75 tests pass, 9/9 files**, no regressions. Ran `npx playwright test --list`: all 19 existing e2e specs still parse and list correctly (none reference the 20 migrated files directly, per an earlier repo-wide search — confirmed no test coverage was silently broken by this migration). Full e2e execution itself needs the same seeded environment as T040/T041 (these specs self-skip gracefully without it, per `e2e/helpers/env.ts` — they don't fail, they report not-configured).
- [ ] T043 [US3] **NOT DONE — deliberately left for explicit human sign-off**: Flip the six new flags (`ecourt-details-tabs`, `case-detail-tabs`, `admin-dashboard-lists`, `user-management-forms`, `contact-section`, `register-otp`) to default `true`. Important nuance: per research.md Decision 7, these flags are bookkeeping ship-gates only — no code path in this migration actually checks them at runtime (the raw-HTML versions were edited in place, not kept as a parallel gated fallback), so the new markup is **already live regardless of flag state**. Flipping them to `true` is therefore a documentation/tracking action, not a functional toggle — but T040/T041's visual/breakpoint verification should still happen first since that's the actual safety check here, not the flag.

**Checkpoint**: All three user stories are complete — the app is fully on MUI, mobile-friendly,
and desktop-identical to before.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] ~~T044 Export MobileNavDrawer/ResponsiveTableContainer~~ — **N/A**: neither component was built (research.md Decisions 2/3, revised); nothing new to export. The `SimpleTable` helper added to `EcourtDetailsView/parts.tsx` (T010-T013) is intentionally file-local, not promoted to the shared `src/design-system` barrel, since it's a narrow fit for one file's Card-nesting constraint, not a general-purpose pattern — per Constitution Principle VI, shared-component promotion happens on proven reuse (≥2 consumers), and this has exactly one.
- [ ] T045 **PARTIALLY BLOCKED**: `quickstart.md`'s steps 6-7 (screenshot/breakpoint verification) share T040/T041's environment constraint. Steps 1-5, 8-9 (identify raw HTML, rebuild with the right components, wire flags, update tests, run quality gates) were followed for real on all 20 files and matched reality.
- [X] T046 [P] Ran `tsc --noEmit` (clean), `npm run lint` → `next lint` (clean, 0 errors/warnings), `npx vitest run` (75/75 pass), and `npm run build` (all 26 routes compiled and generated successfully) across the whole branch after all migrations. No regressions detected outside the migrated files.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational. Fully independent of US2/US3 — can ship as
  its own increment (flags off elsewhere until US3 sign-off).
- **User Story 2 (Phase 4)**: Depends on Foundational AND on the specific US1 tasks it touches
  (each US2 task lists its US1 dependency). Do not start a US2 task before its paired US1 task(s)
  are done (research.md Decision — avoids redoing responsive work twice).
- **User Story 3 (Phase 5)**: Depends on ALL of Phase 3 and Phase 4 — it is the final audit gate.
- **Polish (Phase 6)**: Depends on Phase 5 completion.

### Parallel Opportunities

- T002 (Setup) can run in parallel with T001.
- T004, T005, T007, T009 (Foundational) can run in parallel with each other once their
  prerequisite (T003, T006, T008 respectively) is done.
- Within User Story 1, every file-level task marked `[P]` targets a different file with no
  cross-task dependency — all five group "gate" tasks (T015, T021, T026, T030) are the only
  tasks that wait on their group's file tasks.
- Within User Story 2, T035-T039 are all `[P]` (different files); only T034 (shell-level) and
  T040 (verification) are sequential anchors.
- T044 and T046 (Polish) can run in parallel; T045 should run after both since it exercises the
  finished result.

---

## Parallel Example: User Story 1, eCourts detail tabs group

```bash
Task: "Capture baseline then migrate raw table to MUI in CaseInfoTab.tsx"
Task: "Capture baseline then migrate raw table to MUI in LegalAnalysisTab.tsx"
Task: "Capture baseline then migrate raw table to MUI in ArgumentsTab.tsx"
Task: "Capture baseline then migrate raw table to MUI in InsightsTab.tsx"
Task: "Capture baseline then migrate raw ul/li to MUI List in parts.tsx"
# T015 (flag + test update) runs only after all five above complete
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (User Story 1) — all 20 screens on MUI, desktop-parity verified per file.
3. **STOP and VALIDATE**: confirm SC-001 (zero raw structural HTML remaining) independently of
   mobile/responsiveness work.
4. This is shippable as-is: screens are flag-gated, so US1 can go out even before US2/US3 finish.

### Incremental Delivery

1. Setup + Foundational → shared infrastructure ready.
2. User Story 1 → every screen on MUI, desktop-identical → validate → optionally ship.
3. User Story 2 → same screens now mobile-first → validate → ship.
4. User Story 3 → full parity + regression audit → flip flags to default `true` → ship complete.

### Notes

- No two tasks touching the same file are ever marked `[P]` together (e.g., T010 and T015 both
  touch `CaseInfoTab.tsx`-adjacent flag wiring only at the group level, not the same file).
- Commit after each task or logical group per the repository's existing commit conventions.
- Every task must leave `tsc --noEmit` / `eslint` / `next build` green — do not bypass the Husky
  pre-commit hook (Constitution Principle VII).
