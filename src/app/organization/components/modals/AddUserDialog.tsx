"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { UserPlus, Info } from "lucide-react";
import { Dialog, Button, Field, Input, Select } from "@/design-system";
import { createUser, createSiteUser, fetchOrganizationSites } from "@/app/organization/services/api";
import { Site } from "@/app/organization/types";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useToast } from "@/contexts/ToastContext";
import { required, email, phone, maxLength, extractApiErrors, extractFieldErrors } from "@/utils";

interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationId: string;
  isOrgMode: boolean;
  siteId?: string | null;
  canCreateAdmin: boolean;
  canCreateClerk: boolean;
  hideHeadOffice?: boolean;
}

interface FormData extends Record<string, unknown> {
  fullName: string;
  emailId: string;
  phoneNumber: string;
  gender: string;
  selectedSiteId: string;
  roles: string[];
}

const HQ_ID = "__hq__";
const ORG_ROLES = [
  { value: "Organization Admin", label: "Organization Admin" },
  { value: "Organization Clerk", label: "Organization Clerk" },
];
const SITE_ROLES = [
  { value: "SiteAdmin", label: "Site Admin" },
  { value: "SiteClerk", label: "Site Clerk" },
  { value: "SiteLegalExpert", label: "Legal Expert" },
  { value: "SiteSrLegalExpert", label: "Senior Legal Expert" },
];
const emptyForm: FormData = { fullName: "", emailId: "", phoneNumber: "", gender: "", selectedSiteId: HQ_ID, roles: [] };

/**
 * DS "Add user" dialog. Presentation only — reuses the legacy AddUserModal logic:
 * dual org/site role options, site fetch, gender Non-Binary→Transgender + org-role
 * space-strip transforms, createUser / createSiteUser.
 */
export default function AddUserDialog({
  open, onClose, onSuccess, organizationId, isOrgMode, siteId, canCreateAdmin, canCreateClerk, hideHeadOffice = false,
}: AddUserDialogProps) {
  const [formData, setFormData] = useState<FormData>({ ...emptyForm });
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoadingSites, setIsLoadingSites] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[] | null>(null);
  const { showSuccess } = useToast();

  const validationSchema = useMemo(() => ({
    fullName: { rules: [required("Full name"), maxLength("Full name", 100)] },
    emailId: { rules: [required("Email"), email(), maxLength("Email", 254)] },
    phoneNumber: { rules: [required("Phone number"), phone()] },
    gender: { rules: [required("Gender")] },
    roles: { rules: [required("Role")] },
    ...(isOrgMode ? { selectedSiteId: { rules: [required("Site")] } } : {}),
  }), [isOrgMode]);

  const { errors, validate, validateSingleField, clearFieldError, setErrors: setValidationErrors, reset: resetForm } =
    useFormValidation(validationSchema);

  const isHQSelected = formData.selectedSiteId === HQ_ID;
  const availableRoles = isOrgMode
    ? isHQSelected ? ORG_ROLES : SITE_ROLES
    : SITE_ROLES.filter((r) => {
        if (r.value === "SiteAdmin") return canCreateAdmin;
        if (r.value === "SiteClerk") return canCreateClerk;
        return true;
      });

  const isMounted = useRef(false);

  useEffect(() => {
    if (!open) return;
    isMounted.current = false;
    setFormData({ ...emptyForm, selectedSiteId: hideHeadOffice ? "" : HQ_ID });
    setSites([]);
    setApiErrors(null);
    resetForm();
    if (isOrgMode) {
      setIsLoadingSites(true);
      fetchOrganizationSites(organizationId)
        .then((page) => setSites(page.items))
        .catch(() => setSites([]))
        .finally(() => setIsLoadingSites(false));
    }
  }, [open, hideHeadOffice, isOrgMode, organizationId, resetForm]);

  useEffect(() => {
    if (!isOrgMode) return;
    if (!isMounted.current) { isMounted.current = true; return; }
    setFormData((prev) => ({ ...prev, roles: [] }));
    clearFieldError("roles");
  }, [formData.selectedSiteId, isOrgMode, clearFieldError]);

  const set = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };
  const validateOnBlur = (name: string) => () => validateSingleField(name, formData[name]);
  const setSiteId = (value: string) => {
    setFormData((prev) => ({ ...prev, selectedSiteId: value, roles: [] }));
    clearFieldError("selectedSiteId");
    clearFieldError("roles");
  };
  const setRole = (value: string) => {
    setFormData((prev) => ({ ...prev, roles: value ? [value] : [] }));
    clearFieldError("roles");
  };

  const handleSubmit = async () => {
    setApiErrors(null);
    if (!validate(formData)) return;
    if (!isOrgMode && !siteId) {
      setApiErrors(["Site information is still loading. Please wait a moment and try again."]);
      return;
    }
    setIsSubmitting(true);
    try {
      const genderForApi = formData.gender === "Non-Binary" ? "Transgender" : formData.gender;
      const selectedRole = formData.roles[0];
      const isOrgRole = selectedRole === "Organization Admin" || selectedRole === "Organization Clerk";
      if (isOrgMode && isOrgRole) {
        await createUser(organizationId, {
          fullName: formData.fullName, emailId: formData.emailId, phoneNumber: formData.phoneNumber,
          gender: genderForApi, roles: formData.roles.map((r) => r.replace(/\s+/g, "")),
        });
      } else {
        const targetSiteId = isOrgMode ? formData.selectedSiteId : (siteId ?? "");
        await createSiteUser(organizationId, targetSiteId, {
          fullName: formData.fullName, emailId: formData.emailId, phoneNumber: formData.phoneNumber,
          gender: genderForApi, roles: formData.roles,
        });
      }
      showSuccess("User created successfully");
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add user"
      subtitle="Create a new user account"
      icon={UserPlus}
      small
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" loading={isSubmitting} disabled={isSubmitting || isLoadingSites} onClick={handleSubmit}>Add user</Button>
        </>
      }
    >
      {apiErrors && apiErrors.length > 0 && (
        <div className="form-alert" style={{ marginBottom: 16 }}><Info aria-hidden /> {apiErrors.join(" ")}</div>
      )}
      <Field label="Full name" required error={!!errors.fullName} hint={errors.fullName}>
        <Input value={formData.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Enter full name" />
      </Field>
      <div className="form-2col">
        <Field label="Email (Gmail)" required error={!!errors.emailId} hint={errors.emailId}>
          <Input type="email" value={formData.emailId} onChange={(e) => set("emailId", e.target.value)} onBlur={validateOnBlur("emailId")} placeholder="Enter email address" />
        </Field>
        <Field label="Phone" required error={!!errors.phoneNumber} hint={errors.phoneNumber}>
          <Input value={formData.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} onBlur={validateOnBlur("phoneNumber")} placeholder="10-digit mobile number" />
        </Field>
      </div>
      <Field label="Gender" required error={!!errors.gender} hint={errors.gender}>
        <Select value={formData.gender} onChange={(e) => set("gender", e.target.value)}>
          <option value="" disabled>Select gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Non-Binary">Non-Binary</option>
        </Select>
      </Field>
      {isOrgMode ? (
        <div className="form-2col">
          <Field label="Site" required error={!!errors.selectedSiteId} hint={errors.selectedSiteId}>
            <Select value={formData.selectedSiteId} disabled={isLoadingSites} onChange={(e) => setSiteId(e.target.value)}>
              {hideHeadOffice
                ? <option value="" disabled>Select site</option>
                : <option value={HQ_ID}>{isLoadingSites ? "Loading…" : "Head Office"}</option>}
              {sites.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Role" required error={!!errors.roles} hint={errors.roles}>
            <Select value={formData.roles[0] || ""} onChange={(e) => setRole(e.target.value)}>
              <option value="" disabled>Select role</option>
              {availableRoles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
          </Field>
        </div>
      ) : (
        <Field label="Role" required error={!!errors.roles} hint={errors.roles}>
          <Select value={formData.roles[0] || ""} onChange={(e) => setRole(e.target.value)}>
            <option value="" disabled>Select role</option>
            {availableRoles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
        </Field>
      )}
    </Dialog>
  );
}
