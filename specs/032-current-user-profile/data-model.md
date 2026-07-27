# Data Model: Current User Profile & Reference Data

**Feature**: 032-current-user-profile | **Date**: 2026-05-14

---

## Entities

### 1. User (Current Authenticated User)

**Source**: `GET /api/v1/users/me`
**TypeScript location**: `src/app/organization/types/index.ts` — `User` interface (EXISTING, verify fields below)

| Field | Type | Nullable | Source | Notes |
|---|---|---|---|---|
| `id` | `number` | No | `/me` response | Used for navigation links |
| `fullName` | `string` | No | `/me` response | Displayed on profile card |
| `emailId` | `string` | No | `/me` response | Displayed on profile card |
| `phoneNumber` | `string` | No | `/me` response | Displayed on profile card |
| `gender` | `string` | Yes | `/me` response | `"Male"` / `"Female"` / `"Transgender"` (displayed as `"Non-Binary"`) |
| `roles` | `string[]` | No | `/me` response | Determines role-gated sections |
| `organizationId` | `number` | Yes | `/me` response | Used for org context card navigation |
| `organizationName` | `string` | Yes | `/me` response | **Verify** — may not be in response; conditional display |
| `siteId` | `number` | Yes | `/me` response | Used for site context card navigation |
| `siteName` | `string` | Yes | `/me` response | Displayed in org context card |
| `registeredDate` | `string` | No | `/me` response | ISO date string, formatted via `formatDisplayDate()` |
| `lastLoginDate` | `string` | Yes | `/me` response | Not displayed on current profile page |
| `enabled` | `boolean` | No | `/me` response | Rendered as Active/Inactive badge |

**Validation rules**: Read-only — no client-side mutation. No form validation required.

**State transitions**: None — profile is view-only per spec (updates are out of scope per spec section "Out of Scope").

---

### 2. SupportedState (Indian State Reference Data)

**Source**: `GET /api/v1/reference/supported-states`
**TypeScript location**: `src/app/organization/types/index.ts` — add `SupportedState` interface (NEW)

| Field | Type | Nullable | Source | Notes |
|---|---|---|---|---|
| `id` | `number` | No | API response | Primary key |
| `name` | `string` | No | API response | Display label in dropdown (e.g., `"Maharashtra"`) |
| `code` | `string` | Yes | API response | Short code (e.g., `"MH"`) — may or may not be returned; confirm with backend |

**Validation rules**:
- In consuming forms, `state` field is required (address forms).
- Value must be one of the returned `SupportedState.name` values — enforced by the dropdown itself (no free-text input when states load successfully).

**State transitions**: None — states are pre-seeded, static, and read-only from the UI perspective.

**Caching**: Cached at module-level in `useSupportedStates` hook. No TTL — treated as immutable for the session lifetime.

---

## TypeScript Type Additions

### Add to `src/app/organization/types/index.ts`

```typescript
export interface SupportedState {
  id: number;
  name: string;
  code?: string;
}
```

### Verify / extend the existing `User` interface

The current `User` type must be confirmed to include all fields needed by the profile page. If `organizationName` is not present, add it as optional:

```typescript
// Additions to existing User interface (if not already present):
organizationName?: string;
```

---

## Relationships

```
User (currentUser)
  ├── organizationId ──► [Out of scope: Organization entity — fetched separately if needed]
  └── siteId ──────────► [Out of scope: Site entity — siteName already on User]

SupportedState
  └── [No relationships — pure reference data]
```

---

## Data Flow Summary

```
Session start
  └── Keycloak login → token stored in localStorage

Profile page load
  └── fetchCurrentUser() → User → rendered in profile card

Address form render (any form with State field)
  └── useSupportedStates()
        ├── Cache hit (after first load) → SupportedState[] immediately
        └── Cache miss → fetchSupportedStates() → SupportedState[] → cached → rendered in dropdown
```
