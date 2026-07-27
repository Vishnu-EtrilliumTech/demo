# Research & Design Decisions: Organization Registration (001)

## Decision 1 — API Endpoint Reality vs Spec

**Decision**: Use `POST /api/v1/organizations` (base org URL), not `POST /api/v1/organizations/register` as written in the spec.

**Rationale**: Inspected `src/app/organization/services/api.ts` line 688–699. The existing `registerOrganization()` function posts to `ORG_API_BASE_URL`, which resolves to `{NEXT_PUBLIC_API_BASE_URL}/api/v1/organizations`. The `/register` suffix in the spec was either a mistake or the backend team uses the same base POST for registration. All existing invocations use this form.

**Alternatives Considered**: Adding a new function that POSTs to `/api/v1/organizations/register` — rejected because it would create duplicate code and possibly hit an undefined endpoint. Confirm with backend before changing.

---

## Decision 2 — Refactor vs Extend Existing Register Page

**Decision**: Refactor the `organizationuser` section of `src/app/register/page.tsx` to conform to architecture patterns rather than creating a new separate route.

**Rationale**: The existing `/register?role=organizationuser` route is already linked from various onboarding flows. Changing the URL would break those links. The safer approach is to clean up the existing page's org section: replace inline `validateForm()` with `useFormValidation`, replace `setError(string)` with `useToast()`, add redirect guard, and fix the success redirect from `/success` to `/organization/[id]`.

**Alternatives Considered**: Creating `src/app/organization-registration/page.tsx` as a new route — rejected because it duplicates routing concerns and requires updating all entry points.

---

## Decision 3 — Segments Field UI Control

**Decision**: Use MUI `Autocomplete` with `multiple` prop instead of the custom `MultiSelectDropdown` built in the existing register page.

**Rationale**: MUI `Autocomplete` is already used elsewhere in the project and is accessible (ARIA-compliant) out of the box. The custom `MultiSelectDropdown` in `page.tsx` is a bespoke implementation with its own focus/keyboard handling that would need testing. The architecture pattern says "MUI dialogs, tables, selects, autocomplete already provided by MUI — don't reinvent."

**Alternatives Considered**: Keeping the custom `MultiSelectDropdown` — rejected to stay consistent with project conventions. Using MUI `Select` with `multiple` prop — valid alternative, but `Autocomplete` gives typeahead search which is useful as the segments list grows.

---

## Decision 4 — Form Logic Location (Hook vs Component)

**Decision**: Extract all form state and submit logic into `useOrgRegistrationForm` hook at `src/app/register/_hooks/useOrgRegistrationForm.ts`.

**Rationale**: The architecture principle states "business logic in custom hooks, NOT in React components." The current `page.tsx` violates this by embedding `validateForm()`, `handleSubmit()`, and API calls directly in the component. The hook approach also makes unit testing trivial — test the hook, not the rendering.

**Alternatives Considered**: Keeping logic in the component — rejected per architecture. Using a separate `services/registrationService.ts` for the business logic — partially valid but the form state itself must live in a hook (React rules), so the split would be artificial.

---

## Decision 5 — Redirect Guard Strategy

**Decision**: Call `fetchOrganizationByUserEmail(user.email)` inside `useOrgRegistrationForm` on mount (before form renders). While checking, show a full-page `CircularProgress`. If org found, return `existingOrgId` and let the page component call `router.push()`.

**Rationale**: The check must happen before any form renders (FR-005). Using a hook-level check keeps the page component thin. Returning `existingOrgId` from the hook lets the page decide navigation, maintaining separation.

**Alternatives Considered**: Server-side redirect using Next.js `redirect()` in a Server Component — not viable because this page needs Keycloak (client-only). Middleware check — possible future enhancement but overkill for a single feature.

---

## Decision 6 — Success Redirect Target

**Decision**: On 201 response, redirect to `/organization/${orgId}` where `orgId` comes from `response.data.data.id`.

**Rationale**: The spec says "redirect to the organization dashboard." The org dashboard route is `src/app/organization/[id]/page.tsx`. The current code redirects to `/success` (a generic page) which does not serve the user's next action.

**Alternatives Considered**: Redirecting to `/success` and adding a "Go to Dashboard" button there — poor UX, adds an extra click. Redirecting to `/organization` without an ID and letting that page figure it out — fragile.

---

## Decision 7 — Phone Field Input Handling

**Decision**: Use `inputMode="numeric"` on MUI TextField + strip non-digit characters in `onChange` + validate with `ValidationPatterns.phone` (`/^[6-9]\d{9}$/`) on blur and submit.

**Rationale**: The existing page uses an over-permissive regex that accepts `+` and `-` characters. The spec requires strict 10-digit starting with 6–9 (Indian mobile format), which matches the project's `ValidationPatterns.phone` in `src/utils/validation.ts`. Stripping non-digits on `onChange` prevents user confusion without showing an error mid-typing.

**Alternatives Considered**: Using `type="number"` — rejected because it adds browser spinner controls. Allowing hyphens/spaces — rejected per spec.

---

## Decision 8 — Co-location of Form Component

**Decision**: Co-locate `OrgRegistrationForm.tsx` inside `src/app/register/_components/` (Next.js private folder convention) rather than `src/components/`.

**Rationale**: The architecture rule: "shared components go in `src/components/` only if used in 2+ distinct routes." This form is used only in the registration route. Using Next.js `_` prefix convention ensures it is not treated as a route segment.

**Alternatives Considered**: Putting in `src/components/org/` — rejected because it implies reuse that doesn't exist yet. Putting directly in `src/app/register/` — fine, but the `_components/` pattern is cleaner for multiple sub-files.

---

## Decision 9 — Error Display Strategy

**Decision**: API-level errors (400 response body, network failures) go through `useToast().showError()`. Field-level validation errors remain inline via `useFormValidation` `errors` record displayed as MUI TextField `helperText`.

**Rationale**: The constitution mandates "all errors shown via `useToast()`, never swallowed silently." However, inline field errors from client-side validation (e.g., "phone must be 10 digits") are better UX as they sit next to the offending field. The two layers are complementary. For API errors that map to a specific field (e.g., duplicate email), `setFieldError('emailId', ...)` can be called additionally.

**Alternatives Considered**: Showing all errors (including API) as inline field errors only — rejected because API errors may not map to a specific field. Showing all errors (including field validation) in the toast only — poor UX, user doesn't know which field to fix.

---

## Key Unknowns Resolved

| Unknown | Resolution |
|---|---|
| Does `registerOrganization()` need changes? | No — function exists, types exist, no changes needed |
| What is the exact segments list? | Hardcoded `['Legal', 'Insurance']` (confirmed from existing `page.tsx` line 775). Backend-driven list is a future enhancement. |
| Where does the org dashboard route live? | `src/app/organization/[id]/page.tsx` — confirmed by directory listing |
| Is there an existing redirect guard? | No — existing page has no guard, gap confirmed by code inspection |
| Does `fetchOrganizationByUserEmail` handle 404? | Yes — returns `null` on 404/403 (line 714–717 in `api.ts`) |
