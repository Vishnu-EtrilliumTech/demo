"use client";

import { FilePenLine, Check, TriangleAlert } from "lucide-react";
import { LuiRoot, Dialog, Button } from "@/design-system";
import CaseFields from "./CaseFields";
import { useCaseForm, type CaseFormSeed } from "./useCaseForm";

interface Props {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  siteId: string;
  seed: CaseFormSeed;
  /** Called after a successful update (e.g. to refetch the case). */
  onSuccess: () => void;
}

/**
 * Quick-edit case dialog — the DS counterpart to the legacy EditCaseModal,
 * reusing the same useCaseForm/CaseFields as the full edit page so behaviour
 * and validation match exactly.
 */
export default function QuickEditCaseDialog({ open, onClose, organizationId, siteId, seed, onSuccess }: Props) {
  const form = useCaseForm({
    organizationId,
    mode: "edit",
    isOrgMode: false,
    siteId,
    seed,
    onDone: () => {
      onSuccess();
      onClose();
    },
  });

  if (!open) return null;

  return (
    <LuiRoot>
      <Dialog
        open={open}
        onClose={onClose}
        title="Edit case"
        subtitle="Update the matter's details"
        icon={FilePenLine}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" icon={Check} loading={form.submitting} onClick={() => form.submit()}>
              Save changes
            </Button>
          </>
        }
      >
        {form.apiError ? (
          <div className="form-alert" role="alert">
            <TriangleAlert aria-hidden />
            <span>{form.apiError}</span>
          </div>
        ) : null}
        <CaseFields form={form} mode="edit" />
      </Dialog>
    </LuiRoot>
  );
}
