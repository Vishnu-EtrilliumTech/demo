# API Contracts: Client Management

**Spec**: [spec.md](../spec.md) | **Plan**: [plan.md](../plan.md)

Base URL: `/api/v1/clients`

---

## POST /api/v1/clients
Register a new platform client (self-registration or SystemAdmin).

**Auth**: Bearer token (AuthenticatedUser or SystemAdmin)  
**Request**:
```json
{
  "fullName": "string (required, max 100)",
  "emailId": "string (required, must match JWT claim for non-admin)",
  "phoneNumber": "string (required, 10-digit, starts 6–9)",
  "gender": "Male | Female | Transgender"
}
```
**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "string",
    "emailId": "string",
    "phoneNumber": "string",
    "gender": "Male",
    "createdAt": "2026-05-15T10:00:00Z"
  },
  "message": null
}
```
**Errors**:
- 400: Validation failure (empty name, invalid phone format, invalid gender)
- 401: Unauthenticated
- 403: Email does not match JWT claim (non-admin callers)
- 409: Email already registered as a client

---

## GET /api/v1/clients/me
Fetch the authenticated client's own profile.

**Auth**: Bearer token (Client role)  
**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "string",
    "emailId": "string",
    "phoneNumber": "string",
    "gender": "Male",
    "createdAt": "2026-05-15T10:00:00Z"
  },
  "message": null
}
```
**Errors**: 401, 403 (not a Client)

---

## GET /api/v1/clients
List all clients (SystemAdmin only).

**Auth**: Bearer token (SystemAdmin)  
**Query params**: `search` (optional, matches name/email), `page` (default 1), `pageSize` (default 20)  
**Response 200**:
```json
{
  "items": [
    {
      "id": 1,
      "fullName": "string",
      "emailId": "string",
      "phoneNumber": "string",
      "gender": "Male",
      "createdAt": "2026-05-15T10:00:00Z"
    }
  ],
  "totalCount": 100,
  "page": 1,
  "pageSize": 20
}
```
**Errors**: 401, 403 (non-admin)

---

## GET /api/v1/clients/{id}
Fetch a client by ID (SystemAdmin or the client themselves).

**Auth**: Bearer token (SystemAdmin or identity match)  
**Response 200**: Same shape as `GET /clients/me`  
**Errors**: 401, 403 (not owner or admin), 404

---

## PUT /api/v1/clients/{id}
Update a client's profile (own record or SystemAdmin).

**Auth**: Bearer token (client owns record or SystemAdmin)  
**Request**:
```json
{
  "fullName": "string (required, max 100)",
  "phoneNumber": "string (required, 10-digit, starts 6–9)",
  "gender": "Male | Female | Transgender"
}
```
Note: `emailId` is never updatable; omit from request body.  
**Response 200**: Updated `ClientProfile` object  
**Errors**: 400 (validation), 401, 403 (not owner or admin), 404

---

## DELETE /api/v1/clients/{id}
Permanently delete a client (SystemAdmin only).

**Auth**: Bearer token (SystemAdmin)  
**Response**: 204 No Content  
**Errors**: 401, 403, 404

---

## TypeScript Types

```typescript
// src/app/client/types/index.ts (NEW)

export interface ClientRegistrationRequest {
  fullName: string;
  emailId: string;
  phoneNumber: string;
  gender: 'Male' | 'Female' | 'Transgender';
}

export interface UpdateClientRequest {
  fullName: string;
  phoneNumber: string;
  gender: 'Male' | 'Female' | 'Transgender';
}

export interface ClientProfile {
  id: number;
  fullName: string;
  emailId: string;
  phoneNumber: string;
  gender: 'Male' | 'Female' | 'Transgender';
  createdAt: string;
}

export type ClientListItem = ClientProfile;
```

---

## Validation Rules (Frontend — `src/utils/validation.ts`)

| Field | Rule |
|-------|------|
| `fullName` | Required, max 100 chars |
| `emailId` | Pre-filled from session; read-only; must match JWT email claim |
| `phoneNumber` | Required, exactly 10 digits, first digit in `[6-9]` |
| `gender` | Required, one of: `Male`, `Female`, `Transgender` |
