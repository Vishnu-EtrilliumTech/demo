# Research: GUID Primary Key Migration (Frontend)

## Context

The backend has migrated every entity's primary key (and every foreign-key reference to those
entities) from `int` to `Guid`/`string`. This is a frontend-only, codebase-wide correctness
change: retype every affected TypeScript field, remove numeric coercions that no longer apply,
and fix logic that silently assumed numeric identifiers (zero-sentinels, id-based sort/compare,
`parseInt`/`Number()` calls on route params and filter values).

There is no single "backend reference document" checked into this repo; the migration's shape
was supplied directly by the user during specification and is captured in `spec.md`. This
research phase instead inventories the **current** frontend code to determine exactly what must
change. Findings below come from direct code search (Grep/Read) and three internal exploration
passes across the codebase (case domain, cross-cutting Redux/routing/validation, and manual
follow-up for organization/site/user and legal-expert/appointment/payment/rating areas — two of
four scheduled exploration passes hit a session limit and were completed via direct code search
instead of a sub-agent).

## Decision: Migration is a per-field retype, not a structural rewrite

**Decision**: Every `number`-typed field that represents an entity's own id or a foreign-key
reference to another entity's id becomes `string`. Fields that already read `id: string` /
`xxxId: string` (e.g., `Case.id`, `Hearing.id`, `Task.id`, `Site.id`, `CaseComment.userGuid`) are
left untouched — the codebase is **already partway migrated** (route-level entities were
switched to string ids in an earlier pass; nested/related-entity references were not).

**Rationale**: Confirmed by direct inspection of `src/app/organization/types/index.ts` and
`src/app/organization/types/caseindex.ts` — `Case`, `Hearing`, `Task`, `Site` already declare
`id: string`, but every *foreign-key* field on those same interfaces (`assignedToId`,
`createdById`, `siteId` used as a relation, `organizationId`) is still `number`. This means the
migration is finishing a job that's already in progress, not starting from zero.

**Alternatives considered**: A generic `type EntityId = string` alias applied everywhere was
considered, but rejected — there is no existing shared `Id` type in `src/types/` to hang it from
(confirmed via grep: no `type Id =`/`EntityId` alias exists anywhere in `src/`), and introducing
one now is a larger refactor than the spec calls for. Each domain module keeps its inline
`id: string` / `xxxId: string` fields, consistent with current convention.

## Decision: Treat numeric coercions (`Number()`, `parseInt()`) as removals, not retypes

**Decision**: Every `Number(idVar)` / `parseInt(idVar, 10)` call found against an id-like
variable is deleted; the string value is passed through unchanged.

**Rationale**: These coercions exist today *only* because Next.js route params and filter query
values already arrive as `string`, while internal state/types still expect `number`. Once the
target type is also `string`, the coercion step serves no purpose and — worse — actively breaks
things (`Number(guid)` → `NaN`, `parseInt(guid, 10)` → `NaN`). This was confirmed as the single
largest, most mechanical bucket of changes across the research (~20 call sites sampled across
`useCaseAccess.ts`, `organization/services/api.ts`, `useCaseDocuments.ts`, `useCaseHearings.ts`,
`useCaseTasks.ts`, `AddCaseModal.tsx`, `AddSiteModal.tsx`, `organization/[id]/page.tsx`,
`organization/[id]/sites/[siteId]/users/[userId]/page.tsx`, task/hearing edit modals).

**Alternatives considered**: Keeping a coercion but changing it to `String()` was considered for
defensive normalization, but rejected as unnecessary — values are already strings at every one of
these call sites once the upstream type is corrected; a no-op `String()` call would be dead code
under Principle "no code without purpose."

## Decision: Numeric zero-sentinel patterns must switch to `null`/empty-string, one at a time

**Decision**: Every place that uses `0` (or `=== 0` / `> 0`) as a stand-in for "no id selected" /
"unassigned" is rewritten to use `null`, `undefined`, or `''` consistently with how the
surrounding code already represents "empty" elsewhere.

**Rationale**: A GUID string is never numerically `0`, so any `=== 0` check silently stops
matching, changing behavior without throwing. This is the highest-risk category identified
because it fails *silently* rather than at compile time. Confirmed concrete instances:
- `src/hooks/useCaseAccess.ts:39-42` — explicit, commented `0`-or-`null` sentinel for "no
  creator/assignee," gating case edit/delete/task/hearing/comment/contributor permissions app-wide.
- `src/app/organization/components/UserManagementTab.tsx:163,184-186` — explicit comment:
  `siteId > 0 = site user → site-level delete; 0/null = org user → org-level delete`.
- `src/components/modals/EditUserModal.tsx:110` — `userSiteId != null && userSiteId > 0`.
- `src/components/modals/HearingModal.tsx:177` — `formData.assignedToId === 0 ? "" : ...`.
- `useCaseTasks.ts` / `useCaseHearings.ts` / `EditTaskModal.tsx` / `AddTaskModal.tsx` — repeated
  `assignedToId: 0` as form-reset/default value, and `!taskDataForApi.assignedToId` used as an
  "unassigned" gate before deleting a payload key.
- `useCaseDocuments.ts:123-141` — optimistic document insert uses `id: 0`, `createdById: 0`,
  `uploadedById: 0` as placeholder values for a row not yet confirmed by the server, then discards
  it via a blind `setTimeout` refetch rather than an id-based reconciliation.

Note one **different** existing convention already uses `null` correctly and needs no change:
`useCaseClients.ts`'s `deletingClientId`/`editingClientId: number | null` fields already use
`null` as "none," not `0` — only the *type* (`number` → `string`) changes there, not the sentinel
convention.

**Alternatives considered**: Introducing a sentinel constant (e.g., `UNASSIGNED_ID = ''`) was
considered for discoverability, but rejected as an unrequested abstraction — each call site's
existing `null`/`''`/`undefined` idiom is preserved, just applied consistently.

## Decision: Dual identity fields on case/task comments are already correctly separated

**Decision**: No change needed to `CaseComment`/`CaseTaskComment`'s `userGuid: string` field or
to `CommentsTab.tsx`'s use of it for author-match/edit-delete gating. The field that must migrate
is `userId: number` → `string`, and the one place that still keys off `userId` numerically
(`TaskCommentsTab.tsx:151-152`, a display-name fallback lookup: `siteUsers.find(u => u.id ===
comment.userId)`) must be updated to compare against the (now-string) `userId`/`siteUsers[].id`,
or preferably be redirected to compare against `userGuid` instead, matching the pattern already
used by `CommentsTab.tsx`.

**Rationale**: `CaseComment`/`CaseTaskComment` already carry both `userId: number` (legacy) and
`userGuid: string` (current) per `src/app/organization/types/caseindex.ts:427-439,470-482`. This
exactly matches spec FR-008 ("two different identity-related fields for the same user... using
each for its correct purpose without conflating them") — confirming the spec's phrasing was
written directly against this code. `CommentsTab.tsx` already exclusively trusts `userGuid` for
author identity; `TaskCommentsTab.tsx` is the one place with a residual numeric fallback that
must be reconciled during implementation.

**Alternatives considered**: Removing `userId` from the types entirely was considered but
rejected — it's out of scope (the backend still sends both fields per the spec) and removing a
field the backend still returns is not this migration's job; only its *type* changes to `string`.

## Decision: Organization/Site update response field-naming quirk and address-list response shape cannot be verified from current frontend code — flag as an implementation-time contract check

**Decision**: `data-model.md` documents the *current* response-consumption code for
`updateOrganization`/`updateSite` and the (not-yet-implemented) legal-expert address-creation
endpoint, and flags that the exact non-standard field name (FR-006) and plain-list shape (FR-007)
must be confirmed against the live/updated backend contract during implementation, since neither
quirk is observable in the current frontend source (the current code paths return the row
unchanged: `return response.data?.data || response.data;` with no field remapping).

**Rationale**: `updateOrganization`/`updateSite` in `src/app/organization/services/api.ts:56-67`
and `:265-313` return the raw response body with no field-name handling today, and their only
call sites (`organization/[id]/page.tsx:287`, `EditSiteModal.tsx:182`) consume the *request*
echo, not a differently-named id field — so the quirk described in the spec is a **backend
behavior that does not yet have corresponding frontend code to inspect**. Similarly, no legal-
expert address-creation UI exists in `src/` yet (see next decision) — there is nothing to
inspect for the "plain list of identifiers" response shape. Both are net-new consumption code to
be written against the documented (spec-supplied) contract rather than existing code to retrofit.

**Alternatives considered**: Blocking planning on obtaining the original backend reference
document was considered, but rejected — the spec's FR-006/FR-007 already fully describe the
required behavior (non-standard field name for org/site update; plain list for address create),
which is sufficient to design the data model and task list; the exact field name is an
implementation-time detail to confirm against the live API, not a planning blocker.

## Decision: Legal-expert address/schedule/portfolio, appointment booking, order/payment, and rating-reply UI do not yet exist in this repo — User Story 3 scope is "build to spec," not "migrate existing code"

**Decision**: `data-model.md` and the task breakdown treat User Story 3's areas differently from
User Stories 1–2: rather than "retype existing fields," the plan notes that the *only* existing
code in these areas is (a) a skeletal, mostly-unused `legalExpertSlice`/`clientSlice` Redux state
(`src/app/redux/legalExpert/legalExpertSlice.ts`, `src/app/redux/client/clientSlice.ts`) with
numeric `id`/`expertTypeId`/`systemUserId` fields, and (b) read-only, list-row-only admin-
dashboard views (`src/app/admin-dashboard/{legal-experts,appointment-list,payment-list,client-
list}/page.tsx` + `src/app/admin-dashboard/services/types.ts`) whose DTOs (`LegalExpertListItem`,
`AppointmentListItem`, `PaymentListItem`, `RatingListItem`, `ClientListItem`) are all
`id: number` today and, per each area's own `specs/0NN-*/plan.md`, are explicitly documented as
using **hard-coded/stub data**, not live endpoints. No address-add screen, appointment-booking
flow, order/payment detail view, or rating-reply thread UI exists in `src/` to migrate.

**Rationale**: Direct search (`grep -rl "legalExpertId\|expertId"`, `find ... -iname "*address*"
-o -iname "*schedule*" -o -iname "*portfolio*"`) found no implementation beyond the admin list
pages and the two Redux slices. `specs/030-payment-settlements/plan.md` explicitly states the
existing admin payments page uses "hard-coded data, stub fetch." This means User Story 3, as
scoped in the spec, is partly aspirational relative to current app state: the safe, correct
migration action is (1) retype the `number` id fields that do exist in the admin list DTOs and
the two Redux slices now, so nothing regresses when those screens go live, and (2) treat the
deeper address/appointment/order/rating-reply flows described in the spec's acceptance scenarios
as scope to verify **if and when** that code exists — flagged explicitly in Complexity
Tracking / Assumptions rather than silently dropped.

**Alternatives considered**: Reporting this as a spec defect and stopping was considered, but
rejected — the spec's P3 framing ("important but used less frequently... several of them have
known response-shape quirks that are easy to miss") already anticipates thin/uncertain coverage
here; the correct response is to scope precisely, not to block planning.

## Decision: Redux-Persist has no version/migrate guard, and two slices never clear on PURGE

**Decision**: Out of scope for this feature per the spec's own clarification (no automatic
persisted-state cleanup — developers manually clear browser storage), but recorded here as a
**pre-existing gap** worth flagging in `data-model.md`: `legalExpertSlice` and `clientSlice` have
no `PURGE` handling at all (`clearLegalExpertData`/`clearClientData` actions exist but are never
dispatched anywhere in `src/`), unlike `profileSlice` and `ecourtsSearchSlice` which do handle
`PURGE`. This means even the manual "clear browser storage" mitigation the spec relies on is the
*only* mitigation — there is no logout-triggered cleanup today for these two slices either.

**Rationale**: Confirmed via `src/app/redux/store/store.ts` (persist whitelist config) and each
slice file. This doesn't change the plan's scope (the spec explicitly rejected auto-purge logic),
but implementers should not assume logout clears stale numeric ids from these two slices.

**Alternatives considered**: N/A — this is a documentation-only finding per the spec's explicit
clarification answer; no decision to make.

## Decision: No dedicated mock-data factory exists; sequential numeric ids are inline per-test-file literals

**Decision**: Task breakdown will enumerate specific test files with inline numeric id literals
to update, rather than pointing at a shared fixture module (none exists).

**Rationale**: Confirmed via search — no `__mocks__` directory or fixture factory file exists
under `src/`. Known files with inline sequential numeric ids: `src/hooks/useCaseAccess.test.tsx`
(includes a test whose name/assertions directly encode the `0`-sentinel behavior:
`'currentUserId 0 with createdById 0 never matches creator/assignee'` — must be rewritten, not
just retyped, once the sentinel becomes `null`), `.../hooks/useAvailableContributorUsers.test.tsx`,
`src/components/modals/EditContributorAccessModal.test.tsx`. E2E specs under `e2e/` are already
id-agnostic (`E2E_CASE_URL`-driven, no hardcoded ids); only illustrative comments in
`e2e/helpers/env.ts` (`/organization/1/sites/2/cases/3`) reference numeric ids and are cosmetic.

**Alternatives considered**: Building a shared fixture factory as part of this migration was
considered (would reduce future duplication), but rejected as scope creep beyond "fix the
identifier format" — matches the "don't add abstractions beyond what the task requires"
guidance.

## Testing approach

**Decision**: Continue using Vitest + React Testing Library for unit tests (existing pattern) and
Playwright for E2E (existing pattern, already id-agnostic). No new testing framework or tooling
is introduced.

**Rationale**: Constitution Principle III and existing `package.json` scripts already establish
this; the migration changes test *data* (GUID-shaped literals instead of sequential numbers) and,
in `useCaseAccess.test.tsx`'s case, test *semantics* (sentinel behavior), not test tooling.
