import { describe, it, expect } from "vitest";
import {
  FLAG_DEFAULTS,
  isKnownFlag,
  parseEnvFlags,
  parseOverrides,
  resolveFlag,
  type FlagKey,
} from "./flags";

// Signed-off screens ship ON by default; deferred screens + the dev workbench
// stay OFF. Keep these lists in sync with FLAG_DEFAULTS.
const DEFAULT_ON: FlagKey[] = [
  "shell",
  "landing",
  "login",
  "register",
  "onboarding",
  "dashboard",
  "cases",
  "case-workspace",
  "branches",
  "lawyers",
  "ecourts",
  "site-user-dashboard",
  "site-user-tasks",
  "site-hearings",
];
const DEFAULT_OFF: FlagKey[] = [
  "clients",
  "organization",
  "cause-list",
  "billing",
  "ecourt-details-tabs",
  "case-detail-tabs",
  "admin-dashboard-lists",
  "user-management-forms",
  "contact-section",
  "register-otp",
  "workbench",
];

describe("resolveFlag", () => {
  it("defaults signed-off screens ON and deferred screens/workbench OFF", () => {
    DEFAULT_ON.forEach((key) => expect(resolveFlag(key)).toBe(true));
    DEFAULT_OFF.forEach((key) => expect(resolveFlag(key)).toBe(false));
  });

  it("covers every flag key across the ON/OFF partition", () => {
    const partition = new Set<FlagKey>([...DEFAULT_ON, ...DEFAULT_OFF]);
    (Object.keys(FLAG_DEFAULTS) as FlagKey[]).forEach((key) => {
      expect(partition.has(key)).toBe(true);
    });
    expect(partition.size).toBe(Object.keys(FLAG_DEFAULTS).length);
  });

  it("enables a default-off flag listed in the env allowlist", () => {
    expect(resolveFlag("clients", { env: "clients,billing" })).toBe(true);
    expect(resolveFlag("organization", { env: "clients,billing" })).toBe(false);
  });

  it("treats '*' env as enable-all", () => {
    expect(resolveFlag("clients", { env: "*" })).toBe(true);
    expect(resolveFlag("billing", { env: "*" })).toBe(true);
  });

  it("tolerates whitespace and empty entries in the env list", () => {
    expect(resolveFlag("clients", { env: " clients , billing , " })).toBe(true);
  });

  it("lets a runtime override enable a default-off flag", () => {
    expect(resolveFlag("clients", { overrides: { clients: true } })).toBe(true);
  });

  it("lets a runtime override disable a default-on flag", () => {
    expect(resolveFlag("dashboard", { overrides: { dashboard: false } })).toBe(false);
  });

  it("ignores overrides that are undefined for the key", () => {
    expect(resolveFlag("clients", { env: "clients", overrides: { billing: true } })).toBe(true);
  });
});

describe("helpers", () => {
  it("isKnownFlag guards unknown keys", () => {
    expect(isKnownFlag("dashboard")).toBe(true);
    expect(isKnownFlag("not-a-flag")).toBe(false);
  });

  it("parseEnvFlags returns a set of trimmed keys", () => {
    const set = parseEnvFlags(" cases , dashboard ");
    expect(set.has("cases")).toBe(true);
    expect(set.has("dashboard")).toBe(true);
    expect(set.size).toBe(2);
  });

  it("parseEnvFlags handles null/empty", () => {
    expect(parseEnvFlags(null).size).toBe(0);
    expect(parseEnvFlags("").size).toBe(0);
  });

  it("parseOverrides safely parses JSON and drops unknown keys", () => {
    expect(parseOverrides('{"login":true,"bogus":true}')).toEqual({ login: true });
    expect(parseOverrides("not json")).toEqual({});
    expect(parseOverrides(null)).toEqual({});
  });
});
