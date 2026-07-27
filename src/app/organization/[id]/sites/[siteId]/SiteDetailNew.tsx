"use client";

import React, { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, PieChart, TrendingUp, UserPlus, Gavel, Lock, Plus } from "lucide-react";

import { LuiRoot, LoadingState, ErrorState, EmptyState, Card, Button, Dialog } from "@/design-system";
import {
  fetchSite,
  fetchSiteUsers,
  fetchSiteCases,
  fetchSiteHearings,
  deleteSite,
} from "@/app/organization/services/api";
import type { Site, User, Case, Hearing } from "@/app/organization/types";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/contexts/ToastContext";

import DashboardStats from "@/app/organization/components/dashboard/DashboardStats";
import CasesByStatusCard from "@/app/organization/components/dashboard/CasesByStatusCard";
import FirmGrowthCard from "@/app/organization/components/dashboard/FirmGrowthCard";
import SiteDetailHead from "./components/SiteDetailHead";

import AddUserDialog from "@/app/organization/components/modals/AddUserDialog";
import EditSiteDialog from "@/app/organization/components/modals/EditSiteDialog";
import ConfirmDialog from "@/app/organization/components/modals/ConfirmDialog";
import QuickAddCaseDialog from "@/app/organization/components/cases/QuickAddCaseDialog";

const column: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 16 };

const isClosed = (c: Case) => (c.status ? String(c.status).toLowerCase() === "closed" : false);
const isThisMonth = (c: Case) => {
  const d = new Date(c.createdDate ?? c.createdAt ?? "");
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

/**
 * Design-system Branch (site) detail dashboard — the DS re-skin of the legacy
 * `sites/[siteId]` page. Faithful to existing behaviour (no new tabs/lists): the
 * site header (details + expand), onboarding cards (empty state), KPI stats and
 * the two charts that navigate out to the Cases / Users / Hearings screens.
 * Reuses the existing site services + RBAC hook + shared dashboard components.
 * Gated behind the `branches` flag alongside the Branches list.
 */
export default function SiteDetailNew({ params }: { params: Promise<{ id: string; siteId: string }> }) {
  const { id: organizationId, siteId } = use(params);
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const {
    canViewHearings,
    isOrganizationClerk,
    canEditSites,
    canDeleteSites,
    isSiteAdmin,
    isSiteLegalExpert,
    isSiteSrLegalExpert,
  } = useUserRole(organizationId);

  // Site Admins + legal experts have no org-wide Sites list to go back to.
  const hideBack = isSiteLegalExpert || isSiteSrLegalExpert || isSiteAdmin;

  const [site, setSite] = useState<Site | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addCaseOpen, setAddCaseOpen] = useState(false);
  const [casesRestricted, setCasesRestricted] = useState(false);
  const [hearingsRestricted, setHearingsRestricted] = useState(false);

  const loadAll = useCallback(async () => {
    if (!organizationId || !siteId) return;
    setIsLoading(true);
    try {
      const [siteData, usersPage, hearingsPage, casesPage] = await Promise.all([
        fetchSite(organizationId, siteId),
        fetchSiteUsers(organizationId, siteId),
        fetchSiteHearings(organizationId, siteId),
        fetchSiteCases(organizationId, siteId),
      ]);
      setSite(siteData);
      setUsers(usersPage.items);
      setHearings(hearingsPage.items);
      setCases(casesPage.items);
      setError(null);
    } catch (err) {
      console.error("Error fetching site data:", err);
      setError("Failed to load site details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, siteId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Derived metrics (mirror the legacy OrgStatsCards inputs).
  const activeUsers = users.filter(
    (u) => !u.roles?.some((r) => r === "OrganizationAdmin" || r === "OrganizationClerk"),
  ).length;
  const resolvedCases = cases.filter(isClosed).length;
  const casesThisMonth = cases.filter(isThisMonth).length;

  // Stat click targets (OrgClerk → restricted dialog, mirrors legacy).
  const onTotalCases = () =>
    isOrganizationClerk
      ? setCasesRestricted(true)
      : router.push(`/organization/${organizationId}/cases?siteId=${siteId}`);
  const onResolvedCases = () =>
    isOrganizationClerk
      ? setCasesRestricted(true)
      : router.push(`/organization/${organizationId}/cases?status=Closed&siteId=${siteId}`);
  const onHearings = () =>
    isOrganizationClerk
      ? setHearingsRestricted(true)
      : router.push(`/organization/${organizationId}/sites/${siteId}/hearings`);
  const onActiveUsers = () => router.push(`/organization/${organizationId}/users?viewSiteId=${siteId}`);

  const handleDeleteConfirm = async () => {
    if (!site) return;
    try {
      await deleteSite(organizationId, siteId);
      setDeleteOpen(false);
      showSuccess("Site deleted successfully");
      router.push(`/organization/${organizationId}`);
    } catch (err: unknown) {
      let message = "Failed to delete site. Please try again.";
      if (err instanceof Error && err.message === "Not authorized to delete this site") {
        message = "You do not have sufficient permissions to delete this site.";
      } else if (err instanceof Error && err.message === "Site not found") {
        message = "Site not found or has already been deleted.";
      }
      showError(message);
    }
  };

  const shell = (children: React.ReactNode) => (
    <LuiRoot>
      <div className="sheet">{children}</div>
    </LuiRoot>
  );

  if (isLoading) return shell(<LoadingState message="Loading site data…" />);
  if (error)
    return shell(
      <Card pad>
        <ErrorState
          title="Error loading site data"
          description={error}
          action={
            <Button variant="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      </Card>,
    );
  if (!site)
    return shell(
      <Card pad>
        <ErrorState
          title="Site not found"
          description="The requested site could not be found or you do not have permission to view it."
          action={
            <Button variant="primary" onClick={() => router.push(`/organization/${organizationId}/sites`)}>
              Back to sites
            </Button>
          }
        />
      </Card>,
    );

  const empty = cases.length === 0;
  const showHearings = canViewHearings || isOrganizationClerk;

  return (
    <>
      {shell(
        <>
          {!hideBack && (
            <button
              type="button"
              className="meta-toggle"
              style={{ marginBottom: 12 }}
              onClick={() => router.push(`/organization/${organizationId}/sites`)}
            >
              <ArrowLeft width={14} height={14} /> Sites
            </button>
          )}

          <SiteDetailHead
            site={site}
            welcome={cases.length === 0 && users.length === 0}
            canEdit={canEditSites}
            canDelete={canDeleteSites}
            onEdit={() => setIsEditing(true)}
            onDelete={() => setDeleteOpen(true)}
            onAddUser={() => setAddUserOpen(true)}
            onAddCase={() => setAddCaseOpen(true)}
          />

          {empty && (
            <div className="dash-grid-even" style={{ marginBottom: 22 }}>
              <Card pad>
                <EmptyState
                  icon={UserPlus}
                  title="Add users"
                  description="Invite your team members and assign them roles within this site to start collaborating on cases."
                  action={
                    <Button variant="primary" icon={UserPlus} onClick={() => setAddUserOpen(true)}>
                      Add users
                    </Button>
                  }
                />
              </Card>
              <Card pad>
                <EmptyState
                  icon={Gavel}
                  title="Add a case"
                  description="Create your first case to start tracking matters, hearings, and documents within this site."
                  action={
                    <Button variant="primary" icon={Plus} onClick={() => setAddCaseOpen(true)}>
                      Add your first case
                    </Button>
                  }
                />
              </Card>
            </div>
          )}

          {!empty && (
            <DashboardStats
              totalCases={cases.length}
              casesThisMonth={casesThisMonth}
              activeUsers={activeUsers}
              resolvedCases={resolvedCases}
              upcomingHearings={hearings.length}
              branchCount={0}
              showHearings={showHearings}
              onTotalCasesClick={onTotalCases}
              onActiveUsersClick={onActiveUsers}
              onHearingsClick={onHearings}
              onResolvedCasesClick={onResolvedCases}
            />
          )}

          <div className={empty ? "dash-grid-even" : "dash-grid"} style={{ marginTop: 16 }}>
            {empty ? (
              <>
                <Card pad>
                  <EmptyState
                    icon={PieChart}
                    title="Case status appears here"
                    description="Track your case status and distribution once you add your first case."
                  />
                </Card>
                <Card pad>
                  <EmptyState
                    icon={TrendingUp}
                    title="Site growth appears here"
                    description="Follow your site's growth and performance once cases are created."
                  />
                </Card>
              </>
            ) : (
              <>
                <div style={column}>
                  <CasesByStatusCard
                    cases={cases}
                    organizationId={organizationId}
                    siteId={siteId}
                    isRestricted={isOrganizationClerk}
                    onRestrictedClick={() => setCasesRestricted(true)}
                  />
                </div>
                <div style={column}>
                  <FirmGrowthCard cases={cases} />
                </div>
              </>
            )}
          </div>
        </>,
      )}

      {/* Dialogs — DS re-skins reusing the existing services + form logic. */}
      <EditSiteDialog
        open={isEditing}
        onClose={() => setIsEditing(false)}
        onSuccess={() => {
          setIsEditing(false);
          loadAll();
        }}
        organizationId={organizationId}
        site={site}
      />

      <LuiRoot>
        <ConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDeleteConfirm}
          entityType="site"
          entityName={site.name}
        />
      </LuiRoot>

      <AddUserDialog
        open={addUserOpen}
        onClose={() => setAddUserOpen(false)}
        onSuccess={() => {
          setAddUserOpen(false);
          loadAll();
        }}
        organizationId={organizationId}
        isOrgMode={false}
        siteId={siteId}
        canCreateAdmin={canEditSites}
        canCreateClerk={canEditSites}
      />

      <QuickAddCaseDialog
        open={addCaseOpen}
        onClose={() => setAddCaseOpen(false)}
        onSuccess={() => {
          setAddCaseOpen(false);
          loadAll();
        }}
        organizationId={organizationId}
        isOrgMode={false}
        siteId={siteId}
      />

      {/* Restricted-access dialogs (OrgClerk), on the DS Dialog. */}
      <LuiRoot>
        <Dialog
          open={casesRestricted}
          onClose={() => setCasesRestricted(false)}
          title="Cases — restricted access"
          icon={Lock}
          small
          footer={
            <Button variant="primary" onClick={() => setCasesRestricted(false)}>
              Got it
            </Button>
          }
        >
          Your current role doesn&apos;t include access to case details. Please reach out to your Organization
          Administrator to request access.
        </Dialog>
        <Dialog
          open={hearingsRestricted}
          onClose={() => setHearingsRestricted(false)}
          title="Hearings — restricted access"
          icon={Lock}
          small
          footer={
            <Button variant="primary" onClick={() => setHearingsRestricted(false)}>
              Got it
            </Button>
          }
        >
          Your current role doesn&apos;t include access to hearing details. Please reach out to your Organization
          Administrator to request access.
        </Dialog>
      </LuiRoot>
    </>
  );
}
