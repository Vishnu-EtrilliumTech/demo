"use client";

import { useEffect, type ReactNode } from "react";
import { X, type LucideIcon } from "lucide-react";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  /** Danger styling for the header icon (delete confirmations). */
  danger?: boolean;
  /** Narrow (440px) variant. */
  small?: boolean;
  /** Wide (80vw) variant — for data-heavy dialogs (e.g. eCourts search). */
  wide?: boolean;
  /** Optional action rendered in the header, to the left of the close button. */
  headerAction?: ReactNode;
  children?: ReactNode;
  /** Footer actions (buttons). */
  footer?: ReactNode;
}

/**
 * Modal dialog (`.dialog-backdrop`/`.dialog`). Closes on Escape and backdrop
 * click. Rendered inline within the `.lui-root` scope; the backdrop is
 * fixed-positioned so it covers the viewport.
 */
export function Dialog({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  danger = false,
  small = false,
  wide = false,
  headerAction,
  children,
  footer,
}: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop open" onClick={onClose}>
      <div
        className={`dialog${small ? " sm" : ""}${wide ? " wide" : ""}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          {Icon ? (
            <div className={`di${danger ? " danger" : ""}`}>
              <Icon aria-hidden />
            </div>
          ) : null}
          <div className="dt">
            <b>{title}</b>
            {subtitle ? <span>{subtitle}</span> : null}
          </div>
          {headerAction ? <div className="dialog-head-action">{headerAction}</div> : null}
          <button type="button" className="x" onClick={onClose} aria-label="Close">
            <X aria-hidden />
          </button>
        </div>
        <div className="dialog-body">{children}</div>
        {footer ? <div className="dialog-foot">{footer}</div> : null}
      </div>
    </div>
  );
}
