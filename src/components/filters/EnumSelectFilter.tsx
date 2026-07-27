"use client";

import React from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SxProps,
  type Theme,
} from "@mui/material";

export interface EnumOption {
  value: string;
  label: string;
}

export interface EnumSelectFilterProps {
  /** Display label (also used as the "All …" placeholder). */
  label: string;
  /** Controlled value — `undefined` or `""` means "no filter". */
  value: string | undefined;
  /** Enum options; the component prepends an "All" option automatically. */
  options: EnumOption[];
  onChange: (value: string | undefined) => void;
  size?: "small" | "medium";
  sx?: SxProps<Theme>;
  disabled?: boolean;
}

export function EnumSelectFilter({
  label,
  value,
  options,
  onChange,
  size = "small",
  sx,
  disabled,
}: EnumSelectFilterProps) {
  const selectValue = value ?? "";

  return (
    <FormControl size={size} sx={{ minWidth: 130, ...sx }} disabled={disabled}>
      <InputLabel sx={{ fontSize: "0.875rem" }}>{label}</InputLabel>
      <Select
        value={selectValue}
        label={label}
        onChange={(e) => {
          const next = e.target.value as string;
          onChange(next === "" ? undefined : next);
        }}
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

export default EnumSelectFilter;
