# Feature Specification: Case AI (Summary & Chat)

**Feature Branch**: `018-case-ai`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow OrganizationAdmins to generate an AI-powered summary of a case and chat with the AI about the case. This provides admins with a quick way to understand a complex case and ask questions about it. Access is restricted to OrganizationAdmin and SystemAdmin only.

---

## Actors

| Actor | AI Summary | AI Chat |
|---|---|---|
| `OrganizationAdmin` | Yes (own org cases) | Yes (own org cases) |
| `SystemAdmin` | Yes (any case) | Yes (any case) |
| All other roles | No | No |

---

## User Scenarios & Testing

### P1 — Generate AI Case Summary (Priority: P1)

As an OrganizationAdmin,
I want to generate an AI summary of a case with a single click,
So that I can quickly understand the key details of a complex case without reading through all records manually.

**Independent Test**: As OrgAdmin, navigate to a case detail page and click "AI Summary". A loading indicator appears, then a text summary of the case is displayed.

**Acceptance Scenarios**:

1. **Given** an OrganizationAdmin on the case detail page,
   **When** they click "Generate AI Summary",
   **Then** a loading indicator appears and after the AI response arrives, a summary panel opens showing key case details in natural language.

2. **Given** the AI summary is loading,
   **When** the response takes longer than 2 seconds,
   **Then** the loading indicator remains visible with a message like "Generating summary — this may take a moment..."

3. **Given** a SiteAdmin on the case detail page,
   **When** the page renders,
   **Then** no "AI Summary" or "AI Chat" controls are visible.

4. **Given** the AI service is unavailable,
   **When** the admin clicks "Generate AI Summary",
   **Then** an error message is shown: "AI summary is temporarily unavailable. Please try again later."

---

### P2 — Chat with AI About a Case (Priority: P2)

As an OrganizationAdmin,
I want to ask the AI questions about a specific case,
So that I can get contextual answers without switching between multiple records.

**Acceptance Scenarios**:

1. **Given** an OrganizationAdmin on the case detail page,
   **When** they open the AI Chat panel and type a question,
   **Then** the AI responds with a relevant answer about the case.

2. **Given** the admin sends an empty or whitespace-only message,
   **When** the send button is clicked,
   **Then** the message is not sent and an inline error appears: "Please enter a message."

3. **Given** the AI chat is active,
   **When** the admin asks multiple questions,
   **Then** the conversation is displayed as a back-and-forth thread within the session.

---

### P3 — Organization Isolation (Priority: P3)

As the platform,
I must prevent an OrganizationAdmin from accessing AI features for cases in another organization,
So that sensitive legal information remains isolated between organizations.

**Acceptance Scenarios**:

1. **Given** an OrganizationAdmin from Org A navigating to a case in Org B,
   **When** the AI Summary or Chat controls load,
   **Then** the controls are not shown or the action returns an access denied error.

---

### Edge Cases

- AI response may take longer than 2 seconds — the UI must handle this gracefully with a visible loading state
- Chat history is session-only — refreshing the page clears the chat
- Empty message rejected before the AI is called (client-side validation)

---

## Requirements

### Functional Requirements

- **FR-001**: An "AI Summary" button MUST be visible on the case detail page only for `OrganizationAdmin` and `SystemAdmin` roles.
- **FR-002**: An "AI Chat" panel or button MUST be visible only for `OrganizationAdmin` and `SystemAdmin` roles.
- **FR-003**: AI summary loading MUST show a spinner or progress indicator — do NOT show a blank state.
- **FR-004**: The AI Chat panel MUST include: a message input, send button, and a conversation thread.
- **FR-005**: Empty or whitespace-only messages MUST be rejected client-side before any API call.
- **FR-006**: AI service errors MUST display a user-friendly error message (no raw error details).
- **FR-007**: AI controls MUST NOT be rendered for site-level roles, SiteCaseClient, or OrganizationClerk.
- **FR-008**: Chat history is session-based only — not persisted across page refreshes.

### Key Entities

- **AI Summary**: A generated natural-language summary of the case and its associated records.
- **AI Chat**: A conversational interface where the admin can ask questions about the case.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: AI summary and chat controls are never visible to non-admin roles.
- **SC-002**: The loading state is always shown during AI generation — zero instances of blank content with no indicator.
- **SC-003**: Empty messages are blocked client-side — zero empty messages reach the API.
- **SC-004**: AI service errors display a friendly message within 1 second of the failure response.

---

## Assumptions

- AI response latency may exceed 2 seconds — this is expected and communicated to the user via loading UI.
- Chat does not persist between sessions — this is acceptable for the MVP.
- The AI cannot access data outside the case it is asked about — the backend enforces this.

---

## Out of Scope

- AI-generated legal documents or advice — not in scope
- Persistent chat history across sessions — not implemented
- Rate limiting UI (e.g., per-day AI query limits) — not implemented
