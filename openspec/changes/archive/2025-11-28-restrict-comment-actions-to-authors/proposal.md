# Restrict Comment Actions to Authors

## Change ID
`restrict-comment-actions-to-authors`

## Problem Statement

Currently, in both the case comments section and case task comments section, the edit and delete action buttons are visible to all users regardless of whether they authored the comment. This creates a security and data integrity issue where any user with access to the case can potentially modify or delete comments they did not create.

### Current Behavior
- All users viewing a case/task can see edit and delete buttons (three-dot menu) on all comments and replies
- No authorship check is performed before displaying these action buttons
- This violates the principle of least privilege and could lead to unauthorized comment modifications

### Expected Behavior
- Only the author of a comment should see the edit and delete action buttons for that specific comment
- Other users viewing the same comment should not see these action buttons
- Reply button can remain visible to all users (allowing conversation threads)
- This should apply to both:
  - Case-level comments ([CommentsTab.tsx](../../src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/CommentsTab/CommentsTab.tsx))
  - Task-level comments ([TaskCommentsTab.tsx](../../src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/TaskCommentsTab/TaskCommentsTab.tsx))

## Impact Analysis

### User-Facing Impact
- **High**: This is a significant UX and security improvement
- Users will only see actions they're authorized to perform
- Reduces confusion and prevents accidental or malicious comment modifications
- Aligns with standard commenting system behavior (e.g., social media platforms, collaboration tools)

### Technical Scope
- Frontend changes only (UI authorization layer)
- No backend API changes required (backend already tracks `userId` for each comment)
- Affects 2 main components: `CommentsTab` and `TaskCommentsTab`
- Both components follow identical patterns, making implementation straightforward

### Breaking Changes
None - this is purely an enhancement that restricts UI visibility, not functionality

## Related Specs

This change introduces a new capability that will be captured in:
- **comment-authorization** spec: Authorization rules for comment actions

This may also relate to existing specs:
- **ux-consistency**: Ensures consistent authorization patterns across comment interfaces
- **data-integrity**: Prevents unauthorized data modifications

## Questions and Ambiguities

### Resolved Questions
1. **Q: Should system admins or organization admins be able to edit/delete any comment?**
   - **A: TBD** - Needs clarification. For initial implementation, restrict to authors only. Future enhancement can add role-based overrides.

2. **Q: How do we identify the current user?**
   - **A: Resolved** - Both components already extract current user info from JWT token (see `getCurrentUser()` function in both files)

3. **Q: What about edge cases where `userId` or `userFullName` is missing?**
   - **A: Resolved** - If we cannot determine authorship, default to hiding action buttons (fail secure)

### Open Questions
1. **Q: Should there be an audit log when comments are edited/deleted?**
   - This is outside scope of current change but worth considering for future

## Implementation Approach

### High-Level Strategy
1. Extract current user identifier from JWT token (already implemented)
2. Compare current user ID with comment's `userId` field
3. Conditionally render edit/delete menu items based on authorship match
4. Apply same logic to both parent comments and replies

### Technical Details
- Both `CaseComment` and `CaseTaskComment` types include `userId: number` field
- Components already decode JWT to get current user name
- Need to also extract user ID from JWT token (available as `sub` or custom claim)
- Comparison logic: `isAuthor = currentUserId === comment.userId`

### Alternative Approaches Considered
1. **Backend enforcement only**: Decided against because UX is poor (user sees buttons but gets error when clicking)
2. **Role-based permissions**: Too complex for initial implementation; can be added later as enhancement

## Success Criteria

1. Edit and delete buttons only visible to comment authors
2. No errors when non-authors view comments
3. Functionality works identically for both case comments and task comments
4. Reply button remains visible to all users
5. No performance degradation (user ID check is lightweight)
6. Works correctly when user ID cannot be determined (fail secure)

## Dependencies

None - this is a self-contained frontend change using existing data structures.

## Timeline Considerations

This is a high-priority security and UX fix that should be implemented soon to prevent potential data integrity issues.
