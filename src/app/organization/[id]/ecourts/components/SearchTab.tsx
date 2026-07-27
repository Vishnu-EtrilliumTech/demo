"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Tabs,
  Tab,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  SelectChangeEvent,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Tooltip,
} from "@mui/material";
import ListFooterPager from "@/components/ListFooterPager";

import SearchIcon from "@mui/icons-material/Search";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import GavelIcon from "@mui/icons-material/Gavel";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PersonPinIcon from "@mui/icons-material/PersonPin";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import GroupsIcon from "@mui/icons-material/Groups";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import {
  fetchCauselistStates,
  fetchCauselistDistricts,
  fetchCnrCourtData,
  fetchCaseCourtData,
  searchEcourts,
  fetchEcourtsQuota,
  CourtState,
  CourtDistrict,
  EcourtsSearchParams,
  EcourtsSearchResult,
  EcourtsSearchType,
  EcourtsQuota,
} from "@/app/organization/services/ecourtapi";
import type { PagedResponse } from "@/types/pagination";
import { CourtDataApiResponse } from "@/app/organization/types/ecourtTypes";
import { formatDisplayDate } from "@/utils";
import { LinkCaseButton } from "./LinkCaseButton";
import { extractApiErrors } from "@/utils/errorHandler";

const SEARCH_TABS = [
  { label: "CNR Number",  value: "cnr",         icon: <FingerprintIcon />,      color: "#0ea5e9" },
  { label: "Case Number", value: "caseNumber",   icon: <FolderOpenIcon />,       color: "#0ea5e9" },
  { label: "Advocates",   value: "advocates",    icon: <GavelIcon />,            color: "#0ea5e9" },
  { label: "Judges",      value: "judges",       icon: <AccountBalanceIcon />,   color: "#0ea5e9" },
  { label: "Petitioners", value: "petitioners",  icon: <PersonPinIcon />,        color: "#0ea5e9" },
  { label: "Respondents", value: "respondents",  icon: <RecordVoiceOverIcon />,  color: "#0ea5e9" },
  { label: "Litigants",   value: "litigants",    icon: <GroupsIcon />,           color: "#0ea5e9" },
];

type CaseStatus = "pending" | "disposed" | "both";

const tabLabelFor = (value: string) =>
  SEARCH_TABS.find((t) => t.value === value)?.label ?? value;

const SEARCH_TYPE_MAP: Record<string, EcourtsSearchType> = {
  caseNumber: "query",
  advocates: "advocates",
  judges: "judges",
  petitioners: "petitioners",
  respondents: "respondents",
  litigants: "litigants",
};

interface SearchTabProps {
  organizationId: string;
}

export function SearchTab({ organizationId }: SearchTabProps) {
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
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
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<PagedResponse<EcourtsSearchResult> | null>(null);
  const [cnrResult, setCnrResult] = useState<CourtDataApiResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [lastParams, setLastParams] = useState<EcourtsSearchParams | null>(null);

  const storageKey = `ecourts-search-${organizationId}`;

  useEffect(() => {
    fetchCauselistStates().then(setStates).catch(console.error);
    fetchEcourtsQuota(organizationId).then(setQuota).catch(console.error);
  }, [organizationId]);

  // Restore search state when navigating back
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.selectedState)  { setSelectedState(s.selectedState); fetchCauselistDistricts(s.selectedState).then(setDistricts).catch(console.error); }
      if (s.selectedDistrict) setSelectedDistrict(s.selectedDistrict);
      if (s.searchTab)     setSearchTab(s.searchTab);
      if (s.cnrNumber)     setCnrNumber(s.cnrNumber);
      if (s.caseNumber)    setCaseNumber(s.caseNumber);
      if (s.searchText)    setSearchText(s.searchText);
      if (s.year)          setYear(s.year);
      if (s.caseStatus)    setCaseStatus(s.caseStatus);
      if (s.searchResults) setSearchResults(s.searchResults);
      if (s.cnrResult)     setCnrResult(s.cnrResult);
      if (s.currentPage)   setCurrentPage(s.currentPage);
      if (s.lastParams)    setLastParams(s.lastParams);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  // Persist state whenever results or pagination changes
  useEffect(() => {
    if (searchResults === null && cnrResult === null) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({
        selectedState, selectedDistrict, searchTab,
        cnrNumber, caseNumber, searchText, year, caseStatus,
        searchResults, cnrResult, currentPage, lastParams,
      }));
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults, cnrResult, currentPage]);

  const handleStateChange = (e: SelectChangeEvent) => {
    const code = e.target.value;
    setSelectedState(code);
    setSelectedDistrict("");
    setDistricts([]);
    if (code) {
      fetchCauselistDistricts(code).then(setDistricts).catch(console.error);
    }
  };

  const currentYear = new Date().getFullYear();

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setSearchTab(newValue);
    setCnrNumber("");
    setCaseNumber("");
    setSearchText("");
    setYear("");
    setYearError("");
    setCaseStatus("pending");
    setSelectedState("");
    setSelectedDistrict("");
    setDistricts([]);
    setSearchResults(null);
    setCnrResult(null);
    setSearchError(null);
    setCurrentPage(1);
    setLastParams(null);
  };

  const handleYearChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setYear(digits);
    if (digits === "") {
      setYearError("");
    } else if (digits.length < 4) {
      setYearError("Enter a 4-digit year");
    } else {
      const num = Number(digits);
      if (num < 1950 || num > currentYear) {
        setYearError(`Year must be between 1950 and ${currentYear}`);
      } else {
        setYearError("");
      }
    }
  };

  const handleReset = () => {
    sessionStorage.removeItem(storageKey);
    setSelectedState("");
    setSelectedDistrict("");
    setCnrNumber("");
    setCaseNumber("");
    setSearchText("");
    setYear("");
    setYearError("");
    setCaseStatus("pending");
    setSearchError(null);
    setSearchResults(null);
    setCnrResult(null);
    setCurrentPage(1);
    setLastParams(null);
  };

  const runSearch = async (params: EcourtsSearchParams, page: number, size: number = pageSize) => {
    setSearchError(null);
    setIsSearching(true);
    try {
      const data = await searchEcourts(organizationId, { ...params, page, pageSize: size });
      setSearchResults(data);
      setCurrentPage(page);
      fetchEcourtsQuota(organizationId).then(setQuota).catch(console.error);
    } catch (err: unknown) {
      setSearchError(extractApiErrors(err)[0] ?? "Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    if (searchTab === "cnr") {
      setSearchError(null);
      setCnrResult(null);
      setIsSearching(true);
      try {
        const trimmedCnr = cnrNumber.trim();
        const result = await fetchCnrCourtData(organizationId, trimmedCnr).catch(() =>
          fetchCaseCourtData(organizationId, trimmedCnr)
        );
        if (!result) {
          setSearchError("Case not found.");
        } else {
          setCnrResult(result);
          fetchEcourtsQuota(organizationId).then(setQuota).catch(console.error);
        }
      } catch (err: unknown) {
        setSearchError(extractApiErrors(err)[0] ?? "Search failed. Please try again.");
      } finally {
        setIsSearching(false);
      }
      return;
    }

    const searchValue = searchTab === "caseNumber" ? caseNumber.trim() : searchText.trim();
    const params: EcourtsSearchParams = {
      searchType: SEARCH_TYPE_MAP[searchTab],
      searchValue,
      ...(caseStatus !== "both" && { caseStatus: caseStatus as "pending" | "disposed" }),
      ...(selectedState && { stateCode: selectedState }),
      ...(selectedState && selectedDistrict && { districtCode: selectedDistrict }),
      ...(year && yearValid && { filingYear: year }),
    };
    setLastParams(params);
    await runSearch(params, 1);
  };

  const yearValid = year === "" || (year.length === 4 && Number(year) >= 1950 && Number(year) <= currentYear);

  const statusOptions: { value: CaseStatus; label: string }[] = [
    { value: "pending", label: "Pending" },
    { value: "disposed", label: "Disposed" },
    { value: "both", label: "Both" },
  ];

  return (
    <Box>
      {/* Quota banner */}
      {quota && <QuotaBanner quota={quota} />}

      {/* Search type tabs */}
      <Tabs
        value={searchTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          px: 2,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.82rem",
            minHeight: 48,
            color: "text.secondary",
            gap: 0.5,
          },
          "& .MuiTabs-indicator": {
            backgroundColor: SEARCH_TABS.find((t) => t.value === searchTab)?.color ?? "#6366f1",
            height: 3,
            borderRadius: "3px 3px 0 0",
          },
        }}
      >
        {SEARCH_TABS.map((tab) => {
          const isSelected = searchTab === tab.value;
          return (
            <Tab
              key={tab.value}
              value={tab.value}
              iconPosition="start"
              icon={React.cloneElement(tab.icon, {
                sx: {
                  fontSize: "15px !important",
                  color: isSelected ? tab.color : "rgba(0,0,0,0.35)",
                  transition: "color 0.2s",
                },
              })}
              label={tab.label}
              sx={{ color: isSelected ? `${tab.color} !important` : undefined }}
            />
          );
        })}
      </Tabs>

      {/* Form area */}
      <Box
        key={searchTab}
        sx={{
          p: "24px 24px 28px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 160,
          "@keyframes tabFadeIn": {
            from: { opacity: 0, transform: "translateY(8px)" },
            to:   { opacity: 1, transform: "translateY(0)" },
          },
          animation: "tabFadeIn 0.22s ease",
        }}
      >
        {/* Sub-heading */}
        <Typography
          variant="caption"
          sx={{
            display: "block",
            fontWeight: 700,
            color: SEARCH_TABS.find((t) => t.value === searchTab)?.color ?? "text.secondary",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            fontSize: "0.7rem",
            mb: 2.5,
            textAlign: "center",
          }}
        >
          Case Status : Search by {tabLabelFor(searchTab)}
        </Typography>

        {/* CNR Number */}
        {searchTab === "cnr" && (
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-end", justifyContent: "center", flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography component="label" sx={labelSx}>CNR Number <span style={{ color: "#ef4444" }}>*</span></Typography>
              <TextField
                size="small"
                value={cnrNumber}
                onChange={(e) => setCnrNumber(e.target.value.toUpperCase())}
                placeholder="e.g. KLAP010012342023"
                sx={fieldSx}
                slotProps={{ input: { style: { fontFamily: "monospace", letterSpacing: "0.04em" } } }}
              />
            </Box>
            <SearchButton onClick={handleSearch} disabled={!cnrNumber.trim()} loading={isSearching} />
          </Box>
        )}

        {/* Case Number */}
        {searchTab === "caseNumber" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, width: "100%", alignItems: "center" }}>
            {/* Row 1: State & District */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-end", justifyContent: "center", flexWrap: "wrap" }}>
              <StateDistrictSelects
                states={states}
                districts={districts}
                selectedState={selectedState}
                selectedDistrict={selectedDistrict}
                onStateChange={handleStateChange}
                onDistrictChange={(v) => setSelectedDistrict(v)}
              />
              {(selectedState || selectedDistrict) && <ResetButton onClick={handleReset} />}
            </Box>
            {/* Row 2: Case Status */}
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography component="label" sx={labelSx}>Case Status</Typography>
                <StatusRadioGroup value={caseStatus} onChange={setCaseStatus} options={statusOptions} />
              </Box>
            </Box>
            {/* Row 3: Case Number + Search */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-end", justifyContent: "center", flexWrap: "wrap" }}>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography component="label" sx={labelSx}>Case Number <span style={{ color: "#ef4444" }}>*</span></Typography>
                <TextField
                  size="small"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  placeholder="Enter case number"
                  sx={fieldSx}
                />
              </Box>
              <SearchButton onClick={handleSearch} disabled={!caseNumber.trim()} loading={isSearching} />
            </Box>
          </Box>
        )}

        {/* Advocates / Judges / Petitioners / Respondents / Litigants */}
        {["advocates", "judges", "petitioners", "respondents", "litigants"].includes(searchTab) && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, width: "100%", alignItems: "center" }}>
            {/* Row 1: State & District */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-end", justifyContent: "center", flexWrap: "wrap" }}>
              <StateDistrictSelects
                states={states}
                districts={districts}
                selectedState={selectedState}
                selectedDistrict={selectedDistrict}
                onStateChange={handleStateChange}
                onDistrictChange={(v) => setSelectedDistrict(v)}
              />
              {(selectedState || selectedDistrict) && <ResetButton onClick={handleReset} />}
            </Box>
            {/* Row 2: Case Status */}
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography component="label" sx={labelSx}>Case Status</Typography>
                <StatusRadioGroup value={caseStatus} onChange={setCaseStatus} options={statusOptions} />
              </Box>
            </Box>
            {/* Row 3: Name + Year + Search */}
            <Box sx={{ display: "flex", gap: 3, alignItems: "flex-end", justifyContent: "center", flexWrap: "wrap" }}>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography component="label" sx={labelSx}>{tabLabelFor(searchTab)} Name <span style={{ color: "#ef4444" }}>*</span></Typography>
                <TextField
                  size="small"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder={`Enter ${tabLabelFor(searchTab).toLowerCase().replace(/s$/, "")} name`}
                  sx={fieldSx}
                />
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography component="label" sx={labelSx}>Year</Typography>
                <TextField
                  size="small"
                  value={year}
                  onChange={(e) => handleYearChange(e.target.value)}
                  placeholder={String(currentYear)}
                  error={!!yearError}
                  helperText={yearError}
                  slotProps={{
                    htmlInput: { maxLength: 4, inputMode: "numeric" },
                    formHelperText: { sx: { position: "absolute", bottom: "-20px", mx: 0, whiteSpace: "nowrap" } },
                  }}
                  sx={{ ...fieldSx, minWidth: 110, position: "relative" }}
                />
              </Box>
              <SearchButton onClick={handleSearch} disabled={!searchText.trim() || !yearValid} loading={isSearching} />
            </Box>
          </Box>
        )}

        {searchError && (
          <Alert severity="error" sx={{ mt: 3, width: "100%", maxWidth: 640, borderRadius: "10px" }}>
            {searchError}
          </Alert>
        )}
      </Box>

      {/* CNR Result */}
      {cnrResult !== null && !searchError && (
        <Box sx={{ px: 3, pb: 3 }}>
          <CnrResultDetail response={cnrResult} orgId={organizationId} />
        </Box>
      )}

      {/* Results */}
      {searchResults !== null && !searchError && (
        <Box sx={{ px: 3, pb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "text.secondary" }}>
              {searchResults.totalCount.toLocaleString()} result{searchResults.totalCount !== 1 ? "s" : ""} found
            </Typography>
            {searchResults.totalPages > 1 && (
              <Typography sx={{ fontSize: "0.75rem", color: "text.disabled" }}>
                Page {searchResults.page} of {searchResults.totalPages}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {searchResults.items.map((r) => (
              <CaseResultCard key={r.cnr} result={r} orgId={organizationId} />
            ))}
          </Box>

          {searchResults.totalCount > 0 && (
            <ListFooterPager
              page={currentPage}
              pageSize={pageSize}
              totalCount={searchResults.totalCount}
              totalPages={searchResults.totalPages}
              hasNextPage={searchResults.hasNextPage}
              hasPreviousPage={searchResults.hasPreviousPage}
              onPageChange={(p) => {
                if (lastParams) runSearch(lastParams, p);
              }}
              onPageSizeChange={(ps) => {
                setPageSize(ps);
                if (lastParams) runSearch(lastParams, 1, ps);
              }}
              disabled={isSearching}
            />
          )}
        </Box>
      )}
    </Box>
  );
}

// ── Quota Banner ─────────────────────────────────────────────────────────────

function QuotaBanner({ quota }: { quota: EcourtsQuota }) {
  if (quota.isUnlimited) {
    return (
      <Box sx={{ px: "20px", py: "10px", bgcolor: "rgba(99,102,241,0.04)", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 1.5 }}>
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1" }}>Unlimited searches</Typography>
        <Typography sx={{ fontSize: "0.72rem", color: "text.disabled" }}>· {quota.consumedCount.toLocaleString()} used this month</Typography>
      </Box>
    );
  }

  const pct = quota.monthlyLimit > 0 ? Math.min((quota.consumedCount / quota.monthlyLimit) * 100, 100) : 0;
  const color = quota.isExhausted ? "#ef4444" : quota.isWarning ? "#f59e0b" : "#10b981";
  const bgColor = quota.isExhausted ? "rgba(239,68,68,0.06)" : quota.isWarning ? "rgba(245,158,11,0.06)" : "rgba(16,185,129,0.06)";

  return (
    <Box sx={{ px: "20px", py: "10px", bgcolor: bgColor, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Monthly Search Quota
          </Typography>
          {quota.isExhausted && (
            <Chip label="Exhausted" size="small" sx={{ height: 16, fontSize: "0.6rem", fontWeight: 700, bgcolor: "rgba(239,68,68,0.12)", color: "#ef4444", borderRadius: "5px" }} />
          )}
          {quota.isWarning && !quota.isExhausted && (
            <Chip label="Low" size="small" sx={{ height: 16, fontSize: "0.6rem", fontWeight: 700, bgcolor: "rgba(245,158,11,0.12)", color: "#d97706", borderRadius: "5px" }} />
          )}
        </Box>
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color }}>
          {quota.remainingCount.toLocaleString()} remaining
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ flex: 1, height: 5, borderRadius: "3px", bgcolor: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <Box sx={{ width: `${pct}%`, height: "100%", bgcolor: color, borderRadius: "3px", transition: "width 0.4s ease" }} />
        </Box>
        <Typography sx={{ fontSize: "0.7rem", color: "text.disabled", whiteSpace: "nowrap" }}>
          {quota.consumedCount.toLocaleString()} / {quota.monthlyLimit.toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

const labelSx = {
  fontSize: "0.72rem",
  fontWeight: 700,
  color: "text.secondary",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  display: "block",
  mb: 0.75,
};

const fieldSx = {
  minWidth: 260,
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    fontSize: "0.875rem",
    bgcolor: "white",
    "& fieldset": { borderColor: "rgba(0,0,0,0.18)" },
    "&:hover fieldset": { borderColor: "#6366f1" },
    "&.Mui-focused fieldset": { borderColor: "#6366f1" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#6366f1" },
};


interface StatusRadioGroupProps {
  value: CaseStatus;
  onChange: (v: CaseStatus) => void;
  options: { value: CaseStatus; label: string }[];
}

function StatusRadioGroup({ value, onChange, options }: StatusRadioGroupProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <RadioGroup
        row
        value={value}
        onChange={(e) => onChange(e.target.value as CaseStatus)}
        sx={{ gap: 0 }}
      >
        {options.map((opt) => (
          <FormControlLabel
            key={opt.value}
            value={opt.value}
            control={
              <Radio
                size="small"
                sx={{
                  color: "rgba(0,0,0,0.3)",
                  "&.Mui-checked": { color: "#6366f1" },
                  p: "6px 4px",
                }}
              />
            }
            label={
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: "text.primary" }}>
                {opt.label}
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
        ))}
      </RadioGroup>
    </Box>
  );
}

function SearchButton({ onClick, disabled, loading }: { onClick: () => void; disabled: boolean; loading?: boolean }) {
  return (
    <Button
      variant="contained"
      size="medium"
      startIcon={loading
        ? <CircularProgress size={14} color="inherit" />
        : <SearchIcon sx={{ fontSize: "16px !important" }} />}
      onClick={onClick}
      disabled={disabled || loading}
      sx={{
        textTransform: "none",
        fontWeight: 600,
        fontSize: "0.85rem",
        borderRadius: "10px",
        px: 2.5,
        py: "7px",
        bgcolor: "#6366f1",
        boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
        "&:hover": { bgcolor: "#4f46e5", boxShadow: "0 4px 12px rgba(99,102,241,0.45)" },
        "&.Mui-disabled": { bgcolor: "rgba(0,0,0,0.08)", color: "rgba(0,0,0,0.3)", boxShadow: "none" },
      }}
    >
      Search
    </Button>
  );
}

interface StateDistrictSelectsProps {
  states: CourtState[];
  districts: CourtDistrict[];
  selectedState: string;
  selectedDistrict: string;
  onStateChange: (e: SelectChangeEvent) => void;
  onDistrictChange: (v: string) => void;
}

function StateDistrictSelects({
  states, districts, selectedState, selectedDistrict, onStateChange, onDistrictChange,
}: StateDistrictSelectsProps) {
  const selectSx = {
    borderRadius: "10px",
    bgcolor: "white",
    fontSize: "0.875rem",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.18)" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#6366f1" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#6366f1" },
  };
  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Typography component="label" sx={labelSx}>State</Typography>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <Select
            value={selectedState}
            onChange={onStateChange}
            displayEmpty
            renderValue={(v) =>
              v === "" ? (
                <span style={{ color: "rgba(0,0,0,0.38)", fontSize: "0.875rem" }}>Select state</span>
              ) : (
                states.find((s) => s.code === v)?.name ?? v
              )
            }
            sx={selectSx}
          >
            <MenuItem value="" sx={{ fontSize: "0.875rem", color: "rgba(0,0,0,0.38)" }}>Select state</MenuItem>
            {[...states].sort((a, b) => a.name.localeCompare(b.name)).map((state) => (
              <MenuItem key={state.code} value={state.code} sx={{ fontSize: "0.875rem" }}>{state.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Typography component="label" sx={labelSx}>District</Typography>
        <FormControl size="small" sx={{ minWidth: 220 }} disabled={!selectedState}>
          <Select
            value={selectedDistrict}
            onChange={(e) => onDistrictChange(e.target.value)}
            displayEmpty
            renderValue={(v) =>
              v === "" ? (
                <span style={{ color: "rgba(0,0,0,0.38)", fontSize: "0.875rem" }}>Select district</span>
              ) : (
                districts.find((d) => d.code === v)?.name ?? v
              )
            }
            sx={{ ...selectSx, bgcolor: selectedState ? "white" : undefined }}
          >
            <MenuItem value="" sx={{ fontSize: "0.875rem", color: "rgba(0,0,0,0.38)" }}>Select district</MenuItem>
            {districts.map((d) => (
              <MenuItem key={d.code} value={d.code} sx={{ fontSize: "0.875rem" }}>{d.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outlined"
      size="medium"
      startIcon={<RestartAltIcon sx={{ fontSize: "16px !important" }} />}
      onClick={onClick}
      sx={{
        textTransform: "none",
        fontWeight: 600,
        fontSize: "0.85rem",
        borderRadius: "10px",
        px: 2,
        py: "7px",
        borderColor: "rgba(0,0,0,0.18)",
        color: "text.secondary",
        "&:hover": { borderColor: "#6366f1", color: "#6366f1", bgcolor: "rgba(99,102,241,0.04)" },
      }}
    >
      Reset
    </Button>
  );
}

function CaseResultCard({ result, orgId }: { result: EcourtsSearchResult; orgId: string }) {
  const router = useRouter();
  const isDisposed = result.caseStatus?.toUpperCase() === "DISPOSED";

  return (
    <Box
      onClick={() => router.push(`/organization/${orgId}/ecourt/${result.cnr}`)}
      sx={{
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: "12px",
        bgcolor: "white",
        p: "14px 18px",
        cursor: "pointer",
        "&:hover": { borderColor: "rgba(99,102,241,0.4)", boxShadow: "0 2px 10px rgba(99,102,241,0.08)" },
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      {/* Top row: CNR + type + status */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1 }}>
        <Tooltip title="CNR Number">
          <Typography
            sx={{ fontFamily: "monospace", fontSize: "0.78rem", fontWeight: 700, color: "#6366f1", letterSpacing: "0.03em" }}
          >
            {result.cnr}
          </Typography>
        </Tooltip>
        {result.caseType && result.caseType !== "UNKNOWN" && (
          <Chip
            label={result.caseType}
            size="small"
            sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, bgcolor: "rgba(99,102,241,0.08)", color: "#6366f1", borderRadius: "6px" }}
          />
        )}
        {result.registrationNumber && (
          <Typography sx={{ fontSize: "0.72rem", color: "text.disabled" }}>#{result.registrationNumber}</Typography>
        )}
        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
          <LinkCaseButton orgId={orgId} cnrNumber={result.cnr} label="Link to Case" />
          <Chip
            label={isDisposed ? "Disposed" : "Pending"}
            size="small"
            sx={{
              height: 20,
              fontSize: "0.68rem",
              fontWeight: 700,
              borderRadius: "6px",
              bgcolor: isDisposed ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
              color: isDisposed ? "#059669" : "#d97706",
            }}
          />
        </Box>
      </Box>

      {/* Parties */}
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1, flexWrap: "wrap" }}>
        <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary" }}>
          {result.petitioners.join(", ")}
        </Typography>
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "text.disabled", flexShrink: 0 }}>vs</Typography>
        <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary" }}>
          {result.respondents.join(", ")}
        </Typography>
      </Box>

      {/* Meta row */}
      <Divider sx={{ my: 1, borderColor: "rgba(0,0,0,0.05)" }} />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "10px 24px" }}>
        <MetaItem icon={<AccountBalanceIcon />} label="Court" value={result.courtCode} />
        {result.judges.length > 0 && (
          <MetaItem icon={<GavelIcon />} label="Judge" value={result.judges.join(", ")} />
        )}
        {result.petitionerAdvocates.length > 0 && (
          <MetaItem icon={<PersonPinIcon />} label="Advocate" value={result.petitionerAdvocates.join(", ")} />
        )}
        <MetaItem icon={<CalendarTodayIcon />} label="Filed" value={formatDisplayDate(result.filingDate)} />
        {result.decisionDate && (
          <MetaItem icon={<CalendarTodayIcon />} label="Decided" value={formatDisplayDate(result.decisionDate)} />
        )}
        {!result.decisionDate && result.nextHearingDate && (
          <MetaItem icon={<CalendarTodayIcon />} label="Next Hearing" value={formatDisplayDate(result.nextHearingDate)} />
        )}
        {result.judicialSection && result.judicialSection !== "UNKNOWN" && (
          <MetaItem icon={<LocationOnIcon />} label="Section" value={result.judicialSection} />
        )}
      </Box>
      {result.caseCategory && (
        <Typography sx={{ mt: 1, fontSize: "0.7rem", color: "text.disabled", lineHeight: 1.4 }}>
          {result.caseCategory}
        </Typography>
      )}
    </Box>
  );
}

function MetaItem({ icon, label, value }: { icon: React.ReactElement; label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", fontSize: "12px", color: "text.disabled", "& svg": { fontSize: "12px" } }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", fontWeight: 600 }}>{label}:</Typography>
      <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{value}</Typography>
    </Box>
  );
}

// ── CNR Detail ────────────────────────────────────────────────────────────────

function CnrResultDetail({ response, orgId }: { response: CourtDataApiResponse; orgId: string }) {
  const router = useRouter();
  const c = response.data.courtCaseData;
  const desc = response.data.descriptions;
  const isDisposed = c.caseStatus?.toUpperCase() === "DISPOSED";

  const caseTypeLabel = desc.enumLookup.caseType?.[c.caseType] ?? c.caseTypeRaw ?? c.caseType;
  const statusLabel   = desc.enumLookup.caseStatus?.[c.caseStatus] ?? c.caseStatus;

  const statChip = (label: string, value: number, color: string) => (
    <Box sx={{ textAlign: "center", px: 2, py: 1, borderRadius: "10px", bgcolor: color }}>
      <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: "text.primary", lineHeight: 1 }}>{value}</Typography>
      <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", mt: 0.25 }}>{label}</Typography>
    </Box>
  );

  return (
    <Box sx={{ border: "1px solid rgba(99,102,241,0.2)", borderRadius: "14px", bgcolor: "white", overflow: "hidden" }}>

      {/* Header */}
      <Box sx={{ px: 3, py: 2, bgcolor: "rgba(99,102,241,0.04)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Typography sx={{ fontFamily: "monospace", fontSize: "0.9rem", fontWeight: 800, color: "#6366f1", letterSpacing: "0.03em" }}>
            {c.cnr}
          </Typography>
          <Chip label={caseTypeLabel} size="small"
            sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, bgcolor: "rgba(99,102,241,0.1)", color: "#6366f1", borderRadius: "6px" }} />
          <Chip
            label={statusLabel}
            size="small"
            sx={{
              height: 20, fontSize: "0.68rem", fontWeight: 700, borderRadius: "6px",
              bgcolor: isDisposed ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
              color: isDisposed ? "#059669" : "#d97706",
            }}
          />
          {c.purpose && (
            <Typography sx={{ fontSize: "0.72rem", color: "text.disabled" }}>
              Purpose: <strong>{c.purpose}</strong>
            </Typography>
          )}
          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
            <LinkCaseButton orgId={orgId} cnrNumber={c.cnr} label="Link to Case" />
            <Button
              size="small"
              variant="contained"
              onClick={() => router.push(`/organization/${orgId}/ecourt/${c.cnr}`)}
              sx={{
                textTransform: "none", fontWeight: 600, fontSize: "0.78rem",
                borderRadius: "8px", px: 1.5, py: 0.5,
                bgcolor: "#6366f1", boxShadow: "none",
                "&:hover": { bgcolor: "#4f46e5" },
              }}
            >
              View Details
            </Button>
          </Box>
        </Box>
        <Typography sx={{ mt: 0.75, fontSize: "0.82rem", fontWeight: 600, color: "text.primary" }}>{c.courtName}</Typography>
        {c.district && (
          <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{c.district}{c.state ? `, ${c.state}` : ""}</Typography>
        )}
      </Box>

      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>

        {/* Parties */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.75 }}>
              Petitioner(s)
            </Typography>
            {c.petitioners.map((p, i) => (
              <Typography key={i} sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.primary" }}>{p}</Typography>
            ))}
            {c.petitionerAdvocates.length > 0 && (
              <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mt: 0.5 }}>
                Adv: {c.petitionerAdvocates.join(", ")}
              </Typography>
            )}
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.75 }}>
              Respondent(s)
            </Typography>
            {c.respondents.map((r, i) => (
              <Typography key={i} sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.primary" }}>{r}</Typography>
            ))}
            {c.respondentAdvocates.length > 0 && (
              <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mt: 0.5 }}>
                Adv: {c.respondentAdvocates.join(", ")}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ borderColor: "rgba(0,0,0,0.05)" }} />

        {/* Timeline + Stats */}
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          {/* Timeline */}
          <Box sx={{ flex: 1, minWidth: 220 }}>
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1 }}>
              Timeline
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6 }}>
              <DateRow label="Filing"        value={c.filingDate}        reg={c.filingNumber} />
              <DateRow label="Registration"  value={c.registrationDate}  reg={c.registrationNumber} />
              <DateRow label="First Hearing" value={c.firstHearingDate} />
              <DateRow label="Last Hearing"  value={c.lastHearingDate} />
              {!isDisposed && c.nextHearingDate && (
                <DateRow label="Next Hearing" value={c.nextHearingDate} highlight />
              )}
              {isDisposed && c.decisionDate && (
                <DateRow label="Decision" value={c.decisionDate} highlight />
              )}
            </Box>
            {c.caseDurationDays > 0 && (
              <Typography sx={{ mt: 1, fontSize: "0.72rem", color: "text.disabled" }}>
                Duration: <strong>{c.caseDurationDays} days</strong>
                {c.filingToFirstHearingDays > 0 && ` · ${c.filingToFirstHearingDays}d to first hearing`}
              </Typography>
            )}
          </Box>

          {/* Stats */}
          <Box>
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1 }}>
              Activity
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {statChip("Hearings",  c.hearingCount,      "rgba(99,102,241,0.06)")}
              {statChip("Orders",    c.orderCount,        "rgba(16,185,129,0.06)")}
              {statChip("Judgments", c.judgmentCount,     "rgba(245,158,11,0.06)")}
              {statChip("IAs",       c.iaCount,           "rgba(239,68,68,0.06)")}
              {statChip("Interim",   c.interimOrderCount, "rgba(139,92,246,0.06)")}
            </Box>
          </Box>
        </Box>

      </Box>
    </Box>
  );
}

function DateRow({ label, value, reg, highlight }: { label: string; value: string | null; reg?: string; highlight?: boolean }) {
  if (!value) return null;
  return (
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
      <Typography sx={{ fontSize: "0.68rem", color: "text.disabled", fontWeight: 700, minWidth: 100 }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.78rem", fontWeight: highlight ? 700 : 500, color: highlight ? "#6366f1" : "text.primary" }}>
        {formatDisplayDate(value)}
      </Typography>
      {reg && <Typography sx={{ fontSize: "0.68rem", color: "text.disabled" }}>({reg})</Typography>}
    </Box>
  );
}
