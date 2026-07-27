# Lawsome — Design System & Build Handover

Context brief for continuing the Lawsome ERP UI in the agreed
**modern-elegant, enterprise-grade** design language. Point any new session at
this file first.

**Status: first-release UI is BUILT.** All the originally-scoped screens exist
and are cross-linked. What remains is polish + a few deeper auth/CRUD flows
(see §7). Read §6 for the current state of every screen and §9 for open items.

---

## 1. What this project is

Lawsome is an **ERP SaaS for law firms** — manage the organization, its
branches, lawyers, clients and **cases** (tasks, documents, hearings,
contributors, billing), with **eCourts** integration. An **AI** capability
(case summarization, alerts, next-action suggestions, doc Q&A) exists in the
product vision but is **NOT part of the first release** — see §2.1.

Source of truth for product scope: GitHub `eTrillium/Lawsome.Web.UI`
(Next.js + MUI). Docs there — `Lawsome_PRD.md`, `Case.md`, `ecourtsUI.md`,
`Sitesnavbar.md`, `user.md`, `Dashboard_changes.md` — describe real data models
and flows. Use them for content realism (CNR, court names, IAs, parties,
advocates).

## 2. Design direction (decided)

We moved **off** the bound "Industry" blueprint design system to a **custom
modern-elegant** direction: soft white cards, gentle shadows, rounded corners,
a refined navy + action-blue palette, an editorial serif for display text.
Reference implementation: **`Case Workspace - Modern.html`** (finished, approved).

> Because we intentionally left the Industry system, screens trigger a
> design-system adherence warning (it names `Billing.html` but applies to all).
> **This is expected — ignore it.**

### 2.1 First-release messaging decisions (IMPORTANT)
This is a **first-time market release**, reflected on public/marketing surfaces:
- **AI is NOT shipping in v1.** Do not present AI as an available feature on
  public pages. On the landing page it lives only in an **"On the roadmap —
  coming soon"** section. The Login/marketing copy that used to mention "AI
  briefs" has been removed.
- **No pricing yet.** Pricing section was removed from the landing page (revisit
  after beta trials). CTAs are early-access oriented: "Get early access",
  "Sign in", "Book a demo".
- **No customer testimonials** (no customers yet). The Login brand panel uses
  product highlights instead of a fake quote.
- **Remove "India" / "Indian"** from public copy (e.g. "eCourts", not "eCourts
  India"). It's understood implicitly.
- Company legal name in footers: **eTrillium Technologies LLP**.
- **Auth is Google-only in v1.** Sign in and registration are both "Continue with
  Google" — there is no email/password, phone-OTP or SSO in the first release.
  Because Google verifies the email, the onboarding wizard has **no separate
  email-verification/OTP step**. (Password reset is therefore N/A and the old
  `Forgot Password.html` was removed.)

### Principles
- Premium = restraint + structure + whitespace, not decoration.
- One accent (action-blue) used sparingly; status uses soft semantic tints.
- Minimal data slop — every stat/element earns its place.
- Desktop-first, responsive to tablet. Icons: **Lucide**, stroke-width **1.75**.

## 3. Design tokens (live in `lawsome-ui.css` — do not redeclare per screen)

```css
:root {
  --bg: #f5f6f8; --panel: #ffffff;
  --sidebar: #131a2b; --sidebar-2: #1b2338;
  --border: #e9ebef; --border-strong: #dfe3e9; --divider: #eef0f3;
  --text: #161a20; --text-2: #5a6472; --text-3: #8c95a3;
  --brand: #2b57d6; --brand-strong: #1f45b3; --brand-ink: #1c2f66;
  --brand-soft: #eef2fe; --navy: #1d2740;
  --ok: #0e8a5f; --ok-soft: #e6f5ee;
  --warn: #b06f16; --warn-soft: #fbf1df;
  --danger: #c0362c; --danger-soft: #fbeae8;
  --r-lg: 14px; --r: 11px; --r-sm: 8px;      /* pills: 999px */
  --sh-sm/-sh/-sh-lg …;
  --sans: 'Plus Jakarta Sans', system-ui, sans-serif;
  --serif: 'Source Serif 4', Georgia, serif;
}
```
Fonts `@import`ed inside the CSS. Base body 14px / lh 1.5 / antialiased.

## 4. Component patterns

Defined in `lawsome-ui.css` (extracted from the approved workspace). Covers: app
shell (navy grouped sidebar + glassy topbar with ⌘K search & bell), buttons,
pills/status, cards + `.sec-head`, tables `.tbl`, tabs `.tab`/`.panel`, KPI
strip, avatars `.av1–.av5`, timeline `.tl`, key-value `.kv`, banners,
discussion thread, and the **CRUD additions** added this build:
`.page-head`, `.toolbar` (search + `.selectbox` + `.viewtoggle`), entity cards
`.grid-cards`/`.ecard`, `.empty` state, `.tbl-foot`/`.pager` pagination,
dialogs `.dialog-backdrop`/`.dialog` (+ `.form-2col`, `.btn-danger`), dashboard
`.stat-row`/`.statcard`, `.meter` bars, `.linebar`.

> AI-related components (`.ai-card`, `.alert`, `.suggest`, `.ask`) still exist in
> the CSS and on the internal Case Workspace / eCourts screens. Those are
> internal app screens, not public pages — leaving AI there is fine for now, but
> if we demo the app pre-launch consider gating them. (Open item, §9.)

## 5. Shared stylesheet — every screen links it

In `<head>`:
```html
<link rel="icon" href="public/favicon.png" />
<link rel="stylesheet" href="lawsome-ui.css" />
<script src="https://unpkg.com/lucide@0.544.0/dist/umd/lucide.js"></script>
```
End of body: `lucide.createIcons({ attrs: { 'stroke-width': 1.75 } });`

App-shell screens: `.app > .sidebar + .main(.topbar + .scroll > .sheet)`.
Flowing pages (landing/login/register): plain scrolling, own `<style>` for
page-specific layout. **Retune the product by editing `lawsome-ui.css`.**

## 6. Screens — CURRENT STATE (all built)

Public / auth:
- **`Landing.html`** ✅ — first-release marketing. Sticky nav, animated hero,
  features, eCourts value prop, workspace value prop, benefit band, roadmap
  (AI "coming soon"), early-access CTA, footer. **No pricing, no AI-as-shipping,
  no "India".** "Get early access" now routes to `Register.html` (not the app).
  See §8 for landing specifics.
- **`Login.html`** ✅ — split panel (white logo on navy + product highlights) +
  **Continue with Google** (Google-only auth). Links to Register.
- **`Register.html`** ✅ — **Sign up with Google** → the onboarding wizard. Org
  details are collected in onboarding, not on this page.
- **`Onboarding.html`** ✅ — full create-organization wizard: 4 steps
  (Organization → First branch → Invite team → All set) with a branded rail +
  live stepper. Starts from a Google-verified account, ends in the Dashboard.

App (inside navy shell):
- **`Dashboard.html`** ✅ — firm hero band, 4 stat cards, cases-by-status meter,
  recent activity table, upcoming hearings list, branch rollup.
- **`Cases.html`** ✅ — table ⇄ card view toggle, filters, pagination, Add-Case
  modal. Rows link to the Case Workspace.
- **`Case Workspace - Modern.html`** ✅ — APPROVED reference case-detail screen.
  Tabs: Overview · Tasks · Documents · Hearings · References · Clients ·
  Billing · Comments · eCourts. **Design ruling (Q5, tab parity with the live
  app):** the live app's extra tabs are preserved, not dropped — References,
  Clients (client profile, contacts, and the client's other matters,
  deep-linking to `Clients.html`) and Billing (per-matter invoices,
  deep-linking to `Billing.html`) are their own tabs; Contributors is absorbed
  into the **Overview** tab (party block + Contributors team grid). Phase 0 must
  still confirm what each live tab actually does and adjust if any holds richer
  functionality than assumed.
- **`Add Case.html`** ✅ — full-page create/edit case form in the app shell
  (details, court & eCourts, parties, assignment). Supports `?mode=edit`.
  Cases.html "Add Case" opens this; the modal remains as "Quick add".
- **`Branches.html`** ✅ — grid ⇄ table, add/edit modal, delete-confirm.
- **`Lawyers.html`** ✅ — table, invite + edit modals, delete-confirm, roles.
- **`Clients.html`** ✅ — entity-card grid, add/edit modal, delete-confirm.
- **`Organization.html`** ✅ — org profile, practice segments, preference
  toggles, plan card, edit modal.
- **`eCourts.html`** ✅ — 6-tab live court-record + analysis (Case Info, AI
  Summary, Legal Analysis, Arguments, Insights, Judgment).
- **`Cause List.html`** ✅ — day-grouped hearing monitor.
- **`Billing.html`** ✅ — revenue stats, collection progress, invoices table.

All app sidebars are identical and cross-link every screen. Sidebar nav groups:
Firm (Dashboard, Cases, Branches, Lawyers, Clients) / Practice (eCourts, Cause
List, Billing) / Settings (Organization).

## 7. Brand logo & assets (in `public/`)

Real brand logo pulled from the repo. It's the **LAWSOME wordmark** with a
multicolor magnifying-glass "O".
- **`logo-navy.png`** — navy wordmark, high-res. Use on **light** surfaces
  (landing nav + footer).
- **`logo-white.png`** — white wordmark (326×65, highest-res). Use **directly**
  on **dark** surfaces (app sidebars, login/register brand panel, hero preview
  mock). No white chip needed.
- **`logo-mark.png`** — square crop of just the magnifying-glass mark, for the
  collapsed sidebar rail (≤900px) on a small white chip.
- **`favicon.png`** — 64px mark, linked in every `<head>`.
- `logo.png` (original low-res navy) and `footerLogo.png` are also present but
  superseded by `logo-navy.png` — prefer the high-res ones.

Sidebar brand markup (all app screens): `.brand > .logo-chip img(logo-white)` +
`.logo-mini img(logo-mark)`; `.logo-chip` styles live in `lawsome-ui.css`.

## 8. Landing page specifics

- **Two-column hero**: copy/CTA left, an **animated product mock** right — a
  browser-framed dashboard that **loops through scenes** (Dashboard → Cases →
  case Overview/Tasks/Documents tabs → eCourts) with crossfades; sidebar
  highlight + floating cards follow. Driven by a `setInterval` over a `frames[]`
  array in the page's inline script. Pauses to a static view for
  `prefers-reduced-motion`.
- **Scales-of-justice watermark** behind the hero text panel (`.htext .justice`):
  a faint (~8% opacity) inline SVG built from the **Lucide "scale" icon
  structure** (matches the app icon). Split into a fixed group (post + base) and
  a swinging `.jbeam` group (curved beam + two triangular pans) that **swings on
  the pivot and settles** on load (`@keyframes jSwing`, pivot
  `transform-origin: 12px 5px`, `transform-box: view-box`). Fades in via
  `jFade`. Reduced-motion → static.
- **Nav tabs are in-page anchors, not separate pages**: Features `#features`,
  eCourts `#ecourts`, Workspace `#workspace`, Roadmap `#roadmap` — they scroll to
  landing sections. (This answers the "what are these tabs for" question.)
- Buttons that used to deep-link into internal app screens ("See/Open a case
  workspace", "Explore eCourts details") were **removed** — a pre-signup visitor
  shouldn't be dropped into internal UI.
- `Landing v1.html` is the archived pre-rework version.

## 9. Open items / not yet done

The original pipeline gaps are now **closed**: full org-onboarding
(`Onboarding.html`), a full-page Add/Edit Case (`Add Case.html`), and the
early-access CTA now routes to `Register.html`. Auth is Google-only, so the old
forgot-password / OTP / SSO gaps no longer apply.

Residual / lower-priority:
- **AI on internal screens**: eCourts.html and Case Workspace still show AI
  panels — now clearly marked as a **"Preview — roadmap, not part of the first
  release"** so a pre-launch demo is honest. Decide later whether to fully hide
  them for GA. (Public pages already handle this.)
- **Google OAuth is mocked** — the "Continue with Google" buttons navigate
  straight through (Login → Dashboard, Register → Onboarding → Dashboard); no
  real OAuth backend / consent screen yet.
- **"Get early access" → `Register.html`** — real account provisioning still
  needs a backend.

## 10. Working agreements
- Preserve prior versions on big revisions (`… v2.html` / `… v1.html`).
- Realistic Indian legal placeholder data (firm: "Sharma & Associates";
  branches Delhi HQ/Mumbai/Pune/Bengaluru; sample matter: "Mehra Textiles v.
  SBI").
- Ask before inventing new content/sections. Register finished screens as assets.
- Keep replies concise.

## 11. File index
- `lawsome-ui.css` — shared design system. Edit tokens/components HERE.
- `Design System.html` — live style-guide / component reference.
- Public: `Landing.html`, `Landing v1.html` (archive), `Login.html`,
  `Register.html`, `Onboarding.html` (create-org wizard).
- App: `Dashboard.html`, `Cases.html`, `Case Workspace - Modern.html`,
  `Add Case.html`, `Branches.html`, `Lawyers.html`, `Clients.html`,
  `Organization.html`, `eCourts.html`, `Cause List.html`, `Billing.html`.
- Archives/explorations: `Case Workspace.html` (old Industry version),
  `Case KPI Strip - Options.html`.
- `public/` — logo & favicon assets (§7).
- `HANDOVER.md` — this file.
