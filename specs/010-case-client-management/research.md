# Research: Case Client Management

**Branch**: `010-case-client-management` | **Date**: 2026-05-15

---

## 1. Existing Infrastructure

### Decision: Use existing `useCaseClients` hook
- **Rationale**: `useCaseClients.ts` implements full CRUD, invite functionality, gender type conversion (Non-Binary → Transgender for API), client search, and detail view modes.
- **Alternatives considered**: New hook — rejected; existing hook is feature-complete.

### Decision: Use existing `caseapi.ts` for all client API functions
- **Rationale**: `addClientToCase`, `fetchCaseClients`, `fetchCaseClientById`, `updateCaseClient`, `deleteCaseClient`, `inviteCaseClient`, `acceptCaseClientInvitation` all exist.

---

## 2. Invitation Flow

The invite flow is two-phase:

1. **Invite** (authorized user action): `inviteCaseClient(orgId, siteId, caseId, clientId)` → `POST /caseclients/{clientId}/invite`. Returns `ClientInvitationResponse { invitationId, isNewClient, clientId? }`. Status changes to "Invited".

2. **Accept** (invited person action): `acceptCaseClientInvitation(orgId, siteId, caseId, clientId, invitationId, body)` → `POST /caseclients/{clientId}/invitation/{invitationId}/accept`. This route must be publicly accessible (no auth required to load the page, but the user may need to log in or register).

### Gap: Invitation acceptance page does NOT exist
- No file found at any path matching `invitation`, `accept-invitation`, or similar.
- **Decision**: A new page must be built at `src/app/invitation/[invitationId]/page.tsx` (or similar public route). This is the primary new implementation work for spec 010.

---

## 3. Invitation Status Derivation

`CaseClient` has `invitedOnDate`, `acceptedDate`, `invitationId`, and `merged` fields. The invitation status displayed in the UI is derived:

| Condition | Status |
|-----------|--------|
| `invitedOnDate === null` | Not Invited |
| `invitedOnDate !== null && acceptedDate === null` | Invited |
| `acceptedDate !== null` | Accepted |

**Decision**: No dedicated `invitationStatus` field from API; derive from date fields.

---

## 4. Gender Mapping

The API only accepts `GenderAPIType` (Male, Female, Transgender). The UI exposes a fourth option "Non-Binary" (`GenderUIOption`). The `useCaseClients` hook converts Non-Binary → Transgender before sending to API.

This is a known deliberate mapping already in the codebase.

---

## 5. RBAC

- Add/Edit/Delete/Invite: `OrgAdmin`, `SiteAdmin`, `SiteClerk`, `SiteSrLegalExpert`, `SiteLegalExpert`
- `OrganizationClerk` and `SiteCaseClient`: no action controls visible

### Decision: `{!isOrganizationClerk && !isSiteCaseClient && ...}` guards on all write controls in `ClientsTab`.

---

## 6. Email Requirement for Invite

- Invite button enabled only when `client.emailId` is non-empty.
- Already-accepted clients show disabled invite button with tooltip "Invitation already accepted."
- Email send failure should NOT update invitation state — atomic behavior required.

---

## 7. Invitation Acceptance Page Design

The acceptance page is a public route. The flow:
1. Client receives email with link: `/invitation/{invitationId}/accept?clientId={clientId}&caseId={caseId}&...`
2. Page loads — shows case info and "Accept Invitation" button.
3. If user is not logged in → redirect to Keycloak login/register, then return to this page.
4. User confirms → call `acceptCaseClientInvitation`.
5. Show success or error (expired / already accepted).

### Decision: New page at `src/app/invitation/[invitationId]/page.tsx`
- Public route (no Keycloak auth guard on page load — auth required before API call).
- Uses query params for `clientId`, `orgId`, `siteId`, `caseId`.

---

## 8. Gaps Identified

| Gap | Severity | Disposition |
|-----|----------|-------------|
| Invitation acceptance page does not exist | Critical | Build new `src/app/invitation/[invitationId]/page.tsx` |
| OrgClerk/SiteCaseClient RBAC guards in `ClientsTab` | High | Verify `{!isOrgClerk && !isSiteCaseClient && ...}` on all write controls |
| Invite button disabled state for accepted clients | Medium | Verify `disabled` + tooltip on invite button when `acceptedDate !== null` |
| Email send failure should not save invitation state | Medium | Backend should be atomic; frontend should not optimistically update status |
| Unit tests for `ClientsTab` | Medium | Create |
| E2E tests for client + invitation flow | Medium | Create |
