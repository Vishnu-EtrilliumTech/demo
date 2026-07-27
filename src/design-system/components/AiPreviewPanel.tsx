import type { ReactNode } from "react";
import { Info, Sparkles } from "lucide-react";

/** The mandated first-release AI disclaimer (REVAMP_SPEC §4). */
export const AI_ROADMAP_NOTE =
  "AI case intelligence is a roadmap preview — not part of the first release.";

export interface AiPreviewPanelProps {
  title: ReactNode;
  children: ReactNode;
  /** Roadmap note; defaults to the mandated disclaimer. */
  note?: ReactNode;
  footer?: ReactNode;
  /** Emphasised "lead" card treatment (blue-tinted header). */
  lead?: boolean;
}

/**
 * AI panel — ALWAYS labelled "Preview" and carrying the roadmap disclaimer.
 * The first-release rule is that AI is roadmap-only; this component makes the
 * labelling structural so an AI surface can never render without it.
 */
export function AiPreviewPanel({
  title,
  children,
  note = AI_ROADMAP_NOTE,
  footer,
  lead = true,
}: AiPreviewPanelProps) {
  return (
    <div className={`ai-card${lead ? " lead" : ""}`}>
      <div className="ai-head">
        <span className="spark">
          <Sparkles aria-hidden />
        </span>
        <b>{title}</b>
        <span className="soon">
          <Sparkles aria-hidden />
          Preview
        </span>
      </div>
      <div className="ai-note">
        <Info aria-hidden />
        {note}
      </div>
      <div className="ai-body">{children}</div>
      {footer ? <div className="ai-foot">{footer}</div> : null}
    </div>
  );
}
