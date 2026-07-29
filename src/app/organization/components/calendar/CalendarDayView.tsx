"use client";

import type { MouseEvent } from "react";
import type { CalendarItem } from "@/app/organization/types/calendarTypes";
import CalendarTimeGridView from "./CalendarTimeGridView";

interface CalendarDayViewProps {
  anchorDate: Date;
  items: CalendarItem[];
  today: Date;
  onSlotClick: (d: Date, e: MouseEvent<HTMLElement>) => void;
  onItemClick: (item: CalendarItem, e: MouseEvent<HTMLElement>) => void;
}

/** Day view: a single day, rendered on the shared time grid. */
export default function CalendarDayView({ anchorDate, items, today, onSlotClick, onItemClick }: CalendarDayViewProps) {
  return <CalendarTimeGridView days={[anchorDate]} items={items} today={today} onSlotClick={onSlotClick} onItemClick={onItemClick} />;
}
