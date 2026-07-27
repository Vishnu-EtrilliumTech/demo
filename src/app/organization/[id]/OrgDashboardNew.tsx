"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { PieChart, TrendingUp, Lock } from "lucide-react";

import { LuiRoot, LoadingState, ErrorState, EmptyState, Card, Button, Dialog } from "@/design-system";
import {
  fetchOrganization,
  fetchOrganizationUsers,
  fetchOrganizationSites,
  fetchOrganizationCases,
  fetchOrganizationHearings,
  updateOrganization as updateOrganizationApi,
  deleteOrganization,
} from "@/app/organization/services/api";
import type { Organization, User, Case, Hearing, Site } from "@/app/organization/types";
import { setOrganizationRole } from "@/app/redux/searchProfile/profileSlice";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/contexts/ToastContext";
import { ValidationPatterns, ValidationMessages } from "@/utils";

import EditOrganizationModal from "@/components/modals/EditOrganizationModal";
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal";
import AddSiteDialog from "@/app/organization/components/modals/AddSiteDialog";
import AddUserDialog from "@/app/organization/components/modals/AddUserDialog";
import QuickAddCaseDialog from "@/app/organization/components/cases/QuickAddCaseDialog";

import DashboardHero from "@/app/organization/components/dashboard/DashboardHero";
import DashboardStats from "@/app/organization/components/dashboard/DashboardStats";
import DashboardOnboarding from "@/app/organization/components/dashboard/DashboardOnboarding";
import CasesByStatusCard from "@/app/organization/components/dashboard/CasesByStatusCard";
import FirmGrowthCard from "@/app/organization/components/dashboard/FirmGrowthCard";
import UpcomingHearingsCard from "@/app/organization/components/dashboard/UpcomingHearingsCard";
import BranchesCard from "@/app/organization/components/dashboard/BranchesCard";

interface ValidationErrors {
  [field: string]: string;
}

type EditForm = { name: string; email: string; phone: string; description: string; segments: string[] };

const VALID_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const column: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 16 };

/**
 * Design-system Organization Dashboard (flag `dashboard`). Rebuilds the legacy
 * org dashboard on the DS components while preserving its Phase-0 contract (§F):
 * same data loads, RBAC gating, org edit/delete, quick actions, and onboarding
 * empty state. The Cases-by-status pie is expressed as the design's meter; the
 * firm-growth line chart is preserved inside a DS card.
 */
export default function OrgDashboardNew({ params }: { params: Promise<{ id: string }> }) {
  const organizationId = use(params).id;
  const router = useRouter();
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();
  const { canEditOrganizationDetails, canViewHearings, isOrganizationClerk } = useUserRole(organizationId);

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [allCases, setAllCases] = useState<Case[]>([]);
  const [resolvedCases, setResolvedCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal + edit state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", email: "", phone: "", description: "", segments: [] });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addSiteOpen, setAddSiteOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addCaseOpen, setAddCaseOpen] = useState(false);
  const [casesRestricted, setCasesRestricted] = useState(false);
  const [hearingsRestricted, setHearingsRestricted] = useState(false);

  const loadAll = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const [orgResult, usersResult, sitesResult, hearingsResult] = await Promise.allSettled([
        fetchOrganization(organizationId),
        fetchOrganizationUsers(organizationId),
        fetchOrganizationSites(organizationId),
        fetchOrganizationHearings(organizationId),
      ]);
      if (orgResult.status === "rejected") throw orgResult.reason;
      const orgData = orgResult.value;
      setOrganization(orgData);
      if (usersResult.status === "fulfilled") setUsers(usersResult.value.items);
      if (sitesResult.status === "fulfilled") setSites(sitesResult.value.items);
      if (hearingsResult.status === "fulfilled") setHearings(hearingsResult.value.items);

      const [open, inProg, onHold, closed] = await Promise.allSettled([
        fetchOrganizationCases(organizationId, { status: "Open" }),
        fetchOrganizationCases(organizationId, { status: "InProgress" }),
        fetchOrganizationCases(organizationId, { status: "OnHold" }),
        fetchOrganizationCases(organizationId, { status: "Closed" }),
      ]);
      const items = (r: PromiseSettledResult<{ items: Case[] }>) => (r.status === "fulfilled" ? r.value.items : []);
      const resolved = items(closed);
      setAllCases([...items(open), ...items(inProg), ...items(onHold), ...resolved]);
      setResolvedCases(resolved);

      const orgRole = orgData.currentUser?.roles?.find(
        (r: string) => r === "OrganizationAdmin" || r === "OrganizationClerk",
      );
      if (orgRole) {
        dispatch(setOrganizationRole({ organizationRole: orgRole, organizationId, userId: orgData.currentUser.id }));
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching organization data:", err);
      setError("Failed to load organization details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, dispatch]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const casesThisMonth = allCases.filter((c) => {
    const d = new Date(c.createdDate ?? c.createdAt ?? "");
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const upcomingHearingsCount = hearings.filter((h) => new Date(h.hearingDateTime) > new Date()).length;
  const canDeleteOrg = organization?.currentUser?.roles?.includes("SystemAdmin") ?? false;

  const openEdit = () => {
    if (!organization) return;
    setEditForm({
      name: organization.name || "",
      email: organization.emailId || "",
      phone: String(organization.phoneNumber ?? ""),
      description: organization.description || "",
      segments: [...(organization.segments || [])],
    });
    setValidationErrors({});
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!organization) return;
    const errors: ValidationErrors = {};
    if (!editForm.name.trim()) errors.name = "Organization name is required";
    if (!editForm.email.trim()) errors.emailId = "Organization email is required";
    else if (!VALID_EMAIL.test(editForm.email.trim())) errors.emailId = "Please enter a valid email address.";
    if (!editForm.phone.trim()) errors.phoneNumber = "Phone number is required";
    else if (!ValidationPatterns.phone.test(editForm.phone.trim())) errors.phoneNumber = ValidationMessages.phone;
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    try {
      setIsSaving(true);
      setValidationErrors({});
      await updateOrganizationApi(String(organization.id), {
        name: editForm.name,
        emailId: editForm.email,
        phoneNumber: Number(editForm.phone) || 0,
        description: editForm.description,
        segments: editForm.segments,
        enabled: true,
      });
      setOrganization((prev) =>
        prev
          ? {
              ...prev,
              name: editForm.name,
              emailId: editForm.email,
              phoneNumber: Number(editForm.phone) || 0,
              description: editForm.description,
              segments: [...editForm.segments],
            }
          : prev,
      );
      showSuccess("Organization updated successfully");
      setIsEditing(false);
    } catch (err: unknown) {
      console.error("Error updating organization:", err);
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } };
        if (axiosErr.response?.status === 400 && axiosErr.response.data?.errors) {
          const apiErrors = axiosErr.response.data.errors;
          const mapped: ValidationErrors = {};
          Object.keys(apiErrors).forEach((k) => {
            const field = k.charAt(0).toLowerCase() + k.slice(1);
            if (apiErrors[k]?.length) mapped[field] = apiErrors[k][0];
          });
          setValidationErrors(mapped);
        } else {
          showError("Failed to update organization. Please try again.");
        }
      } else {
        showError("Failed to update organization. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!organization) return;
    try {
      await deleteOrganization(String(organization.id));
      setDeleteOpen(false);
      showSuccess("Organization deleted successfully");
      window.location.href = "/organization";
    } catch (err: unknown) {
      let message = "Failed to delete organization. Please try again.";
      if (err instanceof Error && err.message === "Not authorized to delete this organization") {
        message = "You do not have sufficient permissions to delete this organization. Only system administrators can delete organizations.";
      } else if (err instanceof Error && err.message === "Organization not found") {
        message = "Organization not found or has already been deleted.";
      }
      showError(message);
    }
  };

  // Stat click targets (OrgClerk → restricted dialog, mirrors legacy)
  const onTotalCases = () =>
    isOrganizationClerk ? setCasesRestricted(true) : router.push(`/organization/${organizationId}/cases`);
  const onResolvedCases = () =>
    isOrganizationClerk ? setCasesRestricted(true) : router.push(`/organization/${organizationId}/cases?status=Closed`);
  const onHearings = () =>
    isOrganizationClerk ? setHearingsRestricted(true) : router.push(`/organization/${organizationId}/hearings`);
  const onActiveUsers = () => router.push(`/organization/${organizationId}/users`);

  const shell = (children: React.ReactNode) => (
    <LuiRoot>
      <div className="sheet">{children}</div>
    </LuiRoot>
  );

  if (isLoading) return shell(<LoadingState message="Loading organization data…" />);
  if (error || !organization)
    return shell(
      <Card pad>
        <ErrorState
          title="Error loading organization data"
          description={error ?? "Unable to load organization information."}
          action={
            <Button variant="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      </Card>,
    );

  const empty = sites.length === 0 && allCases.length === 0;
  const hasCases = allCases.length > 0;

  return (
    <>
      {shell(
        <>
          <DashboardHero
            organization={organization}
            branchCount={sites.length}
            welcome={empty}
            canEdit={canEditOrganizationDetails}
            canDelete={canDeleteOrg}
            showAddCase={sites.length > 0}
            onEdit={openEdit}
            onDelete={() => setDeleteOpen(true)}
            onAddUser={() => setAddUserOpen(true)}
            onAddSite={() => setAddSiteOpen(true)}
            onAddCase={() => setAddCaseOpen(true)}
          />

          {empty && (
            <DashboardOnboarding onCreateSite={() => setAddSiteOpen(true)} onAddUsers={() => setAddUserOpen(true)} />
          )}

          {!empty && (
            <>
              <DashboardStats
                totalCases={allCases.length}
                casesThisMonth={casesThisMonth}
                activeUsers={users.length}
                resolvedCases={resolvedCases.length}
                upcomingHearings={upcomingHearingsCount}
                branchCount={sites.length}
                showHearings={canViewHearings || isOrganizationClerk}
                onTotalCasesClick={onTotalCases}
                onActiveUsersClick={onActiveUsers}
                onHearingsClick={onHearings}
                onResolvedCasesClick={onResolvedCases}
              />

              <div className="dash-grid" style={{ marginTop: 16 }}>
                <div style={column}>
                  {hasCases ? (
                    <>
                      <CasesByStatusCard
                        cases={allCases}
                        organizationId={organizationId}
                        isRestricted={isOrganizationClerk}
                        onRestrictedClick={() => setCasesRestricted(true)}
                      />
                      <FirmGrowthCard cases={allCases} />
                    </>
                  ) : (
                    <>
                      <Card pad>
                        <EmptyState
                          icon={PieChart}
                          title="Case status appears here"
                          description="Track case status and distribution once you add your first case."
                        />
                      </Card>
                      <Card pad>
                        <EmptyState
                          icon={TrendingUp}
                          title="Firm growth appears here"
                          description="Follow your firm's growth and performance from a newly established site."
                        />
                      </Card>
                    </>
                  )}
                </div>
                <div style={column}>
                  <UpcomingHearingsCard hearings={hearings} organizationId={organizationId} />
                  <BranchesCard sites={sites} organizationId={organizationId} />
                </div>
              </div>
            </>
          )}
        </>,
      )}

      {/* Modals reuse the existing (legacy) implementations to preserve behaviour. */}
      <EditOrganizationModal
        open={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={handleSaveEdit}
        editFormData={editForm}
        onInputChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
        }
        onSegmentsChange={(segs: string[]) => setEditForm((prev) => ({ ...prev, segments: segs }))}
        validationErrors={validationErrors}
        isSaving={isSaving}
      />
      <DeleteConfirmationModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        entityType="organization"
        entityName={organization.name}
      />
      <AddSiteDialog
        open={addSiteOpen}
        onClose={() => setAddSiteOpen(false)}
        onSuccess={() => {
          setAddSiteOpen(false);
          router.push(`/organization/${organizationId}/sites`);
        }}
        organizationId={organizationId}
      />
      <AddUserDialog
        open={addUserOpen}
        onClose={() => setAddUserOpen(false)}
        onSuccess={() => {
          setAddUserOpen(false);
          router.push(`/organization/${organizationId}/users`);
        }}
        organizationId={organizationId}
        isOrgMode={true}
        canCreateAdmin={canEditOrganizationDetails}
        canCreateClerk={canEditOrganizationDetails}
      />
      <QuickAddCaseDialog
        open={addCaseOpen}
        onClose={() => setAddCaseOpen(false)}
        onSuccess={() => router.push(`/organization/${organizationId}/cases`)}
        organizationId={organizationId}
        isOrgMode={true}
        siteId={null}
      />

      {/* Restricted-access dialogs (OrgClerk), rebuilt on the DS Dialog. */}
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
