"use client";

import { useFeatureFlag } from "@/design-system";
import OrgDashboardLegacy from "./OrgDashboardLegacy";
import OrgDashboardNew from "./OrgDashboardNew";

/**
 * Organization dashboard route. Feature-flagged migration (`dashboard`): the new
 * design-system dashboard renders when the flag is on; otherwise the legacy
 * screen is served unchanged. Toggling the flag off restores legacy cleanly.
 */
export default function OrganizationDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const useNewDashboard = useFeatureFlag("dashboard");
  return useNewDashboard ? <OrgDashboardNew params={params} /> : <OrgDashboardLegacy params={params} />;
}
