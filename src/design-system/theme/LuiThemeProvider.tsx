"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { luiMuiTheme } from "./muiTheme";

/**
 * Opt-in MUI theme scope for design-system surfaces that also use MUI widgets.
 * Applied per-surface (not globally) so legacy MUI screens keep their defaults.
 */
export function LuiThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={luiMuiTheme}>{children}</ThemeProvider>;
}

export default LuiThemeProvider;
