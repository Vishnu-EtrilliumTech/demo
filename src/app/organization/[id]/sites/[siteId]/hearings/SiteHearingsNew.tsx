"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, FilterX, Gavel, Lock, MapPin, Search } from "lucide-react";

import { LuiRoot, LoadingState, EmptyState, Card, Pill, Button, DataTable, TableFoot, type Column } from "@/design-system";
import type { PillTone } from "@/design-system";
import { fetchSiteHearings, fetchUserCaseSummary, fetchSiteUsers, fetchSiteCases } from "@/app/organization/services/api";
import { type Hearing, type Case } from "@/app/organization/types";
import { useUserRole } from "@/hooks/useUserRole";
import { useListQuery } from "@/hooks/useListQuery";
import type { PagedResponse } from "@/types/pagination";
import { paginateItems } from "@/utils/pagination";
import type { SiteHearingListFilters } from "@/app/organization/types/listFilterTypes";
import { formatDisplayDateTime } from "@/utils";

const HEARING_STATUS_TONE: Record<string, PillTone> = {
  Open: "brand",
  Scheduled: "brand",
  PlanningInProgress: "warn",
  Planned: "neutral",
  OnHold: "warn",
  Appeared: "ok",
  NotAppeared: "danger",
  Completed: "neutral",
};

/**
 * Design-system Hearings list — the DS re-skin of the legacy
 * `sites/[siteId]/hearings` page. Same dual-mode data loads (org-wide via
 * `fetchSiteHearings` + useListQuery, or per-user via `?userId=` and
 * `fetchUserCaseSummary`); the table moves onto the DS DataTable and the date
 * range / court filters move onto DS inputs. Gated behind the `site-hearings`
 * flag.
 */
export default function SiteHearingsNew({
  params,
}: {
  params: Promise<{ id: string; siteId: string }>;
}) {
  const { id: organizationId, siteId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  const { canViewHearings, isLoading: roleLoading } = useUserRole(organizationId);

  const { params: listParams, state: listState, setPage, setSort, clearSort, setFilter, clearFilters } =
    useListQuery<SiteHearingListFilters>({
      defaultSort: { sortBy: "hearingDate", sortDirection: "asc" },
      sortableFields: ["hearingDate", "createdDate"],
      filterKeys: ["from", "to", "court"],
    });

  const [hearingsMeta, setHearingsMeta] = useState<PagedResponse<Hearing> | null>(null);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [userHearings, setUserHearings] = useState<Hearing[]>([]);
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
          .map((h) => ({ ...h, assignedToName: h.assignedToName ?? nameById.get(String(h.assignedToId)) }));
        setUserHearings(siteHearings);

        const lookup: Record<string, Case> = {};
        summary.cases.forEach((c) => (lookup[String(c.id)] = c));
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
        page.items.forEach((c) => (lookup[String(c.id)] = c));
        setCaseLookup(lookup);
      })
      .catch((error) => console.error("Error loading cases for hearing lookup:", error));
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

  const displayedHearings = userId ? userHearingsPaged?.items ?? [] : hearings;
  const totalCount = userId ? userHearingsPaged?.totalCount ?? 0 : hearingsMeta?.totalCount ?? 0;
  const totalPages = userId ? userHearingsPaged?.totalPages ?? 0 : hearingsMeta?.totalPages ?? 0;

  const hasActiveFilters = !!(listState.filters.from || listState.filters.to || listState.filters.court);

  const shell = (children: React.ReactNode) => (
    <LuiRoot>
      <div className="sheet">{children}</div>
    </LuiRoot>
  );

  if (isLoading || roleLoading) return shell(<LoadingState message="Loading hearings…" />);

  if (!canViewHearings)
    return shell(
      <Card pad>
        <EmptyState
          icon={Lock}
          title="Access restricted"
          description="You don't have permission to view hearings. Please contact your administrator for access."
        />
      </Card>,
    );

  const columns: Column<Hearing>[] = [
    {
      key: "date",
      header: "Date & time",
      render: (h) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <CalendarClock width={14} height={14} style={{ color: "var(--violet)", flex: "none" }} />
          {formatDisplayDateTime(h.hearingDateTime)}
        </span>
      ),
    },
    {
      key: "case",
      header: "Case",
      render: (h) => {
        const relatedCase = caseLookup[h.caseId];
        return relatedCase?.title || h.caseName || "—";
      },
    },
    {
      key: "location",
      header: "Location",
      render: (h) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <MapPin width={14} height={14} style={{ color: "var(--text-3)", flex: "none" }} />
          {h.courtLocationDisplay || h.hearingLocation || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (h) => {
        const status = h.status || h.hearingStatus || "";
        if (!status) return "—";
        return (
          <Pill tone={HEARING_STATUS_TONE[status] ?? "neutral"} dot>
            {status}
          </Pill>
        );
      },
    },
    ...(!userId ? [{ key: "assignedTo", header: "Assigned to", render: (h: Hearing) => h.assignedToName || "—" }] : []),
    { key: "notes", header: "Notes", render: (h) => h.hearingNotes || "—" },
  ];

  return shell(
    <>
      <div className="page-head">
        <div className="ph-lead">
          <div className="eyebrow">
            <Gavel aria-hidden /> {userId ? "Personal workspace" : "Site hearings"}
          </div>
          <h1>{userId ? "My hearings" : "Hearings"}</h1>
          <div className="sub">
            {userId ? "Your upcoming and past hearings for this site." : "All upcoming and past hearings for this site."}
          </div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search" style={{ flex: "0 1 160px", maxWidth: 160 }}>
          <input
            type="date"
            aria-label="From date"
            value={listState.filters.from ?? ""}
            onChange={(e) => setFilter("from", e.target.value || undefined)}
          />
        </div>
        <div className="search" style={{ flex: "0 1 160px", maxWidth: 160 }}>
          <input
            type="date"
            aria-label="To date"
            value={listState.filters.to ?? ""}
            onChange={(e) => setFilter("to", e.target.value || undefined)}
          />
        </div>
        <div className="search">
          <Search aria-hidden />
          <input
            placeholder="Filter by court…"
            value={listState.filters.court ?? ""}
            onChange={(e) => setFilter("court", e.target.value || undefined)}
          />
        </div>
        <div className="selectbox">
          <select
            aria-label="Sort"
            value={listState.sortBy ? `${listState.sortBy}:${listState.sortDirection ?? "asc"}` : ""}
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
            <option value="hearingDate:asc">Hearing date ↑</option>
            <option value="hearingDate:desc">Hearing date ↓</option>
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

      {displayedHearings.length === 0 ? (
        <Card pad>
          <EmptyState
            icon={Gavel}
            title="No hearings found"
            description={hasActiveFilters ? "Try adjusting or clearing your filters." : "Hearings for this site will appear here."}
            action={
              hasActiveFilters ? (
                <Button variant="secondary" icon={FilterX} onClick={clearFilters}>
                  Clear all filters
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <DataTable
          columns={columns}
          rows={displayedHearings}
          getRowKey={(h) => String(h.id)}
          onRowClick={(h) => router.push(`/organization/${organizationId}/sites/${siteId}/cases/${h.caseId}?tab=hearings`)}
          footer={
            totalCount > 0 ? (
              <TableFoot
                count={`${totalCount} hearing${totalCount === 1 ? "" : "s"}`}
                page={listState.page}
                totalPages={totalPages}
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
