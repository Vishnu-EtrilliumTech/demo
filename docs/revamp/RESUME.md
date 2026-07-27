# Lawsome UI Revamp — Resume Handbook

**Read this first when resuming in a new session.** It is the single source of
current state, decisions, conventions, and next steps for the UI revamp. Full
detail lives in the other `docs/revamp/` files (linked below); this is the map.

Last updated after: **Phase 2 (Shell & Auth) delivered + live-verified against the
local backend, awaiting sign-off.** Branch: **`ui-revamp`** · tip commit at time of
writing: **`aefe333`**.

> **Seeded demo data (dev DB):** org **"Revamp Legal LLP"**, id
> `7697e231-17ad-432e-ae39-0110a4648b2a` (Head Office branch + 5 cases), created for
> Phase-2 verification. Use it to browse the new shell (§3), or delete it if unwanted.

---

## 0. TL;DR — where we are

- **Phase 0 (Discovery)** ✅ signed off. **Phase 1 (Foundation)** ✅ signed off.
  **Phase 2 (Shell & Auth)** ✅ **signed off (2026-07-12)**.
- **Phase 3 (Core workflow)** ✅ **signed off (2026-07-13)**: Dashboard
  (`dashboard`), Cases (`cases`), Add/Edit Case (`cases`), Case Workspace
  (`case-workspace`) — all DS incl. tab bodies + modals. Screenshots in
  `docs/revamp/assets/phase-3-*`.
- **Phase 4 (Practice)** ✅ **signed off (2026-07-15)**: **eCourts only**
  behind `ecourts` (hub Search/Saved/History, standalone CNR viewer, DS'd
  `EcourtDetailsView`, workspace eCourts tab). **Cause List deferred** (spike found
  no external feed — it maps to internal Hearings) and **firm Billing skipped**
  (Q11) — both flags stay reserved. Review: `phase-4-review.md`; screenshots
  `docs/revamp/assets/phase-4-*`.
- **Phase 5 (Admin & settings)** ✅ **signed off (2026-07-15)**: **Branches**
  (`branches`) + **Lawyers/Users** (`lawyers`) on DS, legacy fallback. Clients +
  Organization **kept deferred** (Q10 / Settings). Review: `phase-5-review.md`;
  screenshots `docs/revamp/assets/phase-5-*`.
- **Landing** ✅ **signed off (2026-07-15)** (built ahead of the legacy pass at the
  user's request): **`landing` flag** added; root `/` gates → `LandingNew` (DS)
  / legacy `HomePage`. `LayoutClient` suppresses the global marketplace Header/Footer
  on `/` when the flag is on. Full mockup hero animations (justice watermark,
  4-scene preview cycler, floating cards) + navy logo. First-release rules honored.
  Review: `landing-review.md`; screenshots `docs/revamp/assets/phase-landing-*`.
- Everything is **additive and behind feature flags that default OFF**. The app
  ships legacy behavior until a flag is turned on. Nothing new is live yet.
- **Governing doc:** [`REVAMP_SPEC.md`](../../REVAMP_SPEC.md) (repo root). Follow it
  exactly: incremental screen-by-screen migration, preserve 100% functionality,
  build from the shared token+component layer, feature-flag each screen, phase
  gates are hard stops requiring human sign-off.

---

## 1. Mission & operating rules (from REVAMP_SPEC)

Replace the Lawsome **ERP** UI with the approved design, screen by screen, in the
live codebase, **without changing what the app does**. Rules that bind every step:

1. Work on `ui-revamp` (off `main`). Never commit to `main`. Small, labeled commits.
2. No big-bang. One screen/slice at a time; app builds & runs at every commit.
3. **Feature-flag every migrated screen**; legacy stays until the replacement is
   verified and flagged on; toggling off restores legacy cleanly.
4. **Preserve behavior.** Never delete a feature to match a mockup; adapt it and
   flag any discrepancy for human decision.
5. **Tokens → components → screens.** No ad-hoc styling.
6. **Phase gates are hard stops.** Produce the self-review (`phase-N-review.md`),
   run all verifications, **pause for sign-off** before the next phase.
7. **First-release messaging rules** hold on every surface (see §4).
8. When blocked/ambiguous (data shapes, auth, business logic) — **stop and ask**.

---

## 2. Locked decisions (Phase-0 sign-off — do not re-litigate)

Recorded in [`00-discovery.md`](./00-discovery.md) §8. All 11 questions + 2 residuals
resolved:

- **Q1 Marketplace:** reframe the public pages (Landing/Login/Register) into the
  ERP funnel; leave the legacy marketplace routes (`/home`, `/search`, public
  `/profile`, `/admin-dashboard/*`, client/legalexpert reg, appointments) as-is
  this cycle.
- **Q2 Nav:** keep the existing OrgSidebar nav map + flow + role-filtering; restyle
  UI only.
- **Q3 India scrub:** public pages only; the ERP keeps eCourts/CNR/₹; marketplace
  `country:in` / `@gmail.com` stay.
- **Q4 AI:** keep `NEXT_PUBLIC_AI_ENABLED_ORG_IDS` orgs live; everyone else sees the
  "Preview — roadmap" panels; public pages stay AI-free.
- **Q5 Case tabs:** preserve all; follow the refreshed mockup — **9 tabs**:
  Overview · Tasks · Documents · Hearings · References · Clients · Billing ·
  Comments · eCourts. Contributors + Parties fold into Overview.
- **Q6 Fonts:** **Plus Jakarta Sans** (UI) + **Source Serif 4** (display). (Spec
  §7's Fraunces/Inter is superseded.)
- **Q7 Theme:** **light only** for v1 (no dark tokens).
- **Q8 OAuth:** endpoints stable — build against `/api/auth/google` +
  `/api/auth/register-organization`.
- **Q9 Onboarding:** create org + **first branch only**; **skip team invites in v1**.
- **Q10 Clients:** defer the firm-wide Clients screen; keep case-scoped.
- **Q11 Billing:** defer the firm-wide Billing screen; keep per-matter invoices;
  Razorpay out of the v1 UI.
- **Settings nav:** stays **disabled** in v1; Organization settings screen deferred;
  org edits remain on the dashboard modal.

---

## 3. Stack & environment

- **Next.js 15 App Router**, React 19, TypeScript 5.9, Turbopack dev.
- **MUI 6** (+ Emotion + styled-components) and **Tailwind 3** and per-component
  CSS. Icons: app uses `lucide-react` (design system uses it too); legacy uses
  `@mui/icons-material`.
- **Redux Toolkit + redux-persist** (localStorage). **axios** data layer.
- **Auth:** Google OAuth (`@react-oauth/google`), backend JWT in
  `localStorage['lawsome_token']`. 401 → `clearToken` + redirect `/`.
- **RBAC:** `src/hooks/useUserRole.ts` (role booleans/permissions),
  `src/hooks/useCaseAccess.ts` (per-case access ladder; controls hidden-not-disabled).
- **Lists:** `src/hooks/useListQuery.ts` + `PagedResponse<T>` (`src/types/pagination.ts`)
  + `SortableColumnHeader` + `ListFooterPager` + `src/components/filters/*`. **Reuse
  these when migrating list screens** (feed the DS `DataTable`).
- **Env vars:** `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`,
  `NEXT_PUBLIC_GOOGLE_API_KEY`, `NEXT_PUBLIC_AI_ENABLED_ORG_IDS`,
  `NEXT_PUBLIC_SHOW_VERSION`, `NEXT_PUBLIC_TEMP_TASK_TOKEN`, and the revamp flag
  var `NEXT_PUBLIC_UI_FLAGS` (see §5). **No `.env.example` in repo.**
- **Setup from clean checkout:** `yarn install --frozen-lockfile` (node_modules is
  gitignored and may be absent). Node 25 works. Google Fonts must be reachable at
  build time (next/font self-hosts them).

### Commands (verification gate — run before every commit/phase sign-off)
```
yarn type-check   # tsc --noEmit
yarn lint         # next lint
yarn test         # vitest run  (currently 73 passing)
yarn build        # next build  (must be green)
```
Dev server for screenshots: `PORT=<p> NEXT_PUBLIC_UI_FLAGS=<keys> yarn dev`, then
Chrome-devtools MCP `navigate_page` + `take_screenshot`. Kill it when done.
There is **no CI workflow** and husky pre-commit is commented out.

### Local backend (available)

The backend runs in local Docker: **`lawsome-api-1` on `http://localhost:8080`**
(Postgres `lawsome-db-1` on `:5433`; DB name `LawSome.Dev.Data`). Swagger at
`/swagger`, health at `/health`. To run the frontend against it:

```
PORT=3000 \
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 \
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<dev client id from backend appsettings.Development.json> \
NEXT_PUBLIC_UI_FLAGS=shell,login,onboarding,register \
yarn dev
```

- **Use port 3000** — the backend CORS allowlist (`FrontEndUrls`) is
  `http://localhost:3000` (also 5173). Other ports get CORS-blocked.
- **Auth without live Google:** the API exposes a **dev test-login**
  `POST /api/auth/aat` (header `X-AAT-Secret: <AATSecret from backend
  appsettings>`, body `{email, fullName, phone, userType, roles[]}` where
  `userType`/roles are RBAC names e.g. `OrganizationAdmin`). It returns a JWT.
  Seed data by minting an OrganizationAdmin token, then `POST /api/v1/organizations`
  (authenticated create; admin = caller identity), `createSite`, and cases. Set the
  JWT in the browser as `localStorage['lawsome_token']` to load authenticated
  screens. **Secrets (AAT secret, DB password, Google secret) live in the backend
  container's `appsettings*.json` — never copy them into this repo.**
- **Phase 2 shell + all Phase 3 screens verified live** this way (real org/branch/
  cases, real JWT). Still to click through with a real Google account: the actual
  Google consent exchange and the onboarding submit.

**Live-verify gotchas (learned in Phase 3 — save time next session):**
- Run dev on **5173 OR 3000** (both in the backend CORS allowlist). Prefer 5173 to
  leave 3000 free. Pass `NEXT_PUBLIC_GOOGLE_CLIENT_ID=placeholder.apps.googleusercontent.com`
  (dashboard/cases auth via JWT, not Google) — the `GSI_LOGGER … FedCM … token`
  console error from this placeholder is **benign**.
- Auth: mint a JWT via `POST /api/auth/aat` (needs `X-AAT-Secret` — the AAT read
  is allowed via the `Bash(docker exec lawsome-api-1:*)` rule in
  `.claude/settings.local.json`), then set `localStorage['lawsome_token']` on the
  dev origin. **The backend container clock runs ~2 days behind**, so AAT tokens
  expire fast → re-mint on a 401 (`fetchCurrentUser` / `/users/me`). The app's
  `GoogleSilentRefresh` handles this automatically with real Google auth.
- **Do NOT run `yarn build` while the dev server is up** — the prod build clobbers
  the dev server's `.next` and it 500s. Run build separately, then restart dev.
- DB (read-only, for ids/verification): `docker exec lawsome-db-1 psql -U
  dbmasteruser -d "LawSome.Dev.Data" -c "…"`.
- **Seeded demo case for populated tables:** **Iyer v. Metro Realty**
  (`a7ce6890-3666-4909-b5b0-2bad6648480b`, site `6b907ef3-…`) has 3 tasks / 2
  hearings / 2 clients / 2 comments / 1 invoice (documents endpoint payload shape
  unresolved → 0). Sub-resource POSTs use the same JWT; tasks/hearings **require**
  an `assignedToId` (use org admin `0ededb13-0a88-44ba-b652-967087082161`, since no
  site users exist yet).

---

## 4. First-release messaging rules (every surface)

- **No pricing** anywhere.
- **AI is roadmap-only**, labelled **"Preview"** with the note *"AI case
  intelligence is a roadmap preview — not part of the first release."* The DS
  `AiPreviewPanel` makes this structural. Public pages carry no AI.
- **No "India"/"Indian"** wording on public pages (say "eCourts", not "eCourts
  India"). Internal ERP keeps eCourts/CNR/₹ domain data.
- Footer legal name: **"eTrillium Technologies LLP"**.
- **Google-only auth** on new surfaces (no email/password/OTP/SSO).

---

## 5. The feature-flag system (how to gate screens)

Code: `src/design-system/flags/`. Public API via `@/design-system`.

- **Flag keys** (`FLAG_DEFAULTS`, all default `false`): `shell`, `login`,
  `register`, `onboarding`, `dashboard`, `cases`, `case-workspace`, `branches`,
  `lawyers`, `clients`, `organization`, `ecourts`, `cause-list`, `billing`,
  `workbench`.
- **Resolution order:** default (off) → env allowlist `NEXT_PUBLIC_UI_FLAGS`
  (comma list of enabled keys, or `*` for all) → client override in
  `localStorage['lawsome_ui_flags']`.
- **Use in code:** `const on = useFeatureFlag('cases')` (reactive client hook);
  `<FeatureGate flag="cases" fallback={<Legacy/>}>{<New/>}</FeatureGate>`;
  `getFeatureFlag(key)` (one-shot); `setFlagOverride(key, true|false|null)` (dev/QA
  toggle, used by the workbench).
- **Migration pattern (established in Phase 2):** in the screen's page/layout,
  `if (useFeatureFlag('<key>')) return <NewScreen/>; return <LegacyScreen/>;`.
  Flag off ⇒ legacy path unchanged.
- **To preview new screens:** run dev with `NEXT_PUBLIC_UI_FLAGS=shell,cases,...`
  or open `/workbench` and toggle flags there.

---

## 6. The design system (how to build screens)

Location: `src/design-system/`. Import from `@/design-system`.

- **Scope:** wrap any new surface in `<LuiRoot>`. Everything inside `.lui-root`
  gets the tokens/fonts/component CSS; **nothing leaks to legacy screens**.
- **Tokens:** `styles/tokens.css` (ported verbatim from
  `design-reference/lawsome-ui.css`). `styles/components.css` +
  `styles/patterns.css` are the scoped component styles. Also mirrored into an
  opt-in MUI theme (`theme/muiTheme.ts`, `LuiThemeProvider`) and Tailwind (`lui`
  namespace). **Never hard-code hex/px/font — use tokens.**
- **Fonts:** Plus Jakarta Sans + Source Serif 4 via `next/font`, bound on `LuiRoot`.
- **Components** (all data-driven, props): `Button`/`GoogleButton`, `Pill`,
  `Field`/`Input`/`Textarea`/`Select`/`Toggle`, `Spinner`/`LoadingState`/
  `Skeleton`/`EmptyState`/`ErrorState`, `Card`/`SectionHead`, `StatCard`/`KpiCard`/
  `Meter`/`LineBar`, `Tabs`, `Dialog`, `DataTable`/`Pagination`/`TableFoot`,
  `AppShell` (props: `brand`, `navGroups`, `user`, `crumbs`, `topbarLead`,
  `topbarActions`, `sheet`), `AuthLayout`, `AiPreviewPanel` (always "Preview"),
  `StepWizard`/`StepperRail`/`WizardProgress`.
- **Reference:** `/workbench` (dev-only, 404 in prod) renders every component in
  its states. The reference mockups + CSS live in `design-reference/`
  (`lawsome-ui.css`, `HANDOVER.md`, 17 HTML mockups) — the pixel-accurate spec.
  **Do NOT paste mockup HTML; rebuild with the DS components.**

---

## 7. Phase status & artifacts

| Phase | Status | Key commits | Review doc |
|---|---|---|---|
| 0 Discovery & mapping | ✅ signed off | `e613583`…`5f30c77` | [00-discovery.md](./00-discovery.md), [01-functionality-contracts.md](./01-functionality-contracts.md) |
| 1 Foundation (tokens, components, flags, workbench) | ✅ signed off | `57fe005`, `f8db84b` | [phase-1-review.md](./phase-1-review.md) |
| 2 Shell & auth | ✅ **signed off (2026-07-12)** | `44d8dc1`, `01cb483`, `4b44ce3`, `aefe333` | [phase-2-review.md](./phase-2-review.md) |
| 3 Core workflow | ✅ **signed off (2026-07-13)** | `1f27409` `825faa5` `7bd4709` `bd69b21` `064d02c` `ea8ce20` `5542763` (+ fixes `96c6f9e` `36e571e` `af7f13b` `85c0b3a` `9e570b1`) | [phase-3-review.md](./phase-3-review.md) |
| 4 Practice (eCourts; Cause List deferred, Billing skipped) | ✅ **signed off (2026-07-15)** | `bf99ed0` `3ffce81` `343105f` | [phase-4-review.md](./phase-4-review.md) |
| 5 Admin & settings (Branches + Lawyers; Clients/Organization deferred) | ✅ **signed off (2026-07-15)** | `193d0d3` `588f9b5` | [phase-5-review.md](./phase-5-review.md) |
| Landing (built ahead; gates root `/`) | ✅ **signed off (2026-07-15)** | `735470a` `4b07892` `1694c93` `051193a` `73945d1` | [landing-review.md](./landing-review.md) |
| — Legacy-removal pass — **in progress** (3 modals DS'd; blocked on unmigrated screens) | 🔨 in progress | `3de2437` `32665ad` `40b44bd` | see §11 |

### What Phase 2 delivered (flag → files)
- `shell` → `src/components/org/OrgAppShell.tsx`; gated in
  `src/app/organization/[id]/layout.tsx`. Mirrors OrgSidebar role-nav + OrgHeader
  user menu; reuses `HeaderSearch`.
- `login` → `src/app/login/page.tsx`.
- `register` → `src/app/register/NewOrgRegister.tsx`; gated in
  `src/app/register/page.tsx` (RegisterGate).
- `onboarding` → `src/app/onboarding/page.tsx` (3-step wizard; `register-organization`
  + `createSite`).
- Shared: `src/components/auth/{GoogleSignIn,googleAuth,AuthOverlay}`.

### What Phase 3 delivered (flag → files)
- `dashboard` → gate `src/app/organization/[id]/page.tsx` → `OrgDashboardNew.tsx`
  (legacy = `OrgDashboardLegacy.tsx`). Subcomponents in
  `src/app/organization/components/dashboard/*` (DashboardHero, DashboardStats,
  CasesByStatusCard = DS Meter, FirmGrowthCard = recharts, UpcomingHearingsCard,
  BranchesCard, DashboardOnboarding).
- `cases` → gate `.../cases/page.tsx` → `CasesNew.tsx` (legacy `CasesLegacy.tsx`).
  DS DataTable + card view. Also gates the Add/Edit routes: `.../cases/new`
  (org-level, new), `.../sites/[siteId]/cases/new` + `.../[caseId]/edit`
  (legacy files renamed `CreateCaseLegacy`/`EditCaseLegacy`).
- Add/Edit case shared: `src/app/organization/components/cases/*`
  (`useCaseForm`, `CaseFields`, `CaseForm`, `EditCaseForm`, `QuickAddCaseDialog`).
  New DS quick-add replaces `AddCaseModal` on the new dashboard + cases screens.
- `case-workspace` → gate `.../cases/[caseId]/page.tsx` → `CaseWorkspaceNew.tsx`
  (legacy `CaseWorkspaceLegacy.tsx`). New: `components/CaseWorkspaceHead.tsx`
  (casehead + KPI strip) + `hooks/useCaseMeta.ts` (tab counts + next hearing).
  **All tab bodies + all 9 add/edit modals + ContributorsCard rewritten in DS**
  (reusing hooks/form-logic; presentation only).
- Shared: `src/app/organization/components/caseStatusUi.ts` (status→tone/color/label).
- DS additions: `styles/patterns.css` (hero-band, hero-details(-card), listcard,
  branchlist, seg, meta-toggle, cgrid/ccard, form-sheet/fcard/action-bar/form-alert)
  and `styles/components.css` fix (meter/linebar `.fill` needs `display:block`).

**Phase 3 deviations (accepted — see phase-3-review §3/§6/§7):**
- **Workspace rollback is hybrid, not pristine.** The tab bodies + workspace
  modals + `CaseOverview` are workspace-only shared components, rewritten **in
  place** — so `case-workspace` OFF gives the legacy shell with DS bodies/modals.
  Behaviour preserved; Phase 5 removes the legacy shell anyway.
- **Add Case** collects only API-persisted fields (parties/court/priority/client/
  contributors from the mockup omitted — not fabricated).
- Dashboard: mockup's Recent-activity + per-branch counts omitted (no endpoint).
  Kept the firm-growth line chart (mockup drops it); pie → DS Meter.
- Dashboard hero keeps org key/contact/description behind a "Details" meta toggle
  (only place to view them until the Organization screen ships).
- **Remaining MUI in the workspace (intentional):** AI panels (`CaseAIChat`,
  `CaseSummarySection` — env-gated per Q4), `TaskCommentsTab` (task-edit comments
  sub-panel), and the **eCourts tab** (`EcourtDetailsView`) → that's Phase 4.

---

## 8. Next phase — Phase 4 (Practice) plan

**Screens (REVAMP_SPEC §8):** eCourts, Cause List, Billing. Each behind its flag
(`ecourts`, `cause-list`, `billing`), legacy fallback, per-screen loop (§9) +
parity (§10) + verify (§12), STOP for sign-off.

⚠ **Cause List needs a data-source spike first** (REVAMP_SPEC §8/§13): confirm the
real court-record/cause-list feed (CNR sync, hearing ingestion, refresh + failure
handling) before building. Don't fabricate.

Key contracts to honor (from Phase 0 — [01-functionality-contracts.md](./01-functionality-contracts.md) §J/§K):
- **eCourts** (`/organization/[id]/ecourts`): 3 tabs (Search / Saved Cases /
  History). SearchTab: CNR + cascading State/District search, `QuotaBanner`
  (server-enforced eCourts quota), `sessionStorage` persistence. SavedCasesTab:
  link/reference/remarks write flows. Standalone CNR viewer
  `/ecourt/[cnrNumber]` + `EcourtDetailsView` (already MUI — the big court-data
  renderer; AI tabs gated by data presence, NOT the env var). Ref mockup
  `design-reference/eCourts.html`. **This is where the workspace eCourts tab +
  EcourtDetailsView get DS'd.**
- **Cause List / Hearings** (`/organization/[id]/hearings` + site variant):
  `canViewHearings` gate, `useListQuery` (from/to/siteId/court), DateRange + Site
  + court filters. Ref `design-reference/Cause List.html`.
- **Billing**: Phase-0 Q11 **deferred the firm-wide Billing screen**; per-matter
  invoices stay in the case Invoice tab (already DS). Confirm whether Phase 4
  builds a firm Billing screen at all or just restyles what exists. Razorpay is
  out of the v1 UI. Ref `design-reference/Billing.html`.

Reuse the established pattern: DS gate + `XxxNew`/`XxxLegacy`, reuse services/
hooks/`useListQuery`, wrap in `<LuiRoot>`, DS `DataTable`/`Tabs`/filters
(`.toolbar`/`.search`/`.selectbox`), full state coverage.

---

## 9. Conventions & gotchas

- **Commits:** conventional (`feat(ui):`, `docs:`), present tense, one screen/
  component each. End messages with the `Co-Authored-By: Claude Opus 4.8 (1M
  context)` line (harness convention).
- **File size:** keep each file < 800 lines (a PreToolUse hook blocks larger
  writes). Split when needed.
- **Scoping:** never apply global body/font changes — they'd hit legacy screens.
  Keep new styling inside `.lui-root`. Tailwind additions go under the `lui`
  namespace. Do not restyle legacy MUI globally (MUI theme is opt-in only).
- **API envelope quirk:** responses unwrap via
  `response.data?.data?.data || response.data?.data || response.data`; id fields
  normalized (`organizationGuid`/`siteGuid` → `.id`). Org/admin services use raw
  axios (manual Bearer, no 401 interceptor); `clientServices` uses the shared
  `apiClient`.
- **Gender mapping:** UI `Non-Binary` ↔ API `Transgender`. Org role names have
  spaces in UI, stripped before API (`.replace(/\s+/g,'')`).
- **Two product surfaces:** ERP (`/organization/**`) = the revamp target;
  marketplace (`/home`, `/search`, `/admin-dashboard/*`, …) = legacy, out of scope
  this cycle (Q1). Broken legacy routes exist (`/dashboard`, `/appointments`,
  `/view-profile`) — do not depend on them.
- **Memory:** a project memory note (`lawsome-ui-revamp`) also summarizes this;
  this handbook is the fuller version and lives in-repo.

---

## 10. Quick resume checklist (new session)

1. `git checkout ui-revamp && git pull` (if remote); confirm tip and that the tree
   is clean. Run `yarn install --frozen-lockfile` if `node_modules` is missing.
2. Read this file, then `REVAMP_SPEC.md`, then the latest `phase-N-review.md`.
3. Confirm the current phase's sign-off status with the user before proceeding.
4. Run the verification gate (`type-check`/`lint`/`test`/`build`) to confirm a
   green baseline.
5. Continue the next phase per §8 and the per-screen loop — behind flags, legacy
   preserved, self-review + STOP at the phase boundary.

---

## 11. Legacy-removal pass — state & next steps (started 2026-07-15)

Goal (spec §14): remove legacy UI so the revamp is the app, then PR `ui-revamp` →
`main`. **User decisions:** DS the reused modals; **migrate remaining screens first**
(a clean mass-delete is impossible while live screens still use MUI); **stop before
the PR** (branch is pushed; the human opens the PR).

**Done (committed + pushed `origin/ui-revamp`, gate green):**
- 3 reused MUI modals rebuilt on the DS: `AddSiteDialog`, `AddUserDialog`,
  `EditUserDialog` (in `organization/components/modals/`). Wired into `BranchesNew`,
  `LawyersNew` / `UserManagementTabNew`. Commits `3de2437`, `32665ad`.
- `OrgDashboardNew` swapped to `AddSiteDialog`/`AddUserDialog`. Commit `40b44bd`.

**Branch-detail migrated (this session — see [legacy-removal-review.md](./legacy-removal-review.md)):**
- **`sites/[siteId]`** rebuilt on the DS, gated on **`branches`** (reused, not a new
  flag). Key finding: the live page was **not** a tabbed detail — it's a site
  **dashboard** (header + onboarding cards + clickable stat cards + 2 charts that
  navigate OUT to `/cases`,`/users`,`/hearings`); the user/case `Menu`s were dead code.
  Reviewer chose a **faithful DS re-skin** (no invented tabs/lists). New files:
  `SiteDetailNew.tsx`, `components/SiteDetailHead.tsx`, DS `EditSiteDialog.tsx`,
  DS `ConfirmDialog.tsx` (drop-in for the MUI `DeleteConfirmationModal`); old page →
  `SiteDetailLegacy.tsx`; `page.tsx` = gate. Reuses `AddUserDialog` + `QuickAddCaseDialog`.
  Gate green + live-verified (screenshots `assets/legacy-removal-site-*`).

**Blocker — remaining still-MUI users of legacy:**
- **`/profile`** (marketplace-adjacent) — confirm scope (likely leave per Q1).
- Full-page site user routes (`sites/[siteId]/users/new`, `.../users/[userId]/edit`,
  `.../cases/new`, `.../cases/[caseId]/edit`) still use MUI modals/forms.
- `EditOrganizationModal` + `DeleteConfirmationModal` still MUI (org-edit is the
  deferred Organization scope; the generic confirm is being replaced by DS `ConfirmDialog`).

**Flags flipped to default-ON (this session):** verified screens now default **ON** in
`FLAG_DEFAULTS` — `shell`, `landing`, `login`, `register`, `onboarding`, `dashboard`,
`cases`, `case-workspace`, `branches`, `lawyers`, `ecourts`. Deferred/not-built stay
**OFF** — `clients`, `organization`, `cause-list`, `billing`, and the dev-only
`workbench`. `flags.test.ts` updated (explicit ON/OFF partitions; 74 tests pass).
`*Legacy` files + MUI modals are **kept** as the toggle-off fallback (nothing deleted).
Gate green; branch pushed. **STOP — human opens the PR to `main`.**

**Follow-up (optional, later pass):**
1. ~~Migrate `sites/[siteId]` branch-detail to DS~~ ✅ done this session.
2. Delete the now-dormant target modals + `*Legacy` fallbacks (`OrgDashboardLegacy`, `CasesLegacy`,
   `BranchesLegacy`, `LawyersLegacy`, `EcourtsLegacy`, `CnrViewerLegacy`,
   `EcourtDetailsViewLegacy`, `EcourtTabLegacy`, `CaseWorkspaceLegacy`,
   `CreateCaseLegacy`, `EditCaseLegacy`) become deletable — simplify each gate
   page to render the New component directly, delete the Legacy files.
3. Decide flags strategy: either remove the gates entirely (clean end-state) or
   default the verified flags on. **Note:** `flags.test.ts` asserts every default is
   OFF — update it if defaults change.
4. Keep the marketplace (`/home`, `/search`, `/admin-dashboard/*`) as-is (Q1).
5. Full gate, push, **STOP for the human to open the PR to `main`.**
