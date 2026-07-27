"use client";

import React, { useEffect, useRef, useState } from "react";
import { TextField, InputAdornment, type SxProps, type Theme } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export interface TextSearchFilterProps {
  placeholder?: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  /** Debounce delay in ms before calling onChange. Default 400. */
  debounceMs?: number;
  size?: "small" | "medium";
  sx?: SxProps<Theme>;
  disabled?: boolean;
}

export function TextSearchFilter({
  placeholder = "Search…",
  value,
  onChange,
  debounceMs = 400,
  size = "small",
  sx,
  disabled,
}: TextSearchFilterProps) {
  // Local input state so the field stays responsive while debouncing.
  const [local, setLocal] = useState(value ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync outward value changes (e.g. clearFilters resets to undefined).
  useEffect(() => {
    setLocal(value ?? "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setLocal(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(next.trim() === "" ? undefined : next.trim());
    }, debounceMs);
  };

  // Flush on unmount to avoid stale timers.
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <TextField
      size={size}
      placeholder={placeholder}
      value={local}
      onChange={handleChange}
      disabled={disabled}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
          </InputAdornment>
        ),
      }}
      sx={{
        flex: "1 1 200px",
        maxWidth: 320,
        "& .MuiOutlinedInput-root": {
          borderRadius: "20px",
          fontSize: "0.875rem",
          bgcolor: "#fafafa",
        },
        ...sx,
      }}
    />
  );
}

export default TextSearchFilter;
