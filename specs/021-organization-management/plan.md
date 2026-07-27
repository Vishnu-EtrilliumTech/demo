# Implementation Plan: Organization Management

**Branch**: `021-organization-management` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/021-organization-management/spec.md`

---

## 1. Overview

### What Exists
- `src/app/organization/services/api.ts`:
  - `fetchOrganization(orgId)` → `GET /organizations/{id}`
  - `updateOrganization(orgId, payload)` → `PUT /organizations/{id}`
  - `deleteOrganization(orgId)` → `DELETE /organizations/{id}`
  - `fetchOrganizationCases(orgId, status)` → `GET /organizations/{id}/cases?status={status}`
  - `fetchUserCaseSummary(orgId, userId)` → `GET /organizations/{id}/users/{userId}/cases/summary`
- `src/app/organization/components/UserManagementTab.tsx` — existing org users CRUD UI.
- `src/app/organization/components/SiteManagementTab.tsx` — existing site CRUD UI.

### Gaps to Close
1. **Org Settings page**: Verify a page exists at `/organization/[id]/settings` displaying all org fields (name, contact email, phone, description, segments, active status). Build if missing.
2. **Edit org form**: Verify `updateOrganization` is wired to an edit form. The segments field must support multi-value (MUI Autocomplete with chips or similar).
3. **Delete confirmation**: Verify `deleteOrganization` triggers a confirmation dialog with permanent-deletion warning. Visible only to SystemAdmin.
4. **Org-level Cases view**: Verify `/organization/[id]/cases` lists all cases across all sites. Accessible only to OrgAdmin and OrgClerk.
5. **Personal dashboard summary** (P3): Verify `fetchUserCaseSummary` is used on the SiteLegalExpert dashboard (aligned with spec 020).
6. **RBAC gates**: Site-level roles must not see edit/delete controls.
7. Add unit and E2E tests.

### What Is New
- If org settings page or edit modal is missing: build them.
- Unit tests: `OrgSettingsPage.test.tsx`, `OrgCasesPage.test.tsx`
- E2E test: `e2e/021-organization-management.spec.ts`

---

## 2. Architecture Flow

### 2.1 View Organization Details

```
OrgAdmin navigates to /organization/{orgId}/settings
  → OrgSettingsPage mounts
  → useUserRole(orgId) → any org or site member (all can view)
  → fetchOrganization(orgId)
      → GET /organizations/{orgId}
  → loading → <LoadingState />
  → success → display fields: name, email, phone, description, segments chips, active badge
  → if isOrgAdmin || isOrgClerk → show "Edit" button
  → if isSystemAdmin → show "Edit" + "Delete" buttons
  → if site roles → read-only (no buttons)
```

### 2.2 Update Organization

```
OrgAdmin clicks "Edit Organization"
  → EditOrgModal opens with current values pre-filled
  → User edits fields (name, email, phone, description, segments)
  → onBlur → validateSingleField
  → Submit → validate(form)
  → updateOrganization(orgId, payload)
      → PUT /organizations/{orgId}
  → 200 → showSuccess → update local org state
  → 400 → extractApiErrors → display inline errors
  → Server conflict (email in use) → showError from API message
```

### 2.3 Delete Organization

```
SystemAdmin clicks "Delete Organization"
  → ConfirmDialog opens:
      "Are you sure? This will permanently delete the organization and all its data."
  → Admin confirms
  → deleteOrganization(orgId)
      → DELETE /organizations/{orgId}
  → 204 → showSuccess → redirect to /admin/organizations
  → error → showError
```

### 2.4 View Org-Level Cases

```
OrgAdmin navigates to /organization/{orgId}/cases (or Cases tab)
  → useUserRole(orgId) → isOrgAdmin || isOrgClerk || isSystemAdmin
  → if unauthorized (site roles) → access denied
  → fetchOrganizationCases(orgId, statusFilter?)
      → GET /organizations/{orgId}/cases?status={status}
  → loading → <LoadingState />
  → cases list with: case title, case number, site name, status badge, last updated
  → empty → <EmptyState message="No cases across this organization yet." />
```

### 2.5 RBAC Gate Summary

```
Page renders
  → useUserRole(orgId) resolves role
  → OrgAdmin/OrgClerk: read + edit (no delete)
  → SystemAdmin: read + edit + delete
  → SiteAdmin/site roles: read-only (view org details, but no edit, no delete, no org cases)
```

---

## 3. File Structure

### Documentation
```
specs/021-organization-management/
  spec.md                         NO CHANGE
  plan.md                         NEW (this file)
  research.md                     NEW
  data-model.md                   NEW
  contracts/
    api-contracts.md              NEW
```

### Source Tree
```
src/app/organization/[id]/
  settings/
    page.tsx                      VERIFY/NEW — OrgSettingsPage
    components/
      OrgDetailsCard.tsx          VERIFY/NEW — displays org fields
      EditOrgModal.tsx            VERIFY/NEW — edit form with segments multi-select
      __tests__/
        OrgSettingsPage.test.tsx  NEW
  cases/
    page.tsx                      VERIFY/NEW — OrgCasesPage (all cases across all sites)
    __tests__/
      OrgCasesPage.test.tsx       NEW

src/app/organization/services/
  api.ts                          VERIFY — fetchOrganization, updateOrganization, deleteOrganization, fetchOrganizationCases

src/app/organization/types/
  index.ts                        VERIFY — Organization interface has all required fields

e2e/
  021-organization-management.spec.ts  NEW
```

---

## 4. Component Design

### 4.1 `OrgSettingsPage`
- **Purpose**: Root page for org settings.
- **Layout**: Two-column: left = org details, right = actions (Edit, Delete for SystemAdmin).
- **Props**: Derived from `orgId` URL param.

### 4.2 `OrgDetailsCard`
- **Purpose**: Read-only display of all org fields.
- **Fields**: Name, contact email, phone, description, segments (chips), active status badge.
- **Segments**: Rendered as MUI `<Chip>` components in a flex-wrap row.

### 4.3 `EditOrgModal`
- **Purpose**: Edit org details.
- **Props**: `{ org: Organization, onSuccess: (updated: Organization) => void }`
- **Fields**:
  - Name: `<TextField required />`
  - Contact Email: `<TextField type="email" />`
  - Contact Phone: `<TextField />`
  - Description: `<TextField multiline />`
  - Segments: MUI `<Autocomplete multiple freeSolo />` — allows adding/removing segment strings
- **Validation**: `useFormValidation` with org update schema.

### 4.4 `OrgCasesPage`
- **Purpose**: Lists all cases across all sites within the org.
- **Props**: `orgId` from URL.
- **Table columns**: Case title, Case number, Site name, Status, Last updated, Actions.
- **Access guard**: `isOrgAdmin || isOrgClerk || isSystemAdmin` — others see access denied.
- **Pagination**: Server-side pagination using `page` + `pageSize` query params.

---

## 5. API Plan

| Method | URL | Auth | Request Body | Success | Error Codes | Status |
|--------|-----|------|--------------|---------|-------------|--------|
| `GET` | `/organizations/{orgId}` | Bearer | — | `{ data: Organization }` 200 | 401, 403 | Existing |
| `PUT` | `/organizations/{orgId}` | Bearer (OrgAdmin, OrgClerk, SysAdmin) | `UpdateOrganizationRequest` | `{ data: Organization }` 200 | 400, 401, 403, 409 | Existing |
| `DELETE` | `/organizations/{orgId}` | Bearer (SysAdmin only) | — | 204 | 401, 403, 404 | Existing |
| `GET` | `/organizations/{orgId}/cases` | Bearer (OrgAdmin, OrgClerk, SysAdmin) | `?status=&page=1&pageSize=20` | `{ items, totalCount, page, pageSize }` | 401, 403 | Existing |
| `GET` | `/organizations/{orgId}/users/{userId}/cases/summary` | Bearer | — | `{ data: { cases, caseTasks, caseHearings } }` | 401, 403 | Existing |

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| Site-level roles editing org details | Edit button hidden via role check; backend enforces `[Authorize]` at PUT endpoint |
| Delete button visible to OrgAdmin | `{isSystemAdmin && <DeleteButton />}` — only rendered for SystemAdmin |
| Contact email collision (409) | Backend returns error; frontend displays whatever message the API returns |
| XSS in org description or segments | Controlled MUI inputs; never rendered via `dangerouslySetInnerHTML` |
| SiteAdmin accessing `/organization/{orgId}/cases` | Role check on page mount → access denied; backend returns 403 |
| Permanent deletion without confirmation | `ConfirmDialog` required; delete API only called after user confirms |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `org` (Organization object) | `OrgSettingsPage` (local) | Page-scoped; not shared globally |
| `loading`, `error` | `OrgSettingsPage` (local) | Async state |
| `editModalOpen` | `OrgSettingsPage` (local) | UI visibility; ephemeral |
| `cases` list | `OrgCasesPage` (local) | Page-scoped, paginated |
| Role flags | `useUserRole` (Redux-derived) | Already global |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `OrgSettingsPage.test.tsx` | OrgAdmin role → Edit button visible, Delete hidden | Correct button visibility |
| `OrgSettingsPage.test.tsx` | SystemAdmin role → Edit + Delete visible | Both buttons in DOM |
| `OrgSettingsPage.test.tsx` | SiteAdmin role → no Edit or Delete | Both absent |
| `OrgSettingsPage.test.tsx` | Edit form submit → updateOrganization called | API mock invoked |
| `OrgSettingsPage.test.tsx` | Delete → ConfirmDialog shown before API call | Dialog in DOM |
| `OrgCasesPage.test.tsx` | OrgAdmin → cases list loads | Case rows visible |
| `OrgCasesPage.test.tsx` | SiteAdmin role → access denied shown | Access denied text |
| `OrgCasesPage.test.tsx` | No cases → EmptyState shown | Empty state visible |

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| View org details | OrgAdmin | Navigate to settings | All fields displayed |
| Edit org name | OrgAdmin | Edit, update name, save | New name displayed |
| Delete org | SystemAdmin | Delete, confirm | Org removed, redirected |
| View org cases | OrgAdmin | Navigate to org cases | Cases from all sites listed |
| Site role access denied | SiteAdmin | Navigate to org cases URL | Access denied shown |
| Empty org cases | OrgAdmin | New org with no cases | EmptyState visible |

Test file: `e2e/021-organization-management.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-001: Org page within 2s | `fetchOrganization` is a lightweight single-record GET |
| SC-002: Org cases within 3s for ≤10 sites | Server-side pagination with `pageSize=20`; backend uses `.Select()` DTO projection |
| Segments multi-select | Client-side MUI Autocomplete; no extra API calls |
| Org cases pagination | Page-by-page load; "Load more" or page controls |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| Org details fetched | INFO | `orgId`, `userId` | Org description, segments |
| Org updated | INFO | `orgId`, `userId`, fields changed (keys only) | Field values |
| Org deleted | INFO | `orgId`, `userId` | — |
| Org cases fetched | INFO | `orgId`, `userId`, count returned | Case details |
| Unauthorized org cases access | WARN | `userId`, `role`, `orgId` | — |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Org settings page doesn't exist yet | Medium | High | Check route structure; build `src/app/organization/[id]/settings/page.tsx` if absent |
| Segments field backend format unclear | Medium | Medium | Confirm whether segments is `string[]` or an enum — check API response from `fetchOrganization` |
| `fetchOrganizationCases` pagination response shape | Low | Low | Verify it uses the standard `{ items, totalCount, page, pageSize }` envelope |
| OrgClerk can edit org (spec allows) but role check denies | Low | Medium | Confirm `useUserRole` returns `isOrgClerk` and the edit gate includes this role |
| SystemAdmin deleting org with active sites/users | Low | High | Backend should cascade or reject; UI should surface backend error without crashing |
