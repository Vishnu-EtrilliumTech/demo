# Implementation Plan: System User Management

**Branch**: `031-system-user-management` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/031-system-user-management/spec.md`

---

## 1. Overview

### What Exists

- `src/app/admin-dashboard/` — Admin dashboard with legal experts, client list, appointment list, payment list pages (all partial stubs).
- No system user management page exists.
- `src/app/organization/services/api.ts` — org/site user API patterns available as reference.
- `src/services/httpServices.ts` — Axios client with Bearer token injection.

### Gaps to Close

1. **System Users list page**: Create `/admin-dashboard/system-users/page.tsx` listing all SystemAdmin and SupportEngineer accounts with name, email, role, enabled status.
2. **Create system user (admin-add)**: SystemAdmin can create accounts for other staff — form with full name, email, role (SystemAdmin or SupportEngineer only).
3. **Self-register flow**: SystemAdmin can register their own account linked to current login email.
4. **Edit system user**: SystemAdmin edits any user; SupportEngineer edits only own profile.
5. **Delete system user**: SystemAdmin only; requires confirmation dialog.
6. **Role dropdown constraint**: Only SystemAdmin and SupportEngineer options — no org/site roles.
7. **Duplicate email validation**: Before or after submission.
8. Add unit and E2E tests.

### What Is New

- `src/app/admin-dashboard/system-users/page.tsx` — list route
- `src/app/admin-dashboard/system-users/components/SystemUsersListView.tsx`
- `src/app/admin-dashboard/system-users/components/SystemUserCreateModal.tsx`
- `src/app/admin-dashboard/system-users/components/SystemUserEditModal.tsx`
- `src/app/admin-dashboard/system-users/services/api.ts`
- `src/app/admin-dashboard/system-users/types/index.ts`
- Unit tests and E2E tests

---

## 2. Architecture Flow

### 2.1 View System Users List

```
SystemAdmin or SupportEngineer navigates to /admin-dashboard/system-users
  → SystemUsersListView mounts
  → Keycloak check → role === SystemAdmin || SupportEngineer
  → fetchSystemUsers()
      → GET /api/v1/system-users
  → loading → <LoadingState /> (MUI Skeleton rows)
  → renders table: full name, email, role, enabled/disabled badge, actions
  → SystemAdmin: "Add User" button, Edit + Delete on each row (not self for delete)
  → SupportEngineer: no "Add User", no edit/delete on others (read-only list)
```

### 2.2 Admin Creates System User (Admin-Add)

```
SystemAdmin clicks "Add User"
  → SystemUserCreateModal opens
  → Fields: full name, email, role (Select: SystemAdmin | SupportEngineer)
  → Validation: name required, email valid, role required
  → Submit → createSystemUser({ fullName, email, role })
      → POST /api/v1/system-users
  → 201 → modal closes → list refreshes → new user at top
  → 409 (duplicate email) → inline error: "This email is already registered."
  → 400 → show validation errors
```

### 2.3 Admin Self-Register Flow

```
SystemAdmin clicks "Register My Account"
  → Self-register modal opens (or separate page at /admin-dashboard/system-users/self-register)
  → Email field pre-filled from Keycloak token (read-only)
  → Full name field editable
  → Role: SystemAdmin (pre-selected, read-only for self-register)
  → Submit → selfRegisterSystemUser({ fullName, role: 'SystemAdmin' })
      → POST /api/v1/system-users/self-register
  → 201 → success toast → account linked to current session
  → 409 → "Your account is already registered."
```

### 2.4 Edit System User

```
SystemAdmin clicks Edit on any user row
  → SystemUserEditModal opens (pre-filled)
  → Fields: full name, email, phone, gender, role (Select: SystemAdmin | SupportEngineer only), enabled toggle
  → Role dropdown: ONLY SystemAdmin and SupportEngineer options — no org/site roles
  → Submit → updateSystemUser(userId, payload)
      → PUT /api/v1/system-users/{userId}
  → 200 → modal closes → list row updated → showSuccess
  → 400 (invalid role) → "Roles must be system-level only."

SupportEngineer editing own profile:
  → Navigate to /admin-dashboard/profile or own row
  → Same edit form but accessible only for own userId
  → canEdit = isSelf(user.id)
  → no edit button on other rows
```

### 2.5 Delete System User

```
SystemAdmin clicks Delete
  → ConfirmDialog: "Delete this system user account? This action cannot be undone."
  → Confirm → deleteSystemUser(userId)
      → DELETE /api/v1/system-users/{userId}
  → 204 → user removed from list → showSuccess
  → error → showError via errorHandler
```

### 2.6 RBAC Summary

```
SystemUsersListView
  → canCreate = isSystemAdmin
  → canEditAny = isSystemAdmin
  → canDelete = isSystemAdmin
  → canEditSelf = isSystemAdmin || isSupportEngineer
  → isSelf = (userId: string) => userId === currentUser.id

  "Add User" button: {canCreate && <AddUserButton />}
  Per row:
    Edit: {(canEditAny || (canEditSelf && isSelf(user.id))) && <EditButton />}
    Delete: {canDelete && <DeleteButton />}
  SupportEngineer: only own row has Edit button; no Delete buttons visible
```

---

## 3. File Structure

### Documentation

```
specs/031-system-user-management/
  spec.md                                          NO CHANGE
  plan.md                                          NEW (this file)
  research.md                                      NEW
  data-model.md                                    NEW
  contracts/
    api-contracts.md                               NEW
```

### Source Tree

```
src/app/admin-dashboard/
  system-users/
    page.tsx                                       NEW — system users list route
    components/
      SystemUsersListView/
        SystemUsersListView.tsx                    NEW — list + RBAC controls
        SystemUserCreateModal.tsx                  NEW — admin-add form
        SystemUserEditModal.tsx                    NEW — edit form (role restricted)
        __tests__/
          SystemUsersListView.test.tsx             NEW
          SystemUserCreateModal.test.tsx           NEW
    services/
      api.ts                                       NEW — CRUD API calls
    types/
      index.ts                                     NEW — SystemUser interface

e2e/
  031-system-user-management.spec.ts               NEW
```

---

## 4. Component Design

### 4.1 `SystemUsersListView`

- **Purpose**: Renders all system-level staff accounts with RBAC-gated controls.
- **Columns (MUI Table)**: Full Name, Email, Role, Status (enabled/disabled), Actions.
- **Role chip**: MUI `<Chip>` colored distinctly for SystemAdmin vs SupportEngineer.
- **"Add User" button**: Rendered only when `isSystemAdmin`.
- **SupportEngineer view**: Same table but no "Add User", no Edit/Delete on other rows.
- **Empty state**: `<EmptyState message="No system users found." />`

### 4.2 `SystemUserCreateModal`

- **Purpose**: Admin-add form for creating new system staff accounts.
- **Fields**: Full name (required), Email (required, validated), Role (MUI Select: SystemAdmin | SupportEngineer — no other options).
- **Role dropdown values** (hard-coded, not from API):
  ```typescript
  const SYSTEM_ROLES = ['SystemAdmin', 'SupportEngineer'] as const;
  ```
- **Duplicate email handling**: Show inline error on 409 response.
- **Validation**: `useFormValidation` with name, email, role rules.

### 4.3 `SystemUserEditModal`

- **Purpose**: Edit system user details with role constraint.
- **Fields**: Full name (required), Email (required), Phone, Gender (MUI Select), Role (MUI Select: SystemAdmin | SupportEngineer only), Enabled (MUI Switch).
- **Role constraint enforcement**:
  ```typescript
  // Role select options — never includes org or site roles
  const roleOptions = ['SystemAdmin', 'SupportEngineer'];
  ```
- **SupportEngineer editing own profile**: Same form, accessible only for own user ID.

### 4.4 Self-Register Flow

- Separate "Register My Account" action (button in list or standalone page).
- Email pre-populated from `keycloak.tokenParsed?.email` — read-only.
- Submits to dedicated self-register endpoint to prevent impersonation.

---

## 5. API Plan

| Method | URL | Auth | Request Body | Success | Error Codes | Status |
|--------|-----|------|--------------|---------|-------------|--------|
| `GET` | `/api/v1/system-users` | Bearer (SystemAdmin, SupportEngineer) | — | `{ items: SystemUser[], totalCount, page, pageSize }` 200 | 401, 403 | NEW |
| `POST` | `/api/v1/system-users` | Bearer (SystemAdmin only) | `CreateSystemUserRequest` | `{ data: SystemUser }` 201 | 400, 401, 403, 409 | NEW |
| `POST` | `/api/v1/system-users/self-register` | Bearer (SystemAdmin) | `{ fullName: string }` | `{ data: SystemUser }` 201 | 401, 403, 409 | NEW |
| `GET` | `/api/v1/system-users/{userId}` | Bearer (SystemAdmin, own SupportEngineer) | — | `{ data: SystemUser }` 200 | 401, 403, 404 | NEW |
| `PUT` | `/api/v1/system-users/{userId}` | Bearer (SystemAdmin, own SupportEngineer) | `UpdateSystemUserRequest` | `{ data: SystemUser }` 200 | 400, 401, 403, 404 | NEW |
| `DELETE` | `/api/v1/system-users/{userId}` | Bearer (SystemAdmin only) | — | 204 | 401, 403, 404 | NEW |

**`SystemUser` interface**:
```typescript
interface SystemUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  gender?: string;
  role: 'SystemAdmin' | 'SupportEngineer';
  enabled: boolean;
  createdAt: string;
}

interface CreateSystemUserRequest {
  fullName: string;
  email: string;
  role: 'SystemAdmin' | 'SupportEngineer';
}

interface UpdateSystemUserRequest {
  fullName: string;
  email: string;
  phoneNumber?: string;
  gender?: string;
  role: 'SystemAdmin' | 'SupportEngineer';
  enabled: boolean;
}
```

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| Role escalation via edit form (setting org/site role) | Role dropdown is hard-coded to only SystemAdmin / SupportEngineer — no other options rendered; backend validates role value |
| SupportEngineer editing other users | Edit button hidden for non-own rows when role is SupportEngineer; backend returns 403 |
| Duplicate email via both create flows | 409 response handled inline; client shows "This email is already registered." |
| SupportEngineer accessing create endpoint | "Add User" button hidden; backend `[Authorize(Roles = "SystemAdmin")]` on POST |
| Self-register impersonation | Self-register endpoint derives email from JWT token claim — client cannot override email |
| SystemAdmin self-delete | Delete button could be shown for own row — disable it (same pattern as site/org user delete guard) |
| Sensitive admin credentials in logs | Only `userId`, `role`, `adminId` logged — no email values, no passwords |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `systemUsers` list | `SystemUsersListView` (local) | Page-scoped; not persisted |
| `userToEdit` | `SystemUsersListView` (local) | Edit modal selection state |
| `userToDelete` | `SystemUsersListView` (local) | Confirm dialog selection state |
| `createModalOpen`, `editModalOpen`, `deleteModalOpen` | `SystemUsersListView` (local) | Dialog visibility |
| `loading`, `error` | `SystemUsersListView` (local) | Async fetch state |
| Current user ID and role | Keycloak token / Redux auth slice | RBAC checks and self-edit guard |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `SystemUsersListView.test.tsx` | SystemAdmin role → "Add User" button visible | Button in DOM |
| `SystemUsersListView.test.tsx` | SupportEngineer role → "Add User" button hidden | Button absent |
| `SystemUsersListView.test.tsx` | SystemAdmin → Edit + Delete on other rows | Both controls on non-own rows |
| `SystemUsersListView.test.tsx` | SupportEngineer → Edit only on own row, no Delete visible | Only own edit button |
| `SystemUsersListView.test.tsx` | Empty users list → EmptyState shown | Empty state text |
| `SystemUserCreateModal.test.tsx` | Role dropdown only has SystemAdmin + SupportEngineer | Exactly 2 options |
| `SystemUserCreateModal.test.tsx` | Duplicate email (409) → inline error shown | Error text "already registered" |
| `SystemUserCreateModal.test.tsx` | Valid form submit → createSystemUser called | API mock invoked |
| `SystemUsersListView.test.tsx` | Delete → ConfirmDialog opens | Dialog in DOM |
| `SystemUsersListView.test.tsx` | Edit system user → role dropdown excludes org roles | No OrgAdmin option present |

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| View system users | SystemAdmin | Navigate to system users | List with name/email/role shown |
| Create system user | SystemAdmin | Add User, fill form, save | New user in list |
| Duplicate email blocked | SystemAdmin | Add User with existing email | Error message shown |
| Edit system user — role only system roles | SystemAdmin | Edit, open role dropdown | Only SystemAdmin/SupportEngineer options |
| Delete system user | SystemAdmin | Delete, confirm | User removed from list |
| SupportEngineer read-only | SupportEngineer | Navigate to system users | List visible, no Add/Delete, only own Edit |
| SupportEngineer edits own profile | SupportEngineer | Click Edit on own row, update name | Updated name shown |
| SupportEngineer cannot edit other | SupportEngineer | Navigate to other user's edit | Edit button not accessible |

Test file: `e2e/031-system-user-management.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-001: System users list within 2s | Lightweight GET; MUI Skeleton during fetch; system users typically ≤50 |
| SC-002: Role dropdown never presents non-system roles | Hard-coded array `['SystemAdmin', 'SupportEngineer']` — no API call for roles |
| SC-003: SupportEngineer cannot edit/delete others | `canEditAny` check is synchronous; buttons never rendered for non-own rows |
| `React.memo` on user rows | Prevents re-renders when modal state changes |
| No pagination needed initially | System user count expected to be small (≤20); add pagination if >50 |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| System user list fetched | INFO | `requesterId`, `role`, count returned | — |
| System user created | INFO | `newUserId`, `role`, `createdByAdminId` | Email, name |
| Self-register completed | INFO | `newUserId`, `role` | Email |
| System user updated | INFO | `targetUserId`, `updatedByUserId`, fields changed (keys) | Field values |
| System user deleted | INFO | `targetUserId`, `deletedByAdminId` | — |
| Role escalation attempt (non-system role submitted) | WARN | `requesterId`, `attemptedRole` | — |
| SupportEngineer attempts to edit other user | WARN | `requesterId`, `targetUserId` | — |
| Duplicate email (409) | INFO | endpoint only, no email value | Email address |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| System user API endpoints do not exist yet | High | High | New feature requiring backend — confirm endpoint paths and shapes in research phase |
| Keycloak role name mismatch (`SystemAdmin` vs `system_admin` vs `ROLE_SYSTEM_ADMIN`) | High | High | Confirm exact Keycloak role claim values before building RBAC checks; use `useUserRole()` hook consistently |
| Self-register endpoint not distinct from admin-add (same POST) | Medium | Medium | Clarify with backend — if same endpoint, server must derive email from token, not from request body |
| SupportEngineer's own `userId` not available from Keycloak token | Medium | Medium | Confirm Keycloak token includes `sub` claim that maps to system user ID; may need a "get current user" API call |
| Admin user list includes org/site users accidentally | Low | Low | Confirm `GET /api/v1/system-users` returns only SystemAdmin and SupportEngineer accounts |
| Delete of SystemAdmin account leaving zero admins | Low | High | Backend should prevent deletion of last SystemAdmin; surface appropriate error message if blocked |
