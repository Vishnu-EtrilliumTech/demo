# Implementation Plan: Case Hearing Management

**Branch**: `009-case-hearing-management` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)

---

## 1. Overview

### What Exists
- `HearingsTab/HearingsTab.tsx` — case-level hearings tab with schedule/edit/delete actions.
- `useCaseHearings.ts` — hook: fetch, add, update, delete hearings; filtering by status/location/assignee; date formatting; detail view modes.
- `src/app/organization/[id]/sites/[siteId]/hearings/page.tsx` — site-level upcoming hearings page; uses `fetchSiteHearings` from `api.ts`; includes search and status display. Already wired to `canViewHearings` via `useUserRole`.
- API functions in `caseapi.ts`: `fetchCaseHearings`, `addCaseHearing`, `fetchCaseHearing`, `updateCaseHearing`, `deleteCaseHearing`.
- `fetchSiteHearings` in `api.ts` for the site-level aggregated view.
- Types: `HearingStatus` enum (8 values), `CaseHearing`, `AddCaseHearingRequest`, `UpdateCaseHearingRequest` in `caseindex.ts`.

### Gaps to Close
1. Verify `SiteCaseClient` cannot see Schedule/Edit/Delete controls in `HearingsTab`.
2. Verify `OrganizationClerk` can view the site hearings page but has no write controls — confirm `canScheduleHearings` guard exists on action buttons.
3. No unit tests for `HearingsTab` or `useCaseHearings`.
4. No E2E tests for hearings golden path.

### What Is New
- Unit tests: `HearingsTab.test.tsx`
- E2E test: `e2e/009-case-hearing-management.spec.ts`

---

## 2. Architecture Flow

### 2.1 Site-Level Upcoming Hearings

```
User navigates to /organization/{orgId}/sites/{siteId}/hearings
  → SiteHearingsPage renders ("use client")
  → useUserRole(orgId) → canViewHearings
  → if !canViewHearings (OrgClerk without site access / SiteCaseClient) → redirect or access-denied
  → fetchSiteHearings(orgId, siteId) → GET /sites/{siteId}/hearings
  → hearings ordered ascending by hearingDateTime (server-side)
  → if hearings.length === 0 → "No upcoming hearings" empty state
  → else → list: date/time | location | attendee | case name | status chip
  → OrgClerk → sees list; no Schedule/Edit/Delete controls (canScheduleHearings = false)
```

### 2.2 Case-Level Hearings Tab

```
Case detail page mounts Hearings tab
  → HearingsTab renders
  → useCaseHearings(orgId, siteId, caseId, siteUsers)
  → useEffect: fetchCaseHearings() → GET /cases/{caseId}/hearings
  → setHearings(data) — includes past and future
  → if hearings.length === 0 → <EmptyState>
  → else → list with status chips
```

### 2.3 Schedule Hearing

```
Authorized user (not SiteCaseClient) clicks "Schedule Hearing"
  → Form modal opens: date/time picker, location, attendee, notes, status
  → blur → validation (assignedToId, hearingDateTime, where required)
  → Submit → addCaseHearing(orgId, siteId, caseId, payload)
      → POST /cases/{caseId}/hearings
  → 201 → showSuccess → refetch or append to local state
  → 400 → extractApiErrors → inline errors
```

### 2.4 Update Hearing

```
Authorized user clicks edit on a hearing row
  → Edit form opens with current values pre-filled
  → Submit → updateCaseHearing(orgId, siteId, caseId, hearingId, payload)
      → PUT /cases/{caseId}/hearings/{hearingId}
  → 200 → showSuccess → update local state
```

### 2.5 Delete Hearing

```
Authorized user clicks delete and confirms dialog
  → deleteCaseHearing(orgId, siteId, caseId, hearingId)
      → DELETE /cases/{caseId}/hearings/{hearingId}
  → 204 → showSuccess → remove from local state
```

### 2.6 RBAC Gate

```
HearingsTab:
  → useUserRole(orgId) → isSiteCaseClient
  → {!isSiteCaseClient && <Button>Schedule Hearing</Button>}
  → {!isSiteCaseClient && <IconButton>Edit</IconButton>}
  → {!isSiteCaseClient && <IconButton>Delete</IconButton>}

SiteHearingsPage:
  → useUserRole(orgId) → canScheduleHearings
  → OrgClerk: canViewHearings=true, canScheduleHearings=false → sees list, no write controls
```

---

## 3. File Structure

### Documentation
```
specs/009-case-hearing-management/
  spec.md                          NO CHANGE
  plan.md                          NEW (this file)
  research.md                      NEW
  data-model.md                    NEW
  contracts/
    api-contracts.md               NEW
```

### Source Tree
```
src/app/organization/[id]/sites/[siteId]/
  hearings/
    page.tsx                       VERIFY — OrgClerk read-only guard on write controls

src/app/organization/[id]/sites/[siteId]/cases/[caseId]/
  components/
    HearingsTab/
      HearingsTab.tsx              VERIFY — SiteCaseClient read-only guard on all action buttons
      index.ts                     NO CHANGE
  hooks/
    useCaseHearings.ts             NO CHANGE (if guards verified)

src/app/organization/
  types/
    caseindex.ts                   NO CHANGE (HearingStatus, CaseHearing, etc.)
  services/
    caseapi.ts                     NO CHANGE (all case hearing API functions)
    api.ts                         NO CHANGE (fetchSiteHearings exists)

e2e/
  009-case-hearing-management.spec.ts  NEW
```

---

## 4. Component Design

### 4.1 `SiteHearingsPage` (`hearings/page.tsx`)
- **Purpose**: Aggregated view of all upcoming hearings for a site, sorted by date.
- **RBAC**:
  ```typescript
  const { canViewHearings, canScheduleHearings } = useUserRole(organizationId);
  // OrgClerk: canViewHearings=true, canScheduleHearings=false
  // Render schedule button only if canScheduleHearings:
  {canScheduleHearings && <Button>Schedule Hearing</Button>}
  ```
- **Status chips**: All 8 `HearingStatus` values mapped to distinct colors (already implemented in `STATUS_STYLES`).
- **Empty state**: "No upcoming hearings scheduled" message.

### 4.2 `HearingsTab` (case-level)
- **Purpose**: Shows all hearings for a case (past + future). Schedule/edit/delete for authorized roles.
- **RBAC**:
  ```typescript
  {!isSiteCaseClient && <Button>Schedule Hearing</Button>}
  {!isSiteCaseClient && <IconButton onClick={onEditHearing}><EditIcon /></IconButton>}
  {!isSiteCaseClient && <IconButton onClick={onDeleteHearing}><DeleteIcon /></IconButton>}
  ```
- **SiteCaseClient view**: Read-only list with hearing date, location, attendee, status chip.

### 4.3 Schedule/Edit Hearing Form
- **Fields**: date/time picker (required, past allowed), location/court name (required), attendee selector (required, `siteUsers`), notes (optional), status dropdown (required, all 8 options).
- **Validation**: Managed by `useCaseHearings` via `useFormValidation`.
- **Date picker**: MUI `DateTimePicker` with `dayjs` adapter.

---

## 5. API Plan

| Method | URL | Auth | Request | Success | Error Codes | Status |
|--------|-----|------|---------|---------|-------------|--------|
| `GET` | `/organizations/{orgId}/sites/{siteId}/hearings` | Bearer | — | `Hearing[]` | 401, 403 | Existing (site-level) |
| `GET` | `.../cases/{caseId}/hearings` | Bearer | — | `{ data: CaseHearing[] }` | 401, 403 | Existing |
| `POST` | `.../cases/{caseId}/hearings` | Bearer | `AddCaseHearingRequest` | `{ data: CaseHearing }` 201 | 400, 401, 403 | Existing |
| `GET` | `.../cases/{caseId}/hearings/{id}` | Bearer | — | `{ data: CaseHearing }` | 401, 403, 404 | Existing |
| `PUT` | `.../cases/{caseId}/hearings/{id}` | Bearer | `UpdateCaseHearingRequest` | `{ data: CaseHearing }` | 400, 401, 403, 404 | Existing |
| `DELETE` | `.../cases/{caseId}/hearings/{id}` | Bearer | — | 204 | 401, 403, 404 | Existing |

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| SiteCaseClient seeing Schedule/Edit/Delete controls | `{!isSiteCaseClient && ...}` in `HearingsTab`; backend enforces `[Authorize]` |
| OrgClerk accessing write controls on site hearings page | `{canScheduleHearings && ...}` guards; `canScheduleHearings` is false for OrgClerk |
| Past hearing dates accepted without error | Intentional (historical records); no frontend validation block on past dates |
| XSS via location/notes fields | Controlled inputs; no `dangerouslySetInnerHTML` |
| Token expiry during form submit | `getToken()` per-request; 401 handled by `httpServices` interceptor |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `hearings`, `loadingHearings` | `useCaseHearings` (local) | Case-scoped; no cross-route sharing |
| `hearingFilters` | `useCaseHearings` (local) | UI-only filter; ephemeral |
| Form state (add/edit) | `useCaseHearings` (local) | Scoped to modal lifecycle |
| `deleteHearingModalOpen`, `hearingToDelete` | `useCaseHearings` (local) | Dialog visibility; ephemeral |
| Site-level `hearings` | `SiteHearingsPage` local state | Page-scoped |
| Role flags | `useUserRole` (local, Redux-derived) | Per-session |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `HearingsTab.test.tsx` | SiteAdmin → Schedule Hearing button visible | Button renders |
| `HearingsTab.test.tsx` | SiteCaseClient → Schedule/Edit/Delete hidden | Zero action controls in DOM |
| `HearingsTab.test.tsx` | Empty hearing list → EmptyState shown | EmptyState renders |
| `HearingsTab.test.tsx` | Delete click → confirmation dialog opens | Dialog in DOM |
| `SiteHearingsPage.test.tsx` | OrgClerk → list visible, no schedule button | List renders; Schedule button absent |
| `useCaseHearings.test.ts` | addCaseHearing success → hearing appended | List length +1 |
| `useCaseHearings.test.ts` | Past date submitted without error | No validation error thrown |

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| View upcoming hearings | SiteAdmin | Nav to site > Hearings | Future hearings listed in date order |
| OrgClerk sees read-only site hearings | OrgClerk | Nav to site > Hearings | List shown; no Schedule button |
| Schedule a hearing | SiteClerk | Nav to case > Hearings, click Schedule, fill form | Hearing appears in list |
| SiteCaseClient read-only | SiteCaseClient | Nav to case > Hearings | No action buttons in DOM |
| Past hearing date accepted | SiteAdmin | Schedule hearing with yesterday's date | Hearing created without error |
| Delete hearing with confirmation | SiteAdmin | Click delete, confirm | Hearing removed from list |

Test file: `e2e/009-case-hearing-management.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-001: Upcoming hearings render within 2s for ≤ 50 active cases | `fetchSiteHearings` single GET; no case-by-case looping; server returns future only |
| SC-002: Hearings ordered by date server-side | Backend orders by `hearingDateTime ASC`; no client-side sort needed |
| Case-level hearings tab | `fetchCaseHearings` on tab mount; `LoadingState` spinner during fetch |
| Client-side filtering | `hearingFilters` applied over already-fetched list — no additional API calls |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| Site hearings fetched | INFO | `siteId`, count returned | Case names, locations |
| Case hearings fetched | INFO | `caseId`, count returned | Hearing dates, locations |
| Hearing scheduled | INFO | `caseId`, `hearingId`, `status` | Location, notes |
| Hearing updated | INFO | `hearingId`, fields changed (keys only) | New field values |
| Hearing deleted | INFO | `hearingId` | Location, notes |
| SiteCaseClient write attempt | WARN | `userId`, `caseId` | — |
| OrgClerk write attempt blocked | WARN | `userId`, `siteId` | — |
| API error | ERROR | HTTP status, `hearingId` | Token value |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SiteCaseClient RBAC guard incomplete in `HearingsTab` | Medium | High | Audit every action button; apply `{!isSiteCaseClient && ...}` guard |
| OrgClerk seeing schedule/edit/delete on site hearings page | Medium | High | Verify `{canScheduleHearings && ...}` guards; `canScheduleHearings` must be false for OrgClerk |
| Site hearings page includes past hearings (should be future-only) | Low | Medium | `fetchSiteHearings` relies on backend filter; confirm API returns future dates only |
| Timezone mismatch in `hearingDateTime` display | Medium | Medium | Use `formatHearingDate` utility consistently; do not call `new Date()` without locale |
| HearingStatus `PlanningInProgress` rendering as two words | Low | Low | `STATUS_STYLES` already maps this value to correct display label and color |
