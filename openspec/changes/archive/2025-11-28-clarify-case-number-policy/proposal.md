# Change: Clarify Case Number Policy in PRD

## Why

The PRD currently contains incorrect information stating that case numbers are auto-generated and must be unique, contradicting the actual implemented behavior and business requirements. This has led to GitHub issue #78 being filed as a bug when the behavior is actually intended.

## What Changes

- **Remove** incorrect documentation stating case numbers are auto-generated
- **Remove** incorrect documentation requiring case number uniqueness
- **Remove** API error response "409: Duplicate case number" from PRD
- **Add** clear statement that case numbers are manually entered by users
- **Add** explicit clarification that duplicate case numbers are allowed
- **Update** all form field descriptions and business rules to reflect manual entry
- **Close** GitHub issue #78 with explanation that behavior is intended

**NO CODE CHANGES** - This is documentation-only to align PRD with existing implementation.

## Impact

**Affected specs:**
- case-documentation (MODIFIED): Updates documentation requirements for case number handling

**Affected code:**
- `docs/Lawsome_PRD.md` - Primary documentation file requiring updates
  - Section 6.2.1: Case List View table
  - Section 6.2.2: Create Case form fields, business rules, error responses
  - Section 6.2.3: Edit Case (review for consistency)

**Affected systems:**
- Documentation system only
- No frontend or backend code changes
- No API contract changes
- No database schema changes

**Breaking changes:**
- None - documentation correction only

## Scope

**In Scope:**
- Update PRD section 6.2.1 (Case List View)
- Update PRD section 6.2.2 (Create Case): form fields, business rules, creation flow, error responses
- Review PRD section 6.2.3 (Edit Case) for consistency
- Global search and update of any other case number references in PRD
- Close GitHub issue #78 with explanatory comment

**Out of Scope:**
- Any code changes (frontend or backend)
- Changes to API validation logic
- Changes to database constraints
- User interface modifications
- Swagger documentation updates
- Permission matrix changes

## Dependencies

**Required Before Implementation:**
- None - this is a documentation-only change

**Validation Requirements:**
- Review backend code at `C:\Users\LENOVO\sabari\codebase\Lawsome\Code` to confirm no uniqueness constraints exist
- Verify current behavior allows duplicate case numbers
- Confirm no auto-generation logic exists in backend

**Related Issues:**
- GitHub Issue #78: [BUG] The system allows creating multiple cases with the same case number

## Success Criteria

1. ✅ PRD section 6.2.1 no longer states case numbers are auto-generated
2. ✅ PRD section 6.2.2 form fields table shows manual entry (not auto-generated)
3. ✅ PRD section 6.2.2 business rules removed for auto-generation and uniqueness
4. ✅ PRD section 6.2.2 includes new rule stating duplicates are allowed
5. ✅ PRD section 6.2.2 error responses removed for 409 duplicate case number
6. ✅ All PRD sections are consistent with manual entry and allowed duplicates
7. ✅ GitHub issue #78 closed with clear explanation
8. ✅ No contradictory information remains in any section

## Risks and Mitigations

**Risk:** Stakeholders may have expected auto-generation or uniqueness
- **Mitigation:** Verify with product owner that current behavior is correct before updating docs

**Risk:** Some users may rely on uniqueness that doesn't actually exist
- **Mitigation:** Issue closing comment should note that search by case number may return multiple results

**Risk:** Future confusion if auto-generation is later desired
- **Mitigation:** Document in spec's "Future Considerations" section how auto-generation could be added as an optional feature

## Timeline

**Estimated Effort:** ~60 minutes total
- Documentation updates: ~30 minutes
- Validation and consistency check: ~20 minutes
- Issue management: ~10 minutes

**Sequencing:**
1. Update all PRD sections (parallel tasks)
2. Run consistency validation (search entire document)
3. Verify against backend code
4. Close GitHub issue #78

## Alternative Approaches Considered

**Alternative 1: Implement uniqueness constraint**
- **Rejected:** Would break existing cases with duplicate numbers
- **Reason:** Current behavior is intentional and matches business needs

**Alternative 2: Add auto-generation feature**
- **Rejected:** Not requested; adds complexity; may conflict with existing manual entries
- **Reason:** Users prefer manual control; law firms often use external numbering schemes

**Alternative 3: Make uniqueness optional/configurable**
- **Rejected:** Over-engineering for a documentation fix
- **Reason:** Can be considered as future enhancement if needed (noted in spec)

## Notes

- This change resolves confusion between documented behavior and actual implementation
- Law firms often need to use external case numbers or reference numbers that may not be unique within the system
- Multiple cases may share the same case number if they are related matters or involve the same external reference
- The case ID (database primary key) is the true unique identifier, not the case number field
