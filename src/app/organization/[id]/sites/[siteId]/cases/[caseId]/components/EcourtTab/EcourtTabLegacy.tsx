"use client";

import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Alert, Typography } from "@mui/material";
import { CourtDataPayload } from "@/app/organization/types/ecourtTypes";
import {
  fetchCaseCourtData,
  updateCaseCourtData,
  downloadCourtDocument,
} from "@/app/organization/services/ecourtapi";
import EcourtDetailsView from "@/app/organization/components/EcourtDetailsView/EcourtDetailsViewLegacy";
import type { EcourtTabProps } from "./types";

export const EcourtTabLegacy: React.FC<EcourtTabProps> = ({
  caseId,
  siteId,
  organizationId,
  cnrNumber,
}) => {
  const [data, setData] = useState<CourtDataPayload | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCaseCourtData(organizationId, cnrNumber)
      .then((res) => {
        if (res === null) {
          setNoData(true);
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
  }, [organizationId, siteId, caseId, cnrNumber]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const res = await updateCaseCourtData(organizationId, cnrNumber);
      setData(res.data);
      setLastUpdated(res.meta?.lastUpdated ?? null);
      window.dispatchEvent(new CustomEvent('ecourts-quota-refresh'));
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
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (noData) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Alert severity="info" sx={{ mb: 2, textAlign: "left" }}>
          No eCourt data is linked to this case yet.
        </Alert>
        <Typography variant="body2" color="text.secondary">
          To fetch eCourt data, ensure this case has a valid CNR number assigned.
        </Typography>
      </Box>
    );
  }

  if (!data) return null;

  return (
    <EcourtDetailsView
      data={data}
      downloadFn={(orderUrl) =>
        downloadCourtDocument(organizationId, siteId, caseId, orderUrl)
      }
      lastUpdated={lastUpdated}
      onUpdate={handleUpdate}
      updating={updating}
    />
  );
};
