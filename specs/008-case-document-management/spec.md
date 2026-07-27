# Feature Specification: Case Document Management

**Feature Branch**: `008-case-document-management`
**Created**: 2026-05-14
**Status**: Draft

---

## Objective

Allow authorized users to upload, view, and delete documents attached to cases and to tasks within cases. Documents can be uploaded at the case level or at the task level. The document list shows metadata only (no file content) — downloading a document opens the full file. SiteCaseClient can upload and view but cannot delete or update remarks.

---

## Actors

| Actor | Upload | View list | Download | Delete | Update task doc remarks |
|---|---|---|---|---|---|
| `OrganizationAdmin`, `SiteAdmin`, `SiteClerk`, `SiteSrLegalExpert`, `SiteLegalExpert` | Yes | Yes | Yes | Yes | Yes |
| `SiteCaseClient` | Yes | Yes | Yes | No | No |
| `OrganizationClerk` | No | No | No | No | No |

---

## User Scenarios & Testing

### P1 — Upload a Document to a Case (Priority: P1)

As an authorized user,
I want to upload a file to a case,
So that case-related documents are stored and accessible from the case detail page.

**Independent Test**: Navigate to Case > Documents tab > Upload Document. Select a file, optionally add remarks, submit. The document appears in the list.

**Acceptance Scenarios**:

1. **Given** an authorized user on the case Documents tab,
   **When** they click "Upload Document",
   **Then** a file picker opens along with an optional remarks field.

2. **Given** a file is selected and the form is submitted,
   **When** the upload succeeds,
   **Then** the document appears in the list with its filename and upload date.

3. **Given** a SiteCaseClient is on the Documents tab,
   **When** the tab loads,
   **Then** they can see the Upload button and all documents, but no Delete controls are visible.

---

### P2 — View and Download Documents (Priority: P2)

As any authorized user,
I want to see a list of documents and download any of them,
So that I can access the actual files when needed.

**Acceptance Scenarios**:

1. **Given** the Documents tab is active,
   **When** documents are loaded,
   **Then** the list shows: filename, remarks (if any), upload date, uploader name — but NOT the raw file content.

2. **Given** the user clicks on a document or a download button,
   **When** the individual document is fetched,
   **Then** the file downloads or opens in a new tab.

3. **Given** no documents are uploaded,
   **When** the Documents tab loads,
   **Then** an empty state is shown (not an error).

---

### P3 — Task-Level Documents (Priority: P3)

As an authorized user working on a task,
I want to attach documents directly to a task,
So that task-specific files are organized separately from case-level documents.

**Acceptance Scenarios**:

1. **Given** the user is viewing a task detail,
   **When** they navigate to the task's documents section,
   **Then** they can upload, list, download, and delete documents specific to that task.

2. **Given** a task document exists and the user updates its remarks,
   **When** the update succeeds,
   **Then** the new remarks are shown in the document list.

3. **Given** a SiteCaseClient viewing a task document,
   **When** they try to update remarks,
   **Then** no "Edit Remarks" control is visible.

---

### Edge Cases

- Empty file content (0 bytes) → validation error before upload
- No filename provided → required field error
- Document belongs to different case/task → "Document not found" response handled gracefully

---

## Requirements

### Functional Requirements

- **FR-001**: The Documents tab MUST display a list with: filename, remarks, uploader, upload date (no raw binary in list view).
- **FR-002**: A file picker MUST allow selection of any file type (file size limits applied by infrastructure).
- **FR-003**: Clicking download or a document MUST trigger the file download via a separate API call that returns the full content.
- **FR-004**: Delete MUST require confirmation via a dialog.
- **FR-005**: SiteCaseClient MUST see upload and view options but no delete or remarks-edit controls.
- **FR-006**: Task documents MUST be managed from within the task detail view (sub-section), separate from case-level documents.
- **FR-007**: Empty file content MUST be rejected with an inline error before the API is called.

### Key Entities

- **Case Document**: File attached to a case. Has filename, remarks, uploader, and binary content (returned separately from list).
- **Task Document**: File attached to a specific task. Supports a remarks field that can be updated independently.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Files upload within 5 seconds for files up to 5MB under normal network conditions.
- **SC-002**: Document list renders without file content — no performance degradation from binary data in list calls.
- **SC-003**: SiteCaseClient role has zero visible delete or remarks-edit controls.
- **SC-004**: Empty file selection is caught before any network request is made.

---

## Assumptions

- Files are accepted of any type — infrastructure-level size limits apply.
- The document list does not paginate for MVP; all documents for a case/task are returned in one request.
- Document download opens the file in a new browser tab or triggers a browser download dialog.

---

## Out of Scope

- Case task management — spec `007-case-task-management`
- Case comment management — spec `012-case-comment-management`
