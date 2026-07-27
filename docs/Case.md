# Cases Feature — Change Record

## 2026-03-30 — Initial Implementation

### `src/app/organization/types/index.ts`
- Added `siteName?: string` to the `Case` interface to reflect API response field.

### `src/app/organization/components/CasesTable.tsx`
- Full rewrite of existing stub.
- Columns reordered to match design: Case Title | Case Number | Site (optional) | Status | Assigned To | Actions.
- Removed "Created By" column.
- Added `showSiteColumn?: boolean` prop — shown only in org mode.
- Added `canEditCase` and `canDeleteCase` per-row permission props.
- Site name rendered from `c.siteName` (API-provided).
- `StatusChip` component retained.
- Actions remain as `MoreVert` dropdown menu (Edit / Delete).

### `src/components/modals/AddCaseModal.tsx`
- Created new modal for adding a case.
- Fields: Title*, Case Number*, Site* (org mode only), Assigned To*, Description (optional).
- In org mode: site dropdown fetched via `fetchOrganizationSites`; selecting a site loads site users for Assigned To.
- In site mode: Assigned To fetched via `fetchSiteUsers` on modal open.
- Calls `createCase(orgId, siteId, data)`.
- Uses `useFormValidation` with required/maxLength rules.

### `src/components/modals/EditCaseModal.tsx`
- Created new modal for editing a case.
- Fetches case data and site users in parallel on modal open (`fetchCase` + `fetchSiteUsers`).
- Fields: Title*, Case Number*, Status* (Open/InProgress/OnHold/Closed), Assigned To*, Description (optional).
- Calls `updateCase(orgId, siteId, caseId, data)`.

### `src/app/organization/[id]/cases/page.tsx`
- Full implementation replacing the stub `<div>cases</div>`.
- Role-based data fetching:
  - Org mode (OrgAdmin): `fetchOrganizationCases(orgId, '')` + `fetchOrganizationUsers`.
  - Site mode: resolve siteId via `fetchOrganizationUserSites` → `fetchSiteCases` + `fetchSiteUsers`.
- Client-side status sort: Open → InProgress → OnHold → Closed.
- Search filter: title + caseNumber (both modes); + siteName in org mode.
- Status dropdown filter: All Status | Open | InProgress | OnHold | Closed.
- Row click navigates to `/organization/[id]/sites/[siteId]/cases/[caseId]`.
- Permissions wired from `useUserRole`: `canEditCases` (Add + Edit), `canDeleteCases` (Delete).
- Modals: AddCaseModal, EditCaseModal, DeleteConfirmationModal.
