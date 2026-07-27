# Implementation Plan: Case Client Management

**Branch**: `010-case-client-management` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)

---

## 1. Overview

### What Exists
- `ClientsTab/ClientsTab.tsx` — case clients tab with add/edit/delete and invite actions.
- `useCaseClients.ts` — hook: fetch, add, update, delete clients; invite; gender type conversion (Non-Binary → Transgender for API); client search; detail view modes.
- API functions in `caseapi.ts`: `addClientToCase`, `fetchCaseClients`, `fetchCaseClientById`, `updateCaseClient`, `deleteCaseClient`, `inviteCaseClient`, `acceptCaseClientInvitation`.
- Types: `CaseClient`, `CaseClientFormData`, `CaseClientRequest`, `UpdateCaseClientRequest`, `UpdateCaseClientFormData`, `ClientInvitationResponse`, `ClientAcceptInvitationRequest`, `ClientAcceptInvitationResponse`, `GenderUIOption`, `GenderAPIType` in `caseindex.ts`.
- `AddClientModal`, `EditClientModal`, `DeleteConfirmationModal` from `@/components/modals/`.

### Gaps to Close
1. **Invitation acceptance page does not exist** — build `src/app/invitation/[invitationId]/page.tsx` (primary new implementation).
2. Verify `OrganizationClerk` and `SiteCaseClient` RBAC guards on all write controls in `ClientsTab`.
3. Verify invite button disabled state when `acceptedDate !== null` or `emailId` is empty.
4. No unit tests for `ClientsTab` or `useCaseClients`.
5. No E2E tests for client management or invitation flow.

### What Is New
- `src/app/invitation/[invitationId]/page.tsx` — public invitation acceptance page (NEW).
- Unit tests: `ClientsTab.test.tsx`
- E2E test: `e2e/010-case-client-management.spec.ts`

---

## 2. Architecture Flow

### 2.1 View Clients

```
Case detail page mounts Clients tab
  → ClientsTabContainer renders
  → useCaseClients(orgId, siteId, caseId)
  → useEffect: fetchCaseClients() → GET /caseclients
  → setClients(data) — derive invitation status from invitedOnDate/acceptedDate
  → if clients.length === 0 → <EmptyState>
  → else → <Table>: name | email | phone | invitation status chip | actions
```

### 2.2 Add Client

```
Authorized user clicks "Add Client" (hidden for OrgClerk/SiteCaseClient)
  → AddClientModal opens
  → Fields: fullName (req), emailId (req), phoneNumber (opt), gender (opt, default Male), remarks (opt)
  → blur → clientValidation.validateSingleField(field, value)
  → Submit → mapGender(form.gender): Non-Binary → Transgender
  → addClientToCase(orgId, siteId, caseId, payload)
      → POST /caseclients
  → 201 → showSuccess → client appears with "Not Invited" status
  → 400 → extractApiErrors → inline errors
```

### 2.3 Invite Client

```
Authorized user clicks "Invite" on a client row
  → guard: client.emailId must be non-empty
  → guard: client.acceptedDate must be null (not already accepted)
  → inviteCaseClient(orgId, siteId, caseId, clientId)
      → POST /caseclients/{clientId}/invite
  → 200 → showSuccess → client status chip updates to "Invited"
  → 400 ("already accepted") → showError: "This client has already accepted their invitation."
  → 400 ("no email") → showError: "An email address is required."
  → 500 (email send failure) → showError; invitation state NOT updated
```

### 2.4 Client Accepts Invitation

```
Client receives email → clicks link
  → Navigates to /invitation/{invitationId}?clientId=N&orgId=X&siteId=Y&caseId=Z
  → InvitationAcceptPage loads (public route — no auth required to render)
  → Shows: case name (if fetchable), "Accept access to your case" button
  → User is not logged in → Keycloak login/register redirect; return to page after auth
  → User clicks "Accept" → acceptCaseClientInvitation(orgId, siteId, caseId, clientId, invitationId, {})
      → POST /caseclients/{clientId}/invitation/{invitationId}/accept
  → 200 → success state: "You now have access to your case. Log in to continue."
  → 400 "expired" → error: "This invitation has expired. Please ask your legal team to resend."
  → 400 "already accepted" → error: "This invitation has already been accepted."
```

### 2.5 RBAC Gate

```
ClientsTab:
  → useUserRole(orgId) → isOrganizationClerk, isSiteCaseClient
  → {!isOrganizationClerk && !isSiteCaseClient && <Button>Add Client</Button>}
  → {!isOrganizationClerk && !isSiteCaseClient && <IconButton>Edit</IconButton>}
  → {!isOrganizationClerk && !isSiteCaseClient && <IconButton>Delete</IconButton>}
  → {!isOrganizationClerk && !isSiteCaseClient && inviteButton}
  → Invite button additionally disabled if emailId empty OR acceptedDate !== null
```

---

## 3. File Structure

### Documentation
```
specs/010-case-client-management/
  spec.md                          NO CHANGE
  plan.md                          NEW (this file)
  research.md                      NEW
  data-model.md                    NEW
  contracts/
    api-contracts.md               NEW
```

### Source Tree
```
src/app/
  invitation/
    [invitationId]/
      page.tsx                     NEW — public invitation acceptance page

src/app/organization/[id]/sites/[siteId]/cases/[caseId]/
  components/
    ClientsTab/
      ClientsTab.tsx               VERIFY — OrgClerk/SiteCaseClient RBAC guards; invite button disabled states
      ClientsTab.module.css        NO CHANGE
      index.ts                     NO CHANGE
  hooks/
    useCaseClients.ts              NO CHANGE (if verified)

src/app/organization/
  types/
    caseindex.ts                   NO CHANGE (all client types)
  services/
    caseapi.ts                     NO CHANGE (all client + invitation API functions)

src/components/modals/
  AddClientModal.tsx               NO CHANGE
  EditClientModal.tsx              NO CHANGE
  DeleteConfirmationModal.tsx      NO CHANGE

e2e/
  010-case-client-management.spec.ts  NEW
```

---

## 4. Component Design

### 4.1 `ClientsTabContainer` / `ClientsTab`
- **RBAC**:
  ```typescript
  const { isOrganizationClerk, isSiteCaseClient } = useUserRole(orgId);
  const canManageClients = !isOrganizationClerk && !isSiteCaseClient;

  {canManageClients && <Button>Add Client</Button>}
  {canManageClients && <IconButton onClick={onEdit}><EditIcon /></IconButton>}
  {canManageClients && <IconButton onClick={onDelete}><DeleteIcon /></IconButton>}
  ```
- **Invite button per row**:
  ```typescript
  const canInvite = canManageClients && !!client.emailId && !client.acceptedDate;
  <Tooltip title={!client.emailId ? "Email required to invite" : client.acceptedDate ? "Already accepted" : ""}>
    <span>
      <Button disabled={!canInvite} onClick={() => onInvite(client.id, client.fullName)}>
        {client.invitedOnDate && !client.acceptedDate ? "Re-invite" : "Invite"}
      </Button>
    </span>
  </Tooltip>
  ```
- **Invitation status chip**: derived from `invitedOnDate` / `acceptedDate` — Not Invited (grey) | Invited (blue) | Accepted (green).

### 4.2 `InvitationAcceptPage` (`src/app/invitation/[invitationId]/page.tsx`) — NEW
- **Route**: `/invitation/{invitationId}` (public, no Keycloak guard on page render)
- **Query params**: `clientId`, `orgId`, `siteId`, `caseId`
- **Auth check**: If user is not logged in when clicking "Accept", redirect to Keycloak login with `return_to` param pointing back to this page.
- **State**: `status: 'idle' | 'loading' | 'success' | 'expired' | 'already_accepted' | 'error'`
- **Render paths**:
  - `idle` → "You've been invited to view your legal case. Click Accept to gain access."
  - `loading` → spinner
  - `success` → "You now have access to your case." + "Go to My Cases" link
  - `expired` → "This invitation has expired. Please ask your legal team to resend the invitation."
  - `already_accepted` → "This invitation has already been accepted."
  - `error` → "Something went wrong. Please try again or contact support."
- **Implementation**:
  ```typescript
  "use client";
  // No useUserRole guard — public page
  // Reads invitationId from params, others from searchParams
  // Calls acceptCaseClientInvitation on button click
  // Maps 400 error messages to status states
  ```

### 4.3 `AddClientModal`
- **Fields**: fullName (required), emailId (required), phoneNumber (optional), gender (optional, default Male — options: Male/Female/Transgender/Non-Binary), remarks (optional).
- **Validation**: `CaseClientSchemas.add` via `useFormValidation`.

---

## 5. API Plan

| Method | URL (relative to case base) | Auth | Request | Success | Error Codes | Status |
|--------|-----------------------------|------|---------|---------|-------------|--------|
| `GET` | `/caseclients` | Bearer | — | `CaseClientResponse[]` | 401, 403, 404→[] | Existing |
| `POST` | `/caseclients` | Bearer | `CaseClientRequest` | `{ data: CaseClient }` 201 | 400, 401, 403 | Existing |
| `GET` | `/caseclients/{clientId}` | Bearer | — | `{ data: CaseClient }` | 401, 403, 404 | Existing |
| `PUT` | `/caseclients/{clientId}` | Bearer | `UpdateCaseClientRequest` | `{ data: CaseClient }` | 400, 401, 403, 404 | Existing |
| `DELETE` | `/caseclients/{clientId}` | Bearer | — | 204 | 401, 403, 404 | Existing |
| `POST` | `/caseclients/{clientId}/invite` | Bearer | — | `ClientInvitationResponse` | 400, 401, 403, 500 | Existing |
| `POST` | `/caseclients/{clientId}/invitation/{invitationId}/accept` | Bearer (or public) | `ClientAcceptInvitationRequest` | `{ clientId }` | 400, 404 | Existing |

All case client URLs prefixed: `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}`

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| OrgClerk/SiteCaseClient seeing Add/Edit/Delete/Invite | `{canManageClients && ...}` in `ClientsTab`; backend enforces `[Authorize]` |
| Expired invitation accepted | Backend validates expiry before granting access; frontend shows "expired" error state |
| Already-accepted invitation clicked again | Backend returns 400; frontend maps to "already_accepted" state |
| Re-invite on accepted client | Invite button disabled when `acceptedDate !== null` |
| Invitation link intercepted / replayed | Backend HMAC or UUID uniqueness per invite; expiry enforced server-side |
| Invitation acceptance page CSRF | Page only calls the accept endpoint on explicit user button click; no automatic side effects |
| XSS via client name/email display | Rendered in MUI `TableCell`/`Typography` — no `dangerouslySetInnerHTML` |
| Email send failure orphaning invitation state | Backend must be atomic — do not set `invitedOnDate` if email send fails; frontend shows error without updating local state optimistically |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `clients`, `loadingClients` | `useCaseClients` (local) | Case-scoped; no cross-route sharing |
| `clientForm`, `editClientForm` | `useCaseClients` (local) | Form state; ephemeral |
| `deleteClientModalOpen`, `clientToDelete` | `useCaseClients` (local) | Dialog; ephemeral |
| `invitingClientId` | `useCaseClients` (local) | Per-row invite spinner |
| `clientSearchQuery` | `useCaseClients` (local) | UI-only search filter |
| Invitation page `status` | `InvitationAcceptPage` local state | Single-page scoped |
| Role flags | `useUserRole` (local, Redux-derived) | Per-session |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `ClientsTab.test.tsx` | SiteAdmin role → Add/Edit/Delete/Invite visible | All controls render |
| `ClientsTab.test.tsx` | OrgClerk role → no write controls | Zero action controls in DOM |
| `ClientsTab.test.tsx` | SiteCaseClient role → no write controls | Zero action controls in DOM |
| `ClientsTab.test.tsx` | Invite button → disabled for client with no email | Button has `disabled` attribute |
| `ClientsTab.test.tsx` | Invite button → disabled for accepted client | Button has `disabled` attribute |
| `ClientsTab.test.tsx` | Status chip → "Not Invited" for new client | Chip text correct |
| `ClientsTab.test.tsx` | Status chip → "Accepted" after acceptance | Chip text correct |
| `InvitationAcceptPage.test.tsx` | Expired invitation → error state shown | Expiry message rendered |
| `InvitationAcceptPage.test.tsx` | Already accepted → error state shown | Already-accepted message rendered |
| `InvitationAcceptPage.test.tsx` | Success → success message + link | Success text and link rendered |

Test files:
- `src/app/organization/.../ClientsTab/__tests__/ClientsTab.test.tsx`
- `src/app/invitation/[invitationId]/__tests__/page.test.tsx`

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| Add client — golden path | SiteClerk | Nav to case > Clients, click Add Client, fill form | Client appears with "Not Invited" status |
| OrgClerk sees read-only | OrgClerk | Nav to case > Clients | No Add/Edit/Delete/Invite buttons |
| Invite client | SiteAdmin | Click Invite on a client with email | Status chip changes to "Invited" |
| Invite button disabled for accepted client | SiteAdmin | View client row with acceptedDate | Invite button disabled |
| Invite button disabled for client without email | SiteAdmin | View client row without email | Invite button disabled |
| Accept invitation — success | Client | Navigate to `/invitation/{id}?...`, click Accept | Success message shown |
| Accept invitation — expired | Client | Navigate with expired invitationId | Expiry error message shown |
| Accept invitation — already accepted | Client | Navigate to already-used invitation link | Already-accepted error shown |

Test file: `e2e/010-case-client-management.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-002: Status updates in UI within 3s of invite | `inviteCaseClient` call + local state update on 200; no full refetch needed |
| SC-004: Zero invite buttons for OrgClerk/SiteCaseClient | Role check on render; no deferred visibility |
| Client search | Client-side filter on `clients` array via `clientSearchQuery`; no additional API call |
| Invitation acceptance page load | Static page; `acceptCaseClientInvitation` only called on button click |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| Clients list fetched | INFO | `caseId`, count | Client names, emails |
| Client added | INFO | `caseId`, `clientId` | Full name, email, phone |
| Client updated | INFO | `clientId`, fields changed (keys only) | New values |
| Client deleted | INFO | `clientId` | Client name |
| Invitation sent | INFO | `clientId`, `isNewClient` flag | Email address |
| Invitation email send failure | ERROR | `clientId`, HTTP status | Email address |
| Invitation accepted | INFO | `invitationId`, `clientId` | Personal details |
| Expired invitation attempt | WARN | `invitationId` | Client identity |
| Already-accepted invitation attempt | WARN | `invitationId` | — |
| OrgClerk/SiteCaseClient write attempt | WARN | `userId`, `caseId` | — |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Invitation acceptance page does not exist | Confirmed | Critical | Build `src/app/invitation/[invitationId]/page.tsx` — primary new work for this spec |
| Invitation acceptance API auth model unclear | Medium | High | Confirm with backend: does `/accept` require Bearer token or is it public? Handle both cases via conditional Keycloak redirect |
| Email send failure updates invitation state optimistically | Medium | High | Do NOT update `invitedOnDate` in local state until 200 confirmed; backend must be atomic |
| Non-Binary gender silently mapped to Transgender | Low | Low | Documented in `useCaseClients`; user-facing gender options in the form include Non-Binary |
| Invite button enabled on clients without email | Medium | Medium | Disable button + tooltip when `emailId` is empty |
| Invitation link query param tampering (wrong `orgId`/`caseId`) | Low | Medium | Backend validates all params; 404 or 400 returned if mismatch; frontend shows generic error |
| OrgClerk/SiteCaseClient RBAC incomplete in `ClientsTab` | Medium | High | Audit all buttons; apply `{canManageClients && ...}` guard consistently |
