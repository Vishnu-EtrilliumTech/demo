# comment-authorization Specification

## Purpose

Define authorization rules for comment and reply actions in the case management system, ensuring that destructive operations (edit, delete) are restricted to content authors while collaborative operations (reply) remain accessible to all participants.

## ADDED Requirements

### Requirement: Comment Edit and Delete Actions Must Be Restricted to Authors

**Description:** Edit and delete action buttons for comments and replies MUST only be visible and actionable by the user who created that specific comment or reply. Other users viewing the same comment SHALL NOT see these action buttons, preventing unauthorized modifications to conversation history.

**Rationale:** Comments and replies in legal case management often contain important case notes, decisions, and communications. Allowing any user to modify or delete another user's comments creates serious risks:
1. **Data integrity**: Comments could be altered to misrepresent what was originally said
2. **Accountability**: Legal professionals need confidence that documented communications are authentic
3. **Audit trail**: Modification by non-authors breaks the audit trail and attribution of case notes
4. **User trust**: Users must trust that their contributions won't be altered by others

This aligns with standard practices in collaboration tools (Slack, Teams, etc.) where users control their own messages but cannot edit others' messages.

**Acceptance Criteria:**
- Edit button is visible only when `currentUserId === comment.userId`
- Delete button is visible only when `currentUserId === comment.userId`
- Three-dot menu icon is hidden when no actions are available to the user
- Reply button remains visible to all users (non-destructive, collaborative action)
- Authorization check applies to both parent comments and nested replies
- Authorization check applies to both case-level comments and task-level comments
- When current user ID cannot be determined, action buttons are hidden (fail secure)

---

#### Scenario: Author views their own comment

**Given:**
- User Alice (userId: 42) is logged in and viewing case comments
- Alice previously authored a comment with id: 100, userId: 42, text: "Client meeting scheduled"
- Comment data includes: `{ id: 100, userId: 42, userFullName: "Alice Johnson", comments: "Client meeting scheduled" }`

**When:**
- CommentsTab component renders the comment list
- `getCurrentUser()` extracts userId: 42 from Alice's JWT token
- Component evaluates: `isCommentAuthor(100.userId=42, currentUserId=42)` → returns `true`
- Menu rendering logic includes edit/delete MenuItems

**Then:**
- Alice sees a three-dot menu icon next to her comment
- Clicking the icon displays a menu with three options:
  - "Edit" (with edit icon)
  - "Delete" (with delete icon, red text)
  - Reply button is also visible below the comment
- Alice can successfully click Edit to modify her comment
- Alice can successfully click Delete to remove her comment

**Validation:**
- Inspect DOM: verify IconButton with MoreVertIcon is rendered
- Inspect Menu: verify two MenuItem elements exist (Edit and Delete)
- Click Edit: edit form appears with comment text pre-filled
- Click Delete: confirmation modal appears

---

#### Scenario: Non-author views another user's comment

**Given:**
- User Bob (userId: 55) is logged in and viewing the same case comments
- Bob is viewing Alice's comment: `{ id: 100, userId: 42, userFullName: "Alice Johnson", comments: "Client meeting scheduled" }`
- Alice's userId is 42, Bob's userId is 55

**When:**
- CommentsTab component renders Alice's comment
- `getCurrentUser()` extracts userId: 55 from Bob's JWT token
- Component evaluates: `isCommentAuthor(100.userId=42, currentUserId=55)` → returns `false`
- Menu rendering logic excludes edit/delete MenuItems
- IconButton is not rendered because no actions are available

**Then:**
- Bob does NOT see a three-dot menu icon next to Alice's comment
- Bob can read Alice's comment text
- Bob CAN see and click the Reply button below Alice's comment (non-destructive action)
- Bob cannot edit or delete Alice's comment
- UI is clean without non-functional buttons

**Validation:**
- Inspect DOM: verify no IconButton with MoreVertIcon is rendered
- Inspect Menu: verify Menu component is not instantiated for this comment
- Verify Reply button is still visible and functional
- Bob can create a reply but cannot modify Alice's original comment

---

#### Scenario: Author views their own reply in a conversation thread

**Given:**
- User Bob (userId: 55) is viewing a case comment thread
- Alice's parent comment (id: 100, userId: 42)
- Bob's reply to Alice's comment: `{ id: 101, userId: 55, userFullName: "Bob Smith", comments: "Confirmed for 2pm", parentCommentId: 100 }`

**When:**
- TaskCommentsTab component renders the reply list under Alice's comment
- `getCurrentUser()` extracts userId: 55 from Bob's JWT token
- Component evaluates: `isCommentAuthor(101.userId=55, currentUserId=55)` → returns `true`
- Reply menu rendering logic includes edit/delete MenuItems

**Then:**
- Bob sees a three-dot menu icon next to his reply
- Clicking the icon displays a menu with:
  - "Edit" (smaller icon, 0.8rem font)
  - "Delete" (smaller icon, red text)
- Bob can edit or delete his own reply
- Bob does NOT see edit/delete options on Alice's parent comment (different userId)

**Validation:**
- Verify Bob can edit his reply: edit form appears
- Verify Bob can delete his reply: confirmation modal appears
- Verify Bob cannot edit Alice's parent comment
- Verify Alice can edit her parent comment but not Bob's reply

---

#### Scenario: Multiple users in a conversation thread

**Given:**
- Case comment thread with multiple participants:
  - Alice (userId: 42) created parent comment (id: 200)
  - Bob (userId: 55) added reply (id: 201)
  - Carol (userId: 67) added reply (id: 202)
- Carol (userId: 67) is currently logged in and viewing the thread

**When:**
- Component renders all three comments/replies
- Carol's userId (67) is compared against each comment's userId

**Then:**
- Carol sees her own reply (id: 202) with edit/delete menu icon
- Carol does NOT see edit/delete icon on Alice's comment (userId: 42 ≠ 67)
- Carol does NOT see edit/delete icon on Bob's reply (userId: 55 ≠ 67)
- Carol can reply to any comment in the thread (Reply button visible on all)
- Each participant has full control over their own contributions only

**Validation:**
- Log in as each user (Alice, Bob, Carol) and verify each sees actions only on their own content
- Verify conversation functionality is not impaired (everyone can reply)
- Verify no user can modify another user's content

---

#### Scenario: Current user ID cannot be determined (fail secure)

**Given:**
- User's JWT token is malformed, expired, or missing `sub` claim
- Component calls `getCurrentUser()` which returns `undefined` for userId
- Case comment exists: `{ id: 300, userId: 42, userFullName: "Alice Johnson", comments: "Important note" }`

**When:**
- Component evaluates: `isCommentAuthor(300.userId=42, currentUserId=undefined)` → returns `false`
- Authorization check fails due to undefined current user

**Then:**
- No edit/delete action buttons are displayed
- Three-dot menu icon is hidden
- User can still read comments and view the case
- Reply functionality may also be disabled (depends on implementation)
- No errors or exceptions are thrown

**Validation:**
- Simulate expired token scenario
- Verify no console errors
- Verify UI degrades gracefully
- Verify no action buttons are visible
- Security principle: when in doubt, deny access

---

#### Scenario: Comment data is missing userId field (defensive programming)

**Given:**
- Backend API returns a comment with missing or null userId (data integrity issue):
  `{ id: 400, userId: null, userFullName: "Unknown", comments: "Test comment" }`
- Current user is logged in with userId: 42

**When:**
- Component evaluates: `isCommentAuthor(comment.userId=null, currentUserId=42)` → returns `false`
- Authorization check fails due to missing author information

**Then:**
- No edit/delete action buttons are displayed for this comment
- Three-dot menu icon is hidden
- Comment text is still displayed normally
- No errors or UI crashes occur
- Comment appears read-only to all users

**Validation:**
- Create test case with null userId in mock data
- Verify component handles gracefully without errors
- Verify no action buttons are rendered
- Verify comment is still readable

---

### Requirement: Reply Actions Remain Accessible to All Users

**Description:** The Reply button SHALL remain visible and functional for all users viewing a comment or reply, regardless of authorship. Replying is a collaborative, non-destructive action that supports conversation flow and should not be restricted.

**Rationale:**
- Replying to comments creates new content rather than modifying existing content
- Legal case discussions benefit from multi-participant conversations
- Reply authorship is tracked separately (new reply has its own userId)
- Restricting replies would severely limit collaboration on cases

**Acceptance Criteria:**
- Reply button is always visible on parent comments (no conditional rendering)
- Reply button functionality is not affected by authorship checks
- Users can reply to any comment in a case they have access to
- Each reply is attributed to its author with a distinct userId

---

#### Scenario: Non-author can reply to another user's comment

**Given:**
- Alice's comment (userId: 42) is displayed
- Bob (userId: 55) is viewing the comment
- Bob does not see edit/delete buttons on Alice's comment

**When:**
- Bob sees the Reply button below Alice's comment
- Bob clicks the Reply button
- Reply input area appears below the comment

**Then:**
- Bob can type his reply text
- Bob clicks Send to submit the reply
- API request includes Bob's userId (55) as the author of the new reply
- Reply appears in the thread attributed to Bob
- Reply has its own edit/delete buttons visible only to Bob

**Validation:**
- Verify Reply button is visible to Bob
- Verify Bob can successfully create a reply
- Verify new reply has `userId: 55` (Bob's ID)
- Verify Bob can later edit/delete his own reply

---

### Requirement: Authorization Consistency Across Comment Types

**Description:** Authorization logic for edit/delete actions MUST be implemented identically in both case-level comments (CommentsTab) and task-level comments (TaskCommentsTab). Users MUST experience consistent behavior regardless of where they interact with comments.

**Rationale:**
- Both comment types serve similar purposes (case discussions vs task discussions)
- Both use identical data structures (`CaseComment` and `CaseTaskComment` have same userId/userFullName fields)
- Inconsistent authorization would confuse users and create security gaps
- Shared implementation patterns reduce maintenance burden

**Acceptance Criteria:**
- Same authorship check logic in both components: `isCommentAuthor(comment.userId, currentUserId)`
- Same conditional rendering patterns for menu items
- Same fail-secure behavior when user ID is unavailable
- Same user experience when viewing own vs others' comments

---

#### Scenario: Authorization behavior is identical in case comments and task comments

**Given:**
- Alice (userId: 42) is viewing a case with both case-level comments and task-level comments
- Alice authored one case comment and one task comment

**When:**
- Alice views the case Comments tab
- Alice views a task and opens its Comments tab

**Then:**
- In both tabs, Alice sees edit/delete actions on her own comments
- In both tabs, Alice does not see edit/delete actions on other users' comments
- In both tabs, Reply button is always visible
- In both tabs, three-dot menu behaves identically

**Validation:**
- Create test data with case comments and task comments from same user
- Verify authorization logic produces identical results in both tabs
- Verify UI rendering is consistent
- Code review: verify both components use same authorship function

---

## Related Specs

- **ux-consistency**: This spec implements consistent authorization patterns across the comment system
- **data-integrity**: Restricting edit/delete to authors prevents unauthorized data modifications
