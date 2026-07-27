# Frontend Contracts — Shared Pagination/Sorting/Filtering Primitives

These are the UI-side contracts the feature exposes to every in-scope list screen. The wire contract
(request params, `PagedResponse<T>`, status codes, endpoint matrix) is owned by
[backend-integration-guide.md](backend-integration-guide.md); this file defines the **TypeScript
interfaces, hook API, and component API** the frontend introduces on top of it.

## 1. Shared types — `src/types/pagination.ts`

```ts
export type SortDirection = 'asc' | 'desc';

/** Wire envelope returned (inside `data`) by every in-scope list endpoint. */
export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Outbound request params common to every in-scope list endpoint. */
export interface PageRequestParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: SortDirection;
}

/** View state owned by useListQuery and mirrored to the URL query string. */
export interface ListQueryState<F extends Record<string, unknown> = Record<string, unknown>> {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: SortDirection;
  filters: F;
}
```

## 2. Request-builder — `src/utils/pagination.ts`

```ts
/** Flatten view state into Axios query params, omitting defaults/undefined. */
export function buildListParams<F extends Record<string, unknown>>(
  state: ListQueryState<F>,
): PageRequestParams & F;
```

- Omits `sortBy`/`sortDirection` when unset so the backend default sort applies (FR-010).
- Omits empty/undefined filter values so they don't narrow the result.
- Does NOT clamp `pageSize`/`page` — the backend is the clamping authority (guide §2); the UI only
  offers in-range options.

## 3. Hook — `src/hooks/useListQuery.ts`

```ts
export interface ListQueryConfig<F extends Record<string, unknown>> {
  defaultSort: { sortBy: string; sortDirection: SortDirection };
  sortableFields: string[];          // endpoint allow-list (§6)
  filterKeys: (keyof F & string)[];  // supported filter param names (§6)
  defaultPageSize?: number;          // default 20
  pageSizeOptions?: number[];        // default [10, 20, 50, 100]
}

export interface UseListQueryResult<F extends Record<string, unknown>> {
  state: ListQueryState<F>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;          // resets page → 1
  setSort: (sortBy: string, direction: SortDirection) => void; // resets page → 1, must be allow-listed
  clearSort: () => void;                            // back to backend default
  setFilter: (key: keyof F & string, value: F[keyof F] | undefined) => void; // resets page → 1
  clearFilters: () => void;                         // resets page → 1
  params: PageRequestParams & F;                    // ready for the service call (buildListParams output)
}

export function useListQuery<F extends Record<string, unknown>>(
  config: ListQueryConfig<F>,
): UseListQueryResult<F>;
```

**Behavioral contract**:

- Initial state is read from the URL query string (`useSearchParams`); values not in `sortableFields`
  / `filterKeys` are dropped or normalized to defaults.
- Every mutation writes the resulting state back to the URL via `router.replace` (shallow, no scroll),
  so refresh/back/bookmark reproduce the view (FR-020).
- `setPageSize`, `setSort`, `clearSort`, `setFilter`, `clearFilters` all reset `page` to `1`
  (FR-007, FR-013).
- `setSort` rejects (no-op) tokens not in `sortableFields` (FR-009).

## 4. Component — `src/components/ListFooterPager.tsx`

```ts
export interface ListFooterPagerProps {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageSizeOptions?: number[];                 // default [10, 20, 50, 100]
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  disabled?: boolean;                         // true while fetching (FR-019)
}
```

**Behavioral contract**:

- Renders MUI `<Pagination>` (numbered, prev/next), an MUI `<Select>` page-size control, and a visible
  total label ("`{from}–{to} of {totalCount}`").
- Disables/hides next on the last page and prev on the first page from `hasNextPage`/`hasPreviousPage`
  (FR-006).
- Emits `onPageSizeChange` only; the page-1 reset is performed by `useListQuery`, not the component.
- Fully keyboard-accessible (MUI defaults); `disabled` greys out controls during fetch.

## 5. Service-layer contract change (per in-scope endpoint)

Each in-scope service function changes from returning `T[]` to returning `PagedResponse<T>` and
accepts the query params:

```ts
// BEFORE
export const fetchCases = async (orgId: string): Promise<Case[]> => {
  const res = await axios.get(`${BASE}/${orgId}/cases`, { headers });
  return res.data?.data ?? [];
};

// AFTER
export const fetchCases = async (
  orgId: string,
  params: PageRequestParams & CaseListFilters,
): Promise<PagedResponse<Case>> => {
  const res = await axios.get(`${BASE}/${orgId}/cases`, { headers, params });
  return res.data?.data; // PagedResponse<Case>
};
```

- Empty list ⇒ `res.data.data.items === []` (success), never treated as `404`/error (FR-003).
- `400` from invalid filter values is caught and surfaced via `errorHandler` + `useToast`, preserving
  the last valid list (FR-015).
- Out-of-scope service calls (reference data, single-record reads) are **unchanged** (FR-002).

## 6. Filter controls — `src/components/filters/`

Reusable MUI-based controls mapped to `FilterFieldSpec.kind`:

| kind | control | param shape |
|------|---------|-------------|
| `enum` | `<Select>` with confirmed backend values | `status`, `role`, `type`, `priority`, `approvalStatus`, `ratingValue` |
| `text` | debounced `<TextField>` | `search` |
| `dateRange` | two MUI date pickers, validated end ≥ start | `from`, `to` (ISO-8601) |
| `entityRef` | `<Select>`/autocomplete sourced from reference data | `siteId`, `assigneeId`, `clientId`, `assignedExpertId`, `court`, `portfolio`, `expertType`, `uploaderId`, `authorId`, `caseId`, `linkedCaseId` |

Date-range controls enforce end-not-before-start client-side before submit (FR-016); enum option sets
are confirmed against the backend (guide §8.2) before release.
