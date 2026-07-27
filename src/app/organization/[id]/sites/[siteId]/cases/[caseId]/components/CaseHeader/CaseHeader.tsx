import React, { useState } from "react";
import {
  Box,
  CardContent,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Typography
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PersonIcon from "@mui/icons-material/Person";
import TagIcon from "@mui/icons-material/Tag";
import InfoIcon from "@mui/icons-material/Info";
import CalendarIcon from "@mui/icons-material/CalendarToday";
import DescriptionIcon from "@mui/icons-material/Description";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import { CaseStatus, User } from "@/app/organization/types";
import { useUserRole } from "@/hooks/useUserRole";
import { getStatusLabel, formatDisplayDate } from "@/utils";
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal";
import EditCaseModal from "@/components/modals/EditCaseModal"; // adjust path as needed

interface CaseData {
  id: string;
  title: string;
  caseNumber: string;
  caseKey?: string;
  cnrNumber?: string;
  hasCnrNumber?: boolean;
  status: CaseStatus;
  description?: string;
  assignedToId?: string;
  createdAt: string;
  createdDate?: string;
  updatedAt?: string;
}

interface EditTitleFormState {
  title: string;
  caseNumber: string;
  status: CaseStatus;
  assignedTo: string;
}

interface CaseHeaderProps {
  caseData: CaseData;
  assignedUserData?: User;
  siteUsers: User[];
  loadingAssignedUser: boolean;
  loadingSiteUsers: boolean;
  organizationId: string;
  siteId: string;
  onCaseUpdated?: () => void; 
  onDeleteCase?: () => void; 
  isEditingTitle?: boolean;
  isLoadingTitle?: boolean;
  editTitleForm?: EditTitleFormState;
  onBack?: () => void;
  onEditTitleClick?: () => void;
  onCancelTitleEdit?: () => void;
  onSaveTitleEdit?: () => Promise<void>;
  onEditTitleFormChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string | number } }) => void;
  titleFieldErrors?: Record<string, string>;
  titleEditError?: string | null;
  /** Computed case-access override: show case-edit affordances (entity ≥ Edit). */
  canEditCase?: boolean;
  /** Computed case-access override: show Delete Case (entity === Full). */
  canDeleteCase?: boolean;
}

export const CaseHeader: React.FC<CaseHeaderProps> = ({
  caseData,
  assignedUserData,
  siteUsers,
  loadingAssignedUser,
  loadingSiteUsers,
  organizationId,
  siteId,
  onCaseUpdated,
  onDeleteCase,
  canEditCase: canEditCaseProp,
  canDeleteCase: canDeleteCaseProp,
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Get user role permissions
  const { canEditCases, canDeleteCases } = useUserRole(organizationId);

  // Prefer the computed case-access override when provided (US2 gating);
  // fall back to role-based flags otherwise. Controls are hidden, not disabled.
  const canEditCase = canEditCaseProp ?? canEditCases;
  const canDeleteCase = canDeleteCaseProp ?? canDeleteCases;


  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEditClick = () => {
    setEditModalOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    if (onDeleteCase) {
      onDeleteCase();
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleEditSuccess = () => {
    if (onCaseUpdated) {
      onCaseUpdated();
    }
  };

  return (
    <>
      <Box
        sx={{
          mb: 0,
          boxShadow: "none",
          border: "none",
          background: "transparent",
          position: "relative",
        }}
      >
        <CardContent
          sx={{
            position: "relative",
            zIndex: 1,
            p: 0,
            "&:last-child": { pb: 0 },
          }}
        >
          <div className="relative">
            {/* Three Dots Menu inside dropdown */}
            {(canEditCase || canDeleteCase) && (
              <div className="absolute top-0 right-0 z-10">
                <IconButton
                  data-coach="case-edit-btn"
                  size="small"
                  onClick={handleMenuOpen}
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

            {/* Case Details Grid - 2-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Column 1: Case Details */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Case Details
                </p>
                {caseData.caseKey && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <TagIcon
                      sx={{ fontSize: 13 }}
                      className="text-slate-400 flex-shrink-0"
                    />
                    <span>
                      Case Key:{" "}
                      <span className="font-mono font-medium text-slate-700">
                        {caseData.caseKey}
                      </span>
                    </span>
                  </div>
                )}
                {caseData.hasCnrNumber && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <TagIcon
                      sx={{ fontSize: 13 }}
                      className="text-slate-400 flex-shrink-0"
                    />
                    <span>
                      CNR Number:{" "}
                      <span className="font-mono font-medium text-slate-700">
                        {caseData.cnrNumber || "—"}
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
                      {caseData.createdDate
                        ? formatDisplayDate(caseData.createdDate)
                        : "N/A"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Column 2: Assignment */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Assignment
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <PersonIcon
                    sx={{ fontSize: 13 }}
                    className="text-slate-400 flex-shrink-0"
                  />
                  {loadingAssignedUser ? (
                    <CircularProgress size={12} />
                  ) : (
                    <span>{assignedUserData?.fullName || "Unassigned"}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <InfoIcon
                    sx={{ fontSize: 13 }}
                    className="text-slate-400 flex-shrink-0"
                  />
                  <Chip
                    label={getStatusLabel(caseData.status)}
                    size="small"
                    color={
                      caseData.status === "Open"
                        ? "default"
                        : caseData.status === "InProgress"
                          ? "primary"
                          : caseData.status === "OnHold"
                            ? "warning"
                            : caseData.status === "Closed"
                              ? "success"
                              : "default"
                    }
                    sx={{
                      fontSize: "0.75rem",
                      height: "24px",
                      fontWeight: 500,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Case Description - full width, since it can run up to 500 characters */}
            {caseData.description && (
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
                      sx={{ fontSize: 14 }}
                      className="text-slate-400"
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
                      Description
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
                  {caseData.description}
                </Typography>
              </Box>
            )}
          </div>
        </CardContent>

        {/* Case Actions Menu */}
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
          {canEditCase && (
            <MenuItem onClick={handleEditClick} sx={{ gap: 1 }}>
              <EditIcon fontSize="small" />
              Edit Case
            </MenuItem>
          )}
          {canDeleteCase && (
            <MenuItem
              onClick={handleDeleteClick}
              sx={{ gap: 1, color: "error.main" }}
            >
              <DeleteIcon fontSize="small" />
              Delete Case
            </MenuItem>
          )}
          {!canEditCase && !canDeleteCase && (
            <MenuItem disabled sx={{ gap: 1 }}>
              <InfoIcon fontSize="small" />
              No actions available
            </MenuItem>
          )}
        </Menu>

        {/* Delete Case Confirmation Modal */}
        <DeleteConfirmationModal
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          entityType="case"
          entityName={caseData.caseNumber || caseData.title}
        />
      </Box>

      {/* Edit Case Modal */}
      <EditCaseModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        organizationId={organizationId}
        siteId={siteId}
        caseData={caseData}
        siteUsers={siteUsers}
        loadingSiteUsers={loadingSiteUsers}
      />
    </>
  );
};
