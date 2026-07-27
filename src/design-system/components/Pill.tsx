import type { ReactNode } from "react";

export type PillTone = "brand" | "ok" | "warn" | "danger" | "neutral" | "line";

export interface PillProps {
  tone?: PillTone;
  /** Show a leading status dot in the current color. */
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

/** Status pill / tag. Renders `.pill` + `.pill-{tone}`. */
export function Pill({ tone = "neutral", dot = false, children, className }: PillProps) {
  return (
    <span className={`pill pill-${tone}${className ? ` ${className}` : ""}`}>
      {dot ? <span className="d" aria-hidden /> : null}
      {children}
    </span>
  );
}
