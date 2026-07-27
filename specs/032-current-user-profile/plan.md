# Implementation Plan: Current User Profile & Reference Data

**Branch**: `032-current-user-profile` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/032-current-user-profile/spec.md`

---

## 1. Overview

### What Exists

- `src/app/profile/page.tsx` — profile route that already calls `fetchCurrentUser()` and renders inline profile fields. Has `/* eslint-disable */` at the top, an inline `UserData` interface with `expertTypeId?: any`, and a dead `userSites` state that is declared but never populated, causing the "My Organization" card to never render.
- `fetchCurrentUser()` in `src/app/organization/services/api.ts:1060` — calls `GET /api/v1/users/me`, returns `User`. Lives in the wrong module (organization scope instead of profile scope).
- `User` interface in `src/app/organization/types/index.ts:21` — covers all fields the profile page currently renders (`fullName`, `emailId`, `phoneNumber`, `gender`, `roles`, `registeredDate`, `enabled`, `siteId`, `siteName`). Missing `organizationName` — must be added as optional.
- `src/app/profile/ProfileContent.tsx` — legacy expert onboarding profile view, still used as fallback for the `LegalIndividualExpert` role flow.
- No `src/app/profile/services/` directory — profile API calls are currently co-located in the organization services file.
- No `useSupportedStates` hook, no `StatesDropdown` component, no reference data service.

### Gaps to Close

1. **Profile service module**: Move (or duplicate and re-export) `fetchCurrentUser` into a dedicated `src/app/profile/services/api.ts` to satisfy constitution V (domain-scoped service files).
2. **Dead org context card**: Remove `userSites` and the never-rendering "My Organization" card. Replace with an org context block derived directly from `currentUser.organizationId`, `currentUser.siteId`, `currentUser.siteName` — all fields already on the `User` type.
3. **ESLint / `any` violations**: Remove `/* eslint-disable */` from `page.tsx`. Replace `expertTypeId?: any` with `expertTypeId?: number | null`. Remove the now-redundant `UserData` interface or simplify it.
4. **SupportedState type**: Add `SupportedState` interface to `src/app/organization/types/index.ts`.
5. **Reference data service**: Create `src/services/referenceApi.ts` with `fetchSupportedStates()`.
6. **`useSupportedStates` hook**: Create `src/hooks/useSupportedStates.ts` with module-level cache.
7. **`StatesDropdown` shared component**: Create `src/components/StatesDropdown.tsx` — MUI `<Autocomplete>` backed by `useSupportedStates()`, fallback to `<TextField>` on error.
8. **Address form audit**: Identify all forms with a free-text `state` field and wire in `StatesDropdown`.

### What Is New

- `src/app/profile/services/api.ts` — profile-scoped service (wraps `fetchCurrentUser`)
- `src/services/referenceApi.ts` — reference data service (`fetchSupportedStates`)
- `src/hooks/useSupportedStates.ts` — reference data hook with module-level cache
- `src/components/StatesDropdown.tsx` — shared MUI Autocomplete dropdown for Indian states
- `SupportedState` interface in `src/app/organization/types/index.ts`
- Refactored `src/app/profile/page.tsx` — removes dead state, ESLint disable, and `any` types; adds proper org context card
- E2E and unit tests

---

## 2. Architecture Flow

### 2.1 Profile Page Load

```text
Authenticated user navigates to /profile
  → page.tsx mounts ("use client")
  → initKeycloak() → authenticated = true
  → fetchCurrentUser()
      → GET /api/v1/users/me
      → Bearer token auto-injected by Axios interceptor
      → Response: { success: true, data: User }
  → setCurrentUser(user)
  → Render ProfileCard:
      Fields: fullName, emailId, phoneNumber, gender, roles, registeredDate, enabled
  → Render OrgContextCard (if organizationId or siteId present):
      Fields: organizationName (if present), siteName (if present)
      Links: org/site navigation buttons for Site-role users
  → On fetch error (404): show "contact support" message
  → On auth failure (401): Keycloak refresh → persistent 401 → force logout
```

### 2.2 States Dropdown Flow (any address form)

```text
Any form with a State field renders
  → imports <StatesDropdown />
  → StatesDropdown calls useSupportedStates()
      → cache hit (second+ render): returns SupportedState[] immediately (0 network)
      → cache miss (first load):
          → fetchSupportedStates()
              → GET /api/v1/reference/supported-states
              → Bearer token auto-injected
          → success → cache SupportedState[] in module-level var → return array
          → error → return [], set error=true
  → success path: renders MUI <Autocomplete> with state options
  → error path: renders MUI <TextField> (free-text fallback) + showError() toast
  → User selects state → value passed back via onChange prop (matches consuming form's field)
```

### 2.3 Authentication Gate

```text
All profile page renders
  → initKeycloak() must return true before any data fetch
  → unauthenticated → redirect to Keycloak login (handled by Keycloak.js)
  → token refresh:
      → 401 from /me or /reference/supported-states → interceptor triggers refresh
      → refresh success → request retried automatically
      → refresh failure → force logout → PURGE Redux store
```

---

## 3. File Structure

### Documentation

```text
specs/032-current-user-profile/
├── spec.md              # Feature specification
├── research.md          # Phase 0 — unknowns resolved
├── data-model.md        # Phase 1 — entity definitions
├── plan.md              # This file
├── contracts/
│   └── api-contracts.md # API contract definitions
└── tasks.md             # Phase 2 — generated by /speckit-tasks (NOT created here)
```

### Source Code

```text
src/
├── app/
│   ├── profile/
│   │   ├── page.tsx                    # MODIFY — remove dead state, fix eslint/any, add org context card
│   │   ├── layout.tsx                  # UNTOUCHED
│   │   ├── ProfileContent.tsx          # UNTOUCHED (legacy expert fallback)
│   │   ├── page.module.css             # UNTOUCHED
│   │   └── services/
│   │       └── api.ts                  # NEW — profile-scoped API service
│   └── organization/
│       └── types/
│           └── index.ts                # MODIFY — add SupportedState; add organizationName? to User
│
├── components/
│   └── StatesDropdown.tsx              # NEW — shared MUI Autocomplete for Indian states
│
├── hooks/
│   └── useSupportedStates.ts           # NEW — fetch + module-level cache hook
│
└── services/
    └── referenceApi.ts                 # NEW — fetchSupportedStates() service function

e2e/
└── profile/
    └── current-user-profile.spec.ts   # NEW — Playwright E2E tests

src/
└── components/
    └── StatesDropdown.test.tsx         # NEW — React Testing Library unit test
```

---

## 4. Component Design

### 4.1 `ProfileCard` (inline in `page.tsx`)

Renders the authenticated user's own profile details. Not extracted to a sub-component — the data is local state in `page.tsx` and is not reused elsewhere (constitution VI: don't promote unless 2+ reuse sites).

| Field | Source | Conditional |
|---|---|---|
| Full Name | `currentUser.fullName` | No |
| Email | `currentUser.emailId` | No |
| Phone Number | `currentUser.phoneNumber` | No — hide if empty/0 |
| Gender | `currentUser.gender` | Yes — hide if absent; map `"Transgender"` → `"Non-Binary"` |
| Roles | `currentUser.roles.join(", ")` | No |
| Registered Date | `formatDisplayDate(currentUser.registeredDate)` | No |
| Status | Active/Inactive badge | No |

### 4.2 `OrgContextCard` (inline in `page.tsx`)

Replaces the dead `userSites`-gated "My Organization" card. Renders using fields already on the `User` type. No second API call.

Renders when: `currentUser.organizationId` is truthy.

| Field | Source | Conditional |
|---|---|---|
| Organization Name | `currentUser.organizationName` | Yes — if absent, omit the label |
| Site Name | `currentUser.siteName` | Yes — if absent, omit |
| "My Dashboard" button | navigates to `/organization/{orgId}/sites/{siteId}/cases?userId={id}` | Yes — only for Site-role users with `siteId > 0` |
| "Site Dashboard" button | navigates to `/organization/{orgId}/sites/{siteId}` | Yes — only for Site-role users with `siteId > 0` |

Role check for dashboard buttons:
```typescript
const isSiteUser = currentUser.roles.some((r) => r.startsWith('Site'));
const hasSite = (currentUser.siteId ?? 0) > 0;
const showDashboards = isSiteUser && hasSite;
```

### 4.3 `StatesDropdown` (`src/components/StatesDropdown.tsx`)

Thin wrapper around MUI `<Autocomplete>`. All consuming forms import this component instead of a raw `<TextField>`.

```typescript
interface StatesDropdownProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;          // default: "State"
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}
```

Internals:
- Calls `useSupportedStates()` — returns `{ states, loading, error }`
- `loading=true` → renders `<Autocomplete>` with `loading` prop and `CircularProgress` end adornment
- `error=true` → renders `<TextField>` (free-text fallback) + fires `showError()` toast on first error
- `states` ready → renders `<Autocomplete options={states} getOptionLabel={(s) => s.name} />`
- Selected value stored as `SupportedState.name` string (matching existing address form conventions)

### 4.4 `useSupportedStates` (`src/hooks/useSupportedStates.ts`)

```typescript
interface UseSupportedStatesResult {
  states: SupportedState[];
  loading: boolean;
  error: boolean;
}

export function useSupportedStates(): UseSupportedStatesResult
```

Module-level cache:
```typescript
let statesCache: SupportedState[] | null = null;
```

Behavior:
- On mount: if `statesCache !== null`, return immediately (no fetch)
- Otherwise: fetch, populate cache, set states in local state
- Error: set `error=true`, states remain `[]`

---

## 5. API Plan

### Endpoint 1: Get Current User Profile

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/v1/users/me` |
| Auth | Bearer `<keycloak-jwt>` (required) |
| Status | **EXISTING** — `fetchCurrentUser()` at `src/app/organization/services/api.ts:1060` |

**Profile service wrapper** (`src/app/profile/services/api.ts`):
```typescript
export { fetchCurrentUser } from '@/app/organization/services/api';
```
Re-exports the existing function to keep the profile domain's imports domain-scoped without duplicating logic. If the organization service is later refactored, this indirection point allows the profile page to remain unaffected.

**Response shape** (already handled by existing service):
```json
{ "success": true, "data": { ...User fields... }, "message": null }
```

**Error handling**:
| Status | Frontend action |
|---|---|
| 200 | Render profile |
| 401 | Keycloak interceptor → refresh → retry or force logout |
| 404 | `setError(true)` → render "contact support" message |
| 5xx | `setError(true)` → render "contact support" message |

---

### Endpoint 2: Get Supported States

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/v1/reference/supported-states` |
| Auth | Bearer `<keycloak-jwt>` (required) |
| Status | **NEW** — `fetchSupportedStates()` in `src/services/referenceApi.ts` |

**Implementation** (`src/services/referenceApi.ts`):
```typescript
import httpServices from '@/services/httpServices';
import { SupportedState } from '@/app/organization/types';

const BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`;

export const fetchSupportedStates = async (): Promise<SupportedState[]> => {
  const response = await httpServices.get(`${BASE}/reference/supported-states`);
  return response.data?.data ?? response.data ?? [];
};
```

Uses `httpServices` (Axios client with auto Bearer injection) — no manual token handling needed.

**Error handling**:
| Status | Frontend action |
|---|---|
| 200 | Cache and render dropdown |
| 401 | Keycloak interceptor → refresh → retry or force logout |
| 4xx / 5xx | Hook returns `error=true`; `StatesDropdown` shows `<TextField>` fallback + toast |

> **Action before implementation**: Confirm exact path `/api/v1/reference/supported-states` with backend team. If path differs, update only `referenceApi.ts`.

---

## 6. Security Plan

### Authentication Gate

- `src/app/profile/page.tsx` calls `initKeycloak()` before any data fetch. Unauthenticated users are redirected to Keycloak login before any profile data is requested — no profile data is ever exposed to unauthenticated sessions.
- `StatesDropdown` / `useSupportedStates` is used only within authenticated routes. The `fetchSupportedStates` call will 401 for unauthenticated requests; the Axios interceptor will trigger refresh or logout.

### Token Handling

- Bearer tokens are injected automatically by `httpServices` (Axios interceptor). The profile service and reference data service both use `httpServices` — no manual `Authorization` header construction needed.
- Keycloak tokens remain in `localStorage` per the OAuth redirect flow requirement (constitution II exception for client-side Keycloak tokens).

### XSS Prevention

- All profile fields (`fullName`, `emailId`, `phoneNumber`, `siteName`) are rendered as React text nodes — no `dangerouslySetInnerHTML`, no raw HTML interpolation.
- `StatesDropdown` uses MUI `<Autocomplete>` which renders option labels as text nodes.
- No user-generated content is rendered via `react-markdown` in this feature.

### Input Validation

- Profile page is read-only — no user inputs, no form submission. No client-side validation required for this feature.
- `StatesDropdown` enforces valid state selection by constraining choices to the API-returned list. Free-text fallback is only shown on API error; the consuming form's server-side validation catches any out-of-set values.

### Content Security Policy

- No new external origins introduced. No new `<script>` tags, no `<iframe>` embeds, no external API calls to third-party domains.
- Existing CSP headers in `next.config.ts` remain valid.

### Data Exposure

- The `/me` endpoint returns only the authenticated user's own data, scoped by the Keycloak JWT — no user ID is passed in the request, eliminating IDOR risk.
- No sensitive fields (passwords, OTPs, tokens) are rendered or logged.

---

## 7. State Management

### Profile Data — Local React State (no Redux)

Profile data is per-page, per-session, and not shared across routes. Redux is not appropriate here (constitution rationale: Redux slices are for cross-route shared state). Local `useState` in `page.tsx` is sufficient.

```typescript
const [currentUser, setCurrentUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(false);
const [authenticated, setAuthenticated] = useState(false);
const [authChecked, setAuthChecked] = useState(false);
```

Removed from current implementation: `userData` (legacy bridge state), `userSites` (dead state).

### Reference Data — Module-Level Cache (no Redux)

States are session-static, not user-specific, and require no PURGE on logout. A module-level variable in `useSupportedStates.ts` provides zero-overhead caching within a browser session:

```typescript
let statesCache: SupportedState[] | null = null;
```

This cache persists across component mount/unmount cycles (e.g., user navigates between forms). It is reset only on full page reload or tab close.

**Why not Redux**: States reference data is not user-specific and does not need PURGE on logout. Redux would add unnecessary boilerplate and a persisted slice for data that is genuinely immutable within a session.

**Why not React Context**: Adding a context provider for static lookup data that does not change is over-engineered. The module-level cache achieves the same effect without a Provider wrapper.

### Logout

On logout, Redux dispatches `PURGE` (already handled by existing slices). `statesCache` is automatically cleared by the page reload that follows logout — no explicit cleanup needed.

---

## 8. Testing Plan

### Unit Tests

**`StatesDropdown.test.tsx`** (React Testing Library)

| Test | Scenario |
|---|---|
| Renders Autocomplete when states load | Mock `useSupportedStates` returning 29 states — verify `<Autocomplete>` renders |
| Renders TextField fallback on error | Mock `useSupportedStates` returning `error=true` — verify `<TextField>` renders |
| Shows loading spinner | Mock `useSupportedStates` returning `loading=true` — verify CircularProgress |
| Calls onChange with selected state name | Simulate selecting "Maharashtra" — verify `onChange("Maharashtra")` called |
| Passes required/error/helperText props | Verify MUI props forwarded correctly |

**`useSupportedStates.test.ts`** (Vitest + `renderHook`)

| Test | Scenario |
|---|---|
| Fetches states on first call | Mock `fetchSupportedStates` → verify hook returns states |
| Uses cache on second render | Mock called once — second `renderHook` returns cache without fetching again |
| Sets error on fetch failure | Mock `fetchSupportedStates` throws → verify `error=true`, `states=[]` |

### E2E Tests

**`e2e/profile/current-user-profile.spec.ts`** (Playwright)

Golden path:
1. Log in as any role → navigate to `/profile`
2. Verify profile card renders with name, email, phone, roles, status badge
3. Verify page load time < 2s (SC-001)

Edge cases:
1. **Unauthenticated access**: Navigate to `/profile` without login → assert redirect to Keycloak login page
2. **States dropdown in site creation**: Navigate to site creation form → assert State field is an Autocomplete (not a free-text input) and contains ≥ 28 options
3. **States load failure simulation**: Intercept `GET /api/v1/reference/supported-states` → return 500 → assert fallback `<TextField>` renders and error toast appears

### Pre-commit Gates

All changes must pass before committing:
- `tsc --noEmit` — zero TypeScript errors (especially after removing `/* eslint-disable */` and `any`)
- `eslint` — zero errors
- `next build` — production build succeeds

---

## 9. Performance

### Profile Page Load (SC-001: < 2s)

- Single API call (`GET /api/v1/users/me`) on page mount — no sequential requests, no waterfalls.
- Removed the dead `fetchOrganizationUserSites()` that would have added a second blocking request.
- The profile page uses `"use client"` only as required (Keycloak initialization + state hooks). No server component upgrade is needed here as Keycloak cannot run in SSR context.

### States Dropdown (SC-002: < 1s after first load)

- First load: single `GET /api/v1/reference/supported-states` call. Response is 29 lightweight items (~2KB) — sub-100ms at normal API latency.
- Subsequent renders: module-level cache returns synchronously — zero network calls.
- `StatesDropdown` uses MUI `<Autocomplete>` which renders a searchable dropdown. For 29–36 options, no virtualization is needed.

### Image / Bundle Considerations

- No new images introduced. No new heavy dependencies (no Google Maps, no Razorpay in this feature).
- `StatesDropdown` is a thin MUI wrapper — no additional bundle weight beyond what MUI already contributes.
- No `next/dynamic` lazy loading required — this feature does not introduce heavy route-specific dependencies.

### Redux Selectors

- No new Redux selectors in this feature. Existing selectors are unaffected.

---

## 10. Logging

### What Must Be Logged (constitution IX)

This feature does not involve payments, Twilio, or Razorpay — those logging requirements do not apply here.

| Event | Log level | What to log |
|---|---|---|
| `/me` fetch failure (non-401) | Error | Endpoint, HTTP status, timestamp. **Not** token or user PII beyond the fact of failure. |
| `/me` 401 persistent after refresh | Error | Logged by existing Keycloak force-logout path — no new logging needed. |
| `supported-states` fetch failure | Warning | Endpoint, HTTP status, timestamp. Graceful degradation path taken. |
| Any API response taking > 2s | Warning | Endpoint, duration. Logged by existing `httpServices` interceptor if present; add if not. |

### What Must Never Be Logged (constitution IX)

- `currentUser.emailId`, `currentUser.phoneNumber` — PII
- Keycloak access or refresh tokens
- Any field classified beyond name/email

### Frontend Logging

Frontend errors are surfaced to the user via `useToast()` (`showError()`), not logged to a server sink. Browser `console.error()` is acceptable for development-mode debugging but must not be the sole error handling path.

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Backend `/me` does not return `organizationName`** | Medium | Low | `organizationName` is optional in the `User` type. Profile card omits the org name label if absent. Org context card shows `siteName` and navigation links using `organizationId` and `siteId` which are confirmed present. |
| **`/api/v1/reference/supported-states` path is different** | Medium | Low | Only `src/services/referenceApi.ts` has the path hardcoded. Confirm with backend before implementation; single-file fix if it differs. |
| **`fetchCurrentUser` in organization/services/api.ts is refactored or moved by another PR** | Low | Medium | The profile service re-exports from the organization service. If the source moves, only `src/app/profile/services/api.ts` import path needs updating. Track via constitution V (breaking changes in same PR). |
| **Removing `/* eslint-disable */` reveals other violations in `page.tsx`** | Low | Low | Controlled — fix `expertTypeId?: any` first, then remove the disable comment, then run lint to catch any additional violations. None are expected based on code review. |
| **Address form audit finds more forms than expected** | Low | Medium | The audit is scoped to the implementation phase. Each wiring is a low-complexity swap (`<TextField>` → `<StatesDropdown>`). Add to task list during `/speckit-tasks`. |
| **`StatesDropdown` used before `useSupportedStates` cache is warm (race condition)** | Low | Low | Module-level cache is synchronous once populated. React's re-render cycle ensures the hook's state update triggers a re-render with the cached data. No race condition possible within the same React tree. |
| **MUI `<Autocomplete>` accessibility** | Low | Low | MUI ships with ARIA roles and keyboard navigation built in. No custom ARIA implementation needed. |

---

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| I — Type Safety | PASS | Remove `any` from `UserData`. Add `SupportedState` type. All API responses typed. |
| II — XSS / Web Safety | PASS | All dynamic values rendered as React text nodes. No `dangerouslySetInnerHTML`. |
| III — Test Coverage | PASS | Playwright E2E (golden path + 2 edge cases). RTL unit tests for `StatesDropdown` and `useSupportedStates`. |
| IV — Auth Consistency | PASS | `initKeycloak()` gate before data fetch. Token refresh via interceptor. Force logout on persistent 401. |
| V — API Contract Discipline | PASS | Profile API calls in `src/app/profile/services/api.ts`. Reference API in `src/services/referenceApi.ts`. Errors via `useToast()`. |
| VI — Component Architecture | PASS | `StatesDropdown` in `src/components/` (3+ reuse sites). Profile card stays inline in `page.tsx` (single use). |
| VII — Pre-commit Gates | PASS | `tsc → eslint → build` must pass before any commit. |
| IX — Logging | PASS | API errors logged at appropriate level. PII not logged. |
| X — Performance | PASS | Single API call on profile load. Module-level cache for states after first fetch. |
| XIV — Spec Governance | PASS | `spec.md`, `research.md`, `data-model.md`, `contracts/`, `plan.md` all committed before implementation. |
