"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  ListQueryState,
  PageRequestParams,
  SortDirection,
} from "@/types/pagination";
import { DEFAULT_PAGE_SIZE, buildListParams } from "@/utils/pagination";

// Shared list-query hook: owns page/pageSize/sort/filters, mirrors them to the URL,
// and exposes a ready-to-send `params` object for the service call.
// See specs/035-pagination-sorting-filtering/contracts/frontend-contracts.md §3.

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export interface ListQueryConfig<F extends Record<string, unknown>> {
  /** Backend default sort; informational for the UI (we omit sort params when the user hasn't chosen one). */
  defaultSort: { sortBy: string; sortDirection: SortDirection };
  /** Endpoint allow-list (§6) — only these tokens may be applied via setSort. */
  sortableFields: string[];
  /** Supported filter param names (§6) — only these keys are read from / written to the URL. */
  filterKeys: (keyof F & string)[];
  /** Default page size (default 20). */
  defaultPageSize?: number;
  /** Offered page-size options (default [10, 20, 50, 100]). */
  pageSizeOptions?: number[];
}

export interface UseListQueryResult<F extends Record<string, unknown>> {
  state: ListQueryState<F>;
  setPage: (page: number) => void;
  /** Resets page → 1. */
  setPageSize: (pageSize: number) => void;
  /** Resets page → 1; no-ops for tokens outside `sortableFields` (FR-009). */
  setSort: (sortBy: string, direction: SortDirection) => void;
  /** Back to backend default sort; resets page → 1. */
  clearSort: () => void;
  /** Resets page → 1 (FR-013). */
  setFilter: (key: keyof F & string, value: F[keyof F] | undefined) => void;
  /** Resets page → 1. */
  clearFilters: () => void;
  /** buildListParams output, ready for the service call. */
  params: PageRequestParams & F;
}

function parsePositiveInt(raw: string | null): number | undefined {
  if (raw === null) return undefined;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export function useListQuery<F extends Record<string, unknown>>(
  config: ListQueryConfig<F>,
): UseListQueryResult<F> {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaultPageSize = config.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  const pageSizeOptions = config.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS;
  const { sortableFields, filterKeys } = config;

  // Serialize once so memo deps are stable strings, not array identities.
  // Callers often pass inline array literals which would otherwise create new
  // references on every render, causing state/params to change every render.
  const searchString = searchParams.toString();
  const sortableFieldsSerial = sortableFields.join("\0");
  const filterKeysSerial = filterKeys.join("\0");
  const pageSizeOptionsSerial = pageSizeOptions.join("\0");

  // ── Derive view state from the URL (the single source of truth) ───────────
  const state = useMemo<ListQueryState<F>>(() => {
    const sp = new URLSearchParams(searchString);
    const safeSortableFields = sortableFieldsSerial.split("\0").filter(Boolean);
    const safeFilterKeys = filterKeysSerial
      .split("\0")
      .filter(Boolean) as (keyof F & string)[];
    const safePageSizeOptions = pageSizeOptionsSerial.split("\0").map(Number);

    const page = parsePositiveInt(sp.get("page")) ?? 1;

    const parsedPageSize = parsePositiveInt(sp.get("pageSize"));
    const pageSize =
      parsedPageSize !== undefined && safePageSizeOptions.includes(parsedPageSize)
        ? parsedPageSize
        : defaultPageSize;

    // Only honour allow-listed sort tokens; otherwise fall back to backend default (no params sent).
    let sortBy: string | undefined = sp.get("sortBy") ?? undefined;
    let sortDirection: SortDirection | undefined;
    if (sortBy && safeSortableFields.includes(sortBy)) {
      const dir = sp.get("sortDirection");
      sortDirection = dir === "asc" || dir === "desc" ? dir : "asc";
    } else {
      sortBy = undefined;
    }

    const filters = {} as Record<string, unknown>;
    for (const key of safeFilterKeys) {
      const value = sp.get(key);
      if (value !== null && value !== "") {
        filters[key] = value;
      }
    }

    return {
      page,
      pageSize,
      sortBy,
      sortDirection,
      filters: filters as F,
    };
  }, [searchString, defaultPageSize, pageSizeOptionsSerial, sortableFieldsSerial, filterKeysSerial]);

  // ── Commit a new state to the URL (preserving unrelated query params) ─────
  const commit = useCallback(
    (next: ListQueryState<F>) => {
      const sp = new URLSearchParams(searchString);
      const safeFilterKeys = filterKeysSerial
        .split("\0")
        .filter(Boolean) as (keyof F & string)[];

      const setOrDelete = (key: string, value: unknown) => {
        if (value === undefined || value === null || value === "") {
          sp.delete(key);
        } else {
          sp.set(key, String(value));
        }
      };

      setOrDelete("page", next.page === 1 ? undefined : next.page);
      setOrDelete(
        "pageSize",
        next.pageSize === defaultPageSize ? undefined : next.pageSize,
      );
      setOrDelete("sortBy", next.sortBy);
      setOrDelete("sortDirection", next.sortBy ? next.sortDirection : undefined);
      for (const key of safeFilterKeys) {
        setOrDelete(key, next.filters[key]);
      }

      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchString, defaultPageSize, filterKeysSerial, router, pathname],
  );

  const setPage = useCallback(
    (page: number) => commit({ ...state, page }),
    [commit, state],
  );

  const setPageSize = useCallback(
    (pageSize: number) => commit({ ...state, pageSize, page: 1 }),
    [commit, state],
  );

  const setSort = useCallback(
    (sortBy: string, direction: SortDirection) => {
      const safeSortableFields = sortableFieldsSerial.split("\0").filter(Boolean);
      if (!safeSortableFields.includes(sortBy)) return; // FR-009: never apply non-allow-listed tokens
      commit({ ...state, sortBy, sortDirection: direction, page: 1 });
    },
    [commit, state, sortableFieldsSerial],
  );

  const clearSort = useCallback(
    () =>
      commit({
        ...state,
        sortBy: undefined,
        sortDirection: undefined,
        page: 1,
      }),
    [commit, state],
  );

  const setFilter = useCallback(
    (key: keyof F & string, value: F[keyof F] | undefined) =>
      commit({
        ...state,
        page: 1,
        filters: { ...state.filters, [key]: value },
      }),
    [commit, state],
  );

  const clearFilters = useCallback(
    () => commit({ ...state, page: 1, filters: {} as F }),
    [commit, state],
  );

  const params = useMemo(() => buildListParams(state), [state]);

  return {
    state,
    setPage,
    setPageSize,
    setSort,
    clearSort,
    setFilter,
    clearFilters,
    params,
  };
}
