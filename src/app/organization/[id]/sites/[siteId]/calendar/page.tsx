"use client";

import { use } from "react";
import CalendarView from "@/app/organization/components/calendar/CalendarView";

/** Site-level Calendar route: Hearings/Tasks/Notes scoped to this Site (plus Org-wide items). No Site switcher. */
export default function SiteCalendarPage({
  params,
}: {
  params: Promise<{ id: string; siteId: string }>;
}) {
  const { id: organizationId, siteId } = use(params);
  return <CalendarView scope="site" organizationId={organizationId} siteId={siteId} />;
}
