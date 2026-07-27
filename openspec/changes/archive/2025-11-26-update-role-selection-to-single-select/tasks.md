# Implementation Tasks

## Task 1: Update organization user creation role field to single-select

**File:** `docs/Lawsome_PRD.md`

**Action:** Change "Roles | Multi-select" to "Roles | Select" in organization user creation section

**Current state (line 802):**
```markdown
| Roles | Multi-select | Yes | OrganizationAdmin, OrganizationClerk | Organization-level roles only |
```

**Expected state:**
```markdown
| Roles | Select | Yes | OrganizationAdmin, OrganizationClerk | Organization-level roles only |
```

**Rationale:** The UI only supports selecting a single role per user. "Select" accurately describes a single-selection dropdown/field, while "Multi-select" incorrectly implies multiple roles can be assigned.

**Validation:**
- Line 802 shows "Select" instead of "Multi-select"
- Documentation matches UI behavior
- No expectation of multiple role assignment

---

## Task 2: Update site user creation role field to single-select

**File:** `docs/Lawsome_PRD.md`

**Action:** Change "Roles | Multi-select" to "Roles | Select" in site user creation section

**Current state (line 1164):**
```markdown
| Roles | Multi-select | Yes | Site-level roles only | SiteAdmin, SiteClerk, SiteSrLegalExpert, SiteLegalExpert |
```

**Expected state:**
```markdown
| Roles | Select | Yes | Site-level roles only | SiteAdmin, SiteClerk, SiteSrLegalExpert, SiteLegalExpert |
```

**Rationale:** Same as Task 1 - the UI implementation only allows single role selection for site users.

**Validation:**
- Line 1164 shows "Select" instead of "Multi-select"
- Consistent with organization user creation documentation
- Accurately represents current system capabilities

---

## Task 3: Validate all changes

**Action:** Verify that all role selection references are now accurate

**Steps:**
1. Search PRD for: "Roles.*Multi-select" (case-insensitive)
2. Confirm no remaining references to multi-select roles
3. Verify both organization and site user creation sections updated

**Expected results:**
- No "Multi-select" references for role fields
- Role selection consistently documented as single-select
- PRD accurately reflects UI implementation

**Validation:**
```bash
grep -in "Roles.*Multi-select" docs/Lawsome_PRD.md
```
- Should return no results
- Confirms all role selection fields updated to single-select
