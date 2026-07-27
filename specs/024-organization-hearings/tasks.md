# Tasks: Organization Hearings (Org-Level View)

**Feature Branch**: `024-organization-hearings`
**Input**: `specs/024-organization-hearings/plan.md`, `specs/024-organization-hearings/spec.md`

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = Org Admin Views All Upcoming Hearings, US2 = Navigate to Case from Hearing

---

## Phase 1: Setup

**Purpose**: Create file structure and verify prerequisites.

- [ ] T001 Create directory `src/app/organization/[id]/hearings/components/HearingsList/` per plan.md §3
- [ ] T002 [P] Create directory `src/app/organization/[id]/hearings/hooks/` per plan.md §3
- [ ] T003 [P] Create directory `src/app/organization/[id]/hearings/components/__tests__/` per plan.md §3
- [ ] T004 Verify `fetchOrganizationHearings(orgId)` exists in `src/app/organization/services/api.ts` and confirm response shape includes `hearingDateTime`, `hearingNotes`, `hearingLocation`, `caseId`, `assignedToId`, `siteId`, `status`

---

## Phase 2: UI

**Purpose**: Build all visual components for the org hearings page.

- [ ] T005 [P] [US1] Create `src/app/organization/[id]/hearings/components/HearingsList/HearingRow.tsx` — MUI `<TableRow>` with columns: Date/Time, Location, Case Name, Site Name, Assigned Attendee; `cursor: pointer` hover; `React.memo`; props `{ hearing: OrgHearing, onClick: () => void }`
- [ ] T006 [P] [US1] Create `src/app/organization/[id]/hearings/components/HearingsList/HearingsList.tsx` — MUI `<Table>` rendering `HearingRow` list; props `{ hearings: OrgHearing[], orgId: string }`
- [ ] T007 [US1] Create `src/app/organization/[id]/hearings/components/HearingsList/index.ts` — barrel export for `HearingsList`
- [ ] T008 [US1] Create `src/app/organization/[id]/hearings/page.tsx` — `"use client"` page component; page header "Organization Hearings"; renders `<HearingsList />` or `<EmptyState message="No upcoming hearings across your organization." />` or `<LoadingState />`; depends on T005, T006

---

## Phase 3: Logic

**Purpose**: Implement data-fetching hook and filtering/sorting logic.

- [ ] T009 [US1] Create `src/app/organization/[id]/hearings/hooks/useOrgHearings.ts` — fetches via `fetchOrganizationHearings(orgId)`; filters `h => new Date(h.hearingDateTime) > new Date()`; sorts ascending by `hearingDateTime`; returns `{ hearings: OrgHearing[], loading: boolean, error: string | null }`
- [ ] T010 [US1] Add `OrgHearing` type to `src/app/organization/types/index.ts` (or verify it exists) — must include `hearingDateTime`, `hearingLocation`, `caseId`, `siteId`, `siteName`, `caseName`, `assignedToId`; confirm `siteName` and `caseName` are present in API response (risk per plan.md §11)
- [ ] T011 [US1] Wire `useOrgHearings(orgId)` into `src/app/organization/[id]/hearings/page.tsx` — connect loading/error/hearings state to UI conditionals
- [ ] T012 [P] [US1] Add RBAC check in `src/app/organization/[id]/hearings/page.tsx` using `useUserRole(orgId)` — allow `isOrgAdmin || isOrgClerk || isSystemAdmin || isSupportEngineer`; show access denied message for site roles
- [ ] T013 [US2] Add row-click handler in `HearingsList.tsx` — calls `router.push('/organization/{orgId}/sites/{siteId}/cases/{caseId}')` using `hearing.caseId` and `hearing.siteId` from API data

---

## Phase 4: API

**Purpose**: Verify and extend API service layer.

- [ ] T014 Verify `fetchOrganizationHearings(orgId)` in `src/app/organization/services/api.ts` maps to `GET /organizations/{orgId}/hearings` with Bearer auth and returns `{ data: OrgHearing[] }`
- [ ] T015 [P] Confirm API response includes flat `siteName` and `caseName` fields; if absent document as gap and add placeholder handling in `OrgHearing` type (risk per plan.md §11)

---

## Phase 5: Backend

**Purpose**: Validate backend contract assumptions before implementation goes live.

- [ ] T016 Confirm `GET /organizations/{orgId}/hearings` enforces `OrgAdmin`, `OrgClerk`, `SystemAdmin`, `SupportEngineer` roles and returns 403 for site-level roles
- [ ] T017 [P] Confirm backend scopes results to `orgId` in URL so OrgAdmin from Org A cannot receive Org B hearings
- [ ] T018 [P] Confirm backend does NOT filter by date (client-side filtering per plan.md §1 note) — document if filtering moves to server in future

---

## Phase 6: Security

**Purpose**: Enforce access control and prevent data leakage.

- [ ] T019 Verify `hearingNotes` field is NOT mapped or displayed anywhere in `HearingRow.tsx` or `HearingsList.tsx` — only map: `hearingDateTime`, `hearingLocation`, `caseName`, `siteName`, `assignedToId`
- [ ] T020 [P] Verify `HearingRow` constructs navigation URL exclusively from `hearing.caseId` and `hearing.siteId` — no user-supplied input in URL construction
- [ ] T021 [P] Verify RBAC gate in `src/app/organization/[id]/hearings/page.tsx` executes before any data fetch — site-role users never trigger `fetchOrganizationHearings`

---

## Phase 7: Testing

**Purpose**: Unit and E2E test coverage.

- [ ] T022 Create `src/app/organization/[id]/hearings/components/__tests__/OrgHearingsPage.test.tsx` — test: OrgAdmin role renders hearings list; SiteAdmin role shows access denied; no future hearings shows EmptyState; past hearings filtered out; hearings sorted ascending; row click invokes `router.push` with correct caseId/siteId
- [ ] T023 Create `e2e/024-organization-hearings.spec.ts` — E2E: page loads with future hearings for OrgAdmin; empty state when no upcoming hearings; past-only org shows empty state; row click navigates to case page; SiteAdmin URL access shows denied; multiple hearings sorted earliest-first

---

## Phase 8: Logging

**Purpose**: Instrument observability events per plan.md §10.

- [ ] T024 Add INFO log in `useOrgHearings.ts` on successful fetch: `orgId`, `userId`, total count, future count — do NOT log `hearingNotes` or case content
- [ ] T025 [P] Add ERROR log in `useOrgHearings.ts` on fetch failure: `orgId`, `userId`, HTTP status
- [ ] T026 [P] Add WARN log in `src/app/organization/[id]/hearings/page.tsx` on access denied: `userId`, `role`, `orgId`
- [ ] T027 [P] Add INFO log in row-click handler on navigation: `userId`, `caseId`, `siteId`

---

## Phase 9: Quality Gates

**Purpose**: Ensure code passes all pre-commit checks.

- [ ] T028 Run `npm run type-check` — resolve all TypeScript errors in new files (`page.tsx`, `HearingsList.tsx`, `HearingRow.tsx`, `useOrgHearings.ts`, `index.ts`)
- [ ] T029 [P] Run `npm run lint` — resolve all ESLint errors in new files
- [ ] T030 [P] Run `npm run build` — production build must succeed with no new errors

---

## Phase 10: Finalization

**Purpose**: Polish, documentation, and branch readiness.

- [ ] T031 Verify `HearingRow` uses `formatDateTime` utility for consistent date display (per plan.md §4.2)
- [ ] T032 [P] Verify `React.memo` is applied to `HearingRow` component (per plan.md §4.3)
- [ ] T033 [P] Confirm `src/app/organization/services/api.ts` `fetchOrganizationHearings` signature is unchanged — no breaking change to existing callers

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: Start immediately — no dependencies
- **UI (Phase 2)**: Requires Phase 1 directory creation
- **Logic (Phase 3)**: Requires Phase 2 components and Phase 4 API verification
- **API (Phase 4)**: Can begin in parallel with Phase 2
- **Backend (Phase 5)**: Can begin immediately — verification only
- **Security (Phase 6)**: Requires Phase 2 and Phase 3 complete
- **Testing (Phase 7)**: Requires Phase 2, 3, 4 complete
- **Logging (Phase 8)**: Requires Phase 3 complete
- **Quality Gates (Phase 9)**: Requires all prior phases complete
- **Finalization (Phase 10)**: Requires Phase 9 passing

## Parallel Opportunities

```bash
# Phase 2 — all components can be built in parallel (different files):
T005: HearingRow.tsx
T006: HearingsList.tsx
T007: index.ts

# Phase 3 — hook and type can be built in parallel:
T009: useOrgHearings.ts
T010: OrgHearing type
T012: RBAC check
```

## Implementation Strategy

### MVP (User Story 1 Only)
1. Phase 1: Setup
2. Phase 4: Verify API
3. Phase 2: Build HearingRow + HearingsList UI
4. Phase 3: Build useOrgHearings hook + wire page
5. Validate: OrgAdmin sees filtered, sorted future hearings
6. Phase 6: Security review
7. Add User Story 2 (row click navigation)

### Total Task Count: 33
- US1 tasks: 22 | US2 tasks: 2 | Cross-cutting: 9
