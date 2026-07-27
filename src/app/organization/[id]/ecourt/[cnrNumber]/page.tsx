"use client";

import React from "react";
import { useFeatureFlag } from "@/design-system";
import CnrViewerLegacy from "./CnrViewerLegacy";
import CnrViewerNew from "./CnrViewerNew";

/**
 * Standalone CNR viewer. Gated on the `ecourts` flag: DS viewer when on, legacy
 * MUI viewer when off (clean per-screen rollback, REVAMP_SPEC §3).
 */
export default function CnrEcourtPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; cnrNumber: string }>;
  searchParams: Promise<{ siteId?: string; caseId?: string }>;
}) {
  const { id: orgId, cnrNumber } = React.use(params);
  const { siteId, caseId } = React.use(searchParams);
  const on = useFeatureFlag("ecourts");

  const props = { orgId, cnrNumber, siteId, caseId };
  return on ? <CnrViewerNew {...props} /> : <CnrViewerLegacy {...props} />;
}
