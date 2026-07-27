// ---------------------------------------------------------------------------
// Case access & contributors (feature 033)
// ---------------------------------------------------------------------------

/**
 * Contributor access level — sent to / received from the API as a number.
 * 0 = View-only, 1 = Edit.
 */
export enum ContributorAccessLevel {
  ViewOnly = 0,
  Edit = 1,
}

/**
 * Derived case access ladder used only by the UI to decide which controls
 * render. Never sent to the API. Ordering matters (None < View < Edit < Full);
 * always compare by numeric value.
 */
export enum CaseAccessLevel {
  None = 0,
  View = 1,
  Edit = 2,
  Full = 3,
}

/**
 * Per-case effective access for the calling user, returned as a string enum on
 * case read responses (GET …/cases and GET …/cases/{id}). Authoritative for
 * gating the case entity's own row actions (Edit / Delete) — see useCaseAccess.
 * The API still enforces access on every endpoint; this is a UI hint only.
 */
export type CaseApiAccessLevel = 'None' | 'View' | 'Edit' | 'Full';

/** Map the API string access level onto the UI numeric ladder. Absent/unknown → null. */
export function parseCaseApiAccessLevel(
  level?: CaseApiAccessLevel | string | null
): CaseAccessLevel | null {
  switch (level) {
    case 'None':
      return CaseAccessLevel.None;
    case 'View':
      return CaseAccessLevel.View;
    case 'Edit':
      return CaseAccessLevel.Edit;
    case 'Full':
      return CaseAccessLevel.Full;
    default:
      return null;
  }
}

/** True when the API access level permits editing the case entity (Edit or Full). */
export function canEditCaseEntity(
  level?: CaseApiAccessLevel | string | null
): boolean {
  return level === 'Edit' || level === 'Full';
}

/** True when the API access level permits deleting the case entity (Full only). */
export function canDeleteCaseEntity(
  level?: CaseApiAccessLevel | string | null
): boolean {
  return level === 'Full';
}

export interface CaseContributor {
  id: string;
  caseId: string;
  /** Site the membership is held against (feature 034). Optional to consume. */
  siteId?: string;
  /** Organization that owns the site (feature 034). Optional to consume. */
  organizationId?: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  accessLevel: ContributorAccessLevel;
  addedById: string;
  addedByFullName: string;
  createdDate: string;
}

/**
 * A site member eligible to be added as a contributor to a case (feature 034).
 * Returned by GET …/contributors/available-users, already filtered server-side
 * to exclude the creator, assignee, existing contributors, and admins.
 */
export interface AvailableUser {
  /** User id — passed as `userId` to addCaseContributor. */
  id: string;
  fullName: string;
  email: string;
}

export interface AvailableUsersListResponse {
  data: AvailableUser[];
  errors: string[];
  meta: Record<string, unknown>;
}

export interface AddCaseContributorRequest extends Record<string, unknown> {
  userId: string;
  accessLevel: ContributorAccessLevel;
}

export interface UpdateCaseContributorRequest extends Record<string, unknown> {
  accessLevel: ContributorAccessLevel;
}

export interface CaseContributorResponse {
  data: CaseContributor;
  errors: string[];
  meta: Record<string, unknown>;
}

export interface CaseContributorsListResponse {
  data: CaseContributor[];
  errors: string[];
  meta: Record<string, unknown>;
}

/**
 * Derived (UI-only) access model returned by `useCaseAccess` / `computeCaseAccess`.
 * Drives which mutation controls render. Not persisted, not sent to the API.
 */
export interface CaseAccess {
  entityLevel: CaseAccessLevel;
  resourceLevel: CaseAccessLevel;
  contributorLevel: ContributorAccessLevel | null;
  canManageContributors: boolean;
  isLoading: boolean;
}

// UI form type that includes "Non-Binary" option
export type GenderUIOption = 'Select' | 'Male' | 'Female' | 'Transgender' | 'Non-Binary';

// API gender type (backend only accepts these values)
export type GenderAPIType = 'Male' | 'Female' | 'Transgender';

export interface CaseClientRequest extends Record<string, unknown> {
  fullName: string;
  emailId?: string;
  phoneNumber?: number;
  gender: GenderAPIType;
  remarks?: string;
}

// UI form interface that allows "Non-Binary" selection
export interface CaseClientFormData extends Record<string, unknown> {
  fullName: string;
  emailId: string;
  phoneNumber: number;
  gender: GenderUIOption;
  remarks?: string;
}

export interface CaseClient {
  id: string;
  caseId: string;
  fullName: string;
  emailId: string;
  phoneNumber: number;
  gender: GenderAPIType;
  invitedOnDate: string | null;
  acceptedDate: string | null;
  clientId: string | null;
  remarks: string | null;
  invitationId: string | null;
  invitationExpiryDate: string | null;
  merged: boolean;
}

export interface CaseClientResponse {
  data: CaseClient;
  errors: string[];
  meta: Record<string, unknown>;
}

export interface UpdateCaseClientRequest extends Record<string, unknown> {
  fullName: string;
  emailId?: string;
  phoneNumber?: number;
  gender: GenderAPIType;
  remarks?: string;
}

// UI form interface for editing that allows "Non-Binary" selection
export interface UpdateCaseClientFormData extends Record<string, unknown> {
  fullName: string;
  emailId: string;
  phoneNumber: number;
  gender: GenderUIOption;
  remarks?: string;
}

export interface ClientInvitationResponse {
  invitationId: string;
  isNewClient: boolean;
  clientId?: string;
}

export interface ClientAcceptInvitationRequest extends Record<string, unknown> {
  clientId?: string;
  remarks?: string;
}

export interface ClientAcceptInvitationResponse {
  clientId: string;
}

// Task related types
export enum TaskStatus {
  Open = 'Open',
  InProgress = 'InProgress',
  OnHold = 'OnHold',
  Blocked = 'Blocked',
  Closed = 'Closed'
}

export interface AddCaseTaskRequest extends Record<string, unknown> {
  title: string;
  description?: string;
  assignedToId?: string;
  dueDate?: string;
  status: TaskStatus;
  /** Optional: grant the assignee case access on save. Omit → backend defaults to ViewOnly. */
  newAssigneeContributorAccessLevel?: ContributorAccessLevel;
}

export interface UpdateCaseTaskRequest extends Record<string, unknown> {
  title: string;
  description?: string;
  assignedToId: string;
  dueDate: string;
  status: TaskStatus;
  /** Optional: grant the assignee case access on save. Omit → backend defaults to ViewOnly. */
  newAssigneeContributorAccessLevel?: ContributorAccessLevel;
}

export interface CaseTask {
  id: string;
  caseId: string;
  title: string;
  description?: string;
  assignedToId?: string;
  assignedToName?: string;
  dueDate?: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface CaseTaskResponse {
  data: CaseTask;
  errors: string[];
  meta: Record<string, unknown>;
}

// Task document related types
export interface AddTaskDocumentRequest extends Record<string, unknown> {
  name: string; // matches swagger "name" field
  content: string; // matches swagger "content" field (base64 encoded)
  remarks?: string; // matches swagger "remarks" field
}

export interface UpdateTaskDocumentRemarksRequest extends Record<string, unknown> {
  remarks: string;
}

export interface TaskDocument {
  id: string;
  name: string;
  remarks?: string;
  taskId: string;
  createdDate: string;
  createdById: string;
  content?: number[] | { data: number[] } | string; // byte array, wrapped byte array, or base64 string from individual document fetch
  // Legacy fields for backward compatibility in UI
  documentName?: string;
  documentType?: string;
  documentSize?: number;
  uploadedById?: string;
  uploadedByName?: string;
  uploadedAt?: string;
  documentPath?: string;
}

export interface TaskDocumentResponse {
  data: TaskDocument;
  errors: string[];
  meta: Record<string, unknown>;
}

export interface TaskDocumentsListResponse {
  data: TaskDocument[];
  errors: string[];
  meta: Record<string, unknown>;
}

// Case document related types (for case-wide documents)
export interface AddCaseDocumentRequest extends Record<string, unknown> {
  name: string; // matches backend "Name" field
  content: string; // base64 encoded content (converted from backend byte[])
  remarks?: string; // matches backend "Remarks" field
}

// Based on GetCaseDocumentWithoutContentResponse from backend
export interface CaseDocument {
  id: string; // matches backend "Id"
  name: string; // matches backend "Name"
  caseId: string; // matches backend "CaseId"
  remarks?: string; // matches backend "Remarks"
  createdDate: string; // matches backend "CreatedDate" (DateTimeOffset)
  createdById: string; // matches backend "CreatedById"

  // For individual document fetch (GetCaseDocumentWithContentResponse)
  content?: string | number[] | { data: number[] }; // backend "Content" byte array

  // Legacy fields for UI compatibility - map from backend fields
  documentName?: string; // maps to "name"
  uploadedById?: string; // maps to "createdById"
  uploadedAt?: string; // maps to "createdDate"

  // UI-derived fields (not from API)
  uploadedByName?: string; // derived from createdById by fetching user details
}

// Response for adding documents (AddDocumentToCaseResponse)
export interface CaseDocumentResponse {
  id: string; // only contains the ID of created document
  // Legacy wrapper for compatibility
  data?: CaseDocument;
  errors?: string[];
  meta?: Record<string, unknown>;
}

export interface CaseDocumentsListResponse {
  data: CaseDocument[];
  errors: string[];
  meta: Record<string, unknown>;
}

// Hearing related types
export enum HearingStatus {
  Open = 'Open',
  Scheduled = 'Scheduled',
  PlanningInProgress = 'PlanningInProgress',
  Planned = 'Planned',
  OnHold = 'OnHold',
  Appeared = 'Appeared',
  NotAppeared = 'NotAppeared',
  Completed = 'Completed'
}

export interface AddCaseHearingRequest extends Record<string, unknown> {
  assignedToId: string;
  hearingDateTime: string;
  status: HearingStatus;
  courtName: string;
  /** Free-text Google Maps address for the hearing location. */
  googleMapLocation?: string;
  /** Optional reference to a picked CourtLocation; omit when the venue was typed manually. */
  courtLocationId?: string;
  notes?: string;
  /** Optional: grant the assignee case access on save. Omit → backend defaults to ViewOnly. */
  newAssigneeContributorAccessLevel?: ContributorAccessLevel;
}

export interface UpdateCaseHearingRequest extends Record<string, unknown> {
  assignedToId: string;
  hearingDateTime: string;
  status: HearingStatus;
  courtName: string;
  /** Free-text Google Maps address for the hearing location. */
  googleMapLocation?: string;
  /** Optional reference to a picked CourtLocation; omit when the venue was typed manually. */
  courtLocationId?: string;
  notes?: string;
  /** Optional: grant the assignee case access on save. Omit → backend defaults to ViewOnly. */
  newAssigneeContributorAccessLevel?: ContributorAccessLevel;
}

export interface CaseHearing {
  id: string;
  caseId: string;
  assignedToId: string;
  assignedToName?: string;
  hearingDateTime: string;
  status: HearingStatus;
  courtName: string;
  /** Free-text Google Maps address for the hearing location. */
  googleMapLocation?: string;
  courtLocationId?: string;
  /** Live display label of the linked CourtLocation, if any (null/absent when none was picked). */
  courtLocationDisplay?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CaseHearingResponse {
  data: CaseHearing;
  errors: string[];
  meta: Record<string, unknown>;
}

export interface CaseHearingsListResponse {
  data: CaseHearing[];
  errors: string[];
  meta: Record<string, unknown>;
}

// Comment related types
export enum UserType {
  None = 'None',
  Client = 'Client',
  LegalIndividualExpert = 'LegalIndividualExpert',
  OrganizationAdmin = 'OrganizationAdmin',
  OrganizationClerk = 'OrganizationClerk',
  SiteAdmin = 'SiteAdmin',
  SiteClerk = 'SiteClerk',
  SiteLegalExpert = 'SiteLegalExpert',
  SiteCaseClient = 'SiteCaseClient',
  SystemAdmin = 'SystemAdmin'
}

export interface AddCaseCommentRequest extends Record<string, unknown> {
  comments: string;
  commentAddedBy: UserType;
}

export interface AddCaseCommentReplyRequest extends AddCaseCommentRequest {
  comments: string;
  commentAddedBy: UserType;
}

export interface UpdateCaseCommentRequest extends Record<string, unknown> {
  comments: string;
}

export interface CaseComment {
  id: string;
  userId: string;
  userGuid: string;
  userFullName: string;
  caseId: string;
  comments: string;
  parentCommentId: string | null;
  createdAt: string;
  updatedAt: string;
  commentAddedBy: UserType;
  replies?: CaseComment[] | null;
}

export interface AddCaseCommentResponse {
  id: string;
}

export interface AddCaseCommentReplyResponse {
  id: string;
}

export interface CaseCommentsListResponse {
  data: CaseComment[];
  errors: string[];
  meta: Record<string, unknown>;
}

// Task comment related types
export interface AddCaseTaskCommentRequest extends Record<string, unknown> {
  comments: string;
  commentAddedBy: UserType;
}

export interface AddCaseTaskCommentReplyRequest extends AddCaseTaskCommentRequest {
  comments: string;
  commentAddedBy: UserType;
}

export interface UpdateCaseTaskCommentRequest extends Record<string, unknown> {
  comments: string;
}

export interface CaseTaskComment {
  id: string;
  taskId: string;
  userId: string;
  userGuid: string;
  userFullName: string;
  comments: string;
  parentCommentId: string | null;
  createdAt: string;
  updatedAt: string;
  commentAddedBy: UserType;
  replies?: CaseTaskComment[] | null;
}

export interface AddCaseTaskCommentResponse {
  id: string;
}

export interface AddCaseTaskCommentReplyResponse {
  id: string;
}

export interface CaseTaskCommentsListResponse {
  data: CaseTaskComment[];
  errors: string[];
  meta: Record<string, unknown>;
}

// Invoice related types
export enum PaymentStatus {
  None = 'None',
  Pending = 'Pending',
  Failed = 'Failed',
  Paid = 'Paid'
}

export interface CaseInvoice {
  id: string;
  caseId: string;
  siteId: string;
  generatedDate: string;
  dueDate: string;
  paymentStatus: PaymentStatus;
  amount: number;
  invoiceFileName: string;
  invoiceContent?: string; // Base64 encoded
  remarks?: string;
  createdById: string;
  createdDate: string;
  modifiedDate?: string;
}

export interface AddCaseInvoiceRequest extends Record<string, unknown> {
  generatedDate: string;
  dueDate: string;
  paymentStatus: PaymentStatus;
  amount: number;
  invoiceFileName: string;
  invoiceContent: string; // Base64 encoded
  remarks?: string;
}

export interface UpdateCaseInvoiceRequest extends Record<string, unknown> {
  dueDate: string;
  paymentStatus: PaymentStatus;
  amount: number;
  invoiceFileName: string;
  invoiceContent: string; // Base64 encoded
  remarks?: string;
}

export interface UpdateCaseInvoicePaymentStatusRequest extends Record<string, unknown> {
  paymentStatus: PaymentStatus;
}

export interface CaseInvoiceResponse {
  data: CaseInvoice;
  errors: string[];
  meta: Record<string, unknown>;
}

export interface CaseInvoicesListResponse {
  data: CaseInvoice[];
  errors: string[];
  meta: Record<string, unknown>;
}