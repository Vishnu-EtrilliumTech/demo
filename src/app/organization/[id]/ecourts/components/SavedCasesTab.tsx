"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Popover,
  IconButton,
  Checkbox,
  Tooltip,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Select,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import LinkIcon from "@mui/icons-material/Link";
import AddLinkIcon from "@mui/icons-material/AddLink";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  fetchPersistedEcourtCases,
  deletePersistedEcourtCase,
  updatePersistedCaseRemarks,
} from "@/app/organization/services/ecourtapi";
import { addReferenceCase } from "@/app/organization/services/caseapi";
import { fetchOrganizationCases } from "@/app/organization/services/api";
import {
  PersistedEcourtCase,
  LinkedCaseDetail,
} from "@/app/organization/types/ecourtTypes";
import { LinkCaseButton } from "./LinkCaseButton";
import { Case } from "@/app/organization/types";
import { useToast } from "@/contexts/ToastContext";
import { ConfirmDialog } from "@/app/organization/[id]/sites/[siteId]/cases/[caseId]/components/shared/ConfirmDialog";
import { useListQuery } from "@/hooks/useListQuery";
import ListFooterPager from "@/components/ListFooterPager";
import { TextSearchFilter } from "@/components/filters";
import type { PagedResponse } from "@/types/pagination";
import type { PersistedEcourtListFilters } from "@/app/organization/types/listFilterTypes";
import { formatDisplayDateTime } from "@/utils";

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  DISPOSED: { color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  PENDING: { color: "#d97706", bg: "#fef3c7", border: "#fcd34d" },
  DEFAULT: { color: "#6b7280", bg: "#f3f4f6", border: "#d1d5db" },
};

const TABLE_HEADERS = [
  "CNR Number",
  "Case Title",
  "Court",
  "Status",
  "Linked Case",
  "References",
  "Remarks",
  "Last Refreshed",
];

interface SavedCasesTabProps {
  orgId: string;
  refreshKey: number;
}

export function SavedCasesTab({ orgId, refreshKey }: SavedCasesTabProps) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();

  const { params: listParams, state: listState, setPage, setPageSize, setSort, clearSort, setFilter } =
    useListQuery<PersistedEcourtListFilters>({
      defaultSort: { sortBy: "lastRefreshed", sortDirection: "desc" },
      sortableFields: ["lastRefreshed", "cnr", "title"],
      filterKeys: ['cnr', 'title', 'linkedCaseId'],
    });
  const [savedMeta, setSavedMeta] = useState<PagedResponse<PersistedEcourtCase> | null>(null);
  const [allCases, setAllCases] = useState<PersistedEcourtCase[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCnrs, setSelectedCnrs] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [overflowAnchor, setOverflowAnchor] = useState<HTMLElement | null>(null);
  const [overflowItems, setOverflowItems] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await fetchPersistedEcourtCases(orgId, listParams);
      setAllCases(page.items);
      setSavedMeta(page);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load eCourts records");
    } finally {
      setLoading(false);
    }
  }, [orgId, showError, listParams]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const handleToggleRow = (cnr: string) => {
    setSelectedCnrs((prev) => {
      const next = new Set(prev);
      if (next.has(cnr)) next.delete(cnr);
      else next.add(cnr);
      return next;
    });
  };

  const handleSelectAll = (selectableCnrs: string[]) => {
    const allSelected = selectableCnrs.every((cnr) => selectedCnrs.has(cnr));
    setSelectedCnrs(allSelected ? new Set() : new Set(selectableCnrs));
  };

  const handleDeleteConfirm = async () => {
    if (selectedCnrs.size === 0) return;
    setDeleteLoading(true);
    try {
      const result = await deletePersistedEcourtCase(orgId, Array.from(selectedCnrs));
      setPendingDelete(false);
      setSelectedCnrs(new Set());
      if (result.deletedCount > 0) {
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete records");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRemarkUpdate = useCallback((cnrNumber: string, newRemarks: string | null) => {
    setAllCases((prev) =>
      prev.map((c) => (c.cnrNumber === cnrNumber ? { ...c, remarks: newRemarks } : c))
    );
  }, []);

  const filtered = allCases;

  return (
    <>
      {/* Search + sort bar */}
      <Box sx={{ p: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
        <TextSearchFilter placeholder="Filter by CNR number…" value={listState.filters.cnr} onChange={(v) => setFilter('cnr', v)} sx={{ width: 200 }} />
        <TextSearchFilter placeholder="Filter by case title…" value={listState.filters.title} onChange={(v) => setFilter('title', v)} sx={{ width: 200 }} />
        <Select size="small" displayEmpty
          value={listState.sortBy ? `${listState.sortBy}:${listState.sortDirection ?? 'desc'}` : ''}
          onChange={(e) => { const val = e.target.value; if (!val) { clearSort(); return; } const [field, dir] = val.split(':'); setSort(field, dir as 'asc' | 'desc'); }}
          sx={{ borderRadius: '20px', fontSize: '0.875rem', bgcolor: '#fafafa', minWidth: 170 }}
        >
          <MenuItem value="">Default sort</MenuItem>
          <MenuItem value="lastRefreshed:desc">Last refreshed ↓</MenuItem>
          <MenuItem value="lastRefreshed:asc">Last refreshed ↑</MenuItem>
          <MenuItem value="cnr:asc">CNR A→Z</MenuItem>
          <MenuItem value="title:asc">Title A→Z</MenuItem>
          <MenuItem value="title:desc">Title Z→A</MenuItem>
        </Select>
      </Box>

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 8,
            gap: 1.5,
          }}
        >
          <CircularProgress size={26} sx={{ color: "#6366f1" }} />
          <Typography color="text.secondary">Loading records…</Typography>
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <SearchOffIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {(listState.filters.cnr || listState.filters.title) ? "No records match your filters" : "No persisted eCourts records"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {(listState.filters.cnr || listState.filters.title)
              ? "Try adjusting your filter values."
              : "Records appear here after a CNR case is saved to Lawsome."}
          </Typography>
        </Box>
      ) : (
        <>
          {selectedCnrs.size > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1,
                bgcolor: "rgba(99,102,241,0.05)",
                borderBottom: "1px solid rgba(99,102,241,0.15)",
              }}
            >
              <Typography variant="body2" fontWeight={500} sx={{ color: "#4338ca" }}>
                {selectedCnrs.size} {selectedCnrs.size === 1 ? "record" : "records"} selected
              </Typography>
              <Button
                size="small"
                variant="contained"
                startIcon={<DeleteOutlineIcon fontSize="small" />}
                onClick={() => setPendingDelete(true)}
                sx={{
                  textTransform: "none",
                  fontSize: "0.78rem",
                  borderRadius: "8px",
                  bgcolor: "#ef4444",
                  "&:hover": { bgcolor: "#dc2626" },
                  py: 0.4,
                }}
              >
                Delete selected
              </Button>
              <Button
                size="small"
                variant="text"
                onClick={() => setSelectedCnrs(new Set())}
                sx={{ textTransform: "none", fontSize: "0.78rem", color: "text.secondary" }}
              >
                Clear
              </Button>
            </Box>
          )}

          <TableContainer>
            <Table sx={{ minWidth: 960 }}>
              <TableHead>
                {(() => {
                  const selectableCnrs = filtered
                    .filter((c) => c.canDelete)
                    .map((c) => c.cnrNumber);
                  const allSelected =
                    selectableCnrs.length > 0 &&
                    selectableCnrs.every((cnr) => selectedCnrs.has(cnr));
                  const someSelected = selectableCnrs.some((cnr) => selectedCnrs.has(cnr));
                  return (
                <TableRow sx={{ background: "#fafafa" }}>
                  <TableCell
                    padding="checkbox"
                    sx={{ pl: 1.5, borderBottom: "1px solid rgba(0,0,0,0.08)" }}
                  >
                    <Checkbox
                      size="small"
                      checked={allSelected}
                      indeterminate={!allSelected && someSelected}
                      onChange={() => handleSelectAll(selectableCnrs)}
                      disabled={selectableCnrs.length === 0}
                      sx={{ color: "#6366f1", "&.Mui-checked": { color: "#6366f1" }, "&.MuiCheckbox-indeterminate": { color: "#6366f1" } }}
                    />
                  </TableCell>
                  {TABLE_HEADERS.map((h) => (
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
                  );
                })()}
              </TableHead>

              <TableBody>
                {filtered.map((row) => {
                  const statusKey = row.caseStatus?.toUpperCase() ?? "";
                  const style = STATUS_STYLES[statusKey] ?? STATUS_STYLES.DEFAULT;

                  const cannotDelete = !row.canDelete;
                  return (
                    <TableRow
                      key={row.cnrNumber}
                      hover
                      selected={selectedCnrs.has(row.cnrNumber)}
                      onClick={() => router.push(`/organization/${orgId}/ecourt/${row.cnrNumber}`)}
                      sx={{
                        cursor: "pointer",
                        "&:hover": { background: "rgba(99,102,241,0.03)" },
                        "&.Mui-selected": { bgcolor: "rgba(99,102,241,0.06)" },
                        "&.Mui-selected:hover": { bgcolor: "rgba(99,102,241,0.10)" },
                        "&:last-child td": { borderBottom: 0 },
                      }}
                    >
                      <TableCell
                        padding="checkbox"
                        sx={{ pl: 1.5 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Tooltip
                          title={cannotDelete ? "Cannot delete: linked/referenced by a case, or you don't have permission" : ""}
                          placement="right"
                          disableHoverListener={!cannotDelete}
                        >
                          <span>
                            <Checkbox
                              size="small"
                              checked={selectedCnrs.has(row.cnrNumber)}
                              disabled={cannotDelete}
                              onChange={() => handleToggleRow(row.cnrNumber)}
                              sx={{ color: "#6366f1", "&.Mui-checked": { color: "#6366f1" } }}
                            />
                          </span>
                        </Tooltip>
                      </TableCell>
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

                      <TableCell sx={{ py: 1.5, px: 2, maxWidth: 300, textTransform: "capitalize" }}>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          title={row.caseTitle}
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {row.caseTitle || "—"}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 1.5, px: 2, maxWidth: 220, textTransform: "capitalize" }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          title={row.courtName}
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.courtName || "—"}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 1.5, px: 2, textTransform: "capitalize" }}>
                        <Chip
                          label={row.caseStatus || "Unknown"}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            color: style.color,
                            bgcolor: style.bg,
                            border: `1px solid ${style.border}`,
                          }}
                        />
                      </TableCell>

                      <TableCell
                        sx={{ py: 1.5, px: 2, textTransform: "capitalize" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <LinkedCaseCell
                          linkedCaseDetails={row.linkedCaseDetails}
                          cnrNumber={row.cnrNumber}
                          orgId={orgId}
                          onLinked={load}
                          onOverflow={(anchor, items) => {
                            setOverflowItems(items);
                            setOverflowAnchor(anchor);
                          }}
                          onCaseClick={(siteId, caseId) =>
                            router.push(
                              `/organization/${orgId}/sites/${siteId}/cases/${caseId}`
                            )
                          }
                        />
                      </TableCell>

                      <TableCell
                        sx={{ py: 1.5, px: 2, textTransform: "capitalize" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ReferenceCaseCell
                          referencedCases={row.referencedCases}
                          cnrNumber={row.cnrNumber}
                          orgId={orgId}
                          onCaseClick={(siteId, caseId) =>
                            router.push(
                              `/organization/${orgId}/sites/${siteId}/cases/${caseId}`
                            )
                          }
                          onRefresh={load}
                        />
                      </TableCell>

                      <TableCell
                        sx={{ py: 1.5, px: 2, textTransform: "capitalize" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <RemarksCell
                          remarks={row.remarks}
                          cnrNumber={row.cnrNumber}
                          orgId={orgId}
                          onUpdate={(newRemarks) => handleRemarkUpdate(row.cnrNumber, newRemarks)}
                        />
                      </TableCell>

                      <TableCell sx={{ py: 1.5, px: 2, textTransform: "capitalize" }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}
                        >
                          {formatDisplayDateTime(row.lastRefreshed) || "—"}
                        </Typography>
                      </TableCell>

                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ px: 2, py: 1.5, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            {savedMeta && savedMeta.totalCount > 0 && (
              <ListFooterPager
                page={listState.page}
                pageSize={listState.pageSize}
                totalCount={savedMeta.totalCount}
                totalPages={savedMeta.totalPages}
                hasNextPage={savedMeta.hasNextPage}
                hasPreviousPage={savedMeta.hasPreviousPage}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                disabled={loading}
              />
            )}
          </Box>
        </>
      )}

      {/* Overflow popover — shows additional linked cases */}
      <Popover
        open={Boolean(overflowAnchor)}
        anchorEl={overflowAnchor}
        onClose={() => setOverflowAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            borderRadius: "10px",
            p: 1.5,
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            minWidth: 160,
          },
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ mb: 1, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}
        >
          Also Linked To
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {overflowItems.map((id) => (
            <Chip
              key={id}
              label={id}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: "0.75rem",
                bgcolor: "rgba(99,102,241,0.08)",
                color: "#4338ca",
                border: "1px solid rgba(99,102,241,0.25)",
                justifyContent: "flex-start",
              }}
            />
          ))}
        </Box>
      </Popover>

      <ConfirmDialog
        open={pendingDelete}
        onClose={() => setPendingDelete(false)}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${selectedCnrs.size === 1 ? "eCourt Record" : "eCourt Records"}`}
        message={
          selectedCnrs.size === 1
            ? `Are you sure you want to delete the persisted record for CNR ${Array.from(selectedCnrs)[0]}? This action cannot be undone.`
            : `Are you sure you want to delete ${selectedCnrs.size} selected records? This action cannot be undone.`
        }
        confirmText="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </>
  );
}

// ── Sub-component: Remarks Cell ──────────────────────────────────────────────

interface RemarksCellProps {
  remarks: string | null;
  cnrNumber: string;
  orgId: string;
  onUpdate: (newRemarks: string | null) => void;
}

function RemarksCell({ remarks, cnrNumber, orgId, onUpdate }: RemarksCellProps) {
  const { showError, showSuccess } = useToast();
  const [value, setValue] = useState(remarks ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const isDirty = value.trim() !== (remarks ?? "").trim();
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      const result = await updatePersistedCaseRemarks(orgId, cnrNumber, value.trim());
      onUpdate(result.remarks);
      showSuccess(result.message);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update remarks");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{ minWidth: 180 }}
      onClick={(e) => e.stopPropagation()}
    >
      <TextField
        size="small"
        multiline
        maxRows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        placeholder="Add a note…"
        inputProps={{ maxLength: 2000 }}
        InputProps={{
          endAdornment: saving ? (
            <InputAdornment position="end">
              <CircularProgress size={12} sx={{ color: "#6366f1" }} />
            </InputAdornment>
          ) : undefined,
        }}
        sx={{
          width: "100%",
          "& .MuiOutlinedInput-root": {
            fontSize: "0.8rem",
            borderRadius: "6px",
            bgcolor: value ? "transparent" : "#fafafa",
          },
        }}
      />
    </Box>
  );
}

// ── Sub-component: Linked Case Cell ──────────────────────────────────────────

interface LinkedCaseCellProps {
  linkedCaseDetails: LinkedCaseDetail[];
  cnrNumber: string;
  orgId: string;
  onLinked: () => void;
  onOverflow: (anchor: HTMLElement, items: string[]) => void;
  onCaseClick: (siteId: string, caseId: string) => void;
}

function LinkedCaseCell({
  linkedCaseDetails,
  cnrNumber,
  orgId,
  onLinked,
  onOverflow,
  onCaseClick,
}: LinkedCaseCellProps) {
  if (linkedCaseDetails.length === 0) {
    return (
      <LinkCaseButton
        orgId={orgId}
        cnrNumber={cnrNumber}
        label="Link"
        onLinked={onLinked}
        skipLinkedCheck
      />
    );
  }

  const first = linkedCaseDetails[0];
  const rest = linkedCaseDetails.slice(1);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <Chip
        icon={<LinkIcon sx={{ fontSize: "12px !important", color: "#6366f1 !important" }} />}
        label={first.title}
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onCaseClick(first.siteId, first.id);
        }}
        sx={{
          fontWeight: 600,
          fontSize: "0.75rem",
          maxWidth: 160,
          bgcolor: "rgba(99,102,241,0.08)",
          color: "#4338ca",
          border: "1px solid rgba(99,102,241,0.25)",
          cursor: "pointer",
          "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
          "&:hover": { bgcolor: "rgba(99,102,241,0.15)" },
        }}
      />
      {rest.length > 0 && (
        <Chip
          label={`+${rest.length}`}
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onOverflow(e.currentTarget, rest.map((lc) => lc.caseNumber));
          }}
          sx={{
            fontWeight: 600,
            fontSize: "0.7rem",
            cursor: "pointer",
            bgcolor: "#f3f4f6",
            color: "#4b5563",
            border: "1px solid #d1d5db",
            "&:hover": { bgcolor: "#e5e7eb" },
          }}
        />
      )}
    </Box>
  );
}

// ── Sub-component: Reference Case Cell ───────────────────────────────────────

interface ReferenceCaseCellProps {
  referencedCases: LinkedCaseDetail[];
  cnrNumber: string;
  orgId: string;
  onCaseClick: (siteId: string, caseId: string) => void;
  onRefresh: () => void;
}

function ReferenceCaseCell({
  referencedCases,
  cnrNumber,
  orgId,
  onCaseClick,
  onRefresh,
}: ReferenceCaseCellProps) {
  const { showSuccess, showError } = useToast();
  const [overflowAnchor, setOverflowAnchor] = React.useState<HTMLElement | null>(null);

  const [addAnchor, setAddAnchor] = React.useState<HTMLElement | null>(null);
  const [allCases, setAllCases] = React.useState<Case[]>([]);
  const [casesLoading, setCasesLoading] = React.useState(false);
  const [caseSearch, setCaseSearch] = React.useState("");
  const [selectedCase, setSelectedCase] = React.useState<Case | null>(null);
  const [adding, setAdding] = React.useState(false);

  const handleOpenAdd = async (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAddAnchor(e.currentTarget);
    setCaseSearch("");
    setSelectedCase(null);
    setCasesLoading(true);
    try {
      const casesPage = await fetchOrganizationCases(orgId);
      setAllCases(casesPage.items);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load cases");
    } finally {
      setCasesLoading(false);
    }
  };

  const handleCloseAdd = () => {
    setAddAnchor(null);
    setSelectedCase(null);
    setCaseSearch("");
    setAllCases([]);
  };

  const handleAddReference = async () => {
    if (!selectedCase || !selectedCase.siteId) return;
    setAdding(true);
    try {
      const message = await addReferenceCase(
        orgId,
        String(selectedCase.siteId),
        String(selectedCase.id),
        cnrNumber
      );
      handleCloseAdd();
      showSuccess(message ?? "CNR reference added successfully");
      onRefresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to add CNR reference");
    } finally {
      setAdding(false);
    }
  };

  const referencedCaseNumbers = new Set(referencedCases.map((rc) => rc.caseNumber));

  const filteredCases = allCases.filter((c) => {
    if (referencedCaseNumbers.has(c.caseNumber)) return false;
    if (!caseSearch.trim()) return true;
    const t = caseSearch.toLowerCase();
    return c.title.toLowerCase().includes(t) || c.caseNumber.toLowerCase().includes(t);
  });

  const statusColor = (s: string) => {
    const u = s.toUpperCase();
    if (u === "OPEN") return { color: "#16a34a", bg: "#dcfce7", border: "#86efac" };
    if (u === "CLOSED") return { color: "#6b7280", bg: "#f3f4f6", border: "#d1d5db" };
    return { color: "#d97706", bg: "#fef3c7", border: "#fcd34d" };
  };

  const first = referencedCases[0] ?? null;
  const rest = referencedCases.slice(1);

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        {first && (
          <>
            <Chip
              label={first.title}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onCaseClick(first.siteId, first.id);
              }}
              sx={{
                fontWeight: 600,
                fontSize: "0.75rem",
                maxWidth: 160,
                bgcolor: "rgba(59,130,246,0.08)",
                color: "#1d4ed8",
                border: "1px solid rgba(59,130,246,0.25)",
                cursor: "pointer",
                "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
                "&:hover": { bgcolor: "rgba(59,130,246,0.15)" },
              }}
            />
            {rest.length > 0 && (
              <Chip
                label={`+${rest.length}`}
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setOverflowAnchor(e.currentTarget);
                }}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  cursor: "pointer",
                  bgcolor: "rgba(59,130,246,0.08)",
                  color: "#1d4ed8",
                  border: "1px solid rgba(59,130,246,0.25)",
                  "&:hover": { bgcolor: "rgba(59,130,246,0.15)" },
                }}
              />
            )}
          </>
        )}
        <IconButton
          size="small"
          onClick={handleOpenAdd}
          title="Add CNR reference to a case"
          sx={{
            p: 0.25,
            color: "#3b82f6",
            borderRadius: "6px",
            "&:hover": { bgcolor: "rgba(59,130,246,0.10)" },
          }}
        >
          <AddLinkIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* Overflow popover */}
      <Popover
        open={Boolean(overflowAnchor)}
        anchorEl={overflowAnchor}
        onClose={() => setOverflowAnchor(null)}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              mt: 0.75,
              borderRadius: "12px",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
              minWidth: 240,
              maxWidth: 320,
              overflow: "hidden",
            },
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.25,
            background: "linear-gradient(135deg, rgba(59,130,246,0.07) 0%, rgba(99,102,241,0.05) 100%)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{ textTransform: "uppercase", letterSpacing: "0.06em", color: "#1d4ed8" }}
          >
            Referenced Cases
          </Typography>
          <Chip
            label={rest.length}
            size="small"
            sx={{
              height: 18,
              fontSize: "0.65rem",
              fontWeight: 700,
              bgcolor: "rgba(59,130,246,0.12)",
              color: "#1d4ed8",
              border: "1px solid rgba(59,130,246,0.2)",
              "& .MuiChip-label": { px: 0.75 },
            }}
          />
        </Box>
        <Box sx={{ py: 0.5 }}>
          {rest.map((c, i) => {
            const sc = statusColor(c.status);
            return (
              <React.Fragment key={c.id}>
                {i > 0 && <Divider sx={{ mx: 2, my: 0 }} />}
                <Box
                  onClick={(e) => {
                    e.stopPropagation();
                    setOverflowAnchor(null);
                    onCaseClick(c.siteId, c.id);
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1.5,
                    px: 2,
                    py: 1.25,
                    cursor: "pointer",
                    transition: "background 0.15s",
                    "&:hover": { bgcolor: "rgba(59,130,246,0.05)" },
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{
                        fontSize: "0.82rem",
                        color: "#1e293b",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748b", fontSize: "0.72rem", fontFamily: "monospace" }}
                    >
                      {c.caseNumber}
                    </Typography>
                  </Box>
                  <Chip
                    label={c.status}
                    size="small"
                    sx={{
                      flexShrink: 0,
                      fontWeight: 600,
                      fontSize: "0.65rem",
                      height: 20,
                      color: sc.color,
                      bgcolor: sc.bg,
                      border: `1px solid ${sc.border}`,
                      "& .MuiChip-label": { px: 0.75 },
                    }}
                  />
                </Box>
              </React.Fragment>
            );
          })}
        </Box>
      </Popover>

      {/* Add CNR reference popover */}
      <Popover
        open={Boolean(addAnchor)}
        anchorEl={addAnchor}
        onClose={handleCloseAdd}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              mt: 0.75,
              borderRadius: "12px",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              width: 320,
              overflow: "hidden",
            },
          },
        }}
      >
        <Box sx={{ p: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#1e293b" }}>
            Add CNR Reference
          </Typography>
        </Box>

        <Box sx={{ p: "10px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search cases…"
            value={caseSearch}
            onChange={(e) => setCaseSearch(e.target.value)}
            autoFocus
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem" } }}
          />
        </Box>

        <Box sx={{ maxHeight: 220, overflowY: "auto" }}>
          {casesLoading ? (
            <Box
              sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 3, gap: 1 }}
            >
              <CircularProgress size={18} sx={{ color: "#6366f1" }} />
              <Typography variant="body2" color="text.secondary">
                Loading…
              </Typography>
            </Box>
          ) : filteredCases.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.82rem" }}>
                {caseSearch ? "No cases match your search" : "No cases found"}
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {filteredCases.map((c, i) => (
                <React.Fragment key={c.id}>
                  {i > 0 && <Divider />}
                  <ListItemButton
                    selected={selectedCase?.id === c.id}
                    onClick={() => setSelectedCase(c)}
                    sx={{
                      px: 2,
                      py: 0.75,
                      borderLeft: "3px solid transparent",
                      "&.Mui-selected": {
                        bgcolor: "rgba(59,130,246,0.12)",
                        borderLeftColor: "#3b82f6",
                        "& .MuiListItemText-primary": { color: "#1d4ed8" },
                      },
                      "&.Mui-selected:hover": { bgcolor: "rgba(59,130,246,0.18)" },
                    }}
                  >
                    <ListItemText
                      primary={c.title}
                      secondary={c.caseNumber}
                      slotProps={{
                        primary: {
                          style: { fontWeight: 600, fontSize: "0.82rem", color: "#1e293b" },
                        },
                        secondary: {
                          style: { fontSize: "0.72rem", fontFamily: "monospace" },
                          noWrap: true,
                        },
                      }}
                    />
                  </ListItemButton>
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        <Box
          sx={{
            p: "10px 12px",
            borderTop: "1px solid rgba(0,0,0,0.06)",
            display: "flex",
            gap: 1,
          }}
        >
          <Button
            variant="contained"
            size="small"
            fullWidth
            disabled={adding || !selectedCase}
            onClick={handleAddReference}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              bgcolor: "#3b82f6",
              "&:hover": { bgcolor: "#2563eb" },
            }}
          >
            {adding ? <CircularProgress size={14} color="inherit" /> : "Add"}
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={handleCloseAdd}
            disabled={adding}
            sx={{ textTransform: "none", color: "text.secondary" }}
          >
            Cancel
          </Button>
        </Box>
      </Popover>
    </>
  );
}
