# Legacy-removal pass — Self-Review (running log)

**Branch:** `ui-revamp` · Status: 🔨 **in progress** (branch is pushed; no PR yet).

This pass removes the legacy UI so the revamp becomes the app (spec §14). Per the
reviewer's decision it proceeds by **DS'ing the reused modals** and **migrating the
remaining live screens first** (a clean mass-delete is impossible while live screens
still use MUI), then deleting the `*Legacy` files. **Stop before the PR** — the human
opens it.

Earlier in the pass (committed): `AddSiteDialog`, `AddUserDialog`, `EditUserDialog`
DS'd + wired into `BranchesNew`, `LawyersNew`/`UserManagementTabNew`, `OrgDashboardNew`
(commits `3de2437`, `32665ad`, `40b44bd`).

---

## Branch-detail migration (`sites/[siteId]`)

### Scope decision (confirmed with reviewer)

The live `sites/[siteId]/page.tsx` (1353 lines MUI) is a **site dashboard**, not a
tabbed detail: site header (details + expand) → onboarding step cards (empty) →
clickable KPI stat cards + two charts. The stat cards **navigate out** to the existing
`/cases?siteId=`, `/users?viewSiteId=`, `/sites/[siteId]/hearings` routes. It has **no
embedded tabs and no Users/Cases/Hearings DataTables** — the `userMenuAnchor` /
`caseMenuAnchor` MUI `Menu`s in the file are **dead code** (their anchors are only ever
cleared, never set → unreachable).

The original task brief assumed "Overview + Users + Cases + Hearings tabs with
DataTables". Building those would **invent behaviour** the screen never had and
duplicate the canonical list routes — against the preserve-100% rule. **Reviewer chose:
faithful DS re-skin** (no new tabs/lists), and **reuse the `branches` flag** (site-detail
is part of the Branches surface).

### What shipped (flag → files)

Gated on **`branches`** (default **off**) → `sites/[siteId]/page.tsx` renders
`SiteDetailNew` when on, `SiteDetailLegacy` when off (clean fallback).

- **`SiteDetailNew.tsx`** — DS site dashboard. Reuses the existing site services
  (`fetchSite`/`fetchSiteUsers`/`fetchSiteCases`/`fetchSiteHearings`/`deleteSite`), the
  `useUserRole` RBAC hook, and the shared dashboard components `DashboardStats`
  (`branchCount={0}`), `CasesByStatusCard` (`siteId`), `FirmGrowthCard`. Preserves:
  header + expandable details, onboarding empty-state (Add users / Add a case), KPI
  stats + click-through navigation (OrgClerk → restricted DS dialogs), the two charts,
  and site Edit/Delete + Quick actions (Add user / Add case), all RBAC-gated.
- **`components/SiteDetailHead.tsx`** — the header (mirrors `DashboardHero`): title,
  Key/Since meta + Details toggle, 3-dot Edit-site/Delete-site menu (RBAC), Quick
  actions dropdown, expandable details card (Details / Contact / Address / Description).
- **`EditSiteDialog.tsx`** (DS) — mirrors `AddSiteDialog` minus the immutable site key;
  reuses the legacy `EditSiteModal` validation schema, `AddressAutocomplete`, and
  `updateSite`. Prepopulates from the `site` prop.
- **`ConfirmDialog.tsx`** (DS) — drop-in DS replacement for the MUI
  `DeleteConfirmationModal`: same entity copy + cascade warnings (ported verbatim), on
  the DS `Dialog` (danger) + `Button` (danger). Used here for delete-site; reusable by
  the rest of the pass.
- Add user → the existing DS `AddUserDialog` (site mode). Add case → the existing DS
  `QuickAddCaseDialog` (site mode).
- **`SiteDetailLegacy.tsx`** — the old page, renamed (export renamed to
  `SiteDetailLegacy`); otherwise untouched.

### Parity / behaviour

Preserves 100% of the reachable behaviour: RBAC (`canEditSites`/`canDeleteSites`,
OrgClerk restricted dialogs, hidden back-link for site admins/legal experts), delete
site (same success/error messages + redirect to org root), add user/case, and the
stat-card navigation targets. The unreachable dead user/case `Menu`s are dropped (no
behaviour change).

### Deviations (accepted)

1. **No tabs/embedded lists** — faithful re-skin per the scope decision above.
2. **Growth chart wording** — `FirmGrowthCard` is reused verbatim, so the populated
   card reads "Firm growth" while the empty placeholder reads "Site growth". Cosmetic;
   the shared component is intentionally not forked.
3. **Back navigation** — a single "← Branches" link replaces the legacy breadcrumb
   (Sites / site name); the mobile-only "Organizations" crumb is dropped (the DS shell
   topbar covers top-level nav). Hidden for site admins/legal experts, as in legacy.

### Verification

```
yarn type-check → exit 0
yarn lint       → exit 0 (No ESLint warnings or errors)
yarn test       → exit 0 (73 passed, 8 files)
yarn build      → exit 0
```

**Live** (dev 5173 vs `lawsome-api-1:8080`, real OrganizationAdmin+SiteAdmin JWT,
`shell,branches`, org **Revamp Legal LLP** / **Head Office** `6b907ef3-…`). Console
clean (one pre-existing shell logo aspect-ratio warn). Screenshots:
- Dashboard — [assets/legacy-removal-site-detail.png](./assets/legacy-removal-site-detail.png)
- Edit branch dialog — [assets/legacy-removal-site-editdialog.png](./assets/legacy-removal-site-editdialog.png)
- Delete-site confirm — [assets/legacy-removal-site-deleteconfirm.png](./assets/legacy-removal-site-deleteconfirm.png)
- Add case dialog — [assets/legacy-removal-site-addcase.png](./assets/legacy-removal-site-addcase.png)

### Risk / rollback

`branches` defaults **off** → the whole Branches surface (list + detail) stays legacy
until enabled. Revert by reverting this commit set.

---

## Flags flipped to default-ON (reviewer decision)

Rather than deleting the `*Legacy` files now, the reviewer chose to **default the
verified flags ON** — the revamp becomes the app, and every legacy fallback stays one
toggle away (set the key `false` via `NEXT_PUBLIC_UI_FLAGS` or a runtime override).

`FLAG_DEFAULTS` (`src/design-system/flags/flags.ts`):
- **ON** (signed-off screens): `shell`, `landing`, `login`, `register`, `onboarding`,
  `dashboard`, `cases`, `case-workspace`, `branches`, `lawyers`, `ecourts`.
- **OFF** (deferred / not built + dev tool): `clients` (Q10), `organization` (deferred
  settings), `cause-list` (no feed), `billing` (Q11), `workbench` (dev-only, 404 in prod).

`flags.test.ts` updated: the old "every default OFF" assertion is replaced by explicit
`DEFAULT_ON` / `DEFAULT_OFF` partitions (+ a coverage test that every key is
partitioned), and the env/override cases now use default-off keys. 74 tests pass.

**Nothing was deleted** — `*Legacy` files + the MUI modals remain as the toggle-off
fallback. A later pass can delete them once the ON defaults have soaked.

## Next

Keep the marketplace as-is (Q1). Branch is pushed; **STOP — the human opens the PR to
`main`.** A future pass may delete the now-dormant `*Legacy` files + orphan MUI modals.
