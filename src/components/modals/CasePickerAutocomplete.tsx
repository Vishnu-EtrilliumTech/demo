"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search, FolderPlus, X } from "lucide-react";
import { Input, Spinner } from "@/design-system";
import type { Case } from "@/app/organization/types";
import { fetchOrganizationCases, fetchSiteCases } from "@/app/organization/services/api";
import QuickAddCaseDialog from "@/app/organization/components/cases/QuickAddCaseDialog";

interface CasePickerAutocompleteProps {
  organizationId: string;
  /** When provided, search is scoped to this Site; otherwise the whole Organization. */
  siteId?: string;
  /** The currently-selected case, if any (controlled). */
  value: Case | null;
  onSelect: (selected: Case) => void;
  placeholder?: string;
}

const S = {
  wrap: {} as React.CSSProperties,
  // Rendered in normal document flow (not absolute/fixed) so it pushes
  // sibling content down and grows its ancestor Dialog's height, rather than
  // floating over the modal and getting clipped by the dialog body's
  // `overflow-y: auto` when the dialog is short. Capped at maxHeight with its
  // own scroll so a large result set doesn't blow up the dialog indefinitely.
  dropdown: {
    marginTop: 4,
    background: "var(--surface, #fff)",
    border: "1px solid var(--border, #e2e2e2)",
    borderRadius: "var(--r-sm, 6px)",
    boxShadow: "var(--sh, 0 2px 8px rgba(0,0,0,0.08))",
    maxHeight: 260,
    overflowY: "auto",
  } as React.CSSProperties,
  option: {
    display: "block",
    width: "100%",
    textAlign: "left",
    border: 0,
    background: "transparent",
    font: "inherit",
    fontSize: 13,
    padding: "8px 10px",
    cursor: "pointer",
  } as React.CSSProperties,
  createOption: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    width: "100%",
    textAlign: "left",
    border: 0,
    borderTop: "1px solid var(--border, #e2e2e2)",
    background: "transparent",
    font: "inherit",
    fontSize: 13,
    padding: "8px 10px",
    cursor: "pointer",
    color: "var(--primary, #1a56db)",
  } as React.CSSProperties,
  selectedChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid var(--border, #e2e2e2)",
    borderRadius: 6,
    padding: "6px 8px",
    fontSize: 13,
  } as React.CSSProperties,
};

/**
 * Async case search within the current org/site. If nothing matches the typed
 * query, an inline "Case not found — create new case" option opens
 * QuickAddCaseDialog seeded to its manual-entry step; the newly created case
 * is auto-selected on success. Shared by the Hearing "+Add" flow and the
 * optional case-link picker on Note/Task modals.
 */
export function CasePickerAutocomplete({
  organizationId,
  siteId,
  value,
  onSelect,
  placeholder = "Search cases by title or case number...",
}: CasePickerAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const runSearch = (text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const page = siteId
          ? await fetchSiteCases(organizationId, siteId, { pageSize: 20 })
          : await fetchOrganizationCases(organizationId, { pageSize: 20 });
        const needle = text.trim().toLowerCase();
        const matches = needle
          ? page.items.filter(
              (c) =>
                c.title.toLowerCase().includes(needle) ||
                c.caseNumber.toLowerCase().includes(needle),
            )
          : page.items;
        setResults(matches);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleChange = (text: string) => {
    setQuery(text);
    setOpen(true);
    runSearch(text);
  };

  const handlePick = (c: Case) => {
    onSelect(c);
    setQuery("");
    setOpen(false);
    setResults([]);
  };

  if (value) {
    return (
      <span style={S.selectedChip}>
        {value.title} ({value.caseNumber})
        <button
          type="button"
          aria-label="Clear selected case"
          onClick={() => onSelect(null as unknown as Case)}
          style={{ border: 0, background: "transparent", cursor: "pointer", display: "inline-flex" }}
        >
          <X width={14} height={14} aria-hidden />
        </button>
      </span>
    );
  }

  return (
    <div style={S.wrap} ref={wrapRef}>
      <Input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
      />
      {open && query.trim() && (
        <div style={S.dropdown} role="listbox">
          {loading && (
            <div style={{ padding: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <Spinner size="sm" /> Searching...
            </div>
          )}
          {!loading &&
            results.map((c) => (
              <button key={c.id} type="button" role="option" aria-selected={false} style={S.option} onClick={() => handlePick(c)}>
                {c.title} <span style={{ opacity: 0.6 }}>({c.caseNumber})</span>
              </button>
            ))}
          {!loading && results.length === 0 && (
            <div style={{ padding: "8px 10px", fontSize: 13, opacity: 0.7 }}>
              <Search width={12} height={12} aria-hidden style={{ marginRight: 6 }} />
              No matching cases.
            </div>
          )}
          <button
            type="button"
            style={S.createOption}
            onClick={() => {
              setOpen(false);
              setShowCreate(true);
            }}
          >
            <FolderPlus width={14} height={14} aria-hidden />
            Case not found — create new case
          </button>
        </div>
      )}
      {showCreate && (
        <QuickAddCaseDialog
          open={showCreate}
          onClose={() => setShowCreate(false)}
          organizationId={organizationId}
          isOrgMode={!siteId}
          siteId={siteId ?? null}
          onSuccess={(created) => {
            setShowCreate(false);
            if (created) handlePick(created);
          }}
        />
      )}
    </div>
  );
}

export default CasePickerAutocomplete;
