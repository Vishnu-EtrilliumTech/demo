"use client";

import { useEffect, useState } from "react";
import { LuiRoot, LoadingState, ErrorState, Card, Button } from "@/design-system";
import { fetchCase } from "@/app/organization/services/api";
import type { Case } from "@/app/organization/types";
import CaseForm from "./CaseForm";
import type { CaseFormSeed } from "./useCaseForm";

interface Props {
  organizationId: string;
  siteId: string;
  caseId: string;
  cancelHref: string;
  /** Where to go after a successful save (defaults to the case workspace). */
  returnTo?: string;
}

/**
 * Loads a case, then renders the full-page CaseForm in edit mode seeded with
 * its values. Preserves the legacy edit route's fetch + returnTo behaviour.
 */
export default function EditCaseForm({ organizationId, siteId, caseId, cancelHref, returnTo }: Props) {
  const [seed, setSeed] = useState<CaseFormSeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchCase(organizationId, siteId, caseId)
      .then((c: Case) => {
        if (!active) return;
        setSeed({
          id: String(c.id),
          title: c.title,
          caseNumber: c.caseNumber,
          cnrNumber: c.cnrNumber,
          caseKey: c.caseKey,
          status: c.status,
          description: c.description,
          assignedToId: c.assignedToId ? String(c.assignedToId) : "",
        });
        setError(null);
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load case.");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [organizationId, siteId, caseId]);

  if (loading) {
    return (
      <LuiRoot>
        <div className="sheet form-sheet">
          <LoadingState message="Loading case…" />
        </div>
      </LuiRoot>
    );
  }

  if (error || !seed) {
    return (
      <LuiRoot>
        <div className="sheet form-sheet">
          <Card pad>
            <ErrorState
              title="Couldn't load this case"
              description={error ?? "The case could not be found."}
              action={
                <Button variant="secondary" onClick={() => window.history.back()}>
                  Go back
                </Button>
              }
            />
          </Card>
        </div>
      </LuiRoot>
    );
  }

  return (
    <CaseForm
      organizationId={organizationId}
      mode="edit"
      isOrgMode={false}
      siteId={siteId}
      seed={seed}
      cancelHref={cancelHref}
      onSuccess={() => {
        window.location.href = returnTo || cancelHref;
      }}
    />
  );
}
