# Tasks

## 1. Create Centralized Date Formatting Utility
- [x] 1.1 Create `src/utils/dateFormatters.ts` with standardized date formatting functions
- [x] 1.2 ~~Implement `formatDisplayDate()` with explicit `en-GB` locale for `dd/mm/yyyy` format~~ Superseded by 1.5
- [x] 1.3 ~~Implement `formatDisplayDateTime()` with explicit locale for consistent datetime format~~ Superseded by 1.5
- [x] 1.4 Export utilities from `src/utils/index.ts`
- [x] 1.5 Switch `formatDisplayDate()`/`formatDisplayDateTime()` to the eCourts reference format (`en-IN` locale, `DD Mon YYYY` / `DD Mon YYYY, hh:mm AM/PM`), matching `HistoryTab.tsx`'s original `formatDateTime`
- [x] 1.6 Remove the interim `formatDescriptiveDate` helper (and its ordinal-suffix helper) now that a single reference format is adopted

## 2. Update Profile Page
- [x] 2.1 Replace `toLocaleDateString()` with centralized `formatDisplayDate()` in `src/app/profile/page.tsx`

## 3. Update Organization Dashboard
- [x] 3.1 Replace `toLocaleDateString('en-US', {...})` with centralized utility in `src/app/organization/[id]/page.tsx`
- [x] 3.2 Switch organization created date from the interim `formatDescriptiveDate()` to `formatDisplayDate()`

## 4. Update Site Dashboard
- [x] 4.1 Replace all `toLocaleDateString()` calls with centralized utility in `src/app/organization/[id]/sites/[siteId]/page.tsx` (site created date, user registered dates, case dates)
- [x] 4.2 Switch site created date from the interim `formatDescriptiveDate()` to `formatDisplayDate()`

## 5. Update Personal Dashboard
- [x] 5.1 Replace `toLocaleDateString()` with centralized utility in `src/app/organization/[id]/sites/[siteId]/users/[userId]/page.tsx` (task due dates)

## 6. Update Case Components
- [x] 6.1 Update `InvoiceTab.tsx` to use centralized date formatting for invoice dates
- [x] 6.2 Update `DocumentsTab.tsx` to use centralized date formatting for upload dates
- [x] 6.3 Update `TasksTab.tsx` to use centralized date formatting for task document dates
- [x] 6.4 Update `CommentsTab.tsx` to use centralized date formatting (already has local formatDate function)
- [x] 6.5 Update `TaskCommentsTab.tsx` to use centralized date formatting (already has local formatDate function)
- [x] 6.6 Update `HearingsTab.tsx` to import `formatDisplayDateTime` from `@/utils` instead of the case-scoped duplicate
- [x] 6.7 Update `CaseSummarySection.tsx`'s "Generated on" AI summary timestamp to use `formatDisplayDateTime()` instead of a local `en-US` long-month formatter

## 7. Update Organization Components
- [x] 7.1 Update `UsersTable.tsx` to use centralized date formatting for registered/login dates
- [x] 7.2 Update `UserManagementTab.tsx` to use centralized date formatting for registered dates
- [x] 7.3 Update `TasksTable.tsx` to use centralized date formatting for due dates
- [x] 7.4 Update `EcourtDetailsView.tsx`'s "Last updated on" fallback to use `formatDisplayDate()` instead of a local `toLocaleDateString('en-IN', ...)` call

## 8. Update Existing Case Date Formatters
- [x] 8.1 Update `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/utils/dateFormatters.ts` so `formatDisplayDate()`/`formatDisplayDateTime()` delegate to the shared `src/utils/dateFormatters` implementation instead of maintaining a second copy
- [x] 8.2 Update `TasksTab.tsx` to import `formatDisplayDateTime` from `@/utils` instead of the case-scoped duplicate

## 9. Replace Native Date/DateTime Inputs with MUI Pickers
- [x] 9.1 Replace native `datetime-local` inputs in `TasksTab.tsx` with MUI `DateTimePicker` using `en-gb` locale and `DD/MM/YYYY hh:mm A` format
- [x] 9.2 Replace native `datetime-local` inputs in `HearingsTab.tsx` with MUI `DateTimePicker` using `en-gb` locale and `DD/MM/YYYY hh:mm A` format
- [x] 9.3 Replace native `date` inputs in `InvoiceTab.tsx` with MUI `DatePicker` using `en-gb` locale and `DD/MM/YYYY` format

## 10. Consolidate eCourts Date Displays onto the Shared Utility
- [x] 10.1 Replace `HistoryTab.tsx`'s local `formatDateTime()` (the original reference implementation) with the shared `formatDisplayDateTime()`
- [x] 10.2 Replace `SavedCasesTab.tsx`'s duplicate local `formatDateTime()` with the shared `formatDisplayDateTime()`
- [x] 10.3 Replace `SearchTab.tsx`'s local `formatDate()` with the shared `formatDisplayDate()`
- [x] 10.4 Replace the duplicated local `formatHearingDate()` in `src/app/organization/[id]/hearings/page.tsx` and `src/app/organization/[id]/sites/[siteId]/hearings/page.tsx` with the shared `formatDisplayDateTime()`

## 11. Verification
- [x] 11.1 Run `npx tsc --noEmit` and confirm no build errors
- [ ] 11.2 Manual testing: Verify date format consistency across all affected pages with different user roles
