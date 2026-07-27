# Data Model: Case Document Management

**Branch**: `008-case-document-management` | **Source**: `src/app/organization/types/caseindex.ts`

---

## Entities

### CaseDocument

| Field | Type | Notes |
|-------|------|-------|
| `id` | `number` | Backend-assigned |
| `name` | `string` | Filename |
| `caseId` | `number` | Parent case |
| `remarks` | `string \| undefined` | Optional notes |
| `createdDate` | `string` | ISO 8601 — upload date |
| `createdById` | `number` | Uploader user ID |
| `content` | `string \| number[] \| {data: number[]} \| undefined` | Absent in list view; populated only by `GET /documents/{id}` |
| `uploadedByName` | `string \| undefined` | UI-derived from `createdById`; not from API |

### TaskDocument

| Field | Type | Notes |
|-------|------|-------|
| `id` | `number` | Backend-assigned |
| `name` | `string` | Filename |
| `taskId` | `number` | Parent task |
| `remarks` | `string \| undefined` | Can be updated independently |
| `createdDate` | `string` | ISO 8601 |
| `createdById` | `number` | Uploader user ID |
| `content` | `string \| number[] \| {data: number[]} \| undefined` | Absent in list; populated by single-doc fetch |

---

## Create/Update Shapes

### AddCaseDocumentRequest

```typescript
{
  name: string;       // filename; required
  content: string;    // base64-encoded file bytes; required; size > 0
  remarks?: string;   // optional
}
```

### AddTaskDocumentRequest

```typescript
{
  name: string;
  content: string;    // base64-encoded
  remarks?: string;
}
```

### UpdateTaskDocumentRemarksRequest

```typescript
{
  remarks: string;
}
```

---

## Document Level Boundary

| Level | Managed by | Tab |
|-------|-----------|-----|
| Case-level | `useCaseDocuments` | Documents tab |
| Task-level | `useCaseTasks` | Task detail expansion (within Tasks tab) |

---

## Validation Rules

| Field | Rule |
|-------|------|
| `name` | Required; non-empty string |
| `content` | Required; `file.size > 0` checked client-side before encoding |
| `remarks` | Optional; max length enforced by backend |

---

## Actor Permissions

| Action | OrgAdmin / SiteAdmin / SiteClerk / SrExpert / Expert | SiteCaseClient | OrgClerk |
|--------|------------------------------------------------------|----------------|----------|
| Upload case doc | Yes | Yes | No |
| View case doc list | Yes | Yes | No |
| Download case doc | Yes | Yes | No |
| Delete case doc | Yes | No | No |
| Upload task doc | Yes | — (via TasksTab) | No |
| Update task doc remarks | Yes | No | No |
