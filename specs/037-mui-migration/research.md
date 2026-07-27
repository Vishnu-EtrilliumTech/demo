# Phase 0 Research: MUI Component & Mobile-First Migration

No `NEEDS CLARIFICATION` markers remained in the Technical Context — this migration works
entirely within the existing, well-established stack (Next.js 15, MUI 6, Tailwind 3, the
`src/design-system` package already on this branch). Research below resolves the open technical
decisions needed before design (Phase 1), based on the codebase survey performed during
specification.

## Decision 1: Breakpoint scale for the MUI theme

- **Decision**: Extend `src/design-system/theme/muiTheme.ts` with an explicit `breakpoints.values`
  matching MUI's own default scale (`xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536`) rather than
  inventing a custom scale.
- **Rationale**: The app already has 137 Tailwind `sm:`/`md:`/`lg:`/`xl:` usages scattered across
  the codebase using Tailwind's default breakpoints (`sm: 640, md: 768, lg: 1024, xl: 1280`),
  which are close but not identical to MUI's. Since FR-009 requires new styling to move onto the
  MUI theme (not Tailwind), and no screen currently mixes both breakpoint systems on the same
  element, adopting MUI's stock scale avoids inventing a third scale and keeps `sx`/`useMediaQuery`
  usage idiomatic. Existing Tailwind breakpoints are left alone on unmigrated screens and are
  naturally retired as each screen migrates.
- **Alternatives considered**: (a) Match Tailwind's exact pixel values in the MUI theme — rejected,
  adds a permanent divergence from MUI defaults for a marginal (40–100px) alignment benefit, and
  every MUI ecosystem example/doc assumes the default scale. (b) Introduce a fifth custom
  breakpoint tier for large tablets — rejected as unnecessary; no screen surveyed needs it.

## Decision 2: Mobile navigation pattern — REVISED during implementation

- **Original decision** (superseded): Wrap `AppShell` with a new MUI `Drawer` component.
- **Revised decision**: Do nothing new — `AppShell` (`src/design-system/components/AppShell.tsx`)
  already implements a complete, working mobile drawer: `mobileOpen` state, a `.sidebar-backdrop`,
  a `.sidebar.mobile-open { transform: translateX(0) }` slide-in, and a `.menu-btn` hamburger that
  only renders below `768px` (`src/design-system/styles/components.css` line ~435-450). This was
  added by the "Enhance AppShell with collapsible sidebar" commit already on this branch, before
  this feature's planning phase — the original research pass didn't check the CSS closely enough
  to notice it already covers FR-006.
- **Rationale for the revision**: Building a second, MUI-`Drawer`-based nav would duplicate working
  functionality, introduce a second nav-item source of truth, and risk visual drift from every
  other screen that already renders through `AppShell`. Reusing the existing implementation is
  strictly lower-risk and already satisfies FR-006 and User Story 2 Acceptance Scenario 3 as-is.
- **Action taken**: Foundational tasks T006/T007 (build/test a new `MobileNavDrawer`) were dropped;
  User Story 2's task now only verifies the existing drawer against the documented breakpoint scale
  rather than building anything new.

## Decision 3: Responsive strategy for data tables — REVISED during implementation

- **Original decision** (superseded): Wrap MUI `Table` in a new `ResponsiveTableContainer` (`Box`
  with `overflow-x: auto`).
- **Revised decision**: Use the existing shared `DataTable` component
  (`src/design-system/components/DataTable.tsx`) instead of MUI's `Table` primitive. `DataTable`
  already renders `<div className="card"><table className="tbl">...`, and
  `.card:has(table.tbl) { overflow-x: auto }` plus `table.tbl { min-width: 620px }` at ≤760px
  (`components.css`) already gives exactly the contained-horizontal-scroll behavior this decision
  was trying to build. Every already-migrated `*New.tsx` screen (e.g. `LawyersNew.tsx` via
  `UserManagementTabNew.tsx`) already renders its tables through `DataTable`, not raw MUI `Table`.
- **Rationale for the revision**: Migrating the 4 raw-`<table>` eCourts tabs and 4 admin-dashboard
  pages onto MUI's own `Table`/`TableContainer` would use different default padding/borders/hover
  states than `.tbl`, risking visible drift from every sibling screen (violates FR-002) and
  reintroducing a second table-styling system (violates FR-009). Using the same `DataTable` every
  other screen already uses is the only way to guarantee both pixel parity and responsive behavior
  simultaneously.
- **Action taken**: Foundational tasks T008/T009 (build/test a new `ResponsiveTableContainer`) were
  dropped; the User Story 1 table-migration tasks target `DataTable` directly, and User Story 2's
  table-responsiveness task became a no-op verification (the behavior ships as a side effect of
  User Story 1).

## Decision 3a: Raw `<ul>/<li>` in `EcourtDetailsView/parts.tsx` — scope correction

- **Finding**: The only `ul`/`li` usage in `parts.tsx` is `ProseList`, explicitly documented in
  its own source comment as rendering `.prose` content "(preserves legacy `<ul>` blocks)" — i.e.
  a plain bulleted list of text inside prose copy, not an interactive or structural control.
- **Decision**: Leave `ProseList` as native `<ul>/<li>`. FR-001 targets raw HTML "used as the
  primary building block of a control"; a content bullet list is not a control, and semantic
  `<ul>/<li>` is the correct, standard markup for it (MUI's own `List`/`ListItem` are meant for
  interactive/navigational lists, not prose bullets). Converting it would add MUI-specific
  padding/markers with no behavioral or visual benefit, risking FR-002 drift for no gain.
- **Action taken**: Task T014 was re-scoped from "migrate parts.tsx to MUI List" to a documentation
  no-op — confirmed intentional, no code change.

## Decision 4: Reconciling Tailwind and MUI on migrated screens

- **Decision**: When a screen is migrated, its Tailwind utility classes are translated to MUI
  `sx` props or theme-driven style overrides sourced from the same design tokens
  (`src/design-system/styles/tokens.css`); the screen ships with zero remaining Tailwind classes
  once migration is complete for that screen. Tailwind itself stays installed for not-yet-migrated
  screens.
- **Rationale**: Directly satisfies FR-009 (no parallel styling system per migrated screen) while
  keeping the migration incremental — Tailwind isn't ripped out repo-wide as a prerequisite, which
  would balloon scope far beyond this feature.
- **Alternatives considered**: Removing Tailwind entirely up front — rejected, explicitly out of
  scope per spec.md Assumptions; Leaving Tailwind classes alongside MUI `sx` on migrated screens —
  rejected, reintroduces the dual-styling-system problem FR-009 exists to close.

## Decision 5: Verifying "look and feel kept untouched"

- **Decision**: Use manual side-by-side comparison (a Playwright script that screenshots the
  pre-migration and post-migration render of each screen at a fixed 1440px viewport, reviewed by
  the implementer/reviewer) rather than adopting a new automated visual-regression product.
- **Rationale**: The repo has no visual-regression tool installed today, and introducing one
  (e.g., Percy, Chromatic) is a dependency/process decision beyond this feature's scope and budget.
  Playwright is already the E2E tool of record (Constitution Principle III), so scripting
  before/after screenshots reuses existing tooling and infra with no new service dependency.
- **Alternatives considered**: Adopting a SaaS visual-regression tool — rejected as scope creep and
  an unapproved new external dependency; purely manual eyeballing with no captured artifact —
  rejected as insufficiently verifiable for SC-003.

## Decision 7: Flag-gating granularity for in-place edits — scope adjustment

- **Finding**: FR-010's flag pattern was modeled on this branch's existing `*Legacy.tsx`/`*New.tsx`
  *whole-screen* pairs, where the flag switches between two complete, independently-maintained
  files. The 20 files in this feature's real scope (see tasks.md Scope Note) have no such pair —
  they were edited in place (e.g. `CaseInfoTab.tsx`'s raw `<table>` blocks became `SimpleTable`
  calls in the same file). There is no separate "legacy" file left for a runtime flag to fall back
  to without deliberately duplicating each migrated element's old markup inline as a permanent
  dead-code branch.
- **Decision**: The six flags registered in `FLAG_DEFAULTS` (T005) are kept as ship/no-ship gates —
  flipped to `true` only after T041/T041a/T042's parity-and-regression audit passes (already
  exactly T043's job) — rather than wired as live per-element toggles with two rendered code paths.
  Rollback for these files, if ever needed, is git revert of the specific commit, same as any other
  code change in this repository.
- **Rationale**: Maintaining a duplicate inline "old" branch for every migrated table cell/field
  across 20 files would roughly double the code touched by this feature, increase transcription-
  error risk in the kept-as-fallback branch, and clutter files that were previously clean — for a
  rollback mechanism git already provides. FR-010's underlying intent (safe, reversible rollout) is
  preserved via git history + the parity/regression gate; only the literal "live flag toggle"
  mechanism is adjusted for files where no whole-screen counterpart exists to toggle to.
- **Action taken**: T015/T021/T026/T030 ("gate behind flag") are interpreted as "ensure the flag
  exists and stays off until sign-off," not "add an if/else render branch per element." This is
  called out explicitly in each task rather than left ambiguous.

## Decision 6: Test selector strategy for migrated screens

- **Decision**: Where existing Playwright/RTL tests select elements by tag name or CSS class tied
  to the legacy markup, update them to select by ARIA role, accessible label, or a stable
  `data-testid`, consistent with Testing Library's guidance and Constitution Principle III.
- **Rationale**: MUI renders semantically similar but structurally different DOM (e.g., a `Button`
  is still a `<button>`, but a `Select` is not a native `<select>`), so tag/class-based selectors
  break on migration regardless of visual parity; role/label selectors are resilient to the
  underlying component swap and match how the constitution already expects tests to be written.
- **Alternatives considered**: Leaving legacy selectors and patching them ad hoc without a stated
  convention — rejected, reintroduces the same brittleness this migration is meant to remove.
