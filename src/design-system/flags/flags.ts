/**
 * Feature-flag registry + pure resolution logic for the UI revamp.
 *
 * Every migrated screen is gated by a flag so the new UI can be toggled per
 * screen and rolled back independently (REVAMP_SPEC §3.3). Resolution order,
 * lowest → highest precedence:
 *   1. built-in default — signed-off screens default ON (the revamp is now the
 *      app); deferred/not-built screens + the dev workbench stay OFF
 *   2. env allowlist   — `NEXT_PUBLIC_UI_FLAGS` (comma list of keys, or `*`)
 *   3. runtime override — persisted client toggle (localStorage), for QA/dev
 *
 * `flags.ts` is intentionally pure and dependency-free so it is unit-testable
 * and usable on both server and client. React bindings live in
 * `useFeatureFlag.tsx`.
 */

/**
 * Screen (and tooling) flags. Keys are kebab-case.
 *
 * Signed-off screens default **ON** — the revamp is the app; each `*Legacy`
 * fallback is still one toggle away (set the key `false` via the env allowlist
 * or a runtime override). Screens still deferred (Clients Q10, Organization
 * settings, Cause List — no feed, Billing Q11) and the dev-only workbench stay
 * **OFF**.
 */
export const FLAG_DEFAULTS = {
  shell: true,
  landing: true,
  login: true,
  register: true,
  onboarding: true,
  dashboard: true,
  cases: true,
  "case-workspace": true,
  branches: true,
  lawyers: true,
  ecourts: true,
  "site-user-dashboard": true,
  "site-user-tasks": true,
  "site-hearings": true,
  // Deferred / not built yet — kept OFF (legacy UI still ships for these).
  clients: false,
  organization: false,
  "cause-list": false,
  billing: false,
  // 037-mui-migration: newly MUI-migrated screens, OFF until each group's
  // parity + regression sign-off (see specs/037-mui-migration/tasks.md T041-T043).
  "ecourt-details-tabs": false,
  "case-detail-tabs": false,
  "admin-dashboard-lists": false,
  "user-management-forms": false,
  "contact-section": false,
  "register-otp": false,
  /** Not a screen — gates visibility of the dev component workbench. */
  workbench: false,
} as const;

export type FlagKey = keyof typeof FLAG_DEFAULTS;

/** Wildcard token in the env allowlist that enables every flag. */
const ENABLE_ALL = "*";

/** The env var read for the allowlist. Inlined at build for the client. */
export const FLAGS_ENV_VAR = "NEXT_PUBLIC_UI_FLAGS";

/** The localStorage key holding the runtime override map. */
export const FLAGS_STORAGE_KEY = "lawsome_ui_flags";

/** Event dispatched when overrides change, so hooks can re-render. */
export const FLAGS_CHANGE_EVENT = "lui-flags-change";

export function isKnownFlag(key: string): key is FlagKey {
  return Object.prototype.hasOwnProperty.call(FLAG_DEFAULTS, key);
}

export function allFlagKeys(): FlagKey[] {
  return Object.keys(FLAG_DEFAULTS) as FlagKey[];
}

/** Parse a comma-separated env allowlist into a set of trimmed tokens. */
export function parseEnvFlags(env: string | null | undefined): Set<string> {
  if (!env) return new Set();
  return new Set(
    env
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/** Safely parse a persisted override map, dropping unknown/invalid keys. */
export function parseOverrides(raw: string | null | undefined): Partial<Record<FlagKey, boolean>> {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== "object") return {};
  const out: Partial<Record<FlagKey, boolean>> = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (isKnownFlag(key) && typeof value === "boolean") {
      out[key] = value;
    }
  }
  return out;
}

export interface FlagSources {
  /** Raw env allowlist string (e.g. `NEXT_PUBLIC_UI_FLAGS`). */
  env?: string | null;
  /** Runtime override map (client toggles). */
  overrides?: Partial<Record<FlagKey, boolean>>;
}

/** Resolve a single flag from the layered sources. Pure. */
export function resolveFlag(key: FlagKey, sources: FlagSources = {}): boolean {
  let value: boolean = FLAG_DEFAULTS[key];

  const envSet = parseEnvFlags(sources.env);
  if (envSet.has(ENABLE_ALL) || envSet.has(key)) {
    value = true;
  }

  const override = sources.overrides?.[key];
  if (typeof override === "boolean") {
    value = override;
  }

  return value;
}
