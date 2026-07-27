"use client";

import React, { useEffect, useState } from "react";
import { Building2, Info, CircleCheck } from "lucide-react";
import { Dialog, Button, Field, Input, Textarea, Spinner } from "@/design-system";
import { createSite, checkSiteKeyAvailability } from "@/app/organization/services/api";
import { useFormValidation } from "@/hooks/useFormValidation";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { useToast } from "@/contexts/ToastContext";
import {
  required, generalEmail, phone, maxLength, pattern,
  extractApiErrors, extractFieldErrors, ValidationPatterns,
} from "@/utils";

interface AddSiteDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationId: string;
}

interface AddressData {
  fullAddress: string;
  locality: string;
  district: string;
  state: string;
  pincode: string;
}

const emptyForm = {
  name: "", siteKey: "", emailId: "", phoneNumber: "", address: "",
  locality: "", district: "", state: "", pincode: "", landmark: "", description: "",
};

/**
 * DS "Add branch" dialog. Presentation only — reuses the exact validation schema,
 * siteKey-availability check, address autocomplete, and createSite call from the
 * legacy AddSiteModal so behavior is preserved.
 */
export default function AddSiteDialog({ open, onClose, onSuccess, organizationId }: AddSiteDialogProps) {
  const [formData, setFormData] = useState({ ...emptyForm });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[] | null>(null);
  const [siteKeyStatus, setSiteKeyStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const { showSuccess, showError } = useToast();

  const validationSchema = {
    name: { rules: [required("Site name"), maxLength("Site name", 100)] },
    siteKey: { rules: [required("Site key"), maxLength("Site key", 5)] },
    emailId: { rules: [required("Email"), generalEmail(), maxLength("Email", 254)] },
    phoneNumber: { rules: [required("Phone number"), phone()] },
    address: { rules: [required("Address"), maxLength("Address", 200)] },
    locality: { rules: [required("Locality"), maxLength("Locality", 100)] },
    district: { rules: [required("District"), maxLength("District", 100)] },
    state: { rules: [required("State"), maxLength("State", 100)] },
    pincode: { rules: [required("Pincode"), pattern("Pincode", ValidationPatterns.pincode, "Please enter a valid 6-digit pincode")] },
    landmark: { rules: [required("Landmark"), maxLength("Landmark", 100)] },
    description: { rules: [required("Description"), maxLength("Description", 500)] },
  };

  const { errors, validate, clearFieldError, setErrors: setValidationErrors, reset: resetForm } =
    useFormValidation(validationSchema);

  useEffect(() => {
    if (open) {
      setFormData({ ...emptyForm });
      setApiErrors(null);
      setSiteKeyStatus("idle");
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const key = formData.siteKey?.trim();
    if (!key || !organizationId) {
      setSiteKeyStatus("idle");
      return;
    }
    setSiteKeyStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const isAvailable = await checkSiteKeyAvailability(organizationId, key);
        setSiteKeyStatus(isAvailable ? "available" : "unavailable");
      } catch {
        setSiteKeyStatus("idle");
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.siteKey, organizationId]);

  const set = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handleAddressSelect = (a: AddressData) => {
    setFormData((prev) => ({ ...prev, address: a.fullAddress, locality: a.locality, district: a.district, state: a.state, pincode: a.pincode }));
    ["address", "locality", "district", "state", "pincode"].forEach(clearFieldError);
  };

  const handleSubmit = async () => {
    setApiErrors(null);
    if (!validate(formData)) return;
    if (siteKeyStatus === "unavailable") {
      setValidationErrors({ siteKey: "This site key is already taken" });
      return;
    }
    if (siteKeyStatus === "checking" || siteKeyStatus === "idle") {
      setValidationErrors({ siteKey: "Please wait while we check key availability" });
      return;
    }
    setIsSubmitting(true);
    try {
      await createSite(organizationId, { ...formData, enabled: true });
      showSuccess("Site created successfully");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const msgs = extractApiErrors(error);
      setApiErrors(msgs);
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) setValidationErrors(fieldErrors);
      else showError(msgs[0] || "Failed to create site");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add site"
      subtitle="Create a new office in your organization"
      icon={Building2}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" loading={isSubmitting} onClick={handleSubmit}>Create site</Button>
        </>
      }
    >
      {apiErrors && apiErrors.length > 0 && (
        <div className="form-alert" style={{ marginBottom: 16 }}>
          <Info aria-hidden /> {apiErrors.join(" ")}
        </div>
      )}
      <div className="form-2col">
        <Field label="Site name" required error={!!errors.name} hint={errors.name} full>
          <Input value={formData.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Chennai" />
        </Field>
        <Field
          label="Site key"
          required
          error={!!errors.siteKey || siteKeyStatus === "unavailable"}
          hint={
            errors.siteKey ||
            (siteKeyStatus === "unavailable" ? "This site key is already taken"
              : siteKeyStatus === "available" ? "Available — cannot be changed after creation"
              : "Used to number cases (max 5 chars)")
          }
        >
          <div style={{ position: "relative" }}>
            <Input value={formData.siteKey} maxLength={5} onChange={(e) => set("siteKey", e.target.value)} placeholder="Max 5 characters" />
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
              {siteKeyStatus === "checking" ? <Spinner size="sm" /> : siteKeyStatus === "available" ? <CircleCheck aria-hidden style={{ width: 16, height: 16, color: "var(--ok)" }} /> : null}
            </span>
          </div>
        </Field>
        <Field label="Email" required error={!!errors.emailId} hint={errors.emailId}>
          <Input type="email" value={formData.emailId} onChange={(e) => set("emailId", e.target.value)} placeholder="branch@firm.in" />
        </Field>
        <Field label="Phone" required error={!!errors.phoneNumber} hint={errors.phoneNumber}>
          <Input value={formData.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} placeholder="+91 …" />
        </Field>
        <Field label="Address" required error={!!errors.address} hint={errors.address} full>
          <AddressAutocomplete
            value={formData.address}
            onChange={(value: string) => set("address", value)}
            onPlaceSelect={handleAddressSelect}
            placeholder="Search for an address"
            error={errors.address}
          />
        </Field>
        <Field label="Locality" required error={!!errors.locality} hint={errors.locality}>
          <Input value={formData.locality} onChange={(e) => set("locality", e.target.value)} />
        </Field>
        <Field label="District" required error={!!errors.district} hint={errors.district}>
          <Input value={formData.district} onChange={(e) => set("district", e.target.value)} />
        </Field>
        <Field label="State" required error={!!errors.state} hint={errors.state}>
          <Input value={formData.state} onChange={(e) => set("state", e.target.value)} />
        </Field>
        <Field label="Pincode" required error={!!errors.pincode} hint={errors.pincode}>
          <Input value={formData.pincode} onChange={(e) => set("pincode", e.target.value)} />
        </Field>
        <Field label="Landmark" required error={!!errors.landmark} hint={errors.landmark} full>
          <Input value={formData.landmark} onChange={(e) => set("landmark", e.target.value)} placeholder="Nearby landmark" />
        </Field>
        <Field label="Description" required error={!!errors.description} hint={errors.description} full>
          <Textarea value={formData.description} onChange={(e) => set("description", e.target.value)} placeholder="Short description of this site" />
        </Field>
      </div>
    </Dialog>
  );
}
