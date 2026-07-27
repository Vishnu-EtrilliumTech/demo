# Data Model: GUID Primary Key Migration (Frontend)

This document inventories every TypeScript entity/field affected by the `number` → `string`
(GUID) identifier migration, grouped by domain, with exact file locations. Fields already typed
`string` are noted only where relevant for context (they need no change). This is the frontend
type-system surface area the implementation phase must update; it is not an exhaustive list of
every call site (see `research.md` and the task list for consuming-code changes).

Legend: **[CHANGE]** = field must move from `number`/`number | null` to `string`/`string | null`.
**[OK]** = already `string`, no change. **[NEW]** = does not exist in the codebase today; must be
designed against the spec's description when the corresponding UI is built.

## Organization

`src/app/organization/types/index.ts`

| Type | Field | Current | Status |
|---|---|---|---|
| `Organization` | `id` | `number` | **[CHANGE]** |
| `Organization` | `currentUser.id` | `number` | **[CHANGE]** |
| `Site` (relation) | `organizationId` | `number?` | **[CHANGE]** |
| `Case` (relation) | — | — | (see Case section) |

Consumers: `src/app/organization/services/api.ts` (`fetchOrganization` line 33 `orgPayload.id ||
0` fallback; `updateOrganization` lines 56-67 — response passthrough, no field remap observed —
see research.md decision on the org/site update field-naming quirk), `organization/[id]/page.tsx`
(`Number(organizationId)` coercions, e.g. line ~196 — to be removed).

## Site

`src/app/organization/types/index.ts:61-85`

| Field | Current | Status |
|---|---|---|
| `id` | `string` | **[OK]** already migrated |
| `organizationId` | `number?` | **[CHANGE]** |

Consumers: `updateSite` (`src/app/organization/services/api.ts:265-313`) — same field-naming
quirk caveat as Organization update; `AddSiteModal.tsx:155` `Number(organizationId)` coercion to
remove; `SitesTable.tsx:127`, `SiteManagementTab.tsx:375,518,535` `Number(site.id)` comparisons
to remove now that `site.id` is already `string` and the comparison target should also be
`string`.

## User (Org User / Site User / System User / Legal Expert / Client roles)

`src/app/organization/types/index.ts:23-47`

| Type | Field | Current | Status |
|---|---|---|---|
| `User` | `id` | `number` | **[CHANGE]** |
| `User` | `userId` | `number` | **[CHANGE]** |
| `User` | `organizationId` | `number` | **[CHANGE]** |
| `User` | `siteId` | `number?` | **[CHANGE]** — also carries the `0 = org-level / >0 = site-level` sentinel; must become `null`/absent vs. non-empty string (see research.md) |
| `UserBasicInfo` | `id` | `number` | **[CHANGE]** |

Consumers with numeric-sentinel or coercion risk:
- `src/app/organization/components/UserManagementTab.tsx:163,184-186` — explicit `siteId === 0`
  org-vs-site branch.
- `src/components/modals/EditUserModal.tsx:110` — `userSiteId != null && userSiteId > 0`.
- `src/app/organization/services/api.ts:376,380` — `fetchUserBasicInfo` 404/403 fallback builds
  `{ id: Number(userId), fullName: 'Unknown User' }`.
- `src/app/organization/[id]/sites/[siteId]/users/[userId]/page.tsx:143,236,433,871,881` —
  repeated `parseInt(siteId, 10)` comparisons against task/hearing `siteId`.
- `src/hooks/useUserRole.ts:48,50` — `user.id.toString()` / `userId.toString()`: harmless no-op
  once the underlying id is already a string, but downstream `Number(currentUserId)` calls (see
  `useCaseAccess.ts` below) must be removed, not the `.toString()` itself.
- `src/hooks/useCaseAccess.ts` — **authorization-critical, do not treat as a mechanical retype.**
  This hook gates case edit/delete and every case sub-resource's create/edit/delete visibility
  (Constitution Principle IV). Required change, all in one commit (a partial retype here is the
  actual risk, not the retype itself):
  - `ComputeCaseAccessInput.currentUserId` / `.createdById` / `.assignedToId` (lines 16-22):
    `number | null` → `string | null`.
  - Line 40: `const uid = currentUserId !== null && currentUserId !== 0 ? currentUserId : null;`
    → `const uid = currentUserId ? currentUserId : null;` (empty-string/`null`/`undefined` are
    the only "no user" values now — no numeric sentinel).
  - Lines 136-148: delete the `numericUserId = Number(currentUserId)` /
    `!Number.isNaN(numericUserId)` coercion entirely; pass `currentUserId` straight through as a
    string (it already arrives as `string` from `useUserRole`).
  - `UseCaseAccessArgs.createdById` / `.assignedToId` (lines 93-94): `number | null | undefined`
    → `string | null | undefined`.
  - **Preserve the existing fail-closed direction.** Today an unresolved/mismatched id already
    falls back to `uid = null`, which denies (not grants) creator/assignee/contributor-derived
    access — the string rewrite must keep that same fallback shape so an unresolved identity still
    denies rather than silently granting.
  - **Test requirement, not optional polish**: `src/hooks/useCaseAccess.test.tsx` must be updated
    in the same change — replace `CREATOR_ID`/`ASSIGNEE_ID`/`CONTRIB_ID` numeric fixtures with GUID
    strings, replace the `'currentUserId 0 with createdById 0 never matches creator/assignee'`
    test with an equivalent `''`/`null` case, **and add a new assertion that a matching GUID
    string *does* grant creator/assignee access** — the current suite only proves the sentinel
    denies; it never proves a valid id grants access, which is the case most likely to regress
    silently (buttons quietly disappear, nothing throws or fails a type check on its own since a
    stale numeric comparison against two same-shaped-but-wrong strings wouldn't be caught by
    `tsc` alone).

## Case and Case Sub-Resources

`src/app/organization/types/index.ts` (list DTOs) and
`src/app/organization/types/caseindex.ts` (detail/CRUD payload types).

### Case

| Field | Current | Status |
|---|---|---|
| `Case.id` | `string` | **[OK]** |
| `Case.assignedToId` | `number` | **[CHANGE]** |
| `Case.createdById` | `number` | **[CHANGE]** |
| `Case.siteId` | `number?` | **[CHANGE]** |
| `.../types/case.ts` `CaseData.assignedToId` | `number?` | **[CHANGE]** |
| `.../types/case.ts` `CaseData.createdById` | `number?` | **[CHANGE]** |
| `.../types/case.ts` `EditTitleFormState.assignedTo` | `number` | **[CHANGE]** |
| `.../types/case.ts` `EditFormData.assignedTo` | `number` | **[CHANGE]** |

Known non-`0` sentinel: `useCaseData.ts` uses `assignedTo: 1` (not `0`) as its "no assignee"
fallback in several places — a second, distinct sentinel convention that must also move to
`null`/`''` (there is no numeric "1" placeholder equivalent under GUIDs).

### Tasks (`CaseTask`, `TaskDocument`)

`caseindex.ts:219-297`

| Type | Field | Status |
|---|---|---|
| `AddCaseTaskRequest.assignedToId` | **[CHANGE]** |
| `UpdateCaseTaskRequest.assignedToId` | **[CHANGE]** |
| `CaseTask.id` | **[CHANGE]** |
| `CaseTask.caseId` | **[CHANGE]** |
| `CaseTask.assignedToId` | **[CHANGE]** |
| `TaskDocument.id` | **[CHANGE]** |
| `TaskDocument.taskId` | **[CHANGE]** |
| `TaskDocument.createdById` | **[CHANGE]** |
| `TaskDocument.uploadedById` | **[CHANGE]** |

Sentinel/coercion sites: `useCaseTasks.ts:93,322,342` (`assignedToId: 0` default/reset),
`useCaseTasks.ts:168-173,220-225` (falsy-numeric "no assignee" gate), `useCaseTasks.ts:529`
(`parseInt(taskFilters.assignedToId)` filter comparison — **[CHANGE]**, remove),
`EditTaskModal.tsx:161-162`, `AddTaskModal.tsx:172-173` (`parseInt(...) || 0` on the assignee
`<select>`).

### Documents (`CaseDocument`)

`caseindex.ts:299-334`

| Field | Status |
|---|---|
| `CaseDocument.id` | **[CHANGE]** |
| `CaseDocument.caseId` | **[CHANGE]** |
| `CaseDocument.createdById` | **[CHANGE]** |
| `CaseDocument.uploadedById` | **[CHANGE]** |
| `CaseDocumentResponse.id` | **[CHANGE]** |

Optimistic-insert rework required: `useCaseDocuments.ts:123-141` currently fabricates a temp row
with `id: 0`, `createdById: 0`, `uploadedById: 0` before the real server response arrives, then
discards it via a blind `setTimeout(() => fetchCaseDocumentsData(), 500)` refetch. Under GUIDs,
`0` is not a safe non-colliding placeholder value for a string-typed `id` field; this path needs
a string-safe temporary marker (e.g., a locally-generated placeholder string distinct from any
real GUID) or should be redesigned to skip the optimistic row entirely and rely on the refetch,
consistent with how Hearings/Comments/Contributors/Invoices already behave (no optimistic insert,
full refetch after mutation).

### Hearings (`CaseHearing`)

`caseindex.ts:343-385`, plus `types/index.ts:120-134` (org-level `Hearing`)

| Field | Status |
|---|---|
| `AddCaseHearingRequest.assignedToId` | **[CHANGE]** |
| `UpdateCaseHearingRequest.assignedToId` | **[CHANGE]** |
| `CaseHearing.id` | **[CHANGE]** |
| `CaseHearing.caseId` | **[CHANGE]** |
| `CaseHearing.assignedToId` | **[CHANGE]** |
| `Hearing.assignedToId` / `createdById` / `siteId` | **[CHANGE]** |

Same `assignedToId: 0` default/reset and falsy-gate pattern as Tasks
(`useCaseHearings.ts:72,80,146-150,155,208-213,225,251`); same `parseInt(...)` filter-comparison
risk at `useCaseHearings.ts:348`.

### Comments — Case Comments and Task Comments (`CaseComment`, `CaseTaskComment`)

`caseindex.ts:427-496`

| Type | Field | Status |
|---|---|---|
| `CaseComment` | `id` | **[CHANGE]** |
| `CaseComment` | `userId` | **[CHANGE]** (legacy identity field) |
| `CaseComment` | `userGuid` | **[OK]** already `string` — current identity field, no change |
| `CaseComment` | `caseId` | **[CHANGE]** |
| `CaseComment` | `parentCommentId` | **[CHANGE]** |
| `CaseTaskComment` | `id` / `taskId` / `userId` / `parentCommentId` | **[CHANGE]** |
| `CaseTaskComment` | `userGuid` | **[OK]** |
| `AddCaseCommentResponse.id`, `AddCaseCommentReplyResponse.id` | **[CHANGE]** |

**Service signature change (not just call-site coercion removal):** unlike every other
sub-resource, `src/app/organization/services/caseapi.ts`'s comment/reply functions
(`addCaseCommentReply`, `fetchCaseComment`, `updateCaseComment`, `deleteCaseComment`, and the
task-comment equivalents `addTaskCommentReply`, `fetchTaskComment`, `updateTaskComment`,
`deleteTaskComment`) currently declare `commentId`/`parentCommentId` params as strictly `number`
(not the `string | number` union used elsewhere) — these function signatures must be edited
directly to accept `string`.

**Consumer fix required:** `TaskCommentsTab.tsx:144-160`'s `getUserFullName()` fallback does
`siteUsers.find(u => u.id === comment.userId)` — a numeric-equality lookup keyed off the legacy
`userId` field for display-name resolution when `userFullName` is blank. Once `userId` is
`string`, either compare against the now-string `siteUsers[].id`, or (preferred, for consistency
with `CommentsTab.tsx`) resolve the name via `userGuid` instead. `CommentsTab.tsx` requires no
change — it already keys exclusively off `userGuid`.

### Contributors (`CaseContributor`)

`caseindex.ts:66-119`

| Field | Status |
|---|---|
| `CaseContributor.id` | **[CHANGE]** |
| `CaseContributor.caseId` | **[CHANGE]** |
| `CaseContributor.siteId` | **[CHANGE]** |
| `CaseContributor.organizationId` | **[CHANGE]** |
| `CaseContributor.userId` | **[CHANGE]** |
| `CaseContributor.addedById` | **[CHANGE]** |
| `AvailableUser.id` | **[CHANGE]** |
| `AddCaseContributorRequest.userId` | **[CHANGE]** |

`ContributorsCard.tsx:234` `onUpdate(contributorId: number, ...)` and `.../[70]` `onRemove(...)`
prop signatures need retyping alongside the type change.

### Clients (attached to a Case) (`CaseClient`)

`caseindex.ts:139-208`

| Field | Status |
|---|---|
| `CaseClient.id` | **[CHANGE]** |
| `CaseClient.caseId` | **[CHANGE]** |
| `CaseClient.clientId` | **[CHANGE]** (nullable — `null` already used correctly as "no client," no sentinel rework needed) |
| `CaseClient.invitationId` | **[OK]** already `string` |
| `ClientInvitationResponse.clientId`, `ClientAcceptInvitationRequest.clientId`,
  `ClientAcceptInvitationResponse.clientId` | **[CHANGE]** |

`useCaseClients.ts`'s `deletingClientId`/`editingClientId`/`selectedClient` fields already use
`null` (not `0`) as "none" — type changes to `string | null`, sentinel convention unchanged.

### Invoices (`CaseInvoice`)

`caseindex.ts:498-555`, plus `types/index.ts:213-249` (`Invoice`, `AddInvoiceRequest`, etc.)

| Field | Status |
|---|---|
| `CaseInvoice.id` | **[CHANGE]** |
| `CaseInvoice.caseId` | **[CHANGE]** |
| `CaseInvoice.siteId` | **[CHANGE]** |
| `CaseInvoice.createdById` | **[CHANGE]** |
| `Invoice.id`, `.caseId`, `.createdById` | **[CHANGE]** |

Flag for implementation: `useCaseInvoices.ts:144-167` builds an `UpdateCaseInvoiceRequest` object
containing an `id` field the type doesn't declare (compiles only via the type's
`Record<string, unknown>` index signature) — re-validate this against the actual backend contract
once ids are GUIDs, since a silently-extra field is easy to miss during retyping.

Cosmetic-only: `useCaseInvoices.ts:249`, `GenerateInvoiceModal.tsx:174` build a display filename
via `` `invoice_${invoice.id}` `` — will produce a GUID-length filename; not a defect, just a
by-product to be aware of, no code change required beyond the type change itself.

## Admin Dashboard List DTOs (Legal Expert, Client, Appointment, Payment, Rating — list views only)

`src/app/admin-dashboard/services/types.ts` — all currently `id: number`, all **[CHANGE]**:
`LegalExpertListItem.id`, `ClientListItem.id`, `AppointmentListItem.id`, `PaymentListItem.id`,
`RatingListItem.id`, `LegalExpertCaseListItem.id`, `LegalExpertCommunicationListItem.id`.

Per `research.md`, these are currently backed by stub/hard-coded data (see each area's own
`specs/0NN-*/plan.md`), not live endpoints — retype now so the types are correct whenever the
real endpoints are wired up, but there is no live consuming logic to fix today beyond the type
declarations themselves.

## Legal Expert Redux State (skeletal, not yet UI-driven)

`src/app/redux/legalExpert/legalExpertSlice.ts`

| Field | Status |
|---|---|
| `data.id` | **[CHANGE]** |
| `data.expertTypeId` | **[CHANGE]** |
| `data.legalExpertAddresses[].id` | **[CHANGE]** |

`src/app/redux/client/clientSlice.ts`

| Field | Status |
|---|---|
| `data.id` | **[CHANGE]** |
| `data.systemUserId` | **[CHANGE]** |

`src/app/redux/searchProfile/profileSlice.ts`

| Field | Status |
|---|---|
| `id` | **[CHANGE]** |
| `organizationId` | **[CHANGE]** |
| `userId` | **[CHANGE]** |
| `setOrganizationRole` payload `organizationId`, `userId` | **[CHANGE]** |

Pre-existing gap (not in scope to fix per spec's clarification, but noted for awareness):
`legalExpertSlice`/`clientSlice` have no `PURGE` case — `clearLegalExpertData`/`clearClientData`
exist but are never dispatched. `profileSlice`/`ecourtsSearchSlice` do handle `PURGE` correctly.

## Legal Expert Sub-Resources, Appointments, Orders/Payments, Ratings+Replies, Court/e-Courts — **[NEW]**

No implemented frontend code exists today for: legal-expert address *creation* UI (only the
Redux-state shape for already-loaded addresses exists), schedule management UI, type-portfolio
management UI, communications UI, appointment booking/detail flow, order/payment detail flow, or
rating-with-threaded-replies UI. `src/app/organization/types/ecourtTypes.ts:328,332,357,369` does
have `id: number`/`siteId: number` fields for e-Courts search-history/linked records — **[CHANGE]**
those now since that module *is* implemented.

For the remaining not-yet-built areas, this plan's task list scopes work as: **when this UI is
built** (in this feature or a follow-up), it must be designed against GUID-shaped ids from the
start (no numeric id introduced), and must specifically implement the two documented response
quirks from the spec (FR-006 org/site update field naming, FR-007 address-creation plain-list
response) as data-consumption logic once the real endpoint contracts are available to confirm the
exact shape. This is recorded as an open item in Complexity Tracking, not silently dropped.

## Shared / Cross-Cutting Types

- `src/types/pagination.ts` — `PagedResponse<T>`, `PageRequestParams`, `ListQueryState<F>`: no id
  fields; `sortBy` is a free-form `string`. **No change needed.**
- No shared `type Id = number` alias exists anywhere in `src/` — confirmed via search. Each
  domain module's inline `id`/`xxxId` fields are the actual change surface; there is no single
  choke-point type to edit.
- `src/utils/validation.ts` — no id-specific validation rule exists today (`ValidationRule.type`
  has no `'id'`/`'guid'` variant). **No change required** unless implementation adds client-side
  GUID-format validation as a new, explicitly-requested enhancement (not required by any FR).
