"use client";

import { useMemo, useState } from "react";
import { X, Gavel, ListTodo, StickyNote, CalendarClock } from "lucide-react";
import { PriorityPicker } from "@/components/modals/PriorityPicker";
import type { CalendarItem, CalendarItemType, Priority } from "@/app/organization/types/calendarTypes";
import { priorityColor } from "@/app/organization/types/calendarTypes";
import { sameDay, formatTime } from "./calendarDateUtils";

const ALL_TYPES: CalendarItemType[] = ["Hearing", "Task", "Note"];

interface DayDetailPanelProps {
  date: Date;
  items: CalendarItem[];
  canCreateTask: boolean;
  canCreateNote: boolean;
  onClose: () => void;
  onItemClick: (item: CalendarItem) => void;
  onAdd: (kind: "Hearing" | "Task" | "Note") => void;
  onPriorityChange: (item: CalendarItem, priority: Priority) => void;
}

/**
 * Right-side panel opened when a user clicks a specific Calendar date: lists
 * every Hearing/Task/Note on that date, with its own type/favourites filters
 * (independent of the main Calendar filter bar) so the user can narrow down
 * just this day's items, plus "+Add" actions seeded to this date.
 */
export default function DayDetailPanel({
  date,
  items,
  canCreateTask,
  canCreateNote,
  onClose,
  onItemClick,
  onAdd,
  onPriorityChange,
}: DayDetailPanelProps) {
  const [types, setTypes] = useState<CalendarItemType[]>(ALL_TYPES);
  const [favouritesOnly, setFavouritesOnly] = useState(false);

  const dayItems = useMemo(
    () =>
      items
        .filter((it) => sameDay(new Date(it.date), date))
        .filter((it) => types.includes(it.itemType))
        .filter((it) => !favouritesOnly || it.isFavouriteCase)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [items, date, types, favouritesOnly],
  );

  const toggleType = (t: CalendarItemType) => {
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  return (
    <div className="gcal-daypanel" role="complementary" aria-label="Day details">
      <div className="gcal-daypanel-head">
        <div>
          <div className="gcal-daypanel-date">
            {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </div>
          <div className="gcal-daypanel-count">
            {dayItems.length} item{dayItems.length === 1 ? "" : "s"}
          </div>
        </div>
        <button type="button" className="gcal-icon-btn" aria-label="Close day details" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="gcal-daypanel-add">
        <button type="button" className="gcal-daypanel-addbtn" onClick={() => onAdd("Hearing")}>
          <Gavel size={14} /> Hearing
        </button>
        {canCreateTask && (
          <button type="button" className="gcal-daypanel-addbtn" onClick={() => onAdd("Task")}>
            <ListTodo size={14} /> Task
          </button>
        )}
        {canCreateNote && (
          <button type="button" className="gcal-daypanel-addbtn" onClick={() => onAdd("Note")}>
            <StickyNote size={14} /> Note
          </button>
        )}
      </div>

      <div className="gcal-daypanel-filters">
        {ALL_TYPES.map((t) => (
          <label key={t} className="gcal-daypanel-filter-chip">
            <input type="checkbox" checked={types.includes(t)} onChange={() => toggleType(t)} />
            {t}s
          </label>
        ))}
        <label className="gcal-daypanel-filter-chip">
          <input type="checkbox" checked={favouritesOnly} onChange={(e) => setFavouritesOnly(e.target.checked)} />
          Favourites only
        </label>
      </div>

      <div className="gcal-daypanel-list">
        {dayItems.length === 0 ? (
          <div className="gcal-daypanel-empty">
            <CalendarClock size={20} aria-hidden />
            <span>No items match these filters for this day.</span>
          </div>
        ) : (
          dayItems.map((it) => (
            <div key={`${it.itemType}-${it.id}`} className="gcal-daypanel-item" style={{ borderLeftColor: priorityColor(it.priority) }}>
              <button type="button" className="gcal-daypanel-item-main" onClick={() => onItemClick(it)}>
                <span className="gcal-daypanel-item-time">{formatTime(new Date(it.date))}</span>
                <span className="gcal-daypanel-item-type">{it.itemType}</span>
                <span className="gcal-daypanel-item-title">{it.title}</span>
              </button>
              <span onClick={(e) => e.stopPropagation()}>
                <PriorityPicker compact value={it.priority} onChange={(p) => onPriorityChange(it, p)} />
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
