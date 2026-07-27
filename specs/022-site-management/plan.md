# Implementation Plan: Site Management

**Branch**: `022-site-management` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/022-site-management/spec.md`

---

## 1. Overview

### What Exists
- `src/app/organization/services/api.ts`:
  - `fetchOrganizationSites(orgId)` → `GET /organizations/{id}/sites`
  - `fetchSite(orgId, siteId)` → `GET /organizations/{id}/sites/{siteId}`
  - `createSite(orgId, payload)` → `POST /organizations/{id}/sites` (spec 003)
  - `updateSite(orgId, siteId, payload)` → `PUT /organizations/{id}/sites/{siteId}`
  - `deleteSite(orgId, siteId)` → `DELETE /organizations/{id}/sites/{siteId}`
  - `fetchSiteUsers(orgId, siteId)` → `GET /organizations/{id}/sites/{siteId}/users`
- `src/app/organization/components/SiteManagementTab.tsx` — 539-line CRUD interface with modals for add/edit/delete.

### Gaps to Close
1. **RBAC verification**: Confirm edit/delete button visibility is correctly gated:
   - Edit: OrgAdmin, OrgClerk, SiteAdmin, SiteClerk (not SiteLegalExpert, SiteSrLegalExpert).
   - Delete: OrgAdmin and SystemAdmin only.
2. **"Has users" delete guard**: Confirm the error message `"This site has assigned users. Please remove all users before deleting the site."` is shown when backend returns the relevant error.
3. **Map picker on edit**: Confirm Google Maps coordinate picker is included in `EditSiteModal`.
4. **SiteLegalExpert read-only view**: Confirm legal experts see site details but no edit controls.
5. **All-sites list restriction**: OrgAdmin sees all sites; site-level roles see only their assigned site(s).
6. Add unit and E2E tests.

### What Is New
- Unit tests: `SiteManagementTab.test.tsx`
- E2E test: `e2e/022-site-management.spec.ts`

---

## 2. Architecture Flow

### 2.1 View All Sites (OrgAdmin)

```
OrgAdmin on /organization/{orgId}/sites
  → SiteManagementTab mounts
  → fetchOrganizationSites(orgId)
      → GET /organizations/{orgId}/sites
  → loading → <LoadingState />
  → list: site name, address summary, status badge (Active/Inactive), action buttons
  → edit/delete buttons rendered conditionally by role
```

### 2.2 Site-Level Role View (own site only)

```
SiteAdmin on /organization/{orgId}/sites/{siteId}/settings
  → fetchSite(orgId, siteId)
      → GET /organizations/{orgId}/sites/{siteId}
  → displays own site details only
  → SiteAdmin/SiteClerk: Edit button visible
  → SiteLegalExpert/SiteSrLegalExpert: read-only (no edit button)
  → No "all sites" list shown
```

### 2.3 Update Site

```
Authorized user clicks "Edit Site"
  → EditSiteModal opens with current values pre-filled
  → Fields: name, address (street, city, state, pincode), contact info, active toggle, coordinates (Google Maps picker)
  → onBlur → validateSingleField
  → Submit → updateSite(orgId, siteId, payload)
      → PUT /organizations/{orgId}/sites/{siteId}
  → 200 → showSuccess → refresh site data
  → 400 → inline errors from extractApiErrors
```

### 2.4 Delete Site

```
OrgAdmin clicks "Delete Site"
  → ConfirmDialog:
      "Are you sure? This will permanently delete the site and all its cases."
  → Admin confirms
  → deleteSite(orgId, siteId)
      → DELETE /organizations/{orgId}/sites/{siteId}
  → 204 → site removed from list → showSuccess
  → 409 or 400 (has users) → showError: "This site has assigned users. Please remove all users before deleting the site."
  → Other error → showError generic
```

### 2.5 RBAC Gate

```
SiteManagementTab / site settings page renders
  → useUserRole(orgId) → role determined
  → Edit button: {(isOrgAdmin || isOrgClerk || isSiteAdmin || isSiteClerk) && <EditButton />}
  → Delete button: {(isOrgAdmin || isSystemAdmin) && <DeleteButton />}
  → All-sites list: {(isOrgAdmin || isSystemAdmin || isOrgClerk) && <SitesList />}
  → Single site view: site-level roles see own site only
```

---

## 3. File Structure

### Documentation
```
specs/022-site-management/
  spec.md                         NO CHANGE
  plan.md                         NEW (this file)
  research.md                     NEW
  data-model.md                   NEW
  contracts/
    api-contracts.md              NEW
```

### Source Tree
```
src/app/organization/
  components/
    SiteManagementTab/
      SiteManagementTab.tsx       VERIFY — RBAC gates, "has users" error, map picker
      EditSiteModal.tsx           VERIFY — Google Maps coordinate picker, all fields
      __tests__/
        SiteManagementTab.test.tsx  NEW

src/app/organization/[id]/sites/[siteId]/
  settings/
    page.tsx                      VERIFY/NEW — site-level users see own site read-only or with edit

src/app/organization/services/
  api.ts                          VERIFY — updateSite, deleteSite signatures

e2e/
  022-site-management.spec.ts     NEW
```

---

## 4. Component Design

### 4.1 `SiteManagementTab`
- **Purpose**: Displays list of all org sites (for org-level users) or own site (for site-level users).
- **Row actions**:
  ```typescript
  {canEdit && <IconButton onClick={() => openEdit(site)}><EditIcon /></IconButton>}
  {canDelete && <IconButton onClick={() => openDelete(site)}><DeleteIcon /></IconButton>}
  ```
  Where `canEdit = isOrgAdmin || isOrgClerk || isSiteAdmin || isSiteClerk` and `canDelete = isOrgAdmin || isSystemAdmin`.
- **Status badge**: MUI `<Chip label="Active" color="success" />` or `<Chip label="Inactive" color="default" />`.

### 4.2 `EditSiteModal`
- **Purpose**: Edit site fields including coordinate picker.
- **Props**: `{ site: Site, onSuccess: (updated: Site) => void }`
- **Fields**: Name, street address, city, state (dropdown from reference data), pincode, contact email, contact phone, active toggle, latitude/longitude (Google Maps picker).
- **Map picker**: `next/dynamic` loaded `@react-google-maps/api` component. User can drag a pin to set coordinates or use Places Autocomplete.
- **Validation**: Same schema as site creation (spec 003).

### 4.3 Delete Confirmation Dialog
- **Trigger**: `<ConfirmDialog open={deleteOpen} title="Delete Site" message="This will permanently delete the site and all its cases. This cannot be undone." onConfirm={handleDelete} onCancel={closeDelete} />`
- **Error handling**: If backend returns "has users" error, the dialog stays closed and `showError` is called with the specific message.

### 4.4 Site Settings Page (site-level role view)
- **Purpose**: Single-site detail page for SiteAdmin, SiteClerk, SiteLegalExpert.
- **RBAC**:
  - SiteAdmin/SiteClerk: Edit button visible
  - SiteLegalExpert/SiteSrLegalExpert: read-only

---

## 5. API Plan

| Method | URL | Auth | Request Body | Success | Error Codes | Status |
|--------|-----|------|--------------|---------|-------------|--------|
| `GET` | `/organizations/{orgId}/sites` | Bearer (OrgAdmin, OrgClerk, SysAdmin) | — | `{ data: Site[] }` 200 | 401, 403 | Existing |
| `GET` | `/organizations/{orgId}/sites/{siteId}` | Bearer | — | `{ data: Site }` 200 | 401, 403, 404 | Existing |
| `PUT` | `/organizations/{orgId}/sites/{siteId}` | Bearer (OrgAdmin, OrgClerk, SiteAdmin, SiteClerk, SysAdmin) | `UpdateSiteRequest` | `{ data: Site }` 200 | 400, 401, 403, 404 | Existing |
| `DELETE` | `/organizations/{orgId}/sites/{siteId}` | Bearer (OrgAdmin, SysAdmin) | — | 204 | 400 (has users), 401, 403, 404 | Existing |

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| SiteLegalExpert clicking Edit | Edit button hidden; backend enforces `[Authorize]` with role list |
| SiteClerk deleting a site | Delete button hidden for SiteClerk; backend 403 |
| Cross-site data for site roles | `fetchSite` uses `siteId` from URL; backend validates the user is assigned to that site |
| Contact email stored lowercase | `payload.contactEmail = email.toLowerCase()` before API call |
| Google Maps API key exposure | Key in env var `NEXT_PUBLIC_GOOGLE_API_KEY`; exposed to client (acceptable for Maps JS API — restricted by domain) |
| Cascade delete without awareness | Confirmation dialog explicitly states "all its cases" will be deleted |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `sites` list | `SiteManagementTab` (local) | Tab-scoped; not shared globally |
| `siteToEdit`, `siteToDelete` | `SiteManagementTab` (local) | Selection state for modals |
| `editModalOpen`, `deleteModalOpen` | `SiteManagementTab` (local) | Dialog visibility |
| `loading`, `error` | `SiteManagementTab` (local) | Async state |
| Role flags | `useUserRole` (Redux-derived) | Already global |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `SiteManagementTab.test.tsx` | OrgAdmin → Edit + Delete buttons visible | Both in DOM |
| `SiteManagementTab.test.tsx` | SiteLegalExpert → no Edit button | Button absent |
| `SiteManagementTab.test.tsx` | SiteClerk → Edit visible, Delete absent | Correct visibility |
| `SiteManagementTab.test.tsx` | Delete → ConfirmDialog shown | Dialog in DOM |
| `SiteManagementTab.test.tsx` | Delete "has users" error → error toast | `showError` called with specific message |
| `SiteManagementTab.test.tsx` | Edit submit → updateSite called | API mock invoked |
| `SiteManagementTab.test.tsx` | Sites list → rows match API response | Row count matches |
| `SiteManagementTab.test.tsx` | Empty sites → EmptyState shown | Empty state visible |

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| View all sites | OrgAdmin | Navigate to org sites | Sites list with status badges |
| Edit site name | OrgAdmin | Edit site, update name, save | New name displayed |
| Edit coordinates via map | SiteAdmin | Edit site, drag map pin, save | Coordinates updated |
| Delete site — golden path | OrgAdmin | Delete site, confirm | Site removed from list |
| Delete blocked — has users | OrgAdmin | Delete site with users | Error message shown, site remains |
| SiteLegalExpert — read-only | SiteLegalExpert | View site settings | No edit button visible |
| SiteAdmin own site only | SiteAdmin | Navigate to org sites list | Own site settings (no all-sites list) |

Test file: `e2e/022-site-management.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-001: Sites list within 2s for ≤20 sites | Lightweight GET on mount; `LoadingState` shown during fetch |
| SC-002: "Has users" guard | Error message surfaced from API immediately; no additional roundtrip needed |
| SC-003: Edit form pre-fills on first render | `EditSiteModal` receives current `Site` object as prop; pre-fill synchronous |
| SC-004: Legal expert read-only with no edit controls | Role check is synchronous; no flash of edit button |
| Google Maps load | `next/dynamic` with `ssr: false` to prevent SSR bloat on map component |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| Site list fetched | INFO | `orgId`, `userId`, count | — |
| Site updated | INFO | `orgId`, `siteId`, `userId`, fields changed (keys) | Field values |
| Site deleted | INFO | `orgId`, `siteId`, `userId` | — |
| Site delete rejected (has users) | WARN | `orgId`, `siteId`, reason | — |
| Unauthorized edit attempt | WARN | `userId`, `role`, `siteId` | — |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `SiteManagementTab` RBAC gates incomplete | Medium | High | Audit every action button in `SiteManagementTab.tsx` against spec role table |
| "Has users" error code not documented | Medium | Medium | Confirm backend error response for delete-with-users; map to user-friendly message in `errorHandler` |
| Google Maps picker not in `EditSiteModal` | Medium | Medium | Check if map component is in edit modal; add via `next/dynamic` if missing |
| State field uses reference data from spec 032 | Low | Low | Ensure states dropdown loads from the same reference data endpoint used in site creation |
| Cascading delete of cases surprises OrgAdmin | Medium | High | Confirmation dialog must explicitly state "all its cases will also be deleted" |
