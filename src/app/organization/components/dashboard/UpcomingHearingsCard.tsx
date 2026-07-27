"use client";

import { useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { Card, SectionHead } from "@/design-system";
import type { Hearing } from "@/app/organization/types";

const MAX_ROWS = 5;

interface Props {
  hearings: Hearing[];
  organizationId: string;
}

/**
 * "Upcoming hearings" list card, built from the real org hearings already
 * loaded by the dashboard. Rows link to the case's Hearings tab.
 */
export default function UpcomingHearingsCard({ hearings, organizationId }: Props) {
  const router = useRouter();
  const now = new Date();

  const upcoming = hearings
    .filter((h) => new Date(h.hearingDateTime) > now)
    .sort((a, b) => new Date(a.hearingDateTime).getTime() - new Date(b.hearingDateTime).getTime())
    .slice(0, MAX_ROWS);

  const go = (h: Hearing) => {
    if (!h.siteId || !h.caseId) return;
    router.push(`/organization/${organizationId}/sites/${h.siteId}/cases/${h.caseId}?tab=hearings`);
  };

  return (
    <Card pad className="listcard">
      <SectionHead icon={CalendarClock} title="Upcoming hearings" />
      {upcoming.length === 0 ? (
        <p style={{ color: "var(--text-3)", fontSize: 13, padding: "6px 0" }}>No upcoming hearings scheduled.</p>
      ) : (
        upcoming.map((h) => {
          const d = new Date(h.hearingDateTime);
          const day = d.toLocaleDateString("default", { day: "2-digit" });
          const mo = d.toLocaleDateString("default", { month: "short" });
          const sub = [h.hearingLocation, h.assignedToName].filter(Boolean).join(" · ");
          return (
            <div
              key={h.id}
              className="li click"
              role="button"
              tabIndex={0}
              onClick={() => go(h)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  go(h);
                }
              }}
            >
              <div className="ldate">
                <div className="d">{day}</div>
                <div className="mo">{mo}</div>
              </div>
              <div className="lbody">
                <b title={h.caseName || "Case hearing"}>{h.caseName || "Case hearing"}</b>
                <span>{sub || "Hearing scheduled"}</span>
              </div>
            </div>
          );
        })
      )}
    </Card>
  );
}
