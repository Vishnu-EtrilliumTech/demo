# Phase 0 Research: Case Access Control & Contributors

No `NEEDS CLARIFICATION` markers remained after `/speckit-clarify`. This document records the design decisions that resolve how the spec's requirements map onto the existing codebase.

## R1. Where current-user identity and roles come from

- **Decision**: Reuse `useUserRole(organizationId)` from `src/hooks/useUserRole.ts`. It already exposes `currentUserId` and boolean role flags (`isOrganizationAdmin`, `isOrganizationClerk`, `isSiteAdmin`, `isSiteClerk`, `isSiteSrLegalExpert`, `isSiteLegalExpert`, `isSiteCaseClient`) plus the raw `allRoles` array and `isLoading`.
- **Rationale**: Constitution IV mandates `useUserRole()` for RBAC gates. It already resolves identity from the Redux `profile` slice with an API fallback, exactly what the access ladder needs.
- **Note**: `SystemAdmin` and `SupportEngineer` are present in `allRoles` (seen in `roleUtils.ts`) but not surfaced as flags; the access hook reads them from `allRoles` directly.
- **Alternatives considered**: A new identity hook — rejected (duplicates existing, violates DRY and Constitution IV).

## R2. Mirroring the access ladder client-side

- **Decision**: Implement a pure function `computeCaseAccess({ roles, currentUserId, createdById, assignedToId, contributors })` returning `{ entityLevel, resourceLevel, contributorLevel, canManageContributors }`, wrapped in a `useCaseAccess` hook that memoizes over its inputs. Levels are an ordered enum `None < View < Edit < Full`.
- **Rationale**: The backend doc explicitly says "Use the same logic client-side to enable/disable UI." A pure function is trivially unit-testable (Constitution III) against every ladder row and the documented nuances. "First match wins" precedence is encoded by evaluating rows 1→9 in order.
- **Key nuances encoded** (from backend doc Part 1):
  - Resource level can exceed entity level (Sr. Legal Expert / creator / assignee → entity Edit, resource Full).
  - Contributors cap at their granted level on resources (never delete); `Edit` contributor = entity Edit + resource Edit.
  - A SiteClerk who created the case does **not** get creator privileges (row 6 excludes SiteClerk).
  - `createdById`/`assignedToId` of `0` or null never match (user id 0 is "no creator/assignee").
  - Org/site membership: the frontend currently scopes roles to the active org via `useUserRole(organizationId)`; site membership is implied by holding a site role in that context. Documented as an assumption (see R6).
- **Alternatives considered**: Optimistic UI + rely solely on 401 — rejected per clarification Q1 (controls are hidden, not shown-then-failing).

## R3. Contributor API service functions

- **Decision**: Add four functions to the existing domain service `src/app/organization/services/api.ts`, matching the file's established Axios + `getToken()` + `validateStatus` pattern:
  - `fetchCaseContributors(organizationId, siteId, caseId): Promise<CaseContributor[]>` — GET, 200/404, returns `data ?? []`.
  - `addCaseContributor(organizationId, siteId, caseId, body): Promise<CaseContributor>` — POST, 201/400, throws on non-201 with the envelope error.
  - `updateCaseContributor(organizationId, siteId, caseId, contributorId, body): Promise<CaseContributor>` — PUT, 200/400.
  - `removeCaseContributor(organizationId, siteId, caseId, contributorId): Promise<void>` — DELETE, 204.
- **Rationale**: Constitution V — domain-scoped service file, no direct `httpServices` import in components; mirrors `fetchSiteCases`/`createCase`/`deleteCase` exactly. 401 is handled by the shared Axios interceptor (token refresh → logout).
- **Alternatives considered**: A separate `contributorApi.ts` file — acceptable but the existing `api.ts` already hosts all case/invoice/document calls; keeping them together matches the codebase convention. Final call left to implementation; either satisfies the constitution.

## R4. Contributors tab placement and UI building blocks

- **Decision**: Insert a `<Tab label="Contributors">` immediately adjacent to the **Clients** tab in `cases/[caseId]/page.tsx`, with a matching `<TabPanel>`. Because the page computes tab indices dynamically around the optional eCourts tab (`hasCnrNumber`), the new tab's index must be threaded through the same index arithmetic.
- **Decision**: Build `ContributorsTab` with MUI `Table` (mirrors `ClientsTab`), an empty-state, and management controls (`Add contributor` button, per-row edit/remove `IconButton`s) shown only when `canManageContributors` is true.
- **Decision**: Reuse modal conventions — `AddContributorModal` (MUI `Autocomplete` over filtered site members + access-level `Select`) and `EditContributorAccessModal` (access-level `Select`), with the existing `DeleteConfirmationModal` for removal.
- **Rationale**: Constitution VI (reuse MUI, co-locate feature UI, mirror sibling tabs). Site members are already loaded on the page as `siteUsers` via `useCaseData`, so the picker needs no new fetch.
- **Index-arithmetic risk**: The existing page hardcodes tab indices (`hasCnrNumber ? 3 : 2`, etc.). Adding a tab shifts every subsequent index. Mitigation noted in tasks: introduce a single ordered tab list/derived index map to avoid off-by-one regressions, or carefully update each literal. Recorded as the highest-risk edit.

## R5. Case list row-filtering and empty states

- **Decision**: No client-side filtering is added — `fetchSiteCases` / `fetchOrganizationCases` already return whatever the backend permits and already map `404 → []`. The only changes are (a) an informative empty-state on the case list pages hinting the user may need contributor access, and (b) ensuring the case detail page's existing "not found / no permission" branch covers the 401-on-load path.
- **Rationale**: Spec FR-016/017 + clarification — filtering is a backend concern; frontend adapts rendering only.
- **Alternatives considered**: Client-side filtering by access — rejected (duplicates backend, risks divergence).

## R6. Assignment-time contributor grant

- **Decision**: Add an optional `newAssigneeContributorAccessLevel?: ContributorAccessLevel` field to the task and hearing add/update request types, and an MUI `Select` (View-only / Edit, default unset) on the task and hearing assignment forms, shown whenever an assignee is selected (clarification Q3). When unset, the field is **omitted** from the request body so the backend applies its ViewOnly default.
- **Rationale**: Spec FR-019/020/021; the backend auto-grants after save and no-ops for creator/assignee, so the frontend needs no separate contributor call and no "is this person on the team?" logic.
- **Idempotency**: Retrying an assignment is safe (backend only upgrades ViewOnly→Edit, never downgrades). No special client handling required.

## R7. Open assumptions carried to implementation

- **Site membership precision**: The backend ladder distinguishes "member of the site/org." The frontend resolves roles in the context of the active organization (`useUserRole(organizationId)`) and treats a held site role as site membership for the current case's site. Cross-site edge cases (a user holding a site role for a different site) are rare in current flows and remain backend-enforced (401 fallback). Documented here rather than blocking.
- **Service file location** (R3) and **tab-index refactor strategy** (R4) are implementation choices that do not change behavior; left to tasks.
