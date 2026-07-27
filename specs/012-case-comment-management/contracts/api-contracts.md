# API Contracts: Case Comment Management

**Spec**: [spec.md](../spec.md) | **Plan**: [plan.md](../plan.md)

Base URL prefix: `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}`

---

## Case Comments

### GET /comments
Fetch all comments for a case (top-level with nested replies).

**Auth**: Bearer token — all roles except OrganizationClerk  
**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "text": "string",
      "authorId": "string",
      "authorName": "string",
      "createdAt": "2026-05-15T10:00:00Z",
      "isEdited": false,
      "replies": [
        {
          "id": 2,
          "text": "string",
          "authorId": "string",
          "authorName": "string",
          "createdAt": "2026-05-15T10:05:00Z",
          "isEdited": false,
          "parentCommentId": 1
        }
      ]
    }
  ],
  "message": null
}
```
**Errors**: 401 (unauthenticated), 403 (OrganizationClerk or unauthorized role)

---

### POST /comments
Add a new top-level comment.

**Auth**: Bearer token — all authorized roles  
**Request**:
```json
{ "text": "string (required, non-empty)" }
```
**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": 3,
    "text": "string",
    "authorId": "string",
    "authorName": "string",
    "createdAt": "2026-05-15T10:10:00Z",
    "isEdited": false,
    "replies": []
  },
  "message": null
}
```
**Errors**: 400 (empty text), 401, 403

---

### POST /comments/{commentId}/replies
Add a reply to an existing comment (one level deep).

**Auth**: Bearer token — all authorized roles  
**Request**:
```json
{ "text": "string (required, non-empty)" }
```
**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": 4,
    "text": "string",
    "authorId": "string",
    "authorName": "string",
    "createdAt": "2026-05-15T10:15:00Z",
    "isEdited": false,
    "parentCommentId": 3
  },
  "message": null
}
```
**Errors**: 400 (empty text), 401, 403, 404 (parent comment not found)

---

### PUT /comments/{commentId}
Edit a comment. Author-only.

**Auth**: Bearer token — comment author only  
**Request**:
```json
{ "text": "string (required, non-empty)" }
```
**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "text": "Updated text",
    "authorId": "string",
    "authorName": "string",
    "createdAt": "2026-05-15T10:00:00Z",
    "isEdited": true,
    "replies": []
  },
  "message": null
}
```
**Errors**: 400 (empty text), 401, 403 (not author), 404

---

### DELETE /comments/{commentId}
Delete a comment and all its replies. Author-only.

**Auth**: Bearer token — comment author only  
**Response**: 204 No Content  
**Errors**: 401, 403 (not author), 404

---

## Task Comments

Base URL prefix for task comments: `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/tasks/{taskId}`

### GET /comments
Fetch all comments for a task.  
Same response shape as case comments. **Errors**: 401, 403, 404 (task not found)

### POST /comments
Add a comment to a task. Same request/response as case comment POST.

### POST /comments/{commentId}/replies
Add a reply to a task comment. Same shape as case comment reply POST.

### PUT /comments/{commentId}
Edit a task comment. Author-only. Same shape.

### DELETE /comments/{commentId}
Delete a task comment and replies. Author-only. 204.

---

## TypeScript Types

```typescript
// src/app/organization/types/caseindex.ts (existing — verify these fields exist)

export interface CaseComment {
  id: number;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  isEdited: boolean;
  replies: CaseComment[];
  parentCommentId?: number;
}

export interface AddCaseCommentRequest {
  text: string;
}

export interface AddCaseCommentReplyRequest {
  text: string;
}

export interface UpdateCaseCommentRequest {
  text: string;
}

export interface CaseTaskComment {
  id: number;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  isEdited: boolean;
  parentCommentId?: number;
}
```
