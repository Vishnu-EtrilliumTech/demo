"use client";

import React from "react";
import { useFeatureFlag } from "@/design-system";
import SiteDetailLegacy from "./SiteDetailLegacy";
import SiteDetailNew from "./SiteDetailNew";

/**
 * Branch (site) detail. Gated on the `branches` flag — the DS dashboard when on,
 * the legacy MUI screen when off — so the whole Branches surface flips together
 * (clean per-screen rollback, REVAMP_SPEC §3).
 */
export default function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string; siteId: string }>;
}) {
  const on = useFeatureFlag("branches");
  return on ? <SiteDetailNew params={params} /> : <SiteDetailLegacy params={params} />;
}
