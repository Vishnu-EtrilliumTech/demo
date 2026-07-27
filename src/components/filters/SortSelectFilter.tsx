"use client";

import React from "react";
import { Select, MenuItem, type SelectChangeEvent, type SxProps, type Theme } from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";

export interface SortOption {
  value: string;
  label: string;
}

export interface SortSelectFilterProps {
  sortBy: string | undefined;
  sortDirection: "asc" | "desc" | undefined;
  options: SortOption[];
  onSort: (field: string, direction: "asc" | "desc") => void;
  onClear: () => void;
  defaultLabel?: string;
  showIcon?: boolean;
  size?: "small" | "medium";
  sx?: SxProps<Theme>;
  disabled?: boolean;
  minWidth?: number;
}

export function SortSelectFilter({
  sortBy,
  sortDirection,
  options,
  onSort,
  onClear,
  defaultLabel = "Default sort",
  showIcon = false,
  size = "small",
  sx,
  disabled,
  minWidth = 160,
}: SortSelectFilterProps) {
  const value = sortBy ? `${sortBy}:${sortDirection ?? "asc"}` : "";

  return (
    <Select
      size={size}
      displayEmpty
      value={value}
      onChange={(e: SelectChangeEvent) => {
        const val = e.target.value as string;
        if (!val) { onClear(); return; }
        const [field, dir] = val.split(":");
        onSort(field, dir as "asc" | "desc");
      }}
      disabled={disabled}
      {...(showIcon
        ? { startAdornment: <SortIcon sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }} /> }
        : {})}
      sx={{
        borderRadius: "20px",
        fontSize: "0.875rem",
        bgcolor: "#fafafa",
        minWidth,
        ...sx,
      }}
    >
      <MenuItem value="">{defaultLabel}</MenuItem>
      {options.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          {opt.label}
        </MenuItem>
      ))}
    </Select>
  );
}

export default SortSelectFilter;
