"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronDown, ChevronUp } from "lucide-react";

export type SortDirection = "asc" | "desc";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
  /** Field name to sort by; enables the sortable header when `onSort` given. */
  sortField?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  sortBy?: string;
  sortDirection?: SortDirection;
  onSort?: (field: string, direction: SortDirection) => void;
  /** Rendered (inside a full-width cell) when `rows` is empty. */
  empty?: ReactNode;
  /** Footer content, typically <TableFoot>. */
  footer?: ReactNode;
}

function SortHeader({
  label,
  field,
  sortBy,
  sortDirection,
  onSort,
  align,
}: {
  label: ReactNode;
  field: string;
  sortBy?: string;
  sortDirection?: SortDirection;
  onSort: (field: string, direction: SortDirection) => void;
  align?: "left" | "right";
}) {
  const active = sortBy === field;
  const next: SortDirection = active && sortDirection === "asc" ? "desc" : "asc";
  const Icon = !active ? ChevronsUpDown : sortDirection === "asc" ? ChevronUp : ChevronDown;
  return (
    <th className={align === "right" ? "r" : undefined}>
      <button
        type="button"
        onClick={() => onSort(field, next)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: 0,
          padding: 0,
          font: "inherit",
          textTransform: "inherit",
          letterSpacing: "inherit",
          color: active ? "var(--brand)" : "inherit",
          cursor: "pointer",
        }}
      >
        {label}
        <Icon width={13} height={13} aria-hidden />
      </button>
    </th>
  );
}

/** Presentational, generic sortable table on the shared `.tbl` styling. */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  sortBy,
  sortDirection,
  onSort,
  empty,
  footer,
}: DataTableProps<T>) {
  return (
    <div className="card">
      <table className="tbl">
        <thead>
          <tr>
            {columns.map((col) =>
              col.sortField && onSort ? (
                <SortHeader
                  key={col.key}
                  label={col.header}
                  field={col.sortField}
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  align={col.align}
                />
              ) : (
                <th key={col.key} className={col.align === "right" ? "r" : undefined}>
                  {col.header}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: "center", padding: "32px 14px", color: "var(--text-3)" }}>
                {empty ?? "No results."}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={getRowKey(row, i)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={onRowClick ? { cursor: "pointer" } : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className={col.align === "right" ? "r" : undefined}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {footer}
    </div>
  );
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/** Numeric pager (`.pager`) with ellipsis, matching the reference footer. */
export function Pagination({ page, totalPages, onPageChange, disabled }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = pageWindow(page, totalPages);
  return (
    <div className="pager">
      <button type="button" disabled={disabled || page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
        <ChevronLeft aria-hidden />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <button key={`gap-${i}`} type="button" disabled>
            …
          </button>
        ) : (
          <button
            key={p}
            type="button"
            className={p === page ? "active" : undefined}
            disabled={disabled}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight aria-hidden />
      </button>
    </div>
  );
}

/** Table footer: count text + pager. */
export function TableFoot({
  count,
  page,
  totalPages,
  onPageChange,
  disabled,
}: { count: ReactNode } & PaginationProps) {
  return (
    <div className="tbl-foot">
      <span className="cnt">{count}</span>
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} disabled={disabled} />
    </div>
  );
}

/** Compact page window: 1 … around-current … last. */
function pageWindow(page: number, total: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  const push = (n: number) => out.push(n);
  const first = 1;
  const last = total;
  const around = [page - 1, page, page + 1].filter((n) => n > first && n < last);
  push(first);
  if (around.length && around[0] > first + 1) out.push("…");
  around.forEach(push);
  if (around.length && around[around.length - 1] < last - 1) out.push("…");
  else if (!around.length && last > first + 1) out.push("…");
  if (last > first) push(last);
  return out;
}
