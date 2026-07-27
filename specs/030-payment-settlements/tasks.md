# Tasks: Payment Settlements

**Feature Branch**: `030-payment-settlements`
**Input**: `specs/030-payment-settlements/plan.md`, `specs/030-payment-settlements/spec.md`

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = Expert Views Own Settlements, US2 = Admin Views & Manages Settlements

---

## Phase 1: Setup

**Purpose**: Create file structure and API module.

- [ ] T001 Create directory `src/app/profile/components/SettlementsSection/` per plan.md §3
- [ ] T002 [P] Create directory `src/app/admin-dashboard/settlements/components/` per plan.md §3
- [ ] T003 [P] Create directory `src/app/settlements/services/` and `src/app/settlements/types/` per plan.md §3
- [ ] T004 Confirm settlements API endpoints will be NEW — coordinate with backend team before implementation (risk: HIGH per plan.md §11)
- [ ] T005 [P] Confirm expert ID from Keycloak token type (UUID vs int) and how it maps to API `expertId` path param (risk per plan.md §11)

---

## Phase 2: UI

**Purpose**: Build expert settlements view and admin settlements management UI.

- [ ] T006 [US1] Create `src/app/profile/components/SettlementsSection/SettlementsSection.tsx` — MUI `<Table>` columns: Appointment Reference, Settlement Date, Amount, Status; status as MUI `<Chip>` (amber = Pending, green = Settled); NO action column; `<EmptyState message="No payment settlements yet." description="Settlements appear automatically after appointments are booked." />` when empty; MUI Skeleton rows during fetch
- [ ] T007 [US2] Create `src/app/admin-dashboard/settlements/components/AdminSettlementsView.tsx` — MUI `<Table>` columns: Expert Name, Appointment Reference, Settlement Date, Amount, Status, Actions; expert filter search field; "Delete" button per row (SystemAdmin only); `ConfirmDialog` before delete
- [ ] T008 [US2] Create `src/app/admin-dashboard/settlements/page.tsx` — `"use client"` route; SystemAdmin role check; renders `AdminSettlementsView`

---

## Phase 3: Logic

**Purpose**: Implement settlement date computation and access control.

- [ ] T009 [US1] Implement settlement date display in `SettlementsSection.tsx` — use `date-fns` `addDays(new Date(settlement.appointmentDate), 3)` and `format(settlementDate, "dd MMM yyyy")` if `settlementDate` not in API response; prefer backend-provided `settlementDate` field if present (plan.md §2.5)
- [ ] T010 [US1] Derive `expertId` from Keycloak token in `SettlementsSection.tsx` — NEVER read expertId from URL params; always use authenticated user's own ID to scope the fetch (IDOR prevention per plan.md §6)
- [ ] T011 [US2] Implement expert filter in `AdminSettlementsView.tsx` — text input for expert name/ID; filter triggers `fetchAllSettlements({ expertId })` call
- [ ] T012 [US2] Wire delete flow in `AdminSettlementsView.tsx` — `settlementToDelete` state; ConfirmDialog confirm → `deleteSettlement(settlementId)` → 204 removes row → `showSuccess`; error → `showError`

---

## Phase 4: API

**Purpose**: Implement settlements API service functions.

- [ ] T013 Create `src/app/settlements/types/index.ts` — `Settlement { id, expertId, expertName?, appointmentId, appointmentReference, appointmentDate, settlementDate?, amount, currency, status: 'Pending' | 'Settled' | 'Cancelled' }` per plan.md §4.3
- [ ] T014 Implement `fetchExpertSettlements(expertId)` in `src/app/settlements/services/api.ts` → `GET /api/v1/legal-experts/{expertId}/settlements` — Bearer (own expert or SystemAdmin); supports `page`, `pageSize` params
- [ ] T015 [P] Implement `fetchAllSettlements(params: { expertId?: string, page?: number, pageSize?: number })` → `GET /api/v1/settlements` — Bearer (SystemAdmin only)
- [ ] T016 [P] Implement `deleteSettlement(settlementId)` → `DELETE /api/v1/settlements/{settlementId}` — Bearer (SystemAdmin only); returns 204
- [ ] T017 Confirm settlement status string values from backend (`'Pending'`, `'Settled'`, `'Cancelled'`) match the `Settlement.status` union type; add mapping if backend uses different casing (risk per plan.md §11)

---

## Phase 5: Backend

**Purpose**: Validate backend contract assumptions for new endpoints.

- [ ] T018 Confirm `GET /api/v1/legal-experts/{expertId}/settlements` validates JWT subject === `expertId` path param — returns 403 on mismatch (IDOR prevention)
- [ ] T019 [P] Confirm `GET /api/v1/settlements` is restricted to SystemAdmin role on backend (`[Authorize(Roles = "SystemAdmin")]`)
- [ ] T020 [P] Confirm `DELETE /api/v1/settlements/{settlementId}` is restricted to SystemAdmin on backend
- [ ] T021 [P] Confirm whether `settlementDate` is returned directly from API or must be computed client-side as `appointmentDate + 3 days`

---

## Phase 6: Security

**Purpose**: Enforce IDOR prevention and access control.

- [ ] T022 Verify `expertId` in `fetchExpertSettlements` call always comes from Keycloak token — never from URL params or query strings; add comment explaining the IDOR mitigation
- [ ] T023 [P] Verify `SettlementsSection.tsx` renders NO action column (no create, edit, or delete controls) — expert view is strictly read-only
- [ ] T024 [P] Verify admin settlements page at `/admin-dashboard/settlements` checks for SystemAdmin role before rendering `AdminSettlementsView`
- [ ] T025 [P] Verify `deleteSettlement` can only be triggered from `AdminSettlementsView` — no delete entry point exists in expert-facing `SettlementsSection`

---

## Phase 7: Testing

**Purpose**: Unit and E2E test coverage.

- [ ] T026 Create `src/app/profile/components/SettlementsSection/__tests__/SettlementsSection.test.tsx` — tests: expert role shows settlements list with no action column; empty settlements shows EmptyState with description; settlement date computed correctly (appt date + 3 days); Pending status chip shows amber styling
- [ ] T027 Create unit tests for `AdminSettlementsView.tsx` — tests: SystemAdmin sees Delete button on each row; click Delete opens ConfirmDialog; confirm delete calls `deleteSettlement` API mock
- [ ] T028 Create `e2e/030-payment-settlements.spec.ts` — E2E: expert views own settlements (no delete controls); expert empty state shown; cross-expert URL manipulation shows access denied; admin views settlements; admin deletes settlement confirms removal

---

## Phase 8: Logging

**Purpose**: Instrument observability events per plan.md §10.

- [ ] T029 Add INFO log on expert settlements fetch: `expertId`, `requesterId`, count — no amounts or appointment details
- [ ] T030 [P] Add INFO log on admin settlements fetch: `requesterId`, filter params, count
- [ ] T031 [P] Add INFO log on settlement deleted: `settlementId`, `appointmentId`, `expertId`, `deletedByAdminId` — no amount (payment correlation via `appointmentId`)
- [ ] T032 [P] Add WARN log on cross-expert access attempt (403): `requesterId`, `targetExpertId`
- [ ] T033 [P] Add AUDIT log on admin delete: `settlementId`, `expertId`, `adminId`, timestamp (plan.md §10)

---

## Phase 9: Quality Gates

**Purpose**: Ensure all pre-commit checks pass.

- [ ] T034 Run `npm run type-check` — zero TypeScript errors in `SettlementsSection.tsx`, `AdminSettlementsView.tsx`, `src/app/settlements/services/api.ts`, `src/app/settlements/types/index.ts`
- [ ] T035 [P] Run `npm run lint` — zero ESLint errors; no `any` types
- [ ] T036 [P] Run `npm run build` — production build succeeds

---

## Phase 10: Finalization

**Purpose**: Polish and branch readiness.

- [ ] T037 Apply `React.memo` to settlement row components to prevent re-renders on filter/modal state changes (plan.md §9)
- [ ] T038 [P] Confirm MUI `TablePagination` is wired if settlement list exceeds page size (plan.md §11)
- [ ] T039 [P] Confirm `date-fns` `addDays` import is used only when `settlementDate` is absent from API response — prefer backend-computed value

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: Start immediately; confirm backend availability first
- **UI (Phase 2)**: Requires Phase 1 directory creation
- **Logic (Phase 3)**: Requires Phase 2 and Phase 4 types
- **API (Phase 4)**: Can run in parallel with Phase 2 (types first, then functions)
- **Backend (Phase 5)**: Must be confirmed before Phase 4 implementation
- **Security (Phase 6)**: Requires Phase 3 complete
- **Testing (Phase 7)**: Requires Phase 2, 3, 4 complete
- **Logging (Phase 8)**: Requires Phase 3 complete
- **Quality Gates (Phase 9)**: Requires all prior phases
- **Finalization (Phase 10)**: Requires Phase 9 passing

## Total Task Count: 39
- US1 tasks: 12 | US2 tasks: 10 | Cross-cutting: 17
