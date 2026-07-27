import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useListQuery, type ListQueryConfig } from "./useListQuery";

// ── next/navigation mock ────────────────────────────────────────────────────
const replaceMock = vi.fn();
let currentSearch = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/list",
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

interface SampleFilters extends Record<string, unknown> {
  status?: string;
  search?: string;
}

const config: ListQueryConfig<SampleFilters> = {
  defaultSort: { sortBy: "createdDate", sortDirection: "desc" },
  sortableFields: ["createdDate", "title", "status"],
  filterKeys: ["status", "search"],
};

/** Returns the query string of the last router.replace call. */
function lastReplacedQuery(): URLSearchParams {
  const call = replaceMock.mock.calls.at(-1);
  const url = (call?.[0] as string) ?? "/list";
  const qIndex = url.indexOf("?");
  return new URLSearchParams(qIndex >= 0 ? url.slice(qIndex + 1) : "");
}

beforeEach(() => {
  replaceMock.mockClear();
  currentSearch = "";
});

describe("useListQuery — initial state from URL", () => {
  it("defaults to page 1 / default page size with no sort or filters", () => {
    const { result } = renderHook(() => useListQuery(config));
    expect(result.current.state.page).toBe(1);
    expect(result.current.state.pageSize).toBe(20);
    expect(result.current.state.sortBy).toBeUndefined();
    expect(result.current.state.filters).toEqual({});
  });

  it("reads and normalizes page, pageSize, sort, and filters from the URL", () => {
    currentSearch = "page=3&pageSize=50&sortBy=title&sortDirection=asc&status=open&search=smith";
    const { result } = renderHook(() => useListQuery(config));
    expect(result.current.state.page).toBe(3);
    expect(result.current.state.pageSize).toBe(50);
    expect(result.current.state.sortBy).toBe("title");
    expect(result.current.state.sortDirection).toBe("asc");
    expect(result.current.state.filters.status).toBe("open");
    expect(result.current.state.filters.search).toBe("smith");
  });

  it("drops a sort token that is not in the allow-list", () => {
    currentSearch = "sortBy=secretField&sortDirection=asc";
    const { result } = renderHook(() => useListQuery(config));
    expect(result.current.state.sortBy).toBeUndefined();
    expect(result.current.state.sortDirection).toBeUndefined();
  });

  it("drops filter keys that are not declared in filterKeys", () => {
    currentSearch = "status=open&unknownKey=value";
    const { result } = renderHook(() => useListQuery(config));
    expect(result.current.state.filters.status).toBe("open");
    expect(result.current.state.filters).not.toHaveProperty("unknownKey");
  });

  it("falls back to default page size when the URL value is not an offered option", () => {
    currentSearch = "pageSize=37";
    const { result } = renderHook(() => useListQuery(config));
    expect(result.current.state.pageSize).toBe(20);
  });
});

describe("useListQuery — params output", () => {
  it("omits sort params when no sort is chosen", () => {
    const { result } = renderHook(() => useListQuery(config));
    expect(result.current.params).not.toHaveProperty("sortBy");
    expect(result.current.params.page).toBe(1);
    expect(result.current.params.pageSize).toBe(20);
  });
});

describe("useListQuery — mutations write to the URL", () => {
  it("setPage writes the page to the URL", () => {
    const { result } = renderHook(() => useListQuery(config));
    act(() => result.current.setPage(4));
    expect(lastReplacedQuery().get("page")).toBe("4");
  });

  it("setPageSize resets page to 1", () => {
    currentSearch = "page=5";
    const { result } = renderHook(() => useListQuery(config));
    act(() => result.current.setPageSize(50));
    const q = lastReplacedQuery();
    expect(q.get("pageSize")).toBe("50");
    expect(q.get("page")).toBeNull(); // page 1 is omitted from the URL
  });

  it("setSort resets page to 1 and writes an allow-listed token", () => {
    currentSearch = "page=4";
    const { result } = renderHook(() => useListQuery(config));
    act(() => result.current.setSort("title", "asc"));
    const q = lastReplacedQuery();
    expect(q.get("sortBy")).toBe("title");
    expect(q.get("sortDirection")).toBe("asc");
    expect(q.get("page")).toBeNull();
  });

  it("setSort no-ops for a token outside the allow-list", () => {
    const { result } = renderHook(() => useListQuery(config));
    act(() => result.current.setSort("ssn", "asc"));
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("clearSort removes the sort params", () => {
    currentSearch = "sortBy=title&sortDirection=asc&page=2";
    const { result } = renderHook(() => useListQuery(config));
    act(() => result.current.clearSort());
    const q = lastReplacedQuery();
    expect(q.get("sortBy")).toBeNull();
    expect(q.get("sortDirection")).toBeNull();
    expect(q.get("page")).toBeNull();
  });

  it("setFilter resets page to 1 and writes the filter value", () => {
    currentSearch = "page=3";
    const { result } = renderHook(() => useListQuery(config));
    act(() => result.current.setFilter("status", "closed"));
    const q = lastReplacedQuery();
    expect(q.get("status")).toBe("closed");
    expect(q.get("page")).toBeNull();
  });

  it("clearFilters drops all managed filter keys and resets page", () => {
    currentSearch = "status=open&search=smith&page=2";
    const { result } = renderHook(() => useListQuery(config));
    act(() => result.current.clearFilters());
    const q = lastReplacedQuery();
    expect(q.get("status")).toBeNull();
    expect(q.get("search")).toBeNull();
    expect(q.get("page")).toBeNull();
  });

  it("preserves unrelated query params when committing", () => {
    currentSearch = "siteId=42";
    const { result } = renderHook(() => useListQuery(config));
    act(() => result.current.setPage(2));
    const q = lastReplacedQuery();
    expect(q.get("siteId")).toBe("42");
    expect(q.get("page")).toBe("2");
  });
});
