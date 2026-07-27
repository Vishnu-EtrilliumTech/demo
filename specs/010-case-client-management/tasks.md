# Tasks: Case Client Management

**Input**: `specs/010-case-client-management/`
**Branch**: `010-case-client-management`

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1=Add client record to case, US2=Invite client for case access, US3=Client accepts invitation

---

## Phase 1: Setup

**Purpose**: Audit existing ClientsTab and identify the primary new work (invitation acceptance page).

- [ ] T001 Read `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/ClientsTab/ClientsTab.tsx` — audit all Add/Edit/Delete/Invite buttons for `{!isOrganizationClerk && !isSiteCaseClient && ...}` guard; verify invite button disabled states for clients without email and already-accepted clients
- [ ] T002 [P] Read `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/useCaseClients.ts` — verify `inviteCaseClient`, `acceptCaseClientInvitation` are wired; verify gender transform (`Non-Binary` → `Transgender`) applied before `addClientToCase` call
- [ ] T003 [P] Verify `addClientToCase`, `inviteCaseClient`, `acceptCaseClientInvitation` in `src/app/organization/services/caseapi.ts` — confirm all exist with correct URL patterns
- [ ] T004 Create directory `src/app/invitation/[invitationId]/` for the public invitation acceptance page (primary new implementation)

---

## Phase 2: UI

**Purpose**: Build the invitation acceptance page and fix any RBAC gaps in ClientsTab.

- [ ] T005 [US3] Create `src/app/invitation/[invitationId]/page.tsx` with `"use client"` — public route (no Keycloak guard on page render); render heading "You've been invited to view your legal case."; show Accept button when `status='idle'`; show MUI CircularProgress when `status='loading'`; show success MUI Card with "Go to My Cases" link when `status='success'`; show error MUI Alert for `status='expired'`, `'already_accepted'`, `'error'`
- [ ] T006 [US3] Add expired state message in `InvitationAcceptPage`: "This invitation has expired. Please ask your legal team to resend the invitation."
- [ ] T007 [US3] Add already-accepted state message in `InvitationAcceptPage`: "This invitation has already been accepted."
- [ ] T008 [US1] Add `{!isOrganizationClerk && !isSiteCaseClient && <Button>Add Client</Button>}` guard in `ClientsTab.tsx` if missing — OrgClerk and SiteCaseClient must not see Add Client button (FR-006)
- [ ] T009 [US2] Verify invite button per client row in `ClientsTab.tsx` uses correct disabled logic: `disabled={!client.emailId || !!client.acceptedDate}` — add MUI `Tooltip` for each disabled reason; show "Re-invite" label when `invitedOnDate` is set but `acceptedDate` is null

---

## Phase 3: Logic

**Purpose**: Implement invitation acceptance flow and verify client CRUD logic.

- [ ] T010 [US3] Implement `handleAccept` in `src/app/invitation/[invitationId]/page.tsx` — read `invitationId` from params; read `clientId`, `orgId`, `siteId`, `caseId` from `searchParams`; call `acceptCaseClientInvitation(orgId, siteId, caseId, clientId, invitationId, {})`; map 400 errors to status states: `"expired"` → `status='expired'`; `"already accepted"` → `status='already_accepted'`; any other error → `status='error'`; success → `status='success'`
- [ ] T011 [US3] Add Keycloak redirect logic in `InvitationAcceptPage` — if user is not authenticated when they click "Accept", redirect to Keycloak login with `return_to` pointing back to this page; after login, user returns to acceptance page to complete the flow
- [ ] T012 [US2] Verify `inviteCaseClient` in `useCaseClients.ts` updates client status chip optimistically to "Invited" only after `200` response — NOT before; on `500` (email send failure) do not update `invitedOnDate` in local state
- [ ] T013 [US1] Verify `addClientToCase` payload applies gender transform: `Non-Binary` → `Transgender` before sending to API; verify `formData.gender` defaults to `'Male'` if empty

---

## Phase 4: API

**Purpose**: Confirm invitation accept endpoint contract and client CRUD APIs.

- [ ] T014 Confirm POST `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/caseclients/{clientId}/invitation/{invitationId}/accept` — confirm whether it requires Bearer token or is public; returns `200 { clientId }` on success; returns `400` with message for expired/already-accepted
- [ ] T015 [P] Confirm POST `.../caseclients/{clientId}/invite` returns `200` on first invite; returns `400` with "already accepted" message if `acceptedDate !== null`

---

## Phase 5: Backend

**Purpose**: Verify backend atomicity for invitation email failure.

- [ ] T016 Confirm backend is atomic for the invite flow — if invitation email send fails, `invitedOnDate` must NOT be set in the database; backend returns `500`; frontend shows error without updating local state
- [ ] T017 [P] Confirm GET `.../caseclients` returns `invitedOnDate` and `acceptedDate` fields on each client record — needed to derive invitation status chip (Not Invited / Invited / Accepted)

---

## Phase 6: Security

**Purpose**: Confirm RBAC guards on all client management controls and invitation link safety.

- [ ] T018 [US1] Verify `canManageClients = !isOrganizationClerk && !isSiteCaseClient` is applied to ALL write controls in `ClientsTab.tsx` — Add, Edit, Delete, and Invite buttons must all be absent from DOM for restricted roles
- [ ] T019 [US3] Verify `InvitationAcceptPage` does not auto-accept on page load — `acceptCaseClientInvitation` is only called on explicit user button click; no automatic side effects on render
- [ ] T020 [US2] Verify invite button disabled when `emailId` is empty — no invitation can be sent for clients without an email address; disabled tooltip explains why

---

## Phase 7: Testing

**Purpose**: Unit and E2E coverage for all three user stories.

- [ ] T021 [P] [US1] Write unit test `ClientsTab/__tests__/ClientsTab.test.tsx` — SiteAdmin: Add/Edit/Delete/Invite visible; OrgClerk: no write controls in DOM; SiteCaseClient: no write controls; invite button disabled for client without email; invite button disabled for client with acceptedDate; status chip shows "Not Invited" for new client; status chip shows "Accepted" after acceptance
- [ ] T022 [P] [US3] Write unit test `src/app/invitation/[invitationId]/__tests__/page.test.tsx` — expired invitation shows expiry error message; already-accepted shows already-accepted message; success shows "Go to My Cases" link; loading state shows spinner
- [ ] T023 Write E2E test `e2e/010-case-client-management.spec.ts` — SiteClerk adds client golden path; OrgClerk sees read-only; SiteAdmin invites client — status chip updates to "Invited"; invite button disabled for accepted client; invite button disabled for client without email; client accepts invitation — success message shown; expired invitation shows error

---

## Phase 8: Logging

**Purpose**: Structured logging per plan section 10.

- [ ] T024 Verify `useCaseClients.ts` and `InvitationAcceptPage` log: client added (caseId, clientId — not name/email); invitation sent (clientId, isNewClient flag — not email); invitation email failure (clientId, HTTP status); invitation accepted (invitationId, clientId — not personal details); expired/already-accepted attempts (warn, invitationId — not client identity) — never log email addresses, phone numbers, or tokens

---

## Phase 9: Quality Gates

**Purpose**: Pre-commit checks must pass.

- [ ] T025 Run `npm run type-check` — fix TypeScript errors in new `InvitationAcceptPage` and any modified `ClientsTab.tsx` or `useCaseClients.ts`
- [ ] T026 [P] Run `npm run lint` — fix all ESLint warnings
- [ ] T027 Run `npm run build` — production build passes; new `/invitation/[invitationId]` route must be accessible without authentication
- [ ] T028 [P] Run `npm run test` — all new unit tests pass

---

## Phase 10: Finalization

**Purpose**: Final review and commit.

- [ ] T029 Confirm `/invitation/[invitationId]` is a public route — verify no Keycloak route guard wraps it in `src/app/providers.tsx` or `src/app/layout.tsx`; the page itself handles the optional auth redirect
- [ ] T030 [P] Confirm gender options in `AddClientModal` include "Non-Binary" as a UI option that maps to "Transgender" for the API — user-visible label must be "Non-Binary", not "Transgender"
- [ ] T031 Commit: `feat(010): add invitation acceptance page; fix OrgClerk/SiteCaseClient RBAC in ClientsTab; add client unit and E2E tests`

---

## Dependencies

- **Setup (Phase 1)**: Start immediately — T004 (create directory) is the only structural task
- **UI (Phase 2)**: T005–T007 (invitation page) can start after T004; T008–T009 depend on T001 audit
- **Logic (Phase 3)**: T010–T011 depend on T005 (page exists); T012–T013 depend on T002 audit
- **API (Phase 4)**: Parallel — verification only; T014 critical for T011 (auth model)
- **Backend (Phase 5)**: Depends on API (Phase 4)
- **Security (Phase 6)**: Depends on UI + Logic
- **Testing (Phase 7)**: Depends on all implementation phases

### Parallel Opportunities

```
After Setup:
  [Parallel] Invitation page (T005-T007) + ClientsTab RBAC fixes (T008-T009) + API check (T014-T015)

After Implementation:
  [Parallel] T021 + T022 (unit test files)
  [Parallel] T025 (type-check) + T026 (lint) + T028 (tests)
```

### Suggested MVP

Build the invitation acceptance page (T005–T007, T010–T011) first — it's the only truly new feature. RBAC fixes (T008–T009) are smaller and can follow.
