"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { fetchSearchHistory } from "@/app/organization/services/ecourtapi";
import { SearchHistoryItem } from "@/app/organization/types/ecourtTypes";
import { useToast } from "@/contexts/ToastContext";
import { formatDisplayDateTime } from "@/utils";
import { useListQuery } from "@/hooks/useListQuery";
import ListFooterPager from "@/components/ListFooterPager";
import type { PagedResponse } from "@/types/pagination";

interface HistoryTabProps {
  orgId: string;
  refreshKey: number;
}

export function HistoryTab({ orgId, refreshKey }: HistoryTabProps) {
  const router = useRouter();
  const { showError } = useToast();

  const { params: listParams, state: listState, setPage, setPageSize } = useListQuery({
    defaultSort: { sortBy: "searchedAt", sortDirection: "desc" },
    sortableFields: ["searchedAt"],
    filterKeys: [],
  });
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [historyMeta, setHistoryMeta] = useState<PagedResponse<SearchHistoryItem> | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const page = await fetchSearchHistory(orgId, listParams);
      setHistory(page.items);
      setHistoryMeta(page);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load search history");
    } finally {
      setHistoryLoading(false);
    }
  }, [orgId, showError, listParams]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, refreshKey]);

  if (historyLoading) {
    return (
      <Box
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8, gap: 1.5 }}
      >
        <CircularProgress size={26} sx={{ color: "#6366f1" }} />
        <Typography color="text.secondary">Loading history…</Typography>
      </Box>
    );
  }

  if (history.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <SearchOffIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
        <Typography variant="h6" color="text.secondary">
          No search history
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer>
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow sx={{ background: "#fafafa" }}>
              {["CNR Number", "Case Title", "Court Name", "Searched By", "Searched At"].map((h) => (
                <TableCell
                  key={h}
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.72rem",
                    color: "text.secondary",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    py: 1.5,
                    px: 2,
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((row) => (
              <TableRow
                key={row.id}
                hover
                onClick={() => router.push(`/organization/${orgId}/ecourt/${row.cnrNumber}`)}
                sx={{
                  cursor: "pointer",
                  "&:hover": { background: "rgba(99,102,241,0.03)" },
                  "&:last-child td": { borderBottom: 0 },
                }}
              >
                <TableCell sx={{ py: 1.5, px: 2, textTransform: "capitalize" }}>
                  <Chip
                    label={row.cnrNumber}
                    size="small"
                    sx={{
                      fontFamily: "monospace",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      bgcolor: "rgba(99,102,241,0.08)",
                      color: "#4338ca",
                      border: "1px solid rgba(99,102,241,0.25)",
                      letterSpacing: "0.02em",
                    }}
                  />
                </TableCell>
                <TableCell sx={{ py: 1.5, px: 2, textTransform: "capitalize" }}>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: "0.8rem", color: "text.primary" }}
                  >
                    {row.caseTitle || "—"}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 1.5, px: 2, textTransform: "capitalize" }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.8rem" }}
                  >
                    {row.courtName || "—"}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 1.5, px: 2, textTransform: "capitalize" }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.8rem" }}
                  >
                    {row.searchedByName || "—"}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 1.5, px: 2, textTransform: "capitalize" }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}
                  >
                    {formatDisplayDateTime(row.searchedAt) || "—"}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ px: 2, py: 1.5, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        {historyMeta && historyMeta.totalCount > 0 && (
          <ListFooterPager
            page={listState.page}
            pageSize={listState.pageSize}
            totalCount={historyMeta.totalCount}
            totalPages={historyMeta.totalPages}
            hasNextPage={historyMeta.hasNextPage}
            hasPreviousPage={historyMeta.hasPreviousPage}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            disabled={historyLoading}
          />
        )}
      </Box>
    </>
  );
}
