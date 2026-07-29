"use client";

import React, { useState } from "react";
import { Circle } from "lucide-react";
import {
  Priority,
  PRIORITY_LEVELS,
  PRIORITY_LABELS,
  priorityColor,
} from "@/app/organization/types/calendarTypes";

interface PriorityPickerProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  /** Compact mode renders just the swatch trigger (Calendar quick-set); default renders a labelled field control. */
  compact?: boolean;
  disabled?: boolean;
}

const S = {
  wrap: { position: "relative", display: "inline-flex" } as React.CSSProperties,
  swatchBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid var(--border, #e2e2e2)",
    borderRadius: 6,
    background: "transparent",
    cursor: "pointer",
    font: "inherit",
    fontSize: 13,
    padding: "4px 8px",
  } as React.CSSProperties,
  compactBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: 2,
    borderRadius: "50%",
  } as React.CSSProperties,
  menuBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 10,
    border: "none",
    background: "transparent",
    cursor: "default",
  } as React.CSSProperties,
  menu: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: 4,
    background: "var(--surface, #fff)",
    border: "1px solid var(--border, #e2e2e2)",
    borderRadius: "var(--r-sm, 6px)",
    boxShadow: "var(--sh, 0 4px 16px rgba(0,0,0,0.12))",
    padding: 4,
    zIndex: 11,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 140,
  } as React.CSSProperties,
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    border: 0,
    background: "transparent",
    font: "inherit",
    fontSize: 13,
    padding: "6px 8px",
    borderRadius: 4,
    cursor: "pointer",
    textAlign: "left",
  } as React.CSSProperties,
};

/**
 * Shared 4-color (Red/Orange/Yellow/Green) Priority swatch + popover.
 * Used both as the Calendar item's inline quick-set control (compact) and
 * embedded inside Hearing/Task/Note create-edit forms (labelled).
 */
export function PriorityPicker({ value, onChange, compact = false, disabled = false }: PriorityPickerProps) {
  const [open, setOpen] = useState(false);
  const color = priorityColor(value);
  const label = value ? PRIORITY_LABELS[value] : "Low (default)";

  return (
    <span style={S.wrap}>
      <button
        type="button"
        aria-label={compact ? `Set priority (currently ${label})` : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        style={compact ? S.compactBtn : S.swatchBtn}
        title={`Priority: ${label}`}
      >
        <Circle width={compact ? 14 : 12} height={compact ? 14 : 12} fill={color} color={color} />
        {!compact && <span>{label}</span>}
      </button>
      {open && (
        <>
          <button type="button" aria-hidden tabIndex={-1} onClick={() => setOpen(false)} style={S.menuBackdrop} />
          <div role="menu" style={S.menu}>
            {PRIORITY_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                role="menuitem"
                style={S.menuItem}
                onClick={() => {
                  onChange(level);
                  setOpen(false);
                }}
              >
                <Circle width={12} height={12} fill={priorityColor(level)} color={priorityColor(level)} />
                {PRIORITY_LABELS[level]}
              </button>
            ))}
          </div>
        </>
      )}
    </span>
  );
}

export default PriorityPicker;
