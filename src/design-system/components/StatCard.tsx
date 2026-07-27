import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

export type StatTone = "brand" | "ok" | "warn" | "violet";

export interface StatCardProps {
  icon: LucideIcon;
  tone?: StatTone;
  value: ReactNode;
  label: ReactNode;
  /** Optional delta chip, e.g. "+12" this month. */
  delta?: { value: ReactNode; direction?: "up" | "down" };
  onClick?: () => void;
}

const toneClass: Record<StatTone, string> = {
  brand: "",
  ok: " ok",
  warn: " warn",
  violet: " violet",
};

/** Dashboard KPI stat card (`.statcard`). Clickable when `onClick` is given. */
export function StatCard({ icon: Icon, tone = "brand", value, label, delta, onClick }: StatCardProps) {
  const clickable = typeof onClick === "function";
  return (
    <div
      className="statcard"
      style={clickable ? { cursor: "pointer" } : undefined}
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className="st-top">
        <div className={`st-ic${toneClass[tone]}`}>
          <Icon aria-hidden />
        </div>
        {delta ? (
          <span className={`st-delta${delta.direction === "down" ? " down" : ""}`}>
            {delta.direction === "down" ? <ArrowDownRight aria-hidden /> : <ArrowUpRight aria-hidden />}
            {delta.value}
          </span>
        ) : null}
      </div>
      <div className="st-n">{value}</div>
      <div className="st-l">{label}</div>
    </div>
  );
}

export interface KpiCardProps {
  icon: LucideIcon;
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
}

/** Compact KPI icon card (`.kpi`), used in the case-workspace strip. */
export function KpiCard({ icon: Icon, label, value, sub }: KpiCardProps) {
  return (
    <div className="kpi">
      <div className="ic">
        <Icon aria-hidden />
      </div>
      <div className="k">{label}</div>
      <div className="v">
        {value}
        {sub ? <small>{sub}</small> : null}
      </div>
    </div>
  );
}

export interface MeterRow {
  label: ReactNode;
  value: ReactNode;
  /** 0–100. */
  percent: number;
  color: string;
}

/** Horizontal bar meter (e.g. cases by status). */
export function Meter({ rows }: { rows: MeterRow[] }) {
  return (
    <div className="meter">
      {rows.map((r, i) => (
        <div className="m" key={i}>
          <div className="mh">
            <span className="lbl">
              <span className="dot" style={{ background: r.color }} />
              {r.label}
            </span>
            <span className="val">{r.value}</span>
          </div>
          <div className="track">
            <span
              className="fill"
              style={{ width: `${Math.max(0, Math.min(100, r.percent))}%`, background: r.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Single progress bar (`.linebar`). */
export function LineBar({ percent, color }: { percent: number; color?: string }) {
  return (
    <div className="linebar">
      <span
        className="f"
        style={{ width: `${Math.max(0, Math.min(100, percent))}%`, ...(color ? { background: color } : {}) }}
      />
    </div>
  );
}
