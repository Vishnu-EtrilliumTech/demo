# Implementation Plan: Site User Management

**Branch**: `026-site-user-management` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/026-site-user-management/spec.md`

---

## 1. Overview

### What Exists

- `src/app/organization/services/api.ts`:
  - `fetchSiteUsers(orgId, siteId)` → `GET /organizations/{orgId}/sites/{siteId}/users`
  - `fetchSiteUser(orgId, siteId, userId)` → `GET /organizations/{orgId}/sites/{siteId}/users/{userId}`
  - `updateSiteUser(orgId, siteId, userId, payload)` → `PUT /organizations/{orgId}/sites/{siteId}/users/{userId}`
  - `deleteSiteUser(orgId, siteId, userId)` → `DELETE /organizations/{orgId}/sites/{siteId}/users/{userId}`
- `src/app/organization/[id]/sites/[siteId]/users/[userId]/page.tsx` — basic site user detail page (stub)

### Gaps to Close

1. **Site Users list page**: No dedicated `SiteUsersListPage` component — create list page at `src/app/organization/[id]/sites/[siteId]/users/page.tsx` showing all users with name, email, role, enabled badge.
2. **RBAC gate on edit/delete**: SiteClerk must see list in read-only mode; OrgAdmin, SiteAdmin, SystemAdmin get delete; SiteSrLegalExpert and SiteLegalExpert get edit but not delete.
3. **Self-deletion guard**: Delete button disabled/hidden when `userId === currentUser.id`.
4. **Edit form**: UserEditModal with fields: full name, phone, email, gender, enabled. No role field.
5. **Role display**: Role shown as read-only badge on user card/row — no edit control.
6. **Empty state**: Friendly message when site has no users.
7. **Confirmation dialog**: Required before delete.
8. Add unit and E2E tests.

### What Is New

- `src/app/organization/[id]/sites/[siteId]/users/page.tsx` — Site users list page
- `src/app/organization/[id]/sites/[siteId]/users/components/SiteUsersListView.tsx`
- `src/app/organization/[id]/sites/[siteId]/users/components/SiteUserEditModal.tsx`
- Unit tests: `SiteUsersListView.test.tsx`
- E2E test: `e2e/026-site-user-management.spec.ts`

---

## 2. Architecture Flow

### 2.1 View All Users in a Site

```
Any site/org user navigates to /organization/{orgId}/sites/{siteId}/users
  → SiteUsersListView mounts
  → useUserRole(orgId, siteId) → role
  → fetchSiteUsers(orgId, siteId)
      → GET /organizations/{orgId}/sites/{siteId}/users
      → returns: SiteUser[] with fullName, email, role, enabled
  → loading → <LoadingState />
  → renders table: full name, email, role badge, enabled/disabled badge, actions column
  → SiteClerk / SiteSrLegalExpert / SiteLegalExpert → no delete control
  → OrgAdmin / SiteAdmin / SystemAdmin → edit + delete (not self)
  → empty → <EmptyState message="No users assigned to this site yet." />
```

### 2.2 View and Edit a Site User

```
Authorized user clicks user row or edit icon
  → SiteUserEditModal opens (pre-filled)
  → Fields: full name, phone, email, gender (MUI Select), enabled (MUI Switch)
  → NO role field
  → SiteClerk role → no modal trigger (edit button hidden)
  → user submits → validate via useFormValidation
  → updateSiteUser(orgId, siteId, userId, payload)
      → PUT /organizations/{orgId}/sites/{siteId}/users/{userId}
  → 200 → showSuccess toast → refresh list
  → 400 → inline field errors
```

### 2.3 Delete a Site User

```
OrgAdmin / SiteAdmin / SystemAdmin clicks Delete
  → if userId === currentUser.id → button disabled with tooltip "You cannot delete your own account."
  → else → ConfirmDialog opens: "Are you sure? This user will be permanently removed from this site."
  → Confirm → deleteSiteUser(orgId, siteId, userId)
      → DELETE /organizations/{orgId}/sites/{siteId}/users/{userId}
  → 204 → user removed from list → showSuccess
  → error → showError via errorHandler
```

### 2.4 RBAC Summary

```
SiteUsersListView
  → canEdit = isOrgAdmin || isSiteAdmin || isSiteSrLegalExpert || isSiteLegalExpert || isSystemAdmin || isSupportEngineer
  → canDelete = isOrgAdmin || isSiteAdmin || isSystemAdmin
  → isSelf = (userId: string) => userId === currentUser.id

  Per row:
    {canEdit && <EditButton />}
    {canDelete && !isSelf(user.id) && <DeleteButton />}
    {canDelete && isSelf(user.id) && <DeleteButton disabled tooltip="Cannot delete own account" />}
  SiteClerk: list visible, no edit or delete controls
```

---

## 3. File Structure

### Documentation

```
specs/026-site-user-management/
  spec.md                         NO CHANGE
  plan.md                         NEW (this file)
  research.md                     NEW
  data-model.md                   NEW
  contracts/
    api-contracts.md              NEW
```

### Source Tree

```
src/app/organization/[id]/sites/[siteId]/users/
  page.tsx                                     NEW — list page route
  components/
    SiteUsersListView/
      SiteUsersListView.tsx                    NEW — renders user table with RBAC controls
      SiteUserEditModal.tsx                    NEW — edit form modal (no role field)
      __tests__/
        SiteUsersListView.test.tsx             NEW

src/app/organization/services/
  api.ts                                       VERIFY — fetchSiteUsers, updateSiteUser, deleteSiteUser all present

src/app/organization/types/
  index.ts                                     VERIFY — SiteUser interface has: id, fullName, email, role, enabled, phoneNumber, gender

e2e/
  026-site-user-management.spec.ts             NEW
```

---

## 4. Component Design

### 4.1 `SiteUsersListView`

- **Purpose**: Renders all users assigned to a site with RBAC-gated controls.
- **Columns (MUI Table)**: Full Name, Email, Role, Status (enabled/disabled badge), Actions.
- **Role badge**: Read-only chip using MUI `<Chip>` — no edit control on role.
- **Enabled badge**: MUI `<Chip>` with green/grey color depending on `enabled`.
- **RBAC rendering**:
  ```typescript
  const canEdit = isOrgAdmin || isSiteAdmin || isSiteSrLegalExpert || isSiteLegalExpert || isSystemAdmin;
  const canDelete = isOrgAdmin || isSiteAdmin || isSystemAdmin;
  const isSelf = (userId: string) => userId === currentUser.id;
  ```
- **Empty state**: `<EmptyState message="No users assigned to this site yet." />`
- **Loading state**: MUI Skeleton rows during fetch.

### 4.2 `SiteUserEditModal`

- **Purpose**: Edit site user personal details (not role).
- **Props**: `{ open: boolean, user: SiteUser, onClose: () => void, onSuccess: (updated: SiteUser) => void }`
- **Fields**: Full name (required), Phone number, Email (required), Gender (MUI Select: Male/Female/Other/Prefer not to say), Enabled (MUI Switch).
- **No role field** — roles are not editable on this form.
- **Validation**: `useFormValidation` with update schema from `src/utils/validation.ts`.
- **Email stored lowercase**: `payload.email = email.toLowerCase()` before submit.

### 4.3 Confirm Delete Dialog

- Uses shared `ConfirmDialog` from `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/shared/ConfirmDialog.tsx`.
- Message: `"This user will be permanently removed from the site. This action cannot be undone."`

---

## 5. API Plan

| Method | URL | Auth | Request Body | Success | Error Codes | Status |
|--------|-----|------|--------------|---------|-------------|--------|
| `GET` | `/organizations/{orgId}/sites/{siteId}/users` | Bearer (site/org roles, SystemAdmin) | — | `{ data: SiteUser[] }` 200 | 401, 403 | Existing |
| `GET` | `/organizations/{orgId}/sites/{siteId}/users/{userId}` | Bearer (site/org roles, SystemAdmin) | — | `{ data: SiteUser }` 200 | 401, 403, 404 | Existing |
| `PUT` | `/organizations/{orgId}/sites/{siteId}/users/{userId}` | Bearer (OrgAdmin, SiteAdmin, SiteSrLegalExpert, SiteLegalExpert, SystemAdmin) | `UpdateSiteUserRequest` | `{ data: SiteUser }` 200 | 400, 401, 403, 404 | Existing |
| `DELETE` | `/organizations/{orgId}/sites/{siteId}/users/{userId}` | Bearer (OrgAdmin, SiteAdmin, SystemAdmin) | — | 204 | 401, 403, 404 | Existing |

**`UpdateSiteUserRequest`**:
```typescript
interface UpdateSiteUserRequest {
  fullName: string;
  phoneNumber?: string;
  email: string;       // stored lowercase
  gender?: string;
  enabled: boolean;
}
```

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| SiteClerk editing a user | Edit button hidden for SiteClerk via RBAC check; backend enforces `[Authorize]` |
| Unauthorized delete (SiteSrLegalExpert, SiteLegalExpert, OrgClerk) | Delete button hidden; backend returns 403 |
| Self-deletion | Delete button disabled when `userId === currentUser.id`; backend should also reject |
| Role field exposed via dev tools | `SiteUserEditModal` never includes role field; backend update endpoint ignores role field |
| Email stored case-sensitively | `payload.email = email.toLowerCase()` before API call |
| Cross-site user access | URLs scoped to `orgId` + `siteId`; backend validates user belongs to site |
| XSS via user-entered name/email | Controlled MUI inputs; values rendered as text nodes, not innerHTML |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `users` list | `SiteUsersListView` (local) | Page-scoped; not persisted across navigation |
| `userToEdit` | `SiteUsersListView` (local) | Modal selection state |
| `userToDelete` | `SiteUsersListView` (local) | Confirm dialog state |
| `editModalOpen`, `deleteModalOpen` | `SiteUsersListView` (local) | Dialog visibility |
| `loading`, `error` | `SiteUsersListView` (local) | Async fetch state |
| Current user ID | Keycloak token / Redux auth slice | Used for self-deletion guard |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `SiteUsersListView.test.tsx` | OrgAdmin role → Edit + Delete visible on non-self rows | Both controls rendered |
| `SiteUsersListView.test.tsx` | OrgAdmin on own row → Delete disabled with tooltip | Disabled delete shown |
| `SiteUsersListView.test.tsx` | SiteClerk role → no edit or delete controls | Controls absent |
| `SiteUsersListView.test.tsx` | SiteSrLegalExpert → edit visible, delete hidden | Only edit rendered |
| `SiteUsersListView.test.tsx` | Empty user list → EmptyState shown | Empty state text present |
| `SiteUsersListView.test.tsx` | Delete → ConfirmDialog opens | Dialog in DOM |
| `SiteUsersListView.test.tsx` | Edit submit → updateSiteUser called with lowercase email | API mock invoked |
| `SiteUsersListView.test.tsx` | Role column shows read-only chip | No role input rendered |

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| View site users list | SiteAdmin | Navigate to site users | All users shown with role badge |
| Edit site user | SiteAdmin | Click edit, update name, save | Updated name reflected |
| Delete site user | OrgAdmin | Delete, confirm | User removed from list |
| Self-delete blocked | SiteAdmin | Click delete on own row | Button disabled |
| SiteClerk read-only | SiteClerk | Navigate to site users | List visible, no edit/delete |
| Empty state | SiteAdmin | Site with no users | Empty state message shown |

Test file: `e2e/026-site-user-management.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-001: List renders within 2s for ≤20 users | Lightweight GET; MUI Skeleton during fetch |
| SC-002: SiteClerk read-only (zero controls flash) | RBAC check is synchronous from auth context; controls never rendered |
| SC-003: Self-deletion always blocked | `isSelf` check from Redux/Keycloak — available synchronously before render |
| SC-004: Edit save + list refresh within 2s | Single PUT + re-fetch; optimistic list update possible |
| `React.memo` on user rows | Prevents re-renders when unrelated modal state changes |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| Site user list fetched | INFO | `orgId`, `siteId`, `requesterId`, count returned | User PII (email, name) |
| Site user updated | INFO | `orgId`, `siteId`, `targetUserId`, fields changed (keys only) | Field values, phone number |
| Site user deleted | INFO | `orgId`, `siteId`, `targetUserId`, `deletedByUserId` | — |
| Self-delete attempt blocked | WARN | `userId`, `siteId` | — |
| Unauthorized delete attempt | WARN | `userId`, `role`, `targetUserId`, `siteId` | — |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `fetchSiteUsers` response shape mismatch (nested `data.data`) | Medium | High | Check actual API response — use `response.data?.data || response.data` pattern consistent with org API |
| Self-deletion guard: `currentUser.id` type mismatch (number vs string) | Medium | Medium | Normalize both to `String()` before comparison |
| SiteClerk edit controls visible due to missing role check | Medium | High | Audit every `<Button>` and `<IconButton>` in component for role guard |
| Role field accidentally editable via direct URL navigation to edit page | Low | High | Edit modal does not include role field; backend endpoint rejects role changes |
| `deleteSiteUser` uses wrong orgId/siteId from stale closure | Low | Medium | Pass `orgId` and `siteId` from route params directly; avoid capturing in stale closures |
