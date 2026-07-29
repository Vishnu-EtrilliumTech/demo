"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchCalendar } from "@/app/organization/services/calendarApi";
import { fetchOrganization } from "@/app/organization/services/api";
import type { CalendarItem, CalendarItemType } from "@/app/organization/types/calendarTypes";
import { addDays, startOfWeek } from "@/app/organization/components/calendar/calendarDateUtils";

export type CalendarViewMode = "month" | "week" | "day";

const ALL_TYPES: CalendarItemType[] = ["Hearing", "Task", "Note"];

function rangeFor(view: CalendarViewMode, anchorDate: Date): { from: string; to: string } {
  if (view === "day") {
    const from = new Date(anchorDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(anchorDate);
    to.setHours(23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  }
  if (view === "week") {
    const start = startOfWeek(anchorDate);
    const end = addDays(start, 6);
    end.setHours(23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString() };
  }
  // month: pad to the full 6-week grid so overflow days from adjacent months are included
  const first = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(gridStart.getDate() - first.getDay());
  const gridEnd = addDays(gridStart, 41);
  gridEnd.setHours(23, 59, 59, 999);
  return { from: gridStart.toISOString(), to: gridEnd.toISOString() };
}

interface UseCalendarItemsOptions {
  organizationId: string;
  /** Fixed site scope (Site-level Calendar); omit for the Org-level Calendar. */
  fixedSiteId?: string;
}

/**
 * Drives the Calendar's fetched item set: date range (from view + anchorDate),
 * Site/Favourites/type filters (types default from the org's configured
 * `defaultCalendarItemTypes`, per FR-007/FR-008), and refetch on navigation.
 */
export function useCalendarItems({ organizationId, fixedSiteId }: UseCalendarItemsOptions) {
  const [view, setView] = useState<CalendarViewMode>("month");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [siteId, setSiteId] = useState<string>(fixedSiteId ?? "");
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [types, setTypes] = useState<CalendarItemType[]>(ALL_TYPES);
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [defaultsApplied, setDefaultsApplied] = useState(false);

  // Seed the type filter from the org's configured default on first load only —
  // afterward the user's own session choice takes over (FR-008).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const org = await fetchOrganization(organizationId);
        if (!cancelled && org.defaultCalendarItemTypes && org.defaultCalendarItemTypes.length > 0) {
          setTypes(org.defaultCalendarItemTypes);
        }
      } finally {
        if (!cancelled) setDefaultsApplied(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { from, to } = rangeFor(view, anchorDate);
      const result = await fetchCalendar(organizationId, {
        from,
        to,
        siteId: fixedSiteId ?? siteId ?? undefined,
        favouritesOnly,
        types,
      });
      setItems(result);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fixedSiteId, siteId, favouritesOnly, types, view, anchorDate]);

  useEffect(() => {
    if (!defaultsApplied) return;
    refetch();
  }, [defaultsApplied, refetch]);

  return {
    view,
    setView,
    anchorDate,
    setAnchorDate,
    siteId: fixedSiteId ?? siteId,
    setSiteId,
    favouritesOnly,
    setFavouritesOnly,
    types,
    setTypes,
    items,
    isLoading,
    refetch,
  };
}
