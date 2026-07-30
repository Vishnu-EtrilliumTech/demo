"use client";

import React, { useEffect, useState } from "react";
import { ListTodo, Trash2 } from "lucide-react";
import { Dialog, Button, Field, Input, Textarea, Select } from "@/design-system";
import { PriorityPicker } from "@/components/modals/PriorityPicker";
import { CasePickerAutocomplete } from "@/components/modals/CasePickerAutocomplete";
import { TaskStatus } from "@/app/organization/types/caseindex";
import type { Case, Site, User } from "@/app/organization/types";
import type { OrgTask, Priority } from "@/app/organization/types/calendarTypes";
import { toDatetimeLocalValue } from "./calendarDateUtils";

type TaskScope = "Org" | "Site" | "Case";

export interface TaskFormValue {
  scope: TaskScope;
  siteId: string;
  linkedCase: Case | null;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  assignedToId: string;
  priority: Priority;
}

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: TaskFormValue) => Promise<void>;
  organizationId: string;
  sites: Site[];
  users: User[];
  isSubmitting: boolean;
  existing?: OrgTask | null;
  onDelete?: () => void;
  /** Pre-fill the due date field with this date (e.g. the Calendar day/slot the user clicked to create from). Ignored when editing. */
  seedDate?: Date | null;
}

const emptyValue = (seedDate?: Date | null): TaskFormValue => ({
  scope: "Org",
  siteId: "",
  linkedCase: null,
  title: "",
  description: "",
  dueDate: seedDate ? toDatetimeLocalValue(seedDate) : "",
  status: TaskStatus.Open,
  assignedToId: "",
  priority: null,
});

/** Create/edit an Org/Site/Case-scope Task from the Calendar. */
export default function TaskModal({ open, onClose, onSubmit, organizationId, sites, users, isSubmitting, existing, onDelete, seedDate }: TaskModalProps) {
  const [value, setValue] = useState<TaskFormValue>(() => emptyValue(seedDate));

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setValue({
        scope: existing.caseId ? "Case" : existing.siteId ? "Site" : "Org",
        siteId: existing.siteId ?? "",
        linkedCase: null,
        title: existing.title,
        description: existing.description ?? "",
        dueDate: existing.dueDate ? toDatetimeLocalValue(new Date(existing.dueDate)) : "",
        status: existing.status,
        assignedToId: existing.assignedToId ?? "",
        priority: existing.priority,
      });
    } else {
      setValue(emptyValue(seedDate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existing]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={existing ? "Edit Task" : "Add Task"}
      subtitle={existing ? "Update task details" : "Add a task to the Calendar"}
      icon={ListTodo}
      footer={
        <>
          {existing && onDelete && (
            <Button variant="ghost" icon={Trash2} onClick={onDelete} disabled={isSubmitting} style={{ marginRight: "auto", color: "#dc2626" }}>
              Delete Task
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" loading={isSubmitting} onClick={() => onSubmit(value)}>
            {existing ? "Save Changes" : "Add Task"}
          </Button>
        </>
      }
    >
      <Field label="Scope" required>
        <Select
          value={value.scope}
          onChange={(e) => setValue((v) => ({ ...v, scope: e.target.value as TaskScope, siteId: "", linkedCase: null }))}
        >
          <option value="Org">Organization-wide</option>
          <option value="Site">Site</option>
          <option value="Case">Case</option>
        </Select>
      </Field>

      {value.scope === "Site" && (
        <Field label="Site" required>
          <Select value={value.siteId} onChange={(e) => setValue((v) => ({ ...v, siteId: e.target.value }))}>
            <option value="">Select a site</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {value.scope === "Case" && (
        <Field label="Case" required>
          <CasePickerAutocomplete
            organizationId={organizationId}
            value={value.linkedCase}
            onSelect={(c) => setValue((v) => ({ ...v, linkedCase: c }))}
          />
        </Field>
      )}

      <Field label="Task Title" required>
        <Input value={value.title} onChange={(e) => setValue((v) => ({ ...v, title: e.target.value }))} placeholder="Task title" />
      </Field>

      <Field label="Status" required>
        <Select value={value.status} onChange={(e) => setValue((v) => ({ ...v, status: e.target.value as TaskStatus }))}>
          {Object.values(TaskStatus).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Assigned To">
        <Select value={value.assignedToId} onChange={(e) => setValue((v) => ({ ...v, assignedToId: e.target.value }))}>
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Due Date">
        <Input type="datetime-local" value={value.dueDate} onChange={(e) => setValue((v) => ({ ...v, dueDate: e.target.value }))} />
      </Field>

      <Field label="Description">
        <Textarea rows={3} value={value.description} onChange={(e) => setValue((v) => ({ ...v, description: e.target.value }))} placeholder="Task description" />
      </Field>

      <Field label="Priority">
        <PriorityPicker value={value.priority} onChange={(p) => setValue((v) => ({ ...v, priority: p }))} />
      </Field>
    </Dialog>
  );
}
