"use client";

import React, { useEffect, useState } from "react";
import { UserPen, Trash2, TriangleAlert, X } from "lucide-react";
import { Dialog, Button, Field, Input, Textarea, Select } from "@/design-system";
import { updateCaseClient, deleteCaseClient } from "@/app/organization/services/caseapi";
import {
  CaseClient,
  UpdateCaseClientFormData,
  UpdateCaseClientRequest,
  GenderAPIType,
} from "@/app/organization/types/caseindex";
import { useFormValidation } from "@/hooks/useFormValidation";
import { CaseClientSchemas } from "@/utils/caseValidationSchemas";
import { useToast } from "@/contexts/ToastContext";
import { extractApiErrors } from "@/utils/errorHandler";
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal";

interface EditClientModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  organizationId: string;
  siteId: string;
  caseId: string;
  clientData: CaseClient;
  /** When true, shows a Delete Client action. */
  canDelete?: boolean;
  /** Called after the client is deleted (parent closes modal + refreshes list). */
  onDeleteSuccess?: () => Promise<void> | void;
}

export default function EditClientModal({
  open,
  onClose,
  onSuccess,
  organizationId,
  siteId,
  caseId,
  clientData,
  canDelete = false,
  onDeleteSuccess,
}: EditClientModalProps) {
  const [formData, setFormData] = useState<UpdateCaseClientFormData>({
    fullName: "",
    emailId: "",
    phoneNumber: 0,
    gender: "Male",
    remarks: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[] | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { showSuccess, showError } = useToast();

  const {
    errors,
    validate,
    clearFieldError,
    reset: resetErrors,
  } = useFormValidation(CaseClientSchemas.update);

  useEffect(() => {
    if (open && clientData) {
      setFormData({
        fullName: clientData.fullName || "",
        emailId: clientData.emailId || "",
        phoneNumber: clientData.phoneNumber || 0,
        gender:
          clientData.gender === "Transgender"
            ? "Non-Binary"
            : clientData.gender,
        remarks: clientData.remarks || "",
      });
      setApiErrors(null);
      resetErrors();
    }
  }, [open, clientData, resetErrors]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    const nextValue = name === "phoneNumber" ? parseInt(value, 10) || 0 : value;

    setFormData(
      (prev) =>
        ({
          ...prev,
          [name]: nextValue,
        }) as UpdateCaseClientFormData,
    );
    clearFieldError(name);
  };

  const handleSubmit = async () => {
    setApiErrors(null);
    if (!validate(formData)) return;

    setIsSubmitting(true);
    try {
      const payload: UpdateCaseClientRequest = {
        fullName: formData.fullName.trim(),
        gender:
          formData.gender === "Non-Binary"
            ? ("Transgender" as GenderAPIType)
            : (formData.gender as GenderAPIType),
      };

      if (formData.emailId?.trim()) {
        payload.emailId = formData.emailId.trim();
      }

      if (formData.phoneNumber) {
        payload.phoneNumber = formData.phoneNumber;
      }

      if (formData.remarks?.trim()) {
        payload.remarks = formData.remarks.trim();
      }

      await updateCaseClient(
        organizationId,
        siteId,
        caseId,
        clientData.id,
        payload,
      );
      showSuccess("Client updated successfully");
      await onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorMessages = extractApiErrors(err);
      setApiErrors(errorMessages);
      showError(
        errorMessages[0] || "Failed to update client. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCaseClient(organizationId, siteId, caseId, clientData.id);
      showSuccess("Client deleted successfully");
      setDeleteConfirmOpen(false);
      await onDeleteSuccess?.();
      onClose();
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : "Failed to delete client.");
      throw error;
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="Edit Client"
        subtitle="Update client details"
        icon={UserPen}
        footer={
          <>
            {canDelete && (
              <Button
                variant="ghost"
                icon={Trash2}
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={isSubmitting}
                style={{ marginRight: "auto", color: "#dc2626" }}
              >
                Delete Client
              </Button>
            )}
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={isSubmitting}
              onClick={handleSubmit}
            >
              Save Changes
            </Button>
          </>
        }
      >
        {apiErrors && apiErrors.length > 0 && (
          <div className="form-alert" role="alert">
            <TriangleAlert aria-hidden />
            <span>{apiErrors.join(" ")}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setApiErrors(null)}
              style={{
                marginLeft: "auto",
                display: "inline-flex",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                padding: 0,
              }}
            >
              <X width={16} height={16} aria-hidden />
            </button>
          </div>
        )}

        <div className="form-2col">
          <Field
            label="Full Name"
            required
            error={!!errors.fullName}
            hint={errors.fullName || undefined}
          >
            <Input
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter full name"
            />
          </Field>

          <Field
            label="Email (Gmail)"
            error={!!errors.emailId}
            hint={errors.emailId || undefined}
          >
            <Input
              name="emailId"
              value={formData.emailId}
              onChange={handleChange}
              placeholder="Enter email address"
            />
          </Field>
        </div>

        <div className="form-2col">
          <Field
            label="Phone Number"
            error={!!errors.phoneNumber}
            hint={errors.phoneNumber || undefined}
          >
            <Input
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber || ""}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </Field>

          <Field
            label="Gender"
            required
            error={!!errors.gender}
            hint={errors.gender || undefined}
          >
            <Select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="" disabled>
                Select gender
              </option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-Binary">Non-Binary</option>
            </Select>
          </Field>
        </div>

        <Field
          label="Remarks"
          full
          error={!!errors.remarks}
          hint={errors.remarks || undefined}
        >
          <Textarea
            name="remarks"
            rows={3}
            value={formData.remarks}
            onChange={handleChange}
            placeholder="Enter remarks"
          />
        </Field>
      </Dialog>

      {canDelete && (
        <DeleteConfirmationModal
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          entityType="client"
          entityName={clientData.fullName}
        />
      )}
    </>
  );
}
