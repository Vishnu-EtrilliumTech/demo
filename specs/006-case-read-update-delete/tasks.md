# Tasks: Case Read, Update & Delete

**Input**: `specs/006-case-read-update-delete/`
**Branch**: `006-case-read-update-delete`

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1=View cases list with filter, US2=View case detail, US3=Update case, US4=Delete case

---

## Phase 1: Setup

**Purpose**: Audit existing components and identify each gap before writing any new code.

- [ ] T001 Read `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/page.tsx` — confirm `useUserRole(orgId)` is called; identify whether OrgClerk guard (redirect/access-denied) is present or absent
- [ ] T002 [P] Read `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/CaseHeader/CaseHeader.tsx` — audit Edit/Delete button visibility (check for `canEditCases`/`canDeleteCases` conditional renders and whether a delete confirmation dialog exists)
- [ ] T003 [P] Read `src/app/organization/[id]/sites/[siteId]/cases/page.tsx` (or cases list section) — audit existing status filter UI; confirm `statusFilter` state and `filteredCases` derivation is absent (gap from plan)
- [ ] T004 [P] Verify `useUserRole` exports `canEditCases`, `canDeleteCases`, `isOrganizationClerk`, `isSiteCaseClient` flags

---

## Phase 2: UI

**Purpose**: Add status filter UI, StatusBadge component, delete dialog, and OrgClerk access-denied state.

- [ ] T005 [P] [US1] Create `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/shared/StatusBadge.tsx` — MUI `Chip` with color-coded status: Open=blue (`#1976d2`/`#e3f2fd`), InProgress=yellow, OnHold=orange, Closed=grey; prop `status: string`, `size?: 'small' | 'medium'`
- [ ] T006 [US1] Add status filter chip/toggle row to `src/app/organization/[id]/sites/[siteId]/cases/page.tsx` — MUI `ToggleButtonGroup` or Chip row with options: All | Open | InProgress | OnHold | Closed; show "No cases match this filter" empty state when filtered list is empty
- [ ] T007 [US2] Add OrgClerk access-denied block in `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/page.tsx` — MUI Card with warning icon and "You do not have permission to view case details." text plus a Back button; render this instead of the full case page when `isOrganizationClerk=true`
- [ ] T008 [US4] Add MUI `Dialog` confirmation to `CaseHeader.tsx` — opened on "Delete" button click; body text: "Are you sure you want to permanently delete this case and all its associated data? This cannot be undone."; Confirm and Cancel buttons

---

## Phase 3: Logic

**Purpose**: Implement status filter state, OrgClerk guard, and role-gated action visibility.

- [ ] T009 [US1] Add `statusFilter: string` state (default `''` = All) to the cases list page in `src/app/organization/[id]/sites/[siteId]/cases/page.tsx`; derive `filteredCases = cases.filter(c => !statusFilter || c.status === statusFilter)`
- [ ] T010 [US2] Add OrgClerk role guard in `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/page.tsx` — after `useUserRole` resolves and `!isLoading`, if `isOrganizationClerk` render access-denied block without calling `useCaseData`
- [ ] T011 [US3] Verify Edit button in `CaseHeader.tsx` is only rendered when `{canEditCases && !isSiteCaseClient && <Button>Edit</Button>}` — add the conditional wrap if it renders unconditionally
- [ ] T012 [US4] Verify Delete button in `CaseHeader.tsx` is only rendered when `{canDeleteCases && !isSiteCaseClient && <Button>Delete</Button>}` — add conditional wrap if absent; wire button click to `setDeleteDialogOpen(true)` instead of direct `handleDeleteCase()`
- [ ] T013 [US4] Add `deleteDialogOpen: boolean` state in `CaseHeader.tsx` (or `useCaseData`); confirm delete action calls `deleteCase(orgId, siteId, caseId)` only after user confirms dialog; on success call `showSuccess` + `router.push` to cases list

---

## Phase 4: API

**Purpose**: Verify existing API functions match the expected contract.

- [ ] T014 [P] Confirm `deleteCase(orgId, siteId, caseId)` in `src/app/organization/services/api.ts` calls `DELETE /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}` and handles `204` response
- [ ] T015 [P] Confirm `updateCase()` in `src/app/organization/services/api.ts` calls `PUT` and accepts `UpdateCaseRequest` — verify title and status can be updated independently

---

## Phase 5: Backend

**Purpose**: Verify backend enforces OrgClerk 403 on case detail and deletion.

- [ ] T016 Confirm GET `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}` with OrgClerk Bearer token returns `403` — backend must enforce independently of frontend guard
- [ ] T017 [P] Confirm DELETE `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}` with `SiteSrLegalExpert` token returns `403` — only OrgAdmin/SiteAdmin/SiteClerk should be able to delete

---

## Phase 6: Security

**Purpose**: Enforce RBAC guards on all case actions and prevent accidental deletion.

- [ ] T018 [US2] Verify OrgClerk guard shows loading state until `useUserRole` resolves — no flash of full case detail before guard check completes; spinner shown during role load
- [ ] T019 [US4] Verify delete confirmation dialog is the only path to `deleteCase()` — no keyboard shortcut or programmatic call bypasses the dialog
- [ ] T020 [US2] Verify `SiteCaseClient` sees case detail read-only with zero edit/delete/action controls anywhere on the page (not just in `CaseHeader`)

---

## Phase 7: Testing

**Purpose**: Unit and E2E coverage for all four user stories.

- [ ] T021 [P] [US1] Write unit test `src/app/organization/[id]/sites/[siteId]/cases/__tests__/page.test.tsx` — status filter "Open" shows only Open cases; "All" shows all cases; empty filtered result shows "No cases match" message
- [ ] T022 [P] [US2] Write unit test `[caseId]/page.test.tsx` — OrgClerk role renders access-denied card (not case detail); non-OrgClerk renders full page
- [ ] T023 [P] [US3] Write unit test `CaseHeader.test.tsx` — OrgAdmin → Edit and Delete buttons visible; `SiteSrLegalExpert` → Edit visible, Delete hidden; `SiteCaseClient` → neither button visible; Delete click → dialog opens; Confirm → `deleteCase` called once
- [ ] T024 [P] [US1] Write unit test `StatusBadge.test.tsx` — Open status renders blue chip; Unknown status renders default chip without crash
- [ ] T025 Write E2E test `e2e/006-case-read-update-delete.spec.ts` — SiteClerk views cases list and applies Open filter; SiteAdmin views case detail with 7 tabs; SiteAdmin edits case title; OrgAdmin deletes case with confirmation; OrgClerk blocked from case detail; SiteCaseClient reads case detail with no Edit/Delete buttons

---

## Phase 8: Logging

**Purpose**: Structured logging per plan section 10.

- [ ] T026 Add `console.warn('[CaseDetail] OrgClerk access blocked for caseId:', caseId)` in case detail page when guard fires; add `console.error('[CaseDelete] Error:', error.message)` in delete handler on failure — never log case title, assignee name, or token

---

## Phase 9: Quality Gates

**Purpose**: Pre-commit checks must pass.

- [ ] T027 Run `npm run type-check` — fix TypeScript errors in `StatusBadge.tsx`, modified `CaseHeader.tsx`, `page.tsx` (cases list and detail), and updated `useCaseData.ts`
- [ ] T028 [P] Run `npm run lint` — fix all ESLint warnings
- [ ] T029 Run `npm run build` — production build passes
- [ ] T030 [P] Run `npm run test` — all new unit tests pass

---

## Phase 10: Finalization

**Purpose**: Final review and commit.

- [ ] T031 Verify `StatusBadge` is used consistently in both the cases list (status column) and case detail header to prevent color inconsistency
- [ ] T032 [P] Verify delete dialog body text explicitly mentions "all associated data" to meet SC-003 (zero deletion without understanding consequences)
- [ ] T033 Commit: `feat(006): add status filter, delete confirmation dialog, OrgClerk guard, and RBAC-gated edit/delete actions`

---

## Dependencies

- **Setup (Phase 1)**: Start immediately
- **UI (Phase 2)**: Depends on T001–T004 audit; T005 (StatusBadge) can start after T004
- **Logic (Phase 3)**: Depends on T001–T004; T013 depends on T012
- **API (Phase 4)**: Parallel with UI/Logic — read-only verification
- **Security (Phase 6)**: Depends on Logic (Phase 3)
- **Testing (Phase 7)**: Depends on all implementation phases

### Parallel Opportunities

```
After Setup:
  [Parallel] T005 (StatusBadge) + T006 (filter UI) + T007 (access-denied UI) + T008 (dialog UI)
  [Parallel] API verification (T014-T015) + Logic (T009-T013)

After Implementation:
  [Parallel] T021 + T022 + T023 + T024 (all unit test files)
  [Parallel] T027 (type-check) + T028 (lint) + T030 (tests)
```
