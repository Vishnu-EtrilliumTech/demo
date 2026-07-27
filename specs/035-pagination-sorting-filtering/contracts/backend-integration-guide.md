# Pagination, Sorting & Filtering — Frontend Integration Guide

**Backend spec:** 037 — Pagination, Sorting & Filtering for List Endpoints
**Branch:** `003-pagination-sorting-filtering`
**Status:** Implemented (backend complete, unit-tested)
**Audience:** `Lawsome.Web` frontend team

---

## 1. Summary

All high-volume and entity-scoped **list** endpoints now support standardized
**pagination, sorting, and filtering** via query-string parameters. The change is
**additive and opt-in** — a request that sends none of the new parameters still gets a
usable response (page 1, default size, default sort).

> ⚠️ **Breaking response-shape change.** In-scope list endpoints no longer return a plain
> JSON array in `data`. They now return a **`PagedResponse<T>` object**. The frontend must
> read **`data.items`** instead of iterating `data` directly. See §5.

---

## 2. Request — common query parameters

Every in-scope endpoint accepts these four parameters (all optional):

| Param | Type | Default | Clamp / rule |
|-------|------|---------|--------------|
| `page` | int | `1` | `< 1` → `1` |
| `pageSize` | int | `20` | `< 1` → `20`; `> 100` → `100` |
| `sortBy` | string | resource default | must be in the resource allow-list; unknown value → resource default sort |
| `sortDirection` | string | resource default | `asc` \| `desc` (case-insensitive); anything else → resource default |

Resource-specific **filters** (e.g. `siteId`, `role`, `status`, `search`, `from`, `to`) are
added per endpoint — see the matrix in §6. All filters combine with **logical AND** and only
ever operate over records the caller is already authorized to see.

**Example request:**

```http
GET /api/v1/organizations/12/users?page=2&pageSize=25&sortBy=name&sortDirection=asc&siteId=4&search=ravi
Authorization: Bearer <jwt>
```

---

## 3. Response — `PagedResponse<T>` inside the standard envelope

```json
{
  "data": {
    "items": [ /* page of item DTOs */ ],
    "totalCount": 137,
    "page": 2,
    "pageSize": 25,
    "totalPages": 6,
    "hasNextPage": true,
    "hasPreviousPage": true
  },
  "errors": null,
  "meta": {}
}
```

| Field | Type | Meaning |
|-------|------|---------|
| `items` | array | The current page of item DTOs (same DTO shape as before). |
| `totalCount` | int | Total count over the **filtered** set (not just this page). |
| `page` | int | Echoed normalized page number. |
| `pageSize` | int | Echoed normalized page size. |
| `totalPages` | int | Computed: `ceil(totalCount / pageSize)`. Convenience for page controls. |
| `hasNextPage` | bool | Computed: `page < totalPages`. |
| `hasPreviousPage` | bool | Computed: `page > 1`. |

**Behavioral rules:**

- `totalCount` reflects the **filtered** set; paging walks the filtered, sorted set.
- An empty page (including a page past the end) returns **`200 OK`** with `items: []` and the
  correct `totalCount`. **Never `404`** for an empty list.
- Ordering is **stable across pages** (deterministic `Id` tiebreaker; nulls ordered last), so
  the same record never appears on two pages.
- Authorization is unchanged; filters never expose records the caller could not already see.

---

## 4. Status codes

| Situation | Status |
|-----------|--------|
| Page returned (including empty) | `200` |
| Invalid filter value (bad enum / unparseable date) | `400` (user-friendly message in `errors`) |
| Unauthorized role / not owner | `401` |
| Parent resource (org / site / case) not found | `404` |

---

## 5. Migration checklist for the frontend

For **each** list call to an in-scope endpoint (see §6):

1. **Change the data accessor** from `response.data` → `response.data.items`.
2. Read `response.data.totalCount` / `totalPages` / `hasNextPage` / `hasPreviousPage` to drive
   pagination controls.
3. Send `page` & `pageSize` from your pager. Default page size is `20`; max enforced is `100`.
4. Wire `sortBy` / `sortDirection` to column headers — only send tokens in that endpoint's
   allow-list (§6). Unknown tokens silently fall back to the default sort, so prefer to
   constrain the UI to the allow-list.
5. Map filter UI controls to the endpoint's filter params. Date filters (`from` / `to`) expect
   ISO-8601 date/date-time strings.
6. Treat an empty list as a normal `200` with `items: []` — do not special-case `404`.

> **Out-of-scope endpoints are unchanged.** Reference-data lookups (states, eCourt
> states/districts, legal-expert types/portfolios, schedules, addresses, capabilities) and
> single-record GETs still return plain arrays / objects. Only the endpoints in §6 changed shape.

---

## 6. Endpoint matrix — sort allow-lists & filters

`Default sort` is applied when `sortBy` is omitted. `sortBy allow-list` lists the accepted
tokens. `Filters` are the resource-specific query params ANDed onto the authorized set.

### Category A — eCourts (already paged; aligned to the shared contract)

| Endpoint | Default sort | `sortBy` allow-list | Filters |
|----------|--------------|---------------------|---------|
| `GET {orgId}/courtdata/persisted` | `lastRefreshed` desc | `lastRefreshed`, `cnr`, `title` | `cnr`, `title`, `linkedCaseId` |
| `GET {orgId}/ecourts/search` | external proxy order | (none — proxy order) | `caseType`, `caseStatus`, `stateCode`, `districtCode`, `filingYear` |

### Category B — High-volume / unbounded lists

| Endpoint | Default sort | `sortBy` allow-list | Filters |
|----------|--------------|---------------------|---------|
| `GET {orgId}/cases` | `createdDate` desc | `createdDate`, `title`, `caseNumber`, `status` | `status`, `siteId`, `assignedExpertId`, `clientId`, `from`, `to`, `search` |
| `GET {orgId}/sites/{siteId}/cases` | `createdDate` desc | `createdDate`, `title`, `caseNumber`, `status` | `status`, `assignedExpertId`, `clientId`, `from`, `to`, `search` |
| `GET {orgId}/cases/unlinked` | `createdDate` desc | `createdDate`, `title`, `caseNumber` | `search` |
| `GET organizations` | `name` asc | `name`, `createdDate`, `status` | `search`, `status` |
| `GET {orgId}/users` | `name` asc | `name`, `email`, `createdDate`, `role` | `siteId`, `role`, `status`, `search` |
| `GET {orgId}/sites/{siteId}/users` | `name` asc | `name`, `email`, `createdDate`, `role` | `role`, `status`, `search` |
| `GET` system users | `name` asc | `name`, `email`, `createdDate`, `role` | `role`, `search` |
| `GET` legal experts | `name` asc | `name`, `expertType`, `approvalStatus` | `expertType`, `portfolio`, `approvalStatus`, `siteId`, `search` |
| `GET` legal experts appointments/count | `name` asc | `name`, `appointmentCount` | same as legal experts |
| `GET` legal experts approved/{status} | `name` asc | `name`, `expertType` | `expertType`, `search` (status in path) |
| `GET` clients | `name` asc | `name`, `email`, `createdDate` | `search`, `status` |
| `GET {orgId}/hearings` | `hearingDate` asc | `hearingDate`, `createdDate` | `from`, `to`, `siteId`, `caseId`, `court` |
| `GET {orgId}/sites/{siteId}/hearings` (upcoming) | `hearingDate` asc | `hearingDate`, `createdDate` | `from`, `to`, `caseId`, `court` |
| `GET orders/legalexperts/{id}` | `createdDate` desc | `createdDate`, `status` | `status`, `from`, `to` |
| `GET orders/clients/{id}` | `createdDate` desc | `createdDate`, `status` | `status`, `from`, `to` |
| `GET paymentsettlements/legalexperts/{id}` | `createdDate` desc | `createdDate`, `status` | `status`, `from`, `to` |
| `GET ratings/legalexperts/{id}` | `createdDate` desc | `createdDate`, `ratingValue` | `ratingValue`, `from`, `to` |
| `GET appointments/past` | `appointmentDate` desc | `appointmentDate` | `from`, `to` |
| `GET appointments/pending` | `appointmentDate` asc | `appointmentDate` | `from`, `to` |
| `GET appointments/legalexperts/{id}/pending` | `appointmentDate` asc | `appointmentDate` | `from`, `to` |
| `GET appointments/legalexperts/{id}/past` | `appointmentDate` desc | `appointmentDate` | `from`, `to` |
| `GET appointments/legalexperts/{id}/bydate` | `appointmentDate` asc | `appointmentDate` | date range in query |
| `GET appointments/clients/{id}/pending` | `appointmentDate` asc | `appointmentDate` | `from`, `to` |
| `GET appointments/clients/{id}/past` | `appointmentDate` desc | `appointmentDate` | `from`, `to` |
| `GET appointments/clients/{id}/bydate` | `appointmentDate` asc | `appointmentDate` | date range in query |
| `GET legalexperts/{id}/cases` | `createdDate` desc | `createdDate`, `title`, `status` | `status`, `search` |

### Category C — Case-/entity-scoped lists

| Endpoint | Default sort | `sortBy` allow-list | Filters |
|----------|--------------|---------------------|---------|
| `GET .../cases/{caseId}/documents` | `uploadedDate` desc | `uploadedDate`, `name`, `type` | `type`, `uploaderId`, `from`, `to`, `search` |
| `GET .../cases/{caseId}/comments` | `createdDate` desc | `createdDate` | `authorId`, `from`, `to` |
| `GET .../cases/{caseId}/tasks` | `createdDate` desc | `createdDate`, `dueDate`, `status`, `priority` | `status`, `assigneeId`, `priority`, `from`, `to` |
| `GET .../cases/{caseId}/tasks/assignee/{id}` | `dueDate` asc | `dueDate`, `status`, `priority` | `status`, `priority` |
| `GET .../tasks/{taskId}/comments` | `createdDate` asc | `createdDate` | `authorId` |
| `GET .../tasks/{taskId}/documents` | `uploadedDate` desc | `uploadedDate`, `type` | `type`, `uploaderId` |
| `GET .../cases/{caseId}/invoices` | `createdDate` desc | `createdDate`, `status` | `status`, `from`, `to` |
| `GET .../cases/{caseId}/hearings` | `hearingDate` desc | `hearingDate`, `createdDate` | `from`, `to`, `court` |
| `GET .../cases/{caseId}/caseclients` | `name` asc | `name` | `search` |
| `GET .../cases/{caseId}/contributors` | `name` asc | `name`, `role` | `role`, `search` |
| `GET .../cases/{caseId}/contributors/available-users` | `name` asc | `name`, `role` | `siteId`, `role`, `search` |
| `GET legalExperts/{id}` communications | `createdDate` desc | `createdDate`, `type` | `type`, `from`, `to` |
| `GET {orgId}/sites` | `name` asc | `name`, `createdDate`, `status` | `search`, `status` |
| `GET {orgId}/sites/users/{userId}` | `name` asc | `name` | `search` |

> **Note on sort tokens:** these are the *public* sort tokens. Sending an unsupported token
> falls back silently to the resource default sort, so the safest UX is to expose only the
> tokens listed above as sortable columns for each list.

---

## 7. Backend implementation notes (for reference)

- New shared types: `PageRequest` / `PagedResult<T>` (`Lawsome.Common.Pagination`) and the wire
  DTO `PagedResponse<T>` (`Lawsome.Api.Models.Common`).
- Normalization/clamping happens at the controller boundary (`BaseController.BuildPageRequest`),
  so the rules in §2 are enforced consistently across every endpoint.
- Paging is executed in the database via `IRepository.GetPagedByConditionAsync` (eCourts lists
  page in-memory over proxy/JSON results). Ordering always includes a deterministic `Id`
  tiebreaker for stable cross-page paging.
- Every endpoint and service method changed here has corresponding unit tests in
  `Services.Tests` and `Repository.Tests`.

---

## 8. Open coordination items

1. **Sequence the cutover.** Because the `data` shape changes, frontend and backend must deploy
   the in-scope endpoints together (or behind a flag). Confirm the release ordering before merge.
2. **Confirm filter value formats** with backend for enum filters (`status`, `role`, `type`,
   `priority`) — these are validated server-side and return `400` on bad values.
