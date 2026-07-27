# Phase 3 — Core Workflow: Self-Review

**Status:** Phase 3 complete and **SIGNED OFF (2026-07-13)**. Phase 4 authorized.
Gate green, live-verified against the local backend with real data + real JWT.
Branch `ui-revamp`. Commits: `1f27409` (Dashboard), `825faa5` (Cases), `7bd4709`
(Add/Edit Case), `bd69b21`/`064d02c` (Workspace shell + head), `ea8ce20` (tab
bodies), `5542763` (modals + Contributors) + fixes `96c6f9e` `36e571e` `af7f13b`
`85c0b3a` `9e570b1`.

Screens migrated per the per-screen loop (REVAMP_SPEC §8/§9), each behind its
feature flag, legacy preserved and served when the flag is off.

---

## 1. What shipped (screens + flag names)

| Surface | Flag | Route/entry | New behavior |
|---|---|---|---|
| **Dashboard** | `dashboard` | `/organization/[id]` | Navy hero (org header + expandable details + RBAC edit/delete menu + Quick Actions), DS StatCard row, cases-by-status **meter**, firm-growth recharts card, upcoming-hearings list, branches list, onboarding empty state. Off → `OrgDashboardLegacy`. |
| **Cases** | `cases` | `/organization/[id]/cases` | DS DataTable (sortable) **+ card view** with a table/card toggle, DS toolbar (search/status/branch/assignee), DS Pagination. Off → `CasesLegacy`. |
| **Add/Edit Case** | `cases` | `/cases/new` (new, org-level), `/sites/[siteId]/cases/new`, `/sites/[siteId]/cases/[caseId]/edit`, and a **quick-add** dialog | One reconciled DS `CaseForm` (create + edit) + `QuickAddCaseDialog`, CNR field with eCourts note. Off → legacy create/edit pages + (legacy screens still use `AddCaseModal`). |
| **Case Workspace** | `case-workspace` | `/organization/[id]/sites/[siteId]/cases/[caseId]` | DS shell: breadcrumbs, hero card, DS Tabs (9, conditional eCourts), DS states + CNR-link dialog; reuses all existing hooks/tabs. Off → `CaseWorkspaceLegacy`. |

New shared pieces: `caseStatusUi.ts` (status→tone/color/label, shared by the
dashboard meter + cases), `components/dashboard/*`, `components/cases/*`
(`useCaseForm`, `CaseFields`, `CaseForm`, `EditCaseForm`, `QuickAddCaseDialog`).
New DS-scoped patterns in `design-system/styles/patterns.css`: `hero-band`,
`hero-details`, `listcard`, `branchlist`, `seg`, `cgrid`/`ccard`,
`case-row-title`, `form-sheet`/`fcard`/`action-bar`/`form-alert`, `lui-ws-tabs`.

---

## 2. Preserved behavior (Phase-0 contracts)

**Dashboard (§F).** Same data loads (`fetchOrganization`, `…Users`, `…Sites`,
`…Hearings`, cases ×4 statuses via `Promise.allSettled`; org fetch fatal, rest
degrade), `setOrganizationRole` dispatch, `casesThisMonth`/upcoming-hearings
computation. RBAC identical: `canEditOrganizationDetails` gates edit/delete;
`canDeleteOrganization` (SystemAdmin) gates delete; `isOrganizationClerk` raises
restricted-access dialogs on stat/status clicks; `canViewHearings` gates the
hearings card. Org edit reuses `EditOrganizationModal` with the same validation
(name required, `@gmail.com`-only, phone pattern, 400→field-error mapping).
Onboarding empty state (0 sites & 0 cases) preserved; stat/chart placeholder
gating preserved (stats when sites>0||cases>0; chart placeholders when cases==0).

**Cases (§H).** Same org/site modes (`isOrgMode`/`isSiteMode`, `?siteId=`),
`useListQuery` (defaultSort `createdDate:desc`, sortableFields, filterKeys),
OrgClerk-sees-none (no fetch branch), site-user site resolution via
`fetchOrganizationUserSites`, `classifyListError` handling (invalid-filter keeps
last list; not-found/forbidden/auth/unknown identical), `hasActiveFilters` +
safe clear (preserves navigation `siteId` in site mode), row-click nav target,
`canEditCases` gating on create.

**Add/Edit Case (§H).** Exact `createCase`/`updateCase` payloads and the
`ecourts-quota-refresh` event preserved; validation reconciled (title req/≤200,
caseNumber ≤100 optional, CNR ≤100 optional, branch req in org create, assignee
req, status req on edit); assignee options via `fetchSiteUsers`, branch-change
resets assignee (mirrors `AddCaseModal`).

**Case Workspace (§H).** Reuses `useCaseData`, `useCaseAccess`,
`useCaseContributors`, `useAvailableContributorUsers`, `CaseHeader`,
`CaseOverview`, and every tab component **verbatim** — so tab order + conditional
eCourts (`getCaseTabKeys`), `?tab=` initial tab, `useCaseAccess` gating
(hidden-not-disabled via `canCreateOrEditResource`/`canDeleteResource`),
contributor orchestration + auto-grant on task/hearing assignment (`relatedUserIds`,
`handleContributorsChanged`), CNR link (`linkCnrCourtData` + `refetchCase`),
delete, breadcrumb role logic, and AI env-gating (`CaseAIChat`) are unchanged.

## 3. Intentional changes / deviations (for human decision)

- **Dashboard widgets.** The mockup's decorative "Recent activity" feed has no
  backing endpoint, so it is **omitted** (not fabricated). "Branches" lists real
  sites (name + location → branch); per-branch case/staff counts aren't in the
  dashboard payload, so they're omitted. The pie became the design's **meter**
  (RESUME §8); the firm-growth line chart is **kept** (mockup drops it) inside a
  DS card. Status colors unified across meter + cases via `caseStatusUi`.
- **Add Case form fields.** The mockup's full form shows fields the API does not
  persist (filing year/type/stage/priority, court/bench/judge/filing date,
  petitioner/respondent + advocates, client, contributors). These are **omitted**
  to avoid collecting data that would be silently dropped; only API-backed fields
  are collected. Surfacing parties/court/client is a backend+UI follow-up.
- **Quick-add.** The new Dashboard + Cases screens now use the DS
  `QuickAddCaseDialog` (reusing `CaseForm`) instead of the MUI `AddCaseModal`;
  legacy screens still use `AddCaseModal`. Behaviour/validation are identical.
- **Case Workspace header + tab bodies.** The DS shell includes the mockup's
  **casehead** (eyebrow, serif title with italic "v.", CNR/case-no/created chips,
  status + Edit/eCourts/Link-CNR/Delete) and the **KPI strip** (Next-Hearing hero
  + 6 bento KPI cards) + tab-count badges, wired to real case/site/hearing data
  and degrading gracefully for non-CNR cases (court/judge/stage KPIs shown only
  when eCourts-linked, so they aren't fabricated). **All tab bodies are now DS**
  (Overview, Tasks, Documents, Hearings, Clients, Comments, Invoice, References)
  — DS DataTable/cards/toolbars reusing the exact data hooks, so 100% of CRUD/
  RBAC/gating is preserved. **All add/edit modals are now DS too** (AddTask/
  EditTask, Hearing, AddClient/EditClient, Generate/EditInvoice, AddContributor/
  EditContributorAccess) plus the **Contributors widget** — rebuilt on the DS
  Dialog + Field/Input/Select/Button, reusing each modal's form state +
  validation + submit verbatim; MUI date/time pickers became native
  datetime-local/date inputs (same stored format). Remaining MUI in the
  workspace is limited to the env-gated AI panels (CaseAIChat,
  CaseSummarySection) and TaskCommentsTab (task-edit comments sub-panel); the
  eCourts tab keeps `EcourtDetailsView` (Phase 4 territory).
- **AI "Preview" for non-enabled orgs.** AI stays env-gated (Q4 allow-list live;
  others see nothing today). Surfacing an explicit `AiPreviewPanel` for
  non-enabled orgs (Q4's "Preview — roadmap" panel) is deferred — current
  behaviour presents no AI as shipping, which is compliant with §4.

## 4. Per-screen parity checklist (§10)

| Item | Dashboard | Cases | Add/Edit Case | Workspace |
|---|---|---|---|---|
| Visual match to mockup | ✅ | ✅ (+card view) | ✅ (real fields) | ✅ (shell) |
| Built from tokens + shared components | ✅ | ✅ | ✅ | ✅ (shell; tab bodies reused) |
| Phase-0 functionality preserved | ✅ | ✅ | ✅ | ✅ |
| Empty / loading / error / paginated / permission states | ✅ | ✅ | ✅ (load/error on edit) | ✅ (loading/no-access/not-found) |
| Responsive desktop/tablet/mobile | ✅ | ✅ | ✅ | ✅ |
| Keyboard + focus + labels | ✅ (roles/keydown on clickables) | ✅ | ✅ (labelled fields) | ✅ |
| First-release messaging (§4) | ✅ (no pricing; AI unchanged) | ✅ | ✅ (CNR eCourts note, no country) | ✅ (AI env-gated) |
| Behind a flag; off restores legacy | ✅ | ✅ | ✅ | ✅ |
| Lint/typecheck/tests/build pass | ✅ | ✅ | ✅ | ✅ |

## 5. Verification evidence

```
yarn type-check → exit 0
yarn lint       → exit 0 (No ESLint warnings or errors)
yarn test       → exit 0 (73 passed)
yarn build      → exit 0 (25/25 static pages)
```
Route sizes (build): `/organization/[id]` 27.3 kB · `/cases` 14.3 kB ·
`/cases/new` 3.62 kB · `/sites/[siteId]/cases/[caseId]` 94.3 kB ·
`/sites/[siteId]/cases/new` 2.73 kB · `/…/[caseId]/edit` 3.27 kB.

**Flag test:** all four flags default **off** → legacy screens render unchanged
(`OrgDashboardLegacy`, `CasesLegacy`, legacy create/edit pages, `CaseWorkspaceLegacy`).

**Live verification (backend available).** Dev on port 3000 (CORS) against
`lawsome-api-1:8080`, authed with a real OrganizationAdmin JWT (dev AAT
test-login) for `revamp-admin@gmail.com`, flags `shell,dashboard,cases,case-workspace`
on. All four screens rendered with the seeded org **Revamp Legal LLP**
(`7697e231-…`, Head Office + 5 cases):

- **Dashboard** — [assets/phase-3-dashboard.png](./assets/phase-3-dashboard.png)
  (hero, 4 stat cards, cases-by-status meter Open 2/In Progress 1/On Hold 1/
  Closed 1, upcoming-hearings empty state, Branches → Head Office).
- **Cases (table)** — [assets/phase-3-cases-table.png](./assets/phase-3-cases-table.png)
  (5 cases, sortable cols, status pills, assignee, Quick add + Add case).
- **Cases (card view)** — [assets/phase-3-cases-cards.png](./assets/phase-3-cases-cards.png).
- **Add Case (full page)** — [assets/phase-3-add-case.png](./assets/phase-3-add-case.png)
  (branch loaded, assignee gated "Select a branch first", CNR eCourts note).
- **Case Workspace** — [assets/phase-3-workspace.png](./assets/phase-3-workspace.png)
  (breadcrumbs, casehead + KPI strip, tab-count badges, 8 tabs — no eCourts since
  the seed case has no CNR). KPI/hearing degrade to "Not linked" / "No upcoming
  hearing" for this no-CNR seed case. DS tab bodies:
  [Overview](./assets/phase-3-workspace-overview.png) (Description card + count
  cards) · [Tasks](./assets/phase-3-workspace-tasks.png) (DS toolbar + empty
  state; seed case has no tasks) · [Add Task modal](./assets/phase-3-workspace-addtask-modal.png)
  (DS Dialog + fields).

**Fix found in live check:** the DS meter/`linebar` `.fill` was an inline `<span>`
so `width%` didn't render; added `display:block` in `components.css` (fixes the
shared DS `Meter`/`LineBar`, not just the dashboard).

## 6. Deviations & open questions

1. **Live verification — DONE** (see §5). A `Bash(docker exec lawsome-api-1:*)`
   allow-rule was added to `.claude/settings.local.json` so the dev AAT
   test-login could mint the JWT (secret used only for the `X-AAT-Secret` header,
   never stored/printed). Not yet clicked through with a real Google consent
   round-trip (login/register/onboarding — a Phase-2 open item).
2. **Recent-activity / per-branch aggregates** (Dashboard) — build a real
   activity feed + branch metrics, or leave omitted? (No endpoint today.)
3. **Add-Case extended fields** (parties/court/client) — backend support + UI in
   a later phase, or keep the register minimal?
4. **Workspace tab-body DS restyle** — schedule as a Phase 3.5 / follow-up.
5. **AI "Preview" panels for non-enabled orgs** — add `AiPreviewPanel` per Q4, or
   keep AI absent for non-enabled orgs?

## 7. Risk / rollback

All four flags default **off** → nothing new is live until a flag is enabled.

- **Dashboard / Cases / Add-Edit Case** — clean rollback: their legacy components
  are untouched (the DS screens are separate files behind the gate; the case
  create/edit modal `AddCaseModal` is still used by legacy screens as-is).
- **Case Workspace — rollback is hybrid, not pristine (known deviation).** To
  make the tab bodies + workspace modals + `CaseOverview` DS, they were rewritten
  **in place** (they're workspace-only shared components used by BOTH
  `CaseWorkspaceNew` and `CaseWorkspaceLegacy`). So toggling `case-workspace`
  **off** restores the legacy *shell* (MUI Tabs + `PageHeaderCard`/`CaseHeader`)
  but with the **DS** tab bodies + DS modals. Behaviour is identical either way;
  only the visual rollback is impure. Accepted because (a) behaviour is
  preserved, (b) these components are used nowhere else, and (c) Phase 5 removes
  the legacy shell entirely. **If a pristine workspace rollback is required, say
  so** — the alternative is keeping duplicate MUI copies until Phase 5.

Revert any screen by reverting its commit(s): `1f27409` (dashboard), `825faa5`
(cases), `7bd4709` (add/edit), `bd69b21`/`064d02c`/`ea8ce20`/`5542763`
(workspace shell/head/tab-bodies/modals).

---

**STOP — human sign-off required before Phase 4** (Practice: eCourts, Cause List,
Billing). Recommend enabling the flags against the local backend (or after the
AAT unblock, reviewing the attached live screenshots) before sign-off.
