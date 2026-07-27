# Contract: Contributors API (frontend service layer)

Maps the backend `SiteCaseContributorsController` endpoints to the frontend service functions to be added to `src/app/organization/services/api.ts`. All requests carry `Authorization: Bearer <token>` via the shared Axios/`getToken()` pattern; 401 is handled by the existing interceptor (refresh → logout). Response envelope: success `{ data }`, error `{ errors }`.

Base: `ORG_API_BASE_URL = {API_BASE}/api/v1/organizations`

---

## 1. List contributors

- **Endpoint**: `GET {ORG}/{organizationId}/sites/{siteId}/cases/{caseId}/contributors`
- **Service fn**: `fetchCaseContributors(organizationId, siteId, caseId): Promise<CaseContributor[]>`
- **validateStatus**: 200 or 404
- **Returns**: `response.data?.data ?? []` (empty array when none or 404)
- **Auth (fine)**: case entity ≥ View (else 401 → interceptor)

## 2. Add contributor

- **Endpoint**: `POST {ORG}/{organizationId}/sites/{siteId}/cases/{caseId}/contributors`
- **Body**: `AddCaseContributorRequest` `{ userId: number, accessLevel: 0 | 1 }`
- **Service fn**: `addCaseContributor(organizationId, siteId, caseId, body): Promise<CaseContributor>`
- **validateStatus**: 201 or 400
- **On non-201**: `throw new Error(response.data?.errors?.[0] ?? 'Failed to add contributor')`
- **On 201**: return `response.data?.data`
- **400 causes** (surface to toast): target is creator/assignee, target not a site member, target already a contributor.

## 3. Update contributor access level

- **Endpoint**: `PUT {ORG}/{organizationId}/sites/{siteId}/cases/{caseId}/contributors/{contributorId}`
- **Body**: `UpdateCaseContributorRequest` `{ accessLevel: 0 | 1 }`
- **Service fn**: `updateCaseContributor(organizationId, siteId, caseId, contributorId, body): Promise<CaseContributor>`
- **validateStatus**: 200 or 400
- **On 200**: return `response.data?.data`
- **400**: contributor does not belong to the case.

## 4. Remove contributor

- **Endpoint**: `DELETE {ORG}/{organizationId}/sites/{siteId}/cases/{caseId}/contributors/{contributorId}`
- **Service fn**: `removeCaseContributor(organizationId, siteId, caseId, contributorId): Promise<void>`
- **validateStatus**: 204
- **Returns**: void (no body)

---

## Error & auth handling rules (Constitution V)

- Components MUST NOT import `httpServices`/Axios directly — only call these service functions.
- Thrown errors are caught in `useCaseContributors` and surfaced via `useToast().showError(...)` using `errorHandler.ts` mapping.
- 401 on any of these is left to the global Axios interceptor (token refresh, then logout on persistent 401); the UI additionally hides management controls so authorized-only actions are not offered to begin with.

## Auto-grant on assignment (no new endpoint)

Handled inside existing task/hearing create/update calls by adding the optional body field:

```jsonc
{
  /* ...existing task/hearing fields... */
  "assignedToId": 55,
  "newAssigneeContributorAccessLevel": 1   // OPTIONAL: 0=ViewOnly, 1=Edit; omit to default ViewOnly
}
```

- The field is **omitted** from the body when the UI selector is left unset.
- No separate contributor POST is made for assignments; the backend grants/upgrades after save.
- Retry is idempotent (backend only upgrades ViewOnly→Edit, never downgrades).
