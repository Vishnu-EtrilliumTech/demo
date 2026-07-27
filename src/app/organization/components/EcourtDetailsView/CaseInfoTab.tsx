"use client";

import React, { useState } from "react";
import {
  Info,
  Calendar,
  Users,
  BarChart3,
  Gavel,
  FileStack,
  FileText,
  ScrollText,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from "lucide-react";
import { Button, Card, SectionHead, Pill } from "@/design-system";
import {
  CourtDataPayload,
  CourtCaseData,
  FiledDocument,
} from "@/app/organization/types/ecourtTypes";
import { Kv, KvRow, CaseStatusPill, DownloadButton, enumDisplay, SimpleTable } from "./parts";
import type { Column } from "@/design-system";

interface CaseInfoTabProps {
  data: CourtDataPayload;
  downloading: Record<string, boolean>;
  onDownload: (orderUrl: string, filename: string) => void;
}

function CollapseToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      className="ec-collapse-btn"
      iconRight={open ? ChevronUp : ChevronDown}
      onClick={onToggle}
    >
      {open ? "Hide" : "Show"}
    </Button>
  );
}

export function CaseInfoTab({ data, downloading, onDownload }: CaseInfoTabProps) {
  const cd: CourtCaseData = data.courtCaseData;
  const ei = data.entityInfo;
  const enums = data.descriptions.enumLookup;
  const [hearingOpen, setHearingOpen] = useState(false);
  const [interimOpen, setInterimOpen] = useState(false);
  const [judgmentOpen, setJudgmentOpen] = useState(false);

  const emptyCollections = [
    { label: "Tagged Matters", count: cd.taggedMatters.length },
    { label: "Earlier Court Details", count: cd.earlierCourtDetails.length },
    { label: "Notices", count: cd.notices.length },
    { label: "Caveat Details", count: cd.caveatDetails.length },
    { label: "Listing Dates", count: cd.listingDates.length },
    { label: "Link Cases", count: cd.linkCases.length },
    { label: "Processes", count: cd.processes.length },
  ];

  const rawDumps: { label: string; value: unknown[] }[] = [
    { label: "Tagged Matters", value: cd.taggedMatters },
    { label: "Earlier Court Details", value: cd.earlierCourtDetails },
    { label: "Notices", value: cd.notices },
    { label: "Caveat Details", value: cd.caveatDetails },
    { label: "Listing Dates", value: cd.listingDates },
    { label: "Link Cases", value: cd.linkCases },
    { label: "Processes", value: cd.processes },
  ];

  return (
    <>
      {/* Case Snapshot */}
      <Card pad>
        <SectionHead icon={Info} title="Case snapshot" />
        <Kv>
          <KvRow k="CNR" v={cd.cnr} />
          <KvRow k="Case Number" v={cd.caseNumber} />
          <KvRow k="Court" v={cd.courtName} />
          <KvRow k="Case Type" v={enumDisplay(enums.caseType, cd.caseType, cd.caseTypeRaw)} />
          <KvRow
            k="Case Status"
            v={<CaseStatusPill status={cd.caseStatus} label={enumDisplay(enums.caseStatus, cd.caseStatus, cd.caseStatus)} />}
          />
          <KvRow k="State" v={cd.state} />
          <KvRow k="District" v={cd.district} />
          {cd.judges?.length > 0 && <KvRow k="Judge(s)" v={cd.judges.join(", ")} />}
          <KvRow k="Judicial Section" v={enumDisplay(enums.judicialSection, cd.judicialSection ?? "", cd.judicialSectionRaw)} />
          <KvRow k="Purpose" v={cd.purpose} />
          <KvRow k="Disposal Type" v={cd.disposalTypeRaw} />
          <KvRow k="Contested Status" v={cd.contestedStatus} />
          <KvRow k="Court Code" v={enumDisplay(enums.courtCode, cd.cnrCourtCode, cd.cnrCourtCode)} />
          <KvRow k="Court No." v={cd.courtNo !== 0 ? cd.courtNo : null} />
          <KvRow k="District Code" v={cd.districtCode} />
          <KvRow k="CNR Case No." v={cd.cnrCaseNumber} />
          <KvRow k="CNR Year" v={cd.cnrYear} />
        </Kv>
      </Card>

      {/* Key Dates */}
      <Card pad>
        <SectionHead icon={Calendar} title="Key dates" />
        <Kv>
          <KvRow k="Filing Number" v={cd.filingNumber} />
          <KvRow k="Filing Date" v={cd.filingDate} />
          <KvRow k="Registration Number" v={cd.registrationNumber} />
          <KvRow k="Registration Date" v={cd.registrationDate} />
          <KvRow k="First Hearing" v={cd.firstHearingDate} />
          <KvRow k="Last Hearing" v={cd.lastHearingDate} />
          <KvRow k="Next Hearing" v={cd.nextHearingDate} />
          <KvRow k="Decision Date" v={cd.decisionDate} />
          <KvRow k="Case Duration (days)" v={cd.caseDurationDays} />
          <KvRow k="Filing → First Hearing (days)" v={cd.filingToFirstHearingDays} />
        </Kv>
      </Card>

      {/* Parties */}
      <Card pad>
        <SectionHead icon={Users} title="Parties" />
        <div className="parties">
          <div className="party">
            <div className="role">Petitioners</div>
            {cd.petitioners.map((p, i) => (
              <div className="person" key={i}>
                <span className="ava av1">{(p || "?").charAt(0).toUpperCase()}</span>
                <span className="nm">{p}</span>
              </div>
            ))}
            {cd.petitionerAdvocates.length > 0 && (
              <div className="subhead" style={{ marginTop: 14 }}>Advocates: {cd.petitionerAdvocates.join(", ")}</div>
            )}
          </div>
          <div className="vs">
            <span>VS</span>
          </div>
          <div className="party">
            <div className="role">Respondents</div>
            {cd.respondents.map((r, i) => (
              <div className="person" key={i}>
                <span className="ava av5">{(r || "?").charAt(0).toUpperCase()}</span>
                <span className="nm">{r}</span>
              </div>
            ))}
            {cd.respondentAdvocates.length > 0 && (
              <div className="subhead" style={{ marginTop: 14 }}>Advocates: {cd.respondentAdvocates.join(", ")}</div>
            )}
          </div>
        </div>
      </Card>

      {/* Proceedings Stats */}
      <Card pad>
        <SectionHead icon={BarChart3} title="Proceedings" />
        <div className="tiles tiles-auto">
          {[
            { label: "Hearings", val: cd.hearingCount },
            { label: "Orders", val: cd.orderCount },
            { label: "Interim Orders", val: cd.interimOrderCount },
            { label: "Judgments", val: cd.judgmentCount },
            { label: "IAs", val: cd.iaCount },
            { label: "Has Orders", val: cd.hasOrders ? "Yes" : "No" },
            { label: "Has Judgments", val: cd.hasJudgments ? "Yes" : "No" },
          ].map(({ label, val }) => (
            <div className="tile" key={label}>
              <div className="n">{val}</div>
              <div className="l">{label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Hearing History */}
      {cd.historyOfCaseHearings.length > 0 && (
        <Card>
          <SectionHead
            padded
            icon={Calendar}
            title={`Hearing history (${cd.historyOfCaseHearings.length} records)`}
            actions={<CollapseToggle open={hearingOpen} onToggle={() => setHearingOpen((v) => !v)} />}
          />
          {hearingOpen && (
            <SimpleTable
              columns={
                [
                  { key: "business", header: "Business Date", render: (h) => h.businessOnDate },
                  { key: "hearing", header: "Hearing Date", render: (h) => h.hearingDate ?? "—" },
                  { key: "judge", header: "Judge", render: (h) => h.judge || "—" },
                  { key: "purpose", header: "Purpose", render: (h) => h.purposeOfListing },
                ] as Column<(typeof cd.historyOfCaseHearings)[number]>[]
              }
              rows={cd.historyOfCaseHearings}
            />
          )}
        </Card>
      )}

      {/* Interim Orders */}
      {cd.interimOrders.length > 0 && (
        <Card>
          <SectionHead
            padded
            icon={Gavel}
            title={`Interim orders (${cd.interimOrders.length} records)`}
            actions={<CollapseToggle open={interimOpen} onToggle={() => setInterimOpen((v) => !v)} />}
          />
          {interimOpen && (
            <SimpleTable
              columns={
                [
                  { key: "date", header: "Date", render: (o) => <span style={{ whiteSpace: "nowrap" }}>{o.orderDate}</span> },
                  { key: "description", header: "Description", render: (o) => o.description },
                  {
                    key: "download",
                    header: "Download",
                    align: "right",
                    render: (o) => (
                      <DownloadButton loading={!!downloading[o.orderUrl]} onClick={() => onDownload(o.orderUrl, o.orderUrl)} />
                    ),
                  },
                ] as Column<(typeof cd.interimOrders)[number]>[]
              }
              rows={cd.interimOrders}
            />
          )}
        </Card>
      )}

      {/* Interlocutory Applications */}
      {cd.interlocutoryApplications.length > 0 && (
        <Card>
          <SectionHead padded icon={FileStack} title="Interlocutory applications" />
          <SimpleTable
            columns={
              [
                { key: "regNo", header: "Reg. No.", render: (ia) => <span style={{ fontSize: "0.78rem" }}>{ia.regNo}</span> },
                { key: "filedBy", header: "Filed By", render: (ia) => ia.filedBy },
                { key: "filingDate", header: "Filing Date", render: (ia) => <span style={{ whiteSpace: "nowrap" }}>{ia.filingDate}</span> },
                { key: "remark", header: "Remark", render: (ia) => ia.remark },
                {
                  key: "status",
                  header: "Status",
                  render: (ia) => <Pill tone={ia.status === "Pending" ? "warn" : "ok"}>{ia.status}</Pill>,
                },
              ] as Column<(typeof cd.interlocutoryApplications)[number]>[]
            }
            rows={cd.interlocutoryApplications}
          />
        </Card>
      )}

      {/* Judgment & Orders */}
      {cd.judgmentOrders.length > 0 && (
        <Card pad>
          <SectionHead
            icon={ScrollText}
            title={`Judgments & orders (${cd.judgmentOrders.length} records)`}
            actions={<CollapseToggle open={judgmentOpen} onToggle={() => setJudgmentOpen((v) => !v)} />}
          />
          {judgmentOpen && (
            <div className="jgrid">
              {cd.judgmentOrders.map((j, i) => (
                <div className="jfile" key={i}>
                  <span className="fi">
                    <FileText aria-hidden />
                  </span>
                  <div className="jt">
                    <b>{j.orderType}</b>
                    <span>{j.orderDate}</span>
                  </div>
                  <DownloadButton loading={!!downloading[j.orderUrl]} onClick={() => onDownload(j.orderUrl, j.orderUrl)}>
                    Download PDF
                  </DownloadButton>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* FIR Details */}
      {Object.keys(cd.firDetails).length > 0 && (
        <Card pad>
          <SectionHead icon={FileText} title="FIR details" />
          <Kv>
            {Object.entries(cd.firDetails).map(([k, v]) => (
              <KvRow key={k} k={k} v={String(v)} />
            ))}
          </Kv>
        </Card>
      )}

      {/* Subordinate Court */}
      {Object.keys(cd.subordinateCourt).length > 0 && (
        <Card pad>
          <SectionHead icon={Gavel} title="Subordinate court" />
          <Kv>
            {Object.entries(cd.subordinateCourt).map(([k, v]) => (
              <KvRow key={k} k={k} v={String(v)} />
            ))}
          </Kv>
        </Card>
      )}

      {/* Raw JSON dumps for populated but unmodeled collections */}
      {rawDumps
        .filter((d) => d.value.length > 0)
        .map((d) => (
          <Card pad key={d.label}>
            <SectionHead icon={FileStack} title={d.label} />
            <pre style={{ margin: 0, fontSize: 12, overflowX: "auto", color: "var(--text-2)" }}>
              {JSON.stringify(d.value, null, 2)}
            </pre>
          </Card>
        ))}

      {/* Filed Documents */}
      {cd.filedDocuments.length > 0 && (
        <Card>
          <SectionHead padded icon={FileText} title={`Filed documents (${cd.filedDocuments.length})`} />
          <SimpleTable
            columns={
              [
                { key: "srNo", header: "Sr. No.", render: (doc) => doc.srNo },
                { key: "docNo", header: "Doc. No.", render: (doc) => doc.documentNo },
                { key: "dateReceived", header: "Date Received", render: (doc) => <span style={{ whiteSpace: "nowrap" }}>{doc.dateOfReceiving}</span> },
                { key: "filedBy", header: "Filed By", render: (doc) => doc.filedBy },
                { key: "advocate", header: "Advocate", render: (doc) => doc.advocateName ?? "—" },
                { key: "document", header: "Document", render: (doc) => doc.documentFiled },
              ] as Column<FiledDocument>[]
            }
            rows={cd.filedDocuments as FiledDocument[]}
          />
        </Card>
      )}

      {/* Empty-collection summary + system record */}
      <Card pad>
        <SectionHead icon={ShieldCheck} title="System record" />
        <Kv>
          <KvRow k="CNR" v={ei.cnr} />
          <KvRow k="Last Hearing (system)" v={ei.lastDateOfHearing} />
          <KvRow k="Next Hearing (system)" v={ei.nextDateOfHearing} />
          <KvRow k="Date Created" v={ei.dateCreated} />
          <KvRow k="Date Modified" v={ei.dateModified} />
        </Kv>
        {emptyCollections.some((x) => x.count === 0) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            {emptyCollections
              .filter((x) => x.count === 0)
              .map(({ label }) => (
                <Pill key={label} tone="neutral">
                  {label}: None
                </Pill>
              ))}
          </div>
        )}
      </Card>
    </>
  );
}
