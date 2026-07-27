"use client";

import { useEffect, useState } from "react";
import {
  fetchCauselistStates,
  fetchCauselistDistricts,
  fetchCauselistComplexes,
  fetchCauselistCourts,
  fetchCnrCourtData,
  fetchCaseCourtData,
  searchEcourts,
  type CourtState,
  type CourtDistrict,
  type CourtComplex,
  type Court,
  type EcourtsSearchParams,
  type EcourtsSearchResult,
  type EcourtsSearchType,
} from "@/app/organization/services/ecourtapi";
import type { CourtCaseData } from "@/app/organization/types/ecourtTypes";
import type { CaseFormSeed } from "./useCaseForm";

export type SearchTabKey = "cnr" | "caseNumber" | "partyName" | "advocate" | "filingNumber" | "fir";
export type CaseStatusFilter = "pending" | "disposed" | "both";

/** A court record normalised from either a list search or a CNR lookup. */
export interface EcourtPick {
  cnr: string;
  title: string;
  caseNumber: string;
  caseType: string;
  court: string;
  courtLocation: string;
  petitioner: string;
  respondent: string;
  filingDate: string | null;
}

const SEARCH_TYPE_MAP: Record<Exclude<SearchTabKey, "cnr">, EcourtsSearchType> = {
  caseNumber: "query",
  partyName: "party",
  advocate: "advocates",
  filingNumber: "filingNumber",
  fir: "fir",
};

function fromSearchResult(r: EcourtsSearchResult, courtLabel: string): EcourtPick {
  return {
    cnr: r.cnr,
    title: `${r.petitioners[0] ?? "Unknown"} vs. ${r.respondents[0] ?? "Unknown"}`,
    caseNumber: r.registrationNumber ?? "",
    caseType: r.caseType ?? "",
    court: courtLabel || r.courtCode || "",
    courtLocation: r.judicialSection || "",
    petitioner: r.petitioners.join(", "),
    respondent: r.respondents.join(", "),
    filingDate: r.filingDate,
  };
}

function fromCourtCaseData(cd: CourtCaseData): EcourtPick {
  const p = cd.petitioners?.[0] ?? "";
  const r = cd.respondents?.[0] ?? "";
  return {
    cnr: cd.cnr,
    title: p && r ? `${p} vs. ${r}` : p || r || cd.cnr,
    caseNumber: cd.caseNumber || cd.registrationNumber || "",
    caseType: cd.caseTypeRaw || cd.caseType || "",
    court: cd.courtName || "",
    courtLocation: cd.judicialSection || "",
    petitioner: (cd.petitioners ?? []).join(", "),
    respondent: (cd.respondents ?? []).join(", "),
    filingDate: cd.filingDate || null,
  };
}

/** Maps a picked court record to the case-form seed used to pre-fill the form. */
export function pickToSeed(p: EcourtPick): CaseFormSeed {
  return {
    id: p.cnr,
    title: p.title,
    caseNumber: p.caseNumber,
    cnrNumber: p.cnr,
    petitioner: p.petitioner,
    respondent: p.respondent,
    caseType: p.caseType,
    court: p.court,
    courtLocation: p.courtLocation,
  };
}

/**
 * eCourts search state + actions for the Add-case dialog. Mirrors the eCourts
 * Search tab (jurisdiction cascade + the six search types) but normalises every
 * result into an {@link EcourtPick} so the dialog's results step and form seed
 * are shape-agnostic. Read-only search — no linking/quota/persistence here.
 */
export function useEcourtsCaseSearch(organizationId: string, enabled = true) {
  const [states, setStates] = useState<CourtState[]>([]);
  const [districts, setDistricts] = useState<CourtDistrict[]>([]);
  const [complexes, setComplexes] = useState<CourtComplex[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedComplex, setSelectedComplex] = useState("");
  const [selectedCourt, setSelectedCourt] = useState("");

  const [searchTab, setSearchTab] = useState<SearchTabKey>("cnr");
  const [cnrNumber, setCnrNumber] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [searchText, setSearchText] = useState("");
  const [year, setYear] = useState("");
  const [caseStatus, setCaseStatus] = useState<CaseStatusFilter>("pending");

  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<EcourtPick[] | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Defensive: an endpoint that returns a non-array (e.g. an unmatched mock
  // route yielding `{}`) must never reach a `.map()` and crash the dialog.
  const asArray = <T,>(v: T[]): T[] => (Array.isArray(v) ? v : []);

  useEffect(() => {
    if (!enabled || states.length > 0) return;
    fetchCauselistStates()
      .then((r) => setStates(asArray(r)))
      .catch(() => setStates([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const currentYear = new Date().getFullYear();
  const yearValid = year === "" || (year.length === 4 && Number(year) >= 1950 && Number(year) <= currentYear);
  const isNameSearch = searchTab === "partyName" || searchTab === "advocate";
  // Only State + District are mandatory to unlock the non-CNR searches; Court
  // Complex and Court are optional refinements.
  const jurisdictionReady = !!(selectedState && selectedDistrict);

  const handleState = (code: string) => {
    setSelectedState(code);
    setSelectedDistrict("");
    setSelectedComplex("");
    setSelectedCourt("");
    setDistricts([]);
    setComplexes([]);
    setCourts([]);
    if (code) fetchCauselistDistricts(code).then((r) => setDistricts(asArray(r))).catch(() => setDistricts([]));
  };

  const handleDistrict = (code: string) => {
    setSelectedDistrict(code);
    setSelectedComplex("");
    setSelectedCourt("");
    setComplexes([]);
    setCourts([]);
    if (code)
      fetchCauselistComplexes(selectedState, code)
        .then((r) => setComplexes(asArray(r)))
        .catch(() => setComplexes([]));
  };

  const handleComplex = (code: string) => {
    setSelectedComplex(code);
    setSelectedCourt("");
    setCourts([]);
    if (code)
      fetchCauselistCourts(selectedState, selectedDistrict, code)
        .then((r) => setCourts(asArray(r)))
        .catch(() => setCourts([]));
  };

  const changeTab = (v: SearchTabKey) => {
    setSearchTab(v);
    setCnrNumber("");
    setCaseNumber("");
    setSearchText("");
    setYear("");
    setCaseStatus("pending");
    setSearchError(null);
    setResults(null);
  };

  const canSearch = (() => {
    if (searchTab === "cnr") return !!cnrNumber.trim();
    if (searchTab === "caseNumber") return !!caseNumber.trim() && jurisdictionReady;
    if (isNameSearch) return !!searchText.trim() && yearValid && jurisdictionReady;
    return !!searchText.trim() && jurisdictionReady; // filingNumber / fir
  })();

  const courtLabel = courts.find((c) => c.code === selectedCourt)?.name ?? "";

  /** Runs the active search; returns the normalised picks (or null on error). */
  const runSearch = async (): Promise<EcourtPick[] | null> => {
    setSearchError(null);
    setIsSearching(true);
    try {
      if (searchTab === "cnr") {
        const trimmed = cnrNumber.trim();
        const res = await fetchCnrCourtData(organizationId, trimmed).catch(() =>
          fetchCaseCourtData(organizationId, trimmed),
        );
        if (!res) {
          setSearchError("Case not found.");
          setResults([]);
          setTotalCount(0);
          return [];
        }
        const pick = fromCourtCaseData(res.data.courtCaseData);
        setResults([pick]);
        setTotalCount(1);
        return [pick];
      }

      const searchValue = searchTab === "caseNumber" ? caseNumber.trim() : searchText.trim();
      const showsStatus = searchTab === "caseNumber" || isNameSearch;
      const params: EcourtsSearchParams = {
        searchType: SEARCH_TYPE_MAP[searchTab],
        searchValue,
        ...(showsStatus && caseStatus !== "both" && { caseStatus: caseStatus as "pending" | "disposed" }),
        ...(selectedState && { stateCode: selectedState }),
        ...(selectedState && selectedDistrict && { districtCode: selectedDistrict }),
        ...(searchTab !== "fir" && selectedCourt && { courtCode: selectedCourt }),
        ...(isNameSearch && year && yearValid && { filingYear: year }),
        page: 1,
        pageSize: 20,
      };
      const page = await searchEcourts(organizationId, params);
      const picks = asArray(page.items).map((r) => fromSearchResult(r, courtLabel));
      setResults(picks);
      setTotalCount(page.totalCount ?? picks.length);
      return picks;
    } catch (err: unknown) {
      setSearchError(err instanceof Error ? err.message : "Search failed. Please try again.");
      setResults(null);
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  const reset = () => {
    setSelectedState("");
    setSelectedDistrict("");
    setSelectedComplex("");
    setSelectedCourt("");
    setDistricts([]);
    setComplexes([]);
    setCourts([]);
    setSearchTab("cnr");
    setCnrNumber("");
    setCaseNumber("");
    setSearchText("");
    setYear("");
    setCaseStatus("pending");
    setSearchError(null);
    setResults(null);
    setTotalCount(0);
  };

  return {
    // jurisdiction
    states,
    districts,
    complexes,
    courts,
    selectedState,
    selectedDistrict,
    selectedComplex,
    selectedCourt,
    handleState,
    handleDistrict,
    handleComplex,
    setSelectedCourt,
    // search inputs
    searchTab,
    changeTab,
    cnrNumber,
    setCnrNumber,
    caseNumber,
    setCaseNumber,
    searchText,
    setSearchText,
    year,
    setYear,
    caseStatus,
    setCaseStatus,
    // results
    isSearching,
    searchError,
    results,
    totalCount,
    // derived + actions
    currentYear,
    yearValid,
    isNameSearch,
    jurisdictionReady,
    canSearch,
    runSearch,
    reset,
  };
}
