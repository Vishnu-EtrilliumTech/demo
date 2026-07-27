# Phase 4 — Practice (eCourts) — Self-Review

**Branch:** `ui-revamp` · **Flag:** `ecourts` (default **off**) · Status: ✅ **signed off (2026-07-15)**

Scope was confirmed with the reviewer before building (two open items from the
kickoff):

- **Cause List — DEFERRED.** The data-source spike (REVAMP_SPEC §8/§13) found **no
  external court/CNR cause-list ingestion feed** in the codebase. The `cause-list`
  screen maps (contract §K) to the internal **Hearings** list
  (`fetchOrganizationHearings`/`fetchSiteHearings` via `useListQuery`); the eCourts
  State/District selects are just search dropdowns, not a feed. Reviewer chose to
  **defer** Cause List. The `cause-list` flag stays reserved.
- **Billing — SKIPPED (Phase-0 Q11).** No firm-wide billing route exists; per-matter
  invoices are already DS'd in the case Invoice tab (Phase 3). Reviewer chose to
  **skip** a firm Billing screen this phase. The `billing` flag stays reserved.

So **Phase 4 delivered = eCourts only.**

---

## 1. What shipped (flag → files)

Everything is behind the **`ecourts`** flag, additive, with a clean legacy
fallback. Reuses the existing `ecourtapi` service layer + `useListQuery`
unchanged — **presentation only**.

**Shared court-record renderer** (`components/EcourtDetailsView/`)
- Legacy MUI renderer preserved verbatim as **`EcourtDetailsViewLegacy.tsx`**.
- New DS renderer split into modules: `EcourtDetailsView.tsx` (orchestrator, same
  default-export signature), `parts.tsx`, `CaseInfoTab.tsx`, `AiSummaryTab.tsx`,
  `LegalAnalysisTab.tsx`, `ArgumentsTab.tsx`, `InsightsTab.tsx`, `JudgmentTab.tsx`.
- Case Info always renders; the AI tabs (AI Summary/Legal Analysis/Arguments/
  Insights/Judgment) render **only when `data.files[0].aiAnalysis` is present**
  (data-gated, contract §J — **not** the env var) and carry the mandated
  first-release **"Preview"** chip + roadmap note (`AI_ROADMAP_NOTE`, §4).

**Workspace eCourts tab** (`.../cases/[caseId]/components/EcourtTab/`)
- `EcourtTab.tsx` is now a gate: `useFeatureFlag('ecourts') ? EcourtTabNew : EcourtTabLegacy`.
- `EcourtTabNew.tsx` (DS, wrapped in `<LuiRoot>`) / `EcourtTabLegacy.tsx` (MUI, →
  legacy renderer). Both workspaces (`CaseWorkspaceNew`/`Legacy`) render `<EcourtTab>`
  unchanged. Read + refresh only, matching legacy.
- The **References** tab (`ReferenceCaseTab`) was already DS'd in Phase 3 — untouched.

**Standalone CNR viewer** (`/organization/[id]/ecourt/[cnrNumber]`)
- `page.tsx` gates → `CnrViewerNew.tsx` (DS) / `CnrViewerLegacy.tsx` (MUI).
- Fetch (with case-data fallback), refresh (quota event), save/retain, and
  role-aware breadcrumbs preserved.

**eCourts hub** (`/organization/[id]/ecourts`)
- `page.tsx` gates → `EcourtsNew.tsx` (DS shell: LuiRoot + page-head + DS Tabs +
  Refresh) / `EcourtsLegacy.tsx` (MUI).
- DS tab bodies: `SearchTabNew.tsx` (+ `SearchResults.tsx`), `SavedCasesTabNew.tsx`,
  `HistoryTabNew.tsx`. Legacy `SearchTab`/`SavedCasesTab`/`HistoryTab` kept for the
  legacy hub.

**Design system**
- `styles/patterns.css`: scoped eCourts-detail patterns (`subhead`/`prose`/
  `arg-cols`/`score`/`kw`/`cite-list`/`jgrid`/`jfile`/`suggest`/`prose-md`/
  `ec-updated`) + hub patterns (`ec-quota`/`ec-searchform`/`ec-result`/`ec-bulkbar`/
  `ec-picklist`). No new global styles; all under `.lui-root`. No token/component
  API changes.

Commits: `bf99ed0` (renderer + CNR viewer + workspace tab), `3ffce81` (hub).

---

## 2. Per-screen parity checklist (§10)

Legend: ✅ pass · ⚠ note.

| Item | eCourts hub | CNR viewer | Workspace eCourts tab |
|---|---|---|---|
| Visual match to mockup (`eCourts.html`) | ✅ page-head, DS tabs, quota, result cards | ✅ header/tabs/cards | ✅ same renderer |
| Built only from tokens + components | ✅ | ✅ | ✅ |
| **All Phase-0 functionality preserved (§J)** | ✅ 3 tabs, 7 search types, cascading State/District, quota, sessionStorage, saved-case link/reference/remarks/bulk-delete write flows, history | ✅ fetch+fallback, refresh (quota event), save/retain, breadcrumbs | ✅ read + refresh |
| Empty / loading / error / paginated / permission | ✅ empty + loading + paginated (Search/Saved/History) | ✅ loading + error | ✅ loading + error + no-CNR empty |
| Responsive; scroll/overflow; ≥44px targets | ✅ (`.tbl` mobile scroll, tiles/kv reflow) | ✅ | ✅ |
| Keyboard + focus + labels | ✅ DS focus-visible; buttons/inputs labelled | ✅ | ✅ |
| First-release messaging (§4) | ✅ no pricing; AI absent from hub | ✅ **AI tabs carry "Preview" + roadmap note**; ₹/eCourts domain data kept (internal ERP, allowed Q3) | ✅ same |
| Behind a feature flag; off restores legacy | ✅ `ecourts` off → `EcourtsLegacy` | ✅ off → `CnrViewerLegacy` | ✅ off → `EcourtTabLegacy` |
| No console errors; lint/type/test/build | ✅ (see §5; console clean in live check) | ✅ | ✅ |

---

## 3. Functionality parity (Phase-0 §J)

Preserved against the contract:
- **eCourts hub** — Search / Saved Cases / History tabs; Refresh on non-Search tabs.
  SearchTab: CNR + Case Number + Advocates/Judges/Petitioners/Respondents/Litigants;
  cascading State (`fetchCauselistStates`) / District (`fetchCauselistDistricts`);
  case-status filter; year validation (1950..now); `QuotaBanner` (`fetchEcourtsQuota`,
  Low/Exhausted); full `sessionStorage['ecourts-search-{orgId}']` persistence;
  results via `searchEcourts` + pagination; single-CNR via `fetchCnrCourtData`
  (fallback `fetchCaseCourtData`). SavedCasesTab: `fetchPersistedEcourtCases`,
  bulk-select + `deletePersistedEcourtCase` (confirm), `linkCnrCourtData` (from
  `fetchUnlinkedCases`), `addReferenceCase` (from `fetchOrganizationCases`),
  `updatePersistedCaseRemarks` on blur, CNR/title filters + sort. HistoryTab:
  `fetchSearchHistory`, row → CNR viewer.
- **CNR viewer** — `fetchCnrCourtData` → fallback `fetchCaseCourtData`; `updateCnrCourtData`
  dispatches `ecourts-quota-refresh`; `activateCnrCourtData` (Save/Retain) →
  `isSaved`; role-aware breadcrumbs.
- **EcourtDetailsView** — every section of the legacy renderer reproduced (snapshot,
  key dates, parties, proceedings tiles, hearing history, interim orders + PDF
  download, IAs, judgments + download, FIR/subordinate, raw-collection dumps, filed
  documents, empty-collection summary, system record; AI Summary/Legal/Arguments/
  Insights/Judgment incl. markdown via `react-markdown`+`remarkGfm`+`rehypeRaw`).
  Download flow (`downloadFn` blob → anchor) unchanged.

Nothing was dropped to match the mockup.

---

## 4. Deviations & open questions

1. **Popovers → DS dialogs (SavedCasesTab).** The legacy link-case / add-reference /
   overflow flows used MUI `Popover` anchored menus. The DS has no popover
   primitive, so these are rebuilt as DS `Dialog` pickers (`.ec-picklist`).
   Behaviour is preserved (search a case → link/add; view the overflow list); only
   the anchoring presentation differs. Flag one if an anchored popover is required.
2. **CNR-result heading uses derived party title.** The renderer header now shows a
   derived "Petitioner v. Respondent" title (falling back to the CNR) with the CNR
   in a chip below, per the mockup, instead of the CNR as the H1. All original
   fields (CNR, court, case type) are still shown.
3. **Populated renderer not shown live.** The seeded org has **0** persisted court
   records (`court_case_lookups` empty) and no live external CNR was available to
   fetch, so the populated Case Info + AI tabs could not be screenshotted against
   real data. The renderer is a faithful, section-for-section port of the verified
   legacy renderer and passes type-check/build; live checks cover the hub (all 3
   tabs) and the CNR-viewer shell/states. **If you want a populated capture, seed a
   `court_case_lookups` row or point me at a fetchable CNR and I'll screenshot it.**
4. **Rollback is clean here** (unlike the Phase-3 workspace hybrid): every eCourts
   surface keeps a full legacy component behind the gate, so `ecourts` off restores
   the MUI screens exactly. Cost: the legacy renderer/tabs are duplicated until
   Phase 5 removes them.

---

## 5. Verification evidence

```
yarn type-check → exit 0
yarn lint       → exit 0 (No ESLint warnings or errors)
yarn test       → exit 0 (73 passed, 8 files)
yarn build      → exit 0
```
Route sizes (build): `/organization/[id]/ecourts` 29.4 kB ·
`/organization/[id]/ecourt/[cnrNumber]` 6.35 kB ·
`/organization/[id]/sites/[siteId]/cases/[caseId]` 64 kB.

**Flag test:** `ecourts` default **off** → legacy screens render (`EcourtsLegacy`,
`CnrViewerLegacy`, `EcourtTabLegacy` → legacy MUI renderer).

**Live verification** (dev on 5173 vs `lawsome-api-1:8080`, real OrganizationAdmin
JWT via AAT test-login, flags `shell,dashboard,cases,case-workspace,ecourts`, org
**Revamp Legal LLP** `7697e231-…`). Console **clean** (no errors).
- **Hub — Search** — [assets/phase-4-ecourts-search.png](./assets/phase-4-ecourts-search.png)
  (page-head, DS tabs, quota banner 0/100, 7 search-type tabs, CNR form).
- **Hub — Saved Cases** — [assets/phase-4-ecourts-saved.png](./assets/phase-4-ecourts-saved.png)
  (CNR/title filters + sort select + Refresh + DS empty state).
- **Hub — History** — [assets/phase-4-ecourts-history.png](./assets/phase-4-ecourts-history.png)
  (DS empty state).
- **CNR viewer** — [assets/phase-4-cnr-viewer-state.png](./assets/phase-4-cnr-viewer-state.png)
  (DS breadcrumbs + DS ErrorState for an unknown CNR; backend returned a clean
  not-found).

---

## 6. Risk / rollback

`ecourts` defaults **off** → nothing new is live until enabled. Each surface has a
full legacy fallback, so toggling off restores the MUI screens exactly. Revert the
phase by reverting `bf99ed0` (renderer/viewer/workspace tab) and `3ffce81` (hub).

---

**STOP — human sign-off required before Phase 5** (Admin & settings: Branches,
Lawyers, Clients, Organization; then remove legacy). Recommend enabling `ecourts`
against the local backend and, if a populated court record is available, reviewing
the full `EcourtDetailsView` before sign-off.
