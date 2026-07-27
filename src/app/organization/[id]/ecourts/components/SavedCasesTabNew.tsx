"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SearchX, Link2, Plus, Trash2, Search } from "lucide-react";
import {
  Button,
  Pill,
  Dialog,
  Textarea,
  Select,
  DataTable,
  Pagination,
  LoadingState,
  EmptyState,
  type Column,
  type PillTone,
} from "@/design-system";
import {
  fetchPersistedEcourtCases,
  fetchUnlinkedCases,
  linkCnrCourtData,
  deletePersistedEcourtCase,
  updatePersistedCaseRemarks,
} from "@/app/organization/services/ecourtapi";
import { addReferenceCase } from "@/app/organization/services/caseapi";
import { fetchOrganizationCases } from "@/app/organization/services/api";
import { PersistedEcourtCase, LinkedCaseDetail, UnlinkedCase } from "@/app/organization/types/ecourtTypes";
import { Case } from "@/app/organization/types";
import { useToast } from "@/contexts/ToastContext";
import { useListQuery } from "@/hooks/useListQuery";
import type { PagedResponse } from "@/types/pagination";
import type { PersistedEcourtListFilters } from "@/app/organization/types/listFilterTypes";
import { formatDisplayDateTime } from "@/utils";

const statusTone = (s: string): PillTone => {
  const u = (s || "").toUpperCase();
  if (u === "DISPOSED") return "ok";
  if (u === "PENDING") return "warn";
  return "neutral";
};

interface SavedCasesTabNewProps {
  orgId: string;
  refreshKey: number;
}

export function SavedCasesTabNew({ orgId, refreshKey }: SavedCasesTabNewProps) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();

  const { params: listParams, state: listState, setPage, setSort, setFilter } = useListQuery<PersistedEcourtListFilters>({
    defaultSort: { sortBy: "lastRefreshed", sortDirection: "desc" },
    sortableFields: ["lastRefreshed", "cnr", "title"],
    filterKeys: ["cnr", "title", "linkedCaseId"],
  });
  const [meta, setMeta] = useState<PagedResponse<PersistedEcourtCase> | null>(null);
  const [rows, setRows] = useState<PersistedEcourtCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Debounced filter inputs.
  const [cnrInput, setCnrInput] = useState(listState.filters.cnr ?? "");
  const [titleInput, setTitleInput] = useState(listState.filters.title ?? "");
  useEffect(() => {
    const t = setTimeout(() => {
      const v = cnrInput.trim();
      if (v !== (listState.filters.cnr ?? "")) setFilter("cnr", v || undefined);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cnrInput]);
  useEffect(() => {
    const t = setTimeout(() => {
      const v = titleInput.trim();
      if (v !== (listState.filters.title ?? "")) setFilter("title", v || undefined);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await fetchPersistedEcourtCases(orgId, listParams);
      setRows(page.items);
      setMeta(page);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load eCourts records");
    } finally {
      setLoading(false);
    }
  }, [orgId, showError, listParams]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  // Overflow dialog (linked / referenced lists).
  const [overflow, setOverflow] = useState<{ title: string; items: LinkedCaseDetail[] } | null>(null);
  // Link-to-case dialog.
  const [linkCnr, setLinkCnr] = useState<string | null>(null);
  const [unlinked, setUnlinked] = useState<UnlinkedCase[]>([]);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkSearch, setLinkSearch] = useState("");
  // Add-reference dialog.
  const [refCnr, setRefCnr] = useState<string | null>(null);
  const [refExisting, setRefExisting] = useState<Set<string>>(new Set());
  const [allCases, setAllCases] = useState<Case[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [caseSearch, setCaseSearch] = useState("");
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [adding, setAdding] = useState(false);

  const toggleRow = (cnr: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cnr)) next.delete(cnr);
      else next.add(cnr);
      return next;
    });

  const selectableCnrs = rows.filter((r) => r.canDelete).map((r) => r.cnrNumber);
  const allSelected = selectableCnrs.length > 0 && selectableCnrs.every((c) => selected.has(c));
  const someSelected = selectableCnrs.some((c) => selected.has(c));

  const handleDeleteConfirm = async () => {
    if (selected.size === 0) return;
    setDeleteLoading(true);
    try {
      const result = await deletePersistedEcourtCase(orgId, Array.from(selected));
      setPendingDelete(false);
      setSelected(new Set());
      if (result.deletedCount > 0) showSuccess(result.message);
      else showError(result.message);
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete records");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openLink = async (cnr: string) => {
    setLinkCnr(cnr);
    setUnlinked([]);
    setLinkSearch("");
    setLinkLoading(true);
    try {
      setUnlinked((await fetchUnlinkedCases(orgId)).items);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load cases");
      setLinkCnr(null);
    } finally {
      setLinkLoading(false);
    }
  };

  const doLink = async (c: UnlinkedCase) => {
    const cnr = linkCnr;
    setLinkCnr(null);
    if (!cnr) return;
    try {
      await linkCnrCourtData(orgId, c.siteId, String(c.id), cnr);
      showSuccess(`${cnr} is successfully linked with ${c.title}`);
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to link case");
    }
  };

  const openAddRef = async (cnr: string, referenced: LinkedCaseDetail[]) => {
    setRefCnr(cnr);
    setRefExisting(new Set(referenced.map((r) => r.caseNumber)));
    setCaseSearch("");
    setSelectedCase(null);
    setCasesLoading(true);
    try {
      setAllCases((await fetchOrganizationCases(orgId)).items);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load cases");
    } finally {
      setCasesLoading(false);
    }
  };

  const doAddRef = async () => {
    if (!selectedCase || !selectedCase.siteId || !refCnr) return;
    setAdding(true);
    try {
      const message = await addReferenceCase(orgId, String(selectedCase.siteId), String(selectedCase.id), refCnr);
      setRefCnr(null);
      showSuccess(message ?? "CNR reference added successfully");
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to add CNR reference");
    } finally {
      setAdding(false);
    }
  };

  const updateRemarks = async (cnr: string, value: string, prev: string | null) => {
    if (value.trim() === (prev ?? "").trim()) return;
    try {
      const result = await updatePersistedCaseRemarks(orgId, cnr, value.trim());
      setRows((rs) => rs.map((r) => (r.cnrNumber === cnr ? { ...r, remarks: result.remarks } : r)));
      showSuccess(result.message);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update remarks");
    }
  };

  const linkedFilter = unlinked.filter((c) => {
    if (!linkSearch.trim()) return true;
    const t = linkSearch.toLowerCase();
    return c.caseNumber.toLowerCase().includes(t) || c.title.toLowerCase().includes(t);
  });
  const caseFilter = allCases.filter((c) => {
    if (refExisting.has(c.caseNumber)) return false;
    if (!caseSearch.trim()) return true;
    const t = caseSearch.toLowerCase();
    return c.title.toLowerCase().includes(t) || c.caseNumber.toLowerCase().includes(t);
  });

  const goCase = (siteId: string, caseId: string) => router.push(`/organization/${orgId}/sites/${siteId}/cases/${caseId}`);
  const goCnr = (cnr: string) => router.push(`/organization/${orgId}/ecourt/${cnr}`);

  const columns: Column<PersistedEcourtCase>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => { if (el) el.indeterminate = !allSelected && someSelected; }}
          disabled={selectableCnrs.length === 0}
          onChange={() => setSelected(allSelected ? new Set() : new Set(selectableCnrs))}
          aria-label="Select all"
        />
      ),
      render: (r) => (
        <input
          type="checkbox"
          checked={selected.has(r.cnrNumber)}
          disabled={!r.canDelete}
          title={!r.canDelete ? "Cannot delete: linked/referenced by a case, or no permission" : undefined}
          onChange={() => toggleRow(r.cnrNumber)}
          aria-label={`Select ${r.cnrNumber}`}
        />
      ),
    },
    {
      key: "cnr",
      header: "CNR Number",
      sortField: "cnr",
      render: (r) => (
        <button type="button" className="chip-mono" style={{ cursor: "pointer" }} onClick={() => goCnr(r.cnrNumber)}>
          <b>{r.cnrNumber}</b>
        </button>
      ),
    },
    {
      key: "title",
      header: "Case Title",
      sortField: "title",
      render: (r) => (
        <span style={{ display: "inline-block", maxWidth: 260, cursor: "pointer" }} title={r.caseTitle} onClick={() => goCnr(r.cnrNumber)}>
          {r.caseTitle || "—"}
        </span>
      ),
    },
    { key: "court", header: "Court", render: (r) => <span title={r.courtName} style={{ display: "inline-block", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", verticalAlign: "middle" }}>{r.courtName || "—"}</span> },
    { key: "status", header: "Status", render: (r) => (r.caseStatus ? <Pill tone={statusTone(r.caseStatus)} dot>{r.caseStatus}</Pill> : "—") },
    {
      key: "linked",
      header: "Linked Case",
      render: (r) =>
        r.linkedCaseDetails.length === 0 ? (
          <Button variant="ghost" icon={Link2} onClick={() => openLink(r.cnrNumber)}>Link</Button>
        ) : (
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <Pill tone="brand"><span style={{ cursor: "pointer" }} onClick={() => goCase(r.linkedCaseDetails[0].siteId, r.linkedCaseDetails[0].id)}>{r.linkedCaseDetails[0].title}</span></Pill>
            {r.linkedCaseDetails.length > 1 && (
              <button type="button" className="chip-mono" style={{ cursor: "pointer" }} onClick={() => setOverflow({ title: "Also linked to", items: r.linkedCaseDetails.slice(1) })}>
                +{r.linkedCaseDetails.length - 1}
              </button>
            )}
          </span>
        ),
    },
    {
      key: "refs",
      header: "References",
      render: (r) => (
        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          {r.referencedCases[0] && (
            <Pill tone="brand"><span style={{ cursor: "pointer" }} onClick={() => goCase(r.referencedCases[0].siteId, r.referencedCases[0].id)}>{r.referencedCases[0].title}</span></Pill>
          )}
          {r.referencedCases.length > 1 && (
            <button type="button" className="chip-mono" style={{ cursor: "pointer" }} onClick={() => setOverflow({ title: "Referenced cases", items: r.referencedCases.slice(1) })}>
              +{r.referencedCases.length - 1}
            </button>
          )}
          <Button variant="ghost" icon={Plus} title="Add CNR reference to a case" aria-label="add reference" onClick={() => openAddRef(r.cnrNumber, r.referencedCases)} />
        </span>
      ),
    },
    {
      key: "remarks",
      header: "Remarks",
      render: (r) => (
        <Textarea
          defaultValue={r.remarks ?? ""}
          placeholder="Add a note…"
          maxLength={2000}
          rows={1}
          style={{ minWidth: 180, minHeight: 38, fontSize: 12.5 }}
          onBlur={(e) => updateRemarks(r.cnrNumber, e.target.value, r.remarks)}
        />
      ),
    },
    { key: "refreshed", header: "Last Refreshed", render: (r) => <span style={{ whiteSpace: "nowrap" }}>{formatDisplayDateTime(r.lastRefreshed) || "—"}</span> },
  ];

  const total = meta?.totalCount ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const from = total === 0 ? 0 : (listState.page - 1) * listState.pageSize + 1;
  const to = Math.min(listState.page * listState.pageSize, total);
  const hasFilter = !!(listState.filters.cnr || listState.filters.title);

  return (
    <div>
      <div className="toolbar">
        <div className="search" style={{ flex: "0 1 220px" }}>
          <Search aria-hidden />
          <input placeholder="Filter by CNR…" value={cnrInput} onChange={(e) => setCnrInput(e.target.value)} />
        </div>
        <div className="search" style={{ flex: "0 1 220px" }}>
          <Search aria-hidden />
          <input placeholder="Filter by case title…" value={titleInput} onChange={(e) => setTitleInput(e.target.value)} />
        </div>
        <span className="grow" />
        <div className="selectbox">
          <Select
            value={listState.sortBy ? `${listState.sortBy}:${listState.sortDirection ?? "desc"}` : "lastRefreshed:desc"}
            onChange={(e) => {
              const [field, dir] = e.target.value.split(":");
              setSort(field, dir as "asc" | "desc");
            }}
          >
            <option value="lastRefreshed:desc">Last refreshed ↓</option>
            <option value="lastRefreshed:asc">Last refreshed ↑</option>
            <option value="cnr:asc">CNR A→Z</option>
            <option value="title:asc">Title A→Z</option>
            <option value="title:desc">Title Z→A</option>
          </Select>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="ec-bulkbar">
          <span className="cnt">{selected.size} {selected.size === 1 ? "record" : "records"} selected</span>
          <Button variant="danger" icon={Trash2} onClick={() => setPendingDelete(true)}>Delete selected</Button>
          <Button variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {loading && rows.length === 0 ? (
        <LoadingState message="Loading records…" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={hasFilter ? "No records match your filters" : "No persisted eCourts records"}
          description={hasFilter ? "Try adjusting your filter values." : "Records appear here after a CNR case is saved to Lawsome."}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(r) => r.cnrNumber}
          sortBy={listState.sortBy}
          sortDirection={listState.sortDirection}
          onSort={setSort}
          footer={
            total > 0 ? (
              <div className="tbl-foot">
                <span className="cnt">Showing {from}–{to} of {total} record{total === 1 ? "" : "s"}</span>
                <Pagination page={listState.page} totalPages={totalPages} onPageChange={setPage} disabled={loading} />
              </div>
            ) : null
          }
        />
      )}

      {/* Overflow list dialog */}
      <Dialog open={!!overflow} onClose={() => setOverflow(null)} title={overflow?.title ?? ""} icon={Link2} small>
        <div className="ec-picklist">
          {overflow?.items.map((c) => (
            <button key={c.id} type="button" onClick={() => { setOverflow(null); goCase(c.siteId, c.id); }}>
              <b>{c.title}</b>
              <span>{c.caseNumber}{c.status ? ` · ${c.status}` : ""}</span>
            </button>
          ))}
        </div>
      </Dialog>

      {/* Link-to-case dialog */}
      <Dialog open={!!linkCnr} onClose={() => setLinkCnr(null)} title="Link to a case" icon={Link2} small>
        <div className="searchbox" style={{ marginBottom: 12, width: "100%" }}>
          <Search aria-hidden />
          <input autoFocus placeholder="Search cases…" value={linkSearch} onChange={(e) => setLinkSearch(e.target.value)} />
        </div>
        {linkLoading ? (
          <LoadingState message="Loading…" size="sm" />
        ) : linkedFilter.length === 0 ? (
          <EmptyState title={linkSearch ? "No cases match your search" : "No unlinked cases available"} />
        ) : (
          <div className="ec-picklist">
            {linkedFilter.map((c) => (
              <button key={c.id} type="button" onClick={() => doLink(c)}>
                <b>{c.caseNumber}</b>
                <span>{c.title}</span>
              </button>
            ))}
          </div>
        )}
      </Dialog>

      {/* Add-reference dialog */}
      <Dialog
        open={!!refCnr}
        onClose={() => setRefCnr(null)}
        title="Add CNR reference"
        icon={Plus}
        small
        footer={
          <>
            <Button variant="ghost" onClick={() => setRefCnr(null)} disabled={adding}>Cancel</Button>
            <Button variant="primary" loading={adding} disabled={adding || !selectedCase} onClick={doAddRef}>Add</Button>
          </>
        }
      >
        <div className="searchbox" style={{ marginBottom: 12, width: "100%" }}>
          <Search aria-hidden />
          <input autoFocus placeholder="Search cases…" value={caseSearch} onChange={(e) => setCaseSearch(e.target.value)} />
        </div>
        {casesLoading ? (
          <LoadingState message="Loading…" size="sm" />
        ) : caseFilter.length === 0 ? (
          <EmptyState title={caseSearch ? "No cases match your search" : "No cases found"} />
        ) : (
          <div className="ec-picklist">
            {caseFilter.map((c) => (
              <button key={c.id} type="button" className={selectedCase?.id === c.id ? "sel" : undefined} onClick={() => setSelectedCase(c)}>
                <b>{c.title}</b>
                <span>{c.caseNumber}</span>
              </button>
            ))}
          </div>
        )}
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={pendingDelete}
        onClose={() => setPendingDelete(false)}
        title={selected.size === 1 ? "Delete eCourt record" : "Delete eCourt records"}
        icon={Trash2}
        danger
        small
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(false)} disabled={deleteLoading}>Cancel</Button>
            <Button variant="danger" loading={deleteLoading} onClick={handleDeleteConfirm}>Delete</Button>
          </>
        }
      >
        <p className="lead">
          {selected.size === 1
            ? `Are you sure you want to delete the persisted record for CNR ${Array.from(selected)[0]}? This action cannot be undone.`
            : `Are you sure you want to delete ${selected.size} selected records? This action cannot be undone.`}
        </p>
      </Dialog>
    </div>
  );
}
