"use client";

import React, { useEffect, useState } from "react";
import { Building2, Info } from "lucide-react";
import { Dialog, Button, Field, Input, Textarea } from "@/design-system";
import { updateSite } from "@/app/organization/services/api";
import { Site } from "@/app/organization/types";
import { useFormValidation } from "@/hooks/useFormValidation";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { useToast } from "@/contexts/ToastContext";
import {
  required, generalEmail, phone, maxLength, pattern,
  extractApiErrors, extractFieldErrors, ValidationPatterns,
} from "@/utils";

interface EditSiteDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationId: string;
  site: Site;
}

interface AddressData {
  fullAddress: string;
  locality: string;
  district: string;
  state: string;
  pincode: string;
}

const emptyForm = {
  name: "", emailId: "", phoneNumber: "", address: "",
  locality: "", district: "", state: "", pincode: "", landmark: "", description: "",
};

/**
 * DS "Edit branch" dialog. Presentation only — mirrors AddSiteDialog (minus the
 * immutable site key) and reuses the exact validation schema, address
 * autocomplete, and updateSite call from the legacy EditSiteModal so behavior is
 * preserved.
 */
export default function EditSiteDialog({ open, onClose, onSuccess, organizationId, site }: EditSiteDialogProps) {
  const [formData, setFormData] = useState({ ...emptyForm });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[] | null>(null);
  const { showSuccess, showError } = useToast();

  const validationSchema = {
    name: { rules: [required("Site name"), maxLength("Site name", 100)] },
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

  const { errors, validate, clearFieldError, setErrors: setValidationErrors, reset: resetErrors } =
    useFormValidation(validationSchema);

  // Pre-populate when the dialog opens.
  useEffect(() => {
    if (open && site) {
      setFormData({
        name: site.name || "",
        emailId: site.emailId || "",
        phoneNumber: site.phoneNumber !== undefined ? String(site.phoneNumber) : "",
        address: site.address || "",
        locality: site.locality || "",
        district: site.district || "",
        state: site.state || "",
        pincode: site.pincode || "",
        landmark: site.landmark || "",
        description: site.description || "",
      });
      setApiErrors(null);
      resetErrors();
    }
  }, [open, site, resetErrors]);

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
    setIsSubmitting(true);
    try {
      await updateSite(organizationId, site.id, {
        name: formData.name,
        emailId: formData.emailId || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        address: formData.address,
        locality: formData.locality || undefined,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
        landmark: formData.landmark,
        description: formData.description,
      });
      showSuccess("Site updated successfully");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const msgs = extractApiErrors(error);
      setApiErrors(msgs);
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) setValidationErrors(fieldErrors);
      else showError(msgs[0] || "Failed to update site");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Edit site"
      subtitle="Update this office's details"
      icon={Building2}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" loading={isSubmitting} onClick={handleSubmit}>Update site</Button>
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
          <Input value={formData.locality} onChange={(e) => set("locality", e.target.value)} placeholder="e.g. Bengaluru" />
        </Field>
        <Field label="District" required error={!!errors.district} hint={errors.district}>
          <Input value={formData.district} onChange={(e) => set("district", e.target.value)} placeholder="e.g. Bengaluru Urban" />
        </Field>
        <Field label="State" required error={!!errors.state} hint={errors.state}>
          <Input value={formData.state} onChange={(e) => set("state", e.target.value)} placeholder="e.g. Karnataka" />
        </Field>
        <Field label="Pincode" required error={!!errors.pincode} hint={errors.pincode}>
          <Input value={formData.pincode} onChange={(e) => set("pincode", e.target.value)} placeholder="e.g. 560034" />
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
