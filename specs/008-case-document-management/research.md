# Research: Case Document Management

**Branch**: `008-case-document-management` | **Date**: 2026-05-15

---

## 1. Existing Infrastructure

### Decision: Use existing `useCaseDocuments` hook for case-level documents
- **Rationale**: `useCaseDocuments.ts` handles fetch, upload (base64 encoding), download (byte array conversion), delete, and uploader name resolution for case-level documents.
- **Alternatives considered**: Combining case and task documents into one hook — rejected; separation of concerns, and task documents are already managed by `useCaseTasks`.

### Decision: Task documents managed via `useCaseTasks`
- **Rationale**: `useCaseTasks.ts` already includes the full task document sub-feature (upload/download/delete/remarks update). The `TasksTab` renders a document section within the task detail expansion. This is the correct boundary: spec 008's task document scope is satisfied by spec 007's `TasksTab` infrastructure.
- **Alternatives considered**: Separate `useTaskDocuments` hook — exists (`useTaskDocuments.ts`) but is not the primary driver; `useCaseTasks` wraps it.

### Decision: Use existing `caseapi.ts` for case document API functions
- **Rationale**: `fetchCaseDocuments`, `addCaseDocument`, `fetchCaseDocument`, `deleteCaseDocument` all implemented.

---

## 2. File Upload Pattern

### Decision: Base64 encoding client-side before POST
- **Rationale**: The existing upload pattern converts `FileReader.readAsDataURL()` result to base64 and sends it as `content` in the JSON body. The backend accepts `{ name, content, remarks }`.
- **Empty-file guard**: `file.size === 0` check is required client-side before calling `addCaseDocument` (spec FR-007). Verify this guard exists in `useCaseDocuments`.

### Decision: Byte array → Blob conversion for download
- **Rationale**: `fetchCaseDocument` returns `content` as a byte array (`number[]`) or wrapped `{data: number[]}`. The download handler converts this to a `Blob` and calls `URL.createObjectURL` to trigger browser download or open in new tab.

---

## 3. RBAC Differences from Spec 007

Spec 008 actors differ from spec 007:
- `SiteCaseClient` can **upload** case documents (unlike task management).
- `SiteCaseClient` cannot **delete** case documents or **update task document remarks**.

### Decision: Conditional rendering in `DocumentsTab` and task document sub-section
- Upload button: rendered for all roles including `SiteCaseClient`.
- Delete button: hidden for `SiteCaseClient` — `{!isSiteCaseClient && <IconButton>Delete</IconButton>}`.
- Task document remarks edit: hidden for `SiteCaseClient`.

---

## 4. Document List Performance

The spec notes: "document list does not paginate for MVP." The existing `fetchCaseDocuments` returns all documents in a single response. Binary content is intentionally excluded from the list call — each `CaseDocument` in the list has no `content` field. Content is only returned by the individual `fetchCaseDocument` call.

---

## 5. Uploader Name Resolution

`useCaseDocuments` resolves `uploadedByName` by mapping `createdById` against a user list. This is derived on the frontend; it is not part of the API response. Verify the user list is available at the time the documents tab renders.

---

## 6. Gaps Identified

| Gap | Severity | Disposition |
|-----|----------|-------------|
| Empty-file guard in `useCaseDocuments` before `addCaseDocument` | High | Verify `file.size === 0` check; add if missing |
| SiteCaseClient delete guard in `DocumentsTab` | High | Verify `{!isSiteCaseClient && ...}` on Delete button |
| Task document remarks-edit guard for SiteCaseClient (in `TasksTab`) | High | Verify — covered in spec 007 scope |
| Uploader name not shown when user list unavailable | Low | Show user ID as fallback |
| No unit tests for `DocumentsTab` or `useCaseDocuments` | Medium | Create as part of this spec |
| No E2E tests for document upload/download | Medium | Create as part of this spec |
