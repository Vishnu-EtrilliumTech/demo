# Implementation Plan: Case AI (Summary & Chat)

**Branch**: `018-case-ai` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/018-case-ai/spec.md`

---

## 1. Overview

### What Exists
- `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/CaseAIChat/CaseAIChat.tsx` — floating "Ask Neeti" AI chat panel (297 lines). Sends messages via `sendCaseChatMessage()`. Includes sample prompts, message threading, auto-scroll, and loading states.
- `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/CaseSummarySection/CaseSummarySection.tsx` — AI summary card with Beta badge, expandable display, calls `fetchCaseSummary()`.
- `src/app/organization/services/api.ts`:
  - `fetchCaseSummary()` → `GET /organizations/{id}/sites/{siteId}/cases/{caseId}/summary`
  - `sendCaseChatMessage()` → `POST /organizations/{id}/sites/{siteId}/cases/{caseId}/chat`
- Feature-flagged by `NEXT_PUBLIC_AI_ENABLED_ORG_IDS` env var.

### Gaps to Close
1. **RBAC gate audit**: Verify AI controls (`CaseAIChat`, `CaseSummarySection`) are conditionally rendered only for `OrganizationAdmin` and `SystemAdmin`. Confirm site roles, `SiteCaseClient`, and `OrganizationClerk` see no AI controls.
2. **Organization isolation**: Verify `OrganizationAdmin` cannot access AI features on cases from another org (backend enforces; confirm frontend does not display controls cross-org).
3. **Error handling**: Confirm AI service errors surface a user-friendly toast (not raw error text).
4. **Empty message guard**: Confirm `sendCaseChatMessage` is not called for whitespace-only messages.
5. **No unit tests** for `CaseAIChat` or `CaseSummarySection`.
6. **No E2E tests** for the AI features.

### What Is New
- Unit tests: `CaseAIChat.test.tsx`, `CaseSummarySection.test.tsx`
- E2E test: `e2e/018-case-ai.spec.ts`

---

## 2. Architecture Flow

### 2.1 AI Summary

```
Case detail page mounts
  → useUserRole(orgId) → isOrgAdmin || isSystemAdmin
  → if authorized → <CaseSummarySection caseId siteId orgId />
  → CaseSummarySection mounts → fetchCaseSummary()
      → GET /organizations/{orgId}/sites/{siteId}/cases/{caseId}/summary
  → loading === true → <CircularProgress /> + "Generating summary — this may take a moment..."
  → success → summary text rendered in expandable card
  → error → showError("AI summary is temporarily unavailable. Please try again later.")
  → if NOT authorized → CaseSummarySection not rendered (no empty div placeholder)
```

### 2.2 AI Chat

```
Case detail page mounts
  → useUserRole(orgId) → isOrgAdmin || isSystemAdmin
  → if authorized → <CaseAIChat caseId siteId orgId /> (floating FAB)
  → User clicks FAB → chat panel opens
  → User types message → trimmed
  → if message.trim() === "" → inline error: "Please enter a message." — API not called
  → User clicks Send
  → sendCaseChatMessage(orgId, siteId, caseId, { message })
      → POST /organizations/{orgId}/sites/{siteId}/cases/{caseId}/chat
  → loading indicator in thread
  → success → AI response appended to thread
  → error → showError("AI summary is temporarily unavailable...")
  → Chat history is session-only — cleared on component unmount / page refresh
```

### 2.3 RBAC Gate

```
Case detail page renders
  → useUserRole(orgId) → { isOrgAdmin, isSystemAdmin, isSiteAdmin, isSiteCaseClient, ... }
  → {(isOrgAdmin || isSystemAdmin) && <CaseSummarySection ... />}
  → {(isOrgAdmin || isSystemAdmin) && <CaseAIChat ... />}
  → All site-level roles → neither component mounted
```

---

## 3. File Structure

### Documentation
```
specs/018-case-ai/
  spec.md                         NO CHANGE
  plan.md                         NEW (this file)
  research.md                     NEW
  data-model.md                   NEW
  contracts/
    api-contracts.md              NEW
```

### Source Tree
```
src/app/organization/[id]/sites/[siteId]/cases/[caseId]/
  components/
    CaseAIChat/
      CaseAIChat.tsx              VERIFY — RBAC guard, empty message guard, error handling
      index.ts                    NO CHANGE
      __tests__/
        CaseAIChat.test.tsx       NEW
    CaseSummarySection/
      CaseSummarySection.tsx      VERIFY — RBAC guard, loading/error states
      index.ts                    NO CHANGE
      __tests__/
        CaseSummarySection.test.tsx  NEW

src/app/organization/services/
  api.ts                          VERIFY — fetchCaseSummary, sendCaseChatMessage signatures

e2e/
  018-case-ai.spec.ts             NEW
```

---

## 4. Component Design

### 4.1 `CaseSummarySection`
- **Purpose**: Renders the AI-generated case summary in an expandable card.
- **Props**: `{ caseId: string, siteId: string, orgId: string }`
- **States**:
  - `loading` → spinner + "Generating summary — this may take a moment..."
  - `error` → `showError` toast, no card body shown
  - `summary` → expandable `<Accordion>` or collapsible `<Card>` with text
- **RBAC rendering** (enforced by parent — `CaseSummarySection` itself is not rendered for non-admin roles):
  - Parent case detail page wraps with `{(isOrgAdmin || isSystemAdmin) && <CaseSummarySection />}`

### 4.2 `CaseAIChat`
- **Purpose**: Floating action button that opens a slide-in chat panel.
- **Props**: `{ caseId: string, siteId: string, orgId: string }`
- **State**:
  - `messages: ChatMessage[]` — session-only; initialized to sample prompts
  - `inputValue: string` — current typed message
  - `sending: boolean` — loading state during API call
  - `inputError: string` — inline error for empty message
- **Empty message guard**:
  ```typescript
  if (!inputValue.trim()) {
    setInputError("Please enter a message.");
    return;
  }
  ```
- **Chat thread**: Scrollable list, user messages on right, AI on left, timestamps shown.
- **Feature flag**: Component should also check `NEXT_PUBLIC_AI_ENABLED_ORG_IDS` — only render if `orgId` is in the list.

---

## 5. API Plan

| Method | URL | Auth | Request Body | Success | Error Codes | Status |
|--------|-----|------|--------------|---------|-------------|--------|
| `GET` | `/organizations/{orgId}/sites/{siteId}/cases/{caseId}/summary` | Bearer (OrgAdmin, SysAdmin) | — | `{ success: true, data: string }` 200 | 401, 403, 503 | Existing |
| `POST` | `/organizations/{orgId}/sites/{siteId}/cases/{caseId}/chat` | Bearer (OrgAdmin, SysAdmin) | `{ message: string }` | `{ success: true, data: string }` 200 | 400, 401, 403, 503 | Existing |

> AI endpoints may respond in 3–10 seconds. The frontend must show a visible loading state throughout; no timeout should fail the request prematurely.

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| Non-admin roles seeing AI controls | `{(isOrgAdmin || isSystemAdmin) && ...}` in case detail page; backend enforces `[Authorize(Roles = "OrgAdmin,SysAdmin")]` |
| Cross-org AI access | Backend scopes by `orgId` in URL; OrgAdmin cannot construct valid URL for another org's case without 403 |
| Raw AI error text reaching user | Errors routed through `errorHandler.ts` → `showError()` with generic message |
| Case content in logs | AI query/response content must NOT be logged (privileged legal case information per constitution §IX) |
| Empty/whitespace message bypass | `inputValue.trim() === ""` check before API call; backend validates `message` field |
| Feature flag bypass | `NEXT_PUBLIC_AI_ENABLED_ORG_IDS` is UI-only convenience; backend enforces org-level AI access independently |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `messages` (chat thread) | `CaseAIChat` (local component state) | Session-only; intentionally not persisted |
| `summary` text | `CaseSummarySection` (local) | Case-scoped; not shared across routes |
| `loading`, `error` | Each component (local) | UI-only async state |
| `inputValue`, `inputError` | `CaseAIChat` (local) | Form input; ephemeral |
| Role flags | `useUserRole` (derived from Redux) | Per-session auth; already in global state |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `CaseSummarySection.test.tsx` | Loading state → spinner + message shown | Spinner and loading text in DOM |
| `CaseSummarySection.test.tsx` | Success response → summary text rendered | Summary text visible |
| `CaseSummarySection.test.tsx` | API error → showError called | `showError` mock invoked |
| `CaseAIChat.test.tsx` | Empty message → inline error shown, API not called | Error text in DOM, API mock not invoked |
| `CaseAIChat.test.tsx` | Whitespace-only message → same as empty | Error shown |
| `CaseAIChat.test.tsx` | Valid message → API called, response appended | Thread length increases |
| `CaseAIChat.test.tsx` | AI API error → showError called | `showError` mock invoked |
| `CaseAIChat.test.tsx` | Non-admin role → component not in DOM (tested at parent level) | Neither AI component found |

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| Summary loads — golden path | OrgAdmin | Navigate to case detail | Summary card visible with text |
| Summary loading state | OrgAdmin | Navigate to case detail (delay mocked) | Spinner + loading message visible |
| AI Chat — send message | OrgAdmin | Open chat, type question, send | AI response appears in thread |
| Empty message blocked | OrgAdmin | Open chat, click Send with no text | Inline error; API not called |
| Non-admin role sees no AI controls | SiteAdmin | Navigate to case detail | No AI summary card, no chat FAB |
| AI service error | OrgAdmin | Send chat message (500 mock) | User-friendly error toast shown |

Test file: `e2e/018-case-ai.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| AI responses > 2s | Loading indicator shown for entire duration; no timeout auto-cancels |
| Summary fetch on mount | `fetchCaseSummary` called in `useEffect` on mount; not triggered again on re-render |
| Chat thread scroll | `useRef` + `scrollIntoView` on each new message; no virtualization needed for typical sessions |
| Feature flag check | O(1) string array lookup at render time; no API call for flag |
| Component lazy loading | `CaseAIChat` and `CaseSummarySection` can be loaded via `next/dynamic` if bundle size is a concern |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| AI summary requested | INFO | `orgId`, `caseId`, `userId` | Case content, summary text |
| AI summary generated | INFO | `orgId`, `caseId`, response time (ms) | Summary text |
| AI chat message sent | INFO | `orgId`, `caseId`, `userId` | Message content, AI response |
| AI service error (summary) | ERROR | `orgId`, `caseId`, HTTP status | — |
| AI service error (chat) | ERROR | `orgId`, `caseId`, HTTP status | Message content |
| Unauthorized AI access attempt | WARN | `userId`, `role`, `caseId` | — |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| RBAC guard not applied to both components | Medium | High | Audit case detail page for both `CaseSummarySection` and `CaseAIChat` mounts; add `isOrgAdmin || isSystemAdmin` gate |
| AI response latency causes perceived hang | High | Medium | Always show loading state; add "this may take a moment" copy after 2s delay |
| Chat history leak on role switch (e.g., admin impersonates another user) | Low | High | Clear `messages` state on `caseId` prop change; do not store in Redux |
| `NEXT_PUBLIC_AI_ENABLED_ORG_IDS` misconfigured in production | Medium | Medium | Document env var; backend should also gate independently |
| Empty AI response body (AI model returns nothing) | Low | Medium | Handle empty string response with fallback: "AI was unable to generate a summary for this case." |
| Cross-org URL construction by OrgAdmin | Low | High | Backend enforces org ownership; frontend does not display controls cross-org |
