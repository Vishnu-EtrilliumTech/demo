# API Contracts: Case Task Management

**Branch**: `007-case-task-management` | **Base URL**: `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}`

All endpoints require `Authorization: Bearer <token>`. Responses follow the standard envelope:
`{ success, data, message }` for single items; `{ data: [] }` for collections.

---

## Task Endpoints

### GET `/tasks`
List all tasks for a case.

**Response 200**:
```json
{
  "data": [
    {
      "id": 1,
      "caseId": 42,
      "title": "Draft motion",
      "description": "Optional notes",
      "assignedToId": 7,
      "assignedToName": "Jane Doe",
      "dueDate": "2026-06-01T00:00:00Z",
      "status": "Open",
      "createdAt": "2026-05-15T10:00:00Z"
    }
  ]
}
```
**Error codes**: 401, 403

---

### POST `/tasks`
Create a new task.

**Request body**:
```json
{
  "title": "Draft motion",
  "description": "Optional",
  "assignedToId": 7,
  "dueDate": "2026-06-01T00:00:00Z",
  "status": "Open"
}
```
**Response 201**: `{ "data": CaseTask }`
**Error codes**: 400 (validation), 401, 403

---

### PUT `/tasks/{taskId}`
Update an existing task.

**Request body**:
```json
{
  "title": "Draft motion (revised)",
  "description": "Updated notes",
  "assignedToId": 8,
  "dueDate": "2026-06-10T00:00:00Z",
  "status": "InProgress"
}
```
**Response 200**: `{ "data": CaseTask }`
**Error codes**: 400, 401, 403, 404

---

### DELETE `/tasks/{taskId}`
Delete a task.

**Response 204**: No content
**Error codes**: 401, 403, 404

---

### GET `/tasks/assignee/{assigneeId}`
Get tasks filtered by assignee.

**Response 200**: Same shape as `GET /tasks` but filtered.
**Error codes**: 401, 403

---

## Task Document Endpoints

**Base path**: `/tasks/{taskId}/documents`

### GET `/tasks/{taskId}/documents`
List documents for a task (no file content in list).

**Response 200**:
```json
{
  "data": [
    { "id": 1, "name": "brief.pdf", "remarks": null, "taskId": 3, "createdDate": "2026-05-15T10:00:00Z", "createdById": 7 }
  ]
}
```

---

### POST `/tasks/{taskId}/documents`
Upload a document to a task.

**Request body** (multipart or JSON with base64):
```json
{ "name": "brief.pdf", "content": "<base64>", "remarks": "First draft" }
```
**Response 201**: `{ "data": TaskDocument }`
**Error codes**: 400 (empty file), 401, 403, 404

---

### GET `/tasks/{taskId}/documents/{documentId}`
Download a single document (includes `content` field).

**Response 200**: `{ "data": TaskDocument }` with `content` populated.
**Error codes**: 401, 403, 404

---

### DELETE `/tasks/{taskId}/documents/{documentId}`
Delete a task document.

**Response 204**
**Error codes**: 401, 403, 404

---

### PUT `/tasks/{taskId}/documents/{documentId}/remarks`
Update task document remarks only.

**Request body**: `{ "remarks": "Updated notes" }`
**Response 200**: `{ "data": TaskDocument }`
**Error codes**: 400, 401, 403, 404
