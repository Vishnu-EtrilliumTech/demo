"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  User as UserIcon,
  FileText,
  Building,
  Loader2,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import debounce from "lodash.debounce";
import {
  fetchOrganizationUsers,
  fetchSiteUsers,
  fetchSiteCases,
  fetchOrganizationCases,
  fetchOrganizationSites,
  fetchOrganizationUserSites,
} from "@/app/organization/services/api";
import { User, Case, Site } from "@/app/organization/types";
import { useUserRole } from "@/hooks/useUserRole";

interface HeaderSearchProps {
  organizationId: string;
}

interface SearchResult {
  type: "user" | "case" | "site";
  id: string | number;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  siteId?: string;
}

type SearchFunction = (term: string) => Promise<SearchResult[]>;

export default function HeaderSearch({ organizationId }: HeaderSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isOrganizationAdmin, isOrganizationClerk, currentUserId } =
    useUserRole(organizationId);
  const isOrgLevel = isOrganizationAdmin || isOrganizationClerk;

  // Extract siteId from pathname if available
  // Pattern: /organization/[id]/sites/[siteId]/...
  const getSiteIdFromPathname = useCallback((): string | undefined => {
    const match = pathname.match(/\/organization\/[^/]+\/sites\/([^/]+)/);
    return match ? match[1] : undefined;
  }, [pathname]);

  const pathSiteId = getSiteIdFromPathname();

  // Site-level users (SiteAdmin/SiteClerk/etc.) can't call org-wide endpoints
  // (403). Pages like /organization/{id}/users or /cases don't carry a siteId
  // in the URL, so resolve the user's own site once and fall back to it
  // whenever the pathname doesn't already tell us the site.
  const [ownSites, setOwnSites] = useState<Site[]>([]);
  const [ownSitesLoaded, setOwnSitesLoaded] = useState(false);

  useEffect(() => {
    if (isOrgLevel || !currentUserId || !organizationId) return;
    setOwnSitesLoaded(false);
    fetchOrganizationUserSites(organizationId, currentUserId)
      .then((page) => setOwnSites(page.items))
      .catch((err) => console.error("Error resolving user's site:", err))
      .finally(() => setOwnSitesLoaded(true));
  }, [isOrgLevel, currentUserId, organizationId]);

  const ownSiteId = ownSites[0]?.id ? String(ownSites[0].id) : undefined;
  const siteId = pathSiteId || (isOrgLevel ? undefined : ownSiteId);
  // True once we know whether a site-level user's own site has resolved (or
  // they turned out to be org-level), so searches don't fire prematurely
  // against an org-wide endpoint the user isn't authorized to call.
  const scopeReady = isOrgLevel || !!pathSiteId || ownSitesLoaded;

  // Fetch and filter users
  const searchUsers = useCallback(
    async (term: string): Promise<SearchResult[]> => {
      if (!term.trim() || !organizationId) return [];
      if (!scopeReady) return [];
      try {
        const users = siteId
          ? (await fetchSiteUsers(organizationId, siteId)).items
          : (await fetchOrganizationUsers(organizationId)).items;
        const searchLower = term.toLowerCase();
        return users
          .filter(
            (user: User) =>
              user.fullName?.toLowerCase().includes(searchLower) ||
              user.emailId?.toLowerCase().includes(searchLower),
          )
          .slice(0, 5)
          .map((user: User) => ({
            type: "user" as const,
            id: user.id,
            title: user.fullName,
            subtitle: user.emailId,
            icon: <UserIcon size={16} className="text-slate-400" />,
            siteId: user.siteId,
          }));
      } catch (err) {
        console.error("Error searching users:", err);
        return [];
      }
    },
    [organizationId, siteId, scopeReady],
  );

  // Fetch and filter cases
  const searchCases = useCallback(
    async (term: string): Promise<SearchResult[]> => {
      if (!term.trim() || !organizationId) return [];
      if (!scopeReady) return [];
      try {
        const cases = siteId
          ? (await fetchSiteCases(organizationId, siteId)).items
          : (await fetchOrganizationCases(organizationId)).items;
        const searchLower = term.toLowerCase();
        return cases
          .filter(
            (caseItem: Case) =>
              caseItem.title?.toLowerCase().includes(searchLower) ||
              (caseItem.caseNumber || "")
                .toString()
                .toLowerCase()
                .includes(searchLower) ||
              (caseItem.caseKey || "").toLowerCase().includes(searchLower),
          )
          .slice(0, 5)
          .map((caseItem: Case) => ({
            type: "case" as const,
            id: caseItem.id,
            title: caseItem.title,
            subtitle: caseItem.caseKey
              ? `${caseItem.caseKey} · Case #${caseItem.caseNumber}`
              : `Case #${caseItem.caseNumber}`,
            icon: <FileText size={16} className="text-slate-400" />,
            siteId: caseItem.siteId,
          }));
      } catch (err) {
        console.error("Error searching cases:", err);
        return [];
      }
    },
    [organizationId, siteId, scopeReady],
  );

  // Fetch and filter sites. Site-level users can't call the org-wide sites
  // endpoint (403), so they search within the site(s) they belong to instead.
  const searchSites = useCallback(
    async (term: string): Promise<SearchResult[]> => {
      if (!term.trim() || !organizationId) return [];
      if (!isOrgLevel) {
        const searchLower = term.toLowerCase();
        return ownSites
          .filter(
            (site: Site) =>
              (site.name?.toLowerCase() || "").includes(searchLower) ||
              (site.emailId?.toLowerCase() || "").includes(searchLower) ||
              (site.phoneNumber?.toString() || "").includes(term) ||
              (site.address?.toLowerCase() || "").includes(searchLower) ||
              (site.locality?.toLowerCase() || "").includes(searchLower) ||
              (site.pincode?.toString() || "").includes(term) ||
              (site.description?.toLowerCase() || "").includes(searchLower),
          )
          .slice(0, 5)
          .map((site: Site) => ({
            type: "site" as const,
            id: site.id,
            title: site.name,
            subtitle: site.address || site.locality,
            icon: <Building size={16} className="text-slate-400" />,
          }));
      }
      try {
        const sites = (await fetchOrganizationSites(organizationId)).items;
        const searchLower = term.toLowerCase();
        return sites
          .filter(
            (site: Site) =>
              (site.name?.toLowerCase() || "").includes(searchLower) ||
              (site.emailId?.toLowerCase() || "").includes(searchLower) ||
              (site.phoneNumber?.toString() || "").includes(term) ||
              (site.address?.toLowerCase() || "").includes(searchLower) ||
              (site.locality?.toLowerCase() || "").includes(searchLower) ||
              (site.pincode?.toString() || "").includes(term) ||
              (site.description?.toLowerCase() || "").includes(searchLower),
          )
          .slice(0, 5)
          .map((site: Site) => ({
            type: "site" as const,
            id: site.id,
            title: site.name,
            subtitle: site.address || site.locality,
            icon: <Building size={16} className="text-slate-400" />,
          }));
      } catch (err) {
        console.error("Error searching sites:", err);
        return [];
      }
    },
    [organizationId, isOrgLevel, ownSites],
  );

  // Debounced search function
  const [debouncedSearch] = useState(() =>
    debounce(
      async (
        term: string,
        searchUsersFunc: SearchFunction,
        searchCasesFunc: SearchFunction,
        searchSitesFunc: SearchFunction,
      ) => {
        if (!term.trim()) {
          setResults([]);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          const [userResults, caseResults, siteResults] = await Promise.all([
            searchUsersFunc(term),
            searchCasesFunc(term),
            searchSitesFunc(term),
          ]);

          const combined = [...userResults, ...caseResults, ...siteResults];
          setResults(combined);

          if (combined.length === 0) {
            setError("No users, cases, or sites found");
          }
        } catch (err) {
          console.error("Search error:", err);
          setError("Error searching");
        } finally {
          setIsLoading(false);
        }
      },
      300,
    ),
  );

  // Handle search input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);

    if (value.trim()) {
      setIsLoading(true);
      debouncedSearch(value, searchUsers, searchCases, searchSites);
    } else {
      setResults([]);
      setIsLoading(false);
      setError(null);
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    if (result.type === "user") {
      const params = new URLSearchParams({
        userId: String(result.id),
        organizationId,
        name: result.title,
        ...(result.subtitle ? { email: result.subtitle } : {}),
        ...(result.siteId ? { siteId: result.siteId } : {}),
      });
      router.push(`/profile?${params.toString()}`);
    } else if (result.type === "case") {
      const currentSiteId = getSiteIdFromPathname() || result.siteId;
      if (currentSiteId) {
        router.push(
          `/organization/${organizationId}/sites/${currentSiteId}/cases/${result.id}`,
        );
      }
    } else if (result.type === "site") {
      router.push(`/organization/${organizationId}/sites/${result.id}`);
    }
    setIsOpen(false);
    setSearchTerm("");
    setResults([]);
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Group results by type
  const groupedResults = {
    users: results.filter((r) => r.type === "user"),
    cases: results.filter((r) => r.type === "case"),
    sites: results.filter((r) => r.type === "site"),
  };

  return (
    <div className="relative flex-1 max-w-md" ref={searchRef}>
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search cases, users, sites..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => searchTerm && setIsOpen(true)}
          className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 text-slate-700 placeholder-slate-400 transition-all"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 size={13} className="text-slate-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (searchTerm || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 z-50 max-h-96 overflow-y-auto">
          {isLoading && results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              <Loader2 size={16} className="inline animate-spin mr-2" />
              Searching...
            </div>
          ) : error && results.length === 0 ? (
            <div className="px-4 py-4 text-center text-sm text-slate-400">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-4 text-center text-sm text-slate-400">
              Start typing to search
            </div>
          ) : (
            <>
              {/* Users Section */}
              {groupedResults.users.length > 0 && (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-50 sticky top-0">
                    USERS
                  </div>
                  {groupedResults.users.map((result) => (
                    <button
                      key={`user-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-start gap-3"
                    >
                      <div className="flex-shrink-0 mt-1">{result.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-700 truncate">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-xs text-slate-500 truncate">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Cases Section */}
              {groupedResults.cases.length > 0 && (
                <>
                  {groupedResults.users.length > 0 && (
                    <div className="border-t border-slate-200" />
                  )}
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-50 sticky top-0">
                    CASES
                  </div>
                  {groupedResults.cases.map((result) => (
                    <button
                      key={`case-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-start gap-3"
                    >
                      <div className="flex-shrink-0 mt-1">{result.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-700 truncate">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-xs text-slate-500 truncate">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Sites Section */}
              {groupedResults.sites.length > 0 && (
                <>
                  {(groupedResults.users.length > 0 ||
                    groupedResults.cases.length > 0) && (
                    <div className="border-t border-slate-200" />
                  )}
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-50 sticky top-0">
                    SITES
                  </div>
                  {groupedResults.sites.map((result) => (
                    <button
                      key={`site-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-start gap-3"
                    >
                      <div className="flex-shrink-0 mt-1">{result.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-700 truncate">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-xs text-slate-500 truncate">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
