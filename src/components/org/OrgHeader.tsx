"use client";

import { ChevronDown, LogOut, Menu, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { getUserInfo, logout, storeToken } from "@/services/authServices";
import { useUserRole } from "@/hooks/useUserRole";
import { getRoleLabel } from "@/utils";
import HeaderSearch from "./HeaderSearch";
import GoogleAuthButton from "@/components/GoogleAuthButton";

interface OrgHeaderProps {
  organizationId?: string;
  onMobileMenuToggle?: () => void;
  showSearch?: boolean;
  guestEmail?: string;
  allowGuestLogin?: boolean;
}


export default function OrgHeader({ organizationId = "", onMobileMenuToggle, showSearch = true, guestEmail, allowGuestLogin = false }: OrgHeaderProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userInitial, setUserInitial] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    isOrganizationAdmin,
    isOrganizationClerk,
    isSiteAdmin,
    isSiteClerk,
    isSiteSrLegalExpert,
    isSiteLegalExpert,
  } = useUserRole(organizationId);

  // Fetch real user info
  useEffect(() => {
    getUserInfo().then((info) => {
      if (!info) return;
      const name =
        info.attributes?.fullName?.[0] ||
        (info.firstName && info.lastName
          ? `${info.firstName} ${info.lastName}`.trim()
          : "") ||
        info.username ||
        "";
      setUserName(name);
      setUserInitial(name.charAt(0).toUpperCase());
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const primaryRoleLabel = (() => {
    if (isOrganizationAdmin) return getRoleLabel("OrganizationAdmin");
    if (isOrganizationClerk) return getRoleLabel("OrganizationClerk");
    if (isSiteAdmin) return getRoleLabel("SiteAdmin");
    if (isSiteClerk) return getRoleLabel("SiteClerk");
    if (isSiteSrLegalExpert) return getRoleLabel("SiteSrLegalExpert");
    if (isSiteLegalExpert) return getRoleLabel("SiteLegalExpert");
    return "";
  })();

  async function handleSignOut() {
    setDropdownOpen(false);
    await logout();
    router.push("/");
  }

  async function handleGoogleLoginSuccess(credentialResponse: { credential?: string }) {
    try {
      const googleIdToken = credentialResponse.credential;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/google`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ googleIdToken }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        storeToken(data.data.token);
        window.location.href = "/auth?role=organizationuser";
      } else {
        const decoded = jwtDecode<{ email?: string }>(googleIdToken || "");
        const email = decoded.email ? `&email=${encodeURIComponent(decoded.email)}` : "";
        if (googleIdToken) sessionStorage.setItem("pending_google_credential", googleIdToken);
        router.push(`/register?role=organizationuser${email}`);
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center pl-4 pr-6 md:pl-6 md:pr-10 gap-4 sticky top-0 z-30 flex-shrink-0">
      {/* Left side: hamburger + search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        {showSearch && organizationId && <HeaderSearch organizationId={organizationId} />}
      </div>

      {/* Right side: notifications + user pill */}
      <div className="flex items-center gap-3 flex-shrink-0">
      {/* Notifications */}
      {/* <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-400 rounded-full" />
      </button> */}

      {/* User pill */}
      {guestEmail !== undefined ? (
        guestEmail ? (
          <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-700">
            <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.81 2.73v2.27h2.92c1.71-1.57 2.69-3.88 2.69-6.64z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.16l-2.92-2.27c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A8.997 8.997 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"/>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A8.997 8.997 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
            </svg>
            {guestEmail}
          </div>
        ) : (
          allowGuestLogin && (
            <GoogleAuthButton
              onSuccess={handleGoogleLoginSuccess}
              onError={() => console.error("Google Sign-In failed.")}
            />
          )
        )
      ) : (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {userInitial || '?'}
            </div>
            <div className="leading-tight text-left hidden md:block">
              <div className="text-xs font-semibold text-slate-700">
                {userName || "..."}
              </div>
              <div className="text-[10px] text-slate-400">{primaryRoleLabel}</div>
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
              <button
                onClick={() => {
                  router.push(`/profile?organizationId=${organizationId}`);
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User size={15} className="text-slate-400" />
                My Profile
              </button>
              <div className="border-t border-slate-100" />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
      </div>
    </header>
  );
}
