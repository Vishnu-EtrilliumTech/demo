import { Grid, Box, Typography } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import {
  Schedule as CalendarIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Gavel as AssignmentIndIcon,
} from "@mui/icons-material";

interface OrgStatsCardsProps {
  totalCases: number;
  casesThisMonth: number;
  activeUsers: number;
  resolvedCases: number;
  upcomingHearings: number;
  showHearings?: boolean;
  onHearingsClick?: () => void;
  onTotalCasesClick?: () => void;
  onActiveUsersClick?: () => void;
  onResolvedCasesClick?: () => void;
}

export default function OrgStatsCards({
  totalCases,
  casesThisMonth,
  activeUsers,
  resolvedCases,
  upcomingHearings,
  showHearings = true,
  onHearingsClick,
  onTotalCasesClick,
  onActiveUsersClick,
  onResolvedCasesClick,
}: OrgStatsCardsProps) {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {/* Total Cases */}
      <Grid item xs={12} sm={6} lg={3}>
        <div className="bg-white rounded-2xl p-5 border border-slate-250 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer" onClick={onTotalCasesClick}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1.5,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                backgroundColor: "#ede9fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AssignmentIndIcon sx={{ fontSize: 20, color: "#7c3aed" }} />
            </Box>
            {/* <TrendingUpIcon sx={{ fontSize: 18, color: "#22c55e" }} /> */}
          </Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "2rem",
              color: "#1e293b",
              lineHeight: 1,
            }}
          >
            {totalCases}
          </Typography>
          <Typography sx={{ fontSize: "0.875rem", color: "#64748b", mt: 0.5 }}>
            Total Cases
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "#22c55e", mt: 0.5 }}>
            +{casesThisMonth} this month
          </Typography>
        </div>
      </Grid>

      {/* Active Users */}
      <Grid item xs={12} sm={6} lg={3}>
        <div  className="bg-white rounded-2xl p-5 border border-slate-250 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer" onClick={onActiveUsersClick} >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1.5,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                backgroundColor: "#f3e8ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PeopleIcon sx={{ fontSize: 20, color: "#9333ea" }} />
            </Box>
            {/* <TrendingUpIcon sx={{ fontSize: 18, color: "#22c55e" }} /> */}
          </Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "2rem",
              color: "#1e293b",
              lineHeight: 1,
            }}
          >
            {activeUsers}
          </Typography>
          <Typography sx={{ fontSize: "0.875rem", color: "#64748b", mt: 0.5 }}>
            Active Users
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "#22c55e", mt: 0.5 }}>
            All active
          </Typography>
        </div>
      </Grid>

      {/* Upcoming Hearings */}
      {showHearings && (
        <Grid item xs={12} sm={6} lg={3}>
          <div
            className="bg-white rounded-2xl p-5 border border-slate-250 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
            onClick={onHearingsClick}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "10px",
                  backgroundColor: "#ffedd5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CalendarIcon sx={{ fontSize: 20, color: "#ea580c" }} />
              </Box>
              {/* <TrendingUpIcon sx={{ fontSize: 18, color: "#22c55e" }} /> */}
            </Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "2rem",
                color: "#1e293b",
                lineHeight: 1,
              }}
            >
              {upcomingHearings}
            </Typography>
            <Typography
              sx={{ fontSize: "0.875rem", color: "#64748b", mt: 0.5 }}
            >
              Upcoming Hearings
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "#22c55e", mt: 0.5 }}>
              Scheduled
            </Typography>
          </div>
        </Grid>
      )}

      {/* Resolved Cases */}
      <Grid item xs={12} sm={6} lg={3}>
        <div className="bg-white rounded-2xl p-5 border border-slate-250 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer" onClick={onResolvedCasesClick}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1.5,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                backgroundColor: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircleOutlineIcon sx={{ fontSize: 20, color: "#16a34a" }} />
            </Box>
            {/* <TrendingUpIcon sx={{ fontSize: 18, color: "#22c55e" }} /> */}
          </Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "2rem",
              color: "#1e293b",
              lineHeight: 1,
            }}
          >
            {resolvedCases}
          </Typography>
          <Typography sx={{ fontSize: "0.875rem", color: "#64748b", mt: 0.5 }}>
            Resolved Cases
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "#22c55e", mt: 0.5 }}>
            {resolvedCases} closed
          </Typography>
        </div>
      </Grid>
    </Grid>
  );
}
