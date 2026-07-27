"use client";

import React, { useState } from "react";
import { Trash2, TriangleAlert } from "lucide-react";
import { Dialog, Button } from "@/design-system";

export type EntityType =
  | "user"
  | "site"
  | "case"
  | "client"
  | "task"
  | "hearing"
  | "document"
  | "organization"
  | "invoice"
  | "comment"
  | "reply"
  | "contributor";

interface EntityConfig {
  title: string;
  message: string;
  cascadeWarning?: string;
}

/** Copy ported verbatim from the legacy DeleteConfirmationModal so wording is identical. */
const ENTITY_CONFIGS: Record<EntityType, EntityConfig> = {
  user: {
    title: "Delete User",
    message: "Are you sure you want to delete this user? This action cannot be undone.",
  },
  site: {
    title: "Delete Site",
    message: "Are you sure you want to delete this site? This action cannot be undone.",
    cascadeWarning: "All associated cases, and site-specific data will be permanently removed.",
  },
  case: {
    title: "Delete Case",
    message: "Are you sure you want to delete this case? This action cannot be undone.",
    cascadeWarning: "All associated tasks, hearings, documents, and client information will be permanently removed.",
  },
  client: {
    title: "Delete Client",
    message: "Are you sure you want to remove this client from the case? This action cannot be undone.",
  },
  task: {
    title: "Delete Task",
    message: "Are you sure you want to delete this task? This action cannot be undone.",
  },
  hearing: {
    title: "Delete Hearing",
    message: "Are you sure you want to delete this hearing? This action cannot be undone.",
    cascadeWarning: "All associated documents and hearing notes will be permanently removed.",
  },
  document: {
    title: "Delete Document",
    message: "Are you sure you want to delete this document? This action cannot be undone.",
  },
  organization: {
    title: "Delete Organization",
    message: "Are you sure you want to delete this organization? This action cannot be undone.",
    cascadeWarning:
      "All associated sites, users, cases, and organizational data will be permanently removed. This is a critical operation that affects all members of the organization.",
  },
  invoice: {
    title: "Delete Invoice",
    message: "Are you sure you want to delete this invoice? This action cannot be undone.",
  },
  comment: {
    title: "Delete Comment",
    message: "Are you sure you want to delete this comment? This action cannot be undone.",
  },
  reply: {
    title: "Delete Reply",
    message: "Are you sure you want to delete this reply? This action cannot be undone.",
  },
  contributor: {
    title: "Remove Contributor",
    message: "Are you sure you want to remove this contributor from the case? They will lose their granted access.",
  },
};

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  entityType: EntityType;
  entityName?: string;
  customTitle?: string;
  customMessage?: string;
  loading?: boolean;
}

/**
 * DS delete-confirmation dialog — a drop-in replacement for the legacy MUI
 * DeleteConfirmationModal. Same entity copy + cascade warnings, built on the DS
 * Dialog (danger) + Button (danger). Error handling stays in the caller (toast).
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  entityType,
  entityName,
  customTitle,
  customMessage,
  loading = false,
}: ConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const config = ENTITY_CONFIGS[entityType];
  const title = customTitle || config.title;
  const message = customMessage || config.message;
  const cascadeWarning = config.cascadeWarning;
  const isLoading = isDeleting || loading;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      // The caller closes the dialog after a successful delete.
    } catch (error) {
      // Error surfacing (toast) is handled by the caller.
      console.error("Delete operation failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) onClose();
  };

  const isRemove = entityType === "contributor" || entityType === "client";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={title}
      icon={Trash2}
      danger
      small
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button variant="danger" icon={Trash2} loading={isLoading} onClick={handleConfirm}>
            {isRemove ? "Remove" : "Delete"}
          </Button>
        </>
      }
    >
      <p className="lead" style={{ marginBottom: entityName || cascadeWarning ? 16 : 0 }}>{message}</p>

      {entityName && (
        <div
          style={{
            padding: "12px 14px",
            marginBottom: cascadeWarning ? 16 : 0,
            borderRadius: "var(--r-sm)",
            background: "var(--bg)",
            border: "1px solid var(--border)",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-3)", marginBottom: 2 }}>
            {entityType.charAt(0).toUpperCase() + entityType.slice(1)} to {isRemove ? "remove" : "delete"}:
          </div>
          <div style={{ fontWeight: 600, color: "var(--text)" }}>{entityName}</div>
        </div>
      )}

      {cascadeWarning && (
        <div className="form-alert" style={{ marginBottom: 0, background: "var(--warn-soft)", color: "var(--warn-ink)", borderColor: "var(--warn)" }}>
          <TriangleAlert aria-hidden />
          <span>
            <b>Warning: Cascade Delete</b>
            <br />
            {cascadeWarning}
          </span>
        </div>
      )}
    </Dialog>
  );
}
