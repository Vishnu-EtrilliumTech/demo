"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Alert,
  LinearProgress,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
  Avatar,
  Divider,
  Grid,
} from "@mui/material";
import BalanceIcon from "@mui/icons-material/Balance";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import GavelIcon from "@mui/icons-material/Gavel";
import ForumIcon from "@mui/icons-material/Forum";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ArticleIcon from "@mui/icons-material/Article";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import PersonIcon from "@mui/icons-material/Person";

import { tabStyles } from "@/app/organization/[id]/tabs-styles";
import {
  CourtDataPayload,
  CourtCaseData,
  EcourtFile,
  FiledDocument,
} from "@/app/organization/types/ecourtTypes";
import { formatDisplayDate } from "@/utils";

interface EcourtDetailsViewProps {
  data: CourtDataPayload;
  backLabel?: string;
  downloadFn: (orderUrl: string) => Promise<Blob>;
  onBack?: () => void;
  lastUpdated?: string | null;
  onUpdate?: () => Promise<void>;
  updating?: boolean;
  onSave?: () => Promise<void>;
  saving?: boolean;
  isSaved?: boolean;
}

function formatLastUpdated(iso: string): string {
  const updated = new Date(iso);
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - updated.getTime()) / 60000);
  const isToday = updated.toDateString() === now.toDateString();

  if (isToday) {
    if (diffMins < 1) return 'Last updated just now';
    if (diffMins < 60) return `Last updated ${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return m === 0
      ? `Last updated ${h} hour${h === 1 ? '' : 's'} ago`
      : `Last updated ${h} hour${h === 1 ? '' : 's'} ${m} min${m === 1 ? '' : 's'} ago`;
  }
  return `Last updated on ${formatDisplayDate(iso)}`;
}

function TabPanel({
  children,
  value,
  index,
}: {
  children: React.ReactNode;
  value: number;
  index: number;
}) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ecourt-tabpanel-${index}`}
      aria-labelledby={`ecourt-tab-${index}`}
    >
      {value === index && <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="subtitle1"
      sx={{
        fontWeight: 700,
        color: "#1a237e",
        mb: 1.5,
        mt: 3,
        pb: 0.5,
        borderBottom: "2px solid #e3f2fd",
        "&:first-of-type": { mt: 0 },
      }}
    >
      {children}
    </Typography>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (!value && value !== 0) return null;
  return (
    <Box sx={{ display: "flex", gap: 1, mb: 0.75, flexWrap: "wrap" }}>
      <Typography variant="body2" sx={{ color: "text.secondary", minWidth: 160, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 500 }} component="span">
        {value}
      </Typography>
    </Box>
  );
}

function ConfidenceBar({ score, max = 10 }: { score: number; max?: number }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
      <LinearProgress
        variant="determinate"
        value={(score / max) * 100}
        sx={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: "#e3f2fd",
          "& .MuiLinearProgress-bar": { backgroundColor: "#1976d2" } }}
      />
      <Typography variant="caption" sx={{ color: "text.secondary", minWidth: 32 }}>
        {score}/{max}
      </Typography>
    </Box>
  );
}


function CaseStatusBadge({ status, label }: { status: string; label: string }) {
  const isDisposed = status === "DISPOSED";
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.25,
        py: 0.4,
        borderRadius: "20px",
        border: "1.5px solid",
        borderColor: isDisposed ? "success.300" : "warning.300",
        bgcolor: isDisposed ? "success.50" : "warning.50",
      }}
    >
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          bgcolor: isDisposed ? "success.main" : "warning.main",
          flexShrink: 0,
        }}
      />
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: isDisposed ? "success.dark" : "warning.dark",
          letterSpacing: 0.3,
          lineHeight: 1,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

// ── Case Info Tab ─────────────────────────────────────────────────────────────

function CaseInfoTab({
  data,
  downloading,
  onDownload,
}: {
  data: CourtDataPayload;
  downloading: Record<string, boolean>;
  onDownload: (orderUrl: string, filename: string) => void;
}) {
  const cd: CourtCaseData = data.courtCaseData;
  const ei = data.entityInfo;
  const enums = data.descriptions.enumLookup;
  const [hearingOpen, setHearingOpen] = useState(false);
  const [interimOpen, setInterimOpen] = useState(false);
  const [judgmentOpen, setJudgmentOpen] = useState(false);

  const enumDisplay = (lookup: Record<string, string>, key: string, raw: string | null) => {
    const desc = lookup[key];
    if (desc && desc !== raw) return `${raw || key} · ${desc}`;
    return raw || key;
  };

  return (
    <Box>
      {/* Case Snapshot */}
      <SectionTitle>Case Snapshot</SectionTitle>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <InfoRow label="CNR" value={cd.cnr} />
          <InfoRow label="Case Number" value={cd.caseNumber} />
          <InfoRow label="Court" value={cd.courtName} />
          <InfoRow label="Case Type" value={enumDisplay(enums.caseType, cd.caseType, cd.caseTypeRaw)} />
          <InfoRow
            label="Case Status"
            value={
              <CaseStatusBadge
                status={cd.caseStatus}
                label={enumDisplay(enums.caseStatus, cd.caseStatus, cd.caseStatus)}
              />
            }
          />
          <InfoRow label="State" value={cd.state} />
          <InfoRow label="District" value={cd.district} />
          {cd.judges?.length > 0 && (
            <InfoRow label="Judge(s)" value={cd.judges.join(", ")} />
          )}
        </Grid>
        <Grid item xs={12} md={6}>
          <InfoRow
            label="Judicial Section"
            value={enumDisplay(enums.judicialSection, cd.judicialSection ?? '', cd.judicialSectionRaw)}
          />
          <InfoRow label="Purpose" value={cd.purpose} />
          <InfoRow label="Disposal Type" value={cd.disposalTypeRaw} />
          <InfoRow label="Contested Status" value={cd.contestedStatus} />
          <InfoRow
            label="Court Code"
            value={enumDisplay(enums.courtCode, cd.cnrCourtCode, cd.cnrCourtCode)}
          />
          <InfoRow label="Court No." value={cd.courtNo !== 0 ? cd.courtNo : null} />
          <InfoRow label="District Code" value={cd.districtCode} />
          <InfoRow label="CNR Case No." value={cd.cnrCaseNumber} />
          <InfoRow label="CNR Year" value={cd.cnrYear} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Key Dates */}
      <SectionTitle>Key Dates</SectionTitle>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <InfoRow label="Filing Number" value={cd.filingNumber} />
          <InfoRow label="Filing Date" value={cd.filingDate} />
          <InfoRow label="Registration Number" value={cd.registrationNumber} />
          <InfoRow label="Registration Date" value={cd.registrationDate} />
          <InfoRow label="First Hearing" value={cd.firstHearingDate} />
        </Grid>
        <Grid item xs={12} md={6}>
          <InfoRow label="Last Hearing" value={cd.lastHearingDate} />
          <InfoRow label="Next Hearing" value={cd.nextHearingDate} />
          <InfoRow label="Decision Date" value={cd.decisionDate} />
          <InfoRow label="Case Duration (days)" value={cd.caseDurationDays} />
          <InfoRow label="Filing → First Hearing (days)" value={cd.filingToFirstHearingDays} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Parties */}
      <SectionTitle>Parties</SectionTitle>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1, fontWeight: 600 }}>
            Petitioners
          </Typography>
          {cd.petitioners.map((p, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: "#1565c0", fontSize: 12 }}>
                <PersonIcon sx={{ fontSize: 16 }} />
              </Avatar>
              <Typography variant="body2">{p}</Typography>
            </Box>
          ))}
          {cd.petitionerAdvocates.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Advocates: {cd.petitionerAdvocates.join(", ")}
              </Typography>
            </Box>
          )}
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1, fontWeight: 600 }}>
            Respondents
          </Typography>
          {cd.respondents.map((r, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: "#c62828", fontSize: 12 }}>
                <PersonIcon sx={{ fontSize: 16 }} />
              </Avatar>
              <Typography variant="body2">{r}</Typography>
            </Box>
          ))}
          {cd.respondentAdvocates.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Advocates: {cd.respondentAdvocates.join(", ")}
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Proceedings Stats */}
      <SectionTitle>Proceedings Stats</SectionTitle>
      <Grid container spacing={1}>
        {[
          { label: "Hearings", val: cd.hearingCount },
          { label: "Orders", val: cd.orderCount },
          { label: "Interim Orders", val: cd.interimOrderCount },
          { label: "Judgments", val: cd.judgmentCount },
          { label: "IAs", val: cd.iaCount },
          { label: "Has Orders", val: cd.hasOrders ? "Yes" : "No" },
          { label: "Has Judgments", val: cd.hasJudgments ? "Yes" : "No" },
        ].map(({ label, val }) => (
          <Grid item xs={6} sm={4} md={3} key={label}>
            <Card variant="outlined" sx={{ textAlign: "center", p: 1.5, borderRadius: "12px" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#1976d2" }}>
                {val}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {label}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Hearing History */}
      {cd.historyOfCaseHearings.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <SectionTitle>Hearing History ({cd.historyOfCaseHearings.length} records)</SectionTitle>
            <Button
              size="small"
              endIcon={hearingOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setHearingOpen((v) => !v)}
              sx={{ textTransform: "none" }}
            >
              {hearingOpen ? "Hide" : "Show"}
            </Button>
          </Box>
          <Collapse in={hearingOpen}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, color: "#1a237e" } }}>
                  <TableCell>Business Date</TableCell>
                  <TableCell>Hearing Date</TableCell>
                  <TableCell>Judge</TableCell>
                  <TableCell>Purpose</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cd.historyOfCaseHearings.map((h, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{h.businessOnDate}</TableCell>
                    <TableCell>{h.hearingDate ?? "—"}</TableCell>
                    <TableCell>{h.judge || "—"}</TableCell>
                    <TableCell>{h.purposeOfListing}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Collapse>
        </>
      )}

      {/* Interim Orders */}
      {cd.interimOrders.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <SectionTitle>Interim Orders ({cd.interimOrders.length} records)</SectionTitle>
            <Button
              size="small"
              endIcon={interimOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setInterimOpen((v) => !v)}
              sx={{ textTransform: "none" }}
            >
              {interimOpen ? "Hide" : "Show"}
            </Button>
          </Box>
          <Collapse in={interimOpen}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, color: "#1a237e" } }}>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Download</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cd.interimOrders.map((o, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{o.orderDate}</TableCell>
                    <TableCell>{o.description}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={
                          downloading[o.orderUrl] ? (
                            <CircularProgress size={14} />
                          ) : (
                            <DownloadIcon />
                          )
                        }
                        disabled={downloading[o.orderUrl]}
                        onClick={() => onDownload(o.orderUrl, o.orderUrl)}
                        sx={{ textTransform: "none" }}
                      >
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Collapse>
        </>
      )}

      {/* Interlocutory Applications */}
      {cd.interlocutoryApplications.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <SectionTitle>Interlocutory Applications</SectionTitle>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, color: "#1a237e" } }}>
                <TableCell>Reg. No.</TableCell>
                <TableCell>Filed By</TableCell>
                <TableCell>Filing Date</TableCell>
                <TableCell>Remark</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cd.interlocutoryApplications.map((ia, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ maxWidth: 200, fontSize: "0.78rem" }}>{ia.regNo}</TableCell>
                  <TableCell>{ia.filedBy}</TableCell>
                  <TableCell>{ia.filingDate}</TableCell>
                  <TableCell>{ia.remark}</TableCell>
                  <TableCell>
                    <Chip
                      label={ia.status}
                      size="small"
                      color={ia.status === "Pending" ? "warning" : "success"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {/* Judgment & Orders */}
      {cd.judgmentOrders.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <SectionTitle>Judgments & Orders ({cd.judgmentOrders.length} records)</SectionTitle>
            <Button
              size="small"
              endIcon={judgmentOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setJudgmentOpen((v) => !v)}
              sx={{ textTransform: "none" }}
            >
              {judgmentOpen ? "Hide" : "Show"}
            </Button>
          </Box>
          <Collapse in={judgmentOpen}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
              {cd.judgmentOrders.map((j, i) => (
                <Card key={i} variant="outlined" sx={{ borderRadius: "12px", minWidth: 220 }}>
                  <CardContent sx={{ pb: "12px !important" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {j.orderType}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
                      {j.orderDate}
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={
                        downloading[j.orderUrl] ? (
                          <CircularProgress size={14} sx={{ color: "white" }} />
                        ) : (
                          <DownloadIcon />
                        )
                      }
                      disabled={downloading[j.orderUrl]}
                      onClick={() => onDownload(j.orderUrl, j.orderUrl)}
                      sx={{ textTransform: "none" }}
                    >
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Collapse>
        </>
      )}

      {/* FIR Details */}
      {Object.keys(cd.firDetails).length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <SectionTitle>FIR Details</SectionTitle>
          {Object.entries(cd.firDetails).map(([k, v]) => (
            <InfoRow key={k} label={k} value={String(v)} />
          ))}
        </>
      )}

      {/* Subordinate Court */}
      {Object.keys(cd.subordinateCourt).length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <SectionTitle>Subordinate Court</SectionTitle>
          {Object.entries(cd.subordinateCourt).map(([k, v]) => (
            <InfoRow key={k} label={k} value={String(v)} />
          ))}
        </>
      )}

      {/* Tagged Matters */}
      {cd.taggedMatters.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <SectionTitle>Tagged Matters</SectionTitle>
          <Typography variant="body2">{JSON.stringify(cd.taggedMatters)}</Typography>
        </>
      )}

      {/* Earlier Court Details */}
      {cd.earlierCourtDetails.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <SectionTitle>Earlier Court Details</SectionTitle>
          <Typography variant="body2">{JSON.stringify(cd.earlierCourtDetails)}</Typography>
        </>
      )}

      {/* Notices */}
      {cd.notices.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <SectionTitle>Notices</SectionTitle>
          <Typography variant="body2">{JSON.stringify(cd.notices)}</Typography>
        </>
      )}

      {/* Caveat Details */}
      {cd.caveatDetails.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <SectionTitle>Caveat Details</SectionTitle>
          <Typography variant="body2">{JSON.stringify(cd.caveatDetails)}</Typography>
        </>
      )}

      {/* Listing Dates */}
      {cd.listingDates.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <SectionTitle>Listing Dates</SectionTitle>
          <Typography variant="body2">{JSON.stringify(cd.listingDates)}</Typography>
        </>
      )}

      {/* Link Cases */}
      {cd.linkCases.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <SectionTitle>Link Cases</SectionTitle>
          <Typography variant="body2">{JSON.stringify(cd.linkCases)}</Typography>
        </>
      )}

      {/* Processes */}
      {cd.processes.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <SectionTitle>Processes</SectionTitle>
          <Typography variant="body2">{JSON.stringify(cd.processes)}</Typography>
        </>
      )}

      {/* Filed Documents */}
      {cd.filedDocuments.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <SectionTitle>Filed Documents ({cd.filedDocuments.length})</SectionTitle>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, color: "#1a237e" } }}>
                <TableCell>Sr. No.</TableCell>
                <TableCell>Doc. No.</TableCell>
                <TableCell>Date Received</TableCell>
                <TableCell>Filed By</TableCell>
                <TableCell>Advocate</TableCell>
                <TableCell>Document</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(cd.filedDocuments as FiledDocument[]).map((doc, i) => (
                <TableRow key={i} hover>
                  <TableCell>{doc.srNo}</TableCell>
                  <TableCell>{doc.documentNo}</TableCell>
                  <TableCell>{doc.dateOfReceiving}</TableCell>
                  <TableCell>{doc.filedBy}</TableCell>
                  <TableCell>{doc.advocateName ?? "—"}</TableCell>
                  <TableCell>{doc.documentFiled}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {/* Empty array summary */}
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {[
          { label: "Tagged Matters", count: cd.taggedMatters.length },
          { label: "Earlier Court Details", count: cd.earlierCourtDetails.length },
          { label: "Notices", count: cd.notices.length },
          { label: "Caveat Details", count: cd.caveatDetails.length },
          { label: "Listing Dates", count: cd.listingDates.length },
          { label: "Link Cases", count: cd.linkCases.length },
          { label: "Processes", count: cd.processes.length },
        ]
          .filter((x) => x.count === 0)
          .map(({ label }) => (
            <Chip
              key={label}
              label={`${label}: None`}
              size="small"
              variant="outlined"
              sx={{ color: "text.secondary", borderColor: "divider" }}
            />
          ))}
      </Box>

      {/* System Record */}
      <Divider sx={{ my: 2 }} />
      <SectionTitle>System Record</SectionTitle>
      <InfoRow label="CNR" value={ei.cnr} />
      <InfoRow label="Last Hearing (system)" value={ei.lastDateOfHearing} />
      <InfoRow label="Next Hearing (system)" value={ei.nextDateOfHearing} />
      <InfoRow label="Date Created" value={ei.dateCreated} />
      <InfoRow label="Date Modified" value={ei.dateModified} />
    </Box>
  );
}

// ── AI Summary Tab ────────────────────────────────────────────────────────────

function AiSummaryTab({ file }: { file: EcourtFile }) {
  const ai = file.aiAnalysis!;
  const insights = ai.intelligent_insights_analytics.order_significance_and_impact_assessment;
  const fm = ai.foundational_metadata;
  const teaser = ai.search_and_user_friendly_teaser.teaser_content;

  return (
    <Box>
      {/* Teaser */}
      <Card sx={{ mb: 2, borderRadius: "12px", bgcolor: "#f3f8ff", border: "1px solid #bbdefb" }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ color: "#1565c0", fontWeight: 700, mb: 1 }}>
            Case Teaser
          </Typography>
          <Typography variant="body2">{teaser.short_summary_enticing}</Typography>
        </CardContent>
      </Card>

      {/* AI Executive Summary */}
      <SectionTitle>AI Executive Summary</SectionTitle>
      <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.7 }}>
        {insights.ai_generated_executive_summary}
      </Typography>

      {/* Plain Language Summary */}
      <SectionTitle>Plain Language Summary for Litigants</SectionTitle>
      <Card variant="outlined" sx={{ borderRadius: "12px", mb: 2 }}>
        <CardContent>
          <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
            {insights.plain_language_summary_for_litigants_outcome_focused}
          </Typography>
        </CardContent>
      </Card>

      {/* Case Identifiers */}
      <SectionTitle>AI-Identified Case Identifiers</SectionTitle>
      <Grid container spacing={1} sx={{ mb: 2 }}>
        {Object.entries(fm.core_case_identifiers).map(([k, v]) => {
          if (!v || (Array.isArray(v) && v.length === 0)) return null;
          return (
            <Grid item xs={12} sm={6} key={k}>
              <InfoRow
                label={k.replace(/_/g, " ")}
                value={Array.isArray(v) ? v.join(", ") : String(v)}
              />
            </Grid>
          );
        })}
      </Grid>

      {/* Legal Representation */}
      <SectionTitle>Legal Representation</SectionTitle>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: "text.secondary" }}>
            Petitioner Counsel
          </Typography>
          {fm.legal_representation.counsel_for_petitioner_side.map((c, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2">{c.name}</Typography>
              <Chip label={c.role} size="small" />
            </Box>
          ))}
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: "text.secondary" }}>
            Respondent Counsel
          </Typography>
          {fm.legal_representation.counsel_for_respondent_side.map((c, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2">{c.name}</Typography>
              <Chip label={c.role} size="small" />
            </Box>
          ))}
        </Grid>
      </Grid>

      {/* Procedural Details */}
      <SectionTitle>Procedural Details</SectionTitle>
      <InfoRow label="Order Nature" value={fm.procedural_details_from_order.order_nature} />
      <InfoRow label="Disposition Status" value={fm.procedural_details_from_order.disposition_status_indicated} />
      <InfoRow label="Disposition Outcome" value={fm.procedural_details_from_order.disposition_outcome_if_disposed} />
      {fm.procedural_details_from_order.costs_awarded_details.amount && (
        <InfoRow label="Costs" value={fm.procedural_details_from_order.costs_awarded_details.amount} />
      )}
      {fm.procedural_details_from_order.specific_directions_given_by_court.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Specific Directions:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mt: 0 }}>
            {fm.procedural_details_from_order.specific_directions_given_by_court.map((d, i) => (
              <Box component="li" key={i} sx={{ mb: 0.5 }}>
                <Typography variant="body2">{d}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Actionable Alerts */}
      {insights.actionable_alerts_for_parties.length > 0 && (
        <>
          <SectionTitle>Actionable Alerts</SectionTitle>
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, color: "#1a237e" } }}>
                <TableCell>Action Required</TableCell>
                <TableCell>Deadline</TableCell>
                <TableCell>Responsible Party</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {insights.actionable_alerts_for_parties.map((a, i) => (
                <TableRow key={i} hover>
                  <TableCell>{a.action_required}</TableCell>
                  <TableCell>{a.deadline}</TableCell>
                  <TableCell>{a.responsible_party}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {/* Keywords */}
      {teaser.auto_generated_long_tail_keywords.length > 0 && (
        <>
          <SectionTitle>Search Keywords</SectionTitle>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {teaser.auto_generated_long_tail_keywords.map((kw, i) => (
              <Chip key={i} label={kw} size="small" variant="outlined" />
            ))}
          </Box>
        </>
      )}

      {/* Litigant Context (deep_litigant_substance_context) */}
      {(() => {
        const dlc = ai.deep_litigant_substance_context;
        const narrative = dlc?.narrative_of_the_dispute_plain_language;
        const impact = dlc?.potential_impact_on_litigants_involved_inferred;
        if (!dlc) return null;
        return (
          <>
            <Divider sx={{ my: 2 }} />

            {narrative?.story_behind_the_case && (
              <>
                <SectionTitle>Story Behind the Case</SectionTitle>
                <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.7 }}>
                  {narrative.story_behind_the_case}
                </Typography>
              </>
            )}

            {(narrative?.what_each_side_wants_simplified?.petitioner_side_goal_simplified ||
              narrative?.what_each_side_wants_simplified?.respondent_side_goal_simplified) && (
              <>
                <SectionTitle>What Each Side Wants</SectionTitle>
                <InfoRow
                  label="Petitioner's Goal"
                  value={narrative.what_each_side_wants_simplified.petitioner_side_goal_simplified}
                />
                <InfoRow
                  label="Respondent's Goal"
                  value={narrative.what_each_side_wants_simplified.respondent_side_goal_simplified}
                />
              </>
            )}

            {narrative?.key_events_leading_to_court_simplified?.length > 0 && (
              <>
                <SectionTitle>Key Events Leading to Court</SectionTitle>
                <Box component="ul" sx={{ pl: 2, mt: 0, mb: 2 }}>
                  {narrative.key_events_leading_to_court_simplified.map((event, i) => (
                    <Box component="li" key={i} sx={{ mb: 0.5 }}>
                      <Typography variant="body2">{event}</Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}

            {(impact?.type_of_stress_or_burden_implied_for_parties?.length > 0 ||
              impact?.litigation_duration_impact_note) && (
              <>
                <SectionTitle>Impact on Litigants</SectionTitle>
                {impact.type_of_stress_or_burden_implied_for_parties?.length > 0 && (
                  <InfoRow
                    label="Stress / Burden"
                    value={impact.type_of_stress_or_burden_implied_for_parties.join(", ")}
                  />
                )}
                {impact.litigation_duration_impact_note && (
                  <InfoRow label="Duration Impact" value={impact.litigation_duration_impact_note} />
                )}
              </>
            )}
          </>
        );
      })()}
    </Box>
  );
}

// ── Legal Analysis Tab ────────────────────────────────────────────────────────

const TREATMENT_COLORS: Record<string, "success" | "error" | "warning" | "default"> = {
  Followed: "success",
  Distinguished: "warning",
  Overruled: "error",
  Referred: "default",
  Applied: "success",
};

function LegalAnalysisTab({ file }: { file: EcourtFile }) {
  const cla = file.aiAnalysis!.deep_legal_substance_context.core_legal_content_analysis;

  return (
    <Box>
      {/* Primary Issues */}
      {cla.primary_legal_issues_identified.length > 0 && (
        <>
          <SectionTitle>Primary Legal Issues</SectionTitle>
          <Box component="ul" sx={{ pl: 2, mt: 0, mb: 2 }}>
            {cla.primary_legal_issues_identified.map((issue, i) => (
              <Box component="li" key={i} sx={{ mb: 0.5 }}>
                <Typography variant="body2">{issue}</Typography>
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* Secondary Issues */}
      {cla.secondary_legal_issues_identified.length > 0 && (
        <>
          <SectionTitle>Secondary Legal Issues</SectionTitle>
          <Box component="ul" sx={{ pl: 2, mt: 0, mb: 2 }}>
            {cla.secondary_legal_issues_identified.map((issue, i) => (
              <Box component="li" key={i} sx={{ mb: 0.5 }}>
                <Typography variant="body2">{issue}</Typography>
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* Statutes */}
      {cla.statutes_cited_and_applied.length > 0 && (
        <>
          <SectionTitle>Statutes Cited & Applied</SectionTitle>
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, color: "#1a237e" } }}>
                <TableCell>Act</TableCell>
                <TableCell>Section / Article / Rule</TableCell>
                <TableCell>Interpretation / Application</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cla.statutes_cited_and_applied.map((s, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{s.act_name}</TableCell>
                  <TableCell>{s.section_article_rule}</TableCell>
                  <TableCell>{s.interpretation_focus_or_application}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {/* Case Laws */}
      {cla.case_law_cited_and_analysed.length > 0 && (
        <>
          <SectionTitle>Case Laws Cited</SectionTitle>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2 }}>
            {cla.case_law_cited_and_analysed.map((c, i) => (
              <Card key={i} variant="outlined" sx={{ borderRadius: "12px" }}>
                <CardContent sx={{ pb: "12px !important" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {c.case_name_as_in_text}
                    </Typography>
                    <Chip
                      label={c.treatment_by_court}
                      size="small"
                      color={TREATMENT_COLORS[c.treatment_by_court] ?? "default"}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
                    {c.court_as_in_text} · {c.year_as_in_text}
                  </Typography>
                  <Typography variant="body2">{c.key_principle_used_from_citation}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </>
      )}

      {/* Rules/Regulations */}
      {(cla.rules_regulations_ordinances_cited as unknown[]).length > 0 && (
        <>
          <SectionTitle>Rules / Regulations</SectionTitle>
          <Typography variant="body2">
            {JSON.stringify(cla.rules_regulations_ordinances_cited)}
          </Typography>
        </>
      )}

      {/* Foreign Jurisprudence */}
      {(cla.foreign_jurisprudence_cited_details as unknown[]).length > 0 && (
        <>
          <SectionTitle>Foreign Jurisprudence</SectionTitle>
          <Typography variant="body2">
            {JSON.stringify(cla.foreign_jurisprudence_cited_details)}
          </Typography>
        </>
      )}
    </Box>
  );
}

// ── Arguments Tab ─────────────────────────────────────────────────────────────

function ArgumentsTab({ file }: { file: EcourtFile }) {
  const ara = file.aiAnalysis!.deep_legal_substance_context.arguments_and_reasoning_analysis;
  const fmx = file.aiAnalysis!.deep_legal_substance_context.factual_matrix_from_order;

  return (
    <Box>
      <SectionTitle>Petitioner Arguments</SectionTitle>
      <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.7 }}>
        {ara.summary_of_arguments_petitioner_side}
      </Typography>

      <SectionTitle>Respondent Arguments</SectionTitle>
      <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.7 }}>
        {ara.summary_of_arguments_respondent_side}
      </Typography>

      <SectionTitle>Court Reasoning</SectionTitle>
      <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.7 }}>
        {ara.court_reasoning_for_decision}
      </Typography>

      <SectionTitle>Ratio Decidendi</SectionTitle>
      <Card variant="outlined" sx={{ borderRadius: "12px", mb: 2 }}>
        <CardContent>
          <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.7 }}>
            {ara.ratio_decidendi_extracted.statement}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Confidence:
          </Typography>
          <ConfidenceBar score={ara.ratio_decidendi_extracted.confidence_score} />
        </CardContent>
      </Card>

      <SectionTitle>Obiter Dicta</SectionTitle>
      <Card variant="outlined" sx={{ borderRadius: "12px", mb: 2 }}>
        <CardContent>
          <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.7 }}>
            {ara.obiter_dicta_significant_remarks.statement}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Confidence:
          </Typography>
          <ConfidenceBar score={ara.obiter_dicta_significant_remarks.confidence_score} />
        </CardContent>
      </Card>

      {ara.statutory_interpretation_method_applied.length > 0 && (
        <>
          <SectionTitle>Statutory Interpretation Methods</SectionTitle>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2 }}>
            {ara.statutory_interpretation_method_applied.map((m, i) => (
              <Chip key={i} label={m} size="small" color="primary" variant="outlined" />
            ))}
          </Box>
        </>
      )}

      {ara.judicial_philosophy_indicators_observed.length > 0 && (
        <>
          <SectionTitle>Judicial Philosophy</SectionTitle>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2 }}>
            {ara.judicial_philosophy_indicators_observed.map((p, i) => (
              <Chip key={i} label={p} size="small" variant="outlined" />
            ))}
          </Box>
        </>
      )}

      <Divider sx={{ my: 2 }} />

      <SectionTitle>Brief Facts</SectionTitle>
      <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.7 }}>
        {fmx.brief_facts_summary_ai_generated}
      </Typography>

      {fmx.chronological_events_timeline_from_facts.length > 0 && (
        <>
          <SectionTitle>Chronological Timeline</SectionTitle>
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, color: "#1a237e" } }}>
                <TableCell>Date / Period</TableCell>
                <TableCell>Event</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fmx.chronological_events_timeline_from_facts.map((e, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{e.date_or_period}</TableCell>
                  <TableCell>{e.event_description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {fmx.key_factual_findings_by_this_court.length > 0 && (
        <>
          <SectionTitle>Key Factual Findings</SectionTitle>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {fmx.key_factual_findings_by_this_court.map((f, i) => (
              <Card key={i} variant="outlined" sx={{ borderRadius: "12px" }}>
                <CardContent sx={{ pb: "12px !important" }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    {f.finding}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
                    Source: {f.source_of_finding}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Confidence:
                  </Typography>
                  <ConfidenceBar score={f.confidence_score} />
                </CardContent>
              </Card>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}

// ── Insights Tab ──────────────────────────────────────────────────────────────

function InsightsTab({ file }: { file: EcourtFile }) {
  const insights = file.aiAnalysis!.intelligent_insights_analytics.order_significance_and_impact_assessment;
  const legalImpact = file.aiAnalysis!.deep_legal_substance_context.order_significance_and_impact_assessment;
  const research = file.aiAnalysis!.actionable_outputs_user_tools.research_and_visualization_support_data;
  const qr = file.aiAnalysis!.quality_review_metadata;

  return (
    <Box>
      {/* Impact & Precedential Scores */}
      <SectionTitle>Impact & Precedential Value</SectionTitle>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: "12px", p: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Impact on Law Area
            </Typography>
            <ConfidenceBar score={legalImpact.potential_impact_score_on_law_area} />
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: "12px", p: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Precedential Value —{" "}
              <Chip label={legalImpact.precedential_value_assessment.assessment} size="small" />
            </Typography>
            <ConfidenceBar score={legalImpact.precedential_value_assessment.precedence_value_score} />
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
              {legalImpact.precedential_value_assessment.justification}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Compliance / Risks */}
      {insights.compliance_directives_or_risks_for_parties.length > 0 && (
        <>
          <SectionTitle>Compliance Directives & Risks</SectionTitle>
          <Box component="ul" sx={{ pl: 2, mt: 0, mb: 2 }}>
            {insights.compliance_directives_or_risks_for_parties.map((d, i) => (
              <Box component="li" key={i} sx={{ mb: 0.5 }}>
                <Typography variant="body2">{d}</Typography>
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* Implications */}
      {insights.implications_for_litigants_in_similar_situations.length > 0 && (
        <>
          <SectionTitle>Implications for Similar Litigants</SectionTitle>
          <Box component="ul" sx={{ pl: 2, mt: 0, mb: 2 }}>
            {insights.implications_for_litigants_in_similar_situations.map((d, i) => (
              <Box component="li" key={i} sx={{ mb: 0.5 }}>
                <Typography variant="body2">{d}</Typography>
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* Practice Points */}
      {legalImpact.practice_points_for_legal_professionals.length > 0 && (
        <>
          <SectionTitle>Practice Points for Legal Professionals</SectionTitle>
          <Box component="ul" sx={{ pl: 2, mt: 0, mb: 2 }}>
            {legalImpact.practice_points_for_legal_professionals.map((d, i) => (
              <Box component="li" key={i} sx={{ mb: 0.5 }}>
                <Typography variant="body2">{d}</Typography>
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* Policy Implications */}
      {insights.potential_policy_implications_identified && (
        <>
          <SectionTitle>Policy Implications</SectionTitle>
          <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.7 }}>
            {insights.potential_policy_implications_identified}
          </Typography>
        </>
      )}

      {/* ADR */}
      <SectionTitle>ADR Suitability</SectionTitle>
      <Chip
        label={insights.adr_suitability_inferred}
        color={insights.adr_suitability_inferred === "High" ? "success" : insights.adr_suitability_inferred === "Medium" ? "warning" : "default"}
        sx={{ mb: 2 }}
      />

      {/* Economic Implications */}
      {insights.economic_implications_assessment && (
        <>
          <SectionTitle>Economic Implications</SectionTitle>
          <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.7 }}>
            {insights.economic_implications_assessment}
          </Typography>
        </>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Cited Cases Network */}
      {research.cited_cases_network_data_outgoing.length > 0 && (
        <>
          <SectionTitle>Cited Cases Network</SectionTitle>
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, color: "#1a237e" } }}>
                <TableCell>Citation</TableCell>
                <TableCell>Reliance Strength</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {research.cited_cases_network_data_outgoing.map((c, i) => (
                <TableRow key={i} hover>
                  <TableCell>{c.target_citation_as_in_text}</TableCell>
                  <TableCell>
                    <Chip label={c.strength_of_reliance_inferred} size="small"
                      color={c.strength_of_reliance_inferred === "High" ? "success" : c.strength_of_reliance_inferred === "Medium" ? "warning" : "default"} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {/* Topic Clusters */}
      {research.topic_modeling_cluster_suggestions.length > 0 && (
        <>
          <SectionTitle>Topic Clusters</SectionTitle>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2 }}>
            {research.topic_modeling_cluster_suggestions.map((t, i) => (
              <Chip key={i} label={t} size="small" variant="outlined" color="primary" />
            ))}
          </Box>
        </>
      )}

      {/* Similarity Search Keys */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <SectionTitle>Key Issues (Similarity Search)</SectionTitle>
          <Box component="ul" sx={{ pl: 2, mt: 0 }}>
            {research.potential_similar_cases_indicators.key_issues_for_similarity_search.map((k, i) => (
              <Box component="li" key={i}><Typography variant="body2">{k}</Typography></Box>
            ))}
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <SectionTitle>Key Statutes (Similarity Search)</SectionTitle>
          <Box component="ul" sx={{ pl: 2, mt: 0 }}>
            {research.potential_similar_cases_indicators.key_statutes_for_similarity_search.map((k, i) => (
              <Box component="li" key={i}><Typography variant="body2">{k}</Typography></Box>
            ))}
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Quality Review */}
      <SectionTitle>Quality Review Metadata</SectionTitle>
      <InfoRow label="OCR Accuracy" value={`${Math.round(qr.ocr_accuracy_estimate_if_applicable * 100)}%`} />
      <InfoRow label="Extraction Confidence" value={qr.overall_extraction_confidence} />
      {qr.ambiguity_or_missing_data_flags.length > 0 && (
        <InfoRow label="Ambiguity Flags" value={JSON.stringify(qr.ambiguity_or_missing_data_flags)} />
      )}
    </Box>
  );
}

// ── Judgment Tab ──────────────────────────────────────────────────────────────

function JudgmentTab({
  files,
  downloading,
  onDownload,
}: {
  files: EcourtFile[];
  downloading: Record<string, boolean>;
  onDownload: (orderUrl: string, filename: string) => void;
}) {
  return (
    <Box>
      {files.map((file, idx) => (
        <Box key={idx} sx={{ mb: 4 }}>
          <Card variant="outlined" sx={{ borderRadius: "12px", mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                  {file.pdfFile}
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={
                    downloading[file.pdfFile] ? (
                      <CircularProgress size={14} sx={{ color: "white" }} />
                    ) : (
                      <DownloadIcon />
                    )
                  }
                  disabled={downloading[file.pdfFile]}
                  onClick={() => onDownload(file.pdfFile, file.pdfFile)}
                  sx={{ textTransform: "none" }}
                >
                  Download PDF
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={
                    downloading[file.markdownFile] ? (
                      <CircularProgress size={14} />
                    ) : (
                      <DownloadIcon />
                    )
                  }
                  disabled={downloading[file.markdownFile]}
                  onClick={() => onDownload(file.markdownFile, file.markdownFile)}
                  sx={{ textTransform: "none" }}
                >
                  Download .md
                </Button>
              </Box>
            </CardContent>
          </Card>
          {file.markdownContent && (
            <Card variant="outlined" sx={{ borderRadius: "12px", p: 2 }}>
              <Box
                sx={{
                  "& h1, & h2, & h3, & h4": { color: "#1a237e", mt: 2, mb: 1 },
                  "& p": { lineHeight: 1.7, mb: 1 },
                  "& table": { borderCollapse: "collapse", width: "100%", mb: 2 },
                  "& td, & th": { border: "1px solid #e0e0e0", padding: "6px 10px", fontSize: "0.85rem" },
                  "& ul, & ol": { pl: 2 },
                  "& img": { maxWidth: "100%", height: "auto" },
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{file.markdownContent}</ReactMarkdown>
              </Box>
            </Card>
          )}
        </Box>
      ))}
    </Box>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function EcourtDetailsView({
  data,
  backLabel,
  downloadFn,
  onBack,
  lastUpdated,
  onUpdate,
  updating = false,
  onSave,
  saving = false,
  isSaved = false,
}: EcourtDetailsViewProps) {
  const [tab, setTab] = useState(0);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  const cd = data.courtCaseData;

  const hasFiles = data.files.length > 0;
  const hasAiAnalysis = hasFiles && data.files[0].aiAnalysis !== null;
  const hasJudgmentData = hasFiles || cd.judgmentOrders.length > 0;

  const visibleTabs = [
    { key: "case-info",      label: "Case Info",      icon: <BalanceIcon /> },
    ...(hasAiAnalysis ? [
      { key: "ai-summary",     label: "AI Summary",     icon: <AutoAwesomeIcon /> },
      { key: "legal-analysis", label: "Legal Analysis", icon: <GavelIcon /> },
      { key: "arguments",      label: "Arguments",      icon: <ForumIcon /> },
      { key: "insights",       label: "Insights",       icon: <TrendingUpIcon /> },
    ] : []),
    ...(hasJudgmentData ? [
      { key: "judgment", label: "Judgment", icon: <ArticleIcon /> },
    ] : []),
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

  return (
    <Container maxWidth="xl" sx={{ pb: 4, pt: { xs: 2, sm: 3 } }}>
      {/* Back button row — only rendered when used as a standalone page */}
      {onBack && (
        <Box sx={{ mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ textTransform: "none", color: "text.secondary" }}
          >
            {backLabel}
          </Button>
        </Box>
      )}

      {/* Header card */}
      <Card
        sx={{
          mb: 3,
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          p: 2,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                background: "linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #1565c0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {cd.cnr}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {cd.courtName} · {cd.caseTypeRaw}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {lastUpdated && (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {formatLastUpdated(lastUpdated)}
              </Typography>
            )}
            {onUpdate && (
              <Button
                variant="contained"
                startIcon={updating ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                onClick={onUpdate}
                disabled={updating}
                sx={{ borderRadius: "20px", textTransform: "none", whiteSpace: "nowrap", flexShrink: 0 }}
              >
                Update
              </Button>
            )}
            {onSave && !isSaved && (
              <Button
                variant="outlined"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={onSave}
                disabled={saving}
                sx={{ borderRadius: "20px", textTransform: "none", whiteSpace: "nowrap", flexShrink: 0 }}
              >
                Save
              </Button>
            )}
            
          </Box>
        </Box>
      </Card>

      {/* Tabs */}
      <Paper elevation={3} sx={{ borderRadius: "16px", overflow: "hidden" }}>
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
            px: { xs: 1, md: 2 },
            pt: 1,
            borderRadius: "16px 16px 0 0",
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={tabStyles.tabs}
            TabIndicatorProps={{ style: { display: "none" } }}
          >
            {visibleTabs.map((t) => (
              <Tab key={t.key} label={t.label} icon={t.icon} iconPosition="start" sx={tabStyles.tab} />
            ))}
          </Tabs>
        </Paper>

        <Box sx={{ minHeight: "60vh" }}>
          {visibleTabs.map((t, i) => (
            <TabPanel key={t.key} value={tab} index={i}>
              {t.key === "case-info" && (
                <CaseInfoTab data={data} downloading={downloading} onDownload={handleDownload} />
              )}
              {t.key === "ai-summary" && hasAiAnalysis && (
                <AiSummaryTab file={data.files[0]} />
              )}
              {t.key === "legal-analysis" && hasAiAnalysis && (
                <LegalAnalysisTab file={data.files[0]} />
              )}
              {t.key === "arguments" && hasAiAnalysis && (
                <ArgumentsTab file={data.files[0]} />
              )}
              {t.key === "insights" && hasAiAnalysis && (
                <InsightsTab file={data.files[0]} />
              )}
              {t.key === "judgment" && (
                hasFiles ? (
                  <JudgmentTab
                    files={data.files}
                    downloading={downloading}
                    onDownload={handleDownload}
                  />
                ) : (
                  <Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      AI-processed judgment files are not yet available. Showing raw judgment orders from eCourts.
                    </Alert>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                      {cd.judgmentOrders.map((j, idx) => (
                        <Card key={idx} variant="outlined" sx={{ borderRadius: "12px", minWidth: 220 }}>
                          <CardContent sx={{ pb: "12px !important" }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {j.orderType}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
                              {j.orderDate}
                            </Typography>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={
                                downloading[j.orderUrl] ? (
                                  <CircularProgress size={14} sx={{ color: "white" }} />
                                ) : (
                                  <DownloadIcon />
                                )
                              }
                              disabled={downloading[j.orderUrl]}
                              onClick={() => handleDownload(j.orderUrl, j.orderUrl)}
                              sx={{ textTransform: "none" }}
                            >
                              Download PDF
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Box>
                )
              )}
            </TabPanel>
          ))}
        </Box>
      </Paper>
    </Container>
  );
}
