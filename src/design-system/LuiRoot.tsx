import type { ReactNode } from "react";
import { Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";

import "./styles/tokens.css";
import "./styles/components.css";
import "./styles/patterns.css";

/**
 * Design-system font faces, self-hosted by next/font at build time (no runtime
 * request to Google — CSP-safe). Exposed as CSS variables that the `--sans` /
 * `--serif` tokens bind to on the `.lui-root` scope (see components.css).
 */
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lui-sans",
  display: "swap",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-lui-serif",
  display: "swap",
});

export interface LuiRootProps {
  children: ReactNode;
  /** Extra classes on the scope wrapper. */
  className?: string;
  /** Render as a bare fragment-like block without min-height (default false). */
  as?: "div" | "section" | "main";
}

/**
 * Opt-in wrapper that establishes the Lawsome design-system scope. Everything
 * inside `.lui-root` inherits the ported tokens, fonts, and component styles;
 * nothing leaks out, so legacy screens are unaffected. A migrated screen renders
 * its subtree inside a single <LuiRoot>.
 */
export function LuiRoot({ children, className, as = "div" }: LuiRootProps) {
  const Tag = as;
  return (
    <Tag className={`lui-root ${sans.variable} ${serif.variable}${className ? ` ${className}` : ""}`}>
      {children}
    </Tag>
  );
}

export default LuiRoot;
