# Implementation Plan: Legal Expert — Registration Stage, Portfolios & Cases

**Branch**: `023-legal-expert-stage-portfolios-cases` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/023-legal-expert-stage-portfolios-cases/spec.md`

---

## 1. Overview

### What Exists
- `src/app/register/otp/page.tsx` — OTP page in registration flow (after OTP, registers legal expert).
- `legalExpertSlice.ts` — Redux state with `portfolios` (string[]), `expertTypeId`, `registrationNumber`, `yearsOfExperience`.
- `src/components/ProfileCard.tsx` and `ProfileListCard.tsx` — display rating and portfolio data for expert search cards.
- `fetchUserCaseSummary()` — returns case summary but this is org/site scoped; expert personal cases use a separate endpoint.

### What Is New (Three Feature Groups)

**Group 1 — Registration Stage Tracker**
- Visual onboarding progress indicator on expert dashboard/profile (4 steps: Registration → PersonalDetails → ProfessionalDetails → Schedule).
- Stage determined from backend; never calculated client-side.
- Stage only advances; no regression.

**Group 2 — Expert Types & Portfolios (public)**
- A publicly accessible page (no login) listing all legal specialization categories and their portfolio sub-specializations.

**Group 3 — Expert Personal Cases (CRUD)**
- Expert's own case list (completely separate from org/site cases).
- Full CRUD: add, view, edit, delete personal cases.
- Isolated from org/site case search results.

---

## 2. Architecture Flow

### 2.1 Registration Stage Tracker

```
LegalIndividualExpert logs in → profile/dashboard page
  → OnboardingProgress component mounts
  → fetchExpertRegistrationStage(expertId)
      → GET /api/v1/legalexperts/{expertId}/stage
  → response: { stage: "Registration" | "PersonalDetails" | "ProfessionalDetails" | "Schedule" }
  → step mapping: Registration=1, PersonalDetails=2, ProfessionalDetails=3, Schedule=4
  → <MUI Stepper activeStep={currentStep}>
      <Step label="Registration" />
      <Step label="Personal Details" />
      <Step label="Professional Details" />
      <Step label="Schedule" />
    </MUI Stepper>
  → if stage === "Schedule" → "Your profile is complete. You are now discoverable in search." banner
```

### 2.2 Browse Expert Types & Portfolios (public)

```
Unauthenticated user navigates to /expert-types
  → ExpertTypesPage (Server Component — no "use client" needed for read-only public data)
  → fetchExpertTypes()
      → GET /api/v1/expertTypes (no auth required)
  → list of expert type cards: name, description
  → each card expandable to show portfolio sub-specializations
  → no login required (unauthenticated access allowed)
```

### 2.3 Expert Personal Cases — View List

```
LegalIndividualExpert on /expert/cases
  → usePersonalCases(expertId) hook
  → fetchExpertPersonalCases(expertId)
      → GET /api/v1/legalexperts/{expertId}/cases
  → loading → <LoadingState />
  → cases list: title, case number, status badge, created date
  → empty → <EmptyState message="You haven't added any personal cases yet." />
  → "Add Case" button visible (for expert only)
```

### 2.4 Expert Personal Cases — Add

```
Expert clicks "Add Case"
  → AddPersonalCaseModal opens
  → Fields: title (req), case number (req), description, status (req)
  → Submit → createExpertPersonalCase(expertId, payload)
      → POST /api/v1/legalexperts/{expertId}/cases
  → 201 → case appended to list → showSuccess
```

### 2.5 Expert Personal Cases — Edit / Delete

```
Expert clicks case → case detail page
  → Edit button → EditPersonalCaseModal opens (pre-filled)
  → Save → updateExpertPersonalCase(expertId, caseId, payload)
      → PUT /api/v1/legalexperts/{expertId}/cases/{caseId}
  → Delete button → ConfirmDialog → deleteExpertPersonalCase(expertId, caseId)
      → DELETE /api/v1/legalexperts/{expertId}/cases/{caseId}
  → 204 → navigate back to cases list
```

### 2.6 RBAC

```
Expert Types page: no auth required
Registration Stage: LegalIndividualExpert own stage; SystemAdmin any expert's stage
Personal Cases: LegalIndividualExpert own cases only; SystemAdmin can CRUD any expert's cases
  → if other user tries to access → 403 from backend; frontend shows access denied
```

---

## 3. File Structure

### Documentation
```
specs/023-legal-expert-stage-portfolios-cases/
  spec.md                         NO CHANGE
  plan.md                         NEW (this file)
  research.md                     NEW
  data-model.md                   NEW
  contracts/
    api-contracts.md              NEW
```

### Source Tree
```
src/app/
  expert-types/
    page.tsx                      NEW — public ExpertTypesPage (Server Component)
    components/
      ExpertTypeCard.tsx          NEW — expandable card with portfolios

  expert/
    [expertId]/
      profile/
        components/
          OnboardingProgress/
            OnboardingProgress.tsx  NEW — MUI Stepper progress indicator
            index.ts                NEW
            __tests__/
              OnboardingProgress.test.tsx  NEW
      cases/
        page.tsx                  NEW — PersonalCasesPage (use client)
        components/
          AddPersonalCaseModal.tsx  NEW
          EditPersonalCaseModal.tsx NEW
          PersonalCaseCard.tsx      NEW
          __tests__/
            PersonalCasesPage.test.tsx  NEW
        hooks/
          usePersonalCases.ts     NEW

src/app/organization/services/
  expertCasesApi.ts               NEW — fetchExpertPersonalCases, createExpertPersonalCase, updateExpertPersonalCase, deleteExpertPersonalCase
  expertStageApi.ts               NEW — fetchExpertRegistrationStage, fetchExpertTypes

src/app/organization/types/
  expertCases.ts                  NEW — ExpertPersonalCase, ExpertType, Portfolio, RegistrationStage interfaces

e2e/
  023-legal-expert-stage-portfolios-cases.spec.ts  NEW
```

---

## 4. Component Design

### 4.1 `OnboardingProgress`
- **Purpose**: Shows expert's current onboarding stage.
- **Props**: `{ expertId: string }`
- **Uses**: MUI `<Stepper orientation="horizontal" activeStep={stepIndex}>`.
- **Step labels**: Registration, Personal Details, Professional Details, Schedule.
- **Completion banner**: When `stage === "Schedule"` → `<Alert severity="success">Your profile is complete. You are now discoverable in search.</Alert>`
- **Stage never regresses**: Component does not allow navigating backward; `activeStep` is read-only.

### 4.2 `ExpertTypesPage` (Server Component)
- **Purpose**: Public listing of legal specialization categories and portfolios.
- **Data**: Fetched server-side (no auth token needed for public endpoint).
- **Layout**: Accordion list or grid of expandable `ExpertTypeCard` components.
- **`ExpertTypeCard`**: Shows type name, description; expands to list portfolio sub-specializations.

### 4.3 `PersonalCasesPage`
- **Purpose**: Expert's personal case management.
- **Access guard**: Only `LegalIndividualExpert` (own cases) or `SystemAdmin`.
- **Layout**: Cases list + "Add Case" button + add/edit/delete modals.

### 4.4 `AddPersonalCaseModal` / `EditPersonalCaseModal`
- **Fields**: Title (required), Case Number (required), Description (optional), Status (required, same enum as org cases: Open, InProgress, Closed, etc.).
- **Validation**: `useFormValidation` with personal case schema.
- **Edit**: Pre-fills current case values.

### 4.5 `usePersonalCases` (hook)
- **State**: `cases`, `loading`, `submitting`, `addModalOpen`, `editModalOpen`, `deleteModalOpen`, `caseToEdit`, `caseToDelete`
- **Methods**: `fetchCases()`, `createCase()`, `updateCase()`, `deleteCase()`

---

## 5. API Plan

| Method | URL | Auth | Request Body | Success | Error Codes | Status |
|--------|-----|------|--------------|---------|-------------|--------|
| `GET` | `/api/v1/legalexperts/{expertId}/stage` | Bearer (own or SysAdmin) | — | `{ data: { stage: string } }` 200 | 401, 403 | NEW |
| `GET` | `/api/v1/expertTypes` | None (public) | — | `{ data: ExpertType[] }` 200 | — | NEW |
| `GET` | `/api/v1/legalexperts/{expertId}/cases` | Bearer (own or SysAdmin) | — | `{ items: ExpertPersonalCase[], totalCount, page, pageSize }` | 401, 403 | NEW |
| `POST` | `/api/v1/legalexperts/{expertId}/cases` | Bearer (own or SysAdmin) | `CreatePersonalCaseRequest` | `{ data: ExpertPersonalCase }` 201 | 400, 401, 403 | NEW |
| `PUT` | `/api/v1/legalexperts/{expertId}/cases/{caseId}` | Bearer (own or SysAdmin) | `UpdatePersonalCaseRequest` | `{ data: ExpertPersonalCase }` 200 | 400, 401, 403, 404 | NEW |
| `DELETE` | `/api/v1/legalexperts/{expertId}/cases/{caseId}` | Bearer (own or SysAdmin) | — | 204 | 401, 403, 404 | NEW |

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| Expert accessing another expert's personal cases | `expertId` in URL must match Keycloak `sub` claim; backend returns 403 on mismatch |
| Personal cases appearing in org/site case search | Personal cases are under `/legalexperts/{expertId}/cases` — completely separate URL namespace from `/organizations/{id}/sites/{id}/cases` |
| Expert Types page accessible without login | This is intentional; page uses server component with no auth token; endpoint is public |
| Stage regression attempt (resubmit Registration stage) | Backend does not allow stage downgrade; returns 400 or no-op; frontend does not provide backward navigation |
| Delete without confirmation | `ConfirmDialog` required before calling delete API |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `registrationStage` | `OnboardingProgress` (local) | Single-use; not shared |
| `expertTypes` | `ExpertTypesPage` (server-fetched) | Static reference data; no client state needed |
| `cases` list | `usePersonalCases` (local) | Expert-scoped; not shared across routes |
| `addModalOpen`, `editModalOpen`, `deleteModalOpen` | `usePersonalCases` (local) | Ephemeral UI state |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `OnboardingProgress.test.tsx` | Stage = "Registration" → step 1 active | Stepper step 0 has active state |
| `OnboardingProgress.test.tsx` | Stage = "Schedule" → completion banner shown | Alert in DOM |
| `OnboardingProgress.test.tsx` | Stage = "PersonalDetails" → step 2 active | Step 1 active |
| `PersonalCasesPage.test.tsx` | Cases loaded → cards rendered | Card count matches |
| `PersonalCasesPage.test.tsx` | No cases → EmptyState shown | Empty state text visible |
| `PersonalCasesPage.test.tsx` | Add case → createExpertPersonalCase called | API mock invoked |
| `PersonalCasesPage.test.tsx` | Delete → ConfirmDialog opens | Dialog visible |
| `PersonalCasesPage.test.tsx` | Access by non-owner → access denied | Denied text shown |

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| View onboarding progress | LegalExpert (Registration stage) | Login, view dashboard | Step 1 active, steps 2-4 pending |
| Completion message | LegalExpert (Schedule stage) | Login, view dashboard | "You are now discoverable" alert |
| Browse expert types (unauthenticated) | Public | Navigate to /expert-types | Categories visible without login |
| Add personal case | LegalExpert | Navigate to /expert/cases, add case | Case appears in list |
| Edit personal case | LegalExpert | Edit case, change title, save | Updated title visible |
| Delete personal case | LegalExpert | Delete, confirm | Case removed |
| Cross-expert access blocked | LegalExpert A | Navigate to LegalExpert B's cases URL | Access denied |

Test file: `e2e/023-legal-expert-stage-portfolios-cases.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-001: Stage indicator accurate every load | Stage fetched fresh on component mount; not cached in Redux |
| SC-002: Expert Types page within 2s | Server Component; data fetched at build time or SSR; fast first paint |
| SC-003: Personal case CRUD under 2 min | Simple CRUD with lightweight modal forms; API response < 500ms expected |
| SC-004: Personal cases excluded from org search | Separate URL namespace; no shared query or filter needed |
| Expert Types page caching | Can use `next/cache` `revalidate` for public reference data — update on demand |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| Registration stage fetched | INFO | `expertId`, `stage` | — |
| Expert types fetched | INFO | count returned | — |
| Personal case created | INFO | `expertId`, `caseId`, `status` | Case description |
| Personal case updated | INFO | `expertId`, `caseId`, fields changed | Field values |
| Personal case deleted | INFO | `expertId`, `caseId` | — |
| Cross-expert access attempt | WARN | `requesterId`, `targetExpertId` | — |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Backend stage endpoint not yet implemented | High | High | Coordinate with backend team; block frontend until endpoint confirmed |
| Expert personal cases endpoint different path | Medium | Medium | Align on URL with backend before building service functions |
| Expert Types public endpoint requires auth on backend | Medium | High | Confirm with backend that `/expertTypes` has no `[Authorize]` attribute |
| Personal case status enum differs from org case enum | Low | Low | Use the same `CaseStatus` type if shared, or define a separate `PersonalCaseStatus` |
| Stage not returned in existing profile fetch | Medium | Medium | May need a separate `GET /stage` call; confirm if stage is included in profile GET or needs its own endpoint |
| `expertId` in URL could be spoofed client-side | Low | High | Backend enforces ownership via Keycloak `sub`; frontend shows access denied on 403 |
