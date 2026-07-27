# Implementation Plan: Legal Expert Search

**Branch**: `028-legal-expert-search` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/028-legal-expert-search/spec.md`

---

## 1. Overview

### What Exists

- `src/app/search/page.tsx` — search page with `SearchComponent` and `FilterSection`.
- `src/app/search/filters and layout/filterSection.tsx` — renders search result cards.
- `src/components/searchComponent` — handles location-based search form.
- `SearchResult` interface: `{ id, fullName, address, expertType, portfolios, gender, photoBinary, customerRating, yearsOfExperience, consultationFeesRs, availableOnline, availableInPerson, meetingDurationMins }`.
- Session storage used to preserve results across profile navigation.

### Gaps to Close

1. **Specialization filter**: Add specialization dropdown (from reference data API) as a second filter alongside location. Currently only location-based search exists.
2. **No-filter search**: Submit with no location and no specialization must return all qualifying experts (currently unclear if supported).
3. **Empty state**: Confirm a user-friendly empty state is shown when no results — not a blank page.
4. **Active/Schedule-stage filter**: Only experts at Schedule stage and `enabled: true` appear in results — verify backend enforces this.
5. **Result card content**: Cards must show name, specialization(s), address, and rating summary. Verify all four fields are present in the current `FilterSection` card.
6. **No auth gate**: Page must be accessible without login — confirm no Keycloak check in page component.
7. Add unit and E2E tests.

### What Is New

- Specialization filter dropdown in `SearchComponent` (or `FilterSection`)
- `src/app/search/services/api.ts` — search-scoped API service file
- Updated `SearchResult` type with confirmed fields
- Unit tests and E2E tests

---

## 2. Architecture Flow

### 2.1 Search by Location

```
User on /search (no auth required)
  → SearchComponent renders
  → User enters location (Google Places Autocomplete or manual text) + radius selector
  → Click Search → setIsSearching(true)
  → searchExperts({ location, radius })
      → GET /api/v1/legal-experts/search?lat={lat}&lng={lng}&radius={radius}
  → results returned → setSearchResult(results)
  → FilterSection renders result cards
  → Empty → EmptyState: "No legal experts found in this area. Try expanding your search radius."
```

### 2.2 Search by Specialization

```
User on /search
  → Selects specialization from MUI Select dropdown (pre-populated from reference data)
  → Click Search → searchExperts({ specialization })
      → GET /api/v1/legal-experts/search?specialization={value}
  → results filtered to matching specialization only
```

### 2.3 Combined Filter Search

```
User enters location AND specialization
  → searchExperts({ location, radius, specialization })
      → GET /api/v1/legal-experts/search?lat={lat}&lng={lng}&radius={radius}&specialization={value}
  → only experts matching BOTH criteria returned
```

### 2.4 No-Filter Search

```
User clicks Search with no inputs
  → searchExperts({})
      → GET /api/v1/legal-experts/search (no query params)
  → returns all Schedule-stage active experts
  → results rendered in FilterSection
```

### 2.5 Result Display

```
Each result card shows:
  → Expert name (fullName)
  → Specialization(s) (portfolios array)
  → Address (address string)
  → Rating summary (customerRating + count or aggregate)
  → [optional] Fees, availability badges
Click card → navigate to /expert/{id}/profile (or preserve results in sessionStorage)
```

---

## 3. File Structure

### Documentation

```
specs/028-legal-expert-search/
  spec.md                                  NO CHANGE
  plan.md                                  NEW (this file)
  research.md                              NEW
  data-model.md                            NEW
  contracts/
    api-contracts.md                       NEW
```

### Source Tree

```
src/app/search/
  page.tsx                                 UPDATE — add specialization filter, verify no-auth access
  filters and layout/
    filterSection.tsx                      UPDATE — ensure result cards show all 4 required fields; add empty state
  services/
    api.ts                                 NEW — search API calls extracted from component
  types/
    index.ts                               NEW — SearchResult, SearchFilters interfaces

src/components/
  searchComponent/
    SearchComponent.tsx                    UPDATE — add specialization dropdown filter
    __tests__/
      SearchComponent.test.tsx             NEW

e2e/
  028-legal-expert-search.spec.ts          NEW
```

---

## 4. Component Design

### 4.1 `SearchComponent`

- **Current**: Location input + radius selector + search button.
- **Add**: MUI `<Select>` for specialization dropdown populated from `/api/v1/reference-data/specializations` (or equivalent). Labeled "Specialization (optional)".
- **No-filter state**: Both fields empty → search button still enabled → fetches all qualifying experts.
- **Loading state**: Button shows MUI `<CircularProgress>` while `isSearching === true`.
- **Filters interface**:
  ```typescript
  interface SearchFilters {
    location?: { lat: number; lng: number } | string;
    radius?: number;
    specialization?: string;
  }
  ```

### 4.2 `FilterSection` (Result Cards)

- **Required card fields** (FR-005):
  - Expert name → `result.fullName`
  - Specialization(s) → `result.portfolios.join(', ')` or MUI `<Chip>` per portfolio
  - Address → `result.address`
  - Rating summary → `result.customerRating` + count (if count available in API)
- **Empty state**: When `searchResult.length === 0` and search was submitted → render `<EmptyState message="No legal experts found. Try adjusting your filters." />`
- **Result ordering**: Display order from API (backend sorts by proximity for location searches).
- **`React.memo`** on individual result cards (can be many results).

### 4.3 No-Auth Access

- `src/app/search/page.tsx` must NOT contain a Keycloak auth check.
- If any Keycloak check exists, remove it or guard behind a feature flag.
- All API calls to search endpoint must work without a Bearer token.

---

## 5. API Plan

| Method | URL | Auth | Query Params | Success | Error Codes | Status |
|--------|-----|------|--------------|---------|-------------|--------|
| `GET` | `/api/v1/legal-experts/search` | None (public) | `lat`, `lng`, `radius`, `specialization` (all optional) | `{ items: SearchResult[], totalCount, page, pageSize }` 200 | 400 (invalid params) | Existing (verify) |
| `GET` | `/api/v1/reference-data/specializations` | None (public) | — | `{ data: string[] }` 200 | — | Verify exists |

**`SearchResult` interface** (to be confirmed against actual API response):
```typescript
interface SearchResult {
  id: number;
  fullName: string;
  address: string;
  expertType: string;
  portfolios: string[];
  customerRating: number;
  ratingCount?: number;
  yearsOfExperience: number;
  consultationFeesRs: number;
  availableOnline: boolean;
  availableInPerson: boolean;
  photoBinary?: string;
  meetingDurationMins: number;
}
```

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| Incomplete-profile experts in results | Backend filters: only `enabled: true` AND `stage === 'Schedule'` experts returned |
| Unauthenticated access to search API | Search endpoint is intentionally public — no Bearer token required; backend enforces no PII fields in response |
| XSS via expert name/specialization in result cards | Values rendered as React text nodes via MUI Typography — no `dangerouslySetInnerHTML` |
| Location data leakage (coordinates in URL) | Coordinates only sent as query params to backend — not stored in sessionStorage or Redux |
| Result card click navigating to wrong expert | Route uses `result.id` from API response — not user-provided; no injection surface |
| Search with malformed radius (negative, NaN) | Client-side validation on radius input; backend validates query params |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `searchResult` | `search/page.tsx` (local) | Ephemeral search results; not persisted in Redux |
| `isSearching` | `search/page.tsx` (local) | Loading state for search form |
| `preservedSearchResults` | `sessionStorage` | Preserves results when navigating to expert profile and back |
| `specializations` list | `SearchComponent` (local, fetched once on mount) | Reference data for dropdown; rarely changes |
| Filter values (location, radius, specialization) | `SearchComponent` (local) | Form state; ephemeral |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `SearchComponent.test.tsx` | Submit with location + radius → searchExperts called with correct params | API mock invoked |
| `SearchComponent.test.tsx` | Submit with specialization only → searchExperts called with specialization param | API mock invoked |
| `SearchComponent.test.tsx` | Submit with no filters → searchExperts called with no params | API mock invoked |
| `SearchComponent.test.tsx` | Loading state → button shows spinner, is disabled | CircularProgress in DOM |
| `filterSection.test.tsx` | Results provided → each card shows name, specialization, address, rating | All fields rendered |
| `filterSection.test.tsx` | Empty results + search submitted → EmptyState shown | Empty state text present |
| `filterSection.test.tsx` | Results preserved in sessionStorage on card click | sessionStorage updated |

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| Search by location | Unauthenticated | Enter location + radius, search | Results with name/specialization/address shown |
| Search by specialization | Unauthenticated | Select specialization, search | Only matching experts shown |
| Combined filter search | Unauthenticated | Location + specialization, search | Intersection of both filters |
| No-filter search | Unauthenticated | Click Search with empty form | All qualifying experts shown |
| Empty state | Unauthenticated | Very restrictive location radius | Empty state message shown |
| Page accessible without login | Unauthenticated | Navigate to /search | Page loads, no redirect to auth |

Test file: `e2e/028-legal-expert-search.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-001: Search page loads within 2s without login | No Keycloak initialization on this route; no Redux hydration needed |
| SC-002: Search results within 2s | Paginated response (page 1, pageSize 20 default); backend uses indexed geo-search |
| SC-003: Incomplete/inactive experts never appear | Backend filtering — no client-side filter needed |
| SC-004: Empty state always shown (never blank page) | `searchResult.length === 0 && hasSearched` → EmptyState; `hasSearched` flag set on first submit |
| `React.memo` on result cards | Prevents re-renders when `isSearching` toggling |
| Specialization dropdown loaded once | Fetched on component mount, cached in local state — not re-fetched on each search |
| Google Maps loaded via `next/dynamic` | SSR: false prevents SSR bloat for map/geolocation libraries |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| Search executed | INFO | filter params (radius, specialization — no coordinates), result count | Exact lat/lng coordinates |
| Empty result returned | INFO | filter params, `resultCount: 0` | — |
| Reference data fetch (specializations) | INFO | endpoint, count | — |
| Invalid search params (400 from API) | WARN | param names, error message | User-entered values |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Search API requires auth token (not truly public) | Medium | High | Test without token in research phase; escalate to backend if auth required |
| `specialization` query param name differs from backend expectation | Medium | Medium | Confirm exact param name from API contract; adjust `SearchFilters` accordingly |
| Geolocation browser permission denied | Medium | Medium | Fallback to text-based address lookup; show prompt explaining permission need |
| Result cards missing `ratingCount` (only have `customerRating`) | Medium | Low | Show rating score only if count unavailable; "N ratings" shows when count present |
| `sessionStorage.getItem("preservedSearchResults")` stale data | Low | Low | Clear sessionStorage on new search; only restore on `?preserveResults` query param |
| Specialization reference data API not available | Low | Medium | Fallback to text input for specialization; document as gap |
