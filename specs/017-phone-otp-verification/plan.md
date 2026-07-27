# Implementation Plan: Phone OTP Verification

**Branch**: `017-phone-otp-verification` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/017-phone-otp-verification/spec.md`

---

## 1. Overview

### What Exists
- `src/app/register/otp/page.tsx` — a 4-digit OTP page used during the **legal expert registration** flow. It posts to `POST /api/v1/verifications/phonenumber/{phoneNumber}/code/{otpCode}` and triggers expert registration on success.
- `src/services/keycloakServices.ts` — Keycloak auth/token management used by the verification call.

### What This Feature Adds
The spec covers OTP verification for **authenticated users during profile setup** — a distinct context from registration. Key differences:
- The actor is an already-authenticated user (any role), not an unauthenticated registrant.
- The input is a 10-digit Indian mobile number (validated client-side: starts 6–9).
- The OTP code is 6 characters (not 4 as in the registration page).
- The verify response returns HTTP 200 always; the UI must read the `data` field to determine success vs. failure.
- A "Resend OTP" action must be available after the OTP is sent.

### Gaps to Close
1. Build a reusable `PhoneOtpVerification` component (6-char input, Indian phone validation, resend).
2. Add API service functions: `sendPhoneOtp(orgId, phoneNumber)` and `verifyPhoneOtp(orgId, phoneNumber, code)`.
3. Wire component into the user profile page (`src/app/profile/page.tsx` or a dedicated verification route).
4. Add unit tests for the hook and E2E for the golden path.

---

## 2. Architecture Flow

### 2.1 Send OTP

```
User on profile/verification page
  → PhoneOtpVerification component renders
  → User enters 10-digit phone number
  → onBlur → validateSingleField('phoneNumber', value)
    → reject if not /^[6-9]\d{9}$/
  → User clicks "Send OTP"
  → button disabled while in-flight
  → sendPhoneOtp(phoneNumber)
      → POST /api/v1/phoneverification/send (or equivalent)
  → 200 → setOtpSent(true) → reveal 6-char OTP input
          → showInfo("OTP sent to your phone.")
  → error → showError("Unable to send OTP. Please try again later.")
```

### 2.2 Verify OTP

```
OTP input visible, user enters 6-char code
  → User clicks "Verify"
  → verifyPhoneOtp(phoneNumber, code)
      → POST /api/v1/phoneverification/verify
  → HTTP 200, data === "approved"
      → showSuccess("Phone number verified successfully.")
      → onVerified() callback (e.g., update profile state)
  → HTTP 200, data !== "approved"
      → showError("The code you entered is incorrect. Please try again.")
  → network/service error
      → showError via errorHandler
```

### 2.3 Resend OTP

```
User clicks "Resend OTP"
  → clearOtpInput()
  → sendPhoneOtp(phoneNumber) (same flow as 2.1)
```

---

## 3. File Structure

### Documentation
```
specs/017-phone-otp-verification/
  spec.md                         NO CHANGE
  plan.md                         NEW (this file)
  research.md                     NEW
  data-model.md                   NEW
  contracts/
    api-contracts.md              NEW
```

### Source Tree
```
src/app/profile/
  components/
    PhoneOtpVerification/
      PhoneOtpVerification.tsx    NEW — component: phone input + OTP input + Resend
      index.ts                    NEW — barrel export
    __tests__/
      PhoneOtpVerification.test.tsx  NEW

src/hooks/
  usePhoneOtpVerification.ts      NEW — business logic hook

src/app/organization/services/
  phoneVerificationApi.ts         NEW — sendPhoneOtp(), verifyPhoneOtp()

src/utils/
  validation.ts                   VERIFY — indianPhone rule exists; add if missing

e2e/
  017-phone-otp-verification.spec.ts  NEW
```

---

## 4. Component Design

### 4.1 `PhoneOtpVerification`
- **Purpose**: Self-contained UI for the two-step send → verify flow.
- **Props**:
  ```typescript
  interface PhoneOtpVerificationProps {
    onVerified: () => void;     // callback on successful verification
    initialPhone?: string;      // pre-fill from user profile
  }
  ```
- **Step 1 (phone input visible)**:
  - `<TextField>` for phone (10-digit, starts 6–9)
  - Inline validation error from `useFormValidation`
  - "Send OTP" `<Button>` — disabled while `sending`
- **Step 2 (OTP input visible after send)**:
  - Confirmation text: "OTP sent to your phone."
  - `<TextField inputProps={{ maxLength: 6 }}>` for code
  - "Verify" `<Button>`
  - "Resend OTP" `<Link>` / `<Button>` below

### 4.2 `usePhoneOtpVerification` (hook)
- **State**:
  - `phoneNumber: string`
  - `otpCode: string`
  - `otpSent: boolean`
  - `sending: boolean`
  - `verifying: boolean`
  - `phoneError: string`
- **Methods**: `handleSendOtp()`, `handleVerify()`, `handleResend()`
- **Validation**: `useFormValidation` with `indianPhone` rule
- **Toast**: `useToast()` for success/error messages

---

## 5. API Plan

| Method | URL | Auth | Request Body | Success | Error Codes | Status |
|--------|-----|------|--------------|---------|-------------|--------|
| `POST` | `/api/v1/phoneverification/send` | Bearer | `{ phoneNumber: string }` | `{ success: true }` 200 | 400, 503 | NEW |
| `POST` | `/api/v1/phoneverification/verify` | Bearer | `{ phoneNumber: string, code: string }` | `{ success: true, data: "approved" \| "rejected" }` 200 | 400 | NEW |

> **Critical**: Both endpoints return HTTP 200 even for rejected OTP. The UI must read `response.data.data` to determine success vs. failure (not just the HTTP status).

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| OTP value logged | Log the event (`OTP sent to {phoneNumber}`), NEVER the code value itself |
| Invalid phone bypasses client validation | Server-side validation at ASP.NET Core layer; client validation is UX only |
| Replay attack on OTP | OTP expiry enforced server-side; expired attempts rejected without Twilio call |
| XSS via phone number input | Controlled React `<TextField>`; no `dangerouslySetInnerHTML` |
| Sending OTP to unowned number | This is a UX constraint; ownership confirmed by delivery to the user's device |
| Button spam (multiple sends) | Disable "Send OTP" button while `sending === true`; server enforces rate limiting |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `phoneNumber`, `otpCode`, `otpSent` | `usePhoneOtpVerification` (local) | Ephemeral form state; not shared |
| `sending`, `verifying` | `usePhoneOtpVerification` (local) | Loading flags for UI |
| `phoneError` | `useFormValidation` (local) | Validation-specific error |
| Toast notifications | `useToast()` (context) | Global notification pattern |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `PhoneOtpVerification.test.tsx` | Valid 10-digit phone (starts 9) → Send OTP enabled | Button not disabled |
| `PhoneOtpVerification.test.tsx` | Phone starting with 5 → inline validation error | Error text rendered |
| `PhoneOtpVerification.test.tsx` | 9-digit phone → inline validation error | Error text rendered |
| `PhoneOtpVerification.test.tsx` | Successful send → OTP input appears | OTP field in DOM |
| `PhoneOtpVerification.test.tsx` | API error on send → error toast triggered | `showError` mock called |
| `PhoneOtpVerification.test.tsx` | Verify with "approved" response → `onVerified` called | Callback invoked |
| `PhoneOtpVerification.test.tsx` | Verify with non-"approved" response → error toast | `showError` mock called |
| `PhoneOtpVerification.test.tsx` | Resend → OTP input cleared, send API re-called | Input empty, API called twice |

Test file: `src/app/profile/components/PhoneOtpVerification/__tests__/PhoneOtpVerification.test.tsx`

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| Golden path | AuthenticatedUser | Enter valid phone, Send OTP, enter code, Verify | Success message shown |
| Invalid phone rejected | AuthenticatedUser | Enter "5123456789", click Send OTP | Inline error before network call |
| Wrong OTP | AuthenticatedUser | Send OTP, enter incorrect code, Verify | Error: "code incorrect" |
| Resend OTP | AuthenticatedUser | Send OTP, click Resend OTP | OTP input cleared, confirmation shown again |

Test file: `e2e/017-phone-otp-verification.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-001: OTP request within 2s | Twilio latency is external; UI shows loading spinner immediately on send click |
| SC-002: Invalid phones blocked before network | Client-side validation in `handleSendOtp()` before any API call |
| SC-003: Success message within 2s of Verify | Verify response is fast; spinner shown during `verifying` state |
| Button debounce | Disable "Send OTP" during `sending`; no debounce library needed |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| OTP send requested | INFO | `userId`, `phoneNumber` (last 4 digits only) | Full phone number, OTP code |
| OTP sent successfully | INFO | `userId`, provider response status | OTP code |
| OTP send failed | ERROR | `userId`, HTTP status from Twilio | OTP code, Twilio key |
| OTP verify attempt | INFO | `userId`, `phoneNumber` (last 4 digits) | OTP code entered |
| OTP verified successfully | INFO | `userId` | — |
| OTP verify rejected | WARN | `userId` | OTP code |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| API endpoint path differs from spec | Medium | Medium | Confirm exact endpoint with backend; use contracts/api-contracts.md as source of truth |
| HTTP 200 with rejection body misread as success | High | High | Always check `response.data.data === "approved"`, never rely on HTTP status alone |
| OTP code length: spec says 6-char, registration page uses 4 | Medium | Medium | Set `maxLength: 6` in input; confirm with backend what length Twilio generates |
| Twilio SMS delivery delay | Low | Medium | Show "waiting for OTP" messaging; do not set a timeout that auto-fails the user |
| Indian phone regex excludes valid numbers | Low | Low | Test against known valid ranges: 6xxxxxxxxx–9xxxxxxxxx; update if new ranges added |
| Resend creates duplicate OTP states server-side | Low | Low | Backend should invalidate previous OTP on resend; frontend just re-calls send |
