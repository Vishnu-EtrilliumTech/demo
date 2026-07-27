"use client";

import { useRouter } from "next/navigation";
import { PieChart } from "lucide-react";
import { Card, SectionHead, Pill } from "@/design-system";
import type { Case } from "@/app/organization/types";
import { CaseStatus } from "@/app/organization/types";
import { CASE_STATUS_ORDER, CASE_STATUS_COLOR, CASE_STATUS_LABEL } from "@/app/organization/components/caseStatusUi";

interface Props {
  cases: Case[];
  organizationId: string;
  siteId?: string;
  isRestricted?: boolean;
  onRestrictedClick?: () => void;
}

/** Status rows use the shared status→color/label mapping (see caseStatusUi). */
const STATUS_ROWS = CASE_STATUS_ORDER.map((status) => ({
  status,
  label: CASE_STATUS_LABEL[status],
  color: CASE_STATUS_COLOR[status],
}));

/**
 * "Cases by status" card — the design's meter treatment of the legacy
 * CaseStatusPieChart. Preserves behaviour: clicking a status filters the Cases
 * list (`?status=`), and OrgClerk clicks raise the restricted-access dialog.
 */
export default function CasesByStatusCard({ cases, organizationId, siteId, isRestricted, onRestrictedClick }: Props) {
  const router = useRouter();
  const total = cases.length;
  const activeMatters = cases.filter((c) => c.status !== CaseStatus.Closed).length;

  const rows = STATUS_ROWS.map((r) => ({
    ...r,
    value: cases.filter((c) => c.status === r.status).length,
  }));

  const handleClick = (status: CaseStatus) => {
    if (isRestricted) {
      onRestrictedClick?.();
      return;
    }
    const url = new URL(`/organization/${organizationId}/cases`, window.location.origin);
    url.searchParams.set("status", status);
    if (siteId) url.searchParams.set("siteId", siteId);
    router.push(url.pathname + url.search);
  };

  return (
    <Card pad>
      <SectionHead
        icon={PieChart}
        title="Cases by status"
        actions={<Pill tone="neutral">{activeMatters} active matters</Pill>}
      />
      <div className="meter">
        {rows.map((r) => {
          const percent = total > 0 ? Math.round((r.value / total) * 100) : 0;
          return (
            <div
              className="m"
              key={r.status}
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() => handleClick(r.status)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClick(r.status);
                }
              }}
            >
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
    </Card>
  );
}
