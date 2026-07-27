# Tasks: Organization Management

**Feature**: `021-organization-management`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Status**: API functions mostly exist — org settings page and edit modal need verification/build; RBAC needs audit.

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1]**: View Organization Details (P1)
- **[US2]**: View All Cases Across the Organization (P2)
- **[US3]**: Personal Dashboard Summary (P3)
- **[US4]**: Update Organization Details (P4)
- **[US5]**: Admin Deletes an Organization (P5)

---

## Phase 1: Setup

**Purpose**: Verify existing API functions and type definitions.

- [ ] T001 Verify `src/app/organization/services/api.ts` has all required functions: `fetchOrganization`, `updateOrganization`, `deleteOrganization`, `fetchOrganizationCases`, `fetchUserCaseSummary` — confirm signatures and return types
- [ ] T002 [P] Verify `src/app/organization/types/index.ts` — confirm `Organization` interface has all required fields: `name`, `contactEmail`, `contactPhone`, `description`, `segments: string[]`, `isActive`; add missing fields
- [ ] T003 [P] Check if `src/app/organization/[id]/settings/page.tsx` exists — if not, create stub; if yes, document current state
- [ ] T004 [P] Check if `src/app/organization/[id]/cases/page.tsx` exists — if not, create stub; document current state

**Checkpoint**: Existing code audited, gaps identified — begin building

---

## Phase 2: UI

**Purpose**: Build or verify all org management UI components and pages.

- [ ] T005 [US1] Verify/create `src/app/organization/[id]/settings/page.tsx` — org settings root page (`"use client"`); fetches org on mount via `fetchOrganization(orgId)`; displays: name, contact email, phone, description, segments as MUI `Chip` array, active status badge; role-conditional action buttons
- [ ] T006 [US1] Verify/create `src/app/organization/[id]/settings/components/OrgDetailsCard.tsx` — read-only display of all org fields; segments rendered as `flex-wrap` row of MUI `Chip` components
- [ ] T007 [US4] Verify/create `src/app/organization/[id]/settings/components/EditOrgModal.tsx` — MUI `Dialog`; fields: name (`TextField required`), contactEmail (`TextField type="email"`), contactPhone (`TextField`), description (`TextField multiline`), segments (`Autocomplete multiple freeSolo` — allows adding/removing segment strings); pre-fills current org values; validation via `useFormValidation`
- [ ] T008 [US1] Add role-conditional buttons to org settings page:
  - `{(isOrgAdmin || isOrgClerk) && <EditButton />}` (no delete)
  - `{isSystemAdmin && <EditButton /><DeleteButton />}` (edit + delete)
  - Site roles → read-only (no buttons)
- [ ] T009 [US2] Verify/create `src/app/organization/[id]/cases/page.tsx` — org-level cases page; access guard: `isOrgAdmin || isOrgClerk || isSystemAdmin`; paginated MUI `Table`; columns: Case title, Case number, Site name, Status, Last updated; `<EmptyState>` when no cases
- [ ] T010 [US5] Verify org settings page `ConfirmDialog` for delete — message: "Are you sure? This will permanently delete the organization and all its data." — accessible only to SystemAdmin

**Checkpoint**: All UI pages and components renderable

---

## Phase 3: Logic

**Purpose**: Build hooks and wire business logic to pages.

- [ ] T011 [US1] Create or verify local state management in `OrgSettingsPage` — state: `org`, `loading`, `editModalOpen`; `fetchOrganization(orgId)` in `useEffect` on mount
- [ ] T012 [US4] Implement edit submit handler in `OrgSettingsPage` — calls `updateOrganization(orgId, payload)`; on 200 updates local `org` state and closes modal; on 400 shows inline errors; on conflict shows `showError` with API message
- [ ] T013 [US5] Implement delete handler in `OrgSettingsPage` — only wired for SystemAdmin; calls `deleteOrganization(orgId)` after confirmation; on 204 → `showSuccess` → `router.push('/admin/organizations')`
- [ ] T014 [US2] Implement org cases page logic — `fetchOrganizationCases(orgId, statusFilter?)` in `useEffect`; pagination via `page`/`pageSize` state; RBAC guard on mount (redirect site roles)
- [ ] T015 [US3] Verify `fetchUserCaseSummary` is wired correctly in spec 020 dashboard — this spec's P3 is covered by spec 020; no additional work needed here unless summary endpoint is missing

**Checkpoint**: All business logic implemented

---

## Phase 4: API

**Purpose**: Verify all existing API function signatures and usage.

- [ ] T016 [US1] Verify `fetchOrganization(orgId)` → `GET /organizations/{orgId}` returns `Organization` with all fields including `segments` array
- [ ] T017 [US4] Verify `updateOrganization(orgId, payload: UpdateOrganizationRequest)` → `PUT /organizations/{orgId}`; `UpdateOrganizationRequest` includes `segments: string[]`
- [ ] T018 [US5] Verify `deleteOrganization(orgId)` → `DELETE /organizations/{orgId}` — expects 204
- [ ] T019 [US2] Verify `fetchOrganizationCases(orgId, status?)` → `GET /organizations/{orgId}/cases?status=&page=1&pageSize=20`; response shape: `{ items, totalCount, page, pageSize }`

**Checkpoint**: All API functions confirmed and typed correctly

---

## Phase 5: Backend

**Purpose**: Document backend integration requirements (verification only).

- [ ] T020 Confirm `PUT /organizations/{orgId}` is accessible to OrgAdmin, OrgClerk, and SystemAdmin — not just SystemAdmin
- [ ] T021 Confirm `DELETE /organizations/{orgId}` is gated with `[Authorize(Roles = "SystemAdmin")]` only
- [ ] T022 Confirm `GET /organizations/{orgId}/cases` is gated to OrgAdmin, OrgClerk, SystemAdmin — returns 403 for site-level roles
- [ ] T023 Confirm `segments` field format in API response — `string[]` or `string` (needs parsing); align frontend type with backend

---

## Phase 6: Security

**Purpose**: Enforce all security requirements from plan.md §6.

- [ ] T024 [US5] Verify delete button is only rendered for `isSystemAdmin` — `{isSystemAdmin && <DeleteButton />}` — OrgAdmin cannot see or trigger delete
- [ ] T025 [US4] Verify edit button is NOT rendered for site-level roles (`isSiteAdmin`, `isSiteClerk`, `isSiteLegalExpert`, etc.) — read-only view only
- [ ] T026 [US2] Verify org-level cases page has route guard — site roles accessing `/organization/{orgId}/cases` URL directly → redirected; backend also returns 403
- [ ] T027 [P] Verify `EditOrgModal` uses MUI `Autocomplete` for segments — no free-text injection; `dangerouslySetInnerHTML` not used
- [ ] T028 Verify `ConfirmDialog` for delete requires explicit user confirmation before `deleteOrganization` is called — no auto-proceed

---

## Phase 7: Testing

**Purpose**: Build all unit tests and E2E tests from plan.md §8.

- [ ] T029 [P] [US1] Create `src/app/organization/[id]/settings/components/__tests__/OrgSettingsPage.test.tsx`:
  - OrgAdmin role → Edit button visible, Delete hidden
  - SystemAdmin role → Edit + Delete both visible
  - SiteAdmin role → no Edit, no Delete
  - Edit form submit → `updateOrganization` API mock called
  - Delete → `ConfirmDialog` shown before API call
- [ ] T030 [P] [US2] Create `src/app/organization/[id]/cases/__tests__/OrgCasesPage.test.tsx`:
  - OrgAdmin → cases list renders
  - SiteAdmin role → access denied text shown
  - No cases → EmptyState shown
- [ ] T031 Create `e2e/021-organization-management.spec.ts` with all 6 E2E scenarios from plan.md §8: view org details, edit org name, delete org, view org cases, site role access denied, empty org cases

**Checkpoint**: All tests written — run `npm run test` to verify unit tests pass

---

## Phase 8: Logging

**Purpose**: Add structured logging per plan.md §10.

- [ ] T032 [US1] Add `console.info` on org details fetch: log `{ orgId, userId }` — do NOT log description or segments
- [ ] T033 [US4] Add `console.info` on `updateOrganization` success: log `{ orgId, userId, changedFields: Object.keys(payload) }` — do NOT log field values
- [ ] T034 [US5] Add `console.info` on `deleteOrganization` success: log `{ orgId, userId }`
- [ ] T035 [US2] Add `console.info` on org cases fetch: log `{ orgId, userId, count }`
- [ ] T036 Add `console.warn` on unauthorized org cases access: log `{ userId, role, orgId }`

---

## Phase 9: Quality Gates

**Purpose**: Ensure code quality before finalization.

- [ ] T037 [P] Run `npm run type-check` — fix TypeScript errors in org settings page and org cases page
- [ ] T038 [P] Run `npm run lint` — fix ESLint errors
- [ ] T039 Run `npm run test` — confirm all new unit tests pass
- [ ] T040 Run `npm run build` — confirm production build passes

---

## Phase 10: Finalization

**Purpose**: Confirm all spec requirements are satisfied.

- [ ] T041 Verify SC-001: org details page loads within 2 seconds (lightweight single GET)
- [ ] T042 Verify SC-002: org cases list loads within 3 seconds for orgs with up to 10 sites (server-side pagination)
- [ ] T043 Verify SC-003: delete confirmation dialog appears before any delete API call — test by clicking Delete and checking no network request in browser until "Confirm" is clicked
- [ ] T044 Verify SC-004: site-level roles never see Edit or Delete controls — manually test with SiteAdmin and SiteLegalExpert accounts

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: Start immediately — T001–T004 verification before building
- **Phase 2 (UI)**: Depends on Phase 1; T005–T010 largely parallel (different files)
- **Phase 3 (Logic)**: Depends on Phase 1 type confirmation; wires to Phase 2 components
- **Phase 4 (API)**: Verification — parallel with Phase 2
- **Phase 5 (Backend)**: Independent — run in parallel
- **Phase 6 (Security)**: Depends on Phases 2–3
- **Phase 7 (Testing)**: Depends on Phases 2–4
- **Phase 8 (Logging)**: Parallel with Phase 7
- **Phase 9 (Quality Gates)**: Depends on Phases 7–8
- **Phase 10 (Finalization)**: Depends on Phase 9
