# Spec: Invoice Document Upload File Size Validation

## Overview
This capability extends the existing file size validation pattern to invoice document uploads, preventing users from uploading invoice files larger than 1MB with immediate error feedback.

## ADDED Requirements

### Requirement: File Size Validation for New Invoice Uploads
**Priority**: High
**Type**: Functional

The system SHALL validate file size before processing new invoice document uploads.

#### Scenario: User attempts to upload an invoice file larger than 1MB
**Given** a user is on the invoice tab creating a new invoice
**And** they select a file to upload via "Choose File" button
**When** the file size exceeds 1,048,576 bytes (1MB)
**Then** the system shall display an error notification via Toast
**And** the error message shall state: "File size exceeds 1MB limit. Please upload a smaller file."
**And** the file upload process shall not proceed
**And** the file input shall be cleared
**And** no base64 encoding shall be performed

#### Scenario: User uploads an invoice file within the 1MB size limit
**Given** a user is on the invoice tab creating a new invoice
**And** they select a file to upload
**When** the file size is 1,048,576 bytes or less
**Then** the system shall proceed with the normal upload process
**And** the file shall be converted to base64
**And** the invoice file name shall be auto-populated
**And** no size-related error messages shall be displayed

### Requirement: File Size Validation for Edit Mode Invoice Uploads
**Priority**: High
**Type**: Functional

The system SHALL validate file size before processing invoice document replacements in edit mode.

#### Scenario: User attempts to replace an invoice file with one larger than 1MB
**Given** a user is editing an existing invoice
**And** they select the "Replace File" or "Choose File" button
**And** they select a new file to upload
**When** the file size exceeds 1,048,576 bytes (1MB)
**Then** the system shall display an error notification via Toast
**And** the error message shall state: "File size exceeds 1MB limit. Please upload a smaller file."
**And** the file replacement process shall not proceed
**And** the existing invoice file status shall remain unchanged
**And** no base64 encoding shall be performed

#### Scenario: User replaces an invoice file within the 1MB size limit
**Given** a user is editing an existing invoice
**And** they select a new file to upload
**When** the file size is 1,048,576 bytes or less
**Then** the system shall proceed with the normal file replacement process
**And** the new file shall be converted to base64
**And** the existing file indicator shall be updated
**And** no size-related error messages shall be displayed

### Requirement: Consistent Error Notification Pattern
**Priority**: High
**Type**: Non-Functional

The system SHALL use the existing Toast notification system for file size validation errors, consistent with case documents and task documents.

#### Scenario: Invoice file size validation error is displayed
**Given** a user attempts to upload an invoice file exceeding 1MB
**When** the validation fails
**Then** the error shall be displayed using the Toast error notification (red variant)
**And** the notification shall appear in the bottom-left corner of the screen
**And** the system shall NOT use browser `alert()` dialogs

## Implementation Notes

### Technical Details
- **File Size Constant**: 1MB = 1,048,576 bytes (1024 * 1024)
- **Validation Location**: At the start of file change handlers, before FileReader operations
- **Error Handling**: Use Toast context's `showError()` method
- **Error Message**: Use exact wording: "File size exceeds 1MB limit. Please upload a smaller file."

### Files to Modify
1. `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/InvoiceTab/InvoiceTab.tsx`
   - Function: `handleFileChange` (line ~171) - new invoice upload
   - Function: `handleEditFileChange` (line ~215) - edit mode file replacement

### Code Pattern
```typescript
// Import useToast at component level
const { showError } = useToast();

// In handleFileChange and handleEditFileChange:
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Check file size (1MB = 1048576 bytes)
    if (file.size > 1048576) {
      showError('File size exceeds 1MB limit. Please upload a smaller file.');
      // Reset file input
      e.target.value = '';
      return;
    }
    // ... existing processing logic
  }
};
```

## Cross-References
- **Extends**: Document Upload Validation pattern from archived change `2025-11-27-limit-document-upload-size`
- **Related to**: Technical constraint documented in `openspec/project.md` line 207
- **Uses**: Toast notification system defined in `src/contexts/ToastContext.tsx`
- **Related Issue**: https://github.com/eTrillium/Lawsome.Web.UI/issues/74
