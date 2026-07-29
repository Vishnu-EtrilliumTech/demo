"use client";

import { use } from "react";
import CalendarView from "@/app/organization/components/calendar/CalendarView";

/** Organization-level Calendar route: Hearings/Tasks/Notes across every Site. */
export default function OrganizationCalendarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: organizationId } = use(params);
  return <CalendarView scope="org" organizationId={organizationId} />;
}
