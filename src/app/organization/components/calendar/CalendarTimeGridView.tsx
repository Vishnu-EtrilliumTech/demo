"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import type { CalendarItem } from "@/app/organization/types/calendarTypes";
import { priorityColor } from "@/app/organization/types/calendarTypes";
import { formatTime, sameDay } from "./calendarDateUtils";

interface TimeGridViewProps {
  days: Date[];
  items: CalendarItem[];
  today: Date;
  onSlotClick: (d: Date, e: MouseEvent<HTMLElement>) => void;
  onItemClick: (item: CalendarItem, e: MouseEvent<HTMLElement>) => void;
}

const ROW_HEIGHT = 48;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function hourLabel(h: number) {
  if (h === 0) return "";
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12} ${period}`;
}

/**
 * Shared Week/Day time grid (ported from the retired Diary scaffolding).
 * `days` is a single date for Day view or 7 consecutive dates for Week view —
 * mirroring the original Diary component, which used one grid for both.
 */
export default function CalendarTimeGridView({ days, items, today, onSlotClick, onItemClick }: TimeGridViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: ROW_HEIGHT * 7 });
  }, []);

  const timedFor = (d: Date) =>
    items
      .filter((it) => sameDay(new Date(it.date), d))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const now = new Date();
  const nowTop = (now.getHours() * 60 + now.getMinutes()) * (ROW_HEIGHT / 60);

  return (
    <div className="gcal-timegrid">
      <div className="gcal-tg-header">
        <div className="gcal-tg-gutter" />
        {days.map((d, i) => {
          const isToday = sameDay(d, today);
          return (
            <div key={i} className="gcal-tg-daycol-head">
              <span className="gcal-tg-dow">{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
              <span className={`gcal-day-num${isToday ? " today" : ""}`}>{d.getDate()}</span>
            </div>
          );
        })}
      </div>

      <div className="gcal-tg-scroll" ref={scrollRef}>
        <div className="gcal-tg-body" style={{ height: ROW_HEIGHT * 24 }}>
          <div className="gcal-tg-gutter-col">
            {HOURS.map((h) => (
              <div key={h} className="gcal-tg-hour" style={{ height: ROW_HEIGHT }}>
                <span>{hourLabel(h)}</span>
              </div>
            ))}
          </div>
          {days.map((d, i) => {
            const isToday = sameDay(d, today);
            return (
              <div key={i} className="gcal-tg-daycol">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="gcal-tg-slot"
                    style={{ height: ROW_HEIGHT }}
                    onClick={(e) => {
                      const slotDate = new Date(d);
                      slotDate.setHours(h, 0, 0, 0);
                      onSlotClick(slotDate, e);
                    }}
                  />
                ))}
                {timedFor(d).map((it) => {
                  const date = new Date(it.date);
                  const color = priorityColor(it.priority);
                  const top = (date.getHours() * 60 + date.getMinutes()) * (ROW_HEIGHT / 60);
                  return (
                    <div
                      key={`${it.itemType}-${it.id}`}
                      className="gcal-tg-event"
                      style={{ top, height: ROW_HEIGHT - 4, background: color, color: "#fff" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick(it, e);
                      }}
                    >
                      <span className="gcal-tg-event-time">{formatTime(date)}</span>
                      <span className="gcal-tg-event-title">{it.title}</span>
                    </div>
                  );
                })}
                {isToday && <div className="gcal-tg-now" style={{ top: nowTop }} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
