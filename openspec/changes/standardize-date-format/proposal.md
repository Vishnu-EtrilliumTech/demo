# Change: Standardize Date Format Across Application

## Why
Date formats are inconsistent across the application. An earlier iteration of this change standardized on `dd/mm/yyyy` (en-GB numeric), but that format is still ambiguous at a glance (numeric day/month order) and, in practice, several screens never adopted it — many still use ad-hoc `toLocaleDateString()`/`toLocaleString()` calls with different locales, month styles, and even an invalid locale tag (`en-India`). The eCourts "Search History" tab already displays dates as `09 Jul 2026` / `09 Jul 2026, 02:30 pm` (en-IN locale, 2-digit day, short month name, numeric year, optional 12-hour time) — an unambiguous format users are already familiar with. This change adopts that format as the single reference and finishes consolidating every date/datetime display onto it.

GitHub Issue: [#95](https://github.com/eTrillium/Lawsome.Web.UI/issues/95)

## What Changes
- Change the centralized date formatting utility's format from `dd/mm/yyyy` (en-GB numeric) to the eCourts reference format: `DD Mon YYYY` for date-only (e.g. `09 Jul 2026`) and `DD Mon YYYY, hh:mm AM/PM` for datetime (e.g. `09 Jul 2026, 02:30 pm`), using explicit `en-IN` locale
- Remove the interim `formatDescriptiveDate` ("9th of July 2026") helper and its two call sites in favor of the single reference format
- Consolidate the duplicate case-scoped `dateFormatters.ts` (under `cases/[caseId]/utils/`) so its display formatters delegate to the shared `src/utils/dateFormatters.ts` instead of maintaining a second, drift-prone copy
- Replace all remaining hand-rolled `toLocaleDateString()`/`toLocaleString()` display formatting (including duplicated local `formatDateTime`/`formatHearingDate`/`formatDate` helpers and the invalid `en-India` locale usage) with the shared utility
- Ensure consistent date display format across all pages and user roles:
  - Profile page (registered date)
  - User management tables (registered date, last login)
  - Organization/site dashboards (created date)
  - Case details (hearings, tasks, invoices, documents, comments, AI summary)
  - eCourts search history, saved cases, and case search results
  - Organization- and site-level hearings lists

## Impact
- Affected specs: `ux-consistency` (extends DateTime Format Consistency requirement)
- Affected code:
  - `src/utils/dateFormatters.ts` - centralized date formatting utility (format change + removal of `formatDescriptiveDate`)
  - `src/app/profile/page.tsx` - registered date display
  - `src/app/organization/[id]/page.tsx` - organization created date
  - `src/app/organization/[id]/sites/[siteId]/page.tsx` - site/user/case dates
  - `src/app/organization/[id]/sites/[siteId]/users/[userId]/page.tsx` - task dates
  - `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/utils/dateFormatters.ts` - delegate to shared utility
  - `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/InvoiceTab/` - invoice dates
  - `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/DocumentsTab/` - document dates
  - `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/TasksTab/` - task dates
  - `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/HearingsTab/` - hearing dates
  - `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/CommentsTab/` - comment dates
  - `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/TaskCommentsTab/` - task comment dates
  - `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/CaseSummarySection/` - AI summary generated-at date
  - `src/app/organization/components/UsersTable.tsx` - user table dates
  - `src/app/organization/components/UserManagementTab.tsx` - user card dates
  - `src/app/organization/components/TasksTable.tsx` - task due dates
  - `src/app/organization/components/EcourtDetailsView/EcourtDetailsView.tsx` - eCourts "last updated" fallback date
  - `src/app/organization/[id]/ecourts/components/HistoryTab.tsx` - search history "Searched At" (reference implementation)
  - `src/app/organization/[id]/ecourts/components/SavedCasesTab.tsx` - "last refreshed" date
  - `src/app/organization/[id]/ecourts/components/SearchTab.tsx` - filing/decision/next-hearing dates
  - `src/app/organization/[id]/hearings/page.tsx` and `src/app/organization/[id]/sites/[siteId]/hearings/page.tsx` - hearing list datetimes
