"use client";

import { useRouter } from "next/navigation";
import { FolderPlus, FilePenLine, FileText, Landmark, X, Check, TriangleAlert } from "lucide-react";
import { LuiRoot, Button } from "@/design-system";
import type { Case } from "@/app/organization/types";
import CaseFields from "./CaseFields";
import { useCaseForm, type CaseFormSeed } from "./useCaseForm";

interface CaseFormProps {
  organizationId: string;
  mode: "create" | "edit";
  isOrgMode: boolean;
  siteId?: string | null;
  seed?: CaseFormSeed;
  /** Where Cancel goes; also the fallback after submit. */
  cancelHref: string;
  /** After a successful create/update; receives the created case on create. */
  onSuccess?: (result?: Case) => void;
}

/**
 * Full-page Add/Edit Case form (the mockup's Add Case screen), composed from DS
 * components. Reconciles the legacy modal + orphaned full-page create/edit into
 * one contract. Only API-persisted fields are collected (see CaseFields).
 */
export default function CaseForm({ organizationId, mode, isOrgMode, siteId, seed, cancelHref, onSuccess }: CaseFormProps) {
  const router = useRouter();

  const form = useCaseForm({
    organizationId,
    mode,
    isOrgMode,
    siteId,
    seed,
    onDone: (result) => {
      if (onSuccess) onSuccess(result);
      else if (result?.id && result?.siteId) {
        router.push(`/organization/${organizationId}/sites/${result.siteId}/cases/${result.id}`);
      } else {
        router.push(cancelHref);
      }
    },
  });

  const isEdit = mode === "edit";

  return (
    <LuiRoot>
      <div className="sheet form-sheet">
        <div className="page-head">
          <div className="ph-lead">
            <div className="eyebrow">
              {isEdit ? <FilePenLine aria-hidden /> : <FolderPlus aria-hidden />} {isEdit ? "Edit matter" : "New matter"}
            </div>
            <h1>{isEdit ? "Edit case" : "Add a case"}</h1>
            <div className="sub">
              {isEdit
                ? "Update the matter's details. Fields marked * are required."
                : "Create a matter in the register. Fields marked * are required — the rest can be filled in later."}
            </div>
          </div>
          <div className="ph-actions">
            <Button variant="secondary" icon={X} onClick={() => router.push(cancelHref)}>
              Cancel
            </Button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.submit();
          }}
        >
          {form.apiError ? (
            <div className="form-alert" role="alert">
              <TriangleAlert aria-hidden />
              <span>{form.apiError}</span>
            </div>
          ) : null}

          <div className="fcard">
            <div className="fcard-head">
              <span className="ic">
                <FileText aria-hidden />
              </span>
              <div className="t">
                <b>Case details</b>
                <span>Title, number and status of the matter</span>
              </div>
            </div>
            <CaseFields form={form} mode={mode} />
          </div>

          <div className="action-bar">
            <span className="hint">
              <Landmark aria-hidden />
              {isEdit ? "Editing existing matter" : "Linking a CNR enables eCourts sync"}
            </span>
            <div className="grow" />
            <Button variant="secondary" onClick={() => router.push(cancelHref)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={Check} loading={form.submitting}>
              {isEdit ? "Save changes" : "Create case"}
            </Button>
          </div>
        </form>
      </div>
    </LuiRoot>
  );
}
