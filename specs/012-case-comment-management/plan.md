# Implementation Plan: Case Comment Management

**Branch**: `012-case-comment-management` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)

---

## 1. Overview

### What Exists
- `CommentsTab/CommentsTab.tsx` — full WhatsApp-style comment thread UI: add, edit, delete, reply, category/priority detection.
- `useCaseComments.ts` — complete hook: fetch, add, update, delete comments and replies; modal state management.
- `TaskCommentsTab/TaskCommentsTab.tsx` + `useTaskComments.ts` — identical pattern scoped to task-level comments.
- API functions in `src/app/organization/services/caseapi.ts`: `fetchCaseComments`, `addCaseComment`, `addCaseCommentReply`, `updateCaseComment`, `deleteCaseComment`, `fetchCaseComment`, plus five task-comment variants.
- Types: `CaseComment`, `AddCaseCommentRequest`, `AddCaseCommentReplyRequest`, `UpdateCaseCommentRequest`, `CaseTaskComment` in `src/app/organization/types/caseindex.ts`.

### Gaps to Close
1. Verify `OrganizationClerk` RBAC guard — the `CommentsTab` must be hidden entirely (not just its action buttons) for this role.
2. Verify `TaskCommentsTab` is hidden for `OrganizationClerk` within task detail view.
3. Verify empty-comment guard (`newCommentText.trim() === ''`) blocks submit in both `CommentsTab` and `TaskCommentsTab`.
4. Verify parent-comment delete confirmation dialog warns that replies will also be deleted.
5. No unit tests for `CommentsTab`, `useCaseComments`, `TaskCommentsTab`, or `useTaskComments`.
6. No E2E tests for the comments golden path.

### What Is New
- Unit tests: `CommentsTab.test.tsx`, `useCaseComments.test.ts`, `TaskCommentsTab.test.tsx`
- E2E test: `e2e/012-case-comment-management.spec.ts`

---

## 2. Architecture Flow

### 2.1 View Case Comments

```
Case detail page mounts Comments tab
  → CommentsTabContainer renders
  → useCaseComments(orgId, siteId, caseId)
  → useEffect: fetchCaseComments() → GET /comments
  → setComments(data)
  → if OrganizationClerk → tab not rendered (RBAC gate at parent)
  → if comments.length === 0 → empty state message
  → else → <CommentsThread> with top-level comments + nested replies
```

### 2.2 Add Comment

```
Authorized user types in comment input
  → onSetNewCommentText(text)
  → newCommentText.trim() === '' → submit button disabled
  → User submits (Enter or button click)
  → addCaseComment(orgId, siteId, caseId, { text })
      → POST /comments
  → 201 → showSuccess → prepend to comments list
  → error → showError
```

### 2.3 Reply to Comment

```
User clicks "Reply" on a comment
  → onToggleReply(commentId) → inline reply input shown
  → User types reply text
  → onAddReply(commentId)
  → addCaseCommentReply(orgId, siteId, caseId, commentId, { text })
      → POST /comments/{commentId}/replies
  → 201 → showSuccess → append reply under parent comment
  → error → showError
```

### 2.4 Edit Comment / Reply

```
Author clicks "Edit" on their own comment
  → onStartEditComment(commentId, currentText)
  → inline edit input replaces display text
  → User modifies and saves
  → updateCaseComment(orgId, siteId, caseId, commentId, { text })
      → PUT /comments/{commentId}
  → 200 → showSuccess → update comment in state with "(edited)" marker
  → error → showError
```

### 2.5 Delete Comment (with cascade warning)

```
Author clicks "Delete" on their own comment
  → setCommentToDelete({ id, parentId? }) → setDeleteCommentModalOpen(true)
  → DeleteConfirmationModal: "This will also delete all replies."
  → User confirms → deleteCaseComment(orgId, siteId, caseId, commentId)
      → DELETE /comments/{commentId}
  → 204 → showSuccess → remove comment + replies from state
  → error → showError → modal stays open
```

### 2.6 RBAC Gate

```
Case detail page renders tabs
  → useUserRole(orgId) → isOrganizationClerk
  → {!isOrganizationClerk && <CommentsTab .../>}
  → All other authorized roles see the full comment UI
```

---

## 3. File Structure

### Documentation
```
specs/012-case-comment-management/
  spec.md                          NO CHANGE
  plan.md                          NEW (this file)
  research.md                      NEW
  data-model.md                    NEW
  contracts/
    api-contracts.md               NEW
```

### Source Tree
```
src/app/organization/[id]/sites/[siteId]/cases/[caseId]/
  components/
    CommentsTab/
      CommentsTab.tsx              VERIFY — OrganizationClerk RBAC at parent; delete cascade warning
      CommentsTab.module.css       NO CHANGE
      index.ts                     NO CHANGE
    TaskCommentsTab/
      TaskCommentsTab.tsx          VERIFY — OrganizationClerk hidden; empty-comment guard
  hooks/
    useCaseComments.ts             VERIFY — empty-comment guard; delete cascade confirmation text
    useTaskComments.ts             VERIFY — same guards as useCaseComments

src/app/organization/
  types/
    caseindex.ts                   NO CHANGE (all comment types already defined)
  services/
    caseapi.ts                     NO CHANGE (all comment + reply API functions exist)

e2e/
  012-case-comment-management.spec.ts   NEW
```

---

## 4. Component Design

### 4.1 `CommentsTabContainer` (entry point in `CommentsTab.tsx`)
- **Purpose**: Instantiates `useCaseComments` and passes state/handlers to presentational `CommentsTab`.
- **Props**: `{ caseId, siteId, organizationId }`
- **Role check**: `useUserRole(organizationId)` → `isOrganizationClerk`; if true, render nothing (parent tab list should also omit the tab entry).

### 4.2 `CommentsTab` (presentational layer)
- **Thread layout**: Chronological top-level comments, newest first. Replies indented under parent.
- **Author detection**: Compare `comment.authorId` to current user ID from Keycloak token.
- **Author-only controls**: `{isAuthor && <IconButton>Edit</IconButton>}`, `{isAuthor && <IconButton>Delete</IconButton>}`
- **Reply control**: Available on all top-level comments for all authorized users.
- **"(edited)" marker**: Shown on `comment.isEdited === true`.
- **Empty guard**: Submit button `disabled={newCommentText.trim() === ''}`.

### 4.3 `DeleteConfirmationModal` (for parent comments)
- **Message**: "Deleting this comment will also permanently remove all replies. This cannot be undone."
- Reuses the existing shared `DeleteConfirmationModal` from `src/components/modals/`.

### 4.4 `TaskCommentsTab`
- Identical UI pattern to `CommentsTab` using `useTaskComments` hook.
- Accessible from within the task detail expansion in `TasksTab`.
- `OrganizationClerk` gate applies identically.

---

## 5. API Plan

| Method | URL (relative to case base) | Auth | Request | Success | Error Codes | Status |
|--------|-----------------------------|------|---------|---------|-------------|--------|
| `GET` | `/comments` | Bearer | — | `{ data: CaseComment[] }` | 401, 403 | Existing |
| `POST` | `/comments` | Bearer | `AddCaseCommentRequest` | `{ data: CaseComment }` 201 | 400, 401, 403 | Existing |
| `GET` | `/comments/{commentId}` | Bearer | — | `{ data: CaseComment }` | 401, 403, 404 | Existing |
| `PUT` | `/comments/{commentId}` | Bearer | `UpdateCaseCommentRequest` | `{ data: CaseComment }` 200 | 400, 401, 403, 404 | Existing |
| `DELETE` | `/comments/{commentId}` | Bearer | — | 204 | 401, 403, 404 | Existing |
| `POST` | `/comments/{commentId}/replies` | Bearer | `AddCaseCommentReplyRequest` | `{ data: CaseComment }` 201 | 400, 401, 403, 404 | Existing |
| `GET` | `/tasks/{taskId}/comments` | Bearer | — | `{ data: CaseTaskComment[] }` | 401, 403, 404 | Existing |
| `POST` | `/tasks/{taskId}/comments` | Bearer | `AddCaseCommentRequest` | `{ data: CaseTaskComment }` 201 | 400, 401, 403 | Existing |
| `PUT` | `/tasks/{taskId}/comments/{commentId}` | Bearer | `UpdateCaseCommentRequest` | `{ data: CaseTaskComment }` 200 | 400, 401, 403, 404 | Existing |
| `DELETE` | `/tasks/{taskId}/comments/{commentId}` | Bearer | — | 204 | 401, 403, 404 | Existing |

All URLs prefixed: `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}`

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| OrganizationClerk seeing Comments tab | `{!isOrganizationClerk && <CommentsTab />}` at case detail tab level; backend enforces `[Authorize]` as security gate |
| OrganizationClerk calling comment API directly | Backend role enforcement; frontend omission is defense-in-depth only |
| Non-author seeing Edit/Delete controls | `{isAuthor && ...}` per-comment render guard; backend validates authorship on PUT/DELETE |
| XSS via comment text | Controlled MUI `TextField` input; values never injected via `dangerouslySetInnerHTML` |
| Empty comment submission | `disabled={newCommentText.trim() === ''}` on submit button; backend rejects blank text with 400 |
| Delete cascade without user awareness | `DeleteConfirmationModal` explicitly warns replies will be removed |
| Unauthorized edit/delete of another user's comment | Backend validates author ownership; returns 403 if mismatch |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `comments`, `loadingComments` | `useCaseComments` (local) | Case-scoped; not shared across routes |
| `newCommentText` | `useCaseComments` (local) | Input state; ephemeral |
| `replyTexts` (`Record<number, string>`) | `useCaseComments` (local) | Per-comment reply inputs; ephemeral |
| `editCommentText`, `editReplyText` | `useCaseComments` (local) | Inline edit state; ephemeral |
| `editingCommentId`, `editingReplyId` | `useCaseComments` (local) | Tracks which item is in edit mode |
| `deleteCommentModalOpen`, `commentToDelete` | `useCaseComments` (local) | Dialog visibility; ephemeral |
| `addingComment`, `updatingComment`, `deletingCommentId` | `useCaseComments` (local) | Loading indicators per operation |
| Role flags (`isOrganizationClerk`) | `useUserRole` (local, derived from Redux profile) | Per-session; no persist needed |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `CommentsTab.test.tsx` | OrganizationClerk role → CommentsTab not rendered | Zero comment UI in DOM |
| `CommentsTab.test.tsx` | Authorized role → comment thread renders | Comment list visible |
| `CommentsTab.test.tsx` | Empty input → submit button disabled | Button has `disabled` attribute |
| `CommentsTab.test.tsx` | Author views own comment → Edit and Delete visible | Both icons in DOM |
| `CommentsTab.test.tsx` | Non-author views comment → no Edit or Delete | Zero action icons for that comment |
| `CommentsTab.test.tsx` | Delete parent comment → modal with cascade warning | Warning text in modal |
| `useCaseComments.test.ts` | fetchCaseComments success → comments populated | State contains returned comments |
| `useCaseComments.test.ts` | addCaseComment success → prepended to list | List length increases |
| `useCaseComments.test.ts` | addCaseComment with blank text → API not called | Mock not invoked |
| `useCaseComments.test.ts` | deleteCaseComment success → comment removed from state | List shrinks |

Test file location: `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/CommentsTab/__tests__/`

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| Add comment — golden path | SiteClerk | Nav to case > Comments, type comment, submit | Comment appears with author name + timestamp |
| OrganizationClerk access denied | OrganizationClerk | Nav to case | Comments tab not visible |
| Reply to a comment | SiteAdmin | Click Reply on existing comment, type, submit | Reply appears nested under parent |
| Edit own comment | SiteClerk | Click Edit on own comment, change text, save | Updated text shown with "(edited)" marker |
| Delete own comment with cascade warning | SiteClerk | Click Delete on own comment | Confirmation mentions replies being removed |
| Empty comment blocked | SiteAdmin | Type nothing, attempt submit | Submit button disabled |
| Non-author sees no controls | SiteCaseClient | View another user's comment | No Edit or Delete buttons |

Test file: `e2e/012-case-comment-management.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-001: Comment appears within 1s of submit | Optimistic prepend to local state on 201; no re-fetch of full list |
| All comments loaded at once (no pagination per spec) | Full list fetched on tab mount; `LoadingState` shown during fetch |
| Reply toggle rendering | Inline expand/collapse; replies already in `comment.replies[]` — no extra API call |
| Large comment threads | `React.memo` on individual `CommentItem` component; virtualize if thread > 200 items |
| Avatar images | Use `next/image` `<Image />` for user avatars; raw `<img>` tags prohibited |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| Comments list fetched | INFO | `caseId`, count returned | Comment text content |
| Comment created | INFO | `caseId`, `commentId`, `authorId` | Comment text, author name |
| Comment updated | INFO | `commentId`, `authorId` | New comment text |
| Comment deleted | INFO | `commentId`, reply count deleted | Comment text |
| Reply created | INFO | `parentCommentId`, `replyId`, `authorId` | Reply text |
| OrganizationClerk write attempt blocked | WARN | `userId`, `caseId` | — |
| API error (any comment operation) | ERROR | HTTP status, `commentId` | Token value, comment text |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OrganizationClerk RBAC guard missing at tab level | Medium | High | Verify tab list rendering in case detail page; add `{!isOrganizationClerk && ...}` guard |
| Non-author seeing Edit/Delete on others' comments | Medium | High | Audit `isAuthor` check in `CommentsTab`; ensure comparison uses consistent user ID source |
| Delete cascade confirmation missing reply count warning | Medium | Medium | Verify `DeleteConfirmationModal` message explicitly mentions replies |
| Empty comment submittable via keyboard shortcut bypass | Low | Low | Validate `newCommentText.trim() === ''` in both button `disabled` and `onAddComment` handler |
| Task-level comments missing OrganizationClerk guard | Medium | High | Apply identical RBAC gate to `TaskCommentsTab` |
| Comment timestamps timezone mismatch | Low | Medium | Use `formatDisplayDate` utility consistently; never format raw ISO strings inline |
