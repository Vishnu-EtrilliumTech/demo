"use client";

import { type CredentialResponse } from "@react-oauth/google";
import { GoogleButton } from "@/design-system";

interface GoogleSignInProps {
  label?: string;
  onSuccess: (cr: CredentialResponse) => void;
  onError?: () => void;
  /** Kept for API compatibility; unused in the prototype. */
  width?: number;
}

/**
 * PROTOTYPE: offline "Continue with Google" button. There is no real Google
 * OAuth in this build — clicking immediately resolves with the mock JWT so the
 * normal sign-in flow (exchange → /auth dispatcher → dashboard) still runs.
 */
export function GoogleSignIn({ label = "Continue with Google", onSuccess }: GoogleSignInProps) {
  const handleClick = () => {
    const credential = (globalThis as { __MOCK_JWT__?: string }).__MOCK_JWT__ ?? "mock-google-credential";
    onSuccess({ credential } as CredentialResponse);
  };
  return (
    <div style={{ position: "relative", width: "100%", cursor: "pointer" }} onClick={handleClick}>
      <GoogleButton>{label}</GoogleButton>
    </div>
  );
}
