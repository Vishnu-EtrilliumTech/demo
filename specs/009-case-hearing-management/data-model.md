# Data Model: Case Hearing Management

**Branch**: `009-case-hearing-management` | **Source**: `src/app/organization/types/caseindex.ts`

---

## Entities

### CaseHearing

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `number` | Read-only | Backend-assigned |
| `caseId` | `number` | Read-only | Parent case |
| `assignedToId` | `number` | Yes | Attendee — site user ID |
| `assignedToName` | `string \| undefined` | Read-only | Derived from `assignedToId` |
| `hearingDateTime` | `string` | Yes | ISO 8601 with timezone; past dates allowed |
| `status` | `HearingStatus` | Yes | See enum below |
| `where` | `string` | Yes | Location/court name |
| `notes` | `string \| undefined` | No | Optional |
| `createdAt` | `string` | Read-only | |
| `updatedAt` | `string \| undefined` | Read-only | |

### HearingStatus Enum

| Value | Display Label | Color |
|-------|--------------|-------|
| `Open` | Open | Green |
| `Scheduled` | Scheduled | Blue |
| `PlanningInProgress` | Planning In Progress | Amber |
| `Planned` | Planned | Light Blue |
| `OnHold` | On Hold | Orange |
| `Appeared` | Appeared | Teal |
| `NotAppeared` | Not Appeared | Red |
| `Completed` | Completed | Slate |

---

## Create/Update Shapes

### AddCaseHearingRequest

```typescript
{
  assignedToId: number;       // required; site user
  hearingDateTime: string;    // ISO 8601; past dates allowed
  status: HearingStatus;      // required
  where: string;              // location/court name; required
  notes?: string;             // optional
}
```

### UpdateCaseHearingRequest

```typescript
{
  assignedToId: number;
  hearingDateTime: string;
  status: HearingStatus;
  where: string;
  notes?: string;
}
```

---

## Views

| View | Scope | Filter | Ordering |
|------|-------|--------|---------|
| Case Hearings tab | Single case (all hearings) | Status, location, assignee (client-side) | Any |
| Site Upcoming Hearings | All site cases | Future dates only (server-side) | Date ascending |

---

## Validation Rules

| Field | Rule |
|-------|------|
| `assignedToId` | Required; valid site user |
| `hearingDateTime` | Required; past dates accepted (historical records) |
| `status` | Required; must be a `HearingStatus` value |
| `where` | Required; non-empty string |
| `notes` | Optional |
