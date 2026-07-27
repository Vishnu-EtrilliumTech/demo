"use client";

import { useSyncExternalStore } from "react";
import {
  FLAGS_CHANGE_EVENT,
  FLAGS_STORAGE_KEY,
  parseOverrides,
  resolveFlag,
  type FlagKey,
} from "./flags";

/**
 * The env allowlist. `process.env.NEXT_PUBLIC_UI_FLAGS` is statically inlined by
 * Next at build time, so this is safe on both server and client.
 */
const ENV_ALLOWLIST = process.env.NEXT_PUBLIC_UI_FLAGS ?? null;

function readOverrides(): Partial<Record<FlagKey, boolean>> {
  if (typeof window === "undefined") return {};
  try {
    return parseOverrides(window.localStorage.getItem(FLAGS_STORAGE_KEY));
  } catch {
    return {};
  }
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(FLAGS_CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(FLAGS_CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/**
 * Reactive per-screen flag read. Recomputes when a runtime override changes.
 * Server render and first client render both resolve from the env allowlist
 * only (overrides are client-only), so hydration is stable; overrides then
 * apply on the next tick via the store subscription.
 */
export function useFeatureFlag(key: FlagKey): boolean {
  return useSyncExternalStore(
    subscribe,
    () => resolveFlag(key, { env: ENV_ALLOWLIST, overrides: readOverrides() }),
    () => resolveFlag(key, { env: ENV_ALLOWLIST }),
  );
}

/** Non-reactive one-shot read (e.g. inside event handlers). */
export function getFeatureFlag(key: FlagKey): boolean {
  return resolveFlag(key, { env: ENV_ALLOWLIST, overrides: readOverrides() });
}

/**
 * Set or clear a runtime override for a flag (persists to localStorage and
 * notifies subscribers). Pass `null` to remove the override and fall back to
 * env/default. Intended for the dev workbench and QA — a no-op on the server.
 */
export function setFlagOverride(key: FlagKey, value: boolean | null): void {
  if (typeof window === "undefined") return;
  const current = readOverrides();
  if (value === null) {
    delete current[key];
  } else {
    current[key] = value;
  }
  try {
    window.localStorage.setItem(FLAGS_STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* storage unavailable (private mode) — ignore */
  }
  window.dispatchEvent(new Event(FLAGS_CHANGE_EVENT));
}

export interface FeatureGateProps {
  flag: FlagKey;
  children: React.ReactNode;
  /** Rendered when the flag is off (defaults to nothing). */
  fallback?: React.ReactNode;
}

/** Declarative gate: renders `children` when the flag is on, else `fallback`. */
export function FeatureGate({ flag, children, fallback = null }: FeatureGateProps) {
  const on = useFeatureFlag(flag);
  return <>{on ? children : fallback}</>;
}
