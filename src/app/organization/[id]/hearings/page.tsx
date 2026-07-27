"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Container,
  Typography,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import {
  CalendarToday as CalendarTodayIcon,
  LocationOn as LocationOnIcon,
  Lock as LockIcon,
  FilterListOff as FilterListOffIcon,
} from "@mui/icons-material";
import styles from "@/app/organization/page.module.css";
import { fetchOrganizationHearings, fetchOrganizationSites } from "@/app/organization/services/api";
import { type Hearing, type Site } from "@/app/organization/types";
import { useUserRole } from "@/hooks/useUserRole";
import { useListQuery } from "@/hooks/useListQuery";
import ListFooterPager from "@/components/ListFooterPager";
import SortableColumnHeader from "@/components/SortableColumnHeader";
import { DateRangeFilter, TextSearchFilter, EntityRefFilter } from "@/components/filters";
import type { PagedResponse } from "@/types/pagination";
import type { OrgHearingListFilters } from "@/app/organization/types/listFilterTypes";
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

const headerCellSx = {
  fontWeight: 600,
  backgroundColor: "rgba(20, 184, 166, 0.06)",
  color: "rgb(13, 148, 136)",
  fontSize: "0.75rem",
  letterSpacing: "0.5px",
  textTransform: "uppercase" as const,
  borderBottom: "2px solid",
  borderColor: "rgba(20, 184, 166, 0.2)",
  py: 1.5,
};

export default function OrgHearingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: organizationId } = React.use(params);
  const router = useRouter();

  const { canViewHearings, isLoading: roleLoading } =
    useUserRole(organizationId);

  const { params: listParams, state: listState, setPage, setPageSize, setSort, clearSort, setFilter, clearFilters } =
    useListQuery<OrgHearingListFilters>({
      defaultSort: { sortBy: "hearingDate", sortDirection: "asc" },
      sortableFields: ["hearingDate", "createdDate"],
      filterKeys: ['from', 'to', 'siteId', 'court'],
    });
  const [hearingsMeta, setHearingsMeta] = useState<PagedResponse<Hearing> | null>(null);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    if (roleLoading) return;
    if (!canViewHearings) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetchOrganizationHearings(organizationId, listParams)
      .then((page) => {
        setHearings(page.items);
        setHearingsMeta(page);
      })
      .finally(() => setIsLoading(false));
  }, [organizationId, canViewHearings, roleLoading, listParams]);

  useEffect(() => {
    fetchOrganizationSites(organizationId).then((page) => setSites(page.items)).catch(() => {});
  }, [organizationId]);

  const hasActiveFilters = !!(listState.filters.from || listState.filters.to || listState.filters.siteId || listState.filters.court);

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
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background:
            "linear-gradient(135deg, rgba(20,184,166,0.08) 0%, rgba(59,130,246,0.05) 100%)",
          borderRadius: "16px",
          p: "16px 20px",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1e293b">
            Hearings
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            All upcoming and past hearings
          </Typography>
        </Box>
      </Box>
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          p: "16px 20px",
          background: "white",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* Filter row */}
        <Box sx={{ display: "flex", gap: 1.5, mb: 2, alignItems: "center", flexWrap: "wrap" }}>
          <DateRangeFilter
            fromValue={listState.filters.from}
            toValue={listState.filters.to}
            onFromChange={(v) => setFilter('from', v)}
            onToChange={(v) => setFilter('to', v)}
            size="small"
          />
          <EntityRefFilter
            label="Site"
            value={listState.filters.siteId}
            options={sites.map((s) => ({ value: String(s.id), label: s.name }))}
            onChange={(v) => setFilter('siteId', v)}
            size="small"
            sx={{ minWidth: 160 }}
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
        </Box>

        {/* Table */}
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <Table sx={{ minWidth: 650 }} aria-label="hearings table">
            <TableHead>
              <TableRow>
                <SortableColumnHeader
                  field="hearingDate"
                  label="Date & Time"
                  currentSortBy={listState.sortBy}
                  currentSortDirection={listState.sortDirection}
                  onSort={setSort}
                  onClearSort={clearSort}
                  sx={{
                    ...headerCellSx,
                    "&:first-of-type": { borderTopLeftRadius: "8px", pl: 3 },
                  }}
                />
                <TableCell sx={headerCellSx}>Case</TableCell>
                <TableCell sx={headerCellSx}>Site</TableCell>
                <TableCell sx={headerCellSx}>Location</TableCell>
                <TableCell sx={headerCellSx}>Status</TableCell>
                <TableCell sx={headerCellSx}>Assigned To</TableCell>
                <TableCell
                  sx={{
                    ...headerCellSx,
                    "&:last-child": { borderTopRightRadius: "8px", pr: 3 },
                  }}
                >
                  Notes
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hearings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    sx={{ textAlign: "center", py: 8, color: "text.secondary" }}
                  >
                    No hearings found
                  </TableCell>
                </TableRow>
              ) : (
                hearings.map((h) => {
                  const hearingStatus = h.hearingStatus || h.status || "";
                  const statusStyle = STATUS_STYLES[hearingStatus] ?? {
                    color: "#64748b",
                    bg: "#f1f5f9",
                  };
                  return (
                    <TableRow
                      key={h.id}
                      hover
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        "&:hover": { backgroundColor: "rgba(0,0,0,0.015)" },
                        cursor: "pointer",
                      }}
                      onClick={() =>
                      
                        router.push(
                          `/organization/${organizationId}/sites/${h.siteId}/cases/${h.caseId}?tab=hearings`,
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(
                            `/organization/${organizationId}/sites/${h.siteId}/cases/${h.caseId}?tab=hearings`,
                          );
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View case ${h.caseName || "Unknown"} details`}
                    >
                      <TableCell sx={{ pl: 3 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.75,
                          }}
                        >
                          <CalendarTodayIcon
                            sx={{ fontSize: 14, color: "#a78bfa" }}
                          />
                          <Typography variant="body2" fontWeight={500} sx={{ textTransform: "capitalize" }}>
                            {formatDisplayDateTime(h.hearingDateTime)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          color="text.primary"
                        >
                          {h.caseName || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {h.siteName ? (
                          <Chip
                            label={h.siteName}
                            size="small"
                            sx={{
                              bgcolor: "rgba(20,184,166,0.08)",
                              color: "rgb(13,148,136)",
                              fontWeight: 500,
                              fontSize: "0.75rem",
                              borderRadius: "8px",
                              textTransform: "capitalize",
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <LocationOnIcon
                            sx={{ fontSize: 14, color: "text.disabled" }}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                            {h.courtLocationDisplay || h.hearingLocation || "—"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {hearingStatus ? (
                          <Chip
                            label={hearingStatus}
                            size="small"
                            sx={{
                              bgcolor: statusStyle.bg,
                              color: statusStyle.color,
                              fontWeight: 500,
                              fontSize: "0.75rem",
                              borderRadius: "8px",
                              textTransform: "capitalize",
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>
                        <Typography variant="body2" color="text.secondary">
                          {h.assignedToName || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ pr: 3, textTransform: "capitalize" }}>
                        <Typography variant="body2" color="text.secondary">
                          {h.hearingNotes || "—"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {hearingsMeta && hearingsMeta.totalCount > 0 && (
          <ListFooterPager
            page={listState.page}
            pageSize={listState.pageSize}
            totalCount={hearingsMeta.totalCount}
            totalPages={hearingsMeta.totalPages}
            hasNextPage={hearingsMeta.hasNextPage}
            hasPreviousPage={hearingsMeta.hasPreviousPage}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            disabled={isLoading}
          />
        )}
      </Paper>
    </Box>
  );
}
