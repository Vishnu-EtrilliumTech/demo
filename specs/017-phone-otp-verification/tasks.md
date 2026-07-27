# Tasks: Phone OTP Verification

**Feature**: `017-phone-otp-verification`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Status**: Existing 4-digit registration OTP page; this feature is a separate 6-character authenticated-user flow.

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1]**: User Requests and Verifies OTP (P1)
- **[US2]**: Invalid Phone Number Rejected (P2)

---

## Phase 1: Setup

**Purpose**: Verify Indian phone validation rule and create service scaffold.

- [ ] T001 Check `src/utils/validation.ts` — verify `indianPhone` rule `/^[6-9]\d{9}$/` exists; add if missing with error message: "Please enter a valid 10-digit mobile number (must start with 6, 7, 8, or 9)."
- [ ] T002 [P] Create `src/app/organization/services/phoneVerificationApi.ts` scaffold — empty exported functions: `sendPhoneOtp`, `verifyPhoneOtp`
- [ ] T003 [P] Create directory `src/app/profile/components/PhoneOtpVerification/` with placeholder `PhoneOtpVerification.tsx` and `index.ts` barrel export
- [ ] T004 [P] Note that existing `src/app/register/otp/page.tsx` is a different flow (4-digit registration OTP) — do NOT modify it; build parallel to it

**Checkpoint**: Validation rule confirmed, structure created — begin building

---

## Phase 2: UI

**Purpose**: Build the `PhoneOtpVerification` reusable component.

- [ ] T005 [US1] Implement `src/app/profile/components/PhoneOtpVerification/PhoneOtpVerification.tsx` — Step 1 (phone input visible): `<TextField>` for phone with inline validation, "Send OTP" `<Button>` disabled while `sending`
- [ ] T006 [US1] Add Step 2 (OTP input visible after send) to `PhoneOtpVerification`: confirmation text "OTP sent to your phone.", `<TextField inputProps={{ maxLength: 6 }}>` for code, "Verify" `<Button>`, "Resend OTP" `<Button variant="text">` below
- [ ] T007 [US2] Add inline validation error display to phone input in `PhoneOtpVerification` — uses `useFormValidation` error; shows before any API call is made
- [ ] T008 [US1] Props interface for `PhoneOtpVerification`: `{ onVerified: () => void; initialPhone?: string }` — `initialPhone` pre-fills phone field from parent profile state

**Checkpoint**: Component renders with both steps — verify visually

---

## Phase 3: Logic

**Purpose**: Build the `usePhoneOtpVerification` hook.

- [ ] T009 [US1] Create `src/hooks/usePhoneOtpVerification.ts` — state: `phoneNumber`, `otpCode`, `otpSent`, `sending`, `verifying`, `phoneError`; uses `useFormValidation` with `indianPhone` rule; uses `useToast()`
- [ ] T010 [US1] Implement `handleSendOtp()` in `usePhoneOtpVerification` — validates phone format before API call; calls `sendPhoneOtp(phoneNumber)`; on success sets `otpSent = true`; on error calls `showError("Unable to send OTP. Please try again later.")`; disables button via `sending` flag
- [ ] T011 [US1] Implement `handleVerify()` in `usePhoneOtpVerification` — calls `verifyPhoneOtp(phoneNumber, code)`; on HTTP 200: checks `response.data.data === "approved"` → calls `onVerified()` + `showSuccess("Phone number verified successfully.")`; if NOT "approved" (still HTTP 200) → calls `showError("The code you entered is incorrect. Please try again.")`
- [ ] T012 [US1] Implement `handleResend()` in `usePhoneOtpVerification` — clears `otpCode` input; re-calls `handleSendOtp()`
- [ ] T013 Wire `usePhoneOtpVerification` to `PhoneOtpVerification` component — pass all state and handlers as props

**Checkpoint**: Full two-step OTP flow functional

---

## Phase 4: API

**Purpose**: Implement API service functions.

- [ ] T014 [US1] Implement `sendPhoneOtp(phoneNumber: string)` in `phoneVerificationApi.ts` → `POST /api/v1/phoneverification/send` with body `{ phoneNumber }`; uses `httpServices` Bearer auth; returns success or throws
- [ ] T015 [US1] Implement `verifyPhoneOtp(phoneNumber: string, code: string)` in `phoneVerificationApi.ts` → `POST /api/v1/phoneverification/verify` with body `{ phoneNumber, code }`; returns full response object (not just success flag — caller must inspect `response.data.data`)
- [ ] T016 Both functions use `httpServices` Axios with Bearer token; errors handled via `errorHandler.ts`

**Checkpoint**: API functions implemented — verify with backend contract

---

## Phase 5: Backend

**Purpose**: Confirm backend contract (no frontend code changes).

- [ ] T017 Confirm exact endpoint paths: `POST /api/v1/phoneverification/send` and `POST /api/v1/phoneverification/verify` (may differ from spec; verify with backend)
- [ ] T018 Confirm both endpoints return HTTP 200 for both success and failure cases — OTP result is in `response.data.data` field: `"approved"` or `"rejected"` (NOT determined by HTTP status code)
- [ ] T019 Confirm `POST .../verify` does not return `4xx` for wrong OTP — it returns `200` with rejection data; update `handleVerify` if contract differs
- [ ] T020 Confirm OTP code length from Twilio is 6 characters (spec says 6; existing registration page uses 4 — do not assume they match)

---

## Phase 6: Security

**Purpose**: Enforce all security requirements from plan.md §6.

- [ ] T021 [US1] Verify "Send OTP" button is `disabled={sending}` — prevents multiple simultaneous send requests (button spam)
- [ ] T022 [US2] Verify client-side phone validation runs BEFORE any API call in `handleSendOtp()` — invalid phones never reach `sendPhoneOtp`
- [ ] T023 Verify OTP code value is NEVER logged — only `userId` and last 4 digits of phone number appear in logs
- [ ] T024 [P] Verify `PhoneOtpVerification` uses controlled React `TextField` — no `dangerouslySetInnerHTML`
- [ ] T025 Verify `maxLength: 6` enforced on OTP input via `TextField inputProps={{ maxLength: 6 }}` — prevents oversized code submission

---

## Phase 7: Testing

**Purpose**: Build all unit tests and E2E tests from plan.md §8.

- [ ] T026 [P] [US1] Create `src/app/profile/components/PhoneOtpVerification/__tests__/PhoneOtpVerification.test.tsx`:
  - Valid 10-digit phone starting with 9 → "Send OTP" button not disabled
  - Phone starting with 5 → inline validation error rendered
  - 9-digit phone → inline validation error rendered
  - Successful send → OTP input field appears in DOM
  - API error on send → `showError` mock called
  - Verify with `"approved"` response → `onVerified` callback invoked
  - Verify with non-`"approved"` response (HTTP 200) → `showError` mock called
  - Resend → OTP input cleared, send API called twice
- [ ] T027 Create `e2e/017-phone-otp-verification.spec.ts` with all 4 E2E scenarios from plan.md §8: golden path, invalid phone rejected, wrong OTP error, resend OTP

**Checkpoint**: All tests written — run `npm run test` to verify unit tests pass

---

## Phase 8: Logging

**Purpose**: Add structured logging per plan.md §10.

- [ ] T028 [US1] Add `console.info` in `handleSendOtp` on OTP send requested: log `{ userId, phoneLast4: phoneNumber.slice(-4) }` — do NOT log full phone number or OTP code
- [ ] T029 [US1] Add `console.info` in `handleSendOtp` on OTP sent successfully: log `{ userId }` — do NOT log OTP code
- [ ] T030 Add `console.error` in `handleSendOtp` on failure: log `{ userId, httpStatus }` — do NOT log OTP code or Twilio key
- [ ] T031 [US1] Add `console.info` in `handleVerify` on verify attempt: log `{ userId, phoneLast4 }` — do NOT log code entered
- [ ] T032 [US1] Add `console.info` in `handleVerify` on successful verification: log `{ userId }`
- [ ] T033 Add `console.warn` in `handleVerify` on rejected OTP: log `{ userId }` — do NOT log entered code

---

## Phase 9: Quality Gates

**Purpose**: Ensure code quality before finalization.

- [ ] T034 [P] Run `npm run type-check` — fix TypeScript errors in `PhoneOtpVerification.tsx`, `usePhoneOtpVerification.ts`, `phoneVerificationApi.ts`
- [ ] T035 [P] Run `npm run lint` — fix ESLint errors
- [ ] T036 Run `npm run test` — confirm all new unit tests pass
- [ ] T037 Run `npm run build` — confirm production build passes

---

## Phase 10: Finalization

**Purpose**: Confirm all spec requirements are satisfied.

- [ ] T038 Verify SC-001: valid phone numbers receive OTP within 2 seconds (Twilio latency is external; spinner shown immediately)
- [ ] T039 Verify SC-002: invalid phones blocked by client-side validation before any network request (check browser Network tab shows no request on invalid phone)
- [ ] T040 Verify SC-003: success message shown within 2 seconds of clicking Verify (fast response; spinner shown during `verifying` state)
- [ ] T041 Verify SC-004: incorrect OTP shows clear error message — zero cases where wrong code is silently ignored (HTTP 200 + non-"approved" body handled correctly)
- [ ] T042 Verify "Resend OTP" clears the code input and shows the confirmation message again (FR-004, FR-005)

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: Start immediately — T001 validation rule must exist before hook
- **Phase 2 (UI)**: Depends on Phase 1; T005–T008 sequential (single component file)
- **Phase 3 (Logic)**: T009–T013 depend on Phase 4 API; logic builds after API functions exist
- **Phase 4 (API)**: Depends on Phase 1 only; T014–T016 can build in parallel with Phase 2
- **Phase 5 (Backend)**: Independent verification — run in parallel with Phases 2–4
- **Phase 6 (Security)**: Depends on Phases 2–3
- **Phase 7 (Testing)**: Depends on Phases 2–4
- **Phase 8 (Logging)**: Parallel with Phase 7
- **Phase 9 (Quality Gates)**: Depends on Phases 7–8
- **Phase 10 (Finalization)**: Depends on Phase 9
