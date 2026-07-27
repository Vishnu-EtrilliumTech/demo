# Tasks: Legal Expert Communications

**Feature Branch**: `029-legal-expert-communications`
**Input**: `specs/029-legal-expert-communications/plan.md`, `specs/029-legal-expert-communications/spec.md`

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = Admin Sends Message to Expert, US2 = Expert Views & Replies, US3 = Edit & Delete Own Messages

---

## Phase 1: Setup

**Purpose**: Create file structure and API service modules.

- [ ] T001 Create directory `src/app/admin-dashboard/legal-experts/[expertId]/communications/` per plan.md §3
- [ ] T002 [P] Create directory `src/app/profile/components/CommunicationsSection/` per plan.md §3
- [ ] T003 [P] Create directory `src/app/communications/services/` and `src/app/communications/types/` per plan.md §3
- [ ] T004 Confirm communications API endpoints will be NEW — coordinate with backend team before implementation (risk: HIGH per plan.md §11)
- [ ] T005 [P] Confirm `currentUser.id` type from Keycloak token — UUID or integer; confirm it matches `message.authorId` type (risk per plan.md §11)

---

## Phase 2: UI

**Purpose**: Build all communications components.

- [ ] T006 [US1] [US2] Create `src/app/profile/components/CommunicationsSection/ThreadList.tsx` — list of `Thread` items ordered by most recent activity; "New Message" button rendered only when `currentUserRole === 'SystemAdmin'`; `<EmptyState message="No communications yet." />` when empty; props `{ threads: Thread[], currentUserRole: string, onSelectThread, onNewMessage? }`
- [ ] T007 [US3] Create `src/app/profile/components/CommunicationsSection/MessageItem.tsx` — displays single message; sender badge ("Admin" / "Me"); timestamp; "Edited" label when `message.isEdited === true`; Edit + Delete `<IconButton>` rendered only when `isOwn === true`; props `{ message: Message, isOwn: boolean, onEdit, onDelete }`; `React.memo`
- [ ] T008 [US1] [US2] Create `src/app/profile/components/CommunicationsSection/ThreadDetailView.tsx` — full conversation with `MessageItem` list (chronological); reply `<TextField multiline>` + send button at bottom; inline edit mode when edit selected
- [ ] T009 [US1] Create `src/app/profile/components/CommunicationsSection/NewMessageModal.tsx` — plain text `<TextField multiline>`; content must not be empty validation; rendered only for SystemAdmin; submit calls `createThread(expertId, { content })`
- [ ] T010 [US1] [US2] Create `src/app/profile/components/CommunicationsSection/CommunicationsSection.tsx` — wraps `ThreadList` and `ThreadDetailView`; manages `selectedThread` state; renders expert-facing inbox tab
- [ ] T011 [US1] Create `src/app/admin-dashboard/legal-experts/[expertId]/communications/page.tsx` — `"use client"` page; SystemAdmin role check; renders `ThreadList` + `ThreadDetailView`; "New Message" button visible

---

## Phase 3: Logic

**Purpose**: Implement authorship-based controls and thread/reply flows.

- [ ] T012 [US3] Implement authorship check in `MessageItem.tsx`:
  ```
  const isOwn = String(message.authorId) === String(currentUser.id)
  {isOwn && <EditButton />}
  {isOwn && <DeleteButton />}
  ```
  Use `String()` normalization to prevent type mismatch (risk per plan.md §11)
- [ ] T013 [US3] Implement inline edit mode in `ThreadDetailView.tsx` — clicking Edit sets `editingMessageId`; replaces message text with pre-filled `<TextField multiline>` + Save/Cancel; Save calls `updateMessage(expertId, threadId, messageId, { content })`; on 200 update message content and set `isEdited: true`
- [ ] T014 [US3] Implement delete flow in `ThreadDetailView.tsx` — clicking Delete opens `ConfirmDialog` "Delete this message? This cannot be undone."; confirm calls `deleteMessage(expertId, threadId, messageId)`; on 204 remove from message list
- [ ] T015 [US2] Implement reply flow in `ThreadDetailView.tsx` — submit reply text → `createReply(expertId, threadId, { content })` → 201 → append new message to list → `showSuccess` toast
- [ ] T016 [US1] Implement new thread creation in `NewMessageModal.tsx` — submit → `createThread(expertId, { content })` → 201 → modal closes → thread list refreshes with new thread at top

---

## Phase 4: API

**Purpose**: Implement all communications API service functions.

- [ ] T017 Create `src/app/communications/types/index.ts` — `Thread { id, expertId, subject?, lastMessageAt, messageCount }` and `Message { id, threadId, authorId, authorRole, content, createdAt, isEdited }` interfaces
- [ ] T018 Implement `fetchCommunicationThreads(expertId)` in `src/app/communications/services/api.ts` → `GET /api/v1/legal-experts/{expertId}/communications` — Bearer (SystemAdmin or own expert)
- [ ] T019 [P] Implement `createThread(expertId, { content })` in `src/app/communications/services/api.ts` → `POST /api/v1/legal-experts/{expertId}/communications` — Bearer (SystemAdmin only)
- [ ] T020 [P] Implement `fetchThreadMessages(expertId, threadId)` → `GET /api/v1/legal-experts/{expertId}/communications/{threadId}/messages`
- [ ] T021 [P] Implement `createReply(expertId, threadId, { content })` → `POST /api/v1/legal-experts/{expertId}/communications/{threadId}/messages`
- [ ] T022 [P] Implement `updateMessage(expertId, threadId, messageId, { content })` → `PUT /api/v1/legal-experts/{expertId}/communications/{threadId}/messages/{msgId}` — Bearer (own author only)
- [ ] T023 [P] Implement `deleteMessage(expertId, threadId, messageId)` → `DELETE /api/v1/legal-experts/{expertId}/communications/{threadId}/messages/{msgId}` — Bearer (own author only)

---

## Phase 5: Backend

**Purpose**: Validate new backend endpoint requirements.

- [ ] T024 Confirm all 6 communications endpoints will be implemented by backend team before frontend build begins (risk: HIGH — entirely new feature per plan.md §11)
- [ ] T025 [P] Confirm `POST /api/v1/legal-experts/{expertId}/communications` returns 403 for non-SystemAdmin callers — expert cannot create threads
- [ ] T026 [P] Confirm `PUT` and `DELETE` message endpoints enforce own-authorship on backend — backend returns 403 if `requesterId !== message.authorId`
- [ ] T027 [P] Confirm `GET /api/v1/legal-experts/{expertId}/communications/{threadId}/messages` validates `{expertId}/{threadId}` ownership before returning data (IDOR prevention)

---

## Phase 6: Security

**Purpose**: Enforce authorship controls and prevent cross-expert data access.

- [ ] T028 Verify `ThreadList.tsx` "New Message" button is rendered ONLY when `currentUserRole === 'SystemAdmin'` — experts never see this button
- [ ] T029 [P] Verify `MessageItem.tsx` Edit/Delete buttons use `isOwn` prop exclusively — derived from `String(message.authorId) === String(currentUser.id)` before render
- [ ] T030 [P] Verify message content in `ThreadDetailView.tsx` is rendered as `<Typography>` text nodes — no `dangerouslySetInnerHTML`
- [ ] T031 [P] Verify `fetchCommunicationThreads` URL uses `expertId` from route/context — expert cannot override expertId to access another expert's threads

---

## Phase 7: Testing

**Purpose**: Unit and E2E test coverage.

- [ ] T032 Create `src/app/profile/components/CommunicationsSection/__tests__/ThreadList.test.tsx` — tests: SystemAdmin sees "New Message" button; expert role hides button; empty threads shows EmptyState
- [ ] T033 Create `src/app/profile/components/CommunicationsSection/__tests__/MessageItem.test.tsx` — tests: `isOwn: true` shows Edit+Delete; `isOwn: false` shows no buttons; `isEdited: true` shows Edited label; click Edit enters inline edit mode; click Delete opens ConfirmDialog
- [ ] T034 Create `e2e/029-legal-expert-communications.spec.ts` — E2E: admin creates new thread; admin replies; expert views communications (no New Message button); expert replies; edit own message shows Edited label; cannot edit other's message (no button); delete own message removes it; cannot delete other's message (no button)

---

## Phase 8: Logging

**Purpose**: Instrument observability events per plan.md §10.

- [ ] T035 Add INFO log on thread created: `expertId`, `threadId`, `adminId` — not message content
- [ ] T036 [P] Add INFO log on reply added: `threadId`, `messageId`, `authorId`, `authorRole` — not content
- [ ] T037 [P] Add INFO log on message edited: `messageId`, `authorId` — not old/new content
- [ ] T038 [P] Add INFO log on message deleted: `messageId`, `authorId` — not content
- [ ] T039 [P] Add WARN log on cross-authorship edit attempt (frontend blocked): `messageId`, `requesterId`
- [ ] T040 [P] Add WARN log on thread creation attempt by non-admin (403): `requesterId`, `role`, `expertId`

---

## Phase 9: Quality Gates

**Purpose**: Ensure all pre-commit checks pass.

- [ ] T041 Run `npm run type-check` — zero TypeScript errors in all new files in `src/app/profile/components/CommunicationsSection/`, `src/app/communications/`, `src/app/admin-dashboard/legal-experts/[expertId]/communications/`
- [ ] T042 [P] Run `npm run lint` — zero ESLint errors; no `any` types
- [ ] T043 [P] Run `npm run build` — production build succeeds

---

## Phase 10: Finalization

**Purpose**: Polish and branch readiness.

- [ ] T044 Apply `React.memo` to `MessageItem` to prevent re-renders in large thread lists (plan.md §9)
- [ ] T045 [P] Confirm expert-side Communications section is accessible from profile nav within 2 navigation levels (plan.md §SC-003)
- [ ] T046 [P] Confirm `editingMessageId` state is cleared on cancel — no stale edit state persists after cancel

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: Start immediately; confirm backend availability first
- **UI (Phase 2)**: Requires Phase 1 directory creation
- **Logic (Phase 3)**: Requires Phase 2 components
- **API (Phase 4)**: Can run in parallel with Phase 2 (types first, then functions)
- **Backend (Phase 5)**: Must be confirmed before Phase 4 is implemented
- **Security (Phase 6)**: Requires Phase 3 complete
- **Testing (Phase 7)**: Requires Phase 2, 3, 4 complete
- **Logging (Phase 8)**: Requires Phase 3 complete
- **Quality Gates (Phase 9)**: Requires all prior phases
- **Finalization (Phase 10)**: Requires Phase 9 passing

## Total Task Count: 46
- US1 tasks: 11 | US2 tasks: 7 | US3 tasks: 9 | Cross-cutting: 19
