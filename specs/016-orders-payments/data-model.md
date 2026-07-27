# Data Model: Orders & Payments (016)

**Feature**: `016-orders-payments`
**Date**: 2026-05-14

---

## Entity Tables

### Order

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `string` | PK | Platform order UUID |
| `appointmentId` | `string` | FK → Appointment | Linked appointment |
| `clientId` | `string` | FK → User | Paying client |
| `expertId` | `string` | FK → User | Receiving expert |
| `amount` | `number` | > 0 | Amount in smallest currency unit (paise) |
| `currency` | `string` | Default `"INR"` | ISO 4217 currency code |
| `status` | `OrderStatus` | Enum | `Created` / `Success` / `Failed` |
| `razorpayOrderId` | `string` | Unique | Razorpay-generated order ID (e.g., `order_xxxxx`) |
| `razorpayPaymentId` | `string \| null` | Nullable | Set after successful payment |
| `createdAt` | `string` | ISO 8601 | Record creation timestamp |
| `updatedAt` | `string` | ISO 8601 | Last status change timestamp |

### OrderListItem (for API list responses)

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Order ID |
| `appointmentId` | `string` | Appointment reference |
| `appointmentDate` | `string` | ISO 8601 datetime of appointment |
| `clientName` | `string` | Full name of client |
| `expertName` | `string` | Full name of legal expert |
| `amount` | `number` | Amount in paise |
| `currency` | `string` | `"INR"` |
| `status` | `OrderStatus` | `Created` / `Success` / `Failed` |
| `createdAt` | `string` | Order creation timestamp |

### CreateOrderRequest

| Field | Type | Description |
|---|---|---|
| `appointmentId` | `string` | The appointment being paid for |

### CreateOrderResponse

| Field | Type | Description |
|---|---|---|
| `orderId` | `string` | Platform order ID |
| `razorpayOrderId` | `string` | Razorpay order ID to pass to SDK |
| `amount` | `number` | Amount in paise |
| `currency` | `string` | `"INR"` |
| `key` | `string` | Razorpay `key_id` (publishable, safe for client) |

### ConfirmOrderRequest

| Field | Type | Description |
|---|---|---|
| `razorpay_order_id` | `string` | From Razorpay success callback |
| `razorpay_payment_id` | `string` | From Razorpay success callback |
| `razorpay_signature` | `string` | From Razorpay success callback |

### RazorpayCheckoutParams (internal, passed to SDK)

| Field | Type | Description |
|---|---|---|
| `key` | `string` | `NEXT_PUBLIC_RAZORPAY_KEY_ID` |
| `amount` | `number` | Amount in paise |
| `currency` | `string` | `"INR"` |
| `order_id` | `string` | `razorpayOrderId` from create response |
| `name` | `string` | Platform name shown in modal |
| `description` | `string` | e.g., "Appointment Payment" |
| `handler` | `function` | Callback on payment success |
| `modal.ondismiss` | `function` | Callback on modal close/cancel |
| `prefill.contact` | `string` | Client phone number |
| `prefill.email` | `string` | Client email |

---

## TypeScript Interfaces

```typescript
// src/app/orders/types.ts

export type OrderStatus = 'Created' | 'Success' | 'Failed';

export interface Order {
  id: string;
  appointmentId: string;
  clientId: string;
  expertId: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListItem {
  id: string;
  appointmentId: string;
  appointmentDate: string;
  clientName: string;
  expertName: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  createdAt: string;
}

export interface CreateOrderRequest {
  appointmentId: string;
}

export interface CreateOrderResponse {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
}

export interface ConfirmOrderRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface ConfirmOrderResponse {
  success: boolean;
  orderId: string;
  status: OrderStatus;
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  handler: (response: RazorpaySuccessResponse) => void;
  modal: {
    ondismiss: () => void;
  };
  prefill?: {
    contact?: string;
    email?: string;
  };
}

// Global window type augmentation for Razorpay CDN SDK
declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
    };
  }
}
```
