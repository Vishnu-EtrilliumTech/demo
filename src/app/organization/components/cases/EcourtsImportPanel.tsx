"use client";

import { Fingerprint, FolderOpen, Users, Gavel, FileText, ShieldAlert, Check, RotateCcw } from "lucide-react";
import {
  Button,
  Tabs,
  Field,
  Input,
  Select,
  Pill,
  ErrorState,
  EmptyState,
  LoadingState,
  type TabItem,
} from "@/design-system";
import type { useEcourtsCaseSearch, SearchTabKey, CaseStatusFilter, EcourtPick } from "./useEcourtsCaseSearch";

type SearchApi = ReturnType<typeof useEcourtsCaseSearch>;

interface Props {
  search: SearchApi;
  /** Which step of the eCourts flow this panel is rendering. */
  view: "search" | "results";
  /** CNR of the currently-selected result (results view only). */
  selectedCnr?: string | null;
  /** A record was clicked — marks it selected; the dialog's Next button advances. */
  onSelect: (pick: EcourtPick) => void;
}

const SEARCH_TABS: TabItem[] = [
  { key: "cnr", label: "CNR Number", icon: Fingerprint },
  { key: "caseNumber", label: "Case Number", icon: FolderOpen },
  { key: "partyName", label: "Party Name", icon: Users },
  { key: "advocate", label: "Advocate", icon: Gavel },
  { key: "filingNumber", label: "Filing Number", icon: FileText },
  { key: "fir", label: "FIR Number", icon: ShieldAlert },
];

const STATUS_OPTIONS: { value: CaseStatusFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "disposed", label: "Disposed" },
  { value: "both", label: "Both" },
];

const tabLabelFor = (key: string) => SEARCH_TABS.find((t) => t.key === key)?.label ?? key;

/**
 * The eCourts search UI for the Add-case dialog. Renders the jurisdiction
 * cascade + search-type tabs + inputs (the "search" view / step 1) or the
 * normalised result list (the "results" view / step 2). All state lives in the
 * shared {@link useEcourtsCaseSearch} hook owned by the dialog, so navigating
 * back and forth between the two views preserves the search.
 */
export default function EcourtsImportPanel({ search: s, view, selectedCnr, onSelect }: Props) {
  if (view === "results") {
    return (
      <div style={{ marginTop: 4 }}>
        {s.isSearching ? (
          <LoadingState message="Searching eCourts…" size="sm" />
        ) : !s.results || s.results.length === 0 ? (
          <EmptyState title="No court records found" description="Go back and try a different search." />
        ) : (
          <>
            <div className="ec-results-head">
              <span>
                {s.totalCount.toLocaleString()} record{s.totalCount !== 1 ? "s" : ""} found — select one, then click Next
              </span>
            </div>
            <div className="ec-picklist">
              {s.results.map((r) => {
                const selected = r.cnr === selectedCnr;
                return (
                  <button
                    key={r.cnr}
                    type="button"
                    className={selected ? "sel" : undefined}
                    aria-pressed={selected}
                    onClick={() => onSelect(r)}
                  >
                    <b>{r.title}</b>
                    <span>
                      CNR {r.cnr}
                      {r.caseType ? ` · ${r.caseType}` : ""}
                      {r.filingDate ? ` · Filed ${new Date(r.filingDate).toLocaleDateString()}` : ""}
                    </span>
                    {selected && (
                      <Check width={16} height={16} aria-hidden style={{ marginLeft: "auto", alignSelf: "center", color: "var(--brand)" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  const yearError =
    s.year !== "" && !s.yearValid ? `Enter a valid 4-digit year (1950–${s.currentYear})` : undefined;

  const StatusSeg = (
    <Field label="Case status" className="ec-status">
      <div className="seg">
        {STATUS_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`seg-btn${s.caseStatus === o.value ? " on" : ""}`}
            onClick={() => s.setCaseStatus(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </Field>
  );

  const searchTabs: TabItem[] = SEARCH_TABS.map((t) => ({
    ...t,
    disabled: t.key !== "cnr" && !s.jurisdictionReady,
  }));

  const anyJurisdiction = !!(s.selectedState || s.selectedDistrict || s.selectedComplex || s.selectedCourt);

  return (
    <div className="ec-search-step">
      {/* Jurisdiction */}
      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "var(--text-3)",
            }}
          >
            Jurisdiction
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!s.jurisdictionReady && <Pill tone="warn">Select State &amp; District to unlock search</Pill>}
            {anyJurisdiction && (
              <Button variant="secondary" icon={RotateCcw} onClick={s.reset}>
                Reset
              </Button>
            )}
          </div>
        </div>
        <div className="ec-jurisdiction-row">
          <Field label="State">
            <Select value={s.selectedState} onChange={(e) => s.handleState(e.target.value)}>
              <option value="">Select state</option>
              {[...s.states]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="District">
            <Select value={s.selectedDistrict} disabled={!s.selectedState} onChange={(e) => s.handleDistrict(e.target.value)}>
              <option value="">Select district</option>
              {s.districts.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Court Complex">
            <Select value={s.selectedComplex} disabled={!s.selectedDistrict} onChange={(e) => s.handleComplex(e.target.value)}>
              <option value="">Select complex</option>
              {s.complexes.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Court">
            <Select value={s.selectedCourt} disabled={!s.selectedComplex} onChange={(e) => s.setSelectedCourt(e.target.value)}>
              <option value="">Select court</option>
              {s.courts.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <Tabs items={searchTabs} activeKey={s.searchTab} onChange={(k) => s.changeTab(k as SearchTabKey)} />

      <div className="ec-searchform" key={s.searchTab}>
        <div className="subhead">Search by {tabLabelFor(s.searchTab)}</div>

        {s.searchTab === "cnr" && (
          <div className="ec-searchrow">
            <Field label="CNR Number" required>
              <Input
                value={s.cnrNumber}
                onChange={(e) => s.setCnrNumber(e.target.value.toUpperCase())}
                placeholder="e.g. KLAP010012342023"
                style={{ minWidth: 280, letterSpacing: "0.04em" }}
              />
            </Field>
          </div>
        )}

        {s.searchTab === "caseNumber" && (
          <div className="ec-searchrow">
            <Field label="Case Number" required>
              <Input
                value={s.caseNumber}
                onChange={(e) => s.setCaseNumber(e.target.value)}
                placeholder="Enter case number"
                style={{ minWidth: 280 }}
              />
            </Field>
          </div>
        )}

        {s.isNameSearch && (
          <>
            <div className="ec-searchrow">{StatusSeg}</div>
            <div className="ec-searchrow">
              <Field label={`${tabLabelFor(s.searchTab)} Name`} required>
                <Input
                  value={s.searchText}
                  onChange={(e) => s.setSearchText(e.target.value)}
                  placeholder={`Enter ${tabLabelFor(s.searchTab).toLowerCase()} name`}
                  style={{ minWidth: 280 }}
                />
              </Field>
              <Field label="Year" error={!!yearError} hint={yearError} className="ec-year">
                <Input
                  value={s.year}
                  onChange={(e) => s.setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder={String(s.currentYear)}
                  inputMode="numeric"
                  maxLength={4}
                  style={{ minWidth: 120 }}
                />
              </Field>
            </div>
          </>
        )}

        {(s.searchTab === "filingNumber" || s.searchTab === "fir") && (
          <div className="ec-searchrow">
            <Field label={s.searchTab === "fir" ? "FIR Number" : "Filing Number"} required>
              <Input
                value={s.searchText}
                onChange={(e) => s.setSearchText(e.target.value)}
                placeholder={s.searchTab === "fir" ? "Enter FIR number" : "Enter filing number"}
                style={{ minWidth: 280 }}
              />
            </Field>
          </div>
        )}

        {s.searchError && (
          <div style={{ width: "100%", maxWidth: 640 }}>
            <ErrorState title="Search error" description={s.searchError} />
          </div>
        )}
      </div>
    </div>
  );
}
