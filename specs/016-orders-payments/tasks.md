# Tasks: Orders & Payments

**Feature**: `016-orders-payments`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Status**: Everything new — Razorpay integration, order lifecycle, order history pages.

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1]**: Client Pays for an Appointment (P1)
- **[US2]**: View Payment/Order History (P2)
- **[US3]**: Admin Manages Orders (P3)

---

## Phase 1: Setup

**Purpose**: Define types, add env var, create directory structure.

- [ ] T001 Create `src/app/orders/types.ts` — define `Order`, `OrderStatus` (`Created | Success | Failed`), `CreateOrderRequest`, `ConfirmOrderRequest`, `RazorpayCheckoutParams`; add `declare global { interface Window { Razorpay: any } }` for SDK type
- [ ] T002 [P] Add `NEXT_PUBLIC_RAZORPAY_KEY_ID` to `.env` file (placeholder value); verify env var is accessible via `process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID`
- [ ] T003 [P] Create directory structure: `src/app/orders/page.tsx`, `src/app/orders/components/`, `src/app/orders/hooks/`, `src/app/orders/services/api.ts`
- [ ] T004 [P] Add `NEXT_PUBLIC_RAZORPAY_KEY_ID` to `NEXT_PUBLIC_AI_ENABLED_ORG_IDS` pattern in `.env` documentation — note: `key_secret` NEVER goes client-side

**Checkpoint**: Types and structure in place — begin building

---

## Phase 2: UI

**Purpose**: Build all order and payment UI components.

- [ ] T005 [US1] Create `src/app/orders/components/PayNowButton.tsx` — props: `{ appointmentId: string, amount: number, currency: string }`; calls `createOrder(appointmentId)` on click → invokes Razorpay checkout; `disabled` while loading; shows `CircularProgress` inline during loading
- [ ] T006 [US1] Create `src/app/orders/components/RazorpayCheckout.tsx` — loaded via `next/dynamic(() => import('./RazorpayCheckout'), { ssr: false })`; uses `new window.Razorpay(options).open()` imperatively; `onSuccess` callback → calls `confirmOrder`; `onDismiss` → shows "Payment cancelled" toast
- [ ] T007 [US2] Create `src/app/orders/components/OrderStatusChip.tsx` — MUI `Chip`: Success=`color="success"`, Failed=`color="error"`, Created=`color="default"`
- [ ] T008 [US2] Create `src/app/orders/components/OrdersTable.tsx` — props: `{ orders: Order[], isAdmin?: boolean, onDelete?: (id: string) => void }`; MUI `Table`; columns: Appointment, Client/Expert, Date, Amount, Status (`OrderStatusChip`), Actions; admin sees extra columns + delete icon
- [ ] T009 [US3] Create `src/app/orders/components/DeleteOrderDialog.tsx` — MUI `Dialog`; "Are you sure?" message; Confirm → `deleteOrder(id)` → refreshes list
- [ ] T010 [US3] Create `src/app/orders/components/AdminOrderSearchBar.tsx` — controlled MUI `TextField`; 300ms debounce; passes query to `useOrders` as filter param
- [ ] T011 [US2] Create `src/app/orders/page.tsx` — Orders list page (`"use client"`); role-aware: Client/Expert see own orders, Admin sees all; uses `OrdersTable`, `AdminOrderSearchBar` (admin only), `DeleteOrderDialog` (admin only)

**Checkpoint**: All UI components renderable — verify visually

---

## Phase 3: Logic

**Purpose**: Build all hooks and business logic.

- [ ] T012 [US1] Create `src/app/orders/hooks/useRazorpayPayment.ts` — responsibilities: (1) append Razorpay CDN script tag once on mount, (2) call `createOrder` API, (3) open Razorpay modal with returned params, (4) on `onSuccess`: call `confirmOrder` API, (5) surface all errors via `useToast().showError()`; state: `PaymentStatus` (`idle | loading | success | failed`)
- [ ] T013 [US1] Wire `useRazorpayPayment` to `PayNowButton` — `PayNowButton` calls `useRazorpayPayment.initiatePayment(appointmentId)` on click
- [ ] T014 [US2] Create `src/app/orders/hooks/useOrders.ts` — state: `orders: Order[]`, `loading: boolean`; fetches on mount via `fetchOrders`; `deleteOrder(id)` removes row from state on 204; exposes `search` state for admin filter
- [ ] T015 [US1] Handle Razorpay `onDismiss` in `useRazorpayPayment` — show "Payment cancelled" toast; reset `PaymentStatus` to idle; do NOT create a failed order record client-side

**Checkpoint**: All hooks implemented — wire to components

---

## Phase 4: API

**Purpose**: Implement all API service functions.

- [ ] T016 Create `src/app/orders/services/api.ts` with all required functions:
  - `createOrder(appointmentId: string)` → `POST /api/v1/orders/create`; returns `{ orderId, amount, currency, razorpayOrderId, key }`
  - `confirmOrder(payload: ConfirmOrderRequest)` → `POST /api/v1/orders/confirm`; payload: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`
  - `fetchOrders(params: { userId?: string, search?: string })` → `GET /api/v1/orders?userId=...`
  - `deleteOrder(id: string)` → `DELETE /api/v1/orders/{id}` — expects 204
- [ ] T017 All functions use `httpServices` Axios; errors extracted from `error.response?.data?.message` and surfaced via `useToast().showError()`
- [ ] T018 `confirmOrder` — forward raw Razorpay response fields only; no HMAC computation on client (that is backend-only)

**Checkpoint**: All API functions implemented and typed

---

## Phase 5: Backend

**Purpose**: Document backend integration contract (verification only — no frontend code).

- [ ] T019 Confirm `POST /api/v1/orders/create` returns `razorpayOrderId`, `amount`, `currency`, and `key` in response body
- [ ] T020 Confirm `POST /api/v1/orders/confirm` performs HMAC-SHA256 server-side — frontend only forwards `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`
- [ ] T021 Confirm `GET /api/v1/orders` backend enforces ownership — returns only current user's orders for Client/Expert; all orders for SystemAdmin
- [ ] T022 Confirm `DELETE /api/v1/orders/{id}` is gated with `[Authorize(Roles = "SystemAdmin")]`

---

## Phase 6: Security

**Purpose**: Enforce all security requirements from plan.md §6.

- [ ] T023 Verify `key_secret` never appears in any frontend file, env var, or log — only `NEXT_PUBLIC_RAZORPAY_KEY_ID` is client-side
- [ ] T024 Verify Razorpay SDK is loaded via `next/dynamic` with `ssr: false` — never runs on server
- [ ] T025 [P] Verify `useRazorpayPayment` NEVER logs `razorpay_payment_id`, `razorpay_signature`, or the full Razorpay response object
- [ ] T026 Verify `fetchOrders` uses current user's ID from JWT (not a user-provided parameter) for Client/Expert scoping
- [ ] T027 Verify `deleteOrder` API call is only accessible from admin UI — `DeleteOrderDialog` and delete action are only rendered for SystemAdmin role

---

## Phase 7: Testing

**Purpose**: Build all unit tests and E2E tests from plan.md §8.

- [ ] T028 [P] [US1] Create `src/app/orders/components/__tests__/OrderStatusChip.test.tsx`:
  - `Success` → renders chip with `color="success"` label "Success"
  - `Failed` → renders chip with `color="error"` label "Failed"
  - `Created` → renders chip with `color="default"` label "Created"
- [ ] T029 [P] [US3] Create `src/app/orders/components/__tests__/DeleteOrderDialog.test.tsx`:
  - Confirm triggers delete callback
  - Cancel closes dialog without calling callback
- [ ] T030 [P] [US1] Create `src/app/orders/hooks/__tests__/useRazorpayPayment.test.ts`:
  - `createOrder` called on trigger
  - `confirmOrder` called on success
  - Error toast shown on failure
- [ ] T031 [P] [US2] Create `src/app/orders/hooks/__tests__/useOrders.test.ts`:
  - Fetches orders on mount
  - Sets loading state correctly
  - Handles API error gracefully
- [ ] T032 [P] [US3] Create `src/app/orders/components/__tests__/AdminOrderSearchBar.test.tsx`:
  - Debounce fires after 300ms
  - Clears on empty input
- [ ] T033 Create `e2e/016-orders-payments.spec.ts` with all 4 E2E scenarios from plan.md §8: client pay flow (mock Razorpay), payment verification failure, admin delete order, client cannot see other orders

**Checkpoint**: All tests written — run `npm run test` to verify unit tests pass

---

## Phase 8: Logging

**Purpose**: Add structured logging per plan.md §10.

- [ ] T034 [US1] Add `console.info` in `useRazorpayPayment` on `createOrder` initiation: log `{ appointmentId }` — no amounts
- [ ] T035 [US1] Add `console.info` in `useRazorpayPayment` on `confirmOrder` submission: log `{ razorpayOrderId }` — no `razorpay_payment_id` or `razorpay_signature`
- [ ] T036 Add `console.error` in API error handlers: log `{ httpStatus, message: error.message }` — no Razorpay response objects

---

## Phase 9: Quality Gates

**Purpose**: Ensure code quality before finalization.

- [ ] T037 [P] Run `npm run type-check` — fix TypeScript errors; ensure `Window.Razorpay` type declaration is present in `types.ts`
- [ ] T038 [P] Run `npm run lint` — fix ESLint errors; no `any` types unless justified
- [ ] T039 Run `npm run test` — confirm all new unit tests pass
- [ ] T040 Run `npm run build` — confirm Razorpay `next/dynamic` import does not cause SSR issues; build must pass

---

## Phase 10: Finalization

**Purpose**: Confirm all spec requirements are satisfied.

- [ ] T041 Verify SC-001: Razorpay modal opens within 2 seconds (script pre-loaded on page mount, not on button click)
- [ ] T042 Verify SC-002: payment status updates within 5 seconds of Razorpay completion (no polling — `confirmOrder` is synchronous)
- [ ] T043 Verify SC-003: invalid payment signatures are rejected with user-friendly error "Payment verification failed. Please contact support." (not raw error details)
- [ ] T044 Verify SC-004: order history renders within 2 seconds for up to 50 orders (`React.memo` on `OrdersTable`)
- [ ] T045 Verify payment session timeout (user closes Razorpay modal) → "Payment cancelled" toast shown; no broken state

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: Start immediately — T001 types required by all phases
- **Phase 2 (UI)**: Depends on T001; components can build in parallel
- **Phase 3 (Logic)**: T012 `useRazorpayPayment` depends on Phase 4 `createOrder`/`confirmOrder` API functions
- **Phase 4 (API)**: Depends on T001 (types); T016 builds all functions in single file
- **Phase 5 (Backend)**: Independent — run in parallel with Phases 2–4
- **Phase 6 (Security)**: Depends on Phases 2–4
- **Phase 7 (Testing)**: Depends on Phases 2–4
- **Phase 8 (Logging)**: Parallel with Phase 7
- **Phase 9 (Quality Gates)**: Depends on Phases 7–8
- **Phase 10 (Finalization)**: Depends on Phase 9
