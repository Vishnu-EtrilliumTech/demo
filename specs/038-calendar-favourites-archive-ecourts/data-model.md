# Data Model: Unified Calendar, Case Favourites & Archive, and eCourts Onboarding Import

All entities below are **mock-frontend** shapes — TypeScript interfaces served by `src/prototype/router.ts` from seed state in `src/prototype/mockData.ts`, consumed through `src/app/organization/services/calendarApi.ts` (new) and `caseapi.ts` (extended). No backend/database is involved.

## Priority (shared value, not a standalone entity)

```ts
// src/app/organization/types/calendarTypes.ts
export type Priority = 'Critical' | 'High' | 'Medium' | 'Low' | null;

export const PRIORITY_COLORS: Record<NonNullable<Priority> | 'default', string> = {
  Critical: '#d32f2f', // red
  High: '#ed6c02',     // orange
  Medium: '#f9a825',   // yellow
  Low: '#2e7d32',       // green
  default: '#2e7d32',   // null/unset renders identically to Low
};
```

- Applies to: `Hearing`, `CaseHearing`, `Task`, `Note` (Event excluded — Phase 2, out of scope).
- Validation: one of the 4 literal strings, or `null`/absent (renders as default green).
- Single source of truth for color mapping — imported wherever Priority renders (Calendar grid, all item modals, Priority quick-set popover).

## CalendarItem (read-model, not persisted directly)

Discriminated union assembled by `useCalendarItems` from Hearings + Tasks + Notes already in mock data — this is a derived/view shape, not stored on its own.

```ts
export type CalendarItemType = 'Hearing' | 'Task' | 'Note';

export interface CalendarItemBase {
  id: string;
  itemType: CalendarItemType;
  date: string;            // ISO — hearingDate / dueDate / noteDate
  title: string;
  priority: Priority;
  organizationId: string;
  siteId: string | null;   // null = org-wide
  caseId: string | null;   // null = not case-linked
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
```

- Relationships: `caseId` optionally references `Case`; `siteId` optionally references `Site`; `assignedToId`/`taggedUserIds`/`createdById` reference `User`.
- Access-scoping (client-side filter, mirroring the source proposal's §4.1 rule for realism, enforced in the mock service function rather than a real authorization layer): Hearings the user's role can view; Tasks created-by-or-assigned-to the current user; Notes created-by-or-tagged-with the current user.

## Note (new entity)

```ts
export interface Note {
  id: string;
  organizationId: string;
  siteId: string | null;   // null = org-wide
  caseId: string | null;   // optional case link
  title: string;           // max 200
  body: string | null;     // max 2000
  noteDate: string;        // ISO
  priority: Priority;
  taggedUserIds: string[]; // no cap
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
```

- Validation: `title` required (≤200 chars), `body` ≤2000 chars, `noteDate` required, `taggedUserIds` each must resolve to an existing mock `User` in the same org/site (no upper-bound count).

## Task (extended — Org/Site scope; case-scoped `CaseTask` type gains `priority` only)

```ts
// Org/Site-scope task, created from the Calendar (new — distinct from case-scoped CaseTask used in TasksTab.tsx)
export interface OrgTask {
  id: string;
  organizationId: string;
  siteId: string | null;
  caseId: string | null;   // optional link
  title: string;
  description: string | null;
  dueDate: string | null;
  status: TaskStatus;       // reuse existing enum
  assignedToId: string | null;
  priority: Priority;
  createdById: string;
}
```

- `CaseTask` (existing, `caseindex.ts`) gains one field: `priority?: Priority`. No other change — case-scoped task creation/editing (`AddTaskModal.tsx`/`EditTaskModal.tsx`/`useCaseTasks.ts`) is otherwise untouched.
- `CaseHearing`/`Hearing` (existing) likewise gain only `priority?: Priority`.

## Case Favourite (new)

```ts
export interface CaseFavourite {
  userId: string;
  caseId: string;
  createdDate: string;
}
```

- Unique per `(userId, caseId)`. Mock-stored as an array in `mockData.ts`; `Case` read-models gain a derived `isFavourite: boolean` computed against the current user's favourites when case lists are fetched.

## Case (extended — Archive)

```ts
// Case (existing, types/index.ts) gains:
archivedDate: string | null; // null = active; non-null = archived, retains original creation for history
```

- Default case-list fetch excludes `archivedDate != null` rows unless `includeArchived=true` is passed.
- Archiving/unarchiving never deletes or hides the case's Hearings/Tasks/Notes from Calendar queries (FR-017) — those are looked up by date range independent of the parent case's archive status.

## eCourts Import Result (new, response-only shape)

```ts
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
```

- Mock behavior: `importEcourtsCases(orgId, siteId, cnrNumbers)` creates a new mock `Case` + link record per CNR not already linked; a CNR already present in `mockData.persistedEcourtCases`/`unlinkedCases` link table returns `AlreadyLinked`; a small deterministic subset (or a CNR matching a reserved test prefix) can be seeded to return `Error` for demoing the partial-failure UI, per Edge Cases in spec.md.

## Reminder Set (read-model, not persisted)

```ts
export interface ReminderSet {
  tasks: TaskCalendarItem[];
  hearings: HearingCalendarItem[];
  notes: NoteCalendarItem[];
  favouriteCases: Case[];
}
```

- Assembled client-side in `useReminders.ts` from `useCalendarItems` (unfiltered by site/type, scoped to current user per the access-scoping rule) plus a `favouritesOnly` case fetch — two calls combined client-side, mirroring the source proposal's §4.10 "Option A" reasoning (kept here only as a UI-composition rationale, since there is no real backend endpoint in this repo).

## Organization (extended — Calendar default filters)

```ts
// Organization (existing) gains:
defaultCalendarItemTypes: CalendarItemType[] | null; // null = all types (Hearing, Task, Note)
```

- Configured via the new minimal Org Settings page (`settings/page.tsx`), gated to `isOrganizationAdmin`.
- Read by `useCalendarItems` to seed the filter bar's initial checked types; changing the filter bar afterward affects only the current session (component state), never writes back to `defaultCalendarItemTypes`.

## State Transitions

- **Case**: Active ⇄ Archived (via Archive/Unarchive actions) — reversible, no other state affected.
- **Case Favourite**: Not-favourited ⇄ Favourited (per user, per case) — reversible toggle.
- **Priority**: Unset/Low → Medium → High → Critical, or any direct jump/clear — no ordering constraint, freely settable to any of the 4 values or null at any time, from either the item's full form or the Calendar quick-set swatch.
- **eCourts Import Row**: Pending (client-side, mid-batch) → one terminal state (Created | AlreadyLinked | Error) — not reversible or retriable within the same batch response (a fresh search+import attempt is a new batch).
