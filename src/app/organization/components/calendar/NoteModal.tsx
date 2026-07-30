"use client";

import React, { useEffect, useState } from "react";
import { StickyNote, Trash2 } from "lucide-react";
import { Dialog, Button, Field, Input, Textarea, Select } from "@/design-system";
import { PriorityPicker } from "@/components/modals/PriorityPicker";
import { CasePickerAutocomplete } from "@/components/modals/CasePickerAutocomplete";
import type { Case, Site, User } from "@/app/organization/types";
import type { Note, Priority } from "@/app/organization/types/calendarTypes";
import { toDatetimeLocalValue } from "./calendarDateUtils";

type NoteScope = "Org" | "Site" | "Case";

export interface NoteFormValue {
  scope: NoteScope;
  siteId: string;
  linkedCase: Case | null;
  title: string;
  body: string;
  noteDate: string;
  taggedUserIds: string[];
  priority: Priority;
}

interface NoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: NoteFormValue) => Promise<void>;
  organizationId: string;
  sites: Site[];
  users: User[];
  isSubmitting: boolean;
  existing?: Note | null;
  onDelete?: () => void;
  /** Pre-fill the date field with this date (e.g. the Calendar day/slot the user clicked to create from). Ignored when editing. */
  seedDate?: Date | null;
}

const MAX_TAG_CHIPS = 4;

const emptyValue = (seedDate?: Date | null): NoteFormValue => ({
  scope: "Org",
  siteId: "",
  linkedCase: null,
  title: "",
  body: "",
  noteDate: toDatetimeLocalValue(seedDate ?? new Date()),
  taggedUserIds: [],
  priority: null,
});

/** Create/edit a Note: Org/Site/Case scope, unlimited tagged people, Priority. */
export default function NoteModal({ open, onClose, onSubmit, organizationId, sites, users, isSubmitting, existing, onDelete, seedDate }: NoteModalProps) {
  const [value, setValue] = useState<NoteFormValue>(() => emptyValue(seedDate));

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setValue({
        scope: existing.caseId ? "Case" : existing.siteId ? "Site" : "Org",
        siteId: existing.siteId ?? "",
        linkedCase: null,
        title: existing.title,
        body: existing.body ?? "",
        noteDate: toDatetimeLocalValue(new Date(existing.noteDate)),
        taggedUserIds: existing.taggedUserIds,
        priority: existing.priority,
      });
    } else {
      setValue(emptyValue(seedDate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existing]);

  const taggedNames = value.taggedUserIds
    .map((id) => users.find((u) => u.id === id)?.fullName ?? id)
    .slice(0, MAX_TAG_CHIPS);
  const taggedOverflow = value.taggedUserIds.length - taggedNames.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={existing ? "Edit Note" : "Add Note"}
      subtitle={existing ? "Update note details" : "Add a note to the Calendar"}
      icon={StickyNote}
      footer={
        <>
          {existing && onDelete && (
            <Button variant="ghost" icon={Trash2} onClick={onDelete} disabled={isSubmitting} style={{ marginRight: "auto", color: "#dc2626" }}>
              Delete Note
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" loading={isSubmitting} onClick={() => onSubmit(value)}>
            {existing ? "Save Changes" : "Add Note"}
          </Button>
        </>
      }
    >
      <Field label="Scope" required>
        <Select
          value={value.scope}
          onChange={(e) => setValue((v) => ({ ...v, scope: e.target.value as NoteScope, siteId: "", linkedCase: null }))}
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

      <Field label="Title" required>
        <Input value={value.title} onChange={(e) => setValue((v) => ({ ...v, title: e.target.value }))} placeholder="Note title" />
      </Field>

      <Field label="Date" required>
        <Input
          type="datetime-local"
          value={value.noteDate}
          onChange={(e) => setValue((v) => ({ ...v, noteDate: e.target.value }))}
        />
      </Field>

      <Field label="Body">
        <Textarea rows={3} value={value.body} onChange={(e) => setValue((v) => ({ ...v, body: e.target.value }))} placeholder="Note details" />
      </Field>

      <Field label="Tagged People" hint="No limit on the number of people you can tag.">
        <Select multiple value={value.taggedUserIds} onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
          setValue((v) => ({ ...v, taggedUserIds: selected }));
        }} style={{ height: 96 }}>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName}
            </option>
          ))}
        </Select>
        {value.taggedUserIds.length > 0 && (
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
            {taggedNames.join(", ")}
            {taggedOverflow > 0 && ` +${taggedOverflow} more`}
          </div>
        )}
      </Field>

      <Field label="Priority">
        <PriorityPicker value={value.priority} onChange={(p) => setValue((v) => ({ ...v, priority: p }))} />
      </Field>
    </Dialog>
  );
}
