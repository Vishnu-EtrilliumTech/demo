# Implementation Plan: Case Contributors — Org/Site Scoping & Eligible-Users Picker

**Branch**: `034-case-contributors-scoping` | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/034-case-contributors-scoping/spec.md`

## Summary

Adopt three additive backend changes that refine feature 033's Case Contributors capability:

1. **New eligible-users endpoint** — `GET …/contributors/available-users` returns exactly the
   site members who can be added (excludes creator, assignee, existing contributors, and admins).
   The Add Contributor picker switches its data source from "all site members filtered in the
   browser" to this authoritative list, closing the admin-exclusion gap that currently causes
   surprise `400` rejections.
2. **`siteId` + `organizationId` added to `CaseContributorResponse`** — surfaced on the
   `CaseContributor` type for completeness; consumption is optional and non-breaking.
3. **Site-scoped contributor list (behavior)** — `GET …/contributors` is now scoped to the
   `{siteId}` in the URL. The frontend already calls it with site context, so no code change is
   required; verified only.

Technical approach: a thin new service function + a small data hook for the eligible list, wired
into the existing `ContributorsTab` → `AddContributorModal` chain, replacing the `siteUsers`
prop and the in-modal `eligibleMembers` client filter. No request payloads change. Task/hearing
flows are untouched.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 19, Next.js 15 (App Router)
**Primary Dependencies**: MUI 6 (Autocomplete/Dialog), Axios (via `caseapi.ts` service layer),
existing `useToast` + `errorHandler` utilities
**Storage**: N/A (frontend; backend owns persistence — now org/site-scoped)
**Testing**: Vitest + React Testing Library (unit/component), Playwright (E2E)
**Target Platform**: Modern browsers (web app)
**Project Type**: Web frontend (single Next.js app; backend is a separate ASP.NET Core service)
**Performance Goals**: Eligible-users list fetched on tab/picker open; no perceptible lag (<1s on
typical site membership sizes)
**Constraints**: Additive integration — no existing route/method/payload changes; existing
add/edit/remove and task/hearing flows must not regress
**Scale/Scope**: ~6 frontend files touched (1 type, 1 service fn, 1 hook, 1 modal, 1 tab, 1 page
wiring) plus tests; single feature tab

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety First | ✅ PASS | New `AvailableUser` interface + `siteId`/`organizationId` added to `CaseContributor` in `types/caseindex.ts`. No `any`; response shapes typed. |
| II. Security by Default | ✅ PASS | No `dangerouslySetInnerHTML`, no new markdown. Picker is display-only text. Server is the authorization gate; UI eligibility is UX-only. |
| III. Test Coverage | ✅ PASS | RTL tests for the updated `AddContributorModal`; unit test for the new hook; Playwright golden-path + empty/error edge cases. |
| IV. Auth & Authz Consistency | ✅ PASS | New call goes through the shared Axios instance with Bearer token + 401 interceptor. Manage-controls gating via `useCaseAccess` unchanged. |
| V. API Contract Discipline | ✅ PASS | New call lives in `caseapi.ts` (domain service); errors routed through `errorHandler`/`useToast`; no direct `httpServices` import in components. |
| VI. Component Architecture | ✅ PASS | Reuses MUI Autocomplete; business logic stays in hook/service, not the component. Feature-specific UI stays co-located. |
| VII. Pre-commit Quality Gates | ✅ PASS | `tsc → eslint → next build` must pass; no `--no-verify`. |
| VIII. API Response Standards | ✅ PASS | Consumes the standard `{ data }` / `{ errors }` envelope already handled in `caseapi.ts`. |
| IX. Logging & Observability | ✅ N/A | Frontend; no sensitive logging introduced (only name/email displayed). |

**Result**: PASS — no violations, Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/034-case-contributors-scoping/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── available-users-api.md
└── checklists/
    └── requirements.md  # From /speckit-specify
```

### Source Code (repository root)

```text
src/
├── app/organization/
│   ├── types/
│   │   └── caseindex.ts                         # + AvailableUser; + siteId/organizationId on CaseContributor
│   ├── services/
│   │   └── caseapi.ts                           # + fetchAvailableContributorUsers()
│   └── [id]/sites/[siteId]/cases/[caseId]/
│       ├── hooks/
│       │   ├── useAvailableContributorUsers.ts  # NEW data hook (list + loading + refetch)
│       │   └── index.ts                         # export new hook
│       ├── components/ContributorsTab/
│       │   └── ContributorsTab.tsx              # swap siteUsers → availableUsers props
│       └── page.tsx                             # wire new hook; refetch on add success
└── components/modals/
    ├── AddContributorModal.tsx                  # consume availableUsers; drop client-side filter
    └── AddContributorModal.test.tsx             # update tests for new prop contract
```

**Structure Decision**: Single Next.js frontend app. The eligible-users feature is an additive
slice over the existing feature-033 contributor stack: domain service call in `caseapi.ts`, a
co-located data hook under the case route's `hooks/`, and prop changes down the existing
`page.tsx → ContributorsTab → AddContributorModal` chain. The shared modal stays in
`src/components/modals/` (already reused via the tab). No new routes or backend code.

## Complexity Tracking

> No constitution violations. Section intentionally empty.
