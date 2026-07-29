"use client";

import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { addNote, updateNote, deleteNote, setNotePriority } from "@/app/organization/services/calendarApi";
import type { AddNoteRequest, UpdateNoteRequest, Priority } from "@/app/organization/types/calendarTypes";

/** Create/update/delete for Notes, following the same shape as the case-scoped hooks (useCaseTasks/useCaseHearings). */
export function useNotes(organizationId: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  const createNote = async (request: AddNoteRequest, siteId?: string) => {
    setIsSubmitting(true);
    try {
      const created = await addNote(organizationId, request, siteId);
      showSuccess("Note created.");
      return created;
    } catch {
      showError("Failed to create the note.");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const editNote = async (noteId: string, request: UpdateNoteRequest, siteId?: string) => {
    setIsSubmitting(true);
    try {
      const updated = await updateNote(organizationId, noteId, request, siteId);
      showSuccess("Note updated.");
      return updated;
    } catch {
      showError("Failed to update the note.");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeNote = async (noteId: string, siteId?: string) => {
    try {
      await deleteNote(organizationId, noteId, siteId);
      showSuccess("Note deleted.");
      return true;
    } catch {
      showError("Failed to delete the note.");
      return false;
    }
  };

  const quickSetPriority = async (noteId: string, priority: Priority, siteId?: string) => {
    try {
      await setNotePriority(organizationId, noteId, priority, siteId);
    } catch {
      showError("Failed to update priority.");
    }
  };

  return { isSubmitting, createNote, editNote, removeNote, quickSetPriority };
}
