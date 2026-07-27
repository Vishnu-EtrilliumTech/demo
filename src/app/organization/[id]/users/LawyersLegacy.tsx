"use client";

import React, { useState, useEffect } from "react";
import { useHasScrollbar } from "@/hooks/useHasScrollbar";
import { Box, Typography, Button, Paper, CircularProgress } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { useUserRole } from "@/hooks/useUserRole";
import UserManagementTab from "@/app/organization/components/UserManagementTab";
import AddUserModal from "@/components/modals/AddUserModal";

interface LawyersLegacyProps {
  orgId: string;
  viewSiteId?: string;
}

export default function LawyersLegacy({ orgId, viewSiteId }: LawyersLegacyProps) {
  const hasScrollbar = useHasScrollbar();
  const organizationId = orgId;

  // Role flags – used to determine scope (organization vs site)
  const {
    isOrganizationAdmin,
    isOrganizationClerk,
    isSiteAdmin,
    isSiteClerk,
    isSiteSrLegalExpert,
    isSiteLegalExpert,
    currentUserId,
    isLoading: rolesLoading,
  } = useUserRole(organizationId);

  // Get siteId from query params if provided (overrides role-based logic).
  // Uses a distinct key (viewSiteId) from the org-mode "Site" list filter's
  // own `siteId` query param, so filtering by site doesn't get mistaken for
  // this site-mode navigation link (see Sites tab "Active Users" deep link).
  const querySiteId: string | undefined = viewSiteId;

  // Determine if we are in organization mode or site mode
  // If siteId is provided in query params, force site mode
  const isOrgMode = !querySiteId && (isOrganizationAdmin || isOrganizationClerk);
  const isSiteMode = !!querySiteId || (isSiteAdmin || isSiteClerk || isSiteSrLegalExpert || isSiteLegalExpert);

  // For site mode, we need the siteId of the current user's site.
  // We'll fetch it once when in site mode and no query siteId is provided.
  const [siteId, setSiteId] = useState<string | null>(querySiteId || null);
  useEffect(() => {
  if (!querySiteId && isSiteMode && !isOrgMode && currentUserId && !siteId) {
    import("@/app/organization/services/api").then(
      ({ fetchOrganizationUserSites }) => {
        fetchOrganizationUserSites(organizationId, currentUserId)
          .then((sitesPage) => {
            if (sitesPage.items.length > 0) setSiteId(String(sitesPage.items[0].id));
          })
          .catch(console.error);
      }
    );
  }
}, [isSiteMode, isOrgMode, currentUserId, organizationId, siteId, querySiteId]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddUserSuccess = () => {
    setAddModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  // Permission for add button
  const canAddUser = isOrgMode
    ? isOrganizationAdmin || isOrganizationClerk // canManageOrganizationUsers from hook
    : isSiteAdmin || isSiteClerk || isSiteSrLegalExpert || isSiteLegalExpert;

  // Site column should be visible only to Organization Admins
  const showSiteColumn = isOrganizationAdmin;

  // Don't render the users tab (and its data fetches) until we definitively know
  // whether this is org mode or site mode — otherwise it briefly mounts with
  // siteId=null and fires the org-level users/sites calls for site-level roles.
  const isReady = !rolesLoading && (isOrgMode || !!querySiteId || (isSiteMode && !!siteId));

  return (
    <Box sx={{ pl: { xs: 2, sm: 3 }, pr: { xs: 2, sm: hasScrollbar ? 4 : 5 }, py:3 }}>
      {/* Page Header – exactly like Sites page */}
      <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexWrap: 'wrap',
                gap: 1.5,
                background: 'linear-gradient(135deg, rgba(20,184,166,0.08) 0%, rgba(59,130,246,0.05) 100%)',
                borderRadius: '16px',
                p: '16px 20px',
                mb: 3,
              }}
            >
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}
          >
            Users
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            {isSiteMode ? "Manage users for this site" : "Manage all users across sites"}
          </Typography>
        </Box>
        {canAddUser && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddModalOpen(true)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "12px",
              px: 2.5,
              py: 1,
              bgcolor: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
              '&:hover': {
                bgcolor: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                boxShadow: '0 4px 12px rgba(217,119,6,0.35)',
              },
            }}
          >
            Add User
          </Button>
        )}
      </Box>

      {/* Main content – same Paper wrapper as Sites page */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          background: "white",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {isReady ? (
          <UserManagementTab
            organizationId={organizationId}
            siteId={siteId} // if null, fetch org users; else fetch site users
            hideAddButton={true} // add button is in page header
            refreshKey={refreshKey}
            showSiteColumn={showSiteColumn} // only organization admins see site column
          />
        ) : (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </Paper>

      {/* Add User Modal – controlled by page header button */}
      <AddUserModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleAddUserSuccess}
        organizationId={organizationId}
        isOrgMode={isOrgMode}
        siteId={siteId}
        canCreateAdmin={
          isOrgMode
            ? isOrganizationAdmin
            : isSiteAdmin &&
              !isSiteClerk &&
              !isSiteLegalExpert &&
              !isSiteSrLegalExpert
        }
        canCreateClerk={
          isOrgMode ? true : !isSiteLegalExpert && !isSiteSrLegalExpert
        }
        hideHeadOffice={isOrganizationClerk && !isOrganizationAdmin}
      />
    </Box>
  );
}
