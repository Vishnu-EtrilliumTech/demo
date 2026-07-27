# Implementation Plan: Site User Creation

**Branch**: `004-site-user-creation` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)

---

## 1. Overview

Allow authorized org-level and site-level users to add a new user to a site. The form captures full name, email, phone, role, gender, and an enabled toggle. A password is auto-generated server-side and an invitation email is sent to the new user.

Role visibility rules:
- `OrganizationAdmin`, `OrganizationClerk`, `SiteAdmin` → can assign all four site roles including `SiteAdmin`
- `SiteClerk`, `SiteSrLegalExpert`, `SiteLegalExpert` → role dropdown excludes `SiteAdmin`

**What already exists:**
- `createSiteUser(orgId, siteId, userData)` in [src/app/organization/services/api.ts](../../src/app/organization/services/api.ts)
- Shared `NewUserPage` at [src/app/organization/[id]/users/new/page.tsx](../../src/app/organization/[id]/users/new/page.tsx) — already handles `isSiteMode` branch, role filtering (`canCreateAdmin`, `canCreateClerk`)
- Redirect stub at [src/app/organization/[id]/sites/[siteId]/users/new/page.tsx](../../src/app/organization/[id]/sites/[siteId]/users/new/page.tsx) (re-exports `NewUserPage`)
- `useUserRole`, `useFormValidation`, `useToast` hooks
- `required`, `email`, `phone`, `maxLength` validation primitives

**What must be verified / fixed:**
- The `enabled` toggle — spec says it defaults to OFF; current `createSiteUser` payload hard-codes `enabled: true`. Must be changed to respect the toggle.
- The success message must read: "User [name] has been added and an invitation email has been sent."
- The `SiteAdmin` exclusion must cover `SiteSrLegalExpert` and `SiteLegalExpert` roles (already present in code; verify logic).

---

## 2. Architecture Flow

```
User (SiteAdmin / OrgAdmin / SiteClerk / etc.) clicks "Add User"
  → Next.js navigates to /organization/[id]/sites/[siteId]/users/new
  → NewUserPage renders in isSiteMode = true
  → useUserRole(organizationId) → computes canCreateAdmin, canCreateClerk
  │
  ├─ Role dropdown filtered by caller's permissions
  │   ├─ canCreateAdmin=true  → show SiteAdmin, SiteClerk, SiteLegalExpert, SiteSrLegalExpert
  │   └─ canCreateAdmin=false → show SiteClerk, SiteLegalExpert, SiteSrLegalExpert only
  │
  ├─ Enabled toggle (default = false / disabled)
  │
  └─ Submit
      ├─ validate(formData) — useFormValidation schema pass
      ├─ createSiteUser(orgId, siteId, { ...formData, enabled }) 
      │   → POST /api/v1/organizations/{orgId}/sites/{siteId}/users
      ├─ 201 → showSuccess("User [name] has been added and an invitation email has been sent.")
      │         → router.push(`.../sites/${siteId}#users`)
      └─ 4xx → extractApiErrors(err) → apiErrors state → displayed in form
```

---

## 3. File Structure

```text
src/app/organization/[id]/users/new/
└── page.tsx                        # MODIFY — fix enabled toggle default + success message

src/app/organization/[id]/sites/[siteId]/users/new/
└── page.tsx                        # VERIFY — re-exports NewUserPage (no change needed)

src/app/organization/services/
└── api.ts                          # MODIFY — createSiteUser: respect enabled param

src/app/organization/types/
└── index.ts                        # VERIFY — User interface has enabled: boolean

specs/004-site-user-creation/
├── spec.md
├── plan.md                         # This file
├── research.md
├── data-model.md
└── contracts/
    └── create-site-user.json       # OpenAPI-style request/response schema
```

---

## 4. Component Design

### `NewUserPage` (site mode) — modifications only

The shared page already renders the form. The following targeted changes are required:

**Change 1 — `enabled` toggle**

```typescript
// Add to formData state
const [formData, setFormData] = useState<FormData>({
  ...,
  enabled: false,   // spec: defaults to OFF
});

// Add toggle to form (isSiteMode only)
{isSiteMode && (
  <div>
    <label>Enable user immediately</label>
    <Switch
      name="enabled"
      checked={formData.enabled}
      onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
    />
  </div>
)}
```

**Change 2 — Success message**

```typescript
// Before (current):
showSuccess('User created successfully');

// After:
showSuccess(`${formData.fullName} has been added and an invitation email has been sent.`);
```

**Change 3 — Role dropdown (verify/document)**

Current code already has:
```typescript
const canCreateAdmin = !isSiteClerk && !isLegalExpert;
const canCreateClerk = !isLegalExpert;
```
This is correct per spec. No code change needed — just confirmed in this plan.

### Role Dropdown Options (site mode)

| Role option shown | When shown |
|-------------------|-----------|
| Site Admin | `canCreateAdmin === true` |
| Site Clerk | `canCreateClerk === true` |
| Legal Expert | Always |
| Senior Legal Expert | Always |

---

## 5. API Plan

### Endpoint used

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/organizations/{orgId}/sites/{siteId}/users` | Create site user |

### Request payload (`CreateSiteUserPayload`)

```typescript
interface CreateSiteUserPayload {
  fullName: string;      // 2–100 chars
  emailId: string;       // valid email, max 254
  phoneNumber: string;   // 10-digit
  gender: string;        // Male | Female | Transgender
  roles: string[];       // exactly one role: SiteAdmin | SiteClerk | SiteLegalExpert | SiteSrLegalExpert
  enabled: boolean;      // default false per spec
}
```

### Response

Success `201`:
```json
{ "success": true, "data": { /* User object */ }, "message": null }
```

Failure `400` (validation):
```json
{ "success": false, "message": "Validation failed", "errors": ["..."] }
```

Failure `409` (duplicate email — expected):
```json
{ "success": false, "message": "This email address is already registered in the system.", "errors": [] }
```

### Service function change

```typescript
// BEFORE (api.ts line ~844):
const payload = { ...userData, enabled: true };

// AFTER:
const payload = { ...userData };  // enabled comes from caller
```

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| SiteAdmin role privilege escalation | UI hides SiteAdmin option for non-admin site users; backend enforces role via `[Authorize]` — 401 returned if role submitted illegally |
| Duplicate email enumeration | API returns a user-friendly error string, not a 404; UI displays it as a toast error |
| XSS via fullName / email inputs | Controlled React inputs; values never injected into raw HTML |
| Phone number format injection | `phone()` validator enforces 10-digit numeric; no special chars pass |
| Sensitive data in logs | No form values are logged in the frontend; backend logs event (not OTP/password) per §IX |
| Invitation email credentials | Password is auto-generated server-side and sent via email only — never returned in the API response |

---

## 7. State Management

No Redux slice needed. All state is local to `NewUserPage`:

| State | Type | Location | Notes |
|-------|------|----------|-------|
| `formData` | `FormData` | `useState` | Controlled form values including `enabled` |
| `isSubmitting` | `boolean` | `useState` | Disables submit button during API call |
| `apiErrors` | `string[] \| null` | `useState` | Surfaces API error messages |
| `errors` | `Record<string, string>` | `useFormValidation` | Inline field errors |

After success, `router.push(`.../sites/${siteId}#users`)` triggers the site page to re-fetch users via its `useEffect([siteId])`.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test | Notes |
|------|-------|
| Form renders all required fields in site mode | Confirm `enabled` toggle present |
| SiteAdmin option absent when caller is SiteClerk | Mock `useUserRole` to return `isSiteClerk = true` |
| SiteAdmin option absent when caller is SiteLegalExpert | Mock `useUserRole` to return `isSiteLegalExpert = true` |
| SiteAdmin option present when caller is SiteAdmin | Mock `useUserRole` |
| Submit calls `createSiteUser` with `enabled: false` by default | Assert payload |
| Toggle enabled → submit sends `enabled: true` | Toggle switch then assert |
| Duplicate email API error shows correct message | Mock 409 response |
| Success navigates to `#users` hash | Assert `router.push` call |

Test file: `specs/004-site-user-creation/__tests__/NewUserPage.site.test.tsx`

### E2E Tests (Playwright)

| Scenario | Priority |
|----------|----------|
| SiteAdmin adds a SiteClerk — golden path | P1 |
| SiteClerk cannot see SiteAdmin in role dropdown | P2 |
| Duplicate email shows error message | P3 |
| Newly added user appears in site user list | P1 |

Test file: `e2e/004-site-user-creation.spec.ts`

---

## 9. Performance

| Concern | Strategy |
|---------|----------|
| Role dropdown population | Roles are a static enum (4 options) — no API fetch needed; rendered synchronously |
| Form responsiveness | Single `useState` object for form; `clearFieldError` called per change — no re-render cascade |
| User list refresh after creation | Site page re-fetches `fetchSiteUsers` on mount (hash-based navigation causes full re-mount) |
| Bundle impact | No new dependencies; `enabled` toggle uses MUI `Switch` already in bundle |

---

## 10. Logging

| Event | Frontend action | Notes |
|-------|----------------|-------|
| User creation success | No log; toast notification only | Name shown in toast message |
| User creation failure (4xx) | `console.error(error)` before setting `apiErrors` | Do not log emailId or phone to console |
| Role escalation rejected (401) | `extractApiErrors` surfaces message; `console.warn` the status | Server logs the auth rejection per §IX |
| Duplicate email (409) | Display as `apiErrors`; no `console.error` (expected business error) | Treat as user input error, not a system error |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Invitation email silently fails server-side | Low | User added but no credentials sent | API should roll back on email failure per spec; confirm with backend team |
| `enabled: true` hard-coded in `createSiteUser` API call | High (exists now) | Ignores user's toggle selection | Fix in this PR: pass `enabled` from form state |
| `SiteAdmin` exclusion logic already exists but untested | Medium | Logic regression could expose `SiteAdmin` to unauthorized callers | Add unit tests covering all 4 role types for caller permission |
| Gender transform (`Non-Binary` → `Transgender`) missed for site users | Low | API rejects unknown gender value | Existing transform is in `NewUserPage` and applies to both modes; verify |
| Backend allows `SiteAdmin` role even from restricted callers | Low | Server-side permission bypass | Backend must enforce independently; UI guard is UX-only per constitution §IV |
