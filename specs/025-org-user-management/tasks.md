# Tasks: Organization User Management

**Feature Branch**: `025-org-user-management`
**Input**: `specs/025-org-user-management/plan.md`, `specs/025-org-user-management/spec.md`

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = View All Users, US2 = Search by Email, US3 = View & Edit User, US4 = Delete User

---

## Phase 1: Setup

**Purpose**: Audit existing code and create test file structure.

- [ ] T001 Audit `src/app/organization/components/UserManagementTab.tsx` (522 lines) — identify every `<Button>` and `<IconButton>` and verify RBAC guards per plan.md §4.1; document missing guards as sub-tasks
- [ ] T002 [P] Audit `src/app/organization/services/api.ts` — confirm `fetchOrganizationUsers(orgId)` returns combined org+site users with `siteName` field for site-assigned users (risk per plan.md §11)
- [ ] T003 [P] Create directory `src/app/organization/components/UserManagementTab/__tests__/` for unit test placement

---

## Phase 2: UI

**Purpose**: Update component rendering for all four user stories.

- [ ] T004 [US1] Update `src/app/organization/components/UserManagementTab.tsx` — add "Site" column to table view showing `siteName` for site-assigned users, blank for org-level users
- [ ] T005 [US1] Add `<EmptyState message="No users in this organization yet." />` to `UserManagementTab.tsx` when user list is empty
- [ ] T006 [US1] Add access-denied rendering in `UserManagementTab.tsx` for site-level roles — show access denied message when `useUserRole` returns a site role
- [ ] T007 [P] [US3] Audit `src/app/organization/components/EditUserModal.tsx` — confirm fields are: full name, phone, email, gender (MUI Select), enabled (MUI Switch); confirm NO role field is rendered
- [ ] T008 [US3] Update `EditUserModal.tsx` to ensure role field is absent; if present, remove it per plan.md §4.2
- [ ] T009 [US2] Add email search `<TextField>` with format validation to `UserManagementTab.tsx` — inline error "Please enter a valid email address." for malformed input

---

## Phase 3: Logic

**Purpose**: Implement RBAC controls, self-deletion guard, and search filtering.

- [ ] T010 [US1] Add RBAC rendering logic in `UserManagementTab.tsx`:
  ```
  const canEdit = isOrgAdmin || isSystemAdmin
  const canDelete = isOrgAdmin || isSystemAdmin
  const isSelf = (userId) => userId === currentUser.id
  ```
  Edit button: `{canEdit && !isSelf(user.id)}` — Delete button: `{canDelete && !isSelf(user.id)}` — own row: disabled Delete with tooltip "You cannot delete your own account."
- [ ] T011 [US2] Implement client-side email search filter in `UserManagementTab.tsx` — `users.filter(u => u.email.toLowerCase().includes(searchEmail.toLowerCase()))` — show "No user found with that email address." on empty result
- [ ] T012 [US3] Update `EditUserModal.tsx` API routing — if `user.siteId` exists, call `updateSiteUser(orgId, siteId, userId, payload)`; else call `updateUser(orgId, userId, payload)` per plan.md §4.2
- [ ] T013 [P] [US3] Ensure `payload.email = email.toLowerCase()` before any `updateUser` or `updateSiteUser` call in `EditUserModal.tsx`
- [ ] T014 [US4] Confirm `currentUser.id` is accessible from Keycloak context or Redux auth slice in `UserManagementTab.tsx` — wire self-deletion guard using this ID

---

## Phase 4: API

**Purpose**: Verify all API service functions used by this feature.

- [ ] T015 Verify `fetchOrganizationUsers(orgId)` → `GET /organizations/{orgId}/users` returns `OrgUser[]` with `siteName` for site users in `src/app/organization/services/api.ts`
- [ ] T016 [P] Verify `updateUser(orgId, userId, payload)` → `PUT /organizations/{orgId}/users/{userId}` in `src/app/organization/services/api.ts`
- [ ] T017 [P] Verify `deleteOrganizationUser(orgId, userId)` → `DELETE /organizations/{orgId}/users/{userId}` in `src/app/organization/services/api.ts`
- [ ] T018 [P] Verify `updateSiteUser(orgId, siteId, userId, payload)` → `PUT /organizations/{orgId}/sites/{siteId}/users/{userId}` in `src/app/organization/services/api.ts`
- [ ] T019 [P] Verify `deleteSiteUser(orgId, siteId, userId)` → `DELETE /organizations/{orgId}/sites/{siteId}/users/{userId}` in `src/app/organization/services/api.ts`
- [ ] T020 Verify `OrgUser` interface in `src/app/organization/types/index.ts` includes `siteName?: string` field; add if missing

---

## Phase 5: Backend

**Purpose**: Confirm backend contract assumptions.

- [ ] T021 Confirm `GET /organizations/{orgId}/users` returns both org-level users AND all site users in one combined response — if API only returns org-level users, plan client-side merge with `fetchSiteUsers` calls (risk per plan.md §11)
- [ ] T022 [P] Confirm backend rejects role changes from `PUT /organizations/{orgId}/users/{userId}` — role field should not be accepted by this endpoint
- [ ] T023 [P] Confirm site user delete uses `DELETE /organizations/{orgId}/sites/{siteId}/users/{userId}` (not org endpoint) — determined by `user.siteId != null`

---

## Phase 6: Security

**Purpose**: Harden RBAC and data handling.

- [ ] T024 Verify `OrgClerk` role shows NO edit or delete controls in `UserManagementTab.tsx` — confirm by reading every button render condition in the file
- [ ] T025 [P] Verify self-deletion guard: `isSelf(user.id)` comparison uses `String()` normalization on both sides to prevent type mismatch (number vs string)
- [ ] T026 [P] Verify `EditUserModal.tsx` does NOT render a role field — form must only have: full name, phone, email, gender, enabled

---

## Phase 7: Testing

**Purpose**: Unit and E2E test coverage.

- [ ] T027 Create `src/app/organization/components/UserManagementTab/__tests__/UserManagementTab.test.tsx` — tests: OrgAdmin shows Edit+Delete on non-self rows; OrgAdmin own row has disabled Delete; OrgClerk shows no edit/delete; SiteAdmin sees access denied; valid email search filters list; invalid email shows validation error; Delete opens ConfirmDialog; Edit submit calls updateUser; empty list shows EmptyState; site user shows site name column
- [ ] T028 Create `e2e/025-org-user-management.spec.ts` — E2E: view all users as OrgAdmin; search by email; invalid email search shows error; edit user updates name; delete user removes from list; self-delete blocked; OrgClerk read-only; SiteAdmin access denied

---

## Phase 8: Logging

**Purpose**: Instrument observability events per plan.md §10.

- [ ] T029 Add INFO log on user list fetch: `orgId`, `userId` (requester), count — no email/name list
- [ ] T030 [P] Add INFO log on user update: `orgId`, `targetUserId`, changed field keys only — no field values
- [ ] T031 [P] Add INFO log on user delete: `orgId`, `targetUserId`, `deletedByUserId`
- [ ] T032 [P] Add WARN log when self-delete is attempted: `userId`, `orgId`
- [ ] T033 [P] Add WARN log on unauthorized org user list access: `userId`, `role`, `orgId`

---

## Phase 9: Quality Gates

**Purpose**: Ensure all pre-commit checks pass.

- [ ] T034 Run `npm run type-check` — zero TypeScript errors in `UserManagementTab.tsx`, `EditUserModal.tsx`, `types/index.ts`
- [ ] T035 [P] Run `npm run lint` — zero ESLint errors; no `any` types introduced
- [ ] T036 [P] Run `npm run build` — production build succeeds

---

## Phase 10: Finalization

**Purpose**: Cleanup and readiness.

- [ ] T037 Confirm `React.memo` applied to user rows to prevent re-renders on unrelated state changes
- [ ] T038 [P] Confirm search is client-side only — no additional API call triggered by email search field
- [ ] T039 [P] Confirm `email.toLowerCase()` is applied before every API call that updates email in `EditUserModal.tsx`

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: Start immediately
- **UI (Phase 2)**: Requires Phase 1 audit completion
- **Logic (Phase 3)**: Requires Phase 2 UI updates
- **API (Phase 4)**: Can run in parallel with Phase 2
- **Backend (Phase 5)**: Can run immediately — verification only
- **Security (Phase 6)**: Requires Phase 3 complete
- **Testing (Phase 7)**: Requires Phase 2, 3, 4 complete
- **Logging (Phase 8)**: Requires Phase 3 complete
- **Quality Gates (Phase 9)**: Requires all prior phases
- **Finalization (Phase 10)**: Requires Phase 9 passing

## Total Task Count: 39
- US1 tasks: 9 | US2 tasks: 4 | US3 tasks: 7 | US4 tasks: 4 | Cross-cutting: 15
