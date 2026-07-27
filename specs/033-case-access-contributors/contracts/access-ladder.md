# Contract: Client-side Access Ladder (`useCaseAccess` / `computeCaseAccess`)

Defines the pure, unit-testable contract for mirroring the backend access resolution in the UI. The backend remains the authorization source of truth (Constitution IV); this computation only decides which controls render. Per clarification Q1, controls that fail a check are **hidden**, not disabled.

## Pure function

```ts
function computeCaseAccess(input: {
  roles: string[];            // allRoles from useUserRole
  currentUserId: number | null;
  createdById: number | null; // case.createdById
  assignedToId: number | null;// case.assignedToId
  contributors: CaseContributor[]; // from fetchCaseContributors
}): Omit<CaseAccess, 'isLoading'>;
```

Returns `{ entityLevel, resourceLevel, contributorLevel, canManageContributors }`.

### Hook wrapper

```ts
function useCaseAccess(args): CaseAccess; // memoized; isLoading = roles/identity/contributors not ready
```

## Resolution (first match wins — evaluate rows in order)

Let `uid = currentUserId` (treated as no-match when null or 0). Let `has(role)` check `roles`.
`isCreator = uid !== null && uid !== 0 && uid === createdById`.
`isAssignee = uid !== null && uid !== 0 && uid === assignedToId`.
`myContrib = contributors.find(c => c.userId === uid) ?? null`.

| # | Condition | entityLevel | resourceLevel |
|---|-----------|-------------|---------------|
| 1 | `has('SystemAdmin')` | Full | Full |
| 2 | `has('OrganizationAdmin')` | Full | Full |
| 3 | `has('SiteAdmin')` | Full | Full |
| 4 | `has('SiteSrLegalExpert')` | Edit | Full |
| 5 | `has('OrganizationClerk')` | View | View |
| 6 | `isCreator && !has('SiteClerk')` | Edit | Full |
| 7 | `isAssignee` | Edit | Full |
| 8 | `myContrib?.accessLevel === Edit` | Edit | Edit |
| 9 | `myContrib?.accessLevel === ViewOnly` | View | View |
| — | otherwise | None | None |

- `contributorLevel = myContrib?.accessLevel ?? null`.
- `canManageContributors = has('SystemAdmin') || has('OrganizationAdmin') || has('SiteAdmin') || isCreator || isAssignee`.
  (Explicitly excludes SiteSrLegalExpert, OrganizationClerk, contributors, and case clients even when they can edit.)

## Derived control predicates (consumer-side helpers)

| Predicate | Definition |
|-----------|------------|
| `canViewCase` | `entityLevel >= View` |
| `canEditCase` | `entityLevel >= Edit` |
| `canDeleteCase` | `entityLevel === Full` |
| `canCreateOrEditResource` | `resourceLevel >= Edit` |
| `canDeleteResource` | `resourceLevel === Full` |
| `canManageContributors` | as computed above |

## Required unit tests (Vitest) — one assertion set per ladder row + nuances

1. SystemAdmin → Full/Full; canManage true.
2. OrganizationAdmin → Full/Full; canManage true.
3. SiteAdmin → Full/Full; canManage true.
4. SiteSrLegalExpert → Edit/**Full**; canManage **false**.
5. OrganizationClerk → View/View; canManage **false**.
6. Creator (non-SiteClerk) → Edit/**Full**; canManage true.
7. Creator who **is** SiteClerk → does NOT get row 6; falls through (None unless another row matches).
8. Assignee → Edit/**Full**; canManage true.
9. Edit contributor → Edit/Edit (resource caps at Edit; canDeleteResource false); canManage **false**.
10. ViewOnly contributor → View/View; canManage **false**.
11. No match → None/None; canViewCase false.
12. `createdById = 0` / `assignedToId = null` with `currentUserId = 0` → never matches creator/assignee rows.
13. Multiple matches (e.g., SiteAdmin who is also a ViewOnly contributor) → highest wins (row 3 → Full/Full).
14. `resourceLevel` can exceed `entityLevel` (rows 4/6/7): assert `canDeleteResource` true while `canDeleteCase` false.

## Edge behavior

- While `isLoading`, consumers SHOULD render the read-only view (no mutation controls) until access resolves, to avoid flashing controls the user may not have.
- The computation never calls the network; it consumes already-loaded `useUserRole` + case + contributor data.
