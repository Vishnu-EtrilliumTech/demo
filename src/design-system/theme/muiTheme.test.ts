import { describe, it, expect } from "vitest";
import { luiMuiTheme } from "./muiTheme";

// Regression guard for specs/037-mui-migration/contracts/theme-breakpoints.md —
// every migrated screen authors responsive styles against this exact scale.
describe("luiMuiTheme breakpoints", () => {
  it("matches the documented mobile-first scale", () => {
    expect(luiMuiTheme.breakpoints.values).toEqual({
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    });
  });
});
