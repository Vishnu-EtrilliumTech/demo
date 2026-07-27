"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Alert, Container } from "@mui/material";
import { CourtDataPayload } from "@/app/organization/types/ecourtTypes";
import {
  fetchCaseCourtData,
  updateCaseCourtData,
  downloadCourtDocument,
} from "@/app/organization/services/ecourtapi";
import { fetchCase } from "@/app/organization/services/api";
import EcourtDetailsView from "@/app/organization/components/EcourtDetailsView/EcourtDetailsView";

export default function CaseEcourtPage({
  params,
}: {
  params: Promise<{ id: string; siteId: string; caseId: string }>;
}) {
  const resolvedParams = React.use(params);
  const { id: orgId, siteId, caseId } = resolvedParams;
  const router = useRouter();

  const [data, setData] = useState<CourtDataPayload | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCase(orgId, siteId, caseId)
      .then((caseData) => {
        const cnr = caseData.cnrNumber;
        if (!cnr) {
          setError("No CNR number is linked to this case.");
          setLoading(false);
          return;
        }
        return fetchCaseCourtData(orgId, cnr);
      })
      .then((res) => {
        if (res === undefined) return;
        if (res === null) {
          setError("No eCourt data is linked to this case.");
        } else {
          setData(res.data);
          setLastUpdated(res.meta?.lastUpdated ?? null);
        }
      })
      .catch((err: unknown) =>
        setError(
          err instanceof Error ? err.message : "Failed to load court data"
        )
      )
      .finally(() => setLoading(false));
  }, [orgId, siteId, caseId]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const res = await updateCaseCourtData(orgId, data!.courtCaseData.cnr);
      setData(res.data);
      setLastUpdated(res.meta?.lastUpdated ?? null);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress size={48} sx={{ color: "#1976d2" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ pt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!data) return null;

  return (
    <EcourtDetailsView
      data={data}
      backLabel="Back to Case"
      downloadFn={(orderUrl) =>
        downloadCourtDocument(orgId, siteId, caseId, orderUrl)
      }
      onBack={() =>
        router.push(`/organization/${orgId}/sites/${siteId}/cases/${caseId}`)
      }
      lastUpdated={lastUpdated}
      onUpdate={handleUpdate}
      updating={updating}
    />
  );
}
