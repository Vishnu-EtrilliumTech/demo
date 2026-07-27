"use client";

import type { ReactNode } from "react";
import { LuiRoot } from "@/design-system";

/**
 * Full-screen design-system overlay for the new auth surfaces (Login, Register,
 * Onboarding). Renders above the legacy marketing chrome so no LayoutClient
 * change is needed — the new pages are fully self-contained and non-invasive.
 */
export function AuthOverlay({ children }: { children: ReactNode }) {
  return (
    <LuiRoot>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          overflow: "auto",
          background: "var(--bg)",
        }}
      >
        {children}
      </div>
    </LuiRoot>
  );
}
