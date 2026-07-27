"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  MapPin,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  Scale,
  Home,
  Phone,
  Tag,
  LifeBuoy,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { fetchOrganizationUserSites } from "@/app/organization/services/api";

type NavKey =
  | "dashboard"
  | "cases"
  | "ecourts"
  | "users"
  | "sites"
  | "settings"
  | "my-site"
  | "home"
  | "contact"
  | "pricing"
  | "support";

interface NavItem {
  key: NavKey;
  label: string;
  href: string;
  icon: React.ElementType;
}

const guestNavItems: NavItem[] = [
  { key: "home", label: "Home", href: "/", icon: Home },
  { key: "contact", label: "Contact Us", href: "/contact", icon: Phone },
  { key: "pricing", label: "Pricing", href: "/pricing", icon: Tag },
  { key: "support", label: "Support", href: "/support", icon: LifeBuoy },
];

interface OrgSidebarProps {
  organizationId?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const roleNavMap: Record<string, NavKey[]> = {
  OrganizationAdmin: ["dashboard", "cases", "ecourts", "users", "sites"],
  OrganizationClerk: ["dashboard", "users", "sites"],
  SiteAdmin: ["dashboard", "cases", "ecourts", "users" ],
  SiteClerk: ["dashboard", "cases", "ecourts", "users"],
  SiteSrLegalExpert: ["dashboard", "cases", "ecourts", "users", "my-site"],
  SiteLegalExpert: ["dashboard", "cases", "ecourts", "users", "my-site"],
};

export default function OrgSidebar({ organizationId = "", mobileOpen = false, onMobileClose }: OrgSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [siteId, setSiteId] = useState<string | null>(null);

  const {
    currentUserId,
    isOrganizationAdmin,
    isOrganizationClerk,
    isSiteAdmin,
    isSiteClerk,
    isSiteSrLegalExpert,
    isSiteLegalExpert,
  } = useUserRole(organizationId);

  // Fetch siteId for site-level roles that need "My Site" link
  useEffect(() => {
    const needsSiteId =
      isSiteAdmin || isSiteClerk || isSiteSrLegalExpert || isSiteLegalExpert;
    if (!needsSiteId || !currentUserId || !organizationId) return;

    fetchOrganizationUserSites(organizationId, currentUserId)
      .then((sitesPage) => {
        if (sitesPage.items.length > 0) setSiteId(String(sitesPage.items[0].id));
      })
      .catch(() => setSiteId(null));
  }, [
    organizationId,
    currentUserId,
    isSiteAdmin,
    isSiteClerk,
    isSiteSrLegalExpert,
    isSiteLegalExpert,
  ]);

  // Determine the primary role for nav lookup
  const primaryRole = (() => {
    if (isOrganizationAdmin) return "OrganizationAdmin";
    if (isOrganizationClerk) return "OrganizationClerk";
    if (isSiteAdmin) return "SiteAdmin";
    if (isSiteClerk) return "SiteClerk";
    if (isSiteSrLegalExpert) return "SiteSrLegalExpert";
    if (isSiteLegalExpert) return "SiteLegalExpert";
    return null;
  })();

  let dashbordHref = organizationId ? `/organization/${organizationId}` : "#";
  if ((primaryRole === "SiteAdmin" || primaryRole === "SiteClerk") && siteId) {
    dashbordHref = `/organization/${organizationId}/sites/${siteId}`;
  } else if (
    (primaryRole === "SiteLegalExpert" ||
      primaryRole === "SiteSrLegalExpert") &&
    siteId &&
    currentUserId
  ) {
    dashbordHref = `/organization/${organizationId}/sites/${siteId}/users/${currentUserId}`;
  }

  const allowedKeys: NavKey[] = primaryRole
    ? (roleNavMap[primaryRole] ?? [])
    : [];

  const allNavItems: NavItem[] = [
    {
      key: "dashboard",
      label: "Dashboard",
      href: dashbordHref,
      icon: LayoutDashboard,
    },
    {
      key: "cases",
      label: "Cases",
      href: organizationId ? `/organization/${organizationId}/cases` : "#",
      icon: FolderOpen,
    },
    {
      key: "ecourts",
      label: "eCourts",
      href: organizationId ? `/organization/${organizationId}/ecourts` : "#",
      icon: Scale,
    },
    {
      key: "users",
      label: "Users",
      href: organizationId ? `/organization/${organizationId}/users` : "#",
      icon: Users,
    },
    {
      key: "sites",
      label: "Sites",
      href: organizationId ? `/organization/${organizationId}/sites` : "#",
      icon: MapPin,
    },
    {
      key: "settings",
      label: "Settings",
      href: organizationId ? `/organization/${organizationId}/settings` : "#",
      icon: Settings,
    },
    {
      key: "my-site",
      label: "My Site",
      href: siteId ? `/organization/${organizationId}/sites/${siteId}` : "#",
      icon: Building2,
    },
  ];

  // No organizationId (e.g. pre-auth pages like /register): show the public
  // site nav instead, since there's no organization or user role yet.
  const navItems = organizationId
    ? allNavItems.filter((n) => allowedKeys.includes(n.key))
    : guestNavItems;

  function isActive(href: string, key: NavKey) {
    if (key === "home") {
      return pathname === "/";
    }
    if (key === "dashboard") {
      if (
        (primaryRole === "SiteAdmin" || primaryRole === "SiteClerk") &&
        siteId
      ) {
        return pathname === `/organization/${organizationId}/sites/${siteId}`;
      }
      if (
        (primaryRole === "SiteLegalExpert" ||
          primaryRole === "SiteSrLegalExpert") &&
        siteId &&
        currentUserId
      ) {
        return (
          pathname ===
          `/organization/${organizationId}/sites/${siteId}/users/${currentUserId}`
        );
      }
      return pathname === `/organization/${organizationId}`;
    }
    if (key === "my-site") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex flex-col h-screen border-r border-[#4a5d6b]/40 transition-all duration-300 flex-shrink-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:z-auto
        ${collapsed ? "md:w-[70px]" : "md:w-[240px]"}
        w-[240px]
      `}
      style={{ background: "linear-gradient(to bottom, #2a3740, #3E4F5E)" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-start gap-3 px-4 py-2 border-b border-[#4a5d6b]/40 overflow-hidden">
        <div className={`${collapsed ? "md:max-w-12 md:max-h-12" : "max-w-56"}`}>
          <div className={`top-0 left-0 flex flex-col items-start ${collapsed ? "md:hidden" : ""}`}>
            <Link href="/">
              <Image
                src="/logo-white.png"
                alt="Lawsome"
                width={120}
                height={55}
              />
            </Link>
            <div className="text-blue-400 ml-1 text-[10px] tracking-widest uppercase font-medium mt-0.5">
              Legal Suite
            </div>
          </div>
          <div className={`${collapsed ? "hidden md:flex" : "hidden"} items-center justify-center`}>
            <Image
              src="/magnifiying.png"
              alt="Lawsome"
              width={30}
              height={30}
            />
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-4 px-2 space-y-0.5 overflow-hidden`}>
        {navItems.map(({ key, label, href, icon: Icon }) => {
          const active = isActive(href, key);
          if (key === 'settings') {
          return (
            <div
              key={key}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 opacity-50 cursor-not-allowed"
            >
              <Icon size={18} className="flex-shrink-0 text-slate-500" />
              <span className={collapsed ? "md:hidden" : ""}>{label}</span>
            </div>
          );
        }

        return (
          <Link
            key={key}
            href={href}
            onClick={onMobileClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
              active
                ? "bg-blue-400/10 text-blue-400"
                : "text-slate-400 hover:bg-white/5 hover:text-[#3B82F6]"
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-400 rounded-r-full" />
            )}
            <Icon
              size={18}
              className={`flex-shrink-0 ${
                active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
              }`}
            />
            <span className={collapsed ? "md:hidden" : ""}>{label}</span>
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700 hidden md:block">
                {label}
              </div>
            )}
          </Link>
        );
        })}
      </nav>

      {/* Collapse Toggle — desktop only */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-[#4a5d6b] border border-[#566878] rounded-full items-center justify-center text-slate-300 hover:text-white hover:bg-[#566878] transition-all shadow-lg z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
    </>
  );
}