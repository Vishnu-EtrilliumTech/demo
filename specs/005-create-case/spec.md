# Feature Specification: Create Case

**Feature Branch**: `005-create-case`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow authorized users to open a new legal case under a site. Cases are the central unit of work in Lawsome — all tasks, hearings, documents, invoices, and comments attach to a case. The create case form captures the case title, reference number, initial status, and the assigned team member.

---

## Actors

| Actor | Can create case? |
|---|---|
| `OrganizationAdmin` | Yes |
| `SiteAdmin` | Yes (own site) |
| `SiteClerk` | Yes (own site) |
| `SiteSrLegalExpert` | Yes (own site) |
| `SiteLegalExpert` | Yes (own site) |
| `OrganizationClerk` | No — "Create Case" is hidden |
| `SiteCaseClient` | No |

---

## User Scenarios & Testing

### P1 — Authorized User Creates a Case (Priority: P1)

As a SiteAdmin, SiteClerk, SiteLegalExpert, or OrganizationAdmin,
I want to open a new case by filling out a form,
So that my team can begin tracking the legal matter.

**Independent Test**: As SiteClerk, navigate to Site > Cases > Create Case. Fill all required fields and submit. The case appears in the case list.

**Acceptance Scenarios**:

1. **Given** an authenticated SiteClerk on their site's Cases page,
   **When** they click "Create Case",
   **Then** a form opens with fields for: case title (required), case number (required), status (required, enum), assigned team member (required, user selector from site users), and optional description.

2. **Given** all required fields are filled with valid values,
   **When** the user submits the form,
   **Then** a success notification is shown and the user is redirected to or the case list refreshes to show the new case.

3. **Given** the form submission is in progress,
   **When** the API is pending,
   **Then** the submit button is disabled with a loading indicator.

---

### P2 — OrganizationClerk Cannot Create Cases (Priority: P2)

As the platform UI,
I must hide the "Create Case" action from OrganizationClerks,
So that the UI reflects the business rule that clerks manage structure, not cases.

**Acceptance Scenarios**:

1. **Given** an authenticated OrganizationClerk on a site's Cases page,
   **When** the page loads,
   **Then** the "Create Case" button is not rendered.

---

### P3 — Status Selection at Creation (Priority: P3)

As a user creating a case,
I want to choose the initial status of the case,
So that I can accurately reflect whether the case is just opened, in progress, or in some other state.

**Acceptance Scenarios**:

1. **Given** the Create Case form is open,
   **When** the user views the status dropdown,
   **Then** the options are: Open, In Progress, On Hold, Closed.

2. **Given** no status is selected,
   **When** the user tries to submit,
   **Then** an inline error appears: "Status is required."

---

### Edge Cases

- Case title at maximum length (200 chars) → accepted
- Case number at maximum length (50 chars) → accepted
- Two cases with the same case number → both allowed (uniqueness not enforced)
- Description is optional — form can be submitted without it

---

## Requirements

### Functional Requirements

- **FR-001**: The Create Case form MUST include: title (required, max 200), case number (required, max 50), status (required, enum: Open/InProgress/OnHold/Closed), assigned team member (required, searchable user selector), description (optional, max 500).
- **FR-002**: The status field MUST be a dropdown with four options: Open, In Progress, On Hold, Closed.
- **FR-003**: The assigned team member field MUST show users from the current site.
- **FR-004**: Required field validation MUST run on blur and on form submission.
- **FR-005**: The "Create Case" button/action MUST be hidden for `OrganizationClerk` and `SiteCaseClient` roles.
- **FR-006**: On success, a toast notification MUST appear and the case list MUST reflect the new case.

### Key Entities

- **Case**: The central legal work unit. Has title, reference number, status, assigned team member, and optional description.
- **Status**: Open, InProgress, OnHold, Closed — set at creation and updated over the case lifecycle.
- **Assigned Team Member**: A user from the site; displayed by name in the UI but sent as a user ID to the API.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: An authorized user can create a case in under 90 seconds.
- **SC-002**: The assigned team member selector renders a searchable list of site users.
- **SC-003**: Status dropdown always shows all four valid options.
- **SC-004**: OrganizationClerk and SiteCaseClient users never see the Create Case button.

---

## Assumptions

- The assigned team member picker loads site users from the site user list API.
- Status defaults to "Open" when the form first renders (most common use case).
- The form is a modal or full-page form, not an inline edit.

---

## Out of Scope

- Edit/delete/view case — spec `006-case-read-update-delete`
- Case tasks, documents, hearings, invoices, comments — specs `007`–`012`
- AI case summary — spec `018-case-ai`
