"use client";

import { useFeatureFlag } from "@/design-system";
import SiteUserDashboardLegacy from "./SiteUserDashboardLegacy";
import SiteUserDashboardNew from "./SiteUserDashboardNew";

/**
 * Site User personal dashboard. Gated on the `site-user-dashboard` flag: the DS
 * dashboard when on, the legacy MUI screen when off (clean per-screen
 * rollback, REVAMP_SPEC §3).
 */
export default function SiteUserDashboardPage({
  params,
}: {
  params: Promise<{ id: string; siteId: string; userId: string }>;
}) {
  const on = useFeatureFlag("site-user-dashboard");
  return on ? <SiteUserDashboardNew params={params} /> : <SiteUserDashboardLegacy params={params} />;
}
