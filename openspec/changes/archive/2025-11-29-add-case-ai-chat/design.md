# Design: AI Chat Interface for Case Page

## Context

The Lawsome platform already has an AI-powered case summary feature that generates comprehensive summaries using OpenAI. This change extends that capability to provide an interactive chat interface where Organization Admins can ask questions about specific cases.

### Stakeholders
- **Organization Admins**: Primary users who manage cases and need quick insights
- **System Admins**: Have access to all organization features
- **Development Team**: Maintains both frontend and backend codebases

### Constraints
- OpenAI API costs scale with token usage
- Session-only chat (no database persistence required)
- Must work within existing Keycloak authentication flow
- Must follow existing UI patterns (Material-UI, CSS Modules)

## Goals / Non-Goals

### Goals
- Provide interactive AI chat for case-specific questions
- Automatically include full case context in AI requests
- Maintain conversation history within browser session
- Reuse existing OpenAI integration infrastructure
- Clean rename of services to reflect broader AI capabilities

### Non-Goals
- Persist chat history to database (future enhancement)
- Rate limiting (future enhancement)
- General legal chat outside case context (future enhancement)
- Support for file attachments in chat (future enhancement)

## Decisions

### Decision 1: Service Renaming Strategy
**What**: Rename `CaseSummaryController/Service` to `CaseAIController/Service`

**Why**:
- Groups all case-related AI features under one controller
- More extensible for future AI features (document analysis, predictions, etc.)
- Clearer naming that reflects broader purpose

**Alternatives considered**:
- Keep separate controllers for summary and chat → Rejected: leads to duplication
- Create new `CaseChatController` → Rejected: fragments AI features unnecessarily

### Decision 2: Context Injection Approach
**What**: Include full case context with every chat message

**Why**:
- Ensures AI always has complete picture for accurate responses
- Simplifies implementation (reuse existing `BuildPrompt` logic)
- No need to track what context was already sent

**Trade-offs**:
- Higher token usage per request
- Acceptable for session-only use with low volume

**Alternatives considered**:
- Send context only on first message → Rejected: AI loses context on each request
- Let user toggle context inclusion → Rejected: adds complexity, users always want context

### Decision 3: Frontend Architecture
**What**: Floating chat drawer component with session state

**Why**:
- Non-intrusive UI that doesn't disrupt case page layout
- Familiar chat pattern (like support chat widgets)
- Session state via React useState (simplest approach)

**Implementation**:
```
CaseAIChat/
├── CaseAIChat.tsx           # Main drawer component
├── CaseAIChat.module.css    # Scoped styles
├── ChatMessage.tsx          # Individual message component
└── index.ts                 # Exports
```

**Alternatives considered**:
- New tab in case tabs → Rejected: separates chat from case view
- Modal dialog → Rejected: blocks underlying content
- Redux state → Rejected: overkill for session-only data

### Decision 4: API Contract
**What**: Simple request/response with message string

**Request**:
```typescript
interface CaseChatRequest {
  message: string;
}
```

**Response**:
```typescript
interface CaseChatResponse {
  response: string;
  timestamp: string; // ISO 8601
}
```

**Why**:
- Minimal contract that can be extended later
- No conversation ID needed (session-only)
- Timestamp useful for UI display

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| High token costs | Medium | Monitor usage; add rate limiting later if needed |
| Breaking change (rename) | Low | Update all references in single deployment |
| AI hallucination | Medium | System prompt emphasizes case context accuracy |
| Long response times | Medium | Show loading state; consider streaming later |

## Migration Plan

### Backend Migration (Single PR)
1. Rename files: `CaseSummaryController` → `CaseAIController`
2. Rename files: `CaseSummaryService` → `CaseAIService`
3. Update DI registration in `ServiceCollectionExtension.cs`
4. Add new chat endpoint and service method
5. Add new request/response models
6. Update all import statements

### Frontend Migration (Single PR)
1. Add new types for chat request/response
2. Add new API function `sendCaseChatMessage`
3. Create `CaseAIChat` component
4. Integrate chat button into case page
5. Test with existing summary feature (ensure no regression)

### Rollback
- Revert PR if issues arise
- No database changes required
- No data migration needed

## Open Questions

1. **System prompt tuning**: What specific instructions should guide the AI's responses?
   - Proposed: "You are a legal case assistant. Answer questions based on the provided case context. Be concise and accurate. If information is not in the context, say so."

2. **Token limit**: Should we cap the conversation length to prevent excessive costs?
   - Proposed: Start without limits, monitor usage, add if needed

3. **Error handling UX**: How should API errors be displayed to users?
   - Proposed: Toast notification with retry option
