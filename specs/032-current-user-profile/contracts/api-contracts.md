# API Contracts: Current User Profile & Reference Data

**Feature**: 032-current-user-profile | **Date**: 2026-05-14

All responses follow the standard Lawsome envelope (constitution VIII).

---

## Contract 1: Get Current User Profile

### Request

```
GET /api/v1/users/me
Authorization: Bearer <keycloak-jwt>
```

### Success Response — 200 OK

```json
{
  "success": true,
  "data": {
    "id": 42,
    "fullName": "Priya Sharma",
    "emailId": "priya.sharma@example.com",
    "phoneNumber": "9876543210",
    "gender": "Female",
    "roles": ["SiteClerk"],
    "organizationId": 10,
    "organizationName": "Sharma Legal Associates",
    "siteId": 3,
    "siteName": "Mumbai Branch",
    "registeredDate": "2025-08-15T00:00:00Z",
    "lastLoginDate": "2026-05-13T10:30:00Z",
    "enabled": true
  },
  "message": null
}
```

### Error Responses

**401 Unauthorized** — token missing or expired

```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": []
}
```

**404 Not Found** — session user not found in database (unexpected edge case)

```json
{
  "success": false,
  "message": "User not found",
  "errors": []
}
```

### Frontend handling

| Status | Action |
|---|---|
| 200 | Render profile card with `data` fields |
| 401 | Keycloak refresh attempted; on persistent 401 → force logout |
| 404 | Set `error = true` → render "contact support" message |
| 5xx | Set `error = true` → render "contact support" message |

### Existing implementation

`fetchCurrentUser()` in [src/app/organization/services/api.ts](../../../../src/app/organization/services/api.ts) at line 1060. No changes needed to the service function — changes are in the profile page consumer.

---

## Contract 2: Get Supported States

### Request

```
GET /api/v1/reference/supported-states
Authorization: Bearer <keycloak-jwt>
```

> **Note**: Endpoint path must be confirmed with backend team before implementation. See [research.md](../research.md).

### Success Response — 200 OK

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Andhra Pradesh", "code": "AP" },
    { "id": 2, "name": "Arunachal Pradesh", "code": "AR" },
    { "id": 3, "name": "Assam", "code": "AS" },
    { "id": 4, "name": "Bihar", "code": "BR" },
    { "id": 5, "name": "Chhattisgarh", "code": "CG" },
    { "id": 6, "name": "Goa", "code": "GA" },
    { "id": 7, "name": "Gujarat", "code": "GJ" },
    { "id": 8, "name": "Haryana", "code": "HR" },
    { "id": 9, "name": "Himachal Pradesh", "code": "HP" },
    { "id": 10, "name": "Jharkhand", "code": "JH" },
    { "id": 11, "name": "Karnataka", "code": "KA" },
    { "id": 12, "name": "Kerala", "code": "KL" },
    { "id": 13, "name": "Madhya Pradesh", "code": "MP" },
    { "id": 14, "name": "Maharashtra", "code": "MH" },
    { "id": 15, "name": "Manipur", "code": "MN" },
    { "id": 16, "name": "Meghalaya", "code": "ML" },
    { "id": 17, "name": "Mizoram", "code": "MZ" },
    { "id": 18, "name": "Nagaland", "code": "NL" },
    { "id": 19, "name": "Odisha", "code": "OD" },
    { "id": 20, "name": "Punjab", "code": "PB" },
    { "id": 21, "name": "Rajasthan", "code": "RJ" },
    { "id": 22, "name": "Sikkim", "code": "SK" },
    { "id": 23, "name": "Tamil Nadu", "code": "TN" },
    { "id": 24, "name": "Telangana", "code": "TS" },
    { "id": 25, "name": "Tripura", "code": "TR" },
    { "id": 26, "name": "Uttar Pradesh", "code": "UP" },
    { "id": 27, "name": "Uttarakhand", "code": "UK" },
    { "id": 28, "name": "West Bengal", "code": "WB" },
    { "id": 29, "name": "Delhi", "code": "DL" }
  ],
  "message": null
}
```

### Error Responses

**401 Unauthorized**

```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": []
}
```

**500 Internal Server Error**

```json
{
  "success": false,
  "message": "An error occurred",
  "errors": []
}
```

### Frontend handling

| Status | Action |
|---|---|
| 200 | Cache `data` array in module var; render dropdown options |
| 401 | Keycloak refresh attempted; on persistent 401 → force logout |
| 4xx / 5xx | Return `[]` from hook; form renders text input fallback; `showError()` toast |

### New implementation

`fetchSupportedStates()` in [src/services/referenceApi.ts](../../../../src/services/referenceApi.ts) (NEW file). Used exclusively via the `useSupportedStates` hook.

---

## Contract Versioning Notes

- Breaking changes to either endpoint path or response shape must be reflected in the frontend service files in the same PR (constitution V).
- The `code` field on `SupportedState` is treated as optional in the TypeScript interface (`code?: string`) to handle the case where the backend does not return it.
- `organizationName` on the `User` response is treated as optional (`organizationName?: string`) — if absent, the profile card omits the org name display.
