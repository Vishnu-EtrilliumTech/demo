# Change: Add AI Chat Interface for Case Page

## Why

Organization Admins need an interactive way to ask questions about specific cases or general legal topics. The current AI summary feature provides a one-time snapshot, but users often need follow-up clarification or have specific questions that a static summary doesn't address. An AI chat interface will enable real-time, conversational interaction with case data.

## What Changes

### Backend Changes
- **BREAKING**: Rename `CaseSummaryController.cs` to `CaseAIController.cs`
- **BREAKING**: Rename `CaseSummaryService.cs` to `CaseAIService.cs` (and interface)
- Add new `POST /organizations/{orgId}/sites/{siteId}/cases/{caseId}/chat` endpoint
- Add `ChatAsync()` method to `CaseAIService` that injects full case context
- Add generic `ChatCompletionAsync()` method to `OpenAiService`
- Existing summary endpoint path remains unchanged for backward compatibility

### Frontend Changes
- Add floating chat bubble/drawer component on case page
- Session-only conversation state (no persistence)
- Full case context automatically included with each message
- Accessible only to Organization Admin and System Admin roles

### API Models
- New `CaseChatRequest` model with `message` field
- New `CaseChatResponse` model with `response` and `timestamp` fields

## Impact

- **Affected specs**: New `case-ai` capability (encompasses existing summary + new chat)
- **Affected backend code**:
  - `Lawsome.Api/Controllers/CaseSummaryController.cs` → rename
  - `Lawsome.Services/Cases/CaseSummaryService.cs` → rename
  - `Lawsome.Services/Cases/ICaseSummaryService.cs` → rename
  - `Lawsome.Services/AI/OpenAiService.cs` → add method
  - `Lawsome.Services/AI/IOpenAiService.cs` → add method
  - `Lawsome.Api/DependencyReg/ServiceCollectionExtension.cs` → update registration
  - `Lawsome.Api.Models/Cases/` → new request/response models
- **Affected frontend code**:
  - `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/` → new chat component
  - `src/app/organization/services/api.ts` → new API function
  - `src/app/organization/types/index.ts` → new types
- **User roles affected**: OrganizationAdmin, SystemAdmin only
