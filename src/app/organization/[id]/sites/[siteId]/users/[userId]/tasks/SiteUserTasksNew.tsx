"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, FilterX, Lock } from "lucide-react";

import {
  LuiRoot,
  LoadingState,
  EmptyState,
  Card,
  Pill,
  Button,
  DataTable,
  TableFoot,
  type Column,
} from "@/design-system";
import {
  fetchUserCaseSummary,
  fetchSiteCases,
} from "@/app/organization/services/api";
import { type Task, type Case } from "@/app/organization/types";
import type { PillTone } from "@/design-system";
import { useUserRole } from "@/hooks/useUserRole";
import { useListQuery } from "@/hooks/useListQuery";
import { paginateItems } from "@/utils/pagination";
import { formatDisplayDate } from "@/utils";

interface TaskListFilters {
  status?: string;
  [key: string]: string | undefined;
}

const TASK_STATUS_TONE: Record<string, PillTone> = {
  Open: "brand",
  InProgress: "warn",
  OnHold: "neutral",
  Blocked: "danger",
  Closed: "ok",
};

/**
 * Design-system "My tasks" screen — the DS re-skin of the legacy
 * `sites/[siteId]/users/[userId]/tasks` page. Same data loads (useListQuery,
 * fetchUserCaseSummary, client-side filter/sort/page) and RBAC gating
 * (own-dashboard + site-role only); the table moves onto the DS DataTable.
 * Gated behind the `site-user-tasks` flag.
 */
export default function SiteUserTasksNew({
  params,
}: {
  params: Promise<{ id: string; siteId: string; userId: string }>;
}) {
  const { id: organizationId, siteId, userId } = use(params);
  const router = useRouter();

  const {
    currentUserId,
    isSiteAdmin,
    isSiteClerk,
    isSiteSrLegalExpert,
    isSiteLegalExpert,
    isLoading: roleLoading,
  } = useUserRole(organizationId);

  const isOwnDashboard = currentUserId !== null && currentUserId === userId;
  const hasSiteRole =
    isSiteAdmin || isSiteClerk || isSiteSrLegalExpert || isSiteLegalExpert;
  const canViewTasks = isOwnDashboard && hasSiteRole;

  const {
    state: listState,
    setPage,
    setSort,
    clearSort,
    setFilter,
    clearFilters,
  } = useListQuery<TaskListFilters>({
    defaultSort: { sortBy: "dueDate", sortDirection: "asc" },
    sortableFields: ["dueDate", "createdDate"],
    filterKeys: ["status"],
  });

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [caseLookup, setCaseLookup] = useState<Record<string, Case>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (roleLoading) return;
    if (!canViewTasks) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetchUserCaseSummary(organizationId, userId)
      .then((summary) =>
        setAllTasks(
          summary.caseTasks.filter((t) => t.siteId?.toString() === siteId),
        ),
      )
      .catch((error) => {
        console.error("Error loading tasks:", error);
        setAllTasks([]);
      })
      .finally(() => setIsLoading(false));
  }, [organizationId, siteId, userId, canViewTasks, roleLoading]);

  useEffect(() => {
    if (!canViewTasks) return;
    fetchSiteCases(organizationId, siteId, { pageSize: 500 })
      .then((page) => {
        const lookup: Record<string, Case> = {};
        page.items.forEach((c) => (lookup[String(c.id)] = c));
        setCaseLookup(lookup);
      })
      .catch((error) =>
        console.error("Error loading cases for task lookup:", error),
      );
  }, [organizationId, siteId, canViewTasks]);

  const tasksMeta = useMemo(() => {
    let filtered = allTasks;
    if (listState.filters.status)
      filtered = filtered.filter((t) => t.status === listState.filters.status);
    if (listState.sortBy) {
      const dir = listState.sortDirection === "desc" ? -1 : 1;
      const field: "dueDate" | "createdDate" =
        listState.sortBy === "dueDate" ? "dueDate" : "createdDate";
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        if (!aVal && !bVal) return 0;
        if (!aVal) return 1;
        if (!bVal) return -1;
        return (new Date(aVal).getTime() - new Date(bVal).getTime()) * dir;
      });
    }
    return paginateItems(filtered, listState.page, listState.pageSize);
  }, [allTasks, listState]);

  const tasks = tasksMeta.items;
  const hasActiveFilters = !!listState.filters.status;

  const shell = (children: React.ReactNode) => (
    <LuiRoot>
      <div className="sheet">{children}</div>
    </LuiRoot>
  );

  if (isLoading || roleLoading)
    return shell(<LoadingState message="Loading your tasks…" />);

  if (!canViewTasks)
    return shell(
      <Card pad>
        <EmptyState
          icon={Lock}
          title="Access restricted"
          description="You can only view your own pending tasks."
        />
      </Card>,
    );

  const columns: Column<Task>[] = [
    { key: "title", header: "Title", render: (t) => t.title },
    {
      key: "case",
      header: "Case",
      render: (t) => caseLookup[String(t.caseId)]?.title || "—",
    },
    {
      key: "status",
      header: "Status",
      render: (t) => (
        <Pill tone={TASK_STATUS_TONE[t.status] ?? "neutral"} dot>
          {t.status}
        </Pill>
      ),
    },
    {
      key: "dueDate",
      header: "Due date",
      render: (t) => (t.dueDate ? formatDisplayDate(t.dueDate) : "No due date"),
    },
  ];

  return shell(
    <>
      <div className="page-head">
        <div className="ph-lead">
          <div className="eyebrow">
            <ClipboardList aria-hidden /> Personal workspace
          </div>
          <h1>My tasks</h1>
          <div className="sub">Your tasks across all cases for this site.</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="selectbox">
          <select
            aria-label="Status"
            value={listState.filters.status ?? ""}
            onChange={(e) => setFilter("status", e.target.value || undefined)}
          >
            <option value="">All statuses</option>
            <option value="Open">Open</option>
            <option value="InProgress">In Progress</option>
            <option value="OnHold">On Hold</option>
            <option value="Blocked">Blocked</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <div className="selectbox">
          <select
            aria-label="Sort"
            value={
              listState.sortBy
                ? `${listState.sortBy}:${listState.sortDirection ?? "asc"}`
                : ""
            }
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                clearSort();
                return;
              }
              const [field, dir] = val.split(":");
              setSort(field, dir as "asc" | "desc");
            }}
          >
            <option value="">Default sort</option>
            <option value="dueDate:asc">Due date ↑</option>
            <option value="dueDate:desc">Due date ↓</option>
            <option value="createdDate:desc">Newest first</option>
            <option value="createdDate:asc">Oldest first</option>
          </select>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" icon={FilterX} onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      {tasks.length === 0 ? (
        <Card pad>
          <EmptyState
            icon={ClipboardList}
            title="No tasks found"
            description={
              hasActiveFilters
                ? "Try adjusting or clearing your filters."
                : "Tasks assigned to you in this site will appear here."
            }
            action={
              hasActiveFilters ? (
                <Button
                  variant="secondary"
                  icon={FilterX}
                  onClick={clearFilters}
                >
                  Clear all filters
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <DataTable
          columns={columns}
          rows={tasks}
          getRowKey={(t) => String(t.id)}
          onRowClick={(t) =>
            router.push(
              `/organization/${organizationId}/sites/${siteId}/cases/${t.caseId}?tab=tasks`,
            )
          }
          footer={
            tasksMeta.totalCount > 0 ? (
              <TableFoot
                count={`${tasksMeta.totalCount} task${tasksMeta.totalCount === 1 ? "" : "s"}`}
                page={listState.page}
                totalPages={tasksMeta.totalPages}
                onPageChange={setPage}
                disabled={isLoading}
              />
            ) : undefined
          }
        />
      )}
    </>,
  );
}
