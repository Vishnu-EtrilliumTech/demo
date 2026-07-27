# Implementation Plan: Organization Hearings (Org-Level View)

**Branch**: `024-organization-hearings` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/024-organization-hearings/spec.md`

---

## 1. Overview

### What Exists
- `fetchOrganizationHearings(orgId)` in `api.ts` → `GET /organizations/{id}/hearings` — returns all hearings for the org.
- `Hearing` interface in `types/index.ts` with fields: `hearingDateTime`, `hearingNotes`, `hearingLocation`, `caseId`, `assignedToId`, `createdById`, `siteId`, `status`.
- Site-level hearing view (spec `009`) — a separate UI component for hearings within a specific site.

### What Is New (Full Build)
1. A dedicated **Organization Hearings page** at `/organization/[id]/hearings`.
2. Lists all **future** hearings across all sites, ordered by date ascending.
3. Each entry shows: date/time, location, case name, site name, assigned attendee.
4. Clickable rows navigate to the case detail page.
5. Access restricted to `OrganizationAdmin`, `OrganizationClerk`, `SystemAdmin`, `SupportEngineer`.
6. Friendly empty state when no upcoming hearings.
7. Unit and E2E tests.

### Notes
- No pagination for MVP (all future hearings in one response per spec).
- Future filtering (past hearings excluded) done client-side from the API response.

---

## 2. Architecture Flow

### 2.1 Page Load

```
OrgAdmin navigates to /organization/{orgId}/hearings
  → OrgHearingsPage mounts
  → useUserRole(orgId) → isOrgAdmin || isOrgClerk || isSystemAdmin || isSupportEngineer
  → if unauthorized (site roles) → access denied
  → useOrgHearings(orgId) hook
  → fetchOrganizationHearings(orgId)
      → GET /organizations/{orgId}/hearings
  → loading → <LoadingState />
  → response → filter future hearings:
      hearings.filter(h => new Date(h.hearingDateTime) > new Date())
  → sort ascending by hearingDateTime
  → if filtered.length === 0 → <EmptyState message="No upcoming hearings across your organization." />
  → else → render <HearingsList hearings={filtered} orgId={orgId} />
```

### 2.2 Navigate to Case from Hearing

```
OrgAdmin clicks a hearing row
  → hearing.caseId, hearing.siteId available in data
  → router.push(`/organization/{orgId}/sites/{siteId}/cases/{caseId}`)
  → Case detail page loads
```

### 2.3 RBAC Gate

```
OrgHearingsPage renders
  → useUserRole(orgId) resolves
  → OrgAdmin/OrgClerk/SystemAdmin/SupportEngineer → render hearings list
  → SiteAdmin/SiteLegalExpert/SiteCaseClient/etc. → access denied message
  → OrgAdmin from Org A cannot see Org B's hearings (backend enforces via orgId in URL)
```

---

## 3. File Structure

### Documentation
```
specs/024-organization-hearings/
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
  hearings/
    page.tsx                      NEW — OrgHearingsPage (use client)
    components/
      HearingsList/
        HearingsList.tsx          NEW — table/list of hearing rows
        HearingRow.tsx            NEW — individual hearing entry (clickable)
        index.ts                  NEW
      __tests__/
        OrgHearingsPage.test.tsx  NEW
    hooks/
      useOrgHearings.ts           NEW — fetch, filter, sort hearings

src/app/organization/services/
  api.ts                          VERIFY — fetchOrganizationHearings signature and response shape

e2e/
  024-organization-hearings.spec.ts  NEW
```

---

## 4. Component Design

### 4.1 `OrgHearingsPage`
- **Purpose**: Page component wrapping RBAC check, data fetch, and hearings list.
- **`"use client"`** required (Keycloak auth, role check).
- **Layout**: Page header ("Organization Hearings"), `<HearingsList />` or empty state.

### 4.2 `HearingsList`
- **Purpose**: Renders the filtered and sorted list of upcoming hearings.
- **Props**: `{ hearings: OrgHearing[], orgId: string }`
- **Display**: MUI `<Table>` with columns: Date/Time, Location, Case Name, Site Name, Assigned Attendee.
- **Row click**: Each row calls `onRowClick(hearing)` which triggers navigation.
- **Date formatting**: Use `formatDateTime` utility for consistent display.

### 4.3 `HearingRow`
- **Purpose**: Single row in the hearings table.
- **Props**: `{ hearing: OrgHearing, onClick: () => void }`
- **Styling**: Entire row is clickable (cursor: pointer, hover background).
- **`React.memo`** applied.

### 4.4 `useOrgHearings` (hook)
- **Parameters**: `orgId: string`
- **Returns**: `{ hearings: OrgHearing[], loading: boolean, error: string | null }`
- **Logic**:
  ```typescript
  const now = new Date();
  const futureHearings = data
    .filter(h => new Date(h.hearingDateTime) > now)
    .sort((a, b) => new Date(a.hearingDateTime).getTime() - new Date(b.hearingDateTime).getTime());
  ```

### 4.5 `OrgHearing` type (extended)
The existing `Hearing` type may not include `siteName` and `caseName` — these may need to be resolved:
- Confirm if `fetchOrganizationHearings` response includes `siteName` and `caseName` as flat fields.
- If not, add them to the `OrgHearing` interface and ensure backend includes them in the response.

---

## 5. API Plan

| Method | URL | Auth | Request | Success | Error Codes | Status |
|--------|-----|------|---------|---------|-------------|--------|
| `GET` | `/organizations/{orgId}/hearings` | Bearer (OrgAdmin, OrgClerk, SysAdmin, SupportEngineer) | — | `{ data: OrgHearing[] }` 200 | 401, 403 | Existing |

> **Note**: Future hearing filtering (date > now) is done client-side. The backend returns all hearings. This is a known MVP limitation (spec states no pagination).

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| Site roles accessing org hearings URL | `useUserRole` check on mount → access denied; backend returns 403 |
| OrgAdmin from Org A seeing Org B hearings | Backend scopes by `orgId` in URL; Keycloak claims validated server-side |
| Past hearings shown when clock drifts | Client-side filter uses `new Date()` at render time; acceptable for display purposes |
| Navigation to wrong case from hearing | `hearing.caseId` and `hearing.siteId` come from the API; no user input in URL construction |
| Hearing notes in response | `hearingNotes` must NOT be displayed in the org-level view (sensitive case notes); only show date/time, location, case name, site, attendee |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `hearings` (raw + filtered) | `useOrgHearings` (local) | Page-scoped; not shared |
| `loading`, `error` | `useOrgHearings` (local) | Async state |
| Role flags | `useUserRole` (Redux-derived) | Already global |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `OrgHearingsPage.test.tsx` | OrgAdmin role → hearings list renders | List visible |
| `OrgHearingsPage.test.tsx` | SiteAdmin role → access denied shown | Access denied text |
| `OrgHearingsPage.test.tsx` | No future hearings → EmptyState shown | Empty state text |
| `OrgHearingsPage.test.tsx` | Past hearings filtered out | Only future hearings in table |
| `OrgHearingsPage.test.tsx` | Hearings sorted ascending by date | First row has earliest date |
| `OrgHearingsPage.test.tsx` | Row click → router.push called with correct URL | Navigation mock invoked with caseId and siteId |

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| Page loads with future hearings | OrgAdmin | Navigate to /organization/{id}/hearings | Table with hearing entries |
| Empty state | OrgAdmin | Org with no future hearings | EmptyState message visible |
| Past hearings excluded | OrgAdmin | Org with only past hearings | Empty state shown (not the past entries) |
| Row click navigates to case | OrgAdmin | Click hearing row | Case detail page loads |
| SiteAdmin access denied | SiteAdmin | Navigate to org hearings URL | Access denied message |
| Hearings sorted ascending | OrgAdmin | Multiple future hearings | Earliest at top |

Test file: `e2e/024-organization-hearings.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-001: Page renders within 3s for ≤50 hearings | Single GET request; hearings payload is lightweight; `LoadingState` shown during fetch |
| SC-002: Date-ascending order on first render | `Array.sort` in `useOrgHearings` applied before returning; no re-sort on interaction |
| SC-003: Site roles blocked before render | Role check is synchronous from Redux state; no extra API call needed |
| SC-004: No past hearings | Filter in `useOrgHearings` is O(n) on the response array; negligible |
| `React.memo` on `HearingRow` | Applied for list performance |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| Org hearings fetched | INFO | `orgId`, `userId`, total count, future count | Hearing notes, case content |
| Org hearings fetch failed | ERROR | `orgId`, `userId`, HTTP status | — |
| Access denied (site role) | WARN | `userId`, `role`, `orgId` | — |
| Navigation to case from hearing | INFO | `userId`, `caseId`, `siteId` | — |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `fetchOrganizationHearings` response missing `siteName` or `caseName` | Medium | High | Confirm API response shape; if missing, request backend to include in the response DTO |
| All hearings returned (no pagination) may be large for big orgs | Medium | Medium | MVP spec accepts this; add pagination in a follow-up if needed |
| Hearing date timezone mismatch (UTC vs IST) | Medium | Medium | Use consistent `Date` formatting utility; display in local timezone via `Intl.DateTimeFormat` |
| Client-side future filter missing hearings today (edge case) | Low | Low | Filter uses `> new Date()` (strict future); hearings today at earlier time may be excluded |
| OrgClerk accessing hearings (spec allows) | Low | Low | Include `isOrgClerk` in RBAC check alongside `isOrgAdmin` |
| `hearingNotes` sensitive data displayed accidentally | Medium | High | Only map specific fields in `HearingRow`; do not spread the entire `Hearing` object into display |
