# Tasks: Legal Expert Search

**Feature Branch**: `028-legal-expert-search`
**Input**: `specs/028-legal-expert-search/plan.md`, `specs/028-legal-expert-search/spec.md`

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = Search by Location, US2 = Search by Specialization, US3 = Search with No Filters

---

## Phase 1: Setup

**Purpose**: Audit existing code and create new service files.

- [ ] T001 Audit `src/app/search/page.tsx` — confirm NO Keycloak auth check exists; remove any `initKeycloak()` guard if found (plan.md §4.3)
- [ ] T002 [P] Create `src/app/search/services/api.ts` — search-scoped API service file (new module)
- [ ] T003 [P] Create `src/app/search/types/index.ts` — `SearchResult` and `SearchFilters` interfaces
- [ ] T004 [P] Confirm `GET /api/v1/legal-experts/search` works without a Bearer token — test unauthenticated call in research phase (risk per plan.md §11)
- [ ] T005 [P] Confirm `GET /api/v1/reference-data/specializations` (or equivalent) endpoint exists and returns `string[]` (plan.md §5)

---

## Phase 2: UI

**Purpose**: Update search components with new filter and result card requirements.

- [ ] T006 [US2] Update `src/components/searchComponent/SearchComponent.tsx` — add MUI `<Select>` specialization dropdown labeled "Specialization (optional)"; populated from `/api/v1/reference-data/specializations` on mount; no-filter state: search button still enabled when both fields empty
- [ ] T007 [US1] Update `src/app/search/filters and layout/filterSection.tsx` — ensure each result card renders all four required fields: `result.fullName`, `result.portfolios` (as MUI `<Chip>` per portfolio or joined), `result.address`, `result.customerRating` + count
- [ ] T008 [US1] Add `<EmptyState message="No legal experts found. Try adjusting your filters." />` to `filterSection.tsx` — rendered when `searchResult.length === 0 && hasSearched` (plan.md §4.2)
- [ ] T009 [US1] Add MUI `<CircularProgress>` loading state to search button in `SearchComponent.tsx` — disabled while `isSearching === true`

---

## Phase 3: Logic

**Purpose**: Implement search flow and session storage preservation.

- [ ] T010 [US1] Move `searchExperts` API call out of component into `src/app/search/services/api.ts` — function accepts `SearchFilters { location?, radius?, specialization? }` and calls `GET /api/v1/legal-experts/search` with appropriate query params
- [ ] T011 [US2] Wire specialization dropdown value into `SearchFilters` in `SearchComponent.tsx` — pass `specialization` param when selected; omit param when empty
- [ ] T012 [US3] Ensure search button calls `searchExperts({})` with no params when both location and specialization are empty — returns all qualifying experts
- [ ] T013 [P] [US1] Add `hasSearched` boolean flag in `src/app/search/page.tsx` — set to `true` on first search submit; prevents empty state from showing before any search
- [ ] T014 [P] Implement session storage persistence in `filterSection.tsx` — on result card click: `sessionStorage.setItem("preservedSearchResults", JSON.stringify(searchResult))`; clear on new search
- [ ] T015 [P] [US2] Fetch specialization reference data on `SearchComponent` mount: `GET /api/v1/reference-data/specializations` → cache in local state; single fetch per session mount (plan.md §7)

---

## Phase 4: API

**Purpose**: Finalize API service contracts.

- [ ] T016 Implement `searchExperts(filters: SearchFilters)` in `src/app/search/services/api.ts` — `GET /api/v1/legal-experts/search` with `lat`, `lng`, `radius`, `specialization` as optional query params; no Authorization header
- [ ] T017 [P] Implement `fetchSpecializations()` in `src/app/search/services/api.ts` — `GET /api/v1/reference-data/specializations` returns `string[]`
- [ ] T018 [P] Confirm exact `specialization` query param name accepted by backend (risk per plan.md §11); update `SearchFilters` interface if name differs
- [ ] T019 [P] Confirm `SearchResult` interface fields against actual API response: `id`, `fullName`, `address`, `portfolios`, `customerRating`, `ratingCount?`, `yearsOfExperience`, `consultationFeesRs`, `availableOnline`, `availableInPerson` — update `src/app/search/types/index.ts` accordingly

---

## Phase 5: Backend

**Purpose**: Validate backend filtering assumptions.

- [ ] T020 Confirm backend `GET /api/v1/legal-experts/search` only returns experts where `enabled === true` AND `stage === 'Schedule'` — incomplete or disabled experts must never appear
- [ ] T021 [P] Confirm location-based results are ordered by proximity (nearest first) from backend — no client-side sorting needed
- [ ] T022 [P] Confirm no-filter search (`GET /api/v1/legal-experts/search` with no query params) returns all qualifying experts — not an error (plan.md §2.4)

---

## Phase 6: Security

**Purpose**: Enforce public access and prevent data leakage.

- [ ] T023 Confirm `src/app/search/page.tsx` has NO Keycloak authentication check — page must be fully accessible to unauthenticated users
- [ ] T024 [P] Verify all result card fields rendered as React text nodes via MUI `<Typography>` — no `dangerouslySetInnerHTML` in `filterSection.tsx`
- [ ] T025 [P] Confirm location coordinates (lat/lng) are only sent as query params to backend and NOT stored in `sessionStorage` or Redux (plan.md §6)
- [ ] T026 [P] Validate radius input client-side — reject negative or NaN values before calling `searchExperts`

---

## Phase 7: Testing

**Purpose**: Unit and E2E test coverage.

- [ ] T027 Create `src/components/searchComponent/__tests__/SearchComponent.test.tsx` — tests: submit with location+radius calls searchExperts with correct params; submit with specialization only calls with specialization param; submit with no filters calls with no params; loading state shows disabled button with CircularProgress
- [ ] T028 Create unit tests for `filterSection.tsx` — tests: results provided → each card shows name, specialization, address, rating; empty results with hasSearched → EmptyState shown; result card click stores data in sessionStorage
- [ ] T029 Create `e2e/028-legal-expert-search.spec.ts` — E2E: search by location as unauthenticated shows results with name/specialization/address/rating; search by specialization shows only matching experts; combined filter shows intersection; no-filter search shows all qualifying; empty state shown for restrictive radius; /search page loads without redirect to auth

---

## Phase 8: Logging

**Purpose**: Instrument observability events per plan.md §10.

- [ ] T030 Add INFO log on search executed: filter params (radius, specialization — not lat/lng coordinates), result count
- [ ] T031 [P] Add INFO log on empty result: filter params, `resultCount: 0`
- [ ] T032 [P] Add INFO log on reference data fetch: endpoint, count
- [ ] T033 [P] Add WARN log on invalid search params (400 from API): param names, error message — not user-entered values

---

## Phase 9: Quality Gates

**Purpose**: Ensure all pre-commit checks pass.

- [ ] T034 Run `npm run type-check` — zero TypeScript errors in `SearchComponent.tsx`, `filterSection.tsx`, `src/app/search/services/api.ts`, `src/app/search/types/index.ts`
- [ ] T035 [P] Run `npm run lint` — zero ESLint errors; no `any` types
- [ ] T036 [P] Run `npm run build` — production build succeeds; `/search` page builds without Keycloak dependency errors

---

## Phase 10: Finalization

**Purpose**: Polish and branch readiness.

- [ ] T037 Apply `React.memo` to individual result cards in `filterSection.tsx` to prevent re-renders when `isSearching` toggles (plan.md §7)
- [ ] T038 [P] Confirm specialization dropdown loads once on `SearchComponent` mount and is NOT re-fetched on each search submission
- [ ] T039 [P] Confirm Google Maps / geolocation loaded via `next/dynamic` with `ssr: false` if applicable (plan.md §7)

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: Start immediately
- **UI (Phase 2)**: Requires Phase 1 audit
- **Logic (Phase 3)**: Requires Phase 2 UI updates
- **API (Phase 4)**: Can run in parallel with Phase 2
- **Backend (Phase 5)**: Can run immediately — verification only
- **Security (Phase 6)**: Requires Phase 1 audit complete
- **Testing (Phase 7)**: Requires Phase 2, 3, 4 complete
- **Logging (Phase 8)**: Requires Phase 3 complete
- **Quality Gates (Phase 9)**: Requires all prior phases
- **Finalization (Phase 10)**: Requires Phase 9 passing

## Total Task Count: 39
- US1 tasks: 10 | US2 tasks: 8 | US3 tasks: 3 | Cross-cutting: 18
