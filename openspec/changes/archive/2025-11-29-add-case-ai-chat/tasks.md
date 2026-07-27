# Tasks: Add AI Chat Interface for Case Page

## 1. Backend - Service Renaming

- [ ] 1.1 Rename `CaseSummaryController.cs` to `CaseAIController.cs` and update class name
- [ ] 1.2 Rename `CaseSummaryService.cs` to `CaseAIService.cs` and update class name
- [ ] 1.3 Rename `ICaseSummaryService.cs` to `ICaseAIService.cs` and update interface name
- [ ] 1.4 Update `ServiceCollectionExtension.cs` to register renamed services
- [ ] 1.5 Update all import statements and references across backend codebase

## 2. Backend - Chat API Implementation

- [ ] 2.1 Create `CaseChatRequest.cs` model in `Lawsome.Api.Models/Cases/`
- [ ] 2.2 Create `CaseChatResponse.cs` model in `Lawsome.Api.Models/Cases/`
- [ ] 2.3 Add `ChatCompletionAsync(string systemPrompt, string userMessage)` method to `IOpenAiService`
- [ ] 2.4 Implement `ChatCompletionAsync` in `OpenAiService.cs`
- [ ] 2.5 Add `ChatAsync(int caseId, int siteId, string message)` method to `ICaseAIService`
- [ ] 2.6 Implement `ChatAsync` in `CaseAIService.cs` (reuse context building from summary)
- [ ] 2.7 Add `POST .../cases/{caseId}/chat` endpoint to `CaseAIController`
- [ ] 2.8 Add appropriate authorization (OrganizationAdmin, SystemAdmin roles)

## 3. Frontend - Types and API

- [ ] 3.1 Add `CaseChatRequest` interface to `src/app/organization/types/index.ts`
- [ ] 3.2 Add `CaseChatResponse` interface to `src/app/organization/types/index.ts`
- [ ] 3.3 Add `sendCaseChatMessage` function to `src/app/organization/services/api.ts`

## 4. Frontend - Chat Component

- [ ] 4.1 Create `CaseAIChat/` directory under case components
- [ ] 4.2 Create `CaseAIChat.tsx` - main floating drawer component
- [ ] 4.3 Create `CaseAIChat.module.css` - component styles matching app theme
- [ ] 4.4 Create `ChatMessage.tsx` - individual message bubble component
- [ ] 4.5 Create `index.ts` - component exports
- [ ] 4.6 Implement chat state management (messages array, loading state, error state)
- [ ] 4.7 Implement message sending with API integration
- [ ] 4.8 Add floating action button to toggle chat drawer

## 5. Frontend - Integration

- [ ] 5.1 Import and render `CaseAIChat` in case page layout
- [ ] 5.2 Pass required props (caseId, siteId, organizationId)
- [ ] 5.3 Ensure chat is only visible to authorized roles (OrganizationAdmin, SystemAdmin)
- [ ] 5.4 Test chat alongside existing AI summary feature

## 6. Documentation

- [ ] 6.1 Update `docs/Lawsome_PRD.md` with AI chat feature description
- [ ] 6.2 Update swagger documentation if needed

## Dependencies

- Task 2.* depends on Task 1.* (renaming must complete first)
- Task 4.* depends on Task 3.* (types needed for components)
- Task 5.* depends on Task 4.* (components must exist)
- Backend (1.*, 2.*) and Frontend Types (3.*) can be parallelized
