# Implementation Plan: Organization User Creation

**Branch**: `002-organization-user-creation` | **Date**: 2026-05-14 | **Spec**: [spec.md](./spec.md)

## Summary

Allow OrganizationAdmin (and SystemAdmin) to add new org staff (OrganizationAdmin or OrganizationClerk role) via an MUI Dialog modal form that calls `POST /api/v1/organizations/{orgId}/users`; on success the invitation email is auto-sent by the backend and the user list refreshes. The "Add User" button is hidden for OrgClerks at site level and for non-admin roles.

## Technical Context

| Category | Detail |
|---|---|
| Language/Version | TypeScript 5 strict, React 19 |
| Primary Dependencies | Next.js 15 App Router, MUI 6 Dialog, `useFormValidation`, `useToast`, `useUserRole` |
| Storage | Local `useState` for modal open/close and refresh key; no Redux |
| Testing | Vitest + React Testing Library, Playwright E2E |
| Target Platform | Web; modal appears on org dashboard user management tab |
| Performance Goals | Modal opens <100ms; form submit + list refresh <2s |
| Constraints | Role dropdown must show ONLY `OrganizationAdmin` and `OrganizationClerk`; `createUser()` already exists in `api.ts` |
| Scale/Scope | Single modal form, one API call |

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| I — Type Safety | PASS | `CreateUserPayload` interface exists in `api.ts`; `User` type in `types/index.ts` |
| II — Security | PASS | Client-side validation via `useFormValidation`; server validates on POST |
| III — Auth Consistency | PASS | `useUserRole` hook gates the "Add User" button before rendering |
| IV — API Contract | PASS | `createUser()` already exists; no breaking changes |
| V — Pre-commit Gates | PASS | tsc + eslint + next build required |
| VI — API Response Standards | PASS | Success → `showSuccess()`; errors → `showError()` |
| VII — No dangerouslySetInnerHTML | N/A | Not applicable |
| VIII — RBAC | PASS | Add User button hidden for OrgClerk per FR-006 |
| IX — Shared Components | PASS | `AddUserModal` already exists in `src/components/modals/AddUserModal.tsx` and is already used in org context |
| X — Business Logic | PASS | Submit logic in modal's `handleSubmit`; thin component |
| XI — Delete Confirmation | N/A | No delete in this spec |
| XII — Notifications | PASS | `showSuccess` on user created; `showError` on API failure |
| XIII — Redux | PASS | Not needed; user list managed by `refreshKey` pattern |
| XIV — API Envelope | PASS | `response.data?.data || response.data` pattern |

## 1. Overview

**What exists today**:
- `src/components/modals/AddUserModal.tsx` — a fully-implemented modal that handles both org-mode and site-mode user creation. It already uses `useFormValidation`, `useToast`, `createUser()`, `createSiteUser()`, and supports role filtering via `canCreateAdmin`/`canCreateClerk` props.
- `createUser()` in `api.ts` (lines 103–130) — posts to `POST /api/v1/organizations/{orgId}/users`.
- `src/app/organization/components/UserManagementTab.tsx` — already renders the user list; `hideAddButton` prop available.
- `useUserRole` hook with `isOrganizationAdmin`, `canManageOrganizationUsers` flags.

**Gaps to close (spec-specific requirements)**:
1. FR-006: The "Add User" button must be hidden for OrgClerk role. The existing `UserManagementTab` shows the button regardless of role when `hideAddButton=false`. Need to pass `hideAddButton={!isOrganizationAdmin}` from the parent page.
2. FR-007: After success, the user list must refresh. The `refreshKey` pattern in `UserManagementTab` supports this — parent must increment `refreshKey` on `onSuccess`.
3. The existing `AddUserModal` exposes org-mode and site-mode combined. For this spec, the org-mode flow (adding org-level roles) must be confirmed to pass `isOrgMode={true}` and `canCreateAdmin={isOrganizationAdmin}`, `canCreateClerk={isOrganizationAdmin}` (both require admin — clerks can't add other org users).
4. The enabled toggle (FR spec mentions default false) — the existing `createUser()` hardcodes `enabled: true` on line 113. This needs to be surfaced as a field in the form or confirmed with backend.

**What is new**:
- Minor prop wiring changes in the org dashboard page that invokes `AddUserModal` and `UserManagementTab`.
- `enabled` toggle field added to `AddUserModal` if not already present.

## 2. Architecture Flow

### Add Org User — Happy Path
```
OrgAdmin clicks "Add User" button (visible only to OrgAdmin — FR-006)
    |
    v
AddUserModal opens (Dialog) — isOrgMode=true
    |
    v
User fills: Full Name, Email, Phone, Gender, Role (OrgAdmin or OrgClerk), Enabled toggle
    |
    v
onChange → validateSingleField → inline error or clear
    |
    v
Submit → validate(formData) → all valid?
    |
    +-- invalid → show inline errors
    +-- valid → setIsSubmitting(true)
                    |
                    v
            createUser(orgId, { fullName, emailId, phoneNumber, gender, roles, enabled })
                    |
                    +-- success → showSuccess("User created successfully") 
                                → onSuccess() [parent increments refreshKey]
                                → onClose()
                    +-- 400/409 → extractApiErrors → showError OR inline field error
                    +-- network → showError("Failed to create user")
```

### Button Visibility (FR-006)
```
useUserRole(orgId)
    |
    +-- isOrganizationAdmin = true  → "Add User" button shown
    +-- isOrganizationAdmin = false → "Add User" button hidden (hideAddButton=true passed to UserManagementTab)
```

## 3. File Structure

### Documentation Tree
```
specs/002-organization-user-creation/
  spec.md                    NO CHANGE
  plan.md                    NEW (this file)
  research.md                NEW
  data-model.md              NEW
  contracts/
    api-contracts.md         NEW
```

### Source Code Tree
```
src/components/modals/
  AddUserModal.tsx           MODIFY — add enabled toggle field; confirm org-only role filtering

src/app/organization/
  [id]/page.tsx              MODIFY — pass hideAddButton={!isOrganizationAdmin} to UserManagementTab;
                                       increment refreshKey on onSuccess
  components/
    UserManagementTab.tsx    NO CHANGE — hideAddButton and refreshKey props already exist

src/app/organization/
  services/api.ts            MODIFY — accept enabled param in CreateUserPayload (currently hardcoded true)
  types/index.ts             NO CHANGE
```

## 4. Component Design

### `AddUserModal` (EXISTING — MODIFY `src/components/modals/AddUserModal.tsx`)

**Changes**:
1. Add `enabled` boolean field to `FormData` interface (default: `false` per spec FR-001).
2. Add MUI `Switch` or `Select` control for enabled toggle in the form.
3. Pass `enabled: formData.enabled` in the `createUser`/`createSiteUser` payload.
4. When `isOrgMode=true` and `isHQSelected=true`, restrict available roles to `['OrganizationAdmin', 'OrganizationClerk']` and apply `canCreateAdmin`/`canCreateClerk` prop filtering.

**Props Interface** (existing, no structural change):
```typescript
interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationId: string;
  isOrgMode: boolean;
  siteId?: string | null;
  canCreateAdmin: boolean;    // true = OrgAdmin only
  canCreateClerk: boolean;    // true = OrgAdmin only
  hideHeadOffice?: boolean;
}
```

**State additions**:
- `enabled: boolean` in `FormData` (default `false`)

**Render additions**:
- MUI `FormControlLabel` + `Switch` for "Enable user account on creation" — placed after Gender, before Site/Role.

### Org Dashboard Page (MODIFY — `src/app/organization/[id]/page.tsx`)

**Changes**:
- Pass `hideAddButton={!isOrganizationAdmin}` to `UserManagementTab`.
- Add `refreshKey` state and increment in `handleUserCreated` callback.
- Pass `canCreateAdmin={isOrganizationAdmin}` and `canCreateClerk={isOrganizationAdmin}` to `AddUserModal`.

## 5. API Plan

| Method | URL | Auth | Request Body | Success Response | Error Codes | Status |
|---|---|---|---|---|---|---|
| POST | `/api/v1/organizations/{orgId}/users` | Bearer | `CreateUserPayload` | 201 `{ data: User }` | 400, 401, 403, 409 | EXISTING (`createUser()`) |

**`CreateUserPayload`** (updated):
```typescript
interface CreateUserPayload {
  fullName: string;
  emailId: string;
  phoneNumber?: string;
  gender?: string;
  roles: string[];         // ['OrganizationAdmin'] or ['OrganizationClerk']
  organizationId: string;
  enabled: boolean;        // was hardcoded true; now from form
}
```

## 6. Security Plan

| Concern | Mitigation |
|---|---|
| Clerk adding unauthorized roles | `canCreateAdmin=false` for clerks → role dropdown shows only allowed roles |
| Button visibility | `hideAddButton={!isOrganizationAdmin}` ensures clerks don't see the button |
| Email duplication | 409 response from backend; `showError` displayed to user |
| Token | `getToken()` called in `createUser()`; never stored in component |
| Role escalation | Frontend only offers `OrganizationAdmin` / `OrganizationClerk`; backend enforces allowed roles |

## 7. State Management

| State | Location | Rationale |
|---|---|---|
| Modal open/closed | `useState` in parent page | Page-specific UI |
| `refreshKey` | `useState` in parent page | Triggers `UserManagementTab` re-fetch |
| Form field values | `useState` in `AddUserModal` | Modal-scoped |
| Validation errors | `useFormValidation` in `AddUserModal` | Modal-scoped |
| `isSubmitting` | `useState` in `AddUserModal` | Prevent double submit |
| Role list | Derived from `canCreateAdmin`/`canCreateClerk` props | No state needed |
| User list | `useState` in `UserManagementTab` (re-fetched on `refreshKey` change) | Tab-scoped |

## 8. Testing Plan

### Unit Tests

| File | Tests |
|---|---|
| `src/components/modals/__tests__/AddUserModal.test.tsx` | renders with role options OrgAdmin and OrgClerk only when isOrgMode+HQ; canCreateAdmin=false hides OrgAdmin option; enabled toggle defaults to false; submit with empty fields shows errors; valid submit calls createUser; 409 response shows error toast |
| `src/app/organization/[id]/__tests__/page.test.tsx` | Add User button hidden when isOrganizationAdmin=false; Add User button shown when isOrganizationAdmin=true; onSuccess increments refreshKey |

### E2E Tests

| Scenario | Priority | Steps |
|---|---|---|
| OrgAdmin adds OrgClerk | P0 | 1. Login as OrgAdmin 2. Open user management tab 3. Click Add User 4. Fill form with OrgClerk role 5. Submit 6. Assert success toast + user appears in list |
| OrgClerk — Add User button hidden | P1 | 1. Login as OrgClerk 2. Navigate to org dashboard 3. Assert Add User button not visible |
| Duplicate email rejected | P1 | 1. Submit with existing email 2. Assert error toast |
| Required field validation | P1 | 1. Submit empty form 2. Assert inline errors on Name, Email, Phone, Gender, Role |

## 9. Performance

| Criterion | How Met |
|---|---|
| Modal open <100ms | MUI Dialog renders lazily; no API calls on open except org-mode site fetch (not needed for org-level user creation) |
| Submit + refresh <2s | `createUser()` is a single POST; `refreshKey` increment triggers one GET for user list |
| Inline validation <200ms | Synchronous `validateSingleField` |

## 10. Logging

| Event | Log Level | What to Log | What NOT to Log |
|---|---|---|---|
| Modal opened | None | — | — |
| User creation submitted | `console.log` (dev) | "Creating org user" | Email, name, payload |
| User created successfully | `console.log` (dev) | "User created, id: [id]" | Email, name |
| API error | `console.error` | Error message | Email, token |
| Duplicate email | `console.warn` | "Duplicate email attempted" | Email value |

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Backend sends invitation email → may fail silently | Low | Low (spec says auto-sent; frontend has no control) | Show success toast on 201; email failure is backend concern |
| Role string format mismatch (spaces vs no spaces) | Medium | High — user created with wrong role | Existing code: `roles.map(r => r.replace(/\s+/g, ''))` — confirmed in `handleSubmit` line 215 |
| `enabled=true` hardcoded in `createUser()` | Confirmed | Low | Change to accept `enabled` from payload; default `false` in form |
| OrgClerk somehow accessing Add User | Low | Medium | Button hidden via prop; backend enforces role check on POST |
