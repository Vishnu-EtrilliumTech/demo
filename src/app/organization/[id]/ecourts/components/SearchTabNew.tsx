"use client";

import React, { useState, useEffect, useRef } from "react";
import { Fingerprint, FolderOpen, Gavel, Users, FileText, ShieldAlert, Search, RotateCcw, Link2 } from "lucide-react";
import { Button, Tabs, Field, Input, Select, Pill, ErrorState, Pagination, Dialog, LoadingState, EmptyState, type TabItem } from "@/design-system";
import {
  fetchCauselistStates,
  fetchCauselistDistricts,
  fetchCauselistComplexes,
  fetchCauselistCourts,
  fetchCnrCourtData,
  fetchCaseCourtData,
  searchEcourts,
  fetchEcourtsQuota,
  fetchPersistedEcourtCases,
  fetchUnlinkedCases,
  linkCnrCourtData,
  CourtState,
  CourtDistrict,
  CourtComplex,
  Court,
  EcourtsSearchParams,
  EcourtsSearchResult,
  EcourtsSearchType,
  EcourtsQuota,
} from "@/app/organization/services/ecourtapi";
import type { PagedResponse } from "@/types/pagination";
import { CourtDataApiResponse, UnlinkedCase } from "@/app/organization/types/ecourtTypes";
import { useToast } from "@/contexts/ToastContext";
import { QuotaBanner, CaseResultCard, CnrResultDetail } from "./SearchResults";

const SEARCH_TABS_BASE: TabItem[] = [
  { key: "cnr", label: "CNR Number", icon: Fingerprint },
  { key: "caseNumber", label: "Case Number", icon: FolderOpen },
  { key: "partyName", label: "Party Name", icon: Users },
  { key: "advocate", label: "Advocate", icon: Gavel },
  { key: "filingNumber", label: "Filing Number", icon: FileText },
  { key: "fir", label: "FIR Number", icon: ShieldAlert },
];

type CaseStatus = "pending" | "disposed" | "both";

const tabLabelFor = (value: string) => SEARCH_TABS_BASE.find((t) => t.key === value)?.label ?? value;

const SEARCH_TYPE_MAP: Record<string, EcourtsSearchType> = {
  caseNumber: "query",
  partyName: "party",
  advocate: "advocates",
  filingNumber: "filingNumber",
  fir: "fir",
};

const STATUS_OPTIONS: { value: CaseStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "disposed", label: "Disposed" },
  { value: "both", label: "Both" },
];

export function SearchTabNew({ organizationId }: { organizationId: string }) {
  const { showSuccess, showError } = useToast();
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedComplex, setSelectedComplex] = useState("");
  const [selectedCourt, setSelectedCourt] = useState("");
  const [searchTab, setSearchTab] = useState("cnr");

  const [cnrNumber, setCnrNumber] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [searchText, setSearchText] = useState("");
  const [year, setYear] = useState("");
  const [yearError, setYearError] = useState("");
  const [caseStatus, setCaseStatus] = useState<CaseStatus>("pending");

  const [quota, setQuota] = useState<EcourtsQuota | null>(null);
  const [states, setStates] = useState<CourtState[]>([]);
  const [districts, setDistricts] = useState<CourtDistrict[]>([]);
  const [complexes, setComplexes] = useState<CourtComplex[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<PagedResponse<EcourtsSearchResult> | null>(null);
  const [cnrResult, setCnrResult] = useState<CourtDataApiResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [lastParams, setLastParams] = useState<EcourtsSearchParams | null>(null);

  // Link-to-case dialog.
  const [linkCnr, setLinkCnr] = useState<string | null>(null);
  const [unlinked, setUnlinked] = useState<UnlinkedCase[]>([]);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkSearch, setLinkSearch] = useState("");
  // CNRs already linked to a case — hides the Link button on those results.
  const [linkedCnrs, setLinkedCnrs] = useState<Set<string>>(new Set());
  const checkedCnrsRef = useRef<Set<string>>(new Set());

  const storageKey = `ecourts-search-${organizationId}`;
  const currentYear = new Date().getFullYear();
  const yearValid = year === "" || (year.length === 4 && Number(year) >= 1950 && Number(year) <= currentYear);

  useEffect(() => {
    fetchCauselistStates().then(setStates).catch(console.error);
    fetchEcourtsQuota(organizationId).then(setQuota).catch(console.error);
  }, [organizationId]);

  // Restore search state when navigating back.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.selectedState) {
        setSelectedState(s.selectedState);
        fetchCauselistDistricts(s.selectedState).then(setDistricts).catch(console.error);
      }
      if (s.selectedDistrict) {
        setSelectedDistrict(s.selectedDistrict);
        fetchCauselistComplexes(s.selectedState, s.selectedDistrict).then(setComplexes).catch(console.error);
      }
      if (s.selectedComplex) {
        setSelectedComplex(s.selectedComplex);
        fetchCauselistCourts(s.selectedState, s.selectedDistrict, s.selectedComplex).then(setCourts).catch(console.error);
      }
      if (s.selectedCourt) setSelectedCourt(s.selectedCourt);
      const savedJurisdictionReady = !!(s.selectedState && s.selectedDistrict);
      if (s.searchTab && (s.searchTab === "cnr" || savedJurisdictionReady)) setSearchTab(s.searchTab);
      if (s.cnrNumber) setCnrNumber(s.cnrNumber);
      if (s.caseNumber) setCaseNumber(s.caseNumber);
      if (s.searchText) setSearchText(s.searchText);
      if (s.year) setYear(s.year);
      if (s.caseStatus) setCaseStatus(s.caseStatus);
      if (s.searchResults) setSearchResults(s.searchResults);
      if (s.cnrResult) setCnrResult(s.cnrResult);
      if (s.currentPage) setCurrentPage(s.currentPage);
      if (s.lastParams) setLastParams(s.lastParams);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  useEffect(() => {
    if (searchResults === null && cnrResult === null) return;
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          selectedState, selectedDistrict, selectedComplex, selectedCourt, searchTab,
          cnrNumber, caseNumber, searchText, year, caseStatus,
          searchResults, cnrResult, currentPage, lastParams,
        }),
      );
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults, cnrResult, currentPage]);

  // Check which of the currently displayed CNRs are already linked to a case,
  // so the Link button can be hidden for them.
  useEffect(() => {
    const cnrs = new Set<string>();
    if (cnrResult) cnrs.add(cnrResult.data.courtCaseData.cnr);
    if (searchResults) searchResults.items.forEach((r) => cnrs.add(r.cnr));
    const toCheck = Array.from(cnrs).filter((cnr) => !checkedCnrsRef.current.has(cnr));
    if (toCheck.length === 0) return;
    toCheck.forEach((cnr) => checkedCnrsRef.current.add(cnr));
    Promise.allSettled(
      toCheck.map((cnr) =>
        fetchPersistedEcourtCases(organizationId, { cnr }).then((page) => ({
          cnr,
          linked: page.items.some((i) => i.cnrNumber === cnr && i.linkedCaseDetails.length > 0),
        })),
      ),
    ).then((results) => {
      const linked = results
        .filter((r): r is PromiseFulfilledResult<{ cnr: string; linked: boolean }> => r.status === "fulfilled")
        .map((r) => r.value)
        .filter((v) => v.linked)
        .map((v) => v.cnr);
      if (linked.length === 0) return;
      setLinkedCnrs((prev) => {
        const next = new Set(prev);
        linked.forEach((cnr) => next.add(cnr));
        return next;
      });
    });
  }, [searchResults, cnrResult, organizationId]);

  const handleStateChange = (code: string) => {
    setSelectedState(code);
    setSelectedDistrict("");
    setSelectedComplex("");
    setSelectedCourt("");
    setDistricts([]);
    setComplexes([]);
    setCourts([]);
    if (code) fetchCauselistDistricts(code).then(setDistricts).catch(console.error);
  };

  const handleDistrictChange = (code: string) => {
    setSelectedDistrict(code);
    setSelectedComplex("");
    setSelectedCourt("");
    setComplexes([]);
    setCourts([]);
    if (code) fetchCauselistComplexes(selectedState, code).then(setComplexes).catch(console.error);
  };

  const handleComplexChange = (code: string) => {
    setSelectedComplex(code);
    setSelectedCourt("");
    setCourts([]);
    if (code) fetchCauselistCourts(selectedState, selectedDistrict, code).then(setCourts).catch(console.error);
  };

  const handleTabChange = (v: string) => {
    setSearchTab(v);
    setCnrNumber(""); setCaseNumber(""); setSearchText(""); setYear(""); setYearError("");
    setCaseStatus("pending");
    setSearchResults(null); setCnrResult(null); setSearchError(null); setCurrentPage(1); setLastParams(null);
  };

  const handleYearChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setYear(digits);
    if (digits === "") setYearError("");
    else if (digits.length < 4) setYearError("Enter a 4-digit year");
    else {
      const num = Number(digits);
      setYearError(num < 1950 || num > currentYear ? `Year must be between 1950 and ${currentYear}` : "");
    }
  };

  const handleReset = () => {
    sessionStorage.removeItem(storageKey);
    setSelectedState(""); setSelectedDistrict(""); setSelectedComplex(""); setSelectedCourt("");
    setCnrNumber(""); setCaseNumber(""); setSearchText("");
    setYear(""); setYearError(""); setCaseStatus("pending"); setSearchError(null); setSearchResults(null);
    setCnrResult(null); setCurrentPage(1); setLastParams(null);
  };

  const openLink = async (cnr: string) => {
    setLinkCnr(cnr);
    setUnlinked([]);
    setLinkSearch("");
    setLinkLoading(true);
    try {
      setUnlinked((await fetchUnlinkedCases(organizationId)).items);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load cases");
      setLinkCnr(null);
    } finally {
      setLinkLoading(false);
    }
  };

  const doLink = async (c: UnlinkedCase) => {
    const cnr = linkCnr;
    setLinkCnr(null);
    if (!cnr) return;
    try {
      await linkCnrCourtData(organizationId, c.siteId, String(c.id), cnr);
      showSuccess(`${cnr} is successfully linked with ${c.title}`);
      setLinkedCnrs((prev) => new Set(prev).add(cnr));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to link case");
    }
  };

  const linkedFilter = unlinked.filter((c) => {
    if (!linkSearch.trim()) return true;
    const t = linkSearch.toLowerCase();
    return c.caseNumber.toLowerCase().includes(t) || c.title.toLowerCase().includes(t);
  });

  const runSearch = async (params: EcourtsSearchParams, page: number, size: number = pageSize) => {
    setSearchError(null);
    setIsSearching(true);
    try {
      const data = await searchEcourts(organizationId, { ...params, page, pageSize: size });
      setSearchResults(data);
      setCurrentPage(page);
      fetchEcourtsQuota(organizationId).then(setQuota).catch(console.error);
    } catch (err: unknown) {
      setSearchError(err instanceof Error ? err.message : "Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    if (searchTab !== "cnr" && !jurisdictionReady) return;
    if (searchTab === "cnr") {
      setSearchError(null);
      setCnrResult(null);
      setIsSearching(true);
      try {
        const trimmedCnr = cnrNumber.trim();
        const result = await fetchCnrCourtData(organizationId, trimmedCnr).catch(() =>
          fetchCaseCourtData(organizationId, trimmedCnr),
        );
        if (!result) setSearchError("Case not found.");
        else {
          setCnrResult(result);
          fetchEcourtsQuota(organizationId).then(setQuota).catch(console.error);
        }
      } catch (err: unknown) {
        setSearchError(err instanceof Error ? err.message : "Search failed. Please try again.");
      } finally {
        setIsSearching(false);
      }
      return;
    }
    const searchValue = searchTab === "caseNumber" ? caseNumber.trim() : searchText.trim();
    const showsStatusAndYear = searchTab === "caseNumber" || isNameSearch;
    const params: EcourtsSearchParams = {
      searchType: SEARCH_TYPE_MAP[searchTab],
      searchValue,
      ...(showsStatusAndYear && caseStatus !== "both" && { caseStatus: caseStatus as "pending" | "disposed" }),
      ...(selectedState && { stateCode: selectedState }),
      ...(selectedState && selectedDistrict && { districtCode: selectedDistrict }),
      ...(searchTab !== "fir" && selectedCourt && { courtCode: selectedCourt }),
      ...(isNameSearch && year && yearValid && { filingYear: year }),
    };
    setLastParams(params);
    await runSearch(params, 1);
  };

  const StatusSeg = (
    <Field label="Case status">
      <div className="seg">
        {STATUS_OPTIONS.map((o) => (
          <button key={o.value} type="button" className={`seg-btn${caseStatus === o.value ? " on" : ""}`} onClick={() => setCaseStatus(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </Field>
  );

  const isNameSearch = searchTab === "partyName" || searchTab === "advocate";
  // Search unlocks once State & District are chosen; Court Complex & Court are
  // optional refinements (they narrow the query when supplied).
  const jurisdictionReady = !!(selectedState && selectedDistrict);
  const selectedStateName = states.find((s) => s.code === selectedState)?.name;
  const selectedDistrictName = districts.find((d) => d.code === selectedDistrict)?.name;
  const selectedComplexName = complexes.find((c) => c.code === selectedComplex)?.name;
  const selectedCourtName = courts.find((c) => c.code === selectedCourt)?.name;
  const SEARCH_TABS: TabItem[] = SEARCH_TABS_BASE.map((t) => ({
    ...t,
    disabled: t.key !== "cnr" && !jurisdictionReady,
  }));

  return (
    <div>
      {quota && <QuotaBanner quota={quota} />}

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-3)" }}>
            Jurisdiction
          </span>
          {!jurisdictionReady && (
            <Pill tone="warn">Select State &amp; District to unlock search</Pill>
          )}
        </div>
        <div className="ec-jurisdiction-row">
          <Field label="State">
            <Select value={selectedState} title={selectedStateName} onChange={(e) => handleStateChange(e.target.value)}>
              <option value="">Select state</option>
              {[...states].sort((a, b) => a.name.localeCompare(b.name)).map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="District">
            <Select value={selectedDistrict} title={selectedDistrictName} disabled={!selectedState} onChange={(e) => handleDistrictChange(e.target.value)}>
              <option value="">Select district</option>
              {districts.map((d) => (
                <option key={d.code} value={d.code}>{d.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Court Complex">
            <Select value={selectedComplex} title={selectedComplexName} disabled={!selectedDistrict} onChange={(e) => handleComplexChange(e.target.value)}>
              <option value="">Select complex</option>
              {complexes.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Court">
            <Select value={selectedCourt} title={selectedCourtName} disabled={!selectedComplex} onChange={(e) => setSelectedCourt(e.target.value)}>
              <option value="">Select court</option>
              {courts.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </Select>
          </Field>
        </div>
        {(selectedState || selectedDistrict || selectedComplex || selectedCourt) && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <Button variant="secondary" icon={RotateCcw} onClick={handleReset}>
              Reset
            </Button>
          </div>
        )}
      </div>

      <Tabs items={SEARCH_TABS} activeKey={searchTab} onChange={handleTabChange} />

      <div className="ec-searchform" key={searchTab}>
        <div className="subhead">Search by {tabLabelFor(searchTab)}</div>

        {searchTab === "cnr" && (
          <div className="ec-searchrow">
            <Field label="CNR Number" required>
              <Input
                value={cnrNumber}
                onChange={(e) => setCnrNumber(e.target.value.toUpperCase())}
                placeholder="e.g. KLAP010012342023"
                style={{ minWidth: 280, letterSpacing: "0.04em" }}
              />
            </Field>
            <Button variant="primary" icon={Search} loading={isSearching} disabled={!cnrNumber.trim()} onClick={handleSearch}>
              Search
            </Button>
          </div>
        )}

        {searchTab === "caseNumber" && (
          <>
            <div className="ec-searchrow">{StatusSeg}</div>
            <div className="ec-searchrow">
              <Field label="Case Number" required>
                <Input value={caseNumber} onChange={(e) => setCaseNumber(e.target.value)} placeholder="Enter case number" style={{ minWidth: 280 }} />
              </Field>
              <Button variant="primary" icon={Search} loading={isSearching} disabled={!caseNumber.trim() || !jurisdictionReady} onClick={handleSearch}>
                Search
              </Button>
            </div>
          </>
        )}

        {isNameSearch && (
          <>
            <div className="ec-searchrow">{StatusSeg}</div>
            <div className="ec-searchrow">
              <Field label={searchTab === "partyName" ? "Party Name" : `${tabLabelFor(searchTab)} Name`} required>
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder={searchTab === "partyName" ? "Enter party name" : `Enter ${tabLabelFor(searchTab).toLowerCase()} name`}
                  style={{ minWidth: 280 }}
                />
              </Field>
              <Field label="Year" error={!!yearError} hint={yearError || undefined} className="ec-year">
                <Input value={year} onChange={(e) => handleYearChange(e.target.value)} placeholder={String(currentYear)} inputMode="numeric" maxLength={4} style={{ minWidth: 120 }} />
              </Field>
              <Button variant="primary" icon={Search} loading={isSearching} disabled={!searchText.trim() || !yearValid || !jurisdictionReady} onClick={handleSearch}>
                Search
              </Button>
            </div>
          </>
        )}

        {(searchTab === "filingNumber" || searchTab === "fir") && (
          <div className="ec-searchrow">
            <Field label={searchTab === "fir" ? "FIR Number" : "Filing Number"} required>
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={searchTab === "fir" ? "Enter FIR number" : "Enter filing number"}
                style={{ minWidth: 280 }}
              />
            </Field>
            <Button variant="primary" icon={Search} loading={isSearching} disabled={!searchText.trim() || !jurisdictionReady} onClick={handleSearch}>
              Search
            </Button>
          </div>
        )}

        {searchError && (
          <div style={{ width: "100%", maxWidth: 640 }}>
            <ErrorState title="Search error" description={searchError} />
          </div>
        )}
      </div>

      {cnrResult !== null && !searchError && (
        <div style={{ marginTop: 8 }}>
          <CnrResultDetail
            response={cnrResult}
            orgId={organizationId}
            onLink={linkedCnrs.has(cnrResult.data.courtCaseData.cnr) ? undefined : openLink}
          />
        </div>
      )}

      {searchResults !== null && !searchError && (
        <div style={{ marginTop: 20 }}>
          <div className="ec-results-head">
            <span>
              {searchResults.totalCount.toLocaleString()} result{searchResults.totalCount !== 1 ? "s" : ""} found
            </span>
            {searchResults.totalPages > 1 && (
              <span style={{ color: "var(--text-3)", fontWeight: 500 }}>
                Page {searchResults.page} of {searchResults.totalPages}
              </span>
            )}
          </div>
          {searchResults.items.map((r) => (
            <CaseResultCard
              key={r.cnr}
              result={r}
              orgId={organizationId}
              onLink={linkedCnrs.has(r.cnr) ? undefined : openLink}
            />
          ))}
          {searchResults.totalPages > 1 && (
            <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
              <Pagination
                page={currentPage}
                totalPages={searchResults.totalPages}
                onPageChange={(p) => {
                  if (lastParams) runSearch(lastParams, p);
                }}
                disabled={isSearching}
              />
            </div>
          )}
        </div>
      )}

      {/* Link-to-case dialog */}
      <Dialog open={!!linkCnr} onClose={() => setLinkCnr(null)} title="Link to a case" icon={Link2} small>
        <div className="searchbox" style={{ marginBottom: 12, width: "100%" }}>
          <Search aria-hidden />
          <input autoFocus placeholder="Search cases…" value={linkSearch} onChange={(e) => setLinkSearch(e.target.value)} />
        </div>
        {linkLoading ? (
          <LoadingState message="Loading…" size="sm" />
        ) : linkedFilter.length === 0 ? (
          <EmptyState title={linkSearch ? "No cases match your search" : "No unlinked cases available"} />
        ) : (
          <div className="ec-picklist">
            {linkedFilter.map((c) => (
              <button key={c.id} type="button" onClick={() => doLink(c)}>
                <b>{c.caseNumber}</b>
                <span>{c.title}</span>
              </button>
            ))}
          </div>
        )}
      </Dialog>
    </div>
  );
}
