---
description: "Task list for Pagination, Sorting & Filtering for List Views"
---

# Tasks: Pagination, Sorting & Filtering for List Views

**Input**: Design documents from `/specs/035-pagination-sorting-filtering/`
**Prerequisites**: plan.md âœ…, spec.md âœ…, research.md âœ…, data-model.md âœ…, contracts/ âœ…

**Tests**: Test tasks ARE included â€” the plan's Constitution Check (Principle III) explicitly mandates RTL unit tests for the shared `useListQuery` hook and `ListFooterPager` component plus a Playwright E2E for the golden path and edge cases.

**Organization**: Tasks are grouped by user story (P1â€“P4) to enable independent implementation and testing. Per the spec clarification, this is a **single sweep**: every in-scope list receives full paging + sorting + filtering, with P1 correctness delivered as the prerequisite for all of them.

**Source of truth for the endpoint matrix** (sort allow-lists + filters per endpoint): [contracts/backend-integration-guide.md Â§6](contracts/backend-integration-guide.md). Frontend type/hook/component contracts: [contracts/frontend-contracts.md](contracts/frontend-contracts.md).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps the task to a user story (US1, US2, US3, US4)
- Exact file paths are included in each description

## Codebase grounding (from survey)

- List calls live mainly in [src/app/organization/services/api.ts](../../src/app/organization/services/api.ts), [src/app/organization/services/caseapi.ts](../../src/app/organization/services/caseapi.ts), and [src/app/organization/services/ecourtapi.ts](../../src/app/organization/services/ecourtapi.ts) â€” they currently return `res.data?.data ?? []`.
- Case-scoped lists render in `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/*Tab/` and case hooks (`useCaseData.ts`, `useCaseClients.ts`).
- eCourts lists render in `src/app/organization/[id]/ecourts/components/` (`SavedCasesTab.tsx`, `SearchTab.tsx`, `HistoryTab.tsx`) â€” `SearchTab` already uses MUI `<Pagination>`.
- Admin-dashboard lists (`src/app/admin-dashboard/{legal-experts,client-list,appointment-list,payment-list}/page.tsx`) are currently placeholders (`fetch('your-api-endpoint')`) â€” their service functions for legal experts / clients / appointments / orders / settlements / ratings must be created as part of US1.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm dependencies and folder scaffolding before building shared assets.

- [X] T001 Verify MUI date-picker deps for date-range filters (`@mui/x-date-pickers` + a date adapter) exist in [package.json](../../package.json); add them only if missing (MUI 6 already present â€” do not change major versions).
- [X] T002 [P] Create folder scaffolding: `src/components/filters/` (with an `index.ts` barrel) and confirm `src/types/`, `src/hooks/`, `src/utils/` exist for the new shared assets per [plan.md](plan.md) Project Structure.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared, typed primitives every in-scope list depends on.

**âš ï¸ CRITICAL**: No user-story work can begin until this phase is complete.

- [X] T003 Create `src/types/pagination.ts` with `SortDirection`, generic `PagedResponse<T>`, `PageRequestParams`, and `ListQueryState<F>` exactly per [frontend-contracts.md Â§1](contracts/frontend-contracts.md) and [data-model.md](data-model.md) Entities 1â€“4 (no `any`; Principle I).
- [X] T004 Create `src/utils/pagination.ts` exporting `buildListParams<F>(state)` per [frontend-contracts.md Â§2](contracts/frontend-contracts.md) â€” omits unset `sortBy`/`sortDirection` (FR-010) and empty filter values; does NOT clamp page/pageSize (backend is the clamping authority).
- [X] T005 [P] Create `src/utils/pagination.test.tsx` unit tests for `buildListParams` (omits defaults/undefined, passes through active filters, preserves explicit page/pageSize).
- [X] T006 Add a list-error helper to [src/utils/errorHandler.ts](../../src/utils/errorHandler.ts) that distinguishes `400` invalid-filter (user-friendly toast, preserve last valid list â€” FR-015), `404` parent-not-found, `401` auth (existing refresh/logout), and `200`-with-empty-items (valid empty state â€” FR-003/FR-004) per [research.md](research.md) R2/R7.

**Checkpoint**: Shared types + param builder + error mapping ready â€” user stories can begin.

---

## Phase 3: User Story 1 - Lists keep displaying correctly after the response-shape change (Priority: P1) ðŸŽ¯ MVP

**Goal**: Restore correct rendering of every in-scope list against the new `PagedResponse<T>` shape â€” read `data.items`, treat empty `items` as a valid empty state, and keep out-of-scope endpoints untouched.

**Independent Test**: Point the frontend at a backend build returning the paged shape, open each affected list screen, and confirm records render exactly as before with no runtime errors and no false "empty" states.

- [X] T007 [US1] Migrate org-level list accessors in [src/app/organization/services/api.ts](../../src/app/organization/services/api.ts) to return `PagedResponse<T>` and accept `PageRequestParams & filters`: `fetchOrganizationCases`, `fetchSiteCases`, `fetchOrganizationUsers`, `fetchSiteUsers`, `fetchOrganizationSites`, `fetchOrganizationHearings`, `fetchSiteHearings`, `fetchOrganizationUserSites`, `fetchSiteUserCases`, `fetchSiteUserTasks`, `fetchSiteUserHearings`, and org-level `fetchCaseInvoices` â€” change `res.data?.data ?? []` â†’ `res.data?.data` (typed `PagedResponse<T>`); default empty params yield backend page 1.
- [X] T008 [US1] Update consumers of the api.ts lists to read `.items` and show an empty state (not error) on empty: [cases/page.tsx](../../src/app/organization/[id]/cases/page.tsx), [users/page.tsx](../../src/app/organization/[id]/users/page.tsx), [sites/page.tsx](../../src/app/organization/[id]/sites/page.tsx), [hearings/page.tsx](../../src/app/organization/[id]/hearings/page.tsx), [sites/[siteId]/hearings/page.tsx](../../src/app/organization/[id]/sites/[siteId]/hearings/page.tsx), [sites/[siteId]/page.tsx](../../src/app/organization/[id]/sites/[siteId]/page.tsx), and the site-user pages.
- [X] T009 [P] [US1] Migrate case-scoped list accessors in [src/app/organization/services/caseapi.ts](../../src/app/organization/services/caseapi.ts) to `PagedResponse<T>` + params: `fetchCaseClients`, `fetchCaseTasks`, `fetchTasksByAssignee`, `fetchTaskDocuments`, `fetchCaseDocuments`, `fetchCaseHearings`, `fetchCaseComments`, `fetchTaskComments`, case-level `fetchCaseInvoices`, `fetchCaseContributors`, `fetchAvailableContributorUsers`.
- [X] T010 [US1] Update case-detail tab consumers + hooks to read `.items`: `components/{DocumentsTab,CommentsTab,TasksTab,TaskCommentsTab,HearingsTab,InvoiceTab,ClientsTab,ContributorsTab}/` and the hooks [useCaseData.ts](../../src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/useCaseData.ts) and [useCaseClients.ts](../../src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/useCaseClients.ts), all under `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/`.
- [X] T011 [P] [US1] Migrate eCourts list accessors in [src/app/organization/services/ecourtapi.ts](../../src/app/organization/services/ecourtapi.ts) to the shared `PagedResponse<T>`: `fetchPersistedEcourtCases` (`courtdata/persisted`), `fetchUnlinkedCases` (`cases/unlinked`), and align the already-paged `searchEcourts` (`ecourts/search`) to the shared type; update consumers [SavedCasesTab.tsx](../../src/app/organization/[id]/ecourts/components/SavedCasesTab.tsx), [SearchTab.tsx](../../src/app/organization/[id]/ecourts/components/SearchTab.tsx), [HistoryTab.tsx](../../src/app/organization/[id]/ecourts/components/HistoryTab.tsx) and unlinked-case consumers to read `.items`.
- [X] T012 [US1] Create domain service functions + co-located types for the admin-dashboard lists (currently placeholders), each returning `PagedResponse<T>` and accepting `PageRequestParams & filters`, then replace the placeholder `fetch('your-api-endpoint')` calls in [admin-dashboard/legal-experts/page.tsx](../../src/app/admin-dashboard/legal-experts/page.tsx) and [admin-dashboard/client-list/page.tsx](../../src/app/admin-dashboard/client-list/page.tsx): legal experts (+ appointment-count, approved/{status} variants), clients, and `legalexperts/{id}/cases` + legal-expert communications.
- [X] T013 [US1] Create domain service functions + consume `.items` for the remaining admin-dashboard lists: appointments (`past`, `pending`, `legalexperts/{id}/{pending,past,bydate}`, `clients/{id}/{pending,past,bydate}`), orders (`orders/legalexperts/{id}`, `orders/clients/{id}`), `paymentsettlements/legalexperts/{id}`, and `ratings/legalexperts/{id}` â€” wiring [admin-dashboard/appointment-list/page.tsx](../../src/app/admin-dashboard/appointment-list/page.tsx) and [admin-dashboard/payment-list/page.tsx](../../src/app/admin-dashboard/payment-list/page.tsx).
- [X] T014 [US1] Apply the three-way state handling from T006 across all migrated lists: empty `items` â†’ empty state (FR-003), `404` parent org/site/case â†’ distinct not-found state (FR-004), `401` â†’ existing flow; ensure no list special-cases `404` for emptiness ([research.md](research.md) R2).
- [X] T015 [US1] Audit and confirm out-of-scope endpoints are left unchanged (reference-data lookups â€” states, eCourt states/districts via `fetchCauselistStates`/`fetchCauselistDistricts`, legal-expert types/portfolios, schedules, addresses, capabilities â€” and single-record GETs like `fetchCase`/`fetchUser`/`fetchSite`/`fetchInvoice`); they keep their array/object shapes (FR-002).

**Checkpoint**: All in-scope lists render correctly against the paged shape with proper empty/not-found states. This is the deployable MVP (coordinate cutover per FR-018).

---

## Phase 4: User Story 2 - Users can page through long lists (Priority: P2)

**Goal**: A consistent numbered footer pager (prev/next + page numbers + page-size selector + visible total count) on every in-scope list, with all view state in the URL.

**Independent Test**: Open a list with more records than one page, move forward/back and change page size, and confirm displayed records and paging indicators update correctly with no duplicate/skipped records.

- [X] T016 [US2] Create `src/hooks/useListQuery.ts` per [frontend-contracts.md Â§3](contracts/frontend-contracts.md): owns `{page,pageSize,sortBy,sortDirection,filters}`, reads initial state from the URL (`useSearchParams`), writes changes via `router.replace` (shallow, no scroll) for refresh/back/bookmark (FR-020), exposes `setPage/setPageSize/setSort/clearSort/setFilter/clearFilters` and a `params` output (via `buildListParams`); `setPageSize/setSort/setFilter/clearFilters` reset `page â†’ 1` (FR-007, FR-013); `setSort` no-ops tokens outside `sortableFields` (FR-009).
- [X] T017 [P] [US2] Create `src/hooks/useListQuery.test.tsx`: initial state read + normalization from URL, drop of disallowed sort/filter tokens, reset-to-page-1 on size/sort/filter changes, allow-list rejection in `setSort`.
- [X] T018 [US2] Create `src/components/ListFooterPager.tsx` per [frontend-contracts.md Â§4](contracts/frontend-contracts.md): MUI `<Pagination>` (numbered, prev/next) + MUI `<Select>` page-size control (default options `[10,20,50,100]`, default 20) + "{from}â€“{to} of {totalCount}" label; disables next/prev from `hasNextPage`/`hasPreviousPage` (FR-006); `disabled` prop greys controls during fetch (FR-019); emits `onPageChange`/`onPageSizeChange` only.
- [X] T019 [P] [US2] Create `src/components/ListFooterPager.test.tsx`: prev disabled on first page, next disabled on last page, page-size change emits, range label correctness, disabled state.
- [X] T020 [US2] Wire `useListQuery` + `ListFooterPager` into the cases lists (org cases [cases/page.tsx](../../src/app/organization/[id]/cases/page.tsx), site cases, unlinked cases) â€” thread `params` into `fetchOrganizationCases`/`fetchSiteCases`/`fetchUnlinkedCases` and render the pager from `PagedResponse` metadata.
- [X] T021 [US2] Wire paging into the users lists: org users [users/page.tsx](../../src/app/organization/[id]/users/page.tsx), site users, and system users.
- [X] T022 [US2] Wire paging into sites [sites/page.tsx](../../src/app/organization/[id]/sites/page.tsx), `{orgId}/sites/users/{userId}` (site-users-by-user), and the organizations list.
- [X] T023 [US2] Wire paging into hearings: org hearings [hearings/page.tsx](../../src/app/organization/[id]/hearings/page.tsx) and site hearings.
- [X] T024 [US2] Wire paging into admin-dashboard legal experts + clients lists ([legal-experts/page.tsx](../../src/app/admin-dashboard/legal-experts/page.tsx), [client-list/page.tsx](../../src/app/admin-dashboard/client-list/page.tsx)) and `legalexperts/{id}/cases`.
- [X] T025 [US2] Wire paging into admin-dashboard appointments/orders/settlements/ratings + legal-expert communications ([appointment-list/page.tsx](../../src/app/admin-dashboard/appointment-list/page.tsx), [payment-list/page.tsx](../../src/app/admin-dashboard/payment-list/page.tsx)).
- [X] T026 [US2] Wire paging into case-scoped tabs (documents, comments, tasks + task-by-assignee/task-comments/task-documents, invoices, hearings, caseclients, contributors + available-users) under `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/`.
- [X] T027 [US2] Wire paging into eCourts: persisted ([SavedCasesTab.tsx](../../src/app/organization/[id]/ecourts/components/SavedCasesTab.tsx)) and search ([SearchTab.tsx](../../src/app/organization/[id]/ecourts/components/SearchTab.tsx)) â€” replace the bespoke `<Pagination>` in `SearchTab` with the shared `ListFooterPager`.
- [X] T028 [US2] Standardize a loading/updating affordance (skeleton rows or overlay spinner) driven by each list's `isFetching` and pass `disabled` to `ListFooterPager` during page changes across all wired lists (FR-019, SC-003).

**Checkpoint**: Every in-scope list is paginated with consistent controls and URL-persisted page/pageSize.

---

## Phase 5: User Story 3 - Users can sort lists by supported columns (Priority: P3)

**Goal**: Server-driven sorting limited to each list's allow-list, toggled asc/desc, with default sort applied when none chosen.

**Independent Test**: On a sortable list, choose a supported column and toggle direction; confirm order changes across all pages and paging still works under the sort.

- [X] T029 [US3] Create a reusable sortable-column-header / sort-control helper in `src/components/` that binds to a list's `sortableFields` and calls `useListQuery.setSort`/`clearSort`, showing asc/desc indicators and exposing only allow-listed columns.
- [X] T030 [US3] Wire sorting for cases lists â€” allow-list `createdDate,title,caseNumber,status` (unlinked: `createdDate,title,caseNumber`); default `createdDate desc`.
- [X] T031 [US3] Wire sorting for users lists â€” `name,email,createdDate,role`; default `name asc`.
- [X] T032 [US3] Wire sorting for sites + organizations lists â€” `name,createdDate,status`; default `name asc`.
- [X] T033 [US3] Wire sorting for hearings lists â€” `hearingDate,createdDate`; default `hearingDate asc`.
- [X] T034 [US3] Wire sorting for legal experts (`name,expertType,approvalStatus`; count variant adds `appointmentCount`) and clients (`name,email,createdDate`).
- [X] T035 [US3] Wire sorting for orders/settlements (`createdDate,status`), ratings (`createdDate,ratingValue`), appointments (`appointmentDate`), and `legalexperts/{id}/cases` (`createdDate,title,status`).
- [X] T036 [US3] Wire sorting for case-scoped lists per §6 — documents (`uploadedDate,name,type`), comments (`createdDate`), tasks (`createdDate,dueDate,status,priority`; assignee variant `dueDate,status,priority`), invoices (`createdDate,status`), hearings (`hearingDate,createdDate`), caseclients (`name`), contributors (`name,role`), communications (`createdDate,type`).
- [X] T037 [US3] Wire sorting for eCourts persisted (`lastRefreshed,cnr,title`); ensure NO sort UI is offered for `ecourts/search` (proxy order — no allow-list).
- [X] T038 [US3] Verify across all lists that no `sortBy` is sent when the user has not chosen a sort (backend default applies — FR-010) and only allow-listed tokens are ever exposed/sent (FR-009; avoids silent fallback).

**Checkpoint**: Every list that supports sorting is sortable in both directions over its allow-list, with paging intact.

---

## Phase 6: User Story 4 - Users can filter lists by supported criteria (Priority: P3)

**Goal**: Server-driven filtering exposing only each list's supported filters, combined as AND, with clear/restore and invalid-input handling.

**Independent Test**: Apply each supported filter (and combinations), confirm records + total reflect the filtered set, paging operates over the filtered set, and clearing restores the full list.

- [X] T039 [US4] Create reusable filter controls in `src/components/filters/` per [frontend-contracts.md Â§6](contracts/frontend-contracts.md): `EnumSelectFilter` (status/role/type/priority/approvalStatus/ratingValue), debounced `TextSearchFilter` (`search`), `DateRangeFilter` (two MUI date pickers, ISO-8601, end â‰¥ start â€” FR-016), and `EntityRefFilter` (siteId/assigneeId/clientId/assignedExpertId/court/portfolio/expertType/uploaderId/authorId/caseId/linkedCaseId).
- [X] T040 [P] [US4] Create per-domain typed filter interfaces in co-located `types/` folders per [data-model.md](data-model.md) Entity 5 (e.g. `CaseListFilters`, `UserListFilters`, `HearingListFilters`, `DocumentListFilters`, `TaskListFilters`, etc.) to parameterize `ListQueryState['filters']` (Principle I).
- [X] T041 [US4] Wire filters for cases lists â€” `status,siteId,assignedExpertId,clientId,from,to,search` (site cases drop `siteId`; unlinked: `search` only).
- [X] T042 [US4] Wire filters for users lists â€” org users `siteId,role,status,search`; site users `role,status,search`; system users `role,search`.
- [X] T043 [US4] Wire filters for sites + organizations (`search,status`) and site-users-by-user (`search`).
- [X] T044 [US4] Wire filters for hearings â€” org `from,to,siteId,caseId,court`; site `from,to,caseId,court`.
- [X] T045 [US4] Wire filters for legal experts (`expertType,portfolio,approvalStatus,siteId,search`), clients (`search,status`), orders/settlements (`status,from,to`), ratings (`ratingValue,from,to`), appointments (`from,to`), and communications (`type,from,to`).
- [X] T046 [US4] Wire filters for case-scoped lists per Â§6 â€” documents (`type,uploaderId,from,to,search`), comments (`authorId,from,to`), tasks (`status,assigneeId,priority,from,to`; assignee variant `status,priority`), task comments (`authorId`), task documents (`type,uploaderId`), invoices (`status,from,to`), hearings (`from,to,court`), caseclients (`search`), contributors (`role,search`), available-users (`siteId,role,search`).
- [X] T047 [US4] Wire filters for eCourts â€” persisted (`cnr,title,linkedCaseId`) and search (`caseType,caseStatus,stateCode,districtCode,filingYear`).
- [X] T048 [US4] Implement "Clear filters" + combined AND narrowing + filtered `totalCount` reflection across all wired lists (FR-012, FR-014); confirm changing any filter resets to page 1 via `useListQuery` (FR-013).
- [X] T049 [US4] Handle `400` invalid-filter responses via the T006 helper + `useToast`, preserving the last valid list (FR-015), and enforce date-range end-not-before-start client-side before submit (FR-016).

**Checkpoint**: Every list that supports filtering can be narrowed, combined, cleared, and recovers gracefully from invalid input â€” all four user stories independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T050 [P] Confirm exact accepted enum filter values (`status`/`role`/`type`/`priority`/`approvalStatus`) and date granularity against the backend ([backend-integration-guide.md Â§8.2](contracts/backend-integration-guide.md)); until confirmed, source enum options from the existing create/edit screens for the same fields ([research.md](research.md) R6).
- [X] T051 Confirm coordinated cutover/release sequencing with the backend so users never hit a mismatched response shape (FR-018, SC-008); document the sequencing in the PR description ([research.md](research.md) R9).
- [X] T052 [P] Create `e2e/pagination-sorting-filtering.spec.ts` (Playwright) covering golden path (page/sort/filter), empty-page edge case, page-past-the-end, invalid-filter recovery, and URL-state restore on refresh/back ([quickstart.md](quickstart.md)).
- [X] T053 [P] Apply `React.memo`/`useCallback` to large list rows and memoize derived list data on the highest-volume lists (cases, users, documents) per Principle X / SC-003.
- [X] T054 Run `npm run type-check`, `npm run lint`, and `npm run build`; fix any TypeScript/lint regressions from the migration (no `--no-verify`).
- [X] T055 Run the [quickstart.md](quickstart.md) validation scenarios end-to-end and confirm SC-001â€¦SC-008 are met.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies â€” start immediately.
- **Foundational (Phase 2)**: Depends on Setup. **Blocks all user stories.**
- **User Story 1 (Phase 3)**: Depends on Foundational (needs `PagedResponse<T>` + error helper). Independently deployable MVP.
- **User Story 2 (Phase 4)**: Depends on Foundational; builds the shared `useListQuery` + `ListFooterPager`. Wiring tasks assume US1 accessors return `PagedResponse<T>`.
- **User Story 3 (Phase 5)**: Depends on US2's `useListQuery` (uses `setSort`). Independently testable per list.
- **User Story 4 (Phase 6)**: Depends on US2's `useListQuery` (uses `setFilter`). Independently testable per list.
- **Polish (Phase 7)**: Depends on the user stories being wired.

> Note: US3 and US4 reuse the `useListQuery` hook delivered in US2 (single-sweep design, [research.md](research.md) R10). Each story remains independently testable on any given list.

### Within Each User Story

- US1: service accessor change â†’ consumer `.items` update â†’ empty/not-found state handling.
- US2: hook + pager (+ their tests) before per-list wiring; loading affordance last.
- US3/US4: shared control/helper before per-list wiring; cross-cutting behaviors (default sort / clear filters / 400 handling) last.

### Parallel Opportunities

- T002 (setup) and T005 (param tests) are `[P]`.
- US1: T009 (caseapi) and T011 (ecourtapi) run in parallel with T007 (api.ts) â€” different files.
- US2: T017 (hook test) and T019 (pager test) are `[P]`; per-list wiring tasks (T020â€“T027) touch different files and can be parallelized across developers once the hook + pager exist.
- US3 per-list wiring (T030â€“T037) and US4 per-list wiring (T041â€“T047) are mostly different files â€” parallelizable across developers.
- US4: T040 (typed filter interfaces) is `[P]` against control creation.
- Polish: T050, T052, T053 are `[P]`.

---

## Parallel Example: User Story 1 service migrations

```bash
# Different service files â€” run together:
Task: "T007 [US1] Migrate org-level list accessors in api.ts"
Task: "T009 [US1] Migrate case-scoped list accessors in caseapi.ts"
Task: "T011 [US1] Migrate eCourts list accessors in ecourtapi.ts"
```

## Parallel Example: User Story 2 shared assets

```bash
# Hook and component tests are independent files:
Task: "T017 [US2] useListQuery.test.tsx"
Task: "T019 [US2] ListFooterPager.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup â†’ Phase 2 Foundational (types + buildListParams + error helper).
2. Phase 3 US1 â€” migrate every in-scope accessor to read `data.items` and handle empty/not-found.
3. **STOP and VALIDATE**: every affected list renders correctly with no false-empty/error states (SC-001/SC-002).
4. Deploy in coordination with the backend (FR-018) â€” this is the minimum to keep the app functional.

### Incremental Delivery (single sweep, priority order)

1. Foundation â†’ US1 (MVP, correctness everywhere).
2. Add US2 (paging) â†’ test â†’ demo.
3. Add US3 (sorting) â†’ test â†’ demo.
4. Add US4 (filtering) â†’ test â†’ demo.
5. Polish (enum confirmation, E2E, perf, build/quickstart validation).

### Parallel Team Strategy

After Foundational + US2 shared assets (hook + pager) land, split the per-list wiring (US2 T020â€“T027, US3 T030â€“T037, US4 T041â€“T047) by domain across developers â€” different files, independently testable.

---

## Notes

- `[P]` = different files, no dependency on incomplete tasks.
- Server-driven only: never re-sort or re-filter a page client-side in a way that contradicts the backend ([research.md](research.md), Assumptions).
- Expose only allow-listed sort/filter tokens per [Â§6 matrix](contracts/backend-integration-guide.md) to avoid silent fallback.
- Commit after each task or logical group; run `/speckit-analyze` before `/speckit-implement`.
- Out-of-scope reference-data lookups and single-record reads MUST stay unchanged (FR-002).
