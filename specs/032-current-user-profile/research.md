# Research: Current User Profile & Reference Data

**Feature**: 032-current-user-profile | **Date**: 2026-05-14

---

## Resolved Clarifications

### 1. Supported States Endpoint Path

**Decision**: Use `GET /api/v1/reference/supported-states`

**Rationale**: The backend follows RESTful conventions. Reference/lookup data lives under `/api/v1/reference/`. The entity name `supported-states` matches the spec's "Supported State" entity name in kebab-case plural form. This path must be confirmed with the backend team before implementation begins.

**Alternatives considered**:
- `/api/v1/states` — too flat; doesn't signal this is static reference data
- `/api/v1/lookup/states` — `lookup` is less standard than `reference`
- `/api/v1/users/reference/states` — incorrectly scoped under users

**Action required**: Confirm exact path with backend team. If the path differs, update `src/services/referenceApi.ts` before wiring the hook.

---

### 2. User Type Fields from `/me` Response

**Decision**: The existing `User` type in `src/app/organization/types/index.ts` covers most profile fields. Two fields need verification:

- `organizationName?: string` — may or may not be returned in `/me`. The `Organization` type has it, but `User` type may only have `organizationId`.
- `siteName?: string` — already present on the `User` type per codebase exploration.
- `phoneNumber` — present on `User` type.

**Rationale**: The profile page currently displays `currentUser.fullName`, `currentUser.emailId`, `currentUser.phoneNumber`, `currentUser.gender`, `currentUser.roles`, `currentUser.registeredDate`, and `currentUser.enabled`. These all exist on the type. The "My Organization" section references `site.organizationId` from a separate `userSites` array that is never populated — this is the dead state bug.

**Action required**: Either (a) add a `GET /api/v1/organizations/{orgId}` call to get org name, or (b) accept that the profile card shows the org context using only `organizationId + siteName` already on the User type. Option (b) is simpler and avoids a second API call.

---

### 3. Dead `userSites` State

**Decision**: Remove the `userSites` state and the dependent "My Organization" card. Replace with inline org context derived from `currentUser.organizationId`, `currentUser.siteId`, and `currentUser.siteName` — all already on the `User` type.

**Rationale**: `userSites` is declared at line 47 of `src/app/profile/page.tsx` but never set. The "My Organization" card at line 200 therefore never renders (`userSites.length > 0` is always false). Fixing this properly would require a `fetchOrganizationUserSites()` call, but that adds a second blocking API call on page load. The User type already carries enough org/site context to render the basic org card without a second call.

**Alternative rejected**: Fetch sites via `fetchOrganizationUserSites()` — adds latency, complexity, and a second network dependency to the profile page.

---

### 4. Caching Strategy for Supported States

**Decision**: Module-level variable cache (`let statesCache: SupportedState[] | null = null`) in `useSupportedStates.ts`.

**Rationale**: States are truly static reference data. They don't change per user, per session, or per request. A module-level cache survives component unmount/remount cycles without requiring React Context, Redux, or any external cache. This satisfies SC-002 (< 1s after first load) for all subsequent form renders within a page session.

**Alternatives considered**:
- `sessionStorage` — more persistent than module var (survives navigation), but adds serialization overhead and is unnecessary for static data.
- React Context + Provider — over-engineered for data that never changes or syncs.
- Redux slice — appropriate for user-specific data that needs PURGE on logout. States are not user-specific.
- React Query / SWR — not in the current tech stack; introducing it just for this would be premature.

---

### 5. ESLint Disable and `any` Types in Profile Page

**Decision**: Remove `/* eslint-disable */` from `src/app/profile/page.tsx` and fix the underlying issues.

**Root cause**: The inline `UserData` interface has `expertTypeId?: any`. This interface was created to bridge the `User` type to the legacy `ProfileContent` component props. Now that the profile page primarily renders `currentUser` (type `User`) and only falls back to `ProfileContent` for legacy expert data, the `UserData` interface can be simplified to replace `any` with `number | null`.

**Action**: Replace `expertTypeId?: any` with `expertTypeId?: number | null` in the `UserData` interface, then remove `/* eslint-disable */`.

---

### 6. StatesDropdown — Shared Component or Co-located

**Decision**: Create `src/components/StatesDropdown.tsx` as a shared component.

**Rationale**: At minimum three distinct route modules require a state dropdown: (1) site creation form, (2) expert address form, (3) client address form. Constitution VI requires that UI components reused in 2+ distinct routes live in `src/components/`. The threshold is met.

**Component interface**: Thin wrapper around MUI `<Autocomplete>` (preferred for searchability with 29–36 states) backed by `useSupportedStates()`. Falls back to `<TextField>` when the hook returns an error.

---

### 7. Address Form Audit — Hardcoded States

**Finding**: No existing usage of `useSupportedStates` found (hook does not exist yet). No grep matches for hardcoded Indian state names (e.g., `"Maharashtra"`, `"Delhi"`) found in the API service files. The state field in address forms may currently be a free-text input — confirming this satisfies SC-003 (all forms must use the dropdown after this feature lands).

**Action**: Before wiring `StatesDropdown`, audit all forms with a `state` field to identify free-text inputs. Candidate forms: site creation, site editing, expert address management, client address management.
