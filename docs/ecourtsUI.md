# eCourt Details Page — Implementation Plan

## Context

A new backend endpoint `GET /{organizationId}/sites/{siteId}/cases/{caseId}/courtdata` fetches live eCourt data from the eCourts India API and returns a rich JSON response containing case data, AI analysis of judgment PDFs, and file metadata. The UI must display all fields from the response on a dedicated eCourt details page. An "Ecourt Details" button needs to be added to the existing case details page. The design must also accommodate a future standalone CNR search flow where no siteId/caseId is available — solved by building a shared display component used by two separate routes.

---

## Architecture

### Shared Component Strategy
Build a single `EcourtDetailsView` component that accepts:
- `data: CourtDataResponse` (the full API response)
- `backUrl: string` (where the Back button navigates)
- `backLabel: string` ("Back to Case" or "Back")
- `downloadUrlBuilder: (orderUrl: string) => string` (injected by each route to build PDF download URLs)

This makes the component route-agnostic and reusable for both case-linked and standalone CNR search flows.

### Routes
| Route | API call | Back button |
|---|---|---|
| `/organization/[id]/sites/[siteId]/cases/[caseId]/ecourt` | `/{orgId}/sites/{siteId}/cases/{caseId}/courtdata` | "Back to Case" |
| `/organization/[id]/ecourt?cnr=XXXXX` | TBD separate endpoint (no siteId/caseId) | "Back" |

---

## Files to Create

### 1. TypeScript Types
**`src/app/organization/types/ecourtTypes.ts`**
Define the full response shape from the API. Key interfaces:
- `CourtDataApiResponse` — root `{ data, errors, meta }`
- `CourtDataPayload` — `{ courtCaseData, entityInfo, files, descriptions, caseAiAnalysis }`
- `CourtCaseData` — all 50+ fields of the case record
- `EntityInfo` — system dates and CNR
- `EcourtFile` — `{ pdfFile, markdownFile, markdownContent, aiAnalysis }`
- `AiAnalysis` — the full nested AI analysis tree (foundational_metadata, deep_legal_substance_context, intelligent_insights_analytics, etc.)
- `InterimOrder`, `JudgmentOrder`, `InterlocutoryApplication`, `HearingHistory`
- `EnumDescriptions` — `{ enumLookup: { caseType, caseStatus, courtCode, judicialSection, ... } }`

### 2. API Service Function
**`src/app/organization/services/ecourtapi.ts`** (new file, keeps ecourt logic separate)

```typescript
export const fetchCaseCourtData = async (
  organizationId: string, siteId: string, caseId: string
): Promise<CourtDataApiResponse>

export const downloadCourtDocument = async (
  organizationId: string, siteId: string, caseId: string, orderUrl: string
): Promise<Blob>  // GET .../courtdata/files/{orderUrl}
```

### 3. Case-linked eCourt Page
**`src/app/organization/[id]/sites/[siteId]/cases/[caseId]/ecourt/page.tsx`**
- `"use client"` — resolves params (Next.js 15 pattern with `React.use(params)`)
- Calls `fetchCaseCourtData(orgId, siteId, caseId)` with loading/error states
- Renders `<EcourtDetailsView>` with:
  - `backUrl` = `/organization/${orgId}/sites/${siteId}/cases/${caseId}`
  - `backLabel` = "Back to Case"
  - `downloadUrlBuilder` = `(f) => buildDownloadUrl(orgId, siteId, caseId, f)`

### 4. Standalone CNR Search eCourt Page
**`src/app/organization/[id]/ecourt/page.tsx`**
- Reads `cnr` from `searchParams`
- Calls a standalone API endpoint (TBD — scaffolded with `fetchCourtDataByCnr(orgId, cnr)`)
- Renders `<EcourtDetailsView>` with `backLabel` = "Back"
- Note: Download URL builder will need a different pattern since no siteId/caseId

### 5. Shared EcourtDetailsView Component
**`src/app/organization/components/EcourtDetailsView/EcourtDetailsView.tsx`**

Uses MUI throughout (Card, Tabs, Tab, Typography, Box, Chip, Table, Button, Collapse, CircularProgress, Alert) consistent with the rest of the project. Reuses `tabStyles` from `@/app/organization/[id]/tabs-styles`.

**Tab structure (6 tabs using MUI `<Tabs>` + `<Tab>`):**
- `BalanceIcon` — Case Info (always rendered)
- `AutoAwesomeIcon` — AI Summary
- `GavelIcon` — Legal Analysis
- `ForumIcon` — Arguments
- `TrendingUpIcon` — Insights
- `ArticleIcon` — Judgment

When `files.length === 0`: tabs 2–6 show an MUI `<Alert severity="info">No AI analysis available for this case yet.</Alert>` empty state.

---

## Case Info Tab — Complete Data Coverage (nothing missed)

### Sections rendered (all data from API):

| Section | Source fields |
|---|---|
| Case Snapshot | cnr, caseNumber, courtName, caseType (raw + enum desc), caseStatus (+ enum desc), state, district, judicialSection (raw), purpose, disposalType (raw), contestedStatus, courtCode (+ enum desc), courtNo |
| Key Dates | filingNumber, filingDate, registrationNumber, registrationDate, firstHearingDate, lastHearingDate, nextHearingDate, decisionDate, caseDurationDays, filingToFirstHearingDays |
| Parties | petitioners (avatar + name), petitionerAdvocates, respondents (avatar + name), respondentAdvocates |
| Proceedings Stats | hearingCount, orderCount, interimOrderCount, judgmentCount, iaCount, hasOrders, hasJudgments |
| Hearing History | historyOfCaseHearings — collapsible table, collapsed by default. Columns: Business Date, Hearing Date, Judge, Purpose |
| Interim Orders | interimOrders — table with orderDate, description, + Download PDF button per row |
| Interlocutory Applications | interlocutoryApplications — table: regNo, filedBy, filingDate, remark, status badge |
| Judgments & Orders | judgmentOrders — list cards with orderDate, orderType, + Download PDF button |
| FIR Details | firDetails — shown only if not empty `{}` |
| Tagged Matters | taggedMatters — shown if not empty |
| Earlier Court Details | earlierCourtDetails — shown if not empty |
| Notices | notices — shown if not empty |
| Caveat Details | caveatDetails — shown if not empty |
| Listing Dates | listingDates — shown if not empty |
| Subordinate Court | subordinateCourt — shown if not empty |
| Link Cases | linkCases — shown if not empty |
| Processes | processes — shown if not empty |
| Filed Documents | filedDocuments — shown if not empty |
| System Record | entityInfo: cnr, lastDateOfHearing, nextDateOfHearing, dateCreated, dateModified |

Sections with empty arrays are shown as a compact count row at the bottom ("Tagged Matters: None").

### PDF Downloads
- Each `interimOrder.orderUrl` and `judgmentOrder.orderUrl` renders an MUI `<Button startIcon={<DownloadIcon />}>` labeled "Download PDF"
- On click: calls `downloadCourtDocument(...)`, creates a blob URL, triggers browser download
- Button shows `<CircularProgress size={16}>` while downloading
- For standalone CNR search: the download URL builder is injected — initially shows a disabled button until the standalone download endpoint is defined

---

## Modifications to Existing Files

### 6. Add "Ecourt Details" Button to Case Details Page
**`src/app/organization/[id]/sites/[siteId]/cases/[caseId]/page.tsx`**

Add a blue MUI Button with `BalanceIcon` icon at the top-right of the breadcrumb row (same row, `justifyContent: "space-between"`):

```tsx
<Button
  variant="contained"
  startIcon={<BalanceIcon />}
  onClick={() => router.push(`/organization/${organizationId}/sites/${siteId}/cases/${caseId}/ecourt`)}
  sx={{ borderRadius: '20px', textTransform: 'none', ... }}
>
  Ecourt Details
</Button>
```

The breadcrumbs Box gets `display: 'flex'`, `justifyContent: 'space-between'`, `alignItems: 'center'` to accommodate the button on the right side.

---

## Tab: AI Summary
Source: `files[0].aiAnalysis`
- Case Teaser (`search_and_user_friendly_teaser.teaser_content.short_summary_enticing`)
- AI Executive Summary (`intelligent_insights_analytics.order_significance_and_impact_assessment.ai_generated_executive_summary`)
- Plain Language Summary for Litigants (`...plain_language_summary_for_litigants_outcome_focused`)
- AI-Identified Case Identifiers (`foundational_metadata.core_case_identifiers`)
- Legal Representation (`foundational_metadata.legal_representation`)
- Procedural Details + Specific Directions (`foundational_metadata.procedural_details_from_order`)
- Actionable Alerts (`intelligent_insights_analytics.actionable_alerts_for_parties`)
- Auto-Generated Search Keywords (`teaser_content.auto_generated_long_tail_keywords`)

## Tab: Legal Analysis
Source: `files[0].aiAnalysis.deep_legal_substance_context.core_legal_content_analysis`
- Primary & Secondary Legal Issues
- Statutes Cited & Applied (act_name, section_article_rule, interpretation)
- Case Laws Cited (citation, court, year, treatment badge, key principle)
- Rules/Regulations cited
- Foreign jurisprudence (if any)

## Tab: Arguments
Source: `files[0].aiAnalysis.deep_legal_substance_context.arguments_and_reasoning_analysis`
- Petitioner arguments summary
- Respondent arguments summary
- Court reasoning
- Ratio Decidendi (with confidence score bar)
- Obiter Dicta
- Statutory interpretation methods
- Judicial philosophy indicators
- Factual matrix (brief facts, chronological timeline, key findings)

## Tab: Insights
Source: `files[0].aiAnalysis.intelligent_insights_analytics` + `actionable_outputs_user_tools`
- Impact assessment + precedential value (score bar)
- Compliance directives / risks
- Implications for litigants in similar situations
- Practice points for legal professionals
- Policy implications
- ADR suitability
- Research data: cited cases network, topic clusters, key issues/statutes for similarity search
- Quality review metadata (OCR accuracy, extraction confidence, ambiguity flags)

## Tab: Judgment
Iterates over ALL `files[]` (there may be multiple):
- For each file: pdfFile name + "Download PDF" button (enabled, triggers blob download)
- markdownFile name + "Download .md" button
- Full rendered judgment text using `JudgmentText` markdown parser (adapted from prototype)

---

## Critical Files to Modify

1. [page.tsx](src/app/organization/[id]/sites/[siteId]/cases/[caseId]/page.tsx) — add Ecourt Details button

## Critical Files to Create

2. `src/app/organization/types/ecourtTypes.ts`
3. `src/app/organization/services/ecourtapi.ts`
4. `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/ecourt/page.tsx`
5. `src/app/organization/[id]/ecourt/page.tsx` (standalone CNR shell — scaffolded)
6. `src/app/organization/components/EcourtDetailsView/EcourtDetailsView.tsx`

---

## Verification

1. Click "Ecourt Details" button on case details page → navigates to case-linked ecourt route
2. Case Info tab shows all data from `courtCaseData` + `entityInfo` + all array sections
3. Hearing history table is collapsed by default; clicking "Show" expands all rows
4. Interim orders table shows rows with "Download PDF" button each
5. Judgment & Orders shows entries with enabled "Download PDF"
6. PDF download triggers: button shows spinner → file downloads from backend
7. For a case with no files: AI Summary / Legal Analysis / Arguments / Insights / Judgment tabs show "No AI analysis available" info alert
8. Navigate to `/organization/[id]/ecourt?cnr=DLHC010001232024` → standalone page loads
9. "Back to Case" from case-linked ecourt → returns to case details page

---

## Extra Task: Update Button with Last Updated Timestamp

### Feature
Add an **Update** button in the top-right of the eCourt details page header row (same row as "Back to Case"), mirroring the "Ecourt Details" button placement in case details.

### API
- **PUT** `/api/v1/organizations/{organizationId}/sites/{siteId}/cases/{caseId}/courtdata`
- Response shape is identical to GET: `CourtDataApiResponse` with `data` and `meta.lastUpdated`

### Last Updated Display Logic
- Shown as a text label next to the Update button
- **Same day**: relative format
  - < 1 min → "Last updated just now"
  - < 60 min → "Last updated X mins ago"
  - ≥ 60 min → "Last updated X hour(s) [Y min(s)] ago"
- **Different day**: "Last updated on DD Mon YYYY"
- Timestamp is sourced from `meta.lastUpdated` in both initial GET load and PUT response

### Files Modified
- `src/app/organization/services/ecourtapi.ts` — `updateCaseCourtData` PUT function
- `src/app/organization/[id]/sites/[siteId]/cases/[caseId]/ecourt/page.tsx` — state + handler
- `src/app/organization/components/EcourtDetailsView/EcourtDetailsView.tsx` — UI
