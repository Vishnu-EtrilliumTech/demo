# Tasks: Site Creation

**Input**: `specs/003-site-creation/`
**Branch**: `003-site-creation`

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1=OrgAdmin creates site, US2=Site-level roles blocked, US3=Map coordinate picker

---

## Phase 1: Setup

**Purpose**: Verify existing infrastructure and create new file scaffolding.

- [ ] T001 Verify `createSite(organizationId, siteData)` in `src/app/organization/services/api.ts` posts to `/api/v1/organizations/{id}/sites` and accepts all 12 fields
- [ ] T002 [P] Verify `Site` interface in `src/app/organization/types/index.ts` covers all 12 fields: name, description, phoneNumber, emailId, address, pincode, district, state, landmark, locality, latitude, longitude
- [ ] T003 [P] Verify `useFormValidation`, `useToast`, `useUserRole` hooks are exported and accessible for use in the new page
- [ ] T004 Create directory `src/app/organization/[id]/sites/new/` for the Create Site form page
- [ ] T005 [P] Create directory `src/components/maps/` for the `SiteLocationPicker` component

---

## Phase 2: UI

**Purpose**: Build the Create Site form page and the Google Maps coordinate picker component.

- [ ] T006 [US1] Create `src/app/organization/[id]/sites/new/page.tsx` with `"use client"` — render 12 MUI TextField/TextArea/Select inputs for all site fields; include back button; render `<ErrorAlert errors={apiErrors} />` above form
- [ ] T007 [US1] Add MUI Submit button with `loading={loading}` disabled state in `src/app/organization/[id]/sites/new/page.tsx`
- [ ] T008 [US3] Create `src/components/maps/SiteLocationPicker.tsx` — wrap `@react-google-maps/api` `GoogleMap` + `Marker`; on map click call `onChange(lat, lng)`; Marker position tracks `props.lat`/`props.lng`; add `console.warn` on load failure
- [ ] T009 [US3] Lazy-load `SiteLocationPicker` in `src/app/organization/[id]/sites/new/page.tsx` via `next/dynamic({ ssr: false, loading: () => <Skeleton height={300} /> })` to exclude Google Maps JS from initial bundle
- [ ] T010 [US1] Add read-only latitude and longitude MUI TextFields in the form that update automatically when the map is clicked; also allow manual entry
- [ ] T011 [US2] Add RBAC gate to `src/app/organization/components/SiteManagementTab.tsx` — render "Create Site" button only when `canCreateSite = isOrgAdmin || isOrgClerk || isSystemAdmin` using `useUserRole(orgId)`

---

## Phase 3: Logic

**Purpose**: Implement form state, validation schema, RBAC guard, and submit handler.

- [ ] T012 [US1] Add `useState<CreateSiteForm>` for all 12 controlled inputs and `useState<boolean>` for `loading` and `useState<string[] | null>` for `apiErrors` in `src/app/organization/[id]/sites/new/page.tsx`
- [ ] T013 [US1] Build validation schema in the new page using `required`, `email`, `phone`, `maxLength` validators from `src/utils/validation.ts` for all 12 fields (no lat/lng rule — validated manually)
- [ ] T014 [US1] Wire `useFormValidation(schema)` — call `validateSingleField(field, value)` in each input's `onBlur`; call `validate(formData)` on submit
- [ ] T015 [US2] Add RBAC redirect at top of `src/app/organization/[id]/sites/new/page.tsx` — `useUserRole(orgId)` → if `!canCreateSite` → `router.replace(/organization/${orgId}/sites)` before rendering form
- [ ] T016 [US1] Implement `handleSubmit` — validate all fields + check `latitude !== 0 || longitude !== 0` (manual check); call `createSite(orgId, payload)`; on `201` call `showSuccess` + `router.push(/organization/${orgId}/sites)`; on 4xx call `extractApiErrors(err)` + `setApiErrors`
- [ ] T017 [US3] Implement map click handler `({ lat, lng }) => setForm(prev => ({ ...prev, latitude: lat, longitude: lng }))` and pass to `SiteLocationPicker` `onChange` prop

---

## Phase 4: API

**Purpose**: Confirm API service function and type are correct for all 12 fields.

- [ ] T018 Confirm `createSite()` in `src/app/organization/services/api.ts` accepts `CreateSitePayload` with all 12 fields and returns `201 { data: Site }`
- [ ] T019 [P] Confirm `Site` interface includes all 12 fields — add any missing ones (especially `latitude: number`, `longitude: number`) to `src/app/organization/types/index.ts`

---

## Phase 5: Backend

**Purpose**: Verify actual API behaviour against the plan contract.

- [ ] T020 Manually test POST `/api/v1/organizations/{orgId}/sites` with all 12 fields populated — confirm `201` response and site appears in subsequent GET
- [ ] T021 [P] Confirm backend accepts `latitude: 0, longitude: 0` — spec says zero coordinates are valid; verify backend does not reject with 400

---

## Phase 6: Security

**Purpose**: Enforce RBAC for site creation access and sanitise all inputs.

- [ ] T022 [US2] Verify RBAC redirect in `new/page.tsx` fires before any API call — site-level users (`SiteAdmin`, `SiteClerk`, etc.) must be redirected away immediately on page mount
- [ ] T023 [US1] Confirm `maxLength` validation prevents oversized payloads on all string fields before any API call — no raw string concatenation or template literals constructing form values
- [ ] T024 Verify Google Maps API key is only referenced via `process.env.NEXT_PUBLIC_GOOGLE_API_KEY` — never hardcoded in `SiteLocationPicker.tsx`

---

## Phase 7: Testing

**Purpose**: Unit and E2E test coverage for all three user stories.

- [ ] T025 [P] [US1] Write unit test `specs/003-site-creation/__tests__/NewSitePage.test.tsx` — form renders all 12 fields; submitting with empty fields shows inline errors; invalid email shows error; valid submit calls `createSite` with correct payload; API success redirects to sites list; API error renders `<ErrorAlert>`
- [ ] T026 [P] [US3] Write unit test `specs/003-site-creation/__tests__/SiteLocationPicker.test.tsx` — clicking map calls `onChange(lat, lng)` with correct coordinates
- [ ] T027 [P] [US2] Write unit test for RBAC gate — `SiteAdmin` role triggers redirect; `OrgAdmin` role renders form
- [ ] T028 Write E2E test `e2e/003-site-creation.spec.ts` — OrgAdmin creates site golden path; submit with blank fields shows all 12 inline errors; SiteAdmin cannot see "Create Site" button; map click updates lat/lng fields

---

## Phase 8: Logging

**Purpose**: Add logging per plan section 10 — no PII.

- [ ] T029 Add `console.error(error)` (never log token or PII) before setting `apiErrors` in `handleSubmit` in `new/page.tsx` on 4xx response; add `console.warn('Google Maps failed to load')` in `SiteLocationPicker.tsx` error boundary

---

## Phase 9: Quality Gates

**Purpose**: All pre-commit checks must pass.

- [ ] T030 Run `npm run type-check` — fix TypeScript errors in `new/page.tsx`, `SiteLocationPicker.tsx`, modified `SiteManagementTab.tsx`, and any updated types
- [ ] T031 [P] Run `npm run lint` — fix all ESLint warnings in new and modified files
- [ ] T032 Run `npm run build` — production build passes (Google Maps dynamic import must not break SSR build)
- [ ] T033 [P] Run `npm run test` — all new unit tests pass

---

## Phase 10: Finalization

**Purpose**: Final verification and commit.

- [ ] T034 Verify `next/dynamic({ ssr: false })` is applied correctly to `SiteLocationPicker` — build output must not include `@react-google-maps/api` in the server bundle
- [ ] T035 [P] Verify `SiteManagementTab.tsx` RBAC gate (`canCreateSite` check) is in the same PR as the new `new/page.tsx` — both must ship together
- [ ] T036 Commit: `feat(003): add Create Site page with Google Maps coordinate picker and RBAC gate`

---

## Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **UI (Phase 2)**: Depends on T004, T005 (directories); T009 depends on T008
- **Logic (Phase 3)**: Depends on T001–T003; T016 depends on T013–T015
- **API (Phase 4)**: Parallel with UI/Logic; depends on T001–T002
- **Backend (Phase 5)**: Depends on API (Phase 4)
- **Security (Phase 6)**: Depends on Logic (Phase 3)
- **Testing (Phase 7)**: Depends on UI + Logic + Security
- **Quality Gates (Phase 9)**: Depends on all implementation phases

### Parallel Opportunities

```
After Setup:
  [Parallel] UI (T006-T011) + Logic (T012-T017) + API (T018-T019)

After Implementation:
  [Parallel] T030 (type-check) + T031 (lint) + T033 (tests)
  [Parallel] T025 (page test) + T026 (map test) + T027 (RBAC test)
```
