# Data Model: Case Read, Update & Delete

**Feature**: 006-case-read-update-delete | **Date**: 2026-05-14

---

## Entities

### CaseListItem (from GET /cases list)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Case primary key |
| `title` | `string` | Display name |
| `caseNumber` | `string` | Court/internal reference number |
| `status` | `CaseStatus` | Open \| InProgress \| OnHold \| Closed |
| `assignedToId` | `number \| undefined` | Site user ID |
| `assignedToName` | `string \| undefined` | Denormalized for list display |
| `createdAt` | `string` | ISO 8601 |
| `updatedAt` | `string \| undefined` | ISO 8601 |

### CaseDetail (from GET /cases/{caseId})

Extends `CaseListItem` plus:

| Field | Type | Notes |
|---|---|---|
| `cnrNumber` | `string \| undefined` | Court Number Reference |
| `description` | `string \| undefined` | Case description / notes |
| `siteId` | `number` | Parent site |
| `organizationId` | `number` | Parent org |

### UpdateCaseRequest (PUT /cases/{caseId})

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | `string` | Yes | Min 1 char |
| `caseNumber` | `string` | Yes | Min 1 char |
| `status` | `CaseStatus` | Yes | Enum value |
| `assignedTo` | `number` | Yes | Site user ID |
| `description` | `string` | No | Optional free text |

---

## Enums

```typescript
export enum CaseStatus {
  Open = 'Open',
  InProgress = 'InProgress',
  OnHold = 'OnHold',
  Closed = 'Closed'
}
```

---

## TypeScript Interfaces

```typescript
// src/app/organization/types/index.ts (already exists — verify these fields match)

export interface CaseListItem {
  id: string;
  title: string;
  caseNumber: string;
  status: CaseStatus;
  assignedToId?: number;
  assignedToName?: string;
  createdAt: string;
  updatedAt?: string;
}

// CaseData (exists in [caseId]/types/case.ts)
export interface CaseData {
  id: string;
  title: string;
  caseNumber: string;
  cnrNumber?: string;
  status: CaseStatus;
  description?: string;
  assignedToId?: number;
  createdAt: string;
  updatedAt?: string;
}

// EditTitleFormState (exists in [caseId]/types/case.ts)
export interface EditTitleFormState {
  title: string;
  caseNumber: string;
  status: CaseStatus;
  assignedTo: number;
}

// EditFormData (exists in [caseId]/types/case.ts)
export interface EditFormData {
  assignedTo: number;
  description: string;
}
```

### New/Verified Types for Spec 006

```typescript
// StatusBadge color map (internal to component — not exported)
const STATUS_COLOR_MAP: Record<string, { color: string; bg: string }> = {
  Open:       { color: '#1565c0', bg: '#e3f2fd' },
  InProgress: { color: '#e65100', bg: '#fff3e0' },
  OnHold:     { color: '#bf360c', bg: '#fbe9e7' },
  Closed:     { color: '#424242', bg: '#f5f5f5' },
};

// StatusBadge props
interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

// DeleteCaseDialog props (inline in CaseHeader — no separate file)
interface DeleteCaseDialogProps {
  open: boolean;
  caseTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}
```

---

## State Shape — Cases List Filter

```typescript
// Local state in site cases list component
interface CasesListState {
  cases: CaseListItem[];
  loading: boolean;
  statusFilter: CaseStatus | '';   // '' = All
}

// Derived
const filteredCases = statusFilter
  ? cases.filter(c => c.status === statusFilter)
  : cases;
```

---

## Role → Permission Matrix

| Role | canViewList | canViewDetail | canEdit | canDelete |
|---|---|---|---|---|
| `OrganizationAdmin` | Yes | Yes | Yes | Yes |
| `OrganizationClerk` | Yes | **No** | No | No |
| `SiteAdmin` | Yes | Yes | Yes | Yes |
| `SiteClerk` | Yes | Yes | Yes | **No** |
| `SiteSrLegalExpert` | Yes | Yes | Yes | No |
| `SiteLegalExpert` | Yes | Yes | Yes | No |
| `SiteCaseClient` | No | Yes (own) | No | No |

> Note: `canDeleteCases` in `useUserRole` currently maps to `isOrganizationAdmin || isSiteAdmin`. The spec adds `SiteClerk` delete rights — verify with product team and update `useUserRole` if confirmed.
