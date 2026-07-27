"use client";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState, use, useMemo } from "react";
// import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import BalanceIcon from '@mui/icons-material/Balance';
import {
  Box,
  Typography,
  Container,
  Paper,
  CircularProgress,
  Grid,
  // Chip,
  Stack,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Card,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  // LocationOn as LocationOnIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import GavelIcon from "@mui/icons-material/Gavel";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EventIcon from "@mui/icons-material/Event";
import styles from "@/app/organization/page.module.css";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  fetchOrganization,
  fetchSiteUser,
  fetchSiteUsers,
  fetchUserCaseSummary,
  deleteCase,
  fetchUserBasicInfo,
} from "@/app/organization/services/api";
import {
  type Case,
  type Task,
  type Hearing,
  type User,
  CaseStatus,
} from "@/app/organization/types";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
// import { StatusChip } from "@/components/StatusChip";
import { useUserRole } from "@/hooks/useUserRole";
import BlockIcon from "@mui/icons-material/Block";
// import { formatDisplayDate } from "@/utils";

// Import shared modals and table
import AddCaseModal from "@/components/modals/AddCaseModal";
import EditCaseModal from "@/components/modals/EditCaseModal";
import CasesTable from "@/app/organization/components/CasesTable";

// Updated StatCard with horizontal layout (icon left, data right)
const StatCard = ({
  title,
  count,
  icon,
  color,
  subtitle,
  onClick,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  subtitle: string;
  onClick?: () => void;
}) => (
  <div
    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
    onClick={onClick}
  >
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    {/* Icon - Left side */}
    <Box>
      <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: "12px",
        backgroundColor: `${color}20`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
      <Typography sx={{ fontSize: "1rem", color: "#64748b", mt: 0.25 }}>
        {title}
      </Typography>
    </Box>

    {/* Data box - Right side, with left-aligned text inside */}
    <Box sx={{ textAlign: "left" }}>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: "2rem",
          color: "#1e293b",
          lineHeight: 1.2,
        }}
      >
        {count}
      </Typography>
      
      <Typography sx={{ fontSize: "0.75rem", color: "#22c55e", mt: 0.25 }}>
        {subtitle}
      </Typography>
    </Box>
  </Box>
</div>
);

// ─── Task Status Pie Chart ────────────────────────────────────────────────────

const TASK_STATUS_CONFIG = [
  { status: "Open",       label: "Open",        color: "#3B82F6" },
  { status: "InProgress", label: "In Progress",  color: "#F59E0B" },
  { status: "OnHold",     label: "On Hold",      color: "#8B5CF6" },
  { status: "Blocked",    label: "Blocked",      color: "#EF4444" },
  { status: "Closed",     label: "Closed",       color: "#10B981" },
];

function TaskStatusPieChart({ tasks, userId, currentSiteId }: { tasks: Task[]; userId: string; currentSiteId: string }) {
  const userTasks = tasks.filter(
    (t) => t.assignedToId?.toString() === userId && t.siteId?.toString() === currentSiteId,
  );

  const pieData = TASK_STATUS_CONFIG.map(({ status, label, color }) => ({
    name: label,
    value: userTasks.filter((t) => t.status === status).length,
    color,
  })).filter((d) => d.value > 0);

  if (pieData.length === 0) {
    return (
      <Card sx={{ borderRadius: 3, border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", p: 3, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
        <Typography sx={{ fontWeight: 600, fontSize: "1rem", color: "#1e293b", mb: 0.5 }}>Task Status Distribution</Typography>
        <Typography sx={{ fontSize: "0.875rem", color: "#94a3b8", mt: 2 }}>No tasks assigned yet</Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3, border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", background: "#ffffff", p: 3, flex: 1 }}>
      <Typography sx={{ fontWeight: 600, fontSize: "1rem", color: "#1e293b", mb: 0.5 }}>Task Status Distribution</Typography>
      <Typography sx={{ fontSize: "0.75rem", color: "#94a3b8", mb: 1 }}>Total tasks: {userTasks.length}</Typography>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="46%"
            innerRadius={55}
            outerRadius={80}
            dataKey="value"
            paddingAngle={2}
          >
            {pieData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip formatter={(value, name) => [`${value} tasks`, name as string]} wrapperStyle={{ zIndex: 10 }} />
          <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: "0.75rem", paddingTop: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ─── Hearings by Month Line Chart ────────────────────────────────────────────

type ChartPeriod = "6m" | "ytd" | "1y";

function buildHearingsData(hearings: Hearing[], period: ChartPeriod, userId: string, currentSiteId: string) {
  const now = new Date();
  let months: number;
  let startDate: Date;

  switch (period) {
    case "6m":
      months = 6;
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      break;
    case "ytd":
      months = now.getMonth() + 1;
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case "1y":
      months = 12;
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      break;
    default:
      months = 6;
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  }

  const userHearings = hearings.filter(
    (h) => h.assignedToId?.toString() === userId && h.siteId?.toString() === currentSiteId,
  );

  const data: { month: string; hearings: number }[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    if (d > now) break;
    const count = userHearings.filter((h) => {
      const hd = new Date(h.hearingDateTime);
      return hd.getMonth() === d.getMonth() && hd.getFullYear() === d.getFullYear();
    }).length;
    data.push({ month: d.toLocaleString("default", { month: "short" }), hearings: count });
  }
  return data;
}

function HearingsByMonthChart({ hearings, userId, currentSiteId }: { hearings: Hearing[]; userId: string; currentSiteId: string }) {
  const [period, setPeriod] = React.useState<ChartPeriod>("6m");
  const growthData = buildHearingsData(hearings, period, userId, currentSiteId);

  return (
    <Card sx={{ borderRadius: 3, border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", background: "#ffffff", p: 3, flex: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: "1rem", color: "#1e293b", mb: 0.5 }}>Hearings Overview</Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            {period === "6m" ? "Last 6 Months" : period === "ytd" ? "Year to Date" : "Last 12 Months"}
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={(_e, val) => { if (val) setPeriod(val); }}
          size="small"
          sx={{
            gap: 0.5,
            "& .MuiToggleButton-root": {
              textTransform: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              color: "#64748b",
              "&.Mui-selected": { backgroundColor: "#3b82f6", color: "#ffffff", borderColor: "#3b82f6", "&:hover": { backgroundColor: "#2563eb" } },
              "&:hover": { backgroundColor: "#f1f5f9" },
            },
          }}
        >
          <ToggleButton value="6m">6M</ToggleButton>
          <ToggleButton value="ytd">YTD</ToggleButton>
          <ToggleButton value="1y">1Y</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={growthData} margin={{ top: 5, right: 15, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <RechartsTooltip formatter={(value) => [`${value} hearings`, "Hearings"]} />
          <Line type="monotone" dataKey="hearings" stroke="#9333ea" strokeWidth={2} dot={{ r: 4, fill: "#9333ea", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ─── Combined Charts Row ──────────────────────────────────────────────────────

function ChartsRow({ tasks, hearings, userId, currentSiteId }: { tasks: Task[]; hearings: Hearing[]; userId: string; currentSiteId: string }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "24px", alignItems: "stretch" }}>
      <div style={{ flex: "1 1 calc(50% - 8px)", minWidth: "280px", display: "flex" }}>
        <TaskStatusPieChart tasks={tasks} userId={userId} currentSiteId={currentSiteId} />
      </div>
      <div style={{ flex: "1 1 calc(50% - 8px)", minWidth: "280px", display: "flex" }}>
        <HearingsByMonthChart hearings={hearings} userId={userId} currentSiteId={currentSiteId} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface UserWithSite extends User {
  site?: {
    id: string;
    name: string;
  };
}

interface SiteUserDashboardProps {
  organizationId: string;
  currentSiteId: string;
  userId: string;
}

export default function SiteUserDashboardLegacy({
  params,
}: {
  params: Promise<{ id: string; siteId: string; userId: string }>;
}) {
  const { id: organizationId, siteId: currentSiteId, userId } = use(params);

  return (
    <SiteUserDashboardContent
      organizationId={organizationId}
      currentSiteId={currentSiteId}
      userId={userId}
    />
  );
}

function SiteUserDashboardContent({
  organizationId,
  currentSiteId,
  userId,
}: SiteUserDashboardProps) {
  const router = useRouter();

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

  const [user, setUser] = useState<UserWithSite | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccessDenied, setIsAccessDenied] = useState<boolean>(false);

  const [siteUsers, setSiteUsers] = useState<User[]>([]);
  const [userNamesCache, setUserNamesCache] = useState<Record<string, string>>(
    {},
  );

  const [filters, setFilters] = useState({
    caseNumber: "",
    status: "",
    createdById: "",
    assignedToId: "",
  });

  // Modal states
  const [addCaseModalOpen, setAddCaseModalOpen] = useState(false);
  const [editCaseModalOpen, setEditCaseModalOpen] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState<Case | null>(null);
  const [loadingSiteUsers, setLoadingSiteUsers] = useState(false);

  const hasSiteRole =
    isSiteAdmin || isSiteClerk || isSiteSrLegalExpert || isSiteLegalExpert;

  const getUserFullName = useCallback(
    async (userId: string): Promise<string> => {
      const userIdStr = userId.toString();

      if (userNamesCache[userIdStr]) {
        return userNamesCache[userIdStr];
      }

      const siteUser = siteUsers.find((u) => u.id.toString() === userIdStr);
      if (siteUser?.fullName) {
        setUserNamesCache((prev) => ({
          ...prev,
          [userIdStr]: siteUser.fullName,
        }));
        return siteUser.fullName;
      }

      try {
        const userBasicInfo = await fetchUserBasicInfo(organizationId, userId);
        const fullName = userBasicInfo.fullName || "Unknown User";
        setUserNamesCache((prev) => ({ ...prev, [userIdStr]: fullName }));
        return fullName;
      } catch (error) {
        console.error(`Error fetching user ${userId} basic info:`, error);
        return "Unknown User";
      }
    },
    [organizationId, siteUsers, userNamesCache],
  );

  const getUserDisplayName = (userId: number | string | undefined): string => {
    if (!userId) return "—";
    const userIdStr = userId.toString();
    if (userNamesCache[userIdStr]) return userNamesCache[userIdStr];
    const siteUser = siteUsers.find((u) => u.id.toString() === userIdStr);
    if (siteUser?.fullName) return siteUser.fullName;
    return "Loading...";
  };

  const loadData = useCallback(
    async (siteId: string = currentSiteId) => {
      try {
        setIsLoading(true);
        console.log("Loading data for site:", siteId);

        const [userData, siteUsersPage] = await Promise.all([
          fetchSiteUser(organizationId, siteId, userId),
          fetchSiteUsers(organizationId, siteId),
        ]);
        const siteUsersData = siteUsersPage.items;

        const caseSummary = await fetchUserCaseSummary(organizationId, userId);
        console.log("Case summary data:", caseSummary);

        const siteCases = caseSummary.cases.filter((caseItem) => {
          return caseItem.siteId?.toString() === siteId;
        });

        const siteTasks = caseSummary.caseTasks.filter((task) => {
          const taskSiteId = task.siteId;
          if (taskSiteId === undefined) return false;
          return taskSiteId.toString() === siteId;
        });

        const siteHearings = caseSummary.caseHearings.filter((hearing) => {
          const hearingSiteId = hearing.siteId;
          if (hearingSiteId === undefined) return false;
          return hearingSiteId.toString() === siteId;
        });

        console.log(
          "Filtered data - Cases:",
          siteCases,
          "Tasks:",
          siteTasks,
          "Hearings:",
          siteHearings,
        );

        setUser(userData);
        setCases(siteCases);
        setTasks(siteTasks);
        setHearings(siteHearings);
        setSiteUsers(siteUsersData);
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
    },
    [organizationId, currentSiteId, userId],
  );

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      assignedToId: userId,
    }));

    const loadOrganizationAndSite = async () => {
      try {
        await fetchOrganization(organizationId);
      } catch (error) {
        console.error("Error loading organization/site:", error);
      }
    };

    const initialize = async () => {
      await Promise.all([loadOrganizationAndSite(), loadData(currentSiteId)]);
    };

    initialize();
  }, [organizationId, userId, currentSiteId, loadData]);

  useEffect(() => {
    const fetchMissingUserNames = async () => {
      const userIdsToFetch = new Set<string>();

      cases.forEach((caseItem) => {
        if (caseItem.createdById) {
          const createdByIdStr = caseItem.createdById.toString();
          const createdByUser = siteUsers.find(
            (u) => u.id.toString() === createdByIdStr,
          );
          if (!createdByUser?.fullName && !userNamesCache[createdByIdStr]) {
            userIdsToFetch.add(createdByIdStr);
          }
        }

        if (caseItem.assignedToId) {
          const assignedToIdStr = caseItem.assignedToId.toString();
          const assignedToUser = siteUsers.find(
            (u) => u.id.toString() === assignedToIdStr,
          );
          if (!assignedToUser?.fullName && !userNamesCache[assignedToIdStr]) {
            userIdsToFetch.add(assignedToIdStr);
          }
        }
      });

      if (userIdsToFetch.size > 0) {
        const fetchPromises = Array.from(userIdsToFetch).map((userId) =>
          getUserFullName(userId),
        );
        await Promise.all(fetchPromises);
      }
    };

    fetchMissingUserNames();
  }, [cases, siteUsers, userNamesCache, getUserFullName]);

  // Filter cases based on search and filters
  const filteredCases = useMemo(() => {
    let result = cases;

    if (filters.caseNumber) {
      const term = filters.caseNumber.toLowerCase();
      result = result.filter(
        (c) =>
          c.caseNumber?.toLowerCase().includes(term) ||
          c.title?.toLowerCase().includes(term),
      );
    }

    if (filters.status) {
      result = result.filter((c) => c.status === filters.status);
    }

    if (filters.createdById) {
      result = result.filter(
        (c) => c.createdById?.toString() === filters.createdById,
      );
    }

    return result;
  }, [cases, filters.caseNumber, filters.status, filters.createdById]);

  // Edit case handler
  const handleEditCase = useCallback(
    async (caseItem: Case) => {
      if (!caseItem.siteId) {
        console.error("Cannot edit case: missing site information");
        return;
      }
      setCaseToEdit(caseItem);
      setEditCaseModalOpen(true);
      setLoadingSiteUsers(true);
      try {
        const usersPage = await fetchSiteUsers(
          organizationId,
          String(caseItem.siteId),
        );
        setSiteUsers(usersPage.items);
      } catch (error) {
        console.error("Failed to fetch site users:", error);
        setSiteUsers([]);
      } finally {
        setLoadingSiteUsers(false);
      }
    },
    [organizationId],
  );

  // Delete case handler
  const handleDeleteCase = useCallback(
    async (caseItem: Case) => {
      if (!caseItem.id || !organizationId || !currentSiteId) return;

      try {
        await deleteCase(organizationId, currentSiteId, caseItem.id.toString());
        setCases((prev) => prev.filter((c) => c.id !== caseItem.id));
      } catch (err) {
        console.error("Error deleting case:", err);
      }
    },
    [organizationId, currentSiteId],
  );

  if (isLoading || isLoadingRole) {
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
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading user data...
        </Typography>
      </Box>
    );
  }

  if (isAccessDenied) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper
          elevation={3}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 3,
            background: "linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <BlockIcon sx={{ fontSize: 80, color: "#dc2626", opacity: 0.8 }} />
          </Box>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 600, color: "#dc2626", mb: 2 }}
          >
            Access Denied
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            paragraph
            sx={{ mb: 3, fontSize: "1.1rem" }}
          >
            You can only access your own personal dashboard.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            The server denied access to this resource. You cannot view other
            users&apos; cases, tasks, or hearings.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            {currentUserId && (
              <Button
                variant="contained"
                color="primary"
                onClick={() =>
                  router.push(
                    `/organization/${organizationId}/sites/${currentSiteId}/users/${currentUserId}`,
                  )
                }
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                }}
              >
                Go to My Dashboard
              </Button>
            )}
            <Button
              variant="outlined"
              color="primary"
              onClick={() => router.push(`/organization/${organizationId}`)}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "1rem",
              }}
            >
              Organization Dashboard
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  if (!isOwnDashboard) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper
          elevation={3}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 3,
            background: "linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <BlockIcon sx={{ fontSize: 80, color: "#dc2626", opacity: 0.8 }} />
          </Box>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 600, color: "#dc2626", mb: 2 }}
          >
            Access Denied
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            paragraph
            sx={{ mb: 3, fontSize: "1.1rem" }}
          >
            You can only access your own personal dashboard.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            For security reasons, you cannot view other users&apos; cases,
            tasks, or hearings.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              onClick={() =>
                router.push(
                  `/organization/${organizationId}/sites/${currentSiteId}/users/${currentUserId}`,
                )
              }
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "1rem",
              }}
            >
              Go to My Dashboard
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => router.push(`/organization/${organizationId}`)}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "1rem",
              }}
            >
              Organization Dashboard
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  if (!hasSiteRole) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper
          elevation={3}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 3,
            background: "linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <BlockIcon sx={{ fontSize: 80, color: "#dc2626", opacity: 0.8 }} />
          </Box>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 600, color: "#dc2626", mb: 2 }}
          >
            Access Denied
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            paragraph
            sx={{ mb: 3, fontSize: "1.1rem" }}
          >
            You do not have permission to access this personal dashboard.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            This page is only accessible to users with site-level roles:
            <strong>
              {" "}
              Site Admin, Site Clerk, Site Sr. Legal Expert, or Site Legal
              Expert
            </strong>
            .
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push(`/organization/${organizationId}`)}
            sx={{
              mt: 2,
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontSize: "1rem",
            }}
          >
            Go to Organization Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography color="error" variant="h6" gutterBottom>
            Error Loading User Data
          </Typography>
          <Typography color="textSecondary" paragraph>
            {error}
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography color="error" variant="h6" gutterBottom>
            User Not Found
          </Typography>
          <Typography color="textSecondary" paragraph>
            The requested user could not be found or you do not have permission to view them.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push(`/organization/${organizationId}/sites/${currentSiteId}`)}
            sx={{ mt: 2 }}
          >
            Back to Site
          </Button>
        </Paper>
      </Container>
    );
  }

  const openCases = cases.filter(
    (c) =>
      c.status === CaseStatus.Open && c.assignedToId?.toString() === userId,
  );
  const pendingTasks = tasks.filter((t) => {
    return (
      t.status !== "Closed" &&
      t.assignedToId?.toString() === userId &&
      t.siteId?.toString() === currentSiteId
    );
  });
  const upcomingHearings = hearings.filter((h) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const hearingDate = new Date(h.hearingDateTime);
    hearingDate.setHours(0, 0, 0, 0);
    return (
      h.assignedToId?.toString() === userId &&
      h.siteId?.toString() === currentSiteId &&
      (hearingDate >= now || h.status !== "Completed")
    );
  });

  return (
    <section className={styles.orgContainer}>
      <Box sx={{ pl: { xs: 2, sm: 3 }, pr: { xs: 2, sm: 5 }, py: 3 }}>
        {/* Welcome Section – redesigned to match Organization Dashboard */}
        <Box
          sx={{
            bgcolor: "white",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            p: 3,
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "center", md: "flex-start" },
              gap: 2,
            }}
          >
            {/* Icon box – dark square with courthouse icon */}
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "12px",
                backgroundColor: "#1a1a2e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <BalanceIcon sx={{ fontSize: 32, color: "white" }} />
            </Box>

            {/* Text content */}
            <Box sx={{ flex: 1 }}>
              <Typography
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: "#1e293b",
                  lineHeight: 1.2,
                  mb: 0.5,
                  fontSize: { xs: "1.1rem", sm: "1.25rem", lg: "1.35rem" },
                }}
              >
                Welcome {user.fullName}!
              </Typography>
              <Typography
                sx={{
                  color: "#94a3b8",
                  fontWeight: 400,
                  fontSize: "0.875rem",
                  mt: 0.5,
                }}
              >
                Your case management dashboard
              </Typography>
            </Box>
             <Button
              variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddCaseModalOpen(true)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "12px",
              px: 2.5,
              py: 1,
              background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
              "&:hover": {
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                boxShadow: "0 4px 12px rgba(59,130,246,0.35)",
              },
            }}
            >
              Add Case
            </Button>
          </Box>
        </Box>

        {/* Stats Cards - updated design */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Open Cases"
              count={openCases.length}
              icon={<GavelIcon sx={{ fontSize: 20, color: "#0284c7" }} />}
              color="#0284c7"
              subtitle="Active"
              onClick={() =>
                router.push(
                  `/organization/${organizationId}/cases?siteId=${currentSiteId}&status=Open&assignedExpertId=${userId}`,
                )
              }
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Pending Tasks"
              count={pendingTasks.length}
              icon={<AssignmentIcon sx={{ fontSize: 20, color: "#ea580c" }} />}
              color="#ea580c"
              subtitle="To Do"
              onClick={() =>
                router.push(
                  `/organization/${organizationId}/sites/${currentSiteId}/users/${userId}/tasks`,
                )
              }
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Upcoming Hearings"
              count={upcomingHearings.length}
              icon={<EventIcon sx={{ fontSize: 20, color: "#9333ea" }} />}
              color="#9333ea"
              subtitle="Scheduled"
              onClick={() =>
                router.push(
                  `/organization/${organizationId}/sites/${currentSiteId}/hearings?userId=${userId}`,
                )
              }
            />
          </Grid>
        </Grid>

        {/* Charts Row */}

        {/* Cases Section */}
        <Paper elevation={3} sx={{ borderRadius: 2, p: 3, mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h5" component="h2" fontWeight="bold" sx={{mr:1}}>
              Cases
            </Typography>
           {/* Filter Controls (unchanged) */}
          <Grid container spacing={2} sx={{ alignItems: "center" }}>
            <Grid item xs>
              <TextField
                fullWidth   
                label="Case"
                size="small"
                value={filters.caseNumber}
                onChange={(e) =>
                  setFilters({ ...filters, caseNumber: e.target.value })
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "9999px",
                    height: "40px",
                    "& fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.23)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                  "& .MuiInputBase-input": {
                    padding: "8.5px 14px",
                    height: "100%",
                    boxSizing: "border-box",
                  },
                  "& .MuiInputLabel-root": {
                    transform: "translate(14px, 9px) scale(1)",
                  },
                  "& .MuiInputLabel-shrink": {
                    transform: "translate(14px, -9px) scale(0.75)",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      sx={{ height: "40px", ml: 1, mr: 0.5 }}
                    >
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs>
              <FormControl
                fullWidth
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "9999px",
                    height: "40px",
                    "& fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.23)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                  "& .MuiSelect-select": {
                    padding: "8.5px 14px",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "9999px",
                  },
                  "& .MuiInputLabel-root": {
                    transform: "translate(14px, 9px) scale(1)",
                  },
                  "& .MuiInputLabel-shrink": {
                    transform: "translate(14px, -9px) scale(0.75)",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderRadius: "9999px",
                  },
                }}
              >
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {Object.values(CaseStatus).map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs>
              <FormControl
                fullWidth
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "9999px",
                    height: "40px",
                    "& fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.23)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                  "& .MuiSelect-select": {
                    padding: "8.5px 14px",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "9999px",
                  },
                  "& .MuiInputLabel-root": {
                    transform: "translate(14px, 9px) scale(1)",
                  },
                  "& .MuiInputLabel-shrink": {
                    transform: "translate(14px, -9px) scale(0.75)",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderRadius: "9999px",
                  },
                }}
              >
                <InputLabel>Created By</InputLabel>
                <Select
                  value={filters.createdById}
                  label="Created By"
                  onChange={(e) =>
                    setFilters({ ...filters, createdById: e.target.value })
                  }
                >
                  <MenuItem value="">All Users</MenuItem>
                  {Array.from(
                    new Set(cases.map((c) => c.createdById?.toString())),
                  )
                    .filter(Boolean)
                    .map((userId) => {
                      return (
                        <MenuItem key={`creator-${userId}`} value={userId}>
                          {getUserDisplayName(userId)}
                        </MenuItem>
                      );
                    })}
                </Select>
              </FormControl>
            </Grid>

            <Grid item sx={{ width: 170, flexShrink: 0, pr: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={() => {
                  setFilters({
                    caseNumber: "",
                    status: "",
                    createdById: "",
                    assignedToId: "",
                  });
                }}
                sx={{
                  height: "40px",
                  minWidth: "150px",
                  textTransform: "none",
                  borderRadius: "9999px",
                  borderColor: "rgba(0, 0, 0, 0.23)",
                  "&:hover": {
                    borderColor: "rgba(0, 0, 0, 0.5)",
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
          </Box>

          

          {/* Cases Table - Replaced with shared CasesTable component */}
          {cases.length > 0 ? (
            <CasesTable
              cases={filteredCases}
              users={siteUsers}
              showSiteColumn={false}
              onCaseClick={(caseItem) =>
                router.push(
                  `/organization/${organizationId}/sites/${currentSiteId}/cases/${caseItem.id}`,
                )
              }
              onEditCase={hasSiteRole ? handleEditCase : undefined}
              onDeleteCase={canDeleteCases ? handleDeleteCase : undefined}
              canEditCase={() => hasSiteRole}
              canDeleteCase={() => canDeleteCases}
            />
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <GavelIcon
                sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary">
                No cases found
              </Typography>
              <Button
                variant="contained"
                onClick={() => setAddCaseModalOpen(true)}
                sx={{ mt: 2 }}
              >
                Create Your First Case
              </Button>
            </Box>
          )}
        </Paper>
        <ChartsRow tasks={tasks} hearings={hearings} userId={userId} currentSiteId={currentSiteId} />

        {/* Pending Tasks & Upcoming Hearings - Equal Height Cards */}
        {/* <Grid container spacing={3}>
          <Grid item xs={12} md={6} sx={{ display: "flex" }}>
            <Paper
              elevation={3}
              sx={{ p: 3, borderRadius: 2, width: "100%", height: "100%" }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Pending Tasks
                </Typography>
              </Box>
              {pendingTasks.length > 0 ? (
                pendingTasks.slice(0, 5).map((task) => (
                  <Box
                    key={task.id}
                    sx={{
                      py: 1.5,
                      borderBottom: "1px solid #f0f0f0",
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "action.hover",
                        borderRadius: 1,
                      },
                      transition: "background-color 0.2s",
                      px: 1,
                    }}
                    onClick={() =>
                      router.push(
                        `/organization/${organizationId}/sites/${task.siteId}/cases/${task.caseId}?tab=tasks`,
                      )
                    }
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="body1">{task.title}</Typography>
                      <StatusChip
                        status={task.status}
                        type="task"
                        size="small"
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <CalendarMonthIcon fontSize="small" color="action" />
                      {task.dueDate
                        ? formatDisplayDate(task.dueDate)
                        : "No due date"}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">No pending tasks</Typography>
              )}
            </Paper>
          </Grid>

          
          <Grid item xs={12} md={6} sx={{ display: "flex" }}>
            <Paper
              elevation={3}
              sx={{ p: 3, borderRadius: 2, width: "100%", height: "100%" }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Upcoming Hearings
                </Typography>
              </Box>
              {upcomingHearings.length > 0 ? (
                upcomingHearings.slice(0, 5).map((hearing) => {
                  const associatedCase = cases.find(
                    (c) => c.id === hearing.caseId,
                  );
                  const caseNumber = associatedCase?.caseNumber || "Case not found";
                  const caseTitle = associatedCase?.title || "";

         
                  const hasLocation = hearing.hearingLocation?.trim();
                  const hasNotes = hearing.hearingNotes?.trim();
                  let secondaryInfo = "";
                  if (hasLocation && hasNotes) {
                    secondaryInfo = `${hearing.hearingLocation} • ${hearing.hearingNotes}`;
                  }

                  return (
                    <Box
                      key={hearing.id}
                      sx={{
                        py: 1.5,
                        borderBottom: "1px solid #f0f0f0",
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "action.hover",
                          borderRadius: 1,
                        },
                        transition: "background-color 0.2s",
                        px: 1,
                      }}
                      onClick={() =>
                        router.push(
                          `/organization/${organizationId}/sites/${hearing.siteId}/cases/${hearing.caseId}?tab=hearings`,
                        )
                      }
                    >
            
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                          }}
                        >
                          <strong>{caseNumber}</strong>
                          {caseTitle && ` — ${caseTitle}`}
                        </Typography>
                        <Chip
                          label={new Date(hearing.hearingDateTime).toLocaleString(
                            "en-India",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            },
                          )}
                          size="small"
                          variant="outlined"
                          color="primary"
                          sx={{ flexShrink: 0 }}
                        />
                      </Box>

                     
                      {secondaryInfo && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            mt: 0.5,
                          }}
                        >
                          {hasLocation ? (
                            <LocationOnIcon fontSize="small" color="action" />
                          ) : (
                            <AssignmentIcon fontSize="small" color="action" />
                          )}
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                            }}
                          >
                            {secondaryInfo}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  );
                })
              ) : (
                <Typography color="text.secondary">No upcoming hearings</Typography>
              )}
            </Paper>
          </Grid>
        </Grid> */}
      </Box>

      {/* Add Case Modal */}
      <AddCaseModal
        open={addCaseModalOpen}
        onClose={() => setAddCaseModalOpen(false)}
        onSuccess={loadData}
        organizationId={organizationId}
        isOrgMode={false}
        siteId={currentSiteId}
      />

      {/* Edit Case Modal */}
      {caseToEdit && (
        <EditCaseModal
          open={editCaseModalOpen}
          onClose={() => {
            setEditCaseModalOpen(false);
            setCaseToEdit(null);
            setSiteUsers([]);
          }}
          onSuccess={loadData}
          organizationId={organizationId}
          siteId={String(caseToEdit.siteId || currentSiteId)}
          caseData={caseToEdit}
          siteUsers={siteUsers}
          loadingSiteUsers={loadingSiteUsers}
        />
      )}
    </section>
  );
}