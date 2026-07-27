# Spec: Document Upload File Size Validation

## Overview
This capability adds client-side file size validation to document upload flows in case documents and task documents, preventing users from uploading files larger than 1MB with immediate error feedback.

## ADDED Requirements

### Requirement: File Size Validation for Case Documents
**Priority**: High
**Type**: Functional

The system SHALL validate file size before processing case document uploads.

#### Scenario: User attempts to upload a file larger than 1MB to case documents
**Given** a user is on the case documents tab
**And** they select a file to upload
**When** the file size exceeds 1,048,576 bytes (1MB)
**Then** the system shall display an error notification via Toast
**And** the error message shall state: "File size exceeds 1MB limit. Please upload a smaller file."
**And** the file upload process shall not proceed
**And** the upload button shall return to its normal state

#### Scenario: User uploads a file within the 1MB size limit to case documents
**Given** a user is on the case documents tab
**And** they select a file to upload
**When** the file size is 1,048,576 bytes or less
**Then** the system shall proceed with the normal upload process
**And** no size-related error messages shall be displayed

### Requirement: File Size Validation for Task Documents
**Priority**: High
**Type**: Functional

The system SHALL validate file size before processing task document uploads.

#### Scenario: User attempts to upload a file larger than 1MB to task documents
**Given** a user is viewing a task in the tasks tab
**And** they navigate to the documents sub-tab
**And** they select a file to upload
**When** the file size exceeds 1,048,576 bytes (1MB)
**Then** the system shall display an error notification via Toast
**And** the error message shall state: "File size exceeds 1MB limit. Please upload a smaller file."
**And** the file upload process shall not proceed
**And** the upload button shall return to its normal state

#### Scenario: User uploads a file within the 1MB size limit to task documents
**Given** a user is viewing a task in the tasks tab
**And** they navigate to the documents sub-tab
**And** they select a file to upload
**When** the file size is 1,048,576 bytes or less
**Then** the system shall proceed with the normal upload process
**And** no size-related error messages shall be displayed

### Requirement: Consistent Error Notification Pattern
**Priority**: High
**Type**: Non-Functional

The system SHALL use the existing Toast notification system for file size validation errors.

#### Scenario: File size validation error is displayed to user
**Given** a user attempts to upload a file exceeding 1MB
**When** the validation fails
**Then** the error shall be displayed using the Toast error notification (red variant)
**And** the notification shall appear in the bottom-left corner of the screen
**And** the notification shall follow the existing Toast auto-dismiss behavior for error messages
**And** the system shall NOT use browser `alert()` dialogs

### Requirement: Early Validation Execution
**Priority**: High
**Type**: Non-Functional

The system SHALL validate file size before any file processing operations begin.

#### Scenario: File size validation occurs before base64 encoding
**Given** a user selects a file to upload
**When** the file size exceeds 1MB
**Then** the validation check shall execute before FileReader operations
**And** no base64 encoding shall be performed
**And** no API calls shall be initiated
**And** the user shall receive immediate feedback

## Implementation Notes

### Technical Details
- **File Size Constant**: 1MB = 1,048,576 bytes (1024 * 1024)
- **Validation Location**: Before FileReader operations in upload handler functions
- **Error Handling**: Use `useToast` hook's `showError()` method
- **Error Message**: Use exact wording specified in scenarios for consistency

### Files to Modify
1. `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/useCaseDocuments.ts`
   - Function: `handleCaseDocumentUpload` (line ~83)
   - Add validation before line 88 (FileReader creation)

2. `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/useCaseTasks.ts`
   - Function: `handleDocumentUpload` (line ~307)
   - Add validation before line 311 (FileReader creation)

### Code Pattern
```typescript
// Check file size (1MB = 1048576 bytes)
if (file.size > 1048576) {
  showError('File size exceeds 1MB limit. Please upload a smaller file.');
  setUploadingState(false); // Reset loading state if needed
  return;
}
```

## Cross-References
- **Related to**: Technical constraint documented in `openspec/project.md` line 207
- **Uses**: Toast notification system defined in `src/contexts/ToastContext.tsx`
- **Uses**: Error handling patterns from `src/utils/errorHandler.ts`
