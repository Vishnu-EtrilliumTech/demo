"use client";

import React, { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Home,
  Building2,
  MapPin,
  FolderOpen,
  Gavel,
  LayoutDashboard,
  Scale,
  Network,
  Users,
  SquareCheckBig,
  FileText,
  CalendarClock,
  MessageSquare,
  ReceiptText,
  Check,
} from "lucide-react";

import { LuiRoot, Card, Button, Tabs, Dialog, Input, LoadingState, ErrorState, EmptyState, type TabItem } from "@/design-system";
import {
  CaseOverview,
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
import CaseWorkspaceHead from "./components/CaseWorkspaceHead";
import QuickEditCaseDialog from "@/app/organization/components/cases/QuickEditCaseDialog";
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal";
import { useCaseData, useCaseContributors, useAvailableContributorUsers } from "./hooks";
import { useCaseMeta } from "./hooks/useCaseMeta";
import { getCaseTabKeys, type CaseTabKey } from "./caseTabs";
import { ContributorAccessLevel } from "@/app/organization/types/caseindex";
import { deleteCase } from "@/app/organization/services/api";
import { linkCnrCourtData } from "@/app/organization/services/ecourtapi";
import { useToast } from "@/contexts/ToastContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useCaseAccess } from "@/hooks/useCaseAccess";
import type { LucideIcon } from "lucide-react";

const TAB_META: Record<CaseTabKey, { label: string; icon: LucideIcon }> = {
  overview: { label: "Overview", icon: LayoutDashboard },
  ecourts: { label: "eCourts", icon: Scale },
  references: { label: "References", icon: Network },
  clients: { label: "Clients", icon: Users },
  tasks: { label: "Tasks", icon: SquareCheckBig },
  documents: { label: "Documents", icon: FileText },
  hearings: { label: "Hearings", icon: CalendarClock },
  comments: { label: "Comments", icon: MessageSquare },
  invoice: { label: "Invoice", icon: ReceiptText },
};

const QUERY_TAB: Record<string, CaseTabKey> = { tasks: "tasks", hearings: "hearings", references: "references" };

/**
 * Design-system Case Workspace shell (flag `case-workspace`). Re-chromes the
 * case-detail screen on the DS (LuiRoot scope, breadcrumbs, hero card, DS Tabs,
 * DS states + CNR dialog) while reusing every existing hook, the CaseHeader, and
 * all tab components verbatim — so 100% of behaviour (RBAC gating, contributors
 * auto-grant, CNR link, AI env-gating, all CRUD) is preserved (Phase-0 §H).
 */
export default function CaseWorkspaceNew({
  params,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ id: string; siteId: string; caseId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id: organizationId, siteId, caseId } = use(params);
  const searchParams = use(searchParamsPromise);
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { isOrganizationAdmin, isOrganizationClerk } = useUserRole(organizationId);
  const isOrgUser = isOrganizationAdmin || isOrganizationClerk;

  const [activeKey, setActiveKey] = useState<CaseTabKey>("overview");
  const [hearingStatusFilter, setHearingStatusFilter] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("");
  const [cnrOpen, setCnrOpen] = useState(false);
  const [cnrInput, setCnrInput] = useState("");
  const [cnrLinking, setCnrLinking] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { counts, nextHearing, refetch: refetchMeta } = useCaseMeta(organizationId, siteId, caseId);

  const {
    caseData,
    loading,
    error,
    assignedUserData,
    siteUsers,
    siteData,
    refetchCase,
  } = useCaseData(organizationId, siteId, caseId);

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

  const {
    availableUsers,
    loading: loadingAvailableUsers,
    refetch: refetchAvailableUsers,
  } = useAvailableContributorUsers(
    organizationId,
    siteId,
    caseId,
    access.canManageContributors || access.canCreateOrEditResource,
  );

  const handleAddContributor = useCallback(
    async (userId: string, accessLevel: ContributorAccessLevel): Promise<boolean> => {
      const ok = await addContributor(userId, accessLevel);
      await refetchAvailableUsers();
      return ok;
    },
    [addContributor, refetchAvailableUsers],
  );

  const handleContributorsChanged = useCallback(() => {
    void refetchContributors();
    void refetchAvailableUsers();
  }, [refetchContributors, refetchAvailableUsers]);

  const relatedUserIds = useMemo(() => {
    const eligibleIds = new Set(availableUsers.map((u) => u.id));
    return siteUsers.map((u) => u.id).filter((uid) => !eligibleIds.has(uid));
  }, [siteUsers, availableUsers]);

  const hasCnrNumber = caseData?.hasCnrNumber ?? true;
  const tabKeys = useMemo(() => getCaseTabKeys(hasCnrNumber), [hasCnrNumber]);

  useEffect(() => {
    const mapped = searchParams?.tab ? QUERY_TAB[searchParams.tab] : undefined;
    if (mapped && tabKeys.includes(mapped)) setActiveKey(mapped);
  }, [searchParams?.tab, tabKeys]);

  const changeTab = (key: string) => {
    const k = key as CaseTabKey;
    setActiveKey(k);
    if (k !== "hearings") setHearingStatusFilter("");
    if (k !== "tasks") setTaskStatusFilter("");
  };

  const closeCnrDialog = () => {
    setCnrOpen(false);
    setCnrInput("");
  };

  const handleLinkCnr = async () => {
    const trimmed = cnrInput.trim();
    if (!trimmed) return;
    setCnrLinking(true);
    try {
      await linkCnrCourtData(organizationId, siteId, caseId, trimmed);
      closeCnrDialog();
      showSuccess("CNR number linked successfully");
      await refetchCase();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Failed to link CNR number");
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
      showError(err instanceof Error ? err.message : "Failed to delete case. Please try again.");
    }
  };

  const shell = (children: React.ReactNode) => (
    <LuiRoot>
      <div className="sheet">{children}</div>
    </LuiRoot>
  );

  if (loading) return shell(<LoadingState message="Loading case details…" />);

  if (error) {
    const lower = error.toLowerCase();
    const permissionOrNotFound = ["not found", "permission", "authoriz", "403", "401"].some((s) => lower.includes(s));
    return shell(
      <Card pad>
        {permissionOrNotFound ? (
          <EmptyState
            icon={Gavel}
            title="No access to this case"
            description="This case could not be found, or you do not have permission to view it. If you believe you should have access, ask a case admin to add you as a contributor."
          />
        ) : (
          <ErrorState title="Error loading case" description={error} />
        )}
      </Card>,
    );
  }

  if (!caseData) {
    return shell(
      <Card pad>
        <EmptyState
          icon={Gavel}
          title="Case not found"
          description="The requested case could not be found or you do not have permission to view it."
        />
      </Card>,
    );
  }

  const countFor = (k: CaseTabKey): number | undefined =>
    ({ tasks: counts.tasks, documents: counts.documents, hearings: counts.hearings, references: counts.references, comments: counts.comments } as Record<string, number | undefined>)[k];
  const tabItems: TabItem[] = tabKeys.map((k) => ({ key: k, label: TAB_META[k].label, icon: TAB_META[k].icon, count: countFor(k) }));
  const showLinkCnr = !hasCnrNumber && access.canCreateOrEditResource && !caseData.cnrNumber;

  const renderTab = () => {
    switch (activeKey) {
      case "overview":
        return (
          <CaseOverview
            caseId={caseId}
            siteId={siteId}
            organizationId={organizationId}
            onNavigateToTab={(tabIndex: number) => setActiveKey(tabKeys[tabIndex] ?? "overview")}
            onFilterHearings={setHearingStatusFilter}
            onFilterTasks={setTaskStatusFilter}
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
            onHearingsChanged={refetchMeta}
          />
        );
      case "ecourts":
        return <EcourtTab caseId={caseId} siteId={siteId} organizationId={organizationId} cnrNumber={caseData.cnrNumber ?? ""} />;
      case "references":
        return (
          <ReferenceCaseTab
            caseId={caseId}
            siteId={siteId}
            organizationId={organizationId}
            canCreateOrEditResource={access.canCreateOrEditResource}
            canDeleteResource={access.canDeleteResource}
          />
        );
      case "clients":
        return (
          <ClientsTab
            caseId={caseId}
            siteId={siteId}
            organizationId={organizationId}
            canCreateOrEditResource={access.canCreateOrEditResource}
            canDeleteResource={access.canDeleteResource}
          />
        );
      case "tasks":
        return (
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
        );
      case "documents":
        return (
          <DocumentsTab
            caseId={caseId}
            siteId={siteId}
            organizationId={organizationId}
            canCreateOrEditResource={access.canCreateOrEditResource}
            canDeleteResource={access.canDeleteResource}
          />
        );
      case "hearings":
        return (
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
            onHearingsChanged={refetchMeta}
          />
        );
      case "comments":
        return (
          <CommentsTab
            caseId={caseId}
            siteId={siteId}
            organizationId={organizationId}
            canCreateOrEditResource={access.canCreateOrEditResource}
            canDeleteResource={access.canDeleteResource}
          />
        );
      case "invoice":
        return (
          <InvoiceTab
            caseId={caseId}
            siteId={siteId}
            organizationId={organizationId}
            canCreateOrEditResource={access.canCreateOrEditResource}
            canDeleteResource={access.canDeleteResource}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {shell(
        <>
          {/* Breadcrumbs */}
          <nav className="crumbs" aria-label="Breadcrumb" style={{ marginBottom: 18, flexWrap: "wrap" }}>
            {isOrgUser && (
              <>
                <Link href={`/organization/${organizationId}`}>
                  <Home width={15} height={15} /> Organization
                </Link>
                <ChevronRight aria-hidden />
                <Link href={`/organization/${organizationId}/sites`}>
                  <Building2 width={15} height={15} /> Sites
                </Link>
                <ChevronRight aria-hidden />
              </>
            )}
            {isOrgUser && siteData && (
              <>
                <Link href={`/organization/${organizationId}/sites/${siteId}`}>
                  <MapPin width={15} height={15} /> {siteData.name}
                </Link>
                <ChevronRight aria-hidden />
              </>
            )}
            <Link href={`/organization/${organizationId}/cases?siteId=${siteId}`}>
              <FolderOpen width={15} height={15} /> Cases
            </Link>
            <ChevronRight aria-hidden />
            <span className="cur" title={caseData.title}>
              {caseData.title}
            </span>
          </nav>

          {/* Case header + KPI strip */}
          <CaseWorkspaceHead
            caseData={caseData}
            siteData={siteData}
            assignedUser={assignedUserData}
            nextHearing={nextHearing}
            hasCnrNumber={hasCnrNumber}
            canEdit={access.canEditCase ?? false}
            canDelete={access.canDeleteCase ?? false}
            showLinkCnr={showLinkCnr}
            onEdit={() => setEditOpen(true)}
            onDelete={() => setDeleteOpen(true)}
            onEcourts={() => setActiveKey("ecourts")}
            onLinkCnr={() => setCnrOpen(true)}
          />

          {/* Tabs + body */}
          <Card className="lui-ws-tabs">
            <Tabs items={tabItems} activeKey={activeKey} onChange={changeTab} />
            <div style={{ padding: "18px 20px" }}>{renderTab()}</div>
          </Card>

          <CaseAIChat caseId={caseId} siteId={siteId} organizationId={organizationId} />
        </>,
      )}

      <LuiRoot>
        <Dialog
          open={cnrOpen}
          onClose={closeCnrDialog}
          title="Link CNR"
          subtitle="Connect this matter to its eCourts record"
          icon={Scale}
          small
          footer={
            <>
              <Button variant="secondary" onClick={closeCnrDialog} disabled={cnrLinking}>
                Cancel
              </Button>
              <Button variant="primary" icon={Check} loading={cnrLinking} disabled={!cnrInput.trim()} onClick={handleLinkCnr}>
                Link
              </Button>
            </>
          }
        >
          <Input
            placeholder="e.g. DLST010003252013"
            value={cnrInput}
            onChange={(e) => setCnrInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLinkCnr();
            }}
            autoFocus
          />
        </Dialog>
      </LuiRoot>

      {/* Edit reuses the DS Add/Edit case form (as a dialog); Delete reuses the existing modal. */}
      {editOpen && (
        <QuickEditCaseDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSuccess={refetchCase}
          organizationId={organizationId}
          siteId={siteId}
          seed={{
            id: caseData.id,
            title: caseData.title,
            caseNumber: caseData.caseNumber,
            cnrNumber: caseData.cnrNumber,
            caseKey: caseData.caseKey,
            status: caseData.status,
            description: caseData.description,
            assignedToId: caseData.assignedToId,
          }}
        />
      )}
      <DeleteConfirmationModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setDeleteOpen(false);
          await handleDeleteCase();
        }}
        entityType="case"
        entityName={caseData.caseNumber || caseData.title}
      />
    </>
  );
}
