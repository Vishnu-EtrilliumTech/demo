"use client";

import React, { use } from "react";
import { useFeatureFlag } from "@/design-system";
import EcourtsLegacy from "./EcourtsLegacy";
import EcourtsNew from "./EcourtsNew";

/**
 * eCourts hub. Gated on the `ecourts` flag: DS hub when on, legacy MUI hub when
 * off (clean per-screen rollback, REVAMP_SPEC §3).
 */
export default function EcourtsHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orgId } = use(params);
  const on = useFeatureFlag("ecourts");
  return on ? <EcourtsNew orgId={orgId} /> : <EcourtsLegacy orgId={orgId} />;
}
