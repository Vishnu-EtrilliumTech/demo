# Feature Specification: MUI Component & Mobile-First Migration

**Feature Branch**: `037-mui-migration`
**Created**: 2026-07-21
**Status**: Draft
**Input**: User description: "Migrate remaining plain HTML tags across the Lawsome Web UI application to Material UI (MUI) components, and improve overall responsiveness using a mobile-first approach so the entire application is mobile friendly. This is a technical/structural migration only: the existing visual look and feel (colors, spacing, typography, layout appearance) must be preserved exactly as-is — no redesign, only replacing raw HTML elements (div, span, button, input, table, ul/li, etc.) with equivalent MUI components and adding responsive breakpoints/mobile layouts where the app currently is not mobile friendly. This builds on the existing in-progress MUI design-system work already on the 037-mui-migration branch (src/design-system, MUI theme provider, feature flags)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Replace remaining raw HTML with MUI components (Priority: P1)

Across the app (admin dashboards, organization/site management, case workspace, eCourts detail tabs, invoices, auth pages), a sizeable set of screens still render raw HTML tags — tables, buttons, inputs, selects, forms, lists — instead of the MUI components already used on migrated screens. This creates inconsistent focus/hover/keyboard behavior and accessibility semantics between "legacy" and "new" parts of the same app. Rebuilding these screens on MUI components brings every screen to the same interaction baseline.

**Why this priority**: This is the core deliverable. Without it, the app remains a patchwork of legacy raw-HTML screens and MUI screens, which is the exact problem this migration exists to close.

**Independent Test**: Pick any single remaining raw-HTML screen (e.g., a `*Legacy.tsx` screen), rebuild it using MUI components, and verify it has full visual and functional parity with its pre-migration version — independently of any other screen's migration status.

**Acceptance Scenarios**:

1. **Given** a screen currently built with raw HTML tags (table/button/input/ul-li/form), **When** it is migrated, **Then** it renders using the equivalent MUI components (Table, Button, TextField/Select, List, etc.) with identical on-screen appearance and identical data/behavior.
2. **Given** an existing automated test that targets a legacy screen by accessible role, label, or test-id, **When** the screen is migrated to MUI, **Then** the test continues to pass without being rewritten for cosmetic reasons.

---

### User Story 2 - Mobile-first responsive layout (Priority: P2)

Responsive support today is sparse and inconsistent — only a handful of legacy screens use any viewport-aware logic, and there is no shared breakpoint strategy. Screens need a mobile-first layout: styles target the smallest supported viewport by default, then progressively enhance at larger breakpoints, so every screen (navigation, tables, forms, dashboards) is fully usable on a phone.

**Why this priority**: This depends on screens already being rebuilt in MUI (User Story 1), since MUI's breakpoint/`sx`/theme system is the mechanism used to implement responsiveness consistently. Doing this ahead of the component migration would mean solving mobile layout twice.

**Independent Test**: On a single already-migrated screen, verify at 360px, 768px, 1024px, and 1440px viewport widths that the layout adapts appropriately (navigation collapses, tables scroll or stack, forms go full-width) with no horizontal scrolling or clipped content — independently of other screens' responsive status.

**Acceptance Scenarios**:

1. **Given** any screen in the app, **When** viewed on a viewport narrower than 600px, **Then** no element causes horizontal page scrolling and all primary actions remain reachable without zooming.
2. **Given** a data table screen, **When** viewed on a mobile viewport, **Then** the table is horizontally scrollable within its own container or adapts to a stacked/card presentation, while remaining fully readable.
3. **Given** the app's primary navigation (the app shell/sidebar), **When** viewed on mobile, **Then** it collapses into a mobile-appropriate pattern (e.g., drawer) consistent with the collapsible sidebar behavior already introduced on this branch.

---

### User Story 3 - Preserve existing look and feel (Priority: P1)

Because this is a structural migration and not a redesign, every migrated or responsively-adjusted screen must remain visually indistinguishable from its current desktop appearance — same colors, spacing, typography, and layout arrangement — and functionally identical, with the same fields, validations, and data.

**Why this priority**: Equal priority to the component migration itself. The requester explicitly named "look and feel kept untouched" as a hard constraint, not a nice-to-have — a migration that changes desktop visuals fails regardless of code quality.

**Independent Test**: Compare before/after screenshots of a migrated screen at a desktop viewport width; the only acceptable differences are ones required for functional equivalence (e.g., a focus ring appearing on keyboard focus) — no layout, color, spacing, or copy changes.

**Acceptance Scenarios**:

1. **Given** a screen before migration, **When** the same screen is migrated to MUI, **Then** a visual comparison at desktop viewport width shows no perceptible change in color, spacing, typography, or layout.
2. **Given** a form or workflow that existed before migration, **When** used after migration, **Then** all fields, validations, submit behavior, and error messages behave identically.

---

### Edge Cases

- What happens when a legacy screen uses a native HTML control MUI doesn't directly wrap (e.g., a native multi-select or native file input)? The migration must use the closest MUI equivalent (e.g., `Select multiple`, `Autocomplete`, or an MUI-styled file input) while preserving exact behavior.
- How are screens still gated behind the existing feature-flag system handled mid-migration? Flag-gated legacy/new pairs must both keep working until the flag confirms rollout, following the same flag pattern already established on this branch.
- What happens at extreme viewport sizes (very small phones ~320px, very large ultra-wide monitors)? Layout must not break (no clipped or overlapping content) at either extreme, even if not pixel-perfect.
- How are screens that mix Tailwind utility classes and MUI styling reconciled? A migrated screen's visual styling should be expressed through the MUI theme/`sx` rather than left split across two styling systems, without changing the rendered appearance.
- What happens to existing automated tests written against legacy DOM structure or tag selectors? They must be updated to target stable roles/labels/test-ids and must pass after migration.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST replace raw structural/interactive HTML elements (table, ul/li, button, input, select, form, and div/span used as the primary building block of a control) that are not already using MUI components, with the equivalent MUI component, across all in-scope screens (admin dashboard list pages, organization/site legacy screens, eCourts detail tabs, the invoice tab, auth pages, and any further screens identified during implementation as still using raw HTML).
- **FR-002**: Every migrated screen MUST preserve its exact current visual appearance at desktop viewport widths (colors, spacing, typography, iconography, layout arrangement, copy), verified by side-by-side comparison against the pre-migration screen.
- **FR-003**: Every migrated screen MUST preserve 100% of its existing functional behavior (data displayed, available actions, validation rules, navigation, error/success states) with no feature removed or altered.
- **FR-004**: The application MUST apply a mobile-first responsive strategy: base/default styles target the smallest supported viewport, with layouts progressively enhanced at larger breakpoints defined consistently in the shared MUI theme (see FR-012 for the breakpoint mechanism), rather than desktop-first styles retrofitted for mobile.
- **FR-005**: The application MUST remain fully usable on mobile viewports (320–599px wide) with no horizontal page scrolling, no clipped or overlapping content, and all primary actions reachable without pinch-zoom.
- **FR-006**: Primary navigation (the app shell/sidebar) MUST adapt to a mobile-appropriate pattern (e.g., a collapsible drawer) on small viewports, consistent with the collapsible sidebar behavior already introduced on this branch.
- **FR-007**: Data tables MUST remain fully readable and usable on mobile viewports, either via horizontal scroll contained within the table's own wrapper or an adapted stacked/card presentation, without breaking the surrounding page layout.
- **FR-008**: Forms (including auth, case creation/editing, invoices) MUST be fully usable on mobile viewports, with appropriately sized touch targets and full-width inputs where the desktop layout uses multi-column arrangements.
- **FR-009**: The migration MUST NOT introduce a new or parallel styling mechanism; where a screen currently relies on Tailwind utility classes for visual styling, that styling MUST be reproduced through the shared MUI theme or component-level style props so each migrated screen has one coherent styling source.
- **FR-010**: Migrated screens currently gated by the existing feature-flag system MUST continue to respect that flag pattern (the legacy version remains available/rollback-able until the flag confirms the migrated version is safe).
- **FR-011**: Existing automated tests (unit and end-to-end) covering migrated screens MUST be updated as needed to target stable, implementation-independent selectors (roles, labels, test-ids) and MUST pass after migration.
- **FR-012**: The shared MUI theme MUST define explicit responsive breakpoints (the theme currently defines none beyond MUI's defaults) so mobile-first behavior is consistent and centrally controlled across all migrated screens.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of application screens render structural and interactive elements exclusively through MUI (or the shared design-system) components, with zero remaining raw `table`, `button`, `input`, `select`, `form`, or `ul`/`li` tags used as primary UI building blocks outside of MUI's own internal implementation.
- **SC-002**: On every screen, using the app at a 360px-wide viewport requires zero horizontal scrolling and zero pinch-zoom to complete any existing user task.
- **SC-003**: Side-by-side visual comparison of each migrated screen at a 1440px desktop viewport shows no perceptible difference from its pre-migration appearance.
- **SC-004**: 100% of pre-existing automated tests covering migrated screens pass after migration, with no reduction in test coverage.
- **SC-005**: Users can complete the primary task on any screen (e.g., viewing a case, creating a hearing, reviewing an invoice) on a mobile device as completely as they previously could only on desktop, with no task becoming unreachable on mobile.

## Assumptions

- The existing in-progress design-system (`src/design-system`: MUI theme, feature flags, shared components) is the foundation to extend, not replace.
- "Mobile-first" means styling for small viewports as the default and layering enhancements at `sm`/`md`/`lg`/`xl` breakpoints, formalized in the MUI theme rather than left to ad hoc Tailwind breakpoint classes.
- Tailwind CSS remains present in the dependency tree during this migration (full removal is out of scope), but newly migrated screens should not introduce new Tailwind-only styling that duplicates MUI theme capability.
- "Look and feel kept untouched" is the baseline at desktop/tablet widths. No mobile-specific design currently exists, so this migration defines mobile layout using the same design tokens, colors, and typography as desktop — not new branding.
- In scope: screens still built with raw HTML tags today (including but not limited to files named `*Legacy.tsx`) and any other screen identified via code audit during implementation. Out of scope: building new features or screens that don't exist today.
- Rollout continues to follow the feature-flag-per-screen pattern already established on this branch, so each migrated screen can be toggled and rolled back independently.
