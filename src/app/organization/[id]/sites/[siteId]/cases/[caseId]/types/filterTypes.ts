// Per-domain filter interfaces for case-scoped in-scope lists.
// Source of truth: specs/035-pagination-sorting-filtering/contracts/backend-integration-guide.md §6.
// Index signature satisfies Record<string, unknown> for useListQuery / buildListParams.

export interface DocumentListFilters {
  type?: string;
  uploaderId?: string;
  from?: string;
  to?: string;
  search?: string;
  [key: string]: string | undefined;
}

export interface CommentListFilters {
  authorId?: string;
  from?: string;
  to?: string;
  [key: string]: string | undefined;
}

export interface TaskListFilters {
  status?: string;
  assigneeId?: string;
  priority?: string;
  from?: string;
  to?: string;
  [key: string]: string | undefined;
}

export interface TaskAssigneeListFilters {
  status?: string;
  priority?: string;
  [key: string]: string | undefined;
}

export interface TaskCommentListFilters {
  authorId?: string;
  [key: string]: string | undefined;
}

export interface TaskDocumentListFilters {
  type?: string;
  uploaderId?: string;
  [key: string]: string | undefined;
}

export interface InvoiceListFilters {
  status?: string;
  from?: string;
  to?: string;
  [key: string]: string | undefined;
}

export interface CaseHearingListFilters {
  from?: string;
  to?: string;
  court?: string;
  [key: string]: string | undefined;
}

export interface CaseClientListFilters {
  search?: string;
  [key: string]: string | undefined;
}

export interface ContributorListFilters {
  role?: string;
  search?: string;
  [key: string]: string | undefined;
}

export interface AvailableUserListFilters {
  siteId?: string;
  role?: string;
  search?: string;
  [key: string]: string | undefined;
}
