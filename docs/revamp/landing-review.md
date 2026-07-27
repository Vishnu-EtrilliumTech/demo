# Landing page — Self-Review

**Branch:** `ui-revamp` · **Flag:** `landing` (default **off**) · Status: ✅ **signed off (2026-07-15)**

Built ahead of the legacy-removal pass at the reviewer's request. Landing was never
in any earlier phase's build scope (spec §8 Phase 2 named only Login/Register/
Onboarding), so this closes that gap.

## 1. What shipped (flag → files)

- **New `landing` flag** in `FLAG_DEFAULTS` (default off).
- `src/app/page.tsx` (root `/`) gates → `LandingNew` (DS) when on, legacy
  `HomePage` (marketplace) when off.
- `src/app/LandingNew.tsx` — DS marketing page rebuilt from `design-reference/
  Landing.html`: sticky nav, hero (badge + serif headline + CTA + trust row +
  static product preview + floating cards), 6-feature grid, eCourts split,
  workspace split, dark benefit band, roadmap section, final CTA, footer.
- `src/app/landing.css` — scoped page styles (`.lui-root .lp-*`), token-driven;
  composes DS `.btn`/`.pill`/`.eyebrow`/`.chip-mono`/`.kv`. Imported by the
  component only (not on other DS surfaces).
- `src/components/LayoutClient.tsx` — root `/` is treated as self-chrome when the
  `landing` flag is on (same rule as org routes), so the global marketplace
  Header/Footer no longer wraps the DS Landing. Flag off → unchanged.

Wrapped in `<LuiRoot>`. CTAs funnel to the real auth surfaces: "Get early access" →
`/register?role=organizationuser`, "Sign in" → `/login`.

## 2. First-release messaging (§4)

- **No pricing** — the legacy global "Pricing" nav no longer renders on `/` (it was
  bleeding in from `LayoutClient` before the fix); the DS Landing has none. ✅
- **AI roadmap-only** — the roadmap section frames AI as "coming… after our first
  release" with **"Preview"** tags on each chip. ✅
- **No country wording** — no "India/Indian" text; demo court softened to "High
  Court"; eCourts/CNR kept (product domain). ✅
- **Footer** — "© 2026 eTrillium Technologies LLP". ✅
- **Google-only funnel** — CTAs point at the existing register/login (Google) flows;
  no email/password/OTP. ✅

## 3. Parity / states (§10)

- Visual match to `Landing.html` (layout/type/sections/preview). ✅
- Built from tokens + scoped classes; no ad-hoc palette. ✅
- Responsive (nav collapses, grids reflow, preview sidebar hides) at the mockup's
  breakpoints. ✅
- Motion is compositor-friendly (`transform`/`opacity`) and gated behind
  `prefers-reduced-motion: no-preference`; the scene auto-cycler was dropped in
  favor of a static preview (no timers). ✅
- Behind the `landing` flag; **off restores the legacy marketplace home exactly**
  (global Header/Footer return). ✅
- No console errors. ✅

## 4. Deviations & open questions

1. **Static hero preview.** The mockup cycles the dashboard preview through 4 scenes
   on a timer; the DS build renders a single static dashboard scene (+ floating
   cards). Decorative only — no functional loss, and it avoids client timers /
   reduced-motion issues. Flag if you want the cycler.
2. **Footer legal links** (Privacy/Terms/Security) are placeholder `#` anchors, as in
   the mockup — wire to real pages when they exist.
3. **Nav anchor links** (`#features`/`#ecourts`/…) scroll within the page.

## 5. Verification evidence

```
yarn type-check → exit 0
yarn lint       → exit 0
yarn test       → exit 0 (73 passed; flags test covers the new key)
yarn build      → exit 0
```

**Live** (dev on 5173, `landing` flag on, public — no token needed):
- Hero — [assets/phase-landing-hero.png](./assets/phase-landing-hero.png)
- Full page — [assets/phase-landing-full.png](./assets/phase-landing-full.png)
- Flag-off fallback (legacy marketplace home) —
  [assets/phase-landing-legacy-fallback.png](./assets/phase-landing-legacy-fallback.png)

## 6. Risk / rollback

`landing` defaults **off** → `/` still serves the legacy marketplace home; nothing
changes until the flag is enabled. Rollback = revert this commit (root gate +
LayoutClient guard + flag + LandingNew/landing.css).

---

**STOP — sign-off.** Landing now joins the **legacy-removal pass** scope: DS the
reused Add/Edit modals, delete `*Legacy` (incl. the marketplace `HomePage` path once
Landing is on for good), default verified flags on, then PR `ui-revamp` → `main`.
