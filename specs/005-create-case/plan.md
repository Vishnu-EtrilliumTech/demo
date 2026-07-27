# Implementation Plan: Create Case

**Branch**: `005-create-case` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)

---

## 1. Overview

Allow authorized site users to open a new legal case under a site. Cases are the central work unit in Lawsome — all tasks, hearings, documents, invoices, and comments attach to a case. The form captures: case title, case number, status (enum), assigned team member (site user selector), and optional description.

Role restrictions:
- `OrganizationClerk` and `SiteCaseClient` → "Create Case" button must not be rendered
- All other roles with site access → can create

**What already exists:**
- `src/app/organization/[id]/sites/[siteId]/cases/new/page.tsx` — form page exists with title, description, case number, status, and assignedTo fields
- `createCase(orgId, siteId, caseData)` in [src/app/organization/services/api.ts](../../src/app/organization/services/api.ts)
- `CaseStatus` enum (`Open`, `InProgress`, `OnHold`, `Closed`) in [src/app/organization/types/index.ts](../../src/app/organization/types/index.ts)
- `fetchSiteUsers` for populating the assignee dropdown

**What must be built / fixed:**
- RBAC gate: "Create Case" button must be hidden from `OrganizationClerk` and `SiteCaseClient` — not currently implemented
- The existing page uses `useUserRole` but does not guard visibility of the Create Case action at the site page level (`SiteManagementTab` / cases tab)
- `cnrNumber` is currently a required field in the page form but the spec does not list it as required — needs clarification / alignment with backend

---

## 2. Architecture Flow

```
User (SiteClerk / SiteAdmin / SiteSrLegalExpert / etc.) clicks "Create Case"
  → Next.js navigates to /organization/[id]/sites/[siteId]/cases/new
  → NewCasePage renders ("use client")
  → RBAC gate: if OrganizationClerk or SiteCaseClient → redirect to site page
  │
  ├─ useEffect: fetchSiteUsers(orgId, siteId) → populate Assigned To dropdown
  │
  ├─ Form fields (controlled inputs):
  │   title, description (optional), caseNumber, status (default=Open), assignedToId
  │
  ├─ blur → validateSingleField(field, value)
  │
  └─ Submit
      ├─ validate(formData) + assignedToId > 0 check
      ├─ createCase(orgId, siteId, payload)
      │   → POST /api/v1/organizations/{orgId}/sites/{siteId}/cases
      ├─ 201 → showSuccess("Case created successfully")
      │         → router.push(`.../sites/${siteId}#cases`)
      └─ 4xx → extractApiErrors(err) → <ErrorAlert />

Site Cases Tab (CasesTable / SitePage):
  → useUserRole → canCreateCase = !isOrgClerk && !isSiteCaseClient
  → "Create Case" button: rendered only if canCreateCase === true
```

---

## 3. File Structure

```text
src/app/organization/[id]/sites/[siteId]/cases/new/
└── page.tsx                          # MODIFY — add RBAC guard (redirect for OrgClerk/SiteCaseClient)

src/app/organization/[id]/sites/[siteId]/
└── page.tsx (CasesTable area)        # MODIFY — add canCreateCase gate on "Create Case" button

src/app/organization/types/
└── index.ts                          # VERIFY — CaseStatus enum, Case interface

src/app/organization/services/
└── api.ts                            # VERIFY — createCase signature; clarify cnrNumber requirement

specs/005-create-case/
├── spec.md
├── plan.md                           # This file
├── research.md
├── data-model.md
└── contracts/
    └── create-case.json              # OpenAPI-style request/response schema
```

---

## 4. Component Design

### `NewCasePage` (`src/app/organization/[id]/sites/[siteId]/cases/new/page.tsx`)

**Existing fields (already implemented):**
- Title (required, max 200)
- Description (optional, max 500)
- Case Number (required, max 50)
- Status (required, enum dropdown, defaults to `Open`)
- Assigned To (required, select from site users)

**Changes required:**

```typescript
// 1. Add RBAC redirect at top of component
const { isOrgClerk, isSiteCaseClient } = useUserRole(organizationId);

useEffect(() => {
  if (isOrgClerk || isSiteCaseClient) {
    router.replace(`/organization/${organizationId}/sites/${siteId}`);
  }
}, [isOrgClerk, isSiteCaseClient]);

// 2. cnrNumber field — confirm with backend if optional or remove from required check
// Current code includes cnrNumber in form state; spec does not mention it as required.
// Treat as optional: remove from createCase required validation if backend allows null/empty.
```

### Status Dropdown

```typescript
// CaseStatus enum already defined:
enum CaseStatus {
  Open      = 'Open',
  InProgress = 'InProgress',
  OnHold    = 'OnHold',
  Closed    = 'Closed'
}

// Display labels (for human-readable dropdown):
const STATUS_LABELS: Record<CaseStatus, string> = {
  [CaseStatus.Open]:       'Open',
  [CaseStatus.InProgress]: 'In Progress',
  [CaseStatus.OnHold]:     'On Hold',
  [CaseStatus.Closed]:     'Closed',
};
```

### Assigned Team Member Selector

```typescript
// Existing: <select> populated from fetchSiteUsers
// Enhancement: convert to MUI Autocomplete for searchability (spec FR-001: "searchable user selector")
<Autocomplete
  options={users}
  getOptionLabel={(u) => u.fullName}
  onChange={(_, user) => setForm(prev => ({ ...prev, assignedToId: user?.id ?? 0 }))}
  renderInput={(params) => <TextField {...params} label="Assigned Team Member" required />}
/>
```

### Site Page RBAC Gate

```typescript
// In site page cases tab area:
const { isOrgClerk, isSiteCaseClient } = useUserRole(organizationId);
const canCreateCase = !isOrgClerk && !isSiteCaseClient;

// Render:
{canCreateCase && (
  <Button onClick={() => router.push(`.../cases/new`)}>Create Case</Button>
)}
```

---

## 5. API Plan

### Endpoints used

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/organizations/{orgId}/sites/{siteId}/cases` | Create case |
| GET | `/api/v1/organizations/{orgId}/sites/{siteId}/users` | Fetch site users for assignee dropdown |

### Request payload (`CreateCasePayload`)

```typescript
interface CreateCasePayload {
  title: string;          // required, max 200
  caseNumber: string;     // required, max 50
  status: CaseStatus;     // required, default Open
  assignedToId: number;   // required, > 0
  description?: string;   // optional, max 500
  cnrNumber?: string;     // optional (clarify with backend — currently in existing code)
}
```

### Response

Success `201`:
```json
{ "success": true, "data": { /* Case object */ }, "message": null }
```

Failure `400`:
```json
{ "success": false, "message": "...", "errors": ["..."] }
```

### Service function

Existing `createCase` accepts `{ title, description, caseNumber, cnrNumber, assignedToId }` — does not accept `status` in the request shape currently. **This is a gap**: the existing API call omits `status` from the POST body even though the spec requires it.

**Required fix in `api.ts`:**
```typescript
// BEFORE (current createCase signature):
caseData: { title, description?, caseNumber, cnrNumber, assignedToId }

// AFTER:
caseData: { title, description?, caseNumber, cnrNumber?, assignedToId, status: CaseStatus }
```

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| OrganizationClerk accesses `/cases/new` directly via URL | `useUserRole` check at page mount → `router.replace` to site page; backend also enforces `[Authorize]` |
| SiteCaseClient role escalation | Same RBAC pattern as above; server-side `[Authorize(Roles="...")]` is the security gate |
| XSS via title/description inputs | Controlled React inputs; values never injected into raw HTML |
| Oversized payloads | `maxLength` validation on all string fields before submit |
| Assignee ID tampering | Backend validates `assignedToId` belongs to the site; UI validates > 0 only |
| Auth token exposure | `getToken()` per-request, stored in localStorage (acceptable per constitution §II for Keycloak OIDC flow) |

---

## 7. State Management

No Redux slice needed. All state is local to `NewCasePage`:

| State | Type | Location | Notes |
|-------|------|----------|-------|
| `form` | `CreateCaseForm` | `useState` | Controlled inputs including status default = Open |
| `users` | `User[]` | `useState` | Site users for Assigned To dropdown |
| `loading` | `boolean` | `useState` | Submit in-flight |
| `loadingUsers` | `boolean` | `useState` | Dropdown population in-flight |
| `apiErrors` | `string[] \| null` | `useState` | API error display |
| `errors` | `Record<string, string>` | `useFormValidation` | Inline field errors |

After success the user is redirected to `/organization/${id}/sites/${siteId}#cases`. The hash-based navigation causes the site page to re-mount and re-fetch `fetchSiteCases`, refreshing the list.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test | Notes |
|------|-------|
| Form renders title, case number, status, assigned to | Check all required fields present |
| Status dropdown contains exactly 4 options | Open, In Progress, On Hold, Closed |
| Status defaults to Open on mount | `expect(statusInput).toHaveValue('Open')` |
| Submitting without assignedToId shows error | `apiErrors` or inline error shown |
| Submit calls `createCase` with correct payload including status | Mock API, assert call args |
| OrganizationClerk is redirected away from form | Mock `useUserRole`, assert `router.replace` |
| SiteCaseClient is redirected away from form | Same |
| API error renders `<ErrorAlert>` | Mock 400 response |
| Success navigates to `#cases` hash | Assert `router.push` |

Test file: `specs/005-create-case/__tests__/NewCasePage.test.tsx`

### E2E Tests (Playwright)

| Scenario | Priority |
|----------|----------|
| SiteClerk creates a case — golden path | P1 |
| Submit without required fields — inline errors appear | P1 |
| OrganizationClerk cannot see "Create Case" button | P2 |
| Status dropdown shows all 4 options | P3 |
| Newly created case appears in site cases list | P1 |

Test file: `e2e/005-create-case.spec.ts`

---

## 9. Performance

| Concern | Strategy |
|---------|----------|
| Site users fetch latency | `fetchSiteUsers` called in `useEffect` on mount; disabled select with "Loading users…" state shown during fetch |
| Assignee search | Upgrade to `MUI Autocomplete` for client-side search over fetched users list — no additional API calls |
| Status dropdown | Static enum values — no API fetch; renders synchronously |
| Case list refresh | Site page re-fetches on hash-based navigation (existing pattern) — no additional optimization needed |
| `React.memo` | `NewCasePage` is a full-page form — memoization not beneficial; not applied |

---

## 10. Logging

| Event | Frontend action | Notes |
|-------|----------------|-------|
| Case creation success | Toast shown; no `console.log` | Audit event logged server-side |
| Case creation failure (4xx) | `console.error(error)` before `setApiErrors` | Do not log title or case content (privileged per §IX) |
| Users fetch failure | `catch {}` sets `users = []`; no error surfaced to user | `console.warn` silently — non-critical, user can still type an ID |
| RBAC redirect triggered | `console.warn('Unauthorized: redirected from case creation')` | Helps debugging; not a security-relevant server log |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `status` missing from `createCase` POST body | High (confirmed gap in existing code) | Cases created without status → backend defaults or rejects | Fix `createCase` API call to include `status` in this PR |
| `cnrNumber` required by backend but not in spec | Medium | Form submission fails for unknown reasons | Confirm with backend: if optional, make it optional in payload; if required, add to spec |
| Assignee dropdown empty if no site users exist | Medium | User cannot create a case | Show informative message "No site users found — add users first"; link to spec 004 flow |
| OrganizationClerk accesses `/cases/new` directly | Medium | Spec violation | `useUserRole` redirect covers this; backend is the security gate |
| `SiteCaseClient` role not yet in `useUserRole` hook | Medium | RBAC gate cannot check for it | Verify hook exports `isSiteCaseClient`; add if missing |
| Duplicate case number creates confusion | Low | Two cases with same number | Spec confirms uniqueness is not enforced; no action needed |
