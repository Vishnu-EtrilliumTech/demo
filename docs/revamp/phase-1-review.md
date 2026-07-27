# Phase 1 — Foundation: Self-Review

**Status:** Phase 1 complete. **Additive only — no existing screen changed.**
**Awaiting human sign-off before Phase 2** (REVAMP_SPEC §7, §11).

Branch `ui-revamp`. Commits: `57fe005` (foundation). Depends on signed-off Phase 0
([00-discovery.md](./00-discovery.md), [01-functionality-contracts.md](./01-functionality-contracts.md)).

---

## 1. What shipped

A scoped, token-driven design-system foundation under `src/design-system/`, plus a
dev-only workbench. Nothing is wired into a real screen yet (that begins Phase 2).

**Tokens & styling**
- `styles/tokens.css` — every `:root` token ported **verbatim** from
  `design-reference/lawsome-ui.css` (color, radius, shadow, layout, fonts) + a few
  tokenised "ink" companions. Global but inert (variable definitions only).
- `styles/components.css` — the full reference component layer, every selector
  **scoped under `.lui-root`** so the design system cannot affect legacy screens.
- `styles/patterns.css` — shared patterns promoted from page-local mockups (auth
  split layout, step wizard, toggle switch) + new state primitives (spinner,
  skeleton).
- `LuiRoot.tsx` — opt-in scope wrapper; binds **Plus Jakarta Sans + Source Serif 4**
  via `next/font` (self-hosted at build, CSP-safe) and imports the three
  stylesheets.
- `theme/muiTheme.ts` + `theme/LuiThemeProvider.tsx` — MUI theme mirroring the
  tokens, **opt-in per-surface** (not applied globally). Tailwind mirror added under
  a `lui` namespace (`tailwind.config.ts`, additive).

**Feature-flag mechanism** (`flags/`)
- Typed registry `FLAG_DEFAULTS` (all screens, default **off**). Layered resolution
  (default → env allowlist `NEXT_PUBLIC_UI_FLAGS` → client override in localStorage).
- Pure `resolveFlag` + helpers; React `useFeatureFlag` / `FeatureGate` /
  `getFeatureFlag` / `setFlagOverride` (reactive via `useSyncExternalStore`, SSR-safe).

**Component library** (`components/`, flag name → file)
- Primitives: `Button` + `GoogleButton`, `Pill`, `Field`/`Input`/`Textarea`/`Select`/
  `Toggle`, `Spinner`/`LoadingState`/`Skeleton`/`EmptyState`/`ErrorState`.
- Composites: `Card`/`SectionHead`, `StatCard`/`KpiCard`/`Meter`/`LineBar`, `Tabs`,
  `Dialog`, `DataTable`/`Pagination`/`TableFoot`.
- Shells: `AppShell` (grouped navy sidebar + glassy topbar + sheet), `AuthLayout`
  (split), `AiPreviewPanel` (**structurally roadmap-labelled**), `StepWizard` /
  `StepperRail` / `WizardProgress`.
- All data-driven via props; icons via `lucide-react`. Public barrel `index.ts`.

**Workbench** — `src/app/(dev)/workbench` renders every component in its states and
a live feature-flag toggle demo. Returns 404 in production (`NODE_ENV` guard).

---

## 2. Exit criteria / self-review gate (§7)

| Criterion | Status | Evidence |
|---|---|---|
| Tokens match `lawsome-ui.css` exactly (spot-check color/space/type) | ✅ | `tokens.css` copied from the reference `:root`; workbench renders brand `#2b57d6`, serif display, correct spacing (see screenshots) |
| Each shared component renders in the workbench in all its states | ✅ | `/workbench` — buttons (incl. loading/disabled), pills (6 tones), fields (+ error), states (loading/skeleton/empty/error), stat/KPI/meter, tabs, data table + pager, dialog + danger dialog, AI preview, step wizard, app shell, auth layout |
| Components are data-driven (props), not hard-coded to one screen | ✅ | Every component takes props (nav groups, columns/rows, items, steps…); no screen-specific literals |
| Feature-flag mechanism works (toggle a placeholder screen) | ✅ | 11 unit tests; workbench "Feature flags" panel toggles the `dashboard` flag and swaps a legacy↔new placeholder banner live |
| No existing screen visually changed yet (foundation is additive) | ✅ | `git diff HEAD` touches only new dirs + additive `tailwind.config.ts` extend; no legacy `src/app`/`src/components`/`globals.css`/`layout.tsx` modified |
| Lint, typecheck, unit tests, build all pass | ✅ | see §3 |

---

## 3. Verification evidence

```
yarn type-check   → exit 0  (tsc --noEmit)
yarn lint         → exit 0  (No ESLint warnings or errors)
yarn test         → exit 0  (8 files, 73 tests passed — incl. 11 new flag tests)
yarn build        → exit 0  (all routes compiled; /workbench 12.7 kB; next/font fetched)
```

**Workbench screenshots** (dev server, `/workbench`):
- Desktop 1440px — [assets/phase-1-workbench-desktop.png](./assets/phase-1-workbench-desktop.png)
- Mobile 375px — [assets/phase-1-workbench-mobile.png](./assets/phase-1-workbench-mobile.png)

The screenshots confirm: correct fonts/palette; all component states; roadmap-only
"Preview" AI panel; responsive collapse (stat row → 1 col, sidebar → icon rail,
auth dark panel hidden < 860px). The legacy marketing header/footer render around
the scoped workbench with **no style bleed** — proving `.lui-root` isolation.

---

## 4. Functionality parity

N/A for Phase 1 — no screen migrated, so no Phase-0 functionality contract is
touched. The foundation is purely additive; legacy behavior is unchanged. The list
infrastructure identified in Phase 0 (`useListQuery` + `PagedResponse`) will be
wired into the new `DataTable` during screen migration.

---

## 5. Decisions applied (from Phase-0 sign-off)

- Fonts: **Plus Jakarta Sans + Source Serif 4** (Q6).
- Theme: **light only** — single theme, no dark tokens (Q7).
- AI panel is **structurally "Preview / roadmap"** labelled (Q4); live gating
  (`NEXT_PUBLIC_AI_ENABLED_ORG_IDS`) is a screen-migration concern.

## 6. Deviations & notes

- **Scoped global stylesheet vs per-component CSS.** The design system is authored
  as three scoped stylesheets (mirroring the single reference `lawsome-ui.css`)
  rather than one CSS module per component — DRY, faithful, and each file stays
  well under the 800-line limit. Components are thin TSX wrappers emitting the
  documented classes.
- **Icons.** Mockups use Lucide via a global script; the app already ships
  `lucide-react`, so components use it directly (no runtime external script).
- **MUI theme not global.** Applying it globally would restyle legacy MUI screens,
  so it is opt-in via `LuiThemeProvider`.
- **Workbench chrome.** `/workbench` inherits the legacy marketing header/footer
  from `LayoutClient`; harmless for a dev tool and a useful isolation proof.

## 7. Risk / rollback

Fully additive and inert until adopted. To roll back: nothing consumes the design
system in production yet (workbench is 404 in prod), so reverting commit `57fe005`
removes it cleanly with zero impact on existing screens. No feature flag is on by
default.

---

**STOP — human sign-off required before Phase 2** (Shell & auth: App shell, Login,
Register, Onboarding wizard — wiring real Google OAuth and org/branch creation, per
REVAMP_SPEC §8). Reply to authorize.
