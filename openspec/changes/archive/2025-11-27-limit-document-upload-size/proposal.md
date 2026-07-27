# Proposal: Limit Document Upload Size to 1MB

## Change ID
`limit-document-upload-size`

## Summary
Implement a 1MB file size limit for document uploads in case documents and case task documents. This ensures consistent validation across the application and prevents users from uploading excessively large files that could impact system performance and storage costs.

## Motivation
Currently, there is no client-side validation for file size when uploading documents to cases or case tasks. This can lead to:
- Large file uploads that consume excessive bandwidth
- Potential backend errors or timeouts for oversized files
- Inconsistent user experience with late-stage validation failures
- Unnecessary storage costs from large files

By implementing a 1MB file size limit with clear error messaging, we can:
- Provide immediate feedback to users when they attempt to upload files that exceed the limit
- Reduce server load and bandwidth usage
- Create a consistent validation pattern that can be extended to other file upload features
- Align with the technical constraint already documented in `openspec/project.md` (line 207)

## Scope
This change affects:
- **Case Documents Upload**: File upload in `DocumentsTab` component
- **Task Documents Upload**: File upload in `TasksTab` component (documents tab)

Both upload flows currently accept files without client-side size validation. The implementation will:
1. Add file size validation before upload processing begins
2. Display error messages using the existing Toast notification system
3. Use the standard error handling patterns already established in the codebase

## Out of Scope
- Backend validation changes (assumed to already exist)
- File size limits for other upload features (profile photos, etc.)
- Compression or resizing of uploaded files
- Configurable file size limits
- Bulk upload size limits

## Relationships
- **Extends**: Existing document upload functionality
- **Uses**: Toast notification system (`ToastContext`)
- **Uses**: File validation patterns

## Risks & Considerations
- **User Impact**: Users attempting to upload files larger than 1MB will be blocked
- **Mitigation**: Clear error messaging explaining the size limit
- **Migration**: No data migration needed as this is a new validation layer

## Alternatives Considered
1. **Backend-only validation**: Would require round-trip to server before showing error
2. **Configurable limits**: Added complexity without clear business need
3. **File compression**: Introduces technical complexity and potential quality issues

## Success Criteria
- Users receive immediate feedback when attempting to upload files > 1MB
- Error messages are clear and actionable
- Validation uses existing error handling patterns (Toast notifications)
- No regression in existing upload functionality for valid file sizes
- Code follows existing validation patterns in the codebase
