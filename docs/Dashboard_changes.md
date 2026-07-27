# Dashboard UI Change Log

All changes made during the UI revamp are documented here with file path, line numbers, and explanation.

---

## Task 1 — Style Changes (2026-03-23)

### 1. `src/app/organization/[id]/page.tsx` — Lines ~464–545 (Header → Card 1)
**Changed:**
- Replaced the bare `Box` (with only a `borderBottom`) with a white `Card` (`border: 1px solid #e5e7eb`, `borderRadius: 3`, `boxShadow: 0 1px 8px rgba(0,0,0,0.06)`, `background: #ffffff`)
- Courthouse icon container: changed from a plain transparent box to a dark navy rounded square (`backgroundColor: #1a1a2e`, `borderRadius: 12px`, `56×56px`). Image file `/courthouse.svg` is unchanged; a CSS `filter: brightness(0) invert(1)` is applied to make it white on the dark background.
- Org name text: removed blue gradient (`linear-gradient`, `WebkitBackgroundClip`, `WebkitTextFillColor`) → plain bold dark text (`color: #111827`, `fontWeight: 700`)
**Reason:** Screenshot shows a separate white card for the org name, not a bare header with a border-bottom.

---

### 2. `src/app/organization/[id]/page.tsx` — Lines ~547–567 (Card 2 background)
**Changed:**
- Removed the 3-stop white-to-slate gradient (`linear-gradient(135deg, #ffffff → #f8fafc → #f1f5f9)`)
- Removed the `&:before` radial-gradient pseudo-element overlay
- Set `background: #ffffff`, `border: 1px solid #e5e7eb`
**Reason:** Screenshot shows Organization Details card as a clean flat white card, not gradient.

---

### 3. `src/app/organization/[id]/page.tsx` — Lines ~565–576 (Card 2 section label)
**Changed:**
- Removed the circular primary-bg icon wrapper (`40×40px`, `borderRadius: 50%`, `primary.main + 20` bg)
- Replaced with: amber `BusinessIcon` (`fontSize: 18`, `color: #d97706`) directly inline
- Changed label Typography from `variant="h6"` gray → `fontSize: 0.72rem`, `fontWeight: 600`, `color: #d97706`, `textTransform: uppercase`, `letterSpacing: 0.1em`
**Reason:** Screenshot shows "ORGANIZATION DETAILS" as a small uppercase amber label with a small icon, not a large gray heading.

---

### 4. `src/app/organization/[id]/page.tsx` — Line ~463 (Container top spacing)
**Changed:** Added `pt: { xs: 2, sm: 3 }` to the Container `sx` prop.
**Reason:** The header card had no top spacing, making it look cramped against the header bar.

---

### 5. `src/app/organization/[id]/page.tsx` — Line ~562–568 (Section label text color)
**Changed:** `color: '#d97706'` (amber) on the Typography → `color: '#374151'` (dark gray). Icon remains amber.
**Reason:** Only the icon should be amber; the "ORGANIZATION DETAILS" text should be dark gray as shown in screenshot.

---

### 6. `src/app/organization/[id]/page.tsx` — Line ~516 (Org name font weight)
**Changed:** `fontWeight: 700` → `fontWeight: 600` on org name Typography.
**Reason:** Matches the medium-bold weight shown in the screenshot.

---

### 7. `src/app/organization/[id]/page.tsx` — Lines ~771–775 (Description text)
**Changed:** Removed `DescriptionIcon` + `alignItems: 'center'` Box wrapper from description. Now renders as a plain `Typography` with `color: #374151`, `fontSize: 0.9rem`, `lineHeight: 1.6`.
**Reason:** Icon before multi-line description caused layout issues; screenshot shows plain paragraph text.

---

### 8. `src/app/organization/[id]/page.tsx` — Lines ~778–793 (Segment chips)
**Changed:** Removed `SegmentIcon` prefix and `color="primary"` from chips. Now uses `variant="outlined"` with `borderColor: #d1d5db`, `color: #374151` — plain gray outlined pills.
**Reason:** Screenshot shows neutral gray outlined chips, not blue primary-colored ones.

---

### 9. `src/app/organization/[id]/page.tsx` — Lines ~806, ~807–815 (Contact section)
**Changed:**
- "Contact Information" label: changed from `variant="subtitle1" color="textSecondary"` to uppercase small label matching the "ORGANIZATION DETAILS" style (`fontSize: 0.72rem`, `fontWeight: 600`, `color: #374151`, uppercase, tracking).
- Email/phone rows: icons changed to `fontSize: 16, color: #9ca3af`; text styled to `fontSize: 0.875rem, color: #374151`.
**Reason:** Screenshot shows "CONTACT INFORMATION" as an uppercase section label, with small gray icons and consistent gray text.

---

### 10. `src/app/organization/[id]/page.tsx` — Multiple lines (Prototype color alignment, 2026-03-23)
All colors and text styles aligned to match the prototype at `C:\Users\LENOVO\lawsome` (Tailwind slate palette → MUI sx):

| Element | Before | After (prototype match) |
|---|---|---|
| Header card border | `#e5e7eb` | `#f1f5f9` (slate-100) |
| Header card padding | `p: 2` | `p: 3` |
| Header card shadow | `0 1px 8px rgba(0,0,0,0.06)` | `0 1px 4px rgba(0,0,0,0.04)` |
| Org name color | `#111827` | `#1e293b` (slate-800) |
| Org name font size | up to 1.75rem | up to 1.35rem |
| Subtitle color | `text.secondary` | `#94a3b8` (slate-400) |
| "ORGANIZATION DETAILS" text color | `#374151` | `#64748b` (slate-500) |
| Description text color | `#374151` | `#475569` (slate-600) |
| Segment chips | outlined, `#d1d5db` border | filled `#f1f5f9` bg, `#334155` text, pill shape |
| Date icon | `color="action"` opacity 0.7 | `#94a3b8` (slate-400), fontSize 14 |
| Date text | `color="textPrimary"` | `#64748b` (slate-500), 0.875rem |
| "CONTACT INFORMATION" label | `#374151` | `#64748b` (slate-500) |
| Email/phone icons | fontSize 16, `#9ca3af` | fontSize 13, `#94a3b8` (slate-400) |
| Email/phone text | `#374151` | `#475569` (slate-600) |

---

---

## Task 4 — Edit Organization Modal (2026-03-23)

### 17. `src/components/modals/EditOrganizationModal.tsx` — New file
**Added:** New modal component for editing organization details.
- MUI `Dialog` with amber lock icon header and `×` close button
- 2-column layout: Organization Name + Email Address on top row, Description + Phone Number on second row, full-width Segments select below
- Cancel (gray outlined) and Save Changes (amber filled) buttons in footer
- Receives all form state/handlers as props — no business logic inside the component
**Reason:** Replace inline edit form with a floating modal matching the screenshot design.

### 18. `src/app/organization/[id]/page.tsx` — Card header (lines ~591–653): Remove inline Save/Cancel buttons
**Changed:** Removed the `{isEditing ? <Save+Cancel> : <MoreVert>}` conditional. Now always renders the MoreVert `IconButton` (when user has edit permission).
**Reason:** Edit actions moved to modal; no need for inline Save/Cancel in the card header.

### 19. `src/app/organization/[id]/page.tsx` — Left column (lines ~657–787): Remove inline name/description/segments form
**Changed:** Removed `{isEditing ? <form fields> : <read-only>}` — now always renders the read-only view (description text, segment chips, created date).
**Reason:** Edit form moved to modal.

### 20. `src/app/organization/[id]/page.tsx` — Right column (lines ~829–712): Remove inline email/phone form
**Changed:** Removed `{!isEditing ? <contact info> : <email+phone form>}` — now always renders Contact Information (email, phone).
**Reason:** Edit form moved to modal.

### 21. `src/app/organization/[id]/page.tsx` — Modal instance added (near line ~1000)
**Added:** `<EditOrganizationModal>` wired to existing `isEditing`, `handleCancelEdit`, `handleSaveEdit`, `handleInputChange`, `editFormData`, `validationErrors`, `isLoading` — no new state or logic.
**Reason:** Mount the new modal in the page JSX.

---

## Task 2 — 4 Metric Cards (2026-03-23)

### 11. `src/app/organization/[id]/page.tsx` — Line ~31–46 (New imports)
**Added:** `FolderOpenIcon`, `CheckCircleOutlineIcon`, `TrendingUpIcon` from `@mui/icons-material`; `fetchOrganizationCases` from api service.
**Reason:** Required for the metric card icons and real data fetching.

### 12. `src/app/organization/services/api.ts` — After `fetchSiteCases` (new function)
**Added:** `fetchOrganizationCases(organizationId, status?)` — calls `GET /api/v1/organizations/{id}/cases?status={status}`. Returns `Case[]`, handles 404 → empty array. Follows same axios + Bearer token pattern as existing functions.
**Reason:** New org-level cases endpoint discovered in `OrganizationsController.cs`.

### 13. `src/app/organization/[id]/page.tsx` — State + useEffect
**Added:**
- State: `allCases: Case[]`, `resolvedCases: Case[]`
- In `loadAllData` useEffect: added `fetchOrganizationCases(organizationId)` and `fetchOrganizationCases(organizationId, 'Closed')` to the existing `Promise.all`
**Reason:** Fetch total and resolved case counts on page load alongside existing data.

### 14. `src/app/organization/[id]/page.tsx` — 4 Metric Cards (updated with real data)
**Updated cards:**

| Card | Value | Subtext | Source |
|---|---|---|---|
| Total Cases | `allCases.length` | `+X this month` (filter by current month/year) | `fetchOrganizationCases` |
| Active Users | `users.length` | "All active" | existing `users` state |
| Upcoming Hearings | `—` | "Need data to implement" | no org-level API available |
| Resolved Cases | `resolvedCases.length` | `X closed` | `fetchOrganizationCases(id, 'Closed')` |

Cards wrapped in IIFE to compute `casesThisMonth` inline without extra state.
---

### 15. src/app/organization/services/api.ts — fetchOrganizationCases (fix ambiguous route)
**Changed:** status param made required. Query always sent as ?status=...
**Reason:** API has two overloads with same route — no-param version causes AmbiguousMatchException (HTTP 500). Always passing status forces the correct overload.

### 16. src/app/organization/[id]/page.tsx — loadAllData (fetch all 4 statuses)
**Changed:** 4 parallel calls for Open/InProgress/OnHold/Closed, combined into allCases. resolvedCases = Closed group.
**Reason:** UI workaround for ambiguous API route — always pass a status to avoid 500.
