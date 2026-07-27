# Tasks: Site Management

**Feature**: `022-site-management`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Status**: `SiteManagementTab` (539 lines) and all API functions exist — tasks focus on RBAC audit, "has users" error handling, map picker verification, and new tests.

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1]**: View Sites in the Organization (P1)
- **[US2]**: Update Site Details (P2)
- **[US3]**: Delete a Site (P3)
- **[US4]**: View Sites by User Assignment (P4)

---

## Phase 1: Setup

**Purpose**: Audit existing `SiteManagementTab` and API functions for compliance.

- [ ] T001 Read `src/app/organization/components/SiteManagementTab/SiteManagementTab.tsx` — document: current RBAC gate on edit/delete buttons, current delete confirmation message, current "has users" error handling
- [ ] T002 [P] Verify all required API functions exist in `src/app/organization/services/api.ts`: `fetchOrganizationSites`, `fetchSite`, `updateSite`, `deleteSite`
- [ ] T003 [P] Check `src/app/organization/[id]/sites/[siteId]/settings/page.tsx` — verify it exists for site-level role single-site view; create stub if missing
- [ ] T004 [P] Verify `EditSiteModal.tsx` exists and contains Google Maps coordinate picker component

**Checkpoint**: Gaps documented — proceed with targeted fixes

---

## Phase 2: UI

**Purpose**: Verify and fix all UI rendering rules per spec.

- [ ] T005 [US1] Verify `SiteManagementTab` edit button is gated:
  ```typescript
  const canEdit = isOrgAdmin || isOrgClerk || isSiteAdmin || isSiteClerk;
  {canEdit && <IconButton><EditIcon /></IconButton>}
  ```
  Add or fix gate if missing — `SiteLegalExpert` and `SiteSrLegalExpert` must NOT see Edit
- [ ] T006 [US3] Verify `SiteManagementTab` delete button is gated:
  ```typescript
  const canDelete = isOrgAdmin || isSystemAdmin;
  {canDelete && <IconButton><DeleteIcon /></IconButton>}
  ```
  Add or fix gate if missing — `SiteClerk` and `OrganizationClerk` must NOT see Delete
- [ ] T007 [US1] Verify `SiteManagementTab` renders sites list with: site name, address summary, `Active`/`Inactive` status `Chip` badge, and role-conditional action buttons (FR-001)
- [ ] T008 [US1] Verify all-sites list visibility: `{(isOrgAdmin || isSystemAdmin || isOrgClerk) && <SitesList />}` — site-level roles see own site only, not full list (FR-007)
- [ ] T009 [US2] Verify `EditSiteModal` includes all fields from creation: name, street address, city, state (dropdown from reference data), pincode, contact email, contact phone, active toggle, Google Maps coordinate picker
- [ ] T010 [US2] Verify Google Maps coordinate picker is loaded via `next/dynamic` with `ssr: false` in `EditSiteModal` — add dynamic import if not present
- [ ] T011 [US4] Verify site-level role single-site view at `/organization/{orgId}/sites/{siteId}/settings` — `SiteAdmin`/`SiteClerk` see Edit button; `SiteLegalExpert`/`SiteSrLegalExpert` see read-only (no Edit)
- [ ] T012 [US3] Update `ConfirmDialog` message in `SiteManagementTab` for delete: "Are you sure? This will permanently delete the site and all its cases. This cannot be undone." (FR-004)

**Checkpoint**: All UI rendering rules verified and corrected

---

## Phase 3: Logic

**Purpose**: Verify and fix business logic in `SiteManagementTab`.

- [ ] T013 [US2] Verify `updateSite(orgId, siteId, payload)` submit flow: on 200 refreshes site data in list; on 400 shows inline errors from `extractApiErrors`; on other errors shows `showError`
- [ ] T014 [US3] Verify `deleteSite(orgId, siteId)` error handling — on backend "has users" error (400 or 409): `showError("This site has assigned users. Please remove all users before deleting the site.")` — add specific error message mapping if missing
- [ ] T015 [US3] Verify delete confirmation dialog closes and error toast shows when backend rejects delete — dialog must NOT stay open with confusing state
- [ ] T016 Verify `contact email` is stored lowercase: `payload.contactEmail = email.toLowerCase()` before `updateSite` API call — add if missing

**Checkpoint**: All logic gaps fixed

---

## Phase 4: API

**Purpose**: Verify all existing API function signatures.

- [ ] T017 [US1] Verify `fetchOrganizationSites(orgId)` → `GET /organizations/{orgId}/sites`; returns `Site[]`
- [ ] T018 [US2] Verify `updateSite(orgId, siteId, payload: UpdateSiteRequest)` → `PUT /organizations/{orgId}/sites/{siteId}`; `UpdateSiteRequest` includes all edit form fields including coordinates
- [ ] T019 [US3] Verify `deleteSite(orgId, siteId)` → `DELETE /organizations/{orgId}/sites/{siteId}` — expects 204 on success; handles 400 (has users) distinctly from other errors

**Checkpoint**: All API functions confirmed correct

---

## Phase 5: Backend

**Purpose**: Confirm backend contract for site management (verification only).

- [ ] T020 Confirm backend returns specific error (400 or 409) with identifiable message when deleting a site with assigned users — document exact error shape for frontend mapping
- [ ] T021 Confirm `PUT /organizations/{orgId}/sites/{siteId}` accepts all fields including `latitude`, `longitude` coordinates
- [ ] T022 Confirm `[Authorize]` role list on `DELETE` endpoint: only OrgAdmin and SystemAdmin allowed; SiteClerk returns 403

---

## Phase 6: Security

**Purpose**: Enforce all security requirements from plan.md §6.

- [ ] T023 [US2] Verify `SiteLegalExpert` cannot access Edit button — test that RBAC gate excludes `SiteLegalExpert` and `SiteSrLegalExpert` even if they navigate directly to site settings URL
- [ ] T024 [US3] Verify `SiteClerk` cannot see Delete button — `canDelete` condition excludes `SiteClerk` explicitly
- [ ] T025 Verify cascade delete warning in confirm dialog explicitly states "all its cases will also be deleted" — prevent admin surprise
- [ ] T026 [P] Verify contact email is stored lowercase: `payload.contactEmail = email.toLowerCase()` before API call
- [ ] T027 Verify `NEXT_PUBLIC_GOOGLE_API_KEY` is in env var (not hardcoded) for Google Maps; key is domain-restricted on Google side (acceptable for Maps JS API)

---

## Phase 7: Testing

**Purpose**: Build all unit tests and E2E tests from plan.md §8.

- [ ] T028 [P] [US1] Create `src/app/organization/components/SiteManagementTab/__tests__/SiteManagementTab.test.tsx`:
  - OrgAdmin → Edit + Delete buttons both in DOM
  - SiteLegalExpert → no Edit button
  - SiteClerk → Edit visible, Delete absent
  - Delete → ConfirmDialog shown
  - Delete "has users" error → `showError` called with specific message
  - Edit submit → `updateSite` API mock called
  - Sites list → rows count matches API response
  - Empty sites → EmptyState shown
- [ ] T029 Create `e2e/022-site-management.spec.ts` with all 7 E2E scenarios from plan.md §8: view all sites, edit site name, edit coordinates via map, delete golden path, delete blocked by users, SiteLegalExpert read-only, SiteAdmin own site only

**Checkpoint**: All tests written — run `npm run test` to verify unit tests pass

---

## Phase 8: Logging

**Purpose**: Add structured logging per plan.md §10.

- [ ] T030 [US1] Add `console.info` on site list fetch: log `{ orgId, userId, count }`
- [ ] T031 [US2] Add `console.info` on `updateSite` success: log `{ orgId, siteId, userId, changedFields: Object.keys(payload) }` — do NOT log field values
- [ ] T032 [US3] Add `console.info` on `deleteSite` success: log `{ orgId, siteId, userId }`
- [ ] T033 [US3] Add `console.warn` on site delete rejected (has users): log `{ orgId, siteId, reason: 'has_users' }`
- [ ] T034 Add `console.warn` on unauthorized edit attempt: log `{ userId, role, siteId }`

---

## Phase 9: Quality Gates

**Purpose**: Ensure code quality before finalization.

- [ ] T035 [P] Run `npm run type-check` — fix TypeScript errors in `SiteManagementTab.tsx`, `EditSiteModal.tsx`, and site settings page
- [ ] T036 [P] Run `npm run lint` — fix ESLint errors
- [ ] T037 Run `npm run test` — confirm all new unit tests pass
- [ ] T038 Run `npm run build` — confirm Google Maps `next/dynamic` import does not cause SSR issues; build must pass

---

## Phase 10: Finalization

**Purpose**: Confirm all spec requirements are satisfied.

- [ ] T039 Verify SC-001: sites list renders within 2 seconds for org with up to 20 sites
- [ ] T040 Verify SC-002: "has users" delete guard works — attempt to delete site with assigned user; confirm site remains and error shown
- [ ] T041 Verify SC-003: edit form pre-fills all current values on first render (no blank fields)
- [ ] T042 Verify SC-004: SiteLegalExpert sees own site in read-only mode with no Edit controls visible at all
- [ ] T043 Verify Google Maps coordinate picker works in `EditSiteModal` — drag pin and save; confirm new coordinates persisted

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: Start immediately — audit must complete before fixes
- **Phases 2–3 (UI, Logic)**: Depend on Phase 1; T005–T016 are targeted fixes to existing file
- **Phase 4 (API)**: Verification only — parallel with Phase 2
- **Phase 5 (Backend)**: Independent — run in parallel
- **Phase 6 (Security)**: Depends on Phase 2 (after RBAC gates fixed)
- **Phase 7 (Testing)**: Depends on Phases 2–4
- **Phase 8 (Logging)**: Parallel with Phase 7
- **Phase 9 (Quality Gates)**: Depends on Phases 7–8
- **Phase 10 (Finalization)**: Depends on Phase 9
