"use client";

import { useEffect, useState } from "react";
import { Search, UploadCloud, CheckCircle2, AlertCircle, Link2 } from "lucide-react";
import { Button, Field, Input, Select, LoadingState } from "@/design-system";
import { searchEcourts, type EcourtsSearchResult } from "@/app/organization/services/ecourtapi";
import { importEcourtsCases } from "@/app/organization/services/calendarApi";
import { fetchOrganizationSites } from "@/app/organization/services/api";
import type { Site } from "@/app/organization/types";
import type { EcourtsImportRowResult } from "@/app/organization/types/calendarTypes";

interface BulkImportPanelProps {
  organizationId: string;
}

/**
 * Onboarding bulk import: search eCourts by advocate name (the existing
 * advocate search type, see research.md R3), multi-select results via
 * checkboxes, and import them in one action with a per-row result
 * (Created / Already Linked / Error) — independent of any single row's
 * outcome (spec.md User Story 4).
 */
export default function BulkImportPanel({ organizationId }: BulkImportPanelProps) {
  const [advocateName, setAdvocateName] = useState("");
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState("");
  const [results, setResults] = useState<EcourtsSearchResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<Record<string, EcourtsImportRowResult>>({});

  useEffect(() => {
    fetchOrganizationSites(organizationId, { pageSize: 100 })
      .then((p) => {
        setSites(p.items);
        if (p.items[0]) setSiteId(String(p.items[0].id));
      })
      .catch(() => setSites([]));
  }, [organizationId]);

  const handleSearch = async () => {
    if (!advocateName.trim()) return;
    setIsSearching(true);
    setImportResults({});
    setSelected(new Set());
    try {
      const page = await searchEcourts(organizationId, { searchType: "advocates", searchValue: advocateName.trim() });
      setResults(page.items);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelected = (cnr: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cnr)) next.delete(cnr);
      else next.add(cnr);
      return next;
    });
  };

  const handleImport = async () => {
    if (!siteId || selected.size === 0) return;
    setIsImporting(true);
    try {
      const response = await importEcourtsCases(organizationId, siteId, Array.from(selected));
      const byId: Record<string, EcourtsImportRowResult> = {};
      response.results.forEach((r) => {
        byId[r.cnrNumber] = r;
      });
      setImportResults(byId);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 0" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <Field label="Advocate name">
          <Input
            value={advocateName}
            onChange={(e) => setAdvocateName(e.target.value)}
            placeholder="Search eCourts by advocate name"
          />
        </Field>
        <Field label="Import into Site">
          <Select value={siteId} onChange={(e) => setSiteId(e.target.value)}>
            {sites.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Button variant="primary" icon={Search} loading={isSearching} onClick={handleSearch}>
          Search
        </Button>
      </div>

      {isSearching ? (
        <LoadingState message="Searching eCourts…" />
      ) : results.length > 0 ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {results.map((r) => {
              const result = importResults[r.cnr];
              return (
                <label
                  key={r.cnr}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                    padding: "8px 10px",
                    border: "1px solid var(--border, #e2e2e2)",
                    borderRadius: 6,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(r.cnr)}
                    onChange={() => toggleSelected(r.cnr)}
                    disabled={!!result}
                  />
                  <span style={{ flex: 1 }}>
                    <b>{r.petitioners.join(", ")}</b> vs. {r.respondents.join(", ")}
                    <span style={{ opacity: 0.6 }}> — CNR {r.cnr}</span>
                  </span>
                  {result && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        color:
                          result.status === "Created" ? "#2e7d32" : result.status === "AlreadyLinked" ? "#ed6c02" : "#d32f2f",
                      }}
                    >
                      {result.status === "Created" && <CheckCircle2 width={14} height={14} />}
                      {result.status === "AlreadyLinked" && <Link2 width={14} height={14} />}
                      {result.status === "Error" && <AlertCircle width={14} height={14} />}
                      {result.status === "Created" ? "Created" : result.status === "AlreadyLinked" ? "Already Linked" : "Error"}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          <div>
            <Button
              variant="primary"
              icon={UploadCloud}
              loading={isImporting}
              disabled={selected.size === 0 || !siteId}
              onClick={handleImport}
            >
              Import selected ({selected.size})
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
