"use client";

import type { MouseEvent } from "react";
import type { CalendarItem, Priority } from "@/app/organization/types/calendarTypes";
import { priorityColor } from "@/app/organization/types/calendarTypes";
import { PriorityPicker } from "@/components/modals/PriorityPicker";
import { formatTime, sameDay, WEEKDAY_LABELS } from "./calendarDateUtils";

interface MonthViewProps {
  monthDate: Date;
  items: CalendarItem[];
  today: Date;
  onDayClick: (d: Date, e: MouseEvent<HTMLElement>) => void;
  onItemClick: (item: CalendarItem, e: MouseEvent<HTMLElement>) => void;
  onMoreClick: (d: Date, dayItems: CalendarItem[], e: MouseEvent<HTMLElement>) => void;
  onPriorityChange: (item: CalendarItem, priority: Priority) => void;
}

const MAX_VISIBLE = 3;
const MAX_TAGGED_CHIPS = 2;

export default function CalendarMonthView({
  monthDate,
  items,
  today,
  onDayClick,
  onItemClick,
  onMoreClick,
  onPriorityChange,
}: MonthViewProps) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startOffset = first.getDay();
  // Always render a fixed 6-week (42-day) grid, matching both the classic
  // Google Calendar convention and useCalendarItems.rangeFor's month-range
  // fetch — a dynamic 4/5/6-row count would fetch data for trailing days
  // this grid never renders a cell for, silently hiding those items.
  const rows = 6;

  const gridStart = new Date(first);
  gridStart.setDate(gridStart.getDate() - startOffset);

  const cells: Date[] = Array.from({ length: rows * 7 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const itemsFor = (d: Date) =>
    items
      .filter((it) => sameDay(new Date(it.date), d))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="gcal-month">
      <div className="gcal-month-dow">
        {WEEKDAY_LABELS.map((l) => (
          <div key={l} className="gcal-month-dow-cell">
            {l}
          </div>
        ))}
      </div>
      <div className="gcal-month-grid" style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}>
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === monthDate.getMonth();
          const isToday = sameDay(d, today);
          const dayItems = itemsFor(d);
          const visible = dayItems.slice(0, MAX_VISIBLE);
          const overflow = dayItems.length - visible.length;

          return (
            <div key={i} className={`gcal-day${inMonth ? "" : " out"}`} onClick={(e) => onDayClick(d, e)}>
              <div className="gcal-day-num-row">
                <span className={`gcal-day-num${isToday ? " today" : ""}`}>{d.getDate()}</span>
              </div>
              <div className="gcal-day-events">
                {visible.map((it) => {
                  const color = priorityColor(it.priority);
                  const taggedNote = it.itemType === "Note" ? it.taggedUserIds : null;
                  return (
                    <div
                      key={`${it.itemType}-${it.id}`}
                      className="gcal-event dot"
                      style={{ borderLeftColor: color }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick(it, e);
                      }}
                    >
                      <span
                        className="gcal-event-swatch"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <PriorityPicker
                          compact
                          value={it.priority}
                          onChange={(p) => onPriorityChange(it, p)}
                        />
                      </span>
                      <span className="gcal-event-time">{formatTime(new Date(it.date))}</span>
                      <span className="gcal-event-title">
                        {it.title}
                        {taggedNote && taggedNote.length > MAX_TAGGED_CHIPS && (
                          <span style={{ opacity: 0.6 }}> +{taggedNote.length - MAX_TAGGED_CHIPS} more</span>
                        )}
                      </span>
                    </div>
                  );
                })}
                {overflow > 0 && (
                  <button
                    type="button"
                    className="gcal-more"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoreClick(d, dayItems, e);
                    }}
                  >
                    {overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
