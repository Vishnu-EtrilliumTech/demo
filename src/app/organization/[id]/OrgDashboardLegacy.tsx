"use client";

import React, { useState, useEffect, use } from "react";
import { useHasScrollbar } from "@/hooks/useHasScrollbar";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  CircularProgress,
  MenuItem,
  IconButton,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import {
  Description as DescriptionIcon,
  Category as SegmentIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  CalendarToday as CalendarIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  GroupAdd as GroupAddIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  PersonAdd as PersonAddIcon,
  Business as BusinessIcon,
  Gavel as GavelIcon,
  VpnKey as VpnKeyIcon,
} from "@mui/icons-material";
import Image from "next/image";
import OrgStatsCards from "@/app/organization/components/OrgStatsCards";
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal";
import EditOrganizationModal from "@/components/modals/EditOrganizationModal";
import AddSiteModal from "@/components/modals/AddSiteModal";
import AddUserModal from "@/components/modals/AddUserModal";
import AddCaseModal from "@/components/modals/AddCaseModal";
import { useToast } from "@/contexts/ToastContext";
// import { useCoachMark } from "@/contexts/CoachMarkContext";
// import { organizationTour } from "@/components/CoachMark";

import {
  fetchOrganization,
  fetchOrganizationUsers,
  fetchOrganizationSites,
  fetchOrganizationCases,
  updateOrganization as updateOrganizationApi,
  deleteOrganization,
  fetchOrganizationHearings,
} from "@/app/organization/services/api";
import type {
  Organization,
  User,
  Case,
  Hearing,
  Site,
} from "@/app/organization/types";
import { setOrganizationRole } from "@/app/redux/searchProfile/profileSlice";
import { useUserRole } from "@/hooks/useUserRole";
import { formatDisplayDate, ValidationPatterns, ValidationMessages } from "@/utils";
import CaseStatusPieChart from "../components/CaseStatusPieChart";
import FirmGrowthLineChart from "../components/FirmGrowthLineChart";
import { PageHeaderCard } from "@/components/PageHeaderCard";

// Interface for API validation errors
interface ValidationErrors {
  [fieldName: string]: string;
}

export default function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const dispatch = useDispatch();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    description: "",
    segments: [] as string[],
  });
  const [allCases, setAllCases] = useState<Case[]>([]);
  const [resolvedCases, setResolvedCases] = useState<Case[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const resolvedParams = use(params);
  const organizationId = resolvedParams.id;
  console.log("Organization ID from params:", organization);

  const hasScrollbar = useHasScrollbar();
  const { showSuccess, showError } = useToast();
  // const { startTour, hasCompletedTour } = useCoachMark();

  // Use the custom hook to get role-based permissions
  const router = useRouter();
  const { canEditOrganizationDetails, canViewHearings, isOrganizationClerk } =
    useUserRole(organizationId);
  const [hearingsAuthModalOpen, setHearingsAuthModalOpen] = useState(false);
  const [casesAuthModalOpen, setCasesAuthModalOpen] = useState(false);
  const [addSiteModalOpen, setAddSiteModalOpen] = useState(false);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [addCaseModalOpen, setAddCaseModalOpen] = useState(false);
  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState<null | HTMLElement>(
    null,
  );

  const handleAddMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAddMenuAnchorEl(event.currentTarget);
  };

  const handleAddMenuClose = () => {
    setAddMenuAnchorEl(null);
  };

  const toggleDetails = () => {
    setIsDetailsExpanded(!isDetailsExpanded);
  };

  useEffect(() => {
    const loadAllData = async () => {
      if (!organizationId) return;
      setIsLoading(true);
      try {
        const [orgResult, usersResult, sitesResult, hearingsResult] = await Promise.allSettled(
          [
            fetchOrganization(organizationId),
            fetchOrganizationUsers(organizationId),
            fetchOrganizationSites(organizationId),
            fetchOrganizationHearings(organizationId),
          ],
        );

        if (orgResult.status === 'rejected') throw orgResult.reason;
        const orgData = orgResult.value;
        setOrganization(orgData);
        if (usersResult.status === 'fulfilled') setUsers(usersResult.value.items);
        if (sitesResult.status === 'fulfilled') setSites(sitesResult.value.items);
        if (hearingsResult.status === 'fulfilled') setHearings(hearingsResult.value.items);

        const [openData, inProgressData, onHoldData, resolvedData] =
          await Promise.allSettled([
            fetchOrganizationCases(organizationId, { status: "Open" }),
            fetchOrganizationCases(organizationId, { status: "InProgress" }),
            fetchOrganizationCases(organizationId, { status: "OnHold" }),
            fetchOrganizationCases(organizationId, { status: "Closed" }),
          ]);
        const open = openData.status === "fulfilled" ? openData.value.items : [];
        const inProg =
          inProgressData.status === "fulfilled" ? inProgressData.value.items : [];
        const onHold =
          onHoldData.status === "fulfilled" ? onHoldData.value.items : [];
        const resolved =
          resolvedData.status === "fulfilled" ? resolvedData.value.items : [];
        setAllCases([...open, ...inProg, ...onHold, ...resolved]);
        setResolvedCases(resolved);

        // Extract and store current user's role from organization data
        if (
          orgData.currentUser &&
          orgData.currentUser.roles &&
          orgData.currentUser.roles.length > 0
        ) {
          // Extract organization-level role (OrganizationAdmin or OrganizationClerk)
          const orgRole = orgData.currentUser.roles.find(
            (role: string) =>
              role === "OrganizationAdmin" || role === "OrganizationClerk",
          );

          if (orgRole) {
            dispatch(
              setOrganizationRole({
                organizationRole: orgRole,
                organizationId: organizationId,
                userId: orgData.currentUser.id,
              }),
            );
          }
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching organization data:", err);
        setError("Failed to load organization details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (organizationId) {
      loadAllData();
    }
  }, [organizationId, dispatch]);


  // Start coach mark tour for first-time users
  // useEffect(() => {
  //   if (organization && !isLoading && !hasCompletedTour(organizationTour.id)) {
  //     // Delay to ensure DOM is ready
  //     const timer = setTimeout(() => {
  //       startTour(organizationTour);
  //     }, 800);
  //     return () => clearTimeout(timer);
  //   }
  // }, [organization, isLoading, hasCompletedTour, startTour]);

  const handleEditClick = () => {
    if (organization) {
      setEditFormData({
        name: organization.name || "",
        email: organization.emailId || "",
        phone: String(organization.phoneNumber) || "",
        description: organization.description || "",
        segments: [...(organization.segments || [])],
      });
      setValidationErrors({}); // Clear any previous validation errors
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!organization) return;

    // Frontend validation for required fields
    const errors: ValidationErrors = {};

    if (!editFormData.name || editFormData.name.trim() === "") {
      errors.name = "Organization name is required";
    }

    if (!editFormData.email || editFormData.email.trim() === "") {
      errors.emailId = "Organization email is required";
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(editFormData.email.trim())) {
      errors.emailId = "Please enter a valid email address.";
    }

    if (!editFormData.phone || editFormData.phone.trim() === "") {
      errors.phoneNumber = "Phone number is required";
    } else if (!ValidationPatterns.phone.test(editFormData.phone.trim())) {
      errors.phoneNumber = ValidationMessages.phone;
    }

    // If there are validation errors, display them and stop
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const payload = {
        name: editFormData.name,
        emailId: editFormData.email,
        phoneNumber: Number(editFormData.phone) || 0,
        description: editFormData.description,
        segments: editFormData.segments,
        enabled: true,
      };

      setIsLoading(true);
      setValidationErrors({}); // Clear any previous validation errors

      // Make the API call
      await updateOrganizationApi(String(organization.id), payload);

      // Success: Update UI and exit edit mode
      setOrganization((prev) =>
        prev
          ? {
              ...prev,
              name: editFormData.name,
              emailId: editFormData.email,
              phoneNumber: Number(editFormData.phone) || 0,
              description: editFormData.description,
              segments: [...editFormData.segments],
            }
          : null,
      );

      // Show success message
      showSuccess("Organization updated successfully");

      setIsEditing(false);
      setError(null);
    } catch (err: unknown) {
      console.error("Error updating organization:", err);

      // Check if this is a validation error (HTTP 400 with errors object)
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: {
            status?: number;
            data?: { errors?: Record<string, string[]> };
          };
        };

        if (
          axiosError.response?.status === 400 &&
          axiosError.response?.data?.errors
        ) {
          // Extract validation errors and map API field names to form field names
          const apiErrors = axiosError.response.data.errors;
          const mappedErrors: ValidationErrors = {};

          // Map API field names (PascalCase) to form field names (camelCase)
          Object.keys(apiErrors).forEach((apiFieldName) => {
            const formFieldName =
              apiFieldName.charAt(0).toLowerCase() + apiFieldName.slice(1); // Convert to camelCase
            const errorMessages = apiErrors[apiFieldName];
            if (errorMessages && errorMessages.length > 0) {
              mappedErrors[formFieldName] = errorMessages[0]; // Take the first error message
            }
          });

          setValidationErrors(mappedErrors);
          // Don't set error state for validation errors - keep the form visible
        } else {
          // Non-validation error: show error page
          setError("Failed to update organization. Please try again.");
        }
      } else {
        // Network error or other non-axios error: show error page
        setError("Failed to update organization. Please try again.");
      }
    } finally {
      // Always reset loading state regardless of success or failure
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!organization) return;

    try {
      await deleteOrganization(String(organization.id));
      setDeleteDialogOpen(false);
      showSuccess("Organization deleted successfully");
      window.location.href = "/organization";
    } catch (err: unknown) {
      console.error("Error deleting organization:", err);
      let errorMessage = "Failed to delete organization. Please try again.";

      if (
        err instanceof Error &&
        err.message === "Not authorized to delete this organization"
      ) {
        errorMessage =
          "You do not have sufficient permissions to delete this organization. Only system administrators can delete organizations.";
      } else if (
        err instanceof Error &&
        err.message === "Organization not found"
      ) {
        errorMessage = "Organization not found or has already been deleted.";
      }

      showError(errorMessage);
    }
  };

  const handleTotalCasesClick = () => {
    if (isOrganizationClerk) setCasesAuthModalOpen(true);
    else router.push(`/organization/${organizationId}/cases`);
  };

  const handleResolvedCasesClick = () => {
    if (isOrganizationClerk) setCasesAuthModalOpen(true);
    else router.push(`/organization/${organizationId}/cases?status=Closed`);
  };

  const onHearingsClick = () => {
    if (isOrganizationClerk) setHearingsAuthModalOpen(true);
    else router.push(`/organization/${organizationId}/hearings`);
  };

  const handleActiveUsersClick = () => {
    router.push(`/organization/${organizationId}/users`);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const canDeleteOrganization = () => {
    return organization?.currentUser?.roles?.includes("SystemAdmin") || false;
  };

  // Calculate upcoming hearings (hearings with dates in the future)
  const getUpcomingHearingsCount = () => {
    const now = new Date();
    return hearings.filter((hearing) => {
      const hearingDate = new Date(hearing.hearingDateTime);
      return hearingDate > now;
    }).length;
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
          Loading organization data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography color="error" variant="h6" gutterBottom>
            Error Loading Organization Data
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

  if (!organization) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography color="error" variant="h6" gutterBottom>
            Error Loading Organization Data
          </Typography>
          <Typography color="textSecondary" paragraph>
            Unable to load organization information.
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

  return (
    <>
      <Box sx={{ pl: { xs: 2, sm: 3 }, mr: { xs: 2, sm: hasScrollbar ? 4 : 5 }, pt: { xs: 2, sm: 3 } }}>
        {/* Organization Header */}
        <PageHeaderCard
          icon={
            <Image
              src="/courthouse.svg"
              alt="Legal Organization"
              width={32}
              height={32}
              priority
              style={{ filter: "brightness(0) invert(1)" }}
            />
          }
          title={
            sites.length === 0 && allCases.length === 0
              ? `Welcome to ${organization.name}!`
              : organization.name
          }
          description={
            sites.length === 0 && allCases.length === 0
              ? "Let’s get your firm set up in a few quick steps."
              : "Manage your organization details, users, and sites"
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
            {canEditOrganizationDetails && (
              <div className="absolute top-0 right-0 z-10">
                <IconButton
                  data-coach="org-edit-btn"
                  size="small"
                  onClick={handleMenuOpen}
                  sx={{
                    color: "text.secondary",
                    "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                  }}
                >
                  <MoreVertIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </div>
            )}

            {/* Replace Grid with div flex layout */}
            <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    marginTop: 0,
                  }}
                >
                  {/* Left column */}
                  <div
                    style={{
                      flex: "1 1 50%",
                      paddingRight: "16px",
                      minWidth: "250px",
                    }}
                  >
                    <>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 0.75,
                          mb: 1.5,
                        }}
                      >
                        <SegmentIcon
                          sx={{
                            fontSize: 14,
                            color: "#94a3b8",
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: "0.875rem",
                            color: "#64748b",
                          }}
                        >
                          Segments:
                        </Typography>
                        {organization.segments?.length ? (
                          organization.segments.map((segment) => (
                            <Typography
                              sx={{
                                fontSize: "0.875rem",
                                color: "#64748b",
                                ml: 0.5,
                                fontWeight: 500,
                              }}
                              key={`segment-${segment}`}
                            >
                              {segment}
                            </Typography>
                          ))
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No segments available
                          </Typography>
                        )}
                      </Box>
                      {organization.organizationKey && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1.5,
                          }}
                        >
                          <VpnKeyIcon
                            sx={{
                              fontSize: 14,
                              color: "#94a3b8",
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            sx={{ fontSize: "0.875rem", color: "#64748b" }}
                          >
                            Organization Key:{" "}
                            <Box
                              component="span"
                              sx={{ fontWeight: 500, color: "#475569" }}
                            >
                              {organization.organizationKey}
                            </Box>
                          </Typography>
                        </Box>
                      )}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                        }}
                      >
                        <CalendarIcon
                          sx={{
                            fontSize: 14,
                            color: "#94a3b8",
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          sx={{ fontSize: "0.875rem", color: "#64748b" }}
                        >
                          Created Date:{" "}
                          <Box
                            component="span"
                            sx={{ fontWeight: 500, color: "#475569" }}
                          >
                            {formatDisplayDate(organization.createdDate)}
                          </Box>
                        </Typography>
                      </Box>
                    </>
                  </div>

                  {/* Right column */}
                  <div
                    style={{
                      flex: "1 1 50%",
                      minWidth: "250px",
                    }}
                  >
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: "#64748b",
                          fontSize: "0.72rem",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          mb: 1,
                        }}
                      >
                        Contact Information
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <EmailIcon
                            sx={{
                              fontSize: 13,
                              color: "#94a3b8",
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            sx={{ fontSize: "0.875rem", color: "#475569" }}
                          >
                            {organization.emailId || "No email provided"}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <PhoneIcon
                            sx={{
                              fontSize: 13,
                              color: "#94a3b8",
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            sx={{ fontSize: "0.875rem", color: "#475569" }}
                          >
                            {organization.phoneNumber || "No phone provided"}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </div>
                </div>

                {/* Organization Description - full width, since it can run up to 500 characters */}
                {organization.description && (
                  <Box
                    sx={{
                      pt: 2.5,
                      mt: 2.5,
                      borderTop: "1px solid #f1f5f9",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        mb: 1,
                      }}
                    >
                      <DescriptionIcon
                        sx={{ fontSize: 14, color: "#94a3b8" }}
                      />
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: "#64748b",
                          fontSize: "0.72rem",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        Organization Description
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        color: "#475569",
                        fontSize: "0.875rem",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {organization.description}
                    </Typography>
                  </Box>
                )}
              </div>
        </PageHeaderCard>

        {/* ── Onboarding step cards — only when no sites and no cases ── */}
        {sites.length === 0 && allCases.length === 0 && (
          <Box sx={{ mt: 1 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              {/* Step 1 — Create a Site */}
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
                    src="/onboarding-site.svg"
                    alt="Create a site"
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
                    sx={{
                      fontWeight: 700,
                      color: "#1e293b",
                      fontSize: "1.1rem",
                    }}
                  >
                   Create a Site
                  </Typography>

                  <Typography
                    sx={{
                      color: "#475569",
                      fontSize: "0.9rem",
                      lineHeight: 1.7,
                    }}
                  >
                    To manage your cases and users, you first need to define a
                    primary location (your firm&apos;s physical or digital
                    office). A <strong>Site</strong> is your firm&apos;s office
                    or a practice area&apos;s dedicated workspace.
                  </Typography>

                  <Box sx={{ mt: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={() => setAddSiteModalOpen(true)}
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
                      Create Your First Site
                    </Button>
                  </Box>
                </Box>
              </div>

              {/* Step 2 — Add Users */}
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
                    sx={{
                      fontWeight: 700,
                      color: "#1e293b",
                      fontSize: "1.1rem",
                    }}
                  >
                    Add Users
                  </Typography>

                  <Typography
                    sx={{
                      color: "#475569",
                      fontSize: "0.9rem",
                      lineHeight: 1.7,
                      flex: 1,
                    }}
                  >
                    Invite your team members and assign them roles within the
                    site and the whole organization.
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
            </div>
          </Box>
        )}

        {/* ── Stats cards — shown once there are sites or cases ── */}
        {(sites.length > 0 || allCases.length > 0) && (
          <OrgStatsCards
            totalCases={allCases.length}
            casesThisMonth={
              allCases.filter((c) => {
                const d = new Date(c.createdDate ?? c.createdAt ?? "");
                const now = new Date();
                return (
                  d.getMonth() === now.getMonth() &&
                  d.getFullYear() === now.getFullYear()
                );
              }).length
            }
            activeUsers={users.length}
            upcomingHearings={getUpcomingHearingsCount()}
            resolvedCases={resolvedCases.length}
            showHearings={canViewHearings || isOrganizationClerk}
            onHearingsClick={onHearingsClick}
            onTotalCasesClick={handleTotalCasesClick}
            onActiveUsersClick={handleActiveUsersClick}
            onResolvedCasesClick={handleResolvedCasesClick}
          />
        )}

        {/* ── Chart area — placeholder panels until a case is added ── */}
        {allCases.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "24px",
              marginTop: sites.length > 0 ? "0" : "0",
            }}
          >
            {/* Left — case tracking placeholder */}
            <div
              style={{
                flex: "1 1 calc(50% - 8px)",
                minWidth: "280px",
                background:
                  "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
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
                sx={{
                  color: "#475569",
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                  maxWidth: 320,
                }}
              >
                Track your case status and distributions after completing the
                initial setup.
              </Typography>
            </div>

            {/* Right — firm growth placeholder */}
            <div
              style={{
                flex: "1 1 calc(50% - 8px)",
                minWidth: "280px",
                background:
                  "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
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
                alt="Firm growth"
                width={140}
                height={120}
                style={{ objectFit: "contain" }}
              />
              <Typography
                sx={{
                  color: "#475569",
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                  maxWidth: 320,
                }}
              >
                Follow your firm&apos;s growth and performance from a newly
                established site.
              </Typography>
            </div>
          </div>
        ) : (
          /* ── Actual charts once cases exist ── */
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "24px",
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                flex: "1 1 calc(50% - 8px)",
                minWidth: "280px",
                display: "flex",
              }}
            >
              <CaseStatusPieChart
                cases={allCases}
                organizationId={organizationId}
                isRestricted={isOrganizationClerk}
                onRestrictedClick={() => setCasesAuthModalOpen(true)}
              />
            </div>
            <div
              style={{
                flex: "1 1 calc(50% - 8px)",
                minWidth: "280px",
                display: "flex",
              }}
            >
              <FirmGrowthLineChart cases={allCases} />
            </div>
          </div>
        )}
      </Box>

      {/* Add dropdown menu */}
      <Menu
        anchorEl={addMenuAnchorEl}
        open={Boolean(addMenuAnchorEl)}
        onClose={handleAddMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: addMenuAnchorEl?.offsetWidth,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setAddUserModalOpen(true);
            handleAddMenuClose();
          }}
          sx={{ gap: 1 }}
        >
          <PersonAddIcon color="primary" fontSize="small" />
          Add User
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAddSiteModalOpen(true);
            handleAddMenuClose();
          }}
          sx={{ gap: 1 }}
        >
          <BusinessIcon color="primary" fontSize="small" />
          Add Site
        </MenuItem>
        {sites.length > 0 && (
          <MenuItem
            onClick={() => {
              setAddCaseModalOpen(true);
              handleAddMenuClose();
            }}
            sx={{ gap: 1 }}
          >
            <GavelIcon color="primary" fontSize="small" />
            Add Case
          </MenuItem>
        )}
      </Menu>

      {/* Menu for organization actions */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem
          onClick={() => {
            handleEditClick();
            handleMenuClose();
          }}
          sx={{ gap: 1 }}
        >
          <EditIcon fontSize="small" />
          Edit Organization
        </MenuItem>
        {canDeleteOrganization() && (
          <MenuItem
            onClick={handleDeleteClick}
            sx={{ gap: 1, color: "error.main" }}
          >
            <DeleteIcon fontSize="small" />
            Delete Organization
          </MenuItem>
        )}
      </Menu>

      {/* Edit Organization Modal */}
      <EditOrganizationModal
        open={isEditing}
        onClose={handleCancelEdit}
        onSave={handleSaveEdit}
        editFormData={editFormData}
        onInputChange={handleInputChange}
        onSegmentsChange={(segs) =>
          setEditFormData({ ...editFormData, segments: segs })
        }
        validationErrors={validationErrors}
        isSaving={isLoading}
      />

      {/* Delete Organization Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        entityType="organization"
        entityName={organization?.name}
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

      <AddSiteModal
        open={addSiteModalOpen}
        onClose={() => setAddSiteModalOpen(false)}
        onSuccess={() => {
          setAddSiteModalOpen(false);
          router.push(`/organization/${organizationId}/sites`);
        }}
        organizationId={organizationId}
      />

      <AddUserModal
        open={addUserModalOpen}
        onClose={() => setAddUserModalOpen(false)}
        onSuccess={() => {
          setAddUserModalOpen(false);
          router.push(`/organization/${organizationId}/users`);
        }}
        organizationId={organizationId}
        isOrgMode={true}
        canCreateAdmin={canEditOrganizationDetails}
        canCreateClerk={canEditOrganizationDetails}
      />

      <AddCaseModal
        open={addCaseModalOpen}
        onClose={() => setAddCaseModalOpen(false)}
        onSuccess={() => {
          setAddCaseModalOpen(false);
          router.push(`/organization/${organizationId}/cases`);
        }}
        organizationId={organizationId}
        isOrgMode={true}
        siteId={null}
      />

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
    </>
  );
}
