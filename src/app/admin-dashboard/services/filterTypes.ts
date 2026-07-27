// Per-domain filter interfaces for admin-dashboard in-scope lists.
// Source of truth: specs/035-pagination-sorting-filtering/contracts/backend-integration-guide.md §6.
// Index signature satisfies Record<string, unknown> for useListQuery / buildListParams.

export interface LegalExpertListFilters {
  expertType?: string;
  portfolio?: string;
  approvalStatus?: string;
  siteId?: string;
  search?: string;
  [key: string]: string | undefined;
}

export interface LegalExpertApprovedListFilters {
  expertType?: string;
  search?: string;
  [key: string]: string | undefined;
}

export interface ClientListFilters {
  search?: string;
  status?: string;
  [key: string]: string | undefined;
}

export interface AppointmentListFilters {
  from?: string;
  to?: string;
  [key: string]: string | undefined;
}

export interface OrderListFilters {
  status?: string;
  from?: string;
  to?: string;
  [key: string]: string | undefined;
}

export interface SettlementListFilters {
  status?: string;
  from?: string;
  to?: string;
  [key: string]: string | undefined;
}

export interface RatingListFilters {
  ratingValue?: string;
  from?: string;
  to?: string;
  [key: string]: string | undefined;
}

export interface LegalExpertCaseListFilters {
  status?: string;
  search?: string;
  [key: string]: string | undefined;
}

export interface CommunicationListFilters {
  type?: string;
  from?: string;
  to?: string;
  [key: string]: string | undefined;
}
