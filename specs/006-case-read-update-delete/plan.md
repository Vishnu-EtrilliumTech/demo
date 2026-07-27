# Implementation Plan: Case Read, Update & Delete

**Branch**: `006-case-read-update-delete` | **Date**: 2026-05-14 | **Spec**: [spec.md](./spec.md)

---

## Summary

Spec 006 covers viewing, filtering, editing, and deleting cases at the site level. The case list page and case detail page already exist with working tab-based sub-entity UIs. The primary gaps are: enforcing role-based access (hiding Edit/Delete for unauthorized roles, denying OrgClerk access to case detail), adding status-filter UI on the list page, and ensuring the delete flow uses an MUI Dialog confirmation.

---

## Technical Context

- **Existing**: `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/page.tsx` — full tab-based case detail page with `CaseHeader`, `CaseOverview`, and six tab components.
- **Existing**: `src/app/organization/[id]/sites/[siteId]/cases/` — site-level cases list (rendered as a tab section within the site detail page).
- **Existing**: `useCaseData` hook handles fetch, edit title, edit description, refetch. `deleteCase` already exists in `src/app/organization/services/api.ts`.
- **Existing**: `useUserRole(orgId)` returns `isOrganizationAdmin`, `isOrganizationClerk`, `isSiteAdmin`, `isSiteClerk`, `isSiteSrLegalExpert`, `isSiteLegalExpert`, `isSiteCaseClient`, `canDeleteCases`, `canEditCases`.
- **Gap**: OrgClerk guard on case detail page (redirect to access-denied or back to list).
- **Gap**: Status filter chip/toggle row on the cases list.
- **Gap**: Delete confirmation dialog (MUI Dialog) — partial implementation exists via `handleDeleteCase`, but confirmation modal must be explicit.
- **Gap**: Role-conditioned visibility for Edit and Delete controls in `CaseHeader`.

---

## Constitution Check

| Principle | Compliant | Notes |
|---|---|---|
| Forms use `useFormValidation` | Yes | `useCaseData` uses `extractFieldErrors` for edit forms |
| API calls in service files only | Yes | `deleteCase`, `updateCase` in `services/api.ts` |
| Errors via `useToast` | Yes | `showSuccess`/`showError` already wired |
| Auth check before render | Partial | OrgClerk guard missing on detail page |
| MUI 6 for all UI | Yes | Tabs, Chips, Dialogs throughout |
| Delete uses Dialog confirmation | Partial | `handleDeleteCase` fires directly — needs MUI Dialog guard |
| Role-gated actions hidden (not disabled) | Partial | Need to verify Edit/Delete use `{canDelete && <Button>}` pattern |
| Business logic in hooks/services | Yes | `useCaseData`, `useCaseTasks` etc. |
| `"use client"` only for Keycloak/Redux consumers | Yes | All case pages already have this |

---

## 1. Overview

### What Exists
- Case detail page at `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/page.tsx` with 7 tabs (Overview, Clients, Tasks, Documents, Hearings, Comments, Invoice).
- `CaseHeader` component handles edit/delete UI — partial role guard.
- `useCaseData` hook: fetch, edit-title, edit-description, refetch.
- `deleteCase` API function in `services/api.ts`.
- `useUserRole` hook with `canDeleteCases`, `canEditCases` derived booleans.

### Gaps to Close
1. OrgClerk navigating to case detail URL must see an "Access Denied" state — not the full page.
2. Edit and Delete buttons in `CaseHeader` must be hidden (not just disabled) for roles without permission.
3. Delete flow must route through an MUI `<Dialog>` confirmation before calling `deleteCase`.
4. Cases list needs a status filter UI (MUI Chip group or ToggleButtonGroup) tied to a client-side filter on the fetched list.
5. Status badge colors must be consistent: Open=blue, InProgress=yellow, OnHold=orange, Closed=grey/red.
6. `SiteCaseClient` sees case detail read-only — no edit/delete/assign controls anywhere on the page.

### What Is New
- `DeleteCaseDialog` confirmation component (or inline MUI Dialog inside `CaseHeader`).
- Status filter row on the cases list section/page.
- Access-denied guard block in the case detail page for OrgClerk.

---

## 2. Architecture Flow

### 2.1 Cases List — Status Filter

```
User selects status chip
  → setStatusFilter(status)
  → filteredCases = cases.filter(c => c.status === status || status === '')
  → re-renders list rows
```

### 2.2 Case Detail — Role Guard

```
page.tsx mounts
  → useUserRole(orgId)
  → if isOrganizationClerk → render <AccessDenied> (no API calls for case data)
  → else → useCaseData(orgId, siteId, caseId) → render full page
```

### 2.3 Edit Case Flow

```
User clicks "Edit" (visible only to canEditCases roles)
  → CaseHeader sets isEditingTitle=true
  → Edit form opens inline (pre-filled with current values)
  → onChange → handleEditTitleFormChange
  → onSubmit → useCaseData.handleSaveTitleEdit → PUT /api/.../cases/{caseId}
  → success → refetchCase → showSuccess
  → error → showError
```

### 2.4 Delete Case Flow

```
User clicks "Delete" (visible only to canDeleteCases roles)
  → setDeleteDialogOpen(true)
  → MUI Dialog renders with case title
  → User clicks "Confirm Delete"
  → handleDeleteCase() → DELETE /api/.../cases/{caseId}
  → success → showSuccess → router.push(list URL)
  → error → showError → dialog stays open
```

---

## 3. File Structure

### Documentation
```
specs/006-case-read-update-delete/
  spec.md                          NO CHANGE
  plan.md                          NEW (this file)
  research.md                      NEW
  data-model.md                    NEW
  contracts/
    api-contracts.md               NEW
```

### Source Tree
```
src/app/organization/[id]/sites/[siteId]/cases/
  page.tsx                         MODIFY — add status filter UI
  [caseId]/
    page.tsx                       MODIFY — add OrgClerk guard
    components/
      CaseHeader/
        CaseHeader.tsx             MODIFY — hide Edit/Delete per role, add delete Dialog
        index.ts                   NO CHANGE
      shared/
        StatusBadge.tsx            NEW — reusable color-coded status chip
    hooks/
      useCaseData.ts               MODIFY — expose deleteDialogOpen state + handler
      index.ts                     NO CHANGE
    types/
      case.ts                      NO CHANGE

src/app/organization/services/
  api.ts                           NO CHANGE (deleteCase, updateCase already exist)

src/hooks/
  useUserRole.ts                   NO CHANGE
```

---

## 4. Component Design

### 4.1 `StatusBadge` (NEW — shared/)
- **Purpose**: Render a color-coded MUI `Chip` for case/task/hearing status.
- **Props**: `status: string`, `size?: 'small' | 'medium'`
- **State**: None (pure/derived)
- **Render paths**:
  - Open → blue (`#1976d2` bg `#e3f2fd`)
  - InProgress → yellow (`#f57c00` bg `#fff3e0`)
  - OnHold → orange (`#e65100` bg `#fbe9e7`)
  - Closed → grey (`#616161` bg `#f5f5f5`)
  - Unknown → default MUI chip

### 4.2 `CaseHeader` (MODIFY)
- **Purpose**: Display case title, status, assignee; expose Edit and Delete actions.
- **New props**: None (role checks done internally via `useUserRole`)
- **Added state**: `deleteDialogOpen: boolean`
- **Render paths**:
  - `canEditCases` → show Edit button; else → null
  - `canDeleteCases` → show Delete button; else → null
  - `isSiteCaseClient` → hide all action buttons
  - Delete button click → `setDeleteDialogOpen(true)`
  - Dialog Confirm → `onDeleteCase()` prop → navigate away
  - Dialog Cancel → `setDeleteDialogOpen(false)`

### 4.3 Cases List Page (MODIFY `cases/page.tsx` or site-level cases section)
- **Purpose**: Show all site cases with optional status filter.
- **New state**: `statusFilter: string` (default `''` = All)
- **Derived**: `filteredCases = cases.filter(c => !statusFilter || c.status === statusFilter)`
- **Render paths**:
  - Filter chips: All | Open | InProgress | OnHold | Closed → MUI ToggleButtonGroup or Chip group
  - List renders `StatusBadge` for each row
  - Empty filtered state → "No cases match this filter" message

### 4.4 Case Detail Page Guard (MODIFY `[caseId]/page.tsx`)
- **Logic**: After `useUserRole` resolves and `!isLoading`, if `isOrganizationClerk` → render access-denied card (no `useCaseData` call).
- **Access-denied UI**: MUI Card with warning icon, "You do not have permission to view case details." and a Back button.

---

## 5. API Plan

| Method | URL | Auth | Request Body | Success Response | Error Codes | Status |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/organizations/{orgId}/sites/{siteId}/cases` | Bearer | — | `{ data: CaseListItem[] }` | 401, 403 | Existing |
| `GET` | `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}` | Bearer | — | `{ data: CaseDetail }` | 401, 403, 404 | Existing |
| `PUT` | `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}` | Bearer | `UpdateCaseRequest` | `{ data: CaseDetail }` | 400, 401, 403, 404 | Existing |
| `DELETE` | `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}` | Bearer | — | `204 No Content` | 401, 403, 404 | Existing |

---

## 6. Security Plan

| Concern | Mitigation |
|---|---|
| OrgClerk accessing case detail URL directly | Guard in `page.tsx`: check `isOrganizationClerk` after `useUserRole` resolves; render access-denied block |
| SiteCaseClient seeing edit/delete controls | `CaseHeader` and all action buttons behind `{!isSiteCaseClient && canEditCases && ...}` checks |
| CSRF / token expiry on delete | `deleteCase` uses `getToken()` from Keycloak; 401 auto-triggers refresh or logout via httpServices interceptor |
| Unauthorized DELETE via API | Backend enforces roles; frontend guard is defense-in-depth only |
| Accidental delete | MUI Dialog confirmation required; no keyboard shortcut bypass |

---

## 7. State Management

| State | Location | Rationale |
|---|---|---|
| `caseData`, `loading`, `error` | `useCaseData` hook (local) | Single-page scoped, no cross-route sharing needed |
| `statusFilter` | Cases list page local state | Filter is ephemeral, UI-only |
| `deleteDialogOpen` | `CaseHeader` local state | Dialog visibility is UI-only |
| `isOrganizationClerk` / role flags | `useUserRole` hook (local, derived from Redux profile + API) | Roles come from API but are per-session; no persist needed |
| Auth tokens | Keycloak localStorage | Managed by Keycloak.js; not Redux |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests

| Test File | Scenario | Expected |
|---|---|---|
| `CaseHeader.test.tsx` | OrgAdmin → Edit and Delete buttons visible | Both render |
| `CaseHeader.test.tsx` | SiteSrLegalExpert → Edit visible, Delete hidden | Only Edit renders |
| `CaseHeader.test.tsx` | SiteCaseClient → neither button visible | Neither renders |
| `CaseHeader.test.tsx` | Delete button click → Dialog opens | Dialog present in DOM |
| `CaseHeader.test.tsx` | Dialog Confirm → onDeleteCase called | Mock called once |
| `StatusBadge.test.tsx` | Open status → blue chip | Chip has correct color class |
| `StatusBadge.test.tsx` | Unknown status → default chip | No crash |
| `cases/page.test.tsx` | Status filter "Open" → only Open cases shown | List count matches |
| `cases/page.test.tsx` | All filter → all cases shown | Full list count |
| `[caseId]/page.test.tsx` | OrgClerk role → access-denied rendered | Access-denied text present |

### E2E Scenarios (Playwright)

| Scenario | Actor | Steps | Assert |
|---|---|---|---|
| View cases list with filter | SiteClerk | Nav to cases, click "Open" filter chip | Only Open status rows visible |
| View case detail | SiteAdmin | Click a case row | Detail page loads with 7 tabs |
| Edit case title | SiteAdmin | Click Edit, change title, Save | Updated title shown in header |
| Delete case with confirmation | OrgAdmin | Click Delete, Confirm in dialog | Redirected to list; case gone |
| OrgClerk blocked from detail | OrgClerk | Navigate directly to `/cases/{caseId}` | "Access Denied" card shown |
| SiteCaseClient read-only | SiteCaseClient | View case detail | No Edit or Delete buttons in DOM |

---

## 9. Performance

| NFR | Implementation |
|---|---|
| SC-001: List renders in < 2s | Status filter is client-side on already-fetched data — no additional API call |
| SC-002: Edit save < 1s P95 | `PUT` is a single JSON request; no file upload |
| SC-003: Delete < 1s P95 | `DELETE` is lightweight; dialog dismisses on response |
| Tab switching | Tab panels use `{value === index && <Box>}` — no lazy load needed; sub-hooks fetch on mount |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|---|---|---|---|
| Case list fetched | INFO | orgId, siteId, count returned | Case titles, client names |
| Case detail fetched | INFO | caseId | Case description, assignee name |
| Case updated | INFO | caseId, fields changed (keys only) | New field values |
| Case deleted | INFO | caseId | Case title |
| OrgClerk access blocked | WARN | userId, caseId attempted | — |
| API error on delete | ERROR | HTTP status, caseId | Token value |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| OrgClerk guard race condition (roles load after render) | Medium | Medium | Show loading spinner until `!isLoading` from `useUserRole`; only then branch on role |
| Delete removes sub-entities (tasks, docs, hearings) — user unaware | Medium | High | Dialog confirmation message explicitly states "This will permanently delete the case and all associated records." |
| Status filter mismatch if backend adds new statuses | Low | Low | Default to showing all unmatched statuses as-is; filter chips are additive |
| Edit form losing unsaved changes on tab switch | Low | Low | Edit is inline in `CaseHeader`, not tab-scoped; user must explicitly Cancel |
