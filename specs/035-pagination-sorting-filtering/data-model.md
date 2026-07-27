# Phase 1 Data Model: Pagination, Sorting & Filtering for List Views

This is a frontend feature; the "entities" are TypeScript shapes the UI reads/writes, not database
tables. Wire shapes come from the backend ([backend-integration-guide.md](contracts/backend-integration-guide.md));
view-state shapes are owned by the frontend.

## Entity 1 — `PagedResponse<T>` (wire — read-only)

The page-of-items envelope returned (inside the standard `{ data, errors, meta }`) by every in-scope
list endpoint.

| Field | Type | Notes |
|-------|------|-------|
| `items` | `T[]` | The current page of item DTOs (same DTO shape as before the change). |
| `totalCount` | `number` | Total over the **filtered** set, not just this page. Drives total label. |
| `page` | `number` | Echoed, normalized current page. |
| `pageSize` | `number` | Echoed, normalized page size. |
| `totalPages` | `number` | `ceil(totalCount / pageSize)`. Drives page-number count. |
| `hasNextPage` | `boolean` | `page < totalPages`. Drives next-button enablement. |
| `hasPreviousPage` | `boolean` | `page > 1`. Drives prev-button enablement. |

- **Location**: `src/types/pagination.ts` (generic, repo-wide).
- **Validation rules**: `items` is always an array (empty allowed); an empty `items` with a success
  status is a valid empty list (FR-003), never an error.

## Entity 2 — `ListQueryState` (view state — read/write, URL-synced)

The user's current view request for one list. Owned by `useListQuery`, serialized to the URL query
string (FR-020).

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | `number` | `1` | Reset to `1` on any sort/filter/pageSize change (FR-007, FR-013). |
| `pageSize` | `number` | `20` | One of the offered sizes; backend clamps `>100`→`100`, `<1`→`20`. |
| `sortBy` | `string \| undefined` | `undefined` | Must be in the list's allow-list; `undefined` ⇒ backend default sort (FR-010). |
| `sortDirection` | `'asc' \| 'desc' \| undefined` | `undefined` | Paired with `sortBy`. |
| `filters` | `Record<string, FilterValue>` | `{}` | Only the list's supported filter keys; empty = unfiltered. |

- **State transitions**:
  - change `page` → fetch with new page.
  - change `pageSize` → set `page = 1`, fetch.
  - change `sortBy`/`sortDirection` → set `page = 1`, fetch.
  - change/clear any `filters` entry → set `page = 1`, fetch.
- **Serialization**: each non-default field is written to the URL; opening such a URL reconstructs the
  same state. Unknown/disallowed sort or filter tokens from a hand-edited URL are dropped/normalized
  to defaults on read.

## Entity 3 — `ListQueryConfig` (per-list configuration — static)

Declarative config each list provides to `useListQuery` / `ListFooterPager` so the generic machinery
stays type-safe and allow-list-bound.

| Field | Type | Notes |
|-------|------|-------|
| `defaultSort` | `{ sortBy: string; sortDirection: 'asc' \| 'desc' }` | Matches the endpoint's default in §6 (display only; not sent when user hasn't chosen). |
| `sortableFields` | `string[]` | The endpoint's `sortBy` allow-list (§6). Only these are offered. |
| `filterSchema` | `FilterFieldSpec[]` | Supported filters for this endpoint, each with key, kind, and options. |
| `pageSizeOptions` | `number[]` | e.g. `[10, 20, 50, 100]`; default `20`. |

### `FilterFieldSpec`

| Field | Type | Notes |
|-------|------|-------|
| `key` | `string` | Query param name (e.g. `status`, `siteId`, `role`, `search`, `from`, `to`, `court`). |
| `kind` | `'enum' \| 'text' \| 'dateRange' \| 'entityRef'` | Drives which MUI control renders. |
| `options` | `{ value: string; label: string }[]?` | For `enum`/`entityRef`. Sourced from confirmed backend enum values / reference data. |
| `label` | `string` | Display label. |

## Entity 4 — `SortDirection`

`type SortDirection = 'asc' | 'desc';` — case-insensitive on the wire; the UI emits lowercase.

## Entity 5 — Per-list filter typings (co-located)

Each domain declares a typed filter interface in its `types/` folder matching its §6 row, e.g.:

```ts
// src/app/organization/types/caseListTypes.ts
export interface CaseListFilters {
  status?: string;
  siteId?: number;
  assignedExpertId?: number;
  clientId?: number;
  from?: string;   // ISO-8601
  to?: string;     // ISO-8601
  search?: string;
}
```

These typed filter interfaces parameterize the generic `ListQueryState['filters']` for each list,
keeping payloads type-checked (Principle I).

## Relationships

```text
ListQueryConfig (static)  ──┐
                            ├─►  useListQuery  ──►  ListQueryState  ──►  request params  ──►  service call
URL query string  ◄────────┘            ▲                                                        │
                                        └──────────────  PagedResponse<T> (items + metadata)  ◄──┘
                                                                  │
                                                                  └──►  ListFooterPager (totalCount/page/…)
```

## In-scope entity list (Affected List Views)

Per the §6 matrix, the affected lists are: org/site cases, unlinked cases, organizations, org/site/
system users, legal experts (+ appointment-count / approved-by-status variants), clients, org/site
hearings, orders (legal experts / clients), payment settlements, ratings, appointments (past/pending/
by-date for legal experts & clients), legal-expert cases, and case-scoped documents/comments/tasks
(+ task assignee / task comments / task documents), invoices, hearings, case-clients, contributors
(+ available-users), legal-expert communications, sites, and site-users-by-user, plus eCourts
persisted and search lists. Out-of-scope (unchanged) reference-data lookups and single-record reads
keep their existing array/object shapes (FR-002).
