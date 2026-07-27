# Phase 0 Research: Pagination, Sorting & Filtering for List Views

All unknowns from the Technical Context are resolved below. The backend integration guide
([contracts/backend-integration-guide.md](contracts/backend-integration-guide.md)) is the source of
truth for the endpoint matrix, contract shape, and clamping rules; this document records the
frontend design decisions that flow from it.

## R1. Response-shape migration strategy (P1 — correctness)

- **Decision**: Change each in-scope service's data accessor from `response.data?.data` (array) to
  `response.data?.data` (a `PagedResponse<T>` object) and return either the full paged object or
  destructure `items` depending on the caller's needs. Introduce a single generic
  `PagedResponse<T>` interface in `src/types/pagination.ts` reused by every domain `types/` file.
- **Rationale**: Centralizing the wrapper type satisfies Principle I (typed shapes, no inline
  assertions) and prevents per-domain drift. A successful empty page is `200` with `items: []` and a
  correct `totalCount`, so list code must treat `items: []` as a valid empty state, never an error
  (FR-003, Edge: empty results).
- **Alternatives considered**:
  - *Per-domain ad-hoc paged interfaces* (as eCourts did with `PersistedEcourtCasesResponse`) —
    rejected as duplicative; we generalize to one `PagedResponse<T>`.
  - *A response adapter that flattens paged → array to avoid touching call sites* — rejected: it
    throws away the metadata (`totalCount`, `hasNextPage`) the pager needs and hides the breaking
    change instead of addressing it.

## R2. Empty vs. not-found vs. unauthorized disambiguation

- **Decision**: Map status codes per the guide §4 — `200` (incl. empty) → render list/empty state;
  `400` → user-friendly filter-validation toast, preserve last valid list; `401` → existing
  refresh/logout flow; `404` (parent org/site/case missing) → distinct not-found screen state.
- **Rationale**: FR-004 requires three visually distinct states. Existing services already use
  `validateStatus` to special-case `404` for single-record reads; list reads must NOT special-case
  `404` for emptiness (the backend never returns `404` for an empty list).
- **Alternatives considered**: Treating any non-200 uniformly as "error" — rejected; collapses the
  three states the spec requires to be distinguished.

## R3. View-state ownership and URL persistence (FR-020)

- **Decision**: A single `useListQuery` hook (in `src/hooks/`) owns `{ page, pageSize, sortBy,
  sortDirection, filters }`, reads initial values from the URL via `useSearchParams`, and writes
  changes back with `router.replace` (shallow, no scroll) so refresh/back/bookmark reconstruct the
  exact view. Each list passes a config (default sort, allowed sort tokens, filter schema) so the
  hook validates/normalizes incoming URL values against the allow-list.
- **Rationale**: `next/navigation`'s `useSearchParams`/`useRouter` are already the established URL
  primitives in this codebase. Keeping state in the URL (not Redux) makes views shareable and
  avoids persisting volatile view state. Per-list config keeps the hook generic while enforcing
  allow-lists (Assumption: only supported sort/filter tokens are offered).
- **Alternatives considered**:
  - *Redux slice per list* — rejected: not shareable/bookmarkable, adds persistence surface, and the
    spec explicitly chose URL encoding.
  - *Local `useState` only* — rejected: does not survive refresh/back-navigation (fails FR-020).

## R4. Pagination interaction pattern & component

- **Decision**: Build one shared `ListFooterPager` (in `src/components/`) composing MUI
  `<Pagination>` (numbered, prev/next), an MUI `<Select>` page-size control (options e.g. 10/20/50/100,
  default 20), and a visible total-count label ("X–Y of N"). It reads `totalCount`/`totalPages`/
  `hasNextPage`/`hasPreviousPage` and emits `onPageChange`/`onPageSizeChange`. Changing page size
  resets to page 1 (FR-007); changing sort/filter resets to page 1 (FR-013) — reset lives in
  `useListQuery`, not the pager.
- **Rationale**: Clarifications fixed the pattern as a numbered footer pager with page-size selector
  and total count. MUI `<Pagination>` already proven in `SearchTab.tsx`; generalizing it avoids
  reimplementation (Principle VI) and gives one consistent control across all in-scope lists.
- **Alternatives considered**: Infinite scroll / "load more" — rejected; clarification selected a
  numbered footer pager. Per-screen bespoke pagers — rejected; inconsistent and duplicative.

## R5. Sorting UX bound to allow-lists

- **Decision**: Each list declares its sortable columns from the §6 allow-list. Sortable column
  headers (or a sort dropdown where there's no table header) toggle `sortBy`/`sortDirection`
  (asc↔desc) and are the only sort options exposed. When no sort is chosen, omit `sortBy` and let the
  backend default apply (FR-010). Only allow-listed tokens are ever sent.
- **Rationale**: Sending an unsupported token silently falls back to default sort (guide §6 note), so
  constraining the UI to the allow-list prevents the user's intent being silently ignored (FR-009,
  Edge: unsupported sort token).
- **Alternatives considered**: Free-form sort field entry — rejected; enables silent fallback.

## R6. Filtering UX and value formats

- **Decision**: Per list, render only that list's supported filters from §6, mapping each to its
  query param. Reuse MUI controls: `Select` for enums (`status`, `role`, `type`, `priority`),
  `TextField` (debounced) for `search`, MUI date pickers for `from`/`to` date ranges, and entity
  pickers (`siteId`, `assigneeId`, `clientId`, `assignedExpertId`, `court`) where applicable. Filters
  combine as AND (FR-012). Date ranges submit ISO-8601 and are validated client-side to prevent
  end-before-start (FR-016) before the request. A "Clear filters" action resets to the unfiltered
  default (FR-014).
- **Rationale**: Enum filter values are validated server-side and return `400` on bad input (guide
  §8 open item) — so the UI offers fixed enum options rather than free text, and surfaces backend
  `400` messages via `useToast` while preserving the last valid list (FR-015).
- **Open coordination item**: exact accepted enum string values (`status`/`role`/`type`/`priority`)
  and date format granularity (date vs. date-time) are confirmed against the backend per guide §8.2.
  Until confirmed, the UI sources enum options from existing frontend enum/reference data already used
  on create/edit screens for the same fields.
- **Alternatives considered**: Free-text enum entry — rejected (guaranteed `400`s, poor UX).

## R7. Reusing existing error handling & auth

- **Decision**: Route all list/filter errors through `src/utils/errorHandler.ts` and surface via
  `useToast()`; keep the existing Axios + `getToken()` per-service pattern and Keycloak 401
  refresh/logout untouched.
- **Rationale**: Principles IV & V; FR-015/FR-017. No new auth or transport surface is warranted for
  a read-path change.

## R8. Loading/updating indicators (FR-019)

- **Decision**: Each list tracks an `isFetching` state from its service call; the pager/filter
  controls show a loading affordance (skeleton rows or overlay spinner) during page/sort/filter
  changes and disable controls mid-request to avoid race conditions. Standardize a lightweight
  "updating" treatment so all in-scope lists behave consistently.
- **Rationale**: FR-019 + SC-003 require visible feedback during updates.

## R9. Coordinated cutover (FR-018, SC-008)

- **Decision**: Treat the in-scope frontend changes as a single coordinated release with the backend
  (deploy together or behind a coordinated switch). No frontend feature flag is introduced unless the
  release sequencing in guide §8.1 mandates one; sequencing is confirmed before merge.
- **Rationale**: The shape change is breaking; a mismatched-shape window would break lists. This is a
  release-process decision recorded here, not a code abstraction.
- **Confirmed release sequence** (per backend-integration-guide §8.1, backend branch
  `003-pagination-sorting-filtering` status: Implemented & unit-tested):
  1. **Pre-deploy**: Verify backend branch is merged to the target environment first.
  2. **Deploy backend**: Merge and deploy `003-pagination-sorting-filtering` to the target
     environment. At this point, in-scope list endpoints return `PagedResponse<T>`; any
     existing frontend without this PR will break on those lists.
  3. **Deploy frontend immediately after** (within the same deployment window): Merge and deploy
     this PR (`035-pagination-sorting-filtering`). The frontend now reads `data.items` and
     renders the pager/sort/filter controls correctly.
  4. **Post-deploy smoke test**: Open each major list screen (cases, users, sites, legal experts,
     clients, hearings) and confirm records display, paging navigates correctly, and no console
     errors appear. Run the Playwright E2E suite if a staging environment is available.
  5. **Rollback plan**: If an issue is found, roll back **both** services simultaneously to
     maintain shape consistency. Do not roll back only one side.
- **PR description must include** the above sequence (steps 1–5) so the reviewer and release
  engineer understand the deployment constraint. Reference SC-008 as the acceptance criterion.

## R10. Rollout order across ~40 endpoints

- **Decision**: Deliver in the spec's priority order but as a single sweep (per clarification): first
  land the shared foundation (types + `useListQuery` + `ListFooterPager` + filter controls), then
  migrate lists. Within the sweep, do P1 accessor correctness for a list immediately followed by its
  pager/sort/filter wiring, grouped by domain (cases → users → sites/orgs → legal experts/clients →
  hearings/appointments → orders/settlements/ratings → case-scoped lists → eCourts) to keep PRs
  reviewable and each list fully delivered (no list left P1-only).
- **Rationale**: Single-sweep scope was clarified. Building the foundation first prevents N bespoke
  pagers; grouping by domain keeps changes cohesive and testable.
