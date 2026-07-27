# Lawsome Constitution

## Table of Contents

1. [Core Principles](#core-principles)
   - [I. Type Safety First](#i-type-safety-first-non-negotiable)
   - [II. Security by Default — XSS & Web Safety](#ii-security-by-default--xss--web-safety-non-negotiable)
   - [III. Test Coverage Requirements](#iii-test-coverage-requirements-recommended)
   - [IV. Authentication & Authorization Consistency](#iv-authentication--authorization-consistency-non-negotiable)
   - [V. API Contract Discipline](#v-api-contract-discipline-recommended)
   - [VI. Component Architecture](#vi-component-architecture-recommended)
   - [VII. Pre-commit Quality Gates](#vii-pre-commit-quality-gates-non-negotiable)
   - [VIII. API Response Standards](#viii-api-response-standards-non-negotiable)
   - [IX. Logging & Observability](#ix-logging--observability-non-negotiable)
   - [X. Performance & Query Standards](#x-performance--query-standards-recommended)
   - [XI. External Integration Standards](#xi-external-integration-standards-recommended)
   - [XII. Database Migration Governance](#xii-database-migration-governance-recommended)
   - [XIII. Pull Request Standards](#xiii-pull-request-standards-non-negotiable)
   - [XIV. Specification Governance](#xiv-specification-governance-non-negotiable)
2. [Technology Stack](#technology-stack)
   - [Frontend Stack — Lawsome.Web.UI](#frontend-stack--lawsomewebui)
   - [Backend Stack — Lawsome (ASP.NET Core)](#backend-stack--lawsome-aspnet-core)
3. [Governance](#governance)

## Core Principles

### I. Type Safety First (NON-NEGOTIABLE)

TypeScript strict mode (`"strict": true`) MUST be enabled across all frontend source files.
The use of `any` is prohibited without an accompanying inline comment justifying the exception
and a TODO referencing a tracking issue for removal.

All API response shapes MUST be declared as TypeScript interfaces in a `types/` folder
co-located with the domain module (e.g., `src/app/organization/types/`). Inline type assertions
against raw API payloads are not permitted.

### II. Security by Default — XSS & Web Safety (NON-NEGOTIABLE)

Security violations in this principle block merge; no exceptions without an explicit security
review sign-off.

- `dangerouslySetInnerHTML` MUST NOT be used unless the value has been sanitized through
  DOMPurify immediately before rendering. Unsanitized dynamic HTML is forbidden.
- User-generated content rendered via `react-markdown` MUST use an explicit `allowedElements`
  allowlist. Default permissive rendering is prohibited.
- Inline event handlers (`onclick="..."`) and dynamic `<script>` injection are forbidden.
- Content Security Policy headers MUST be declared in `next.config.ts` (`headers()` export).
  At minimum: `default-src 'self'`, restricted `script-src`, and `frame-ancestors 'none'`.
- For tokens accessible to SSR (server components, API routes), HTTP-only cookies MUST be
  preferred over `localStorage`. Client-side Keycloak tokens in `localStorage` are acceptable
  only for the OAuth redirect flow where SSR cannot participate.
- All form inputs MUST be validated client-side via the `useFormValidation` hook AND
  server-side at the ASP.NET Core API layer. Client-side validation is UX only; server-side
  validation is the security gate.

### III. Test Coverage Requirements (RECOMMENDED)

#### Frontend

- Playwright E2E tests MUST be written for every new user-facing feature covering the golden
  path and at minimum two edge cases (error state, empty state, or boundary input).
- All shared components placed in `src/components/` MUST have React Testing Library unit tests.
- Form validation rules in `src/utils/validation.ts` MUST have unit test coverage for each
  rule exported.

#### Backend (ASP.NET Core — Lawsome)

- NUnit unit tests MUST be added to `Services.Tests` for every new public method in the
  service layer. Moq is used for all external dependency mocking.
- Reqnroll (BDD) acceptance tests MUST cover critical business flows: legal expert matching,
  case creation, payment processing, and Keycloak role-gated API access.
- FluentAssertions MUST be used for all assertion style; raw `Assert.*` calls are discouraged.

### IV. Authentication & Authorization Consistency (NON-NEGOTIABLE)

- Every protected Next.js page MUST check Keycloak authentication state before rendering any
  protected content. The `useUserRole()` hook MUST be used for RBAC gates within components.
- Backend API endpoints MUST be decorated with `[Authorize]` and scoped to the appropriate
  Keycloak role claim. Client-side role checks are UX-only conveniences and MUST NOT substitute
  for server-side authorization.
- The Keycloak token refresh window is 30 seconds before expiry. On refresh failure the user
  MUST be force-logged out immediately.
- On logout, the Redux store MUST dispatch the `PURGE` action to clear all persisted slices and
  prevent data leakage between user sessions.

### V. API Contract Discipline (RECOMMENDED)

- Frontend API calls MUST be encapsulated in domain-scoped service files under `services/`
  within each route module. Components MUST NOT import from `src/services/httpServices` directly.
- All API errors MUST be routed through `src/utils/errorHandler.ts` and surfaced to the user
  via the `useToast()` hook. Silent error swallowing is forbidden.
- HTTP 401 responses MUST trigger a token refresh attempt. A persistent 401 after refresh MUST
  trigger logout. Auth errors MUST NEVER be silently ignored.
- Breaking changes to backend API contracts (path, method, shape) MUST be reflected in the
  corresponding frontend service files in the same PR.

### VI. Component Architecture (RECOMMENDED)

- Shared, reusable UI components MUST live in `src/components/`. Feature-specific UI MUST be
  co-located within its Next.js route folder and not promoted to `src/components/` unless it
  will be reused in two or more distinct routes.
- Business logic MUST NOT live inside React components. Extract to custom hooks (`src/hooks/`)
  or service functions.
- MUI 6 is the primary component library. Reimplementing components that MUI already provides
  (dialogs, tables, date pickers, autocomplete) is prohibited.
- The `"use client"` directive MUST be applied only where strictly required: Keycloak
  initialization, Redux-connected components, and Context consumers. Server Components are the
  default.

### VII. Pre-commit Quality Gates (NON-NEGOTIABLE)

The Husky pre-commit hook runs the following gates in order:

1. `tsc --noEmit` — TypeScript compilation must produce zero errors.
2. `eslint` — ESLint (Next.js core-web-vitals + TypeScript) must produce zero errors.
3. `next build` — Production build must succeed.

The `--no-verify` flag MUST NOT be used to bypass the hook. If a gate fails, the underlying
issue MUST be fixed before committing. PRs MUST pass all three gates in CI before being
eligible for review.

### VIII. API Response Standards (NON-NEGOTIABLE)

All ASP.NET Core API endpoints must return a consistent JSON envelope. The frontend
`errorHandler.ts` must be able to predict the response shape for every status code.

**Success response:**

```json
{
  "success": true,
  "data": {},
  "message": null
}
```

**Failure response:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

**List / paginated response:**

```json
{
  "items": [],
  "totalCount": 0,
  "page": 1,
  "pageSize": 20
}
```

Rules:

- Raw exception messages and stack traces must never appear in the response body.
- Validation errors for Lawsome flows (case creation, legal expert matching, Razorpay checkout)
  must be user-friendly strings; internal field names or ORM error text are not acceptable.
- All list endpoints (search results, case listings, organization directories) must use the
  pagination wrapper above; unbounded collection returns are prohibited.
- Payment-related responses must include a correlation ID for end-to-end traceability.
- Domain objects must not be returned raw; every response must pass through the envelope.

### IX. Logging & Observability (NON-NEGOTIABLE)

Lawsome processes payments and sensitive legal case data. Structured, auditable logging via
Serilog 9 (JSON compact sink) is mandatory for the following events.

**Must always be logged:**

- Keycloak authentication failures (invalid credentials, expired tokens)
- Keycloak authorization failures (role-gated endpoint rejections)
- All Twilio SMS dispatches and failures (OTP sends, case notification failures)
- All Razorpay payment operations: order creation, payment confirmation, webhook receipt
- EF Core transaction rollbacks
- Unhandled exceptions caught by global exception middleware
- Any API operation whose wall-clock duration exceeds 2 seconds

**Must NEVER be logged:**

- Passwords or PINs
- OTPs (log the event, not the value)
- Keycloak JWT access or refresh tokens
- Razorpay API keys, secrets, or raw order payloads containing payment credentials
- Aadhaar numbers or other government-issued identifiers
- Personal legal case content (case descriptions, evidence, privileged communications)
- Any field classified as PII beyond name and email address

### X. Performance & Query Standards (RECOMMENDED)

Lawsome's legal expert search, case management, and organization directories involve large
datasets. Both the frontend render path and the backend data layer must be written with
performance in mind.

**Backend (EF Core / ASP.NET Core):**

- N+1 EF Core queries are prohibited. Use `.Include()` for eager loading or `.Select()` for
  targeted projections; never loop over entities to fetch related data.
- Full entity loading is prohibited where a projection suffices. Legal expert search cards,
  case summary lists, and organization tiles must use `.Select()` DTOs.
- All repository and service methods must be fully async. Blocking calls (`.Result`, `.Wait()`,
  `.GetAwaiter().GetResult()`) are forbidden.
- Pagination is mandatory for all list endpoints returning more than 50 records.
- All long-running API endpoints (legal expert matching, document uploads, case search) must
  accept and forward a `CancellationToken` to prevent orphaned database work on client disconnect.

**Frontend (Next.js / React):**

- `next/image` (`<Image />`) must be used for all images; raw `<img>` tags are prohibited.
- Heavy route-specific dependencies (Google Maps, Razorpay checkout modal, rich text editors)
  must be loaded via `next/dynamic` with `ssr: false` where applicable to avoid SSR bloat.
- Redux selectors that derive or filter data must be memoized with `createSelector` (Reselect).
- `React.memo` and `useCallback` must be applied to components rendered inside large lists such
  as search results, case listings, and organization directories.
- Lighthouse performance score on key pages (home, search, dashboard) must not regress below 70
  between releases.

### XI. External Integration Standards (RECOMMENDED)

Lawsome's core user flows depend on Twilio (OTP and case notifications) and Razorpay (payments).
Both are synchronous blocking integrations; failure handling must be intentional.

**Applies to: Twilio SMS, Razorpay Payments**

- Both integrations must be wrapped in Polly retry policies with exponential backoff, capped at
  three retries, before propagating a failure to the caller.
- Timeout policies must be configured for both providers; neither may block the ASP.NET Core
  request thread indefinitely while awaiting a third-party response.
- All request failures must be logged per Principle IX before an error is surfaced to the frontend.
- Provider-specific error codes and messages must be mapped to user-friendly strings at the
  integration boundary; raw Twilio or Razorpay payloads must not reach the API response.
- Both integrations must be abstracted behind interfaces (`ISmsService`, `IPaymentGateway`) so
  that the provider can be substituted or mocked in tests without changing call sites.
- Razorpay webhook payloads must have their HMAC-SHA256 signature verified before any payment
  state is mutated; unverified webhooks must be rejected with HTTP 400.
- Twilio OTP expiry must be enforced server-side. Expired OTP attempts must be rejected without
  making a Twilio API call.

### XII. Database Migration Governance (RECOMMENDED)

The PostgreSQL schema is managed exclusively through EF Core migrations. Ad-hoc schema changes
in shared environments are prohibited.

- Every schema change must be delivered as an EF Core migration committed to source control;
  direct `ALTER TABLE` or `DROP` statements executed outside migrations are forbidden.
- Migration files must be code-reviewed before being executed in staging or production.
- Destructive migrations (column drops, table drops, data truncation) require a written rollback
  plan in the PR description before the migration can be approved.
- Seed data changes (lookup tables, roles, permissions) must be version-controlled as EF Core
  `HasData()` calls or dedicated seed migrations; manual SQL seed scripts are not permitted.
- A migration that has been applied to any shared environment must never be edited; create a new
  corrective migration instead.
- Migration file names must follow the EF Core default convention:
  `{timestamp}_{PascalCaseDescription}`.

### XIII. Pull Request Standards (NON-NEGOTIABLE)

Pull requests are the primary enforcement point for every principle in this constitution.
Incomplete or undocumented PRs bypass the guarantees the constitution provides.

Every pull request must:

- Reference the Speckit feature branch name or the `spec.md` feature title it implements.
- Include CI evidence that all three pre-commit quality gates (tsc, eslint, next build) passed.
- Contain only changes related to the stated feature or fix; unrelated refactors must be
  submitted as separate PRs.
- Maintain backward compatibility with existing API contracts unless a breaking change has been
  explicitly approved by a senior engineer and all affected frontend or backend consumers notified
  before merge.
- Be reviewed and approved by at least one other developer before merge; self-merge to `main` or
  `develop` is prohibited.
- Include the compliance checklist from the Governance section confirming adherence to
  Principle II (Security) and Principle VII (Quality Gates).

### XIV. Specification Governance (NON-NEGOTIABLE)

Lawsome uses Speckit for structured feature development. The specification artifacts are the
single source of truth; implementation started without them produces code that cannot be
reviewed against agreed requirements.

- Every feature must have `spec.md`, `plan.md`, and `tasks.md` generated via Speckit and
  committed to the feature branch before any implementation code is written.
- Implementation must not begin until:
  - All requirements are clarified (via `/speckit-clarify`)
  - Acceptance criteria are documented in `spec.md`
  - Edge cases are identified and recorded
- `/speckit-analyze` must be run after `tasks.md` is generated to validate cross-artifact
  consistency before implementation starts.
- Feature branches must follow the Speckit sequential naming convention configured in
  `.specify/init-options.json`.
- Deviations from the spec discovered during implementation must be documented in a spec
  amendment commit on the feature branch; silent divergence from the spec is not acceptable.
- Reviewers may reject a PR whose implementation contradicts `spec.md` without a corresponding
  spec update. `spec.md` is authoritative over code comments and PR descriptions.

## Technology Stack

### Frontend Stack — Lawsome.Web.UI

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript 5 (strict mode) |
| UI Library | MUI 6, Tailwind CSS 3, Styled Components 6 |
| State | Redux Toolkit 2 + Redux-Persist 6 |
| Auth Client | Keycloak.js 26 (`@react-keycloak/web`) |
| HTTP | Axios 1 (Bearer token injection, 401 refresh) |
| Maps | `@react-google-maps/api`, Google Places Autocomplete |
| Payments | Razorpay |
| E2E Testing | Playwright |
| Unit Testing | React Testing Library (to be added — see TODOs) |
| Quality Gates | Husky, ESLint, TypeScript |

### Backend Stack — Lawsome (ASP.NET Core)

| Layer | Technology |
| --- | --- |
| Framework | ASP.NET Core (.NET 8.0) |
| ORM | Entity Framework Core 9 + Npgsql (PostgreSQL) |
| Auth Server | Keycloak (OAuth2/OIDC); JWT Bearer in API |
| Mapping | AutoMapper 15 |
| Logging | Serilog 9 (structured, JSON compact) |
| Payments | RazorPay SDK |
| SMS | Twilio |
| Unit Testing | NUnit 3, Moq 4, FluentAssertions 6 |
| BDD Testing | Reqnroll 2 |
| Docs | Swashbuckle (Swagger + OAuth2) |

## Governance

This constitution supersedes all other development practices, coding guidelines, and team
conventions for the Lawsome platform. In the event of a conflict, the constitution rules.

**Amendment procedure**: Any amendment MUST be submitted as a pull request containing (a) the
proposed change to this file, (b) a written rationale explaining why the change is necessary,
and (c) a migration plan describing how existing code or practices will be brought into
compliance. Amendments require approval from at least one senior engineer.

**Versioning policy** (semantic):

- MAJOR — backward-incompatible removal or redefinition of a principle.
- MINOR — new principle or section added, or material expansion of an existing principle.
- PATCH — clarification, wording correction, or non-semantic refinement.

**Compliance review**: Every PR description MUST include a checklist confirming compliance with
Principle II (Security) and Principle VII (Quality Gates) at minimum. Reviewers are responsible
for verifying compliance before approving.

**Runtime guidance**: See `CLAUDE.md` at the repository root for commands, environment setup,
and architectural patterns used day-to-day.

**Version**: 1.1.0 | **Ratified**: 2026-05-05 | **Last Amended**: 2026-05-07
