# Data Model: Case Task Management

**Branch**: `007-case-task-management` | **Source**: `src/app/organization/types/caseindex.ts`

---

## Entities

### CaseTask

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `number` | Read-only | Backend-assigned |
| `caseId` | `number` | Read-only | Parent case |
| `title` | `string` | Yes | Max 200 characters |
| `description` | `string \| undefined` | No | Optional notes |
| `assignedToId` | `number \| undefined` | Yes on create | Site user ID |
| `assignedToName` | `string \| undefined` | Read-only | Derived from assignedToId |
| `dueDate` | `string \| undefined` | Yes on create | ISO 8601 datetime |
| `status` | `TaskStatus` | Yes | Enum — see below |
| `createdAt` | `string` | Read-only | ISO 8601 |
| `updatedAt` | `string \| undefined` | Read-only | ISO 8601 |

### TaskStatus Enum

| Value | Display Label | Notes |
|-------|--------------|-------|
| `Open` | Open | Default |
| `InProgress` | In Progress | |
| `OnHold` | On Hold | |
| `Blocked` | Blocked | Extension beyond spec minimum |
| `Closed` | Done / Closed | Maps to spec "Done" |

### TaskDocument

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `number` | Read-only | |
| `name` | `string` | Yes | Filename |
| `taskId` | `number` | Read-only | Parent task |
| `remarks` | `string \| undefined` | No | Optional notes |
| `createdDate` | `string` | Read-only | ISO 8601 |
| `createdById` | `number` | Read-only | Uploader user ID |
| `content` | `string \| number[] \| {data: number[]} \| undefined` | Download only | Base64 or byte array; absent in list view |

---

## Create/Update Shapes

### AddCaseTaskRequest

```typescript
{
  title: string;           // required
  description?: string;   // optional
  assignedToId?: number;  // required in practice
  dueDate?: string;       // ISO 8601; past dates allowed
  status: TaskStatus;     // default: Open
}
```

### UpdateCaseTaskRequest

```typescript
{
  title: string;
  description?: string;
  assignedToId: number;
  dueDate: string;
  status: TaskStatus;
}
```

### AddTaskDocumentRequest

```typescript
{
  name: string;       // filename
  content: string;    // base64-encoded file content
  remarks?: string;   // optional
}
```

### UpdateTaskDocumentRemarksRequest

```typescript
{
  remarks: string;
}
```

---

## State Transitions

```
Task lifecycle:
  Open → InProgress → OnHold ↔ Blocked → Closed
  Any status → any other status (no enforced transition rules on frontend)
```

---

## Validation Rules

| Field | Rule |
|-------|------|
| `title` | Required; non-empty string |
| `assignedToId` | Required; must be a valid site user ID (> 0) |
| `dueDate` | Required; past dates accepted |
| `status` | Required; must be a `TaskStatus` enum value |
| `name` (document) | Required; non-empty |
| `content` (document) | Required; file size > 0 bytes (validated client-side before upload) |
