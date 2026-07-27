# Lawsome — Design Reference

The approved UI design system and screen mockups for the Lawsome revamp.
**These are the pixel-accurate specification — rebuild each screen in the app's
framework; do not paste this HTML into the product.** Full instructions for
Claude Code are in `REVAMP_SPEC.md`.

## What's here
- `lawsome-ui.css` — the shared design system: all tokens (color, type, spacing,
  radius, shadow) and component patterns. Every screen depends on it.
- `HANDOVER.md` — design decisions + the first-release messaging rules.
- `REVAMP_SPEC.md` — the phased execution plan + kickoff prompt for Claude Code.
- `public/` — logo and image assets referenced by the screens.
- `Design System.html` — living style reference.

## Screens (open any .html in a browser)
Public / auth: `Landing.html`, `Login.html`, `Register.html`, `Onboarding.html`
Core: `Dashboard.html`, `Cases.html`, `Case Workspace - Modern.html`, `Add Case.html`
Practice: `eCourts.html`, `Cause List.html`, `Billing.html`
Admin: `Branches.html`, `Lawyers.html`, `Clients.html`, `Organization.html`

`Case Workspace - Modern.html` is the approved case-detail reference.

## First-release rules (must hold on every surface)
No pricing · AI is roadmap-only (never shown as shipping) · no country references
on public pages · footer legal name "eTrillium Technologies LLP" · Google-only auth.

## How to use
1. Drop this whole folder into the app repo as `design-reference/`.
2. Give Claude Code the kickoff prompt in `REVAMP_SPEC.md` §15.
3. Proceed phase by phase, signing off each phase review before the next.
