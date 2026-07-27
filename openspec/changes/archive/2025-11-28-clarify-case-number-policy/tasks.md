# Tasks

## Documentation Updates

### 1. Update Case List View Section (6.2.1)
**File:** `docs/Lawsome_PRD.md` (around line 1266)

**Action:** Remove "Auto-generated" designation for Case Number field in the table

**Validation:**
- Case Number column description no longer mentions auto-generation
- Description accurately reflects manual entry

### 2. Update Create Case Form Fields Table (6.2.2)
**File:** `docs/Lawsome_PRD.md` (line 1307)

**Action:**
- Change Case Number field from "Auto-generated if empty" to reflect manual entry
- Update example to show user-entered format instead of system-generated pattern
- Keep field as "No" (not required)

**Validation:**
- Table clearly shows Case Number as optional manual entry
- No mention of auto-generation
- Example reflects typical user-entered format

### 3. Update Business Rules Section (6.2.2)
**File:** `docs/Lawsome_PRD.md` (lines 1312-1319)

**Action:**
- Remove Business Rule #1 about auto-generation pattern `CASE-YYYY-NNN`
- Remove Business Rule #2 about uniqueness requirement
- Add new rule clarifying that case numbers are manually entered and duplicates are allowed
- Update remaining rule numbering

**Validation:**
- No mention of auto-generation patterns
- Clear statement that duplicates are allowed
- Business rules accurately reflect manual entry workflow

### 4. Update Creation Flow Section (6.2.2)
**File:** `docs/Lawsome_PRD.md` (lines 1320-1332)

**Action:**
- Review step 6 to ensure it describes optional manual case number entry
- Ensure no implication of system-generated values

**Validation:**
- Creation flow accurately describes user entering case number manually
- No steps about system generating case numbers

### 5. Update API Error Responses Section (6.2.2)
**File:** `docs/Lawsome_PRD.md` (lines 1338-1341)

**Action:**
- Remove "Status 409: Duplicate case number" error response
- Keep other error responses (400, 500)

**Validation:**
- No 409 error for duplicate case numbers
- Other appropriate error codes remain

### 6. Review and Update Edit Case Section (6.2.3)
**File:** `docs/Lawsome_PRD.md` (section 6.2.3, starting around line 1343)

**Action:**
- Review Edit Case section for any mentions of case number uniqueness
- Update if similar inaccuracies exist

**Validation:**
- Edit Case section consistent with Create Case section
- No conflicting information about case number handling

### 7. Search Functionality Review
**File:** `docs/Lawsome_PRD.md` (around line 1283)

**Action:**
- Review "Search by case number" feature description
- Ensure it doesn't imply uniqueness constraints

**Validation:**
- Search functionality described accurately
- No implications that case numbers are unique identifiers

## Issue Management

### 8. Close GitHub Issue #78
**Action:**
- Add comment to issue #78 explaining that duplicate case numbers are intended behavior
- Reference this OpenSpec change for documentation updates
- Add label "not a bug" or "documentation" if available
- Close the issue

**Comment Template:**
```
This is not a bug. The system is working as intended - duplicate case numbers are allowed in Lawsome.

Case numbers are manually entered by users and are not auto-generated. Multiple cases can share the same case number, which is useful for law firms that may have their own numbering schemes or need to reference external case identifiers.

The PRD has been updated via OpenSpec change "clarify-case-number-policy" to accurately reflect this behavior and remove incorrect documentation about auto-generation and uniqueness constraints.
```

**Validation:**
- Issue has closing comment with clear explanation
- Issue is closed
- Appropriate labels applied

## Verification

### 9. Cross-Reference with Backend Implementation
**Action:**
- Review backend API code at `C:\Users\LENOVO\sabari\codebase\Lawsome\Code`
- Confirm that backend does not enforce case number uniqueness
- Verify no auto-generation logic exists

**Validation:**
- Backend code matches updated PRD documentation
- No uniqueness constraints in database or API validation
- No auto-generation code

### 10. Final PRD Consistency Check
**Action:**
- Search entire PRD for any other mentions of case number auto-generation
- Search for any other uniqueness references for case numbers
- Ensure terminology is consistent throughout

**Search Patterns:**
- "case number" (case-insensitive)
- "auto-generat"
- "unique" in context of cases
- "CASE-YYYY-NNN" or similar patterns
- "409" status codes

**Validation:**
- No contradictory information remains in PRD
- All case number references are consistent
- Document reads cohesively

## Dependencies

- Tasks 1-7 can be done in parallel as they update different sections
- Task 8 (close issue) should be done after tasks 1-7 are complete
- Task 9 can be done in parallel with tasks 1-7
- Task 10 should be done last to verify all changes

## Estimated Effort

- **Documentation Updates (Tasks 1-7):** ~30 minutes
- **Issue Management (Task 8):** ~10 minutes
- **Verification (Tasks 9-10):** ~20 minutes
- **Total:** ~60 minutes
