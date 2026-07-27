# Phase 5 — Admin & settings (Branches + Lawyers) — Self-Review

**Branch:** `ui-revamp` · **Flags:** `branches`, `lawyers` (default **off**) · Status: ✅ **signed off (2026-07-15)**

Scope was confirmed with the reviewer before building:

- **Build this phase:** **Branches** (`branches`) + **Lawyers** (`lawyers`).
- **Clients — kept DEFERRED** (Phase-0 Q10; stays case-scoped).
- **Organization settings — kept DEFERRED** (Settings nav stays disabled in v1; org
  edits remain on the dashboard modal).
- **Legacy removal — HELD for a final reviewed pass** (flags stay default-off; no
  `XxxLegacy` deletion this phase).

---

## 1. What shipped (flag → files)

Additive, behind flags defaulting **off**, clean legacy fallback per screen.
Reuses existing services + `useListQuery` + the RBAC hook — **presentation only**.

**Branches (Sites)** — `branches` → `src/app/organization/[id]/sites/`
- `page.tsx` gates → `BranchesNew.tsx` (DS) / `BranchesLegacy.tsx` (MUI, renamed
  from the old page, delegates to `SiteManagementTab`).
- `BranchesNew`: LuiRoot + page-head + toolbar (debounced search, sort select,
  grid/table view toggle) + `.ecard` grid / DS `DataTable`, pager. Card/row click →
  site detail. Cards show name, address, phone, email, siteKey + Cases/Staff counts.
- Reuses `fetchOrganizationSites` + `useListQuery` (`SiteListFilters`).

**Lawyers (Users)** — `lawyers` → `src/app/organization/[id]/users/`
- `page.tsx` gates → `LawyersNew.tsx` (DS) / `LawyersLegacy.tsx` (MUI, renamed).
- `LawyersNew` (page shell): dual org/site mode + `viewSiteId` resolution, RBAC-gated
  Add, AddUserModal with the same permission props as legacy.
- `UserManagementTabNew.tsx` (DS list body): toolbar (debounced search, Site filter
  [org mode], Role filter, clear), sort, grid (`.ecard`) / DS `DataTable`, pager.
  Per-user edit/delete RBAC copied **verbatim** from the legacy `UserManagementTab`
  (`canEditUserFn`/`canDeleteUserFn`/`handleUserClick` + org-level/site-admin guards);
  opens `EditUserModal`; the OrgClerk-vs-Head-Office "not authorized" case uses a DS
  Dialog.
- Reuses `fetchOrganizationUsers`/`fetchSiteUsers`/`fetchOrganizationSites` +
  `useListQuery` + `useUserRole`.

**Design system:** no new CSS or component APIs — both screens compose existing DS
classes (`page-head`/`toolbar`/`search`/`selectbox`/`viewtoggle`/`grid-cards`/
`ecard`/`who2`/`tbl`) + components (`DataTable`/`Pagination`/`Pill`/`Dialog`/states).

Commits: `193d0d3` (Branches), `588f9b5` (Lawyers).

---

## 2. Per-screen parity checklist (§10)

| Item | Branches | Lawyers |
|---|---|---|
| Visual match to mockup (`Branches.html` / `Lawyers.html`) | ✅ eyebrow/title/toolbar, ecard grid + table | ✅ same shell + user cards |
| Built only from tokens + components | ✅ | ✅ |
| **All Phase-0 functionality preserved** | ✅ search/sort/grid+table/pager, Add (AddSiteModal), click → detail (§I / dashboard Sites tab) | ✅ dual org/site mode, search + Site + Role filters, sort, grid+table, pager, per-user RBAC edit/delete, Add/Edit modals, not-authorized case (§I) |
| Empty / loading / error / paginated / permission | ✅ all | ✅ all (+ RBAC gating on row-open and Add) |
| Responsive; scroll/overflow | ✅ grid reflow + `.tbl` mobile scroll | ✅ same |
| Keyboard + focus + labels | ✅ | ✅ |
| First-release messaging (§4) | ✅ no pricing/AI | ✅ no pricing/AI |
| Behind a flag; off restores legacy | ✅ `branches` off → `BranchesLegacy` | ✅ `lawyers` off → `LawyersLegacy` |
| No console errors; lint/type/test/build | ✅ (console clean in live check) | ✅ |

---

## 3. Functionality parity (Phase-0 §I)

- **Branches:** `fetchOrganizationSites` via `useListQuery` (defaultSort name:asc,
  sortable name/createdDate/status, `search` filter); grid + table views; pager;
  Add via the existing `AddSiteModal` (siteKey-availability + address autocomplete
  intact); card/row → `/sites/[siteId]`. Edit/delete remain on the site-detail page
  (unchanged — the list never had per-row edit/delete).
- **Lawyers:** org vs site mode from role + `?viewSiteId=`; site-mode siteId resolved
  via `fetchOrganizationUserSites`. `useListQuery` (sortable name/email/createdDate/
  role; filters search/role/status [+siteId in org mode]). Site column/filter shown
  to OrgAdmin only. Full per-user RBAC (self-edit; OrgAdmin-only targets; SiteAdmin
  via `canActOnSiteAdmin`; org-level users excluded in site mode). Add/Edit via the
  existing `AddUserModal`/`EditUserModal` with identical permission props (gender
  `Non-Binary↔Transgender` + role space-strip transforms live in those modals,
  untouched).

Nothing dropped to match the mockups.

---

## 4. Deviations & open questions

1. **Create/Edit modals remain MUI (accepted).** `AddSiteModal`, `AddUserModal`,
   `EditUserModal` are reused as-is (launched from the DS screens). They carry
   non-trivial behavior — siteKey-availability check + Google address autocomplete
   (sites); role-permission logic + gender/role transforms (users) — so keeping them
   verbatim preserves behavior with zero regression risk. They render in a portal, so
   the DS screen is unaffected. **They'll be DS'd in the scheduled legacy-removal
   pass.** If you want them DS'd now, say so.
2. **Branch cards omit the mockup's per-card edit/delete + HQ pill.** The app keeps
   branch edit/delete on the site-detail page (not the list), and `Site` has no
   head-office flag — so those are omitted rather than fabricated. Cases/Staff counts
   come from real `casesCount`/`usersCount` fields.
3. **Lawyers subtitle** reads "…for this branch" when the signed-in user holds a
   site-level role (e.g. the seed admin is OrganizationAdmin **and** SiteAdmin) —
   identical to legacy `isSiteMode` behavior; the list itself is still org-scoped
   (Site filter shown, org users fetched). Not a regression.
4. **Full-page user routes** (`/users/new`, `/users/[userId]/edit`, site variants)
   are unchanged this phase — the primary Lawyers surface uses the modals. They can
   be folded into the legacy-removal pass.

---

## 5. Verification evidence

```
yarn type-check → exit 0
yarn lint       → exit 0 (No ESLint warnings or errors)
yarn test       → exit 0 (73 passed, 8 files)
yarn build      → exit 0
```

**Flag test:** `branches` / `lawyers` default **off** → legacy screens render
(`BranchesLegacy`, `LawyersLegacy`).

**Live verification** (dev on 5173 vs `lawsome-api-1:8080`, real OrganizationAdmin
JWT, `branches`+`lawyers` enabled via the localStorage override, org **Revamp Legal
LLP** `7697e231-…`). Console **clean**.
- **Branches** — [assets/phase-5-branches.png](./assets/phase-5-branches.png)
  (page-head, toolbar, Head Office ecard with address/phone/email/siteKey + Cases 5 /
  Staff 0, Add Branch).
- **Lawyers** — [assets/phase-5-lawyers.png](./assets/phase-5-lawyers.png)
  (page-head, search + Site + Role filters + sort + view toggle, Revamp Admin user
  card with roles/email/phone/site/registered, Add User).

---

## 6. Risk / rollback

`branches` / `lawyers` default **off** → nothing new is live until enabled. Each
screen has a full legacy fallback, so toggling off restores the MUI screens exactly.
Revert by reverting `193d0d3` (Branches) / `588f9b5` (Lawyers).

---

**STOP — human sign-off required.** After sign-off, the remaining work is the
**legacy-removal pass** (delete `XxxLegacy` components + full-page user routes, DS the
reused modals, default all verified flags on, remove dead MUI) — proposed as its own
reviewed step per your earlier decision. Clients + Organization remain deferred unless
you want them added.
