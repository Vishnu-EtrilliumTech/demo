"use client";

import { useFeatureFlag } from "@/design-system";
import SiteUserTasksLegacy from "./SiteUserTasksLegacy";
import SiteUserTasksNew from "./SiteUserTasksNew";

/**
 * Site User "My tasks" list. Gated on the `site-user-tasks` flag: the DS
 * screen when on, the legacy MUI screen when off (clean per-screen rollback,
 * REVAMP_SPEC §3).
 */
export default function SiteUserTasksPage({
  params,
}: {
  params: Promise<{ id: string; siteId: string; userId: string }>;
}) {
  const on = useFeatureFlag("site-user-tasks");
  return on ? <SiteUserTasksNew params={params} /> : <SiteUserTasksLegacy params={params} />;
}
