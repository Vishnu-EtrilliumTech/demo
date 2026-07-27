"use client";

import React, { use, useState, useEffect, useCallback, useMemo } from "react";
import { useHasScrollbar } from "@/hooks/useHasScrollbar";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";

import { useUserRole } from "@/hooks/useUserRole";
import {
  fetchOrganizationCases,
  fetchSiteCases,
  fetchOrganizationUsers,
  fetchSiteUsers,
  fetchOrganizationUserSites,
  fetchOrganizationSites,
} from "@/app/organization/services/api";
import { Case, CaseStatus, User, Site } from "@/app/organization/types";
import type {
  CaseListFilters,
  SiteCaseListFilters,
} from "@/app/organization/types/listFilterTypes";
import AddCaseModal from "@/components/modals/AddCaseModal";
import { useToast } from "@/contexts/ToastContext";
import { useListQuery } from "@/hooks/useListQuery";
import ListFooterPager from "@/components/ListFooterPager";
import type { PagedResponse } from "@/types/pagination";
import {
  EnumSelectFilter,
  TextSearchFilter,
  EntityRefFilter,
} from "@/components/filters";
import { classifyListError } from "@/utils/errorHandler";

const CasesTable = dynamic(
  () => import("@/app/organization/components/CasesTable"),
  { ssr: false },
);

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_ORDER: Record<string, number> = {
  [CaseStatus.Open]: 0,
  [CaseStatus.InProgress]: 1,
  [CaseStatus.OnHold]: 2,
  [CaseStatus.Closed]: 3,
};

const STATUS_OPTIONS = [
  { value: CaseStatus.Open, label: "Open" },
  { value: CaseStatus.InProgress, label: "In Progress" },
  { value: CaseStatus.OnHold, label: "On Hold" },
  { value: CaseStatus.Closed, label: "Closed" },
];

export default function CasesPage({ params }: PageProps) {
  const hasScrollbar = useHasScrollbar();
  const resolvedParams = use(params);
  const organizationId = resolvedParams.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError } = useToast();

  const siteIdFromQuery = searchParams.get("siteId");

  const {
    isOrganizationAdmin,
    isSiteAdmin,
    isSiteClerk,
    isSiteSrLegalExpert,
    isSiteLegalExpert,
    canEditCases,
    currentUserId,
    isLoading: roleLoading,
  } = useUserRole(organizationId);

  const isOrgMode = isOrganizationAdmin;
  const isSiteMode =
    isSiteAdmin || isSiteClerk || isSiteSrLegalExpert || isSiteLegalExpert;

  // ── Server-driven paging + sorting + filtering (US2/US3/US4) ────────────
  const {
    params: listParams,
    state: listState,
    setPage,
    setPageSize,
    setSort,
    clearSort,
    setFilter,
    clearFilters,
  } = useListQuery<CaseListFilters>({
    defaultSort: { sortBy: "createdDate", sortDirection: "desc" },
    sortableFields: ["createdDate", "title", "caseNumber", "status"],
    filterKeys: ["status", "siteId", "assignedExpertId", "clientId", "search"],
  });

  const [casesMeta, setCasesMeta] = useState<PagedResponse<Case> | null>(null);
  const [allCases, setAllCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [isLoadingCases, setIsLoadingCases] = useState(false);
  const [addCaseModalOpen, setAddCaseModalOpen] = useState(false);

  const sortByStatus = useCallback((cases: Case[]) =>
    [...cases].sort(
      (a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99),
    ), []);

  // ── Data fetching ───────────────────────────────────────────────────────
  const loadCases = useCallback(async () => {
    if (roleLoading) return;
    setIsLoadingCases(true);
    try {
      if (siteIdFromQuery) {
        setSiteId(siteIdFromQuery);
        const siteCaseParams = listParams as typeof listParams & SiteCaseListFilters;
        const [casesPage, siteUsersPage] = await Promise.all([
          fetchSiteCases(organizationId, siteIdFromQuery, siteCaseParams),
          fetchSiteUsers(organizationId, siteIdFromQuery),
        ]);
        setAllCases(sortByStatus(casesPage.items));
        setCasesMeta(casesPage);
        setUsers(siteUsersPage.items);
        return;
      }

      if (isOrgMode) {
        const [casesPage, orgUsersPage, sitesPage] = await Promise.all([
          fetchOrganizationCases(organizationId, listParams),
          fetchOrganizationUsers(organizationId),
          fetchOrganizationSites(organizationId),
        ]);
        setAllCases(sortByStatus(casesPage.items));
        setCasesMeta(casesPage);
        setUsers(orgUsersPage.items);
        setSites(sitesPage.items);
        setSiteId(null);
      } else if (isSiteMode && currentUserId) {
        const sitesPage = await fetchOrganizationUserSites(organizationId, currentUserId);
        const resolvedSiteId = sitesPage.items[0]?.id ? String(sitesPage.items[0].id) : null;
        if (!resolvedSiteId) {
          setAllCases([]);
          setSiteId(null);
          return;
        }
        setSiteId(resolvedSiteId);
        const siteCaseParams = listParams as typeof listParams & SiteCaseListFilters;
        const [casesPage, siteUsersPage] = await Promise.all([
          fetchSiteCases(organizationId, resolvedSiteId, siteCaseParams),
          fetchSiteUsers(organizationId, resolvedSiteId),
        ]);
        setAllCases(sortByStatus(casesPage.items));
        setCasesMeta(casesPage);
        setUsers(siteUsersPage.items);
      }
    } catch (error) {
      const info = classifyListError(error);
      if (info.kind === "invalid-filter") {
        showError(info.messages[0] ?? "Invalid filter — please adjust and try again.");
        // Preserve last valid list (FR-015): don't clear allCases here.
      } else if (info.kind === "not-found") {
        setAllCases([]);
        setCasesMeta(null);
      } else if (info.kind === "forbidden") {
        console.error("Failed to load cases (403 Forbidden):", error);
        showError("You do not have permission to view cases for this organization.");
        setAllCases([]);
      } else if (info.kind === "auth") {
        console.error("Failed to load cases (401 Unauthorized):", error);
        showError("Session expired — please refresh the page.");
        setAllCases([]);
      } else {
        console.error("Failed to load cases:", error);
        setAllCases([]);
        if (siteIdFromQuery) showError("Unable to load cases for the specified site.");
      }
    } finally {
      setIsLoadingCases(false);
    }
  }, [
    isOrgMode,
    isSiteMode,
    currentUserId,
    organizationId,
    roleLoading,
    siteIdFromQuery,
    listParams,
    showError,
    sortByStatus,
  ]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleCaseClick = useCallback((c: Case) => {
    if (!c.siteId) return;
    router.push(`/organization/${organizationId}/sites/${c.siteId}/cases/${c.id}`);
  }, [router, organizationId]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  // siteId in the URL is used for navigation (site mode); only treat it as an
  // "active filter" when there is no navigation siteId (org mode).
  const hasActiveFilters =
    !!listState.filters.status ||
    (!siteIdFromQuery && !!listState.filters.siteId) ||
    !!listState.filters.assignedExpertId ||
    !!listState.filters.clientId ||
    !!listState.filters.search;

  // Safe clear: preserve the navigation siteId in site mode.
  const handleClearFilters = useCallback(() => {
    if (siteIdFromQuery) {
      setFilter("status", undefined);
      setFilter("search", undefined);
      setFilter("assignedExpertId", undefined);
      setFilter("clientId", undefined);
    } else {
      clearFilters();
    }
  }, [siteIdFromQuery, setFilter, clearFilters]);

  const siteOptions = useMemo(
    () => sites.map((s) => ({ value: String(s.id), label: s.name })),
    [sites],
  );

  const assignedExpertOptions = useMemo(
    () => users.map((u) => ({ value: String(u.id), label: u.fullName })),
    [users],
  );

  const isLoading = roleLoading || isLoadingCases;

  return (
    <Box sx={{ pl: { xs: 2, sm: 3 }, pr: { xs: 2, sm: hasScrollbar ? 4 : 5 }, py: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexWrap: "wrap",
          gap: 1.5,
          background:
            "linear-gradient(135deg, rgba(20,184,166,0.08) 0%, rgba(59,130,246,0.05) 100%)",
          borderRadius: "16px",
          p: "16px 20px",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Cases
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            Manage all cases across sites
          </Typography>
        </Box>
        {canEditCases && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddCaseModalOpen(true)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "12px",
              px: 2.5,
              py: 1,
              background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
              "&:hover": {
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                boxShadow: "0 4px 12px rgba(59,130,246,0.35)",
              },
            }}
          >
            Add Case
          </Button>
        )}
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          p: "16px 20px",
          background: "white",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* Filter row */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2, alignItems: "center" }}>
          <TextSearchFilter
            placeholder={isOrgMode ? "Search by title, case number, site…" : "Search by title, case number…"}
            value={listState.filters.search}
            onChange={(v) => setFilter("search", v)}
            disabled={isLoadingCases}
          />
          <EnumSelectFilter
            label="Status"
            value={listState.filters.status}
            options={STATUS_OPTIONS}
            onChange={(v) => setFilter("status", v)}
            disabled={isLoadingCases}
          />
          {isOrgMode && siteOptions.length > 0 && (
            <EntityRefFilter
              label="Site"
              value={listState.filters.siteId}
              options={siteOptions}
              onChange={(v) => setFilter("siteId", v)}
              disabled={isLoadingCases}
            />
          )}
          {assignedExpertOptions.length > 0 && (
            <EntityRefFilter
              label="Assigned To"
              value={listState.filters.assignedExpertId}
              options={assignedExpertOptions}
              onChange={(v) => setFilter("assignedExpertId", v)}
              disabled={isLoadingCases}
            />
          )}
          {hasActiveFilters && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<FilterListOffIcon />}
              onClick={handleClearFilters}
              sx={{ borderRadius: "20px", textTransform: "none", fontSize: "0.8125rem" }}
            >
              Clear filters
            </Button>
          )}
        </Box>

        {/* Content */}
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 6 }}>
            <CircularProgress size={28} />
            <Typography sx={{ ml: 1.5 }} color="text.secondary">
              Loading cases…
            </Typography>
          </Box>
        ) : allCases.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <SearchOffIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No cases found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {hasActiveFilters
                ? "Try adjusting your filters."
                : "You don't have access to any cases yet. Cases appear here when you create them, are assigned to them, or are added as a contributor."}
            </Typography>
            {hasActiveFilters && (
              <Button
                size="small"
                variant="text"
                onClick={handleClearFilters}
                sx={{ mt: 1, textTransform: "none" }}
              >
                Clear all filters
              </Button>
            )}
          </Box>
        ) : (
          <>
            <CasesTable
              cases={allCases}
              users={users}
              showSiteColumn={isOrgMode}
              onCaseClick={handleCaseClick}
              sortBy={listState.sortBy}
              sortDirection={listState.sortDirection}
              onSort={setSort}
              onClearSort={clearSort}
            />
            {casesMeta && casesMeta.totalCount > 0 && (
              <ListFooterPager
                page={listState.page}
                pageSize={listState.pageSize}
                totalCount={casesMeta.totalCount}
                totalPages={casesMeta.totalPages}
                hasNextPage={casesMeta.hasNextPage}
                hasPreviousPage={casesMeta.hasPreviousPage}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                disabled={isLoadingCases}
              />
            )}
          </>
        )}
      </Paper>

      <AddCaseModal
        open={addCaseModalOpen}
        onClose={() => setAddCaseModalOpen(false)}
        onSuccess={loadCases}
        organizationId={organizationId}
        isOrgMode={isOrgMode}
        siteId={siteId}
      />


    </Box>
  );
}
