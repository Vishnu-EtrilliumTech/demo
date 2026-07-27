# API Contracts: Case Hearing Management

**Branch**: `009-case-hearing-management`

---

## Case-Level Hearing Endpoints

**Base URL**: `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}`

All endpoints require `Authorization: Bearer <token>`.

### GET `/hearings`
List all hearings for a case (past and future).

**Response 200**:
```json
{
  "data": [
    {
      "id": 1,
      "caseId": 42,
      "assignedToId": 7,
      "assignedToName": "Jane Doe",
      "hearingDateTime": "2026-07-15T10:30:00+05:30",
      "status": "Scheduled",
      "where": "District Court, Mumbai",
      "notes": "Bring affidavit",
      "createdAt": "2026-05-15T10:00:00Z"
    }
  ]
}
```
**Error codes**: 401, 403

---

### POST `/hearings`
Schedule a new hearing.

**Request body**:
```json
{
  "assignedToId": 7,
  "hearingDateTime": "2026-07-15T10:30:00+05:30",
  "status": "Scheduled",
  "where": "District Court, Mumbai",
  "notes": "Bring affidavit"
}
```
**Response 201**: `{ "data": CaseHearing }`
**Error codes**: 400, 401, 403

---

### GET `/hearings/{hearingId}`
Fetch a single hearing.

**Response 200**: `{ "data": CaseHearing }`
**Error codes**: 401, 403, 404

---

### PUT `/hearings/{hearingId}`
Update a hearing.

**Request body**: Same as POST.
**Response 200**: `{ "data": CaseHearing }`
**Error codes**: 400, 401, 403, 404

---

### DELETE `/hearings/{hearingId}`
Delete a hearing.

**Response 204**: No content
**Error codes**: 401, 403, 404

---

## Site-Level Upcoming Hearings Endpoint

**Base URL**: `/api/v1/organizations/{orgId}/sites/{siteId}`

### GET `/hearings`
List all future hearings across all cases in the site, ordered by date ascending.

**Response 200**:
```json
[
  {
    "id": 1,
    "caseId": 42,
    "caseName": "Smith vs Jones",
    "assignedToId": 7,
    "assignedToName": "Jane Doe",
    "hearingDateTime": "2026-07-15T10:30:00+05:30",
    "status": "Scheduled",
    "where": "District Court, Mumbai",
    "notes": null
  }
]
```
> Note: This endpoint is implemented in `api.ts` (`fetchSiteHearings`), not `caseapi.ts`.

**Error codes**: 401, 403
