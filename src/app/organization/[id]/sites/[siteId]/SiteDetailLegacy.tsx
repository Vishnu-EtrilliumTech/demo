"use client";

import React, { useState, useEffect } from "react";
import { useHasScrollbar } from "@/hooks/useHasScrollbar";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Fade,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
} from "@mui/material";
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  VpnKey as VpnKeyIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  LocationOn as LocationOnIcon,
  CalendarToday as CalendarIcon,
  ChevronRight as ChevronRightIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  LocationCity as LocationCityIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  GroupAdd as GroupAddIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  PersonAdd as PersonAddIcon,
  Gavel as GavelIcon,
} from "@mui/icons-material";
import styles from "@/app/organization/page.module.css";

import Image from "next/image";

import OrgStatsCards from "@/app/organization/components/OrgStatsCards";
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal";
import { useToast } from "@/contexts/ToastContext";
// import { useCoachMark } from "@/contexts/CoachMarkContext";
// import { siteTour } from "@/components/CoachMark";

import {
  fetchSite,
  fetchSiteUsers,
  fetchSiteCases,
  deleteCase,
  deleteSiteUser,
  deleteSite,
  fetchUserBasicInfo,
  fetchSiteHearings,
} from "@/app/organization/services/api";
import { type Site, type User, type Case, Hearing } from "@/app/organization/types";
import {
  canEditCaseEntity,
  canDeleteCaseEntity,
} from "@/app/organization/types/caseindex";
import { useUserRole } from "@/hooks/useUserRole";
import CaseStatusPieChart from "@/app/organization/components/CaseStatusPieChart";
import FirmGrowthLineChart from "@/app/organization/components/FirmGrowthLineChart";
import EditSiteModal from "@/components/modals/EditSiteModal";
import AddUserModal from "@/components/modals/AddUserModal";
import AddCaseModal from "@/components/modals/AddCaseModal";
import { formatDisplayDate } from "@/utils";
import { PageHeaderCard } from "@/components/PageHeaderCard";

export default function SiteDetailLegacy({
  params,
}: {
  params: Promise<{ id: string; siteId: string }>;
}) {
  const { id: organizationId, siteId } = React.use(params);
  const hasScrollbar = useHasScrollbar();

  const [site, setSite] = useState<Site | null>(null);
  const [upcomingHearings, setUpcomingHearings] = useState<Hearing[]>([])
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  // Use the custom hook to get role-based permissions
  const {
    canViewCases,
    canViewHearings,
    isOrganizationAdmin,
    isOrganizationClerk,
    canEditSites,
    canDeleteSites,
    canEditCases,
    canDeleteCases,
    canDeleteSiteUsers,
    canEditSiteUsers: siteCanEditUsers,
    canDeleteSiteUsersAsSiteAdmin: siteCanDeleteUsers,
    isSiteAdmin,
    isSiteLegalExpert,
    isSiteSrLegalExpert,
  } = useUserRole(organizationId);

  const isOrgUser = isOrganizationAdmin || isOrganizationClerk;
  const isLegalExpert = isSiteLegalExpert || isSiteSrLegalExpert;
  // Site Admins and legal experts don't have access to the org-wide Sites
  // list, so the breadcrumb has nowhere useful to link back to on this page.
  const hideBreadcrumb = isLegalExpert || isSiteAdmin;
  // Matches the OrgSidebar's Tailwind `md:` breakpoint (768px) — below it the
  // sidebar collapses into a hidden drawer, so the breadcrumb needs its own
  // way back to the organization root.
  const isSidebarHidden = useMediaQuery("(max-width:767.95px)");

  const [users, setUsers] = useState<User[]>([]);

  const router = useRouter();

  const [cases, setCases] = useState<Case[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userMenuAnchor, setUserMenuAnchor] = useState<{
    element: HTMLElement;
    user: User;
  } | null>(null);
  const [caseMenuAnchor, setCaseMenuAnchor] = useState<{
    element: HTMLElement;
    caseId: number;
  } | null>(null);
  const [siteMenuAnchorEl, setSiteMenuAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [siteDeleteDialogOpen, setSiteDeleteDialogOpen] = useState(false);
  const [deleteUserModalOpen, setDeleteUserModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteCaseModalOpen, setDeleteCaseModalOpen] = useState(false);
  const [hearingsAuthModalOpen, setHearingsAuthModalOpen] = useState(false);
  const [caseToDeleteFromModal, setCaseToDeleteFromModal] =
  useState<Case | null>(null);
  const [casesAuthModalOpen, setCasesAuthModalOpen] = useState(false);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [addCaseModalOpen, setAddCaseModalOpen] = useState(false);
  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState<null | HTMLElement>(null);

  const { showSuccess, showError } = useToast();
  // const { startTour, hasCompletedTour } = useCoachMark();
  const handleTotalCasesClick = () => {
    if (isOrganizationClerk) setCasesAuthModalOpen(true);
    else router.push(`/organization/${organizationId}/cases?siteId=${siteId}`);
  };
  const handleActiveUsersClick = () => {
    router.push(`/organization/${organizationId}/users?viewSiteId=${siteId}`);
  };
  const handleResolvedCasesClick = () => {
    if (isOrganizationClerk) setCasesAuthModalOpen(true);
    else router.push(
      `/organization/${organizationId}/cases?status=Closed&siteId=${siteId}`,
    );
  };
  const onHearingsClick = () => {
    if (isOrganizationClerk) setHearingsAuthModalOpen(true);
    else router.push(`/organization/${organizationId}/sites/${siteId}/hearings`);
  };

  const loadAllData = async () => {
    if (!organizationId || !siteId) return;
    setIsLoading(true);
    try {
      // Fetch site and site users data in parallel
      const [siteData, siteUsersPage, siteHearingsPage] = await Promise.all([
        fetchSite(organizationId, siteId),
        fetchSiteUsers(organizationId, siteId),
        fetchSiteHearings(organizationId, siteId)
      ]);

      const siteUsersData = siteUsersPage.items;
      setSite(siteData);
      setUsers(siteUsersData);
      setUpcomingHearings(siteHearingsPage.items);
       // Only site users

      // Only fetch cases if user has permission to view them
      const casesData = (await fetchSiteCases(organizationId, siteId)).items;
      setCases(casesData);
      if (canViewCases) {

        // Lazy load user names for createdById and assignedToId
        const uniqueUserIds = new Set<string>();
        casesData.forEach((c) => {
          if (c.createdById) uniqueUserIds.add(c.createdById);
          if (c.assignedToId) uniqueUserIds.add(c.assignedToId);
        });

        // First, create a map with site users we already have
        const nameMap = new Map<string, string>();
        siteUsersData.forEach((u) => {
          const userId = u.id || u.userId;
          if (userId) {
            nameMap.set(userId, u.fullName);
          }
        });

        // Fetch basic info for users not in site users list
        const missingUserIds = Array.from(uniqueUserIds).filter(
          (id) => !nameMap.has(id),
        );
        if (missingUserIds.length > 0) {
          const userBasicInfoPromises = missingUserIds.map((userId) =>
            fetchUserBasicInfo(organizationId, userId),
          );
          const userBasicInfoResults = await Promise.all(userBasicInfoPromises);

          // Add fetched user names to the map
          userBasicInfoResults.forEach((userInfo) => {
            if (userInfo) {
              nameMap.set(userInfo.id, userInfo.fullName);
            }
          });
        }
      } else {
        // setCases([]);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching site data:", err);
      setError("Failed to load site details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, siteId, canViewCases]);

  // Start coach mark tour for first-time users
  // useEffect(() => {
  //   if (site && !isLoading && !hasCompletedTour(siteTour.id)) {
  //     // Delay to ensure DOM is ready
  //     const timer = setTimeout(() => {
  //       startTour(siteTour);
  //     }, 800);
  //     return () => clearTimeout(timer);
  //   }
  // }, [site, isLoading, hasCompletedTour, startTour]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // User menu handlers

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleDeleteUser = (user: User) => {
    if (!user || !user.id) return;

    setUserToDelete(user);
    setDeleteUserModalOpen(true);
    handleUserMenuClose();
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete?.id || !organizationId || !siteId) return;

    try {
      await deleteSiteUser(organizationId, siteId, userToDelete.id.toString());
      setDeleteUserModalOpen(false);
      setUserToDelete(null);
      await loadAllData();
      showSuccess("User deleted successfully");
    } catch (err) {
      console.error("Error deleting user:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to delete user. Please try again.";
      showError(errorMessage);
    }
  };

  const handleCloseDeleteUserModal = () => {
    setDeleteUserModalOpen(false);
    setUserToDelete(null);
  };

  // Case menu handlers

  const handleCaseMenuClose = () => {
    setCaseMenuAnchor(null);
  };

  const handleDeleteCaseFromMenu = (caseItem: Case) => {
    setCaseToDeleteFromModal(caseItem);
    setDeleteCaseModalOpen(true);
    handleCaseMenuClose();
  };

  const confirmDeleteCase = async () => {
    if (!caseToDeleteFromModal || !organizationId || !siteId) return;

    try {
      await deleteCase(organizationId, siteId, caseToDeleteFromModal.id);
      setDeleteCaseModalOpen(false);
      setCaseToDeleteFromModal(null);
      await loadAllData();
      showSuccess("Case deleted successfully");
    } catch (err) {
      console.error("Error deleting case:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to delete case. Please try again.";
      showError(errorMessage);
    }
  };

  const handleCloseDeleteCaseModal = () => {
    setDeleteCaseModalOpen(false);
    setCaseToDeleteFromModal(null);
  };

  const handleSiteMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSiteMenuAnchorEl(event.currentTarget);
  };

  const handleSiteMenuClose = () => {
    setSiteMenuAnchorEl(null);
  };

  const handleSiteDeleteClick = () => {
    setSiteDeleteDialogOpen(true);
    handleSiteMenuClose();
  };

  const handleSiteDeleteConfirm = async () => {
    if (!site || !organizationId || !siteId) return;

    try {
      await deleteSite(organizationId, siteId);
      setSiteDeleteDialogOpen(false);
      showSuccess("Site deleted successfully");
      router.push(`/organization/${organizationId}`);
    } catch (err: unknown) {
      console.error("Error deleting site:", err);
      let errorMessage = "Failed to delete site. Please try again.";

      if (
        err instanceof Error &&
        err.message === "Not authorized to delete this site"
      ) {
        errorMessage =
          "You do not have sufficient permissions to delete this site.";
      } else if (err instanceof Error && err.message === "Site not found") {
        errorMessage = "Site not found or has already been deleted.";
      }

      showError(errorMessage);
    }
  };

  const handleSiteDeleteCancel = () => {
    setSiteDeleteDialogOpen(false);
  };

  const toggleDetails = () => {
    setIsDetailsExpanded(!isDetailsExpanded);
  };

  const handleAddMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAddMenuAnchorEl(event.currentTarget);
  };

  const handleAddMenuClose = () => {
    setAddMenuAnchorEl(null);
  };

  // Handle breadcrumb navigation
  const handleSitesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/organization/${organizationId}/sites`);
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOrgUser) {
      router.push(`/organization/${organizationId}`);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading site data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography color="error" variant="h6" gutterBottom>
            Error Loading Site Data
          </Typography>
          <Typography color="textSecondary" paragraph>
            {error}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!site) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography color="error" variant="h6" gutterBottom>
            Site Not Found
          </Typography>
          <Typography color="textSecondary" paragraph>
            The requested site could not be found or you do not have permission to view it.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push(`/organization/${organizationId}/sites`)}
            sx={{ mt: 2 }}
          >
            Back to Sites
          </Button>
        </Paper>
      </Container>
    );
  }

  // Per-case Edit/Delete gating for the case actions menu. When the backend
  // supplies an access level for the selected case, honour it; otherwise fall
  // back to role-based gating.
  const menuCase = caseMenuAnchor
    ? cases.find(
        (c) => c.id?.toString() === caseMenuAnchor.caseId.toString(),
      )
    : undefined;
  const menuCaseCanEdit = menuCase?.accessLevel
    ? canEditCaseEntity(menuCase.accessLevel)
    : true;
  const menuCaseCanDelete = menuCase?.accessLevel
    ? canDeleteCaseEntity(menuCase.accessLevel)
    : true;

  return (
    <section className={styles.orgContainer}>
      <Box sx={{ pl: { xs: 2, sm: 3 }, pr: { xs: 2, sm: hasScrollbar ? 4 : 5 }, py:3 }}>
        {/* Breadcrumbs — not shown for Site Admins or legal experts on their site dashboard */}
        {!hideBreadcrumb && (
          <Box sx={{ mb: 3 }}>
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
                  onClick={handleHomeClick}
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

              <Link
                component="button"
                onClick={handleSitesClick}
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

              <Typography
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  color: "text.primary",
                  fontWeight: 500,
                }}
              >
                <LocationCityIcon sx={{ fontSize: 18 }} />
                {site.name}
              </Typography>
            </Breadcrumbs>
          </Box>
        )}

        {/* Site Header */}
        <PageHeaderCard
          icon={
            <Image
              src="/office_building.svg"
              alt="Legal Office Building"
              width={32}
              height={32}
              style={{ filter: "brightness(0) invert(1)" }}
            />
          }
          title={
            cases.length === 0 && users.length === 0
              ? `Welcome to ${site.name}!`
              : `${site.name.toLocaleLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())} Dashboard`
          }
          description={
            cases.length === 0 && users.length === 0
              ? "Let's get your site set up in a few quick steps."
              : "Manage your site details, users, and cases"
          }
          expanded={isDetailsExpanded}
          onToggleExpanded={toggleDetails}
          actions={
            <Button
              onClick={handleAddMenuOpen}
              variant="contained"
              size="small"
              startIcon={<AddCircleOutlineIcon />}
              endIcon={<KeyboardArrowDownIcon />}
              sx={{
                textTransform: "none",
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                "&:hover": {
                  background: "linear-gradient(135deg, #2563eb, #1e4db9)",
                },
              }}
            >
              Quick Actions
            </Button>
          }
        >
          <div className="relative">
            {/* Three Dots Menu inside dropdown */}
            {!isEditing && (canEditSites || canDeleteSites) && (
              <div className="absolute top-0 right-0 z-10">
                <IconButton
                  data-coach="site-edit-btn"
                  size="small"
                  onClick={handleSiteMenuOpen}
                  sx={{
                    color: "text.secondary",
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                  aria-label="More options"
                >
                  <MoreVertIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </div>
            )}

            {/* Site Details Grid - 3-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Column 1: Site Details */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Site Details
                  </p>
                  {site.siteKey && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <VpnKeyIcon
                        sx={{ fontSize: 13 }}
                        className="text-slate-400 flex-shrink-0"
                      />
                      <span>
                        Site Key:{" "}
                        <span className="font-mono font-medium text-slate-700">
                          {site.siteKey}
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CalendarIcon
                      sx={{ fontSize: 13 }}
                      className="text-slate-400 flex-shrink-0"
                    />
                    <span>
                      Created Date:{" "}
                      <span className="font-medium text-slate-700">
                        {site.createdDate
                          ? formatDisplayDate(site.createdDate)
                          : "N/A"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Column 2: Contact Information */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Contact
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <EmailIcon
                      sx={{ fontSize: 13 }}
                      className="text-slate-400 flex-shrink-0"
                    />
                    <span>{site.emailId || "No email provided"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <PhoneIcon
                      sx={{ fontSize: 13 }}
                      className="text-slate-400 flex-shrink-0"
                    />
                    <span>{site.phoneNumber || "No phone provided"}</span>
                  </div>
                </div>

                {/* Column 3: Address */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Address
                  </p>
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <LocationOnIcon
                      sx={{ fontSize: 13 }}
                      className="text-slate-400 flex-shrink-0 mt-0.5"
                    />
                    <span className="leading-relaxed">
                      {site.address}
                      {(site.locality ||
                        site.district ||
                        site.state ||
                        site.pincode) && (
                        <span className="block text-slate-400 text-xs mt-0.5">
                          {[
                            site.locality,
                            site.district,
                            site.state,
                            site.pincode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      )}
                      {site.landmark && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">
                          {site.landmark}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Site Description - full width, since it can run up to 500 characters */}
              {site.description && (
                <div className="pl-5 pt-5 mt-5 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <DescriptionIcon
                      sx={{ fontSize: 14 }}
                      className="text-slate-400"
                    />
                    Site Description
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
                    {site.description}
                  </p>
                </div>
              )}
            </div>
        </PageHeaderCard>

        {/* ── Onboarding step cards — only when no cases and no users ── */}
        {cases.length === 0 && (
          <Box sx={{ mt: 1 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              {/* Step 1 — Add Users */}
              <div
                style={{
                  flex: "1 1 calc(50% - 8px)",
                  minWidth: "280px",
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #f1f5f9",
                  padding: "32px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "row",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <Box sx={{ flexShrink: 0 }}>
                  <Image
                    src="/add-user.svg"
                    alt="Add users"
                    width={140}
                    height={120}
                    style={{ objectFit: "contain" }}
                  />
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    minWidth: "200px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <Typography
                    sx={{ fontWeight: 700, color: "#1e293b", fontSize: "1.1rem" }}
                  >
                    Add Users
                  </Typography>
                  <Typography
                    sx={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.7, flex: 1 }}
                  >
                    Invite your team members and assign them roles within this
                    site to start collaborating on cases.
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<GroupAddIcon />}
                      onClick={() => setAddUserModalOpen(true)}
                      fullWidth
                      sx={{
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 600,
                        background: "#3b82f6",
                        px: 3,
                        "&:hover": { background: "#2563eb" },
                      }}
                    >
                      Add Users
                    </Button>
                  </Box>
                </Box>
              </div>

              {/* Step 2 — Add a Case */}
              <div
                style={{
                  flex: "1 1 calc(50% - 8px)",
                  minWidth: "280px",
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #f1f5f9",
                  padding: "32px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: "24px",
                  flexWrap: "wrap",
                }}
              >
                <Box sx={{ flexShrink: 0 }}>
                  <Image
                    src="/legal_case_folder.svg"
                    alt="Add a case"
                    width={140}
                    height={120}
                    style={{ objectFit: "contain" }}
                  />
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    minWidth: "200px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <Typography
                    sx={{ fontWeight: 700, color: "#1e293b", fontSize: "1.1rem" }}
                  >
                    Add a Case
                  </Typography>
                  <Typography
                    sx={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.7 }}
                  >
                    Create your first case to start tracking matters, hearings,
                    and documents within this site.
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<GavelIcon />}
                      onClick={() => setAddCaseModalOpen(true)}
                      fullWidth
                      sx={{
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 600,
                        background: "#3b82f6",
                        px: 3,
                        "&:hover": { background: "#2563eb" },
                      }}
                    >
                      Add Your First Case
                    </Button>
                  </Box>
                </Box>
              </div>
            </div>
          </Box>
        )}

        {/* ── Stats cards — shown once there are cases and more than one user ── */}
        {(cases.length > 0  ) && (
          <OrgStatsCards
            totalCases={cases.length}
            upcomingHearings={upcomingHearings.length}
            casesThisMonth={
              cases.filter((c) => {
                const d = new Date(c.createdDate ?? c.createdAt ?? "");
                const now = new Date();
                return (
                  d.getMonth() === now.getMonth() &&
                  d.getFullYear() === now.getFullYear()
                );
              }).length
            }
            activeUsers={
              users.filter(
                (u) =>
                  !u.roles?.some(
                    (role) =>
                      role === "OrganizationAdmin" ||
                      role === "OrganizationClerk",
                  ),
              ).length
            }
            resolvedCases={
              cases.filter((c) =>
                c.status ? c.status.toLowerCase() === "closed" : false,
              ).length
            }
            showHearings={canViewHearings || isOrganizationClerk}
            onHearingsClick={onHearingsClick}
            onTotalCasesClick={handleTotalCasesClick}
            onActiveUsersClick={handleActiveUsersClick}
            onResolvedCasesClick={handleResolvedCasesClick}
          />
        )}

        {/* ── Chart area — placeholder panels until a case is added ── */}
        {cases.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                flex: "1 1 calc(50% - 8px)",
                minWidth: "280px",
                background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                borderRadius: "16px",
                border: "1px solid #86efac",
                padding: "40px 32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "16px",
              }}
            >
              <Image
                src="/pie-chart-placeholder.svg"
                alt="Track cases"
                width={140}
                height={120}
                style={{ objectFit: "contain" }}
              />
              <Typography
                sx={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.6, maxWidth: 320 }}
              >
                Track your case status and distributions after adding your first case.
              </Typography>
            </div>
            <div
              style={{
                flex: "1 1 calc(50% - 8px)",
                minWidth: "280px",
                background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                borderRadius: "16px",
                border: "1px solid #86efac",
                padding: "40px 32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "16px",
              }}
            >
              <Image
                src="/firm-growth-placeholder.svg"
                alt="Site growth"
                width={140}
                height={120}
                style={{ objectFit: "contain" }}
              />
              <Typography
                sx={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.6, maxWidth: 320 }}
              >
                Follow your site&apos;s growth and performance once cases are created.
              </Typography>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "24px",
              alignItems: "stretch",
            }}
          >
            <div style={{ flex: "1 1 calc(50% - 8px)", minWidth: "280px", display: "flex" }}>
              <CaseStatusPieChart
                cases={cases}
                organizationId={organizationId}
                siteId={siteId}
                isRestricted={isOrganizationClerk}
                onRestrictedClick={() => setCasesAuthModalOpen(true)}
              />
            </div>
            <div style={{ flex: "1 1 calc(50% - 8px)", minWidth: "280px", display: "flex" }}>
              <FirmGrowthLineChart cases={cases} />
            </div>
          </div>
        )}
      </Box>

      {/* Quick Actions Menu */}
      <Menu
        anchorEl={addMenuAnchorEl}
        open={Boolean(addMenuAnchorEl)}
        onClose={handleAddMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { mt: 0.5, minWidth: addMenuAnchorEl?.offsetWidth },
          },
        }}
      >
        <MenuItem
          onClick={() => { setAddUserModalOpen(true); handleAddMenuClose(); }}
          sx={{ gap: 1 }}
        >
          <PersonAddIcon color="primary" fontSize="small" />
          Add User
        </MenuItem>
        <MenuItem
          onClick={() => { setAddCaseModalOpen(true); handleAddMenuClose(); }}
          sx={{ gap: 1 }}
        >
          <GavelIcon color="primary" fontSize="small" />
          Add Case
        </MenuItem>
      </Menu>

      {/* Add User Modal */}
      <AddUserModal
        open={addUserModalOpen}
        onClose={() => setAddUserModalOpen(false)}
        onSuccess={() => {
          setAddUserModalOpen(false);
          loadAllData();
        }}
        organizationId={organizationId}
        isOrgMode={false}
        siteId={siteId}
        canCreateAdmin={canEditSites}
        canCreateClerk={canEditSites}
      />

      {/* Add Case Modal */}
      <AddCaseModal
        open={addCaseModalOpen}
        onClose={() => setAddCaseModalOpen(false)}
        onSuccess={() => {
          setAddCaseModalOpen(false);
          loadAllData();
        }}
        organizationId={organizationId}
        isOrgMode={false}
        siteId={siteId}
      />

      {/* User Actions Menu */}
      <Menu
        anchorEl={userMenuAnchor?.element}
        open={Boolean(userMenuAnchor?.element)}
        onClose={handleUserMenuClose}
        TransitionComponent={Fade}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            minWidth: 120,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          },
        }}
      >
        {userMenuAnchor?.user &&
          (() => {
            const user = userMenuAnchor.user;
            const canEdit =
              siteCanEditUsers ||
              isOrganizationAdmin ||
              (isOrganizationClerk &&
                !user.roles?.includes("OrganizationAdmin"));
            const canDelete = siteCanDeleteUsers || canDeleteSiteUsers;

            const menuItems = [];

            if (canEdit) {
              menuItems.push(
                <MenuItem
                  key="edit"
                  onClick={() => {
                    const userId = user.id || user.userId;
                    if (userId) {
                      router.push(
                        `/organization/${organizationId}/sites/${siteId}/users/${userId}/edit`,
                      );
                    }
                    handleUserMenuClose();
                  }}
                  sx={{ fontSize: "0.875rem" }}
                >
                  <EditIcon sx={{ mr: 1, fontSize: 16 }} />
                  Edit
                </MenuItem>,
              );
            }

            if (canDelete) {
              menuItems.push(
                <MenuItem
                  key="delete"
                  onClick={() => {
                    handleDeleteUser(user);
                  }}
                  sx={{ fontSize: "0.875rem", color: "#dc2626" }}
                >
                  <DeleteIcon sx={{ mr: 1, fontSize: 16 }} />
                  Delete
                </MenuItem>,
              );
            }

            return menuItems;
          })()}
      </Menu>

      {/* Case Actions Menu */}
      <Menu
        anchorEl={caseMenuAnchor?.element}
        open={Boolean(caseMenuAnchor?.element)}
        onClose={handleCaseMenuClose}
        TransitionComponent={Fade}
        disableAutoFocusItem
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            minWidth: 120,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          },
          onClick: (e: React.MouseEvent) => e.stopPropagation(),
        }}
      >
        {canEditCases && menuCaseCanEdit && (
          <MenuItem
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const caseId = caseMenuAnchor?.caseId;
              if (caseId) {
                // Add returnTo parameter to navigate back to cases tab after edit
                router.push(
                  `/organization/${organizationId}/sites/${siteId}/cases/${caseId}/edit?returnTo=/organization/${organizationId}/sites/${siteId}%23cases`,
                );
              }
              handleCaseMenuClose();
            }}
            sx={{ fontSize: "0.875rem" }}
          >
            <EditIcon sx={{ mr: 1, fontSize: 16 }} />
            Edit
          </MenuItem>
        )}
        {canDeleteCases && menuCaseCanDelete && (
          <MenuItem
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const caseId = caseMenuAnchor?.caseId;
              const caseItem = cases.find(
                (c) => c.id?.toString() === caseId?.toString(),
              );
              if (caseItem) {
                handleDeleteCaseFromMenu(caseItem);
              }
            }}
            sx={{ fontSize: "0.875rem", color: "#dc2626" }}
          >
            <DeleteIcon sx={{ mr: 1, fontSize: 16 }} />
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Site Actions Menu */}
      <Menu
        anchorEl={siteMenuAnchorEl}
        open={Boolean(siteMenuAnchorEl)}
        onClose={handleSiteMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {canEditSites && (
          <MenuItem
            onClick={() => {
              handleEditClick();
              handleSiteMenuClose();
            }}
            sx={{ gap: 1 }}
          >
            <EditIcon fontSize="small" />
            Edit Site
          </MenuItem>
        )}
        {canDeleteSites && (
          <MenuItem
            onClick={handleSiteDeleteClick}
            sx={{ gap: 1, color: "error.main" }}
          >
            <DeleteIcon fontSize="small" />
            Delete Site
          </MenuItem>
        )}
      </Menu>

      {/* Edit Site Modal */}
      <EditSiteModal
        open={isEditing}
        onClose={handleCancelEdit}
        onSuccess={async () => {
          setIsEditing(false);
          await loadAllData();
        }}
        organizationId={organizationId}
        site={site}
      />

      {/* Site Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={siteDeleteDialogOpen}
        onClose={handleSiteDeleteCancel}
        onConfirm={handleSiteDeleteConfirm}
        entityType="site"
        entityName={site?.name}
      />

      {/* Delete User Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteUserModalOpen}
        onClose={handleCloseDeleteUserModal}
        onConfirm={confirmDeleteUser}
        entityType="user"
        entityName={userToDelete?.fullName}
      />

      {/* Delete Case Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteCaseModalOpen}
        onClose={handleCloseDeleteCaseModal}
        onConfirm={confirmDeleteCase}
        entityType="case"
        entityName={
          caseToDeleteFromModal?.caseNumber || caseToDeleteFromModal?.title
        }
      />

      {/* Hearings Not Authorized Modal */}
      <Dialog
        open={hearingsAuthModalOpen}
        onClose={() => setHearingsAuthModalOpen(false)}
        PaperProps={{ sx: { borderRadius: "16px", p: 1, minWidth: 360 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
          Hearings — Restricted Access
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Your current role doesn&apos;t include access to hearing details.
            Please reach out to your Organization Administrator to request
            access.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 2 }}>
          <Button
            onClick={() => setHearingsAuthModalOpen(false)}
            variant="contained"
            size="small"
            sx={{ borderRadius: "8px", textTransform: "none" }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
              open={casesAuthModalOpen}
              onClose={() => setCasesAuthModalOpen(false)}
              PaperProps={{ sx: { borderRadius: "16px", p: 1, minWidth: 360 } }}
            >
              <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
                Cases — Restricted Access
              </DialogTitle>
              <DialogContent>
                <Typography variant="body2" color="text.secondary">
                  Your current role doesn&apos;t include access to case details.
                  Please reach out to your Organization Administrator to request
                  access.
                </Typography>
              </DialogContent>
              <DialogActions sx={{ pb: 2, pr: 2 }}>
                <Button
                  onClick={() => setCasesAuthModalOpen(false)}
                  variant="contained"
                  size="small"
                  sx={{ borderRadius: "8px", textTransform: "none" }}
                >
                  Got it
                </Button>
              </DialogActions>
            </Dialog>
    </section>
  );
}
