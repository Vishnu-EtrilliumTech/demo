# Tasks for restrict-comment-actions-to-authors

## Implementation Tasks

- [x] Task 1: Extract current user ID from JWT token
- [x] Task 2: Add authorship check utility function
- [x] Task 3: Conditionally render edit/delete menu items for parent comments
- [x] Task 4: Conditionally render edit/delete menu items for replies
- [x] Task 5: Hide three-dot menu icon when no actions available
- [x] Task 6: Add defensive checks for missing user IDs
- [x] Task 7: Manual testing across different user scenarios
- [x] Task 8: Update documentation

---

### 1. Extract current user ID from JWT token
**Description:** Enhance the existing `getCurrentUser()` function in both CommentsTab and TaskCommentsTab to extract and return the user ID in addition to the user name.

**Acceptance Criteria:**
- Modify `getCurrentUser()` to return an object with both `userId` and `userName`
- Extract user ID from JWT token's `sub` claim (standard JWT field for subject/user ID)
- Handle cases where `sub` is not available (fallback to undefined)
- Update component state to store both `currentUserId` and `currentUserName`

**Files to modify:**
- `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/CommentsTab/CommentsTab.tsx`
- `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/TaskCommentsTab/TaskCommentsTab.tsx`

**Validation:**
- Console log decoded token to verify `sub` field exists and contains numeric user ID
- Verify `currentUserId` state is correctly set on component mount
- Test with different user accounts to ensure correct ID extraction

---

### 2. Add authorship check utility function
**Description:** Create a reusable function to determine if the current user is the author of a comment.

**Acceptance Criteria:**
- Function signature: `isCommentAuthor(commentUserId: number, currentUserId: number | undefined): boolean`
- Returns `true` only if both IDs are defined and equal
- Returns `false` if either ID is undefined (fail secure)
- Add this function to both component files

**Files to modify:**
- `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/CommentsTab/CommentsTab.tsx`
- `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/TaskCommentsTab/TaskCommentsTab.tsx`

**Validation:**
- Unit test scenarios:
  - `isCommentAuthor(5, 5)` returns `true`
  - `isCommentAuthor(5, 6)` returns `false`
  - `isCommentAuthor(5, undefined)` returns `false`
  - `isCommentAuthor(undefined, 5)` returns `false`

---

### 3. Conditionally render edit/delete menu items for parent comments
**Description:** Update the Menu component for parent comments to only show edit and delete options when current user is the author.

**Acceptance Criteria:**
- Wrap edit MenuItem in conditional: `{isCommentAuthor(comment.userId, currentUserId) && <MenuItem>Edit</MenuItem>}`
- Wrap delete MenuItem in conditional: `{isCommentAuthor(comment.userId, currentUserId) && <MenuItem>Delete</MenuItem>}`
- Keep reply button visible to all users (no conditional)
- If no menu items are visible (non-author), hide the three-dot menu icon entirely
- Apply changes to both CommentsTab and TaskCommentsTab

**Files to modify:**
- `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/CommentsTab/CommentsTab.tsx` (lines 571-619)
- `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/TaskCommentsTab/TaskCommentsTab.tsx` (lines 537-585)

**Validation:**
- Log in as user who authored a comment → see edit/delete buttons
- Log in as different user → do not see edit/delete buttons
- Verify reply button is always visible
- Test with multiple comments from different authors

---

### 4. Conditionally render edit/delete menu items for replies
**Description:** Update the Menu component for replies to only show edit and delete options when current user is the reply author.

**Acceptance Criteria:**
- Wrap edit MenuItem in conditional: `{isCommentAuthor(reply.userId, currentUserId) && <MenuItem>Edit</MenuItem>}`
- Wrap delete MenuItem in conditional: `{isCommentAuthor(reply.userId, currentUserId) && <MenuItem>Delete</MenuItem>}`
- If no menu items are visible (non-author), hide the three-dot menu icon on the reply
- Apply changes to both CommentsTab and TaskCommentsTab

**Files to modify:**
- `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/CommentsTab/CommentsTab.tsx` (lines 356-404)
- `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/TaskCommentsTab/TaskCommentsTab.tsx` (lines 322-370)

**Validation:**
- Log in as user who authored a reply → see edit/delete buttons on that reply
- Log in as different user → do not see edit/delete buttons on that reply
- Verify icon is hidden when non-author views reply
- Test nested conversations with multiple participants

---

### 5. Hide three-dot menu icon when no actions available
**Description:** When a user is not the author of a comment/reply, the three-dot menu icon should not be displayed at all (rather than showing an empty menu).

**Acceptance Criteria:**
- Calculate `hasActions = isCommentAuthor(...)` before rendering IconButton
- Conditionally render IconButton: `{hasActions && <IconButton>...</IconButton>}`
- Apply to both parent comment header and reply header
- Ensures clean UI without non-functional buttons

**Files to modify:**
- `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/CommentsTab/CommentsTab.tsx`
- `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/TaskCommentsTab/TaskCommentsTab.tsx`

**Validation:**
- Non-author viewing comment → no three-dot icon visible
- Author viewing own comment → three-dot icon visible
- UI spacing looks correct in both scenarios

---

### 6. Add defensive checks for missing user IDs
**Description:** Ensure graceful handling when `userId` is missing from comment data or current user context.

**Acceptance Criteria:**
- If `comment.userId` is undefined or null, hide action buttons (fail secure)
- If `currentUserId` cannot be extracted from token, hide all action buttons
- No console errors or React warnings when IDs are missing
- Add type guards where necessary

**Files to modify:**
- Both CommentsTab and TaskCommentsTab components

**Validation:**
- Test with mock data where `userId` is null
- Test with invalid/expired token where user ID cannot be extracted
- Verify no errors in console
- Verify UI degrades gracefully

---

### 7. Manual testing across different user scenarios
**Description:** Comprehensive testing with different user accounts and comment scenarios.

**Test Scenarios:**
1. User A creates a comment → User A sees edit/delete → User B does not see edit/delete
2. User A creates a comment with reply → User A sees actions on both → User B sees actions on neither
3. User B replies to User A's comment → User B sees actions only on their reply
4. Multiple users in a conversation thread → each sees actions only on their own comments/replies
5. Edge case: Comment with missing userId → no one sees action buttons

**Validation:**
- Document test results for each scenario
- Screenshot comparisons showing different users' views
- Verify no UI glitches or layout issues

---

### 8. Update documentation (if applicable)
**Description:** Update relevant documentation to reflect the new authorization behavior.

**Acceptance Criteria:**
- Update `docs/Lawsome_PRD.md` with new comment authorization behavior
- Add note about authorship-based action visibility
- Document that this applies to both case comments and task comments

**Files to modify:**
- `docs/Lawsome_PRD.md` (if user-impacting documentation exists)

**Validation:**
- Documentation accurately describes new behavior
- Screenshots or diagrams included if helpful

---

## Task Dependencies

```
Task 1 (Extract user ID)
  ↓
Task 2 (Authorship check utility)
  ↓
Task 3 (Parent comment actions) ← Can parallelize with Task 4
Task 4 (Reply actions)           ←
  ↓
Task 5 (Hide menu icon)
  ↓
Task 6 (Defensive checks)
  ↓
Task 7 (Manual testing)
  ↓
Task 8 (Documentation)
```

## Work Breakdown

- **Tasks 1-2**: Foundation (1-2 hours)
- **Tasks 3-5**: Core implementation (2-3 hours)
- **Task 6**: Error handling (1 hour)
- **Task 7**: Testing (1-2 hours)
- **Task 8**: Documentation (30 minutes)

**Total Estimated Effort**: 5-8 hours of focused development work
