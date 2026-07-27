"use client";

/**
 * PROTOTYPE: no-op. The real component schedules Google One-Tap silent token
 * refresh; the prototype has a long-lived mock JWT and no Google integration,
 * so this renders nothing and performs no work.
 */
export default function GoogleSilentRefresh() {
  return null;
}
