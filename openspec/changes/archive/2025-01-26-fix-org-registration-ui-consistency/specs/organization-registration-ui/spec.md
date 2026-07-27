# Organization Registration UI Consistency

## ADDED Requirements

### Requirement: Organization Registration Form UI Consistency

The organization registration form MUST follow the same design patterns established in other form pages (create site, create user) to provide a consistent user experience across the application.

#### Scenario: Error Message Display Spacing

**Given** an organization registration form with validation errors
**When** the form displays an error alert
**Then** the error alert MUST have a bottom margin of at least 1.5rem (mb-6) to separate it from form fields below
**And** the error alert MUST use the standard error styling pattern:
- Border-left 4px red-500 (`border-l-4 border-red-500`)
- Background red-50 (`bg-red-50`)
- Padding 1rem (`p-4`)
- Flex layout with icon, message, and dismiss button

**Acceptance Criteria:**
- Error alert has visible spacing below it before form fields start
- Error alert follows the same pattern as site/user creation forms
- Error text is readable and not cramped against form fields

#### Scenario: Form Input Field Styling Consistency

**Given** the organization registration form
**When** rendering input fields
**Then** single-line text/email/phone/select inputs MUST use rounded-full styling
**And** multi-line textarea inputs MUST use rounded-2xl styling
**And** all inputs MUST have consistent padding (p-1.5 or p-3)
**And** all inputs MUST use text-sm for compact display
**And** inputs MUST show proper border colors:
- Default: `border-gray-300`
- Error state: `border-red-500` with `bg-red-50`
- Focus: `focus:ring-2 focus:ring-blue-500 focus:border-transparent`
- Hover: `hover:border-gray-400`

**Acceptance Criteria:**
- Organization Name input: rounded-full, consistent padding
- Organization Email input: rounded-full, consistent padding
- Organization Phone input: rounded-full, consistent padding
- Organization Description textarea: rounded-2xl, consistent padding
- Administrator inputs (Name, Email, Phone): rounded-full, consistent padding
- Gender select: rounded-full, consistent padding
- Segments multi-select: rounded-full, consistent padding
- All field error states display consistently

#### Scenario: Form Layout Grid Structure

**Given** the organization registration form on medium and larger screens
**When** the form renders
**Then** the form MUST use a 2-column grid layout (`grid grid-cols-1 md:grid-cols-2 gap-6`)
**And** related fields MUST be grouped in the same column
**And** the Administrator Details section MUST have a visual divider between organization fields and admin fields

**Acceptance Criteria:**
- Organization fields appear in left and right columns on desktop
- Administrator fields appear in left and right columns on desktop
- Section divider is visible and styled consistently
- Form collapses to single column on mobile (< md breakpoint)

#### Scenario: Visual Consistency with Reference Pages

**Given** the organization registration form
**When** compared visually to create site and create user forms
**Then** input field styling MUST match in terms of:
- Border radius patterns (rounded-full vs rounded-2xl)
- Border colors and widths
- Padding and spacing
- Font sizes and colors
- Error message placement and styling
- Button styling and positioning

**Acceptance Criteria:**
- User cannot distinguish styling differences between forms
- All three forms feel like part of the same cohesive application
- Design patterns are consistently applied

#### Scenario: Error Message Text Styling

**Given** form validation errors
**When** displaying field-specific error messages
**Then** error messages MUST appear below their associated input field
**And** error messages MUST use `text-red-500 text-sm mt-1` styling
**And** error messages MUST be readable and clearly associated with their field

**Acceptance Criteria:**
- Each field can display its own error message
- Error messages have consistent styling across all fields
- Error messages don't overlap or obscure input fields

#### Scenario: Responsive Behavior

**Given** the organization registration form
**When** viewed on different screen sizes
**Then** the form MUST remain functional and readable:
- Mobile (< 768px): Single column, full-width inputs
- Tablet (768px - 1024px): Two column grid, proportional inputs
- Desktop (> 1024px): Two column grid, max-width container

**Acceptance Criteria:**
- Form fields resize appropriately
- No horizontal scrolling required
- Touch targets remain accessible on mobile
- Text remains readable at all sizes

## Implementation Notes

### Files Affected
- `src/app/register/page.tsx` - Main registration form component (lines 709-954)

### CSS Classes to Maintain
- **Error Alert**: `bg-red-50 border-l-4 border-red-500 p-4 mb-6`
- **Text Inputs**: `w-full p-1.5 border rounded-full text-sm transition-all focus:ring-2 focus:border-transparent`
- **Textarea**: `w-full p-1.5 border rounded-2xl text-sm`
- **Select**: `w-full p-1.5 border rounded-full appearance-none pr-8 text-sm`
- **Error Text**: `text-red-500 text-sm mt-1`
- **Grid Layout**: `grid grid-cols-1 md:grid-cols-2 gap-6`

### Reference Implementations
- Create Site Form: `/src/app/organization/[id]/sites/new/page.tsx` (lines 205-449)
- Create User Form: `/src/app/organization/[id]/users/new/page.tsx` (lines 190-353)
- Organization Landing: `/src/app/organization/[id]/page.tsx` (Material-UI patterns)

### Existing Functionality to Preserve
- Form validation logic (validateForm function)
- Gender transformation ("Non-Binary" → "Transgender")
- Multi-select segments dropdown
- API submission (registerOrganization call)
- Success navigation
- All event handlers
