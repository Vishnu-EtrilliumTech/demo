"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, SectionHead } from "@/design-system";
import type { Case } from "@/app/organization/types";

type TimePeriod = "ytd" | "6m" | "1y";

const PERIODS: { key: TimePeriod; label: string }[] = [
  { key: "ytd", label: "YTD" },
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
];

/** Incoming-case counts per month for the chosen window (mirrors legacy FirmGrowthLineChart). */
function buildGrowthData(cases: Case[], period: TimePeriod) {
  const now = new Date();
  let startDate: Date;
  let months: number;
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
  const data: { month: string; cases: number }[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    if (d > now) break;
    const count = cases.filter((c) => {
      const cd = new Date(c.createdDate ?? c.createdAt ?? "");
      return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
    }).length;
    data.push({ month: d.toLocaleString("default", { month: "short" }), cases: count });
  }
  return data;
}

/** "Firm growth" card — incoming cases over time. Design-system shell around the recharts line. */
export default function FirmGrowthCard({ cases }: { cases: Case[] }) {
  const [period, setPeriod] = useState<TimePeriod>("ytd");
  const data = buildGrowthData(cases, period);

  return (
    <Card pad>
      <SectionHead
        icon={TrendingUp}
        title="Firm growth — incoming cases"
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
          <RechartsTooltip />
          <Line
            type="monotone"
            dataKey="cases"
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
