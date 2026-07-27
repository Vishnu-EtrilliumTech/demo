# Implementation Plan: MUI Component & Mobile-First Migration

**Branch**: `037-mui-migration` | **Date**: 2026-07-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/037-mui-migration/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Finish migrating the ~40 remaining screens still built on raw HTML tags (admin dashboard list
pages, organization/site `*Legacy.tsx` screens, eCourts detail tabs, the invoice tab, and auth
pages) onto the MUI component set already established on this branch (`src/design-system`), and
layer in a mobile-first responsive strategy (explicit MUI theme breakpoints, a mobile nav
pattern, responsive table handling) — all while keeping desktop visual output pixel-identical.
Approach: extend the existing MUI theme with breakpoints, add a small set of shared
responsive-pattern components (mobile nav drawer wrapper, responsive table wrapper) to
`src/design-system/components`, then migrate screens one at a time behind the existing
feature-flag mechanism, verifying visual parity and running the full quality-gate suite per
screen.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode), Next.js 15 (App Router), React 19
**Primary Dependencies**: MUI 6 (target component library), Tailwind CSS 3 (coexists, not
removed), Redux Toolkit 2, Keycloak.js 26, Axios 1
**Storage**: N/A — frontend-only change; consumes the existing ASP.NET Core API unchanged
**Testing**: Playwright (E2E), Vitest + React Testing Library (unit, `vitest.setup.ts` already
configured), manual/visual side-by-side comparison for desktop-parity verification (no automated
visual-regression tool currently in the repo — see research.md)
**Target Platform**: Web browser, responsive from 320px (mobile) through ultra-wide desktop
**Project Type**: Web application — single Next.js frontend project (this repo has no backend
code; Lawsome's ASP.NET Core API is a separate repository)
**Performance Goals**: No regression to the existing Lighthouse performance floor of 70
(Constitution Principle X); mobile interaction (nav, table scroll) must feel native, not janky
**Constraints**: Zero perceptible desktop visual change (Constitution-adjacent hard requirement
from the spec); zero horizontal scroll on any screen at ≥320px; migrated screens must stay
flag-gated and independently rollback-able; no new competing styling system introduced
**Scale/Scope**: ~233 `.tsx` files under `src/`; a code audit during `/speckit-tasks` confirmed
**20 verified live files** still using raw HTML as primary structure (most initially-suspected
`*Legacy.tsx` files turned out to be rollback-only fallbacks already superseded by a live
`*New.tsx` MUI sibling) — see `tasks.md` Scope Note for the definitive list

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applicability | Status |
|---|---|---|
| I. Type Safety First | All migrated code stays TypeScript strict; no `any` introduced | PASS (no new risk) |
| II. Security by Default | No `dangerouslySetInnerHTML`, no new dynamic script/HTML introduced by this migration | PASS |
| III. Test Coverage | FR-011 requires existing Playwright/RTL tests to be updated to role/label/test-id selectors and pass post-migration. The constitution scopes mandatory RTL coverage to `src/components/`; this feature's new shared components live in `src/design-system/components/` instead (the pre-existing shared-component library this branch already established before this feature). Treating it as the constitution's intended shared-component location — and giving it RTL coverage anyway (T007, T009) — satisfies the principle's intent; no formal constitution amendment is being made here | PASS — enforced via tasks |
| VI. Component Architecture | This feature directly implements the mandate that "MUI 6 is the primary component library"; shared responsive patterns go in the shared design-system layer, not ad hoc per screen | PASS — this is the principle's own backlog |
| VII. Pre-commit Quality Gates | `tsc --noEmit`, `eslint`, `next build` must stay green per migrated screen/commit | PASS — enforced via tasks, no bypass planned |
| X. Performance & Query Standards | `next/image` for any raw `<img>` found during migration; `next/dynamic` for heavy deps if newly touched; `React.memo`/`useCallback` on migrated list/table screens | PASS — folded into FR-001/FR-007 migration work |
| XIV. Specification Governance | `spec.md` → `plan.md` → `tasks.md` sequence is being followed; `/speckit-analyze` will run after `tasks.md` before implementation starts | PASS — in progress |

No violations requiring justification. Complexity Tracking section is not needed.

**Post-Phase-1 re-check**: Design artifacts (research.md, data-model.md, contracts/,
quickstart.md) originally proposed two new shared components (`MobileNavDrawer`,
`ResponsiveTableContainer`); implementation discovered both already exist and are already used by
every migrated screen (`AppShell`'s CSS-driven drawer; `DataTable`'s `.card:has(table.tbl)` scroll
behavior) — see research.md Decisions 2 and 3 (revised). No new components were built. Net
changes: one theme config addition (`muiTheme.ts` breakpoints) and six new feature-flag keys.
No new external dependencies, no new data storage, no new API surface. Gate status unchanged:
PASS on all rows above — if anything, risk is lower than originally planned since fewer new
components mean less new surface area to get wrong.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── app/                          # Next.js App Router routes — most in-scope screens live here
│   ├── admin-dashboard/          # raw-HTML list pages in scope (appointment-list, client-list, legal-experts, payment-list)
│   ├── organization/[id]/sites/[siteId]/   # *Legacy.tsx screens in scope (hearings, tasks, cases, site detail)
│   ├── organization/components/EcourtDetailsView/  # tab components in scope (CaseInfoTab, LegalAnalysisTab, ArgumentsTab, InsightsTab)
│   ├── login/, register/, register/otp/   # auth pages in scope
├── components/                   # shared, cross-route UI (~60 files) — some still raw HTML, in scope where reused
├── design-system/                # the MUI-based shared library this migration extends
│   ├── theme/muiTheme.ts         # add breakpoints here (currently MUI defaults only)
│   ├── theme/LuiThemeProvider.tsx
│   ├── components/               # add new shared responsive patterns here (mobile nav drawer, responsive table wrapper)
│   ├── flags/                    # existing feature-flag mechanism; migrated screens continue to use this
│   └── styles/                   # tokens.css / patterns.css — source of truth for colors/spacing to preserve
├── hooks/, services/, utils/     # unchanged; consumed by migrated screens as-is
e2e/                              # Playwright specs — updated per FR-011 for migrated screens
vitest.setup.ts                   # unit test setup — already configured
tailwind.config.ts                # stays present; not the target of new styling during this migration
```

**Structure Decision**: Single Next.js frontend project (Option 1 equivalent — no
frontend/backend split exists in this repo). Work is scoped entirely within the existing
`src/app/**` route tree and `src/components/`, extending the existing `src/design-system/`
shared library rather than introducing a new structure or new top-level directories.

## Complexity Tracking

*Not applicable — Constitution Check has no violations to justify (see above).*
