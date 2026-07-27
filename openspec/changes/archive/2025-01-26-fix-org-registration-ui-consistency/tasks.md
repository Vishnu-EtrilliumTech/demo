# Tasks: Fix Organization Registration Page UI Consistency

## Implementation Tasks

### 1. Update Error Message Spacing
- **File**: `src/app/register/page.tsx` (lines 925-954)
- **Action**: Add `mb-6` class to error alert container div
- **Validation**: Verify visual spacing between error and form fields in browser
- **Estimated Effort**: 5 minutes

### 2. Review Current Form Layout
- **File**: `src/app/register/page.tsx` (lines 709-922)
- **Action**: Verify existing grid layout is already using proper structure
- **Validation**: Confirm grid-cols-1 md:grid-cols-2 gap-6 pattern is in place
- **Estimated Effort**: 5 minutes

### 3. Verify Form Field Styling Consistency
- **File**: `src/app/register/page.tsx` (lines 715-920)
- **Action**: Check that all single-line inputs use rounded-full, textarea uses rounded-2xl
- **Validation**:
  - Organization Name input: has rounded-full
  - Email input: has rounded-full
  - Phone inputs: have rounded-full
  - Description textarea: has rounded-2xl
  - Gender select: has rounded-full
- **Estimated Effort**: 10 minutes

### 4. Cross-Reference Design Patterns
- **Files**:
  - `src/app/organization/[id]/sites/new/page.tsx`
  - `src/app/organization/[id]/users/new/page.tsx`
- **Action**: Compare input styling, spacing, error patterns
- **Validation**: Ensure organization registration matches these patterns
- **Estimated Effort**: 15 minutes

### 5. Test Responsive Behavior
- **Action**: Test form at mobile (xs), tablet (md), and desktop (lg) breakpoints
- **Validation**:
  - Form fields stack properly on mobile
  - 2-column grid displays correctly on tablet/desktop
  - Error messages remain readable at all sizes
- **Estimated Effort**: 10 minutes

### 6. Visual Regression Check
- **Action**: Compare before/after screenshots
- **Validation**:
  - Error message has visible spacing
  - Form field borders and padding match reference pages
  - No unintended style changes to other form sections
- **Estimated Effort**: 10 minutes

## Testing Checklist

### Functional Testing
- [x] Form submission still works correctly
- [x] Validation errors display properly
- [x] Gender dropdown functions correctly
- [x] Segment multi-select works as expected
- [x] Phone number formatting behaves correctly
- [x] Email validation works
- [x] Success navigation to `/success` page works

### Visual Testing
- [x] Error alert has proper spacing from form fields (mb-6)
- [x] All text inputs have rounded-full styling
- [x] Description textarea has rounded-2xl styling
- [x] Spacing between form fields matches other pages
- [x] Administrator Details divider displays correctly
- [x] Form is centered and properly contained

### Cross-Browser Testing
- [x] Chrome/Edge - error spacing displays correctly
- [x] Firefox - error spacing displays correctly
- [x] Safari - error spacing displays correctly (if available)

### Responsive Testing
- [x] Mobile (xs): Single column layout, error visible, proper spacing
- [x] Tablet (md): Two column layout, error visible, proper spacing
- [x] Desktop (lg): Two column layout, all elements properly sized

## Rollback Plan

If issues arise:
1. Revert specific CSS class changes (mb-6 addition)
2. All functional logic remains unchanged, no API impact
3. Form will return to current visual state without data loss

## Notes

- This is a **styling-only change** - no functional modifications
- All existing form validation, submission, and error handling logic remains intact
- The fix focuses on making the UI consistent with established design patterns
- No new components or dependencies required
