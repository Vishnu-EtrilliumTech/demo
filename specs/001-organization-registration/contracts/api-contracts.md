# API Contracts: Organization Registration (001)

## Endpoint 1: Register Organization

### Request

```
POST /api/v1/organizations
Authorization: Bearer <keycloak_access_token>
Content-Type: application/json
```

**Body**:
```json
{
  "name": "Sharma & Associates Law Firm",
  "description": "A full-service law firm specializing in corporate and criminal law.",
  "phoneNumber": "9876543210",
  "emailId": "contact@sharmalaw.in",
  "segments": ["Legal", "Insurance"],
  "administratorName": "Rajesh Sharma",
  "administratorPhoneNumber": "9876543211",
  "administratorGender": "Male"
}
```

**Field Notes**:
- `name`: string, 1–100 chars, required
- `description`: string, 0–500 chars, empty string acceptable
- `phoneNumber`: string, exactly 10 digits starting with 6–9
- `emailId`: string, valid email format
- `segments`: string array, min 1 element, values from `['Legal', 'Insurance']`
- `administratorName`: string, 1–100 chars
- `administratorPhoneNumber`: string, exactly 10 digits starting with 6–9
- `administratorGender`: string enum, one of `'Male'`, `'Female'`, `'Transgender'`

---

### Success Response — 201 Created

```json
{
  "data": {
    "id": 42,
    "name": "Sharma & Associates Law Firm",
    "description": "A full-service law firm specializing in corporate and criminal law.",
    "segments": ["Legal", "Insurance"],
    "phoneNumber": 9876543210,
    "emailId": "contact@sharmalaw.in",
    "createdDate": "2026-05-14T10:30:00Z",
    "updatedDate": "2026-05-14T10:30:00Z",
    "enabled": true,
    "currentUser": {
      "id": 101,
      "fullName": "Rajesh Sharma",
      "emailId": "rajesh@sharmalaw.in",
      "enabled": true,
      "roles": ["OrganizationAdmin"],
      "registeredDate": "2026-05-14T10:30:00Z",
      "lastLoginDate": "2026-05-14T10:30:00Z",
      "phoneNumber": 9876543211
    }
  },
  "success": true,
  "message": null,
  "errors": []
}
```

**Frontend Action**: Extract `data.id` → `router.push('/organization/${data.id}')` → `showSuccess('Organization registered successfully!')`.

---

### Error Response — 400 Bad Request (Validation Failure)

```json
{
  "data": null,
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Organization name is required.",
    "Phone number must be a valid 10-digit number."
  ]
}
```

**Frontend Action**: Join `errors` array → `showError(errors.join(' '))`. If single error maps to a field (e.g., duplicate email), also call `setFieldError('orgEmail', message)`.

---

### Error Response — 400 Bad Request (Duplicate Email)

```json
{
  "data": null,
  "success": false,
  "message": "An organization with this contact email already exists.",
  "errors": ["An organization with this contact email already exists."]
}
```

**Frontend Action**: `showError('Unable to register the organization. Please try again or contact support.')` (do not expose internal message verbatim per spec edge case).

---

### Error Response — 401 Unauthorized

```json
{
  "data": null,
  "success": false,
  "message": "Unauthorized",
  "errors": []
}
```

**Frontend Action**: Keycloak interceptor in `httpServices.ts` handles 401 by triggering token refresh. If refresh fails → logout.

---

### Error Response — 500 Internal Server Error

```json
{
  "data": null,
  "success": false,
  "message": "An unexpected error occurred.",
  "errors": []
}
```

**Frontend Action**: `showError('Unable to register the organization. Please try again or contact support.')`.

---

### Frontend Handling Table — Register Organization

| HTTP Status | Condition | Frontend Action |
|---|---|---|
| 201 | Organization created | Extract `data.id` → `router.push('/organization/[id]')` → `showSuccess(...)` |
| 400 | Validation errors in `errors[]` | `showError(errors.join(' '))` + `setFieldError` for known fields |
| 401 | Token expired | Keycloak refresh interceptor (automatic) |
| 403 | User already has org or forbidden | `showError('...')` → `router.push('/organization/[id]')` |
| 409 | Duplicate organization | `showError('Unable to register. Organization may already exist.')` |
| 500 | Server error | `showError('Unable to register the organization. Please try again or contact support.')` |
| Network error | Axios throws | `showError('Network error. Please check your connection and try again.')` |

---

## Endpoint 2: Check Existing Organization (Guard)

### Request

```
GET /api/v1/organizations/users/{email}
Authorization: Bearer <keycloak_access_token>
```

**Path Params**:
- `email`: URL-encoded email address of the authenticated user

**Example**:
```
GET /api/v1/organizations/users/rajesh%40sharmalaw.in
Authorization: Bearer eyJhbGc...
```

---

### Success Response — 200 OK (Org Found)

```json
{
  "data": {
    "id": 42,
    "name": "Sharma & Associates Law Firm",
    "emailId": "contact@sharmalaw.in",
    "segments": ["Legal"],
    "enabled": true
  },
  "success": true,
  "message": null,
  "errors": []
}
```

**Frontend Action**: Extract `data.id` → set `existingOrgId` in hook → page calls `router.push('/organization/${data.id}')` with `showInfo('You already have an organization.')`.

---

### Response — 404 Not Found (No Org)

```json
{
  "data": null,
  "success": false,
  "message": "No organization found for this user.",
  "errors": []
}
```

**Frontend Action**: `existingOrgId` remains `null` → render the registration form normally.

---

### Response — 403 Forbidden

```json
{
  "data": null,
  "success": false,
  "message": "Access denied.",
  "errors": []
}
```

**Frontend Action**: Treat as no-org found → render form (403 may mean user is a legal expert or client, not an org user).

---

### Frontend Handling Table — Check Existing Org

| HTTP Status | Condition | Frontend Action |
|---|---|---|
| 200 | Org found | Redirect to `/organization/[id]`, show info toast |
| 404 | No org for user | Render registration form |
| 403 | Access denied / non-org user | Render registration form (fall-through) |
| 401 | Token expired | Keycloak refresh interceptor |
| 500 | Server error | `console.error` + render form (non-blocking guard failure) |
| Network error | Axios throws | `console.error` + render form (non-blocking) |
