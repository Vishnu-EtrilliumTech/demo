// Per-domain filter interfaces for org-level in-scope lists.
// Parameterise ListQueryState['filters'] in useListQuery (Principle I).
// Source of truth: specs/035-pagination-sorting-filtering/contracts/backend-integration-guide.md §6.
//
// The [key: string]: string | undefined index signature satisfies the `Record<string, unknown>`
// constraint required by useListQuery / buildListParams (all filter values are string | undefined).

export interface CaseListFilters {
  status?: string;
  siteId?: string;
  assignedExpertId?: string;
  clientId?: string;
  from?: string;
  to?: string;
  search?: string;
  /** "true" to restrict to the current user's favourited cases (§4.6). */
  favouritesOnly?: string;
  /** "true" to include archived cases (excluded by default, §4.7). */
  includeArchived?: string;
  [key: string]: string | undefined;
}

export interface SiteCaseListFilters {
  status?: string;
  assignedExpertId?: string;
  clientId?: string;
  from?: string;
  to?: string;
  search?: string;
  /** "true" to restrict to the current user's favourited cases (§4.6). */
  favouritesOnly?: string;
  /** "true" to include archived cases (excluded by default, §4.7). */
  includeArchived?: string;
  [key: string]: string | undefined;
}

export interface UnlinkedCaseListFilters {
  search?: string;
  [key: string]: string | undefined;
}

export interface OrgUserListFilters {
  siteId?: string;
  role?: string;
  status?: string;
  search?: string;
  [key: string]: string | undefined;
}

export interface SiteUserListFilters {
  role?: string;
  status?: string;
  search?: string;
  [key: string]: string | undefined;
}

export interface SystemUserListFilters {
  role?: string;
  search?: string;
  [key: string]: string | undefined;
}

export interface SiteListFilters {
  search?: string;
  status?: string;
  [key: string]: string | undefined;
}

export interface OrganizationListFilters {
  search?: string;
  status?: string;
  [key: string]: string | undefined;
}

export interface SiteUsersByUserListFilters {
  search?: string;
  [key: string]: string | undefined;
}

export interface OrgHearingListFilters {
  from?: string;
  to?: string;
  siteId?: string;
  caseId?: string;
  court?: string;
  [key: string]: string | undefined;
}

export interface SiteHearingListFilters {
  from?: string;
  to?: string;
  caseId?: string;
  court?: string;
  [key: string]: string | undefined;
}

export interface PersistedEcourtListFilters {
  cnr?: string;
  title?: string;
  linkedCaseId?: string;
  [key: string]: string | undefined;
}
