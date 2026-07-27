# Implementation Plan: Organization User Management

**Branch**: `025-org-user-management` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/025-org-user-management/spec.md`

---

## 1. Overview

### What Exists
- `src/app/organization/services/api.ts`:
  - `fetchOrganizationUsers(orgId)` → `GET /organizations/{id}/users`
  - `fetchUser(orgId, userId)` → `GET /organizations/{id}/users/{userId}`
  - `updateUser(orgId, userId, payload)` → `PUT /organizations/{id}/users/{userId}`
  - `deleteOrganizationUser(orgId, userId)` → `DELETE /organizations/{id}/users/{userId}`
  - `fetchSiteUsers(orgId, siteId)` → `GET /organizations/{id}/sites/{siteId}/users`
  - `updateSiteUser(orgId, siteId, userId, payload)` → `PUT /organizations/{id}/sites/{siteId}/users/{userId}`
  - `deleteSiteUser(orgId, siteId, userId)` → `DELETE /organizations/{id}/sites/{siteId}/users/{userId}`
- `src/app/organization/components/UserManagementTab.tsx` — 522-line component with grid/table views, search filtering, `EditUserModal`, delete confirmation.

### Gaps to Close
1. **RBAC gate on edit/delete**: Confirm `EditUserModal` and delete buttons are hidden for `OrganizationClerk` (read-only).
2. **Self-deletion guard**: Confirm the delete button is disabled or hidden when viewing the current user's own profile. Show error "You cannot delete your own account."
3. **Email search validation**: Confirm the search field validates email format before submitting (validation error for malformed input).
4. **Site users in org list**: Confirm `UserManagementTab` shows both org-level users AND site users in one combined view, with a "Site" column for site-assigned users.
5. **OrgClerk read-only view**: Confirm clerk sees the list but no edit/delete controls.
6. **Site-level access denied**: Confirm site roles see an access denied message when reaching the org user list URL.
7. Add unit and E2E tests.

### What Is New
- Unit tests: `UserManagementTab.test.tsx`
- E2E test: `e2e/025-org-user-management.spec.ts`

---

## 2. Architecture Flow

### 2.1 View All Users

```
OrgAdmin navigates to /organization/{orgId}/users (or Users tab)
  → UserManagementTab mounts
  → useUserRole(orgId) → isOrgAdmin || isOrgClerk || isSystemAdmin
  → if site role → access denied
  → fetchOrganizationUsers(orgId)
      → GET /organizations/{orgId}/users
      → returns: org-level users (OrgAdmin, OrgClerk) + all site users across all sites
  → loading → <LoadingState />
  → list: full name, email, role, site name (if site user), enabled/disabled badge
  → OrgAdmin → edit + delete buttons on each row
  → OrgClerk → read-only (no buttons)
```

### 2.2 Search by Email

```
OrgAdmin types in search field
  → onBlur/onChange → validate email format
  → if invalid → inline error: "Please enter a valid email address."
  → if valid → searchUsers(email)
      → GET /organizations/{orgId}/users?email={email} (or client-side filter)
  → match found → show single user row
  → no match → "No user found with that email address."
```

### 2.3 View and Edit User

```
OrgAdmin clicks user row
  → EditUserModal opens (or user detail panel)
  → Pre-filled fields: full name, phone, email, gender (dropdown), enabled toggle
  → NO role field (roles not editable)
  → OrgAdmin submits → updateUser(orgId, userId, payload)
      → PUT /organizations/{orgId}/users/{userId} (org-level user)
      → or PUT /organizations/{orgId}/sites/{siteId}/users/{userId} (site user)
  → 200 → showSuccess → update user in list
  → 400 → inline errors
```

### 2.4 Delete User

```
OrgAdmin clicks "Delete" on user row
  → if userId === currentUser.id → disable/hide Delete button → "You cannot delete your own account."
  → else → ConfirmDialog: "Are you sure? This user will be permanently removed."
  → Confirm → deleteOrganizationUser(orgId, userId)
      → DELETE /organizations/{orgId}/users/{userId}
      → or deleteSiteUser(orgId, siteId, userId) for site users
  → 204 → user removed from list → showSuccess
  → error → showError
```

### 2.5 RBAC Summary

```
UserManagementTab renders
  → useUserRole(orgId) → role
  → OrgAdmin: list + edit + delete (not self)
  → OrgClerk: list only (no edit, no delete)
  → SystemAdmin: list + edit + delete (not self)
  → SupportEngineer: list only
  → Site-level roles → access denied (no list)
```

---

## 3. File Structure

### Documentation
```
specs/025-org-user-management/
  spec.md                         NO CHANGE
  plan.md                         NEW (this file)
  research.md                     NEW
  data-model.md                   NEW
  contracts/
    api-contracts.md              NEW
```

### Source Tree
```
src/app/organization/
  components/
    UserManagementTab/
      UserManagementTab.tsx       VERIFY — OrgClerk read-only, self-delete guard, email search validation, combined org+site users list
      EditUserModal.tsx           VERIFY — no role field, all other fields pre-filled
      __tests__/
        UserManagementTab.test.tsx  NEW

src/app/organization/services/
  api.ts                          VERIFY — fetchOrganizationUsers returns combined org+site users; confirm response shape

src/app/organization/types/
  index.ts                        VERIFY — OrgUser interface includes siteName field

e2e/
  025-org-user-management.spec.ts  NEW
```

---

## 4. Component Design

### 4.1 `UserManagementTab`
- **Purpose**: Displays all org users (org-level + site users) with CRUD controls.
- **Layout toggle**: Grid view / Table view (already in existing component).
- **Columns (table view)**: Full name, Email, Role, Site Name (blank for org-level users), Enabled badge, Actions.
- **Search**: Email search field with format validation.
- **RBAC rendering**:
  ```typescript
  const canEdit = isOrgAdmin || isSystemAdmin;
  const canDelete = isOrgAdmin || isSystemAdmin;
  const isSelf = (userId: string) => userId === currentUser.id;

  // Per row:
  {canEdit && !isSelf(user.id) && <EditButton />}
  {canDelete && !isSelf(user.id) && <DeleteButton />}
  // For own row:
  {isSelf(user.id) && <Tooltip title="You cannot delete your own account"><span><DeleteButton disabled /></span></Tooltip>}
  ```
- **Empty state**: `<EmptyState message="No users in this organization yet." />`

### 4.2 `EditUserModal`
- **Purpose**: Edit user profile fields.
- **Props**: `{ user: OrgUser, onSuccess: (updated: OrgUser) => void }`
- **Fields**: Full name (req), Phone number, Email (req), Gender (MUI Select: Male/Female/Other/Prefer not to say), Enabled (MUI Switch toggle).
- **No role field** — roles are not editable on this form.
- **Validation**: `useFormValidation` with user update schema.
- **API routing**: If `user.siteId` exists → call `updateSiteUser`; else → `updateUser`.

### 4.3 Email Search
- **Behavior**: Validates format on submit; client-side filter on the already-fetched user list (no additional API call for search — search in local state).
- **Case insensitive**: `users.filter(u => u.email.toLowerCase().includes(searchEmail.toLowerCase()))`.

---

## 5. API Plan

| Method | URL | Auth | Request Body | Success | Error Codes | Status |
|--------|-----|------|--------------|---------|-------------|--------|
| `GET` | `/organizations/{orgId}/users` | Bearer (OrgAdmin, OrgClerk, SysAdmin) | — | `{ data: OrgUser[] }` 200 | 401, 403 | Existing |
| `GET` | `/organizations/{orgId}/users/{userId}` | Bearer (OrgAdmin, OrgClerk, SysAdmin) | — | `{ data: OrgUser }` 200 | 401, 403, 404 | Existing |
| `PUT` | `/organizations/{orgId}/users/{userId}` | Bearer (OrgAdmin, SysAdmin) | `UpdateUserRequest` | `{ data: OrgUser }` 200 | 400, 401, 403, 404 | Existing |
| `DELETE` | `/organizations/{orgId}/users/{userId}` | Bearer (OrgAdmin, SysAdmin) | — | 204 | 401, 403, 404 | Existing |
| `PUT` | `/organizations/{orgId}/sites/{siteId}/users/{userId}` | Bearer (OrgAdmin, SysAdmin) | `UpdateUserRequest` | `{ data: OrgUser }` 200 | 400, 401, 403, 404 | Existing |
| `DELETE` | `/organizations/{orgId}/sites/{siteId}/users/{userId}` | Bearer (OrgAdmin, SysAdmin) | — | 204 | 401, 403, 404 | Existing |

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| OrgClerk editing a user | Edit button hidden for OrgClerk; backend enforces `[Authorize]` |
| Self-deletion | Delete button disabled/hidden when `userId === currentUser.id`; even if API called, backend should reject |
| Site roles accessing org user list | Role check on tab mount → access denied; backend returns 403 |
| Email stored as lowercase | `payload.email = email.toLowerCase()` before API call |
| Role field editable via dev tools | `EditUserModal` does not include role field; backend does not accept role changes from this endpoint |
| Email search exposing all user data | Email search is client-side filter on already-fetched list; no additional API call; only org-scoped data |
| XSS via user-entered name/email | Controlled MUI inputs; rendered as text nodes |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `users` list | `UserManagementTab` (local) | Tab-scoped; not persisted |
| `searchEmail` | `UserManagementTab` (local) | UI filter state; ephemeral |
| `userToEdit`, `userToDelete` | `UserManagementTab` (local) | Modal selection state |
| `editModalOpen`, `deleteModalOpen` | `UserManagementTab` (local) | Dialog visibility |
| `loading`, `error` | `UserManagementTab` (local) | Async state |
| Current user ID | Redux `auth` / Keycloak token | Used for self-deletion guard |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `UserManagementTab.test.tsx` | OrgAdmin role → Edit + Delete on non-self users | Both controls visible |
| `UserManagementTab.test.tsx` | OrgAdmin views own row → Delete disabled/hidden | No active delete on own row |
| `UserManagementTab.test.tsx` | OrgClerk role → no edit or delete controls | Controls absent |
| `UserManagementTab.test.tsx` | SiteAdmin role → access denied shown | Access denied text |
| `UserManagementTab.test.tsx` | Email search — valid email → filters list | Filtered results |
| `UserManagementTab.test.tsx` | Email search — invalid format → validation error | Error text rendered |
| `UserManagementTab.test.tsx` | Delete → ConfirmDialog opens | Dialog in DOM |
| `UserManagementTab.test.tsx` | Edit submit → updateUser called | API mock invoked |
| `UserManagementTab.test.tsx` | Empty user list → EmptyState shown | Empty state text |
| `UserManagementTab.test.tsx` | Site user in list → site name column populated | Site name visible |

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| View all users | OrgAdmin | Navigate to org users | Org + site users in combined list |
| Search by email | OrgAdmin | Enter valid email in search | Matching user shown |
| Invalid email search | OrgAdmin | Enter "not-an-email" in search | Validation error shown |
| Edit user | OrgAdmin | Click edit, update name, save | Updated name in list |
| Delete user | OrgAdmin | Delete, confirm | User removed from list |
| Self-delete blocked | OrgAdmin | Click delete on own row | Button disabled or error shown |
| OrgClerk read-only | OrgClerk | Navigate to org users | List visible, no edit/delete |
| Site role access denied | SiteAdmin | Navigate to org users URL | Access denied message |

Test file: `e2e/025-org-user-management.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-001: Org user list within 2s for ≤50 users | Lightweight GET; `LoadingState` shown during fetch |
| SC-002: OrgClerk read-only without controls | Role check is synchronous; no flash of controls |
| SC-003: Self-deletion always blocked | `isSelf` check computed from Redux current user ID — available synchronously |
| SC-004: Email search within 2s | Client-side filter on already-loaded `users` array; O(n) — instant for ≤200 users |
| `React.memo` on user rows | Applied to prevent re-renders when unrelated state changes |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| User list fetched | INFO | `orgId`, `userId` (requester), count returned | User email/name list |
| User updated | INFO | `orgId`, `targetUserId`, fields changed (keys) | Field values, phone number |
| User deleted | INFO | `orgId`, `targetUserId`, `deletedByUserId` | — |
| Self-delete attempt blocked | WARN | `userId`, `orgId` | — |
| OrgClerk edit attempt (if somehow triggered) | WARN | `userId`, `role`, `targetUserId` | — |
| Unauthorized org user list access | WARN | `userId`, `role`, `orgId` | — |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `fetchOrganizationUsers` returns only org-level users (not site users) | Medium | High | Confirm API returns combined list with `siteName` for site users; if not, may need to merge `fetchSiteUsers` results client-side |
| OrgClerk edit controls visible (missed in existing code) | Medium | High | Audit `UserManagementTab.tsx` line by line for every `<Button>` / `<IconButton>` and verify role check |
| Self-deletion guard missing (currentUser.id not in scope) | Medium | High | Verify `currentUser.id` is accessible from Keycloak context or Redux; add guard if missing |
| Email stored case-sensitively on update | Low | Low | Confirm `email.toLowerCase()` applied before `updateUser` call |
| Site user delete uses wrong endpoint | Medium | Medium | `user.siteId != null` → use `deleteSiteUser`; `user.siteId == null` → use `deleteOrganizationUser` |
| Role field accidentally included in `EditUserModal` | Low | High | Verify `EditUserModal` renders only: name, phone, email, gender, enabled — no role field |
