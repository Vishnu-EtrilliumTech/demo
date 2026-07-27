# Implementation Plan: Site Creation

**Branch**: `003-site-creation` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)

---

## 1. Overview

Allow `OrganizationAdmin`, `OrganizationClerk`, and `SystemAdmin` users to create a new site (physical branch/location) under their organization. Site-level roles (`SiteAdmin`, `SiteClerk`, etc.) must never see the "Create Site" action.

The form collects 12 mandatory fields — name, description, phone, email, address, pincode, district, state, landmark, locality, latitude, longitude — and provides a Google Maps coordinate picker for lat/lng. On success a toast is shown and the sites list refreshes.

**What already exists:**
- `createSite(organizationId, siteData)` in [src/app/organization/services/api.ts](../../src/app/organization/services/api.ts)
- `Site` interface in [src/app/organization/types/index.ts](../../src/app/organization/types/index.ts)
- `useFormValidation` hook, `useToast`, `useUserRole` hooks
- Validation primitives (`required`, `email`, `phone`, `maxLength`) in `src/utils/validation.ts`

**What must be built:**
- `src/app/organization/[id]/sites/new/page.tsx` — the Create Site form page (does not exist yet)
- Google Maps `ClickableMap` picker sub-component (lazy-loaded)
- RBAC gate at the SiteManagementTab level (hide "Create Site" button for site-level roles)

---

## 2. Architecture Flow

```
User (OrgAdmin / OrgClerk) clicks "Create Site"
  → Next.js navigates to /organization/[id]/sites/new
  → NewSitePage renders (Client Component, "use client")
  → useUserRole(organizationId) checks roles → gates render
  │
  ├─ Google Maps Picker (next/dynamic, ssr:false)
  │   └─ onClick(lat, lng) → sets form.latitude / form.longitude
  │
  ├─ Form fields (controlled inputs via useState)
  │   └─ blur → validateSingleField(field, value)
  │
  └─ Submit
      ├─ validate(formData) — full schema pass
      ├─ createSite(orgId, payload) → POST /api/v1/organizations/{id}/sites
      ├─ 201 → showSuccess() → router.push(`/organization/${id}/sites`)
      └─ 4xx → extractApiErrors(err) → <ErrorAlert />
```

**RBAC gate (SiteManagementTab):**
- `useUserRole` returns role flags
- `canCreateSite = isOrgAdmin || isOrgClerk || isSystemAdmin`
- "Create Site" button rendered only when `canCreateSite === true`

---

## 3. File Structure

```text
src/app/organization/[id]/sites/
├── new/
│   └── page.tsx                   # NEW — Create Site form page
│
src/app/organization/components/
└── SiteManagementTab.tsx          # MODIFY — add RBAC gate on "Create Site" button

src/app/organization/types/
└── index.ts                       # VERIFY — Site interface covers all 12 fields

specs/003-site-creation/
├── spec.md
├── plan.md                        # This file
├── research.md
├── data-model.md
└── contracts/
    └── create-site.json           # OpenAPI-style request/response schema
```

**Google Maps component** (lazy-loaded inside `new/page.tsx`):
```text
src/components/maps/
└── SiteLocationPicker.tsx         # NEW — wraps @react-google-maps/api GoogleMap + Marker
```

---

## 4. Component Design

### `NewSitePage` (`src/app/organization/[id]/sites/new/page.tsx`)

```typescript
"use client"

State:
  form: CreateSiteForm          // controlled inputs
  loading: boolean              // submit in-flight
  apiErrors: string[] | null    // surface API errors

Hooks:
  useUserRole(organizationId)   // RBAC gate
  useFormValidation(schema)     // blur + submit validation
  useToast()                    // success/error notifications
  useRouter()                   // redirect on success

Render:
  <Back button>
  <ErrorAlert errors={apiErrors} />
  <form onSubmit={handleSubmit}>
    <TextInput name="name"        maxLength=100 required />
    <TextArea  name="description" maxLength=500 required />
    <TextInput name="phone"       type="tel"   required />
    <TextInput name="email"       type="email" required />
    <TextInput name="address"     maxLength=200 required />
    <TextInput name="pincode"     maxLength=10  required />
    <TextInput name="district"    maxLength=100 required />
    <Select    name="state"       options=[...states] required />
    <TextInput name="landmark"    maxLength=100 required />
    <TextInput name="locality"    maxLength=100 required />
    <SiteLocationPicker onChange={({lat, lng}) => setCoords(lat, lng)} />
    <TextInput name="latitude"    type="number" readOnly />
    <TextInput name="longitude"   type="number" readOnly />
    <SubmitButton loading={loading} />
  </form>
```

### `SiteLocationPicker` (`src/components/maps/SiteLocationPicker.tsx`)

```typescript
Props: { lat: number; lng: number; onChange: (lat: number, lng: number) => void }

Loaded via next/dynamic({ ssr: false }) from NewSitePage.
Uses @react-google-maps/api: GoogleMap + Marker.
onClick on map → calls onChange(e.latLng.lat(), e.latLng.lng()).
Marker position tracks props.lat / props.lng.
```

### Validation Schema

```typescript
const schema = {
  name:        { rules: [required('Name'), maxLength('Name', 100)] },
  description: { rules: [required('Description'), maxLength('Description', 500)] },
  phone:       { rules: [required('Phone'), phone()] },
  email:       { rules: [required('Email'), email()] },
  address:     { rules: [required('Address'), maxLength('Address', 200)] },
  pincode:     { rules: [required('Pincode'), maxLength('Pincode', 10)] },
  district:    { rules: [required('District'), maxLength('District', 100)] },
  state:       { rules: [required('State')] },
  landmark:    { rules: [required('Landmark'), maxLength('Landmark', 100)] },
  locality:    { rules: [required('Locality'), maxLength('Locality', 100)] },
};
// latitude/longitude: required > 0 checked manually before submit
```

---

## 5. API Plan

### Endpoint used

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/organizations/{orgId}/sites` | Create site |

### Request payload (`CreateSitePayload`)

```typescript
interface CreateSitePayload {
  name: string;          // max 100
  description: string;   // max 500
  phoneNumber: string;   // 10-digit
  emailId: string;       // valid email
  address: string;       // max 200
  pincode: string;       // max 10
  district: string;      // max 100
  state: string;         // max 100
  landmark: string;      // max 100
  locality: string;      // max 100
  latitude: number;
  longitude: number;
}
```

### Response

Success `201`:
```json
{ "success": true, "data": { /* Site object */ }, "message": null }
```

Failure `400`:
```json
{ "success": false, "message": "...", "errors": ["..."] }
```

### Service function

Existing `createSite(organizationId, siteData)` in [src/app/organization/services/api.ts](../../src/app/organization/services/api.ts) — **no changes required** to the service layer, only the form page is new.

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| Client-side RBAC bypass | Server validates `[Authorize(Roles = "OrganizationAdmin,OrganizationClerk,SystemAdmin")]`; UI is UX-only |
| XSS via form inputs | All inputs rendered via controlled React state (never `dangerouslySetInnerHTML`); MUI/HTML inputs escape by default |
| Google Maps API key exposure | Key is `NEXT_PUBLIC_GOOGLE_API_KEY` — browser-public by design; restrict to domain in Google Cloud Console |
| Coordinate tampering | Backend stores whatever coordinates are submitted; no server-side geographic validation needed for this feature |
| Oversized payloads | `maxLength` validation on all string fields; backend also validates via DataAnnotations |
| Auth header leakage | `getToken()` returns Keycloak JWT added per-request; token stored in localStorage (acceptable per constitution §II) |

---

## 7. State Management

No Redux slice is needed for site creation. All state is local to the form page:

| State | Type | Location | Notes |
|-------|------|----------|-------|
| `form` | `CreateSiteForm` | `useState` in `NewSitePage` | Controlled inputs |
| `loading` | `boolean` | `useState` | Submit in-flight flag |
| `apiErrors` | `string[] \| null` | `useState` | API error display |
| `errors` | `Record<string, string>` | `useFormValidation` | Inline field errors |

After successful creation the user is redirected to `/organization/${id}/sites`. The sites list page re-fetches `fetchOrganizationSites` on mount, so no manual store update is needed.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test | File |
|------|------|
| Form renders all 12 fields | `specs/003-site-creation/__tests__/NewSitePage.test.tsx` |
| Submitting with empty fields shows inline errors | same |
| Invalid email shows email error | same |
| Submit calls `createSite` with correct payload | same (mock api) |
| Success redirects to sites list | same |
| API error renders `<ErrorAlert>` | same |
| `SiteLocationPicker` calls `onChange` on map click | `__tests__/SiteLocationPicker.test.tsx` |

### E2E Tests (Playwright)

| Scenario | Priority |
|----------|----------|
| OrgAdmin creates a site — golden path | P1 |
| Submit with all fields blank — all inline errors appear | P1 |
| Map click sets latitude/longitude fields | P3 |
| SiteAdmin cannot see "Create Site" button | P2 |

Test file: `e2e/003-site-creation.spec.ts`

---

## 9. Performance

| Concern | Strategy |
|---------|----------|
| Google Maps bundle size | Load `SiteLocationPicker` via `next/dynamic({ ssr: false, loading: () => <Skeleton> })` — map JS excluded from initial bundle |
| Map load time | `GoogleMapProvider` initialized once; `NEXT_PUBLIC_GOOGLE_API_KEY` set in env |
| State updates | Single `setForm` call per change event; no derived computations on every render |
| Lighthouse score | Form page is a new route — not on the key pages list (home, search, dashboard); no regression risk |

---

## 10. Logging

Per constitution §IX (Lawsome frontend logging strategy):

| Event | What to log | Where |
|-------|-------------|-------|
| Site creation success | Nothing — success is visible to the user via toast | N/A |
| Site creation failure (4xx) | `console.error` with the error object (never log tokens or PII); error surfaced via `<ErrorAlert>` | `NewSitePage.handleSubmit` |
| Google Maps load failure | `console.warn('Google Maps failed to load')` | `SiteLocationPicker` error boundary |
| Role gate triggered | No log needed — UI simply does not render the button | N/A |

Backend logging (Serilog) handles site creation audit events server-side per constitution §IX.

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Google Maps API key missing or domain-restricted | Medium | Map picker broken; users cannot pick coordinates | Validate key in env on page load; show fallback manual lat/lng inputs |
| State dropdown reference data unavailable (spec 032 dependency) | Low | State field cannot be a dropdown | Implement as free-text input initially; upgrade to dropdown when 032 ships |
| Backend enforces `latitude ≠ 0.0 AND longitude ≠ 0.0` | Low | Zero-coordinate submission rejected | Spec allows zero coordinates; confirm with backend team. If rejected, add UI warning. |
| Site creation API returns 404 (wrong org ID) | Low | Silent navigation failure | Validate orgId from params before submitting; show error if invalid |
| SiteManagementTab RBAC gate not applied | High | Site-level users see "Create Site" | Covered by `useUserRole` check; must be added in this PR alongside the new page |
