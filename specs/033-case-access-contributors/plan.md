# Implementation Plan: Case Access Control & Contributors

**Branch**: `033-case-access-contributors` | **Date**: 2026-06-16 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/033-case-access-contributors/spec.md`

## Summary

Adapt the Lawsome web UI to the backend's new graded case-access model and Case Contributors capability. Three coordinated frontend changes: (1) a new **Contributors** tab on the case detail page (list/add/edit-level/remove), placed next to Clients and gated to admins/creator/assignee; (2) a reusable **client-side access-ladder computation** (`useCaseAccess`) that mirrors the backend None/View/Edit/Full resolution and is consumed across all case tabs to **hide** controls the backend would reject; and (3) **resilient list + error handling** for the now row-filtered case list (shorter lists, empty-state guidance) plus an optional contributor access-level selector on task/hearing assignment forms. All API access goes through the existing domain-scoped service file; UI uses MUI 6; role/identity comes from the existing `useUserRole` hook. The backend remains the authorization source of truth — client gating is UX-only per Constitution Principle IV.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode), React 19, Next.js 15 (App Router)
**Primary Dependencies**: MUI 6, Axios 1 (Bearer injection + 401 refresh), Redux Toolkit 2 (for current-user identity via `profile` slice), `@react-keycloak/web`
**Storage**: N/A (frontend; backend owns `case_contributors` table). No new persisted Redux slice required.
**Testing**: Vitest + React Testing Library (unit, esp. the access-ladder pure function), Playwright (E2E for the Contributors tab golden path + edge cases)
**Target Platform**: Modern browsers (Next.js web app)
**Project Type**: Web application — frontend only for this feature (backend already delivered)
**Performance Goals**: No render regression on the case detail page or case list; access computation is a synchronous pure function over already-loaded data (roles, case, contributors). Lighthouse on case pages must not regress below 70 (Constitution X).
**Constraints**: Client-side RBAC is UX-only and MUST NOT be the security gate (Constitution IV); all API errors routed through `errorHandler.ts` + `useToast()` (Constitution V); API response shapes declared as TypeScript interfaces in the domain `types/` folder (Constitution I).
**Scale/Scope**: ~1 new tab component + add/edit/remove modals, 1 new hook for access computation, 1 new hook for contributor data, ~4 new service functions, 1 new types group, minor edits to the case detail page, case list pages, and task/hearing assignment forms. Contributor lists per case are small (site-member scale, typically < 50).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Type Safety First | PASS | New `CaseContributor`, request/response, and `ContributorAccessLevel` enum + derived `CaseAccessLevel` declared as interfaces in `types/`. No `any`. |
| II. Security by Default | PASS | No `dangerouslySetInnerHTML`/markdown. Contributor names/emails rendered as plain text. No new tokens/storage. |
| III. Test Coverage | PASS (planned) | Access-ladder pure function gets Vitest unit tests (all ladder rows + nuances); Contributors tab gets Playwright E2E (golden path + empty + 401 edge cases). |
| IV. AuthN/AuthZ Consistency | PASS | `useUserRole()` used for all gates; client checks explicitly UX-only; backend 401 remains authoritative and is handled gracefully. |
| V. API Contract Discipline | PASS | New calls added to the domain service file `src/app/organization/services/...`; components never import `httpServices` directly; 401 handled via existing Axios refresh + toast. |
| VI. Component Architecture | PASS | Feature UI co-located under the case route; access hook in `src/hooks/`; business logic kept out of components; MUI 6 reused (Dialog, Table, Autocomplete, Select). |
| VII. Pre-commit Quality Gates | PASS | tsc + eslint + next build must pass; no `--no-verify`. |
| VIII. API Response Standards | PASS (consumes) | Consumes the standard `{ data }` / `{ errors }` envelope; contributor list is a small per-case array (backend-defined, not the paginated wrapper). |
| IX. Logging & Observability | N/A | Frontend feature; no PII beyond name/email already displayed elsewhere; nothing sensitive logged. |
| X. Performance & Query Standards | PASS | Access computation memoized; large lists already use existing patterns; no new images. |
| XI. External Integration | N/A | No Twilio/Razorpay involvement. |
| XII. DB Migration Governance | N/A | Backend owns schema; no frontend migration. |
| XIII. PR Standards | PASS (process) | Single-feature PR referencing this spec; CI gate evidence; security + quality checklist. |
| XIV. Specification Governance | PASS | spec.md + plan.md committed; clarifications recorded; `/speckit-analyze` to run after tasks.md. |

**Result**: No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/033-case-access-contributors/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── contributors-api.md       # Contributor service contract (endpoints → service fns)
│   └── access-ladder.md          # Client-side access computation contract
├── checklists/
│   └── requirements.md  # Spec quality checklist (already present)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── app/organization/
│   ├── types/
│   │   └── caseindex.ts                      # EXTEND: ContributorAccessLevel enum, CaseContributor,
│   │   │                                       #   AddCaseContributorRequest, UpdateCaseContributorRequest,
│   │   │                                       #   CaseContributorResponse/ListResponse;
│   │   │                                       #   + newAssigneeContributorAccessLevel? on task/hearing requests
│   │   └── services/
│   │       └── api.ts                         # EXTEND: fetchCaseContributors, addCaseContributor,
│   │                                            #   updateCaseContributor, removeCaseContributor
│   └── [id]/
│       ├── cases/page.tsx                      # EDIT: org-level list — empty-state guidance, render as-returned
│       └── sites/[siteId]/
│           ├── page.tsx                        # EDIT (#cases section): site list empty-state guidance
│           └── cases/[caseId]/
│               ├── page.tsx                    # EDIT: insert Contributors tab next to Clients; gate Delete Case
│               ├── hooks/
│               │   ├── index.ts                # EXTEND exports
│               │   └── useCaseContributors.ts  # NEW: list/add/update/remove + loading/error state
│               └── components/
│                   ├── index.ts                # EXTEND exports
│                   └── ContributorsTab/
│                       ├── ContributorsTab.tsx # NEW: table + manage controls (gated)
│                       └── ContributorsTab.module.css
├── components/modals/
│   ├── AddContributorModal.tsx                 # NEW: member Autocomplete (filtered) + access-level Select
│   └── EditContributorAccessModal.tsx          # NEW: access-level Select
└── hooks/
    └── useCaseAccess.ts                        # NEW: pure ladder computation → { entityLevel, resourceLevel, canManageContributors, ... }
```

**Structure Decision**: Single Next.js frontend project (Option 1, web frontend). The feature is fully co-located under the existing `organization/[id]/sites/[siteId]/cases/[caseId]` route per Constitution VI, except the cross-cutting `useCaseAccess` hook (consumed by multiple tabs and the case page) which belongs in shared `src/hooks/`, and the two contributor modals which follow the existing `src/components/modals/` convention used by ClientsTab.

## Complexity Tracking

> No Constitution Check violations — section intentionally empty.
