---

description: "Task list for 034 — Case Contributors org/site scoping & eligible-users picker"
---

# Tasks: Case Contributors — Org/Site Scoping & Eligible-Users Picker

**Input**: Design documents from `/specs/034-case-contributors-scoping/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/available-users-api.md](./contracts/available-users-api.md)

**Tests**: Included — Constitution III mandates RTL component tests for `src/components/`
shared components and Playwright E2E for user-facing features.

**Organization**: Tasks grouped by user story (US1 = P1 MVP, US2 = P2, US3 = P3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: US1 / US2 / US3 (setup, foundational, and polish carry no story label)
- Paths are repository-relative.

## Path Conventions

Single Next.js frontend app. Key paths:

- Types: `src/app/organization/types/caseindex.ts`
- Service: `src/app/organization/services/caseapi.ts`
- Case route: `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/`
- Shared modals: `src/components/modals/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the working branch and that the backend contract is reachable.

- [X] T001 Verify on branch `034-case-contributors-scoping` and `NEXT_PUBLIC_API_BASE_URL` points at a backend that exposes `…/contributors/available-users` (per [quickstart.md](./quickstart.md) Prerequisites). _(Branch confirmed; live backend reachability deferred to T018.)_

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, service call, and data hook that the picker (US1) depends on. These are
shared, additive primitives over feature 033.

**⚠️ CRITICAL**: US1 cannot begin until this phase is complete.

- [X] T002 [P] Add `AvailableUser` interface (`id: number`, `fullName: string`, `email: string`) and `AvailableUsersListResponse` (`{ data: AvailableUser[]; errors: string[]; meta: Record<string, unknown> }`) to `src/app/organization/types/caseindex.ts` (per [data-model.md](./data-model.md)).
- [X] T003 [P] Add optional `siteId?: number` and `organizationId?: number` to the `CaseContributor` interface in `src/app/organization/types/caseindex.ts` (non-breaking; serves FR-011).
- [X] T004 Add `fetchAvailableContributorUsers(organizationId, siteId, caseId)` to `src/app/organization/services/caseapi.ts` calling `GET ${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/contributors/available-users` with `validateStatus: status === 200 || status === 404`, returning `[]` on 404 else `response.data?.data ?? []` (mirror `fetchCaseContributors`; depends on T002).
- [X] T005 Create `useAvailableContributorUsers(organizationId, siteId, caseId, enabled)` hook in `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/useAvailableContributorUsers.ts` exposing `{ availableUsers, loading, refetch }`; fetch on mount only when `enabled` (manage allowed); swallow errors to `[]` with `console.error` (depends on T004).
- [X] T006 Export `useAvailableContributorUsers` from `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/index.ts` (depends on T005).

**Checkpoint**: Type model, service call, and eligible-users hook exist and compile.

---

## Phase 3: User Story 1 — Add a contributor from an authoritative eligibility list (Priority: P1) 🎯 MVP

**Goal**: The Add Contributor picker is sourced from `useAvailableContributorUsers`, never offers
the creator/assignee/existing contributors/admins, and adds successfully.

**Independent Test**: Open the Contributors tab as a manager → open the picker → confirm
exclusions → add an offered member → row appears, member no longer offered.

### Tests for User Story 1 ⚠️

> Write/update these before/with implementation.

- [X] T007 [P] [US1] Update `src/components/modals/AddContributorModal.test.tsx` for the new prop contract: renders `availableUsers` options, shows loading and empty states, requires a selection, and submits the selected `id` + access level.

### Implementation for User Story 1

- [X] T008 [US1] Refactor `src/components/modals/AddContributorModal.tsx`: replace props `siteUsers`/`existingContributorUserIds`/`createdById`/`assignedToId` with `availableUsers: AvailableUser[]` + `loadingAvailableUsers?: boolean`; delete the `eligibleMembers` `useMemo`; bind Autocomplete `options` to `availableUsers`; option label `option.email ? \`${option.fullName} (${option.email})\` : option.fullName`; keep `noOptionsText` loading/empty handling (depends on T002).
- [X] T009 [US1] Update `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/ContributorsTab/ContributorsTab.tsx`: replace the `siteUsers`/`loadingSiteUsers`/`createdById`/`assignedToId` props feeding the Add modal with `availableUsers`/`loadingAvailableUsers`; pass them through to `AddContributorModal` (depends on T008).
- [X] T010 [US1] Wire `useAvailableContributorUsers` into `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/page.tsx`: call with `enabled = access.canManageContributors`; pass `availableUsers`/`loadingAvailableUsers` to `ContributorsTab`; remove the now-unneeded `siteUsers` plumbing into the contributors path (leave `siteUsers` for other pickers) (depends on T006, T009).
- [X] T011 [US1] In `page.tsx`, after a successful `addContributor`, call the hook's `refetch` so the added member drops out of the eligible list (FR-006; depends on T010).

**Checkpoint**: MVP complete — picker is authoritative; add works and self-refreshes.

---

## Phase 4: User Story 2 — Graceful handling of a rejected add (Priority: P2)

**Goal**: A backend `400` on add surfaces `errors[0]` to the manager; the eligible list reflects
reality on next open.

**Independent Test**: Force a stale/rejected add → error toast shows the backend reason → reopen
picker shows refreshed list.

### Tests for User Story 2 ⚠️

- [X] T012 [P] [US2] Add a unit test for `useAvailableContributorUsers` in `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/useAvailableContributorUsers.test.tsx` covering initial load and `refetch`.

### Implementation for User Story 2

- [X] T013 [US2] Verify `addCaseContributor` (`src/app/organization/services/caseapi.ts`) throws `errors[0]` on `400` and that `useCaseContributors.addContributor` surfaces it via `extractApiErrors` + `showError` (existing behavior — adjust only if the message is not surfaced; FR-007).
- [X] T014 [US2] Ensure the eligible list refreshes for stale-picker recovery: refetch on Add modal open (or on add failure) in `page.tsx`/`ContributorsTab.tsx` so a rejected entry is corrected (FR-006; depends on T011).

**Checkpoint**: US1 + US2 both work; rejections are visible and self-correcting.

---

## Phase 5: User Story 3 — Per-site contributor list correctness (Priority: P3)

**Goal**: The contributor list reflects the site the case is viewed under (backend now
site-scopes it); optionally expose `siteId`/`organizationId`.

**Independent Test**: View a case's Contributors tab via a given site → listed contributors are
those scoped to that site.

### Implementation for User Story 3

- [X] T015 [US3] Verify `fetchCaseContributors` in `src/app/organization/services/caseapi.ts` already passes the route `{siteId}` and that the Contributors tab renders the site-scoped list unchanged — no code change expected (FR-008).
- [X] T016 [US3] (Optional) Confirm `siteId`/`organizationId` parse cleanly onto `CaseContributor` rows in `ContributorsTab.tsx` without breaking existing columns; no display required (FR-011; depends on T003).

**Checkpoint**: All three stories functional; multi-site lists are correct.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: E2E coverage, validation, and quality gates.

- [X] T017 [P] Add/extend Playwright E2E under `e2e/` for the Contributors flow: golden path (open picker → select → add → row appears), empty-eligible state, and rejected-add error toast (Constitution III; covers SC-001..SC-003).
- [ ] T018 Run `quickstart.md` verification steps 1–7 against a backend with the 034 changes and confirm each FR/SC. _(Deferred — requires a running backend with the 034 endpoints; manual QA step.)_
- [X] T019 Run the quality gate: `npm run type-check && npm run lint && npm run build`, then `npm run test` (Constitution VII; no `--no-verify`). _(type-check, lint, build, and unit tests pass — 26/26. `npm run test:e2e` deferred to T018: needs dev server + live backend.)_

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none — start immediately.
- **Foundational (Phase 2)**: after Setup. BLOCKS US1.
- **US1 (Phase 3)**: after Foundational. The MVP.
- **US2 (Phase 4)**: after US1 (it refines the same add flow/wiring).
- **US3 (Phase 5)**: after Foundational; independent of US1/US2 (verify-only; T016 depends on T003).
- **Polish (Phase 6)**: after the user stories being shipped are complete.

### Within Each Story

- T002/T003 (types) are parallel; T004 → T005 → T006 are sequential.
- US1: T007 (test) parallel with T008 start; T008 → T009 → T010 → T011 sequential (shared call chain).
- US2: T012 parallel; T013/T014 follow US1 wiring.

### Parallel Opportunities

- T002 ∥ T003 (same file, distinct edits — coordinate, otherwise sequential).
- T007 (modal test) can be written in parallel with T008.
- T012 (hook test) and T017 (E2E) are independent of each other.

---

## Parallel Example: Foundational

```bash
# Types can be drafted together (same file — apply as one edit pass):
Task: "Add AvailableUser + AvailableUsersListResponse to types/caseindex.ts"   # T002
Task: "Add siteId/organizationId to CaseContributor in types/caseindex.ts"     # T003
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1: Setup (T001).
2. Phase 2: Foundational (T002–T006) — types, service, hook.
3. Phase 3: User Story 1 (T007–T011) — authoritative picker.
4. **STOP and VALIDATE**: exclusions correct, add works, member drops out.
5. Demo the MVP.

### Incremental Delivery

1. Foundational → US1 (MVP) → demo.
2. US2 (rejection handling) → demo.
3. US3 (site-scoping verification) → demo.
4. Polish: E2E + quickstart + quality gate.

---

## Notes

- This feature is additive over feature 033; most US2/US3 tasks are verification of existing
  behavior rather than new code.
- `siteUsers` from `useCaseData` stays in place for non-contributor pickers (assignee selection);
  only the contributor picker switches to `availableUsers`.
- Commit after each logical group; never bypass the pre-commit gate with `--no-verify`.
- Field name is `email` on `AvailableUser` (not `emailId` as on the broader `User` type).
