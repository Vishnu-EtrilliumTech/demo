# Implementation Tasks

## 1. PRD Documentation Updates
- [x] 1.1 Update Section 6.3.1 "View Case Clients" to remove aspirational features (invitation status, dates, invite button)
- [x] 1.2 Add "Current Implementation Notes" to Section 6.3.1 explaining clients are informational records only
- [x] 1.3 Update Section 6.3.2 "Business Rules" to clarify no client portal access currently exists
- [x] 1.4 Update Section 6.3.2 "Add Flow" to remove references to invitation system
- [x] 1.5 Document planned future enhancements in Section 6.3.2

## 2. GitHub Issue Update
- [ ] 2.1 Add comment to GitHub Issue #64 explaining the situation:
  - PRD contained aspirational documentation for features not yet implemented
  - Entire client invitation system (email invitations, portal access, authentication) is [Planned for Future Implementation]
  - Current implementation: clients are informational records only with basic CRUD operations
- [ ] 2.2 Reference this OpenSpec change in the issue comment
- [ ] 2.3 Suggest labeling the issue as "enhancement" or "feature request" for future implementation

## 3. Validation
- [x] 3.1 Run `npx openspec validate mark-case-client-invitation-future --strict` to verify change format
- [x] 3.2 Review PRD changes to ensure accuracy and alignment with actual implementation
- [x] 3.3 Confirm no code changes are required (documentation correction only)
