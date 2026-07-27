"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, Search, LayoutGrid, List as ListIcon, MapPin, Phone, Mail, KeyRound } from "lucide-react";
import {
  LuiRoot,
  Button,
  Select,
  DataTable,
  Pagination,
  LoadingState,
  ErrorState,
  EmptyState,
  type Column,
} from "@/design-system";
import { fetchOrganizationSites } from "../../services/api";
import { Site } from "../../types";
import type { SiteListFilters } from "../../types/listFilterTypes";
import { classifyListError } from "@/utils/errorHandler";
import { useToast } from "@/contexts/ToastContext";
import { useListQuery } from "@/hooks/useListQuery";
import type { PagedResponse } from "@/types/pagination";
import AddSiteDialog from "@/app/organization/components/modals/AddSiteDialog";

const AV = ["av1", "av2", "av3", "av4", "av5"];
const initials = (name: string) =>
  (name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();

/**
 * DS Branches (Sites) list. Reuses the existing site service + useListQuery
 * (contract §I / dashboard Sites tab): search, sort, grid/table view, pager.
 * Card/row click → site detail. Create via the existing AddSiteModal (kept until
 * the Phase-5 legacy-removal pass).
 */
export default function BranchesNew({ orgId }: { orgId: string }) {
  const router = useRouter();
  const { showError } = useToast();
  const { params: listParams, state: listState, setPage, setSort, setFilter, clearFilters } =
    useListQuery<SiteListFilters>({
      defaultSort: { sortBy: "name", sortDirection: "asc" },
      sortableFields: ["name", "createdDate", "status"],
      filterKeys: ["search"],
    });

  const [sites, setSites] = useState<Site[]>([]);
  const [meta, setMeta] = useState<PagedResponse<Site> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [addOpen, setAddOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(listState.filters.search ?? "");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchOrganizationSites(orgId, listParams);
      setSites(page.items);
      setMeta(page);
    } catch (err) {
      const info = classifyListError(err);
      if (info.kind === "invalid-filter") showError(info.messages[0] ?? "Invalid filter — please adjust and try again.");
      else if (info.kind === "forbidden") { setError("You do not have permission to view sites for this organization."); setSites([]); }
      else if (info.kind === "auth") { setError("Session expired — please refresh the page."); setSites([]); }
      else { setError("Failed to load sites."); setSites([]); }
    } finally {
      setLoading(false);
    }
  }, [orgId, listParams, showError]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => setSearchInput(listState.filters.search ?? ""), [listState.filters.search]);
  useEffect(() => {
    const t = setTimeout(() => {
      const v = searchInput.trim();
      if (v !== (listState.filters.search ?? "")) setFilter("search", v || undefined);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const goSite = (s: Site) => {
    if (s.id) router.push(`/organization/${orgId}/sites/${s.id}`);
  };

  const formatAddress = (s: Site) => {
    const parts = [s.address, s.locality, s.district, s.state].filter(Boolean).join(", ");
    return s.pincode ? `${parts} - ${s.pincode}` : parts;
  };

  const columns: Column<Site>[] = [
    {
      key: "name",
      header: "Site",
      sortField: "name",
      render: (s) => (
        <span className="who2">
          <span className={`a ${AV[0]}`}>{initials(s.name)}</span>
          {s.name}
        </span>
      ),
    },
    { key: "location", header: "Location", render: (s) => [s.district, s.state].filter(Boolean).join(", ") || "—" },
    { key: "phone", header: "Phone", render: (s) => (s.phoneNumber ? String(s.phoneNumber) : "—") },
    { key: "cases", header: "Cases", align: "right", render: (s) => s.casesCount ?? "—" },
    { key: "staff", header: "Staff", align: "right", render: (s) => s.usersCount ?? "—" },
  ];

  const total = meta?.totalCount ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const from = total === 0 ? 0 : (listState.page - 1) * listState.pageSize + 1;
  const to = Math.min(listState.page * listState.pageSize, total);

  return (
    <LuiRoot>
      <div className="sheet">
        <div className="page-head">
          <div className="ph-lead">
            <div className="eyebrow">
              <Building2 aria-hidden /> Firm structure
            </div>
            <h1>Sites</h1>
            <div className="sub">Manage all offices in your organization — each site has its own cases, lawyers and clients.</div>
          </div>
          <div className="ph-actions">
            <Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>
              Add Site
            </Button>
          </div>
        </div>

        <div className="toolbar">
          <div className="search">
            <Search aria-hidden />
            <input placeholder="Search by name, city or state…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          <span className="grow" />
          <div className="selectbox">
            <Select
              value={listState.sortBy ? `${listState.sortBy}:${listState.sortDirection ?? "asc"}` : "name:asc"}
              onChange={(e) => {
                const [field, dir] = e.target.value.split(":");
                setSort(field, dir as "asc" | "desc");
              }}
            >
              <option value="name:asc">Name A→Z</option>
              <option value="name:desc">Name Z→A</option>
              <option value="createdDate:desc">Newest first</option>
              <option value="createdDate:asc">Oldest first</option>
            </Select>
          </div>
          <div className="viewtoggle">
            <button className={view === "grid" ? "active" : undefined} onClick={() => setView("grid")} aria-label="Grid view">
              <LayoutGrid aria-hidden />
            </button>
            <button className={view === "table" ? "active" : undefined} onClick={() => setView("table")} aria-label="Table view">
              <ListIcon aria-hidden />
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading sites…" />
        ) : error ? (
          <ErrorState title="Couldn't load sites" description={error} action={<Button variant="secondary" onClick={load}>Retry</Button>} />
        ) : sites.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No sites found"
            description={listState.filters.search ? "Try adjusting your search." : "No sites yet for this organization."}
            action={
              listState.filters.search ? (
                <Button variant="secondary" onClick={() => { setSearchInput(""); clearFilters(); }}>Clear search</Button>
              ) : (
                <Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>Add Site</Button>
              )
            }
          />
        ) : view === "grid" ? (
          <>
            <div className="grid-cards">
              {sites.map((s, i) => (
                <div key={s.id} className="ecard" onClick={() => goSite(s)} style={{ cursor: "pointer" }}>
                  <div className="ec-top">
                    <span className={`ec-av ${AV[i % AV.length]}`}>{initials(s.name)}</span>
                    <div style={{ minWidth: 0 }}>
                      <div className="ec-name">{s.name}</div>
                      {s.siteKey && <div className="ec-sub">{s.siteKey}</div>}
                    </div>
                  </div>
                  <div className="ec-meta">
                    <div className="r"><MapPin aria-hidden /> {formatAddress(s) || "—"}</div>
                    {s.phoneNumber && <div className="r"><Phone aria-hidden /> {String(s.phoneNumber)}</div>}
                    {s.emailId && <div className="r"><Mail aria-hidden /> {s.emailId}</div>}
                    {s.siteKey && <div className="r"><KeyRound aria-hidden /> {s.siteKey}</div>}
                  </div>
                  <div className="ec-foot">
                    <div className="ec-stat"><b>{s.casesCount ?? "—"}</b><span>Cases</span></div>
                    <div className="ec-stat"><b>{s.usersCount ?? "—"}</b><span>Staff</span></div>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
                <Pagination page={listState.page} totalPages={totalPages} onPageChange={setPage} disabled={loading} />
              </div>
            )}
          </>
        ) : (
          <DataTable
            columns={columns}
            rows={sites}
            getRowKey={(s) => s.id}
            onRowClick={goSite}
            sortBy={listState.sortBy}
            sortDirection={listState.sortDirection}
            onSort={setSort}
            footer={
              total > 0 ? (
                <div className="tbl-foot">
                  <span className="cnt">Showing {from}–{to} of {total} site{total === 1 ? "" : "s"}</span>
                  <Pagination page={listState.page} totalPages={totalPages} onPageChange={setPage} disabled={loading} />
                </div>
              ) : null
            }
          />
        )}

        <AddSiteDialog open={addOpen} onClose={() => setAddOpen(false)} onSuccess={() => { setAddOpen(false); load(); }} organizationId={orgId} />
      </div>
    </LuiRoot>
  );
}
