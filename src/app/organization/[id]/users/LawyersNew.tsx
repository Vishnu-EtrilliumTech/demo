"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus } from "lucide-react";
import { LuiRoot, Button, LoadingState } from "@/design-system";
import { useUserRole } from "@/hooks/useUserRole";
import { UserManagementTabNew } from "@/app/organization/components/UserManagementTabNew";
import AddUserDialog from "@/app/organization/components/modals/AddUserDialog";

interface LawyersProps {
  orgId: string;
  viewSiteId?: string;
}

/**
 * DS Lawyers (Users) screen. Mirrors the legacy users page: dual org/site mode,
 * RBAC-gated Add, AddUserModal (MUI, kept until the legacy-removal pass) with the
 * same permission props. Body is the DS UserManagementTabNew.
 */
export default function LawyersNew({ orgId, viewSiteId }: LawyersProps) {
  const {
    isOrganizationAdmin, isOrganizationClerk, isSiteAdmin, isSiteClerk,
    isSiteSrLegalExpert, isSiteLegalExpert, currentUserId, isLoading: rolesLoading,
  } = useUserRole(orgId);

  const isOrgMode = !viewSiteId && (isOrganizationAdmin || isOrganizationClerk);
  const isSiteMode = !!viewSiteId || (isSiteAdmin || isSiteClerk || isSiteSrLegalExpert || isSiteLegalExpert);

  const [siteId, setSiteId] = useState<string | null>(viewSiteId || null);
  useEffect(() => {
    if (!viewSiteId && isSiteMode && !isOrgMode && currentUserId && !siteId) {
      import("@/app/organization/services/api").then(({ fetchOrganizationUserSites }) => {
        fetchOrganizationUserSites(orgId, currentUserId)
          .then((p) => { if (p.items.length > 0) setSiteId(String(p.items[0].id)); })
          .catch(console.error);
      });
    }
  }, [isSiteMode, isOrgMode, currentUserId, orgId, siteId, viewSiteId]);

  const [addOpen, setAddOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const canAddUser = isOrgMode
    ? isOrganizationAdmin || isOrganizationClerk
    : isSiteAdmin || isSiteClerk || isSiteSrLegalExpert || isSiteLegalExpert;
  const showSiteColumn = isOrganizationAdmin;

  const isReady = !rolesLoading && (isOrgMode || !!viewSiteId || (isSiteMode && !!siteId));

  return (
    <LuiRoot>
      <div className="sheet">
        <div className="page-head">
          <div className="ph-lead">
            <div className="eyebrow">
              <Users aria-hidden /> Team
            </div>
            <h1>Lawyers</h1>
            <div className="sub">{isSiteMode ? "Manage users for this site." : "Manage all lawyers and staff across your sites."}</div>
          </div>
          {canAddUser && (
            <div className="ph-actions">
              <Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>
                Add User
              </Button>
            </div>
          )}
        </div>

        {isReady ? (
          <UserManagementTabNew
            organizationId={orgId}
            siteId={siteId}
            refreshKey={refreshKey}
            showSiteColumn={showSiteColumn}
          />
        ) : (
          <LoadingState message="Loading users…" />
        )}

        <AddUserDialog
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSuccess={() => { setAddOpen(false); setRefreshKey((k) => k + 1); }}
          organizationId={orgId}
          isOrgMode={isOrgMode}
          siteId={siteId}
          canCreateAdmin={isOrgMode ? isOrganizationAdmin : isSiteAdmin && !isSiteClerk && !isSiteLegalExpert && !isSiteSrLegalExpert}
          canCreateClerk={isOrgMode ? true : !isSiteLegalExpert && !isSiteSrLegalExpert}
          hideHeadOffice={isOrganizationClerk && !isOrganizationAdmin}
        />
      </div>
    </LuiRoot>
  );
}
