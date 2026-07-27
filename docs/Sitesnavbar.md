# Sites Page — Change Log

This document records all changes made to the Sites page (`/organization/[id]/sites`) and the `SiteManagementTab` component.

---

## [2026-03-24] — Initial Implementation of Dedicated Sites Page

### Branch
`86d28fyd6_EditOrganizationModal`

### Changes

#### `src/app/organization/[id]/sites/page.tsx`
- **Before**: Stub component returning `<div>sites</div>`.
- **After**: Full client component implementing the Sites page at `/organization/[id]/sites`.
  - Reads `organizationId` from Next.js 15 route params using `use(params)`.
  - Renders a page header with:
    - "Sites" title (`h5`, bold, `#1e293b`)
    - "Manage all sites in your organization" subtitle (`body2`, `#64748b`)
    - Orange "+ Add Site" button (`#d97706`) navigating to `/organization/[id]/sites/new`
  - Embeds `<SiteManagementTab>` with `hideAddButton` and `showDirectActions` props so the tab's internal Add button is hidden and cards show direct edit/delete icons.

#### `src/app/organization/components/SiteManagementTab.tsx`
- Added `hideAddButton?: boolean` prop (default: `false`).
  - When `true`, the "+ Add Site" button inside the tab toolbar is hidden (the page provides its own).
  - Dashboard usage at `organization/[id]#sites` is unchanged (`hideAddButton` defaults to `false`).
- Added `showDirectActions?: boolean` prop (default: `false`).
  - When `true`, each site card renders a footer with direct **Edit** (pencil) and **Delete** (trash) icon buttons instead of the MoreVert (⋮) dropdown menu.
  - When `false` (default), the existing MoreVert menu behavior is preserved.
- Updated site card avatar:
  - Icon changed to `LocationCityIcon` with color-varied backgrounds cycling through `['#5c6bc0', '#26a69a', '#7e57c2', '#42a5f5', '#ef5350', '#66bb6a']` per site index.
- Updated site description display:
  - Changed from `<Typography variant="caption">` to italic styled body text with color `#5c7a6b`, matching the screenshot design.

### What is NOT changed
- Dashboard Sites tab (`organization/[id]#sites`) — MoreVert menu and existing card style preserved.
- API logic, search/filter, view toggle (grid/list), delete confirmation modal — all unchanged.
- `Site` type — no modifications (case/user count badges not implemented as API does not return counts).

---

## [2026-03-24] — Bug Fix: Search Not Working + Design Alignment

### Changes

#### `src/app/organization/components/SiteManagementTab.tsx`

**Bug fix — Search not working on standalone Sites page:**
- Changed filter `useEffect` dependency from `searchTerm` (prop, always `''` on standalone page) to `localSearchTerm` (what the user actually types). Filter now reacts to user input immediately.

**Design — Search bar:**
- Focus/hover border color changed from `primary.main` (blue) to `#d97706` (amber), matching screenshot.
- Border radius increased to `24px` for pill shape.

**Design — Grid/List toggle:**
- Replaced single toggle `IconButton` with two separate buttons (Grid + List) inside a bordered container.
- Active button: amber (`#d97706`) filled background with white icon.
- Inactive button: transparent background with `#64748b` icon.

**Design — Site cards:**
- Grid columns changed from `xs={12} sm={6} md={4} lg={3}` to `xs={12} sm={6} md={4}` (3 per row on medium+).
- Card border radius changed from `20px` to `16px`.
- Added subtle `border: 1px solid #f1f5f9` and `boxShadow: '0 1px 4px rgba(0,0,0,0.08)'`.
- Card avatar: background now uses light pastel colors (`#e8eaf6`, `#e0f2f1`, etc.) with matching icon tint, instead of solid colored backgrounds.

---

## [2026-03-24] — Hover: Site Name Turns Amber on Card Hover

### Changes

#### `src/app/organization/components/SiteManagementTab.tsx`
- Added `'& .site-card-name': { color: '#d97706' }` inside the Card's `&:hover` sx rule so the site name text turns amber when the card is hovered.
- Added `className="site-card-name"` and `transition: 'color 0.2s ease'` to the site name Typography for smooth color transition.

---

## [2026-03-24] — Table View Redesign to Match Screenshot

### Changes

#### `src/app/organization/components/SitesTable.tsx` (full rewrite)
- **Header row**: Changed from teal (`rgb(13,148,136)`) background to plain white with gray uppercase labels (`#94a3b8`), lighter separator border (`#f1f5f9`).
- **Site Name column**: Replaced `LocationCityIcon` with a colored square Avatar showing the site's first letter (palette cycles through green/purple/blue/yellow/red/sky per row index). Avatar uses `borderRadius: 8px` (rounded square), matching the screenshot.
- **Added CASES column**: Shows `—` placeholder (API does not return case count).
- **Added USERS column**: Shows `—` placeholder (API does not return user count).
- **Actions column**: Replaced MoreVert (⋮) dropdown menu with direct inline Edit (pencil) + Delete (trash) icon buttons. Icon color is `#94a3b8` at rest; hovers to `#1e293b` (edit) and `#dc2626` (delete).
- **Container**: Removed teal border/shadow; uses `border: 1px solid #f1f5f9` and subtle `boxShadow`.
- **Row styling**: Lighter row hover (`#fafafa`), thinner row divider (`#f8fafc`).

---

## [2026-03-24] — Edit Site: Navigate-to-page replaced with Modal

### Changes

#### `src/components/modals/EditSiteModal.tsx` (new file)
- New MUI `Dialog` modal (`maxWidth="sm"`, `fullWidth`, `borderRadius: 16px`).
- Pre-populates all fields from the `site` prop when opened.
- Fields: Site Name, Email, Phone Number, Address (multiline), Locality + District (2-col), State + Pincode (2-col), Landmark, Description.
- Reuses `useFormValidation`, `updateSite` API, `useToast`, `extractApiErrors`/`extractFieldErrors` from existing edit page.
- Buttons: **Cancel** (plain) and **Update Site** (amber `#d97706`, rounded).
- On success: calls `onSuccess()` to refresh the site list, then closes.

#### `src/app/organization/components/SiteManagementTab.tsx`
- Added `import EditSiteModal`.
- Added state: `editModalOpen`, `siteToEdit`.
- Changed `handleEditSite`: replaced `router.push(…/edit)` with `setSiteToEdit(site); setEditModalOpen(true)`.
- Renders `<EditSiteModal>` alongside `<DeleteConfirmationModal>` at bottom of component.
- Edit page (`/organization/[id]/sites/[siteId]/edit`) is unchanged — still accessible directly.

---

## [2026-03-24] — Add Site: Navigate-to-page replaced with Modal

### Changes

#### `src/components/modals/AddSiteModal.tsx` (new file)
- New MUI `Dialog` modal (`maxWidth="sm"`, `fullWidth`, `borderRadius: 16px`).
- All fields empty on open; form resets every time modal is opened.
- Fields: Site Name *, Email *, Phone Number *, Address * (multiline), Locality * + District * (2-col), State * + Pincode * (2-col), Landmark (optional), Description (optional).
- Reuses `useFormValidation`, `createSite` API, `useToast`, `extractApiErrors`/`extractFieldErrors`.
- Buttons: **Cancel** (plain) and **Create Site** (amber `#d97706`, rounded).
- On success: calls `onSuccess()` to refresh the site list, then closes.

#### `src/app/organization/components/SiteManagementTab.tsx`
- Added `import AddSiteModal`.
- Added state: `addModalOpen`.
- Changed `handleAddSite`: replaced `router.push(…/sites/new)` with `setAddModalOpen(true)`.
- Renders `<AddSiteModal>` at the bottom alongside Edit and Delete modals.

#### `src/app/organization/[id]/sites/page.tsx`
- Removed `useRouter` (no longer needed for Add).
- Added `addModalOpen` state.
- Page header "+ Add Site" button now opens `<AddSiteModal>` instead of navigating.
- `AddSiteModal` rendered in page; on success the tab's internal `fetchSites` handles refresh.
- Add page (`/organization/[id]/sites/new`) is unchanged — still accessible directly.

---

## [2026-03-24] — Bug Fix: Site List Not Refreshing After Add/Edit from Page Header

### Changes

#### `src/app/organization/components/SiteManagementTab.tsx`
- Added `refreshKey?: number` prop (default: `0`).
- Added `refreshKey` to the `fetchSites` `useEffect` dependency array so incrementing it triggers a re-fetch.

#### `src/app/organization/[id]/sites/page.tsx`
- Added `refreshKey` state (`useState(0)`).
- Passes `refreshKey={refreshKey}` to `<SiteManagementTab>`.
- `AddSiteModal.onSuccess` now also calls `setRefreshKey(k => k + 1)` so the tab re-fetches after a site is created from the page header button.

---

_Add new entries above this line for future changes._
