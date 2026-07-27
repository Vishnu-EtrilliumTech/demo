# Tasks: Organization User Creation

**Input**: `specs/002-organization-user-creation/`
**Branch**: `002-organization-user-creation`

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1=OrgAdmin adds user, US2=Duplicate email rejected, US3=Role restriction enforced

---

## Phase 1: Setup

**Purpose**: Audit existing code to understand the current state before making changes.

- [ ] T001 Read `src/components/modals/AddUserModal.tsx` — verify current `FormData` interface, `createUser` call site, and existing role filtering logic (`canCreateAdmin`, `canCreateClerk` props)
- [ ] T002 [P] Read `src/app/organization/[id]/page.tsx` — verify `AddUserModal` usage, `UserManagementTab` usage, and current `hideAddButton` and `refreshKey` wiring
- [ ] T003 [P] Read `src/app/organization/services/api.ts` lines for `createUser()` — verify `enabled: true` is hardcoded in the current payload (confirmed gap from plan)
- [ ] T004 [P] Read `src/hooks/useUserRole.ts` — verify `isOrganizationAdmin`, `canManageOrganizationUsers` flags are exported

---

## Phase 2: UI

**Purpose**: Add the `enabled` toggle field to `AddUserModal` and expose org-mode role filtering correctly.

- [ ] T005 [US1] Add `enabled: boolean` (default `false`) to `FormData` interface in `src/components/modals/AddUserModal.tsx`
- [ ] T006 [US1] Add MUI `FormControlLabel` + `Switch` for "Enable user account on creation" in `AddUserModal.tsx` form body — placed after Gender field, before Site/Role selector; only shown in org-mode (`isOrgMode=true`)
- [ ] T007 [US3] Confirm role dropdown in `AddUserModal.tsx` when `isOrgMode=true` and `isHQSelected=true` only shows `['OrganizationAdmin', 'OrganizationClerk']`; apply `canCreateAdmin`/`canCreateClerk` prop filtering so clerks cannot assign admin role
- [ ] T008 [US1] Verify "Add User" button in `src/app/organization/[id]/page.tsx` is wired to open `AddUserModal` with `isOrgMode={true}`, `canCreateAdmin={isOrganizationAdmin}`, `canCreateClerk={isOrganizationAdmin}`

---

## Phase 3: Logic

**Purpose**: Implement refreshKey pattern, hideAddButton RBAC gate, and enabled toggle in submit logic.

- [ ] T009 [US1] Add `refreshKey` state (`useState<number>(0)`) to `src/app/organization/[id]/page.tsx` and pass it to `UserManagementTab` as a prop that triggers user list re-fetch on increment
- [ ] T010 [US1] Add `handleUserCreated` callback in `src/app/organization/[id]/page.tsx` that increments `refreshKey` and pass it as `onSuccess` prop to `AddUserModal`
- [ ] T011 [US3] Pass `hideAddButton={!isOrganizationAdmin}` from `src/app/organization/[id]/page.tsx` to `UserManagementTab` — "Add User" button is hidden for `OrganizationClerk` role (FR-006)
- [ ] T012 [US1] Update `AddUserModal` `handleSubmit` to pass `enabled: formData.enabled` in the `createUser`/`createSiteUser` payload instead of using the hardcoded `enabled: true`

---

## Phase 4: API

**Purpose**: Update `CreateUserPayload` type and `createUser()` service function to accept `enabled` parameter.

- [ ] T013 Update `CreateUserPayload` interface in `src/app/organization/services/api.ts` (or `src/app/organization/types/index.ts`) to include `enabled: boolean` (was previously omitted with hardcoded `true`)
- [ ] T014 Modify `createUser()` in `src/app/organization/services/api.ts` — replace `enabled: true` hardcoded value with `payload.enabled` (or `userData.enabled`) from caller

---

## Phase 5: Backend

**Purpose**: Verify the backend accepts `enabled: false` at creation and invitation email is sent by backend.

- [ ] T015 Confirm POST `/api/v1/organizations/{orgId}/users` contract: `CreateUserPayload` with `enabled: false` returns `201` and user is created disabled; confirm backend sends invitation email on creation
- [ ] T016 [P] Confirm POST with duplicate email returns `409` with user-friendly message "This email address is already registered in the system."

---

## Phase 6: Security

**Purpose**: Enforce RBAC — OrgClerk cannot see Add User button and cannot assign roles beyond their permission.

- [ ] T017 [US3] Verify `hideAddButton={!isOrganizationAdmin}` is applied in `src/app/organization/[id]/page.tsx` so `OrganizationClerk` navigating to the org dashboard never sees the "Add User" button (FR-006)
- [ ] T018 [US3] Verify `canCreateAdmin=false` for non-admin callers causes the `OrganizationAdmin` option to be absent from the role dropdown in `AddUserModal.tsx` — no client-side workaround should re-enable it
- [ ] T019 Verify no email or user name is logged in `AddUserModal.tsx` submit handler or in the API service call; only log safe IDs

---

## Phase 7: Testing

**Purpose**: Unit and E2E coverage for all three user stories.

- [ ] T020 [P] [US1] Write unit test `src/components/modals/__tests__/AddUserModal.test.tsx` — renders in org-mode with only OrgAdmin and OrgClerk role options when `canCreateAdmin=true`; `canCreateAdmin=false` hides OrgAdmin option; `enabled` toggle defaults to false; submit with empty fields shows inline errors; valid submit calls `createUser`; 409 response shows error toast
- [ ] T021 [P] [US3] Write unit test `src/app/organization/[id]/__tests__/page.test.tsx` — "Add User" button hidden when `isOrganizationAdmin=false`; "Add User" button shown when `isOrganizationAdmin=true`; `onSuccess` callback increments `refreshKey`
- [ ] T022 [P] [US2] Write unit test for duplicate email flow — mock `createUser` to return 409; assert `showError` called with correct message; assert no user appears in list
- [ ] T023 Write E2E test `e2e/002-organization-user-creation.spec.ts` — OrgAdmin adds OrgClerk successfully; OrgClerk cannot see Add User button; duplicate email shows error; required field validation fires on submit

---

## Phase 8: Logging

**Purpose**: Add structured console logging with no PII.

- [ ] T024 Add `console.log('[CreateUser] Creating org user')` (no email/name) before API call in `AddUserModal.tsx`; `console.log('[CreateUser] Created, id:', id)` on success; `console.error('[CreateUser] Error:', error.message)` on failure; `console.warn('[CreateUser] Duplicate email attempted')` on 409 — never log `emailId`, name, or token

---

## Phase 9: Quality Gates

**Purpose**: All pre-commit checks must pass.

- [ ] T025 Run `npm run type-check` — fix TypeScript errors in modified `AddUserModal.tsx`, `api.ts`, `types/index.ts`, and `[id]/page.tsx`
- [ ] T026 [P] Run `npm run lint` — fix all ESLint warnings in modified files
- [ ] T027 Run `npm run build` — production build passes
- [ ] T028 [P] Run `npm run test` — all new and existing unit tests pass

---

## Phase 10: Finalization

**Purpose**: Final cleanup and commit.

- [ ] T029 Confirm `refreshKey` prop is actually consumed by `UserManagementTab` — verify the tab re-fetches user list when `refreshKey` changes (check `UserManagementTab.tsx` `useEffect` dependency array)
- [ ] T030 [P] Confirm `AddUserModal` `enabled` toggle is only rendered in org-mode flow (not accidentally shown in site-user flow)
- [ ] T031 Commit: `feat(002): add enabled toggle to AddUserModal; wire hideAddButton and refreshKey for org user creation`

---

## Dependencies

- **Setup (Phase 1)**: Start immediately — read-only audit
- **UI (Phase 2)**: Depends on Setup (T001–T004)
- **Logic (Phase 3)**: Depends on Setup; T009–T011 depend on T002 findings
- **API (Phase 4)**: Depends on T003 (confirmed gap); T013–T014 can run parallel with UI
- **Backend (Phase 5)**: Depends on API (Phase 4)
- **Security (Phase 6)**: Depends on UI (Phase 2) + Logic (Phase 3)
- **Testing (Phase 7)**: Depends on UI + Logic + API
- **Quality Gates (Phase 9)**: Depends on all implementation phases

### Parallel Opportunities

```
After Setup:
  [Parallel] UI (T005-T008) + Logic (T009-T012) + API (T013-T014)

After Implementation:
  [Parallel] T025 (type-check) + T026 (lint) + T028 (tests)
```
