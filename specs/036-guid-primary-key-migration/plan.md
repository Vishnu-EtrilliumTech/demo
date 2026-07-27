# Implementation Plan: GUID Primary Key Migration (Frontend)

**Branch**: `036-guid-primary-key-migration` | **Date**: 2026-07-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/036-guid-primary-key-migration/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

The backend has migrated every entity's primary key (and every foreign-key reference to it) from
`int` to GUID/`string`. This is a frontend-only correctness update: retype every affected
TypeScript field from `number` to `string`, remove `Number()`/`parseInt()` coercions that assumed
numeric ids, replace numeric zero/one sentinels ("no selection") with `null`/empty-string
conventions, fix identifier-based sort order to use explicit date fields, correctly consume two
documented backend response irregularities (non-standard id field name on organization/site
update; plain-list shape on legal-expert address creation), and update test fixtures/mocks to use
GUID-shaped values. Research (see `research.md`) found the codebase is **already partway
migrated** — route-level entity ids (`Case.id`, `Hearing.id`, `Task.id`, `Site.id`) are already
`string`, while nested/foreign-key reference fields on those same types (`assignedToId`,
`createdById`, `siteId`-as-relation, `organizationId`, `userId`) are still `number`. The technical
approach is a systematic per-field retype plus targeted logic fixes at every location identified
in `data-model.md`, verified by the existing Vitest/Playwright suites plus the manual walkthrough
in `quickstart.md`.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode), Next.js 15 (App Router), React 19
**Primary Dependencies**: MUI 6, Tailwind CSS 3, Styled Components 6, Redux Toolkit 2 +
Redux-Persist 6, Keycloak.js 26 (`@react-keycloak/web`), Axios 1
**Storage**: N/A (frontend consumes a REST API; browser localStorage via Redux-Persist for
`profile`/`legalExpert`/`client`/`ecourtsSearch` slices — no schema change to the persistence
mechanism itself, only to the shape of the ids stored within it)
**Testing**: Vitest + React Testing Library (unit, `src/**/*.test.tsx`), Playwright (E2E, `e2e/`)
**Target Platform**: Web (browser), existing Next.js deployment target — unchanged
**Project Type**: Web application, single Next.js frontend project (this repo); backend
(ASP.NET Core, out of scope — already migrated) is a separate repository
**Performance Goals**: No new performance target; existing Lighthouse ≥70 constraint
(Constitution Principle X) must not regress — this change does not alter render paths or data
volumes, only value types
**Constraints**: Zero behavior change to UX/layout (spec Assumption); no backward compatibility
with legacy numeric ids (spec Assumption — legacy/malformed ids resolve to "not found," not a
compatibility shim); no automatic persisted-state cleanup (spec Clarification — manual browser
storage clearing only)
**Scale/Scope**: Touches every domain module in `src/app/` — organizations, sites, users, cases
and all 7 case sub-resources, admin-dashboard list views, 3 Redux slices, plus the not-yet-built
legal-expert/appointment/payment/rating deep-flow areas (scoped as "build correctly when built,"
per `research.md`). Exact file/field inventory is in `data-model.md`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|---|---|
| I. Type Safety First | **Directly advanced by this feature.** The migration replaces incorrect `number` types with correct `string` types; no new `any` is introduced. All changed fields remain declared in domain `types/` folders per existing convention. PASS. |
| II. Security by Default | No XSS/CSP/sanitization surface touched. GUID string ids rendered in the DOM (e.g., in URLs, table rows) carry no new injection risk beyond what numeric ids already had — both are rendered as plain text/attributes, not `dangerouslySetInnerHTML`. PASS. |
| III. Test Coverage | Existing Vitest/Playwright suites are updated in place (GUID-shaped fixtures, rewritten `useCaseAccess.test.tsx` sentinel test) rather than added net-new, since this is a correctness fix to existing tested behavior, not a new user-facing feature requiring net-new E2E coverage. No golden-path/edge-case Playwright test is *removed*. PASS — existing coverage is the safety net for this migration itself. |
| IV. Authentication & Authorization Consistency | **Highest-risk touchpoint**: `useCaseAccess.ts`'s creator/assignee/contributor identity matching (today reliant on `Number(currentUserId)` + a `0`-sentinel) is a core authorization gate for case edit/delete/task/hearing/comment/contributor actions. The migration must preserve identical authorization *outcomes* while changing the comparison from numeric to string equality — flagged for extra scrutiny in the task breakdown and explicitly covered in `quickstart.md` §2.5. PASS, contingent on that scrutiny. |
| V. API Contract Discipline | This feature *is* the API-contract-discipline response to a backend breaking change (Organization/Site update field-naming quirk, Address-creation plain-list shape) — see `contracts/id-response-contracts.md`. Frontend service files are updated in the same effort as the contract change, per this principle's requirement. PASS. |
| VI. Component Architecture | No new components; no business logic moves into components. Retyping happens in existing `types/`, `services/`, and `hooks/` files, consistent with current architecture. PASS. |
| VII. Pre-commit Quality Gates | `tsc --noEmit` is the primary correctness signal for this migration (a `number`→`string` field change will surface every stale call site as a type error) — this gate is not just satisfied but actively load-bearing for the implementation strategy. PASS. |
| VIII. API Response Standards | No backend change is made; frontend continues to expect the existing envelope shape. The two documented field-naming/shape irregularities are accommodated as frontend-side normalization (§2–4 of `contracts/id-response-contracts.md`), consistent with the spec's Assumption that these are permanent, intentional backend behaviors. PASS. |
| IX–XII (Logging, Performance, External Integration, DB Migration) | Not applicable — this is a frontend-only, non-backend, non-integration, non-database change. N/A. |
| XIII. Pull Request Standards | Standard PR process applies; large surface area (many files) is inherent to the feature itself (a codebase-wide id-type correction), not scope creep — a single coordinated PR (or a small number of story-scoped PRs, one per user story priority) is appropriate rather than splitting arbitrarily. |
| XIV. Specification Governance | `spec.md` (with its Clarifications session) already exists and is committed; this `plan.md` follows it. `tasks.md` and `/speckit-analyze` are the next steps after this plan, per governance. PASS. |

No violations requiring Complexity Tracking justification for gate failures — the one entry in
Complexity Tracking below documents scope uncertainty (User Story 3's not-yet-built areas), not a
constitutional violation.

## Project Structure

### Documentation (this feature)

```text
specs/036-guid-primary-key-migration/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output — decisions and rationale
├── data-model.md        # Phase 1 output — full field-level change inventory
├── quickstart.md        # Phase 1 output — manual verification walkthrough
├── contracts/           # Phase 1 output — response-shape contracts for the two irregular endpoints
│   └── id-response-contracts.md
├── checklists/
│   └── requirements.md  # (pre-existing)
└── tasks.md              # Phase 2 output (/speckit-tasks command — NOT created by /speckit-plan)
```

### Source Code (repository root)

This is a single Next.js frontend project (no separate backend/frontend split within this repo —
the ASP.NET Core backend lives in a different repository and is out of scope). No new directories
are introduced; every change lands inside the existing structure:

```text
src/
├── app/
│   ├── organization/
│   │   ├── types/                          # index.ts, caseindex.ts, ecourtTypes.ts — primary retype surface
│   │   ├── services/                       # api.ts, caseapi.ts — coercion removal + 2 quirk-handling functions + 8 comment/reply signature changes
│   │   ├── components/                     # UserManagementTab.tsx, SitesTable.tsx, SiteManagementTab.tsx — sentinel/coercion fixes
│   │   └── [id]/
│   │       ├── page.tsx                     # org detail — coercion removal
│   │       ├── users/                       # user CRUD — sentinel fixes
│   │       └── sites/[siteId]/
│   │           ├── page.tsx
│   │           ├── users/[userId]/          # site user CRUD — parseInt(siteId) fixes
│   │           └── cases/[caseId]/
│   │               ├── types/case.ts        # CaseData, EditTitleFormState, EditFormData
│   │               ├── hooks/               # useCaseData, useCaseTasks, useCaseHearings, useCaseDocuments,
│   │               │                         # useCaseComments, useTaskComments, useCaseContributors, useCaseClients, useCaseInvoices
│   │               └── components/          # TasksTab, HearingsTab, DocumentsTab, CommentsTab, TaskCommentsTab,
│   │                                         # ContributorsCard, ClientsTab, InvoiceTab + Add/Edit modals
│   ├── admin-dashboard/services/types.ts    # list-row DTOs (id: number → string), no live logic yet
│   └── redux/
│       ├── searchProfile/profileSlice.ts
│       ├── legalExpert/legalExpertSlice.ts
│       └── client/clientSlice.ts
├── hooks/
│   ├── useCaseAccess.ts                     # highest-risk: authorization sentinel + Number() coercion
│   ├── useUserRole.ts
│   └── useCaseAccess.test.tsx               # rewritten sentinel test
├── components/modals/                       # EditTaskModal, AddTaskModal, EditUserModal, HearingModal,
│                                             # AddContributorModal, EditContributorAccessModal, AddCaseModal, AddSiteModal
└── types/pagination.ts                      # confirmed no change needed

e2e/
└── helpers/env.ts                           # cosmetic comment update only (illustrative URLs)
```

**Structure Decision**: No structural changes. This feature edits existing files in place across
the established `src/app/<domain>/{types,services,components}` and `src/hooks`/`src/components`
layout; no new top-level directories, no new architectural layer. The full file-by-field inventory
driving `tasks.md` generation is `data-model.md`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Item | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| User Story 3 deep-flow areas (legal-expert address/schedule/portfolio management, appointment booking, order/payment detail, rating replies) have little-to-no existing frontend implementation to migrate (see `research.md`) | The spec's acceptance scenarios describe behavior for UI that doesn't fully exist yet in `src/`. Rather than blocking the whole plan on this gap, the plan scopes P3 work to (a) retyping the ids that do exist today (admin list DTOs, Redux slice shapes) and (b) documenting the required contract for when the deeper UI is built (`contracts/id-response-contracts.md` §4) | Deferring the entire feature until that UI exists was rejected — P1/P2 (Organizations/Sites/Users, Cases) are fully implemented today and are the highest-traffic, highest-risk areas; blocking them on unrelated unbuilt P3 UI would leave real, currently-broken-under-GUIDs code unfixed |
