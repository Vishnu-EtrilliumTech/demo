# API Contracts: Case Document Management

**Branch**: `008-case-document-management` | **Base URL**: `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}`

All endpoints require `Authorization: Bearer <token>`.

---

## Case Document Endpoints

### GET `/documents`
List all documents for a case. Does NOT include file content.

**Response 200**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "contract.pdf",
      "caseId": 42,
      "remarks": "Signed copy",
      "createdDate": "2026-05-15T10:00:00Z",
      "createdById": 7
    }
  ]
}
```
**Error codes**: 401, 403

---

### POST `/documents`
Upload a document to a case.

**Request body**:
```json
{
  "name": "contract.pdf",
  "content": "<base64-encoded bytes>",
  "remarks": "Signed copy"
}
```
**Response 201**:
```json
{ "id": 1 }
```
> Note: The create response returns only the document `id` (not the full `CaseDocument` shape).

**Error codes**: 400 (empty file, missing name), 401, 403

---

### GET `/documents/{documentId}`
Download a single document. Includes `content` field (byte array).

**Response 200**:
```json
{
  "id": 1,
  "name": "contract.pdf",
  "caseId": 42,
  "remarks": "Signed copy",
  "createdDate": "2026-05-15T10:00:00Z",
  "createdById": 7,
  "content": [37, 80, 68, 70]
}
```
**Error codes**: 401, 403, 404

---

### DELETE `/documents/{documentId}`
Delete a case document.

**Response 204**: No content
**Error codes**: 401, 403, 404

---

## Task Document Endpoints

Defined in [../007-case-task-management/contracts/api-contracts.md](../../007-case-task-management/contracts/api-contracts.md).

These endpoints are consumed by the task detail section within the Tasks tab, not the Documents tab.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/tasks/{taskId}/documents` | GET | List task documents |
| `/tasks/{taskId}/documents` | POST | Upload task document |
| `/tasks/{taskId}/documents/{docId}` | GET | Download task document |
| `/tasks/{taskId}/documents/{docId}` | DELETE | Delete task document |
| `/tasks/{taskId}/documents/{docId}/remarks` | PUT | Update task document remarks |
