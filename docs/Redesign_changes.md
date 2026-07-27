# Lawsome UI Redesign — Change Log

---

## Session 1 — 2026-03-11: Sidebar + Top Header Layout

### Goal
Implement the left sidebar + top header layout (from prototype at `C:\Users\LENOVO\lawsome`) as a shared layout for all roles under `/organization/[id]/*`.

---

### Files Created

#### 1. `src/components/org/OrgSidebar.tsx` (new — 175 lines)
- Left sidebar component shared across all roles
- Role-based nav item filtering using `useUserRole` hook
- Collapsible (240px ↔ 70px) with chevron toggle
- Tooltips when collapsed
- Active state detection via `usePathname()`
- "My Site" link fetches siteId via `fetchOrganizationUserSites` for site-level roles
- Sign Out calls `logout()` from `keycloakServices.ts`
- Styling: Tailwind CSS, gradient `#2a3740 → #3E4F5E`, amber accents

#### 2. `src/components/org/OrgHeader.tsx` (new — 130 lines)
- Sticky top header (h-14, white, border-b)
- User name + role label fetched from `getUserInfo()` (Keycloak — real API)
- Role label derived from `useUserRole` hook
- Search bar (UI only — placeholder, search integration is a future task)
- Notification bell (UI placeholder)
- User dropdown: My Profile + Sign Out

#### 3. `src/app/organization/[id]/layout.tsx` (new — 30 lines)
- Next.js layout wrapper for all `/organization/[id]/*` routes
- Renders: `OrgSidebar` | `OrgHeader` + `{children}` in flex layout
- Background gradient on main content area
- Uses `use(params)` to extract `organizationId` and pass to child components

---

### Files Modified

#### 4. `src/components/LayoutClient.tsx` (lines 27-36 modified)
- **Added:** `isOrgRoute` check (`pathname.startsWith("/organization")`)
- **Added:** Early return for org routes — renders `{children}` only, skipping global Header and Footer
- **Reason:** Org routes now have their own layout (OrgSidebar + OrgHeader). The global `Header` must not render on these routes to avoid a double header.

---

### Dependencies Added
- `lucide-react@^0.577.0` — Icon library used in sidebar and header (matches prototype)

---

### Navigation Links Wired (layout only — destination pages TBD)
| Nav Item | URL |
|---|---|
| Dashboard | `/organization/[id]` |
| Cases | `/organization/[id]/cases` |
| Users | `/organization/[id]/users` |
| Sites | `/organization/[id]/sites` |
| Settings | `/organization/[id]/settings` (hidden — not implemented) |
| My Site | `/organization/[id]/sites/[siteId]` |

---

### Next Steps
- Build `/organization/[id]/cases` page (all cases across all sites)
- Build `/organization/[id]/users` page (all users across all sites)
- Build `/organization/[id]/sites` page (all sites listing)
- Redesign existing org dashboard page content to match prototype
