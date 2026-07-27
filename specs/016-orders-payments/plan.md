# Implementation Plan: Orders & Payments (016)

**Feature Branch**: `016-orders-payments`
**Spec**: `specs/016-orders-payments/spec.md`
**Date**: 2026-05-14
**Status**: Draft

---

## Summary

Integrate Razorpay to allow clients to pay for appointments. The flow: client clicks "Pay Now" → platform creates a Razorpay order server-side → client completes payment in the Razorpay checkout modal → platform backend verifies HMAC-SHA256 signature → order and appointment status updated to Success. Clients and legal experts see their own orders; SystemAdmin sees all orders with search and delete capability.

---

## Technical Context

- **Razorpay SDK**: Loaded via `next/dynamic` + `ssr: false` — must never run on the server.
- **RAZORPAY_KEY_ID**: Exposed client-side via `NEXT_PUBLIC_RAZORPAY_KEY_ID` env var. The `key_secret` is NEVER sent to or held by the frontend.
- **Signature verification**: HMAC-SHA256 computed on the backend (`order_id + "|" + payment_id`). Frontend only forwards raw Razorpay response fields — no crypto on the client.
- **Auth pattern**: `getToken()` from `keycloakServices.ts` + Axios interceptor for all API calls.
- **State**: No Redux slice needed — order data is per-page and fetched fresh.

---

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| Auth before data | Pass | `initKeycloak()` in providers; token injected by httpServices |
| API calls in domain service | Pass | `src/app/orders/services/api.ts` |
| No secret client-side | Pass | Only `NEXT_PUBLIC_RAZORPAY_KEY_ID` is client-side |
| MUI 6 components | Pass | Table, Dialog, Chip for status badges |
| `next/dynamic` for heavy SDK | Pass | Razorpay script loaded dynamically |
| Delete confirmation dialog | Pass | MUI Dialog required by FR-007 |
| Error via `useToast()` | Pass | All API errors surface through ToastContext |

---

## 1. Overview

The Orders & Payments feature adds a payment lifecycle layer on top of the existing Appointments feature. The frontend is responsible for:

1. Rendering a "Pay Now" button on unpaid appointments.
2. Dynamically loading the Razorpay checkout script and opening the modal with the correct parameters.
3. Forwarding the Razorpay payment result (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`) to the platform's `/orders/confirm` endpoint.
4. Reflecting the updated status (Success/Failed) in the UI.
5. Listing orders per role.

---

## 2. Architecture Flow

```
Client clicks "Pay Now"
        │
        ▼
POST /api/v1/orders/create   ─── returns { orderId, amount, currency, razorpayOrderId, key }
        │
        ▼
Razorpay SDK loaded via next/dynamic
openRazorpayCheckout({ key, orderId: razorpayOrderId, amount, ... })
        │
    ┌───┴───────────────────────────────┐
    │ onSuccess(razorpay_order_id,      │
    │           razorpay_payment_id,    │
    │           razorpay_signature)     │
    └───────────────────┬───────────────┘
                        │
                        ▼
POST /api/v1/orders/confirm
{ razorpay_order_id, razorpay_payment_id, razorpay_signature }
                        │
               ┌────────┴──────────┐
               │ Backend verifies  │
               │ HMAC-SHA256       │
               └────────┬──────────┘
                        │
          ┌─────────────┴──────────────┐
      Success                       Failure
          │                             │
  Update order+appointment         Return error
  status → "Success"               → toast "Payment
          │                         verification failed"
          ▼
  Show success message
  Refresh orders list
```

---

## 3. File Structure

```
src/app/orders/
├── page.tsx                          # Orders list page (role-aware)
├── layout.tsx                        # Optional layout wrapper
├── components/
│   ├── OrdersTable.tsx               # MUI Table of orders
│   ├── OrderStatusChip.tsx           # Chip for Created/Success/Failed
│   ├── PayNowButton.tsx              # "Pay Now" trigger on appointment row
│   ├── RazorpayCheckout.tsx          # Dynamic-loaded Razorpay wrapper
│   ├── DeleteOrderDialog.tsx         # Admin delete confirmation dialog
│   └── AdminOrderSearchBar.tsx       # Search bar for admin list
├── hooks/
│   ├── useOrders.ts                  # Fetch & list orders
│   └── useRazorpayPayment.ts         # Razorpay init + checkout logic
├── services/
│   └── api.ts                        # All orders-domain API calls
└── types.ts                          # Order, OrderStatus TypeScript types
```

---

## 4. Component Design

### `PayNowButton.tsx`
- Props: `appointmentId: string`, `amount: number`, `currency: string`
- Calls `createOrder(appointmentId)` on click → receives Razorpay params → invokes `useRazorpayPayment.openCheckout()`
- Disabled while loading; shows `CircularProgress` inline

### `RazorpayCheckout.tsx`
- Loaded via `next/dynamic(() => import('./RazorpayCheckout'), { ssr: false })`
- Renders nothing visible — imperative Razorpay SDK usage via `new window.Razorpay(options).open()`
- Exposes `openCheckout(params: RazorpayCheckoutParams)` via `useImperativeHandle` or callback prop
- Handles `onSuccess` → calls `confirmOrder()` API → shows success toast
- Handles `onDismiss` → shows "Payment cancelled" toast

### `useRazorpayPayment.ts`
```typescript
// Responsibilities:
// 1. Append Razorpay CDN script tag dynamically (once)
// 2. Call createOrder API
// 3. Open Razorpay modal with returned params
// 4. On success handler: call confirmOrder API
// 5. Surface errors via useToast()
```

### `OrdersTable.tsx`
- Props: `orders: Order[]`, `isAdmin?: boolean`, `onDelete?: (id: string) => void`
- MUI `Table` with columns: Appointment, Client/Expert, Date, Amount, Status, Actions
- Admin sees extra columns + delete icon
- `OrderStatusChip` maps status to MUI `Chip` color: `success` / `default` / `error`

### `DeleteOrderDialog.tsx`
- MUI `Dialog` with "Are you sure?" text
- Confirm → `deleteOrder(id)` API call → refresh list

### `AdminOrderSearchBar.tsx`
- Controlled MUI `TextField` with debounce (300ms)
- Passes search query to `useOrders` hook as filter param

---

## 5. API Plan

All API calls live in `src/app/orders/services/api.ts`. See `contracts/api-contracts.md` for full request/response shapes.

| Method | Endpoint | Actor | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/orders/create` | Client | Create Razorpay order, get checkout params |
| `POST` | `/api/v1/orders/confirm` | Client | Submit Razorpay result for server-side verification |
| `GET` | `/api/v1/orders?userId=...` | Client, Expert, Admin | List orders (backend enforces ownership) |
| `DELETE` | `/api/v1/orders/{id}` | SystemAdmin | Delete an order record |

**Error handling**: All 4xx/5xx errors caught in each service function; error message extracted from `error.response?.data?.message` and surfaced via `useToast().showError()`.

---

## 6. Security Plan

| Risk | Mitigation |
|---|---|
| `key_secret` exposed client-side | Never — only `NEXT_PUBLIC_RAZORPAY_KEY_ID` is on the client |
| Signature forged | HMAC-SHA256 verification is server-side only; frontend never computes it |
| Raw Razorpay payload in logs | API service layer strips Razorpay fields before logging; no `console.log` of payment objects |
| Cross-user order access | `GET /orders?userId=` is validated server-side; frontend never requests another user's ID |
| Admin delete without auth | `deleteOrder` API guarded by role check via bearer token |

---

## 7. State Management

No Redux slice. Orders data is page-scoped:

- `useOrders` hook: `useState<Order[]>` + `useState<boolean>` for loading + `useEffect` for fetch on mount
- Payment flow state: `useState<PaymentStatus>` in `PayNowButton` or `useRazorpayPayment` hook
- Admin search: `useState<string>` in page component, passed as query param to `useOrders`

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| File | Test Cases |
|---|---|
| `OrderStatusChip.test.tsx` | Renders correct color/label for each status |
| `DeleteOrderDialog.test.tsx` | Confirm triggers delete callback; Cancel closes dialog |
| `useRazorpayPayment.test.ts` | createOrder called on trigger; confirmOrder called on success; error toast on failure |
| `useOrders.test.ts` | Fetches orders; sets loading state; handles API error |
| `AdminOrderSearchBar.test.tsx` | Debounce fires after 300ms; clears on empty |

### E2E Tests (Playwright)

| Scenario | Steps |
|---|---|
| Client pay flow (mock Razorpay) | Navigate to appointments → click Pay Now → mock Razorpay response → verify status chip shows Success |
| Payment verification failure | Mock confirmOrder returning 400 → verify error toast shown |
| Admin delete order | Admin navigates to orders → clicks delete → confirms dialog → row removed |
| Client cannot see other orders | Client A's userId param → verify API called with own userId only |

---

## 9. Performance

- **SC-001 (2s modal open)**: Razorpay script pre-loaded on page mount using `next/dynamic` + script append in `useRazorpayPayment` — not on button click.
- **SC-004 (2s list for 50 orders)**: `OrdersTable` uses `React.memo`; no unnecessary re-renders.
- Admin search uses 300ms debounce to limit API calls.

---

## 10. Logging

- Log payment initiation: `console.info('[Orders] Creating order for appointmentId:', appointmentId)` — no amounts.
- Log confirmation event: `console.info('[Orders] Confirm submitted for razorpayOrderId:', razorpay_order_id)` — no signature.
- NEVER log `razorpay_payment_id`, `razorpay_signature`, or any Razorpay response object directly.
- API errors: `console.error('[Orders] API error:', error.message)` only.

---

## 11. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Razorpay CDN blocked | High | Fallback error message; document network requirements |
| Payment completed but confirm API fails | High | Show "Payment verification failed. Contact support." with reference number |
| Razorpay SDK type definitions absent | Medium | Use `declare global { interface Window { Razorpay: ... } }` in types.ts |
| Stale order list after payment | Medium | Force refresh `useOrders` after `confirmOrder` resolves |
| User closes browser mid-payment | Low | Razorpay webhook (out of scope) handles server reconciliation |
