// Shared pagination/sorting/filtering primitives for every in-scope list view.
// Wire shapes (PagedResponse, PageRequestParams) come from the backend integration guide;
// view-state shapes (ListQueryState) are owned by the frontend (useListQuery).
// See specs/035-pagination-sorting-filtering/contracts/frontend-contracts.md §1.

export type SortDirection = 'asc' | 'desc';

/** Wire envelope returned (inside the standard `data` field) by every in-scope list endpoint. */
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
