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
  CalendarToday as CalendarTodayIcon,
  LocationOn as LocationOnIcon,
  Lock as LockIcon,
  FilterListOff as FilterListOffIcon,
} from "@mui/icons-material";
import styles from "@/app/organization/page.module.css";
import { fetchSiteHearings, fetchUserCaseSummary, fetchSiteUsers, fetchSiteCases } from "@/app/organization/services/api";
import { type Hearing, type Case } from "@/app/organization/types";
import { useUserRole } from "@/hooks/useUserRole";
import { useRouter, useSearchParams } from "next/navigation";
import { useHasScrollbar } from "@/hooks/useHasScrollbar";
import { useListQuery } from "@/hooks/useListQuery";
import ListFooterPager from "@/components/ListFooterPager";
import { DateRangeFilter, TextSearchFilter } from "@/components/filters";
import type { PagedResponse } from "@/types/pagination";
import { paginateItems } from "@/utils/pagination";
import type { SiteHearingListFilters } from "@/app/organization/types/listFilterTypes";
import { formatDisplayDateTime } from "@/utils";

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  Open: { color: "#16a34a", bg: "#dcfce7" },
  Scheduled: { color: "#2563eb", bg: "#dbeafe" },
  PlanningInProgress: { color: "#d97706", bg: "#fef3c7" },
  Planned: { color: "#0284c7", bg: "#e0f2fe" },
  OnHold: { color: "#ea580c", bg: "#ffedd5" },
  Appeared: { color: "#0d9488", bg: "#ccfbf1" },
  NotAppeared: { color: "#dc2626", bg: "#fee2e2" },
  Completed: { color: "#64748b", bg: "#f1f5f9" },
};

export default function SiteHearingsLegacy({
  params,
}: {
  params: Promise<{ id: string; siteId: string }>;
}) {
  const { id: organizationId, siteId } = React.use(params);
  const router = useRouter();
  const hasScrollbar = useHasScrollbar();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  const { canViewHearings, isLoading: roleLoading } =
    useUserRole(organizationId);

  const { params: listParams, state: listState, setPage, setPageSize, setSort, clearSort, setFilter, clearFilters } =
    useListQuery<SiteHearingListFilters>({
      defaultSort: { sortBy: "hearingDate", sortDirection: "asc" },
      sortableFields: ["hearingDate", "createdDate"],
      filterKeys: ['from', 'to', 'court'],
    });
  // Org-wide (no userId): server paginates via fetchSiteHearings.
  const [hearingsMeta, setHearingsMeta] = useState<PagedResponse<Hearing> | null>(null);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  // Per-user (userId set): cases/summary returns everything, so filter/sort/page client-side.
  const [userHearings, setUserHearings] = useState<Hearing[]>([]);
  // caseId -> Case, used to show the case title alongside its number in the CASE column.
  const [caseLookup, setCaseLookup] = useState<Record<string, Case>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (roleLoading) return;
    if (!canViewHearings) {
      setIsLoading(false);
      return;
    }
    if (!userId) return;
    setIsLoading(true);
    Promise.all([
      fetchUserCaseSummary(organizationId, userId),
      fetchSiteUsers(organizationId, siteId, { pageSize: 500 }),
    ])
      .then(([summary, siteUsersPage]) => {
        const nameById = new Map(siteUsersPage.items.map((u) => [String(u.id), u.fullName]));
        const siteHearings = summary.caseHearings
          .filter((h) => h.siteId?.toString() === siteId)
          .map((h) => ({
            ...h,
            assignedToName: h.assignedToName ?? nameById.get(String(h.assignedToId)),
          }));
        setUserHearings(siteHearings);

        const lookup: Record<string, Case> = {};
        summary.cases.forEach((c) => {
          lookup[String(c.id)] = c;
        });
        setCaseLookup(lookup);
      })
      .catch((error) => {
        console.error("Error loading hearings:", error);
        setUserHearings([]);
      })
      .finally(() => setIsLoading(false));
  }, [organizationId, siteId, userId, canViewHearings, roleLoading]);

  useEffect(() => {
    if (!canViewHearings || userId) return;
    fetchSiteCases(organizationId, siteId, { pageSize: 500 })
      .then((page) => {
        const lookup: Record<string, Case> = {};
        page.items.forEach((c) => {
          lookup[String(c.id)] = c;
        });
        setCaseLookup(lookup);
      })
      .catch((error) => {
        console.error("Error loading cases for hearing lookup:", error);
      });
  }, [organizationId, siteId, userId, canViewHearings]);

  useEffect(() => {
    if (roleLoading) return;
    if (!canViewHearings) {
      setIsLoading(false);
      return;
    }
    if (userId) return;
    setIsLoading(true);
    fetchSiteHearings(organizationId, siteId, listParams)
      .then((page) => {
        setHearings(page.items);
        setHearingsMeta(page);
      })
      .catch((error) => {
        console.error("Error loading hearings:", error);
        setHearings([]);
        setHearingsMeta(null);
      })
      .finally(() => setIsLoading(false));
  }, [organizationId, siteId, userId, canViewHearings, roleLoading, listParams]);

  const userHearingsPaged = useMemo(() => {
    if (!userId) return null;
    let filtered = userHearings;
    const { from, to, court } = listState.filters;
    if (from) {
      const fromTime = new Date(from).getTime();
      filtered = filtered.filter((h) => new Date(h.hearingDateTime).getTime() >= fromTime);
    }
    if (to) {
      const toTime = new Date(to).getTime();
      filtered = filtered.filter((h) => new Date(h.hearingDateTime).getTime() <= toTime);
    }
    if (court) {
      const term = court.toLowerCase();
      filtered = filtered.filter((h) => h.hearingLocation?.toLowerCase().includes(term));
    }
    if (listState.sortBy) {
      const dir = listState.sortDirection === "desc" ? -1 : 1;
      filtered = [...filtered].sort((a, b) => {
        const aVal = listState.sortBy === "hearingDate" ? a.hearingDateTime : a.createdDate;
        const bVal = listState.sortBy === "hearingDate" ? b.hearingDateTime : b.createdDate;
        if (!aVal && !bVal) return 0;
        if (!aVal) return 1;
        if (!bVal) return -1;
        return (new Date(aVal).getTime() - new Date(bVal).getTime()) * dir;
      });
    }
    return paginateItems(filtered, listState.page, listState.pageSize);
  }, [userId, userHearings, listState]);

  const displayedHearings = userId ? (userHearingsPaged?.items ?? []) : hearings;
  const displayedHearingsMeta = userId ? userHearingsPaged : hearingsMeta;

  const hasActiveFilters = !!(listState.filters.from || listState.filters.to || listState.filters.court);

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

  if (!canViewHearings) {
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
              You don&apos;t have permission to view hearings. Please contact
              your administrator for access.
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
            {userId ? "My Hearings" : "Hearings"}
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
            {userId
              ? "Your upcoming and past hearings for this site"
              : "All upcoming and past hearings"}
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
          <DateRangeFilter
            fromValue={listState.filters.from}
            toValue={listState.filters.to}
            onFromChange={(v) => setFilter('from', v)}
            onToChange={(v) => setFilter('to', v)}
            size="small"
          />
          <TextSearchFilter
            placeholder="Filter by court..."
            value={listState.filters.court}
            onChange={(v) => setFilter('court', v)}
            sx={{ width: 220 }}
          />
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
            <MenuItem value="hearingDate:asc">Hearing date ↑</MenuItem>
            <MenuItem value="hearingDate:desc">Hearing date ↓</MenuItem>
            <MenuItem value="createdDate:desc">Newest first</MenuItem>
            <MenuItem value="createdDate:asc">Oldest first</MenuItem>
          </Select>
        </Box>

        {/* Table */}
        <Box sx={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr>
              {[
                "DATE & TIME",
                "CASE",
                "LOCATION",
                "STATUS",
                "ASSIGNED TO",
                "NOTES",
              ].map((col) => (
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
            {displayedHearings.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: "32px 0",
                    color: "#94a3b8",
                    fontSize: "0.875rem",
                  }}
                >
                  No hearings found
                </td>
              </tr>
            ) : (
              displayedHearings.map((h) => {
                const hearingStatus = h.status || h.hearingStatus || "";
                const statusStyle = STATUS_STYLES[hearingStatus] ?? {
                  color: "#64748b",
                  bg: "#f1f5f9",
                };
                const relatedCase = caseLookup[h.caseId];
                const caseTitle = relatedCase?.title || h.caseName || "-";
                return (
                  <tr
                    key={h.id}
                    style={{
                      borderBottom: "1px solid #f8fafc",
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      router.push(
                        `/organization/${organizationId}/sites/${siteId}/cases/${h.caseId}?tab=hearings`,
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(
                          `/organization/${organizationId}/sites/${siteId}/cases/${h.caseId}?tab=hearings`,
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
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                          textTransform: "capitalize",
                        }}
                      >
                        <CalendarTodayIcon
                          sx={{ fontSize: 14, color: "#a78bfa" }}
                        />
                        {formatDisplayDateTime(h.hearingDateTime)}
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
                      {caseTitle}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px 14px 0",
                        fontSize: "0.875rem",
                        color: "#374151",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5, textTransform: "capitalize" }}
                      >
                        <LocationOnIcon
                          sx={{ fontSize: 14, color: "#94a3b8" }}
                        />
                        {h.courtLocationDisplay || h.hearingLocation || "-"}
                      </Box>
                    </td>
                    <td style={{ padding: "14px 16px 14px 0" }}>
                      {hearingStatus ? (
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
                          {hearingStatus}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px 14px 0",
                        fontSize: "0.875rem",
                        color: "#374151",
                        textTransform: "capitalize",
                      }}
                    >
                      {h.assignedToName || "-"}
                    </td>
                    <td
                      style={{
                        padding: "14px 0 14px 0",
                        fontSize: "0.875rem",
                        color: "#94a3b8",
                        textTransform: "capitalize",
                      }}
                    >
                      {h.hearingNotes || "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </Box>

        {displayedHearingsMeta && displayedHearingsMeta.totalCount > 0 && (
          <ListFooterPager
            page={listState.page}
            pageSize={listState.pageSize}
            totalCount={displayedHearingsMeta.totalCount}
            totalPages={displayedHearingsMeta.totalPages}
            hasNextPage={displayedHearingsMeta.hasNextPage}
            hasPreviousPage={displayedHearingsMeta.hasPreviousPage}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            disabled={isLoading}
          />
        )}
      </Box>
    </Box>
  );
}
