"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  Tabs,
  Tab,
  CircularProgress,
  Typography,
  Paper,
  Breadcrumbs,
  Link,
  Button,
  TextField,
  Popover,
  InputAdornment,
  useMediaQuery,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupIcon from "@mui/icons-material/Group";
import DescriptionIcon from "@mui/icons-material/Description";
import AddTaskIcon from "@mui/icons-material/AddTask";
import ReceiptIcon from "@mui/icons-material/Receipt";
import EventIcon from "@mui/icons-material/Event";
import CommentIcon from "@mui/icons-material/Comment";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import HomeIcon from "@mui/icons-material/Home";
import BusinessIcon from "@mui/icons-material/Business";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import GavelIcon from "@mui/icons-material/Gavel";
import BalanceIcon from "@mui/icons-material/Balance";
import AddLinkIcon from "@mui/icons-material/AddLink";
import AccountTreeIcon from "@mui/icons-material/AccountTree";

// Import extracted components and hooks
import {
  CaseHeader,
  CaseOverview,
  ContributorsHeaderIndicator,
  EcourtTab,
  ReferenceCaseTab,
  ClientsTab,
  TasksTab,
  DocumentsTab,
  HearingsTab,
  CommentsTab,
  InvoiceTab,
  CaseAIChat,
} from "./components";
import { useCaseData, useCaseContributors, useAvailableContributorUsers } from "./hooks";
import { ContributorAccessLevel } from "@/app/organization/types/caseindex";
import { deleteCase } from "@/app/organization/services/api";
import { linkCnrCourtData } from "@/app/organization/services/ecourtapi";
import { useToast } from "@/contexts/ToastContext";
import styles from "./page.module.css";
import { tabStyles } from "@/app/organization/[id]/tabs-styles";
import { useUserRole } from "@/hooks/useUserRole";
import { useCaseAccess } from "@/hooks/useCaseAccess";
import { getCaseTabIndex } from "./caseTabs";
import { PageHeaderCard } from "@/components/PageHeaderCard";

function TabPanel({
  children,
  value,
  index,
  ...other
}: {
  children: React.ReactNode;
  value: number;
  index: number;
  [key: string]: unknown;
}) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`case-tabpanel-${index}`}
      aria-labelledby={`case-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>{children}</Box>}
    </div>
  );
}

export default function CaseDetailPage({
  params,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ id: string; siteId: string; caseId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const resolvedParams = React.use(params);
  const searchParams = React.use(searchParamsPromise);
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [cnrInput, setCnrInput] = useState("");
  const [cnrLinking, setCnrLinking] = useState(false);
  const [cnrAnchorEl, setCnrAnchorEl] = useState<HTMLButtonElement | null>(null);

  const toggleDetails = () => {
    setIsDetailsExpanded((previous) => !previous);
  };

  const [hearingStatusFilter, setHearingStatusFilter] = useState<string>("");
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("");

  const caseId = resolvedParams.caseId as string;
  const siteId = resolvedParams.siteId as string;
  const organizationId = resolvedParams.id as string;

  const { showSuccess, showError } = useToast();
  const { isOrganizationAdmin, isOrganizationClerk } =
    useUserRole(organizationId);
  const isOrgUser = isOrganizationAdmin || isOrganizationClerk;
  // Matches the OrgSidebar's Tailwind `md:` breakpoint (768px) — below it the
  // sidebar collapses into a hidden drawer, so the breadcrumb needs its own
  // way back to the organization root.
  const isSidebarHidden = useMediaQuery("(max-width:767.95px)");

  // Use the main case data hook
  const {
    caseData,
    loading,
    error,
    assignedUserData,
    loadingAssignedUser,
    siteUsers,
    loadingSiteUsers,
    siteData,
    isEditingTitle,
    isLoadingTitle,
    editTitleForm,
    handleEditTitleClick,
    handleCancelTitleEdit,
    handleSaveTitleEdit,
    handleEditTitleFormChange,
    titleFieldErrors,
    titleEditError,
    refetchCase,
  } = useCaseData(organizationId, siteId, caseId);

  // Contributor data + computed case access (drives gating; backend is authoritative)
  const {
    contributors,
    loading: loadingContributors,
    mutating: mutatingContributors,
    addContributor,
    updateContributor,
    removeContributor,
    refetch: refetchContributors,
  } = useCaseContributors(organizationId, siteId, caseId);

  const access = useCaseAccess({
    organizationId,
    createdById: caseData?.createdById ?? null,
    assignedToId: caseData?.assignedToId ?? null,
    contributors,
    contributorsLoading: loadingContributors,
    apiAccessLevel: caseData?.accessLevel,
  });

  // Eligible-to-add users for the contributor picker (feature 034). Fetched for
  // anyone who sees the picker (contributor managers) OR who can add a task/
  // hearing — the latter use this list to decide whether the "Case Access for
  // Assignee" field should show (see relatedUserIds below).
  const {
    availableUsers,
    loading: loadingAvailableUsers,
    refetch: refetchAvailableUsers,
  } = useAvailableContributorUsers(
    organizationId,
    siteId,
    caseId,
    access.canManageContributors || access.canCreateOrEditResource
  );

  // Add a contributor, then refresh the eligible list. On success the just-added
  // member drops out; on a backend rejection (e.g. a stale picker) the refresh
  // re-syncs the list to current eligibility (FR-006/FR-007).
  const handleAddContributor = React.useCallback(
    async (userId: string, accessLevel: ContributorAccessLevel): Promise<boolean> => {
      const ok = await addContributor(userId, accessLevel);
      await refetchAvailableUsers();
      return ok;
    },
    [addContributor, refetchAvailableUsers]
  );

  // Assigning a task/hearing can auto-grant the assignee as a contributor on
  // the backend. Refresh the contributors list and the eligible-user picker so
  // the Contributors tab reflects it without a full page reload.
  const handleContributorsChanged = React.useCallback(() => {
    void refetchContributors();
    void refetchAvailableUsers();
  }, [refetchContributors, refetchAvailableUsers]);

  // Site members for whom the task/hearing "Case Access for Assignee" field is
  // hidden — i.e. anyone the backend would NOT auto-grant as a new contributor:
  // the creator, the main assignee, existing contributors, AND admins. Rather
  // than re-derive this on the client (which cannot reliably detect admins), we
  // treat it as the complement of the backend's eligible-to-add list: every site
  // member who is NOT in `availableUsers` is "related or admin", so the field is
  // hidden for them. This keeps admin detection authoritative on the backend.
  const relatedUserIds = React.useMemo(() => {
    const eligibleIds = new Set(availableUsers.map((u) => u.id));
    return siteUsers.map((u) => u.id).filter((id) => !eligibleIds.has(id));
  }, [siteUsers, availableUsers]);

  const hasCnrNumber = caseData?.hasCnrNumber ?? true;
  // Derived tab indices (single source of truth — see caseTabs.ts)
  const referenceTabIndex = getCaseTabIndex("references", hasCnrNumber);
  const clientsTabIndex = getCaseTabIndex("clients", hasCnrNumber);
  const hearingsTabIndex = getCaseTabIndex("hearings", hasCnrNumber);
  const tasksTabIndex = getCaseTabIndex("tasks", hasCnrNumber);

  // Set initial tab based on URL parameter, resolved via the shared tab-index
  // map so the optional eCourts tab is accounted for (avoids off-by-one).
  React.useEffect(() => {
    if (searchParams?.tab === "tasks") {
      setTab(tasksTabIndex);
    } else if (searchParams?.tab === "hearings") {
      setTab(hearingsTabIndex);
    } else if (searchParams?.tab === "references") {
      setTab(referenceTabIndex);
    }
  }, [searchParams?.tab, tasksTabIndex, hearingsTabIndex, referenceTabIndex]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    if (newValue !== hearingsTabIndex) {
      setHearingStatusFilter("");
    }
    if (newValue !== tasksTabIndex) {
      setTaskStatusFilter("");
    }
  };

  const handleOpenCnrPopover = (e: React.MouseEvent<HTMLButtonElement>) => {
    setCnrAnchorEl(e.currentTarget);
  };

  const handleCloseCnrPopover = () => {
    setCnrAnchorEl(null);
    setCnrInput("");
  };

  const handleLinkCnr = async () => {
    const trimmed = cnrInput.trim();
    if (!trimmed) return;
    setCnrLinking(true);
    try {
      await linkCnrCourtData(organizationId, siteId, caseId, trimmed);
      setCnrAnchorEl(null);
      showSuccess("CNR number linked successfully");
      await refetchCase();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to link CNR number";
      showError(msg);
    } finally {
      setCnrLinking(false);
    }
  };

  const handleDeleteCase = async () => {
    try {
      await deleteCase(organizationId, siteId, caseId);
      showSuccess("Case deleted successfully");
      router.push(`/organization/${organizationId}/sites/${siteId}#cases`);
    } catch (err: unknown) {
      console.error("Error deleting case:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to delete case. Please try again.";
      showError(errorMessage);
    }
  };

  const handleBack = () => {
    // Check if we have history to go back to
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      // Fallback to site page if no history
      router.push(`/organization/${organizationId}/sites/${siteId}#cases`);
    }
  };

  // Breadcrumb navigation handlers
  const handleOrgClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOrgUser) {
      router.push(`/organization/${organizationId}`);
    }
  };

  const handleSitesListClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/organization/${organizationId}/sites`);
  };

  const handleSiteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/organization/${organizationId}/sites/${siteId}`);
  };

  const handleCasesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/organization/${organizationId}/cases?siteId=${siteId}`);
  };

  // Handle hearing filtering from overview
  const handleFilterHearings = (status: string) => {
    setHearingStatusFilter(status);
  };

  // Handle task filtering from overview
  const handleFilterTasks = (status: string) => {
    setTaskStatusFilter(status);
  };

  if (loading) {
    return (
      <Box className={styles.orgContainer}>
        <Box sx={{ pl: { xs: 2, sm: 3 }, pr: { xs: 2, sm: 5 }, py:3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
              background: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <CircularProgress size={48} sx={{ color: "#1976d2", mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Loading case details...
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  if (error) {
    // A "not found" / permission failure (row-filtered case, 401/403/404) is shown
    // as a friendly no-permission message rather than a raw error (FR-023).
    const lowerError = error.toLowerCase();
    const isPermissionOrNotFound =
      lowerError.includes("not found") ||
      lowerError.includes("permission") ||
      lowerError.includes("authoriz") ||
      lowerError.includes("403") ||
      lowerError.includes("401");

    if (isPermissionOrNotFound) {
      return (
        <Box className={styles.orgContainer}>
          <Box sx={{ pl: { xs: 2, sm: 3 }, pr: { xs: 2, sm: 5 }, py: 3 }}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                border: "1px solid #f59e0b",
                borderRadius: "16px",
                p: 3,
                textAlign: "center",
              }}
            >
              <Typography variant="h6" color="warning.dark" sx={{ mb: 1 }}>
                No Access to This Case
              </Typography>
              <Typography color="text.secondary">
                This case could not be found, or you do not have permission to view
                it. If you believe you should have access, ask a case admin to add
                you as a contributor.
              </Typography>
            </Card>
          </Box>
        </Box>
      );
    }

    return (
      <Box className={styles.orgContainer}>
        <Box sx={{ pl: { xs: 2, sm: 3 }, pr: { xs: 2, sm: 5 }, py:3 }}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
              border: "1px solid #fca5a5",
              borderRadius: "16px",
              p: 3,
            }}
          >
            <Typography variant="h6" color="error" sx={{ mb: 1 }}>
              Error Loading Case
            </Typography>
            <Typography color="text.secondary">{error}</Typography>
          </Card>
        </Box>
      </Box>
    );
  }

  if (!caseData) {
    return (
      <Box className={styles.orgContainer}>
        <Box sx={{ pl: { xs: 2, sm: 3 }, pr: { xs: 2, sm: 5 }, py:3 }}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              border: "1px solid #f59e0b",
              borderRadius: "16px",
              p: 3,
              textAlign: "center",
            }}
          >
            <Typography variant="h6" color="warning.dark" sx={{ mb: 1 }}>
              Case Not Found
            </Typography>
            <Typography color="text.secondary">
              The requested case could not be found or you do not have
              permission to view it.
            </Typography>
          </Card>
        </Box>
      </Box>
    );
  }

  return (
    <section className={styles.orgContainer}>
      <Box sx={{ pl: { xs: 2, sm: 3 }, pr: { xs: 2, sm: 5 }, py:3 }}>
        {/* Breadcrumbs */}
        <Box sx={{ mb: 3, pl: 1 }}>
          <Breadcrumbs
            separator={<ChevronRightIcon sx={{ fontSize: 16 }} />}
            aria-label="breadcrumb"
            sx={{
              "& .MuiBreadcrumbs-ol": {
                flexWrap: "wrap",
              },
            }}
          >
            {isSidebarHidden && (
              <Link
                component="button"
                onClick={handleOrgClick}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  textDecoration: "none",
                  color: "text.secondary",
                  ...(isOrgUser && {
                    "&:hover": {
                      color: "primary.main",
                      textDecoration: "underline",
                    },
                  }),
                  cursor: isOrgUser ? "pointer" : "default",
                  background: "none",
                  border: "none",
                  padding: 0,
                  font: "inherit",
                }}
              >
                <HomeIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2">Organizations</Typography>
              </Link>
            )}

            {/* Site-level users (SiteAdmin/Clerk/Legal Expert) can't access the
                org-wide Sites list, so the trail starts at the site itself. */}
            {isOrgUser && (
              <Link
                component="button"
                onClick={handleSitesListClick}
                sx={{
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
                }}
              >
                <BusinessIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2">Sites</Typography>
              </Link>
            )}

            {/* Site title is only useful as a "back" link for org-level users
                — site-level users are already scoped to their one site. */}
            {isOrgUser && siteData && (
              <Link
                component="button"
                onClick={handleSiteClick}
                sx={{
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
                }}
              >
                <LocationCityIcon sx={{ fontSize: 18, flexShrink: 0 }} />
                <Typography
                  variant="body2"
                  sx={{
                    maxWidth: { xs: "120px", sm: "none" },
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={siteData.name}
                >
                  {siteData.name}
                </Typography>
              </Link>
            )}

            <Link
              component="button"
              onClick={handleCasesClick}
              sx={{
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
              }}
            >
              <FolderOpenIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2">Cases</Typography>
            </Link>

            <Typography
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "text.primary",
                fontWeight: 500,
                maxWidth: { xs: "160px", sm: "none" },
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: { xs: "nowrap", sm: "normal" },
              }}
              title={caseData.title}
            >
              <DescriptionIcon sx={{ fontSize: 18, flexShrink: 0 }} />
              {caseData.title}
            </Typography>
          </Breadcrumbs>
        </Box>

        <PageHeaderCard
          icon={
            <GavelIcon
              sx={{ fontSize: { xs: 26, sm: 32, md: 42 }, color: "#ffffff" }}
            />
          }
          title={caseData.title}
          titleText={caseData.title}
          description="Manage case details, clients, tasks, and documents"
          expanded={isDetailsExpanded}
          onToggleExpanded={toggleDetails}
          actions={
            <>
              <ContributorsHeaderIndicator
                contributors={contributors}
                loading={loadingContributors}
                onClick={() => setTab(0)}
              />
              {!hasCnrNumber && access.canCreateOrEditResource && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddLinkIcon />}
                  onClick={handleOpenCnrPopover}
                  disabled={cnrLinking || !!caseData.cnrNumber}
                  sx={{
                    borderRadius: "20px",
                    textTransform: "none",
                    borderColor: "rgba(25, 118, 210, 0.35)",
                    color: "primary.main",
                    flexShrink: 0,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    minWidth: { xs: 38, sm: "auto" },
                    px: { xs: 1, sm: 2 },
                    "& .MuiButton-startIcon": {
                      mr: { xs: 0, sm: 0.5 },
                      ml: { xs: 0 },
                    },
                    "&:hover": {
                      borderColor: "primary.main",
                      backgroundColor: "rgba(25, 118, 210, 0.06)",
                    },
                  }}
                >
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    Link CNR
                  </Box>
                </Button>
              )}
            </>
          }
        >
          <CaseHeader
            caseData={caseData}
            assignedUserData={assignedUserData}
            siteUsers={siteUsers}
            loadingAssignedUser={loadingAssignedUser}
            loadingSiteUsers={loadingSiteUsers}
            isEditingTitle={isEditingTitle}
            isLoadingTitle={isLoadingTitle}
            editTitleForm={editTitleForm}
            organizationId={organizationId}
            siteId={siteId}
            onBack={handleBack}
            onEditTitleClick={handleEditTitleClick}
            onCancelTitleEdit={handleCancelTitleEdit}
            onSaveTitleEdit={handleSaveTitleEdit}
            onEditTitleFormChange={handleEditTitleFormChange}
            onDeleteCase={handleDeleteCase}
            onCaseUpdated={refetchCase}
            titleFieldErrors={titleFieldErrors}
            titleEditError={titleEditError}
            canEditCase={access.canEditCase}
            canDeleteCase={access.canDeleteCase}
          />
        </PageHeaderCard>

        <Paper
          elevation={0}
          sx={{
            borderRadius: "16px",
            overflow: "hidden",
            mt: 1,
            border: "1px solid rgba(25, 118, 210, 0.1)",
            boxShadow: "0 4px 20px rgba(25, 118, 210, 0.1)",
          }}
        >
          <Box
            sx={{ display: "flex", flexDirection: "column", minHeight: "60vh" }}
          >
            {/* Enhanced Tabs with new styling */}
            <Paper
              elevation={0}
              sx={{
                background: "linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)",
                borderBottom: "1px solid rgba(25, 118, 210, 0.15)",
                px: { xs: 1, md: 2 },
                pt: 1,
                borderRadius: "16px 16px 0 0",
              }}
            >
              <Tabs
                value={tab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile={true}
                sx={tabStyles.tabs}
                TabIndicatorProps={{
                  style: { display: "none" },
                }}
              >
                <Tab
                  label="Overview"
                  icon={<DashboardIcon />}
                  iconPosition="start"
                  sx={tabStyles.tab}
                />
                {hasCnrNumber && (
                  <Tab
                    label="eCourts"
                    icon={<BalanceIcon />}
                    iconPosition="start"
                    sx={tabStyles.tab}
                  />
                )}
                <Tab
                  label="References"
                  icon={<AccountTreeIcon />}
                  iconPosition="start"
                  sx={tabStyles.tab}
                />
                <Tab
                  label="Clients"
                  icon={<GroupIcon />}
                  iconPosition="start"
                  sx={tabStyles.tab}
                />
                <Tab
                  label="Tasks"
                  icon={<AddTaskIcon />}
                  iconPosition="start"
                  sx={tabStyles.tab}
                />
                <Tab
                  label="Documents"
                  icon={<DescriptionIcon />}
                  iconPosition="start"
                  sx={tabStyles.tab}
                />
                <Tab
                  label="Hearings"
                  icon={<EventIcon />}
                  iconPosition="start"
                  sx={tabStyles.tab}
                />
                <Tab
                  label="Comments"
                  icon={<CommentIcon />}
                  iconPosition="start"
                  sx={tabStyles.tab}
                />
                <Tab
                  label="Invoice"
                  icon={<ReceiptIcon />}
                  iconPosition="start"
                  sx={tabStyles.tab}
                />
              </Tabs>
            </Paper>

            <Box sx={{ flex: 1, overflow: "auto" }}>
              {/* Tab Panels */}
              <TabPanel value={tab} index={0}>
                <CaseOverview
                  caseId={caseId}
                  siteId={siteId}
                  organizationId={organizationId}
                  onNavigateToTab={(tabIndex) => setTab(tabIndex)}
                  onFilterHearings={handleFilterHearings}
                  onFilterTasks={handleFilterTasks}
                  contributors={contributors}
                  loadingContributors={loadingContributors}
                  mutatingContributors={mutatingContributors}
                  canManageContributors={access.canManageContributors}
                  canCreateOrEditResource={access.canCreateOrEditResource}
                  availableUsers={availableUsers}
                  loadingAvailableUsers={loadingAvailableUsers}
                  onAddContributor={handleAddContributor}
                  onUpdateContributor={updateContributor}
                  onRemoveContributor={removeContributor}
                />
              </TabPanel>

              {hasCnrNumber && (
                <TabPanel value={tab} index={1}>
                  <EcourtTab
                    caseId={caseId}
                    siteId={siteId}
                    organizationId={organizationId}
                    cnrNumber={caseData.cnrNumber ?? ""}
                  />
                </TabPanel>
              )}

              <TabPanel value={tab} index={referenceTabIndex}>
                <ReferenceCaseTab
                  caseId={caseId}
                  siteId={siteId}
                  organizationId={organizationId}
                  canCreateOrEditResource={access.canCreateOrEditResource}
                  canDeleteResource={access.canDeleteResource}
                />
              </TabPanel>

              <TabPanel value={tab} index={clientsTabIndex}>
                <ClientsTab
                  caseId={caseId}
                  siteId={siteId}
                  organizationId={organizationId}
                  canCreateOrEditResource={access.canCreateOrEditResource}
                  canDeleteResource={access.canDeleteResource}
                />
              </TabPanel>

              <TabPanel value={tab} index={tasksTabIndex}>
                <TasksTab
                  caseId={caseId}
                  siteId={siteId}
                  organizationId={organizationId}
                  siteUsers={siteUsers}
                  initialStatusFilter={taskStatusFilter}
                  canCreateOrEditResource={access.canCreateOrEditResource}
                  canDeleteResource={access.canDeleteResource}
                  relatedUserIds={relatedUserIds}
                  onContributorsChanged={handleContributorsChanged}
                />
              </TabPanel>

              <TabPanel value={tab} index={getCaseTabIndex("documents", hasCnrNumber)}>
                <DocumentsTab
                  caseId={caseId}
                  siteId={siteId}
                  organizationId={organizationId}
                  canCreateOrEditResource={access.canCreateOrEditResource}
                  canDeleteResource={access.canDeleteResource}
                />
              </TabPanel>

              <TabPanel value={tab} index={hearingsTabIndex}>
                <HearingsTab
                  caseId={caseId}
                  siteId={siteId}
                  organizationId={organizationId}
                  siteUsers={siteUsers}
                  initialStatusFilter={hearingStatusFilter}
                  canCreateOrEditResource={access.canCreateOrEditResource}
                  canDeleteResource={access.canDeleteResource}
                  relatedUserIds={relatedUserIds}
                  onContributorsChanged={handleContributorsChanged}
                />
              </TabPanel>

              <TabPanel value={tab} index={getCaseTabIndex("comments", hasCnrNumber)}>
                <CommentsTab
                  caseId={caseId}
                  siteId={siteId}
                  organizationId={organizationId}
                  canCreateOrEditResource={access.canCreateOrEditResource}
                  canDeleteResource={access.canDeleteResource}
                />
              </TabPanel>

              <TabPanel value={tab} index={getCaseTabIndex("invoice", hasCnrNumber)}>
                <InvoiceTab
                  caseId={caseId}
                  siteId={siteId}
                  organizationId={organizationId}
                  canCreateOrEditResource={access.canCreateOrEditResource}
                  canDeleteResource={access.canDeleteResource}
                />
              </TabPanel>
            </Box>
          </Box>
        </Paper>

        {/* AI Chat - Floating chat for Organization Admins */}
        <CaseAIChat
          caseId={caseId}
          siteId={siteId}
          organizationId={organizationId}
        />
      </Box>

      {/* CNR Linking Popover */}
      <Popover
        open={Boolean(cnrAnchorEl)}
        anchorEl={cnrAnchorEl}
        onClose={handleCloseCnrPopover}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            width: { xs: "calc(100vw - 32px)", sm: 340 },
            maxWidth: 340,
            mt: 0.5,
          },
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              CNR Linking
            </Typography>
          </Box>

          <TextField
            size="small"
            fullWidth
            placeholder="e.g., DLST010003252013"
            value={cnrInput}
            onChange={(e) => setCnrInput(e.target.value)}
            disabled={cnrLinking}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLinkCnr();
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BalanceIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              fullWidth
              disabled={cnrLinking || !cnrInput.trim()}
              onClick={handleLinkCnr}
              sx={{ borderRadius: "8px", textTransform: "none" }}
            >
              {cnrLinking ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                "Submit"
              )}
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={handleCloseCnrPopover}
              disabled={cnrLinking}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                color: "text.secondary",
                flexShrink: 0,
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Popover>
    </section>
  );
}