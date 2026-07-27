# Implementation Plan: Pagination, Sorting & Filtering for List Views

**Branch**: `035-pagination-sorting-filtering` | **Date**: 2026-06-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/035-pagination-sorting-filtering/spec.md`

## Summary

The backend has converted every high-volume and entity-scoped **list** endpoint from a plain
JSON array to a `PagedResponse<T>` envelope (`data.items` + paging metadata) and added optional
`page`, `pageSize`, `sortBy`, `sortDirection`, and resource-specific filter query parameters
(see [contracts/backend-integration-guide.md](contracts/backend-integration-guide.md)). This is a
**breaking response-shape change**.

The frontend must (P1) restore correct rendering by reading `data.items` everywhere an affected
list is consumed, then (P2–P3) layer a consistent **numbered footer pager** (prev/next + page
numbers + page-size selector + visible total count), server-driven **sorting** limited to each
list's allow-list, and server-driven **filtering**, with all view state encoded in the **URL query
string** so it survives refresh/back-navigation and is shareable.

**Technical approach**: introduce a small shared foundation — typed `PagedResponse<T>`/query
contracts, a `useListQuery` hook that owns page/size/sort/filter state and syncs it to the URL, and
a reusable MUI-based `ListFooterPager` component — then migrate each in-scope service call and list
view onto that foundation in priority order. The work is server-driven only: the frontend never
re-sorts or re-filters a page client-side in a way that contradicts the backend result.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode), React 19, Next.js 15 (App Router)
**Primary Dependencies**: MUI 6 (Pagination, Select, TextField, Date pickers), Axios 1, Redux Toolkit 2 (existing slices only), Keycloak.js 26
**Storage**: N/A (server-driven; view state lives in URL query string, not persisted state)
**Testing**: Vitest + React Testing Library (unit), Playwright (E2E)
**Target Platform**: Modern browsers (Next.js client components for list screens)
**Project Type**: Web frontend (single Next.js app — `Lawsome.Web.UI`)
**Performance Goals**: First page of a long list loads noticeably faster than full-list load; page navigation < 2s under normal conditions (SC-003); no Lighthouse perf regression below 70 on key pages
**Constraints**: Server-driven paging/sort/filter; default `pageSize` 20, max 100 (backend-clamped); sort/filter UI restricted to per-endpoint allow-lists; coordinated cutover with backend (no mismatched-shape window)
**Scale/Scope**: ~40 in-scope list endpoints across cases, org/site/system users, sites, organizations, legal experts, clients, hearings, appointments, orders, payment settlements, ratings, and case-scoped documents/comments/tasks/invoices/hearings/clients/contributors, plus eCourts saved/search lists

**Existing patterns leveraged** (from codebase survey):

- Services are domain-scoped (`src/app/<domain>/services/*.ts`) and call `axios` directly with a
  Bearer token from `getToken()`, returning `response.data?.data ?? []` for lists. Migration changes
  the accessor to `response.data?.data` (the `PagedResponse<T>`) and threads query params.
- API response shapes are declared as interfaces in co-located `types/` folders (Principle I).
- The eCourts Search tab already consumes a paged shape and renders MUI `<Pagination>`
  ([SearchTab.tsx](../../src/app/organization/[id]/ecourts/components/SearchTab.tsx)) — the new shared
  pager generalizes that pattern.
- `useSearchParams`/`useRouter` (`next/navigation`) are already used across list pages — the URL-state
  hook builds on these rather than introducing new routing primitives.
- No shared list/table/pager component or list-query hook exists yet — both are net-new shared assets.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Relevance & Compliance |
|-----------|------------------------|
| **I. Type Safety First** (NON-NEGOTIABLE) | `PagedResponse<T>` and per-list query/filter shapes declared as TS interfaces in co-located `types/` folders; a shared generic `PagedResponse<T>` lives in a shared types module. No `any` against raw payloads. **PASS** |
| **II. Security by Default** | No new HTML rendering, no `dangerouslySetInnerHTML`, no markdown. Filter values are query params (URL-encoded by Axios). No new token storage. **PASS — N/A surface** |
| **III. Test Coverage** (RECOMMENDED) | New shared `ListFooterPager` (in `src/components/`) gets RTL unit tests; `useListQuery` gets unit tests; Playwright E2E covers golden path + empty-page + invalid-filter edge cases per the spec. **PASS** |
| **IV. Auth & Authz Consistency** (NON-NEGOTIABLE) | No change to who sees what; paging/sort/filter operate only over already-authorized records (FR-017). Existing Keycloak/`useUserRole` gates untouched. 401-after-refresh → logout unchanged. **PASS** |
| **V. API Contract Discipline** (RECOMMENDED) | Breaking shape change reflected in the corresponding domain service files in this feature (FR-001). Errors routed through `errorHandler.ts` + `useToast()` (FR-015). Existing services use `axios`+`getToken` directly (established pattern); we follow it consistently rather than re-routing through `httpServices`. **PASS** |
| **VI. Component Architecture** (RECOMMENDED) | Reuse MUI `Pagination`/`Select`/date pickers — no reimplementation. Shared pager in `src/components/`; query/state logic in a `src/hooks/` hook, not in components. **PASS** |
| **VIII. API Response Standards** (NON-NEGOTIABLE) | Consumes the mandated list pagination wrapper (`items`/`totalCount`/`page`/`pageSize`). **PASS** |
| **X. Performance & Query Standards** (RECOMMENDED) | Server-driven paging (no full-list loads); `React.memo`/`useCallback` on large list rows; memoized derivations. **PASS** |
| **XIII / XIV. PR & Spec Governance** (NON-NEGOTIABLE) | spec.md + plan.md present; tasks.md to follow; `/speckit-analyze` before implementation; coordinated breaking-change cutover documented (FR-018). **PASS** |

**Result**: No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/035-pagination-sorting-filtering/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 output (/speckit-plan)
├── data-model.md        # Phase 1 output (/speckit-plan)
├── quickstart.md        # Phase 1 output (/speckit-plan)
├── contracts/
│   ├── backend-integration-guide.md   # Source-of-truth endpoint matrix (provided)
│   └── frontend-contracts.md          # Phase 1 output — shared FE types/hook/component contracts
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── types/
│   └── pagination.ts                 # NEW — generic PagedResponse<T>, PageRequest, SortDirection, ListQueryState
├── hooks/
│   ├── useListQuery.ts               # NEW — owns page/pageSize/sortBy/sortDirection/filters + URL sync
│   └── useListQuery.test.tsx         # NEW — unit tests
├── components/
│   ├── ListFooterPager.tsx           # NEW — numbered pager + page-size select + total count (MUI)
│   ├── ListFooterPager.test.tsx      # NEW — unit tests
│   └── filters/                      # NEW — reusable filter controls (status/role/date-range/search) as needed
│       └── ...
├── utils/
│   └── pagination.ts                 # NEW (optional) — buildListParams() helper: query-state → request params
└── app/
    ├── organization/
    │   ├── types/                    # per-domain list query/filter interfaces (cases, users, sites, hearings…)
    │   └── services/                 # api.ts / caseapi.ts / ecourtapi.ts — change accessors → data.items, thread params
    │   └── [id]/...                  # list pages: cases, users, sites, hearings, ecourts, case-scoped lists
    ├── admin-dashboard/ ...          # system users, legal experts, clients, orders, settlements, ratings, appointments
    └── ... (other in-scope list screens)

e2e/
└── pagination-sorting-filtering.spec.ts   # NEW — Playwright coverage of golden path + edge cases
```

**Structure Decision**: Single Next.js frontend app. Net-new shared assets live in the repo-wide
`src/types`, `src/hooks`, `src/components`, and `src/utils` (consumed by every domain). Per-list
query/filter types stay co-located in their domain `types/` folders, and the breaking accessor change
plus control wiring happen in the existing domain `services/` files and route folders. No new
top-level projects or packages.

## Complexity Tracking

> No constitution violations — section intentionally empty.
