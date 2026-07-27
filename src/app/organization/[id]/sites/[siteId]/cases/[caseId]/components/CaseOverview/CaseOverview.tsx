import React, { useState } from "react";
import { FileText, Users, SquareCheckBig, CalendarClock, Plus, ArrowRight, UserPlus } from "lucide-react";

import { Card, SectionHead, Button, Pill, LoadingState, type PillTone } from "@/design-system";
import {
  TaskStatus,
  HearingStatus,
  CaseClient,
  CaseTask,
  CaseHearing,
  AvailableUser,
  CaseContributor,
  ContributorAccessLevel,
} from "@/app/organization/types/caseindex";
import { useCaseData } from "../../hooks/useCaseData";
import { useCaseClients } from "../../hooks/useCaseClients";
import { useCaseTasks } from "../../hooks/useCaseTasks";
import { useCaseHearings } from "../../hooks/useCaseHearings";
import { CaseSummarySection } from "../CaseSummarySection";
import { ContributorsCard } from "../ContributorsWidget";
import EditCaseModal from "@/components/modals/EditCaseModal";
import AddClientModal from "@/components/modals/AddClientModal";
import AddTaskModal from "@/components/modals/AddTaskModal";
import HearingModal from "@/components/modals/HearingModal";
import { getCaseTabIndex } from "../../caseTabs";

interface CaseData {
  id: string;
  title: string;
  caseNumber: string;
  status: string;
  description?: string;
  assignedToId?: string;
  createdAt: string;
  updatedAt?: string;
  hasCnrNumber?: boolean;
}

// Contributors data is owned by the page (shared with access-control logic
// for the whole case), so the Overview tab receives it as props rather than
// fetching its own copy.
interface ContributorsProps {
  contributors: CaseContributor[];
  loadingContributors: boolean;
  mutatingContributors: boolean;
  canManageContributors: boolean;
  availableUsers: AvailableUser[];
  loadingAvailableUsers?: boolean;
  onAddContributor: (userId: string, accessLevel: ContributorAccessLevel) => Promise<boolean>;
  onUpdateContributor: (contributorId: string, accessLevel: ContributorAccessLevel) => Promise<boolean>;
  onRemoveContributor: (contributorId: string) => Promise<boolean>;
}

interface CaseOverviewContainerProps extends ContributorsProps {
  caseId: string;
  siteId: string;
  organizationId: string;
  onNavigateToTab?: (tabIndex: number) => void;
  onFilterHearings?: (status: string) => void;
  onFilterTasks?: (status: string) => void;
  canCreateOrEditResource?: boolean;
  /**
   * Called after a hearing add/update/delete, so the workspace header can
   * refresh its per-tab counts and "next hearing" KPI.
   */
  onHearingsChanged?: () => void;
}

interface CaseOverviewProps extends ContributorsProps {
  caseData: CaseData;
  clients: CaseClient[];
  tasks: CaseTask[];
  hearings: CaseHearing[];
  onEditClick: () => void;
  onNavigateToTab: (tabIndex: number) => void;
  onFilterTasks: (status: TaskStatus) => void;
  onFilterHearings: (status: HearingStatus) => void;
  onAddClientClick: () => void;
  onAddTaskClick: () => void;
  onAddHearingClick: () => void;
  caseId: string;
  siteId: string;
  organizationId: string;
  canCreateOrEditResource: boolean;
}

const humanize = (s: string) => s.replace(/([A-Z])/g, " $1").trim();

const TASK_TONE: Record<string, PillTone> = {
  [TaskStatus.Open]: "neutral",
  [TaskStatus.InProgress]: "brand",
  [TaskStatus.OnHold]: "warn",
  [TaskStatus.Blocked]: "danger",
};

/** Overview KPI/summary card: icon head, active count, clickable status pills, CTA. */
function OverviewCard({
  icon,
  title,
  activeLabel,
  chips,
  ctaLabel,
  ctaIcon,
  onCta,
  showCta,
}: {
  icon: typeof Users;
  title: string;
  activeLabel: React.ReactNode;
  chips: { key: string; label: string; tone: PillTone; onClick: () => void }[];
  ctaLabel: string;
  ctaIcon: typeof Plus;
  onCta: () => void;
  showCta: boolean;
}) {
  return (
    <Card pad className="ovcard">
      <div className="ovcard-top">
        <SectionHead icon={icon} title={title} />
        <div style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 12 }}>{activeLabel}</div>
        {chips.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.onClick}
                style={{ border: 0, background: "none", padding: 0, cursor: "pointer" }}
              >
                <Pill tone={c.tone} dot>
                  {c.label}
                </Pill>
              </button>
            ))}
          </div>
        )}
      </div>
      {showCta && (
        <Button variant="secondary" icon={ctaIcon} iconRight={ArrowRight} onClick={onCta}>
          {ctaLabel}
        </Button>
      )}
    </Card>
  );
}

const CaseOverviewPresentation: React.FC<CaseOverviewProps> = ({
  caseData,
  clients,
  tasks,
  hearings,
  onNavigateToTab,
  onFilterTasks,
  onFilterHearings,
  onAddClientClick,
  onAddTaskClick,
  onAddHearingClick,
  caseId,
  siteId,
  organizationId,
  canCreateOrEditResource,
  contributors,
  loadingContributors,
  mutatingContributors,
  canManageContributors,
  availableUsers,
  loadingAvailableUsers,
  onAddContributor,
  onUpdateContributor,
  onRemoveContributor,
}) => {
  const hasCnr = caseData?.hasCnrNumber ?? true;
  const activeTasks = tasks.filter((t) => t.status !== TaskStatus.Closed).length;
  const activeHearings = hearings.filter((h) => h.status !== HearingStatus.Completed).length;

  const taskChips = Object.values(TaskStatus)
    .filter((s) => s !== TaskStatus.Closed)
    .map((s) => ({ status: s, count: tasks.filter((t) => t.status === s).length }))
    .filter((x) => x.count > 0)
    .map((x) => ({
      key: x.status,
      label: `${humanize(x.status)}: ${x.count}`,
      tone: TASK_TONE[x.status] ?? "neutral",
      onClick: () => {
        onFilterTasks(x.status);
        onNavigateToTab(getCaseTabIndex("tasks", hasCnr));
      },
    }));

  const hearingChips = Object.values(HearingStatus)
    .filter((s) => s !== HearingStatus.Completed)
    .map((s) => ({ status: s, count: hearings.filter((h) => h.status === s).length }))
    .filter((x) => x.count > 0)
    .map((x) => ({
      key: x.status,
      label: `${humanize(x.status)}: ${x.count}`,
      tone: "brand" as PillTone,
      onClick: () => {
        onFilterHearings(x.status);
        onNavigateToTab(getCaseTabIndex("hearings", hasCnr));
      },
    }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card pad>
        <SectionHead icon={FileText} title="Case description" />
        <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, whiteSpace: "pre-line", margin: 0 }}>
          {caseData?.description || "No description provided"}
        </p>
      </Card>

      <CaseSummarySection caseId={caseId} siteId={siteId} organizationId={organizationId} />

      <div className="cgrid">
        <OverviewCard
          icon={Users}
          title="Clients"
          activeLabel={`${clients.length} client${clients.length === 1 ? "" : "s"}`}
          chips={[]}
          ctaLabel={clients.length > 0 ? "View clients" : "Add client"}
          ctaIcon={clients.length > 0 ? Users : UserPlus}
          onCta={() => (clients.length > 0 ? onNavigateToTab(getCaseTabIndex("clients", hasCnr)) : onAddClientClick())}
          showCta={clients.length > 0 || canCreateOrEditResource}
        />
        <OverviewCard
          icon={SquareCheckBig}
          title="Tasks"
          activeLabel={`${activeTasks} active`}
          chips={taskChips}
          ctaLabel={tasks.length > 0 ? "View tasks" : "Add task"}
          ctaIcon={tasks.length > 0 ? SquareCheckBig : Plus}
          onCta={() => (tasks.length > 0 ? onNavigateToTab(getCaseTabIndex("tasks", hasCnr)) : onAddTaskClick())}
          showCta={tasks.length > 0 || canCreateOrEditResource}
        />
        <OverviewCard
          icon={CalendarClock}
          title="Hearings"
          activeLabel={`${activeHearings} active`}
          chips={hearingChips}
          ctaLabel={hearings.length > 0 ? "View hearings" : "Add hearing"}
          ctaIcon={hearings.length > 0 ? CalendarClock : Plus}
          onCta={() => (hearings.length > 0 ? onNavigateToTab(getCaseTabIndex("hearings", hasCnr)) : onAddHearingClick())}
          showCta={hearings.length > 0 || canCreateOrEditResource}
        />
      </div>

      <ContributorsCard
        contributors={contributors}
        loading={loadingContributors}
        mutating={mutatingContributors}
        canManageContributors={canManageContributors}
        availableUsers={availableUsers}
        loadingAvailableUsers={loadingAvailableUsers}
        onAdd={onAddContributor}
        onUpdate={onUpdateContributor}
        onRemove={onRemoveContributor}
      />
    </div>
  );
};

// Container component - uses hooks internally
export const CaseOverview: React.FC<CaseOverviewContainerProps> = ({
  caseId,
  siteId,
  organizationId,
  onNavigateToTab,
  onFilterHearings,
  onFilterTasks,
  canCreateOrEditResource = true,
  contributors,
  loadingContributors,
  mutatingContributors,
  canManageContributors,
  availableUsers,
  loadingAvailableUsers,
  onAddContributor,
  onUpdateContributor,
  onRemoveContributor,
  onHearingsChanged,
}) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addClientModalOpen, setAddClientModalOpen] = useState(false);

  const caseHook = useCaseData(organizationId, siteId, caseId);
  const clientsHook = useCaseClients(organizationId, siteId, caseId);
  const tasksHook = useCaseTasks(organizationId, siteId, caseId, undefined, caseHook.siteUsers);
  const hearingsHook = useCaseHearings(
    organizationId,
    siteId,
    caseId,
    undefined,
    caseHook.siteUsers,
    undefined,
    undefined,
    onHearingsChanged,
  );

  if (!caseHook.caseData) {
    return <LoadingState message="Loading overview…" />;
  }

  const handleEditModalOpen = () => setEditModalOpen(true);
  const handleEditModalClose = () => setEditModalOpen(false);
  const handleEditSuccess = async () => {
    await caseHook.refetchCase();
  };

  const handleNavigateToTab = onNavigateToTab || (() => {});
  const handleFilterHearings = onFilterHearings || (() => {});
  const handleFilterTasks = onFilterTasks || (() => {});

  const handleAddClientClick = () => setAddClientModalOpen(true);
  const handleAddTaskClick = () => tasksHook.setShowAddTask(true);
  const handleAddHearingClick = () => hearingsHook.setShowAddHearing(true);

  return (
    <>
      <CaseOverviewPresentation
        caseData={caseHook.caseData}
        clients={clientsHook.clients}
        tasks={tasksHook.tasks}
        hearings={hearingsHook.hearings}
        onEditClick={handleEditModalOpen}
        onNavigateToTab={handleNavigateToTab}
        onFilterTasks={handleFilterTasks}
        onFilterHearings={handleFilterHearings}
        onAddClientClick={handleAddClientClick}
        onAddTaskClick={handleAddTaskClick}
        onAddHearingClick={handleAddHearingClick}
        caseId={caseId}
        siteId={siteId}
        organizationId={organizationId}
        canCreateOrEditResource={canCreateOrEditResource}
        contributors={contributors}
        loadingContributors={loadingContributors}
        mutatingContributors={mutatingContributors}
        canManageContributors={canManageContributors}
        availableUsers={availableUsers}
        loadingAvailableUsers={loadingAvailableUsers}
        onAddContributor={onAddContributor}
        onUpdateContributor={onUpdateContributor}
        onRemoveContributor={onRemoveContributor}
      />

      <EditCaseModal
        open={editModalOpen}
        onClose={handleEditModalClose}
        onSuccess={handleEditSuccess}
        organizationId={organizationId}
        siteId={siteId}
        caseData={caseHook.caseData}
        siteUsers={caseHook.siteUsers}
        loadingSiteUsers={caseHook.loadingSiteUsers}
      />

      <AddClientModal
        open={addClientModalOpen}
        onClose={() => setAddClientModalOpen(false)}
        onSuccess={clientsHook.refetchClients}
        organizationId={organizationId}
        siteId={siteId}
        caseId={caseId}
      />

      <AddTaskModal
        open={tasksHook.showAddTask}
        onClose={tasksHook.handleCloseAddTask}
        onSubmit={tasksHook.handleAddTask}
        formData={tasksHook.taskForm}
        onFormChange={tasksHook.handleTaskFormChange}
        errors={tasksHook.taskErrors}
        apiErrors={tasksHook.taskApiErrors}
        onSetApiErrors={tasksHook.setTaskApiErrors}
        isSubmitting={tasksHook.addingTask}
        siteUsers={caseHook.siteUsers}
        loadingSiteUsers={caseHook.loadingSiteUsers}
      />

      <HearingModal
        open={hearingsHook.showAddHearing}
        onClose={hearingsHook.handleCloseAddHearing}
        onSubmit={hearingsHook.handleAddHearing}
        title="Add Hearing"
        formData={hearingsHook.hearingForm}
        onFormChange={hearingsHook.handleHearingFormChange}
        errors={hearingsHook.hearingErrors}
        apiErrors={hearingsHook.hearingApiErrors}
        onSetApiErrors={hearingsHook.setHearingApiErrors}
        isSubmitting={hearingsHook.addingHearing}
        siteUsers={caseHook.siteUsers}
      />
    </>
  );
};
