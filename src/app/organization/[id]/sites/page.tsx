"use client";

import React, { use } from "react";
import { useFeatureFlag } from "@/design-system";
import BranchesLegacy from "./BranchesLegacy";
import BranchesNew from "./BranchesNew";

/**
 * Branches (Sites) list. Gated on the `branches` flag: DS screen when on, legacy
 * MUI screen when off (clean per-screen rollback, REVAMP_SPEC §3).
 */
export default function SitesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orgId } = use(params);
  const on = useFeatureFlag("branches");
  return on ? <BranchesNew orgId={orgId} /> : <BranchesLegacy orgId={orgId} />;
}
