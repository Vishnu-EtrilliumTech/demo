# Phase 1 Data Model: MUI Component & Mobile-First Migration

This feature introduces no new persisted/business data entities — it is a presentation-layer
migration consuming existing API data unchanged. The "entities" tracked here are migration
bookkeeping constructs used to plan and verify the work in `tasks.md`, not database or API models.

## Migration Unit

Represents one screen or reusable component being migrated from raw HTML to MUI.

| Field | Description |
|---|---|
| `path` | Source file path (e.g., `src/app/organization/[id]/sites/[siteId]/SiteDetailLegacy.tsx`) |
| `feature_area` | Admin dashboard / organization-site / eCourts / billing / auth |
| `current_state` | `raw-html` \| `partial-mui` \| `mui-complete` |
| `raw_elements_present` | Which raw tags remain (`table`, `button`, `input`, `select`, `form`, `ul/li`) |
| `flag_name` | Feature flag gating this screen, if any (existing `src/design-system/flags` pattern) |
| `responsive_pattern` | `none` \| `scroll-container` \| `stacked-card` \| `drawer-nav` \| `full-width-form` |
| `desktop_parity_verified` | boolean — side-by-side screenshot comparison passed (SC-003) |
| `mobile_verified` | boolean — 360/768/1024/1440 breakpoint check passed (User Story 2 acceptance) |
| `tests_updated` | boolean — associated Playwright/RTL tests updated to role/label/test-id selectors and passing (FR-011) |

**Relationships**: A Migration Unit may depend on one or more shared **Responsive Pattern**
components (below) and is gated by at most one **Feature Flag** (existing entity, unchanged by
this feature).

**State transitions**: `raw-html` → `partial-mui` (mid-migration, flag off) → `mui-complete`
(flag on, both parity checks and test updates done). A unit never regresses backward except via
an explicit rollback (flag flipped off), which is the existing flag mechanism's job, not new
behavior introduced here.

## Responsive Pattern (shared component)

Represents a reusable responsive building block added to `src/design-system/components` so
individual screen migrations don't reinvent the same behavior.

| Field | Description |
|---|---|
| `name` | e.g., `ResponsiveTableContainer`, `MobileNavDrawer` |
| `breakpoint_behavior` | Description of what changes at which breakpoint |
| `consumers` | List of Migration Units using this pattern |
| `test_coverage` | RTL test file covering the pattern's own responsive branching |

**Relationships**: Many Migration Units consume each Responsive Pattern; a pattern is only
created when at least two Migration Units need the same behavior (per Constitution Principle VI:
promote to shared only when reused).

## Theme Breakpoint Configuration

Not a runtime entity but a config surface: the `breakpoints.values` block added to
`src/design-system/theme/muiTheme.ts` (see research.md Decision 1). Tracked here because every
Migration Unit's `responsive_pattern` is expressed in terms of these breakpoint keys
(`xs`/`sm`/`md`/`lg`/`xl`), so it must land before any screen-level migration task begins.
