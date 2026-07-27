# Tasks: Fix "N/A" Display Value Leakage

## Phase 1: Core Data Integrity Fix (High Priority)

### Task 1: Remove "N/A" fallbacks from organization API transformation
**File:** `src/app/organization/services/api.ts` (lines 22-42)

**Changes:**
- Replace `name: orgPayload.name || 'N/A'` with `name: orgPayload.name || ''`
- Replace `description: orgPayload.description || 'N/A'` with `description: orgPayload.description || ''`
- Replace `emailId: orgPayload.emailId || orgPayload.email || 'N/A'` with `emailId: orgPayload.emailId || orgPayload.email || ''`
- Replace `fullName: 'N/A'` with `fullName: ''` in currentUser fallback object
- Replace `emailId: 'N/A'` with `emailId: ''` in currentUser fallback object

**Validation:**
- TypeScript compilation succeeds
- ESLint shows no new warnings
- Test organization data fetching with empty fields from API

**Dependencies:** None

---

### Task 2: Verify organization edit form handles empty values correctly
**File:** `src/app/organization/[id]/page.tsx` (lines 209-221, 227-292)

**Changes:**
- Verify `handleEditClick` uses empty string fallbacks (line 215): `description: organization.description || ''`
- Verify `handleSaveEdit` sends raw form values without adding "N/A" (line 235): `description: editFormData.description`
- No code changes needed - verify existing implementation is correct

**Validation:**
- Edit form for organization with empty description shows empty textarea (not "N/A")
- Save operation sends empty string or user input to API (inspect network tab)
- Form state does not contain "N/A" at any point

**Dependencies:** Task 1

---

### Task 3: Test organization description display conditional rendering
**File:** `src/app/organization/[id]/page.tsx` (lines 764-769)

**Changes:**
- No code changes needed - verify existing conditional rendering works correctly
- Ensure description row (icon + text) is hidden when `organization.description` is empty or falsy

**Validation:**
- Organization with empty description: description row is NOT rendered in DOM
- Organization with non-empty description: description row IS rendered
- Inspect DOM to confirm no remnant elements when hidden

**Dependencies:** Task 1

---

## Phase 2: Display Consistency Improvements (Medium Priority)

### Task 4: Update site management grid view display patterns
**File:** `src/app/organization/components/SiteManagementTab.tsx` (lines 318, 322)

**Changes:**
- Change emailId display (line 318): Replace `{site.emailId || 'N/A'}` with conditional rendering (hide when empty)
- Keep phoneNumber display (line 322): `{site.phoneNumber}` (REQUIRED field, always has value)

**Implementation:**
```tsx
{/* emailId - OPTIONAL: hide when empty */}
{site.emailId && (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
    <EmailIcon fontSize="small" color="action" sx={{ mr: 1 }} />
    <Typography variant="body2" color="textSecondary">{site.emailId}</Typography>
  </Box>
)}

{/* phoneNumber - REQUIRED: always show */}
<Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
  <PhoneIcon fontSize="small" color="action" sx={{ mr: 1 }} />
  <Typography variant="body2" color="textSecondary">{site.phoneNumber}</Typography>
</Box>
```

**Validation:**
- Site cards in grid view hide email icon/field when empty
- Phone number is always displayed (required field)
- Visual consistency with organization detail page

**Dependencies:** Task 3

---

### Task 5: Update sites table view display patterns
**File:** `src/app/organization/components/SitesTable.tsx` (lines 165, 168)

**Changes:**
- Change emailId display (line 165): Replace `{site.emailId || 'N/A'}` with conditional rendering or empty cell
- Keep phoneNumber display (line 168): `{site.phoneNumber}` (REQUIRED field, always has value)

**Implementation:**
```tsx
{/* emailId - OPTIONAL: show empty cell or hide column content when empty */}
<Typography variant="body2">{site.emailId || ''}</Typography>

{/* phoneNumber - REQUIRED: always show */}
<Typography variant="body2">{site.phoneNumber}</Typography>
```

**Note:** For table views, we use empty string instead of hiding the cell to maintain table structure.

**Validation:**
- Sites table displays empty cell for sites without email (no "N/A")
- Phone number is always displayed (required field)
- Grid view and table view use consistent logic (both respect optional/required distinction)

**Dependencies:** Task 4

---

### Task 6: Update user management grid view display patterns
**File:** `src/app/organization/components/UserManagementTab.tsx` (line 340)

**Changes:**
- Change phoneNumber display (line 340): Replace `{user.phoneNumber || 'N/A'}` with conditional rendering (hide when empty)

**Implementation:**
```tsx
{/* phoneNumber - OPTIONAL: hide when empty */}
{user.phoneNumber && (
  <Box display="flex" alignItems="center" mb={0.5}>
    <PhoneIcon fontSize="small" color="action" sx={{ mr: 1 }} />
    <Typography variant="body2" color="textSecondary">{user.phoneNumber}</Typography>
  </Box>
)}
```

**Validation:**
- User cards in grid view hide phone icon/field when empty
- Visual consistency across all entity types (organization, site, user)

**Dependencies:** Task 4

---

### Task 7: Update site users view display patterns
**File:** `src/app/organization/[id]/sites/[siteId]/page.tsx` (line 1392)

**Changes:**
- Change phoneNumber display (line 1392): Replace `{u.phoneNumber || 'N/A'}` with conditional rendering (hide when empty)

**Implementation:**
```tsx
{/* phoneNumber - OPTIONAL: hide when empty */}
{u.phoneNumber && (
  <Box display="flex" alignItems="center" mb={0.5}>
    <PhoneIcon fontSize="small" color="action" sx={{ mr: 1 }} />
    <Typography variant="body2" color="textSecondary">{u.phoneNumber}</Typography>
  </Box>
)}
```

**Validation:**
- Site users list hides phone icon/field when empty
- Consistent with user management tab pattern

**Dependencies:** Task 6

---

## Phase 3: Testing & Validation

### Task 8: Manual testing - Organization CRUD with empty fields
**Steps:**
1. Test GET organization with empty description from backend
   - Verify description row is hidden in display view
   - Verify no "N/A" appears anywhere
2. Test Edit organization with empty description
   - Verify textarea is empty (shows placeholder, not "N/A")
   - Leave description empty and save
   - Verify API payload contains `description: ""` (network tab)
3. Test Edit organization and add description
   - Enter "Test description"
   - Save and verify API payload contains `description: "Test description"`
4. Test Edit organization and clear description
   - Clear existing description
   - Save and verify API payload contains `description: ""`

**Validation:**
- All scenarios pass without "N/A" appearing in forms or API payloads
- Empty values display appropriately in UI
- Data integrity maintained throughout CRUD operations

**Dependencies:** Tasks 1-3

---

### Task 9: Manual testing - Sites and Users display
**Steps:**
1. View site management page with sites that have:
   - Empty emailId and phoneNumber
   - Only emailId populated
   - Only phoneNumber populated
   - Both fields populated
2. View user management page with users that have:
   - Empty phoneNumber
   - Populated phoneNumber
3. Toggle between grid and table views for both

**Validation:**
- Empty fields display consistently (either hidden or show "N/A" as display-only text)
- Grid and table views use consistent patterns
- No "N/A" values leak into any edit forms or API calls

**Dependencies:** Tasks 4-7

---

### Task 10: Regression testing - Existing functionality
**Steps:**
1. Test organization update with all fields populated
2. Test validation errors display correctly
3. Test segments selection and display
4. Test organization delete functionality
5. Test tab navigation (Overview, Users, Sites)

**Validation:**
- All existing functionality works as before
- No unintended side effects from removing "N/A" transformations
- Form validation still works correctly

**Dependencies:** Tasks 1-9

---

## Phase 4: Documentation & Cleanup

### Task 11: Update TypeScript types if needed
**Files:** `src/app/organization/types/index.ts`

**Changes:**
- Review Organization, Site, User type definitions
- Ensure string fields allow empty strings (they should already)
- Add JSDoc comments documenting that empty strings are valid values

**Validation:**
- TypeScript compilation succeeds
- No type errors in any consuming components

**Dependencies:** Tasks 1-10

---

### Task 12: Code review and final validation
**Steps:**
1. Run full ESLint check: `npx eslint src/app/organization --fix`
2. Run TypeScript check: `npx tsc --noEmit`
3. Review all changed files for code quality
4. Verify no console errors or warnings in browser

**Validation:**
- Zero ESLint errors or warnings
- Zero TypeScript compilation errors
- Clean browser console during manual testing
- Code follows project conventions and best practices

**Dependencies:** Tasks 1-11

---

## Summary

**Total Tasks:** 12
**Estimated Effort:**
- Phase 1 (Core Fix): 2-3 hours
- Phase 2 (Display Consistency): 2-3 hours
- Phase 3 (Testing): 2-3 hours
- Phase 4 (Documentation & Review): 1 hour

**Total:** ~7-10 hours

**Critical Path:**
1. Task 1 (Remove transformation layer pollution) → MUST DO FIRST
2. Task 2-3 (Verify organization edit flow) → Core functionality fix
3. Tasks 4-7 (Display patterns) → Can be done in parallel after decision made
4. Tasks 8-10 (Testing) → Sequential validation
5. Tasks 11-12 (Final polish) → Final step before marking complete

**Parallelizable Work:**
- Tasks 4, 5, 6, 7 can be done in parallel once the pattern decision is made
- Testing tasks 8 and 9 can overlap if multiple testers available
