import React from "react";
import { Search, Upload, X, Download, Trash2, FileText, File } from "lucide-react";
import {
  Button,
  DataTable,
  Pagination,
  LoadingState,
  EmptyState,
  Input,
  Select,
  type Column,
} from "@/design-system";
import { CaseDocument } from "@/app/organization/types/caseindex";
import { useCaseDocuments } from "../../hooks/useCaseDocuments";
import { formatDisplayDate } from "@/utils";
import { useListQuery } from "@/hooks/useListQuery";
import type { DocumentListFilters } from "../../types/filterTypes";

// Container props interface
interface DocumentsTabContainerProps {
  caseId: string;
  siteId: string;
  organizationId: string;
  /** Show upload control (resource ≥ Edit). Defaults to true. */
  canCreateOrEditResource?: boolean;
  /** Show delete controls (resource === Full). Defaults to true. */
  canDeleteResource?: boolean;
}

interface DocumentsTabProps {
  caseDocuments: CaseDocument[];
  loadingCaseDocuments: boolean;
  uploadingCaseDocument: boolean;
  canCreateOrEditResource: boolean;
  canDeleteResource: boolean;
  searchValue: string | undefined;
  typeValue: string | undefined;
  sortValue: string;
  hasActiveFilters: boolean;
  onSearchChange: (v: string | undefined) => void;
  onTypeFilterChange: (v: string | undefined) => void;
  onSortChange: (v: string) => void;
  onClearFilters: () => void;
  onDocumentUpload: (file: File) => void;
  onDownloadDocument: (documentId: string, fileName: string) => void;
  onDeleteDocument: (documentId: string) => void;
}

const TYPE_OPTIONS = [
  { value: "PDF", label: "PDF" },
  { value: "DOC", label: "DOC/DOCX" },
  { value: "Image", label: "Image" },
  { value: "Other", label: "Other" },
];

const documentDate = (doc: CaseDocument): string => {
  if (doc.createdDate && !isNaN(new Date(doc.createdDate).getTime())) {
    return formatDisplayDate(doc.createdDate);
  }
  if (doc.uploadedAt && !isNaN(new Date(doc.uploadedAt).getTime())) {
    return formatDisplayDate(doc.uploadedAt);
  }
  return "Date not available";
};

const DocumentsTabPresentation: React.FC<DocumentsTabProps> = ({
  caseDocuments,
  loadingCaseDocuments,
  uploadingCaseDocument,
  canCreateOrEditResource,
  canDeleteResource,
  searchValue,
  typeValue,
  sortValue,
  hasActiveFilters,
  onSearchChange,
  onTypeFilterChange,
  onSortChange,
  onClearFilters,
  onDocumentUpload,
  onDownloadDocument,
  onDeleteDocument,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onDocumentUpload(file);
      e.target.value = "";
    }
  };

  const columns: Column<CaseDocument>[] = [
    {
      key: "name",
      header: "Document name",
      render: (doc) => (
        <div className="case-row-title">
          <b style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <File width={16} height={16} style={{ color: "var(--brand)", flexShrink: 0 }} aria-hidden />
            {doc.name || doc.documentName}
          </b>
          {doc.remarks && <span>💬 {doc.remarks}</span>}
        </div>
      ),
    },
    {
      key: "uploadedBy",
      header: "Added by",
      render: (doc) => doc.uploadedByName || "Loading…",
    },
    {
      key: "date",
      header: "Date",
      render: (doc) => documentDate(doc),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (doc) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
          <Button
            variant="ghost"
            icon={Download}
            title="Download document"
            aria-label="Download document"
            onClick={() => onDownloadDocument(doc.id, doc.name || doc.documentName || `document_${doc.id}`)}
          />
          {canDeleteResource && (
            <Button
              variant="ghost"
              icon={Trash2}
              title="Delete document"
              aria-label="Delete document"
              onClick={() => onDeleteDocument(doc.id)}
            />
          )}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="toolbar">
        {canCreateOrEditResource && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              style={{ display: "none" }}
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
            />
            <Button
              variant="primary"
              icon={Upload}
              loading={uploadingCaseDocument}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingCaseDocument ? "Uploading…" : "Upload document"}
            </Button>
          </>
        )}
        <div className="search">
          <Search aria-hidden />
          <Input
            type="text"
            value={searchValue || ""}
            onChange={(e) => onSearchChange(e.target.value || undefined)}
            placeholder="Search documents…"
          />
        </div>
        <div className="selectbox">
          <Select
            aria-label="Type"
            value={typeValue ?? ""}
            onChange={(e) => onTypeFilterChange(e.target.value || undefined)}
          >
            <option value="">All types</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="selectbox">
          <Select aria-label="Sort" value={sortValue} onChange={(e) => onSortChange(e.target.value)}>
            <option value="">Default sort</option>
            <option value="uploadedDate:desc">Newest first</option>
            <option value="uploadedDate:asc">Oldest first</option>
            <option value="name:asc">Name A→Z</option>
            <option value="name:desc">Name Z→A</option>
            <option value="type:asc">Type</option>
          </Select>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" icon={X} onClick={onClearFilters}>
            Clear
          </Button>
        )}
      </div>

      {loadingCaseDocuments ? (
        <LoadingState message="Loading documents…" />
      ) : caseDocuments.length > 0 ? (
        <DataTable columns={columns} rows={caseDocuments} getRowKey={(d) => String(d.id)} />
      ) : (
        <EmptyState
          icon={FileText}
          title="No case documents yet"
          description={
            canCreateOrEditResource
              ? "Upload general case documents like contracts, evidence, or legal briefs using the button above."
              : "No documents have been uploaded for this case."
          }
        />
      )}

      <div
        style={{
          marginTop: 16,
          padding: "14px 16px",
          borderRadius: "var(--radius, 12px)",
          background: "var(--surface-2, rgba(0,0,0,0.03))",
          border: "1px solid var(--border, rgba(0,0,0,0.08))",
        }}
      >
        <strong style={{ display: "block", marginBottom: 4, color: "var(--text-1)" }}>
          💡 Task-Specific Documents
        </strong>
        <p style={{ margin: 0, color: "var(--text-2)", fontSize: "0.875rem" }}>
          For documents related to specific tasks (research, drafts, etc.), use the &quot;Docs&quot; button in the Tasks
          tab next to each task.
        </p>
      </div>
    </div>
  );
};

// Container component
export const DocumentsTab: React.FC<DocumentsTabContainerProps> = ({
  caseId,
  siteId,
  organizationId,
  canCreateOrEditResource = true,
  canDeleteResource = true,
}) => {
  const { params, state, setPage, setSort, clearSort, setFilter, clearFilters } = useListQuery<DocumentListFilters>({
    defaultSort: { sortBy: "uploadedDate", sortDirection: "desc" },
    sortableFields: ["uploadedDate", "name", "type"],
    filterKeys: ["type", "uploaderId", "search"],
  });
  const documentsHook = useCaseDocuments(organizationId, siteId, caseId, params);
  const meta = documentsHook.caseDocumentsMeta;

  const hasActiveFilters = !!(state.filters.search || state.filters.type);
  const sortValue = state.sortBy ? `${state.sortBy}:${state.sortDirection ?? "asc"}` : "";
  const handleSortChange = (val: string) => {
    if (!val) {
      clearSort();
      return;
    }
    const [field, dir] = val.split(":");
    setSort(field, dir as "asc" | "desc");
  };

  return (
    <>
      <DocumentsTabPresentation
        caseDocuments={documentsHook.caseDocuments}
        loadingCaseDocuments={documentsHook.loadingCaseDocuments}
        uploadingCaseDocument={documentsHook.uploadingCaseDocument}
        canCreateOrEditResource={canCreateOrEditResource}
        canDeleteResource={canDeleteResource}
        searchValue={state.filters.search}
        typeValue={state.filters.type}
        sortValue={sortValue}
        hasActiveFilters={hasActiveFilters}
        onSearchChange={(v) => setFilter("search", v)}
        onTypeFilterChange={(v) => setFilter("type", v)}
        onSortChange={handleSortChange}
        onClearFilters={clearFilters}
        onDocumentUpload={documentsHook.uploadCaseDocument}
        onDownloadDocument={documentsHook.downloadCaseDocument}
        onDeleteDocument={documentsHook.deleteCaseDocument}
      />
      {meta && meta.totalCount > 0 && (
        <div className="tbl-foot" style={{ marginTop: 14 }}>
          <span className="cnt">
            {meta.totalCount} document{meta.totalCount === 1 ? "" : "s"}
          </span>
          <Pagination
            page={state.page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
            disabled={documentsHook.loadingCaseDocuments}
          />
        </div>
      )}
    </>
  );
};
