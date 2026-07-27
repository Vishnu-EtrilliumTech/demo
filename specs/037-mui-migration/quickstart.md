# Quickstart: Migrating One Screen

This walks through migrating a single Migration Unit end-to-end, using
`src/app/organization/[id]/sites/[siteId]/SiteDetailLegacy.tsx` as a worked example. The same
steps apply to any other in-scope screen.

## Prerequisites (one-time, not per-screen)

1. Theme breakpoints added per [contracts/theme-breakpoints.md](./contracts/theme-breakpoints.md).
2. `MobileNavDrawer` and `ResponsiveTableContainer` added per
   [contracts/responsive-components.md](./contracts/responsive-components.md), if the screen
   needs navigation or table responsiveness.

## Per-screen steps

1. **Capture the baseline**: take a 1440px-viewport screenshot of the current screen (Playwright
   script) — this is the parity reference for step 6.
2. **Identify raw HTML**: grep the file for `<table`, `<button`, `<input`, `<select`, `<form`,
   `<ul`/`<li` and note every occurrence plus any Tailwind classes styling them.
3. **Rebuild with MUI**: replace each raw tag with its MUI equivalent (`Table`/`TableContainer`,
   `Button`, `TextField`/`Select`/`Autocomplete`, `List`/`ListItem`, `Box component="form"`),
   translating the Tailwind classes into `sx` values sourced from
   `src/design-system/styles/tokens.css` so the rendered result is unchanged.
4. **Apply responsive behavior**: wrap tables in `ResponsiveTableContainer`; ensure forms go
   full-width below `sm`; confirm any custom nav usage defers to `MobileNavDrawer` below `md`.
5. **Wire the feature flag**: gate the new implementation behind the existing flag mechanism
   (`src/design-system/flags`) so the legacy file stays reachable until sign-off.
6. **Verify desktop parity**: re-screenshot at 1440px, diff against the step-1 baseline — zero
   perceptible difference required.
7. **Verify mobile behavior**: check 360px, 768px, 1024px, 1440px — no horizontal scroll, no
   clipped content, primary actions reachable.
8. **Update tests**: change any Playwright/RTL selectors tied to legacy tag/class structure to
   role/label/test-id selectors; run the suite.
9. **Run quality gates**: `tsc --noEmit`, `eslint`, `next build` (matches the Husky pre-commit
   hook — do not bypass).
10. **Check off the Definition of Done**: confirm every item in
    [contracts/migration-unit-definition-of-done.md](./contracts/migration-unit-definition-of-done.md).

## Commands

```powershell
npx tsc --noEmit
npx eslint .
npx next build
npx playwright test e2e/<relevant-spec>.spec.ts
npx vitest run <relevant-unit-test>
```
