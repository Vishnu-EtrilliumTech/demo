# UX Consistency Spec Delta

## ADDED Requirements

### Requirement: DateTime Format Consistency
All datetime displays throughout the application SHALL use consistent 12-hour time format with AM/PM indicators to avoid user confusion when switching between view and edit modes.

#### Scenario: Task due date displays in 12-hour format
- **WHEN** user views a task's due date in the task list table
- **THEN** the time portion SHALL be displayed in 12-hour format with AM/PM indicator (e.g., "2:30 PM")
- **AND** the format SHALL be consistent across all task views (table, details, inline display)

#### Scenario: Hearing datetime displays in 12-hour format
- **WHEN** user views a hearing's scheduled time in the hearings list table
- **THEN** the time portion SHALL be displayed in 12-hour format with AM/PM indicator (e.g., "9:00 AM")
- **AND** the format SHALL be consistent across all hearing views (table, details, inline display)

#### Scenario: DateTime formatting utility enforces 12-hour format
- **WHEN** the `formatDisplayDateTime` utility function is called with a date string
- **THEN** the returned string SHALL include time in 12-hour format with AM/PM indicator
- **AND** the function SHALL use explicit locale options to ensure consistent formatting regardless of browser defaults

#### Scenario: Edit forms maintain functional datetime input
- **WHEN** user opens edit form for a task or hearing with an existing datetime value
- **THEN** the datetime-local input SHALL display the current value correctly
- **AND** allow user to select a new date and time
- **AND** the selected value SHALL be saved correctly
- **BUT** the visual presentation of the input may differ from display format due to browser native controls
