import React, { useState } from "react";
import { Search, Plus, X, CalendarDays, MapPin, Gavel } from "lucide-react";
import {
  Button,
  Pill,
  DataTable,
  Pagination,
  LoadingState,
  EmptyState,
  Input,
  Select,
  type Column,
  type PillTone,
} from "@/design-system";
import {
  CaseHearing,
  AddCaseHearingRequest,
  UpdateCaseHearingRequest,
  HearingStatus,
} from "@/app/organization/types/caseindex";
import { User } from "@/app/organization/types";
import { HearingFiltersState } from "../../types";
import { useCaseHearings } from "../../hooks/useCaseHearings";
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal";
import { formatDisplayDateTime, getStatusLabel } from "@/utils";
import { useListQuery } from "@/hooks/useListQuery";
import type { CaseHearingListFilters } from "../../types/filterTypes";
import HearingModal from "@/components/modals/HearingModal";

// Container props interface
interface HearingsTabContainerProps {
  caseId: string;
  siteId: string;
  organizationId: string;
  siteUsers: User[];
  initialStatusFilter?: string;
  /** Show add/edit controls (resource ≥ Edit). Defaults to true. */
  canCreateOrEditResource?: boolean;
  /** Show delete controls (resource === Full). Defaults to true. */
  canDeleteResource?: boolean;
  /**
   * User ids for whom the "Case Access for Assignee" field is hidden — anyone
   * the backend would not auto-grant as a contributor: the creator, main
   * assignee, existing contributors, or an admin.
   */
  relatedUserIds?: string[];
  /**
   * Called after assigning a hearing, so the page can refresh the contributors
   * list (the backend may auto-grant the assignee as a contributor).
   */
  onContributorsChanged?: () => void;
  /**
   * Called after a hearing add/update/delete, so the workspace header can
   * refresh its per-tab counts and "next hearing" KPI.
   */
  onHearingsChanged?: () => void;
}

interface HearingsTabProps {
  canCreateOrEditResource: boolean;
  canDeleteResource: boolean;
  relatedUserIds: string[];
  // Hearing data
  hearings: CaseHearing[];
  loadingHearings: boolean;
  filteredHearings: CaseHearing[];

  // Hearing forms
  showAddHearing: boolean;
  addingHearing: boolean;
  updatingHearing: boolean;
  hearingForm: AddCaseHearingRequest;
  editHearingForm: UpdateCaseHearingRequest;

  // Hearing filters
  hearingFilters: HearingFiltersState;
  hasActiveHearingFilters: boolean;

  // Site users for assignment
  siteUsers: User[];

  // Delete hearing modal state
  deleteHearingModalOpen: boolean;
  hearingToDelete: CaseHearing | null;

  // Validation errors
  hearingErrors: Record<string, string>;
  editHearingErrors: Record<string, string>;
  hearingApiErrors: string[] | null;
  editHearingApiErrors: string[] | null;
  onSetHearingApiErrors: (errors: string[] | null) => void;
  onSetEditHearingApiErrors: (errors: string[] | null) => void;

  // Actions
  onSetShowAddHearing: (show: boolean) => void;
  onCloseAddHearing: () => void;
  onHearingFormChange: (
    field: keyof AddCaseHearingRequest,
    value: string | number | null,
  ) => void;
  onEditHearingFormChange: (
    field: keyof UpdateCaseHearingRequest,
    value: string | number | null,
  ) => void;
  onAddHearing: (onSuccess?: () => void) => Promise<void>;
  onUpdateHearing: (onSuccess?: () => void) => Promise<void>;
  onDeleteHearing: (hearing: CaseHearing) => void;
  onConfirmDeleteHearing: () => Promise<void>;
  onCloseDeleteHearingModal: () => void;
  onEditHearing: (hearing: CaseHearing) => void;
  onResetEditHearing: () => void;

  sortValue: string;
  onSortChange: (v: string) => void;

  // Filter actions
  onHearingFilterChange: (filterType: string, value: string) => void;
  onClearHearingFilters: () => void;
}

const HEARING_STATUS_TONE: Record<string, PillTone> = {
  [HearingStatus.Open]: "neutral",
  [HearingStatus.Scheduled]: "brand",
  [HearingStatus.PlanningInProgress]: "brand",
  [HearingStatus.Planned]: "ok",
  [HearingStatus.OnHold]: "warn",
  [HearingStatus.Appeared]: "brand",
  [HearingStatus.NotAppeared]: "danger",
  [HearingStatus.Completed]: "ok",
};

const HearingsTabPresentation: React.FC<HearingsTabProps> = ({
  canCreateOrEditResource,
  canDeleteResource,
  relatedUserIds,
  hearings,
  loadingHearings,
  filteredHearings,
  showAddHearing,
  addingHearing,
  updatingHearing,
  hearingForm,
  editHearingForm,
  hearingFilters,
  hasActiveHearingFilters,
  siteUsers,
  deleteHearingModalOpen,
  hearingToDelete,
  hearingErrors,
  editHearingErrors,
  hearingApiErrors,
  editHearingApiErrors,
  onSetHearingApiErrors,
  onSetEditHearingApiErrors,
  onSetShowAddHearing,
  onCloseAddHearing,
  onHearingFormChange,
  onEditHearingFormChange,
  onAddHearing,
  onUpdateHearing,
  onDeleteHearing,
  onConfirmDeleteHearing,
  onCloseDeleteHearingModal,
  onEditHearing,
  onResetEditHearing,
  sortValue,
  onSortChange,
  onHearingFilterChange,
  onClearHearingFilters,
}) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [hearingBeingEdited, setHearingBeingEdited] = useState<CaseHearing | null>(null);

  const handleEditClick = (hearing: CaseHearing) => {
    onEditHearing(hearing);
    setHearingBeingEdited(hearing);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setHearingBeingEdited(null);
    onResetEditHearing();
  };

  const handleDeleteFromModal = () => {
    if (hearingBeingEdited) onDeleteHearing(hearingBeingEdited);
  };

  const handleConfirmDeleteAndClose = async () => {
    await onConfirmDeleteHearing();
    setEditModalOpen(false);
    setHearingBeingEdited(null);
  };

  const canOpenHearing = canCreateOrEditResource || canDeleteResource;
  const assigneeName = (id?: string) =>
    id ? siteUsers.find((u) => u.id === id)?.fullName || "Unknown" : "Unassigned";

  const columns: Column<CaseHearing>[] = [
    {
      key: "date",
      header: "Date & Time",
      render: (h) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <CalendarDays width={14} height={14} style={{ color: "var(--text-3)" }} aria-hidden />
          {formatDisplayDateTime(h.hearingDateTime)}
        </span>
      ),
    },
    {
      key: "courtName",
      header: "Court",
      render: (h) => {
        const locationDisplay = h.courtLocationDisplay || h.courtName;
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              maxWidth: 280,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={locationDisplay || ""}
          >
            <MapPin width={14} height={14} style={{ color: "var(--text-3)", flexShrink: 0 }} aria-hidden />
            {locationDisplay}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (h) => (
        <Pill tone={HEARING_STATUS_TONE[h.status] ?? "neutral"} dot>
          {getStatusLabel(h.status)}
        </Pill>
      ),
    },
    { key: "assignee", header: "Assigned to", render: (h) => assigneeName(h.assignedToId) },
    {
      key: "notes",
      header: "Notes",
      render: (h) => (
        <span
          style={{
            display: "inline-block",
            maxWidth: 220,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "var(--text-2)",
          }}
          title={h.notes || "No notes"}
        >
          {h.notes || "No notes"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="toolbar">
        {canCreateOrEditResource && (
          <Button variant="primary" icon={Plus} onClick={() => onSetShowAddHearing(true)}>
            Add hearing
          </Button>
        )}
        <div className="search">
          <Search aria-hidden />
          <Input
            type="text"
            value={hearingFilters.searchQuery || ""}
            onChange={(e) => onHearingFilterChange("searchQuery", e.target.value)}
            placeholder="Search hearings…"
          />
        </div>
        <div className="selectbox">
          <Select aria-label="Sort" value={sortValue} onChange={(e) => onSortChange(e.target.value)}>
            <option value="">Default sort</option>
            <option value="hearingDate:asc">Hearing date ↑</option>
            <option value="hearingDate:desc">Hearing date ↓</option>
            <option value="createdDate:desc">Newest first</option>
            <option value="createdDate:asc">Oldest first</option>
          </Select>
        </div>
        {hasActiveHearingFilters && (
          <Button variant="ghost" icon={X} onClick={onClearHearingFilters}>
            Clear
          </Button>
        )}
      </div>

      {loadingHearings ? (
        <LoadingState message="Loading hearings…" />
      ) : hearings.length > 0 ? (
        filteredHearings.length === 0 ? (
          <EmptyState icon={Gavel} title="No hearings match the filters" description="Try adjusting your filter criteria." />
        ) : (
          <DataTable
            columns={columns}
            rows={filteredHearings}
            getRowKey={(h) => String(h.id)}
            onRowClick={canOpenHearing ? (h) => handleEditClick(h) : undefined}
          />
        )
      ) : (
        <EmptyState
          icon={Gavel}
          title="No hearings scheduled"
          description={
            canCreateOrEditResource
              ? "Schedule the first hearing for this case."
              : "No hearings have been scheduled for this case."
          }
          action={
            canCreateOrEditResource ? (
              <Button variant="primary" icon={Plus} onClick={() => onSetShowAddHearing(true)}>
                Add hearing
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Add Hearing Modal */}
      <HearingModal
        open={showAddHearing}
        onClose={onCloseAddHearing}
        onSubmit={onAddHearing}
        title="Add Hearing"
        formData={hearingForm}
        onFormChange={onHearingFormChange}
        errors={hearingErrors}
        apiErrors={hearingApiErrors}
        onSetApiErrors={onSetHearingApiErrors}
        isSubmitting={addingHearing}
        siteUsers={siteUsers}
        relatedUserIds={relatedUserIds}
      />

      {/* Edit Hearing Modal */}
      <HearingModal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        onSubmit={onUpdateHearing}
        title="Edit Hearing"
        formData={editHearingForm}
        onFormChange={onEditHearingFormChange}
        errors={editHearingErrors}
        apiErrors={editHearingApiErrors}
        onSetApiErrors={onSetEditHearingApiErrors}
        isSubmitting={updatingHearing}
        siteUsers={siteUsers}
        relatedUserIds={relatedUserIds}
        canDelete={canDeleteResource}
        onDelete={handleDeleteFromModal}
      />

      {/* Delete Hearing Modal */}
      <DeleteConfirmationModal
        open={deleteHearingModalOpen}
        onClose={onCloseDeleteHearingModal}
        onConfirm={handleConfirmDeleteAndClose}
        entityType="hearing"
        entityName={hearingToDelete?.courtLocationDisplay || hearingToDelete?.courtName}
      />
    </div>
  );
};

// Container component
export const HearingsTab: React.FC<HearingsTabContainerProps> = ({
  caseId,
  siteId,
  organizationId,
  siteUsers,
  initialStatusFilter,
  canCreateOrEditResource = true,
  canDeleteResource = true,
  relatedUserIds = [],
  onContributorsChanged,
  onHearingsChanged,
}) => {
  const { params, state, setPage, setSort, clearSort } = useListQuery<CaseHearingListFilters>({
    defaultSort: { sortBy: "hearingDate", sortDirection: "asc" },
    sortableFields: ["hearingDate", "createdDate"],
    filterKeys: [],
  });
  const hearingsHook = useCaseHearings(
    organizationId,
    siteId,
    caseId,
    initialStatusFilter,
    siteUsers,
    onContributorsChanged,
    params,
    onHearingsChanged,
  );
  const meta = hearingsHook.hearingsMeta;

  const sortValue = state.sortBy ? `${state.sortBy}:${state.sortDirection ?? 'asc'}` : '';
  const handleSortChange = (val: string) => {
    if (!val) { clearSort(); return; }
    const [field, dir] = val.split(':');
    setSort(field, dir as 'asc' | 'desc');
  };

  return (
    <>
    <HearingsTabPresentation
      canCreateOrEditResource={canCreateOrEditResource}
      canDeleteResource={canDeleteResource}
      relatedUserIds={relatedUserIds}
      hearings={hearingsHook.hearings}
      loadingHearings={hearingsHook.loadingHearings}
      filteredHearings={hearingsHook.filteredHearings}
      showAddHearing={hearingsHook.showAddHearing}
      addingHearing={hearingsHook.addingHearing}
      updatingHearing={hearingsHook.updatingHearing}
      hearingForm={hearingsHook.hearingForm}
      editHearingForm={hearingsHook.editHearingForm}
      hearingFilters={hearingsHook.hearingFilters}
      hasActiveHearingFilters={hearingsHook.hasActiveHearingFilters}
      siteUsers={siteUsers}
      deleteHearingModalOpen={hearingsHook.deleteHearingModalOpen}
      hearingToDelete={hearingsHook.hearingToDelete}
      hearingErrors={hearingsHook.hearingErrors}
      editHearingErrors={hearingsHook.editHearingErrors}
      hearingApiErrors={hearingsHook.hearingApiErrors}
      editHearingApiErrors={hearingsHook.editHearingApiErrors}
      onSetShowAddHearing={hearingsHook.setShowAddHearing}
      onCloseAddHearing={hearingsHook.handleCloseAddHearing}
      onHearingFormChange={hearingsHook.handleHearingFormChange}
      onEditHearingFormChange={hearingsHook.handleEditHearingFormChange}
      onAddHearing={hearingsHook.handleAddHearing}
      onUpdateHearing={hearingsHook.handleUpdateHearing}
      onDeleteHearing={hearingsHook.handleDeleteHearing}
      onConfirmDeleteHearing={hearingsHook.confirmDeleteHearing}
      onCloseDeleteHearingModal={hearingsHook.handleCloseDeleteHearingModal}
      onEditHearing={hearingsHook.handleEditHearing}
      onResetEditHearing={hearingsHook.resetEditHearing}
      sortValue={sortValue}
      onSortChange={handleSortChange}
      onHearingFilterChange={hearingsHook.handleHearingFilterChange}
      onClearHearingFilters={hearingsHook.clearHearingFilters}
      onSetHearingApiErrors={hearingsHook.setHearingApiErrors}
      onSetEditHearingApiErrors={hearingsHook.setEditHearingApiErrors}
    />
    {meta && meta.totalCount > 0 && (
      <div className="tbl-foot" style={{ marginTop: 14 }}>
        <span className="cnt">
          {meta.totalCount} hearing{meta.totalCount === 1 ? "" : "s"}
        </span>
        <Pagination page={state.page} totalPages={meta.totalPages} onPageChange={setPage} disabled={hearingsHook.loadingHearings} />
      </div>
    )}
    </>
  );
};
