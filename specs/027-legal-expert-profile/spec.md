# Feature Specification: Legal Expert Profile (Onboarding)

**Feature Branch**: `027-legal-expert-profile`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Guide a LegalIndividualExpert through completing their onboarding profile after initial registration. The profile has four sequential sections completed in order: addresses, personal details, professional details, and schedule. Completing each section advances the expert's stage indicator. Once the schedule section is complete, the expert becomes discoverable in search. This spec also covers out-of-office management and how clients can view an expert's public schedule.

---

## Actors

| Actor | Add/edit address | Delete address | Personal details | Professional details | Schedule | Out-of-office |
|---|---|---|---|---|---|---|
| `LegalIndividualExpert` | Yes (own) | Yes (own) | Yes (own) | Yes (own) | Yes (own) | Yes (own) |
| `SystemAdmin` | Yes (any) | No | Yes (any) | Yes (any) | Yes (any) | Yes (any) |
| `Client` | No | No | No | No | No | No — view only |
| Public (unauthenticated) | No | No | No | No | No | View only |

---

## User Scenarios & Testing

### P1 — Expert Completes Addresses (Priority: P1)

As a LegalIndividualExpert completing onboarding,
I want to add my office address(es),
So that clients can find me for offline appointments.

**Independent Test**: Log in as a new expert in "Registration" stage. Navigate to Profile > Addresses. Add one address and save — the onboarding stage indicator advances to "Personal Details."

**Acceptance Scenarios**:

1. **Given** an expert on the Addresses step of their profile,
   **When** they fill in the address form (type, city, state, country, pincode) and save,
   **Then** the address is saved and the onboarding stage advances if not already past Personal Details.

2. **Given** an expert with a saved address,
   **When** they edit and update the address,
   **Then** the updated values are reflected and a success toast is shown.

3. **Given** an expert trying to delete an address that has active upcoming appointments,
   **When** they click "Delete Address",
   **Then** an error message is shown: "This address has active appointments. Please reschedule or cancel them before deleting."

4. **Given** an expert with an address that has no upcoming appointments,
   **When** they delete it,
   **Then** the address is removed from their list.

5. **Given** a Client viewing an expert's public profile,
   **When** the addresses section loads,
   **Then** the addresses are shown in read-only mode for reference.

---

### P2 — Expert Completes Personal Details (Priority: P2)

As a LegalIndividualExpert,
I want to fill in my personal details (bio, languages spoken, etc.),
So that potential clients know more about me.

**Acceptance Scenarios**:

1. **Given** an expert on the Personal Details step,
   **When** they fill in and submit the personal details form,
   **Then** the details are saved and the onboarding stage advances to "Personal Details" if not already past it.

2. **Given** the expert returns to edit their personal details after completing a later step,
   **When** they save updates,
   **Then** the details update without regressing their onboarding stage.

---

### P3 — Expert Completes Professional Details (Priority: P3)

As a LegalIndividualExpert,
I want to enter my legal specializations and portfolio,
So that clients searching by expertise area can find me.

**Acceptance Scenarios**:

1. **Given** an expert on the Professional Details step,
   **When** they select their portfolio items (legal specializations) and save,
   **Then** the professional details are saved and the stage advances to "Professional Details."

2. **Given** the expert enters duplicate or empty portfolio entries,
   **When** they try to save,
   **Then** a validation error appears: "Portfolio entries must be unique and non-empty."

---

### P4 — Expert Completes Schedule (Priority: P4)

As a LegalIndividualExpert,
I want to set my weekly availability schedule,
So that clients can see when I am available for appointments.

**Acceptance Scenarios**:

1. **Given** an expert on the Schedule step,
   **When** they configure their availability and save,
   **Then** the schedule is saved, the stage advances to "Schedule," and a banner appears: "Your profile is now complete — you are discoverable in search."

2. **Given** a Client or unauthenticated user viewing an expert's public schedule page,
   **When** the page loads,
   **Then** the expert's weekly availability is shown without requiring login.

---

### P5 — Expert Sets Out-of-Office Dates (Priority: P5)

As a LegalIndividualExpert,
I want to mark periods when I am unavailable,
So that clients don't book appointments during those dates.

**Acceptance Scenarios**:

1. **Given** an expert on their Schedule page,
   **When** they set an out-of-office period with a start date today or in the future and a valid end date,
   **Then** the period is saved and shown on their schedule.

2. **Given** the expert enters a start date in the past,
   **When** they try to save,
   **Then** a validation error appears: "Start date must be today or in the future."

3. **Given** the expert enters an end date before the start date,
   **When** they try to save,
   **Then** a validation error appears: "End date must be on or after the start date."

---

### Edge Cases

- Expert can add multiple addresses in one save action
- Address deletion blocked if active appointments reference that address
- Stage only advances — editing personal details when already at Schedule stage does not regress progress
- SystemAdmin can edit any section of any expert's profile
- Schedule is publicly viewable without login (for unauthenticated client browsing)

---

## Requirements

### Functional Requirements

- **FR-001**: The expert profile onboarding MUST be presented as a four-step flow: Addresses → Personal Details → Professional Details → Schedule.
- **FR-002**: Each step form MUST auto-save progress and advance the stage indicator on successful save.
- **FR-003**: The stage indicator MUST NOT regress when re-editing a previously completed section.
- **FR-004**: Address deletion MUST show an error and block removal when active appointments exist at that address.
- **FR-005**: Portfolio entries in Professional Details MUST be validated as non-empty and unique before submission.
- **FR-006**: Out-of-office start date MUST be validated as today or future; end date MUST be on or after start date.
- **FR-007**: Upon completing the Schedule step, the UI MUST display a "You are now discoverable in search" confirmation message.
- **FR-008**: The expert's schedule page MUST be publicly accessible without login.

### Key Entities

- **Address**: Office location for offline appointments. Multiple allowed per expert.
- **Personal Details**: Bio, languages, and personal information. One record per expert.
- **Professional Details**: Legal specialization portfolio. One record per expert.
- **Schedule**: Weekly availability. Completion makes the expert discoverable in search.
- **Out-of-Office**: Date range when the expert is unavailable. Shown on the schedule.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: An expert can complete all four onboarding sections in a single session without errors.
- **SC-002**: The stage indicator accurately reflects the expert's highest completed step on every page load.
- **SC-003**: The address deletion guard prevents removal when active appointments exist — zero data loss scenarios.
- **SC-004**: Out-of-office date validation catches invalid ranges before submission — no server round-trip needed.
- **SC-005**: The public schedule page loads within 2 seconds without login.

---

## Assumptions

- The expert's onboarding stage is determined by the backend — the UI reads it and displays the current step.
- Portfolio items (legal specializations) are pre-defined reference data — the expert picks from a list.
- Schedule configuration includes day-of-week toggles and time range pickers.

---

## Out of Scope

- Legal expert registration — spec `013-legal-expert-management`
- Expert search and discovery — spec `028-legal-expert-search`
- Appointment booking using the expert's schedule — spec `014-appointments`
