import React from "react";
import { Download } from "lucide-react";
import { Button, Pill, type PillTone, type Column } from "@/design-system";
import { formatDisplayDate } from "@/utils";

/**
 * Shared presentational primitives for the DS eCourts court-record renderer.
 * Pure — no data fetching. Styling comes from the scoped `.lui-root` classes
 * (components.css + patterns.css); tab modules compose these.
 */

export function formatLastUpdated(iso: string): string {
  const updated = new Date(iso);
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - updated.getTime()) / 60000);
  const isToday = updated.toDateString() === now.toDateString();

  if (isToday) {
    if (diffMins < 1) return "Last updated just now";
    if (diffMins < 60) return `Last updated ${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return m === 0
      ? `Last updated ${h} hour${h === 1 ? "" : "s"} ago`
      : `Last updated ${h} hour${h === 1 ? "" : "s"} ${m} min${m === 1 ? "" : "s"} ago`;
  }
  return `Last updated on ${formatDisplayDate(iso)}`;
}

/** `.kv` grid wrapper. */
export function Kv({ children }: { children: React.ReactNode }) {
  return <div className="kv">{children}</div>;
}

/** Single `.kv .row` — hidden when the value is empty (parity with legacy InfoRow). */
export function KvRow({ k, v }: { k: string; v: React.ReactNode }) {
  if (v === null || v === undefined || v === "") return null;
  return (
    <div className="row">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  );
}

export function Subhead({ children }: { children: React.ReactNode }) {
  return <div className="subhead">{children}</div>;
}

export function Prose({ children }: { children: React.ReactNode }) {
  return <p className="prose">{children}</p>;
}

/** Bulleted list rendered as `.prose` (preserves legacy `<ul>` blocks). */
export function ProseList({ items }: { items: string[] }) {
  return (
    <div className="prose">
      <ul>
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Declarative `.tbl` table for tab modules that already supply their own
 * `<Card>`/`<SectionHead>` wrapper (so the full `DataTable` component's own
 * `.card` wrapper would double-nest). Renders the exact same
 * `<table className="tbl">` markup those wrappers already expect, driven by
 * `Column` definitions (the same shape `DataTable` uses) instead of
 * hand-rolled `<thead>/<tbody>` JSX per tab.
 */
export function SimpleTable<T>({
  columns,
  rows,
  getRowKey,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey?: (row: T, index: number) => string | number;
}) {
  return (
    <table className="tbl">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} className={col.align === "right" ? "r" : undefined}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={getRowKey ? getRowKey(row, i) : i}>
            {columns.map((col) => (
              <td key={col.key} className={col.align === "right" ? "r" : undefined}>
                {col.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** `.score` header + `.linebar` fill. `pct` is 0–100. */
export function ScoreBar({ label, valueText, pct }: { label: string; valueText: string; pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="score">
      <div className="sh">
        <span>{label}</span>
        <span className="n">{valueText}</span>
      </div>
      <div className="linebar">
        <span className="f" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

/** Confidence score out of `max` (default 10) rendered as a ScoreBar. */
export function ConfidenceScore({ label = "Confidence", score, max = 10 }: { label?: string; score: number; max?: number }) {
  return <ScoreBar label={label} valueText={`${score}/${max}`} pct={(score / max) * 100} />;
}

export function statusTone(status: string): PillTone {
  const s = (status || "").toUpperCase();
  if (s === "DISPOSED") return "ok";
  if (s === "PENDING") return "warn";
  if (s === "DISMISSED") return "danger";
  return "neutral";
}

/** eCourts case-status pill (dot). */
export function CaseStatusPill({ status, label }: { status: string; label: string }) {
  return (
    <Pill tone={statusTone(status)} dot>
      {label}
    </Pill>
  );
}

/** Secondary "download" button with inline spinner while its blob is fetched. */
export function DownloadButton({
  loading,
  onClick,
  children = "PDF",
}: {
  loading: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Button variant="secondary" icon={Download} loading={loading} disabled={loading} onClick={onClick}>
      {children}
    </Button>
  );
}

/** Enum lookup display: prefer a description when it differs from the raw value. */
export function enumDisplay(lookup: Record<string, string>, key: string, raw: string | null): string {
  const desc = lookup?.[key];
  if (desc && desc !== raw) return `${raw || key} · ${desc}`;
  return raw || key;
}
