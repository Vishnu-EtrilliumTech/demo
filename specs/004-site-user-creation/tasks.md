# Tasks: Site User Creation

**Input**: `specs/004-site-user-creation/`
**Branch**: `004-site-user-creation`

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1=Admin adds site user, US2=Non-admin cannot assign SiteAdmin role, US3=Duplicate email rejected

---

## Phase 1: Setup

**Purpose**: Audit existing code to identify the exact gaps to fix before writing new code.

- [ ] T001 Read `src/app/organization/[id]/users/new/page.tsx` — audit current `isSiteMode` branch, `canCreateAdmin`/`canCreateClerk` logic, and existing `enabled` field state (confirm `enabled: true` is hardcoded)
- [ ] T002 [P] Read `src/app/organization/services/api.ts` `createSiteUser()` call — confirm `enabled: true` is hardcoded in payload (confirmed gap from plan) and `CreateSiteUserPayload` interface
- [ ] T003 [P] Read `src/app/organization/[id]/sites/[siteId]/users/new/page.tsx` — confirm it re-exports `NewUserPage` (should need no changes)
- [ ] T004 [P] Verify `useUserRole` hook exports `isSiteClerk`, `isSiteLegalExpert`, `isSiteSrLegalExpert` flags needed for role dropdown filtering

---

## Phase 2: UI

**Purpose**: Add the `enabled` toggle to the site user creation form.

- [ ] T005 [US1] Add `enabled: false` to initial `formData` state in `src/app/organization/[id]/users/new/page.tsx` — spec says enabled defaults to OFF (FR-006)
- [ ] T006 [US1] Add MUI `Switch` toggle "Enable user immediately" inside the site-mode form section (`isSiteMode && ...`) in `new/page.tsx` — placed after Gender field; updates `formData.enabled` on change
- [ ] T007 [US2] Verify role dropdown in site-mode renders the correct options based on caller's role — `SiteAdmin`, `SiteClerk`, `SiteLegalExpert`, `SiteSrLegalExpert` when `canCreateAdmin=true`; excludes `SiteAdmin` when `canCreateAdmin=false`

---

## Phase 3: Logic

**Purpose**: Fix submit payload, success message, and role dropdown logic.

- [ ] T008 [US1] Update success message in `new/page.tsx` from `'User created successfully'` to `` `${formData.fullName} has been added and an invitation email has been sent.` `` (FR-004 / spec P1 scenario 2)
- [ ] T009 [US1] Ensure `createSiteUser` is called with `enabled: formData.enabled` (not hardcoded `true`) — pass the toggle value from form state in the submit handler
- [ ] T010 [US2] Verify `canCreateAdmin` and `canCreateClerk` logic: `canCreateAdmin = !isSiteClerk && !isLegalExpert && !isSiteSrLegalExpert`; `canCreateClerk = !isLegalExpert && !isSiteSrLegalExpert` — add `isSiteSrLegalExpert` to the check if missing
- [ ] T011 [US1] Verify gender transform (`Non-Binary` → `Transgender`) is applied in the submit handler in site mode (existing code — confirm it applies to both org-mode and site-mode paths)

---

## Phase 4: API

**Purpose**: Update `CreateSiteUserPayload` to include `enabled` and fix hardcoded value.

- [ ] T012 Update `createSiteUser()` in `src/app/organization/services/api.ts` — replace `enabled: true` hardcoded with `userData.enabled` (or spread without override); keep `CreateSiteUserPayload` type including `enabled: boolean`
- [ ] T013 [P] Confirm `CreateSiteUserPayload` interface in `src/app/organization/types/index.ts` (or `api.ts`) includes all required fields: `fullName`, `emailId`, `phoneNumber`, `gender`, `roles`, `enabled`

---

## Phase 5: Backend

**Purpose**: Verify backend behaviour for enabled=false and role validation.

- [ ] T014 Confirm POST `/api/v1/organizations/{orgId}/sites/{siteId}/users` with `enabled: false` returns `201` and user is created in disabled state; confirm invitation email is sent by backend on creation
- [ ] T015 [P] Confirm POST with `roles: ['SiteAdmin']` from a `SiteClerk` caller returns `401` — backend must enforce role restriction independently of frontend UI gate

---

## Phase 6: Security

**Purpose**: Enforce role-based dropdown filtering so `SiteAdmin` cannot be assigned by non-admins.

- [ ] T016 [US2] Verify `canCreateAdmin=false` for `SiteClerk`, `SiteLegalExpert`, `SiteSrLegalExpert` callers — `SiteAdmin` option must be absent from the role dropdown in site mode; backend is the security gate but UI must not offer the role
- [ ] T017 [US3] Verify 409 duplicate email error message is surfaced as `apiErrors` (visible to the user inline or as toast) and does not expose internal server details
- [ ] T018 Verify `phoneNumber` is validated with `phone()` validator from `src/utils/validation.ts` before submit — no special chars or injection possible through phone field

---

## Phase 7: Testing

**Purpose**: Unit and E2E test coverage for all three user stories.

- [ ] T019 [P] [US1] Write unit test `specs/004-site-user-creation/__tests__/NewUserPage.site.test.tsx` — form renders all required fields in site mode; `enabled` toggle present with default false; valid submit calls `createSiteUser` with `enabled: false`; toggle enabled → submit sends `enabled: true`; success shows updated message with user name
- [ ] T020 [P] [US2] Write unit tests for role dropdown: `SiteAdmin` absent when caller is `SiteClerk` (mock `useUserRole` to `isSiteClerk=true`); `SiteAdmin` absent when `isSiteLegalExpert=true`; `SiteAdmin` present when `isSiteAdmin=true`
- [ ] T021 [P] [US3] Write unit test for duplicate email — mock `createSiteUser` to return 409; assert error message displayed; no navigation occurs
- [ ] T022 [P] [US1] Write unit test for success navigation — valid submit with mocked 201 response → assert `router.push` called with `#users` hash
- [ ] T023 Write E2E test `e2e/004-site-user-creation.spec.ts` — SiteAdmin adds SiteClerk golden path; SiteClerk cannot see SiteAdmin in role dropdown; duplicate email shows error; newly added user appears in site user list

---

## Phase 8: Logging

**Purpose**: Structured logging per plan section 10.

- [ ] T024 Add `console.error(error)` before setting `apiErrors` on 4xx in `new/page.tsx` submit handler (do not log `emailId` or `phoneNumber`); add `console.warn` for 401 role escalation rejection — no PII in any log call

---

## Phase 9: Quality Gates

**Purpose**: Pre-commit checks must pass.

- [ ] T025 Run `npm run type-check` — fix TypeScript errors in modified `new/page.tsx`, `api.ts`, and any updated payload interfaces
- [ ] T026 [P] Run `npm run lint` — fix all ESLint warnings in modified files
- [ ] T027 Run `npm run build` — production build passes
- [ ] T028 [P] Run `npm run test` — all new unit tests pass

---

## Phase 10: Finalization

**Purpose**: Final verification and commit.

- [ ] T029 Confirm `src/app/organization/[id]/sites/[siteId]/users/new/page.tsx` re-exports `NewUserPage` without changes and the fix automatically applies to the site user route
- [ ] T030 [P] Verify `enabled` toggle is only rendered in `isSiteMode=true` path — org user creation path should not show the toggle (different spec)
- [ ] T031 Commit: `feat(004): fix enabled default toggle and success message for site user creation`

---

## Dependencies

- **Setup (Phase 1)**: Start immediately — read-only audit
- **UI (Phase 2)**: Depends on T001 (audit findings)
- **Logic (Phase 3)**: Depends on T001–T004; T010 depends on T004
- **API (Phase 4)**: Depends on T002 (confirmed gap)
- **Security (Phase 6)**: Depends on Logic (Phase 3)
- **Testing (Phase 7)**: Depends on all implementation phases

### Parallel Opportunities

```
After Setup:
  [Parallel] UI (T005-T007) + Logic (T008-T011) + API (T012-T013)

After Implementation:
  [Parallel] T025 (type-check) + T026 (lint) + T028 (tests)
  [Parallel] T019 + T020 + T021 + T022 (all test files)
```
