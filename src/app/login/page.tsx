"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Landmark, CalendarClock, ShieldCheck } from "lucide-react";
import { AuthLayout, useFeatureFlag } from "@/design-system";
import { AuthOverlay } from "@/components/auth/AuthOverlay";
import { GoogleSignIn } from "@/components/auth/GoogleSignIn";
import { exchangeGoogleCredential } from "@/components/auth/googleAuth";

/**
 * New Login page (Google-only auth). Reuses the exact legacy exchange flow via
 * exchangeGoogleCredential. Gated by the `login` flag; when off it redirects to
 * the home page so the legacy Header-based sign-in remains the entry point.
 */
export default function LoginPage() {
  const enabled = useFeatureFlag("login");
  const router = useRouter();

  useEffect(() => {
    if (!enabled) router.replace("/");
  }, [enabled, router]);

  if (!enabled) return null;

  const handleSuccess = (cr: { credential?: string }) => {
    exchangeGoogleCredential(cr.credential, {
      role: "organizationuser",
      onNewUser: (email) =>
        router.push(
          `/register?role=organizationuser${email ? `&email=${encodeURIComponent(email)}` : ""}`,
        ),
    }).then((outcome) => {
      if (outcome === "error") alert("Login failed. Please try again.");
    });
  };

  return (
    <AuthOverlay>
      <AuthLayout
        logo={<Image src="/logo-white.png" alt="Lawsome" width={130} height={30} priority />}
        panelHeadline="Run your entire practice from one platform"
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
        <h1>Welcome back</h1>
        <p className="lead">Sign in to your firm&apos;s Lawsome workspace.</p>
        <GoogleSignIn onSuccess={handleSuccess} />
        <div className="gnote">Use your firm&apos;s Google Workspace or Gmail account.</div>
        <p className="a-alt">
          New to Lawsome?{" "}
          <Link href="/register?role=organizationuser">Register your organization</Link>
        </p>
      </AuthLayout>
    </AuthOverlay>
  );
}
