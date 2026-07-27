# Proposal: Fix "N/A" Display Value Leakage to API Payloads

**Change ID:** `fix-na-display-value-leakage`
**Status:** Draft
**Created:** 2025-01-26
**Author:** creativecoder

## Why

The application currently has a data integrity issue where UI-only display values ("N/A") are leaking into API request payloads, causing data corruption in the backend database.

**Current Behavior:**
1. When fetching organization details from `GET /api/v1/organizations/{id}`, if the `description` field is empty or null in the database, the frontend transforms it to "N/A" for display purposes (`api.ts:26`)
2. When the user clicks "Edit Organization", the form is pre-filled with "N/A" as the description value (`page.tsx:215`)
3. When the user saves the form (even without modifying the description), "N/A" is sent in the PUT request payload to `/api/v1/organizations/{id}` (`page.tsx:235`)
4. The backend saves "N/A" as the actual description value in the database
5. On subsequent edits, "N/A" is now the real description value, not a display placeholder

**Root Cause:**
- **Data Transformation Layer Violation**: The `fetchOrganization` function in `api.ts` applies fallback values (`|| 'N/A'`) when transforming API responses to frontend models
- **Bidirectional Data Flow**: The same model is used for both display (GET) and updates (PUT), causing display values to leak into request payloads
- **Missing Value Sanitization**: No logic exists to strip display-only values before sending data back to the API

**Impact:**
- **Data Corruption**: "N/A" strings are being saved as actual field values in the database
- **Loss of Empty State Information**: Cannot distinguish between intentionally empty fields and fields displaying "N/A" as a placeholder
- **Inconsistent Data**: Same issue affects multiple fields across multiple entities

## Affected Fields and Locations

### Organization Entity
**File:** `src/app/organization/services/api.ts` (lines 22-42)
- `name: orgPayload.name || 'N/A'` (line 24)
- `description: orgPayload.description || 'N/A'` (line 25)
- `emailId: orgPayload.emailId || orgPayload.email || 'N/A'` (line 28)
- `currentUser.fullName: 'N/A'` (line 34)
- `currentUser.emailId: 'N/A'` (line 35)

**Display:** `src/app/organization/[id]/page.tsx`
- Description displayed conditionally (lines 764-769) - **GOOD PATTERN**
- Edit form pre-fills with transformed values including "N/A" (line 215)
- Save payload sends "N/A" back to API (line 235)

### Site Entity
**Display Files:**
- `src/app/organization/components/SiteManagementTab.tsx` (lines 318, 322)
  - `{site.emailId || 'N/A'}` - Display only, grid view
  - `{site.phoneNumber || 'N/A'}` - Display only, grid view
- `src/app/organization/components/SitesTable.tsx` (lines 165, 168)
  - `{site.emailId || 'N/A'}` - Display only, table view
  - `{site.phoneNumber || 'N/A'}` - Display only, table view

**Analysis:** These are display-only uses in read-only views (no edit forms), so they don't leak to API. However, they should still follow consistent patterns.

### User Entity
**Display Files:**
- `src/app/organization/components/UserManagementTab.tsx` (line 340)
  - `{user.phoneNumber || 'N/A'}` - Display only, grid view
- `src/app/organization/[id]/sites/[siteId]/page.tsx` (line 1392)
  - `{u.phoneNumber || 'N/A'}` - Display only, site users view

**Analysis:** Display-only uses in read-only list views, no leakage risk, but should use consistent patterns.

### Appointment/Legal Expert Data
**File:** `src/app/appointments/payment/page.tsx` (line 146)
- `legalExpertData?.legalExpertPersonalDetails.phoneNumber || "N/A"` - Display only

## What Changes

### 1. Remove Fallback Values from Data Transformation Layer

**File:** `src/app/organization/services/api.ts`

**Current:**
```typescript
return {
  id: orgPayload.id || 0,
  name: orgPayload.name || 'N/A',
  description: orgPayload.description || 'N/A',
  emailId: orgPayload.emailId || orgPayload.email || 'N/A',
  // ...
};
```

**Proposed:**
```typescript
return {
  id: orgPayload.id || 0,
  name: orgPayload.name || '',
  description: orgPayload.description || '',
  emailId: orgPayload.emailId || orgPayload.email || '',
  // ...
};
```

**Rationale:** The API transformation layer should preserve data integrity, not apply UI display logic. Empty values should remain empty.

### 2. Apply Display Transformations in UI Components

**Approach A - Conditional Rendering (RECOMMENDED for organization description):**

**File:** `src/app/organization/[id]/page.tsx` (lines 764-769)

**Current (GOOD PATTERN - already implemented):**
```typescript
{organization.description && (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
    <DescriptionIcon color="action" sx={{ fontSize: 16, mr: 1, opacity: 0.7 }} />
    <Typography color='textPrimary'>{organization.description}</Typography>
  </Box>
)}
```

**Result:** Description icon and row are completely hidden when description is empty.

**Approach B - Inline Display Fallback (for fields that should always show a row):**

**Example for phoneNumber:**
```typescript
<Typography variant="body2" color="textSecondary">
  {user.phoneNumber || 'N/A'}
</Typography>
```

**Key Principle:** Fallback values (`|| 'N/A'`) should **only** appear in JSX display logic, never in:
- Data transformation functions (API response mapping)
- Form initialization (`setEditFormData`)
- API request payloads

### 3. Ensure Edit Forms Use Raw Values

**File:** `src/app/organization/[id]/page.tsx`

**Current (`handleEditClick`):**
```typescript
setEditFormData({
  name: organization.name || '',  // Already correct - uses empty string fallback
  email: organization.emailId || '',  // Already correct
  phone: String(organization.phoneNumber) || '',  // Already correct
  description: organization.description || '',  // WILL BE FIXED by removing 'N/A' from api.ts
  segments: [...(organization.segments || [])]  // Already correct
});
```

**Analysis:** Edit form initialization is already correct - it uses empty string fallbacks. The issue is that `organization.description` already contains "N/A" from the transformation layer, so fixing api.ts will resolve this.

## Alternatives Considered

### Alternative 1: Sanitize Values Before Sending to API

**Approach:** Add a sanitization function that strips "N/A" values before sending to API.

```typescript
const sanitizeForAPI = (value: string) => {
  return value === 'N/A' ? '' : value;
};

const payload = {
  description: sanitizeForAPI(editFormData.description),
  // ...
};
```

**Rejected Because:**
- Adds complexity and maintenance burden
- Treats symptoms, not root cause
- Still relies on brittle string matching ("N/A" hardcoded in multiple places)
- Doesn't prevent future "N/A" leakage in new code

### Alternative 2: Use Separate Models for Display and API

**Approach:** Create separate TypeScript interfaces for `OrganizationDisplay` and `OrganizationAPI`.

**Rejected Because:**
- Over-engineering for the current problem
- Increases code complexity significantly
- Would require maintaining type transformations everywhere
- Not aligned with "favor straightforward, minimal implementations" guardrail

### Alternative 3: Use a Formatting Utility Function

**Approach:** Create a `formatForDisplay(value, fallback = 'N/A')` utility function used only in JSX.

**Rejected Because:**
- Unnecessary abstraction for simple `|| 'N/A'` pattern
- Inline JSX expressions are more readable and idiomatic in React
- Doesn't solve the root cause (transformation layer pollution)

**Selected Approach: Remove transformation layer pollution + conditional rendering**

**Reasoning:**
1. **Minimal changes**: Only remove `|| 'N/A'` from one file (api.ts)
2. **Clear separation of concerns**: Data layer preserves integrity, UI layer handles display
3. **Follows existing patterns**: Organization description already uses conditional rendering (lines 764-769)
4. **Type-safe**: TypeScript already handles empty strings correctly
5. **Consistent with best practices**: Don't mutate data during transformation

## Success Criteria

### Functional Requirements
1. When backend returns `description: "empty"` or `description: null`, the frontend should:
   - Store it as an empty string (`""`) in the organization object
   - Hide the description row entirely in the display view (icon + text)
   - Show an empty textarea in the edit form (not pre-filled with "N/A")
2. When user saves organization without modifying description, API payload must contain:
   - `description: ""` (empty string), NOT `description: "N/A"`
3. The behavior for name, emailId, and other fields should remain consistent

### Non-Functional Requirements
1. No TypeScript compilation errors
2. No ESLint warnings related to changes
3. Existing tests pass (if applicable)
4. Manual testing confirms:
   - Organization with empty description: icon/text hidden, edit form empty
   - Organization with valid description: icon/text shown, edit form pre-filled correctly
   - Save operation: description remains empty when not modified

### Testing Scenarios

**Scenario 1: New organization with empty description**
- Backend returns: `{ "description": "" }`
- Display view: Description icon and text are NOT rendered
- Edit form: Textarea is empty (placeholder shown)
- After save: Backend receives `{ "description": "" }`

**Scenario 2: Existing organization with "N/A" in database (migration scenario)**
- Backend returns: `{ "description": "N/A" }`
- Display view: Description icon and text ARE rendered showing "N/A"
- Edit form: Textarea contains "N/A"
- User can clear it or replace it
- After save: Backend receives user's input or empty string if cleared

**Scenario 3: Organization with valid description**
- Backend returns: `{ "description": "A legal services firm" }`
- Display view: Description icon and text ARE rendered
- Edit form: Textarea contains "A legal services firm"
- After save: Backend receives modified or original description

## Dependencies

- None - this is a standalone data integrity fix

## Risks

**LOW RISK:**
- Changes are minimal and localized to one transformation function
- Display logic changes follow existing patterns already in use
- TypeScript will catch any type mismatches
- No breaking changes to components or APIs

**Potential Issues:**
- **Existing "N/A" data in database**: Organizations/users/sites that already have "N/A" saved in the database will display "N/A" as real data
  - **Mitigation**: This is expected behavior - "N/A" is now treated as legitimate user input. Backend team can run a data migration script if needed to clean up existing "N/A" values
- **Missing data indicators**: Some views may look "empty" where they previously showed "N/A"
  - **Mitigation**: This is the intended behavior - empty fields should not show misleading placeholder values

## Questions & Clarifications

### Decisions Made:

1. **Display Pattern: Option A - Conditional Rendering**
   - All optional fields will use conditional rendering to hide the field entirely when empty
   - This reduces visual noise and provides a cleaner UI
   - Consistent pattern across all entities (organization, site, user)

2. **Data Migration:**
   - User will handle data migration separately
   - Application is not live yet, so existing "N/A" values can be cleaned up before launch
   - Frontend fix prevents future "N/A" pollution

3. **Field Requirements:**
   - **Organization:**
     - `name`: **REQUIRED** (validation enforced, never empty)
     - `emailId`: **REQUIRED** (validation enforced, never empty)
     - `description`: **OPTIONAL** (hide when empty)
     - `segments`: **OPTIONAL** (show "No segments available" when empty)
   - **Site:**
     - `phoneNumber`: **REQUIRED** (validation enforced, never empty)
     - `emailId`: **OPTIONAL** (hide when empty)
   - **User:**
     - `phoneNumber`: **OPTIONAL** (hide when empty)

### Implementation Guidelines:

**Pattern to Apply:**
```tsx
{/* REQUIRED fields - always show, enforce validation */}
<Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
  <EmailIcon color="action" sx={{ fontSize: 16, mr: 1 }} />
  <Typography>{organization.emailId}</Typography>
</Box>

{/* OPTIONAL fields - hide entirely when empty */}
{organization.description && (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
    <DescriptionIcon color="action" sx={{ fontSize: 16, mr: 1 }} />
    <Typography>{organization.description}</Typography>
  </Box>
)}

{/* OPTIONAL fields - alternative message when empty */}
<Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
  <SegmentIcon color="action" sx={{ fontSize: 16, mr: 1 }} />
  {organization.segments?.length ? (
    organization.segments.map((segment) => <Chip key={segment} label={segment} />)
  ) : (
    <Typography variant="body2" color="textSecondary">No segments available</Typography>
  )}
</Box>
```

## Implementation Notes

### Files to Modify

**High Priority (Data Corruption Fix):**
1. `src/app/organization/services/api.ts` (lines 22-42) - Remove all `|| 'N/A'` fallbacks

**Medium Priority (Consistency):**
2. `src/app/organization/components/SiteManagementTab.tsx` (lines 318, 322)
3. `src/app/organization/components/SitesTable.tsx` (lines 165, 168)
4. `src/app/organization/components/UserManagementTab.tsx` (line 340)
5. `src/app/organization/[id]/sites/[siteId]/page.tsx` (line 1392)

**Optional (Display Improvements):**
6. Consider adding `aria-label` or visually hidden text for screen readers when hiding optional fields

### Code Pattern to Follow

**GOOD:**
```tsx
{/* Conditional rendering - hide entire row when empty */}
{organization.description && (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
    <DescriptionIcon color="action" sx={{ fontSize: 16, mr: 1 }} />
    <Typography>{organization.description}</Typography>
  </Box>
)}

{/* OR inline fallback for fields that must show a row */}
<Typography>{user.phoneNumber || 'Not provided'}</Typography>
```

**BAD:**
```typescript
// ❌ Never apply display fallbacks in data transformation layer
return {
  description: orgPayload.description || 'N/A',  // BAD
};

// ❌ Never use transformed values in form initialization
setEditFormData({
  description: organization.description || '',  // Will contain 'N/A' if transformation layer polluted it
});
```

## Cross-References

- **Related PRD Section:** Section on data integrity and form handling (if applicable)
- **Related Components:** Organization detail page, Site management, User management
- **Backend API:** `GET /api/v1/organizations/{id}`, `PUT /api/v1/organizations/{id}`
