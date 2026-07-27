import type { ReactNode } from "react";
import { Inbox, TriangleAlert, type LucideIcon } from "lucide-react";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Token-driven loading spinner. */
export function Spinner({ size = "md", className }: SpinnerProps) {
  return <span className={`lui-spinner ${size}${className ? ` ${className}` : ""}`} role="status" aria-label="Loading" />;
}

export interface LoadingStateProps {
  message?: ReactNode;
  size?: "sm" | "md" | "lg";
}

/** Centered spinner + message. */
export function LoadingState({ message = "Loading…", size = "md" }: LoadingStateProps) {
  return (
    <div className="lui-loading">
      <Spinner size={size} />
      {message ? <span>{message}</span> : null}
    </div>
  );
}

export interface SkeletonProps {
  /** Number of shimmer rows (list placeholder). */
  rows?: number;
  className?: string;
  height?: number | string;
}

/** Shimmer skeleton — single block or `rows` list rows. */
export function Skeleton({ rows, className, height }: SkeletonProps) {
  if (rows && rows > 0) {
    return (
      <div aria-hidden>
        {Array.from({ length: rows }).map((_, i) => (
          <span key={i} className="lui-skeleton lui-skel-row" style={{ display: "block" }} />
        ))}
      </div>
    );
  }
  return (
    <span
      className={`lui-skeleton${className ? ` ${className}` : ""}`}
      style={{ height: height ?? 44 }}
      aria-hidden
    />
  );
}

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  /** Optional call-to-action rendered under the copy. */
  action?: ReactNode;
}

/** Empty-state block: icon tile + title + description + optional action. */
export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <div className="ei">
        <Icon aria-hidden />
      </div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}

export interface ErrorStateProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

/** Error-state block (danger-tinted empty state). */
export function ErrorState({
  title = "Something went wrong",
  description,
  action,
}: ErrorStateProps) {
  return (
    <div className="empty">
      <div className="ei" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
        <TriangleAlert aria-hidden />
      </div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}
