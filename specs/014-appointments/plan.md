# Implementation Plan: Appointments

**Branch**: `014-appointments` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)

---

## 1. Overview

### What Exists
- Admin list page `src/app/admin-dashboard/legal-experts/page.tsx` shows "Upcoming Appointment" and "Past Appointment" columns — display only, no appointment functionality.
- No appointment components, hooks, service functions, or types exist anywhere in the codebase.

### What Is New (everything)
- Appointment booking form page: `src/app/appointments/book/page.tsx`
- My Appointments page: `src/app/appointments/page.tsx`
- API service module: `src/app/services/appointmentServices/services.ts`
- Types: `src/app/appointments/types/index.ts`
- Hooks: `useAppointmentBooking.ts`, `useMyAppointments.ts`
- Components: `AppointmentBookingForm`, `AppointmentList`, `AppointmentCard`, `DeclineAppointmentModal`, `TimeSlotPicker`
- Unit tests: `AppointmentBookingForm.test.tsx`, `useAppointmentBooking.test.ts`
- E2E test: `e2e/014-appointments.spec.ts`

---

## 2. Architecture Flow

### 2.1 Book Online Appointment

```
Client navigates to expert profile → clicks "Book Appointment"
  → /appointments/book?expertId={id} renders AppointmentBookingForm
  → useAppointmentBooking(expertId)
  → onMount: fetchExpertAvailability(expertId, selectedDate)
      → GET /api/v1/legalexperts/{expertId}/availability?date=
  → User selects: date (DatePicker), time slot (TimeSlotPicker shows available slots only),
                  meetingType = "Online"
  → formValidation.validate(formData)
  → Submit → createAppointment(payload)
      → POST /api/v1/appointments
  → 201 → Confirmation page: appointment details + video meeting link + payment settlement due date
  → 409 (slot taken) → showError("This time slot is no longer available.")
  → video service failure → 503 → showError("Unable to create the video meeting. Please try again.")
```

### 2.2 Book Offline Appointment

```
User selects "Offline" in meetingType toggle
  → AddressSelector component renders
  → fetchExpertAddresses(expertId)
      → GET /api/v1/legalexperts/{expertId}/addresses
  → User selects office address from dropdown
  → address required validation → submit blocked if no address selected
  → Submit → createAppointment({ ...payload, meetingType: "Offline", addressId })
      → POST /api/v1/appointments
  → 201 → Confirmation: appointment details + selected office address
```

### 2.3 View My Appointments

```
Client or LegalExpert navigates to /appointments
  → useMyAppointments()
  → fetchMyAppointments({ tab: 'upcoming' | 'past' })
      → GET /api/v1/appointments/me?status=upcoming|past
  → Render tabbed view: Upcoming | Past
  → Each appointment card: expert/client name, date/time, meetingType badge, status badge
```

### 2.4 Decline Appointment

```
User clicks "Decline" on an upcoming appointment card
  → setAppointmentToDecline(appointment) → DeclineAppointmentModal opens
  → Modal: reason text field (required) + Confirm button
  → reason.trim() === '' → Confirm disabled
  → User confirms → declineAppointment(appointmentId, { reason, declineSide: 'client'|'expert' })
      → PUT /api/v1/appointments/{id}/decline
  → 200 → showSuccess → update appointment status to "Declined" in local state
  → 400 (past appointment) → showError("You cannot decline a past appointment.")
  → 409 (already declined) → showError("This appointment has already been declined.")
```

### 2.5 Time Slot Availability Check

```
User changes date in DatePicker
  → useEffect: fetchExpertAvailability(expertId, newDate)
      → GET /api/v1/legalexperts/{expertId}/availability?date=
  → TimeSlotPicker re-renders with available slots only
  → Booked slots are not shown (backend filters them)
```

---

## 3. File Structure

### Documentation
```
specs/014-appointments/
  spec.md                          NO CHANGE
  plan.md                          NEW (this file)
  research.md                      NEW
  data-model.md                    NEW
  contracts/
    api-contracts.md               NEW
```

### Source Tree
```
src/app/appointments/
  page.tsx                         NEW — My Appointments list (tabbed: Upcoming / Past)
  book/
    page.tsx                       NEW — Appointment booking form
  types/
    index.ts                       NEW — Appointment, AppointmentStatus, TimeSlot,
                                         CreateAppointmentRequest, DeclineAppointmentRequest,
                                         PaymentSettlement
  hooks/
    useAppointmentBooking.ts       NEW — form state, availability fetch, create appointment
    useMyAppointments.ts           NEW — fetch appointments by status tab, decline action
  components/
    AppointmentBookingForm.tsx     NEW — full booking form (date, slot, type, address)
    TimeSlotPicker.tsx             NEW — available time slot grid
    AppointmentCard.tsx            NEW — single appointment summary card
    AppointmentList.tsx            NEW — tabbed list of appointment cards
    DeclineAppointmentModal.tsx    NEW — reason input + confirm dialog

src/app/services/appointmentServices/
  services.ts                      NEW — createAppointment, fetchMyAppointments,
                                         declineAppointment, fetchExpertAvailability,
                                         fetchExpertAddresses

e2e/
  014-appointments.spec.ts         NEW
```

---

## 4. Component Design

### 4.1 `AppointmentBookingForm`
- **Props**: `{ expertId: string }`
- **Fields**:
  - DatePicker (MUI `DatePicker`; past dates selectable per spec — historical records allowed)
  - `TimeSlotPicker` — grid of available slots; re-fetched on date change
  - MeetingType toggle: Online / Offline (MUI `ToggleButtonGroup`)
  - AddressSelector (rendered only when Offline selected; dropdown from expert addresses)
- **Validation**: `useFormValidation(appointmentSchema)`; address required if Offline.
- **Confirmation view**: On 201, replace form with confirmation panel (no page navigation).

### 4.2 `TimeSlotPicker`
- **Props**: `{ slots: TimeSlot[]; selected: string | null; onChange: (slot) => void }`
- **Renders**: Button grid of available time slots. Booked slots not included.
- **Loading**: Skeleton grid while availability is fetching.
- **Empty state**: "No available slots for this date."

### 4.3 `AppointmentCard`
- **Props**: `{ appointment: Appointment; onDecline: (id) => void }`
- **Shows**: Expert/client name, date, time, meeting type badge (Online=blue, Offline=grey), status badge.
- **Decline button**: Visible only if `appointment.status === 'Upcoming'` and not past date.
- **Status badges**: Upcoming=green, Declined=red, Completed=grey.

### 4.4 `DeclineAppointmentModal`
- **Fields**: Reason text (required, min 1 char).
- **Confirm**: Disabled while `reason.trim() === ''`.
- **Reuses**: MUI `Dialog` pattern consistent with other modals in the project.

### 4.5 `AppointmentList` (My Appointments page)
- **Tabs**: MUI `Tabs` — "Upcoming" | "Past"
- **Tab switch**: Calls `fetchMyAppointments({ status })` with new filter.
- **Empty state**: "No upcoming appointments." / "No past appointments."

---

## 5. API Plan

| Method | URL | Auth | Request | Success | Error Codes | Status |
|--------|-----|------|---------|---------|-------------|--------|
| `POST` | `/api/v1/appointments` | Bearer (Client/Expert) | `CreateAppointmentRequest` | `{ data: Appointment }` 201 | 400, 401, 403, 409, 503 | New |
| `GET` | `/api/v1/appointments/me` | Bearer | `?status=upcoming\|past&page&pageSize` | `{ items[], totalCount, page, pageSize }` | 401 | New |
| `GET` | `/api/v1/appointments` | Bearer (SystemAdmin) | `?page&pageSize` | `{ items[], totalCount, page, pageSize }` | 401, 403 | New |
| `PUT` | `/api/v1/appointments/{id}/decline` | Bearer | `DeclineAppointmentRequest` | `{ data: Appointment }` 200 | 400, 401, 403, 409 | New |
| `DELETE` | `/api/v1/appointments/{id}` | Bearer (SystemAdmin) | — | 204 | 401, 403, 404 | New |
| `GET` | `/api/v1/legalexperts/{expertId}/availability` | Bearer | `?date=YYYY-MM-DD` | `{ data: TimeSlot[] }` | 401, 404 | New |
| `GET` | `/api/v1/legalexperts/{expertId}/addresses` | Bearer | — | `{ data: ExpertAddress[] }` | 401, 404 | New |

**`CreateAppointmentRequest`**:
```json
{
  "expertId": "string",
  "date": "YYYY-MM-DD",
  "timeSlotId": "string",
  "meetingType": "Online | Offline",
  "addressId": "string | null"
}
```

**`DeclineAppointmentRequest`**:
```json
{
  "reason": "string",
  "declineSide": "Client | Expert"
}
```

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| Double-booking (race condition) | Backend validates slot availability at insert; returns 409 if already taken |
| Inactive expert being booked | Backend checks expert active status; returns 400 if inactive; frontend shows error |
| Client declining another client's appointment | Backend validates appointment ownership via JWT claim; returns 403 |
| Declining a past appointment | Backend validates `appointment.date < now`; returns 400 |
| Video meeting link exposed to unauthorized users | Link only returned in POST response and stored server-side; only appointment participants can fetch |
| XSS via decline reason | Controlled MUI `TextField`; reason never rendered via `dangerouslySetInnerHTML` |
| Admin viewing all appointments without scoping | `[Authorize(Roles = "SystemAdmin")]` on admin list endpoint; client/expert endpoint scoped by JWT claim |
| Payment settlement auto-created | Server-side only; client cannot manipulate settlement amounts or due dates |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `bookingForm` (date, slot, type, addressId) | `useAppointmentBooking` (local) | Ephemeral booking form state |
| `availableSlots`, `loadingSlots` | `useAppointmentBooking` (local) | Re-fetched on date change; not persisted |
| `expertAddresses` | `useAppointmentBooking` (local) | Loaded on Offline toggle; session-scoped |
| `bookingConfirmation` | `useAppointmentBooking` (local) | Shown post-201; replaces form in UI |
| `appointments`, `activeTab` | `useMyAppointments` (local) | Session-scoped; no cross-route sharing |
| `appointmentToDecline`, `declineModalOpen` | `useMyAppointments` (local) | Dialog visibility; ephemeral |
| `loadingAppointments`, `decliningId` | `useMyAppointments` (local) | Loading indicators per operation |

No new Redux slices required. Appointments are not persisted across sessions.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `AppointmentBookingForm.test.tsx` | Online selected → no address field | AddressSelector not in DOM |
| `AppointmentBookingForm.test.tsx` | Offline selected → address field required | AddressSelector rendered |
| `AppointmentBookingForm.test.tsx` | Offline with no address → submit blocked | Submit button disabled |
| `AppointmentBookingForm.test.tsx` | 409 response → slot unavailable error | Error toast shown |
| `AppointmentBookingForm.test.tsx` | 201 response → confirmation panel shown | Confirmation replaces form |
| `useAppointmentBooking.test.ts` | Date change → fetchExpertAvailability called | API mock invoked with new date |
| `useAppointmentBooking.test.ts` | createAppointment 201 → confirmation state set | `bookingConfirmation` populated |
| `DeclineAppointmentModal.test.tsx` | Empty reason → Confirm disabled | Button has `disabled` attribute |
| `DeclineAppointmentModal.test.tsx` | Reason provided → Confirm enabled | Button enabled |
| `useMyAppointments.test.ts` | Tab switch to Past → fetchMyAppointments with status=past | API called with correct param |

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| Book online appointment — golden path | Client | Nav to expert profile, select date/slot, choose Online, submit | Confirmation panel with video link shown |
| Book offline appointment | Client | Select Offline, pick address, submit | Confirmation shows selected address |
| Offline booking without address blocked | Client | Select Offline, leave address blank | Submit disabled |
| Slot unavailable error | Client | Select already-booked slot (mock 409) | Error message shown |
| View upcoming appointments | Client | Nav to /appointments | Upcoming tab shown with appointment cards |
| Decline upcoming appointment | Client | Click Decline, enter reason, confirm | Appointment shows Declined badge |
| Cannot decline past appointment | Client | Attempt decline on past appointment (mock 400) | Error message shown |
| Expert views own appointments | LegalIndividualExpert | Nav to /appointments | Expert sees client names and appointment details |

Test file: `e2e/014-appointments.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-001: Booking completed in under 3 min | Time slot grid renders within 1s of date selection; slots fetched async with skeleton |
| SC-002: Double-booking prevented | Time slot selector shows only available slots; 409 fallback handled |
| SC-003: Video link in same request | Video meeting creation is synchronous in POST /appointments; no polling |
| Availability re-fetch on date change | Debounce 300ms on DatePicker change before fetching slots |
| My Appointments pagination | Server-side pagination; `pageSize` default 10 for appointment cards |
| Appointment list render | `React.memo` on `AppointmentCard`; `useCallback` on `onDecline` handler |
| Heavy dependency (date picker) | MUI DatePicker already in project; no additional dynamic import needed |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| Appointment created | INFO | `appointmentId`, `expertId`, `clientId`, `meetingType`, `date`, `timeSlotId` | Video meeting link, address details |
| Appointment declined | INFO | `appointmentId`, `declineSide`, `declinedBy` | Reason text |
| Slot conflict (double-booking attempt) | WARN | `expertId`, `date`, `timeSlotId` | Client identity |
| Video meeting creation failure | ERROR | `expertId`, `date`, HTTP status from video service | Client data |
| Inactive expert booking attempt | WARN | `expertId`, `clientId` | — |
| Payment settlement created | INFO | `appointmentId`, `settlementId`, due date | Amount details (logged separately in payment flow) |
| API error (any appointment operation) | ERROR | HTTP status, `appointmentId` | Token value |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Video meeting service integration unknown | High | High | Confirm backend integration (Google Meet / Zoom / Jitsi) before frontend work; video link is returned in POST response — frontend just displays it |
| Expert availability API not yet implemented on backend | High | High | Mock availability endpoint during frontend dev; coordinate backend delivery timeline |
| Expert address endpoint may not exist | Medium | Medium | Confirm `/legalexperts/{id}/addresses` endpoint exists; fallback to manual address text input if not |
| Time slot selection UX unclear (grid vs. dropdown) | Medium | Low | Default to button grid; discuss with designer if needed; `TimeSlotPicker` isolated component is easy to swap |
| Decline from both sides creates confusing status | Low | Medium | Display decline status per side in `AppointmentCard` (e.g., "Declined by client"); confirm API returns both decline flags |
| Payment settlement auto-creation side effects | Low | Medium | Frontend displays due date from 201 response only; no payment mutation from appointments flow |
| Past date appointments should still be bookable (historical) | Low | Low | Per spec: past dates are accepted. Remove DatePicker `disablePast` prop; confirm with team |
