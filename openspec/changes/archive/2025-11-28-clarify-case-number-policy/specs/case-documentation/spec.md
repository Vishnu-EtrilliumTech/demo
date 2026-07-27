# Case Documentation Specification

## MODIFIED Requirements

### Requirement: PRD SHALL Accurately Document Manual Case Number Entry

The PRD SHALL accurately document that case numbers are manually entered by users. The PRD SHALL explicitly state that duplicate case numbers are allowed across different cases. The PRD SHALL NOT contain any references to auto-generation of case numbers.

**Rationale:**
The current PRD incorrectly states that case numbers are auto-generated and must be unique, leading to confusion and incorrect bug reports. This requirement ensures the documentation aligns with the actual implemented behavior and business needs.

#### Scenario: Case List View Documentation

**Given:** A reader is viewing the Case List View section (6.2.1) of the PRD
**When:** They read the table describing case fields
**Then:** The Case Number field should NOT be described as "Auto-generated"
**And:** The description should indicate that it is a manually entered identifier

**Acceptance Criteria:**
- Case Number column in the table (around line 1266) does not mention auto-generation
- Description accurately reflects manual user entry
- No implications that the system generates case numbers automatically

#### Scenario: Create Case Form Fields Documentation

**Given:** A developer is implementing or reviewing the Create Case form (section 6.2.2)
**When:** They read the Form Fields table (around line 1307)
**Then:** The Case Number field should show:
- Type: Text
- Required: No
- Validation: Should NOT mention "Auto-generated if empty"
- Validation: Should indicate optional manual entry with reasonable length limits
- Example: Should show a user-entered format (not system-generated pattern like "CASE-2025-001")

**Acceptance Criteria:**
- Form Fields table clearly indicates Case Number is optional
- No mention of auto-generation
- Validation rules reflect manual entry (e.g., "Optional, max 50 chars" or similar)
- Example demonstrates typical user-entered format

#### Scenario: Business Rules for Case Creation

**Given:** A developer or product manager is reviewing case creation business rules (section 6.2.2, around lines 1312-1319)
**When:** They read the Business Rules section
**Then:** The rules should NOT include:
- Auto-generation using pattern `CASE-YYYY-NNN`
- Requirement that case numbers must be unique
- Any logic about system-generated defaults

**And:** The rules SHOULD include:
- Clear statement that case numbers are manually entered by users
- Explicit clarification that duplicate case numbers are allowed
- Rationale for allowing duplicates (e.g., law firms may use external numbering schemes)

**Acceptance Criteria:**
- No business rule mentions auto-generation patterns
- No business rule requires uniqueness of case numbers
- New business rule explicitly states duplicates are allowed
- Remaining business rules are renumbered correctly
- Rules are clear and unambiguous

#### Scenario: API Error Responses Documentation

**Given:** A developer is implementing API error handling for case creation (section 6.2.2, around lines 1338-1341)
**When:** They read the Error Responses section
**Then:** There should be NO error response for duplicate case numbers
**And:** The 409 status code should NOT be listed

**Acceptance Criteria:**
- No "Status 409: Duplicate case number" error listed
- Other appropriate error responses remain (e.g., 400 for validation, 500 for server errors)
- Error responses are consistent with actual API behavior

#### Scenario: Search Functionality Documentation

**Given:** A user is reading about case search functionality (section 6.2.1, around line 1283)
**When:** They read the search features description
**Then:** The "Search by case number" feature should NOT imply that case numbers are unique identifiers
**And:** The description should reflect that multiple cases may match a single case number

**Acceptance Criteria:**
- Search functionality accurately described
- No language implying case numbers uniquely identify cases
- Clear that search may return multiple cases with the same number

#### Scenario: Documentation Consistency Check

**Given:** A reader is reviewing the entire PRD
**When:** They search for all mentions of "case number" (case-insensitive)
**Then:** All references should be consistent with manual entry and allowed duplicates
**And:** No contradictory information should exist in different sections

**Acceptance Criteria:**
- Search for "case number" returns no contradictory statements
- Search for "auto-generat" in context of cases returns no results
- Search for "unique" in context of case numbers returns no uniqueness requirements
- Search for pattern examples like "CASE-YYYY-NNN" returns no system-generated examples
- All sections (6.2.1, 6.2.2, 6.2.3, etc.) are consistent

### Requirement: GitHub Issue #78 SHALL Be Closed with Explanation

GitHub issue #78 SHALL be closed with a comment that clearly explains the reported behavior is intended, not a bug. The closing comment MUST explain that case numbers are manually entered and duplicates are allowed.

**Rationale:**
The issue was filed as a bug report, but the behavior (allowing duplicate case numbers) is actually correct. Proper issue resolution prevents confusion and establishes clear precedent for similar questions.

#### Scenario: Close Issue with Explanation

**Given:** GitHub issue #78 is open and labeled as a bug
**When:** The documentation updates are complete
**Then:** A comment should be added explaining this is intended behavior
**And:** The issue should be closed
**And:** Appropriate labels should be applied (e.g., "not a bug", "documentation", or "wontfix")

**Acceptance Criteria:**
- Issue has a closing comment that:
  - Clearly states this is intended behavior, not a bug
  - Explains that case numbers are manually entered
  - Explains that duplicates are allowed
  - References the OpenSpec change for documentation updates
  - Provides context about why duplicates might be useful
- Issue status is "Closed"
- Issue has appropriate labels (not "bug")
- Comment is professional and helpful in tone

**Comment should include:**
- Statement that behavior is intended
- Explanation of manual case number entry
- Clarification that duplicates are allowed
- Reference to documentation updates
- Optional: Business rationale for allowing duplicates

## REMOVED Requirements

### Requirement: Case Number Auto-Generation

**Description:**
~~The system must auto-generate case numbers using the pattern `CASE-YYYY-NNN` when a case number is not provided by the user.~~

**Rationale:**
This requirement never existed in the actual implementation and is being removed from documentation. Case numbers are always manually entered by users.

#### Scenario: Auto-Generation on Create

**REMOVED:** This scenario described auto-generation logic that was never implemented and is not desired.

### Requirement: Case Number Uniqueness Constraint

**Description:**
~~Case numbers must be unique across all cases within a site. The system must prevent duplicate case numbers and return a 409 error when attempting to create or update a case with a duplicate number.~~

**Rationale:**
This requirement was incorrectly documented. The actual business need allows duplicate case numbers to support various law firm numbering practices.

#### Scenario: Duplicate Case Number Validation

**REMOVED:** This scenario described uniqueness validation that should not exist.

#### Scenario: 409 Error Response

**REMOVED:** This scenario described a 409 error response for duplicate case numbers that should not be returned.

## Implementation Notes

### Documentation Files to Update

**Primary File:**
- `docs/Lawsome_PRD.md`

**Sections to Modify:**
1. Section 6.2.1: Case List View
   - Line ~1266: Case Number field description table

2. Section 6.2.2: Create Case
   - Line ~1307: Form Fields table - Case Number row
   - Lines ~1312-1319: Business Rules section
   - Lines ~1320-1332: Creation Flow (verify accuracy)
   - Lines ~1338-1341: Error Responses section

3. Section 6.2.3: View/Edit Case
   - Review for any case number uniqueness implications

4. Any other sections mentioning case numbers

### Search Patterns for Verification

Use these patterns to find all references that need review:

```bash
# Find all case number mentions
rg -i "case number" docs/Lawsome_PRD.md

# Find auto-generation references
rg -i "auto-?generat" docs/Lawsome_PRD.md

# Find uniqueness claims
rg -i "unique" docs/Lawsome_PRD.md | rg -i "case"

# Find pattern examples
rg "CASE-[0-9]{4}-[0-9]{3}" docs/Lawsome_PRD.md

# Find 409 errors
rg "409" docs/Lawsome_PRD.md
```

### Backend Verification

Before finalizing the documentation:

1. Verify backend code at `C:\Users\LENOVO\sabari\codebase\Lawsome\Code`
2. Check for case number validation logic
3. Confirm no uniqueness constraints in database schema
4. Verify API does not return 409 for duplicate case numbers

### Related Specifications

This change may relate to:
- **data-integrity**: Ensures documentation accurately reflects data constraints
- **ux-consistency**: Ensures user expectations match actual behavior

No dependencies on other specs, as this is documentation-only.

## Testing Strategy

Since this is a documentation change, testing involves:

1. **Manual Review:**
   - Read updated sections for clarity and accuracy
   - Verify no contradictory statements remain
   - Check that examples are realistic

2. **Cross-Reference Verification:**
   - Compare documentation against actual backend implementation
   - Verify API documentation (swagger.json) is consistent
   - Check that permission matrix doesn't conflict

3. **Stakeholder Review:**
   - Product manager confirms this reflects business intent
   - Development team confirms this matches implementation
   - QA team understands this is not a bug

4. **Issue Validation:**
   - Confirm GitHub issue #78 is properly closed
   - Verify closing comment is clear and helpful

## Future Considerations

### Optional Enhancements (Not in Scope)

If in the future the business wants to add case number features, consider:

1. **Optional Uniqueness Toggle:**
   - Organization-level setting to enforce uniqueness if desired
   - Some firms may want unique case numbers, others may not

2. **Case Number Format Validation:**
   - Allow organizations to define acceptable formats
   - Regex-based validation for consistency

3. **Auto-Generation as Option:**
   - Configurable auto-generation for organizations that want it
   - Pattern templates (e.g., `{ORG}-{YEAR}-{SEQ}`)

4. **Duplicate Warning (Not Error):**
   - Show warning when creating case with existing number
   - Allow user to proceed or change the number

These are NOT part of this change and should be separate proposals if needed.
