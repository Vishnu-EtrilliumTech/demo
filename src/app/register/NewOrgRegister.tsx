"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Landmark, CalendarClock, ShieldCheck } from "lucide-react";
import { AuthLayout } from "@/design-system";
import { AuthOverlay } from "@/components/auth/AuthOverlay";
import { GoogleSignIn } from "@/components/auth/GoogleSignIn";
import { exchangeGoogleCredential } from "@/components/auth/googleAuth";

/**
 * Reframed organization registration (Google-only). "Sign up with Google" →
 * onboarding wizard for new firms; an existing account is signed straight in.
 * Rendered only when the `register` flag is on and the role is organizationuser;
 * otherwise the legacy multi-role register page is used unchanged.
 */
export function NewOrgRegister() {
  const router = useRouter();

  const handleSuccess = (cr: { credential?: string }) => {
    exchangeGoogleCredential(cr.credential, {
      role: "organizationuser",
      onNewUser: () => router.push("/onboarding"),
    }).then((outcome) => {
      if (outcome === "error") alert("Sign-up failed. Please try again.");
    });
  };

  return (
    <AuthOverlay>
      <AuthLayout
        logo={<Image src="/logo-white.png" alt="Lawsome" width={130} height={30} priority />}
        panelHeadline="Set up your firm in minutes"
        highlights={[
          { icon: Building2, title: "Sites & team", description: "Every matter in one workspace" },
          { icon: Landmark, title: "eCourts sync", description: "Court records & cause-list monitoring" },
          { icon: CalendarClock, title: "Hearing reminders", description: "Never miss a date" },
        ]}
        panelFoot={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck width={14} height={14} /> © 2026 eTrillium Technologies LLP
          </span>
        }
      >
        <h1>Register your organization</h1>
        <p className="lead">
          You&apos;ll be the organization admin and set up your firm in the next few steps.
        </p>
        <GoogleSignIn label="Sign up with Google" onSuccess={handleSuccess} />
        <p className="terms">By continuing you agree to our Terms &amp; Privacy Policy.</p>
        <p className="a-alt">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </AuthLayout>
    </AuthOverlay>
  );
}
