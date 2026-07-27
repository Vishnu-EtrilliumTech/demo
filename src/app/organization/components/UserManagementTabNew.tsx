"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, LayoutGrid, List as ListIcon, Mail, Phone, BadgeCheck, ShieldAlert } from "lucide-react";
import {
  Button,
  Pill,
  Select,
  Dialog,
  DataTable,
  Pagination,
  LoadingState,
  ErrorState,
  EmptyState,
  type Column,
} from "@/design-system";
import { User, Site } from "../types";
import type { OrgUserListFilters, SiteUserListFilters } from "../types/listFilterTypes";
import { fetchOrganizationUsers, fetchSiteUsers, fetchOrganizationSites } from "../services/api";
import { useToast } from "@/contexts/ToastContext";
import { classifyListError } from "@/utils/errorHandler";
import EditUserDialog from "@/app/organization/components/modals/EditUserDialog";
import { formatDisplayDate, getRoleLabel } from "@/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useListQuery } from "@/hooks/useListQuery";
import type { PagedResponse } from "@/types/pagination";

const AV = ["av1", "av2", "av3", "av4", "av5"];
const initials = (name: string) =>
  (name || "?").split(/\s+/).slice(0, 2).map((w) => w.charAt(0)).join("").toUpperCase();
const avFor = (name: string) => AV[(name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AV.length];

const ROLE_OPTIONS = [
  { value: "SiteAdmin", label: "Site Admin" },
  { value: "SiteClerk", label: "Site Clerk" },
  { value: "SiteLegalExpert", label: "Legal Expert" },
  { value: "SiteSrLegalExpert", label: "Senior Legal Expert" },
  { value: "OrganizationAdmin", label: "Org Admin" },
  { value: "OrganizationClerk", label: "Org Clerk" },
];

interface Props {
  organizationId: string;
  siteId?: string | null;
  refreshKey?: number;
  showSiteColumn?: boolean;
}

/**
 * DS Users list (Lawyers screen body). Mirrors the legacy UserManagementTab:
 * dual org/site mode, server-driven useListQuery, per-user RBAC edit/delete,
 * filters (search / Site / Role), grid + table views. Edit uses the existing
 * EditUserModal (MUI) — kept until the Phase-5 legacy-removal pass.
 */
export function UserManagementTabNew({ organizationId, siteId = null, refreshKey = 0, showSiteColumn }: Props) {
  const { showError } = useToast();
  const {
    isOrganizationAdmin, isOrganizationClerk, isSiteAdmin,
    isSiteLegalExpert, isSiteSrLegalExpert,
    canDeleteSiteUsersAsSiteAdmin, canDeleteSiteUsers,
    currentUserId, isLoading: rolesLoading,
  } = useUserRole(organizationId);

  const isSiteMode = !!siteId;
  const { params: listParams, state: listState, setPage, setSort, setFilter, clearFilters } =
    useListQuery<OrgUserListFilters | SiteUserListFilters>({
      defaultSort: { sortBy: "name", sortDirection: "asc" },
      sortableFields: ["name", "email", "createdDate", "role"],
      filterKeys: isSiteMode ? ["role", "status", "search"] : ["siteId", "role", "status", "search"],
    });

  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PagedResponse<User> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [notAuthorizedOpen, setNotAuthorizedOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(listState.filters.search ?? "");

  // RBAC (verbatim from legacy UserManagementTab)
  const isOrgLevelUser = (u: User) => !!u.roles?.some((r) => r === "OrganizationAdmin" || r === "OrganizationClerk");
  const isTargetOrgAdmin = (u: User) => !!u.roles?.includes("OrganizationAdmin");
  const isTargetSiteAdmin = (u: User) => !!u.roles?.includes("SiteAdmin");
  const canActOnSiteAdmin = isOrganizationAdmin || isOrganizationClerk || isSiteAdmin;

  const canEditUserFn = useCallback(
    (u: User) => {
      const isSelf = !!currentUserId && String(u.id || u.userId) === currentUserId;
      if (isTargetOrgAdmin(u)) return isOrganizationAdmin;
      if (isTargetSiteAdmin(u)) return canActOnSiteAdmin;
      if (isSiteMode) {
        if (isSiteAdmin) return !isOrgLevelUser(u);
        if (isSiteLegalExpert || isSiteSrLegalExpert) return isSelf;
        return false;
      }
      if (isOrganizationAdmin) return true;
      if (isOrganizationClerk) return isSelf || !!u.siteId;
      return false;
    },
    [isSiteMode, isSiteAdmin, isSiteLegalExpert, isSiteSrLegalExpert, isOrganizationAdmin, isOrganizationClerk, canActOnSiteAdmin, currentUserId],
  );
  const canDeleteUserFn = useCallback(
    (u: User) => {
      if (isTargetOrgAdmin(u)) return isOrganizationAdmin;
      if (isTargetSiteAdmin(u)) return canActOnSiteAdmin;
      if (isSiteMode) return canDeleteSiteUsersAsSiteAdmin && !isOrgLevelUser(u);
      return canDeleteSiteUsers;
    },
    [isSiteMode, canDeleteSiteUsersAsSiteAdmin, canDeleteSiteUsers, isOrganizationAdmin, canActOnSiteAdmin],
  );

  const fetchUsers = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setError(null);
    try {
      const page = isSiteMode && siteId
        ? await fetchSiteUsers(organizationId, siteId, listParams)
        : await fetchOrganizationUsers(organizationId, listParams);
      setUsers(page.items);
      setMeta(page);
    } catch (err) {
      const info = classifyListError(err);
      if (info.kind === "invalid-filter") showError(info.messages[0] ?? "Invalid filter — please adjust and try again.");
      else if (info.kind === "forbidden") { setError("You do not have permission to view users for this organization."); setUsers([]); }
      else if (info.kind === "auth") { setError("Session expired — please refresh the page."); setUsers([]); }
      else { setError("Failed to load users."); setUsers([]); }
    } finally {
      setLoading(false);
    }
  }, [organizationId, siteId, isSiteMode, listParams, showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, refreshKey]);

  useEffect(() => {
    if (isSiteMode || !organizationId) return;
    let cancelled = false;
    fetchOrganizationSites(organizationId).then((p) => { if (!cancelled) setSites(p.items); }).catch(() => {});
    return () => { cancelled = true; };
  }, [organizationId, isSiteMode]);

  useEffect(() => setSearchInput(listState.filters.search ?? ""), [listState.filters.search]);
  useEffect(() => {
    const t = setTimeout(() => {
      const v = searchInput.trim();
      if (v !== (listState.filters.search ?? "")) setFilter("search", v || undefined);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const siteOptions = useMemo(() => sites.map((s) => ({ value: String(s.id), label: s.name })), [sites]);
  const showSite = showSiteColumn !== undefined ? showSiteColumn : !isSiteMode;

  const handleUserClick = (u: User) => {
    if (!canEditUserFn(u) && !canDeleteUserFn(u)) {
      if (isOrganizationClerk && !isOrganizationAdmin && !u.siteId) setNotAuthorizedOpen(true);
      return;
    }
    setUserToEdit(u);
    setEditModalOpen(true);
  };

  const roleLabels = (u: User) => u.roles?.map(getRoleLabel).join(", ") || "No roles";

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "User",
      sortField: "name",
      render: (u) => (
        <span className="who2">
          <span className={`a ${avFor(u.fullName)}`}>{initials(u.fullName)}</span>
          {u.fullName}
        </span>
      ),
    },
    { key: "email", header: "Email", sortField: "email", render: (u) => u.emailId || "—" },
    { key: "phone", header: "Phone", render: (u) => (u.phoneNumber ? String(u.phoneNumber) : "—") },
    { key: "role", header: "Role", sortField: "role", render: (u) => <Pill tone="neutral">{roleLabels(u)}</Pill> },
    ...(showSite ? [{ key: "site", header: "Site", render: (u: User) => u.siteName || "Head Office" }] : []),
    { key: "registered", header: "Registered", render: (u) => formatDisplayDate(u.registeredDate) || "—" },
  ];

  const total = meta?.totalCount ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const from = total === 0 ? 0 : (listState.page - 1) * listState.pageSize + 1;
  const to = Math.min(listState.page * listState.pageSize, total);
  const hasFilters = !!(listState.filters.search || listState.filters.role || listState.filters.status || (!isSiteMode && (listState.filters as OrgUserListFilters).siteId));

  return (
    <div>
      <div className="toolbar">
        <div className="search" style={{ flex: "1 1 240px" }}>
          <Search aria-hidden />
          <input placeholder="Search users by name, email…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
        {!isSiteMode && siteOptions.length > 0 && (
          <div className="selectbox">
            <Select
              value={(listState.filters as OrgUserListFilters).siteId ?? ""}
              onChange={(e) => setFilter("siteId", e.target.value || undefined)}
            >
              <option value="">All sites</option>
              {siteOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
        )}
        <div className="selectbox">
          <Select value={listState.filters.role ?? ""} onChange={(e) => setFilter("role", e.target.value || undefined)}>
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
        {hasFilters && (
          <Button variant="ghost" onClick={() => { setSearchInput(""); clearFilters(); }}>Clear filters</Button>
        )}
        <span className="grow" />
        <div className="selectbox">
          <Select
            value={listState.sortBy ? `${listState.sortBy}:${listState.sortDirection ?? "asc"}` : "name:asc"}
            onChange={(e) => { const [f, d] = e.target.value.split(":"); setSort(f, d as "asc" | "desc"); }}
          >
            <option value="name:asc">Name A→Z</option>
            <option value="name:desc">Name Z→A</option>
            <option value="email:asc">Email A→Z</option>
            <option value="createdDate:desc">Newest first</option>
            <option value="createdDate:asc">Oldest first</option>
          </Select>
        </div>
        <div className="viewtoggle">
          <button className={view === "grid" ? "active" : undefined} onClick={() => setView("grid")} aria-label="Grid view"><LayoutGrid aria-hidden /></button>
          <button className={view === "table" ? "active" : undefined} onClick={() => setView("table")} aria-label="Table view"><ListIcon aria-hidden /></button>
        </div>
      </div>

      {loading || rolesLoading ? (
        <LoadingState message="Loading users…" />
      ) : error ? (
        <ErrorState title="Couldn't load users" description={error} action={<Button variant="secondary" onClick={fetchUsers}>Retry</Button>} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No users found"
          description={hasFilters ? "Try adjusting your filters." : "No users available for this scope."}
          action={hasFilters ? <Button variant="secondary" onClick={() => { setSearchInput(""); clearFilters(); }}>Clear filters</Button> : undefined}
        />
      ) : view === "grid" ? (
        <>
          <div className="grid-cards">
            {users.map((u) => {
              const canOpen = canEditUserFn(u) || canDeleteUserFn(u);
              return (
                <div key={String(u.id || u.userId)} className="ecard" onClick={() => handleUserClick(u)} style={{ cursor: canOpen ? "pointer" : "default" }}>
                  <div className="ec-top">
                    <span className={`ec-av ${avFor(u.fullName)}`}>{initials(u.fullName)}</span>
                    <div style={{ minWidth: 0 }}>
                      <div className="ec-name">{u.fullName}</div>
                      <div className="ec-sub">{roleLabels(u)}</div>
                    </div>
                  </div>
                  <div className="ec-meta">
                    <div className="r"><Mail aria-hidden /> {u.emailId || "—"}</div>
                    {u.phoneNumber && <div className="r"><Phone aria-hidden /> {String(u.phoneNumber)}</div>}
                    {showSite && <div className="r"><BadgeCheck aria-hidden /> {u.siteName || "Head Office"}</div>}
                    <div className="r" style={{ color: "var(--text-3)" }}>Registered {formatDisplayDate(u.registeredDate) || "—"}</div>
                  </div>
                </div>
              );
            })}
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
          rows={users}
          getRowKey={(u) => String(u.id || u.userId)}
          onRowClick={handleUserClick}
          sortBy={listState.sortBy}
          sortDirection={listState.sortDirection}
          onSort={setSort}
          footer={
            total > 0 ? (
              <div className="tbl-foot">
                <span className="cnt">Showing {from}–{to} of {total} user{total === 1 ? "" : "s"}</span>
                <Pagination page={listState.page} totalPages={totalPages} onPageChange={setPage} disabled={loading} />
              </div>
            ) : null
          }
        />
      )}

      {userToEdit && (
        <EditUserDialog
          open={editModalOpen}
          onClose={() => { setEditModalOpen(false); setUserToEdit(null); }}
          onSuccess={() => { setEditModalOpen(false); setUserToEdit(null); fetchUsers(); }}
          organizationId={organizationId}
          userId={String(userToEdit.id || userToEdit.userId)}
          siteId={isSiteMode ? siteId : null}
          isSiteMode={isSiteMode}
          userSiteId={userToEdit.siteId ?? null}
          isOrgMode={!isSiteMode}
          siteName={userToEdit.siteName || (isSiteMode ? "" : "Head Quarters")}
          canDelete={canDeleteUserFn(userToEdit)}
          userName={userToEdit.fullName}
          onDeleteSuccess={() => { setEditModalOpen(false); setUserToEdit(null); fetchUsers(); }}
        />
      )}

      <Dialog
        open={notAuthorizedOpen}
        onClose={() => setNotAuthorizedOpen(false)}
        title="Edit user — restricted access"
        icon={ShieldAlert}
        danger
        small
        footer={<Button variant="primary" onClick={() => setNotAuthorizedOpen(false)}>Got it</Button>}
      >
        <p className="lead">
          You are not authorized to edit Organization-level users. Only site-level users can be edited with your current role.
        </p>
      </Dialog>
    </div>
  );
}
