import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";

export interface FieldProps {
  label?: ReactNode;
  required?: boolean;
  /** Hint text; shown red when `error` is set. */
  hint?: ReactNode;
  error?: boolean;
  full?: boolean;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}

/** Labelled form field wrapper: label + control + hint/error. */
export function Field({
  label,
  required,
  hint,
  error,
  full,
  children,
  className,
  htmlFor,
}: FieldProps) {
  return (
    <div
      className={`field${error ? " err" : ""}${full ? " full" : ""}${
        className ? ` ${className}` : ""
      }`}
    >
      {label ? (
        <label htmlFor={htmlFor}>
          {label}
          {required ? <span className="req"> *</span> : null}
        </label>
      ) : null}
      {children}
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`input${className ? ` ${className}` : ""}`} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`input${className ? ` ${className}` : ""}`} {...rest} />;
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`input${className ? ` ${className}` : ""}`} {...rest}>
      {children}
    </select>
  );
}

export interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** Icon rendered inside the sliding knob (e.g. swap by `checked` at the call site). */
  icon?: LucideIcon;
  /** Accessible label (visually provided by the adjacent settings row). */
  "aria-label"?: string;
}

/** Preference switch. Controlled — parent owns state. */
export function Toggle({ checked, onChange, disabled, icon: Icon, ...aria }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`toggle${checked ? " on" : ""}${Icon ? " has-icon" : ""}`}
      onClick={() => onChange(!checked)}
      {...aria}
    >
      {Icon ? (
        <span className="toggle-thumb">
          <Icon width={12} height={12} aria-hidden />
        </span>
      ) : null}
    </button>
  );
}
