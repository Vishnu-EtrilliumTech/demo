"use client";

import { useFeatureFlag } from "@/design-system";
import SiteHearingsLegacy from "./SiteHearingsLegacy";
import SiteHearingsNew from "./SiteHearingsNew";

/**
 * Site hearings list (org-wide, or "My hearings" via `?userId=`). Gated on the
 * `site-hearings` flag: the DS screen when on, the legacy MUI screen when off
 * (clean per-screen rollback, REVAMP_SPEC §3).
 */
export default function SiteHearingsPage({
  params,
}: {
  params: Promise<{ id: string; siteId: string }>;
}) {
  const on = useFeatureFlag("site-hearings");
  return on ? <SiteHearingsNew params={params} /> : <SiteHearingsLegacy params={params} />;
}
