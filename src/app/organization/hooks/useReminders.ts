"use client";

import { useEffect, useState } from "react";
import { fetchCalendar } from "@/app/organization/services/calendarApi";
import { fetchOrganizationCases } from "@/app/organization/services/api";
import type {
  CalendarItem,
  HearingCalendarItem,
  NoteCalendarItem,
  ReminderSet,
  TaskCalendarItem,
} from "@/app/organization/types/calendarTypes";

const isTask = (i: CalendarItem): i is TaskCalendarItem => i.itemType === "Task";
const isHearing = (i: CalendarItem): i is HearingCalendarItem => i.itemType === "Hearing";
const isNote = (i: CalendarItem): i is NoteCalendarItem => i.itemType === "Note";

const FAR_PAST = new Date(0).toISOString();
const FAR_FUTURE = new Date("2100-01-01").toISOString();

/**
 * Combines the current user's Tasks/Hearings/Notes (via the Calendar feed,
 * which already scopes to "created by or assigned/tagged to me") with their
 * favourite cases (a separate call — see data-model.md's Reminder Set /
 * research.md's Option-A rationale) into one "my items" view.
 */
export function useReminders(organizationId: string) {
  const [reminders, setReminders] = useState<ReminderSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const [items, casePage] = await Promise.all([
          fetchCalendar(organizationId, { from: FAR_PAST, to: FAR_FUTURE }),
          fetchOrganizationCases(organizationId, { pageSize: 200, favouritesOnly: true }),
        ]);
        if (cancelled) return;
        setReminders({
          tasks: items.filter(isTask),
          hearings: items.filter(isHearing),
          notes: items.filter(isNote),
          favouriteCases: casePage.items.filter((c) => c.isFavourite),
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  return { reminders, isLoading };
}
