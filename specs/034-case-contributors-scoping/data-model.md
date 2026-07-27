# Phase 1 Data Model: Case Contributors — Org/Site Scoping & Eligible-Users Picker

Frontend type model. All types live in
`src/app/organization/types/caseindex.ts` unless noted. The backend response envelope is the
standard `{ data }` (success) / `{ errors }` (failure).

## New entity — `AvailableUser`

A site member eligible to be added as a contributor to a specific case. Returned by the new
`available-users` endpoint, already filtered server-side (excludes creator, assignee, existing
contributors, and admins).

```ts
export interface AvailableUser {
  id: number;        // user id — passed as `userId` to addCaseContributor
  fullName: string;  // primary display label in the picker
  email: string;     // secondary display / disambiguation
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | number | yes | Maps to `userId` in `AddCaseContributorRequest`. |
| `fullName` | string | yes | Autocomplete option label. |
| `email` | string | yes | Shown alongside the name; note field is `email`, **not** `emailId` as on the broader `User` type. |

**Response wrappers** (for the service layer):

```ts
export interface AvailableUsersListResponse {
  data: AvailableUser[];
  errors: string[];
  meta: Record<string, unknown>;
}
```

Empty eligibility is a normal success with `data: []`.

## Changed entity — `CaseContributor`

Two optional fields added; nothing removed or renamed (non-breaking).

```ts
export interface CaseContributor {
  id: number;
  caseId: number;
  siteId?: number;          // NEW — site the membership is held against
  organizationId?: number;  // NEW — organization that owns the site
  userId: number;
  userFullName: string;
  userEmail: string;
  accessLevel: ContributorAccessLevel;
  addedById: number;
  addedByFullName: string;
  createdDate: string;
}
```

| New field | Type | Required | Notes |
|-----------|------|----------|-------|
| `siteId` | number | optional | Site the contributor membership maps to. UI may ignore for now. |
| `organizationId` | number | optional | Organization owning the site. UI may ignore for now. |

## Unchanged entities (referenced)

- **`ContributorAccessLevel`** (enum) — `ViewOnly = 0`, `Edit = 1`. Unchanged.
- **`AddCaseContributorRequest`** — `{ userId, accessLevel }`. Unchanged; `userId` now sourced
  from a selected `AvailableUser.id`.
- **`UpdateCaseContributorRequest`** — `{ accessLevel }`. Unchanged.

## Relationships

```text
Case (caseId)
  └── scoped by Site (siteId) + Organization (organizationId)
        ├── CaseContributor[]      (site-scoped list — GET …/contributors)
        └── AvailableUser[]        (eligible-to-add — GET …/contributors/available-users)

AvailableUser.id ──(select in picker)──► AddCaseContributorRequest.userId
                                              └──► creates CaseContributor (drops the user
                                                    out of the next AvailableUser[] fetch)
```

## Validation / business rules (frontend-relevant)

- The picker MUST only offer members from `AvailableUser[]` (no client-side re-filtering needed).
- Selecting a member is required before the add submit is enabled (existing rule retained).
- `accessLevel` defaults to `ViewOnly` and must be `ViewOnly` or `Edit` (existing rule).
- On a `400` from add, surface `errors[0]` via toast; refetch the eligible list on next picker
  open so a stale entry is corrected.
