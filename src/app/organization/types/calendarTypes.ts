import { HearingStatus, TaskStatus } from './caseindex';

/**
 * Critical/High/Medium/Low; null/absent renders as Green/Default.
 * Fixed org-wide color mapping — see PRIORITY_COLORS below.
 */
export type Priority = 'Critical' | 'High' | 'Medium' | 'Low' | null;

export const PRIORITY_LEVELS: NonNullable<Priority>[] = ['Critical', 'High', 'Medium', 'Low'];

export const PRIORITY_COLORS: Record<NonNullable<Priority> | 'default', string> = {
  Critical: '#d32f2f', // red
  High: '#ed6c02', // orange
  Medium: '#f9a825', // yellow
  Low: '#2e7d32', // green
  default: '#2e7d32', // null/unset renders identically to Low
};

export const PRIORITY_LABELS: Record<NonNullable<Priority>, string> = {
  Critical: 'Critical',
  High: 'High',
  Medium: 'Medium',
  Low: 'Low',
};

export function priorityColor(priority: Priority | undefined): string {
  return priority ? PRIORITY_COLORS[priority] : PRIORITY_COLORS.default;
}

export type CalendarItemType = 'Hearing' | 'Task' | 'Note';

export type CalendarScope = 'org' | 'site';

export interface CalendarItemBase {
  id: string;
  itemType: CalendarItemType;
  date: string; // ISO — hearingDateTime / dueDate / noteDate
  title: string;
  priority: Priority;
  organizationId: string;
  siteId: string | null; // null = org-wide
  caseId: string | null; // null = not case-linked
  caseTitle: string | null;
  isFavouriteCase: boolean;
  createdById: string;
}

export interface HearingCalendarItem extends CalendarItemBase {
  itemType: 'Hearing';
  status: HearingStatus;
}

export interface TaskCalendarItem extends CalendarItemBase {
  itemType: 'Task';
  status: TaskStatus;
  assignedToId: string | null;
}

export interface NoteCalendarItem extends CalendarItemBase {
  itemType: 'Note';
  taggedUserIds: string[]; // no cap
}

export type CalendarItem = HearingCalendarItem | TaskCalendarItem | NoteCalendarItem;

export interface CalendarFilters {
  siteId?: string;
  favouritesOnly?: boolean;
  types?: CalendarItemType[];
}

// Notes

export interface Note {
  id: string;
  organizationId: string;
  siteId: string | null;
  caseId: string | null;
  title: string;
  body: string | null;
  noteDate: string;
  priority: Priority;
  taggedUserIds: string[];
  createdById: string;
  createdDate: string;
  updatedDate: string;
}

export interface AddNoteRequest {
  organizationId: string;
  siteId?: string;
  caseId?: string;
  title: string;
  body?: string;
  noteDate: string;
  taggedUserIds: string[];
  priority?: Priority;
}

export type UpdateNoteRequest = Partial<AddNoteRequest> & { title: string; noteDate: string };

// Org/Site-scope Tasks (created from the Calendar) — distinct from case-scoped CaseTask

export interface OrgTask {
  id: string;
  organizationId: string;
  siteId: string | null;
  caseId: string | null;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: TaskStatus;
  assignedToId: string | null;
  priority: Priority;
  createdById: string;
}

export interface AddOrgTaskRequest {
  organizationId: string;
  siteId?: string;
  caseId?: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: TaskStatus;
  assignedToId?: string;
  priority?: Priority;
}

export type UpdateOrgTaskRequest = Partial<AddOrgTaskRequest> & { title: string; status: TaskStatus };

// Case Favourite

export interface CaseFavourite {
  userId: string;
  caseId: string;
  createdDate: string;
}

// eCourts bulk import

export type ImportRowStatus = 'Created' | 'AlreadyLinked' | 'Error';

export interface EcourtsImportRowResult {
  cnrNumber: string;
  status: ImportRowStatus;
  caseId: string | null;
  error: string | null;
}

export interface EcourtsImportResponse {
  results: EcourtsImportRowResult[];
}

// Reminders (read-model, not persisted)

export interface ReminderSet {
  tasks: TaskCalendarItem[];
  hearings: HearingCalendarItem[];
  notes: NoteCalendarItem[];
  favouriteCases: import('./index').Case[];
}
