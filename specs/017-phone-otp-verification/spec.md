# Feature Specification: Phone OTP Verification

**Feature Branch**: `017-phone-otp-verification`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow authenticated users to verify their phone number using a one-time password (OTP) sent via SMS. The flow has two steps: requesting the OTP and entering the code to verify it. This is used during profile setup to confirm phone number ownership.

---

## Actors

| Actor | Send OTP | Verify OTP |
|---|---|---|
| `AuthenticatedUser` | Yes | Yes |

---

## User Scenarios & Testing

### P1 — User Requests and Verifies OTP (Priority: P1)

As an authenticated user,
I want to verify my phone number by receiving an OTP and entering it,
So that my mobile number is confirmed on the platform.

**Independent Test**: Enter a valid Indian mobile number, click "Send OTP". Receive SMS. Enter the 6-character code and click "Verify". A success confirmation appears.

**Acceptance Scenarios**:

1. **Given** an authenticated user on a profile or verification page,
   **When** they enter a valid 10-digit phone number (starting with 6–9) and click "Send OTP",
   **Then** the OTP is sent and a 6-character input field appears with a confirmation message: "OTP sent to your phone."

2. **Given** the user receives the OTP and enters the correct 6-character code,
   **When** they click "Verify",
   **Then** a success message is shown: "Phone number verified successfully."

3. **Given** the user enters an incorrect OTP code,
   **When** they click "Verify",
   **Then** an error message is shown: "The code you entered is incorrect. Please try again." (The API returns 200 but the response body indicates failure — the UI must read the data field.)

4. **Given** the SMS service is unavailable,
   **When** the user clicks "Send OTP",
   **Then** an error is shown: "Unable to send OTP. Please try again later."

---

### P2 — Invalid Phone Number Rejected (Priority: P2)

As the platform,
I must validate the phone number format before attempting to send an OTP,
So that the SMS request is only made for valid Indian mobile numbers.

**Acceptance Scenarios**:

1. **Given** a phone number starting with 5 (e.g., "5123456789"),
   **When** the user enters it and clicks "Send OTP",
   **Then** an inline error appears: "Please enter a valid 10-digit mobile number (must start with 6, 7, 8, or 9)."

2. **Given** a phone number with 9 or 11 digits,
   **When** the user enters it,
   **Then** an inline validation error appears before the OTP send is attempted.

---

### Edge Cases

- Correct OTP returns `200` with `"approved"` in data — UI must inspect the data field, not just the HTTP status
- Incorrect OTP also returns `200` — UI must show an error based on the response body content
- Resend OTP — a "Resend OTP" link/button should allow requesting a new OTP

---

## Requirements

### Functional Requirements

- **FR-001**: A phone number input MUST validate: exactly 10 digits, starting with 6, 7, 8, or 9, before calling the send OTP API.
- **FR-002**: After a successful OTP send, a 6-character code input field MUST appear.
- **FR-003**: The verify action MUST display a success message if the response data contains "approved", and an error message otherwise (regardless of HTTP 200 status).
- **FR-004**: A "Resend OTP" option MUST be available after the OTP is sent.
- **FR-005**: The OTP input MUST be cleared if the user requests a resend.
- **FR-006**: The Send OTP button MUST be disabled while the SMS request is in flight.

### Key Entities

- **OTP**: A 6-character one-time code sent to the user's phone via SMS.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Valid phone numbers receive an OTP request within 2 seconds.
- **SC-002**: Invalid phone numbers are caught by client-side validation before any network request.
- **SC-003**: Users who enter the correct OTP see a success message within 2 seconds of clicking Verify.
- **SC-004**: Incorrect OTP entries display a clear error — zero cases where the UI silently ignores a wrong code.

---

## Assumptions

- OTP delivery time depends on the SMS service — the UI shows a "waiting for OTP" indicator after send.
- OTP expiry is managed by the external SMS service — the UI does not display a countdown timer.
- Phone number validation uses Indian mobile number format (10 digits, starts with 6–9).

---

## Out of Scope

- Email OTP verification — separate flow
- OTP expiry display/timer — handled by SMS service
- SMS marketing or notifications — OTP is for verification only
