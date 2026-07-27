"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMediaQuery } from "@mui/material";
import { FolderOpen, Plus, Search, List, LayoutGrid, FilterX, Fingerprint, CalendarClock } from "lucide-react";

import {
  LuiRoot,
  Button,
  Pill,
  LoadingState,
  EmptyState,
  DataTable,
  Pagination,
  type Column,
} from "@/design-system";
import { useUserRole } from "@/hooks/useUserRole";
import {
  fetchOrganizationCases,
  fetchSiteCases,
  fetchOrganizationUsers,
  fetchSiteUsers,
  fetchOrganizationUserSites,
  fetchOrganizationSites,
} from "@/app/organization/services/api";
import { Case, CaseStatus, User, Site } from "@/app/organization/types";
import type { CaseListFilters, SiteCaseListFilters } from "@/app/organization/types/listFilterTypes";
import QuickAddCaseDialog from "@/app/organization/components/cases/QuickAddCaseDialog";
import { useToast } from "@/contexts/ToastContext";
import { useListQuery } from "@/hooks/useListQuery";
import type { PagedResponse } from "@/types/pagination";
import { classifyListError } from "@/utils/errorHandler";
import { CASE_STATUS_ORDER, CASE_STATUS_LABEL, caseStatusTone } from "@/app/organization/components/caseStatusUi";

const STATUS_ORDER_RANK: Record<string, number> = {
  [CaseStatus.Open]: 0,
  [CaseStatus.InProgress]: 1,
  [CaseStatus.OnHold]: 2,
  [CaseStatus.Closed]: 3,
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

const avatarStyle: React.CSSProperties = { background: "var(--brand-soft)", color: "var(--brand)" };

/**
 * Design-system Cases list (flag `cases`). Rebuilds the org/site cases register
 * on the DS DataTable + card view while preserving the Phase-0 contract (§H):
 * org/site modes via `?siteId=`, useListQuery paging/sort/filter, the same
 * filters + OrgClerk-sees-none behaviour, AddCaseModal, and error classification.
 */
export default function CasesNew({ params }: { params: Promise<{ id: string }> }) {
  const organizationId = use(params).id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError } = useToast();
  const siteIdFromQuery = searchParams.get("siteId");

  const {
    isOrganizationAdmin,
    isSiteAdmin,
    isSiteClerk,
    isSiteSrLegalExpert,
    isSiteLegalExpert,
    canEditCases,
    currentUserId,
    isLoading: roleLoading,
  } = useUserRole(organizationId);

  const isOrgMode = isOrganizationAdmin;
  const isSiteMode = isSiteAdmin || isSiteClerk || isSiteSrLegalExpert || isSiteLegalExpert;

  const { params: listParams, state: listState, setPage, setSort, setFilter, clearFilters } =
    useListQuery<CaseListFilters>({
      defaultSort: { sortBy: "createdDate", sortDirection: "desc" },
      sortableFields: ["createdDate", "title", "caseNumber", "status"],
      filterKeys: ["status", "siteId", "assignedExpertId", "clientId", "search"],
    });

  const [casesMeta, setCasesMeta] = useState<PagedResponse<Case> | null>(null);
  const [allCases, setAllCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [isLoadingCases, setIsLoadingCases] = useState(false);
  const [addCaseOpen, setAddCaseOpen] = useState(false);
  const [view, setView] = useState<"table" | "card">("table");
  const [searchInput, setSearchInput] = useState(listState.filters.search ?? "");

  // Default to card view on mobile (table is unusable at narrow widths);
  // desktop keeps "table" as before. Only set the default once on mount —
  // don't fight a manual toggle if the viewport crosses the breakpoint later.
  const isMobileViewport = useMediaQuery("(max-width:768px)");
  const didSetDefaultView = useRef(false);
  useEffect(() => {
    if (didSetDefaultView.current) return;
    didSetDefaultView.current = true;
    if (isMobileViewport) setView("card");
  }, [isMobileViewport]);

  const sortByStatus = useCallback(
    (cases: Case[]) => [...cases].sort((a, b) => (STATUS_ORDER_RANK[a.status] ?? 99) - (STATUS_ORDER_RANK[b.status] ?? 99)),
    [],
  );

  const loadCases = useCallback(async () => {
    if (roleLoading) return;
    setIsLoadingCases(true);
    try {
      if (siteIdFromQuery) {
        setSiteId(siteIdFromQuery);
        const siteCaseParams = listParams as typeof listParams & SiteCaseListFilters;
        const [casesPage, siteUsersPage] = await Promise.all([
          fetchSiteCases(organizationId, siteIdFromQuery, siteCaseParams),
          fetchSiteUsers(organizationId, siteIdFromQuery),
        ]);
        setAllCases(sortByStatus(casesPage.items));
        setCasesMeta(casesPage);
        setUsers(siteUsersPage.items);
        return;
      }
      if (isOrgMode) {
        const [casesPage, orgUsersPage, sitesPage] = await Promise.all([
          fetchOrganizationCases(organizationId, listParams),
          fetchOrganizationUsers(organizationId),
          fetchOrganizationSites(organizationId),
        ]);
        setAllCases(sortByStatus(casesPage.items));
        setCasesMeta(casesPage);
        setUsers(orgUsersPage.items);
        setSites(sitesPage.items);
        setSiteId(null);
      } else if (isSiteMode && currentUserId) {
        const sitesPage = await fetchOrganizationUserSites(organizationId, currentUserId);
        const resolvedSiteId = sitesPage.items[0]?.id ? String(sitesPage.items[0].id) : null;
        if (!resolvedSiteId) {
          setAllCases([]);
          setSiteId(null);
          return;
        }
        setSiteId(resolvedSiteId);
        const siteCaseParams = listParams as typeof listParams & SiteCaseListFilters;
        const [casesPage, siteUsersPage] = await Promise.all([
          fetchSiteCases(organizationId, resolvedSiteId, siteCaseParams),
          fetchSiteUsers(organizationId, resolvedSiteId),
        ]);
        setAllCases(sortByStatus(casesPage.items));
        setCasesMeta(casesPage);
        setUsers(siteUsersPage.items);
      }
    } catch (error) {
      const info = classifyListError(error);
      if (info.kind === "invalid-filter") {
        showError(info.messages[0] ?? "Invalid filter — please adjust and try again.");
      } else if (info.kind === "not-found") {
        setAllCases([]);
        setCasesMeta(null);
      } else if (info.kind === "forbidden") {
        console.error("Failed to load cases (403 Forbidden):", error);
        showError("You do not have permission to view cases for this organization.");
        setAllCases([]);
      } else if (info.kind === "auth") {
        console.error("Failed to load cases (401 Unauthorized):", error);
        showError("Session expired — please refresh the page.");
        setAllCases([]);
      } else {
        console.error("Failed to load cases:", error);
        setAllCases([]);
        if (siteIdFromQuery) showError("Unable to load cases for the specified site.");
      }
    } finally {
      setIsLoadingCases(false);
    }
  }, [isOrgMode, isSiteMode, currentUserId, organizationId, roleLoading, siteIdFromQuery, listParams, showError, sortByStatus]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  // Keep the search box in sync with URL state, and debounce commits.
  useEffect(() => setSearchInput(listState.filters.search ?? ""), [listState.filters.search]);
  useEffect(() => {
    const t = setTimeout(() => {
      const v = searchInput.trim();
      if (v !== (listState.filters.search ?? "")) setFilter("search", v || undefined);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const goToCase = useCallback(
    (c: Case) => {
      if (!c.siteId) return;
      router.push(`/organization/${organizationId}/sites/${c.siteId}/cases/${c.id}`);
    },
    [router, organizationId],
  );

  const hasActiveFilters =
    !!listState.filters.status ||
    (!siteIdFromQuery && !!listState.filters.siteId) ||
    !!listState.filters.assignedExpertId ||
    !!listState.filters.clientId ||
    !!listState.filters.search;

  const handleClearFilters = useCallback(() => {
    if (siteIdFromQuery) {
      setFilter("status", undefined);
      setFilter("search", undefined);
      setFilter("assignedExpertId", undefined);
      setFilter("clientId", undefined);
    } else {
      clearFilters();
    }
    setSearchInput("");
  }, [siteIdFromQuery, setFilter, clearFilters]);

  const userMap = useMemo(() => {
    const m = new Map<string, string>();
    users.forEach((u) => {
      if (u.id) m.set(String(u.id), u.fullName);
      if (u.userId) m.set(String(u.userId), u.fullName);
    });
    return m;
  }, [users]);

  const assignedName = (c: Case) => userMap.get(String(c.assignedToId)) || "—";

  const columns: Column<Case>[] = [
    {
      key: "title",
      header: "Case",
      sortField: "title",
      render: (c) => (
        <div className="case-row-title">
          <b>{c.title}</b>
          <span>{c.caseKey || "—"}</span>
        </div>
      ),
    },
    { key: "caseNumber", header: "Case No.", sortField: "caseNumber", render: (c) => c.caseNumber || "—" },
    { key: "cnr", header: "CNR", render: (c) => c.cnrNumber || "—" },
    ...(isOrgMode
      ? [{ key: "site", header: "Site", render: (c: Case) => c.siteName || "—" }]
      : []),
    {
      key: "status",
      header: "Status",
      sortField: "status",
      render: (c) => (
        <Pill tone={caseStatusTone(c.status)} dot>
          {CASE_STATUS_LABEL[c.status] ?? c.status}
        </Pill>
      ),
    },
    {
      key: "assignee",
      header: "Assigned to",
      render: (c) => {
        const name = assignedName(c);
        if (name === "—") return "—";
        return (
          <span className="who2">
            <span className="a" style={avatarStyle}>
              {initials(name)}
            </span>
            {name}
          </span>
        );
      },
    },
  ];

  const total = casesMeta?.totalCount ?? 0;
  const totalPages = casesMeta?.totalPages ?? 0;
  const from = total === 0 ? 0 : (listState.page - 1) * listState.pageSize + 1;
  const to = Math.min(listState.page * listState.pageSize, total);

  const footer =
    total > 0 ? (
      <div className="tbl-foot">
        <span className="cnt">
          Showing {from}–{to} of {total} case{total === 1 ? "" : "s"}
        </span>
        <Pagination page={listState.page} totalPages={totalPages} onPageChange={setPage} disabled={isLoadingCases} />
      </div>
    ) : null;

  const loading = roleLoading || isLoadingCases;

  return (
    <LuiRoot>
      <div className="sheet">
        <div className="page-head">
          <div className="ph-lead">
            <div className="eyebrow">
              <FolderOpen aria-hidden /> Case register
            </div>
            <h1>Cases</h1>
            <div className="sub">All matters across your firm&apos;s sites.</div>
          </div>
          {canEditCases && (
            <div className="ph-actions">
              <Button variant="primary" icon={Plus} onClick={() => setAddCaseOpen(true)}>
                Add case
              </Button>
            </div>
          )}
        </div>

        <div className="toolbar">
          <div className="search">
            <Search aria-hidden />
            <input
              placeholder={isOrgMode ? "Search by title, case number, site…" : "Search by title, case number…"}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={isLoadingCases}
            />
          </div>
          <div className="selectbox">
            <select
              aria-label="Status"
              value={listState.filters.status ?? ""}
              onChange={(e) => setFilter("status", e.target.value || undefined)}
              disabled={isLoadingCases}
            >
              <option value="">All status</option>
              {CASE_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {CASE_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          {isOrgMode && sites.length > 0 && (
            <div className="selectbox">
              <select
                aria-label="Site"
                value={listState.filters.siteId ?? ""}
                onChange={(e) => setFilter("siteId", e.target.value || undefined)}
                disabled={isLoadingCases}
              >
                <option value="">All sites</option>
                {sites.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {users.length > 0 && (
            <div className="selectbox">
              <select
                aria-label="Assigned to"
                value={listState.filters.assignedExpertId ?? ""}
                onChange={(e) => setFilter("assignedExpertId", e.target.value || undefined)}
                disabled={isLoadingCases}
              >
                <option value="">All assignees</option>
                {users.map((u) => (
                  <option key={String(u.id)} value={String(u.id)}>
                    {u.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}
          {hasActiveFilters && (
            <Button variant="ghost" icon={FilterX} onClick={handleClearFilters}>
              <span className="btn-label">Clear</span>
            </Button>
          )}
          <div className="grow" />
          <div className="viewtoggle">
            <button
              type="button"
              className={view === "table" ? "active" : undefined}
              aria-label="Table view"
              aria-pressed={view === "table"}
              onClick={() => setView("table")}
            >
              <List aria-hidden />
            </button>
            <button
              type="button"
              className={view === "card" ? "active" : undefined}
              aria-label="Card view"
              aria-pressed={view === "card"}
              onClick={() => setView("card")}
            >
              <LayoutGrid aria-hidden />
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading cases…" />
        ) : allCases.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No cases found"
            description={
              hasActiveFilters
                ? "Try adjusting your filters."
                : "You don't have access to any cases yet. Cases appear here when you create them, are assigned to them, or are added as a contributor."
            }
            action={
              hasActiveFilters ? (
                <Button variant="secondary" icon={FilterX} onClick={handleClearFilters}>
                  Clear all filters
                </Button>
              ) : canEditCases ? (
                <Button variant="primary" icon={Plus} onClick={() => setAddCaseOpen(true)}>
                  Add case
                </Button>
              ) : undefined
            }
          />
        ) : view === "table" ? (
          <DataTable
            columns={columns}
            rows={allCases}
            getRowKey={(c) => String(c.id)}
            onRowClick={goToCase}
            sortBy={listState.sortBy}
            sortDirection={listState.sortDirection}
            onSort={setSort}
            footer={footer}
          />
        ) : (
          <>
            <div className="cgrid">
              {allCases.map((c) => {
                const name = assignedName(c);
                const eyebrow = [c.siteName].filter(Boolean).join(" · ") || "Matter";
                return (
                  <div
                    key={String(c.id)}
                    className="ccard"
                    role="button"
                    tabIndex={0}
                    onClick={() => goToCase(c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        goToCase(c);
                      }
                    }}
                  >
                    <div className="ct-head">
                      <span className="ct-eyebrow">{eyebrow}</span>
                      <Pill tone={caseStatusTone(c.status)} dot>
                        {CASE_STATUS_LABEL[c.status] ?? c.status}
                      </Pill>
                    </div>
                    <h3>{c.title}</h3>
                    <div className="cnr">
                      <Fingerprint aria-hidden />
                      {c.cnrNumber || c.caseNumber || "No CNR linked"}
                    </div>
                    <div className="ct-foot">
                      <CalendarClock width={15} style={{ color: "var(--brand)" }} aria-hidden />
                      {c.caseKey || "—"}
                      {name !== "—" ? (
                        <span className="who2">
                          <span className="a" style={avatarStyle}>
                            {initials(name)}
                          </span>
                          {name}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            {footer ? (
              <div className="card" style={{ marginTop: 16 }}>
                {footer}
              </div>
            ) : null}
          </>
        )}
      </div>

      <QuickAddCaseDialog
        open={addCaseOpen}
        onClose={() => setAddCaseOpen(false)}
        onSuccess={loadCases}
        organizationId={organizationId}
        isOrgMode={isOrgMode}
        siteId={siteId}
      />
    </LuiRoot>
  );
}
