"use client";

import React from "react";
import { useFeatureFlag } from "@/design-system";
import { EcourtTabNew } from "./EcourtTabNew";
import { EcourtTabLegacy } from "./EcourtTabLegacy";
import type { EcourtTabProps } from "./types";

/**
 * eCourts tab gate. Behind the `ecourts` flag it renders the DS body; off it
 * falls back to the legacy MUI body (clean per-screen rollback, REVAMP_SPEC §3).
 */
export const EcourtTab: React.FC<EcourtTabProps> = (props) => {
  const on = useFeatureFlag("ecourts");
  return on ? <EcourtTabNew {...props} /> : <EcourtTabLegacy {...props} />;
};
