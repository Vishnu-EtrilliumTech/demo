# Quickstart: Migrating a List View onto Pagination/Sorting/Filtering

How to take one in-scope list from the legacy plain-array shape to the new paged + sortable +
filterable pattern. Do these steps per list, in priority order, grouped by domain.

## Prerequisites

- The shared foundation exists: `src/types/pagination.ts`, `src/utils/pagination.ts`,
  `src/hooks/useListQuery.ts`, `src/components/ListFooterPager.tsx`, `src/components/filters/`.
- You know the endpoint's row in [contracts/backend-integration-guide.md §6](contracts/backend-integration-guide.md)
  (default sort, `sortBy` allow-list, filters).

## Step 1 — Type the page (P1, correctness)

In the domain `types/` folder, declare the filter interface and reuse the generic wrapper:

```ts
import type { PagedResponse } from '@/types/pagination';

export interface CaseListFilters {
  status?: string; siteId?: number; assignedExpertId?: number;
  clientId?: number; from?: string; to?: string; search?: string;
}
export type CaseListResponse = PagedResponse<Case>;
```

## Step 2 — Update the service call (P1)

Change the accessor from `?? []` to returning the `PagedResponse<T>`, and thread params:

```ts
export const fetchCases = async (
  orgId: string, params: PageRequestParams & CaseListFilters,
): Promise<PagedResponse<Case>> => {
  const res = await axios.get(`${BASE}/${orgId}/cases`, { headers, params });
  return res.data?.data;
};
```

**Do not** special-case `404` for emptiness; an empty page is `200` + `items: []`.

## Step 3 — Wire `useListQuery` in the list component (P2/P3)

```ts
const q = useListQuery<CaseListFilters>({
  defaultSort: { sortBy: 'createdDate', sortDirection: 'desc' },
  sortableFields: ['createdDate', 'title', 'caseNumber', 'status'],
  filterKeys: ['status', 'siteId', 'assignedExpertId', 'clientId', 'from', 'to', 'search'],
});

const { data, isFetching, error } = useSomeFetch(() => fetchCases(orgId, q.params), [q.params]);
```

`q.params` already reflects URL state; the fetch re-runs whenever it changes.

## Step 4 — Render states correctly (P1)

- `data.items.length > 0` → render rows.
- `data.items.length === 0` and success → **empty state** ("no results"), not an error (FR-003).
- Parent `404` → not-found state, distinct from empty (FR-004).
- `400` from a bad filter → toast via `errorHandler`/`useToast`, keep last valid list (FR-015).
- While `isFetching` → show updating affordance + pass `disabled` to the pager (FR-019).

## Step 5 — Add the footer pager (P2)

```tsx
<ListFooterPager
  page={data.page} pageSize={data.pageSize}
  totalCount={data.totalCount} totalPages={data.totalPages}
  hasNextPage={data.hasNextPage} hasPreviousPage={data.hasPreviousPage}
  onPageChange={q.setPage} onPageSizeChange={q.setPageSize}
  disabled={isFetching}
/>
```

## Step 6 — Add sorting (P3)

Make only the allow-listed columns sortable; clicking toggles asc/desc:

```tsx
<TableSortLabel
  active={q.state.sortBy === 'title'}
  direction={q.state.sortBy === 'title' ? q.state.sortDirection : 'asc'}
  onClick={() => q.setSort('title', q.state.sortDirection === 'asc' ? 'desc' : 'asc')}
>Title</TableSortLabel>
```

## Step 7 — Add filters (P3)

Render only this list's supported filters from `src/components/filters/`, mapped to the §6 params.
"Clear filters" calls `q.clearFilters()`. Date ranges validate end ≥ start before submit.

## Step 8 — Verify

- `npm run type-check && npm run lint && npm run build` (Husky gates — must pass).
- `npm run test` — `ListFooterPager` and `useListQuery` unit tests pass.
- `npm run test:e2e` — Playwright covers: page next/prev + size change (no dup/skip), empty page,
  sort toggle, filter narrows + clears, invalid-filter recovery, and URL reload reconstructs the view.

## Acceptance mapping

| Step | Requirements |
|------|--------------|
| 1–2  | FR-001, FR-002, FR-008 |
| 4    | FR-003, FR-004, FR-015, FR-019 |
| 5    | FR-005, FR-006, FR-007 |
| 6    | FR-009, FR-010 |
| 7    | FR-011, FR-012, FR-013, FR-014, FR-016 |
| 3    | FR-017, FR-020 |
