# Research: Case Read, Update & Delete

**Feature**: 006-case-read-update-delete | **Date**: 2026-05-14

---

## Design Decisions

### 1. Client-Side Status Filtering vs. Server-Side Query Parameter

**Decision**: Client-side filter on an already-fetched list.

**Rationale**: The cases list for a site is expected to be small (tens to low hundreds per site). Fetching all cases once and filtering in-browser avoids a round-trip per filter change and keeps the UI responsive. If a site grows to thousands of cases the API already accepts query parameters that can be wired up.

**Alternative Considered**: `GET /cases?status=Open` query param — rejected because it requires a loading state per filter change and increases API call count for a fast-switch UX pattern.

---

### 2. OrgClerk Access Denied — Guard Location

**Decision**: Guard in the case detail page component (`page.tsx`) after `useUserRole` resolves, not in middleware or layout.

**Rationale**: Next.js middleware runs on the Edge and does not have access to Keycloak token introspection in this project (tokens are stored in localStorage, not cookies). The layout at `organization/[id]/layout.tsx` does not have enough context to distinguish case-detail routes from other routes under the site. The page component is the correct, minimal-surface location for a per-role UI guard.

**Risk**: Roles load asynchronously — a brief flash of the loading spinner is acceptable; render the guard only after `!isLoading`.

---

### 3. Delete Confirmation Dialog — Inline vs. Separate Component

**Decision**: Inline MUI `<Dialog>` inside `CaseHeader.tsx`.

**Rationale**: The delete action is tightly coupled to the `CaseHeader` component which already owns the Delete button and the `onDeleteCase` prop. Extracting to a separate `DeleteCaseDialog` component would add a file for trivial benefit; the dialog markup is fewer than 30 lines.

**Alternative Considered**: Shared `ConfirmDialog` utility component — acceptable if a generic confirm dialog already exists in `src/components/`. Check `src/components/` before implementing; reuse if present.

---

### 4. StatusBadge — Shared Component vs. Inline per Tab

**Decision**: New shared component at `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/shared/StatusBadge.tsx`.

**Rationale**: Status badges are used in the case list, case header, tasks tab, and hearings tab. Centralizing the color map in one component ensures consistency and avoids drift when a new status is added.

**Color Mapping**:
- `Open` → MUI `primary` (blue #1976d2)
- `InProgress` → warning amber (#f57c00)
- `OnHold` → deep orange (#e65100)
- `Closed` → default grey (#616161)
- Unknown → MUI default chip

---

### 5. Edit Form — Modal vs. Inline Expansion

**Decision**: Keep existing inline expansion pattern within `CaseHeader` (toggle `isEditingTitle` to switch between display and form views).

**Rationale**: The pattern is already implemented and tested. Switching to a modal would require migrating existing state management. The inline approach keeps the edit context visible alongside the case header info.

---

### 6. SiteCaseClient Role — Read-Only Case Detail

**Decision**: Hide all write controls (Edit, Delete buttons; any inline editing toggles) when `isSiteCaseClient === true`. Do not disable them.

**Rationale**: Per spec and project constitution — role-gated actions must be hidden, not disabled. Hidden controls prevent confusion and remove the affordance entirely.

**Implementation**: In `CaseHeader`, wrap action buttons in `{!isSiteCaseClient && canEditCases && ...}`. Sub-entity tabs (Tasks, Documents, etc.) handle their own write-control visibility via their respective hooks/components (covered in specs 007–012).

---

### 7. Cases List Page Location

**Observation**: The site-level cases list is rendered as a tab section within the site detail page (`src/app/organization/[id]/sites/[siteId]/page.tsx`) rather than as a standalone `/cases` page. The `src/app/organization/[id]/sites/[siteId]/cases/page.tsx` may be a secondary route.

**Decision**: Status filter state lives in whichever component renders the cases list (`CasesSection` or equivalent). If the list is rendered in the site detail page, add filter state there and pass it down to the cases list component. Do not lift to Redux.

---

### 8. Breadcrumb Navigation for OrgClerk

**Observation**: The case detail page breadcrumbs include a "Cases" link. OrgClerk can access the cases list but not the detail. The breadcrumb handler `handleOrgClick` already checks `isSiteMode` to adjust navigation.

**Decision**: No change to breadcrumbs needed; the guard renders before the breadcrumbs render for OrgClerk.

---

### 9. API Error Handling for Delete (Cascading Sub-Entities)

**Decision**: If DELETE returns 409 Conflict (sub-entities block deletion), surface the API error message via `showError()`. Do not handle 409 with a custom UX flow at this stage.

**Rationale**: Spec does not call out a cascade-blocking scenario. If the backend cascades deletes, 204 is returned. If not, the error message from the API is informative enough.

---

### 10. Status Badge in Cases List Rows

**Decision**: Use the new `StatusBadge` shared component in the case list rows as well.

**Rationale**: Consistency with the detail page; no additional work since the component will be in the cases sub-tree. Import by relative path.
