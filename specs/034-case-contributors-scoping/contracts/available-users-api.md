# Contract: Eligible Contributor Users & Contributor Scoping

Frontend ↔ backend contract for feature 034. Mirrors the backend report. Standard envelope:
success → `{ "data": ... }`, error → `{ "errors": [ ... ] }`. Bearer JWT throughout; `401`
handled by the shared Axios interceptor (refresh → logout).

**Route prefix**

```text
/api/v1/organizations/{organizationId}/sites/{siteId}/cases/{caseId}/contributors
```

In the frontend, `ORG_API_BASE_URL` = `…/api/v1/organizations`, so service calls build on
`${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/contributors`.

---

## 1. NEW — List eligible-to-add users

```text
GET …/contributors/available-users
```

Populates the Add Contributor picker. Returns site members who can actually be added — **not**
already a contributor, **not** the creator, **not** the assignee, **not** an admin (System / Org /
Site admin).

**Authorization**: any user who can view the case (same rule as listing contributors).

**Success — `200 OK`**

```json
{
  "data": [
    { "id": 102, "fullName": "Asha Menon", "email": "asha.menon@example.com" },
    { "id": 118, "fullName": "Rahul Verma", "email": "rahul.verma@example.com" }
  ]
}
```

Empty is a normal `200` with `"data": []`.

**Errors**

| Status | When | Frontend handling |
|--------|------|-------------------|
| `401` | Caller cannot view the case | Axios interceptor (refresh → logout). Picker has no data. |
| `404` | Org/site/case not found, or case not in the given site | Treat as empty list; picker shows "no eligible members". |

**Frontend service signature**

```ts
fetchAvailableContributorUsers(
  organizationId: string,
  siteId: string,
  caseId: string | number
): Promise<AvailableUser[]>   // 404 → []
```

`validateStatus: status === 200 || status === 404`; on 404 return `[]`; otherwise
`response.data?.data ?? []`. (Same defensive pattern as `fetchCaseContributors`.)

---

## 2. CHANGED — `CaseContributorResponse` gains `siteId` + `organizationId`

Returned by `GET …/contributors`, `POST …/contributors`, `PUT …/contributors/{id}`. Additive;
existing parsing unaffected.

```json
{
  "data": {
    "id": 55,
    "caseId": 12,
    "siteId": 3,
    "organizationId": 1,
    "userId": 102,
    "userFullName": "Asha Menon",
    "userEmail": "asha.menon@example.com",
    "accessLevel": "Edit",
    "addedById": 40,
    "addedByFullName": "Priya Nair",
    "createdDate": "2026-06-17T09:30:00+00:00"
  }
}
```

> Note: `accessLevel` is shown as the string enum in the report example, but the existing
> frontend already exchanges it as the numeric `ContributorAccessLevel` (0/1). This contract
> change does **not** alter how `accessLevel` is parsed — keep the current numeric handling.

Frontend: add optional `siteId?: number`, `organizationId?: number` to `CaseContributor`.
No mapping/display work required.

---

## 3. CHANGED behavior — `GET …/contributors` is site-scoped

```text
GET …/contributors
```

Request/response shapes unchanged. Now returns only contributors recorded against the `{siteId}`
in the URL. The frontend already passes the route's `siteId`, so **no code change** — verify
only.

---

## 4. CHANGED behavior — adding an admin is rejected (`400`)

```text
POST …/contributors
Body (unchanged): { "userId": 102, "accessLevel": "Edit" }   // accessLevel numeric on the wire
```

Rejected targets now also include **admins** (System / Org-of-case / Site-of-case), in addition
to: case creator, assigned user, non-member of the site, already-a-contributor.

Because endpoint §1 already excludes all of these, a correctly-built picker won't trigger this.
Still, on `400` the frontend surfaces `errors[0]` via toast (existing behavior in
`useCaseContributors.addContributor` → `extractApiErrors`).

`201 Created` with `CaseContributorResponse` + `Location` header on success (unchanged).

---

## 5. UNCHANGED — task/hearing assignment

No request/response change. `assignedToId` + optional `newAssigneeContributorAccessLevel`
("ViewOnly" | "Edit", default ViewOnly) unchanged. Backend simply no longer auto-creates a
contributor row for admin/creator/assignee assignees. **No frontend action.**

---

## Frontend integration checklist

- [ ] Add `AvailableUser` + `AvailableUsersListResponse` to `types/caseindex.ts`.
- [ ] Add `siteId?`/`organizationId?` to `CaseContributor`.
- [ ] Add `fetchAvailableContributorUsers` to `caseapi.ts`.
- [ ] Add `useAvailableContributorUsers` hook (list + loading + refetch); export from `hooks/index.ts`.
- [ ] Wire hook in `page.tsx`; refetch after a successful add.
- [ ] `ContributorsTab`: replace `siteUsers`/filter props with `availableUsers` + `loadingAvailableUsers`.
- [ ] `AddContributorModal`: consume `availableUsers`; drop the `eligibleMembers` client filter.
- [ ] Keep surfacing `400` `errors[0]` on add.
- [ ] No task/hearing changes.
