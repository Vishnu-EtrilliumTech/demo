# Phase 0 Research: Case Contributors — Org/Site Scoping & Eligible-Users Picker

All Technical Context items were resolvable from the existing codebase and the attached backend
report ("Case Contributors — Org/Site Scoping & 'Related People' (Frontend Integration)"). No
open `NEEDS CLARIFICATION` items remain.

## Decision 1 — Eligible-users data source

**Decision**: Add `fetchAvailableContributorUsers(organizationId, siteId, caseId)` to
`src/app/organization/services/caseapi.ts`, calling
`GET …/cases/{caseId}/contributors/available-users`, and back it with a new
`useAvailableContributorUsers` hook. Drive the Add Contributor picker from this list.

**Rationale**: The backend list is authoritative — it already excludes the creator, assignee,
existing contributors, and admins. The current implementation fetches **all** site members
(`fetchSiteUsers`) and filters client-side in `AddContributorModal.eligibleMembers`, but cannot
detect admins, which is the exact gap causing surprise `400`s (report §1, §4). Moving the source
server-side closes the gap and removes browser-side filtering logic.

**Alternatives considered**:
- *Keep `fetchSiteUsers` and add a client-side admin filter* — rejected: the frontend has no
  reliable per-site/per-org admin signal for arbitrary members, and it would duplicate logic the
  backend now owns. Violates "server is authoritative" intent.
- *Reuse the `siteUsers` already loaded by `useCaseData`* — rejected for the picker for the same
  admin-exclusion reason. `siteUsers` may still be used elsewhere (assignee pickers) and is left
  intact for those.

## Decision 2 — Where the new hook lives & when it fetches

**Decision**: Co-locate `useAvailableContributorUsers.ts` under
`…/cases/[caseId]/hooks/` (next to `useCaseContributors.ts`) and export it from `hooks/index.ts`.
Fetch on mount when the user can manage contributors, expose `refetch`, and call `refetch` after a
successful add so the just-added member drops out of the list.

**Rationale**: Mirrors the existing `useCaseContributors` pattern (Constitution VI — business
logic in hooks, not components). Fetching only when `canManageContributors` avoids an unnecessary
call (and a possible 401) for view-only users who never see the picker. Refetch-after-add keeps
the list consistent without a full reload (FR-006).

**Alternatives considered**:
- *Fetch inside `AddContributorModal` on open* — rejected: pushes data-fetching into a shared
  presentational component (`src/components/modals/`), against Constitution VI, and complicates
  reuse/testing.
- *Fold the eligible list into `useCaseContributors`* — rejected: keeps responsibilities separate
  and avoids coupling the read-only contributor list to manage-only eligibility data.

## Decision 3 — Modal prop contract change

**Decision**: Replace `AddContributorModal`'s `siteUsers: User[]` +
`existingContributorUserIds`/`createdById`/`assignedToId` filtering props with a single
`availableUsers: AvailableUser[]` (+ `loadingAvailableUsers`). Remove the in-modal
`eligibleMembers` `useMemo` filter. The Autocomplete renders `fullName` + `email` directly.

**Rationale**: The backend list is already filtered, so the modal no longer needs creator/
assignee/existing-contributor exclusion inputs. Simpler prop surface, less logic, fewer chances
of drift between client filter and server rule. `AvailableUser` (id/fullName/email) is a tighter
type than the broader `User`.

**Alternatives considered**:
- *Keep the old props and also accept `availableUsers`* — rejected: dead inputs and ambiguous
  source of truth; tests would have to cover filtering that no longer applies.

## Decision 4 — `CaseContributor` type additions

**Decision**: Add optional `siteId?: number` and `organizationId?: number` to the
`CaseContributor` interface in `types/caseindex.ts`. Do not surface them in the UI for now.

**Rationale**: Report §2 — these fields are additive and optional to consume. Typing them keeps
Constitution I (typed response shapes) satisfied and leaves the door open for a future multi-site
display without forcing UI work now (FR-011).

**Alternatives considered**:
- *Make them required* — rejected: would be technically fine given the backend always returns
  them, but `optional` is safer for forward/backward compatibility and matches "safe to ignore."

## Decision 5 — Site-scoped contributor list

**Decision**: No code change. `fetchCaseContributors` already passes the `{siteId}` from the
route; it now transparently returns the site-scoped set (report §3).

**Rationale**: Request/response shapes are unchanged; the scoping happens server-side. Covered by
a verification step in quickstart rather than new code (FR-008).

## Decision 6 — Error handling for rejected adds

**Decision**: Keep the existing flow — `addCaseContributor` throws on `400` with
`response.data.errors[0]`; `useCaseContributors.addContributor` catches and shows it via
`extractApiErrors(err)` + `showError`. No change needed; verify it surfaces the admin-rejection
message for stale-picker cases (FR-007, report §4).

**Rationale**: The existing path already satisfies Constitution V (errors via `errorHandler` +
`useToast`). The authoritative picker makes rejections rare but the safeguard remains.

**Alternatives considered**:
- *Add bespoke admin-specific messaging client-side* — rejected: the backend already returns a
  user-friendly reason; surfacing `errors[0]` keeps a single source of truth.

## Decision 7 — Task/hearing assignment flows

**Decision**: No change (report §5). The revised backend auto-contribution behavior is invisible
to the frontend; request bodies (`assignedToId`, `newAssigneeContributorAccessLevel`) are
unchanged.

**Rationale**: Confirmed against `useCaseTasks.ts` / `useCaseHearings.ts` / task & hearing modals
— they send the same fields; nothing to adjust (FR-012).
