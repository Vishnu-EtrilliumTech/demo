"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Landmark,
  Users,
  Building2,
  MapPin,
  Settings,
  ChevronDown,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import { LuiRoot, AppShell, type NavGroup, type NavItem } from "@/design-system";
import { useUserRole } from "@/hooks/useUserRole";
import { fetchOrganizationUserSites } from "@/app/organization/services/api";
import { getUserInfo, logout } from "@/services/authServices";
import { getRoleLabel } from "@/utils";
import HeaderSearch from "./HeaderSearch";

type NavKey = "dashboard" | "cases" | "ecourts" | "users" | "sites" | "settings" | "my-site";

/** Mirror of OrgSidebar.roleNavMap — behaviour preserved, presentation restyled. */
const roleNavMap: Record<string, NavKey[]> = {
  OrganizationAdmin: ["dashboard", "cases", "ecourts", "users", "sites"],
  OrganizationClerk: ["dashboard", "users", "sites"],
  SiteAdmin: ["dashboard", "cases", "ecourts", "users"],
  SiteClerk: ["dashboard", "cases", "ecourts", "users"],
  SiteSrLegalExpert: ["dashboard", "cases", "ecourts", "users", "my-site"],
  SiteLegalExpert: ["dashboard", "cases", "ecourts", "users", "my-site"],
};

interface OrgAppShellProps {
  organizationId: string;
  children: ReactNode;
}

/**
 * New organization app shell built on the design-system <AppShell>. Preserves
 * the legacy OrgSidebar/OrgHeader behaviour (role-filtered nav, per-role
 * dashboard target, My Site, disabled Settings, user menu with Profile/Sign Out)
 * — only the presentation changes (Phase-0 Q2). Gated behind the `shell` flag by
 * the org layout; toggling off restores the legacy shell.
 */
export default function OrgAppShell({ organizationId, children }: OrgAppShellProps) {
  const pathname = usePathname();
  const [siteId, setSiteId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");

  const {
    currentUserId,
    isOrganizationAdmin,
    isOrganizationClerk,
    isSiteAdmin,
    isSiteClerk,
    isSiteSrLegalExpert,
    isSiteLegalExpert,
  } = useUserRole(organizationId);

  useEffect(() => {
    getUserInfo().then((info) => {
      if (!info) return;
      const name =
        info.attributes?.fullName?.[0] ||
        (info.firstName && info.lastName ? `${info.firstName} ${info.lastName}`.trim() : "") ||
        info.username ||
        "";
      setUserName(name);
    });
  }, []);

  const primaryRole = (() => {
    if (isOrganizationAdmin) return "OrganizationAdmin";
    if (isOrganizationClerk) return "OrganizationClerk";
    if (isSiteAdmin) return "SiteAdmin";
    if (isSiteClerk) return "SiteClerk";
    if (isSiteSrLegalExpert) return "SiteSrLegalExpert";
    if (isSiteLegalExpert) return "SiteLegalExpert";
    return null;
  })();

  useEffect(() => {
    const needsSiteId = isSiteAdmin || isSiteClerk || isSiteSrLegalExpert || isSiteLegalExpert;
    if (!needsSiteId || !currentUserId || !organizationId) return;
    fetchOrganizationUserSites(organizationId, currentUserId)
      .then((page) => {
        if (page.items.length > 0) setSiteId(String(page.items[0].id));
      })
      .catch(() => setSiteId(null));
  }, [organizationId, currentUserId, isSiteAdmin, isSiteClerk, isSiteSrLegalExpert, isSiteLegalExpert]);

  let dashboardHref = `/organization/${organizationId}`;
  if ((primaryRole === "SiteAdmin" || primaryRole === "SiteClerk") && siteId) {
    dashboardHref = `/organization/${organizationId}/sites/${siteId}`;
  } else if ((primaryRole === "SiteLegalExpert" || primaryRole === "SiteSrLegalExpert") && siteId && currentUserId) {
    dashboardHref = `/organization/${organizationId}/sites/${siteId}/users/${currentUserId}`;
  }

  const isActive = (key: NavKey, href: string): boolean => {
    if (key === "dashboard") return pathname === dashboardHref;
    if (key === "my-site") return pathname === href;
    return pathname.startsWith(href);
  };

  const defs: Record<NavKey, Omit<NavItem, "active">> = {
    dashboard: { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: dashboardHref },
    cases: { key: "cases", label: "Cases", icon: Briefcase, href: `/organization/${organizationId}/cases` },
    ecourts: { key: "ecourts", label: "eCourts", icon: Landmark, href: `/organization/${organizationId}/ecourts` },
    users: { key: "users", label: "Users", icon: Users, href: `/organization/${organizationId}/users` },
    sites: { key: "sites", label: "Sites", icon: Building2, href: `/organization/${organizationId}/sites` },
    "my-site": {
      key: "my-site",
      label: "My Site",
      icon: MapPin,
      href: siteId ? `/organization/${organizationId}/sites/${siteId}` : "#",
    },
    settings: {
      key: "settings",
      label: "Settings",
      icon: Settings,
      href: `/organization/${organizationId}/settings`,
      disabled: true,
    },
  };

  const allowed = primaryRole ? (roleNavMap[primaryRole] ?? []) : [];
  const item = (key: NavKey): NavItem => ({ ...defs[key], active: isActive(key, defs[key].href ?? "#") });

  const firmKeys: NavKey[] = (["dashboard", "cases", "users", "sites", "my-site"] as NavKey[]).filter((k) =>
    allowed.includes(k),
  );
  const practiceKeys: NavKey[] = (["ecourts"] as NavKey[]).filter((k) => allowed.includes(k));

  const navGroups: NavGroup[] = [];
  if (firmKeys.length) navGroups.push({ label: "Firm", items: firmKeys.map(item) });
  if (practiceKeys.length) navGroups.push({ label: "Practice", items: practiceKeys.map(item) });
  // navGroups.push({ label: "Settings", items: [item("settings")] });

  const roleLabel = primaryRole ? getRoleLabel(primaryRole) : "";
  const initials = userName ? userName.charAt(0).toUpperCase() : "?";

  return (
    <LuiRoot>
      <AppShell
        sheet={false}
        brand={
          <Link href="/" className="logo-chip">
            <Image src="/logo-white.png" alt="Lawsome" width={120} height={26} priority />
          </Link>
        }
        brandCollapsed={
          <Link href="/" className="logo-chip">
            <Image src="/magnifiying.png" alt="Lawsome" width={28} height={28} priority />
          </Link>
        }
        navGroups={navGroups}
        // user={{ name: userName || "…", meta: roleLabel, initials }}
        topbarLead={
          <div style={{ flex: "1 1 320px", maxWidth: 460 }}>
            <HeaderSearch organizationId={organizationId} />
          </div>
        }
        topbarActions={
          <UserMenu organizationId={organizationId} name={userName} roleLabel={roleLabel} initials={initials} />
        }
      >
        {children}
      </AppShell>
    </LuiRoot>
  );
}

function UserMenu({
  organizationId,
  name,
  roleLabel,
  initials,
}: {
  organizationId: string;
  name: string;
  roleLabel: string;
  initials: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="userchip"
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ava" style={{ width: 30, height: 30, fontSize: 12 }}>
          {initials}
        </span>
        <span className="who" style={{ color: "var(--text)" }}>
          <b style={{ color: "var(--text)", fontSize: 12.5 }}>{name || "…"}</b>
          <span style={{ color: "var(--text-3)" }}>{roleLabel}</span>
        </span>
        <ChevronDown width={14} height={14} style={{ color: "var(--text-3)" }} />
      </button>
      {open ? (
        <div
          className="card"
          style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 190, zIndex: 60, overflow: "hidden", boxShadow: "var(--sh-lg)" }}
        >
          <button
            type="button"
            className="navitem"
            style={{ color: "var(--text)", borderRadius: 0, padding: "11px 14px" }}
            onClick={() => {
              setOpen(false);
              router.push(`/profile?organizationId=${organizationId}`);
            }}
          >
            <UserIcon width={15} height={15} />
            My Profile
          </button>
          <div style={{ height: 1, background: "var(--divider)" }} />
          <button
            type="button"
            className="navitem"
            style={{ color: "var(--danger)", borderRadius: 0, padding: "11px 14px" }}
            onClick={async () => {
              setOpen(false);
              await logout();
              router.push("/");
            }}
          >
            <LogOut width={15} height={15} />
            Sign Out
          </button>
        </div>
      ) : null}
    </div>
  );
}
