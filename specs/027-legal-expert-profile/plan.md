# Implementation Plan: Legal Expert Profile (Onboarding)

**Branch**: `027-legal-expert-profile` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/027-legal-expert-profile/spec.md`

---

## 1. Overview

### What Exists

- `src/app/profile/ProfileContent.tsx` — partial expert profile view with `UserData` interface covering addresses, personal details, professional details, and schedule fields.
- `src/app/profile/page.tsx` — profile route using `ProfileContent`.
- `src/app/profile-complete/page.tsx` — success page showing step-specific completion messages (address-location, personal-details, professional-details, meeting-details).
- `src/services/httpServices.ts` — Axios client with auto Bearer token injection.

### Gaps to Close

1. **Four-step onboarding stepper**: No stepper UI exists. Create a `ProfileOnboardingStepper` component showing Addresses → Personal Details → Professional Details → Schedule with stage indicator that reads from backend.
2. **Stage indicator non-regression**: UI must read expert's current stage from API and never regress display even when re-editing earlier steps.
3. **Address management**: Add/edit/delete addresses. Block deletion when active appointments exist at that address.
4. **Out-of-office management**: Date range picker for unavailability periods with frontend validation (start ≥ today, end ≥ start).
5. **Public schedule page**: Expert's weekly schedule accessible without auth.
6. **"Now discoverable" banner**: Show after Schedule step completion.
7. **Portfolio validation**: Non-empty and unique entries enforced client-side.
8. Add unit and E2E tests.

### What Is New

- `src/app/profile/components/ProfileOnboardingStepper.tsx`
- `src/app/profile/components/AddressSection/` (AddressForm, AddressCard, AddressDeleteGuard)
- `src/app/profile/components/PersonalDetailsSection/`
- `src/app/profile/components/ProfessionalDetailsSection/`
- `src/app/profile/components/ScheduleSection/` (WeeklyScheduleForm, OutOfOfficeForm)
- `src/app/expert/[expertId]/schedule/page.tsx` — public schedule page (no auth)
- `src/app/profile/services/api.ts` — profile-scoped API service
- Unit tests and E2E tests

---

## 2. Architecture Flow

### 2.1 Expert Onboarding — Step Navigation

```
LegalIndividualExpert logs in → navigates to /profile
  → ProfileContent mounts
  → fetchExpertProfile(expertId)
      → GET /api/v1/legal-experts/{expertId}
      → returns: { stage, addresses, personalDetails, professionalDetails, schedule }
  → ProfileOnboardingStepper reads `stage` → highlights current/completed steps
  → Expert clicks step tab → corresponding section form renders
  → Each step saves independently → re-fetches stage on success
  → Stage only advances (never regresses)
```

### 2.2 Address Management

```
Expert on Addresses section
  → List of saved addresses shown (AddressCard per address)
  → "Add Address" → AddressForm modal
  → Fields: type, city, state, country, pincode
  → submit → POST /api/v1/legal-experts/{expertId}/addresses
  → success → re-fetch addresses list → check stage advancement
  → Edit address → pre-fill form → PUT /api/v1/legal-experts/{expertId}/addresses/{addressId}
  → Delete address:
      → check: address has active appointments?
      → if yes → show error: "This address has active appointments. Please reschedule or cancel them before deleting."
      → if no → ConfirmDialog → DELETE /api/v1/legal-experts/{expertId}/addresses/{addressId}
```

### 2.3 Out-of-Office

```
Expert on Schedule section
  → "Add Out-of-Office" → OutOfOfficeForm
  → Fields: startDate (DatePicker), endDate (DatePicker)
  → Client-side validation:
      → startDate >= today → else "Start date must be today or in the future."
      → endDate >= startDate → else "End date must be on or after the start date."
  → POST /api/v1/legal-experts/{expertId}/out-of-office
  → success → list updated with new period
```

### 2.4 Public Schedule Page

```
GET /expert/{expertId}/schedule (no auth required — no Keycloak check)
  → ExpertPublicSchedulePage renders without requiring Keycloak initialization
  → fetchExpertPublicSchedule(expertId)
      → GET /api/v1/legal-experts/{expertId}/schedule/public
  → WeeklyScheduleView renders availability slots
  → Out-of-office dates shown as unavailable
```

### 2.5 Stage Advancement Flow

```
After any successful section save:
  → fetchExpertProfile(expertId) re-called
  → `stage` field in response drives stepper display
  → If stage === "Schedule" → show banner: "Your profile is now complete — you are discoverable in search."
  → Stage display never goes backward (UI only reads, never writes stage directly)
```

---

## 3. File Structure

### Documentation

```
specs/027-legal-expert-profile/
  spec.md                                  NO CHANGE
  plan.md                                  NEW (this file)
  research.md                              NEW
  data-model.md                            NEW
  contracts/
    api-contracts.md                       NEW
```

### Source Tree

```
src/app/profile/
  page.tsx                                 UPDATE — wire ProfileOnboardingStepper
  ProfileContent.tsx                       UPDATE — integrate section components
  components/
    ProfileOnboardingStepper/
      ProfileOnboardingStepper.tsx         NEW — MUI Stepper with stage-driven state
    AddressSection/
      AddressSection.tsx                   NEW — address list + add/edit/delete
      AddressForm.tsx                      NEW — address create/edit form
      AddressCard.tsx                      NEW — single address display
      __tests__/
        AddressSection.test.tsx            NEW
    PersonalDetailsSection/
      PersonalDetailsSection.tsx           NEW — bio, languages, personal info form
      __tests__/
        PersonalDetailsSection.test.tsx    NEW
    ProfessionalDetailsSection/
      ProfessionalDetailsSection.tsx       NEW — portfolio multi-select + validation
      __tests__/
        ProfessionalDetailsSection.test.tsx NEW
    ScheduleSection/
      ScheduleSection.tsx                  NEW — weekly schedule + out-of-office
      OutOfOfficeForm.tsx                  NEW — date range form with validation
      __tests__/
        ScheduleSection.test.tsx           NEW
  services/
    api.ts                                 NEW — profile-scoped API calls

src/app/expert/
  [expertId]/
    schedule/
      page.tsx                             NEW — public schedule page (no auth)

e2e/
  027-legal-expert-profile.spec.ts         NEW
```

---

## 4. Component Design

### 4.1 `ProfileOnboardingStepper`

- **Purpose**: Drives the four-step onboarding UI and shows completion state.
- **Props**: `{ currentStage: 'Registration' | 'PersonalDetails' | 'ProfessionalDetails' | 'Schedule' }`
- **Implementation**: MUI `<Stepper>` with steps: Addresses, Personal Details, Professional Details, Schedule.
- **Stage to step index mapping**:
  ```typescript
  const stageIndex = { Registration: 0, PersonalDetails: 1, ProfessionalDetails: 2, Schedule: 3 };
  const completedUpTo = stageIndex[currentStage];
  ```
- **Banner**: When `currentStage === 'Schedule'` → MUI `<Alert severity="success">` shown.

### 4.2 `AddressSection`

- **Purpose**: Manages expert address list with CRUD.
- **AddressForm fields**: Address type (dropdown), city, state, country, pincode — all validated via `useFormValidation`.
- **Delete guard logic**:
  ```typescript
  // Before showing confirm dialog:
  const hasActiveAppointments = await checkAddressAppointments(expertId, addressId);
  if (hasActiveAppointments) showError("This address has active appointments...");
  else openConfirmDialog();
  ```

### 4.3 `ProfessionalDetailsSection`

- **Portfolio validation**: Before submit, verify all entries are non-empty and unique:
  ```typescript
  const hasDuplicates = new Set(portfolios).size !== portfolios.length;
  const hasEmpty = portfolios.some(p => !p.trim());
  if (hasDuplicates || hasEmpty) showError("Portfolio entries must be unique and non-empty.");
  ```
- **Portfolio items**: From pre-seeded reference data API endpoint.

### 4.4 `OutOfOfficeForm`

- **Fields**: Start date (MUI `DatePicker`), end date (MUI `DatePicker`).
- **Client-side validation** (before API call):
  ```typescript
  const today = startOfDay(new Date());
  if (isBefore(startDate, today)) setError("Start date must be today or in the future.");
  if (isBefore(endDate, startDate)) setError("End date must be on or after the start date.");
  ```

### 4.5 Public Schedule Page (`/expert/[expertId]/schedule`)

- No `"use client"` Keycloak check — publicly accessible.
- Renders `WeeklyScheduleView` (read-only day/time grid).
- Out-of-office periods shown as blocked ranges.
- Loaded via `next/dynamic` for schedule grid to avoid SSR issues.

---

## 5. API Plan

| Method | URL | Auth | Request Body | Success | Error Codes | Status |
|--------|-----|------|--------------|---------|-------------|--------|
| `GET` | `/api/v1/legal-experts/{expertId}` | Bearer (own) / SystemAdmin | — | `{ data: ExpertProfile }` 200 | 401, 403, 404 | Existing (verify) |
| `POST` | `/api/v1/legal-experts/{expertId}/addresses` | Bearer (own / SystemAdmin) | `AddAddressRequest` | `{ data: Address }` 201 | 400, 401, 403 | Existing (verify) |
| `PUT` | `/api/v1/legal-experts/{expertId}/addresses/{id}` | Bearer (own / SystemAdmin) | `UpdateAddressRequest` | `{ data: Address }` 200 | 400, 401, 403, 404 | Existing (verify) |
| `DELETE` | `/api/v1/legal-experts/{expertId}/addresses/{id}` | Bearer (own / SystemAdmin) | — | 204 | 401, 403, 404, 409 (active appts) | Existing (verify) |
| `PUT` | `/api/v1/legal-experts/{expertId}/personal-details` | Bearer (own / SystemAdmin) | `PersonalDetailsRequest` | `{ data: PersonalDetails }` 200 | 400, 401, 403 | Existing (verify) |
| `PUT` | `/api/v1/legal-experts/{expertId}/professional-details` | Bearer (own / SystemAdmin) | `ProfessionalDetailsRequest` | `{ data: ProfessionalDetails }` 200 | 400, 401, 403 | Existing (verify) |
| `PUT` | `/api/v1/legal-experts/{expertId}/schedule` | Bearer (own / SystemAdmin) | `ScheduleRequest` | `{ data: Schedule }` 200 | 400, 401, 403 | Existing (verify) |
| `POST` | `/api/v1/legal-experts/{expertId}/out-of-office` | Bearer (own / SystemAdmin) | `OutOfOfficeRequest` | `{ data: OutOfOfficePeriod }` 201 | 400, 401, 403 | Needs verification |
| `GET` | `/api/v1/legal-experts/{expertId}/schedule/public` | None | — | `{ data: PublicSchedule }` 200 | 404 | Needs verification |

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| Expert editing another expert's profile | All profile API calls scoped to `expertId`; backend validates token matches expert |
| SystemAdmin editing any expert | Backend allows SystemAdmin to bypass `expertId` ownership check |
| Public schedule page leaking PII | Public endpoint returns only schedule/availability data — no email, phone, or address details |
| Portfolio entries with script content | MUI inputs render as controlled text; values stored as plain strings, never rendered via innerHTML |
| Address deletion despite active appointments | Backend returns 409 on active appointment conflict; frontend checks first and shows error before confirm dialog |
| Out-of-office past dates accepted | Client-side validation prevents past start dates; backend also validates |
| Stage regression via direct API call | Stage is backend-managed; UI cannot set stage lower; API ignores regressive stage values |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `expertProfile` (stage, all sections) | `ProfileContent` (local via `useState`) | Profile data is user-scoped; re-fetched after each save |
| `addresses` list | `AddressSection` (local) | Section-scoped; refreshed after add/edit/delete |
| `outOfOfficePeriods` | `ScheduleSection` (local) | Section-scoped |
| `activeStep` (stepper) | `ProfileOnboardingStepper` (local) | Derived from `stage` prop — no additional state needed |
| `editModalOpen`, `selectedAddress` | `AddressSection` (local) | Modal selection state |
| Form values | Each section form (local via `useFormValidation`) | Form state is ephemeral |

No new Redux slices required. Profile data is not persisted in Redux (too frequently updated during onboarding).

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `AddressSection.test.tsx` | Add address form submits → POST called | API mock invoked |
| `AddressSection.test.tsx` | Delete address with active appointments → error shown | Error toast rendered |
| `AddressSection.test.tsx` | Delete address with no appointments → confirm dialog opens | Dialog in DOM |
| `PersonalDetailsSection.test.tsx` | Save personal details → stage does not regress if already at Schedule | Stage indicator unchanged |
| `ProfessionalDetailsSection.test.tsx` | Duplicate portfolio entry → validation error | Error text shown |
| `ProfessionalDetailsSection.test.tsx` | Empty portfolio entry → validation error | Error text shown |
| `ScheduleSection.test.tsx` | Out-of-office start in past → validation error | "Start date must be today..." shown |
| `ScheduleSection.test.tsx` | Out-of-office end before start → validation error | "End date must be on or after..." shown |
| `ProfileOnboardingStepper.test.tsx` | Stage = Schedule → "discoverable" banner shown | Banner text present |
| `ProfileOnboardingStepper.test.tsx` | Stage = PersonalDetails → step 1 completed, step 2 active | Stepper visual state correct |

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| Complete all 4 onboarding steps | LegalIndividualExpert | Fill each step in order | Stage advances after each save |
| Stage does not regress on re-edit | LegalIndividualExpert | At Schedule stage, re-edit addresses | Stage still shows Schedule |
| Delete address with active appointment | LegalIndividualExpert | Try to delete address | Error message shown |
| Out-of-office past start date | LegalIndividualExpert | Enter yesterday as start date | Validation error shown |
| Public schedule page — no auth | Unauthenticated | GET /expert/{id}/schedule | Schedule visible, no login redirect |
| "Discoverable" banner shown | LegalIndividualExpert | Complete schedule step | Success banner visible |

Test file: `e2e/027-legal-expert-profile.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-001: All 4 steps completable in one session | Each section saves independently; no full-page reload between steps |
| SC-002: Stage indicator accurate on every load | Stage read from API response — no client-side stage derivation |
| SC-003: Address deletion guard without server round-trip | Check appointment count via dedicated lightweight endpoint before confirm dialog |
| SC-004: Out-of-office validation before submission | Client-side date validation using `date-fns` — zero server round-trips for invalid inputs |
| SC-005: Public schedule page within 2s | No Keycloak init overhead; `next/dynamic` for schedule grid component |
| `React.memo` on address cards | Prevents re-renders when other sections update |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| Expert profile loaded | INFO | `expertId`, `stage`, `requesterId` | Bio, personal details content |
| Address added/updated | INFO | `expertId`, `addressId`, action | Full address text |
| Address delete blocked (active appointments) | WARN | `expertId`, `addressId`, appointment count | — |
| Professional details saved | INFO | `expertId`, portfolio item count | Portfolio content |
| Schedule saved | INFO | `expertId`, `newStage` | Schedule JSON |
| Out-of-office period added | INFO | `expertId`, start date, end date | — |
| Public schedule page accessed | INFO | `expertId` | — |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Backend stage field name mismatch (`stage` vs `onboardingStage`) | Medium | High | Confirm exact field name from API response before building stepper |
| Address deletion 409 response not handled by errorHandler | Medium | Medium | Add explicit 409 handling in `AddressSection` — show domain-specific message |
| Public schedule page behind Keycloak middleware | Medium | High | Verify `next.config.ts` or middleware.ts does not gate `/expert/*` routes |
| Out-of-office timezone issues | Medium | Medium | Normalize all dates to UTC before submission; display in local timezone |
| Portfolio reference data endpoint not yet available | Low | Medium | Fallback to text input if reference data API is not ready; verify in research phase |
| Stage stepper flashes wrong step before API response | Low | Low | Show loading skeleton on stepper until `stage` is fetched |
