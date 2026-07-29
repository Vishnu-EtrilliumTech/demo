"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, sameDay } from "./calendarDateUtils";

interface MiniCalendarProps {
  monthDate: Date;
  selectedDate: Date;
  today: Date;
  onSelectDate: (d: Date) => void;
  onChangeMonth: (d: Date) => void;
}

/** Small month-picker widget in the Calendar sidebar (ported from the retired Diary scaffolding). */
export default function MiniCalendar({ monthDate, selectedDate, today, onSelectDate, onChangeMonth }: MiniCalendarProps) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startOffset = first.getDay();
  const gridStart = new Date(first);
  gridStart.setDate(gridStart.getDate() - startOffset);

  const cells: Date[] = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="gcal-mini">
      <div className="gcal-mini-head">
        <span>{monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
        <div className="gcal-mini-nav">
          <button type="button" aria-label="Previous month" onClick={() => onChangeMonth(addMonths(monthDate, -1))}>
            <ChevronLeft size={16} />
          </button>
          <button type="button" aria-label="Next month" onClick={() => onChangeMonth(addMonths(monthDate, 1))}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="gcal-mini-grid gcal-mini-dow">
        {["S", "M", "T", "W", "T", "F", "S"].map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
      <div className="gcal-mini-grid">
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === monthDate.getMonth();
          const isToday = sameDay(d, today);
          const isSelected = sameDay(d, selectedDate);
          return (
            <button
              type="button"
              key={i}
              className={`gcal-mini-cell${inMonth ? "" : " out"}${isToday ? " today" : ""}${isSelected && !isToday ? " selected" : ""}`}
              onClick={() => onSelectDate(d)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
