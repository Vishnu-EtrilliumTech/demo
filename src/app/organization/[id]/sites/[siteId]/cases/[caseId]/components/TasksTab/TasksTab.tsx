import React from "react";
import { useCaseTasks } from "../../hooks/useCaseTasks";
import { useListQuery } from "@/hooks/useListQuery";
import { Search, Plus, X, CalendarDays, Paperclip, SquareCheckBig } from "lucide-react";
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
import type { TaskListFilters } from "../../types/filterTypes";
import {
  CaseTask,
  AddCaseTaskRequest,
  UpdateCaseTaskRequest,
  TaskStatus,
  TaskDocument,
} from "@/app/organization/types/caseindex";
import { User } from "@/app/organization/types";
import { TaskFiltersState } from "../../types";
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal";
import { formatDisplayDateTime, getStatusLabel } from "@/utils";
import "dayjs/locale/en-gb";
import AddTaskModal from "@/components/modals/AddTaskModal";
import EditTaskModal from "@/components/modals/EditTaskModal";

// Container props interface
interface TasksTabContainerProps {
  caseId: string;
  siteId: string;
  organizationId: string;
  siteUsers: User[];
  initialStatusFilter?: string;
  /** Show add/edit/upload controls (resource ≥ Edit). Defaults to true. */
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
   * Called after assigning a task, so the page can refresh the contributors
   * list (the backend may auto-grant the assignee as a contributor).
   */
  onContributorsChanged?: () => void;
}

interface TasksTabProps {
  caseId: string;
  siteId: string;
  organizationId: string;
  canCreateOrEditResource: boolean;
  canDeleteResource: boolean;
  relatedUserIds: string[];
  tasks: CaseTask[];
  loadingTasks: boolean;
  filteredTasks: CaseTask[];
  showAddTask: boolean;
  addingTask: boolean;
  updatingTask: boolean;
  taskForm: AddCaseTaskRequest;
  editTaskForm: {
    title: string;
    description?: string;
    assignedToId: string;
    dueDate: string;
    status: TaskStatus;
  };
  taskFilters: TaskFiltersState;
  hasActiveFilters: boolean;
  selectedTask: string | null;
  taskDetailMode: "view" | "edit";
  taskDetailTab: number;
  taskDocuments: { [taskId: string]: TaskDocument[] };
  loadingDocuments: { [taskId: string]: boolean };
  uploadingDocument: { [taskId: string]: boolean };
  siteUsers: User[];
  loadingSiteUsers: boolean;
  deleteTaskModalOpen: boolean;
  taskToDelete: CaseTask | null;
  deleteDocumentModalOpen: boolean;
  documentToDelete: {
    taskId: string;
    documentId: string;
    documentName: string;
  } | null;
  taskErrors: Record<string, string>;
  editTaskErrors: Record<string, string>;
  taskApiErrors: string[] | null;
  editTaskApiErrors: string[] | null;
  onSetTaskApiErrors: (errors: string[] | null) => void;
  onSetEditTaskApiErrors: (errors: string[] | null) => void;
  onSetShowAddTask: (show: boolean) => void;
  onCloseAddTask: () => void;
  onTaskFormChange: (
    field: keyof AddCaseTaskRequest,
    value: string | number,
  ) => void;
  onEditTaskFormChange: (
    field: keyof UpdateCaseTaskRequest,
    value: string | number,
  ) => void;
  onAddTask: () => void;
  onUpdateTask: (taskId: string) => void;
  onDeleteTask: (task: CaseTask) => void;
  onConfirmDeleteTask: () => Promise<void>;
  onCloseDeleteTaskModal: () => void;
  onEditFromDetailView: (task: CaseTask) => void;
  onCancelEditTask: () => void;
  onSetTaskDetailTab: (tab: number) => void;
  sortValue: string;
  onSortChange: (value: string) => void;
  statusValue: string | undefined;
  assigneeValue: string | undefined;
  assigneeOptions: { value: string; label: string }[];
  onStatusFilterChange: (v: string | undefined) => void;
  onAssigneeFilterChange: (v: string | undefined) => void;
  onFilterChange: (filterType: string, value: string) => void;
  onClearFilters: () => void;
  onDocumentUpload: (taskId: string, file: File) => void;
  onDeleteDocument: (
    taskId: string,
    documentId: string,
    documentName: string,
  ) => void;
  onConfirmDeleteDocument: () => Promise<void>;
  onCloseDeleteDocumentModal: () => void;
  onDownloadDocument: (
    taskId: string,
    documentId: string,
    fileName: string,
  ) => void;
}

const TASK_STATUS_TONE: Record<string, PillTone> = {
  [TaskStatus.Open]: "neutral",
  [TaskStatus.InProgress]: "brand",
  [TaskStatus.OnHold]: "warn",
  [TaskStatus.Blocked]: "danger",
  [TaskStatus.Closed]: "ok",
};

const STATUS_OPTIONS = [
  { value: "Open", label: "Open" },
  { value: "InProgress", label: "In Progress" },
  { value: "OnHold", label: "On Hold" },
  { value: "Blocked", label: "Blocked" },
  { value: "Closed", label: "Closed" },
];

const TasksTabPresentation: React.FC<TasksTabProps> = (props) => {
  const {
    caseId,
    siteId,
    organizationId,
    canCreateOrEditResource,
    canDeleteResource,
    relatedUserIds,
    tasks,
    loadingTasks,
    filteredTasks,
    showAddTask,
    addingTask,
    updatingTask,
    taskForm,
    editTaskForm,
    taskFilters,
    hasActiveFilters,
    selectedTask,
    taskDetailMode,
    taskDetailTab,
    taskDocuments,
    loadingDocuments,
    uploadingDocument,
    siteUsers,
    loadingSiteUsers,
    deleteTaskModalOpen,
    taskToDelete,
    deleteDocumentModalOpen,
    documentToDelete,
    taskErrors,
    editTaskErrors,
    taskApiErrors,
    editTaskApiErrors,
    onSetTaskApiErrors,
    onSetEditTaskApiErrors,
    onSetShowAddTask,
    onCloseAddTask,
    onTaskFormChange,
    onEditTaskFormChange,
    onAddTask,
    onUpdateTask,
    onDeleteTask,
    onConfirmDeleteTask,
    onCloseDeleteTaskModal,
    onEditFromDetailView,
    onCancelEditTask,
    onSetTaskDetailTab,
    sortValue,
    onSortChange,
    statusValue,
    assigneeValue,
    assigneeOptions,
    onStatusFilterChange,
    onAssigneeFilterChange,
    onFilterChange,
    onClearFilters,
    onDocumentUpload,
    onDeleteDocument,
    onConfirmDeleteDocument,
    onCloseDeleteDocumentModal,
    onDownloadDocument,
  } = props;

  const selectedTaskData = tasks.find((t) => t.id === selectedTask);
  const canOpenTask = canCreateOrEditResource || canDeleteResource;
  const assigneeName = (id?: string) =>
    id ? siteUsers.find((u) => u.id === id)?.fullName || "Unknown" : "Unassigned";

  const columns: Column<CaseTask>[] = [
    {
      key: "title",
      header: "Task",
      render: (t) => (
        <div className="case-row-title">
          <b>{t.title}</b>
          <span>{assigneeName(t.assignedToId)}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (t) => (
        <Pill tone={TASK_STATUS_TONE[t.status] ?? "neutral"} dot>
          {getStatusLabel(t.status)}
        </Pill>
      ),
    },
    { key: "assignee", header: "Assigned to", render: (t) => assigneeName(t.assignedToId) },
    {
      key: "due",
      header: "Due date",
      render: (t) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <CalendarDays width={14} height={14} style={{ color: "var(--text-3)" }} aria-hidden />
          {t.dueDate ? formatDisplayDateTime(t.dueDate) : "No due date"}
        </span>
      ),
    },
    {
      key: "docs",
      header: "Docs",
      align: "right",
      render: (t) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-2)" }}>
          <Paperclip width={14} height={14} aria-hidden />
          {taskDocuments[t.id] ? taskDocuments[t.id].length : 0}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="toolbar">
        {canCreateOrEditResource && (
          <Button variant="primary" icon={Plus} onClick={() => onSetShowAddTask(true)}>
            Add task
          </Button>
        )}
        <div className="search">
          <Search aria-hidden />
          <Input
            type="text"
            value={taskFilters.searchQuery || ""}
            onChange={(e) => onFilterChange("searchQuery", e.target.value)}
            placeholder="Search tasks…"
          />
        </div>
        <div className="selectbox">
          <Select aria-label="Status" value={statusValue ?? ""} onChange={(e) => onStatusFilterChange(e.target.value || undefined)}>
            <option value="">All status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="selectbox">
          <Select aria-label="Assignee" value={assigneeValue ?? ""} onChange={(e) => onAssigneeFilterChange(e.target.value || undefined)}>
            <option value="">All assignees</option>
            {assigneeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="selectbox">
          <Select aria-label="Sort" value={sortValue} onChange={(e) => onSortChange(e.target.value)}>
            <option value="">Default sort</option>
            <option value="createdDate:desc">Newest first</option>
            <option value="createdDate:asc">Oldest first</option>
            <option value="dueDate:asc">Due date ↑</option>
            <option value="dueDate:desc">Due date ↓</option>
            <option value="priority:asc">Priority</option>
            <option value="status:asc">Status</option>
          </Select>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" icon={X} onClick={onClearFilters}>
            Clear
          </Button>
        )}
      </div>

      <AddTaskModal
        open={showAddTask}
        onClose={onCloseAddTask}
        onSubmit={onAddTask}
        formData={taskForm}
        onFormChange={onTaskFormChange}
        errors={taskErrors}
        apiErrors={taskApiErrors}
        onSetApiErrors={onSetTaskApiErrors}
        isSubmitting={addingTask}
        siteUsers={siteUsers}
        loadingSiteUsers={loadingSiteUsers}
        relatedUserIds={relatedUserIds}
      />

      {loadingTasks ? (
        <LoadingState message="Loading tasks…" />
      ) : tasks.length > 0 ? (
        filteredTasks.length === 0 ? (
          <EmptyState icon={SquareCheckBig} title="No tasks match the filters" description="Try adjusting your filter criteria." />
        ) : (
          <DataTable
            columns={columns}
            rows={filteredTasks}
            getRowKey={(t) => String(t.id)}
            onRowClick={canOpenTask ? (t) => onEditFromDetailView(t) : undefined}
          />
        )
      ) : (
        <EmptyState
          icon={SquareCheckBig}
          title="No tasks yet"
          description={canCreateOrEditResource ? "Create the first task for this case." : "No tasks have been created for this case."}
          action={
            canCreateOrEditResource ? (
              <Button variant="primary" icon={Plus} onClick={() => onSetShowAddTask(true)}>
                Add task
              </Button>
            ) : undefined
          }
        />
      )}

      {selectedTaskData && (
        <EditTaskModal
          open={taskDetailMode === "edit"}
          onClose={onCancelEditTask}
          onSubmit={() => selectedTask && onUpdateTask(selectedTask)}
          formData={editTaskForm}
          onFormChange={onEditTaskFormChange}
          errors={editTaskErrors}
          apiErrors={editTaskApiErrors}
          onSetApiErrors={onSetEditTaskApiErrors}
          isSubmitting={updatingTask}
          siteUsers={siteUsers}
          loadingSiteUsers={loadingSiteUsers}
          taskTitle={selectedTaskData.title}
          relatedUserIds={relatedUserIds}
          canDelete={canDeleteResource}
          onDelete={() => onDeleteTask(selectedTaskData)}
          activeTab={taskDetailTab}
          onTabChange={onSetTaskDetailTab}
          caseId={caseId}
          siteId={siteId}
          organizationId={organizationId}
          taskId={selectedTaskData.id}
          canCreateOrEditResource={canCreateOrEditResource}
          canDeleteResource={canDeleteResource}
          documents={taskDocuments[selectedTaskData.id] || []}
          loadingDocuments={!!loadingDocuments[selectedTaskData.id]}
          uploadingDocument={!!uploadingDocument[selectedTaskData.id]}
          onDocumentUpload={(file) => onDocumentUpload(selectedTaskData.id, file)}
          onDeleteDocument={(documentId, documentName) => onDeleteDocument(selectedTaskData.id, documentId, documentName)}
          onDownloadDocument={(documentId, fileName) => onDownloadDocument(selectedTaskData.id, documentId, fileName)}
        />
      )}

      <DeleteConfirmationModal
        open={deleteTaskModalOpen}
        onClose={onCloseDeleteTaskModal}
        onConfirm={onConfirmDeleteTask}
        entityType="task"
        entityName={taskToDelete?.title}
      />
      <DeleteConfirmationModal
        open={deleteDocumentModalOpen}
        onClose={onCloseDeleteDocumentModal}
        onConfirm={onConfirmDeleteDocument}
        entityType="document"
        entityName={documentToDelete?.documentName}
      />
    </div>
  );
};

// Container component
export const TasksTab: React.FC<TasksTabContainerProps> = ({
  organizationId,
  siteId,
  caseId,
  siteUsers,
  initialStatusFilter,
  canCreateOrEditResource = true,
  canDeleteResource = true,
  relatedUserIds = [],
  onContributorsChanged,
}) => {
  const { params, state, setPage, setSort, clearSort, setFilter, clearFilters } = useListQuery<TaskListFilters>({
    defaultSort: { sortBy: "createdDate", sortDirection: "desc" },
    sortableFields: ["createdDate", "dueDate", "status", "priority"],
    filterKeys: ["status", "assigneeId"],
  });
  const tasksHook = useCaseTasks(organizationId, siteId, caseId, initialStatusFilter, siteUsers, onContributorsChanged, params);
  const meta = tasksHook.tasksMeta;

  const apiFiltersActive = !!(state.filters.status || state.filters.assigneeId);
  const sortValue = state.sortBy ? `${state.sortBy}:${state.sortDirection ?? "asc"}` : "";
  const handleSortChange = (val: string) => {
    if (!val) {
      clearSort();
      return;
    }
    const [field, dir] = val.split(":");
    setSort(field, dir as "asc" | "desc");
  };
  const handleClearAll = () => {
    tasksHook.clearFilters();
    clearFilters();
  };
  const anyActiveFilter = tasksHook.hasActiveFilters || apiFiltersActive;
  const assigneeOptions = siteUsers.map((u) => ({ value: String(u.id), label: u.fullName || u.emailId || String(u.id) }));

  return (
    <>
      <TasksTabPresentation
        caseId={caseId}
        siteId={siteId}
        organizationId={organizationId}
        canCreateOrEditResource={canCreateOrEditResource}
        canDeleteResource={canDeleteResource}
        relatedUserIds={relatedUserIds}
        tasks={tasksHook.tasks}
        loadingTasks={tasksHook.loadingTasks}
        filteredTasks={tasksHook.filteredTasks}
        showAddTask={tasksHook.showAddTask}
        addingTask={tasksHook.addingTask}
        updatingTask={tasksHook.updatingTask}
        taskForm={tasksHook.taskForm}
        editTaskForm={tasksHook.editTaskForm}
        taskFilters={tasksHook.taskFilters}
        hasActiveFilters={anyActiveFilter}
        selectedTask={tasksHook.selectedTask}
        taskDetailMode={tasksHook.taskDetailMode}
        taskDetailTab={tasksHook.taskDetailTab}
        taskDocuments={tasksHook.taskDocuments}
        loadingDocuments={tasksHook.loadingDocuments}
        uploadingDocument={tasksHook.uploadingDocument}
        siteUsers={siteUsers}
        loadingSiteUsers={false}
        deleteTaskModalOpen={tasksHook.deleteTaskModalOpen}
        taskToDelete={tasksHook.taskToDelete}
        deleteDocumentModalOpen={tasksHook.deleteDocumentModalOpen}
        documentToDelete={tasksHook.documentToDelete}
        taskErrors={tasksHook.taskErrors}
        editTaskErrors={tasksHook.editTaskErrors}
        taskApiErrors={tasksHook.taskApiErrors}
        editTaskApiErrors={tasksHook.editTaskApiErrors}
        onSetTaskApiErrors={tasksHook.setTaskApiErrors}
        onSetEditTaskApiErrors={tasksHook.setEditTaskApiErrors}
        onSetShowAddTask={tasksHook.setShowAddTask}
        onCloseAddTask={tasksHook.handleCloseAddTask}
        onTaskFormChange={tasksHook.handleTaskFormChange}
        onEditTaskFormChange={tasksHook.handleEditTaskFormChange}
        onAddTask={tasksHook.handleAddTask}
        onUpdateTask={tasksHook.handleUpdateTask}
        onDeleteTask={tasksHook.handleDeleteTask}
        onConfirmDeleteTask={tasksHook.confirmDeleteTask}
        onCloseDeleteTaskModal={tasksHook.handleCloseDeleteTaskModal}
        onEditFromDetailView={tasksHook.handleEditFromDetailView}
        onCancelEditTask={tasksHook.cancelEditTask}
        onSetTaskDetailTab={tasksHook.setTaskDetailTab}
        sortValue={sortValue}
        onSortChange={handleSortChange}
        statusValue={state.filters.status}
        assigneeValue={state.filters.assigneeId}
        assigneeOptions={assigneeOptions}
        onStatusFilterChange={(v) => setFilter("status", v)}
        onAssigneeFilterChange={(v) => setFilter("assigneeId", v)}
        onFilterChange={tasksHook.handleFilterChange}
        onClearFilters={handleClearAll}
        onDocumentUpload={tasksHook.handleDocumentUpload}
        onDeleteDocument={tasksHook.handleDeleteDocument}
        onConfirmDeleteDocument={tasksHook.confirmDeleteDocument}
        onCloseDeleteDocumentModal={tasksHook.handleCloseDeleteDocumentModal}
        onDownloadDocument={tasksHook.handleDownloadTaskDocument}
      />
      {meta && meta.totalCount > 0 && (
        <div className="tbl-foot" style={{ marginTop: 14 }}>
          <span className="cnt">
            {meta.totalCount} task{meta.totalCount === 1 ? "" : "s"}
          </span>
          <Pagination page={state.page} totalPages={meta.totalPages} onPageChange={setPage} disabled={tasksHook.loadingTasks} />
        </div>
      )}
    </>
  );
};
