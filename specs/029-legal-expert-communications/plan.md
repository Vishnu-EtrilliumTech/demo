# Implementation Plan: Legal Expert Communications

**Branch**: `029-legal-expert-communications` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/029-legal-expert-communications/spec.md`

---

## 1. Overview

### What Exists

- No communications feature exists in the codebase.
- The admin dashboard (`src/app/admin-dashboard/`) has legal experts listing but no messaging section.
- `src/app/profile/` handles expert profile but no inbox/communications tab.
- `src/services/httpServices.ts` — Axios client available for new API calls.

### Gaps to Close

1. **Communications list page**: SystemAdmin navigates to an expert's profile → Communications tab shows all threads. Expert navigates to their own Communications section.
2. **Thread model**: Threads are initiated by SystemAdmin only; experts can only reply.
3. **Reply flow**: Both parties can reply within a thread.
4. **Edit/Delete own messages**: Each party can edit or delete only their own messages. "Edited" indicator on edited messages.
5. **Author-based controls**: No cross-authorship edit or delete — controls strictly shown for own messages only.
6. **Confirmation dialog** for delete.
7. Add unit and E2E tests.

### What Is New

- `src/app/admin-dashboard/legal-experts/[expertId]/communications/page.tsx` — Admin-side communications page
- `src/app/profile/components/CommunicationsSection/` — Expert-side inbox
- `src/app/communications/services/api.ts` — communications API service
- `src/app/communications/types/index.ts` — Thread, Reply, Message interfaces
- Unit tests and E2E tests

---

## 2. Architecture Flow

### 2.1 Admin — View Expert's Communications

```
SystemAdmin navigates to /admin-dashboard/legal-experts/{expertId}/communications
  → AdminExpertCommunicationsPage mounts
  → Keycloak check → role === SystemAdmin required
  → fetchCommunicationThreads(expertId)
      → GET /api/v1/legal-experts/{expertId}/communications
  → loading → <LoadingState />
  → ThreadList renders (ordered by most recent activity, newest first)
  → "New Message" button visible (SystemAdmin only)
```

### 2.2 Admin — Start New Thread

```
SystemAdmin clicks "New Message"
  → NewMessageModal opens
  → Text area (plain text, no rich text)
  → Submit → createThread(expertId, { content })
      → POST /api/v1/legal-experts/{expertId}/communications
  → 201 → modal closes → ThreadList refreshes → new thread at top
```

### 2.3 Expert — View Communications

```
LegalIndividualExpert navigates to /profile → Communications tab
  → fetchCommunicationThreads(ownExpertId)
      → GET /api/v1/legal-experts/{expertId}/communications
  → ThreadList shows all threads directed at expert
  → NO "New Message" button visible
```

### 2.4 View Thread Detail

```
User clicks thread in list
  → ThreadDetailView opens (modal or inline panel)
  → fetchThreadMessages(expertId, threadId)
      → GET /api/v1/legal-experts/{expertId}/communications/{threadId}/messages
  → Messages displayed in chronological order
  → Each message shows: sender label (Admin / Me), content, timestamp, "Edited" badge if edited
  → Own messages: Edit + Delete controls
  → Other party's messages: No controls
  → Reply form at bottom (available to both parties)
```

### 2.5 Reply to Thread

```
User submits reply text
  → createReply(expertId, threadId, { content })
      → POST /api/v1/legal-experts/{expertId}/communications/{threadId}/messages
  → 201 → new message appended to thread view → success toast
```

### 2.6 Edit Own Message

```
User clicks Edit on their own message
  → Inline edit mode: text area pre-filled with current content
  → User saves → updateMessage(expertId, threadId, messageId, { content })
      → PUT /api/v1/legal-experts/{expertId}/communications/{threadId}/messages/{messageId}
  → 200 → message content updated → "Edited" label appears
  → if message authored by other party → Edit button never rendered (authorship check)
```

### 2.7 Delete Own Message

```
User clicks Delete on their own message
  → ConfirmDialog: "Delete this message? This cannot be undone."
  → Confirm → deleteMessage(expertId, threadId, messageId)
      → DELETE /api/v1/legal-experts/{expertId}/communications/{threadId}/messages/{messageId}
  → 204 → message removed from thread view
  → if message authored by other party → Delete button never rendered
```

### 2.8 RBAC Summary

```
Communications page:
  → SystemAdmin: "New Message" button visible; can reply; can edit/delete own messages
  → LegalIndividualExpert: No "New Message" button; can reply; can edit/delete own messages

Per message:
  const isOwn = message.authorId === currentUser.id;
  {isOwn && <EditButton />}
  {isOwn && <DeleteButton />}
```

---

## 3. File Structure

### Documentation

```
specs/029-legal-expert-communications/
  spec.md                                          NO CHANGE
  plan.md                                          NEW (this file)
  research.md                                      NEW
  data-model.md                                    NEW
  contracts/
    api-contracts.md                               NEW
```

### Source Tree

```
src/app/admin-dashboard/legal-experts/
  [expertId]/
    communications/
      page.tsx                                     NEW — Admin communications page for expert

src/app/profile/
  components/
    CommunicationsSection/
      CommunicationsSection.tsx                    NEW — Expert inbox tab
      ThreadList.tsx                               NEW — List of threads
      ThreadDetailView.tsx                         NEW — Full thread with messages
      NewMessageModal.tsx                          NEW — Admin-only new thread form
      MessageItem.tsx                              NEW — Single message with authorship controls
      __tests__/
        ThreadList.test.tsx                        NEW
        MessageItem.test.tsx                       NEW

src/app/communications/
  services/
    api.ts                                         NEW — all communications API calls
  types/
    index.ts                                       NEW — Thread, Message, Reply interfaces

e2e/
  029-legal-expert-communications.spec.ts          NEW
```

---

## 4. Component Design

### 4.1 `ThreadList`

- **Purpose**: Renders a list of communication threads ordered by most recent activity.
- **Props**: `{ threads: Thread[], currentUserRole: string, onSelectThread: (thread: Thread) => void, onNewMessage?: () => void }`
- **"New Message" button**: Rendered only when `currentUserRole === 'SystemAdmin'`.
- **Thread item**: Shows subject/preview of first message, date of last activity, unread indicator (if supported).
- **Empty state**: `<EmptyState message="No communications yet." />`

### 4.2 `ThreadDetailView`

- **Purpose**: Full conversation thread with message list and reply form.
- **Message alignment**: Admin messages right-aligned, Expert messages left-aligned (chat-style), or use sender label badge.
- **Sender label**: "Admin" or "Me" badge per message.
- **Reply form**: Plain text `<textarea>` at bottom; send button.
- **Inline edit**: Clicking Edit replaces message text with a pre-filled `<textarea>` + Save/Cancel.

### 4.3 `MessageItem`

- **Purpose**: Single message display with authorship-gated controls.
- **Props**: `{ message: Message, isOwn: boolean, onEdit: () => void, onDelete: () => void }`
- **Authorship controls**:
  ```typescript
  {isOwn && (
    <>
      <IconButton onClick={onEdit}><EditIcon /></IconButton>
      <IconButton onClick={onDelete}><DeleteIcon /></IconButton>
    </>
  )}
  ```
- **"Edited" indicator**: `{message.isEdited && <Typography variant="caption">Edited</Typography>}`

### 4.4 `NewMessageModal`

- **Purpose**: Admin-only form to create a new thread.
- **Fields**: Message content (plain text `<TextField multiline>`).
- **No rich text, no file attachments**.
- **Validation**: Content must not be empty.

---

## 5. API Plan

| Method | URL | Auth | Request Body | Success | Error Codes | Status |
|--------|-----|------|--------------|---------|-------------|--------|
| `GET` | `/api/v1/legal-experts/{expertId}/communications` | Bearer (SystemAdmin or own expert) | — | `{ items: Thread[], totalCount, page, pageSize }` 200 | 401, 403 | NEW |
| `POST` | `/api/v1/legal-experts/{expertId}/communications` | Bearer (SystemAdmin only) | `{ content: string }` | `{ data: Thread }` 201 | 400, 401, 403 | NEW |
| `GET` | `/api/v1/legal-experts/{expertId}/communications/{threadId}/messages` | Bearer (SystemAdmin or own expert) | — | `{ items: Message[], totalCount, page, pageSize }` 200 | 401, 403, 404 | NEW |
| `POST` | `/api/v1/legal-experts/{expertId}/communications/{threadId}/messages` | Bearer (SystemAdmin or own expert) | `{ content: string }` | `{ data: Message }` 201 | 400, 401, 403, 404 | NEW |
| `PUT` | `/api/v1/legal-experts/{expertId}/communications/{threadId}/messages/{msgId}` | Bearer (own author only) | `{ content: string }` | `{ data: Message }` 200 | 400, 401, 403, 404 | NEW |
| `DELETE` | `/api/v1/legal-experts/{expertId}/communications/{threadId}/messages/{msgId}` | Bearer (own author only) | — | 204 | 401, 403, 404 | NEW |

**`Thread` interface**:
```typescript
interface Thread {
  id: string;
  expertId: string;
  subject?: string;
  lastMessageAt: string;
  messageCount: number;
}

interface Message {
  id: string;
  threadId: string;
  authorId: string;
  authorRole: 'SystemAdmin' | 'LegalIndividualExpert';
  content: string;
  createdAt: string;
  isEdited: boolean;
}
```

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| Expert viewing another expert's communications | API scoped to `expertId`; backend validates token owner matches expert or is SystemAdmin |
| Expert starting a new thread | "New Message" button hidden for expert role; backend returns 403 if non-admin POSTs to thread creation |
| Admin editing expert's message (or vice versa) | Edit/Delete buttons only rendered when `message.authorId === currentUser.id`; backend enforces same on PUT/DELETE |
| Sensitive legal content in communications | Not logged (per Principle IX); plain text content treated as PII |
| XSS via message content | Message content rendered as React text (`<Typography>`) — no innerHTML; if markdown needed in future, use react-markdown with allowedElements allowlist |
| IDOR — accessing thread from another expert | Backend validates `{expertId}/{threadId}` ownership before returning data |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `threads` list | `CommunicationsSection` / `AdminExpertCommunicationsPage` (local) | Page-scoped; not shared |
| `selectedThread` | `CommunicationsSection` (local) | Thread selection for detail view |
| `messages` list | `ThreadDetailView` (local) | Thread-scoped; fetched on selection |
| `editingMessageId` | `ThreadDetailView` (local) | Inline edit mode state |
| `newMessageModalOpen` | `ThreadList` (local) | Modal visibility |
| `loading`, `error` | Each component (local) | Async state |
| `currentUser.id` and role | Keycloak token / Redux auth slice | Authorship checks for edit/delete |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `ThreadList.test.tsx` | SystemAdmin role → "New Message" button visible | Button in DOM |
| `ThreadList.test.tsx` | Expert role → "New Message" button hidden | Button absent |
| `ThreadList.test.tsx` | Empty threads → EmptyState shown | Empty state text |
| `MessageItem.test.tsx` | `isOwn: true` → Edit + Delete buttons rendered | Both buttons present |
| `MessageItem.test.tsx` | `isOwn: false` → no Edit or Delete buttons | No buttons rendered |
| `MessageItem.test.tsx` | `isEdited: true` → "Edited" label shown | Edited text present |
| `MessageItem.test.tsx` | Click Edit → inline edit mode | Textarea pre-filled |
| `MessageItem.test.tsx` | Delete → ConfirmDialog shown | Dialog in DOM |

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| Admin creates new thread | SystemAdmin | Navigate to expert communications, New Message, submit | Thread appears in list |
| Admin replies to thread | SystemAdmin | Open thread, reply, submit | Reply in thread |
| Expert views communications | LegalIndividualExpert | Navigate to profile > Communications | Threads listed, no "New Message" button |
| Expert replies to thread | LegalIndividualExpert | Open thread, reply, submit | Reply appears |
| Edit own message | SystemAdmin | Click Edit on own message, update, save | Updated content + "Edited" label |
| Cannot edit other's message | LegalIndividualExpert | View admin message | No Edit button on admin message |
| Delete own message | SystemAdmin | Click Delete on own message, confirm | Message removed |
| Cannot delete other's message | LegalIndividualExpert | View admin message | No Delete button on admin message |

Test file: `e2e/029-legal-expert-communications.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-001: Thread list + detail within 2s | Paginated GET for threads (page 1, pageSize 20); messages paginated |
| SC-002: No cross-authorship edits | `isOwn` check from `message.authorId === currentUser.id` — computed before render |
| SC-003: Expert reaches Communications in ≤2 navigation levels | Expert dashboard → profile → Communications tab |
| No real-time updates needed | Polling not implemented per spec; user refreshes page or re-enters tab |
| `React.memo` on `MessageItem` | Large threads can have many messages |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| Thread created | INFO | `expertId`, `threadId`, `adminId` | Message content |
| Reply added | INFO | `threadId`, `messageId`, `authorId`, `authorRole` | Message content |
| Message edited | INFO | `messageId`, `authorId` | Old/new content |
| Message deleted | INFO | `messageId`, `authorId` | Content |
| Cross-authorship edit attempt blocked | WARN | `messageId`, `requesterId`, `actualAuthorId` | — |
| Thread creation by non-admin (403) | WARN | `requesterId`, `role`, `expertId` | — |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Communications API endpoints do not exist yet (entirely new feature) | High | High | Must be built in conjunction with backend; plan assumes new endpoints — confirm with backend team |
| `currentUser.id` type differs from `message.authorId` (number vs UUID) | Medium | Medium | Normalize both to `String()` before comparison; confirm type from API |
| Expert-side navigation to Communications not defined | Medium | Medium | Add Communications tab to expert profile nav; confirm location with UX |
| Thread list without subjects (only first message preview) | Low | Low | Use first 50 chars of first message as thread preview; confirm API response |
| Large thread message lists causing slow render | Low | Medium | Paginate messages within thread (load more button); `React.memo` on `MessageItem` |
| Inline edit state lost on accidental click-away | Low | Low | Confirm before discarding unsaved edit ("Discard changes?") |
