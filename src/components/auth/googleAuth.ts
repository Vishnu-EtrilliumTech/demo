import { jwtDecode } from "jwt-decode";
import { storeToken } from "@/services/authServices";

export type GoogleExchangeOutcome = "existing" | "new" | "error";

interface ExchangeOptions {
  role?: string;
  /** Called when Google is verified but no account exists yet (new user). */
  onNewUser: (email: string | undefined) => void;
}

/**
 * Exchange a Google credential for a Lawsome session — identical behaviour to the
 * legacy Header flow (Phase-0 contract): POST /api/auth/google; on success store
 * the JWT and hand off to the /auth dispatcher; on failure treat as a new user,
 * stash the credential, and route onward (register/onboarding).
 */
export async function exchangeGoogleCredential(
  googleIdToken: string | undefined,
  { role = "organizationuser", onNewUser }: ExchangeOptions,
): Promise<GoogleExchangeOutcome> {
  if (!googleIdToken) return "error";
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ googleIdToken }),
    });
    if (res.ok) {
      const data = await res.json();
      storeToken(data.data.token);
      window.location.href = `/auth?role=${role}`;
      return "existing";
    }
    sessionStorage.setItem("pending_google_credential", googleIdToken);
    let email: string | undefined;
    try {
      email = jwtDecode<{ email?: string }>(googleIdToken).email;
    } catch {
      email = undefined;
    }
    onNewUser(email);
    return "new";
  } catch (error) {
    console.error("Google exchange failed:", error);
    return "error";
  }
}
