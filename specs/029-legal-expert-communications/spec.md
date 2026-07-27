# Feature Specification: Legal Expert Communications

**Feature Branch**: `029-legal-expert-communications`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Provide a messaging channel between SystemAdmins and individual legal experts. Admins initiate threads and can reply; experts can only reply to threads directed at them. Both parties can edit and delete only their own messages — there is no admin override for authorship.

---

## Actors

| Actor | Start thread | Admin reply | Expert reply | Read | Edit own | Delete own |
|---|---|---|---|---|---|---|
| `SystemAdmin` | Yes | Yes | No | Yes | Yes | Yes |
| `LegalIndividualExpert` | No | No | Yes | Yes (own threads) | Yes | Yes |

---

## User Scenarios & Testing

### P1 — Admin Sends a Message to an Expert (Priority: P1)

As a SystemAdmin,
I want to send a communication message to a specific legal expert,
So that I can contact them about their account, onboarding, or a platform matter.

**Independent Test**: Log in as SystemAdmin, navigate to Legal Experts > [Expert Name] > Communications. Click "New Message," write content, and send. The thread appears in the communications list.

**Acceptance Scenarios**:

1. **Given** a SystemAdmin on an expert's Communications page,
   **When** they click "New Message," enter content, and send,
   **Then** a new communication thread is created and appears at the top of the list.

2. **Given** a SystemAdmin viewing an existing thread,
   **When** they click "Reply" and submit their reply,
   **Then** the reply appears in the thread.

3. **Given** an expert trying to start a new thread,
   **When** the Communications page renders for the expert,
   **Then** no "New Message" button is visible — experts cannot initiate threads.

---

### P2 — Expert Views and Replies to Communications (Priority: P2)

As a LegalIndividualExpert,
I want to see messages sent to me by the platform admins and reply to them,
So that I can respond to inquiries or guidance from the Lawsome team.

**Acceptance Scenarios**:

1. **Given** an expert on their Communications page,
   **When** the page loads,
   **Then** all communication threads directed to them are shown ordered by most recent.

2. **Given** the expert opens a thread,
   **When** the thread detail loads,
   **Then** all messages and replies are shown with sender label (Admin / Me) and timestamps.

3. **Given** the expert writes a reply and sends it,
   **When** the reply is submitted,
   **Then** the reply appears in the thread and a success confirmation is shown.

---

### P3 — Edit and Delete Own Messages (Priority: P3)

As either a SystemAdmin or LegalIndividualExpert,
I want to edit or delete messages I have sent,
So that I can correct mistakes or remove outdated content.

**Acceptance Scenarios**:

1. **Given** a user viewing a message they authored,
   **When** they click "Edit" and update the content,
   **Then** the message is updated and an "Edited" label appears on it.

2. **Given** a user viewing a message they authored,
   **When** they click "Delete" and confirm,
   **Then** the message is removed from the thread.

3. **Given** a user viewing a message authored by the other party,
   **When** the message is displayed,
   **Then** no "Edit" or "Delete" buttons appear on that message — authorship controls are own-message-only.

4. **Given** a SystemAdmin viewing a message written by the expert,
   **When** the admin attempts to edit it,
   **Then** the action is blocked with an error: "You can only edit your own messages."

---

### Edge Cases

- Experts cannot create new threads — only SystemAdmin can initiate
- Edit and delete are strictly author-based: neither party can modify the other's messages
- No push notifications when a new thread is created — the expert must check their Communications page

---

## Requirements

### Functional Requirements

- **FR-001**: The Communications page for an expert MUST show all threads directed at them, ordered by most recent activity.
- **FR-002**: SystemAdmin MUST have a "New Message" button on the expert's Communications page; experts MUST NOT see this button.
- **FR-003**: Both SystemAdmin and expert MUST have a "Reply" option within a thread.
- **FR-004**: Edit and Delete controls MUST only appear on messages the current user authored.
- **FR-005**: Clicking Edit MUST open the message for inline editing or in a modal, pre-filled with current content.
- **FR-006**: Delete MUST require a confirmation dialog.
- **FR-007**: After a successful edit, the message MUST display an "Edited" or similar indicator.
- **FR-008**: The thread view MUST clearly label which messages are from Admin vs. the expert (e.g., sender badge or alignment).

### Key Entities

- **Communication Thread**: A message initiated by SystemAdmin directed at a specific legal expert.
- **Reply**: A follow-up message added to an existing thread by either party.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Thread list and full thread detail load within 2 seconds.
- **SC-002**: No user can edit or delete a message written by the other party — zero cross-authorship edits possible through the UI.
- **SC-003**: Experts find their Communications section without navigating more than 2 levels from their dashboard.

---

## Assumptions

- The Communications section lives within the expert's profile or a dedicated Inbox section in the expert's navigation.
- There is no real-time push — users see new messages by loading or refreshing the Communications page.
- Message content is plain text — no rich text or file attachments in this version.

---

## Out of Scope

- Case comments — spec `012-case-comment-management`
- In-app notifications — not implemented
- Legal expert management (registration, activation) — spec `013-legal-expert-management`
