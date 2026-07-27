"use client";

import React, { useState } from "react";
import {
  Scale,
  Sparkles,
  Gavel,
  MessagesSquare,
  TrendingUp,
  FileText,
  ArrowLeft,
  RefreshCw,
  Save,
  Fingerprint,
  BadgeCheck,
  Landmark,
  Info,
  Link2,
  FolderPlus,
} from "lucide-react";
import { Button, Card, Input, SectionHead, Tabs, type TabItem } from "@/design-system";
import { CourtDataPayload } from "@/app/organization/types/ecourtTypes";
import { CaseInfoTab } from "./CaseInfoTab";
import { AiSummaryTab } from "./AiSummaryTab";
import { LegalAnalysisTab } from "./LegalAnalysisTab";
import { ArgumentsTab } from "./ArgumentsTab";
import { InsightsTab } from "./InsightsTab";
import { JudgmentTab } from "./JudgmentTab";
import { formatLastUpdated, DownloadButton } from "./parts";

export interface EcourtDetailsViewProps {
  data: CourtDataPayload;
  backLabel?: string;
  downloadFn: (orderUrl: string) => Promise<Blob>;
  onBack?: () => void;
  lastUpdated?: string | null;
  onUpdate?: () => Promise<void>;
  updating?: boolean;
  onSave?: (remarks: string) => Promise<void>;
  saving?: boolean;
  isSaved?: boolean;
  onLink?: () => void;
  /** Shown alongside "Link to case" when the CNR is not yet linked. */
  onCreateCase?: () => void;
}

/** Derive a readable case title from the parties; fall back to the CNR. */
function deriveTitle(petitioners: string[], respondents: string[], cnr: string): string {
  const p = petitioners?.[0];
  const r = respondents?.[0];
  if (p && r) return `${p} v. ${r}`;
  if (p) return p;
  if (r) return r;
  return cnr;
}

/**
 * DS eCourts court-record renderer. Composes the shared token+component layer
 * (LuiRoot scope is provided by the caller). Case Info always renders; the AI
 * tabs render only when `data.files[0].aiAnalysis` is present (data-gated, per
 * contract §J) and carry the mandated first-release "Preview" messaging.
 */
export default function EcourtDetailsView({
  data,
  backLabel = "Back to case",
  downloadFn,
  onBack,
  lastUpdated,
  onUpdate,
  updating = false,
  onSave,
  saving = false,
  isSaved = false,
  onLink,
  onCreateCase,
}: EcourtDetailsViewProps) {
  const cd = data.courtCaseData;
  const [tab, setTab] = useState("case-info");
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [remarks, setRemarks] = useState("");

  const hasFiles = data.files.length > 0;
  const hasAiAnalysis = hasFiles && data.files[0].aiAnalysis !== null;
  const hasJudgmentData = hasFiles || cd.judgmentOrders.length > 0;

  const tabs: TabItem[] = [
    { key: "case-info", label: "Case Info", icon: Scale },
    ...(hasAiAnalysis
      ? [
          { key: "ai-summary", label: "AI Summary", icon: Sparkles },
          { key: "legal-analysis", label: "Legal Analysis", icon: Gavel },
          { key: "arguments", label: "Arguments", icon: MessagesSquare },
          { key: "insights", label: "Insights", icon: TrendingUp },
        ]
      : []),
    ...(hasJudgmentData ? [{ key: "judgment", label: "Judgment", icon: FileText }] : []),
  ];

  const handleDownload = async (orderUrl: string, filename: string) => {
    setDownloading((prev) => ({ ...prev, [orderUrl]: true }));
    try {
      const blob = await downloadFn(orderUrl);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } finally {
      setDownloading((prev) => ({ ...prev, [orderUrl]: false }));
    }
  };

  const title = deriveTitle(cd.petitioners, cd.respondents, cd.cnr);

  return (
    <div>
      {/* Header */}
      <div className="page-head" style={{ flexDirection: "column", alignItems: "stretch" }}>
        <div className="eyebrow">
          <Landmark aria-hidden /> eCourts · Live record
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0 }}>{title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {lastUpdated && (
              <span className="ec-updated">
                <RefreshCw aria-hidden /> {formatLastUpdated(lastUpdated)}
              </span>
            )}
            {onBack && (
              <Button variant="secondary" icon={ArrowLeft} onClick={onBack}>
                {backLabel}
              </Button>
            )}
            {onUpdate && (
              <Button variant="primary" icon={RefreshCw} loading={updating} onClick={onUpdate}>
                Update
              </Button>
            )}
            {onLink && (
              <Button variant="secondary" icon={Link2} onClick={onLink}>
                Link to case
              </Button>
            )}
            {onCreateCase && (
              <Button variant="secondary" icon={FolderPlus} onClick={onCreateCase}>
                Create case
              </Button>
            )}
          </div>
        </div>
        <div className="subline" style={{ justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="chip-mono">
              <Fingerprint aria-hidden /> CNR <b>{cd.cnr}</b>
            </span>
            {isSaved && (
              <span className="chip-mono sync">
                <BadgeCheck aria-hidden /> <b>Saved record</b>
              </span>
            )}
            {(cd.courtName || cd.caseTypeRaw) && (
              <span style={{ fontSize: 13, color: "var(--text-2)" }}>
                {[cd.courtName, cd.caseTypeRaw].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "nowrap" }}>
            {onSave && !isSaved && (
              <>
                <Input
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add remarks (optional)"
                  maxLength={2000}
                  style={{ flex: "0 1 260px", minWidth: 160 }}
                />
                <Button variant="secondary" icon={Save} loading={saving} onClick={() => onSave(remarks)} style={{ flex: "none" }}>
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs items={tabs} activeKey={tab} onChange={setTab} />

      {/* Active panel */}
      {tab === "case-info" && <CaseInfoTab data={data} downloading={downloading} onDownload={handleDownload} />}
      {tab === "ai-summary" && hasAiAnalysis && <AiSummaryTab file={data.files[0]} />}
      {tab === "legal-analysis" && hasAiAnalysis && <LegalAnalysisTab file={data.files[0]} />}
      {tab === "arguments" && hasAiAnalysis && <ArgumentsTab file={data.files[0]} />}
      {tab === "insights" && hasAiAnalysis && <InsightsTab file={data.files[0]} />}
      {tab === "judgment" &&
        (hasFiles ? (
          <JudgmentTab files={data.files} downloading={downloading} onDownload={handleDownload} />
        ) : (
          <>
            <div className="banner brand" style={{ marginBottom: 20 }}>
              <span className="bi">
                <Info aria-hidden />
              </span>
              <div className="t">
                <b>AI-processed judgment files not yet available</b>
                <span>Showing raw judgment orders from eCourts.</span>
              </div>
            </div>
            <Card pad>
              <SectionHead icon={FileText} title="Judgment orders" />
              <div className="jgrid">
                {cd.judgmentOrders.map((j, idx) => (
                  <div className="jfile" key={idx}>
                    <span className="fi">
                      <FileText aria-hidden />
                    </span>
                    <div className="jt">
                      <b>{j.orderType}</b>
                      <span>{j.orderDate}</span>
                    </div>
                    <DownloadButton loading={!!downloading[j.orderUrl]} onClick={() => handleDownload(j.orderUrl, j.orderUrl)}>
                      Download PDF
                    </DownloadButton>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ))}
    </div>
  );
}
