"use client";

import React from "react";
import { TableCell, TableSortLabel, type SxProps, type Theme } from "@mui/material";
import type { SortDirection } from "@/types/pagination";

// Reusable sortable column header cell for table views.
// Click cycles: none → asc → desc → none (clearSort).
// See specs/035-pagination-sorting-filtering/contracts/frontend-contracts.md §5.

export interface SortableColumnHeaderProps {
  /** The backend sort token for this column (must be in the list's sortableFields allow-list). */
  field: string;
  /** Display label. */
  label: string;
  /** Current sortBy from useListQuery state. */
  currentSortBy?: string;
  /** Current sortDirection from useListQuery state. */
  currentSortDirection?: SortDirection;
  /** Call useListQuery.setSort(field, direction). */
  onSort: (field: string, direction: SortDirection) => void;
  /** Call useListQuery.clearSort() — resets to backend default. */
  onClearSort: () => void;
  /** Extra sx forwarded to the wrapping TableCell. */
  sx?: SxProps<Theme>;
  /** Forwarded to TableCell align prop. */
  align?: "left" | "right" | "center" | "inherit" | "justify";
}

export function SortableColumnHeader({
  field,
  label,
  currentSortBy,
  currentSortDirection,
  onSort,
  onClearSort,
  sx,
  align,
}: SortableColumnHeaderProps) {
  const isActive = currentSortBy === field;

  const handleClick = () => {
    if (!isActive) {
      onSort(field, "asc");
    } else if (currentSortDirection === "asc") {
      onSort(field, "desc");
    } else {
      // desc → clear; back to backend default (FR-010)
      onClearSort();
    }
  };

  return (
    <TableCell sx={sx} align={align} sortDirection={isActive ? currentSortDirection : false}>
      <TableSortLabel
        active={isActive}
        direction={isActive ? currentSortDirection : "asc"}
        onClick={handleClick}
        sx={{
          color: "inherit",
          fontWeight: "inherit",
          fontSize: "inherit",
          letterSpacing: "inherit",
          textTransform: "inherit",
          "& .MuiTableSortLabel-icon": { opacity: isActive ? 1 : 0.3 },
          "&:hover .MuiTableSortLabel-icon": { opacity: 0.7 },
          "&.Mui-active": { color: "inherit" },
          "&.Mui-active .MuiTableSortLabel-icon": { color: "inherit" },
        }}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );
}

export default SortableColumnHeader;
