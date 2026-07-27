"use client";

import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { type Dayjs } from "dayjs";

export interface DateRangeFilterProps {
  /** ISO-8601 date string for the "from" date (undefined = no filter). */
  fromValue: string | undefined;
  /** ISO-8601 date string for the "to" date (undefined = no filter). */
  toValue: string | undefined;
  onFromChange: (value: string | undefined) => void;
  onToChange: (value: string | undefined) => void;
  fromLabel?: string;
  toLabel?: string;
  size?: "small" | "medium";
  disabled?: boolean;
}

export function DateRangeFilter({
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  fromLabel = "From",
  toLabel = "To",
  size = "small",
  disabled,
}: DateRangeFilterProps) {
  // Track a client-side error when end < start (FR-016).
  const [dateError, setDateError] = useState<string | null>(null);

  const fromDay = fromValue ? dayjs(fromValue) : null;
  const toDay = toValue ? dayjs(toValue) : null;

  const handleFromChange = (day: Dayjs | null) => {
    const iso = day?.isValid() ? day.toISOString() : undefined;
    setDateError(null);
    onFromChange(iso);
    // Validate: if "to" is set and is now before the new "from", clear the error display.
    if (toDay && day && day.isValid() && day.isAfter(toDay, "day")) {
      setDateError("'From' date must be on or before 'To' date.");
    }
  };

  const handleToChange = (day: Dayjs | null) => {
    const iso = day?.isValid() ? day.toISOString() : undefined;
    setDateError(null);
    // Validate end ≥ start (FR-016) before propagating.
    if (fromDay && day && day.isValid() && day.isBefore(fromDay, "day")) {
      setDateError("'To' date must be on or after 'From' date.");
      return; // do not propagate invalid range
    }
    onToChange(iso);
  };

  const slotProps = {
    textField: {
      size,
      sx: {
        "& .MuiOutlinedInput-root": {
          borderRadius: "20px",
          fontSize: "0.875rem",
          bgcolor: "#fafafa",
        },
      },
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <DatePicker
          label={fromLabel}
          value={fromDay}
          onChange={handleFromChange}
          disabled={disabled}
          slotProps={slotProps}
        />
        <Typography variant="body2" color="text.secondary">
          –
        </Typography>
        <DatePicker
          label={toLabel}
          value={toDay}
          onChange={handleToChange}
          minDate={fromDay ?? undefined}
          disabled={disabled}
          slotProps={slotProps}
        />
        {dateError && (
          <Typography variant="caption" color="error" sx={{ width: "100%" }}>
            {dateError}
          </Typography>
        )}
      </Box>
    </LocalizationProvider>
  );
}

export default DateRangeFilter;
