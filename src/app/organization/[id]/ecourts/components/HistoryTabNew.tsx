"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SearchX } from "lucide-react";
import { DataTable, Pagination, LoadingState, EmptyState, type Column } from "@/design-system";
import { fetchSearchHistory } from "@/app/organization/services/ecourtapi";
import { SearchHistoryItem } from "@/app/organization/types/ecourtTypes";
import { useToast } from "@/contexts/ToastContext";
import { formatDisplayDateTime } from "@/utils";
import { useListQuery } from "@/hooks/useListQuery";
import type { PagedResponse } from "@/types/pagination";

interface HistoryTabNewProps {
  orgId: string;
  refreshKey: number;
}

/** DS search-history tab (contract §J): read-only log, row → CNR viewer. */
export function HistoryTabNew({ orgId, refreshKey }: HistoryTabNewProps) {
  const router = useRouter();
  const { showError } = useToast();

  const { params: listParams, state: listState, setPage } = useListQuery({
    defaultSort: { sortBy: "searchedAt", sortDirection: "desc" },
    sortableFields: ["searchedAt"],
    filterKeys: [],
  });
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [meta, setMeta] = useState<PagedResponse<SearchHistoryItem> | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await fetchSearchHistory(orgId, listParams);
      setHistory(page.items);
      setMeta(page);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load search history");
    } finally {
      setLoading(false);
    }
  }, [orgId, showError, listParams]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const columns: Column<SearchHistoryItem>[] = [
    {
      key: "cnr",
      header: "CNR Number",
      render: (r) => (
        <span className="chip-mono">
          <b>{r.cnrNumber}</b>
        </span>
      ),
    },
    { key: "title", header: "Case Title", render: (r) => r.caseTitle || "—" },
    { key: "court", header: "Court Name", render: (r) => r.courtName || "—" },
    { key: "by", header: "Searched By", render: (r) => r.searchedByName || "—" },
    {
      key: "at",
      header: "Searched At",
      render: (r) => <span style={{ whiteSpace: "nowrap" }}>{formatDisplayDateTime(r.searchedAt) || "—"}</span>,
    },
  ];

  const total = meta?.totalCount ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const from = total === 0 ? 0 : (listState.page - 1) * listState.pageSize + 1;
  const to = Math.min(listState.page * listState.pageSize, total);

  if (loading && history.length === 0) return <LoadingState message="Loading history…" />;

  if (!loading && history.length === 0) {
    return <EmptyState icon={SearchX} title="No search history" description="Your eCourts searches will appear here." />;
  }

  return (
    <DataTable
      columns={columns}
      rows={history}
      getRowKey={(r) => r.id}
      onRowClick={(r) => router.push(`/organization/${orgId}/ecourt/${r.cnrNumber}`)}
      footer={
        total > 0 ? (
          <div className="tbl-foot">
            <span className="cnt">
              Showing {from}–{to} of {total} search{total === 1 ? "" : "es"}
            </span>
            <Pagination page={listState.page} totalPages={totalPages} onPageChange={setPage} disabled={loading} />
          </div>
        ) : null
      }
    />
  );
}
