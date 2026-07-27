# Tasks: Ratings

**Feature**: `019-ratings`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Status**: Everything new — no rating submission, update, delete, or admin verification UI exists.

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1]**: Client Rates a Legal Expert (P1)
- **[US2]**: Legal Expert Views Their Ratings (P2)
- **[US3]**: Client Updates or Deletes Own Rating (P3)
- **[US4]**: Admin Verifies Ratings (P4)

---

## Phase 1: Setup

**Purpose**: Define types and create scaffolding.

- [ ] T001 Create `src/app/organization/types/ratings.ts` — define `Rating`, `RatingReply`, `CreateRatingRequest`, `UpdateRatingRequest`, `VerifyRatingRequest`; fields: `id`, `expertId`, `clientId`, `stars: number`, `comment?: string`, `isVerified: boolean`, `createdAt: string`, `replies: RatingReply[]`
- [ ] T002 [P] Create directory structure: `src/app/legalexpert/[expertId]/components/RatingsSection/`, `src/app/admin/ratings/`
- [ ] T003 [P] Create `src/app/organization/services/ratingsApi.ts` scaffold — empty exported functions: `fetchExpertRatings`, `createRating`, `updateRating`, `deleteRating`, `addRatingReply`, `fetchUnverifiedRatings`, `verifyRating`

**Checkpoint**: Types and directories in place — begin building

---

## Phase 2: UI

**Purpose**: Build all ratings UI components.

- [ ] T004 [US1] Create `src/app/legalexpert/[expertId]/components/RatingsSection/AddRatingModal.tsx` — MUI `Dialog`; star selector: `<Rating precision={1} max={5} />` controlled; optional comment `<TextField multiline rows={3} />`; submit disabled while `submitting`
- [ ] T005 [US3] Create `src/app/legalexpert/[expertId]/components/RatingsSection/EditRatingModal.tsx` — same as `AddRatingModal` but pre-fills current `Rating` object; reuse schema
- [ ] T006 [US1] Create `src/app/legalexpert/[expertId]/components/RatingsSection/ReplyInput.tsx` — inline `TextField` + submit button; appears below rating card; `disabled={replyText.trim() === ''}`
- [ ] T007 [US1] Create `src/app/legalexpert/[expertId]/components/RatingsSection/RatingCard.tsx` — props: `{ rating: Rating, isOwner: boolean, onEdit, onDelete, onReply }`; MUI `Chip` verified badge: `color="success"` if `isVerified`, `color="warning"` if not; replies indented under card; Edit + Delete buttons only if `isOwner`
- [ ] T008 [US1] Create `src/app/legalexpert/[expertId]/components/RatingsSection/RatingsSection.tsx` — role-based rendering: Client → "Rate This Expert" button + `AddRatingModal`; LegalExpert → read-only list; SystemAdmin → read-only on this page; empty state: "No ratings yet."
- [ ] T009 [US4] Create `src/app/admin/ratings/page.tsx` — SystemAdmin ratings management page (`"use client"`)
- [ ] T010 [US4] Create `src/app/admin/ratings/components/UnverifiedRatingsList.tsx` — paginated MUI `Table`; columns: Expert name, Client name, Stars, Comment (truncated), Submitted date, "Verify" action; `Verify` button calls `verifyRating(ratingId)` and updates row status in-place
- [ ] T011 Create `src/app/legalexpert/[expertId]/components/RatingsSection/index.ts` barrel export

**Checkpoint**: All UI components renderable — verify visually

---

## Phase 3: Logic

**Purpose**: Build `useRatings` hook and wire to components.

- [ ] T012 [US1] Create `src/app/legalexpert/[expertId]/hooks/useRatings.ts` — state: `ratings`, `loading`, `submitting`, `addRatingOpen`, `editRatingOpen`, `ratingToEdit`, `ratingToDelete`; methods: `fetchRatings()`, `createRating()`, `updateRating()`, `deleteRating()`, `addReply()`
- [ ] T013 [US1] Implement `createRating` in `useRatings` — validate `stars >= 1` before API call (reject 0 stars); on 201: append new rating to list with `isVerified: false` (optimistic, not waiting for admin); calls `showSuccess("Your rating has been submitted.")`
- [ ] T014 [US1] Implement star validation guard in `AddRatingModal` submit handler: `if (stars < 1) { setError("Rating must be between 1 and 5 stars."); return; }` — do NOT rely solely on MUI `Rating` component behavior
- [ ] T015 [US3] Implement `updateRating` in `useRatings` — on 200 updates rating in list; calls `showSuccess`
- [ ] T016 [US3] Implement `deleteRating` in `useRatings` — confirmation dialog required before API call; on 204 removes rating from list
- [ ] T017 [US1] Implement `addReply` in `useRatings` — on 201 appends reply under parent rating in state
- [ ] T018 [US4] Implement `verifyRating` in `UnverifiedRatingsList` local handler — on 200 updates row `isVerified = true` in-place (no full list re-fetch)
- [ ] T019 Implement `isOwner` check in `RatingsSection`: `rating.clientId === currentUserId` (from Keycloak token `sub`)

**Checkpoint**: Full CRUD flow working

---

## Phase 4: API

**Purpose**: Implement all rating API service functions.

- [ ] T020 Implement all functions in `src/app/organization/services/ratingsApi.ts`:
  - `fetchExpertRatings(expertId: string)` → `GET /legalexperts/{expertId}/ratings`
  - `createRating(expertId: string, payload: CreateRatingRequest)` → `POST /legalexperts/{expertId}/ratings` returns `Rating` on 201
  - `updateRating(expertId: string, ratingId: string, payload: UpdateRatingRequest)` → `PUT /legalexperts/{expertId}/ratings/{ratingId}`
  - `deleteRating(expertId: string, ratingId: string)` → `DELETE /legalexperts/{expertId}/ratings/{ratingId}` — expects 204
  - `addRatingReply(expertId: string, ratingId: string, payload: { text: string })` → `POST /legalexperts/{expertId}/ratings/{ratingId}/replies`
  - `fetchUnverifiedRatings(params: { page: number, pageSize: number })` → `GET /ratings?verified=false`
  - `verifyRating(ratingId: string)` → `PATCH /ratings/{ratingId}/verify`
- [ ] T021 All functions use `httpServices` Axios with Bearer token; errors via `errorHandler.ts`

**Checkpoint**: All API functions implemented and typed

---

## Phase 5: Backend

**Purpose**: Confirm backend contract (no frontend code changes).

- [ ] T022 Confirm all rating API endpoints exist; note these are all NEW — coordinate with backend team before frontend build
- [ ] T023 Confirm `POST /legalexperts/{expertId}/ratings` is gated with `[Authorize(Roles = "Client")]` — non-Client users get 403
- [ ] T024 Confirm `PUT` and `DELETE` on ratings validate `createdById === currentUserId` — returns 403 on mismatch
- [ ] T025 Confirm `PATCH /ratings/{ratingId}/verify` is gated with `[Authorize(Roles = "SystemAdmin")]`
- [ ] T026 Confirm `Rating` response body includes `isVerified: false` on creation — used for optimistic unverified badge

---

## Phase 6: Security

**Purpose**: Enforce all security requirements from plan.md §6.

- [ ] T027 [US1] Verify "Rate This Expert" button is hidden for LegalExpert and non-Client roles — only rendered for `currentUserRole === 'Client'`
- [ ] T028 [US3] Verify `isOwner` uses `rating.clientId === keycloak.tokenParsed.sub` — not display name or email comparison
- [ ] T029 [US1] Verify star value guard `stars >= 1` in submit handler — MUI `<Rating>` can return 0 if user deselects; cannot trust component alone
- [ ] T030 [P] Verify all comment and reply text rendered as React text nodes — no `dangerouslySetInnerHTML`
- [ ] T031 [US4] Verify admin ratings page has route guard: redirects non-SystemAdmin roles from `/admin/ratings`
- [ ] T032 [US1] Verify new rating added to local state with `isVerified: false` before backend confirms — SC-002 requires unverified badge on first render

---

## Phase 7: Testing

**Purpose**: Build all unit tests and E2E tests from plan.md §8.

- [ ] T033 [P] [US1] Create `src/app/legalexpert/[expertId]/components/RatingsSection/__tests__/RatingsSection.test.tsx`:
  - Client role → "Rate This Expert" button visible
  - Expert role → "Rate This Expert" button absent
  - Client's own rating → Edit + Delete controls visible
  - Another user's rating for client → no Edit/Delete controls
  - Empty ratings list → "No ratings yet." empty state
  - New rating → "Unverified" chip in DOM
- [ ] T034 [P] [US1] Create `src/app/legalexpert/[expertId]/components/RatingsSection/__tests__/AddRatingModal.test.tsx`:
  - Submit with 0 stars → validation error shown
  - Submit with 3 stars → `createRating` API mock invoked
- [ ] T035 [P] Create `src/app/legalexpert/[expertId]/components/RatingsSection/__tests__/RatingCard.test.tsx`:
  - Verified rating → chip with `color="success"`
  - Delete clicked → ConfirmDialog opens
- [ ] T036 Create `e2e/019-ratings.spec.ts` with all 6 E2E scenarios from plan.md §8: submit rating golden path, edit own rating, delete own rating, expert views ratings, admin verifies rating, star value 0 rejected

**Checkpoint**: All tests written — run `npm run test` to verify unit tests pass

---

## Phase 8: Logging

**Purpose**: Add structured logging per plan.md §10.

- [ ] T037 [US1] Add `console.info` in `useRatings` on `createRating` success: log `{ clientId, expertId, stars }` — do NOT log comment text
- [ ] T038 [US3] Add `console.info` in `useRatings` on `updateRating` success: log `{ ratingId, clientId, changedFields: Object.keys(payload) }` — do NOT log new text
- [ ] T039 [US3] Add `console.info` in `useRatings` on `deleteRating` success: log `{ ratingId, clientId }`
- [ ] T040 [US4] Add `console.info` in `UnverifiedRatingsList` on `verifyRating` success: log `{ ratingId, adminId }`
- [ ] T041 [US1] Add `console.info` in `useRatings` on `addReply` success: log `{ ratingId, userId }` — do NOT log reply text
- [ ] T042 Add `console.warn` in `deleteRating` on unauthorized attempt (403): log `{ userId, ratingId }`

---

## Phase 9: Quality Gates

**Purpose**: Ensure code quality before finalization.

- [ ] T043 [P] Run `npm run type-check` — fix TypeScript errors in all new `RatingsSection/` files and `ratingsApi.ts`
- [ ] T044 [P] Run `npm run lint` — fix ESLint errors
- [ ] T045 Run `npm run test` — confirm all new unit tests pass
- [ ] T046 Run `npm run build` — confirm production build passes

---

## Phase 10: Finalization

**Purpose**: Confirm all spec requirements are satisfied.

- [ ] T047 Verify SC-001: client can submit a rating in under 1 minute (MUI `Rating` instant, API typically < 500ms)
- [ ] T048 Verify SC-002: unverified badge shows on new rating immediately after submit — `isVerified: false` optimistically set in state before API confirmation
- [ ] T049 Verify SC-003: star selector enforces 1–5 range — submit handler blocks 0; MUI `max={5}` prevents 6+
- [ ] T050 Verify SC-004: Edit/Delete controls never appear on another user's rating — test with two different client accounts

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: Start immediately — T001 types required by all other phases
- **Phase 2 (UI)**: Depends on T001; T004–T010 mostly parallel (different component files)
- **Phase 3 (Logic)**: Depends on T001; depends on Phase 4 API for imports
- **Phase 4 (API)**: Depends on T001; T020 is single file — build completely
- **Phase 5 (Backend)**: Independent — coordinate early; block frontend if API not ready
- **Phase 6 (Security)**: Depends on Phases 2–3
- **Phase 7 (Testing)**: Depends on Phases 2–4
- **Phase 8 (Logging)**: Parallel with Phase 7
- **Phase 9 (Quality Gates)**: Depends on Phases 7–8
- **Phase 10 (Finalization)**: Depends on Phase 9
