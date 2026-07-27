import type { ReactNode } from "react";
import { Check } from "lucide-react";

export interface WizardStep {
  key: string;
  label: string;
  desc?: string;
}

/** Vertical stepper rail (for the dark onboarding panel). */
export function StepperRail({ steps, current }: { steps: WizardStep[]; current: number }) {
  return (
    <div className="stepper">
      {steps.map((step, i) => {
        const state = i < current ? "done" : i === current ? "active" : "";
        return (
          <div className={`step${state ? ` ${state}` : ""}`} key={step.key}>
            <span className="num">{i < current ? <Check aria-hidden /> : i + 1}</span>
            <span className="lbl">
              <b>{step.label}</b>
              {step.desc ? <span>{step.desc}</span> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Top progress bar: fills to (current+1)/total. */
export function WizardProgress({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round(((current + 1) / total) * 100) : 0;
  return (
    <div className="ob-top">
      <div className="bar" style={{ width: `${pct}%` }} />
    </div>
  );
}

export interface StepWizardProps {
  steps: WizardStep[];
  current: number;
  kicker?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  children: ReactNode;
  /** Footer actions (Back / Continue). */
  actions?: ReactNode;
}

/**
 * Wizard content column: progress bar + step header + body + actions. Pair with
 * <StepperRail> in a dark panel for the full onboarding layout.
 */
export function StepWizard({ steps, current, kicker, title, lead, children, actions }: StepWizardProps) {
  return (
    <div>
      <WizardProgress current={current} total={steps.length} />
      {kicker ? <div className="ob-kicker">{kicker}</div> : null}
      <h2 className="ob-h">{title}</h2>
      {lead ? <div className="ob-lead">{lead}</div> : null}
      {children}
      {actions ? <div className="ob-actions">{actions}</div> : null}
    </div>
  );
}
