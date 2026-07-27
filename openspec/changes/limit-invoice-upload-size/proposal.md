# Proposal: Limit Invoice Document Upload Size to 1MB

**Change ID**: `limit-invoice-upload-size`
**Related Issue**: https://github.com/eTrillium/Lawsome.Web.UI/issues/74
**Status**: Draft

## Summary

Add client-side file size validation (1MB limit) to invoice document uploads in the InvoiceTab component, matching the existing validation pattern used in case documents and task documents.

## Problem Statement

When users attempt to upload invoice documents larger than 1MB, the backend returns HTTP 413 (Request Entity Too Large). This creates a poor user experience as:

1. The user has already waited for the file to be processed and sent
2. The error comes from the server rather than being caught early on the client
3. The error message is not user-friendly

The file size validation was previously added to case documents and task documents (see archived change `2025-11-27-limit-document-upload-size`), but invoice document uploads were missed.

## Proposed Solution

Add file size validation in the `InvoiceTab.tsx` component for both:
1. **New invoice uploads** (`handleFileChange` function)
2. **Edit mode file replacement** (`handleEditFileChange` function)

The validation will:
- Check file size before FileReader operations
- Display a user-friendly Toast error message: "File size exceeds 1MB limit. Please upload a smaller file."
- Prevent the upload from proceeding
- Reset the file input state

## Scope

### In Scope
- File size validation for new invoice document uploads
- File size validation for invoice document replacement in edit mode
- Consistent error messaging using Toast notifications

### Out of Scope
- Changes to backend validation (already exists)
- Changes to other upload flows (already implemented)
- Configurable file size limits

## Impact Assessment

- **User Impact**: Users will receive immediate feedback when attempting to upload files > 1MB
- **Risk Level**: Low - isolated change to single component
- **Breaking Changes**: None - validation is additive

## Success Criteria

- Users see error message "File size exceeds 1MB limit. Please upload a smaller file." when uploading files > 1MB
- Files under 1MB upload successfully (no regression)
- Validation works in both new invoice and edit invoice modes
- No network requests are made for oversized files
