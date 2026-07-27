"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Landmark, Gavel, UserRound, CalendarDays, MapPin, Link2 } from "lucide-react";
import { Button, Pill } from "@/design-system";
import { EcourtsSearchResult, EcourtsQuota } from "@/app/organization/services/ecourtapi";
import { CourtDataApiResponse } from "@/app/organization/types/ecourtTypes";
import { formatDisplayDate } from "@/utils";

/** Monthly eCourts quota bar (server-enforced). */
export function QuotaBanner({ quota }: { quota: EcourtsQuota }) {
  if (quota.isUnlimited) {
    return (
      <div className="ec-quota">
        <div className="qh">
          <span className="lbl">Unlimited searches</span>
          <span style={{ color: "var(--text-3)" }}>{quota.consumedCount.toLocaleString()} used this month</span>
        </div>
      </div>
    );
  }
  const pct = quota.monthlyLimit > 0 ? Math.min((quota.consumedCount / quota.monthlyLimit) * 100, 100) : 0;
  const fill = quota.isExhausted ? "var(--danger)" : quota.isWarning ? "var(--warn-ink)" : "var(--ok)";
  return (
    <div className="ec-quota">
      <div className="qh">
        <span className="lbl">
          Monthly search quota
          {quota.isExhausted && <Pill tone="danger">Exhausted</Pill>}
          {quota.isWarning && !quota.isExhausted && <Pill tone="warn">Low</Pill>}
        </span>
        <span style={{ fontWeight: 700, color: fill }}>{quota.remainingCount.toLocaleString()} remaining</span>
      </div>
      <div className="linebar">
        <span className="f" style={{ width: `${pct}%`, background: fill }} />
      </div>
      <div style={{ textAlign: "right", fontSize: 11, color: "var(--text-3)" }}>
        {quota.consumedCount.toLocaleString()} / {quota.monthlyLimit.toLocaleString()}
      </div>
    </div>
  );
}

function MetaItem({ icon: Icon, label, value }: { icon: typeof Landmark; label: string; value: string }) {
  return (
    <span className="mi">
      <Icon aria-hidden />
      <b>{label}:</b> {value}
    </span>
  );
}

/** Search result card (list search). Click → CNR viewer. */
export function CaseResultCard({
  result,
  orgId,
  onLink,
}: {
  result: EcourtsSearchResult;
  orgId: string;
  onLink?: (cnr: string) => void;
}) {
  const router = useRouter();
  const isDisposed = result.caseStatus?.toUpperCase() === "DISPOSED";
  return (
    <div className="ec-result" onClick={() => router.push(`/organization/${orgId}/ecourt/${result.cnr}`)}>
      <div className="rtop">
        <span className="rmono">{result.cnr}</span>
        {result.caseType && result.caseType !== "UNKNOWN" && <Pill tone="brand">{result.caseType}</Pill>}
        {result.registrationNumber && <span style={{ fontSize: 12, color: "var(--text-3)" }}>#{result.registrationNumber}</span>}
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8 }}>
          {onLink && (
            <Button
              variant="ghost"
              icon={Link2}
              onClick={(e) => {
                e.stopPropagation();
                onLink(result.cnr);
              }}
            >
              Link
            </Button>
          )}
          <Pill tone={isDisposed ? "ok" : "warn"} dot>
            {isDisposed ? "Disposed" : "Pending"}
          </Pill>
        </span>
      </div>
      <div className="rparties">
        {result.petitioners.join(", ")}
        <span className="rvs">vs</span>
        {result.respondents.join(", ")}
      </div>
      <div className="rmeta">
        <MetaItem icon={Landmark} label="Court" value={result.courtCode} />
        {result.judges.length > 0 && <MetaItem icon={Gavel} label="Judge" value={result.judges.join(", ")} />}
        {result.petitionerAdvocates.length > 0 && (
          <MetaItem icon={UserRound} label="Advocate" value={result.petitionerAdvocates.join(", ")} />
        )}
        <MetaItem icon={CalendarDays} label="Filed" value={formatDisplayDate(result.filingDate)} />
        {result.decisionDate && <MetaItem icon={CalendarDays} label="Decided" value={formatDisplayDate(result.decisionDate)} />}
        {!result.decisionDate && result.nextHearingDate && (
          <MetaItem icon={CalendarDays} label="Next Hearing" value={formatDisplayDate(result.nextHearingDate)} />
        )}
        {result.judicialSection && result.judicialSection !== "UNKNOWN" && (
          <MetaItem icon={MapPin} label="Section" value={result.judicialSection} />
        )}
      </div>
      {result.caseCategory && <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--text-3)" }}>{result.caseCategory}</div>}
    </div>
  );
}

function DateRow({ label, value, reg, highlight }: { label: string; value: string | null; reg?: string; highlight?: boolean }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <span style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 700, minWidth: 100 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: highlight ? 700 : 500, color: highlight ? "var(--brand)" : "var(--text)" }}>
        {formatDisplayDate(value)}
      </span>
      {reg && <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>({reg})</span>}
    </div>
  );
}

/** Inline CNR result detail (single-CNR search). */
export function CnrResultDetail({
  response,
  orgId,
  onLink,
}: {
  response: CourtDataApiResponse;
  orgId: string;
  onLink?: (cnr: string) => void;
}) {
  const router = useRouter();
  const c = response.data.courtCaseData;
  const desc = response.data.descriptions;
  const isDisposed = c.caseStatus?.toUpperCase() === "DISPOSED";
  const caseTypeLabel = desc.enumLookup.caseType?.[c.caseType] ?? c.caseTypeRaw ?? c.caseType;
  const statusLabel = desc.enumLookup.caseStatus?.[c.caseStatus] ?? c.caseStatus;

  return (
    <div className="card">
      <div className="sec-head pd" style={{ flexWrap: "wrap" }}>
        <h3 style={{ gap: 10, flexWrap: "wrap" }}>
          <span className="rmono">{c.cnr}</span>
          <Pill tone="brand">{caseTypeLabel}</Pill>
          <Pill tone={isDisposed ? "ok" : "warn"} dot>
            {statusLabel}
          </Pill>
        </h3>
        <span style={{ display: "inline-flex", gap: 8 }}>
          {onLink && (
            <Button variant="secondary" icon={Link2} onClick={() => onLink(c.cnr)}>
              Link
            </Button>
          )}
          <Button variant="primary" onClick={() => router.push(`/organization/${orgId}/ecourt/${c.cnr}`)}>
            View details
          </Button>
        </span>
      </div>
      <div style={{ padding: "0 22px 22px" }}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.courtName}</div>
        {c.district && (
          <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 14 }}>
            {c.district}
            {c.state ? `, ${c.state}` : ""}
          </div>
        )}
        <div className="parties" style={{ marginBottom: 18 }}>
          <div className="party">
            <div className="role">Petitioner(s)</div>
            {c.petitioners.map((p, i) => (
              <div key={i} style={{ fontSize: 13, fontWeight: 600 }}>
                {p}
              </div>
            ))}
            {c.petitionerAdvocates.length > 0 && (
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>Adv: {c.petitionerAdvocates.join(", ")}</div>
            )}
          </div>
          <div className="vs">
            <span>VS</span>
          </div>
          <div className="party">
            <div className="role">Respondent(s)</div>
            {c.respondents.map((r, i) => (
              <div key={i} style={{ fontSize: 13, fontWeight: 600 }}>
                {r}
              </div>
            ))}
            {c.respondentAdvocates.length > 0 && (
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>Adv: {c.respondentAdvocates.join(", ")}</div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="subhead">Timeline</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <DateRow label="Filing" value={c.filingDate} reg={c.filingNumber} />
              <DateRow label="Registration" value={c.registrationDate} reg={c.registrationNumber} />
              <DateRow label="First Hearing" value={c.firstHearingDate} />
              <DateRow label="Last Hearing" value={c.lastHearingDate} />
              {!isDisposed && c.nextHearingDate && <DateRow label="Next Hearing" value={c.nextHearingDate} highlight />}
              {isDisposed && c.decisionDate && <DateRow label="Decision" value={c.decisionDate} highlight />}
            </div>
          </div>
          <div>
            <div className="subhead">Activity</div>
            <div className="tiles tiles-auto" style={{ minWidth: 260 }}>
              {[
                { l: "Hearings", n: c.hearingCount },
                { l: "Orders", n: c.orderCount },
                { l: "Judgments", n: c.judgmentCount },
                { l: "IAs", n: c.iaCount },
                { l: "Interim", n: c.interimOrderCount },
              ].map((s) => (
                <div className="tile" key={s.l}>
                  <div className="n">{s.n}</div>
                  <div className="l">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
