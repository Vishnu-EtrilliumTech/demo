# Tasks: Site User Management

**Feature Branch**: `026-site-user-management`
**Input**: `specs/026-site-user-management/plan.md`, `specs/026-site-user-management/spec.md`

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = View All Site Users, US2 = View & Edit Site User, US3 = Delete Site User

---

## Phase 1: Setup

**Purpose**: Create file structure and verify prerequisites.

- [ ] T001 Create directory `src/app/organization/[id]/sites/[siteId]/users/components/SiteUsersListView/` per plan.md §3
- [ ] T002 [P] Create directory `src/app/organization/[id]/sites/[siteId]/users/components/SiteUsersListView/__tests__/` per plan.md §3
- [ ] T003 [P] Verify `fetchSiteUsers(orgId, siteId)`, `updateSiteUser(orgId, siteId, userId, payload)`, and `deleteSiteUser(orgId, siteId, userId)` exist in `src/app/organization/services/api.ts`
- [ ] T004 [P] Verify `SiteUser` interface in `src/app/organization/types/index.ts` includes: `id`, `fullName`, `email`, `role`, `enabled`, `phoneNumber`, `gender`; add missing fields

---

## Phase 2: UI

**Purpose**: Build all visual components for the site users list.

- [ ] T005 [US1] Create `src/app/organization/[id]/sites/[siteId]/users/page.tsx` — `"use client"` list page route; renders `SiteUsersListView`; passes `orgId` and `siteId` from route params
- [ ] T006 [US1] Create `src/app/organization/[id]/sites/[siteId]/users/components/SiteUsersListView/SiteUsersListView.tsx` — MUI `<Table>` with columns: Full Name, Email, Role (read-only `<Chip>`), Status (enabled/disabled `<Chip>`), Actions; MUI Skeleton rows during fetch; `<EmptyState message="No users assigned to this site yet." />` when empty
- [ ] T007 [US2] Create `src/app/organization/[id]/sites/[siteId]/users/components/SiteUsersListView/SiteUserEditModal.tsx` — fields: full name (required), phone, email (required), gender (MUI Select: Male/Female/Other/Prefer not to say), enabled (MUI Switch); NO role field; props `{ open, user: SiteUser, onClose, onSuccess }`
- [ ] T008 [US3] Add delete confirm dialog reference in `SiteUsersListView.tsx` using shared `ConfirmDialog` component — message: "This user will be permanently removed from the site. This action cannot be undone."

---

## Phase 3: Logic

**Purpose**: Implement RBAC, self-deletion guard, edit/delete flows.

- [ ] T009 [US1] Add RBAC rendering logic in `SiteUsersListView.tsx`:
  ```
  const canEdit = isOrgAdmin || isSiteAdmin || isSiteSrLegalExpert || isSiteLegalExpert || isSystemAdmin
  const canDelete = isOrgAdmin || isSiteAdmin || isSystemAdmin
  const isSelf = (userId) => String(userId) === String(currentUser.id)
  ```
  Per row: Edit button when `canEdit`; Delete button when `canDelete && !isSelf(user.id)`; own row Delete disabled with tooltip "Cannot delete own account"
- [ ] T010 [US2] Wire `SiteUserEditModal` open/close state and `userToEdit` selection in `SiteUsersListView.tsx`; on submit call `updateSiteUser(orgId, siteId, userId, payload)` and refresh list on 200
- [ ] T011 [US2] Apply `payload.email = email.toLowerCase()` before every `updateSiteUser` call in `SiteUserEditModal.tsx`
- [ ] T012 [US2] Add form validation in `SiteUserEditModal.tsx` using `useFormValidation` from `src/hooks/useFormValidation.ts` — validate full name (required) and email (required, valid format)
- [ ] T013 [US3] Wire delete confirmation flow in `SiteUsersListView.tsx` — `userToDelete` state; ConfirmDialog confirm → `deleteSiteUser(orgId, siteId, userId)` → 204 removes row from list → `showSuccess`; error → `showError`

---

## Phase 4: API

**Purpose**: Verify all API service functions used by this feature.

- [ ] T014 Verify `fetchSiteUsers(orgId, siteId)` → `GET /organizations/{orgId}/sites/{siteId}/users` returns `{ data: SiteUser[] }` in `src/app/organization/services/api.ts`
- [ ] T015 [P] Verify `updateSiteUser(orgId, siteId, userId, payload)` → `PUT /organizations/{orgId}/sites/{siteId}/users/{userId}` — `UpdateSiteUserRequest`: `fullName`, `phoneNumber?`, `email`, `gender?`, `enabled`
- [ ] T016 [P] Verify `deleteSiteUser(orgId, siteId, userId)` → `DELETE /organizations/{orgId}/sites/{siteId}/users/{userId}` returns 204
- [ ] T017 Confirm API response shape — check for nested `data.data` vs flat `data` pattern; use `response.data?.data || response.data` normalization consistent with org API (risk per plan.md §11)

---

## Phase 5: Backend

**Purpose**: Validate backend contract assumptions.

- [ ] T018 Confirm `PUT /organizations/{orgId}/sites/{siteId}/users/{userId}` backend ignores any role field in the request body — role is not editable through this endpoint
- [ ] T019 [P] Confirm `DELETE /organizations/{orgId}/sites/{siteId}/users/{userId}` returns 403 for `SiteClerk`, `OrgClerk`, `SiteSrLegalExpert`, `SiteLegalExpert` (delete restricted to OrgAdmin, SiteAdmin, SystemAdmin)
- [ ] T020 [P] Confirm `GET /organizations/{orgId}/sites/{siteId}/users` returns 401/403 for unauthenticated or wrong-org users

---

## Phase 6: Security

**Purpose**: Harden RBAC and data handling.

- [ ] T021 Verify `SiteClerk` role has NO edit or delete controls rendered in `SiteUsersListView.tsx` — check every button render condition
- [ ] T022 [P] Verify `SiteUserEditModal.tsx` does NOT render a role field — only: full name, phone, email, gender, enabled
- [ ] T023 [P] Verify `isSelf` comparison uses `String()` normalization to prevent number-vs-string mismatch between `currentUser.id` and `user.id` (risk per plan.md §11)
- [ ] T024 [P] Verify `orgId` and `siteId` in `deleteSiteUser` calls come directly from route params — not captured in stale closures (risk per plan.md §11)

---

## Phase 7: Testing

**Purpose**: Unit and E2E test coverage.

- [ ] T025 Create `src/app/organization/[id]/sites/[siteId]/users/components/SiteUsersListView/__tests__/SiteUsersListView.test.tsx` — tests: OrgAdmin sees Edit+Delete on non-self rows; OrgAdmin own row has disabled Delete with tooltip; SiteClerk has no edit/delete controls; SiteSrLegalExpert sees edit but no delete; empty list shows EmptyState; Delete opens ConfirmDialog; Edit submit calls updateSiteUser with lowercase email; Role column shows read-only chip
- [ ] T026 Create `e2e/026-site-user-management.spec.ts` — E2E: SiteAdmin views all users with role badge; SiteAdmin edits site user; OrgAdmin deletes site user; self-delete blocked; SiteClerk sees list but no controls; empty state shown for site with no users

---

## Phase 8: Logging

**Purpose**: Instrument observability events per plan.md §10.

- [ ] T027 Add INFO log on site user list fetch: `orgId`, `siteId`, `requesterId`, count — no PII
- [ ] T028 [P] Add INFO log on site user update: `orgId`, `siteId`, `targetUserId`, changed field keys only — no field values
- [ ] T029 [P] Add INFO log on site user delete: `orgId`, `siteId`, `targetUserId`, `deletedByUserId`
- [ ] T030 [P] Add WARN log on self-delete attempt: `userId`, `siteId`
- [ ] T031 [P] Add WARN log on unauthorized delete attempt: `userId`, `role`, `targetUserId`, `siteId`

---

## Phase 9: Quality Gates

**Purpose**: Ensure all pre-commit checks pass.

- [ ] T032 Run `npm run type-check` — zero TypeScript errors in `page.tsx`, `SiteUsersListView.tsx`, `SiteUserEditModal.tsx`, `types/index.ts`
- [ ] T033 [P] Run `npm run lint` — zero ESLint errors; no `any` types introduced
- [ ] T034 [P] Run `npm run build` — production build succeeds

---

## Phase 10: Finalization

**Purpose**: Cleanup and readiness.

- [ ] T035 Apply `React.memo` to user row components to prevent re-renders on modal state changes
- [ ] T036 [P] Confirm MUI `Skeleton` rows display during fetch before user list is available
- [ ] T037 [P] Confirm `email.toLowerCase()` applied before every `updateSiteUser` call

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: Start immediately
- **UI (Phase 2)**: Requires Phase 1 directory creation
- **Logic (Phase 3)**: Requires Phase 2 UI components
- **API (Phase 4)**: Can run in parallel with Phase 2
- **Backend (Phase 5)**: Can run immediately — verification only
- **Security (Phase 6)**: Requires Phase 3 complete
- **Testing (Phase 7)**: Requires Phase 2, 3, 4 complete
- **Logging (Phase 8)**: Requires Phase 3 complete
- **Quality Gates (Phase 9)**: Requires all prior phases
- **Finalization (Phase 10)**: Requires Phase 9 passing

## Total Task Count: 37
- US1 tasks: 7 | US2 tasks: 9 | US3 tasks: 5 | Cross-cutting: 16
