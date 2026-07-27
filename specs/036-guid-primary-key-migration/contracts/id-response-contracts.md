# Contracts: Identifier-Bearing Response Shapes (Frontend Consumption)

This feature has no outbound public API of its own — it is a consumer of the existing Lawsome
backend API. The "contract" that matters here is the frontend's consumption logic for identifier
fields in backend responses. This document specifies the response shapes the frontend must
correctly parse after the GUID migration, focused on the irregular cases called out by the spec
(FR-006, FR-007, FR-008) plus the service function signatures that must change.

## 1. Standard identifier shape (baseline — most endpoints)

Per Constitution Principle VIII, list/detail responses wrap the entity in an envelope. The
entity's own identifier is a top-level `id` field, and every foreign-key reference uses an
`xxxId` naming convention (`caseId`, `assignedToId`, `createdById`, `siteId`, `organizationId`,
`userId`, etc.). Post-migration, every one of these fields is a GUID string, e.g.:

```json
{
  "success": true,
  "data": {
    "id": "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
    "caseId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "assignedToId": "e2f8b1c4-1a2b-4c3d-8e9f-0a1b2c3d4e5f",
    "createdById": "b3a1d2e4-5f6a-7b8c-9d0e-1f2a3b4c5d6e"
  }
}
```

Frontend rule: consume every `id`/`xxxId` field as an opaque `string`. Do not `Number()`,
`parseInt()`, or numerically compare it. Do not treat `""`/`null`/`undefined` interchangeably
with a numeric `0` sentinel — treat absence/emptiness as the sole "not set" signal.

## 2. Organization update response — non-standard identifier field name (FR-006)

**Current frontend behavior**: `updateOrganization()`
(`src/app/organization/services/api.ts:56-67`) returns `response.data` unchanged with no field
remapping. **Per FR-006, the organization update response labels the organization's own
identifier with a field name other than `id`.**

**Contract to implement**: Before this can be finalized, confirm the actual field name against
the live/updated backend response for `PUT /api/v1/organizations/{id}`. Until confirmed, the
consuming code in `updateOrganization()` must:
1. Read the entity's own identifier from whatever field the response actually uses (candidates to
   check first, in order of likelihood based on existing backend naming conventions observed
   elsewhere in this codebase: `organizationId`, `organizationGuid`).
2. Normalize it into the `Organization.id` field the rest of the frontend expects, so every
   caller of `updateOrganization()` continues to read `result.id` without needing to know about
   the quirk.
3. Add a regression test (or a manual quickstart step — see `quickstart.md`) that asserts the
   normalized `id` is present and non-empty after an update, specifically to catch a silent
   `undefined` id if the field name assumption is wrong.

## 3. Site update response — non-standard identifier field name (FR-006)

Same contract as §2, applied to `updateSite()` (`src/app/organization/services/api.ts:265-313`),
for `PUT /api/v1/organizations/{organizationId}/sites/{siteId}`. Candidate field names to check
first: `siteId`, `siteGuid`. Normalize into `Site.id` at the service-function boundary so callers
(`EditSiteModal.tsx:182`) are unaffected by the naming quirk.

## 4. Legal-expert address creation response — plain list, not list of objects (FR-007)

**Current frontend behavior**: no consuming code exists yet (see `data-model.md` — this UI is not
yet implemented). **Per FR-007, the response is a plain list of identifiers** (e.g.,
`string[]`), not a list of `{ id, ...address fields }` objects.

**Contract to implement when this UI is built**:

```json
{
  "success": true,
  "data": ["3f2504e0-4f89-11d3-9a0c-0305e82c3301", "7c9e6679-7425-40de-944b-e07fc1f90ae7"]
}
```

The consuming code must read `response.data` as `string[]` directly — **not** attempt
`response.data.map(item => item.id)`, which would silently produce `undefined` entries against
this shape. Whatever local address-list state is updated after a successful add must merge these
raw id strings against the already-known address objects (e.g., by re-fetching the full address
list, or by pairing each returned id with the just-submitted address payload in order).

## 5. Case comment / task comment — dual identity fields (FR-008)

Already fully implemented and correctly separated in the frontend (see `data-model.md` and
`research.md`): `CaseComment`/`CaseTaskComment` responses carry both:

```json
{
  "id": "…",
  "userId": "…",      // legacy identity field — migrating from number to string
  "userGuid": "…",     // current identity field — already string, used for author-match/edit gating
  "userFullName": "…"
}
```

Contract: `userGuid` is authoritative for "is this comment mine" (edit/delete gating) — this is
already correct in `CommentsTab.tsx` and must not change. `userId` is retyped to `string` but its
only remaining consumer (`TaskCommentsTab.tsx`'s display-name fallback) should be updated to
prefer `userGuid`-based resolution for consistency, per `data-model.md`.

## 6. Service function signatures requiring an explicit parameter-type change

The following functions in `src/app/organization/services/caseapi.ts` currently declare
`commentId`/`parentCommentId` parameters as strictly `number` (not the `string | number` union
used by every other id-accepting function in this file) and must be changed to `string`:

- `addCaseCommentReply(..., parentCommentId: number, ...)`
- `fetchCaseComment(..., commentId: number)`
- `updateCaseComment(..., commentId: number, ...)`
- `deleteCaseComment(..., commentId: number)`
- `addTaskCommentReply(..., taskId, parentCommentId: number, ...)`
- `fetchTaskComment(..., commentId: number)`
- `updateTaskComment(..., commentId: number, ...)`
- `deleteTaskComment(..., commentId: number)`

## 7. Not-found contract (FR-005)

Per Constitution Principle VIII, a 404 response arrives as the standard failure envelope
(`{ "success": false, "message": "...", "errors": [] }`) with HTTP status 404. This is
already handled generically by `src/utils/errorHandler.ts`'s `classifyListError`/
`isNotFoundError` (status-code driven, not id-value driven) — no change needed there. The
contract for this feature is at the **UI** layer: every route that resolves an entity by id from
a URL path segment must render a clear "not found" state (matching the existing per-route pattern
seen in `.../cases/[caseId]/page.tsx:399-423`, not a generic Next.js `notFound()`) when the fetch
fails with a not-found classification — including when the URL segment is a malformed or
legacy-style (numeric) id, which will simply fail to resolve against the GUID-based backend and
surface the same 404 path. No special "detect legacy numeric id" branch is required or desired —
uniform 404 handling already satisfies FR-005 as long as every entity-by-id route has an explicit
not-found branch (some routes may currently rely only on a generic error branch; task breakdown
must verify each in-scope route explicitly distinguishes not-found from other errors, consistent
with the existing case-detail page's error-message string-matching pattern).
