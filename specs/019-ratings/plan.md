# Implementation Plan: Ratings

**Branch**: `019-ratings` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/019-ratings/spec.md`

---

## 1. Overview

### What Exists
- MUI `<Rating />` component is imported and used in `src/components/ProfileCard.tsx` and `src/components/ProfileListCard.tsx` — but only for **displaying** a numeric rating value.
- No rating submission, update, or delete API functions exist in any service file.
- No admin verification UI for ratings.

### What Is New (Full Build)
1. **Client flows**: Submit a rating, edit own rating, delete own rating, add a reply to a rating.
2. **Expert view**: View all ratings received on their profile.
3. **Admin verification**: SystemAdmin marks ratings as verified via a management interface.
4. **Unverified badge**: All new ratings display as "Unverified" until admin approves.
5. API service functions for all rating CRUD + verification operations.
6. Unit and E2E tests.

### Scope
- Ratings live on the legal expert's profile page (`LegalIndividualExpert` profile).
- Rating is a star selector (1–5), with optional text comment.
- Replies are threaded under the rating.

---

## 2. Architecture Flow

### 2.1 Client Submits Rating

```
Client on LegalExpert profile page
  → RatingsSection renders (visible to all authenticated users)
  → Client clicks "Rate This Expert"
  → AddRatingModal opens
  → Star selector: 1–5 (MUI <Rating /> component)
  → Optional comment <TextField multiline>
  → Submit → validateRating(form) → if stars < 1 error
  → createRating(expertId, { stars, comment })
      → POST /api/v1/legalexperts/{expertId}/ratings
  → 201 → rating appears in list with "Unverified" badge
          → showSuccess("Your rating has been submitted.")
  → error → showError via errorHandler
```

### 2.2 Client Updates or Deletes Own Rating

```
Client views rating list
  → For ratings authored by current user:
      → Edit button visible → EditRatingModal opens (pre-filled)
      → Update → PUT /api/v1/legalexperts/{expertId}/ratings/{ratingId}
      → Delete button visible → ConfirmDialog → DELETE /api/v1/legalexperts/{expertId}/ratings/{ratingId}
  → For ratings by other users → no edit/delete controls rendered
```

### 2.3 Client Adds Reply

```
Client clicks "Reply" on a rating
  → ReplyInput appears inline under rating
  → addReply(expertId, ratingId, { text })
      → POST /api/v1/legalexperts/{expertId}/ratings/{ratingId}/replies
  → Reply appears indented below rating
```

### 2.4 Admin Verifies Rating

```
SystemAdmin on /admin/ratings (or Admin > Ratings tab)
  → fetchUnverifiedRatings()
      → GET /api/v1/ratings?verified=false
  → List of unverified ratings with expert name, client, stars, comment
  → Admin clicks "Verify"
  → verifyRating(ratingId)
      → PATCH /api/v1/ratings/{ratingId}/verify
  → Rating status changes to "Verified" in UI
```

### 2.5 Legal Expert Views Own Ratings

```
LegalIndividualExpert on their profile page
  → RatingsSection renders (read-only for expert)
  → fetchExpertRatings(expertId)
      → GET /api/v1/legalexperts/{expertId}/ratings
  → Ratings list: star count, comment, client name, verified badge, date
  → No edit/delete controls (expert cannot modify ratings)
```

---

## 3. File Structure

### Documentation
```
specs/019-ratings/
  spec.md                         NO CHANGE
  plan.md                         NEW (this file)
  research.md                     NEW
  data-model.md                   NEW
  contracts/
    api-contracts.md              NEW
```

### Source Tree
```
src/app/legalexpert/
  [expertId]/
    components/
      RatingsSection/
        RatingsSection.tsx        NEW — ratings list with add/edit/delete for client, read-only for expert
        RatingCard.tsx            NEW — individual rating display with reply thread
        AddRatingModal.tsx        NEW — star selector + comment form
        EditRatingModal.tsx       NEW — pre-filled update form
        ReplyInput.tsx            NEW — inline reply form
        index.ts                  NEW
        __tests__/
          RatingsSection.test.tsx NEW
    hooks/
      useRatings.ts               NEW — fetch, add, update, delete ratings + replies

src/app/admin/
  ratings/
    page.tsx                      NEW — SystemAdmin ratings management page
    components/
      UnverifiedRatingsList.tsx   NEW — list with verify action

src/app/organization/services/
  ratingsApi.ts                   NEW — all rating API functions

src/app/organization/types/
  ratings.ts                      NEW — Rating, RatingReply, CreateRatingRequest interfaces

e2e/
  019-ratings.spec.ts             NEW
```

---

## 4. Component Design

### 4.1 `RatingsSection`
- **Purpose**: Renders the expert's ratings list and the "Rate This Expert" button for clients.
- **Props**: `{ expertId: string, currentUserId: string, currentUserRole: string }`
- **Role-based rendering**:
  - Client: sees "Rate This Expert" button + edit/delete on own ratings
  - LegalExpert: read-only list of own ratings
  - SystemAdmin: read-only on this page (verification done in admin panel)
  - Others: read-only

### 4.2 `RatingCard`
- **Purpose**: Renders a single rating with star display, comment, verified badge, and optional reply thread.
- **Props**: `{ rating: Rating, isOwner: boolean, onEdit, onDelete, onReply }`
- **Verified badge**: MUI `<Chip label="Verified" color="success" />` or `<Chip label="Unverified" color="warning" />`
- **Reply thread**: Replies rendered as indented `<Box>` items below the card.

### 4.3 `AddRatingModal` / `EditRatingModal`
- **Star selector**: MUI `<Rating>` component — `value` controlled, `precision={1}`, `max={5}`.
- **Validation**: Star value must be 1–5 (reject 0 via `if (stars < 1)` check before submit).
- **Comment**: Optional `<TextField multiline rows={3} />`.
- **Edit pre-fill**: `EditRatingModal` receives current `Rating` object and pre-fills.

### 4.4 `UnverifiedRatingsList` (Admin)
- **Purpose**: Paginated list of unverified ratings for SystemAdmin.
- **Columns**: Expert name, Client name, Stars, Comment (truncated), Submitted date, "Verify" action.
- **Verify action**: Calls `verifyRating(ratingId)`, updates row status in-place.

### 4.5 `useRatings` (hook)
- **State**: `ratings`, `loading`, `error`, `submitting`
- **Methods**: `fetchRatings()`, `createRating()`, `updateRating()`, `deleteRating()`, `addReply()`
- **Validation**: `useFormValidation` with rating schema

---

## 5. API Plan

| Method | URL | Auth | Request Body | Success | Error Codes | Status |
|--------|-----|------|--------------|---------|-------------|--------|
| `GET` | `/legalexperts/{expertId}/ratings` | Bearer | — | `{ data: Rating[] }` 200 | 401 | NEW |
| `POST` | `/legalexperts/{expertId}/ratings` | Bearer (Client) | `{ stars: number, comment?: string }` | `{ data: Rating }` 201 | 400, 401, 403 | NEW |
| `PUT` | `/legalexperts/{expertId}/ratings/{ratingId}` | Bearer (own) | `{ stars: number, comment?: string }` | `{ data: Rating }` 200 | 400, 401, 403, 404 | NEW |
| `DELETE` | `/legalexperts/{expertId}/ratings/{ratingId}` | Bearer (own or SysAdmin) | — | 204 | 401, 403, 404 | NEW |
| `POST` | `/legalexperts/{expertId}/ratings/{ratingId}/replies` | Bearer (Client, SysAdmin) | `{ text: string }` | `{ data: RatingReply }` 201 | 400, 401, 403, 404 | NEW |
| `GET` | `/ratings?verified=false` | Bearer (SysAdmin) | — | `{ items: Rating[], totalCount, page, pageSize }` | 401, 403 | NEW |
| `PATCH` | `/ratings/{ratingId}/verify` | Bearer (SysAdmin) | — | `{ data: Rating }` 200 | 401, 403, 404 | NEW |

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| Client editing another user's rating | `isOwner` check in `RatingCard`; backend verifies `createdById === currentUserId` |
| Star value outside 1–5 (manual API call) | Backend validates `1 ≤ stars ≤ 5`; client blocks 0 and 6+ via `<Rating>` constraints |
| XSS in rating comment | Comment rendered as text node; never via `dangerouslySetInnerHTML` |
| Non-client submitting a rating | Backend enforces `[Authorize(Roles = "Client")]` on POST; frontend hides button for non-client roles |
| Admin verifying fabricated ratings | Admin UI is role-gated; backend enforces `[Authorize(Roles = "SystemAdmin")]` on PATCH verify |
| Self-deletion of rating for another user | `DELETE` endpoint scoped to `createdById`; `403` returned for mismatched owner |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `ratings` list | `useRatings` (local) | Expert-scoped; not shared across routes |
| `submitting`, `loading` | `useRatings` (local) | Async UI state |
| `addRatingOpen`, `editRatingOpen` | `RatingsSection` (local) | Modal visibility; ephemeral |
| `ratingToEdit`, `ratingToDelete` | `RatingsSection` (local) | Selection state for modals |
| Admin unverified ratings | `UnverifiedRatingsList` local state | Admin-only; scoped to admin page |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `RatingsSection.test.tsx` | Client role → "Rate This Expert" button visible | Button in DOM |
| `RatingsSection.test.tsx` | Expert role → no "Rate This Expert" button | Button absent |
| `RatingsSection.test.tsx` | Client's own rating → Edit + Delete controls visible | Both controls in DOM |
| `RatingsSection.test.tsx` | Another user's rating for client → no Edit/Delete | Controls absent |
| `RatingsSection.test.tsx` | Empty ratings list → "No ratings yet" message | Empty state rendered |
| `RatingsSection.test.tsx` | New rating → "Unverified" badge shown | Chip with "Unverified" in DOM |
| `AddRatingModal.test.tsx` | Submit with 0 stars → validation error | Error text rendered |
| `AddRatingModal.test.tsx` | Submit with 3 stars → createRating called | API mock invoked |
| `RatingCard.test.tsx` | Verified rating → "Verified" chip | Chip color="success" |
| `RatingCard.test.tsx` | Delete → ConfirmDialog opens | Dialog in DOM |

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| Submit rating — golden path | Client | Open expert profile, rate 4 stars, add comment, submit | Rating visible with "Unverified" badge |
| Edit own rating | Client | Click Edit on own rating, change to 5 stars, save | Updated stars shown |
| Delete own rating | Client | Click Delete, confirm | Rating removed from list |
| Expert views own ratings | LegalExpert | Navigate to profile ratings section | Ratings list visible, no edit/delete controls |
| Admin verifies rating | SystemAdmin | Admin > Ratings, click Verify | Badge changes to "Verified" |
| Star value 0 rejected | Client | Open add modal, submit with no star selected | Inline error shown |

Test file: `e2e/019-ratings.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-001: Submit under 1 minute | MUI `<Rating>` is instant; API call typically < 500ms |
| SC-002: Unverified badge on first render | Badge rendered from `rating.isVerified` field; no async check needed |
| SC-003: Star selector enforces 1–5 | MUI `<Rating max={5} />` prevents selection above 5; 0 blocked client-side before submit |
| Pagination for large rating lists | Use paginated GET with `page` + `pageSize`; display 10 per page with "Load more" |
| Admin list | Paginated list with `?verified=false&page=1&pageSize=20` |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| Rating submitted | INFO | `clientId`, `expertId`, `stars` | Comment text (legal case-adjacent content) |
| Rating updated | INFO | `ratingId`, `clientId`, fields changed (keys) | New comment text |
| Rating deleted | INFO | `ratingId`, `clientId` | — |
| Rating verified by admin | INFO | `ratingId`, `adminId` | — |
| Reply added | INFO | `ratingId`, `userId` | Reply text |
| Authorization violation (non-owner delete attempt) | WARN | `userId`, `ratingId` | — |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| No backend rating API implemented yet | High | High | Confirm with backend team; block frontend work until contract is agreed |
| Expert average rating not calculated | Low | Low | Spec explicitly excludes average display; do not implement |
| Reply on deleted rating creates orphan | Medium | Low | Spec acknowledges this gap; handle with a "Rating not found" graceful state in reply view |
| Client submits rating for expert they never met | Medium | Low | Out of scope for frontend; future business rule enforcement at backend |
| MUI `<Rating>` allows 0 if user deselects | Medium | Medium | Add `if (stars < 1)` guard in submit handler; do not rely solely on MUI component behavior |
| Unverified badge not shown on immediate submit | Low | High | Set `isVerified: false` on the optimistically-added rating in local state before API confirms |
