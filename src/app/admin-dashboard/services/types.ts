// Co-located DTO shapes for the admin-dashboard in-scope list endpoints (feature 035, §6 matrix).
// These are read-only list-row shapes returned (inside the paged envelope) by the admin APIs.
// Per-domain filter typings (data-model Entity 5) are added in a later phase; Phase 3 only needs the
// item DTOs so the placeholder pages render real data against the paged response shape.

/** A row in the admin "Legal Experts" list (+ appointment-count / approved-by-status variants). */
export interface LegalExpertListItem {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  location?: string;
  expertType?: string;
  clientCount?: number;
  upcomingAppointments?: number;
  pastAppointments?: number;
  fees?: number | string;
  approvalStatus?: string;
}

/** A row in the admin "Clients" list. */
export interface ClientListItem {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  gender?: string;
  status?: string;
}

/** A row in the admin "Appointments" lists (past / pending / by-date, for experts & clients). */
export interface AppointmentListItem {
  id: string;
  legalExpertName?: string;
  clientName?: string;
  location?: string;
  mode?: string;
  appointmentDate?: string;
  appointmentTime?: string;
}

/** A row in the admin "Payments / settlements" lists (orders + payment settlements). */
export interface PaymentListItem {
  id: string;
  date?: string;
  clientName?: string;
  transactionReference?: string;
  amount?: number | string;
  status?: string;
}

/** A row in the admin "Ratings" list for a legal expert. */
export interface RatingListItem {
  id: string;
  clientName?: string;
  ratingValue?: number;
  comment?: string;
  createdDate?: string;
}

/** A case row under a specific legal expert (`legalexperts/{id}/cases`). */
export interface LegalExpertCaseListItem {
  id: string;
  title?: string;
  caseNumber?: string;
  status?: string;
  createdDate?: string;
}

/** A communication row for a legal expert (`legalExperts/{id}` communications). */
export interface LegalExpertCommunicationListItem {
  id: string;
  type?: string;
  subject?: string;
  createdDate?: string;
}
