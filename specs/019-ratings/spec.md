# Feature Specification: Ratings

**Feature Branch**: `019-ratings`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow clients to rate legal experts after appointments using a 1–5 star rating with optional comments. New ratings start unverified — admins review and verify them. Clients can update or delete their own ratings and add replies. Legal experts can view their ratings. All new ratings display as unverified until an admin approves them.

---

## Actors

| Actor | Add rating | View | Update own | Delete own | Add reply |
|---|---|---|---|---|---|
| `Client` | Yes | Yes | Yes | Yes | Yes |
| `LegalIndividualExpert` | No | Yes (own) | No | No | No |
| `SystemAdmin` | No | Yes | Yes (verify) | Yes | Yes |

---

## User Scenarios & Testing

### P1 — Client Rates a Legal Expert (Priority: P1)

As a client,
I want to leave a star rating and optional comment for a legal expert after my appointment,
So that other clients can benefit from my experience.

**Independent Test**: As a Client, navigate to a completed appointment or the expert's profile. Click "Rate Expert". Select 4 stars, add a comment, submit. Rating appears as "Unverified" on the expert's profile.

**Acceptance Scenarios**:

1. **Given** a client who has had an appointment with an expert,
   **When** they navigate to the expert's profile or their appointment detail,
   **Then** a "Rate This Expert" button or section is visible.

2. **Given** the client selects 4 stars and optionally types a comment,
   **When** they submit the rating,
   **Then** a success message is shown and the rating appears with an "Unverified" badge.

3. **Given** the client enters a rating below 1 or above 5 (if manual input is possible),
   **When** validated,
   **Then** an error is shown: "Rating must be between 1 and 5 stars."

---

### P2 — Legal Expert Views Their Ratings (Priority: P2)

As a legal expert,
I want to see all ratings clients have left for me,
So that I can understand how clients perceive my services.

**Acceptance Scenarios**:

1. **Given** an authenticated LegalIndividualExpert on their profile or dashboard,
   **When** they view the Ratings section,
   **Then** a list of ratings is shown with: star count, comment, client name (anonymized or full), verified status, and date.

2. **Given** no ratings exist for the expert yet,
   **When** the ratings section loads,
   **Then** a "No ratings yet" message is shown.

---

### P3 — Client Updates or Deletes Own Rating (Priority: P3)

As a client,
I want to edit or delete a rating I submitted,
So that I can correct mistakes or remove outdated reviews.

**Acceptance Scenarios**:

1. **Given** a client who has submitted a rating,
   **When** they view it on the expert's profile or their activity history,
   **Then** Edit and Delete options are visible on their own rating only.

2. **Given** the client updates their rating from 4 to 5 stars and saves,
   **When** the update succeeds,
   **Then** the updated rating is shown.

3. **Given** the client deletes their rating and confirms,
   **When** deletion succeeds,
   **Then** the rating is removed.

---

### P4 — Admin Verifies Ratings (Priority: P4)

As a SystemAdmin,
I want to review and verify or reject client ratings,
So that only legitimate, accurate reviews are displayed as verified.

**Acceptance Scenarios**:

1. **Given** a SystemAdmin on the Ratings Management page,
   **When** they view unverified ratings,
   **Then** a list of unverified ratings is shown with a "Verify" action.

2. **Given** the admin clicks "Verify" on a rating,
   **When** the action succeeds,
   **Then** the rating's status changes to "Verified" and a verification badge appears on the public-facing view.

---

### Edge Cases

- Rating of 0 → validation error before submit
- Rating of 6+ → validation error before submit
- Reply to a deleted rating → stored but orphaned (known platform gap)
- A client's edit/delete controls appear ONLY on their own ratings

---

## Requirements

### Functional Requirements

- **FR-001**: The rating UI MUST use a star selector (1–5 stars) with a click or tap interaction.
- **FR-002**: Unverified ratings MUST display a clear "Unverified" badge visible to all viewers.
- **FR-003**: Verified ratings MUST display a "Verified" badge.
- **FR-004**: Edit and Delete controls MUST only appear on ratings authored by the currently logged-in client.
- **FR-005**: The expert's profile page MUST include a Ratings section showing all their ratings.
- **FR-006**: Admin MUST be able to mark ratings as verified via the management interface.
- **FR-007**: Delete MUST require confirmation.
- **FR-008**: Replies to a rating MUST be shown indented under the rating.

### Key Entities

- **Rating**: A 1–5 star review with optional comment. Starts unverified.
- **Verified Flag**: Set by admin. Indicates the rating has been reviewed and approved.
- **Reply**: A comment added to a rating by the client or admin.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: A client can submit a rating in under 1 minute.
- **SC-002**: Unverified ratings always show the badge on first render — zero cases where a new rating appears as verified.
- **SC-003**: Star selector enforces 1–5 range with no invalid values submittable.
- **SC-004**: Edit/Delete controls never appear on another user's rating.

---

## Assumptions

- Ratings are displayed on the legal expert's public profile page.
- Rating values are whole numbers (1–5). Half-star ratings are not supported.
- The rating star selector is a standard UI component (e.g., MUI Rating component).

---

## Out of Scope

- Average rating calculation/display — not implemented in backend
- Rating notifications — not implemented
- Automated rating verification workflow — manual admin review only
