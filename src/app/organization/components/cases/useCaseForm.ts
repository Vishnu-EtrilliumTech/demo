"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchOrganizationSites,
  fetchSiteUsers,
  createCase,
  updateCase,
} from "@/app/organization/services/api";
import { Site, User, Case, CaseStatus } from "@/app/organization/types";
import { ContributorAccessLevel } from "@/app/organization/types/caseindex";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useToast } from "@/contexts/ToastContext";
import { required, maxLength, extractApiErrors, extractFieldErrors } from "@/utils";

export interface CaseFormSeed {
  id: string;
  title?: string;
  caseNumber?: string;
  cnrNumber?: string;
  caseKey?: string;
  status?: CaseStatus;
  description?: string;
  assignedToId?: string;
  // Frontend-only preview fields (e.g. pre-filled from an eCourts record).
  court?: string;
  courtLocation?: string;
  petitioner?: string;
  respondent?: string;
  caseType?: string;
}

export interface UseCaseFormOptions {
  organizationId: string;
  mode: "create" | "edit";
  /** Create: whether the branch (site) picker is shown (org-level login). */
  isOrgMode: boolean;
  /** Fixed site for site-level create and for edit. */
  siteId?: string | null;
  /** Edit prefill (also supplies the caseId). */
  seed?: CaseFormSeed;
  onDone: (result?: Case) => void;
}

/** Frontend-only draft of a case contributor (private-access add list). */
export interface ContributorDraft {
  userId: string;
  accessLevel: ContributorAccessLevel;
}

/** Who a public case is visible to (frontend-only preview). */
export type AccessScope = "org" | "site";

/** Which party the client stands as, in manual entry (frontend-only preview). */
export type ClientRole = "" | "petitioner" | "respondent";

export interface CaseFormValues {
  title: string;
  caseNumber: string;
  cnrNumber: string;
  description: string;
  branchId: string;
  assignedToId: string;
  status: CaseStatus;
  // --- Frontend-only fields (not yet persisted; mock/preview) ---
  /** Public cases are viewable/editable by all users; only granted users delete. */
  isPublic: boolean;
  /** For a public case: whether it is visible org-wide or only within the site. */
  accessScope: AccessScope;
  /** For a private case: members granted access (optional). */
  contributors: ContributorDraft[];
  /** Identity fallback when neither title nor case number is supplied. */
  clientPhone: string;
  /** Manual entry only: the client's name. */
  clientName: string;
  /** Manual entry only: whether the client is the petitioner or respondent. */
  clientRole: ClientRole;
  /** True while the dialog is in manual-entry mode (vs. eCourts import). */
  isManual: boolean;
  court: string;
  courtLocation: string;
  petitioner: string;
  respondent: string;
  caseType: string;
}

const EMPTY: CaseFormValues = {
  title: "",
  caseNumber: "",
  cnrNumber: "",
  description: "",
  branchId: "",
  assignedToId: "",
  status: CaseStatus.Open,
  isPublic: true,
  accessScope: "site",
  contributors: [],
  clientPhone: "",
  clientName: "",
  clientRole: "",
  isManual: false,
  court: "",
  courtLocation: "",
  petitioner: "",
  respondent: "",
  caseType: "",
};

/**
 * Shared create/edit case form logic — the reconciliation of the three legacy
 * shapes (AddCaseModal, the /cases/new page, the /edit page) into one contract.
 * Only fields the API persists are handled (title, caseNumber, cnrNumber,
 * description, branch, assignee, and status on edit); it wires the exact
 * createCase/updateCase calls and preserves the `ecourts-quota-refresh` event.
 */
export function useCaseForm({ organizationId, mode, isOrgMode, siteId, seed, onDone }: UseCaseFormOptions) {
  const { showSuccess } = useToast();
  const needsBranchPicker = mode === "create" && isOrgMode;

  // Single source of truth for a blank/seeded form, shared by the initial state
  // and resetForm so a dialog that reopens re-applies the seed (not just EMPTY).
  const buildInitial = useCallback(
    (): CaseFormValues => ({
      ...EMPTY,
      title: seed?.title ?? "",
      caseNumber: seed?.caseNumber ?? "",
      cnrNumber: seed?.cnrNumber ?? "",
      description: seed?.description ?? "",
      status: seed?.status ?? CaseStatus.Open,
      assignedToId: seed?.assignedToId ? String(seed.assignedToId) : "",
      branchId: !needsBranchPicker && siteId ? String(siteId) : "",
      court: seed?.court ?? "",
      courtLocation: seed?.courtLocation ?? "",
      petitioner: seed?.petitioner ?? "",
      respondent: seed?.respondent ?? "",
      caseType: seed?.caseType ?? "",
    }),
    [seed, needsBranchPicker, siteId],
  );

  const [values, setValues] = useState<CaseFormValues>(buildInitial);

  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Only the site (in org-admin create) stays mandatory. In create mode the
  // title/case-number/client-phone "identity" rule is enforced in submit(),
  // and the assignee is optional. Edit mode keeps its stricter contract.
  const schema = useMemo(
    () => ({
      title: { rules: mode === "edit" ? [required("Title"), maxLength("Title", 200)] : [maxLength("Title", 200)] },
      caseNumber: { rules: [maxLength("Case number", 100)] },
      cnrNumber: { rules: [maxLength("CNR number", 100)] },
      ...(needsBranchPicker ? { branchId: { rules: [required("Site")] } } : {}),
      ...(mode === "edit"
        ? { assignedToId: { rules: [required("Assigned to")] }, status: { rules: [required("Status")] } }
        : {}),
    }),
    [needsBranchPicker, mode],
  );

  const { errors, validate, clearFieldError, setErrors, reset: resetValidation } = useFormValidation(schema);

  const setField = useCallback(
    <K extends keyof CaseFormValues>(key: K, value: CaseFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      clearFieldError(key as string);
      // The identity rule spans title / caseNumber / clientPhone / clientName —
      // editing any of them clears the shared error.
      if (key === "title" || key === "caseNumber" || key === "clientPhone" || key === "clientName") {
        clearFieldError("identity");
      }
      // Changing the client name/phone re-opens the manual party requirement,
      // so drop any stale role error when either is edited.
      if (key === "clientName" || key === "clientPhone" || key === "clientRole") {
        clearFieldError("clientRole");
      }
    },
    [clearFieldError],
  );

  // Resets to a blank form — used by dialogs that stay mounted across
  // open/close cycles (e.g. QuickAddCaseDialog) so stale input doesn't
  // survive a close-without-submit and reappear on reopen.
  const resetForm = useCallback(() => {
    setValues(buildInitial());
    resetValidation();
    setApiError(null);
  }, [buildInitial, resetValidation]);

  // Branch options (org-level create).
  useEffect(() => {
    if (!needsBranchPicker) return;
    setLoadingSites(true);
    fetchOrganizationSites(organizationId)
      .then((page) => setSites(page.items))
      .catch(() => setSites([]))
      .finally(() => setLoadingSites(false));
  }, [needsBranchPicker, organizationId]);

  // Assignee options. Fixed-site (site create / edit) loads once; branch-picker
  // reloads when the branch changes (resetting the assignee, mirroring legacy).
  const activeSiteId = needsBranchPicker ? values.branchId : siteId ? String(siteId) : "";
  useEffect(() => {
    if (!activeSiteId) {
      setUsers([]);
      return;
    }
    let cancelled = false;
    setLoadingUsers(true);
    fetchSiteUsers(organizationId, activeSiteId)
      .then((page) => {
        if (!cancelled) setUsers(page.items);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeSiteId, organizationId]);

  // When the branch changes in create mode, clear the stale assignee.
  const [lastBranch, setLastBranch] = useState(values.branchId);
  useEffect(() => {
    if (needsBranchPicker && values.branchId !== lastBranch) {
      setLastBranch(values.branchId);
      setValues((prev) => ({ ...prev, assignedToId: "" }));
    }
  }, [needsBranchPicker, values.branchId, lastBranch]);

  const submit = useCallback(async () => {
    const check: Record<string, unknown> = {
      title: values.title,
      caseNumber: values.caseNumber,
      cnrNumber: values.cnrNumber,
      assignedToId: values.assignedToId,
      ...(needsBranchPicker ? { branchId: values.branchId } : {}),
      ...(mode === "edit" ? { status: values.status } : {}),
    };
    if (!validate(check)) return;

    // Identity rule (create): a case needs at least one of title, case number,
    // client phone, or — in manual entry — a client name. Not all can be blank.
    if (mode === "create") {
      const hasIdentity = !!(
        values.title.trim() ||
        values.caseNumber.trim() ||
        values.clientPhone.trim() ||
        (values.isManual && values.clientName.trim())
      );
      if (!hasIdentity) {
        setErrors({ identity: "Enter a case title, case number, or client phone number." });
        return;
      }

      // Manual entry: once a client is named (or a phone given), the client
      // type is mandatory. The opposing party stays optional (frontend-only).
      if (values.isManual && (values.clientName.trim() || values.clientPhone.trim()) && !values.clientRole) {
        setErrors({ clientRole: "Select the client type (petitioner or respondent)." });
        return;
      }
    }

    const resolvedSiteId = needsBranchPicker ? values.branchId : String(siteId ?? "");
    if (!resolvedSiteId) {
      setApiError("A site is required to create a case.");
      return;
    }

    // Fall back through title → case number → client name → client phone so the
    // matter always gets a non-empty title.
    const resolvedTitle =
      values.title.trim() || values.caseNumber.trim() || values.clientName.trim() || values.clientPhone.trim();

    setSubmitting(true);
    setApiError(null);
    try {
      if (mode === "create") {
        // NOTE: the new preview fields (isPublic, clientPhone, court,
        // courtLocation, petitioner, respondent, caseType) are intentionally
        // NOT sent to the backend yet — frontend-only for now.
        const created = await createCase(organizationId, resolvedSiteId, {
          title: resolvedTitle,
          caseNumber: values.caseNumber.trim(),
          cnrNumber: values.cnrNumber.trim(),
          description: values.description.trim() || undefined,
          assignedToId: values.assignedToId,
        });
        showSuccess("Case created successfully");
        window.dispatchEvent(new CustomEvent("ecourts-quota-refresh"));
        onDone(created);
      } else {
        await updateCase(organizationId, String(siteId ?? ""), String(seed?.id ?? ""), {
          title: values.title.trim(),
          caseNumber: values.caseNumber.trim(),
          cnrNumber: values.cnrNumber.trim(),
          status: values.status,
          assignedToId: values.assignedToId,
          description: values.description.trim() || undefined,
        });
        showSuccess("Case updated successfully");
        window.dispatchEvent(new CustomEvent("ecourts-quota-refresh"));
        onDone();
      }
    } catch (err) {
      const fieldErrors = extractFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        const messages = extractApiErrors(err);
        setApiError(messages.length > 0 ? messages.join(" ") : `Failed to ${mode} case. Please try again.`);
      }
    } finally {
      setSubmitting(false);
    }
  }, [values, needsBranchPicker, mode, siteId, organizationId, seed, validate, setErrors, showSuccess, onDone]);

  return {
    values,
    setField,
    errors,
    apiError,
    setApiError,
    submitting,
    sites,
    users,
    loadingSites,
    loadingUsers,
    needsBranchPicker,
    submit,
    resetForm,
  };
}
