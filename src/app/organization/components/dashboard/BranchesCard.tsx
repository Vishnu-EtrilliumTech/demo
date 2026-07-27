"use client";

import { useRouter } from "next/navigation";
import { Building2, ArrowRight } from "lucide-react";
import { Card, SectionHead, Button } from "@/design-system";
import type { Site } from "@/app/organization/types";

const MAX_ROWS = 5;

interface Props {
  sites: Site[];
  organizationId: string;
}

/**
 * "Branches" card listing the org's sites (real data). Each row navigates to
 * the branch dashboard. Per-branch case/staff aggregates aren't provided by the
 * dashboard payload, so they're omitted rather than fabricated.
 */
export default function BranchesCard({ sites, organizationId }: Props) {
  const router = useRouter();
  const rows = sites.slice(0, MAX_ROWS);

  const go = (siteId: string) => router.push(`/organization/${organizationId}/sites/${siteId}`);

  return (
    <Card pad className="branchlist">
      <SectionHead
        icon={Building2}
        title="Sites"
        actions={
          sites.length > MAX_ROWS ? (
            <Button variant="ghost" iconRight={ArrowRight} onClick={() => router.push(`/organization/${organizationId}/sites`)}>
              View all
            </Button>
          ) : undefined
        }
      />
      {rows.map((s) => {
        const place = [s.locality, s.district, s.state].filter(Boolean).join(", ");
        return (
          <div
            key={s.id}
            className="br"
            role="button"
            tabIndex={0}
            onClick={() => go(String(s.id))}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                go(String(s.id));
              }
            }}
          >
            <span className="bi">
              <Building2 aria-hidden />
            </span>
            <div className="bbody">
              <b title={s.name}>{s.name}</b>
              <span>{place || "—"}</span>
            </div>
            <ArrowRight width={15} height={15} style={{ color: "var(--text-3)", flex: "none" }} aria-hidden />
          </div>
        );
      })}
    </Card>
  );
}
