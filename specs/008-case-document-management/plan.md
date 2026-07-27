# Implementation Plan: Case Document Management

**Branch**: `008-case-document-management` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)

---

## 1. Overview

### What Exists
- `DocumentsTab/DocumentsTab.tsx` — case-level document list with upload/download/delete.
- `useCaseDocuments.ts` — hook: fetch all documents, upload (base64 encode), download (byte array → Blob), delete, uploader name resolution.
- API functions in `caseapi.ts`: `fetchCaseDocuments`, `addCaseDocument`, `fetchCaseDocument`, `deleteCaseDocument`.
- Types: `CaseDocument`, `AddCaseDocumentRequest`, `CaseDocumentResponse`, `CaseDocumentsListResponse` in `caseindex.ts`.
- Task-level document management: fully handled by `useCaseTasks` + `TasksTab` (spec 007 scope).
- `DeleteConfirmationModal` from `@/components/modals/` for delete confirmation.

### Gaps to Close
1. Verify `file.size === 0` guard exists in `useCaseDocuments` before calling `addCaseDocument` (spec FR-007).
2. Verify `SiteCaseClient` cannot see Delete button in `DocumentsTab` (spec FR-005).
3. No unit tests for `DocumentsTab` or `useCaseDocuments`.
4. No E2E tests for document upload/download flow.

### What Is New
- Unit tests: `DocumentsTab.test.tsx`
- E2E test: `e2e/008-case-document-management.spec.ts`

---

## 2. Architecture Flow

### 2.1 View Documents

```
Case detail page mounts Documents tab
  → DocumentsTab renders
  → useCaseDocuments(orgId, siteId, caseId, siteUsers)
  → useEffect: fetchCaseDocuments() → GET /documents
  → setDocuments(data); resolve uploadedByName from siteUsers
  → if documents.length === 0 → <EmptyState>
  → else → <Table>: filename | remarks | uploader | upload date | actions
```

### 2.2 Upload Document

```
User (including SiteCaseClient) clicks "Upload Document"
  → File picker opens (input[type=file])
  → User selects file
  → file.size === 0 → inline error "File cannot be empty"; do NOT call API
  → file.size > 0 → FileReader.readAsDataURL(file) → base64 string
  → addCaseDocument(orgId, siteId, caseId, { name, content, remarks })
      → POST /documents
  → 201 → showSuccess → fetchCaseDocuments() (refetch for updated list)
  → 400 → extractApiErrors → inline error
```

### 2.3 Download Document

```
User clicks document name or download button
  → fetchCaseDocument(orgId, siteId, caseId, documentId)
      → GET /documents/{documentId}
  → content: number[] | {data: number[]} | string
  → convert to Blob (Uint8Array from byte array or base64)
  → URL.createObjectURL(blob) → open in new tab or trigger download
```

### 2.4 Delete Document

```
Authorized user (NOT SiteCaseClient) clicks delete icon
  → DeleteConfirmationModal opens with document name
  → User confirms → deleteCaseDocument(orgId, siteId, caseId, documentId)
      → DELETE /documents/{documentId}
  → 204 → showSuccess → remove from local state
  → error → showError
```

### 2.5 Task Document Flow

```
User expands a task row in TasksTab
  → Task detail section renders document sub-list
  → useCaseTasks fetches fetchTaskDocuments(orgId, siteId, caseId, taskId)
  → Upload/download/delete/remarks-update all handled within useCaseTasks
  (This flow is under spec 007 scope but satisfies spec 008 FR-006)
```

---

## 3. File Structure

### Documentation
```
specs/008-case-document-management/
  spec.md                          NO CHANGE
  plan.md                          NEW (this file)
  research.md                      NEW
  data-model.md                    NEW
  contracts/
    api-contracts.md               NEW
```

### Source Tree
```
src/app/organization/[id]/sites/[siteId]/cases/[caseId]/
  components/
    DocumentsTab/
      DocumentsTab.tsx             VERIFY — SiteCaseClient Delete guard; empty-state message
      DocumentsTab.module.css      NO CHANGE
      index.ts                     NO CHANGE
  hooks/
    useCaseDocuments.ts            VERIFY — empty-file guard (file.size === 0) before upload

src/app/organization/
  types/
    caseindex.ts                   NO CHANGE (CaseDocument, AddCaseDocumentRequest defined)
  services/
    caseapi.ts                     NO CHANGE (all case document functions exist)

e2e/
  008-case-document-management.spec.ts  NEW
```

---

## 4. Component Design

### 4.1 `DocumentsTab` (presentational + container in one file)
- **Purpose**: Renders the case document list with upload, download, delete actions.
- **Props**: `{ caseId, siteId, organizationId }`
- **RBAC rendering**:
  ```typescript
  // Upload available to ALL roles including SiteCaseClient:
  <Button onClick={onOpenFilePicker}>Upload Document</Button>

  // Delete hidden for SiteCaseClient:
  {!isSiteCaseClient && (
    <IconButton onClick={() => onDeleteDocument(doc)}><DeleteIcon /></IconButton>
  )}
  ```
- **Empty state**: `documents.length === 0 && !loadingDocuments → <EmptyState message="No documents uploaded yet" />`
- **List columns**: filename | remarks | uploader name | upload date | download button | delete button (role-gated)

### 4.2 `useCaseDocuments` hook
- **Upload flow**:
  ```typescript
  const handleUploadDocument = async (file: File, remarks?: string) => {
    if (file.size === 0) {
      setDocumentApiErrors(['File cannot be empty']);
      return;
    }
    const content = await fileToBase64(file);
    await addCaseDocument(orgId, siteId, caseId, { name: file.name, content, remarks });
  };
  ```
- **Download flow**: byte array conversion helper centralised in hook or `utils/`.
- **Uploader name**: resolved from `siteUsers` prop by matching `createdById`.

### 4.3 File Picker (input element)
- `accept="*"` — any file type (infrastructure limits apply per spec assumption).
- Triggered via `<Button>` that calls `ref.current.click()` on a hidden `<input type="file" />`.
- File size validation runs synchronously before any async work.

---

## 5. API Plan

| Method | URL (relative to case base) | Auth | Request | Success | Error Codes | Status |
|--------|-----------------------------|------|---------|---------|-------------|--------|
| `GET` | `/documents` | Bearer | — | `{ data: CaseDocument[] }` (no content) | 401, 403 | Existing |
| `POST` | `/documents` | Bearer | `AddCaseDocumentRequest` | `{ id: number }` 201 | 400, 401, 403 | Existing |
| `GET` | `/documents/{documentId}` | Bearer | — | `{ ...CaseDocument, content: byte[] }` | 401, 403, 404 | Existing |
| `DELETE` | `/documents/{documentId}` | Bearer | — | 204 | 401, 403, 404 | Existing |

All URLs prefixed: `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}`

> Task document endpoints are listed in spec 007 contracts and managed by `useCaseTasks`.

---

## 6. Security Plan

| Concern | Mitigation |
|---------|------------|
| SiteCaseClient deleting case documents via UI | Delete button hidden via `{!isSiteCaseClient && ...}`; backend enforces `[Authorize]` |
| SiteCaseClient reaching DELETE API directly | Backend role enforcement is the security gate |
| XSS via filename display | Filename rendered in MUI `Typography`/`TableCell` — no `dangerouslySetInnerHTML` |
| Empty file upload (0 bytes) | `file.size === 0` guard in `useCaseDocuments` before any encoding or API call |
| Large file payload | Backend infrastructure enforces size limit; frontend shows upload progress indicator |
| Token expiry during upload | `getToken()` fetched per-request; 401 handled by `httpServices` interceptor |
| Document belonging to a different case | Backend validates `caseId`; returns 404 if mismatch |

---

## 7. State Management

| State | Location | Rationale |
|-------|----------|-----------|
| `documents`, `loadingDocuments` | `useCaseDocuments` (local) | Case-scoped; no cross-route sharing |
| `documentApiErrors` | `useCaseDocuments` (local) | Inline error display; ephemeral |
| `deleteDocumentModalOpen`, `documentToDelete` | `useCaseDocuments` (local) | Dialog visibility; ephemeral |
| `downloadingDocumentId` | `useCaseDocuments` (local) | Per-row download spinner |
| Role flags | `useUserRole` (local, Redux-derived) | Per-session |

No new Redux slices required.

---

## 8. Testing Plan

### Unit Tests (Vitest + React Testing Library)

| Test File | Scenario | Expected |
|-----------|----------|----------|
| `DocumentsTab.test.tsx` | SiteAdmin → Upload and Delete buttons visible | Both render |
| `DocumentsTab.test.tsx` | SiteCaseClient → Upload visible, Delete hidden | Upload renders, Delete absent from DOM |
| `DocumentsTab.test.tsx` | Empty document list → EmptyState shown | EmptyState component renders |
| `DocumentsTab.test.tsx` | Delete button click → DeleteConfirmationModal opens | Modal in DOM |
| `useCaseDocuments.test.ts` | Empty file upload → API not called | `addCaseDocument` mock not invoked |
| `useCaseDocuments.test.ts` | Successful upload → document added to list | List length increases |
| `useCaseDocuments.test.ts` | Download → Blob created and URL opened | `URL.createObjectURL` called |

Test files: `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/DocumentsTab/__tests__/DocumentsTab.test.tsx`

### E2E Tests (Playwright)

| Scenario | Actor | Steps | Assert |
|----------|-------|-------|--------|
| Upload document — golden path | SiteClerk | Nav to case > Documents, click Upload, select file, submit | Document appears in list with filename and date |
| Empty file upload rejected | SiteClerk | Upload with empty file | Inline error shown; no network request |
| SiteCaseClient can upload | SiteCaseClient | Nav to case > Documents, click Upload, select file | Upload succeeds; document visible |
| SiteCaseClient cannot delete | SiteCaseClient | View document list | Zero delete buttons in DOM |
| Download document | SiteAdmin | Click download on a document | File download/opens in new tab |
| Empty document list | SiteAdmin | Nav to case with no documents | Empty state message shown |

Test file: `e2e/008-case-document-management.spec.ts`

---

## 9. Performance

| NFR | Implementation |
|-----|----------------|
| SC-001: Upload within 5s for ≤ 5MB files | Base64 encoding is synchronous; network is the bottleneck — show upload spinner during POST |
| SC-002: List renders without binary data | List endpoint returns no `content` field; binary only fetched on explicit download |
| SC-004: Empty file caught before network | `file.size === 0` check runs synchronously before `FileReader` — zero network requests for empty files |
| Uploader name resolution | Done in-memory against `siteUsers` prop — no extra API call |

---

## 10. Logging

| Event | Level | What to Log | What NOT to Log |
|-------|-------|-------------|-----------------|
| Document list fetched | INFO | `caseId`, count returned | Filenames |
| Document uploaded | INFO | `caseId`, `documentId`, file size (bytes) | Filename, file content |
| Document downloaded | INFO | `caseId`, `documentId` | File content |
| Document deleted | INFO | `caseId`, `documentId` | Filename |
| Empty file upload attempt blocked | WARN | `userId`, `caseId` | — |
| SiteCaseClient delete attempt blocked | WARN | `userId`, `caseId`, `documentId` | — |
| Upload API error | ERROR | HTTP status, `caseId` | Token, file content |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Empty-file guard missing in `useCaseDocuments` | Medium | Medium | Audit hook; add `file.size === 0` guard before `fileToBase64` call |
| SiteCaseClient Delete guard absent in `DocumentsTab` | Medium | High | Audit component; wrap Delete button in `{!isSiteCaseClient && ...}` |
| Byte array content shape inconsistency (`number[]` vs `{data: number[]}`) | High | Medium | Both shapes handled in existing download utility — maintain the union type check |
| Uploader name unresolved when `siteUsers` not yet loaded | Low | Low | Fallback to `createdById` (numeric) as display value |
| Upload progress UX missing for large files | Low | Low | Add MUI `LinearProgress` during upload in-flight state |
| File type restrictions enforced by infrastructure but not communicated to user | Low | Low | Display "All file types accepted" hint below file picker |
