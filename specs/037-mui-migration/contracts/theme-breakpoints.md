# Contract: MUI Theme Breakpoints

**Owner**: `src/design-system/theme/muiTheme.ts`
**Consumers**: every migrated screen/component using `sx` responsive syntax, `useMediaQuery`, or
`Grid`/`Stack` responsive props.

## Contract

The theme MUST export breakpoint values matching MUI's stock scale:

```ts
breakpoints: {
  values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 }
}
```

- `xs` (0–599px): mobile — single-column layouts, drawer nav, full-width forms/inputs.
- `sm` (600–899px): large phone / small tablet — same as `xs` unless a screen specifically needs
  more room (documented per Migration Unit in `tasks.md`).
- `md` (900–1199px): tablet / small desktop — navigation switches from drawer to the existing
  persistent (collapsible) sidebar; multi-column layouts may reappear.
- `lg` / `xl` (1200px+): desktop — current, unchanged visual baseline (Constitution + spec.md
  FR-002 desktop-parity requirement applies at this tier and above).

## Rules for consumers

1. Author styles mobile-first: unqualified `sx` values are the `xs` baseline; use `sx={{ '&': {...}, [theme.breakpoints.up('md')]: {...} }}` (or the shorthand object form) to layer up, never down.
2. Do not introduce a new breakpoint value locally (e.g., a one-off `900.5px` media query) — if an
   existing tier doesn't fit, that's a signal to revisit this contract, not to bypass it.
3. `useMediaQuery(theme.breakpoints.down('sm'))` (or equivalent) is the sanctioned way to branch
   rendering (e.g., swap `MobileNavDrawer` for the persistent sidebar), not raw `window.innerWidth`
   checks.

## Verification

- Unit test: a snapshot/assertion test confirming `muiTheme.breakpoints.values` matches the table
  above (regression guard against accidental edits).
- Manual: resize to 599px and 600px at a boundary screen and confirm the expected pattern switch
  occurs exactly at the documented value.
