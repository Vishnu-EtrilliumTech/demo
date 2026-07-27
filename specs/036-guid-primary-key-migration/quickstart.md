# Quickstart: Verifying the GUID Primary Key Migration

This is a manual regression walkthrough matching the spec's Success Criteria (SC-001 through
SC-005). Run it against a backend already migrated to GUID primary keys, with browser storage
cleared beforehand (per the spec's clarification, stale localStorage from pre-migration sessions
is not auto-cleaned — clear it manually before testing).

## 0. Setup

1. `npm run type-check && npm run lint` — zero errors (Constitution Principle VII gate).
2. `npm run build` — succeeds.
3. Clear browser localStorage/site data for the app's origin (removes stale `profile`,
   `legalExpert`, `client` persisted Redux state from before the migration).
4. `npm run dev`, sign in fresh.

## 1. Organizations, Sites, Users (User Story 1 / P1)

1. Open the organization list, open an existing organization's detail page — confirm it loads and
   every link to its sites/users navigates correctly (no `undefined`/`NaN` in any URL).
2. Create a new site under the organization — confirm the form submits, and the app navigates to
   the new site using the identifier returned by the create response.
3. Edit the organization's details and save — confirm the UI reflects the change (this exercises
   the organization-update response field-naming quirk from `contracts/id-response-contracts.md`
   §2; verify no `undefined` id appears afterward, e.g. in the URL or in a subsequent edit).
4. Edit a site's details and save — same check for the site-update quirk (§3).
5. Create, view, and delete a user (org-level and site-level) — confirm the org-vs-site
   determination (previously `siteId === 0` vs `> 0`) still correctly routes org users to
   org-level delete and site users to site-level delete.
6. Manually navigate to a URL containing an old-style numeric id (e.g. `/organization/1`) —
   confirm a clear "not found" state renders, not a blank page or unhandled error.

## 2. Case Management (User Story 2 / P2)

Open an existing case and, for each tab:

1. **Tasks** — view existing tasks (assignee names resolve correctly), add a task with an
   assignee, edit a task's assignee (including clearing it back to "unassigned" — confirm this no
   longer silently fails), delete a task. Filter the task list by assignee.
2. **Documents** — view existing documents, upload a new one and confirm it appears without a
   page refresh (exercises the optimistic-insert rework — confirm no duplicate/ghost row and no
   console error), delete a document.
3. **Hearings** — view, add (with assignee), edit, delete; filter by assignee; confirm hearing
   list order matches `hearingDateTime`, not creation order.
4. **Comments** (case-level and task-level) — post a comment, post a reply, confirm the
   edit/delete menu appears only for the current user's own comments (exercises `userGuid`-based
   author matching), confirm author display name resolves correctly for every comment (exercises
   the task-comments `userId`-fallback fix).
5. **Contributors** — add a contributor, change their access level, remove them; confirm the
   current user's own creator/assignee/contributor-derived permissions (edit/delete visibility)
   are correct (exercises the `useCaseAccess` zero-sentinel fix — this is the highest-risk area,
   test as a non-creator/non-assignee contributor too, not just as the case creator).
6. **Clients** — add a client to the case, edit, delete, send/accept an invitation.
7. **Invoices** — add an invoice, edit it, change payment status, delete it.

Confirm zero unhandled console errors and zero failed network requests across all seven tabs.

## 3. Legal Expert / Appointment / Payment / Rating (User Story 3 / P3)

These areas are only partially implemented today (see `data-model.md` — admin-dashboard list
views use stub data; deeper flows like address creation, appointment booking, and rating replies
have no UI yet). For whatever is live at implementation time:

1. Admin dashboard: legal experts list, clients list, appointments list, payments list, ratings
   list — confirm each row renders without a broken/`NaN` id and any per-row "view detail" link
   (if present) builds a valid URL.
2. If a legal-expert address-add flow has been built by this point, confirm it correctly reads the
   plain-list response shape from `contracts/id-response-contracts.md` §4 (not
   `response.data.map(x => x.id)`).
3. If a rating-reply thread UI exists, confirm parent-child reply nesting displays correctly.

## 4. Regression checks (SC-002, SC-004, SC-005)

1. Spot-check every list view in the app (case list, task list, hearing list, document list,
   contributor list, invoice list, user list, site list, organization list) — confirm "newest
   first" / default ordering matches an explicit date field, not identifier order.
2. `npm run test` — all unit tests pass, including the updated `useCaseAccess.test.tsx` sentinel
   test (rewritten for `null`-based "no creator/assignee," not `0`-based).
3. `npm run test:e2e` (with dev server running) — all Playwright specs pass unchanged (they are
   already id-agnostic, driven by `E2E_CASE_URL`/`E2E_LIST_URL` env vars).
4. Grep the diff for any remaining `parseInt(`, `Number(` call against an id-like variable, and
   any remaining `=== 0` / `> 0` / `|| 0` pattern against an id-like variable — should return zero
   hits outside of genuinely non-id numeric fields (page numbers, amounts, phone numbers, years).
