"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  CircularProgress,
  Select,
  MenuItem,
  type SelectChangeEvent,
} from "@mui/material";
import {
  Lock as LockIcon,
  FilterListOff as FilterListOffIcon,
} from "@mui/icons-material";
import styles from "@/app/organization/page.module.css";
import { fetchUserCaseSummary, fetchSiteCases } from "@/app/organization/services/api";
import { type Task, type Case } from "@/app/organization/types";
import { useUserRole } from "@/hooks/useUserRole";
import { useRouter } from "next/navigation";
import { useHasScrollbar } from "@/hooks/useHasScrollbar";
import { useListQuery } from "@/hooks/useListQuery";
import ListFooterPager from "@/components/ListFooterPager";
import { paginateItems } from "@/utils/pagination";
import { formatDisplayDate } from "@/utils";

interface TaskListFilters {
  status?: string;
  [key: string]: string | undefined;
}

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  Open: { color: "#16a34a", bg: "#dcfce7" },
  InProgress: { color: "#d97706", bg: "#fef3c7" },
  OnHold: { color: "#ea580c", bg: "#ffedd5" },
  Blocked: { color: "#dc2626", bg: "#fee2e2" },
  Closed: { color: "#64748b", bg: "#f1f5f9" },
};

export default function SiteUserTasksLegacy({
  params,
}: {
  params: Promise<{ id: string; siteId: string; userId: string }>;
}) {
  const { id: organizationId, siteId, userId } = React.use(params);
  const router = useRouter();
  const hasScrollbar = useHasScrollbar();

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

  const { state: listState, setPage, setPageSize, setSort, clearSort, setFilter, clearFilters } =
    useListQuery<TaskListFilters>({
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
      .then((summary) => {
        setAllTasks(summary.caseTasks.filter((t) => t.siteId?.toString() === siteId));
      })
      .catch((error) => {
        console.error("Error loading tasks:", error);
        setAllTasks([]);
      })
      .finally(() => setIsLoading(false));
  }, [organizationId, siteId, userId, canViewTasks, roleLoading]);

  const tasksMeta = useMemo(() => {
    let filtered = allTasks;
    if (listState.filters.status) {
      filtered = filtered.filter((t) => t.status === listState.filters.status);
    }
    if (listState.sortBy) {
      const dir = listState.sortDirection === "desc" ? -1 : 1;
      const field: "dueDate" | "createdDate" = listState.sortBy === "dueDate" ? "dueDate" : "createdDate";
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

  useEffect(() => {
    if (!canViewTasks) return;
    fetchSiteCases(organizationId, siteId, { pageSize: 500 })
      .then((page) => {
        const lookup: Record<string, Case> = {};
        page.items.forEach((c) => {
          lookup[String(c.id)] = c;
        });
        setCaseLookup(lookup);
      })
      .catch((error) => {
        console.error("Error loading cases for task lookup:", error);
      });
  }, [organizationId, siteId, canViewTasks]);

  const hasActiveFilters = !!listState.filters.status;

  if (isLoading || roleLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!canViewTasks) {
    return (
      <section className={styles.orgContainer}>
        <Container maxWidth="xl" sx={{ pt: 3, pb: 4 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "50vh",
              gap: 2,
            }}
          >
            <LockIcon sx={{ fontSize: 48, color: "#94a3b8" }} />
            <Typography variant="h6" fontWeight={600} color="text.primary">
              Access Restricted
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              You can only view your own pending tasks.
            </Typography>
          </Box>
        </Container>
      </section>
    );
  }

  return (
    <Box
      sx={{
        pl: { xs: 2, sm: 3 },
        pr: { xs: 2, sm: hasScrollbar ? 4 : 5 },
        py: 3,
      }}
    >
      <Box
         sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexWrap: "wrap",
          gap: 1.5,
          background:
            "linear-gradient(135deg, rgba(20,184,166,0.08) 0%, rgba(59,130,246,0.05) 100%)",
          borderRadius: "16px",
          p: "16px 20px",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1e293b">
            My Tasks
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
            Your tasks across all cases for this site
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          bgcolor: "white",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          p: 3,
          mt: 3,
        }}
      >
        {/* Filter row */}
        <Box sx={{ display: "flex", gap: 1.5, mb: 3, alignItems: "center", flexWrap: "wrap" }}>
          <Select
            size="small"
            displayEmpty
            value={listState.filters.status ?? ""}
            onChange={(e) => setFilter("status", e.target.value || undefined)}
            sx={{ borderRadius: "20px", fontSize: "0.875rem", bgcolor: "#fafafa", minWidth: 160 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="Open">Open</MenuItem>
            <MenuItem value="InProgress">In Progress</MenuItem>
            <MenuItem value="OnHold">On Hold</MenuItem>
            <MenuItem value="Blocked">Blocked</MenuItem>
            <MenuItem value="Closed">Closed</MenuItem>
          </Select>
          {hasActiveFilters && (
            <Button size="small" variant="outlined" startIcon={<FilterListOffIcon />} onClick={clearFilters}
              sx={{ textTransform: 'none', borderRadius: '20px', whiteSpace: 'nowrap' }}>
              Clear filters
            </Button>
          )}
          <Select
            size="small"
            displayEmpty
            value={listState.sortBy ? `${listState.sortBy}:${listState.sortDirection ?? 'asc'}` : ''}
            onChange={(e: SelectChangeEvent) => {
              const val = e.target.value;
              if (!val) { clearSort(); return; }
              const [field, dir] = val.split(':');
              setSort(field, dir as 'asc' | 'desc');
            }}
            sx={{ borderRadius: '20px', fontSize: '0.875rem', bgcolor: '#fafafa', minWidth: 160 }}
          >
            <MenuItem value="">Default sort</MenuItem>
            <MenuItem value="dueDate:asc">Due date ↑</MenuItem>
            <MenuItem value="dueDate:desc">Due date ↓</MenuItem>
            <MenuItem value="createdDate:desc">Newest first</MenuItem>
            <MenuItem value="createdDate:asc">Oldest first</MenuItem>
          </Select>
        </Box>

        {/* Table */}
        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
            <thead>
              <tr>
                {["TITLE", "CASE", "STATUS", "DUE DATE"].map((col) => (
                  <th
                    key={col}
                    style={{
                      textAlign: "left",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      paddingBottom: "12px",
                      borderBottom: "1px solid #f1f5f9",
                      paddingRight: "16px",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: "center",
                      padding: "32px 0",
                      color: "#94a3b8",
                      fontSize: "0.875rem",
                    }}
                  >
                    No tasks found
                  </td>
                </tr>
              ) : (
                tasks.map((t) => {
                  const relatedCase = caseLookup[String(t.caseId)];
                  const statusStyle = STATUS_STYLES[t.status] ?? {
                    color: "#64748b",
                    bg: "#f1f5f9",
                  };
                  return (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: "1px solid #f8fafc",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        router.push(
                          `/organization/${organizationId}/sites/${siteId}/cases/${t.caseId}?tab=tasks`,
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(
                            `/organization/${organizationId}/sites/${siteId}/cases/${t.caseId}?tab=tasks`,
                          );
                        }
                      }}
                    >
                      <td
                        style={{
                          padding: "14px 16px 14px 0",
                          fontSize: "0.875rem",
                          color: "#374151",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, textTransform: "capitalize" }}>
                          {t.title}
                        </Box>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px 14px 0",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "#1e293b",
                          textTransform: "capitalize",
                        }}
                      >
                        {relatedCase?.title || "-"}
                      </td>
                      <td style={{ padding: "14px 16px 14px 0" }}>
                        {t.status ? (
                          <span
                            style={{
                              backgroundColor: statusStyle.bg,
                              color: statusStyle.color,
                              borderRadius: "20px",
                              padding: "3px 10px",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              textTransform: "capitalize",
                            }}
                          >
                            {t.status}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td
                        style={{
                          padding: "14px 0 14px 0",
                          fontSize: "0.875rem",
                          color: "#374151",
                          textTransform: "capitalize",
                        }}
                      >
                        {t.dueDate ? formatDisplayDate(t.dueDate) : "No due date"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Box>

        {tasksMeta && tasksMeta.totalCount > 0 && (
          <ListFooterPager
            page={listState.page}
            pageSize={listState.pageSize}
            totalCount={tasksMeta.totalCount}
            totalPages={tasksMeta.totalPages}
            hasNextPage={tasksMeta.hasNextPage}
            hasPreviousPage={tasksMeta.hasPreviousPage}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            disabled={isLoading}
          />
        )}
      </Box>
    </Box>
  );
}
