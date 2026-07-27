# Tasks: Case AI (Summary & Chat)

**Feature**: `018-case-ai`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Status**: UI and API mostly exist — tasks focus on RBAC audit, guard gaps, and new tests.

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1]**: Generate AI Case Summary (P1)
- **[US2]**: Chat with AI About a Case (P2)
- **[US3]**: Organization Isolation (P3)

---

## Phase 1: Setup

**Purpose**: Confirm existing code baseline and identify exact gaps.

- [ ] T001 Read `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/CaseSummarySection/CaseSummarySection.tsx` — document current RBAC gate status, loading state, error handling
- [ ] T002 [P] Read `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/CaseAIChat/CaseAIChat.tsx` — document current RBAC gate, empty message guard, feature flag check
- [ ] T003 [P] Verify `fetchCaseSummary()` and `sendCaseChatMessage()` exist in `src/app/organization/services/api.ts` with correct signatures
- [ ] T004 [P] Verify case detail page (`cases/[caseId]/page.tsx` or equivalent) — locate where `CaseSummarySection` and `CaseAIChat` are mounted; confirm RBAC wrapping condition

**Checkpoint**: Gaps documented — proceed with targeted fixes

---

## Phase 2: UI

**Purpose**: Audit and fix all UI rendering rules per spec.

- [ ] T005 [US1] Verify `CaseSummarySection` loading state shows spinner AND loading message "Generating summary — this may take a moment..." — update if loading state is blank or missing text (FR-003)
- [ ] T006 [US1] Verify `CaseSummarySection` is NOT rendered (not just hidden) for non-admin roles — confirm parent page uses `{(isOrgAdmin || isSystemAdmin) && <CaseSummarySection />}`; add gate if missing
- [ ] T007 [US1] Verify `CaseSummarySection` handles empty AI response body — add fallback: "AI was unable to generate a summary for this case." if `data` is empty string
- [ ] T008 [US2] Verify `CaseAIChat` floating FAB is NOT rendered for non-admin roles — confirm `{(isOrgAdmin || isSystemAdmin) && <CaseAIChat />}` in parent; add gate if missing
- [ ] T009 [US2] Verify inline error displays "Please enter a message." when empty/whitespace message is submitted in chat input — add error state if missing
- [ ] T010 [US2] Verify chat thread has auto-scroll (`useRef` + `scrollIntoView`) on each new AI response message
- [ ] T011 [US3] Verify no AI controls (summary card, FAB) are visible for: `SiteAdmin`, `SiteClerk`, `SiteLegalExpert`, `SiteSrLegalExpert`, `SiteCaseClient`, `OrganizationClerk` (FR-007)

**Checkpoint**: All UI rendering rules verified and corrected

---

## Phase 3: Logic

**Purpose**: Verify and fix business logic in both AI components.

- [ ] T012 [US1] Verify `CaseSummarySection` calls `fetchCaseSummary` in `useEffect` on mount only — not on every re-render; add `[]` dependency if missing
- [ ] T013 [US1] Verify `CaseSummarySection` error path calls `showError("AI summary is temporarily unavailable. Please try again later.")` — not raw error text (FR-006)
- [ ] T014 [US2] Verify `CaseAIChat` empty message guard:
  ```typescript
  if (!inputValue.trim()) {
    setInputError("Please enter a message.");
    return; // API NOT called
  }
  ```
  Confirm this guard exists before `sendCaseChatMessage` call
- [ ] T015 [US2] Verify `CaseAIChat` error path calls generic `showError` — not raw AI error text
- [ ] T016 [US2] Verify chat `messages` state is cleared on `caseId` prop change — prevents history leak when navigating between cases
- [ ] T017 [US3] Verify feature flag check in `CaseAIChat`: component checks `NEXT_PUBLIC_AI_ENABLED_ORG_IDS` and only renders if `orgId` is in the list

**Checkpoint**: All logic gaps fixed

---

## Phase 4: API

**Purpose**: Verify existing API functions meet spec requirements.

- [ ] T018 [US1] Verify `fetchCaseSummary(orgId, siteId, caseId)` → `GET /organizations/{orgId}/sites/{siteId}/cases/{caseId}/summary`; returns `{ success: true, data: string }` — confirm return type
- [ ] T019 [US2] Verify `sendCaseChatMessage(orgId, siteId, caseId, payload: { message: string })` → `POST /organizations/{orgId}/sites/{siteId}/cases/{caseId}/chat`; returns `{ success: true, data: string }`
- [ ] T020 Both functions must handle long-running responses (3–10s) without premature timeout — confirm no custom timeout is set on these calls

**Checkpoint**: API functions confirmed correct

---

## Phase 5: Backend

**Purpose**: Confirm backend contract for AI endpoints (no frontend code).

- [ ] T021 Confirm AI endpoints return HTTP 200 even when AI generation takes 3–10 seconds — backend must not time out prematurely
- [ ] T022 Confirm `[Authorize(Roles = "OrgAdmin,SysAdmin")]` is applied to both `/summary` and `/chat` endpoints — frontend RBAC is defense-in-depth
- [ ] T023 Confirm `orgId` in URL is validated server-side — OrgAdmin cannot access AI for another org's case (403 on mismatch)
- [ ] T024 Confirm `NEXT_PUBLIC_AI_ENABLED_ORG_IDS` env var is documented — backend may independently gate AI access by org

---

## Phase 6: Security

**Purpose**: Enforce all security requirements from plan.md §6.

- [ ] T025 [US1] Audit case detail page: confirm `CaseSummarySection` is NOT mounted for non-admin roles — component not in DOM, not just hidden
- [ ] T026 [US2] Audit case detail page: confirm `CaseAIChat` FAB is NOT mounted for non-admin roles
- [ ] T027 Verify AI query content and response text are NEVER logged — only metadata (`orgId`, `caseId`, `userId`, response time) logged per plan.md §10
- [ ] T028 [P] Verify no `dangerouslySetInnerHTML` is used to render AI summary text or chat responses
- [ ] T029 [US3] Verify `CaseAIChat` does NOT expose AI controls when `orgId` is not in `NEXT_PUBLIC_AI_ENABLED_ORG_IDS` (feature flag bypass blocked)

---

## Phase 7: Testing

**Purpose**: Build all unit tests and E2E tests from plan.md §8.

- [ ] T030 [P] [US1] Create `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/CaseSummarySection/__tests__/CaseSummarySection.test.tsx`:
  - Loading state → spinner and "Generating summary" text in DOM
  - Success response → summary text rendered
  - API error → `showError` mock invoked
- [ ] T031 [P] [US2] Create `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/CaseAIChat/__tests__/CaseAIChat.test.tsx`:
  - Empty message → inline error shown, API mock not invoked
  - Whitespace-only message → same as empty
  - Valid message → API called, response appended to thread (thread length increases)
  - AI API error → `showError` mock invoked
  - Non-admin role → AI components not in DOM (tested at parent level)
- [ ] T032 Create `e2e/018-case-ai.spec.ts` with all 6 E2E scenarios from plan.md §8: summary golden path, summary loading state, AI chat send message, empty message blocked, non-admin sees no controls, AI error shows friendly toast

**Checkpoint**: All tests written — run `npm run test` to verify unit tests pass

---

## Phase 8: Logging

**Purpose**: Add structured logging per plan.md §10.

- [ ] T033 [US1] Add `console.info` in `CaseSummarySection` on summary requested: log `{ orgId, caseId, userId }` — do NOT log case content or summary text
- [ ] T034 [US1] Add `console.info` in `CaseSummarySection` on summary generated: log `{ orgId, caseId, responseTimeMs }` — do NOT log summary text
- [ ] T035 [US2] Add `console.info` in `CaseAIChat` on chat message sent: log `{ orgId, caseId, userId }` — do NOT log message content or AI response
- [ ] T036 Add `console.error` in `CaseSummarySection` on AI service error: log `{ orgId, caseId, httpStatus }` — no case content
- [ ] T037 Add `console.error` in `CaseAIChat` on chat API error: log `{ orgId, caseId, httpStatus }` — no message content
- [ ] T038 Add `console.warn` in case detail page: unauthorized AI access attempt: log `{ userId, role, caseId }`

---

## Phase 9: Quality Gates

**Purpose**: Ensure code quality before finalization.

- [ ] T039 [P] Run `npm run type-check` — fix TypeScript errors in `CaseSummarySection.tsx` and `CaseAIChat.tsx` after modifications
- [ ] T040 [P] Run `npm run lint` — fix ESLint errors
- [ ] T041 Run `npm run test` — confirm all new unit tests pass
- [ ] T042 Run `npm run build` — confirm production build passes

---

## Phase 10: Finalization

**Purpose**: Confirm all spec requirements are satisfied.

- [ ] T043 Verify SC-001: AI summary and chat controls never visible to non-admin roles — manually test with SiteAdmin and SiteCaseClient accounts
- [ ] T044 Verify SC-002: loading state always shown during AI generation — verify no blank flash period (loading shown from request start)
- [ ] T045 Verify SC-003: empty messages blocked client-side — check browser Network tab shows no request on blank/whitespace Send click
- [ ] T046 Verify SC-004: AI service error (mock 503) → friendly error toast within 1 second; no raw error text visible to user
- [ ] T047 Verify chat history is session-only — refresh page → chat thread is empty (no localStorage/Redux persistence)

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: Start immediately — must complete before other phases
- **Phases 2–3 (UI, Logic)**: Depend on Phase 1 findings; T005–T016 sequential (single-file changes)
- **Phase 4 (API)**: Verification only — can run in parallel with Phases 2–3
- **Phase 5 (Backend)**: Independent — run in parallel with Phases 2–4
- **Phase 6 (Security)**: Depends on Phases 2–3
- **Phase 7 (Testing)**: Depends on Phases 2–4
- **Phase 8 (Logging)**: Parallel with Phase 7
- **Phase 9 (Quality Gates)**: Depends on Phases 7–8
- **Phase 10 (Finalization)**: Depends on Phase 9
