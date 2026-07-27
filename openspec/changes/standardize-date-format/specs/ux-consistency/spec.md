## MODIFIED Requirements

### Requirement: DateTime Format Consistency
All date and datetime displays throughout the application SHALL use consistent formats to avoid user confusion, based on the reference format already used by the eCourts search history "Searched At" column. Date-only values SHALL be displayed as `DD Mon YYYY` (e.g. `09 Jul 2026`) using explicit `en-IN` locale with a 2-digit day, short (3-letter) month name, and numeric year. Datetime values SHALL use the same date portion followed by a comma and 12-hour time with AM/PM indicator (e.g. `09 Jul 2026, 02:30 pm`).

#### Scenario: Task due date displays in 12-hour format
- **WHEN** user views a task's due date in the task list table
- **THEN** the time portion SHALL be displayed in 12-hour format with AM/PM indicator (e.g., "09 Jul 2026, 2:30 PM")
- **AND** the format SHALL be consistent across all task views (table, details, inline display)

#### Scenario: Hearing datetime displays in 12-hour format
- **WHEN** user views a hearing's scheduled time in the hearings list table
- **THEN** the time portion SHALL be displayed in 12-hour format with AM/PM indicator (e.g., "09 Jul 2026, 9:00 AM")
- **AND** the format SHALL be consistent across all hearing views (table, details, inline display)

#### Scenario: DateTime formatting utility enforces 12-hour format
- **WHEN** the `formatDisplayDateTime` utility function is called with a date string
- **THEN** the returned string SHALL include the date as `DD Mon YYYY` followed by time in 12-hour format with AM/PM indicator
- **AND** the function SHALL use explicit `en-IN` locale options to ensure consistent formatting regardless of browser defaults

#### Scenario: Edit forms maintain functional datetime input
- **WHEN** user opens edit form for a task or hearing with an existing datetime value
- **THEN** the datetime-local input SHALL display the current value correctly
- **AND** allow user to select a new date and time
- **AND** the selected value SHALL be saved correctly
- **BUT** the visual presentation of the input may differ from display format due to browser native controls

#### Scenario: Date-only values display in DD Mon YYYY format
- **WHEN** user views a date-only value (e.g., registered date, created date, invoice date)
- **THEN** the date SHALL be displayed as `DD Mon YYYY` (e.g. `09 Jul 2026`) using explicit `en-IN` locale
- **AND** this format SHALL be consistent across all pages and components
- **AND** this format SHALL NOT vary based on user role or browser settings

#### Scenario: Registered date displays consistently for all user roles
- **WHEN** Organization Admin views registered date on profile page
- **AND** Organization Clerk views registered date on profile page
- **AND** Site Admin views registered date on profile page
- **THEN** all users SHALL see the date in identical `DD Mon YYYY` format
- **AND** no user role SHALL see dates in `mm/dd/yyyy` or `dd/mm/yyyy` numeric format

#### Scenario: Invoice dates display in consistent format
- **WHEN** user views invoice generated date or due date in the invoice list or details
- **THEN** dates SHALL be displayed as `DD Mon YYYY`
- **AND** format SHALL be consistent between list view and detail view

#### Scenario: User table dates display in consistent format
- **WHEN** user views registered date or last login date in user management tables
- **THEN** dates SHALL be displayed as `DD Mon YYYY`
- **AND** format SHALL be identical across organization and site level user tables

#### Scenario: eCourts search history, saved cases, and case search dates remain the reference format
- **WHEN** user views the "Searched At" column in eCourts search history, the "last refreshed" date in saved cases, or filing/decision/next-hearing dates in eCourts search results
- **THEN** dates SHALL continue to display in the `DD Mon YYYY` (and `DD Mon YYYY, hh:mm AM/PM` where time is shown) reference format
- **AND** these screens SHALL use the shared `formatDisplayDate`/`formatDisplayDateTime` utility rather than local duplicate formatting functions

#### Scenario: Centralized date formatting utility usage
- **WHEN** displaying any date value in the UI
- **THEN** the centralized `formatDisplayDate()`/`formatDisplayDateTime()` utility from `src/utils/dateFormatters` SHALL be used
- **AND** direct calls to `toLocaleDateString()`/`toLocaleString()` without explicit locale, or with a locale other than `en-IN`, SHALL NOT be used for date/datetime display
- **AND** case-scoped code SHALL NOT maintain a second, duplicate copy of the display formatters
