# API Contracts: Case Client Management

**Branch**: `010-case-client-management` | **Base URL**: `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}`

All case client endpoints require `Authorization: Bearer <token>`.

---

## Case Client CRUD Endpoints

### GET `/caseclients`
List all clients for a case.

**Response 200**:
```json
[
  {
    "data": {
      "id": 1,
      "caseId": 42,
      "fullName": "Rahul Sharma",
      "emailId": "rahul@example.com",
      "phoneNumber": 9876543210,
      "gender": "Male",
      "remarks": null,
      "invitedOnDate": null,
      "acceptedDate": null,
      "clientId": null,
      "invitationId": null,
      "invitationExpiryDate": null,
      "merged": false
    }
  }
]
```
**Error codes**: 401, 403, 404 (returns `[]` on 404)

---

### POST `/caseclients`
Add a client record to a case.

**Request body**:
```json
{
  "fullName": "Rahul Sharma",
  "emailId": "rahul@example.com",
  "phoneNumber": 9876543210,
  "gender": "Male",
  "remarks": null
}
```
**Response 201**: `{ "data": CaseClient }`
**Error codes**: 400 (validation), 401, 403

---

### GET `/caseclients/{clientId}`
Fetch a single client record.

**Response 200**: `{ "data": CaseClient }`
**Error codes**: 401, 403, 404

---

### PUT `/caseclients/{clientId}`
Update a client record.

**Request body**: Same shape as POST.
**Response 200**: `{ "data": CaseClient }`
**Error codes**: 400, 401, 403, 404

---

### DELETE `/caseclients/{clientId}`
Delete a client record.

**Response 204**: No content
**Error codes**: 401, 403, 404

---

## Invitation Endpoints

### POST `/caseclients/{clientId}/invite`
Send an invitation to the client.

**Response 200**:
```json
{
  "invitationId": "uuid-string",
  "isNewClient": true,
  "clientId": null
}
```
**Error Behavior**:
- Email already accepted → 400: `"This client has already accepted their invitation."`
- No email on record → 400: `"An email address is required to send an invitation."`
- Email send failure → 500: no invitation state saved

**Error codes**: 400, 401, 403, 404, 500

---

### POST `/caseclients/{clientId}/invitation/{invitationId}/accept`
Accept an invitation (called from the public acceptance page).

**Request body**:
```json
{
  "clientId": null,
  "remarks": null
}
```
**Response 200**:
```json
{ "clientId": 99 }
```
**Error Behavior**:
- Expired invitation → 400: `"This invitation has expired."`
- Already accepted → 400: `"This invitation has already been accepted."`

**Error codes**: 400, 404

> Note: This endpoint is called from the public invitation acceptance page. The backend must not require Bearer auth for this specific endpoint, or the page must handle the auth redirect before calling.
