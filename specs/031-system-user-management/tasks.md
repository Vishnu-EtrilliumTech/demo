# Tasks: System User Management

**Feature Branch**: `031-system-user-management`
**Input**: `specs/031-system-user-management/plan.md`, `specs/031-system-user-management/spec.md`

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = Admin Creates System User, US2 = View System Users, US3 = Update System User, US4 = Delete System User

---

## Phase 1: Setup

**Purpose**: Create file structure and type definitions.

- [ ] T001 Create directory structure per plan.md §3: `src/app/admin-dashboard/system-users/components/SystemUsersListView/`, `__tests__/`, `services/`, `types/`
- [ ] T002 [P] Create `src/app/admin-dashboard/system-users/types/index.ts` — `SystemUser { id, fullName, email, phoneNumber?, gender?, role: 'SystemAdmin' | 'SupportEngineer', enabled, createdAt }`, `CreateSystemUserRequest`, `UpdateSystemUserRequest` per plan.md §5
- [ ] T003 [P] Confirm exact Keycloak role claim values for `SystemAdmin` and `SupportEngineer` (risk: HIGH — `SystemAdmin` vs `system_admin` vs `ROLE_SYSTEM_ADMIN` per plan.md §11)
- [ ] T004 [P] Confirm all 6 system-user API endpoints will be NEW — coordinate with backend before implementation (risk: HIGH per plan.md §11)
- [ ] T005 [P] Confirm `sub` claim in Keycloak JWT maps to system user ID — may need `GET /api/v1/system-users/me` or similar to resolve own userId (risk per plan.md §11)

---

## Phase 2: UI

**Purpose**: Build all system user management components.

- [ ] T006 [US2] Create `src/app/admin-dashboard/system-users/components/SystemUsersListView/SystemUsersListView.tsx` — MUI `<Table>` columns: Full Name, Email, Role (`<Chip>` distinct color per role), Status (enabled/disabled `<Chip>`), Actions; "Add User" button visible only when `isSystemAdmin`; `<EmptyState message="No system users found." />` when empty; MUI Skeleton during fetch
- [ ] T007 [US1] Create `src/app/admin-dashboard/system-users/components/SystemUsersListView/SystemUserCreateModal.tsx` — fields: full name (required), email (required), role (`<Select>` with ONLY `['SystemAdmin', 'SupportEngineer']` — hard-coded, no API call); `useFormValidation`; 409 inline error "This email is already registered."
- [ ] T008 [US3] Create `src/app/admin-dashboard/system-users/components/SystemUsersListView/SystemUserEditModal.tsx` — fields: full name, email, phone, gender (`<Select>`), role (`<Select>` with ONLY `['SystemAdmin', 'SupportEngineer']`), enabled (`<Switch>`); props `{ open, user: SystemUser, onClose, onSuccess }`
- [ ] T009 Create `src/app/admin-dashboard/system-users/page.tsx` — `"use client"` list route; renders `SystemUsersListView`; SystemAdmin/SupportEngineer role check

---

## Phase 3: Logic

**Purpose**: Implement RBAC controls, self-register, and CRUD flows.

- [ ] T010 [US2] Add RBAC rendering logic in `SystemUsersListView.tsx`:
  ```
  const canCreate = isSystemAdmin
  const canEditAny = isSystemAdmin
  const canDelete = isSystemAdmin
  const canEditSelf = isSystemAdmin || isSupportEngineer
  const isSelf = (userId) => String(userId) === String(currentUser.id)
  ```
  "Add User": `{canCreate}` — Edit per row: `{canEditAny || (canEditSelf && isSelf(user.id))}` — Delete per row: `{canDelete}`
- [ ] T011 [US1] Implement "Add User" create flow in `SystemUsersListView.tsx` — open `SystemUserCreateModal`; on 201 close modal and refresh list; on 409 show inline error "This email is already registered."
- [ ] T012 [US1] Implement self-register button in `SystemUsersListView.tsx` or separate page — email pre-populated from `keycloak.tokenParsed?.email` (read-only); full name editable; role: SystemAdmin (pre-selected, read-only); submit → `selfRegisterSystemUser({ fullName })`; on 409 "Your account is already registered."
- [ ] T013 [US3] Wire edit modal in `SystemUsersListView.tsx` — `userToEdit` state; pre-fill modal on click; submit → `updateSystemUser(userId, payload)` → 200 updates list row → `showSuccess`
- [ ] T014 [US4] Wire delete flow in `SystemUsersListView.tsx` — ConfirmDialog "Delete this system user account? This action cannot be undone."; confirm → `deleteSystemUser(userId)` → 204 removes row → `showSuccess`
- [ ] T015 [US3] Enforce role dropdown constraint in `SystemUserEditModal.tsx` and `SystemUserCreateModal.tsx` — role `<Select>` options = `const SYSTEM_ROLES = ['SystemAdmin', 'SupportEngineer'] as const` — never includes org or site roles

---

## Phase 4: API

**Purpose**: Implement system user API service functions.

- [ ] T016 Implement `fetchSystemUsers()` in `src/app/admin-dashboard/system-users/services/api.ts` → `GET /api/v1/system-users` — Bearer (SystemAdmin, SupportEngineer)
- [ ] T017 [P] Implement `createSystemUser(payload: CreateSystemUserRequest)` → `POST /api/v1/system-users` — Bearer (SystemAdmin only); returns `{ data: SystemUser }` 201 or 409
- [ ] T018 [P] Implement `selfRegisterSystemUser(payload: { fullName: string })` → `POST /api/v1/system-users/self-register` — Bearer (SystemAdmin); returns 201 or 409
- [ ] T019 [P] Implement `updateSystemUser(userId, payload: UpdateSystemUserRequest)` → `PUT /api/v1/system-users/{userId}` — Bearer (SystemAdmin or own SupportEngineer); returns `{ data: SystemUser }` 200
- [ ] T020 [P] Implement `deleteSystemUser(userId)` → `DELETE /api/v1/system-users/{userId}` — Bearer (SystemAdmin only); returns 204

---

## Phase 5: Backend

**Purpose**: Validate backend contract assumptions for new endpoints.

- [ ] T021 Confirm `GET /api/v1/system-users` returns ONLY SystemAdmin and SupportEngineer accounts — not org or site users
- [ ] T022 [P] Confirm `POST /api/v1/system-users` is restricted to SystemAdmin role on backend
- [ ] T023 [P] Confirm `POST /api/v1/system-users/self-register` derives email from JWT token claim — cannot be overridden by request body (impersonation prevention)
- [ ] T024 [P] Confirm `PUT /api/v1/system-users/{userId}` rejects non-system role values with 400 — backend validates `role` field is SystemAdmin or SupportEngineer only
- [ ] T025 [P] Confirm backend prevents deletion of last SystemAdmin account and returns appropriate error message (plan.md §11)

---

## Phase 6: Security

**Purpose**: Harden RBAC and prevent role escalation.

- [ ] T026 Verify role `<Select>` in both `SystemUserCreateModal.tsx` and `SystemUserEditModal.tsx` only renders `['SystemAdmin', 'SupportEngineer']` options — confirmed by hard-coded `SYSTEM_ROLES` constant (no API call for roles)
- [ ] T027 [P] Verify `SupportEngineer` sees NO "Add User" button, NO Delete buttons, and Edit button only on own row in `SystemUsersListView.tsx`
- [ ] T028 [P] Verify self-register email field is read-only (sourced from `keycloak.tokenParsed?.email`) and cannot be overridden by the user
- [ ] T029 [P] Verify sensitive admin credentials not logged — only `userId`, `role`, `adminId` in log events; no email values, no passwords

---

## Phase 7: Testing

**Purpose**: Unit and E2E test coverage.

- [ ] T030 Create `src/app/admin-dashboard/system-users/components/SystemUsersListView/__tests__/SystemUsersListView.test.tsx` — tests: SystemAdmin sees "Add User" button; SupportEngineer hides "Add User"; SystemAdmin sees Edit+Delete on other rows; SupportEngineer sees Edit only on own row; empty list shows EmptyState; Delete opens ConfirmDialog; edit modal role dropdown excludes org roles
- [ ] T031 Create `src/app/admin-dashboard/system-users/components/SystemUsersListView/__tests__/SystemUserCreateModal.test.tsx` — tests: role dropdown has exactly 2 options (SystemAdmin, SupportEngineer); 409 response shows "already registered" inline error; valid form submit calls createSystemUser
- [ ] T032 Create `e2e/031-system-user-management.spec.ts` — E2E: view system users as SystemAdmin; create system user; duplicate email blocked; edit system user role dropdown shows only system roles; delete system user; SupportEngineer list is read-only; SupportEngineer can edit own profile; SupportEngineer cannot edit other user

---

## Phase 8: Logging

**Purpose**: Instrument observability events per plan.md §10.

- [ ] T033 Add INFO log on system user list fetch: `requesterId`, `role`, count
- [ ] T034 [P] Add INFO log on system user created: `newUserId`, `role`, `createdByAdminId` — no email/name
- [ ] T035 [P] Add INFO log on self-register completed: `newUserId`, `role` — no email
- [ ] T036 [P] Add INFO log on system user updated: `targetUserId`, `updatedByUserId`, changed field keys only — no field values
- [ ] T037 [P] Add INFO log on system user deleted: `targetUserId`, `deletedByAdminId`
- [ ] T038 [P] Add WARN log on role escalation attempt (non-system role submitted): `requesterId`, `attemptedRole`
- [ ] T039 [P] Add WARN log when SupportEngineer attempts to edit another user: `requesterId`, `targetUserId`
- [ ] T040 [P] Add INFO log on duplicate email 409: endpoint only — no email address

---

## Phase 9: Quality Gates

**Purpose**: Ensure all pre-commit checks pass.

- [ ] T041 Run `npm run type-check` — zero TypeScript errors in all new files; `SYSTEM_ROLES` constant properly typed as `const`
- [ ] T042 [P] Run `npm run lint` — zero ESLint errors; no `any` types
- [ ] T043 [P] Run `npm run build` — production build succeeds

---

## Phase 10: Finalization

**Purpose**: Polish and branch readiness.

- [ ] T044 Apply `React.memo` to user rows to prevent re-renders on modal state changes (plan.md §9)
- [ ] T045 [P] Confirm `String()` normalization used in `isSelf` comparison to prevent number-vs-string mismatch
- [ ] T046 [P] Confirm pagination strategy — system user count expected ≤20; add `TablePagination` only if count exceeds 50 (plan.md §9)

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: Start immediately; confirm Keycloak role names and backend availability first
- **UI (Phase 2)**: Requires Phase 1 type definitions
- **Logic (Phase 3)**: Requires Phase 2 components
- **API (Phase 4)**: Can run in parallel with Phase 2
- **Backend (Phase 5)**: Must be confirmed before Phase 4 implementation
- **Security (Phase 6)**: Requires Phase 3 complete
- **Testing (Phase 7)**: Requires Phase 2, 3, 4 complete
- **Logging (Phase 8)**: Requires Phase 3 complete
- **Quality Gates (Phase 9)**: Requires all prior phases
- **Finalization (Phase 10)**: Requires Phase 9 passing

## Total Task Count: 46
- US1 tasks: 9 | US2 tasks: 6 | US3 tasks: 7 | US4 tasks: 4 | Cross-cutting: 20
