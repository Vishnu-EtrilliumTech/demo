# Quickstart: Case Contributors — Org/Site Scoping & Eligible-Users Picker

How to implement and verify feature 034. Builds directly on feature 033's contributor stack.

## Prerequisites

- Backend running with the 034 changes (available-users endpoint + site-scoped list + admin
  rejection). Point `NEXT_PUBLIC_API_BASE_URL` at a dev server that has them (e.g.
  `https://dev2.lawsome.in`) or local Docker once updated.
- A case with: a creator, an assignee, ≥1 existing contributor, and ≥1 **admin** site member —
  so the eligibility exclusions are observable.

## Implementation order

1. **Types** — `src/app/organization/types/caseindex.ts`
   - Add `AvailableUser` (`id`, `fullName`, `email`) and `AvailableUsersListResponse`.
   - Add optional `siteId?: number`, `organizationId?: number` to `CaseContributor`.

2. **Service** — `src/app/organization/services/caseapi.ts`
   - Add `fetchAvailableContributorUsers(organizationId, siteId, caseId)` calling
     `GET …/contributors/available-users`, `validateStatus: 200 || 404`, 404 → `[]`.

3. **Hook** — `…/cases/[caseId]/hooks/useAvailableContributorUsers.ts`
   - State: `availableUsers`, `loading`, `refetch`. Fetch on mount when manage is allowed.
   - Export from `…/cases/[caseId]/hooks/index.ts`.

4. **Page wiring** — `…/cases/[caseId]/page.tsx`
   - Call the new hook (guard on `access.canManageContributors`).
   - Pass `availableUsers` + `loadingAvailableUsers` into `ContributorsTab`.
   - After a successful `addContributor`, call the hook's `refetch` so the added member drops out.

5. **Tab** — `…/components/ContributorsTab/ContributorsTab.tsx`
   - Replace `siteUsers` / `existingContributorUserIds` / `createdById` / `assignedToId` plumbing
     to the Add modal with `availableUsers` + `loadingAvailableUsers`.

6. **Modal** — `src/components/modals/AddContributorModal.tsx`
   - Accept `availableUsers: AvailableUser[]` + `loadingAvailableUsers`.
   - Delete the `eligibleMembers` `useMemo`; bind Autocomplete `options` to `availableUsers`.
   - Option label: `option.email ? `${option.fullName} (${option.email})` : option.fullName`.

7. **Tests**
   - Update `AddContributorModal.test.tsx` for the new prop contract (renders options, empty
     state, submit passes the selected id).
   - Add a unit test for `useAvailableContributorUsers` (loads list, refetch).
   - Playwright: golden path (open picker → pick → add → row appears) + empty-state + add-reject.

## Verification steps

1. **Picker source & exclusions** — Open Contributors tab as a manager → Add Contributor. The
   list excludes the creator, assignee, existing contributors, and any admin. ✅ FR-001/002.
2. **Add success + drop-out** — Add an offered member → success toast, row appears, and that
   member is no longer offered on re-open. ✅ FR-006.
3. **Empty state** — On a case where everyone is excluded, the picker shows "No eligible members
   to add". ✅ FR-005.
4. **Loading state** — Throttle network; the picker shows a loading indication, not a stale/empty
   list. ✅ FR-005.
5. **Rejected add** — Force a stale entry (add a member who just became ineligible) → backend
   `400`; the `errors[0]` message appears as an error toast. ✅ FR-007.
6. **Site scoping** — Contributor list matches the site the case is viewed under. ✅ FR-008.
7. **No regressions** — Edit/remove contributor still work; assigning a task/hearing to an
   admin/related user no longer adds a redundant contributor row. ✅ FR-012/SC-005.

## Gate

Run before commit (Constitution VII):

```bash
npm run type-check && npm run lint && npm run build
npm run test          # Vitest unit/component
npm run test:e2e      # Playwright (dev server running)
```
