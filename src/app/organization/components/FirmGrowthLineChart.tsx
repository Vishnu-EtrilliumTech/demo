"use client";

import { useState } from "react";
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
  Card,
  Typography,
  Box,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import type { Case } from "@/app/organization/types";

interface Props {
  cases: Case[];
}

type TimePeriod = "ytd" | "6m" | "1y";

function buildGrowthData(cases: Case[], period: TimePeriod) {
  const now = new Date();
  let startDate: Date;
  let months: number;

  switch (period) {
    case "ytd":
      months = now.getMonth() + 1;
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case "6m":
      months = 6;
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      break;
    case "1y":
      months = 12;
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      break;
    default:
      months = 6;
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  }

  const data: Array<{ month: string; cases: number; date: Date }> = [];

  for (let i = 0; i < months; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    if (d > now) break; // Don't include future months

    const count = cases.filter((c) => {
      const cd = new Date(c.createdDate ?? c.createdAt ?? "");
      return (
        cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear()
      );
    }).length;

    const monthLabel = d.toLocaleString("default", { month: "short" });

    data.push({ month: monthLabel, cases: count, date: d });
  }

  return data;
}

export default function FirmGrowthLineChart({ cases }: Props) {
  const [period, setPeriod] = useState<TimePeriod>("ytd");
  const growthData = buildGrowthData(cases, period);

  const handlePeriodChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPeriod: TimePeriod | null,
  ) => {
    if (newPeriod !== null) {
      setPeriod(newPeriod);
    }
  };

  const getPeriodLabel = (p: TimePeriod) => {
    switch (p) {
      case "6m":
        return "6 Months";
      case "ytd":
        return "Year to Date";
      case "1y":
        return "1 Year";
      default:
        return "";
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: "1px solid #f1f5f9",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        background: "#ffffff",
        p: 3,
        flex: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: "1rem",
              color: "#1e293b",
              mb: 0.5,
            }}
          >
            Firm Growth — Incoming Cases
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "#94a3b8", mb: 1 }}>
            {getPeriodLabel(period)}
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={handlePeriodChange}
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
              "&.Mui-selected": {
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                borderColor: "#3b82f6",
                "&:hover": {
                  backgroundColor: "#2563eb",
                },
              },
              "&:hover": {
                backgroundColor: "#f1f5f9",
              },
            },
          }}
        >
          <ToggleButton value="ytd" aria-label="year to date">
            YTD
          </ToggleButton>
          <ToggleButton value="6m" aria-label="6 months">
            6M
          </ToggleButton>
          <ToggleButton value="1y" aria-label="1 year">
            1Y
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={growthData}
          margin={{ top: 5, right: 15, left: -15, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#F1F5F9"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
          />
          <RechartsTooltip />
          <Line
            type="monotone"
            dataKey="cases"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ r: 4, fill: "#3B82F6", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
