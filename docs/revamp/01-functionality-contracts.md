# Phase 0 — Functionality Contracts (per screen)

> Companion to [00-discovery.md](./00-discovery.md). This file holds the detailed
> "functionality contract" for every existing screen/route — the behavior that
> **must survive** the UI revamp (REVAMP_SPEC §3.4, §6). Split from the main
> discovery doc only to respect the repo's 800-line-per-file limit.
>
> Legend: **RBAC** = role/permission gating · **FR-flag** = first-release
> messaging concern (pricing / AI / country / auth) · **eCourts** = court-sync
> data flow · **⚠ legacy** = broken/unused today.

Roles (from `src/hooks/useUserRole.ts`): `SystemAdmin`, `OrganizationAdmin`,
`OrganizationClerk`, `SiteAdmin`, `SiteClerk`, `SiteSrLegalExpert`,
`SiteLegalExpert`, `SiteCaseClient`. Domain: **site = branch**.

Case access ladder (`src/hooks/useCaseAccess.ts`, mirrors backend, first-match-wins):
SystemAdmin/OrgAdmin/SiteAdmin → Full/Full · SiteSrLegalExpert → Edit entity /
Full resource · OrgClerk → View/View · creator (unless SiteClerk) → Edit/Full ·
assignee → Edit/Full · contributor Edit → Edit/Edit · contributor ViewOnly →
View/View. Backend `accessLevel` hint overrides the local entity level. Controls
that fail a check are **hidden, not disabled**.

---

## A. Global shell & cross-cutting

**Root layout** `src/app/layout.tsx` → `Providers` → `LayoutClient`. Metadata
title "Lawsome". `Providers` (`src/app/providers.tsx`) stack:
`GoogleOAuthProvider` → `GoogleSilentRefresh` → Redux `Provider` → `PersistGate`
→ `ToastProvider` → `CoachMarkProvider`.

**`LayoutClient`** picks chrome by pathname: `/admin*` → `AdminHeader`+`CustomFooter`;
`/organization*` or `/profile*` → children only (org area supplies its own
`OrgSidebar`+`OrgHeader`); paths containing `auth` → no chrome; `/dashboard*` →
`CustomHeader`; else `Header`. Footer variants (`CustomFooter`/`Footer`) chosen
similarly.

**Auth/session:** JWT in `localStorage['lawsome_token']`. `httpServices.ts`
`apiClient` attaches `Bearer`; response 401 → `clearToken()` + hard redirect `/`.
`GoogleSilentRefresh` re-mints JWT ~60s before `exp` via One-Tap →
`POST {API}/api/auth/google`. **FR-flag: auth is Google-based already.**

**Redux (redux-persist / localStorage):** `profile` (searchProfile: id/name/role/
org role+id, userId), `legalExpert` (data), `client` (data), `ecourtsSearch`
(`usedCount`, `lastResetMonth` — monthly eCourts search quota counter).

**Reusable primitives:** `OrgSidebar`, `OrgHeader`, `HeaderSearch` (org shell);
`SortableColumnHeader`, `ListFooterPager`, `filters/*` (`TextSearchFilter`,
`EnumSelectFilter`, `EntityRefFilter`, `DateRangeFilter`, `SortSelectFilter`),
`useListQuery`, `PagedResponse<T>`; `StatusChip`, `ErrorAlert`, `FieldError`,
`RequiredIndicator`, `PageHeaderCard`, `AddressAutocomplete`,
`ConfirmationDialog`, `DeleteConfirmationModal`, `shared/{EmptyState,LoadingState,
ConfirmDialog,ExpandableRow}`. Charts: `FirmGrowthLineChart`,
`CaseStatusPieChart` (recharts). No shared Button (MUI `<Button>` direct). **No
feature-flag system.** AI gate = inline `isAIEnabledForOrganization(orgId)` reading
`NEXT_PUBLIC_AI_ENABLED_ORG_IDS` (duplicated in 2 components).

**API envelope quirk:** responses unwrapped via
`response.data?.data?.data || response.data?.data || response.data`; id fields
normalized (`organizationGuid`/`siteGuid` → `.id`). Org/admin services use raw
`axios` (manual Bearer, **no 401 interceptor**); only `clientServices` uses
shared `apiClient`. Errors classified by `classifyListError` →
`invalid-filter | forbidden | auth | default`.

---

## B. Public / marketing (Marketplace surface)

### `/` — `src/app/page.tsx`
Renders `<HomePage>` (the `/home` page). No logic.

### `/home` — `src/app/home/page.tsx`
Static marketing. Hero ("Streamline Your Legal Practice Management") + `Carousel`,
4 feature `Card`s, FAQ `Accordian`. No data/auth. Positioned as practice
management.

### `/about-us` — `src/app/about-us/page.tsx`
**⚠ legacy** placeholder stub — centered `<h1>About Us page here</h1>`.

### `/support` — `src/app/support/page.tsx`
Static support page; `mailto:lawsomesupport@etrilliumtech.com`.

### `/pricing` — `src/app/pricing/page.tsx`
Static **"Pricing Coming Soon"** page; contact mailto. **FR-flag: no pricing
logic — already compliant.**

### `/search` — `src/app/search/page.tsx` (+ `filters and layout/`, `loading.tsx`)
Legal-expert directory search. `SearchComponent`: Google Places location field
(**FR-flag: hardcoded `country:in`, `types:(cities)`**), auto-geolocation,
"By Domain" (expert types via `GET /api/v1/legalexperts/types`), type/name select,
free-text → `POST /api/v1/legalexperts/search/basic`. `FilterSection`: card/list
toggle (`ProfileCard`/`ProfileListCard`), experience filter, **ratings filter
non-functional**, consultation-type filter; sorts by experience; fees shown
"Rs {n}". `/view-profile` nav **commented out (⚠ dead)**. Restores results from
`sessionStorage`.

---

## C. Auth & registration (Marketplace surface)

### `/auth` — `src/app/auth/page.tsx` (post-Google-login dispatcher)
Not a login page — routes after Google login by `role` query. Reads JWT email
claim. Branches: **client** → `GET /clients/email/{email}` → store + redirect or
`/register?role=client`; **legalexpert** → `GET /legalexperts/email/{email}` →
`registrationstage` → **`/dashboard`** (⚠ route missing) or `/register`;
**organizationuser** → `fetchOrganizationByUserEmail` → `/organization/{id}` or
resolve site → `/organization/{id}/sites/{siteId}[/users/{userId}]` or
`/register?role=organizationuser`. Error → "Back to Home". Contains debug
`console.log`.

### `/register` — `src/app/register/page.tsx`
Role-based registration (`client` | `legalexpert` | `organizationuser`).
- **client:** Full Name, Email (**FR-flag: `@gmail.com`-only**), Gender, Phone →
  `POST /clients/register` → `/success`.
- **legalexpert:** Full Name, Email (read-only), Phone, Expert Type → sends OTP
  `POST /verifications/phonenumber/{phone}` (header `AAT:true`) →
  `/register/otp`. **FR-flag: OTP path.**
- **organizationuser:** 2-step wizard. Step 1 Org: name, email, org phone,
  **Organization Key** (max 5, live availability `checkOrgKeyAvailability`),
  **Segments** (multiselect, hardcoded `['Legal','Insurance']`), description.
  Step 2 Admin: name, phone, gender + Google button →
  `POST {API}/api/auth/register-organization` `{...org, administrator*,
  googleIdToken}` → storeToken → `/auth?role=organizationuser`. Creates org only
  (**no first branch, no invites** — contrast onboarding mockup).

### `/register/otp` — `src/app/register/otp/page.tsx`
**⚠ legalexpert only.** 4-digit OTP, `POST /verifications/phonenumber/{phone}/
code/{otp}` → `POST /legalexperts/register` → `/success`. No resend. **FR-flag:
OTP path (spec §5 wants OTP removed).**

### `/success` — `src/app/success/page.tsx`
Success splash; 2s redirect by `userRole` (legalexpert→`/dashboard` ⚠ missing;
client→`/`; organizationuser→`/organization/{id}`).

### `/profile-complete` — `src/app/profile-complete/page.tsx`
Success splash; redirect by `from`/`step`. Some branches point at removed routes.

### `/not-found` — `src/app/not-found.tsx`
Custom 404 → "Back to Business" → `/`.

---

## D. Profile (mixed surface)

### `/profile` — `src/app/profile/page.tsx` (+ `layout.tsx`, `ProfileContent`)
Layout renders `OrgSidebar`+`OrgHeader` only when `?organizationId` present, else
error div. Shows current user's profile (`fetchCurrentUser` = `GET /users/me`) or
another user (`fetchSiteUser`/`fetchUser`), else falls back to `ProfileContent`
(public legal-expert profile — blurs Registration No./contact when
unauthenticated, fees "₹", `handleLogin` → `/appointments` ⚠ missing). Edit →
`EditUserModal`. "My Organization" card commented out.

---

## E. Admin dashboard (Marketplace surface) — `/admin-dashboard/*`

`page.tsx` → server `redirect('/admin-dashboard/legal-experts')`. `AdminHeader`
tabs. **No route-level auth guard** (pages render for anyone; APIs are authed).
All list pages use `useListQuery` + `ListFooterPager` + `filters/*` +
`PagedResponse` via `admin-dashboard/services/api.ts`.
- **legal-experts:** `fetchLegalExperts` `GET /legalexperts`. Filters search /
  Expert Type / Approval Status. Columns Sr/Name/Phone/Location/Email/Type/Clients/
  Upcoming/Past/Fees.
- **client-list:** `fetchClients` `GET /clients`. Filters search / Status.
- **appointment-list:** tabs Future/Completed; `fetchPendingAppointments` +
  `fetchPastAppointments`; DateRangeFilter.
- **payment-list:** **⚠ never fetches (always empty)**; mock autocomplete data;
  download = console.log only.
- **deactivate-popup:** **⚠ isolated demo**; buttons only `handleClose`.

---

## F. ERP org area — shell & dashboard

### `/organization/[id]` layout — `src/app/organization/[id]/layout.tsx`
`OrgSidebar` + `OrgHeader` + scrollable `<main>`. `mobileOpen` drawer state. No
data/RBAC in layout itself; nav + role resolution live in `OrgSidebar`/`OrgHeader`.
Tab visual spec in `tabs-styles.ts` (`tabStyles`).

### `/organization/[id]` — `src/app/organization/[id]/page.tsx` (org dashboard)
**Data:** `fetchOrganization`, `fetchOrganizationUsers`, `fetchOrganizationSites`,
`fetchOrganizationHearings`, `fetchOrganizationCases` ×4 statuses (Promise.allSettled;
org fetch fatal, rest degrade). Dispatches `setOrganizationRole`.
**RBAC:** `canEditOrganizationDetails` (OrgAdmin||OrgClerk) gates 3-dot Edit/Delete
menu; delete gated by SystemAdmin (`canDeleteOrganization`). `isOrganizationClerk`
→ restricted-access dialogs on stat clicks; `canViewHearings` → Hearings stat.
**UI:** `PageHeaderCard` (courthouse icon, expand/collapse details: segments, org
key, created date, contact, description). Onboarding (0 sites & 0 cases): "Create
Your First Site" + "Add Users". Else `OrgStatsCards` (Total Cases / Active Users /
Upcoming Hearings / Resolved) + `CaseStatusPieChart` + `FirmGrowthLineChart`
(placeholders at 0 cases). Quick Actions menu (Add User/Site/Case). Modals:
`EditOrganizationModal`, `DeleteConfirmationModal`, `AddSiteModal`, `AddUserModal`,
`AddCaseModal`, 2 restricted dialogs.
**Edit-org validation:** name required; email `@gmail.com`-only; phone pattern;
server 400 `errors` mapped to fields.
**States:** loading spinner; error card + Retry (`reload()`); null org card.
Stray `console.log`.

---

## G. ERP org area — Sites (Branches)

### `/organization/[id]/sites` — `.../sites/page.tsx`
Thin shell: gradient header "Sites" + "Add Site" button (opens `AddSiteModal`) +
`SiteManagementTab` (hideAddButton, refreshKey). No page-level RBAC.

### `SiteManagementTab` (list body) — `organization/components/SiteManagementTab.tsx`
`fetchOrganizationSites(orgId, listParams)` → `PagedResponse<Site>`.
`useListQuery`: defaultSort name:asc, sortableFields name/createdDate/status,
filterKeys `['search']`. Grid (default) / table (`SitesTable`, ssr:false) toggle.
`TextSearchFilter` "Search sites by name…"; grid sort Select; clear-filters.
`ListFooterPager`. Card click → `/organization/{org}/sites/{siteId}`. States:
loading / error (classifyListError buckets) / empty (`SearchOff`).

### `/organization/[id]/sites/[siteId]` — `.../sites/[siteId]/page.tsx` (site dashboard)
**Data (loadAllData):** `fetchSite`, `fetchSiteUsers`, `fetchSiteHearings`,
`fetchSiteCases`, lazy `fetchUserBasicInfo` for names. **This is the de-facto
site cases surface** (owns AddCaseModal, per-case edit/delete gating, delete
flows) but renders stats+charts, not a cases table.
**RBAC:** `canEditSites` (OrgAdmin/OrgClerk/SiteAdmin/SiteClerk), `canDeleteSites`
(OrgAdmin), `canViewCases/Hearings`, `canDeleteCases` (OrgAdmin/SiteAdmin).
Breadcrumbs hidden for SiteAdmin/legal experts.
**UI:** `PageHeaderCard` (welcome vs dashboard title by emptiness; expand details:
site key, created, contact, address, landmark chip, description). Onboarding cards
(0 cases): Add Users / Add a Case. `OrgStatsCards` (metrics: totalCases,
upcomingHearings, casesThisMonth, activeUsers excl org roles, resolvedCases;
clicks route to `/cases?siteId=` etc. or restricted dialog for clerk). Charts.
Quick Actions + Site Actions menus. Modals: `EditSiteModal`, `AddUserModal`,
`AddCaseModal`, 3× `DeleteConfirmationModal` (site→ delete + `/organization/{org}`;
user; case), 2 restricted dialogs. States: loading / error + Retry / "Site Not
Found" + Back to Sites.

### `AddSiteModal` / `EditSiteModal` — `components/modals/`
All fields required. **Add:** name(100), **siteKey(5, immutable, live availability
`checkSiteKeyAvailability` GET `/{org}/sites/keys/{key}/availability`, idle/checking/
available/unavailable machine)**, emailId(email,254), phoneNumber(phone),
description(500), address (**`AddressAutocomplete` Google Places** auto-fills
locality/district/state/pincode), locality/district/state(100), pincode(`^\d{6}$`),
landmark(100). `createSite` POST / `updateSite` PUT. **Edit** = same minus siteKey.
Errors: `extractApiErrors` alert + `extractFieldErrors` per-field.

---

## H. ERP org area — Cases & Case Workspace

### `/organization/[id]/cases` — `.../cases/page.tsx` (unified org+site cases list)
**No standalone site-cases route** — this page serves both via `?siteId=`.
Mode: `isOrgMode = isOrganizationAdmin`; `isSiteMode` = any Site* role; `?siteId=`
forces site mode; site users w/o siteId resolved via `fetchOrganizationUserSites`;
**OrgClerk sees no cases**.
**Data:** `fetchOrganizationCases` / `fetchSiteCases`; `fetchOrganizationUsers`/
`fetchSiteUsers` (assignee opts); `fetchOrganizationSites` (Site filter, org mode).
`useListQuery`: defaultSort createdDate:desc, sortableFields createdDate/title/
caseNumber/status, filterKeys status/siteId/assignedExpertId/clientId/search.
**Table** (`CasesTable`, ssr:false) columns: Case Title (sortable), Case Key,
Case Number (sortable), CNR Number, Site (org mode), Status (sortable StatusChip),
Assigned To, Actions (**not passed here → no per-row actions**). Client re-sorts
by status order.
**Filters:** search; Status `EnumSelectFilter`; Site `EntityRefFilter` (org mode);
Assigned To `EntityRefFilter`. `clientId`/`from`/`to` filters **type-only, no UI
(⚠ roadmap)**. Row click → `/organization/{org}/sites/{siteId}/cases/{caseId}`.
Add Case button (canEditCases) → `AddCaseModal`. States loading/empty/error.

### `AddCaseModal` — `components/modals/AddCaseModal.tsx` (primary creation)
Title(200 req), Case Number(100 opt), **CNR(100 opt, tooltip = India eCourts
16-char id)**, Site (req, org mode), Assigned To (req; org mode disabled until
site chosen), Description. `createCase` (no `status`). Dispatches window
`ecourts-quota-refresh`. Used by org cases page + site dashboard.

### `/organization/[id]/sites/[siteId]/cases/new` — `.../cases/new/page.tsx`
**⚠ legacy full-page form** (no inbound links found; primary path is the modal).
Fields title(200 req)/description(500)/caseNumber(50 req)/status(default Open)/
assignedToId(req). **No CNR field** (state kept, sent empty). `createCase` →
dispatch `ecourts-quota-refresh` → `/organization/{org}/sites/{siteId}#cases`.
Inconsistencies vs modal: sends `status`; caseNumber cap 50 vs 100.

### `/organization/[id]/sites/[siteId]/cases/[caseId]` — case workspace (APPROVED ref)
**Shell** (`page.tsx`): tabs via MUI `Tabs` scrollable, single source `caseTabs.ts`
(`getCaseTabKeys/Index`). Tab order (no CNR): Overview, References, Clients, Tasks,
Documents, Hearings, Comments, Invoice. **eCourts tab inserted at index 1 only
when `hasCnrNumber`.** Contributors = header indicator + Overview card (not a tab).
Initial tab from `?tab=` (only tasks/hearings/references honored). **RBAC** via
`useCaseAccess` → two booleans threaded to tabs: `canCreateOrEditResource`
(resource≥Edit), `canDeleteResource` (resource===Full). No tab hidden; controls
inside gate. Header actions: `ContributorsHeaderIndicator`; **Link CNR** button
(`!hasCnrNumber && canCreateOrEditResource`) → Popover → `linkCnrCourtData`
(**eCourts**). `handleDeleteCase` → `deleteCase` → site `#cases`. Breadcrumbs
role-aware. `CaseAIChat` floating (**AI, env-gated**). Contributor orchestration:
`addContributor`/`refetchAvailableUsers`, `relatedUserIds`, `onContributorsChanged`
(assign task/hearing may auto-grant assignee). States: loading / "No Access" (amber,
FR-023) / "Case Not Found".

**CaseHeader** (`components/CaseHeader/`): Case Key, CNR (if hasCnrNumber), Created
Date, assigned user, Status chip; 3-dot menu (`canEditCase`/`canDeleteCase`):
Edit → `EditCaseModal`, Delete → `DeleteConfirmationModal`.

**Edit Case page** (`edit/page.tsx`, Tailwind full-page): title(200 opt)/
description(500)/caseNumber(req)/status(req)/assignedToId(req); cnrNumber loaded
but no field. `updateCase` → dispatch `ecourts-quota-refresh` → `returnTo` or case
page.

**Overview** (`CaseOverview`): Description card, `CaseSummarySection` (**AI,
env-gated**), Clients/Tasks/Hearings overview cards (counts + status chips → filter
+ navigate; Add gated by canCreateOrEditResource), `ContributorsCard`.

**Tabs (container/presentation + `useCase*` hook + `useListQuery`):**
- **TasksTab:** `useCaseTasks` (fetch/add/update/delete + task docs + task comments).
  Columns Title/Status/Assignee/Due/Description/Documents. Filters search/Status/
  Assignee; sort; pager. Add/Edit modals (`AddTaskModal`/`EditTaskModal` tabbed with
  docs + `TaskCommentsTab`). Contributor-grant field gated by relatedUserIds.
  Confirm-delete for task + doc.
- **HearingsTab:** `useCaseHearings`. Columns Date&Time/Location/Status(StatusChip)/
  Assignee/Notes. `HearingModal` add/edit; confirm-delete (name=`where`).
- **ClientsTab:** `useCaseClients` (+ `inviteCaseClient`). Columns Name/Email/Phone/
  Remarks. `AddClientModal`/`EditClientModal`. Client-side search.
- **DocumentsTab:** `useCaseDocuments`. Base64 upload (pdf/doc/docx/txt/png/jpg),
  card rows, download always, delete (canDeleteResource) **fires immediately, no
  confirm**. Filters search/Type; info box points task docs → Tasks tab.
- **CommentsTab:** `useCaseComments`. Threaded comments+replies; author via JWT
  `sub`; edit/delete gated. Category/priority derived heuristically (decorative).
- **TaskCommentsTab:** same, task-scoped, inside Task Edit modal; **no access-gating
  props** (author-only).
- **InvoiceTab:** `useCaseInvoices`. Summary cards (`formatRupees`). Columns Invoice#/
  Amount/Status/Generated/Due/Actions (Mark as Paid, Download if content).
  `GenerateInvoiceModal`/`EditInvoiceModal`. **⚠ filter labels (Pending/Paid/
  Overdue/Cancelled) mismatch enum (None/Pending/Failed/Paid).**
- **ReferenceCaseTab (eCourts):** `fetchReferenceCases`/`addReferenceCase`/
  `deleteReferenceCase`. Add CNR via Popover; CNR chip → `/organization/{org}/
  ecourt/{cnr}?siteId=&caseId=`. Delete **immediate, no confirm**.
- **EcourtTab (eCourts, CNR-only tab):** `fetchCaseCourtData` → `EcourtDetailsView`;
  refresh `updateCaseCourtData` → dispatch `ecourts-quota-refresh`. Read+refresh
  only.

**Case AI (all FR-flag / env-gated):** `CaseAIChat` ("Ask Neeti", Beta,
`sendCaseChatMessage`), `CaseSummarySection` (`fetchCaseSummary`), and the AI
Summary/Legal Analysis/Arguments/Insights tabs + AI-processed judgment markdown in
`EcourtDetailsView` (only when `aiAnalysis` present).

---

## I. ERP org area — Users (Lawyers/Staff)

### `/organization/[id]/users` — `.../users/page.tsx`
Dual org/site mode (`?viewSiteId=`, else by role; site users w/o viewSiteId resolve
own site). `canAddUser` gates header Add User → `AddUserModal`. `showSiteColumn` =
OrgAdmin only. Renders `UserManagementTab`.

### `UserManagementTab` — `organization/components/UserManagementTab.tsx`
`fetchOrganizationUsers`/`fetchSiteUsers` (+ `fetchOrganizationSites` for Site
filter, org mode). `useListQuery`: defaultSort name:asc, sortableFields name/email/
createdDate/role, filterKeys (site) role/status/search | (org) +siteId. **Status
filter key wired but no UI control.** Grid/table (`UsersTable`) toggle. Filters
search/Site(org)/Role(`EnumSelectFilter`). Rich per-user RBAC: `canEditUserFn`/
`canDeleteUserFn` (self-edit; OrgAdmin-only targets; SiteAdmin via canActOnSiteAdmin;
site mode excludes org-level users). Row click → `EditUserModal` or "not
authorized" dialog for OrgClerk on org-level user.

### Add/Edit user surfaces (dual: full-page routes + modals)
- **`/users/new`** (+ site variant re-export) — full-page create; fields fullName(100)/
  emailId(email,254)/phoneNumber(phone)/gender/role. Role options by mode + create
  perms. Gender **Non-Binary↔Transgender** transform; org roles space-stripped.
  `createUser`/`createSiteUser` → `#users`.
- **`AddUserModal`** — primary create; adds Site dropdown (org mode, HQ sentinel
  `__hq__`, `hideHeadOffice` for OrgClerk); role options depend on site/HQ +
  canCreateAdmin/Clerk.
- **`/users/[userId]/edit`** (org) / **`/sites/[siteId]/users/[userId]/edit`** (site)
  — full-page edit; Email disabled; Role disabled ("cannot be modified"); roles
  still sent.
- **`EditUserModal`** — primary edit/delete; auto-detects org vs site via target's
  `siteId` (Guid.Empty = absent); Delete (canDelete) → `DeleteConfirmationModal`.

### `/organization/[id]/sites/[siteId]/users/[userId]` — site user personal dashboard
**Self-only** (`currentUserId===userId`; else Access Denied). Requires site role.
`fetchUserCaseSummary` (cases/tasks/hearings filtered to site). StatCards (Open
Cases/Pending Tasks/Upcoming Hearings). Cases section with filters + `CasesTable`
(edit if hasSiteRole, delete if canDeleteCases). Task pie + hearings line charts.
`AddCaseModal`/`EditCaseModal`.

> **No standalone site-users list route** (`/sites/[siteId]/users/page.tsx` absent);
> reached via `/users?viewSiteId=` or site dashboard `#users`.

---

## J. ERP org area — eCourts

### `/organization/[id]/ecourts` — `.../ecourts/page.tsx` (hub)
3 tabs (Search / Saved Cases / History) + Refresh button (non-Search tabs). No RBAC.

- **SearchTab** (`components/SearchTab.tsx`): search-type tabs (CNR/Case Number/
  Advocates/Judges/Petitioners/Respondents/Litigants). CNR mode: single field →
  `fetchCnrCourtData` (fallback `fetchCaseCourtData`) → `CnrResultDetail`. Others:
  cascading **State**(`fetchCauselistStates`)/**District**(`fetchCauselistDistricts`)
  selects, Case Status radios, name + year(1950..now) → `searchEcourts` →
  `CaseResultCard` list + `ListFooterPager`. **QuotaBanner** (`fetchEcourtsQuota`:
  unlimited or consumed/limit progress, Low/Exhausted chips — **eCourts quota**,
  server-enforced). Full state persisted to `sessionStorage['ecourts-search-{orgId}']`.
- **SavedCasesTab** (`components/SavedCasesTab.tsx`): `fetchPersistedEcourtCases` →
  table (CNR/Title/Court/Status/Linked Case/References/Remarks/Last Refreshed).
  Bulk select + `deletePersistedEcourtCase` (ConfirmDialog). LinkedCaseCell →
  `linkCnrCourtData` (from `fetchUnlinkedCases`). ReferenceCaseCell →
  `addReferenceCase`. RemarksCell → `updatePersistedCaseRemarks` on blur. **All
  eCourts write flows.**
- **HistoryTab** (`components/HistoryTab.tsx`): `fetchSearchHistory` read-only log;
  row → CNR page.

### `/organization/[id]/ecourt/[cnrNumber]` — standalone CNR viewer
`fetchCnrCourtData` (fallback `fetchCaseCourtData`). **Refresh** `updateCnrCourtData`
→ dispatch `ecourts-quota-refresh` (**eCourts sync**). **Save/Retain**
`activateCnrCourtData` → `isSaved`. Breadcrumbs role-aware (clickable for org
users). Renders `EcourtDetailsView`.

### `EcourtDetailsView` — `organization/components/EcourtDetailsView/`
Tabbed court-data renderer. **Case Info** always (snapshot, key dates, parties,
proceedings stats, hearing history, interim orders + PDF download, IAs, judgments,
FIR/subordinate, filed docs, system record). **AI tabs (FR-flag, only when
`aiAnalysis`):** AI Summary, Legal Analysis, Arguments (`ConfidenceBar`), Insights,
Judgment (markdown + fallback "AI-processed … not yet available"). Downloads via
injected `downloadFn` (`downloadCnrCourtDocument`/`downloadCourtDocument`).

---

## K. ERP org area — Hearings (Cause List)

### `/organization/[id]/hearings` — `.../hearings/page.tsx`
`fetchOrganizationHearings` + `fetchOrganizationSites` (Site filter). **RBAC:
`canViewHearings`** else "Access Restricted". `useListQuery`: defaultSort
hearingDate:asc, sortableFields hearingDate/createdDate, filterKeys from/to/siteId/
court. Filters `DateRangeFilter`/Site `EntityRefFilter`/court `TextSearchFilter`.
MUI Table, `SortableColumnHeader`, columns Date&Time/Case/Site/Location/Status
(STATUS_STYLES)/Assigned/Notes. Row → case `?tab=hearings`. Reads
`hearingStatus||status`.

### `/organization/[id]/sites/[siteId]/hearings` — `.../sites/[siteId]/hearings/page.tsx`
`fetchSiteHearings`. Same RBAC. filterKeys from/to/court (no Site). Raw `<table>`,
sort via **Select** (not headers), no Site column. Reads `status||hearingStatus`.
Row → case `?tab=hearings`.

---

## L. Test & CI baseline

Unit/component (vitest, 7): `utils/pagination.test`, `ListFooterPager.test`,
`useCaseAccess.test`, `useListQuery.test`, modals `AddContributorModal.test` +
`EditContributorAccessModal.test`, `useAvailableContributorUsers.test`. E2E
(playwright, 4, self-skip w/o env): `contributors`, `case-access`,
`pagination-sorting-filtering`, `assignment-contributor` (+ `helpers/env.ts`).
**No CI workflow** (only a bug-report issue template); husky `pre-commit` is
commented out.
