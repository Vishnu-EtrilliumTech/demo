# Implementation Plan: Site Legal Expert Dashboard

**Branch**: `020-site-legal-expert-dashboard` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/020-site-legal-expert-dashboard/spec.md`

---

## 1. Overview

### What Exists
- `src/app/profile/page.tsx` — loads current user via `fetchCurrentUser()`, shows personal/professional details. This is a generic profile page, not a role-specific work dashboard.
- `fetchUserCaseSummary()` in `api.ts` → `GET /organizations/{id}/users/{userId}/cases/summary` — returns `{ cases, caseTasks, caseHearings }`. This is the primary data source.
- `src/app/admin-dashboard/page.tsx` — redirects to `/admin-dashboard/legal-experts` (separate admin flow).
- `legalExpertSlice.ts` — Redux state for expert profile data (not dashboard work data).

### What Is New (Full Build)
1. A dedicated **Site Legal Expert Dashboard** page at `/organization/[id]/sites/[siteId]/dashboard`.
2. Three sections: **My Cases**, **My Tasks**, **Upcoming Hearings**.
3. Data loaded from `fetchUserCaseSummary()` (cases + tasks) and `fetchSiteHearings()` (hearings, already exists in `api.ts`).
4. Overdue task highlighting (red due date).
5. Clickable cards navigating to full detail pages.
6. Site-scope enforcement (expert sees only their site's data).
7. Unit and E2E tests.

### Actors
- `SiteLegalExpert` and `SiteSrLegalExpert`: primary users (identical capability).
- `OrganizationAdmin` / `SystemAdmin`: can view any user's equivalent view.

---

## 2. Architecture Flow

### 2.1 Dashboard Load

```
SiteLegalExpert logs in → redirected to /organization/{orgId}/sites/{siteId}/dashboard
  → SiteLegalExpertDashboard page mounts
  → useUserRole(orgId) → isSiteLegalExpert || isSiteSrLegalExpert
  → if unauthorized → redirect to access denied page
  → useDashboard(orgId, siteId, userId) hook
  → parallel fetches:
      fetchUserCaseSummary(orgId, siteId, userId)
          → GET /organizations/{orgId}/sites/{siteId}/users/{userId}/cases/summary
          → returns { cases: CaseSummary[], caseTasks: CaseTask[], caseHearings: Hearing[] }
      (hearings are included in summary; no second fetch needed)
  → loading → each section shows <LoadingState />
  → data → render My Cases, My Tasks, Upcoming Hearings sections
```

### 2.2 My Cases Section

```
useDashboard → cases array
  → if cases.length === 0 → <EmptyState message="No cases assigned to you yet." />
  → else → grid of <CaseCard> components
      → each card: title, case number, status badge, last updated date
      → card onClick → router.push(`/organization/{orgId}/sites/{siteId}/cases/{caseId}`)
```

### 2.3 My Tasks Section

```
useDashboard → caseTasks array
  → if caseTasks.length === 0 → <EmptyState message="No tasks assigned to you." />
  → else → list of <TaskRow> components
      → each row: task title, case name, due date, status badge
      → overdue detection: dueDate < today && status !== "Closed"
      → overdue → dueDate text color: red (MUI `color="error"`)
      → row onClick → router.push to case detail tasks tab
```

### 2.4 Upcoming Hearings Section

```
useDashboard → caseHearings array (filtered: date > now, sorted ascending)
  → if empty → <EmptyState message="No upcoming hearings in your site." />
  → else → list of <HearingRow>
      → each row: hearing date/time, location, case name
      → sorted by hearingDateTime ascending
      → row onClick → router.push to case detail hearings tab
```

### 2.5 RBAC Guard

```
Page loads
  → useUserRole(orgId) → role checked
  → SiteLegalExpert or SiteSrLegalExpert → render dashboard
  → SiteCaseClient → redirect to case view (not dashboard)
  → OrgAdmin viewing another user's dashboard → allowed (passes userId as query param)
```

---

## 3. File Structure

### Documentation
```
specs/020-site-legal-expert-dashboard/
  spec.md                         NO CHANGE
  plan.md                         NEW (this file)
  research.md                     NEW
  data-model.md                   NEW
  contracts/
    api-contracts.md              NEW
```

### Source Tree
```
src/app/organization/[id]/sites/[siteId]/
  dashboard/
    page.tsx                      NEW — SiteLegalExpertDashboard page (use client)
    components/
      MyCasesSection/
        MyCasesSection.tsx        NEW — cases grid
        CaseDashboardCard.tsx     NEW — individual case card
        index.ts                  NEW
      MyTasksSection/
        MyTasksSection.tsx        NEW — tasks list with overdue highlighting
        TaskDashboardRow.tsx      NEW — individual task row
        index.ts                  NEW
      UpcomingHearingsSection/
        UpcomingHearingsSection.tsx  NEW — hearings list sorted by date
        HearingDashboardRow.tsx      NEW — individual hearing row
        index.ts                     NEW
    hooks/
      useDashboard.ts             NEW — fetches summary, filters hearings, sorts
    __tests__/
      MyCasesSection.test.tsx     NEW
      MyTasksSection.test.tsx     NEW

src/app/organization/services/
  api.ts                          VERIFY — fetchUserCaseSummary signature

e2e/
  020-site-legal-expert-dashboard.spec.ts  NEW
```

---

## 4. Component Design

### 4.1 `SiteLegalExpertDashboard` (page)
- **Purpose**: Root page component, manages auth check, data fetch, and layout.
- **Layout**: Three stacked sections with section headers and "View All" links.
- **`"use client"`** directive required (Keycloak auth check, Redux state).

### 4.2 `MyCasesSection`
- **Purpose**: Grid of case cards.
- **Props**: `{ cases: CaseSummary[], orgId: string, siteId: string, loading: boolean }`
- **Empty state**: `EmptyState` from shared components.
- **Grid**: MUI `<Grid container spacing={2}>` with 3 columns on desktop.

### 4.3 `CaseDashboardCard`
- **Props**: `{ case: CaseSummary, onClick: () => void }`
- **Content**: Title, case number, `<Chip>` status badge, "Last updated: {date}".
- **`React.memo`** applied (rendered in a list).

### 4.4 `MyTasksSection`
- **Purpose**: Task list with overdue visual highlight.
- **Props**: `{ tasks: CaseTask[], orgId: string, siteId: string, loading: boolean }`
- **Overdue detection**:
  ```typescript
  const isOverdue = (task: CaseTask) =>
    task.status !== "Closed" && new Date(task.dueDate) < new Date();
  ```
- **Overdue styling**: MUI `<Typography color="error">` for due date text.

### 4.5 `UpcomingHearingsSection`
- **Purpose**: Sorted list of future hearings.
- **Props**: `{ hearings: Hearing[], orgId: string, siteId: string, loading: boolean }`
- **Filter + sort** (in `useDashboard`):
  ```typescript
  hearings
    .filter(h => new Date(h.hearingDateTime) > new Date())
    .sort((a, b) => new Date(a.hearingDateTime) - new Date(b.hearingDateTime))
  ```

### 4.6 `useDashboard` (hook)
- **Parameters**: `orgId: string, siteId: string, userId: string`
- **Returns**: `{ cases, tasks, hearings, loading, error }`
- **Fetch**: Single call to `fetchUserCaseSummary` which returns all three arrays.
- **Post-processing**: Filter/sort hearings client-side.

---

## 5. API Plan

| Method | URL | Auth | Request | Success | Error Codes | Status |
|--------|-----|------|---------|---------|-------------|--------|
| `GET` | `/organizations/{orgId}/sites/{siteId}/users/{userId}/cases/summary` | Bearer | — | `{ data: { cases, caseTasks, caseHearings } }` | 401, 403 | Existing |

No new API endpoints required — `fetchUserCaseSummary` returns all needed data.

> **Note**: Hearing filtering (future only) and sorting (date ascending) done client-side from the summary response to avoid additional API calls.

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| SiteCaseClient accessing dashboard | `useUserRole` check on page mount; redirect if not `SiteLegalExpert` or `SiteSrLegalExpert` |
| Expert A accessing Expert B's dashboard | `userId` in summary URL is the current user's ID from Keycloak; backend validates ownership |
| Cross-site data | Summary API scoped to `siteId`; backend enforces site membership |
| OrgAdmin viewing other user's dashboard | Admin passes `userId` query param; backend validates OrgAdmin role |
| Hearing data from other sites | Hearings returned by summary are site-scoped; no additional filter needed |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `cases`, `tasks`, `hearings` | `useDashboard` (local) | Dashboard-scoped; not needed globally |
| `loading`, `error` | `useDashboard` (local) | Async state per fetch |
| Role flags | `useUserRole` (Redux-derived) | Already in global state |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `MyCasesSection.test.tsx` | No cases → EmptyState shown | Empty state text visible |
| `MyCasesSection.test.tsx` | Cases array → case cards rendered | Cards count matches array |
| `MyCasesSection.test.tsx` | Case card click → router.push called | Navigation mock invoked |
| `MyTasksSection.test.tsx` | Task with past due date (not Closed) → red due date | Typography color="error" |
| `MyTasksSection.test.tsx` | Closed task past due → not highlighted | No error color |
| `MyTasksSection.test.tsx` | No tasks → EmptyState shown | Empty state text visible |
| `UpcomingHearingsSection.test.tsx` | Past hearing excluded from list | Hearing not rendered |
| `UpcomingHearingsSection.test.tsx` | Hearings sorted ascending by date | Correct order |

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| Dashboard loads — golden path | SiteLegalExpert | Login → navigate to dashboard | All 3 sections visible |
| My Cases section populated | SiteLegalExpert | Dashboard renders with assigned cases | Case cards with title/number/status |
| Overdue task highlighted | SiteLegalExpert | Dashboard with overdue task | Due date shown in red |
| Navigate from case card | SiteLegalExpert | Click case card | Case detail page loads |
| Navigate from task row | SiteLegalExpert | Click task row | Case detail tasks tab loads |
| Empty sections | SiteLegalExpert | Dashboard with no data | All empty state messages visible |
| SiteCaseClient access denied | SiteCaseClient | Navigate to dashboard URL | Access denied shown |
| Cross-site access blocked | SiteLegalExpert (Site A) | Navigate to Site B dashboard URL | Access denied |

Test file: `e2e/020-site-legal-expert-dashboard.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-001: Dashboard loads within 3s | Single API call to `fetchUserCaseSummary`; `LoadingState` shown per section during fetch |
| SC-002: Overdue task highlight on all overdue tasks | Client-side date comparison on fetch result; O(n) on task array, acceptable for expected sizes |
| SC-003: All items clickable | `onClick` on every card and row; no lazy binding |
| `React.memo` | Applied to `CaseDashboardCard` and `TaskDashboardRow` for list rendering performance |
| Hearing sort | `Array.sort` client-side; backend does not need to sort since volume is low |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| Dashboard loaded | INFO | `userId`, `siteId`, case count, task count, hearing count | Case/task content |
| Dashboard load failed | ERROR | `userId`, `siteId`, HTTP status | — |
| Access denied (unauthorized role) | WARN | `userId`, `role`, attempted `siteId` | — |
| Navigation from dashboard | INFO | `userId`, destination entity type (case/task/hearing), entity ID | — |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `fetchUserCaseSummary` does not exist or has different signature | Low | High | Verify in `api.ts`; align with backend if different |
| Summary endpoint slow (> 3s) for experts with many cases | Medium | Medium | Show section-level `LoadingState`; consider parallel API calls for each section if summary is too slow |
| Hearing sort client-side differs from backend sort | Low | Low | Ensure client sort matches `hearingDateTime` ascending; validate with test data |
| SiteCaseClient accidentally accessing dashboard URL | Medium | Medium | Role check on page mount with redirect; backend returns 403 anyway |
| OrganizationAdmin view of expert dashboard (P3 in spec) | Low | Low | Implement via `?userId=` query param; validate OrgAdmin cannot access cross-org |
