"use client";

import React, { useRef } from "react";
import {
  SquarePen,
  Check,
  Trash2,
  ClipboardList,
  Paperclip,
  MessageSquare,
  CloudUpload,
  Download,
  FileText,
  TriangleAlert,
  X,
} from "lucide-react";
import dayjs from "dayjs";
import {
  Dialog,
  Field,
  Input,
  Textarea,
  Select,
  Button,
  Tabs,
  Spinner,
  EmptyState,
} from "@/design-system";
import {
  UpdateCaseTaskRequest,
  TaskStatus,
  ContributorAccessLevel,
  TaskDocument,
} from "@/app/organization/types/caseindex";
import { User } from "@/app/organization/types";
import { TaskCommentsTab } from "@/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/TaskCommentsTab/TaskCommentsTab";
import { formatDisplayDate } from "@/utils";

interface EditTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: { title: string; description?: string; assignedToId: string; dueDate: string; status: TaskStatus; newAssigneeContributorAccessLevel?: ContributorAccessLevel; };
  onFormChange: (field: keyof UpdateCaseTaskRequest, value: string | number) => void;
  errors: Record<string, string>;
  apiErrors: string[] | null;
  onSetApiErrors: (errors: string[] | null) => void;
  isSubmitting: boolean;
  siteUsers: User[];
  loadingSiteUsers: boolean;
  taskTitle?: string;
  /**
   * User ids for whom the "Case Access for Assignee" field is hidden — anyone
   * the backend would not auto-grant as a contributor: the creator, main
   * assignee, existing contributors, or an admin. Sourced from the complement
   * of the backend's eligible-to-add list, so admins are detected reliably.
   */
  relatedUserIds?: string[];
  /** When true, shows a Delete Task action. */
  canDelete?: boolean;
  /** Called when the Delete Task action is clicked. */
  onDelete?: () => void;

  // Tabs
  activeTab: number;
  onTabChange: (tab: number) => void;

  // Documents tab
  caseId: string;
  siteId: string;
  organizationId: string;
  taskId: string;
  canCreateOrEditResource: boolean;
  canDeleteResource: boolean;
  documents: TaskDocument[];
  loadingDocuments: boolean;
  uploadingDocument: boolean;
  onDocumentUpload: (file: File) => void;
  onDeleteDocument: (documentId: string, documentName: string) => void;
  onDownloadDocument: (documentId: string, fileName: string) => void;
}

const TAB_KEYS = ["details", "documents", "comments"] as const;

export default function EditTaskModal({
  open,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  errors,
  apiErrors,
  onSetApiErrors,
  isSubmitting,
  siteUsers,
  loadingSiteUsers,
  taskTitle,
  relatedUserIds = [],
  canDelete = false,
  onDelete,
  activeTab,
  onTabChange,
  caseId,
  siteId,
  organizationId,
  taskId,
  canCreateOrEditResource,
  canDeleteResource,
  documents,
  loadingDocuments,
  uploadingDocument,
  onDocumentUpload,
  onDeleteDocument,
  onDownloadDocument,
}: EditTaskModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onDocumentUpload(file);
      e.target.value = "";
    }
  };

  const showAccessField =
    !!formData.assignedToId && !relatedUserIds.includes(formData.assignedToId);

  const footer =
    activeTab === 0 ? (
      <>
        {canDelete && (
          <Button
            variant="ghost"
            icon={Trash2}
            onClick={onDelete}
            disabled={isSubmitting}
            style={{ marginRight: "auto", color: "var(--danger)" }}
          >
            Delete Task
          </Button>
        )}
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="primary" icon={Check} loading={isSubmitting} onClick={onSubmit}>
          Save Changes
        </Button>
      </>
    ) : undefined;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Edit Task"
      subtitle={taskTitle ? `Editing: ${taskTitle}` : "Update task details"}
      icon={SquarePen}
      footer={footer}
    >
      <Tabs
        items={[
          { key: "details", label: "Details", icon: ClipboardList },
          { key: "documents", label: "Documents", icon: Paperclip, count: documents.length },
          { key: "comments", label: "Comments", icon: MessageSquare },
        ]}
        activeKey={TAB_KEYS[activeTab]}
        onChange={(key) => onTabChange(TAB_KEYS.indexOf(key as (typeof TAB_KEYS)[number]))}
      />

      {activeTab === 0 && (
        <>
          {apiErrors && apiErrors.length > 0 && (
            <div className="form-alert" role="alert">
              <TriangleAlert aria-hidden />
              <span style={{ flex: 1 }}>{apiErrors.join(" ")}</span>
              <button
                type="button"
                className="x"
                onClick={() => onSetApiErrors(null)}
                aria-label="Dismiss error"
                style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", display: "inline-flex" }}
              >
                <X width={15} height={15} aria-hidden />
              </button>
            </div>
          )}

          <Field label="Task Title" required error={!!errors.title} hint={errors.title || undefined}>
            <Input
              value={formData.title}
              onChange={(e) => onFormChange("title", e.target.value)}
              placeholder="Enter task title"
            />
          </Field>

          <Field label="Status" required error={!!errors.status} hint={errors.status || undefined}>
            <Select
              value={formData.status}
              onChange={(e) => onFormChange("status", e.target.value as TaskStatus)}
            >
              {Object.values(TaskStatus).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Assigned To" required>
            <Select
              value={formData.assignedToId || ""}
              onChange={(e) => onFormChange("assignedToId", e.target.value)}
              disabled={loadingSiteUsers}
            >
              {siteUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName}
                </option>
              ))}
            </Select>
          </Field>

          {/* Case access for assignee — only when an assignee is selected and
              not already related to the case (US4) */}
          {showAccessField && (
            <Field label="Case Access for Assignee">
              <Select
                value={formData.newAssigneeContributorAccessLevel ?? ContributorAccessLevel.ViewOnly}
                onChange={(e) =>
                  onFormChange("newAssigneeContributorAccessLevel", Number(e.target.value))
                }
              >
                <option value={ContributorAccessLevel.ViewOnly}>Viewer</option>
                <option value={ContributorAccessLevel.Edit}>Editor</option>
              </Select>
            </Field>
          )}

          <Field label="Due Date" required error={!!errors.dueDate} hint={errors.dueDate || undefined}>
            <Input
              type="datetime-local"
              value={formData.dueDate ? dayjs(formData.dueDate).format("YYYY-MM-DDTHH:mm") : ""}
              onChange={(e) => {
                onFormChange("dueDate", e.target.value);
                if (e.target.value) e.target.blur();
              }}
            />
          </Field>

          <Field label="Description" full error={!!errors.description} hint={errors.description || undefined}>
            <Textarea
              value={formData.description || ""}
              onChange={(e) => onFormChange("description", e.target.value)}
              placeholder="Enter task description"
              rows={3}
            />
          </Field>
        </>
      )}

      {activeTab === 1 && (
        <div>
          {canCreateOrEditResource && (
            <div style={{ marginBottom: 16 }}>
              <input
                ref={fileInputRef}
                type="file"
                id={`task-file-upload-${taskId}`}
                onChange={handleFileUpload}
                style={{ display: "none" }}
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              />
              <Button
                variant="primary"
                icon={CloudUpload}
                loading={uploadingDocument}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingDocument ? "Uploading..." : "Upload Document"}
              </Button>
            </div>
          )}

          {loadingDocuments ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
              <Spinner />
            </div>
          ) : documents.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: 12,
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    background: "var(--panel)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <FileText width={20} height={20} style={{ color: "var(--text-3)", flexShrink: 0 }} aria-hidden />
                    <div style={{ minWidth: 0 }}>
                      <div
                        title={doc.name}
                        style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      >
                        {doc.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                        Uploaded {doc.createdDate ? formatDisplayDate(doc.createdDate) : "Date not available"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <Button
                      variant="ghost"
                      icon={Download}
                      onClick={() => onDownloadDocument(doc.id, doc.name)}
                      title="Download document"
                      aria-label="Download document"
                    />
                    {canDeleteResource && (
                      <Button
                        variant="ghost"
                        icon={Trash2}
                        onClick={() => onDeleteDocument(doc.id, doc.name)}
                        title="Delete document"
                        aria-label="Delete document"
                        style={{ color: "var(--danger)" }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Paperclip}
              title="No documents yet"
              description="Upload documents related to this task using the button above."
            />
          )}
        </div>
      )}

      {activeTab === 2 && (
        <TaskCommentsTab
          caseId={caseId}
          siteId={siteId}
          organizationId={organizationId}
          taskId={taskId}
          siteUsers={siteUsers}
        />
      )}
    </Dialog>
  );
}
