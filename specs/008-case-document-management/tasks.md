# Tasks: Case Document Management

**Input**: `specs/008-case-document-management/`
**Branch**: `008-case-document-management`

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1=Upload document to case, US2=View and download documents, US3=Task-level documents

---

## Phase 1: Setup

**Purpose**: Audit existing code to identify the exact gaps before writing any fixes.

- [ ] T001 Read `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/DocumentsTab/DocumentsTab.tsx` — audit Delete button for `{!isSiteCaseClient && ...}` conditional render; verify Upload button is available to ALL roles including SiteCaseClient; check empty state renders when `documents.length === 0`
- [ ] T002 [P] Read `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/hooks/useCaseDocuments.ts` — verify `file.size === 0` guard exists before `addCaseDocument` call (FR-007); verify byte array download handles both `number[]` and `{data: number[]}` response shapes
- [ ] T003 [P] Verify `fetchCaseDocuments`, `addCaseDocument`, `fetchCaseDocument`, `deleteCaseDocument` in `src/app/organization/services/caseapi.ts` — confirm all four exist with correct URL patterns

---

## Phase 2: UI

**Purpose**: Fix RBAC guard on Delete button and ensure empty state renders correctly.

- [ ] T004 [US1] Add `{!isSiteCaseClient && <IconButton>Delete</IconButton>}` guard in `DocumentsTab.tsx` on each document row if missing — SiteCaseClient must not see any delete controls (FR-005)
- [ ] T005 [US2] Verify Upload button in `DocumentsTab.tsx` renders for ALL roles including `SiteCaseClient` — Upload is allowed for all (spec P1 scenario 3); confirm no RBAC gate on the Upload button
- [ ] T006 [US2] Verify `EmptyState` component renders with message "No documents uploaded yet" when `documents.length === 0 && !loadingDocuments` in `DocumentsTab.tsx` — add if missing
- [ ] T007 [US2] Verify document list renders columns: filename | remarks | uploader name | upload date | download button | delete button (role-gated) — no raw binary content in list view (FR-001)

---

## Phase 3: Logic

**Purpose**: Add empty-file guard in upload handler if missing.

- [ ] T008 [US1] Add `if (file.size === 0) { setDocumentApiErrors(['File cannot be empty']); return; }` in `useCaseDocuments.ts` `handleUploadDocument` before any `FileReader` or API call — prevent empty-file uploads (FR-007)
- [ ] T009 [US2] Verify uploader name resolution in `useCaseDocuments.ts` — matches `createdById` against `siteUsers` prop; fallback to numeric ID string if `siteUsers` not yet loaded
- [ ] T010 [US2] Verify download logic in `useCaseDocuments.ts` handles both content shapes: `content: number[]` → `new Uint8Array(content)`; `content: {data: number[]}` → `new Uint8Array(content.data)`; `content: string` → base64 decode; create Blob → `URL.createObjectURL` → open in new tab or trigger download

---

## Phase 4: API

**Purpose**: Confirm all four API functions are wired correctly.

- [ ] T011 [P] Confirm POST `/api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/documents` accepts `AddCaseDocumentRequest` with `name`, `content` (base64 string), `remarks?` and returns `201 { id: number }`
- [ ] T012 [P] Confirm GET `.../documents/{documentId}` returns the document with `content` field (byte array or base64) for download — confirm content is NOT included in the list GET (FR-002)

---

## Phase 5: Backend

**Purpose**: Verify backend enforces SiteCaseClient restriction on deletion.

- [ ] T013 Confirm DELETE `/api/v1/.../cases/{caseId}/documents/{documentId}` with `SiteCaseClient` Bearer token returns `403` — backend is the security gate
- [ ] T014 [P] Confirm the list GET `/api/v1/.../cases/{caseId}/documents` does NOT return `content` field — only metadata; verify with a real API call or response type inspection

---

## Phase 6: Security

**Purpose**: Confirm RBAC guards and empty-file validation are in place.

- [ ] T015 [US1] Verify `file.size === 0` guard fires BEFORE `FileReader.readAsDataURL` — no async work should start for empty files; assert `addCaseDocument` is not called
- [ ] T016 [US1] Verify `SiteCaseClient` has zero Delete buttons in the document list — inspect DOM in unit tests; Upload button must still be present
- [ ] T017 Verify filename is displayed in MUI `Typography`/`TableCell` — never via `dangerouslySetInnerHTML`; XSS not possible through filename display

---

## Phase 7: Testing

**Purpose**: Unit and E2E coverage for all three user stories.

- [ ] T018 [P] [US1] Write unit test `DocumentsTab/__tests__/DocumentsTab.test.tsx` — SiteAdmin: Upload and Delete buttons visible; SiteCaseClient: Upload visible, Delete absent from DOM; empty list: EmptyState rendered; Delete click: DeleteConfirmationModal opens; empty file: inline error shown, API not called
- [ ] T019 [P] [US2] Write unit test `hooks/__tests__/useCaseDocuments.test.ts` — empty file upload sets error, `addCaseDocument` mock not invoked; successful upload adds document to list; download creates Blob and calls `URL.createObjectURL`
- [ ] T020 Write E2E test `e2e/008-case-document-management.spec.ts` — SiteClerk uploads document golden path; empty file upload rejected with inline error; SiteCaseClient can upload; SiteCaseClient has no Delete buttons; SiteAdmin downloads a document; empty document list shows empty state

---

## Phase 8: Logging

**Purpose**: Structured logging per plan section 10.

- [ ] T021 Verify `useCaseDocuments.ts` logs: upload attempted (caseId, file size — not filename); delete (caseId, documentId — not filename); empty file attempt (warn, userId, caseId — no filename); upload API error (HTTP status, caseId — not content or token) — never log file content or binary data

---

## Phase 9: Quality Gates

**Purpose**: Pre-commit checks must pass.

- [ ] T022 Run `npm run type-check` — fix TypeScript errors in modified `DocumentsTab.tsx` and `useCaseDocuments.ts` if guards or logic were added
- [ ] T023 [P] Run `npm run lint` — fix all ESLint warnings
- [ ] T024 Run `npm run build` — production build passes
- [ ] T025 [P] Run `npm run test` — all new unit tests pass

---

## Phase 10: Finalization

**Purpose**: Final review and commit.

- [ ] T026 Confirm task-level document management (spec 007 scope) is handled by `useCaseTasks.ts` + `TasksTab` — no duplication in `DocumentsTab` (task docs are a separate sub-section within tasks, not the case-level Documents tab)
- [ ] T027 [P] Confirm "All file types accepted" hint is shown below the file picker input in `DocumentsTab.tsx` (spec assumption — infrastructure limits apply)
- [ ] T028 Commit: `feat(008): add empty-file guard and SiteCaseClient delete RBAC fix in DocumentsTab; add document unit and E2E tests`

---

## Dependencies

- **Setup (Phase 1)**: Start immediately — audit only
- **UI (Phase 2)**: Depends on T001 audit; T004 may be a no-op if guard already exists
- **Logic (Phase 3)**: Depends on T002 audit; T008 may be a no-op if guard already exists
- **API (Phase 4)**: Parallel — verification only
- **Security (Phase 6)**: Depends on UI + Logic fixes
- **Testing (Phase 7)**: Depends on all implementation phases

### Parallel Opportunities

```
After Setup:
  [Parallel] UI fixes (T004-T007) + Logic fixes (T008-T010) + API verification (T011-T012)

After Implementation:
  [Parallel] T018 + T019 (unit test files)
  [Parallel] T022 (type-check) + T023 (lint) + T025 (tests)
```

### Note on Scope

Most work in this spec is verification. If both the `file.size === 0` guard (T008) and the `SiteCaseClient` delete guard (T004) already exist in the code, the primary deliverables are the unit tests (T018–T019) and E2E test (T020).
