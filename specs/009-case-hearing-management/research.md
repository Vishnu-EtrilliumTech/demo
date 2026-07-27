# Research: Case Hearing Management

**Branch**: `009-case-hearing-management` | **Date**: 2026-05-15

---

## 1. Existing Infrastructure

### Decision: Use existing `useCaseHearings` hook for case-level hearing management
- **Rationale**: `useCaseHearings.ts` implements full CRUD for hearings including filtering by status, location, and assignee; date/time formatting; detail view modes.
- **Alternatives considered**: New hook — rejected; existing hook is feature-complete.

### Decision: Site-level upcoming hearings page already exists
- **Rationale**: `src/app/organization/[id]/sites/[siteId]/hearings/page.tsx` uses `fetchSiteHearings` from `api.ts` to display future hearings across all site cases. The page renders a search bar, status chips, and a sorted list.
- **Gaps**: Need to verify `canViewHearings` role guard correctly excludes unauthorized roles, and that OrgClerk sees the view in read-only mode (no schedule/edit/delete controls).

### Decision: `fetchSiteHearings` in `api.ts` for site-level aggregation
- **Rationale**: `GET /api/v1/organizations/{orgId}/sites/{siteId}/hearings` returns future hearings ordered by date. Separate from case-level `caseapi.ts` to reflect the different URL scope.

---

## 2. HearingStatus Enum

The existing `HearingStatus` enum has 8 values, superseding the spec's implied simpler set:
`Open | Scheduled | PlanningInProgress | Planned | OnHold | Appeared | NotAppeared | Completed`

The site-level hearings page already defines `STATUS_STYLES` with correct color mapping for all 8 values.

**Decision**: Use all 8 values as-is. The spec's "status dropdown" in the form should expose all 8 options.

---

## 3. RBAC Matrix for Hearings

| Actor | Case Hearings tab | Site-level view | Write controls |
|-------|------------------|-----------------|----------------|
| OrgAdmin | Yes | Yes | Yes |
| SiteAdmin/SiteClerk/SrExpert/Expert | Yes | Yes | Yes |
| OrgClerk | No case access | Yes | No |
| SiteCaseClient | Yes (read-only) | No | No |

**Decision**: `useUserRole` → `canViewHearings`, `canScheduleHearings` flags used in site hearing page. Case-level `HearingsTab` must hide schedule/edit/delete for `SiteCaseClient`.

---

## 4. Date/Time Handling

Hearings use `hearingDateTime` (ISO 8601 with timezone). The site-level page formats via `formatHearingDate` (local utility). The `HearingsTab` uses `formatDateForInput` / `formatDateForAPI` from case utils.

Past hearing dates are accepted without validation errors per spec FR-004.

---

## 5. Attendee/Assignee Picker

Same `siteUsers` prop pattern as task and case assignee dropdowns. The attendee picker is `MUI Autocomplete` or a dropdown over `siteUsers`.

---

## 6. Site-Level Hearing Ordering

`fetchSiteHearings` returns hearings ordered ascending by date from the backend. No client-side sort is required (spec SC-002).

---

## 7. Gaps Identified

| Gap | Severity | Disposition |
|-----|----------|-------------|
| OrgClerk access to site hearings page — verify read-only (no write controls visible) | High | Verify `{canScheduleHearings && ...}` guards on Schedule/Edit/Delete buttons |
| SiteCaseClient read-only on case `HearingsTab` — verify guards | High | Verify `{!isSiteCaseClient && ...}` on action buttons |
| No unit tests for `HearingsTab` or `useCaseHearings` | Medium | Create as part of this spec |
| No E2E tests for hearings golden path | Medium | Create as part of this spec |
