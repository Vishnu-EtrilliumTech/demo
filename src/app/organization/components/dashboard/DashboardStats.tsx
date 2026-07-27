import { FolderOpen, Gavel, CircleCheckBig, Users } from "lucide-react";
import { StatCard } from "@/design-system";

export interface DashboardStatsProps {
  totalCases: number;
  casesThisMonth: number;
  activeUsers: number;
  resolvedCases: number;
  upcomingHearings: number;
  branchCount: number;
  /** Hide the hearings card for roles without hearing access. */
  showHearings?: boolean;
  onTotalCasesClick?: () => void;
  onActiveUsersClick?: () => void;
  onHearingsClick?: () => void;
  onResolvedCasesClick?: () => void;
}

const muted = { color: "var(--text-3)" };

/**
 * Dashboard KPI stat row, rebuilt on the design-system <StatCard>. Mirrors the
 * legacy OrgStatsCards metrics + click targets (Phase-0 contract §F); hearings
 * card hidden when the role can't view hearings.
 */
export default function DashboardStats({
  totalCases,
  casesThisMonth,
  activeUsers,
  resolvedCases,
  upcomingHearings,
  branchCount,
  showHearings = true,
  onTotalCasesClick,
  onActiveUsersClick,
  onHearingsClick,
  onResolvedCasesClick,
}: DashboardStatsProps) {
  return (
    <div className="stat-row">
      <StatCard
        icon={FolderOpen}
        tone="brand"
        value={totalCases}
        label={
          <>
            Total cases <span style={muted}>· {casesThisMonth} this month</span>
          </>
        }
        onClick={onTotalCasesClick}
      />
      {showHearings && (
        <StatCard
          icon={Gavel}
          tone="warn"
          value={upcomingHearings}
          label="Upcoming hearings"
          onClick={onHearingsClick}
        />
      )}
      <StatCard
        icon={CircleCheckBig}
        tone="ok"
        value={resolvedCases}
        label="Resolved cases"
        onClick={onResolvedCasesClick}
      />
      <StatCard
        icon={Users}
        tone="violet"
        value={activeUsers}
        label={
          <>
            Lawyers &amp; staff{" "}
            {branchCount > 0 ? (
              <span style={muted}>
                · {branchCount} site{branchCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </>
        }
        onClick={onActiveUsersClick}
      />
    </div>
  );
}
