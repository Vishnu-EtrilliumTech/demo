# Lawsome UI Revamp — Phase 0: Discovery & Mapping

**Status:** Phase 0 complete. **No source/UI behavior changed** — output is docs +
reference assets only. **Awaiting human sign-off before Phase 1** (REVAMP_SPEC §6).

**Branch:** `ui-revamp`, cut from latest `main` (`bdd6e2a`, == `origin/main`).

**Contents:** §1 method · §2 baseline verification · §3 stack summary · §4 design
reference · §5 architecture findings · §6 mapping table · §7 gaps & discrepancies ·
§8 **open questions (need your decision)** · §9 Phase 0 self-review gate ·
§10 recommended Phase 1 scope.

> Detailed per-screen functionality contracts live in
> [01-functionality-contracts.md](./01-functionality-contracts.md) (split out only
> to respect the repo's 800-line-per-file limit). §6 below maps each screen; §7/§8
> flag everything that needs a decision.

---

## 1. Method

Discovery was performed read-only across the whole codebase and the approved
design set. The current app builds, lints, type-checks and tests **green** (§2).
Every route under `src/app/**/page.tsx` was inventoried and its behavior contract
recorded (§01). The design reference (`design-reference/`: 17 HTML mockups,
`lawsome-ui.css`, `HANDOVER.md`, `public/` assets) was read for tokens, component
patterns, screen semantics, and first-release messaging rules.

---

## 2. Baseline verification (entry criteria — all green)

`node_modules` was absent; installed via `yarn install --frozen-lockfile` (exit 0;
gitignored — not a source change). Then:

| Check | Command | Result |
|---|---|---|
| Type-check | `yarn type-check` (`tsc --noEmit`) | ✅ pass |
| Lint | `yarn lint` (`next lint`) | ✅ pass |
| Unit tests | `yarn test` (`vitest run`) | ✅ pass |
| Production build | `yarn build` (`next build`) | ✅ pass (all ~35 routes compiled) |

Runtime: Node v25.2.1, yarn 1.22.22. **Working tree touches only** `REVAMP_SPEC.md`,
`design-reference/`, and `docs/revamp/` (verified `git status` + `git diff HEAD`).

---

## 3. Stack summary

| Concern | Finding |
|---|---|
| **Framework / router** | Next.js `15.5` **App Router**, React 19, TypeScript 5.9, Turbopack dev. `src/app/**` with nested dynamic segments. |
| **UI / styling** | **MUI 6** (`@mui/material` + icons + x-date-pickers) with Emotion **and** styled-components engine; **Tailwind 3** (minimal config; `darkMode:'class'`; only `--background`/`--foreground` tokens); per-component CSS Modules in places. Icons: `@mui/icons-material` (app) — mockups use Lucide. |
| **State** | **Redux Toolkit** + **redux-persist** (localStorage). Slices: `profile`, `legalExpert`, `client`, `ecourtsSearch` (monthly search-quota counter). URL is source of truth for list state via `useListQuery`. |
| **Data layer** | `axios`. Shared `apiClient` (`services/httpServices.ts`, `NEXT_PUBLIC_API_BASE_URL`, Bearer + 401→`/`). **But** org/admin services use **raw axios** (manual Bearer, no 401 handling). Services: `organization/services/{api,caseapi,ecourtapi}.ts` (~150 fns), `admin-dashboard/services/api.ts`, `services/clientServices`. Envelope: `PagedResponse<T>`; triple `.data` unwrap; id-field normalization. Error classifier `classifyListError`. |
| **Auth** | **Google OAuth already wired** (`@react-oauth/google`, `GoogleOAuthProvider`, `GoogleSilentRefresh` One-Tap). Backend JWT in `localStorage['lawsome_token']`. Exchange `POST /api/auth/google`; org signup `POST /api/auth/register-organization`. **Legacy phone-OTP path exists for legal-expert registration only.** |
| **RBAC** | Rich: `useUserRole` (org/site role booleans + permission flags), `useCaseAccess`/`computeCaseAccess` (per-case access ladder mirroring backend; hidden-not-disabled controls). |
| **Reusable layer** | Org shell (`OrgSidebar`/`OrgHeader`/`HeaderSearch`), list infra (`useListQuery` + `SortableColumnHeader` + `ListFooterPager` + `filters/*`), `StatusChip`, `PageHeaderCard`, `AddressAutocomplete`, `DeleteConfirmationModal`/`ConfirmationDialog`, `shared/{EmptyState,LoadingState,ConfirmDialog}`, charts (recharts). 19 feature modals. **No shared Button.** |
| **Feature flags** | **None.** Only AI gate = `NEXT_PUBLIC_AI_ENABLED_ORG_IDS` allow-list (inline in 2 components). Phase 1 must build the flag mechanism. |
| **Testing** | vitest (7 unit/component tests), Playwright (4 e2e, self-skip without `E2E_*` env). `@testing-library/*`. |
| **CI / hooks** | **No CI workflow** (only a GitHub issue template). Husky `pre-commit` present but commented out. `pre-commit` script = type-check + lint + build. |
| **Env vars** | `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_API_KEY`, `NEXT_PUBLIC_AI_ENABLED_ORG_IDS`, `NEXT_PUBLIC_SHOW_VERSION`, `NEXT_PUBLIC_TEMP_TASK_TOKEN`. **No `.env.example` in repo.** |

---

## 4. Design reference (committed to `design-reference/`)

**Tokens** (`lawsome-ui.css`, single light theme — **no dark mode**):
- Fonts: **`Plus Jakarta Sans`** (UI) + **`Source Serif 4`** (display), Google-Fonts
  `@import`. Body 14px/1.5. Lucide icons, stroke-width 1.75.
- Color: `--bg #f5f6f8`, `--panel #fff`, `--sidebar #131a2b`/`--sidebar-2 #1b2338`,
  `--border #e9ebef`/`--border-strong #dfe3e9`/`--divider #eef0f3`, text
  `#161a20`/`#5a6472`/`#8c95a3`, brand `#2b57d6`/`--brand-strong #1f45b3`/
  `--brand-ink #1c2f66`/`--brand-soft #eef2fe`, `--navy #1d2740`, ok `#0e8a5f`/soft
  `#e6f5ee`, warn `#b06f16`/soft `#fbf1df`, danger `#c0362c`/soft `#fbeae8`; AI/violet
  accent `#6338b8` on `#efe9fb`.
- Radius `--r-lg 14 / --r 11 / --r-sm 8` (buttons 10px, pills 999px). Shadows
  `--sh-sm/--sh/--sh-lg`. Layout `--sidebar-w 244` (→68 ≤900px), `--rail-w 350`,
  `--topbar-h 64`, `--pad 30`, `.sheet` max 1600. Focus ring 2px brand.

**Component patterns** (`HANDOVER §3-4`, `Design System.html`): app shell (navy
grouped sidebar + glassy topbar w/ ⌘K + bell), buttons (`.btn-primary/-secondary/
-ghost/-danger/.icon-btn/.btn-google`), pills (`.pill-brand/-ok/-warn/-danger/
-neutral/-line`), cards + `.sec-head`, tables `.tbl` (`.who2`, `.av1–.av5`),
tabs `.tab/.panel`, KPI `.stat-row/.statcard` + `.meter/.linebar`, entity cards
`.grid-cards/.ecard`, toolbar `.toolbar` (search + `.selectbox` + `.viewtoggle`),
dialogs `.dialog-backdrop/.dialog` (+ `.form-2col`), `.empty`, `.tbl-foot/.pager`,
timeline `.tl`, `.kv`, banners, discussion thread, AI panels (`.ai-card/.alert/
.suggest/.ask` + `.soon "Preview"` badge), step wizard (Onboarding), `.toggle`.

**First-release messaging rules** (`HANDOVER §2.1`, authoritative):
- **No pricing** anywhere.
- **AI is roadmap-only** — labeled `.soon` **"Preview"** + note *"AI case
  intelligence is a roadmap preview — not part of the first release."* + verify
  disclaimer. **Not wired to a model** for v1.
- **Remove "India"/"Indian" from PUBLIC copy only** (e.g. "eCourts" not "eCourts
  India"). Internal ERP keeps eCourts/CNR/₹ domain data — it genuinely serves
  Indian courts. → see [Q3](#q3).
- Footer legal name: **"eTrillium Technologies LLP"**.
- **Google-only auth**; no email/password, phone-OTP, or SSO; onboarding has no
  separate OTP step.

**Approved reference screens:** Landing, Login, Register, Onboarding, Dashboard,
Cases, **Case Workspace – Modern** (approved case-detail ref), Add Case, Branches,
Lawyers, Clients, Organization, eCourts, Cause List, Billing, Design System.
Archived/do-not-build: `Landing v1`, `Case Workspace` (old Industry), `Case KPI
Strip – Options`.

---

## 5. Key architecture findings

1. **Two distinct product surfaces coexist in one app:**
   - **ERP** (`/organization/**`, role `organizationuser`) — firm practice
     management: org → **sites (branches)** → cases (tasks/docs/hearings/comments/
     invoices/contributors) + eCourts. **This is what every mockup depicts.**
   - **Marketplace/directory** (`/`, `/home`, `/search`, public `/profile`,
     `/register` for `client`+`legalexpert`, `/register/otp`, `/admin-dashboard/*`,
     appointments/ratings/fees, ₹) — a lawyer/CA directory. **No mockup covers it**,
     and several of its routes are already broken (`/dashboard`, `/appointments`,
     `/view-profile`, `/complete-profile` all 404; `payment-list`/`deactivate-popup`
     are demos). → **[Q1](#q1) is the single biggest scope decision.**
2. **ERP IA is deeply nested**, but the mockups present a **flat "one-firm" nav**
   (Firm: Dashboard/Cases/Branches/Lawyers/Clients · Practice: eCourts/Cause List/
   Billing · Settings: Organization). Mapping the flat nav onto
   `/organization/[id]/sites/[siteId]/...` needs an explicit convention. →
   [Q2](#q2).
3. **Domain vocabulary differs:** mockup "Branches" = app **sites**; "Lawyers &
   Staff" = app **users**; "Cases" register is the org cases page in org/site mode.
4. **List surfaces are already uniform** (`useListQuery` + server paging/sort/filter
   + `PagedResponse`) — a strong base for a shared DataTable in Phase 1.
5. **No feature-flag system** exists — Phase 1 must add per-screen flags.
6. **AI is actually wired to the backend** (`fetchCaseSummary`,
   `sendCaseChatMessage`, and the eCourts `aiAnalysis` payload) and shown live for
   allow-listed orgs. Spec says keep AI **roadmap-only, not wired to a model**. →
   [Q4](#q4).
7. **Case workspace has more tabs than the mockup** (References, Clients, Invoice,
   Contributors beyond the mockup's Overview/Tasks/Documents/Hearings/Comments/
   eCourts). Per §3.4 these must be **preserved**. → [Q5](#q5).
8. **Design font mismatch:** REVAMP_SPEC §7 names *Fraunces + Inter*; the actual
   `lawsome-ui.css` uses *Plus Jakarta Sans + Source Serif 4*. → [Q6](#q6).
9. **Single light theme only** — no dark-mode tokens exist. → [Q7](#q7).
10. **No dedicated Login page today** (login lives in the global `Header`); the
    mockup implies a standalone Login route. **Onboarding wizard does not exist**
    (current org signup is a 2-step form in `/register` that creates the org only —
    no first branch, no team invites). Both are approved new flows (spec §5).

---

## 6. Mapping table — existing screen/route → target mockup

Legend: **surface** E=ERP, M=Marketplace. **Flag** = needs decision (see §7/§8).

| Mockup (target) | Existing route(s) / component | Shared components needed | Key data deps | Surface | Risks / flags |
|---|---|---|---|---|---|
| **Landing** | `/` → `/home` (`home/page.tsx`) | Marketing shell, nav, hero, feature/roadmap cards, footer | none (static) | M | Rebuild vs current marketing page; scrub India + AI→roadmap; footer legal name. [Q1] |
| **Login** | *(none — login is in global `Header`)* | Auth split layout, `.btn-google` | `POST /api/auth/google` | M/E | **New route**; wire real Google OAuth; remove marketplace role branching? [Q1][Q8] |
| **Register** | `/register` (org branch) | Auth split layout, `.btn-google` | `register-organization` | E | Mockup = "Sign up with Google → Onboarding"; current = 2-step manual form. Remove client/legalexpert/OTP? [Q1] |
| **Onboarding** (4-step wizard) | *(none)* | Step wizard, form fields, Google card, invite rows | `registerOrganization`, `createSite`, invites (**invite endpoint TBD**) | E | **New build** (spec §5): org + first branch + team invites. Invite API unknown. [Q8][Q9] |
| **Dashboard** | `/organization/[id]` | App shell, `PageHeaderCard`, `.stat-row`/statcards, `.meter`, `.tbl`, list card, charts | `fetchOrganization`, `…Users/Sites/Hearings/Cases` | E | Mockup omits org-picker + nested IA; keep restricted-access + onboarding states. [Q2] |
| **Cases** (register, table⇄card) | `/organization/[id]/cases` (+ site mode) | DataTable, toolbar, filters, pager, card grid, `AddCaseModal`, StatusChip | `fetchOrganizationCases`/`fetchSiteCases`, users, sites | E | Add **card view** (app is table-only); OrgClerk empty; preserve org/site mode + `?siteId`. |
| **Add Case** (full page) | `AddCaseModal` (primary) + `/cases/new` (⚠ legacy) | Form cards, field primitives, CNR field | `createCase`, `fetchSiteUsers` | E | Mockup wants full page + quick-add modal; reconcile 3 shapes (modal/legacy/edit) into one. |
| **Case Workspace – Modern** | `/organization/[id]/sites/[siteId]/cases/[caseId]` | Case header, KPI strip, tabs, timeline, `.kv`, AI rail (Preview), all tab tables | `useCase*` hooks, `caseapi`, `ecourtapi` | E | App has **extra tabs** (References/Clients/Invoice/Contributors) — preserve. AI rail = Preview only. [Q4][Q5] |
| **Branches** (grid⇄table + modals) | `/organization/[id]/sites` + `SiteManagementTab` | `.grid-cards/.ecard`, DataTable, toolbar, dialogs | `fetchOrganizationSites`, `createSite`/`updateSite`/`deleteSite` | E | "Branches" = **sites**; preserve siteKey availability, address autocomplete, delete gating. |
| **Lawyers** (table + invite/edit) | `/organization/[id]/users` + `UserManagementTab` | DataTable, role pills, invite/edit modals, delete-confirm | `fetchOrganizationUsers`/`fetchSiteUsers`, `createUser`/`updateUser`/delete | E | "Lawyers" = **users**; preserve full per-user RBAC matrix + dual org/site mode + full-page + modal surfaces. |
| **Clients** (card grid + modals) | `ClientsTab` (case-scoped) + `client-list` (admin, M) + `clientSlice` | `.grid-cards/.ecard`, dialogs | `caseapi` case-clients OR admin `fetchClients` | E/M | **Ambiguous target**: mockup "Clients" = firm-wide directory; app has case-scoped clients + a marketplace client list. [Q10] |
| **Organization** (settings) | `/organization/[id]` detail + `EditOrganizationModal` | `.card`, `.kv`, `.toggle`/settings list, plan card | `fetchOrganization`, `updateOrganization` | E | Plan card shows tier/quota **no prices** (ok). Preference toggles (eCourts sync, AI analysis) — AI toggle vs roadmap rule. [Q4] |
| **eCourts** (6-tab record + AI) | `EcourtDetailsView` (via case tab, `/ecourt/[cnr]`, `/ecourts` hub) | Tabs, `.kv`, tables, download, AI tabs (Preview), confidence bars | `ecourtapi` (search/quota/CNR/persisted) | E | AI tabs = Preview only; preserve search + quota + saved/history + link/reference flows. [Q4] |
| **Cause List** (day-grouped) | `/organization/[id]/hearings` + `/sites/[siteId]/hearings` | Stat cards, toolbar, day-grouped list, StatusChip | `fetchOrganizationHearings`/`fetchSiteHearings` | E | Two divergent hearings pages (MUI vs raw table) to unify; add day grouping; `canViewHearings`. |
| **Billing** (invoices table) | `InvoiceTab` (case-scoped) | Stat cards, `.linebar`, DataTable, status pills | `caseapi` invoices | E | Mockup = firm-wide billing; app billing is **case-scoped only** (no firm-wide invoices route). [Q11] |
| **Design System** | *(none — new component workbench in Phase 1)* | all primitives | — | — | Phase 1 builds the workbench (Storybook or equiv). |

**Existing routes with NO mockup** (need disposition — [Q1]): `/about-us`,
`/support`, `/pricing`, `/search`, `/profile` (public expert profile),
`/register/otp`, `/success`, `/profile-complete`, `/admin-dashboard/*`, and the
broken `/dashboard`, `/appointments`, `/view-profile`, `/complete-profile`.

---

## 7. Gaps & discrepancies (recorded for human decision)

**Functionality in the app but absent from mockups (must preserve per §3.4):**
- Case workspace **References, Clients, Invoice, Contributors** tabs + contributor
  access management + auto-grant-on-assign.
- Full **per-user RBAC matrix** and **case-access ladder** (hidden-not-disabled).
- **Dual org/site modes** on Cases and Users; site user **personal dashboard**.
- **eCourts hub** (search-by-CNR/case/advocate/judge/party, monthly **quota**,
  saved cases, search history, link/reference/remarks) + standalone CNR viewer.
- **siteKey** immutability + availability check; **orgKey** availability.
- Google Places **address autocomplete**; `CoachMark` onboarding tours.
- Restricted-access dialogs (OrgClerk), onboarding empty-states.

**In mockups but not in the app (new build):**
- **Onboarding wizard** (org + first branch + team invites) — spec §5.
- **Standalone Login page** and card **view for Cases**; **day-grouped Cause List**;
  **firm-wide Billing** and **firm-wide Clients directory** (app has case-scoped).
- Landing **roadmap (AI coming-soon)** section; product-highlight Login panel.

**Behavioral / data inconsistencies noted (not to "fix" in Phase 0):**
- Case creation has **3 shapes** (modal without `status`, legacy full-page with
  `status`, edit page) with differing CNR/caseNumber caps.
- Invoice status **filter labels** (Pending/Paid/Overdue/Cancelled) ≠ enum
  (None/Pending/Failed/Paid).
- Document & reference-case **delete without confirm** (other deletes confirm).
- Org services bypass the shared `apiClient` **401 interceptor**.
- `status`/`clientId`/date-range filters declared but **no UI**.
- Marketplace `/search` hardcoded to **India** (`country:in`); registration
  hardcoded to **`@gmail.com`**.

---

## 8. Open questions — need your decision before Phase 1

These touch scope, data shapes, auth, and business logic, so per REVAMP_SPEC §3.10
I am stopping to ask rather than guessing.

### Resolved (sign-off review, 2026-07-12)

- **Q1 → Reframe public, keep rest as-is.** New Landing/Login/Register funnel only
  into the ERP; leave the marketplace/directory routes untouched this cycle
  (revisit at the end).
- **Q2 → Keep the existing nav map & flow; restyle UI only.** The current
  `OrgSidebar` is already a flat, role-filtered, org-scoped nav (Dashboard/Cases/
  eCourts/Users/Sites[/My Site], role-dependent Dashboard href; `/auth` dispatcher
  resolves org+role+siteId post-login). Keep routing/flow/role-filtering exactly;
  apply the new visual design (Firm/Practice/Settings grouping is cosmetic; labels
  Branches=Sites, Lawyers=Users). Mockup's extra top items (Cause List, Clients,
  Billing) are added only as those screens are built. **Settings residual →
  resolved:** the sidebar's Settings item is already rendered **disabled by
  design** (no `/organization/[id]/settings` route) and **stays disabled for v1**.
  The Organization settings screen (`Organization.html`) is **deferred**; org
  profile edits remain on the dashboard via a restyled `EditOrganizationModal`.
- **Q3 → Public-only scrub.** Strip India/Indian wording from Landing/Login/
  Register only; ERP keeps eCourts/CNR/₹; marketplace `/search` `country:in` and
  `@gmail.com`-only registration stay as-is.
- **Q4 → Keep allow-list live.** Orgs in `NEXT_PUBLIC_AI_ENABLED_ORG_IDS` keep live
  AI; every other org sees the labeled **"Preview — roadmap"** panels. (AI panels
  remain internal-only; public pages stay AI-free.)
- **Q5 → Preserve all case tabs; follow the updated mockup.** `design-reference/`
  was refreshed: **Case Workspace – Modern** now has **9 tabs** — **Overview ·
  Tasks · Documents · Hearings · References · Clients · Billing · Comments ·
  eCourts** — with **Contributors + Parties absorbed into the Overview tab** (party
  block + team grid). References, **Clients** (client profile/contacts + the
  client's other matters, deep-linking to `Clients.html`), and Billing (per-matter
  invoices) are each their own tab. Clients-placement residual is **resolved**
  (Clients is a full tab). The Billing/Clients "View in Billing"/"Client profile"
  links target the firm-wide Billing/Clients screens, which are **deferred (Q10,
  Q11)** — those links can no-op or route to the case-scoped view until built.
- **Q6 → Plus Jakarta Sans + Source Serif 4** (the approved `lawsome-ui.css`);
  REVAMP_SPEC §7's Fraunces/Inter is superseded.
- **Q7 → Light theme only** for v1.
- **Q8 → OAuth endpoints stable; build against them.** Wire the new Login/Register/
  Onboarding to the existing `POST /api/auth/google`, silent refresh, and
  `POST /api/auth/register-organization`.
- **Q9 → Skip team invites in v1.** The onboarding wizard creates **org + first
  branch only** (no invite step); the "Invite team" step is deferred to a later
  phase (no invite endpoint exists yet).
- **Q10 → Defer the firm-wide Clients screen.** Keep clients **case-scoped**
  (case workspace Clients tab / `caseapi`); do not build a firm-wide Clients
  directory in this cycle.
- **Q11 → Defer Billing to a later phase.** Keep the per-matter invoices (case
  Billing tab / existing `InvoiceTab`); do **not** build the firm-wide Billing
  screen in this cycle. Razorpay stays out of the v1 UI.

**All Phase-0 open questions (Q1–Q11) are now resolved.** Consequent v1 scope
adjustments: Onboarding = org + first branch (no invites); no firm-wide Billing or
Clients screens; nav/flow unchanged (restyle only); AI allow-list-live else
Preview; light theme; Plus Jakarta Sans + Source Serif 4.

<a id="q1"></a>**Q1 — Marketplace surface scope (biggest).** The mockups cover the
**ERP only**. What happens to the marketplace/directory surface (`/home`, `/search`,
public `/profile`, client/legalexpert `/register` + `/register/otp`,
`/admin-dashboard/*`, appointments/ratings/fees, and the broken `/dashboard`,
`/appointments`, `/view-profile`)?
 (a) **Out of scope** — leave legacy untouched, revamp ERP only;
 (b) **Remove** it (it's partly broken already) and make Lawsome ERP-only;
 (c) **Reframe** — new Landing/Login/Register funnel only into the ERP; hide/retire
 marketplace. *My recommendation: (c) for public pages + (a) for the rest this
 cycle, revisited at the end.*

<a id="q2"></a>**Q2 — Flat nav vs nested IA.** The mockups assume a single-firm flat
nav. Confirm the intended mapping: does the new sidebar operate within a resolved
`/organization/[id]` context (org auto-selected post-login), with "Branches" listing
sites and screens deep-linking into `/sites/[siteId]/...` under the hood? Any need
to keep an org-switcher?

<a id="q3"></a>**Q3 — "No country references" scope.** Confirm the HANDOVER reading:
strip "India/Indian" wording from **public pages only** (Landing/Login/Register),
while the **internal ERP keeps eCourts/CNR/₹/Indian court data** (it is genuinely an
India product). Should `/search`'s `country:in` and `@gmail.com`-only registration
stay as-is (marketplace) or change?

<a id="q4"></a>**Q4 — AI: live-gated vs forced-preview.** AI is currently **wired to
real endpoints** (`fetchCaseSummary`, `sendCaseChatMessage`, eCourts `aiAnalysis`)
and shown live for orgs in `NEXT_PUBLIC_AI_ENABLED_ORG_IDS`. Spec says keep AI
**roadmap-only, not wired to a model**. For v1 do we (a) **fully disable** live AI and
render only the labeled "Preview" panels, or (b) keep the allow-list live-gated but
relabel "Preview" for non-allow-listed orgs? Also: the Organization "AI case
analysis" **toggle** — keep, or gate as Preview?

<a id="q5"></a>**Q5 — Extra case-workspace tabs.** Confirm we **preserve** References,
Clients, Invoice, and Contributors tabs (mockup omits them) and simply restyle them
into the new tab system — not drop them.

<a id="q6"></a>**Q6 — Fonts.** REVAMP_SPEC §7 says *Fraunces + Inter*; the approved
`lawsome-ui.css` uses *Plus Jakarta Sans + Source Serif 4*. The CSS is the
pixel-accurate source of truth. **Proceed with Plus Jakarta Sans + Source Serif 4**
(matching the mockups), treating the spec's font names as superseded — confirm?

<a id="q7"></a>**Q7 — Theme.** The design ships a **single light theme** (no dark
tokens). Build **light-only** for v1 (my recommendation), or invest in a dark theme
too? (My global rules prefer both themes, but the approved design is light-only.)

<a id="q8"></a>**Q8 — Google OAuth reality.** Auth is already wired client-side
(`/api/auth/google`, silent refresh). For the new Login/Register/Onboarding, confirm
the backend endpoints are stable and that **`register-organization`** is the correct
provisioning call (the mockup's flow: Register → Google → Onboarding → creates org).

<a id="q9"></a>**Q9 — Onboarding data shapes.** The 4-step wizard must create org +
**first branch** + send **team invites**. `createSite` exists, but I found **no team
-invite endpoint** in the services. What is the invite API (or is invite = `createUser`
with an email trigger)? Which fields are required for the org/branch steps (the
mockup shows Bar Council reg / GSTIN / firm-size — keep, or trim to what the backend
accepts)? Current org signup collects segments limited to `['Legal','Insurance']`.

<a id="q10"></a>**Q10 — "Clients" target.** The mockup "Clients" is a firm-wide
directory. The app has **case-scoped** clients (`caseapi`) and a separate marketplace
`client-list`. Is there a firm-wide client entity/endpoint to build against, or does
"Clients" aggregate case clients across the firm?

<a id="q11"></a>**Q11 — "Billing" target.** The mockup "Billing" is firm-wide
invoices. The app has **case-scoped** invoices only (`InvoiceTab`). Is there a
firm-wide billing/invoices endpoint, or should Billing aggregate case invoices?
(Note: **Razorpay** is a dependency — confirm it stays out of v1 UI given the
no-pricing rule.)

---

## 9. Phase 0 exit criteria / self-review gate (§6)

| Exit criterion | Status | Evidence |
|---|---|---|
| Stack & conventions documented; can build, run, lint, test | ✅ | §2, §3; all four checks green |
| `design-reference/` committed and complete | ✅ (on commit) | 17 mockups + `lawsome-ui.css` + `HANDOVER.md` + `public/` present; committed in this phase |
| Every existing screen has a functionality contract | ✅ | [01-functionality-contracts.md](./01-functionality-contracts.md) covers all ~35 routes + shared layer |
| Mapping table complete; all gaps/discrepancies flagged | ✅ | §6 table; §7 gaps; §8 open questions |
| No source behavior changed (diff = docs + reference only) | ✅ | `git status`/`git diff HEAD`: only `REVAMP_SPEC.md`, `design-reference/`, `docs/revamp/`; `node_modules`/`.next` gitignored |

**Verification:** app still builds/lints/type-checks/tests green after discovery;
no `src/**` file modified. **STOP — human sign-off required before Phase 1.**

---

## 10. Recommended Phase 1 scope (for reference only — not started)

Once Q1–Q11 are answered, Phase 1 (Foundation, spec §7) should:
1. Port `lawsome-ui.css` tokens into the app theme (CSS variables + MUI theme +
   Tailwind config), load Plus Jakarta Sans + Source Serif 4, adopt Lucide (or map
   to MUI icons) — single source of truth, no hard-coded values.
2. Scaffold the shared component library from the existing reusable layer (§3):
   promote `OrgSidebar`/`OrgHeader` → App shell, `useListQuery` stack → **DataTable**,
   plus Button, Tag/Badge (`StatusChip`), form fields, Dialog, Tabs, KPI/stat cards,
   AI-preview panel, step wizard, and empty/loading/error primitives
   (`shared/*` already exist).
3. Stand up a **component workbench** (Storybook or equivalent).
4. Build the **feature-flag mechanism** (per-screen rollout) — none exists today.
5. Keep it **additive** — no existing screen visually changed yet.

Each subsequent phase migrates screens per the §9/§10 per-screen loop, behind flags,
with a self-review report at every boundary.
