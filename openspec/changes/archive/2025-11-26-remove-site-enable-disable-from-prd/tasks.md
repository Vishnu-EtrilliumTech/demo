# Implementation Tasks

## Task 1: Mark "Enabled status" as planned in Edit Site editable fields list

**File:** `docs/Lawsome_PRD.md`

**Action:** Add "[Planned for Future Implementation]" marker to "Enabled status" in section 5.5.2

**Current state (lines 1040-1056):**
```markdown
#### 5.5.2 Editable Fields

All fields from creation form can be edited:
- Site Name
- Description
- Phone Number
- Email ID
- Address
- Locality
- Landmark
- District
- State
- Pincode
- Latitude
- Longitude
- Enabled status
```

**Expected state:**
```markdown
#### 5.5.2 Editable Fields

All fields from creation form can be edited:
- Site Name
- Description
- Phone Number
- Email ID
- Address
- Locality
- Landmark
- District
- State
- Pincode
- Latitude
- Longitude
- Enabled status **[Planned for Future Implementation]**
```

**Validation:**
- Section 5.5.2 shows "Enabled status" with the planned marker
- Feature specification is preserved but clearly marked as not yet available

---

## Task 2: Mark "Default Status" business rule as planned

**File:** `docs/Lawsome_PRD.md`

**Action:** Add "[Planned for Future Implementation]" marker to the "Default Status" business rule in section 5.3.4

**Current state (line 962):**
```markdown
5. **Default Status:** Sites are enabled by default
```

**Expected state:**
```markdown
5. **Default Status:** Sites are enabled by default **[Planned for Future Implementation]**
```

**Rationale:** This preserves the business rule specification while clearly indicating it applies to a planned feature, not a current one.

**Validation:**
- Line 962 shows the planned marker
- Business rule is preserved for future reference

---

## Task 3: Mark business rule about disabling sites as planned

**File:** `docs/Lawsome_PRD.md`

**Action:** Add "[Planned for Future Implementation]" marker to the business rule about disabling sites in section 5.5

**Current state (line 1079):**
```markdown
**Business Rules:**
- ~~Site name must remain unique within organization~~
- Cannot change organization association
- Disabling site does not delete users or cases
- Changes reflected immediately
```

**Expected state:**
```markdown
**Business Rules:**
- ~~Site name must remain unique within organization~~
- Cannot change organization association
- Disabling site does not delete users or cases **[Planned for Future Implementation]**
- Changes reflected immediately
```

**Rationale:** This business rule describes behavior of a planned feature, so it should be preserved with the planned marker.

**Validation:**
- Line 1079 shows the planned marker
- Other business rules remain unchanged
- Feature behavior is documented for future implementation

---

## Task 4: Validate all changes

**Action:** Verify that all site enable/disable references now have the planned marker

**Steps:**
1. Search PRD for: "enabled", "disabled", "enable", "disable" (case-insensitive)
2. Review each result related to site enable/disable
3. Confirm that all have the "[Planned for Future Implementation]" marker

**Expected results:**
- All site enable/disable references clearly marked as planned
- Feature documentation is preserved
- PRD accurately represents current vs. planned capabilities

**Validation:**
```bash
grep -in "enabled\|disabled\|enable\|disable" docs/Lawsome_PRD.md
```
- Review results to confirm all site-related enable/disable mentions have the planned marker
- Verify that no misleading language suggests the feature currently exists
