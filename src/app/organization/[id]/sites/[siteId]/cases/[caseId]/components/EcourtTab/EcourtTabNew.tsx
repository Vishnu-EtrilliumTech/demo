"use client";

import React, { useEffect, useState } from "react";
import { Landmark } from "lucide-react";
import { LuiRoot, LoadingState, ErrorState, EmptyState } from "@/design-system";
import { CourtDataPayload } from "@/app/organization/types/ecourtTypes";
import {
  fetchCaseCourtData,
  updateCaseCourtData,
  downloadCourtDocument,
} from "@/app/organization/services/ecourtapi";
import EcourtDetailsView from "@/app/organization/components/EcourtDetailsView/EcourtDetailsView";
import type { EcourtTabProps } from "./types";

/**
 * DS eCourts tab body (case workspace). Reuses the existing service layer; only
 * presentation changes. Read + refresh only (no save on the case-scoped tab),
 * matching the legacy behavior. Wrapped in <LuiRoot> so it renders correctly
 * whether the surrounding workspace shell is DS (new) or legacy.
 */
export const EcourtTabNew: React.FC<EcourtTabProps> = ({ caseId, siteId, organizationId, cnrNumber }) => {
  const [data, setData] = useState<CourtDataPayload | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!cnrNumber) {
      setNoData(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchCaseCourtData(organizationId, cnrNumber)
      .then((res) => {
        if (res === null) {
          setNoData(true);
        } else {
          setData(res.data);
          setLastUpdated(res.meta?.lastUpdated ?? null);
        }
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load court data"))
      .finally(() => setLoading(false));
  }, [organizationId, siteId, caseId, cnrNumber]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const res = await updateCaseCourtData(organizationId, cnrNumber);
      setData(res.data);
      setLastUpdated(res.meta?.lastUpdated ?? null);
      window.dispatchEvent(new CustomEvent("ecourts-quota-refresh"));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <LuiRoot>
      {loading ? (
        <LoadingState message="Loading court data…" />
      ) : error ? (
        <ErrorState title="Failed to load court data" description={error} />
      ) : noData || !data ? (
        <EmptyState
          icon={Landmark}
          title="No eCourt data linked to this case"
          description="To fetch eCourt data, ensure this case has a valid CNR number assigned."
        />
      ) : (
        <EcourtDetailsView
          data={data}
          downloadFn={(orderUrl) => downloadCourtDocument(organizationId, siteId, caseId, orderUrl)}
          lastUpdated={lastUpdated}
          onUpdate={handleUpdate}
          updating={updating}
        />
      )}
    </LuiRoot>
  );
};
