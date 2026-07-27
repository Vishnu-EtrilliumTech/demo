"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  CircularProgress,
  Alert,
  Container,
  Breadcrumbs,
  Link,
  Typography,
  useMediaQuery,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import BusinessIcon from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";
import BalanceIcon from "@mui/icons-material/Balance";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useToast } from "@/contexts/ToastContext";
import {
  CourtDataApiResponse,
  CourtDataPayload,
} from "@/app/organization/types/ecourtTypes";
import {
  fetchCnrCourtData,
  fetchCaseCourtData,
  updateCnrCourtData,
  downloadCnrCourtDocument,
  activateCnrCourtData,
} from "@/app/organization/services/ecourtapi";
import { fetchCase } from "@/app/organization/services/api";
import { useUserRole } from "@/hooks/useUserRole";
import EcourtDetailsView from "@/app/organization/components/EcourtDetailsView/EcourtDetailsViewLegacy";

export interface CnrViewerProps {
  orgId: string;
  cnrNumber: string;
  siteId?: string;
  caseId?: string;
}

export default function CnrViewerLegacy({ orgId, cnrNumber, siteId, caseId }: CnrViewerProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { isOrganizationAdmin, isOrganizationClerk } = useUserRole(orgId);
  const isOrgUser = isOrganizationAdmin || isOrganizationClerk;
  // Matches the OrgSidebar's Tailwind `md:` breakpoint (768px) — below it the
  // sidebar collapses into a hidden drawer, so the breadcrumb needs its own
  // way back to the organization root.
  const isSidebarHidden = useMediaQuery("(max-width:767.95px)");

  const [data, setData] = useState<CourtDataPayload | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [caseTitle, setCaseTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!siteId || !caseId) return;
    fetchCase(orgId, siteId, caseId)
      .then((caseData) => setCaseTitle(caseData.title))
      .catch(() => setCaseTitle(null));
  }, [orgId, siteId, caseId]);

  useEffect(() => {
    fetchCnrCourtData(orgId, cnrNumber)
      .then((res: CourtDataApiResponse) => {
        setData(res.data);
        setLastUpdated(res.meta?.lastUpdated ?? null);
        setIsSaved(res.meta?.isSaved === "true");
      })
      .catch(() =>
        fetchCaseCourtData(orgId, cnrNumber).then((res) => {
          if (!res) throw new Error("Case not found.");
          setData(res.data);
          setLastUpdated(res.meta?.lastUpdated ?? null);
          setIsSaved(false);
        })
      )
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load court data")
      )
      .finally(() => setLoading(false));
  }, [orgId, cnrNumber]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await activateCnrCourtData(orgId, cnrNumber);
      showSuccess(res?.data?.message ?? "Court data activated successfully");
      setIsSaved(true);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to activate court data");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const res = await updateCnrCourtData(orgId, cnrNumber);
      setData(res.data);
      setLastUpdated(res.meta?.lastUpdated ?? null);
      window.dispatchEvent(new CustomEvent('ecourts-quota-refresh'));
    } finally {
      setUpdating(false);
    }
  };

  const linkSx = {
    display: "flex",
    alignItems: "center",
    gap: 0.5,
    textDecoration: "none",
    color: "text.secondary",
    "&:hover": {
      color: "primary.main",
      textDecoration: "underline",
    },
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
    font: "inherit",
  } as const;

  const handleOrgClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOrgUser) router.push(`/organization/${orgId}`);
  };

  const handleCasesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/organization/${orgId}/cases`);
  };

  const handleCaseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/organization/${orgId}/sites/${siteId}/cases/${caseId}?tab=references`);
  };

  const handleEcourtsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/organization/${orgId}/ecourts`);
  };

  // Matches the OrgSidebar's Tailwind `md:` breakpoint — the "Organizations"
  // crumb only appears once the sidebar itself is hidden below that width.
  const orgCrumb = isSidebarHidden && (
    <Link
      key="org"
      component="button"
      onClick={handleOrgClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        textDecoration: "none",
        color: "text.secondary",
        whiteSpace: "nowrap",
        ...(isOrgUser && {
          "&:hover": { color: "primary.main", textDecoration: "underline" },
        }),
        cursor: isOrgUser ? "pointer" : "default",
        background: "none",
        border: "none",
        padding: 0,
        font: "inherit",
      }}
    >
      <HomeIcon sx={{ fontSize: 18 }} />
      <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>Organizations</Typography>
    </Link>
  );

  const middleCrumbs = siteId && caseId ? [
    <Link key="cases" component="button" onClick={handleCasesClick} sx={{ ...linkSx, whiteSpace: "nowrap" }}>
      <BusinessIcon sx={{ fontSize: 18 }} />
      <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>Cases</Typography>
    </Link>,
    <Link key="case" component="button" onClick={handleCaseClick} sx={{ ...linkSx, whiteSpace: "nowrap" }}>
      <DescriptionIcon sx={{ fontSize: 18 }} />
      <Typography
        variant="body2"
        sx={{
          maxWidth: { xs: 100, sm: 180 },
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={caseTitle ?? undefined}
      >
        {caseTitle ?? "Case"}
      </Typography>
    </Link>,
  ] : [
    <Link key="ecourts" component="button" onClick={handleEcourtsClick} sx={{ ...linkSx, whiteSpace: "nowrap" }}>
      <BalanceIcon sx={{ fontSize: 18 }} />
      <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>eCourts</Typography>
    </Link>,
  ];

  const breadcrumbs = (
    <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3 }, pb: 0 }}>
      <Breadcrumbs
        separator={<ChevronRightIcon sx={{ fontSize: 16, flexShrink: 0 }} />}
        aria-label="breadcrumb"
        sx={{
          overflowX: "auto",
          pb: 0.5,
          "& .MuiBreadcrumbs-ol": { flexWrap: "nowrap" },
          "& .MuiBreadcrumbs-li": { flexShrink: 0 },
        }}
      >
        {[orgCrumb, ...middleCrumbs].filter(Boolean)}

        <Typography
          key="cnr"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: "text.primary",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          <BalanceIcon sx={{ fontSize: 18 }} />
          {cnrNumber}
        </Typography>
      </Breadcrumbs>
    </Container>
  );

  if (loading) {
    return (
      <>
        {breadcrumbs}
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
      </>
    );
  }

  if (error) {
    return (
      <>
        {breadcrumbs}
        <Container maxWidth="xl" sx={{ pt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </>
    );
  }

  if (!data) return null;

  return (
    <>
      {breadcrumbs}
      <EcourtDetailsView
        data={data}
        downloadFn={(orderUrl) =>
          downloadCnrCourtDocument(orgId, cnrNumber, orderUrl)
        }
        lastUpdated={lastUpdated}
        onUpdate={handleUpdate}
        updating={updating}
        onSave={handleSave}
        saving={saving}
        isSaved={isSaved}
      />
    </>
  );
}
