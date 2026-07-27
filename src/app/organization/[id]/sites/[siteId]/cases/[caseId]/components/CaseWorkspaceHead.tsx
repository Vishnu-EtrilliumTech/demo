"use client";

import type { ReactNode } from "react";
import {
  FolderOpen,
  Fingerprint,
  Hash,
  Calendar,
  CalendarClock,
  Hourglass,
  Milestone,
  Building2,
  User as UserIcon,
  Pencil,
  Trash2,
  Landmark,
  Link2,
} from "lucide-react";
import { Pill, Button, KpiCard } from "@/design-system";
import type { Site, User } from "@/app/organization/types";
import type { CaseHearing } from "@/app/organization/types/caseindex";
import type { CaseData } from "../types/case";
import { caseStatusTone, CASE_STATUS_LABEL } from "@/app/organization/components/caseStatusUi";
import { formatDisplayDate } from "@/utils";

interface Props {
  caseData: CaseData;
  siteData?: Site;
  assignedUser?: User;
  nextHearing: CaseHearing | null;
  hasCnrNumber: boolean;
  canEdit: boolean;
  canDelete: boolean;
  showLinkCnr: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onEcourts: () => void;
  onLinkCnr: () => void;
}

/** Italicise the " v. " / " vs. " separator in a case title (mockup styling). */
function renderTitle(title: string): ReactNode {
  const m = title.match(/^(.*?)(\s+vs?\.?\s+)(.*)$/i);
  if (!m) return title;
  return (
    <>
      {m[1]} <em>v.</em> {m[3]}
    </>
  );
}

function countdown(dateStr: string): string {
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

/**
 * Case workspace header — the mockup's casehead + KPI strip, on the DS. The
 * KPI cards + next-hearing hero are populated from real case/site/hearing data
 * and degrade gracefully (e.g. "Not linked" CNR, "No upcoming hearing") since
 * court-derived fields exist only for CNR-linked cases.
 */
export default function CaseWorkspaceHead({
  caseData,
  siteData,
  assignedUser,
  nextHearing,
  hasCnrNumber,
  canEdit,
  canDelete,
  showLinkCnr,
  onEdit,
  onDelete,
  onEcourts,
  onLinkCnr,
}: Props) {
  return (
    <>
      <div className="casehead" style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
        <div className="lead" style={{ minWidth: 0 }}>
          <div className="eyebrow">
            <FolderOpen aria-hidden /> Case
            {siteData?.name ? (
              <>
                <span className="sep">·</span>
                <span className="muted">{siteData.name}</span>
              </>
            ) : null}
          </div>
          <h1 className="title">{renderTitle(caseData.title)}</h1>
          <div className="subline">
            {hasCnrNumber && caseData.cnrNumber ? (
              <span className="chip-mono">
                <Fingerprint aria-hidden /> CNR <b>{caseData.cnrNumber}</b>
              </span>
            ) : null}
            {caseData.caseNumber ? (
              <span className="chip-mono">
                <Hash aria-hidden /> <b>{caseData.caseNumber}</b>
              </span>
            ) : null}
            {caseData.createdDate ? (
              <span className="chip-mono">
                <Calendar aria-hidden /> Created <b>{formatDisplayDate(caseData.createdDate)}</b>
              </span>
            ) : null}
          </div>
        </div>

        <div className="head-actions" style={{ marginLeft: "auto" }}>
          <Pill tone={caseStatusTone(caseData.status)} dot>
            {CASE_STATUS_LABEL[caseData.status] ?? caseData.status}
          </Pill>
          {canEdit ? (
            <Button variant="secondary" icon={Pencil} onClick={onEdit}>
              Edit
            </Button>
          ) : null}
          {hasCnrNumber ? (
            <Button variant="primary" icon={Landmark} onClick={onEcourts}>
              eCourts Details
            </Button>
          ) : showLinkCnr ? (
            <Button variant="primary" icon={Link2} onClick={onLinkCnr}>
              Link CNR
            </Button>
          ) : null}
          {canDelete ? (
            <Button variant="secondary" icon={Trash2} onClick={onDelete} aria-label="Delete case" />
          ) : null}
        </div>
      </div>

      <div className="kstrip">
        <div className="hero-h">
          <div className="toprow">
            <div className="k">
              <CalendarClock aria-hidden /> Next Hearing
            </div>
            {nextHearing ? (
              <span className="cd">
                <Hourglass aria-hidden /> {countdown(nextHearing.hearingDateTime)}
              </span>
            ) : null}
          </div>
          {nextHearing ? (
            <>
              <div className="date">{formatDisplayDate(nextHearing.hearingDateTime)}</div>
              <div className="meta">
                {new Date(nextHearing.hearingDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {(nextHearing.courtLocationDisplay || nextHearing.courtName) ? ` · ${nextHearing.courtLocationDisplay || nextHearing.courtName}` : ""}
                {nextHearing.assignedToName ? ` · ${nextHearing.assignedToName}` : ""}
                {nextHearing.notes ? (
                  <>
                    <br />
                    {nextHearing.notes}
                  </>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <div className="date">No upcoming hearing</div>
              <div className="meta">Hearings appear here once scheduled or synced from eCourts.</div>
            </>
          )}
        </div>

        <div className="kcards">
          <KpiCard icon={Milestone} label="Status" value={CASE_STATUS_LABEL[caseData.status] ?? caseData.status} />
          <KpiCard icon={Hash} label="Case No." value={caseData.caseNumber || "—"} />
          <KpiCard icon={UserIcon} label="Lead Lawyer" value={assignedUser?.fullName || "Unassigned"} />
          <KpiCard icon={Building2} label="Site" value={siteData?.name || "—"} />
          <KpiCard icon={Calendar} label="Created" value={caseData.createdDate ? formatDisplayDate(caseData.createdDate) : "—"} />
          <KpiCard
            icon={Fingerprint}
            label="CNR"
            value={caseData.cnrNumber || "Not linked"}
            sub={caseData.cnrNumber ? undefined : "eCourts"}
          />
        </div>
      </div>
    </>
  );
}
