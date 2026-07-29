"use client";

import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { addTask, updateTask, deleteTask, setTaskPriority } from "@/app/organization/services/calendarApi";
import type { AddOrgTaskRequest, UpdateOrgTaskRequest, Priority } from "@/app/organization/types/calendarTypes";

/** Create/update/delete for Org/Site-scope Tasks created from the Calendar (distinct from case-scoped useCaseTasks). */
export function useTasks(organizationId: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  const createTask = async (request: AddOrgTaskRequest, siteId?: string) => {
    setIsSubmitting(true);
    try {
      const created = await addTask(organizationId, request, siteId);
      showSuccess("Task created.");
      return created;
    } catch {
      showError("Failed to create the task.");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const editTask = async (taskId: string, request: UpdateOrgTaskRequest, siteId?: string) => {
    setIsSubmitting(true);
    try {
      const updated = await updateTask(organizationId, taskId, request, siteId);
      showSuccess("Task updated.");
      return updated;
    } catch {
      showError("Failed to update the task.");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeTask = async (taskId: string, siteId?: string) => {
    try {
      await deleteTask(organizationId, taskId, siteId);
      showSuccess("Task deleted.");
      return true;
    } catch {
      showError("Failed to delete the task.");
      return false;
    }
  };

  const quickSetPriority = async (taskId: string, priority: Priority, siteId?: string) => {
    try {
      await setTaskPriority(organizationId, taskId, priority, siteId);
    } catch {
      showError("Failed to update priority.");
    }
  };

  return { isSubmitting, createTask, editTask, removeTask, quickSetPriority };
}
