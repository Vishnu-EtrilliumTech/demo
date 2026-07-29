"use client";

import { Toggle } from "@/design-system";
import type { CalendarItemType } from "@/app/organization/types/calendarTypes";
import type { Site } from "@/app/organization/types";

const TYPE_META: { key: CalendarItemType; label: string; color: string }[] = [
  { key: "Hearing", label: "Hearings", color: "#1a73e8" },
  { key: "Task", label: "Tasks", color: "#1a73e8" },
  { key: "Note", label: "Notes", color: "#1a73e8" },
];

interface CalendarFilterBarProps {
  /** Site dropdown only renders in org scope. */
  scope: "org" | "site";
  sites: Site[];
  siteId: string;
  onSiteChange: (siteId: string) => void;
  favouritesOnly: boolean;
  onFavouritesOnlyChange: (value: boolean) => void;
  types: CalendarItemType[];
  onTypesChange: (types: CalendarItemType[]) => void;
}

/** Calendar sidebar filter controls: Site (org scope only), Favourites-only toggle, item-type checkboxes. */
export default function CalendarFilterBar({
  scope,
  sites,
  siteId,
  onSiteChange,
  favouritesOnly,
  onFavouritesOnlyChange,
  types,
  onTypesChange,
}: CalendarFilterBarProps) {
  const toggleType = (key: CalendarItemType) => {
    onTypesChange(types.includes(key) ? types.filter((t) => t !== key) : [...types, key]);
  };

  return (
    <div className="gcal-filters">
      {scope === "org" && (
        <select
          className="gcal-filter-select input"
          aria-label="Filter by Site"
          value={siteId}
          onChange={(e) => onSiteChange(e.target.value)}
        >
          <option value="">All Sites</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}

      <div className="gcal-filter-toggle-row">
        <span>Favourites only</span>
        <Toggle checked={favouritesOnly} onChange={onFavouritesOnlyChange} aria-label="Favourites only" />
      </div>

      <div className="gcal-filters-head">Item types</div>
      {TYPE_META.map((m) => (
        <label key={m.key} className="gcal-filter-row">
          <input type="checkbox" checked={types.includes(m.key)} onChange={() => toggleType(m.key)} />
          <span className="gcal-filter-checkbox" style={types.includes(m.key) ? { background: m.color, borderColor: m.color } : undefined} />
          <span>{m.label}</span>
        </label>
      ))}
    </div>
  );
}
