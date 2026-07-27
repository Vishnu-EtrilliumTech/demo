# Contract: Reused Shared Components (revised during implementation)

**Superseded**: The original version of this contract specified building two new components,
`MobileNavDrawer` and `ResponsiveTableContainer`, from raw MUI primitives. Implementation
discovered both already exist in the shared design-system and are already used by every
already-migrated screen — see `research.md` Decisions 2 and 3 for the full rationale. Building new
ones would have duplicated working functionality and introduced a second styling system (the
opposite of FR-009's intent). This contract now documents the **existing** components migrated
screens must reuse.

## `AppShell`'s mobile drawer (existing — no new component)

**Owner**: `src/design-system/components/AppShell.tsx` + `src/design-system/styles/components.css`

- Below 768px, `AppShell` automatically renders a hamburger `.menu-btn` in the topbar; clicking it
  sets `mobileOpen = true`, which adds `.mobile-open` to `.sidebar` (`transform: translateX(0)`)
  and renders a `.sidebar-backdrop` that closes the drawer on click.
- Any screen already composing `<AppShell navGroups={...}>` gets this for free — no per-screen
  work required to satisfy FR-006.
- **MUST NOT**: build a parallel nav/drawer component; duplicate the `navGroups` data structure
  elsewhere.

## `DataTable` (existing — no new component)

**Owner**: `src/design-system/components/DataTable.tsx`

- Renders `<div className="card"><table className="tbl">...</table></div>`. The `.card:has(table.tbl)`
  CSS rule (`components.css`) makes it horizontally scrollable within its own bounds below 760px
  (`table.tbl { min-width: 620px }` forces the scroll to engage), satisfying FR-007 automatically.
- Every raw `<table>` migration in this feature (the 4 eCourts detail tabs, the 4 admin-dashboard
  list pages) targets this component — pass `columns`/`rows`/`getRowKey` matching its existing
  `DataTableProps<T>` shape (see the component for the exact interface).
- Pairs with `TableFoot`/`Pagination` (same file) for list pages that already paginate.
- **MUST NOT**: reimplement sorting/pagination ad hoc; wrap it in an additional scroll container
  (it already has one).

## `Field` / `Input` / `Select` / `Textarea` (existing — no new component)

**Owner**: `src/design-system/components/form.tsx`

- `Field` is the labelled wrapper (label + control + hint/error), styled via `.field`/`.field.full`.
  `Input`/`Textarea`/`Select` render the underlying native control styled via the shared `.input`
  class. `.form-2col` (a grid wrapper, `components.css`) already collapses to one column below
  640px, satisfying FR-008 for any form composed with it.
- Every raw `form`/`input`/`select` migration in this feature (the 3 user-management pages,
  `ContactSection.tsx`, `register/otp/page.tsx`, the 5 case-workspace tabs) targets these
  components instead of MUI's `TextField`/`Select`, matching the convention every other migrated
  form on this branch already follows.
- **MUST NOT**: introduce MUI `TextField`/`Select` on these screens — that would create two
  parallel form-control styling systems on the same app (FR-009).

## `Button` (existing — no new component)

**Owner**: `src/design-system/components/Button.tsx`

- Renders `.btn .btn-{variant}`. Every raw `<button>` migration in this feature targets this
  component with the closest matching `variant` (`primary`/`secondary`/`ghost`/`danger`).

## Contract verification expectations

For each migrated file: confirm it renders exclusively through the components above (no raw
`table`/`button`/`input`/`select`/`form` remaining), confirm no visual drift at desktop width
(these components are already what every sibling screen renders, so parity is close to automatic
if used correctly), and confirm mobile behavior falls out of the existing CSS without any
additional per-screen responsive code.
