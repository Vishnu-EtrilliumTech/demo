import type { PillTone } from "@/design-system";
import { CaseStatus } from "@/app/organization/types";

/**
 * Single source of truth for how a case status maps to the design-system pill
 * tone, meter color, and human label. Shared by the dashboard status meter and
 * the Cases list so the two never drift.
 */
export const CASE_STATUS_TONE: Record<CaseStatus, PillTone> = {
  [CaseStatus.Open]: "brand",
  [CaseStatus.InProgress]: "warn",
  [CaseStatus.OnHold]: "neutral",
  [CaseStatus.Closed]: "ok",
};

export const CASE_STATUS_COLOR: Record<CaseStatus, string> = {
  [CaseStatus.Open]: "var(--brand)",
  [CaseStatus.InProgress]: "var(--warn)",
  [CaseStatus.OnHold]: "#8c95a3",
  [CaseStatus.Closed]: "var(--ok)",
};

export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  [CaseStatus.Open]: "Open",
  [CaseStatus.InProgress]: "In Progress",
  [CaseStatus.OnHold]: "On Hold",
  [CaseStatus.Closed]: "Closed",
};

/** Status render order used by the meter + the status filter. */
export const CASE_STATUS_ORDER: CaseStatus[] = [
  CaseStatus.Open,
  CaseStatus.InProgress,
  CaseStatus.OnHold,
  CaseStatus.Closed,
];

export function caseStatusTone(status: CaseStatus): PillTone {
  return CASE_STATUS_TONE[status] ?? "neutral";
}
