// Centralised enum-option arrays for list filter controls.
//
// Source: existing create/edit screens for the same fields (research.md R6).
// Status: pending final confirmation from the backend for values marked ⚠️.
// Date filters: send ISO-8601 date strings (YYYY-MM-DD) per backend-integration-guide §2.
//
// Usage:
//   import { CASE_STATUS_OPTIONS, USER_ROLE_OPTIONS } from '@/constants/filterOptions';
//   <EnumSelectFilter options={CASE_STATUS_OPTIONS} ... />

export interface FilterOption {
  value: string;
  label: string;
}

// ─── Cases ────────────────────────────────────────────────────────────────────

// Sourced from CaseStatus enum (src/app/organization/types/index.ts)
export const CASE_STATUS_OPTIONS: FilterOption[] = [
  { value: 'Open', label: 'Open' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'OnHold', label: 'On Hold' },
  { value: 'Closed', label: 'Closed' },
];

// ─── Tasks ─────────────────────────────────────────────────────────────────────

// Sourced from TaskStatus enum (src/app/organization/types/caseindex.ts)
export const TASK_STATUS_OPTIONS: FilterOption[] = [
  { value: 'Open', label: 'Open' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'OnHold', label: 'On Hold' },
  { value: 'Blocked', label: 'Blocked' },
  { value: 'Closed', label: 'Closed' },
];

// Sourced from task create/edit form (TasksTab.tsx)
export const TASK_PRIORITY_OPTIONS: FilterOption[] = [
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

// ─── Users ─────────────────────────────────────────────────────────────────────

// Sourced from user creation form (src/app/organization/[id]/users/new/page.tsx)
export const USER_ROLE_OPTIONS: FilterOption[] = [
  { value: 'SiteAdmin', label: 'Site Admin' },
  { value: 'SiteClerk', label: 'Site Clerk' },
  { value: 'SiteLegalExpert', label: 'Legal Expert' },
  { value: 'SiteSrLegalExpert', label: 'Senior Legal Expert' },
  { value: 'OrganizationAdmin', label: 'Org Admin' },
  { value: 'OrganizationClerk', label: 'Org Clerk' },
];

// Site-scoped role subset (system users omit org roles)
export const SITE_USER_ROLE_OPTIONS: FilterOption[] = [
  { value: 'SiteAdmin', label: 'Site Admin' },
  { value: 'SiteClerk', label: 'Site Clerk' },
  { value: 'SiteLegalExpert', label: 'Legal Expert' },
  { value: 'SiteSrLegalExpert', label: 'Senior Legal Expert' },
];

// ⚠️ Pending backend confirmation: user `status` filter string values.
// Backend currently stores enabled as boolean; string enum TBD.
export const USER_STATUS_OPTIONS: FilterOption[] = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

// ─── Sites & Organisations ────────────────────────────────────────────────────

// ⚠️ Pending backend confirmation: site/org `status` filter string values.
// Backend currently stores enabled as boolean; string enum TBD.
export const SITE_STATUS_OPTIONS: FilterOption[] = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

// ─── Documents ────────────────────────────────────────────────────────────────

// ⚠️ Pending backend confirmation: exact accepted type tokens.
// Sourced from upload accept attribute (.pdf, .doc/.docx, images) in DocumentsTab.tsx.
export const DOCUMENT_TYPE_OPTIONS: FilterOption[] = [
  { value: 'PDF', label: 'PDF' },
  { value: 'DOC', label: 'DOC/DOCX' },
  { value: 'Image', label: 'Image' },
  { value: 'Other', label: 'Other' },
];

// ─── Invoices / Payments ──────────────────────────────────────────────────────

// Sourced from PaymentStatus enum (src/app/organization/types/caseindex.ts)
export const INVOICE_STATUS_OPTIONS: FilterOption[] = [
  { value: 'None', label: 'None' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Failed', label: 'Failed' },
  { value: 'Paid', label: 'Paid' },
];

// Order / settlement status (sourced from payment-list/page.tsx)
export const ORDER_STATUS_OPTIONS: FilterOption[] = [
  { value: 'Success', label: 'Success' },
  { value: 'Failed', label: 'Failed' },
];

// ─── Legal Experts ────────────────────────────────────────────────────────────

// Sourced from legal-experts/page.tsx
export const LEGAL_EXPERT_TYPE_OPTIONS: FilterOption[] = [
  { value: 'CA', label: 'CA' },
  { value: 'Lawyer', label: 'Lawyer' },
];

// Sourced from legal-experts/page.tsx
export const APPROVAL_STATUS_OPTIONS: FilterOption[] = [
  { value: 'Approved', label: 'Approved' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Rejected', label: 'Rejected' },
];

// ─── Clients ──────────────────────────────────────────────────────────────────

// Sourced from client-list/page.tsx
export const CLIENT_STATUS_OPTIONS: FilterOption[] = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

// ─── Ratings ──────────────────────────────────────────────────────────────────

// ⚠️ Pending backend confirmation: whether ratingValue is sent as int or string.
// Rating scale 1–5; sent as numeric string until confirmed otherwise.
export const RATING_VALUE_OPTIONS: FilterOption[] = [
  { value: '1', label: '1 ★' },
  { value: '2', label: '2 ★★' },
  { value: '3', label: '3 ★★★' },
  { value: '4', label: '4 ★★★★' },
  { value: '5', label: '5 ★★★★★' },
];

// ─── eCourts ──────────────────────────────────────────────────────────────────

// Sourced from SearchTab.tsx (ecourt case status / disposal status)
export const ECOURT_CASE_STATUS_OPTIONS: FilterOption[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'disposed', label: 'Disposed' },
];
