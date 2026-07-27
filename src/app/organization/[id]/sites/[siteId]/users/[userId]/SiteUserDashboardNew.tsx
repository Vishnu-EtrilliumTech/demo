"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Scale,
  Gavel,
  ClipboardList,
  CalendarClock,
  PieChart,
  TrendingUp,
  FolderOpen,
  Search,
  FilterX,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

import {
  LuiRoot,
  LoadingState,
  ErrorState,
  EmptyState,
  Card,
  SectionHead,
  StatCard,
  Pill,
  Button,
  DataTable,
  type Column,
} from "@/design-system";
import {
  fetchOrganization,
  fetchSiteUser,
  fetchSiteUsers,
  fetchUserCaseSummary,
  deleteCase,
  fetchUserBasicInfo,
} from "@/app/organization/services/api";
import { type Case, type Task, type Hearing, type User, CaseStatus } from "@/app/organization/types";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/contexts/ToastContext";
import { CASE_STATUS_ORDER, CASE_STATUS_LABEL, caseStatusTone } from "@/app/organization/components/caseStatusUi";
import QuickAddCaseDialog from "@/app/organization/components/cases/QuickAddCaseDialog";
import QuickEditCaseDialog from "@/app/organization/components/cases/QuickEditCaseDialog";
import ConfirmDialog from "@/app/organization/components/modals/ConfirmDialog";

interface UserWithSite extends User {
  site?: { id: string; name: string };
}

const TASK_STATUS_CONFIG = [
  { status: "Open", label: "Open", color: "var(--brand)" },
  { status: "InProgress", label: "In Progress", color: "var(--warn)" },
  { status: "OnHold", label: "On Hold", color: "#8c95a3" },
  { status: "Blocked", label: "Blocked", color: "var(--danger)" },
  { status: "Closed", label: "Closed", color: "var(--ok)" },
];

type ChartPeriod = "6m" | "ytd" | "1y";
const PERIODS: { key: ChartPeriod; label: string }[] = [
  { key: "6m", label: "6M" },
  { key: "ytd", label: "YTD" },
  { key: "1y", label: "1Y" },
];

/** Task-status distribution meter, scoped to the tasks already filtered to this user + site. */
function TaskStatusCard({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const rows = TASK_STATUS_CONFIG.map((cfg) => ({
    ...cfg,
    value: tasks.filter((t) => t.status === cfg.status).length,
  })).filter((r) => r.value > 0);

  return (
    <Card pad>
      <SectionHead icon={PieChart} title="Task status" actions={total > 0 ? <Pill tone="neutral">{total} total</Pill> : undefined} />
      {rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No tasks yet" description="Tasks assigned to you in this site will appear here." />
      ) : (
        <div className="meter">
          {rows.map((r) => {
            const percent = total > 0 ? Math.round((r.value / total) * 100) : 0;
            return (
              <div className="m" key={r.status}>
                <div className="mh">
                  <span className="lbl">
                    <span className="dot" style={{ background: r.color }} />
                    {r.label}
                  </span>
                  <span className="val">{r.value}</span>
                </div>
                <div className="track">
                  <span className="fill" style={{ width: `${percent}%`, background: r.color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/** Hearing counts per month for the chosen window (hearings are already scoped to this user + site). */
function buildHearingsData(hearings: Hearing[], period: ChartPeriod) {
  const now = new Date();
  let months: number;
  let startDate: Date;

  switch (period) {
    case "ytd":
      months = now.getMonth() + 1;
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case "1y":
      months = 12;
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      break;
    case "6m":
    default:
      months = 6;
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  }

  const data: { month: string; hearings: number }[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    if (d > now) break;
    const count = hearings.filter((h) => {
      const hd = new Date(h.hearingDateTime);
      return hd.getMonth() === d.getMonth() && hd.getFullYear() === d.getFullYear();
    }).length;
    data.push({ month: d.toLocaleString("default", { month: "short" }), hearings: count });
  }
  return data;
}

function HearingsChartCard({ hearings }: { hearings: Hearing[] }) {
  const [period, setPeriod] = useState<ChartPeriod>("6m");
  const data = buildHearingsData(hearings, period);

  return (
    <Card pad>
      <SectionHead
        icon={TrendingUp}
        title="Hearings overview"
        actions={
          <div className="seg" role="tablist" aria-label="Time period">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                role="tab"
                aria-selected={period === p.key}
                className={`seg-btn${period === p.key ? " on" : ""}`}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--text-3)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "var(--text-3)" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <RechartsTooltip formatter={(value) => [`${value} hearings`, "Hearings"]} />
          <Line
            type="monotone"
            dataKey="hearings"
            stroke="var(--brand)"
            strokeWidth={2}
            dot={{ r: 4, fill: "var(--brand)", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

const avatarStyle: React.CSSProperties = { background: "var(--brand-soft)", color: "var(--brand)" };
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/**
 * Design-system Site User dashboard — the DS re-skin of the legacy
 * `sites/[siteId]/users/[userId]` personal dashboard. Same data loads and RBAC
 * gating (own-dashboard only, site-role required); the task-status pie and
 * hearings-by-month chart become a DS meter + line-chart card, and the cases
 * list moves onto the DS DataTable with quick add/edit/delete dialogs.
 * Gated behind the `site-user-dashboard` flag.
 */
export default function SiteUserDashboardNew({
  params,
}: {
  params: Promise<{ id: string; siteId: string; userId: string }>;
}) {
  const { id: organizationId, siteId: currentSiteId, userId } = use(params);
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const {
    currentUserId,
    isSiteAdmin,
    isSiteClerk,
    isSiteSrLegalExpert,
    isSiteLegalExpert,
    canDeleteCases,
    isLoading: isLoadingRole,
  } = useUserRole(organizationId);

  const isOwnDashboard = currentUserId !== null && currentUserId === userId;
  const hasSiteRole = isSiteAdmin || isSiteClerk || isSiteSrLegalExpert || isSiteLegalExpert;

  const [user, setUser] = useState<UserWithSite | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  const [siteUsers, setSiteUsers] = useState<User[]>([]);
  const [userNamesCache, setUserNamesCache] = useState<Record<string, string>>({});

  const [filters, setFilters] = useState({ search: "", status: "", createdById: "" });
  const [addCaseOpen, setAddCaseOpen] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState<Case | null>(null);
  const [caseToDelete, setCaseToDelete] = useState<Case | null>(null);

  const getUserFullName = useCallback(
    async (id: string): Promise<string> => {
      const idStr = id.toString();
      if (userNamesCache[idStr]) return userNamesCache[idStr];

      const siteUser = siteUsers.find((u) => u.id.toString() === idStr);
      if (siteUser?.fullName) {
        setUserNamesCache((prev) => ({ ...prev, [idStr]: siteUser.fullName }));
        return siteUser.fullName;
      }

      try {
        const info = await fetchUserBasicInfo(organizationId, id);
        const fullName = info.fullName || "Unknown User";
        setUserNamesCache((prev) => ({ ...prev, [idStr]: fullName }));
        return fullName;
      } catch (err) {
        console.error(`Error fetching user ${id} basic info:`, err);
        return "Unknown User";
      }
    },
    [organizationId, siteUsers, userNamesCache],
  );

  const getUserDisplayName = useCallback(
    (id: number | string | undefined): string => {
      if (!id) return "—";
      const idStr = id.toString();
      if (userNamesCache[idStr]) return userNamesCache[idStr];
      const siteUser = siteUsers.find((u) => u.id.toString() === idStr);
      if (siteUser?.fullName) return siteUser.fullName;
      return "Loading…";
    },
    [siteUsers, userNamesCache],
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userData, siteUsersPage] = await Promise.all([
        fetchSiteUser(organizationId, currentSiteId, userId),
        fetchSiteUsers(organizationId, currentSiteId),
      ]);
      const caseSummary = await fetchUserCaseSummary(organizationId, userId);

      const siteCases = caseSummary.cases.filter((c) => c.siteId?.toString() === currentSiteId);
      const siteTasks = caseSummary.caseTasks.filter((t) => t.siteId?.toString() === currentSiteId);
      const siteHearings = caseSummary.caseHearings.filter((h) => h.siteId?.toString() === currentSiteId);

      setUser(userData);
      setCases(siteCases);
      setTasks(siteTasks);
      setHearings(siteHearings);
      setSiteUsers(siteUsersPage.items);
      setError(null);
    } catch (err: unknown) {
      console.error("Error loading user dashboard:", err);
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { status?: number } };
        if (axiosError.response?.status === 403) {
          setIsAccessDenied(true);
          setError("Access denied: You can only view your own case summary.");
          return;
        }
      }
      setError("Failed to load user data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, currentSiteId, userId]);

  useEffect(() => {
    fetchOrganization(organizationId).catch((err) => console.error("Error loading organization:", err));
    loadData();
  }, [organizationId, loadData]);

  useEffect(() => {
    const idsToFetch = new Set<string>();
    cases.forEach((c) => {
      if (c.createdById) {
        const idStr = c.createdById.toString();
        const known = siteUsers.find((u) => u.id.toString() === idStr);
        if (!known?.fullName && !userNamesCache[idStr]) idsToFetch.add(idStr);
      }
    });
    if (idsToFetch.size > 0) {
      Promise.all(Array.from(idsToFetch).map((id) => getUserFullName(id)));
    }
  }, [cases, siteUsers, userNamesCache, getUserFullName]);

  const userTasks = useMemo(() => tasks.filter((t) => t.assignedToId?.toString() === userId), [tasks, userId]);
  const userHearings = useMemo(() => hearings.filter((h) => h.assignedToId?.toString() === userId), [hearings, userId]);

  const openCases = cases.filter((c) => c.status === CaseStatus.Open && c.assignedToId?.toString() === userId);
  const pendingTasks = userTasks.filter((t) => t.status !== "Closed");
  const upcomingHearings = userHearings.filter((h) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const hearingDate = new Date(h.hearingDateTime);
    hearingDate.setHours(0, 0, 0, 0);
    return hearingDate >= now || h.status !== "Completed";
  });

  const filteredCases = useMemo(() => {
    let result = cases;
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(
        (c) => c.caseNumber?.toLowerCase().includes(term) || c.title?.toLowerCase().includes(term),
      );
    }
    if (filters.status) result = result.filter((c) => c.status === filters.status);
    if (filters.createdById) result = result.filter((c) => c.createdById?.toString() === filters.createdById);
    return result;
  }, [cases, filters]);

  const creatorIds = useMemo(
    () => Array.from(new Set(cases.map((c) => c.createdById?.toString()))).filter(Boolean) as string[],
    [cases],
  );

  const hasActiveFilters = !!filters.search || !!filters.status || !!filters.createdById;
  const clearFilters = () => setFilters({ search: "", status: "", createdById: "" });

  const handleDeleteCase = async (caseItem: Case) => {
    try {
      await deleteCase(organizationId, currentSiteId, String(caseItem.id));
      setCases((prev) => prev.filter((c) => c.id !== caseItem.id));
      setCaseToDelete(null);
      showSuccess("Case deleted successfully");
    } catch (err) {
      console.error("Error deleting case:", err);
      showError("Failed to delete case. Please try again.");
    }
  };

  const shell = (children: React.ReactNode) => (
    <LuiRoot>
      <div className="sheet">{children}</div>
    </LuiRoot>
  );

  const denyActions = (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
      {currentUserId && (
        <Button
          variant="primary"
          onClick={() => router.push(`/organization/${organizationId}/sites/${currentSiteId}/users/${currentUserId}`)}
        >
          Go to my dashboard
        </Button>
      )}
      <Button variant="secondary" onClick={() => router.push(`/organization/${organizationId}`)}>
        Organization dashboard
      </Button>
    </div>
  );

  if (isLoading || isLoadingRole) return shell(<LoadingState message="Loading your dashboard…" />);

  if (isAccessDenied)
    return shell(
      <Card pad>
        <ErrorState
          title="Access denied"
          description="The server denied access to this resource. You cannot view other users' cases, tasks, or hearings."
          action={denyActions}
        />
      </Card>,
    );

  if (!isOwnDashboard)
    return shell(
      <Card pad>
        <ErrorState
          title="Access denied"
          description="You can only access your own personal dashboard. For security reasons, you cannot view other users' cases, tasks, or hearings."
          action={denyActions}
        />
      </Card>,
    );

  if (!hasSiteRole)
    return shell(
      <Card pad>
        <ErrorState
          title="Access denied"
          description="This page is only accessible to users with site-level roles: Site Admin, Site Clerk, Site Sr. Legal Expert, or Site Legal Expert."
          action={
            <Button variant="primary" onClick={() => router.push(`/organization/${organizationId}`)}>
              Go to organization dashboard
            </Button>
          }
        />
      </Card>,
    );

  if (error)
    return shell(
      <Card pad>
        <ErrorState
          title="Error loading user data"
          description={error}
          action={
            <Button variant="primary" onClick={() => loadData()}>
              Retry
            </Button>
          }
        />
      </Card>,
    );

  if (!user)
    return shell(
      <Card pad>
        <ErrorState
          title="User not found"
          description="The requested user could not be found or you do not have permission to view them."
          action={
            <Button variant="primary" onClick={() => router.push(`/organization/${organizationId}/sites/${currentSiteId}`)}>
              Back to site
            </Button>
          }
        />
      </Card>,
    );

  const columns: Column<Case>[] = [
    {
      key: "title",
      header: "Case",
      render: (c) => (
        <div className="case-row-title">
          <b>{c.title}</b>
          <span>{c.caseKey || "—"}</span>
        </div>
      ),
    },
    { key: "caseNumber", header: "Case No.", render: (c) => c.caseNumber || "—" },
    { key: "cnr", header: "CNR", render: (c) => c.cnrNumber || "—" },
    {
      key: "status",
      header: "Status",
      render: (c) => (
        <Pill tone={caseStatusTone(c.status)} dot>
          {CASE_STATUS_LABEL[c.status] ?? c.status}
        </Pill>
      ),
    },
    {
      key: "createdBy",
      header: "Created by",
      render: (c) => {
        const name = getUserDisplayName(c.createdById);
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
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <button
            type="button"
            className="icon-btn"
            style={{ width: 32, height: 32 }}
            aria-label="Edit case"
            onClick={(e) => {
              e.stopPropagation();
              setCaseToEdit(c);
            }}
          >
            <Pencil width={15} height={15} />
          </button>
          {canDeleteCases && (
            <button
              type="button"
              className="icon-btn"
              style={{ width: 32, height: 32 }}
              aria-label="Delete case"
              onClick={(e) => {
                e.stopPropagation();
                setCaseToDelete(c);
              }}
            >
              <Trash2 width={15} height={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      {shell(
        <>
          <div className="page-head">
            <div className="ph-lead">
              <div className="eyebrow">
                <Scale aria-hidden /> Personal workspace
              </div>
              <h1>Welcome, {user.fullName}</h1>
              <div className="sub">Your case management dashboard for this site.</div>
            </div>
            <div className="ph-actions">
              <Button variant="primary" icon={Plus} onClick={() => setAddCaseOpen(true)}>
                Add case
              </Button>
            </div>
          </div>

          <div className="stat-row n3">
            <StatCard
              icon={Gavel}
              tone="brand"
              value={openCases.length}
              label="Open cases"
              onClick={() =>
                router.push(
                  `/organization/${organizationId}/cases?siteId=${currentSiteId}&status=Open&assignedExpertId=${userId}`,
                )
              }
            />
            <StatCard
              icon={ClipboardList}
              tone="warn"
              value={pendingTasks.length}
              label="Pending tasks"
              onClick={() => router.push(`/organization/${organizationId}/sites/${currentSiteId}/users/${userId}/tasks`)}
            />
            <StatCard
              icon={CalendarClock}
              tone="violet"
              value={upcomingHearings.length}
              label="Upcoming hearings"
              onClick={() => router.push(`/organization/${organizationId}/sites/${currentSiteId}/hearings?userId=${userId}`)}
            />
          </div>

          <div className="dash-grid-even" style={{ marginBottom: 24 }}>
            <TaskStatusCard tasks={userTasks} />
            <HearingsChartCard hearings={userHearings} />
          </div>

          <SectionHead icon={FolderOpen} title="My cases" />

          <div className="toolbar">
            <div className="search">
              <Search aria-hidden />
              <input
                placeholder="Search by title or case number…"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div className="selectbox">
              <select
                aria-label="Status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All statuses</option>
                {CASE_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {CASE_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            {creatorIds.length > 0 && (
              <div className="selectbox">
                <select
                  aria-label="Created by"
                  value={filters.createdById}
                  onChange={(e) => setFilters({ ...filters, createdById: e.target.value })}
                >
                  <option value="">All creators</option>
                  {creatorIds.map((id) => (
                    <option key={id} value={id}>
                      {getUserDisplayName(id)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {hasActiveFilters && (
              <Button variant="ghost" icon={FilterX} onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>

          {cases.length === 0 ? (
            <Card pad>
              <EmptyState
                icon={FolderOpen}
                title="No cases yet"
                description="Cases assigned to you in this site will appear here."
                action={
                  <Button variant="primary" icon={Plus} onClick={() => setAddCaseOpen(true)}>
                    Add your first case
                  </Button>
                }
              />
            </Card>
          ) : filteredCases.length === 0 ? (
            <Card pad>
              <EmptyState
                icon={FolderOpen}
                title="No cases match your filters"
                description="Try adjusting or clearing your filters."
                action={
                  <Button variant="secondary" icon={FilterX} onClick={clearFilters}>
                    Clear all filters
                  </Button>
                }
              />
            </Card>
          ) : (
            <DataTable
              columns={columns}
              rows={filteredCases}
              getRowKey={(c) => String(c.id)}
              onRowClick={(c) => router.push(`/organization/${organizationId}/sites/${currentSiteId}/cases/${c.id}`)}
              footer={
                <div className="tbl-foot">
                  <span className="cnt">
                    {filteredCases.length} of {cases.length} case{cases.length === 1 ? "" : "s"}
                  </span>
                </div>
              }
            />
          )}
        </>,
      )}

      <QuickAddCaseDialog
        open={addCaseOpen}
        onClose={() => setAddCaseOpen(false)}
        organizationId={organizationId}
        isOrgMode={false}
        siteId={currentSiteId}
        onSuccess={() => {
          setAddCaseOpen(false);
          loadData();
        }}
      />

      {caseToEdit && (
        <QuickEditCaseDialog
          open={!!caseToEdit}
          onClose={() => setCaseToEdit(null)}
          organizationId={organizationId}
          siteId={String(caseToEdit.siteId || currentSiteId)}
          seed={{
            id: String(caseToEdit.id),
            title: caseToEdit.title,
            caseNumber: caseToEdit.caseNumber,
            cnrNumber: caseToEdit.cnrNumber,
            caseKey: caseToEdit.caseKey,
            status: caseToEdit.status,
            description: caseToEdit.description,
            assignedToId: caseToEdit.assignedToId ? String(caseToEdit.assignedToId) : undefined,
          }}
          onSuccess={() => {
            setCaseToEdit(null);
            loadData();
          }}
        />
      )}

      <LuiRoot>
        <ConfirmDialog
          open={!!caseToDelete}
          onClose={() => setCaseToDelete(null)}
          onConfirm={() => handleDeleteCase(caseToDelete as Case)}
          entityType="case"
          entityName={caseToDelete?.title}
        />
      </LuiRoot>
    </>
  );
}
