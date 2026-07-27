"use client";

import React, { useState, useEffect } from "react";
import { UserCog, Trash2, Info } from "lucide-react";
import { Dialog, Button, Field, Input, Select, LoadingState } from "@/design-system";
import {
  updateUser, fetchUser, updateSiteUser, fetchSiteUser, deleteOrganizationUser, deleteSiteUser,
} from "@/app/organization/services/api";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useToast } from "@/contexts/ToastContext";
import { required, email, phone, maxLength, extractApiErrors, extractFieldErrors, getRoleLabel } from "@/utils";

interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationId: string;
  userId: string;
  siteId?: string | null;
  isSiteMode: boolean;
  userSiteId?: string | null;
  isOrgMode?: boolean;
  siteName?: string;
  canDelete?: boolean;
  userName?: string;
  onDeleteSuccess?: () => void;
}

interface FormData extends Record<string, unknown> {
  fullName: string;
  emailId: string;
  phoneNumber: string;
  gender: string;
  roles: string[];
}

const validationSchema = {
  fullName: { rules: [required("Full name"), maxLength("Full name", 100)] },
  emailId: { rules: [required("Email"), email(), maxLength("Email", 254)] },
  phoneNumber: { rules: [required("Phone number"), phone()] },
  gender: { rules: [required("Gender")] },
};

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

/**
 * DS "Edit user" dialog. Presentation only — reuses the legacy EditUserModal
 * logic: effective org/site resolution from the target's siteId, fetch, gender
 * Transgender↔Non-Binary display transform + org-role space-strip, update, and
 * delete (own DS confirm). Email + Role stay disabled as before.
 */
export default function EditUserDialog({
  open, onClose, onSuccess, organizationId, userId, siteId, isSiteMode,
  userSiteId, isOrgMode = false, siteName, canDelete = false, userName, onDeleteSuccess,
}: EditUserDialogProps) {
  const isUnsetSiteId = !userSiteId || userSiteId === EMPTY_GUID;
  const effectiveSiteId = !isUnsetSiteId ? userSiteId : (isSiteMode && siteId ? siteId : null);
  const effectiveIsSiteMode = effectiveSiteId !== null;

  const [formData, setFormData] = useState<FormData>({ fullName: "", emailId: "", phoneNumber: "", gender: "Male", roles: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[] | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { showSuccess, showError } = useToast();
  const { errors, validate, validateSingleField, clearFieldError, setErrors: setValidationErrors, reset: resetForm } =
    useFormValidation(validationSchema);

  const siteDisplayName = siteName || (!effectiveIsSiteMode ? "Head Office" : "");

  useEffect(() => {
    if (!open || !userId) return;
    setIsLoading(true);
    setApiErrors(null);
    resetForm();
    (async () => {
      try {
        const user = effectiveIsSiteMode && effectiveSiteId
          ? await fetchSiteUser(organizationId, effectiveSiteId, userId)
          : await fetchUser(organizationId, userId);
        if (!user) throw new Error("User not found");
        const genderForDisplay = user.gender === "Transgender" ? "Non-Binary" : user.gender;
        setFormData({
          fullName: user.fullName || "",
          emailId: user.emailId || "",
          phoneNumber: user.phoneNumber?.toString() || "",
          gender: genderForDisplay || "Male",
          roles: user.roles || [],
        });
      } catch (error: unknown) {
        setApiErrors([(error as { response?: { data?: { errors?: string[] } } }).response?.data?.errors?.[0] || "Failed to load user data"]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [open, userId, effectiveIsSiteMode, effectiveSiteId, organizationId, resetForm]);

  const set = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };
  const validateOnBlur = (name: string) => () => validateSingleField(name, formData[name]);

  const handleSubmit = async () => {
    setApiErrors(null);
    if (!validate(formData)) return;
    setIsSubmitting(true);
    try {
      const genderForApi = formData.gender === "Non-Binary" ? "Transgender" : formData.gender;
      const userData = {
        fullName: formData.fullName, emailId: formData.emailId, phoneNumber: formData.phoneNumber,
        gender: genderForApi || undefined, roles: formData.roles.map((r) => r.replace(/\s+/g, "")),
      };
      if (effectiveIsSiteMode && effectiveSiteId) await updateSiteUser(organizationId, effectiveSiteId, userId, userData);
      else await updateUser(organizationId, userId, userData);
      showSuccess("User updated successfully");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      setApiErrors(extractApiErrors(error));
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) setValidationErrors(fieldErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (effectiveIsSiteMode && effectiveSiteId) await deleteSiteUser(organizationId, effectiveSiteId, userId);
      else await deleteOrganizationUser(organizationId, userId);
      showSuccess("User deleted successfully");
      setDeleteConfirmOpen(false);
      onDeleteSuccess?.();
      onClose();
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : "Failed to delete user.");
    } finally {
      setDeleting(false);
    }
  };

  const currentRoleLabel = formData.roles[0] ? getRoleLabel(formData.roles[0]) : "";

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="Edit user"
        subtitle="Update user account details"
        icon={UserCog}
        small
        footer={
          <>
            {canDelete && (
              <Button variant="ghost" icon={Trash2} onClick={() => setDeleteConfirmOpen(true)} disabled={isSubmitting || isLoading} style={{ marginRight: "auto", color: "var(--danger)" }}>
                Delete user
              </Button>
            )}
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button variant="primary" loading={isSubmitting} disabled={isSubmitting || isLoading} onClick={handleSubmit}>Update user</Button>
          </>
        }
      >
        {isLoading ? (
          <LoadingState message="Loading user…" />
        ) : (
          <>
            {apiErrors && apiErrors.length > 0 && (
              <div className="form-alert" style={{ marginBottom: 16 }}><Info aria-hidden /> {apiErrors.join(" ")}</div>
            )}
            <Field label="Full name" required error={!!errors.fullName} hint={errors.fullName}>
              <Input value={formData.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Enter full name" />
            </Field>
            <div className="form-2col">
              <Field label="Email (Gmail)" required>
                <Input type="email" value={formData.emailId} disabled />
              </Field>
              <Field label="Phone" required error={!!errors.phoneNumber} hint={errors.phoneNumber}>
                <Input value={formData.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} onBlur={validateOnBlur("phoneNumber")} placeholder="10-digit mobile number" />
              </Field>
            </div>
            <Field label="Gender" required error={!!errors.gender} hint={errors.gender}>
              <Select value={formData.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
              </Select>
            </Field>
            <div className="form-2col">
              {isOrgMode && (
                <Field label="Site">
                  <Input value={siteDisplayName} disabled />
                </Field>
              )}
              <Field label="Role">
                <Input value={currentRoleLabel} disabled />
              </Field>
            </div>
          </>
        )}
      </Dialog>

      {canDelete && (
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          title="Delete user"
          subtitle="This action cannot be undone"
          icon={Trash2}
          danger
          small
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>Cancel</Button>
              <Button variant="danger" loading={deleting} onClick={handleConfirmDelete}>Delete user</Button>
            </>
          }
        >
          <p className="lead">
            Are you sure you want to delete <b>{userName || formData.fullName || "this user"}</b>? This action cannot be undone.
          </p>
        </Dialog>
      )}
    </>
  );
}
