# Implementation Plan: Payment Settlements

**Branch**: `030-payment-settlements` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/030-payment-settlements/spec.md`

---

## 1. Overview

### What Exists

- `src/app/admin-dashboard/payment-list/page.tsx` — Admin payments page with payment history table (hard-coded data, stub fetch). Shows date, client name, transaction reference, amount, status. This is payments history, not settlements.
- No expert-facing settlements page exists.
- No `settlements` API service file exists.

### Gaps to Close

1. **Expert settlements list**: Create `/profile/settlements` or tab in expert profile showing their settlements with: appointment reference, settlement date (appt date + 3 days), amount, status.
2. **Admin settlements management**: Extend admin dashboard with a settlements section where SystemAdmin can view and delete any expert's settlements.
3. **Access control**: Expert sees only own settlements; cross-expert access blocked at route level.
4. **Read-only for expert**: No create/edit/delete controls in expert view.
5. **Admin delete with confirmation**: Delete requires confirm dialog.
6. **Empty state**: Friendly message when no settlements with context (auto-created, not manually created).
7. **Settlement date display**: Show appointment date + 3 days as formatted date string.
8. Add unit and E2E tests.

### What Is New

- `src/app/profile/components/SettlementsSection/SettlementsSection.tsx` — Expert settlements view
- `src/app/admin-dashboard/settlements/page.tsx` — Admin settlements management
- `src/app/admin-dashboard/settlements/components/AdminSettlementsView.tsx`
- `src/app/settlements/services/api.ts` — settlements API service
- `src/app/settlements/types/index.ts` — Settlement interface
- Unit tests and E2E tests

---

## 2. Architecture Flow

### 2.1 Expert Views Own Settlements

```
LegalIndividualExpert navigates to /profile → Settlements tab
  → SettlementsSection mounts
  → Keycloak check → role === LegalIndividualExpert
  → fetchExpertSettlements(expertId)
      → GET /api/v1/legal-experts/{expertId}/settlements
      → backend validates: token owner === expertId (else 403)
  → loading → <LoadingState /> (MUI Skeleton rows)
  → renders settlements table: appointment reference, settlement date, amount, status
  → no create/edit/delete controls
  → empty → <EmptyState message="No payment settlements yet. Settlements appear automatically after appointments are booked." />
```

### 2.2 Expert Access Guard (IDOR Prevention)

```
Expert attempts URL manipulation: /profile/settlements?expertId=anotherExpert
  → Client: expertId always derived from Keycloak token (own ID), not from URL param
  → Server: GET /api/v1/legal-experts/{expertId}/settlements
      → backend validates JWT subject === expertId
      → if mismatch → 403 Forbidden
  → Frontend shows access denied error
```

### 2.3 Admin Views and Manages Settlements

```
SystemAdmin navigates to /admin-dashboard/settlements
  → AdminSettlementsView mounts
  → Keycloak check → role === SystemAdmin
  → Optional: search/filter by expert name or ID
  → fetchAllSettlements({ expertId? })
      → GET /api/v1/settlements?expertId={id}  (or GET /api/v1/legal-experts/{id}/settlements)
  → Settlements list shown
  → "Delete Settlement" button on each row (SystemAdmin only)
```

### 2.4 Admin Delete Settlement

```
SystemAdmin clicks "Delete Settlement"
  → ConfirmDialog: "This settlement will be permanently deleted. This action cannot be undone."
  → Confirm → deleteSettlement(settlementId)
      → DELETE /api/v1/settlements/{settlementId}
  → 204 → settlement removed from list → showSuccess toast
  → error → showError via errorHandler
```

### 2.5 Settlement Date Display

```
Settlement received from API:
  { appointmentDate: "2026-05-10", ... }
  → settlementDate = addDays(new Date(appointmentDate), 3)
  → Display: format(settlementDate, "dd MMM yyyy")  → "13 May 2026"
  (OR: backend sends settlementDate directly — prefer backend-computed value if available)
```

---

## 3. File Structure

### Documentation

```
specs/030-payment-settlements/
  spec.md                                       NO CHANGE
  plan.md                                       NEW (this file)
  research.md                                   NEW
  data-model.md                                 NEW
  contracts/
    api-contracts.md                            NEW
```

### Source Tree

```
src/app/profile/
  components/
    SettlementsSection/
      SettlementsSection.tsx                    NEW — expert settlements read-only view
      __tests__/
        SettlementsSection.test.tsx             NEW

src/app/admin-dashboard/
  settlements/
    page.tsx                                    NEW — admin settlements route
    components/
      AdminSettlementsView.tsx                  NEW — settlements table + delete

src/app/settlements/
  services/
    api.ts                                      NEW — fetchExpertSettlements, fetchAllSettlements, deleteSettlement
  types/
    index.ts                                    NEW — Settlement interface

e2e/
  030-payment-settlements.spec.ts               NEW
```

---

## 4. Component Design

### 4.1 `SettlementsSection` (Expert View)

- **Purpose**: Read-only settlements list for the authenticated expert.
- **Columns (MUI Table)**: Appointment Reference, Settlement Date, Amount, Status.
- **Settlement Date**: Displayed as computed `appointmentDate + 3 days` or backend-provided `settlementDate` field.
- **Status chip**: MUI `<Chip>` with color coding (e.g., Pending = amber, Settled = green).
- **No action column** — no create, edit, or delete controls rendered.
- **Empty state**:
  ```tsx
  <EmptyState
    message="No payment settlements yet."
    description="Settlements appear automatically after appointments are booked."
  />
  ```
- **RBAC**: Component only mounts in expert profile context; route-level Keycloak check ensures role is `LegalIndividualExpert`.

### 4.2 `AdminSettlementsView`

- **Purpose**: Admin interface for viewing and deleting settlements.
- **Filter**: Expert name/ID search field for filtering settlements by expert.
- **Columns**: Expert Name, Appointment Reference, Settlement Date, Amount, Status, Actions.
- **Actions column**: "Delete" button (SystemAdmin only).
- **Delete flow**: ConfirmDialog → `deleteSettlement(settlementId)` → row removed on 204.

### 4.3 Shared `Settlement` Type

```typescript
interface Settlement {
  id: string;
  expertId: string;
  expertName?: string;         // admin view only
  appointmentId: string;
  appointmentReference: string;
  appointmentDate: string;     // ISO date
  settlementDate?: string;     // backend-computed (appt date + 3 days); if absent, compute client-side
  amount: number;
  currency: string;            // 'INR'
  status: 'Pending' | 'Settled' | 'Cancelled';
}
```

---

## 5. API Plan

| Method | URL | Auth | Query Params / Body | Success | Error Codes | Status |
|--------|-----|------|---------------------|---------|-------------|--------|
| `GET` | `/api/v1/legal-experts/{expertId}/settlements` | Bearer (own expert or SystemAdmin) | `page`, `pageSize` | `{ items: Settlement[], totalCount, page, pageSize }` 200 | 401, 403 | NEW |
| `GET` | `/api/v1/settlements` | Bearer (SystemAdmin) | `expertId?`, `page`, `pageSize` | `{ items: Settlement[], totalCount, page, pageSize }` 200 | 401, 403 | NEW |
| `DELETE` | `/api/v1/settlements/{settlementId}` | Bearer (SystemAdmin only) | — | 204 | 401, 403, 404 | NEW |

**Note**: Settlement creation is handled by the Appointments feature (spec `014`) — no POST endpoint in this spec.

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| Expert viewing another expert's settlements (IDOR) | Expert ID always sourced from Keycloak token on client; backend validates JWT subject === `expertId` path param |
| Expert accessing admin settlements page | Admin page at `/admin-dashboard/settlements` gated by SystemAdmin role check; backend returns 403 for non-admin |
| Expert sees delete controls | `SettlementsSection` renders no action column; delete controls only in `AdminSettlementsView` |
| URL manipulation to access admin delete endpoint | Backend `[Authorize(Roles = "SystemAdmin")]` on DELETE endpoint |
| Settlement amount tampering | Settlements are read-only for experts; amount comes from API — no client-side modification |
| Correlation ID for payment traceability | Log `appointmentId` and `settlementId` on all settlement operations (per Principle VIII payment correlation) |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `settlements` list | `SettlementsSection` / `AdminSettlementsView` (local) | Page-scoped; not persisted |
| `settlementToDelete` | `AdminSettlementsView` (local) | Confirm dialog selection state |
| `deleteModalOpen` | `AdminSettlementsView` (local) | Dialog visibility |
| `loading`, `error` | Each component (local) | Async state |
| `expertFilterId` | `AdminSettlementsView` (local) | Admin filter state |
| Current user expert ID | Keycloak token / Redux auth slice | Used to scope expert settlements fetch |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `SettlementsSection.test.tsx` | Expert role → settlements list shown, no action column | Table renders, no Delete button |
| `SettlementsSection.test.tsx` | Empty settlements → EmptyState with description shown | Empty state text present |
| `SettlementsSection.test.tsx` | Settlement date computed correctly (appt date + 3 days) | Formatted date in table |
| `SettlementsSection.test.tsx` | Status chip renders correct color for Pending | Chip with amber/pending styling |
| `AdminSettlementsView.test.tsx` | SystemAdmin → Delete button on each row | Delete buttons present |
| `AdminSettlementsView.test.tsx` | Click Delete → ConfirmDialog opens | Dialog in DOM |
| `AdminSettlementsView.test.tsx` | Confirm delete → deleteSettlement called | API mock invoked |

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| Expert views own settlements | LegalIndividualExpert | Profile → Settlements tab | Settlements listed, no delete controls |
| Expert empty state | LegalIndividualExpert | Profile → Settlements (no data) | Empty state message shown |
| Cross-expert access blocked | LegalIndividualExpert | Manipulate URL to another expertId | Access denied shown |
| Admin views settlements | SystemAdmin | Admin dashboard → Settlements | All settlements listed |
| Admin deletes settlement | SystemAdmin | Click Delete, confirm | Settlement removed from list |

Test file: `e2e/030-payment-settlements.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-001: Settlement list within 2s for ≤50 settlements | Paginated GET (page 1, pageSize 20); MUI Skeleton during fetch |
| SC-002: Expert sees zero write controls | Controls never rendered in `SettlementsSection` (no conditional check needed) |
| SC-003: Cross-expert access blocked at route level | Expert ID sourced from Keycloak token, not URL param — no client-side routing bypass possible |
| Settlement date computation | Computed via `date-fns` `addDays` — synchronous; no API round-trip if `settlementDate` not in response |
| `React.memo` on settlement rows | Prevents re-renders when filter/modal state changes |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| Expert settlements fetched | INFO | `expertId`, `requesterId`, count returned | Settlement amounts, appointment details |
| Admin settlements fetched | INFO | `requesterId`, filter params, count returned | Settlement amounts |
| Settlement deleted | INFO | `settlementId`, `appointmentId`, `expertId`, `deletedByAdminId` | Amount, client data |
| Cross-expert access attempt (403) | WARN | `requesterId`, `targetExpertId` | — |
| Admin delete of settlement | AUDIT | `settlementId`, `expertId`, `adminId`, timestamp | Amount (payment correlation via `appointmentId`) |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Settlements API endpoints do not exist yet (new feature) | High | High | Must be built with backend; confirm endpoint path and shape before implementation |
| `settlementDate` not returned by API (need client-side computation) | Medium | Low | Compute `appointmentDate + 3 days` client-side with `date-fns`; prefer backend-computed value |
| Expert ID from Keycloak token differs from API expert ID type (UUID vs int) | Medium | High | Confirm identity mapping; may need a "get my expert profile" step to resolve expert ID |
| Admin settlements endpoint requires different URL from expert endpoint | Low | Low | Use expert-scoped endpoint for expert view; admin-scoped endpoint for admin view — document in API plan |
| Pagination for experts with many settlements | Low | Medium | Implement load-more or MUI `TablePagination` for large sets |
| Settlement status values differ from spec ('Pending' vs backend enum) | Low | Medium | Map backend status strings to display labels; confirm all status values in research phase |
