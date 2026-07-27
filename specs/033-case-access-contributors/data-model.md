# Phase 1 Data Model: Case Access Control & Contributors

Frontend type definitions (TypeScript interfaces/enums) to be added to `src/app/organization/types/caseindex.ts`, plus the derived (non-API) access model used only by the UI. All API shapes follow Constitution Principle I (declared interfaces, no inline assertions).

## Enums

### `ContributorAccessLevel` (API enum — sent/received as number)

| Value | Name | UI label |
|-------|------|----------|
| 0 | `ViewOnly` | "View-only" |
| 1 | `Edit` | "Edit" |

```ts
export enum ContributorAccessLevel {
  ViewOnly = 0,
  Edit = 1,
}
```

### `CaseAccessLevel` (derived — never sent to the API)

Ordered ladder used by the client-side computation. Ordering matters (`None < View < Edit < Full`); compare by numeric value.

```ts
export enum CaseAccessLevel {
  None = 0,
  View = 1,
  Edit = 2,
  Full = 3,
}
```

## API Entities

### `CaseContributor` (response shape — `CaseContributorResponse.data`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | Contributor record id (used in PUT/DELETE paths) |
| `caseId` | number | The case this grant belongs to |
| `userId` | number | The granted site member |
| `userFullName` | string | Display name |
| `userEmail` | string | Display email |
| `accessLevel` | `ContributorAccessLevel` | 0 = ViewOnly, 1 = Edit |
| `addedById` | number | Who created the grant |
| `addedByFullName` | string | Display name of granter |
| `createdDate` | string | ISO 8601 with offset |

```ts
export interface CaseContributor {
  id: number;
  caseId: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  accessLevel: ContributorAccessLevel;
  addedById: number;
  addedByFullName: string;
  createdDate: string;
}
```

**Identity & uniqueness**: unique per `(caseId, userId)` (backend-enforced). The UI relies on this to filter the add-picker.

### Request DTOs

```ts
export interface AddCaseContributorRequest extends Record<string, unknown> {
  userId: number;
  accessLevel: ContributorAccessLevel; // required here (always chosen)
}

export interface UpdateCaseContributorRequest extends Record<string, unknown> {
  accessLevel: ContributorAccessLevel;
}
```

### Envelope wrappers (match existing `*Response` / `*ListResponse` pattern)

```ts
export interface CaseContributorResponse {
  data: CaseContributor;
  errors: string[];
  meta: Record<string, unknown>;
}

export interface CaseContributorsListResponse {
  data: CaseContributor[];
  errors: string[];
  meta: Record<string, unknown>;
}
```

### Extensions to existing request types

Add one **optional** field (omitted when unset) to the task and hearing add/update requests:

```ts
// AddCaseTaskRequest, UpdateCaseTaskRequest,
// AddCaseHearingRequest, UpdateCaseHearingRequest
newAssigneeContributorAccessLevel?: ContributorAccessLevel; // omit → backend defaults to ViewOnly
```

## Derived Model (UI only — not persisted, not sent)

### `CaseAccess`

Returned by `useCaseAccess` / `computeCaseAccess`. Drives which controls render.

| Field | Type | Meaning |
|-------|------|---------|
| `entityLevel` | `CaseAccessLevel` | Access to the case entity (gates view / update / delete-case) |
| `resourceLevel` | `CaseAccessLevel` | Access to case resources (gates resource view / create-update / delete) |
| `contributorLevel` | `ContributorAccessLevel \| null` | Current user's own contributor grant on this case, if any |
| `canManageContributors` | boolean | True for system/org/site admin, creator, or assignee (the Part 3 predicate) |
| `isLoading` | boolean | True while roles/identity/contributors still loading |

```ts
export interface CaseAccess {
  entityLevel: CaseAccessLevel;
  resourceLevel: CaseAccessLevel;
  contributorLevel: ContributorAccessLevel | null;
  canManageContributors: boolean;
  isLoading: boolean;
}
```

### Resolution table (first match wins) — implemented by `computeCaseAccess`

| # | Condition | entityLevel | resourceLevel |
|---|-----------|-------------|---------------|
| 1 | `SystemAdmin` | Full | Full |
| 2 | `OrganizationAdmin` | Full | Full |
| 3 | `SiteAdmin` | Full | Full |
| 4 | `SiteSrLegalExpert` | Edit | Full |
| 5 | `OrganizationClerk` | View | View |
| 6 | creator (`currentUserId === createdById`, id ≠ 0) AND not SiteClerk | Edit | Full |
| 7 | assignee (`currentUserId === assignedToId`, id ≠ 0) | Edit | Full |
| 8 | contributor with `Edit` | Edit | Edit |
| 9 | contributor with `ViewOnly` | View | View |
| — | otherwise | None | None |

**`canManageContributors`** = `SystemAdmin || OrganizationAdmin || SiteAdmin || isCreator || isAssignee` (Sr. Legal Expert, Org Clerk, contributors, and case clients are excluded even if they can edit).

### Control-gating rules consumed by the UI

| Control | Shown when |
|---------|-----------|
| View case + resources / tabs | `entityLevel ≥ View` (page already 401-guards) |
| Case **update** (edit title, edit case) | `entityLevel ≥ Edit` |
| **Delete Case** | `entityLevel === Full` |
| Resource **create / update** (task, hearing, document, comment, invoice, client) | `resourceLevel ≥ Edit` |
| Resource **delete** | `resourceLevel === Full` |
| Contributors tab visible | `entityLevel ≥ View` |
| Add / change-level / remove contributor | `canManageContributors` |

Per clarification Q1, controls failing these checks are **hidden**, not disabled.

## Validation Rules (surfaced from backend, mirrored client-side where cheap)

- Add picker MUST exclude: existing contributors (`userId` already in list), the case creator (`createdById`), and the case assignee (`assignedToId`). (Client filter per Q2; backend 400 is the fallback.)
- `accessLevel` on add/update is required and constrained to `ViewOnly | Edit`.
- Backend 400 messages to surface verbatim-ish via toast: "is the case creator or assigned user", "is not a member of the case's site", "is already a contributor".
