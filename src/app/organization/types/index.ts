import type { CaseApiAccessLevel } from './caseindex';
import type { Priority, CalendarItemType } from './calendarTypes';

export interface OrganizationUpdatePayload {
  name: string;
  description: string;
  segments: string[];
  phoneNumber: number | string;
  emailId: string;
  enabled: boolean;
}

/**
 * User entity
 *
 * @remarks
 * String fields may contain empty strings ("") as valid values.
 *
 * Field requirements:
 * - phoneNumber: OPTIONAL (empty string "" or 0 is valid, will be hidden in UI when empty)
 * - emailId: REQUIRED (must not be empty)
 * - fullName: REQUIRED (must not be empty)
 */
export interface User {
  id: string;
  userId: string;
  /** User full name (REQUIRED - must not be empty) */
  fullName: string;
  /** Phone number (OPTIONAL - empty or 0 is valid, hidden in UI when empty) */
  phoneNumber: number | string;
  /** Email address (REQUIRED - must not be empty) */
  emailId: string;
  roles: string[];
  organizationId: string;
  registeredDate: string;
  lastLoginDate: string;
  enabled: boolean;
  gender?: string;
  /** Site ID (null/absent = Head Quarters / org-level user, non-empty string = site user) */
  siteId?: string;
  /** Site name (OPTIONAL - present in org-level user list response, empty if absent) */
  siteName?: string;
}

export interface UserBasicInfo {
  id: string;
  fullName: string;
}

/**
 * Site entity
 *
 * @remarks
 * String fields may contain empty strings ("") as valid values.
 * Optional fields (marked with ?) may be undefined, null, or empty string.
 *
 * Field requirements:
 * - phoneNumber: REQUIRED (must not be empty)
 * - emailId: OPTIONAL (empty string "" is valid, will be hidden in UI when empty)
 * - description: REQUIRED for edit forms (empty string "" is valid)
 */
export interface Site {
  id: string;
  name: string;
  /** Site description (REQUIRED in forms - empty string "" is valid) */
  description?: string;
  /** Phone number (REQUIRED - must not be empty) */
  phoneNumber?: number | string;
  /** Email address (OPTIONAL - empty string "" is valid, hidden in UI when empty) */
  emailId?: string;
  address: string;
  pincode: string;
  district: string;
  state: string;
  landmark?: string;
  locality?: string;
  longitude?: number;
  latitude?: number;
  siteKey?: string;
  createdDate?: string;
  updatedDate?: string;
  enabled?: boolean;
  organizationId?: string;
  casesCount?: number;
  usersCount?: number;
}

export enum CaseStatus {
  Open = 'Open',
  InProgress = 'InProgress',
  OnHold = 'OnHold',
  Closed = 'Closed'
}

export interface Case {
  id: string;
  title: string;
  description?: string;
  status: CaseStatus;
  createdAt: string;
  createdDate?: string;
  modifiedDate?: string;
  updatedAt?: string;
  assignedToId: string;
  caseNumber: string;
  cnrNumber?: string;
  caseKey?: string;
  createdById: string;
  siteId?: string;
  /** Site name returned by the API (present in org-level case list response) */
  siteName?: string;
  /**
   * Calling user's effective access to this case (UI hint for row-level
   * Edit/Delete gating). Returned by the case list + detail endpoints; absent
   * when the backend has not been updated, in which case callers fall back to
   * role-based gating.
   */
  accessLevel?: CaseApiAccessLevel;
  /** Soft-archive marker. null/absent = active; set = archived (excluded from default case lists). */
  archivedDate?: string | null;
  /** Whether the current user has favourited this case (left-joined by the case list endpoint for the caller). */
  isFavourite?: boolean;
}

export interface Hearing {
  id: string;
  hearingDateTime: string;
  hearingNotes?: string;
  hearingLocation?: string;
  /** Free-text Google Maps address for the hearing location. */
  googleMapLocation?: string;
  courtLocationId?: string;
  /** Live display label of the linked CourtLocation, if any (null/absent when none was picked). */
  courtLocationDisplay?: string;
  caseId: string;
  caseName?: string;
  assignedToId: string;
  assignedToName?: string;
  createdById: string;
  siteId: string;
  siteName?: string;
  status?: string;       // site-level response
  hearingStatus?: string; // org-level response
  createdDate?: string;
  /** Critical/High/Medium/Low; null/absent renders as Green/Default. */
  priority?: Priority;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  assignedToId: number;
  createdById: number;
  caseId: string;
  siteId: number;
  createdDate: string;
  modifiedDate: string;
  closedDate: string;
  /** Critical/High/Medium/Low; null/absent renders as Green/Default. */
  priority?: Priority;
}

/**
 * Organization entity
 *
 * @remarks
 * String fields may contain empty strings ("") as valid values.
 * Empty strings should be preserved and not transformed to placeholder values like "N/A".
 *
 * Field requirements:
 * - name: REQUIRED (must not be empty, validation enforced)
 * - emailId: REQUIRED (must not be empty, validation enforced)
 * - description: OPTIONAL (empty string "" is valid)
 * - segments: REQUIRED (must have at least one segment selected)
 */
export interface Organization {
  id: string;
  /** Organization name (REQUIRED - must not be empty) */
  name: string;
  /** Organization description (OPTIONAL - empty string "" is valid) */
  description: string;
  /** Business segments (REQUIRED - must have at least one) */
  segments: string[];
  phoneNumber: number;
  /** Organization email (REQUIRED - must not be empty) */
  emailId: string;
  /** Short identifier key for the organization */
  organizationKey?: string;
  createdDate: string;
  updatedDate: string;
  enabled: boolean;
  /** Default Calendar item-type filter (Org Settings). null = all types available in the current phase. */
  defaultCalendarItemTypes?: CalendarItemType[] | null;
  currentUser: {
    id: string;
    /** User full name (empty string "" is valid) */
    fullName: string;
    /** User email (empty string "" is valid) */
    emailId: string;
    enabled: boolean;
    roles: string[];
    registeredDate: string;
    lastLoginDate: string;
    phoneNumber: number;
  };
}

export interface OrganizationRegistrationPayload {
  name: string;
  description: string;
  phoneNumber: string;
  emailId: string;
  segments: string[];
  administratorName: string;
  administratorPhoneNumber: string;
  administratorGender: string;
  organizationKey: string;
}

export enum PaymentStatus {
  None = 'None',
  Pending = 'Pending',
  Failed = 'Failed',
  Paid = 'Paid'
}

export interface Invoice {
  id: string;
  generatedDate: string;
  dueDate: string;
  paymentStatus: PaymentStatus;
  paymentReceivedDate?: string;
  amount: number;
  caseId: string;
  invoiceFileName: string;
  invoiceContent: string; // Base64 encoded
  remarks?: string;
  createdById?: string;
}

export interface AddInvoiceRequest {
  generatedDate: string;
  dueDate: string;
  paymentStatus: PaymentStatus;
  amount: number;
  invoiceFileName: string;
  invoiceContent: string; // Base64 encoded
  remarks?: string;
}

export interface UpdateInvoiceRequest {
  dueDate: string;
  paymentStatus: PaymentStatus;
  paymentReceivedDate?: string;
  amount: number;
  invoiceFileName: string;
  invoiceContent: string; // Base64 encoded
  remarks?: string;
}

export interface UpdateInvoicePaymentStatusRequest {
  paymentStatus: PaymentStatus;
}

export interface CaseSummary {
  caseId: number;
  caseTitle: string;
  caseNumber: string;
  summary: string;
  generatedAt: string;
}

// AI Chat types
export interface CaseChatRequest {
  message: string;
}

export interface CaseChatResponse {
  response: string;
  timestamp: string;
}
