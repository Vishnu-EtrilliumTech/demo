'use client';

import { useRouter } from 'next/navigation';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  PieSectorDataItem,
} from 'recharts';
import { Card, Typography } from '@mui/material';
import type { Case } from '@/app/organization/types';

interface Props {
  cases: Case[];
  organizationId: string;
  siteId?: string;
  isRestricted?: boolean;
  onRestrictedClick?: () => void;
}

const PIE_COLORS = [
  { status: 'Open',       label: 'Open',        color: '#3B82F6' },
  { status: 'InProgress', label: 'In Progress',  color: '#F59E0B' },
  { status: 'OnHold',     label: 'On Hold',      color: '#8B5CF6' },
  { status: 'Closed',     label: 'Closed',       color: '#10B981' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderPieLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, name, value, fill } = props;
  if (midAngle == null || outerRadius == null) return null;
  const RADIAN = Math.PI / 180;
  const radius = (outerRadius as number) + 38;
  const x = (cx as number) + radius * Math.cos(-(midAngle as number) * RADIAN);
  const y = (cy as number) + radius * Math.sin(-(midAngle as number) * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      textAnchor={x > (cx as number) ? 'start' : 'end'}
      fontSize={12}
      fontWeight={500}
      dominantBaseline="central"
    >
      {`${name}: ${value}`}
    </text>
  );
};

export default function CaseStatusPieChart({ cases, organizationId, siteId, isRestricted, onRestrictedClick }: Props) {
  const router = useRouter();

  const pieData = PIE_COLORS.map(({ status, label, color }) => ({
    name: label,
    value: cases.filter(c => c.status === status).length,
    color,
    rawStatus: status,
  })).filter(d => d.value > 0);

  const handlePieClick = (data: PieSectorDataItem) => {
    if (isRestricted) {
      onRestrictedClick?.();
      return;
    }
    const rawStatus = (data.payload as { rawStatus?: string })?.rawStatus;
    if (rawStatus) {
      const url = new URL(`/organization/${organizationId}/cases`, window.location.origin);
      url.searchParams.set('status', rawStatus);
      if (siteId) {
        url.searchParams.set('siteId', siteId);
      }
      router.push(url.pathname + url.search);
    }
  };

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', background: '#ffffff', p: 3, flex: 1 }}>
      <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1e293b', mb: 0.5 }}>
        Case Status Distribution
      </Typography>
      <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mb: 1 }}>
        Click a segment to filter cases
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="46%"
            innerRadius={55}
            outerRadius={80}
            dataKey="value"
            paddingAngle={2}
            label={renderPieLabel}
            labelLine={{ stroke: '#CBD5E1', strokeWidth: 1 }}
            onClick={handlePieClick}
            cursor="pointer"
          >
            {pieData.map(entry => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip
            formatter={(value, name) => [`${value} cases`, name as string]}
            wrapperStyle={{ zIndex: 10 }}
          />
          <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.75rem', paddingTop: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}