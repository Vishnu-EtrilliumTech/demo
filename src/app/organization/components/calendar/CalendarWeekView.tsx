"use client";

import type { MouseEvent } from "react";
import type { CalendarItem } from "@/app/organization/types/calendarTypes";
import CalendarTimeGridView from "./CalendarTimeGridView";
import { addDays, startOfWeek } from "./calendarDateUtils";

interface CalendarWeekViewProps {
  anchorDate: Date;
  items: CalendarItem[];
  today: Date;
  onSlotClick: (d: Date, e: MouseEvent<HTMLElement>) => void;
  onItemClick: (item: CalendarItem, e: MouseEvent<HTMLElement>) => void;
}

/** Week view: 7 consecutive days starting Sunday, rendered on the shared time grid. */
export default function CalendarWeekView({ anchorDate, items, today, onSlotClick, onItemClick }: CalendarWeekViewProps) {
  const start = startOfWeek(anchorDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return <CalendarTimeGridView days={days} items={items} today={today} onSlotClick={onSlotClick} onItemClick={onItemClick} />;
}
