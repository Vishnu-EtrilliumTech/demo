"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface TabItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  /** Optional count badge. */
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

/** Data-driven underline tabs (`.tabs`/`.tab`), with prev/next nav buttons that step the active tab and keep it scrolled into view. Controlled by the parent. */
export function Tabs({ items, activeKey, onChange, className }: TabsProps) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const activeIndex = items.findIndex((item) => item.key === activeKey);

  useEffect(() => {
    tabRefs.current[activeKey]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeKey]);

  const step = (delta: number) => {
    const next = items[activeIndex + delta];
    if (next) onChange(next.key);
  };

  return (
    <div className={`tabs-row${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className="tabs-nav"
        aria-label="Previous tab"
        disabled={activeIndex <= 0}
        onClick={() => step(-1)}
      >
        <ChevronLeft aria-hidden />
      </button>
      <div className="tabs" role="tablist">
        {items.map(({ key, label, icon: Icon, count, disabled }) => {
          const active = key === activeKey;
          return (
            <button
              key={key}
              ref={(el) => {
                tabRefs.current[key] = el;
              }}
              type="button"
              role="tab"
              aria-selected={active}
              aria-disabled={disabled}
              disabled={disabled}
              className={`tab${active ? " active" : ""}`}
              onClick={() => !disabled && onChange(key)}
            >
              {Icon ? <Icon aria-hidden /> : null}
              {label}
              {typeof count === "number" ? <span className="count">{count}</span> : null}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="tabs-nav"
        aria-label="Next tab"
        disabled={activeIndex === -1 || activeIndex >= items.length - 1}
        onClick={() => step(1)}
      >
        <ChevronRight aria-hidden />
      </button>
    </div>
  );
}
