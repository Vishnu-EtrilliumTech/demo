# Design Decisions: Orders & Payments (016)

**Feature**: `016-orders-payments`
**Date**: 2026-05-14

---

## Decision 1: Razorpay SDK Loading Strategy

**Decision**: Load Razorpay via `next/dynamic` with `ssr: false` + append CDN script tag in a `useEffect`.

**Options Considered**:
- A. Import Razorpay npm package directly — fails because it calls `window` at module load time, incompatible with SSR.
- B. Use `next/script` with `strategy="lazyOnload"` — causes timing issues since the script may not be ready when the checkout opens.
- C. `next/dynamic` + imperative `<script>` tag append in `useRazorpayPayment` hook — gives full control over loading lifecycle and is compatible with Next.js 15 App Router.

**Rationale**: Option C is the established Razorpay + Next.js pattern. The script is appended once on hook mount, and `window.Razorpay` availability is checked before opening the modal. This avoids SSR errors and race conditions.

---

## Decision 2: No Redux for Order State

**Decision**: Use local `useState` in `useOrders` hook; no Redux slice.

**Options Considered**:
- A. Redux slice with async thunks — adds boilerplate and Redux-Persist would persist payment data unnecessarily.
- B. React Query / SWR — additional dependency not used elsewhere in the project.
- C. Local `useState` + `useEffect` — consistent with existing patterns for page-scoped data.

**Rationale**: Order data is per-page and role-scoped. There is no cross-page state sharing requirement. Local state in a custom hook keeps the pattern consistent with the rest of the codebase.

---

## Decision 3: Signature Verification — Server-Only Rule

**Decision**: The frontend sends the three Razorpay fields (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`) directly to the platform backend without any client-side crypto.

**Rationale**: HMAC-SHA256 requires the `key_secret` which must NEVER leave the server. Any client-side attempt to verify would require exposing the secret, which is a critical security vulnerability. The frontend acts purely as a transport layer for these fields.

---

## Decision 4: Razorpay Key as `NEXT_PUBLIC_` Env Var

**Decision**: Expose only `NEXT_PUBLIC_RAZORPAY_KEY_ID` to the client. The `key_secret` remains a server-only env var.

**Rationale**: `NEXT_PUBLIC_` vars are bundled into client-side JavaScript. The `key_id` (publishable key) is safe to expose — it is analogous to Stripe's publishable key. The `key_secret` must remain exclusively in the backend service environment.

---

## Decision 5: Payment Cancellation Handling

**Decision**: Razorpay's `modal.ondismiss` callback triggers a "Payment cancelled" toast; no order record is created or modified.

**Rationale**: The platform creates the Razorpay order server-side before the modal opens, but the platform's own Order record should only be created (or confirmed) after a successful payment signal. A dismissed modal means no money changed hands — no state mutation needed.

---

## Decision 6: `OrderStatusChip` as Isolated Component

**Decision**: Create a dedicated `OrderStatusChip` component rather than inline Chip logic.

**Rationale**: Status display logic (Created → grey, Success → green, Failed → red) is used in both the client orders table and the admin orders table. Centralizing it avoids duplication and makes future status additions (e.g., `Refunded`) a single-file change.

---

## Decision 7: Admin Search via Query Param (Not Client-Side Filter)

**Decision**: Admin search sends a `?search=` query param to the API rather than filtering a fully-loaded list.

**Rationale**: Admin may see thousands of orders. Fetching all orders then filtering client-side is not scalable. Server-side search aligns with SC-004's 2-second performance target.

---

## Decision 8: Razorpay Global Type Declaration

**Decision**: Declare `window.Razorpay` type in `src/app/orders/types.ts` using `declare global`.

**Rationale**: The Razorpay SDK is loaded via CDN script tag — there is no npm package with bundled TypeScript types available for the `window.Razorpay` constructor. A local declaration avoids TypeScript errors without introducing an unofficial types package.
