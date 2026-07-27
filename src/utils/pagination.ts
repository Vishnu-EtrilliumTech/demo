import type { ListQueryState, PageRequestParams, PagedResponse } from '@/types/pagination';

// Request-builder for in-scope list endpoints.
// See specs/035-pagination-sorting-filtering/contracts/frontend-contracts.md §2.

/** Default page size offered by the UI; mirrors the backend default (data-model Entity 2). */
export const DEFAULT_PAGE_SIZE = 20;

/** An empty, valid page — used as a defensive fallback when a list response has no `data` body. */
export function emptyPage<T>(pageSize: number = DEFAULT_PAGE_SIZE): PagedResponse<T> {
  return {
    items: [],
    totalCount: 0,
    page: 1,
    pageSize,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

/**
 * Normalizes the `data` body of an in-scope list response into a guaranteed `PagedResponse<T>`.
 *
 * The backend returns the paged envelope inside the standard `{ data, errors, meta }` wrapper, so
 * callers pass `response.data?.data`. An empty `items` array with a success status is a valid empty
 * list (FR-003) and is preserved as-is. A missing/null body (which should not happen post-cutover)
 * degrades to {@link emptyPage} so consumers reading `.items` never crash during the coordinated
 * cutover (FR-018). A 404 (parent-not-found) must NOT reach this helper — it surfaces as a thrown
 * error so the consumer can render a not-found state (FR-004).
 */
export function normalizePage<T>(data: unknown): PagedResponse<T> {
  if (data && typeof data === 'object' && Array.isArray((data as PagedResponse<T>).items)) {
    return data as PagedResponse<T>;
  }
  if (process.env.NODE_ENV === 'development') {
    // Received unexpected shape — log to help diagnose backend/frontend contract mismatches.
    console.warn('[normalizePage] unexpected payload — falling back to empty page. Received:', data);
  }
  return emptyPage<T>();
}

/**
 * Returns true for filter values that should NOT be sent (they would not narrow the result):
 * `undefined`, `null`, empty string, and empty array.
 * `0` and `false` are intentionally preserved as meaningful filter values.
 */
const isEmptyFilterValue = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
};

/** Slices a full in-memory list into a `PagedResponse<T>` for endpoints with no server-side paging. */
export function paginateItems<T>(items: T[], page: number, pageSize: number): PagedResponse<T> {
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    totalCount,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Flatten view state into Axios query params, omitting defaults/undefined.
 *
 * - Omits `sortBy`/`sortDirection` when unset so the backend default sort applies (FR-010).
 * - Omits empty/undefined filter values so they don't narrow the result.
 * - Does NOT clamp `page`/`pageSize` — the backend is the clamping authority; the UI only offers
 *   in-range options.
 */
export function buildListParams<F extends Record<string, unknown>>(
  state: ListQueryState<F>,
): PageRequestParams & F {
  const params: PageRequestParams = {
    page: state.page,
    pageSize: state.pageSize,
  };

  if (state.sortBy) {
    params.sortBy = state.sortBy;
    if (state.sortDirection) {
      params.sortDirection = state.sortDirection;
    }
  }

  const filterParams: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(state.filters)) {
    if (!isEmptyFilterValue(value)) {
      filterParams[key] = value;
    }
  }

  return { ...params, ...filterParams } as PageRequestParams & F;
}
