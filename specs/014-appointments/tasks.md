# Tasks: Appointments

**Feature**: `014-appointments`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Status**: Everything new — no appointment components, hooks, service functions, or types exist.

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1]**: Client Books an Online Appointment (P1)
- **[US2]**: Client Books an Offline Appointment (P2)
- **[US3]**: View My Appointments (P3)
- **[US4]**: Decline an Appointment (P4)

---

## Phase 1: Setup

**Purpose**: Define types and create service/directory scaffolding.

- [ ] T001 Create `src/app/appointments/types/index.ts` — define: `Appointment`, `AppointmentStatus` (`Upcoming | Declined | Completed`), `TimeSlot`, `ExpertAddress`, `CreateAppointmentRequest`, `DeclineAppointmentRequest`, `PaymentSettlement`
- [ ] T002 [P] Create directory structure: `src/app/appointments/page.tsx`, `src/app/appointments/book/page.tsx`, `src/app/appointments/components/`, `src/app/appointments/hooks/`, `src/app/services/appointmentServices/`
- [ ] T003 [P] Create `src/app/services/appointmentServices/services.ts` scaffold with empty exported functions: `createAppointment`, `fetchMyAppointments`, `declineAppointment`, `fetchExpertAvailability`, `fetchExpertAddresses`

**Checkpoint**: Types and structure in place — begin building

---

## Phase 2: UI

**Purpose**: Build all appointment UI components and pages.

- [ ] T004 [US1] Create `src/app/appointments/components/TimeSlotPicker.tsx` — props: `{ slots: TimeSlot[], selected: string | null, onChange: (slot: TimeSlot) => void, loading: boolean }`; button grid of available time slots; skeleton during loading; empty state: "No available slots for this date."
- [ ] T005 [US1] Create `src/app/appointments/book/page.tsx` — booking form page (`"use client"`); renders `AppointmentBookingForm` with `expertId` from query param
- [ ] T006 [US1] Create `src/app/appointments/components/AppointmentBookingForm.tsx` — fields: MUI `DatePicker`, `TimeSlotPicker`, MeetingType `ToggleButtonGroup` (Online/Offline); confirmation panel replaces form on 201
- [ ] T007 [US2] Add `AddressSelector` inside `AppointmentBookingForm` — rendered only when `meetingType === 'Offline'`; dropdown from `fetchExpertAddresses(expertId)` with loading state
- [ ] T008 [US1] Add confirmation panel component within `AppointmentBookingForm` — shows: appointment details, video meeting link (Online), selected address (Offline), payment settlement due date
- [ ] T009 [US3] Create `src/app/appointments/components/AppointmentCard.tsx` — props: `{ appointment: Appointment, onDecline: (id: string) => void }`; shows expert/client name, date/time, meeting type badge, status badge; Decline button only when `status === 'Upcoming'`
- [ ] T010 [US3] Create `src/app/appointments/components/AppointmentList.tsx` — MUI `Tabs` with "Upcoming" and "Past" tabs; empty states for each tab
- [ ] T011 [US3] Create `src/app/appointments/page.tsx` — My Appointments page (`"use client"`); uses `AppointmentList` with `useMyAppointments` hook
- [ ] T012 [US4] Create `src/app/appointments/components/DeclineAppointmentModal.tsx` — MUI `Dialog`; reason `TextField` (required); Confirm button `disabled={reason.trim() === ''}`

**Checkpoint**: All UI components renderable — verify visually

---

## Phase 3: Logic

**Purpose**: Build all hooks and business logic.

- [ ] T013 [US1] Create `src/app/appointments/hooks/useAppointmentBooking.ts` — state: `bookingForm` (date, slot, meetingType, addressId), `availableSlots`, `loadingSlots`, `expertAddresses`, `bookingConfirmation`; `fetchExpertAvailability(expertId, date)` called on date change (debounce 300ms); `fetchExpertAddresses(expertId)` called on Offline toggle
- [ ] T014 [US1] Implement `createAppointment` submit handler in `useAppointmentBooking` — on 201: sets `bookingConfirmation` (replaces form); handles 409 → `showError("This time slot is no longer available.")`, 503 → `showError("Unable to create the video meeting. Please try again.")`
- [ ] T015 [US1] Integrate `useFormValidation(appointmentSchema)` in `useAppointmentBooking` — schema: date required, timeSlotId required, meetingType required, addressId required if Offline
- [ ] T016 [US3] Create `src/app/appointments/hooks/useMyAppointments.ts` — state: `appointments[]`, `activeTab ('upcoming' | 'past')`, `loadingAppointments`, `appointmentToDecline`, `declineModalOpen`, `decliningId`; fetches on mount and tab switch
- [ ] T017 [US4] Implement `declineAppointment` in `useMyAppointments` — on 200: updates appointment status to `Declined` in local state; handles 400 → `showError("You cannot decline a past appointment.")`, 409 → `showError("This appointment has already been declined.")`

**Checkpoint**: All hooks implemented — wire to components

---

## Phase 4: API

**Purpose**: Implement all API service functions.

- [ ] T018 [US1] Implement `createAppointment(payload: CreateAppointmentRequest)` in `appointmentServices/services.ts` → `POST /api/v1/appointments`; returns `Appointment` on 201
- [ ] T019 [US3] Implement `fetchMyAppointments(params: { status: 'upcoming' | 'past', page: number, pageSize: number })` → `GET /api/v1/appointments/me?status=&page=&pageSize=`
- [ ] T020 [US4] Implement `declineAppointment(id: string, payload: DeclineAppointmentRequest)` → `PUT /api/v1/appointments/{id}/decline`; returns updated `Appointment`
- [ ] T021 [US1] Implement `fetchExpertAvailability(expertId: string, date: string)` → `GET /api/v1/legalexperts/{expertId}/availability?date=`; returns `TimeSlot[]`
- [ ] T022 [US2] Implement `fetchExpertAddresses(expertId: string)` → `GET /api/v1/legalexperts/{expertId}/addresses`; returns `ExpertAddress[]`
- [ ] T023 All functions use `httpServices` (Axios with Bearer token); errors handled via `errorHandler.ts`

**Checkpoint**: All API functions implemented and typed

---

## Phase 5: Backend

**Purpose**: Document backend integration requirements and confirm contract.

- [ ] T024 Confirm `POST /api/v1/appointments` is synchronous — video meeting creation happens server-side and link is returned in 201 response body (no polling)
- [ ] T025 Confirm `POST /api/v1/appointments` returns 409 for double-booking (slot already taken)
- [ ] T026 Confirm `GET /api/v1/legalexperts/{expertId}/availability?date=` endpoint exists and returns only unbooked slots
- [ ] T027 Confirm `GET /api/v1/legalexperts/{expertId}/addresses` endpoint exists
- [ ] T028 Confirm `PUT /api/v1/appointments/{id}/decline` validates appointment ownership via JWT and returns 400 for past appointments, 409 for already-declined
- [ ] T029 Confirm payment settlement auto-creation is server-side on appointment creation — `settlementDueDate` returned in 201 response

---

## Phase 6: Security

**Purpose**: Enforce all security requirements from plan.md §6.

- [ ] T030 [US1] Verify `AppointmentBookingForm` submit is blocked when `meetingType === 'Offline'` and no address selected — `disabled` prop on submit button and form-level validation
- [ ] T031 [US4] Verify `DeclineAppointmentModal` Confirm button is `disabled={reason.trim() === ''}` — empty reason cannot be submitted
- [ ] T032 [US1] Verify video meeting link is only shown in confirmation panel after successful booking — never displayed in a pre-booking state
- [ ] T033 [P] Verify `DeclineAppointmentRequest` includes `declineSide: 'Client' | 'Expert'` — derived from current user's role, not user-selectable
- [ ] T034 Verify `AppointmentCard` Decline button is hidden when `appointment.status !== 'Upcoming'` — prevent decline of already-declined or completed appointments

---

## Phase 7: Testing

**Purpose**: Build all unit tests and E2E tests from plan.md §8.

- [ ] T035 [P] [US1] Create `src/app/appointments/components/__tests__/AppointmentBookingForm.test.tsx`:
  - Online selected → `AddressSelector` not in DOM
  - Offline selected → `AddressSelector` rendered
  - Offline with no address → submit button disabled
  - 409 response → slot unavailable error toast
  - 201 response → confirmation panel shown (form replaced)
- [ ] T036 [P] [US1] Create `src/app/appointments/hooks/__tests__/useAppointmentBooking.test.ts`:
  - Date change → `fetchExpertAvailability` called with new date
  - `createAppointment` 201 → `bookingConfirmation` state populated
- [ ] T037 [P] [US4] Create `src/app/appointments/components/__tests__/DeclineAppointmentModal.test.tsx`:
  - Empty reason → Confirm button `disabled`
  - Reason provided → Confirm button enabled
- [ ] T038 [P] [US3] Create `src/app/appointments/hooks/__tests__/useMyAppointments.test.ts`:
  - Tab switch to Past → `fetchMyAppointments` called with `status=past`
- [ ] T039 Create `e2e/014-appointments.spec.ts` with all 8 E2E scenarios from plan.md §8: online booking, offline booking, offline without address blocked, slot unavailable, view upcoming, decline appointment, cannot decline past, expert views appointments

**Checkpoint**: All tests written — run `npm run test` to verify unit tests pass

---

## Phase 8: Logging

**Purpose**: Add structured logging per plan.md §10.

- [ ] T040 [US1] Add `console.info` in `useAppointmentBooking` on `createAppointment` success: log `{ appointmentId, expertId, clientId, meetingType, date, timeSlotId }` — do NOT log video link or address details
- [ ] T041 [US4] Add `console.info` in `useMyAppointments` on `declineAppointment` success: log `{ appointmentId, declineSide, declinedBy }` — do NOT log reason text
- [ ] T042 Add `console.warn` in `useAppointmentBooking` on 409 slot conflict: log `{ expertId, date, timeSlotId }` — do NOT log client identity
- [ ] T043 Add `console.error` in `useAppointmentBooking` on video meeting creation failure (503): log `{ expertId, date, httpStatus }`
- [ ] T044 Add `console.info` after payment settlement auto-creation detected: log `{ appointmentId, settlementId, dueDate }` — no amount details

---

## Phase 9: Quality Gates

**Purpose**: Ensure code quality before finalization.

- [ ] T045 [P] Run `npm run type-check` — fix any TypeScript errors in all new `src/app/appointments/` and `src/app/services/appointmentServices/` files
- [ ] T046 [P] Run `npm run lint` — fix any ESLint errors
- [ ] T047 Run `npm run test` — confirm all new unit tests pass
- [ ] T048 Run `npm run build` — confirm production build passes

---

## Phase 10: Finalization

**Purpose**: Confirm all spec requirements are satisfied.

- [ ] T049 Verify SC-001: client can complete booking in under 3 minutes (time slot grid renders quickly after date selection)
- [ ] T050 Verify SC-002: double-booking prevented — `TimeSlotPicker` shows only available slots; 409 handled gracefully
- [ ] T051 Verify SC-003: video link displayed in confirmation within same request (synchronous 201 response)
- [ ] T052 Verify SC-004: Decline confirmation dialog appears before any API call is sent
- [ ] T053 Verify past dates are selectable in `DatePicker` (per spec: historical records allowed) — confirm `disablePast` prop is NOT set

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: Start immediately — T001 types required by all other phases
- **Phase 2 (UI)**: Depends on T001; T004–T012 can run in parallel (different component files)
- **Phase 3 (Logic)**: Depends on T001; T013–T017 depend on Phase 4 API functions being importable
- **Phase 4 (API)**: Depends on T001 (types); T018–T022 can run in parallel
- **Phase 5 (Backend)**: Independent verification — run in parallel with Phases 2–4
- **Phase 6 (Security)**: Depends on Phases 2–3
- **Phase 7 (Testing)**: Depends on Phases 2–4
- **Phase 8 (Logging)**: Runs in parallel with Phase 7
- **Phase 9 (Quality Gates)**: Depends on Phases 7–8
- **Phase 10 (Finalization)**: Depends on Phase 9
