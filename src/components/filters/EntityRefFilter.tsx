"use client";

import React from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  type SxProps,
  type Theme,
} from "@mui/material";

export interface EntityRefOption {
  value: string;
  label: string;
}

export interface EntityRefFilterProps {
  /** Display label and "All …" placeholder suffix. */
  label: string;
  /** Controlled value — `undefined` or `""` means "no filter". */
  value: string | undefined;
  /** Options sourced from reference data (sites, users, assignees, etc.). */
  options: EntityRefOption[];
  onChange: (value: string | undefined) => void;
  /** Shows a loading spinner while reference data is being fetched. */
  loading?: boolean;
  size?: "small" | "medium";
  sx?: SxProps<Theme>;
  disabled?: boolean;
}

export function EntityRefFilter({
  label,
  value,
  options,
  onChange,
  loading = false,
  size = "small",
  sx,
  disabled,
}: EntityRefFilterProps) {
  const selectValue = value ?? "";

  return (
    <FormControl size={size} sx={{ minWidth: 150, ...sx }} disabled={disabled || loading}>
      <InputLabel sx={{ fontSize: "0.875rem" }}>{label}</InputLabel>
      <Select
        value={selectValue}
        label={label}
        onChange={(e) => {
          const next = e.target.value as string;
          onChange(next === "" ? undefined : next);
        }}
        endAdornment={
          loading ? (
            <CircularProgress size={14} sx={{ mr: 2 }} />
          ) : undefined
        }
        sx={{
          borderRadius: "20px",
          fontSize: "0.875rem",
          bgcolor: "#fafafa",
        }}
      >
        <MenuItem value="">All {label}</MenuItem>
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default EntityRefFilter;
