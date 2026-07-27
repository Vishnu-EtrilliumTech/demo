import { createTheme } from "@mui/material/styles";

/**
 * MUI theme mirroring the ported design tokens. Provided for surfaces that mix
 * MUI components with the design system. It is NOT applied globally in Phase 1
 * (that would restyle legacy screens); opt in per-surface via <LuiThemeProvider>.
 * Palette values mirror tokens.css — keep the two in sync.
 */
export const luiMuiTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2b57d6", dark: "#1f45b3", contrastText: "#ffffff" },
    error: { main: "#c0362c" },
    warning: { main: "#b06f16" },
    success: { main: "#0e8a5f" },
    text: { primary: "#161a20", secondary: "#5a6472", disabled: "#8c95a3" },
    background: { default: "#f5f6f8", paper: "#ffffff" },
    divider: "#e9ebef",
  },
  shape: { borderRadius: 11 },
  typography: {
    fontFamily: 'var(--font-lui-sans), "Plus Jakarta Sans", system-ui, sans-serif',
    button: { textTransform: "none", fontWeight: 600 },
  },
  // MUI's stock scale (see specs/037-mui-migration/contracts/theme-breakpoints.md).
  // Author responsive styles mobile-first from `xs` up via `theme.breakpoints.up(...)`.
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  },
});

export default luiMuiTheme;
