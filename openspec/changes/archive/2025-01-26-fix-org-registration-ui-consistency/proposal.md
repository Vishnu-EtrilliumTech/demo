# Proposal: Fix Organization Registration Page UI Consistency

## Overview

The organization registration page (`/register?role=organizationuser`) currently has UI inconsistencies compared to other form pages in the application (create site, create user, org landing page). The error message display lacks proper padding, and the overall form layout doesn't follow the established design patterns used throughout the organization management section.

## Problem Statement

**Current Issues:**
1. **Error Message Display**: The error alert lacks proper margin/padding from surrounding form elements, making it visually cramped
2. **Form Layout Inconsistency**: The organization registration form doesn't follow the same 2-column grid pattern used in the existing implementation
3. **Visual Style Mismatch**: Input fields, spacing, and overall styling don't match the design patterns established in:
   - Create Site page (`/organization/[id]/sites/new`)
   - Create User page (`/organization/[id]/users/new`)
   - Organization landing page (`/organization/[id]`)

## Proposed Solution

Refactor the organization registration form section (lines 709-922 in `src/app/register/page.tsx`) to match the established design patterns:

### 1. Error Message Styling
- Add proper margin-bottom (mb-6) to separate error alert from form fields
- Maintain existing error alert structure with border-l-4, flex layout, and dismiss button

### 2. Form Layout Alignment
- Preserve existing 2-column grid layout already in place
- Ensure consistent spacing between form sections

### 3. Visual Consistency
- Use rounded-full for single-line inputs (matching site/user creation forms)
- Use rounded-2xl for textarea fields (description)
- Maintain text-sm sizing for inputs to match compact design
- Preserve existing Administrator Details section divider
- Keep consistent error message display pattern (text-red-500 text-sm mt-1)

## Benefits

1. **Visual Cohesion**: Users experience consistent UI patterns across all form pages
2. **Improved Usability**: Proper spacing makes error messages more readable and less visually jarring
3. **Maintainability**: Following established patterns makes future UI updates easier
4. **Professional Polish**: Eliminates visual inconsistencies that detract from perceived quality

## Scope

**In Scope:**
- Refactor organization registration form UI (organizationuser role section)
- Update error message spacing
- Align form field styling with established patterns

**Out of Scope:**
- Client or Legal Expert registration forms (they use different, appropriate patterns)
- Functional/validation logic changes
- API integration changes
- Multi-select dropdown component modifications

## Success Criteria

1. Error messages have proper spacing (visible gap between alert and form fields)
2. Organization form uses consistent input styling (rounded-full for inputs, rounded-2xl for textarea)
3. Form matches visual patterns from create site/user pages
4. All existing functionality remains intact (form submission, validation, error handling)
5. Responsive design maintained across all screen sizes

## Visual Comparison

**Current State**: Organization registration form has cramped error display and inconsistent input styling
**Target State**: Match the polished, consistent styling patterns used in create site and create user forms

## Risk Assessment

**Low Risk**
- Only CSS/styling changes to existing HTML structure
- No logic modifications
- No API contract changes
- Existing grid layout structure preserved

## Dependencies

None - this is an isolated UI refinement.
