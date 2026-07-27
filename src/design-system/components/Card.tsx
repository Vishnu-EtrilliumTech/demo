import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface CardProps {
  /** Apply the standard 22px padding. */
  pad?: boolean;
  children: ReactNode;
  className?: string;
}

/** Surface card. Renders `.card` (+ `.card-pad`). */
export function Card({ pad = false, children, className }: CardProps) {
  return (
    <div className={`card${pad ? " card-pad" : ""}${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}

export interface SectionHeadProps {
  icon?: LucideIcon;
  title: ReactNode;
  /** Right-aligned actions (buttons, pills). */
  actions?: ReactNode;
  /** Padded variant for card headers that sit above a full-bleed table. */
  padded?: boolean;
}

/** Card section header: optional icon tile + title + actions. */
export function SectionHead({ icon: Icon, title, actions, padded = false }: SectionHeadProps) {
  return (
    <div className={`sec-head${padded ? " pd" : ""}`}>
      <h3>
        {Icon ? (
          <span className="ic">
            <Icon aria-hidden />
          </span>
        ) : null}
        {title}
      </h3>
      {actions}
    </div>
  );
}
