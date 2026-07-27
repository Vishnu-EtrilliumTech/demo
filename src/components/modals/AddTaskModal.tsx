"use client";

import { ListPlus, Check, TriangleAlert, X } from "lucide-react";
import dayjs from "dayjs";
import { Dialog, Field, Input, Textarea, Select, Button } from "@/design-system";
import {
  AddCaseTaskRequest,
  TaskStatus,
  ContributorAccessLevel,
} from "@/app/organization/types/caseindex";
import { User } from "@/app/organization/types";

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: AddCaseTaskRequest;
  onFormChange: (
    field: keyof AddCaseTaskRequest,
    value: string | number,
  ) => void;
  errors: Record<string, string>;
  apiErrors: string[] | null;
  onSetApiErrors: (errors: string[] | null) => void;
  isSubmitting: boolean;
  siteUsers: User[];
  loadingSiteUsers: boolean;
  /**
   * User ids for whom the "Case Access for Assignee" field is hidden — anyone
   * the backend would not auto-grant as a contributor: the creator, main
   * assignee, existing contributors, or an admin. Sourced from the complement
   * of the backend's eligible-to-add list, so admins are detected reliably.
   */
  relatedUserIds?: string[];
}

export default function AddTaskModal({
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
  relatedUserIds = [],
}: AddTaskModalProps) {
  const showAccessField =
    !!formData.assignedToId && !relatedUserIds.includes(formData.assignedToId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add Task"
      subtitle="Create a new task for this case"
      icon={ListPlus}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" icon={Check} loading={isSubmitting} onClick={onSubmit}>
            Add Task
          </Button>
        </>
      }
    >
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

      <Field label="Assigned To">
        <Select
          value={formData.assignedToId || ""}
          onChange={(e) => onFormChange("assignedToId", e.target.value)}
          disabled={loadingSiteUsers}
        >
          <option value="">Unassigned</option>
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

      <Field label="Due Date" error={!!errors.dueDate} hint={errors.dueDate || undefined}>
        <Input
          type="datetime-local"
          min={dayjs().format("YYYY-MM-DDTHH:mm")}
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
    </Dialog>
  );
}
