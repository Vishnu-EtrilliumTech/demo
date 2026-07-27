"use client";

import { useEffect, useState } from "react";
import { FolderPlus, Check, TriangleAlert, ArrowLeft, ArrowRight, SquarePen, Link2 } from "lucide-react";
import { LuiRoot, Dialog, Button } from "@/design-system";
import type { Case } from "@/app/organization/types";
import CaseFields from "./CaseFields";
import EcourtsImportPanel from "./EcourtsImportPanel";
import { useCaseForm, type CaseFormSeed } from "./useCaseForm";
import { useEcourtsCaseSearch, pickToSeed, type EcourtPick } from "./useEcourtsCaseSearch";

interface Props {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  isOrgMode: boolean;
  siteId?: string | null;
  /** Optional pre-fill (e.g. from an eCourts record) — opens straight on the form. */
  seed?: CaseFormSeed;
  /** Called after a successful create (e.g. to refetch the list). */
  onSuccess: (created?: Case) => void;
}

type Phase = "search" | "results" | "details" | "more";

const PHASE_SUBTITLE: Record<Phase, string> = {
  search: "Step 1 of 4 · Search eCourts",
  results: "Step 2 of 4 · Select a record",
  details: "Step 3 of 4 · Case details",
  more: "Step 4 of 4 · Additional details",
};

// Entered manually (no search/results steps), so the count restarts at 1.
const MANUAL_PHASE_SUBTITLE: Record<"details" | "more", string> = {
  details: "Step 1 of 2 · Case details",
  more: "Step 2 of 2 · Additional details",
};

/**
 * Add-case dialog — a four-step flow:
 *   1. Search eCourts (jurisdiction + the six search types), or "Enter manually".
 *   2. Pick a record from the results.
 *   3. Case details — number, title, court, court location, description.
 *   4. Everything else (CNR, assignment, parties, access) + Create case.
 *
 * Opening with a `seed` (e.g. from the eCourts details page) jumps straight to
 * step 3. Shares useCaseForm/CaseFields with the full page so validation
 * matches exactly.
 */
export default function QuickAddCaseDialog({ open, onClose, organizationId, isOrgMode, siteId, seed, onSuccess }: Props) {
  const [phase, setPhase] = useState<Phase>(seed ? "details" : "search");
  const [importSeed, setImportSeed] = useState<CaseFormSeed | undefined>(seed);
  const [cameFromEcourts, setCameFromEcourts] = useState(false);
  const [selectedPick, setSelectedPick] = useState<EcourtPick | null>(null);

  const search = useEcourtsCaseSearch(organizationId, open);

  const form = useCaseForm({
    organizationId,
    mode: "create",
    isOrgMode,
    siteId,
    seed: importSeed,
    onDone: (created) => {
      onSuccess(created);
      onClose();
    },
  });

  // Reset the flow whenever the dialog (re)opens. A supplied seed opens on the
  // details step; otherwise start on search with a clean panel.
  useEffect(() => {
    if (!open) return;
    setImportSeed(seed);
    setCameFromEcourts(!!seed);
    setSelectedPick(null);
    setPhase(seed ? "details" : "search");
    if (!seed) search.reset();
    // search.reset is stable enough for this one-shot on-open reset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seed]);

  // Re-apply the (possibly re-seeded) form on open and whenever the seed lands
  // (resetForm's identity changes with the seed, re-firing this effect).
  const { resetForm } = form;
  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  if (!open) return null;

  const runSearchAndAdvance = async () => {
    setSelectedPick(null);
    const picks = await search.runSearch();
    if (picks !== null) setPhase("results");
  };

  const handleNextFromResults = () => {
    if (!selectedPick) return;
    setImportSeed(pickToSeed(selectedPick));
    setCameFromEcourts(true);
    form.setField("isManual", false);
    setPhase("details");
  };

  const handleEnterManually = () => {
    setImportSeed(undefined);
    setCameFromEcourts(false);
    setSelectedPick(null);
    form.setField("isManual", true);
    setPhase("details");
  };

  // Back lands on the results list only when there is one to return to (an
  // internal pick); an externally-seeded open has no results, so fall to search.
  const backFromDetails = () =>
    setPhase(cameFromEcourts && search.results && search.results.length > 0 ? "results" : "search");

  const isFormPhase = phase === "details" || phase === "more";
  const isManual = isFormPhase && !cameFromEcourts;
  const dialogTitle = isManual ? "Add Case" : "Create Case from eCourts";
  const dialogSubtitle = isManual ? MANUAL_PHASE_SUBTITLE[phase as "details" | "more"] : PHASE_SUBTITLE[phase];

  // "Enter manually" lives in the header (near the title) on the eCourts steps,
  // so it's out of the way of the primary Search/Back/Create flow.
  const headerAction =
    !isFormPhase ? (
      <Button variant="secondary" icon={SquarePen} onClick={handleEnterManually}>
        Enter manually
      </Button>
    ) : null;

  const footer =
    phase === "search" ? (
      <>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          icon={ArrowRight}
          loading={search.isSearching}
          disabled={!search.canSearch}
          onClick={runSearchAndAdvance}
        >
          Next
        </Button>
      </>
    ) : phase === "results" ? (
      <>
        <Button variant="secondary" icon={ArrowLeft} onClick={() => setPhase("search")}>
          Back
        </Button>
        <Button variant="primary" icon={ArrowRight} disabled={!selectedPick} onClick={handleNextFromResults}>
          Next
        </Button>
      </>
    ) : phase === "details" ? (
      <>
        <Button variant="secondary" icon={ArrowLeft} onClick={backFromDetails}>
          Back
        </Button>
        <Button variant="primary" icon={ArrowRight} onClick={() => setPhase("more")}>
          Next
        </Button>
      </>
    ) : (
      <>
        <Button variant="secondary" icon={ArrowLeft} onClick={() => setPhase("details")}>
          Back
        </Button>
        <Button variant="primary" icon={Check} loading={form.submitting} onClick={() => form.submit()}>
          Create case
        </Button>
      </>
    );

  const importedCnr = phase === "details" && cameFromEcourts && importSeed?.cnrNumber ? importSeed.cnrNumber : null;

  return (
    <LuiRoot>
      <Dialog
        open={open}
        onClose={onClose}
        title={dialogTitle}
        subtitle={dialogSubtitle}
        icon={FolderPlus}
        wide
        headerAction={headerAction}
        footer={footer}
      >
        {form.apiError && isFormPhase ? (
          <div className="form-alert" role="alert" style={{ marginBottom: 12 }}>
            <TriangleAlert aria-hidden />
            <span>{form.apiError}</span>
          </div>
        ) : null}

        {phase === "search" || phase === "results" ? (
          <EcourtsImportPanel
            search={search}
            view={phase}
            selectedCnr={selectedPick?.cnr}
            onSelect={setSelectedPick}
          />
        ) : (
          <>
            {importedCnr ? (
              <div
                className="form-alert"
                role="status"
                style={{ background: "var(--brand-soft)", color: "var(--text-2)", marginBottom: 12 }}
              >
                <Link2 aria-hidden width={15} height={15} />
                <span>Imported from eCourts — CNR {importedCnr}. Review the details and create the case.</span>
              </div>
            ) : null}
            <CaseFields form={form} mode="create" section={phase} isManual={isManual} />
          </>
        )}
      </Dialog>
    </LuiRoot>
  );
}
