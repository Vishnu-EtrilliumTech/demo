# Tasks: Current User Profile & Reference Data

**Feature Branch**: `032-current-user-profile`
**Input**: `specs/032-current-user-profile/plan.md`, `specs/032-current-user-profile/spec.md`

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = User Views Own Profile, US2 = State Dropdown in Address Forms

---

## Phase 1: Setup

**Purpose**: Audit existing code and prepare new modules.

- [ ] T001 [US1] Audit `src/app/profile/page.tsx` — identify: `/* eslint-disable */` at top, `UserData` interface with `expertTypeId?: any`, dead `userSites` state, never-rendering "My Organization" card; document each as a sub-task
- [ ] T002 [P] [US1] Audit `src/app/organization/types/index.ts` — verify `User` interface has `siteId`, `siteName`, `organizationId`; confirm `organizationName` is missing (add as optional per plan.md §3)
- [ ] T003 [P] [US2] Confirm `GET /api/v1/reference/supported-states` endpoint path with backend before implementation (risk: path may differ per plan.md §11)
- [ ] T004 [P] [US1] Verify `fetchCurrentUser()` exists at `src/app/organization/services/api.ts:1060` and calls `GET /api/v1/users/me` returning `{ success: true, data: User }`

---

## Phase 2: UI

**Purpose**: Fix profile page rendering and build StatesDropdown component.

- [ ] T005 [US1] Update `src/app/profile/page.tsx` — remove dead `userSites` state and the never-rendering "My Organization" card gated on `userSites`
- [ ] T006 [US1] Add `OrgContextCard` block inline in `src/app/profile/page.tsx` — renders when `currentUser.organizationId` is truthy; shows `organizationName` (if present), `siteName` (if present); "My Dashboard" and "Site Dashboard" buttons when `isSiteUser && hasSite`; derive `isSiteUser` from `currentUser.roles.some(r => r.startsWith('Site'))` and `hasSite = (currentUser.siteId ?? 0) > 0`
- [ ] T007 [P] [US2] Create `src/components/StatesDropdown.tsx` — MUI `<Autocomplete>` backed by `useSupportedStates()`; props: `value`, `onChange`, `label?` (default "State"), `required?`, `error?`, `helperText?`, `disabled?`; loading → `<Autocomplete loading>` with `CircularProgress`; error → `<TextField>` fallback + `showError()` toast; ready → `<Autocomplete options={states} getOptionLabel={(s) => s.name} />`

---

## Phase 3: Logic

**Purpose**: Fix profile page state, remove type violations, implement reference data hook.

- [ ] T008 [US1] Remove `/* eslint-disable */` from `src/app/profile/page.tsx` and fix all lint errors exposed; replace `expertTypeId?: any` with `expertTypeId?: number | null` in any local interface
- [ ] T009 [US1] Simplify or remove redundant `UserData` inline interface in `src/app/profile/page.tsx` — replace with the canonical `User` type from `src/app/organization/types/index.ts` (plan.md §3)
- [ ] T010 [P] [US1] Add `organizationName?: string` to `User` interface in `src/app/organization/types/index.ts`
- [ ] T011 [US2] Create `src/hooks/useSupportedStates.ts` — module-level cache `let statesCache: SupportedState[] | null = null`; on mount if cache !== null return immediately (no fetch); otherwise fetch and populate cache; returns `{ states: SupportedState[], loading: boolean, error: boolean }`
- [ ] T012 [P] [US2] Add `SupportedState { id: string, name: string }` interface to `src/app/organization/types/index.ts`
- [ ] T013 [US2] Audit all forms across the codebase with a free-text `state` field and replace with `<StatesDropdown />` — at minimum: site creation form, expert address form; identify additional forms during audit

---

## Phase 4: API

**Purpose**: Create profile-scoped and reference data service files.

- [ ] T014 [US1] Create `src/app/profile/services/api.ts` — re-export `fetchCurrentUser` from `src/app/organization/services/api`:
  ```typescript
  export { fetchCurrentUser } from '@/app/organization/services/api';
  ```
  This satisfies domain-scoped service convention (plan.md §5)
- [ ] T015 [US2] Create `src/services/referenceApi.ts` — implement `fetchSupportedStates(): Promise<SupportedState[]>` calling `GET /api/v1/reference/supported-states` via `httpServices`; normalize response with `response.data?.data ?? response.data ?? []`
- [ ] T016 [P] [US1] Update `src/app/profile/page.tsx` imports to use `fetchCurrentUser` from `src/app/profile/services/api.ts` instead of directly from organization services

---

## Phase 5: Backend

**Purpose**: Validate backend contract for both endpoints.

- [ ] T017 [US1] Confirm `GET /api/v1/users/me` returns `organizationName` field (may be absent per plan.md §11) — if absent, confirm `organizationId` and `siteId` are present for context card navigation links
- [ ] T018 [P] [US2] Confirm exact path for supported states endpoint — `/api/v1/reference/supported-states` or different; update `src/services/referenceApi.ts` path if it differs
- [ ] T019 [P] [US2] Confirm states endpoint requires Bearer auth (plan.md §5 notes it requires auth) — verify it is not a public endpoint

---

## Phase 6: Security

**Purpose**: Enforce authentication gate and prevent PII exposure.

- [ ] T020 [US1] Verify `src/app/profile/page.tsx` calls `initKeycloak()` before any data fetch — unauthenticated users redirect to Keycloak login; no profile data exposed to unauthenticated sessions
- [ ] T021 [P] [US1] Verify all profile fields (`fullName`, `emailId`, `phoneNumber`, `siteName`) rendered as React text nodes — no `dangerouslySetInnerHTML` in `page.tsx`
- [ ] T022 [P] [US2] Verify `StatesDropdown` renders MUI `<Autocomplete>` option labels as text nodes — no raw HTML in option rendering
- [ ] T023 [P] Verify no sensitive fields (passwords, OTPs, tokens) are rendered or logged anywhere in profile page or reference data hook

---

## Phase 7: Testing

**Purpose**: Unit and E2E test coverage.

- [ ] T024 [US2] Create `src/components/StatesDropdown.test.tsx` — tests: renders Autocomplete when states load (mock 29 states); renders TextField fallback on error; shows CircularProgress when loading; calls onChange with selected state name; forwards required/error/helperText props
- [ ] T025 [US2] Create `src/hooks/useSupportedStates.test.ts` — tests: fetches states on first call (mock `fetchSupportedStates`); uses cache on second render (mock called once); sets error=true on fetch failure; returns `states=[]` on error
- [ ] T026 Create `e2e/profile/current-user-profile.spec.ts` — E2E golden path: log in → navigate to `/profile` → verify profile card shows name/email/phone/roles/status badge → page load < 2s; edge case: unauthenticated access redirects to Keycloak login; edge case: states dropdown in site creation form is Autocomplete with ≥28 options; edge case: intercept `/api/v1/reference/supported-states` → 500 → verify fallback TextField renders

---

## Phase 8: Logging

**Purpose**: Instrument observability events per plan.md §10.

- [ ] T027 [US1] Add ERROR log on `/me` fetch failure (non-401): endpoint, HTTP status, timestamp — not token or user PII
- [ ] T028 [P] [US2] Add WARN log on `supported-states` fetch failure: endpoint, HTTP status, timestamp — graceful degradation path taken
- [ ] T029 [P] Verify `httpServices` Axios interceptor logs requests taking > 2s — add duration logging to interceptor if not present (plan.md §10)

---

## Phase 9: Quality Gates

**Purpose**: Ensure all pre-commit checks pass.

- [ ] T030 Run `npm run type-check` — zero TypeScript errors; confirm removal of `/* eslint-disable */` and `expertTypeId?: any` resolves cleanly (plan.md §8)
- [ ] T031 [P] Run `npm run lint` — zero ESLint errors in `page.tsx`, `StatesDropdown.tsx`, `useSupportedStates.ts`, `referenceApi.ts`
- [ ] T032 [P] Run `npm run build` — production build succeeds; profile page and StatesDropdown included in bundle without errors

---

## Phase 10: Finalization

**Purpose**: Polish, cross-form audit, and branch readiness.

- [ ] T033 [US2] Complete address form audit — identify every form across the codebase with a free-text state field and replace with `<StatesDropdown />`; document any forms not yet wired as follow-up tasks
- [ ] T034 [P] [US1] Confirm dashboard navigation buttons in `OrgContextCard` construct URLs from `currentUser.organizationId` and `currentUser.siteId` (no user-supplied input in URL)
- [ ] T035 [P] [US2] Confirm `statesCache` module-level variable is not cleared on logout — it resets automatically on full page reload (plan.md §7)
- [ ] T036 [P] Confirm `src/app/profile/services/api.ts` re-export approach — if `src/app/organization/services/api.ts` `fetchCurrentUser` moves, only `profile/services/api.ts` import path needs updating (plan.md §11)

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: Start immediately — audit existing code
- **UI (Phase 2)**: Requires Phase 1 audit complete
- **Logic (Phase 3)**: Requires Phase 2 and Phase 4 service creation
- **API (Phase 4)**: Can run in parallel with Phase 2
- **Backend (Phase 5)**: Can run immediately — verification only
- **Security (Phase 6)**: Requires Phase 2 and Phase 3 complete
- **Testing (Phase 7)**: Requires Phase 2, 3, 4 complete
- **Logging (Phase 8)**: Requires Phase 3 and Phase 4 complete
- **Quality Gates (Phase 9)**: Requires all prior phases
- **Finalization (Phase 10)**: Requires Phase 9 passing

## Parallel Opportunities

```bash
# Phase 2 — can build in parallel:
T005: Fix profile page dead state
T006: Add OrgContextCard
T007: Create StatesDropdown

# Phase 3 — can build in parallel:
T008: Remove eslint-disable
T010: Add organizationName to User type
T011: Create useSupportedStates hook
T012: Add SupportedState type
```

## Implementation Strategy

### MVP (User Story 1 First)
1. Phase 1: Audit profile page
2. Phase 4: Create profile service API
3. Phase 3: Fix dead state, ESLint, any types, add OrgContextCard
4. Validate: any role profile page shows correct data
5. Phase 2 + 3 + 4: StatesDropdown + useSupportedStates + referenceApi
6. Phase 10: Address form audit and wiring

## Total Task Count: 36
- US1 tasks: 18 | US2 tasks: 15 | Cross-cutting: 3
