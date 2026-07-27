# Feature Specification: Legal Expert — Registration Stage, Portfolios & Cases

**Feature Branch**: `023-legal-expert-stage-portfolios-cases`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Three related features for `LegalIndividualExpert`:
1. **Registration stage tracker** — show where the expert is in their onboarding journey
2. **Expert types & portfolios** — public listing of legal specializations for search/browse
3. **Expert's personal cases** — a standalone expert managing their own case list (separate from org/site cases)

---

## Actors

| Actor | View stage | View expert types | Expert's own cases |
|---|---|---|---|
| `LegalIndividualExpert` | Yes (own) | Yes | Yes (own) |
| Public (unauthenticated) | No | Yes | No |
| `SystemAdmin` | Yes (any) | Yes | Yes (any) |
| `Client` | No | Yes | No |

---

## User Scenarios & Testing

### P1 — Onboarding Stage Progress (Priority: P1)

As a LegalIndividualExpert who has just registered,
I want to see a visual progress indicator showing my onboarding stage,
So that I know what I need to complete to become discoverable to clients.

**Independent Test**: Log in as a new expert in "Registration" stage. The dashboard shows a progress bar or step indicator: Registration (completed) → Personal Details → Professional Details → Schedule.

**Acceptance Scenarios**:

1. **Given** a LegalIndividualExpert who just registered,
   **When** they view their dashboard or profile page,
   **Then** an onboarding progress indicator shows their current stage (e.g., "Step 1 of 4: Registration complete").

2. **Given** the expert has completed Personal Details,
   **When** they view their progress,
   **Then** the indicator shows "Step 2 of 4: Personal Details complete."

3. **Given** the expert reaches the "Schedule" stage,
   **When** the indicator updates,
   **Then** a message appears: "Your profile is complete. You are now discoverable in search."

4. **Given** the expert tries to manually navigate backward (e.g., re-submitting Registration stage),
   **When** the step is completed,
   **Then** the stage does not regress — it remains at the highest completed step.

---

### P2 — Browse Expert Types and Portfolios (Priority: P2)

As a client or unauthenticated user,
I want to browse available legal expert types and their portfolio specializations,
So that I can understand what kind of expert I need before searching.

**Acceptance Scenarios**:

1. **Given** a user (unauthenticated) on the Expert Types page,
   **When** the page loads,
   **Then** a list of legal specialization categories is shown (e.g., Corporate, Criminal, Family) without requiring login.

2. **Given** a user clicks on an expert type,
   **When** the detail expands or navigates,
   **Then** the portfolio sub-specializations within that type are shown.

---

### P3 — Expert Manages Personal Case List (Priority: P3)

As a LegalIndividualExpert,
I want to maintain my own list of cases independently of any organization,
So that I can track legal matters I handle directly as a freelance expert.

**Acceptance Scenarios**:

1. **Given** an authenticated LegalIndividualExpert on their My Cases page,
   **When** they click "Add Case",
   **Then** a create case form opens (same fields as org cases: title, case number, status, description).

2. **Given** the expert fills the form and submits,
   **When** creation succeeds,
   **Then** the case appears in their personal case list.

3. **Given** the expert views their personal case list,
   **When** they click a case,
   **Then** the case detail page opens with edit and delete options.

4. **Given** an expert trying to access another expert's personal cases,
   **When** the URL is visited,
   **Then** an access denied error is shown.

---

### Edge Cases

- Expert types are public — no login required to browse
- Personal cases are completely separate from org/site cases — they do not share data
- Stage only advances (never regresses)
- SystemAdmin can create, view, update, and delete any expert's personal cases

---

## Requirements

### Functional Requirements

- **FR-001**: The expert dashboard/profile MUST show a visual onboarding progress indicator with four steps: Registration, Personal Details, Professional Details, Schedule.
- **FR-002**: The onboarding indicator MUST clearly show which step the expert is currently on and what's required to advance.
- **FR-003**: The Expert Types page MUST be publicly accessible (no login required) and list all legal specialization categories with their portfolios.
- **FR-004**: The expert's My Cases page MUST allow full CRUD: add, view, edit, delete personal cases.
- **FR-005**: Personal cases MUST be isolated from org/site cases — no mixing in lists or search results.
- **FR-006**: The "discoverable in search" message MUST appear only when the expert reaches the Schedule stage.
- **FR-007**: Expert's personal case delete MUST require confirmation.

### Key Entities

- **Registration Stage**: 4-step onboarding: Registration → PersonalDetails → ProfessionalDetails → Schedule. Only advances.
- **Expert Type**: Legal specialization category. Public reference data.
- **Portfolio**: Sub-specialization within an expert type. Also public.
- **Expert's Personal Case**: A case owned by the expert, not linked to any org or site.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: The onboarding progress indicator is accurate on every page load — always reflects the current stage.
- **SC-002**: The Expert Types page loads without authentication — accessible in under 2 seconds.
- **SC-003**: An expert can create and manage their own cases in under 2 minutes per case.
- **SC-004**: Personal cases never appear in org/site case lists.

---

## Assumptions

- Expert types and portfolios are pre-seeded in the platform — the UI consumes them as reference data.
- The expert's personal cases page is a separate section in the expert's profile, clearly labeled "My Cases."
- Onboarding progress is determined by the backend registration stage endpoint — not calculated client-side.

---

## Out of Scope

- Legal expert profile onboarding forms (personal details, professional details, schedule) — spec `027-legal-expert-profile`
- Expert search and discovery — spec `028-legal-expert-search`
- Org/site case management — specs `005`–`012`
