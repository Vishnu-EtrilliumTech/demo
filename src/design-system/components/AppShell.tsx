"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Menu, type LucideIcon } from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export interface UserChip {
  name: string;
  meta?: string;
  initials: string;
}

export interface Crumb {
  label: string;
  href?: string;
  current?: boolean;
}

export interface AppShellProps {
  brand: ReactNode;
  /** Shown instead of `brand` while the sidebar is collapsed (desktop only). */
  brandCollapsed?: ReactNode;
  navGroups: NavGroup[];
  user?: UserChip;
  crumbs?: Crumb[];
  /** Left topbar slot (after crumbs, before the flex spacer) — e.g. search. */
  topbarLead?: ReactNode;
  /** Right-aligned topbar controls (bell, user menu). */
  topbarActions?: ReactNode;
  /** Extra classes on the `.app` grid (e.g. `boxed` to fit a preview). */
  className?: string;
  /**
   * Wrap children in the padded `.sheet` container (default true). Pass false to
   * let a legacy page control its own layout while still gaining the new shell.
   */
  sheet?: boolean;
  children: ReactNode;
}

function NavButton({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const { label, icon: Icon, active, href, onClick, disabled } = item;
  const cls = `navitem${active ? " active" : ""}`;
  const inner = (
    <>
      <Icon aria-hidden />
      <span>{label}</span>
    </>
  );
  if (disabled) {
    return (
      <div className={cls} aria-disabled title={label} style={{ opacity: 0.5, cursor: "not-allowed" }}>
        {inner}
      </div>
    );
  }
  if (href) {
    return (
      <Link className={cls} href={href} title={label} onClick={onNavigate}>
        {inner}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      title={label}
      onClick={() => {
        onClick?.();
        onNavigate?.();
      }}
    >
      {inner}
    </button>
  );
}

/**
 * App shell: navy grouped sidebar + glassy topbar + scrollable sheet. Fully
 * data-driven; consumers supply nav groups, crumbs, and topbar actions. Routing
 * is decoupled — items take an `href` or `onClick`.
 */
export function AppShell({
  brand,
  brandCollapsed,
  navGroups,
  user,
  crumbs,
  topbarLead,
  topbarActions,
  className,
  sheet = true,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className={`app${className ? ` ${className}` : ""}${collapsed ? " collapsed" : ""}`}
    >
      {mobileOpen ? (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      ) : null}
      <aside className={`sidebar${mobileOpen ? " mobile-open" : ""}`}>
        <div className="brand">{collapsed && brandCollapsed ? brandCollapsed : brand}</div>
        {navGroups.map((group, gi) => (
          <div className="nav-group" key={gi}>
            {group.label ? <div className="lbl">{group.label}</div> : null}
            {group.items.map((item) => (
              <NavButton key={item.key} item={item} onNavigate={() => setMobileOpen(false)} />
            ))}
          </div>
        ))}
        <div className="spacer" />
        {user ? (
          <div className="sidebar-foot">
            <div className="userchip">
              <span className="ava">{user.initials}</span>
              <span className="who">
                <b>{user.name}</b>
                {user.meta ? <span>{user.meta}</span> : null}
              </span>
            </div>
          </div>
        ) : null}
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight aria-hidden /> : <ChevronLeft aria-hidden />}
        </button>
      </aside>
      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu aria-hidden />
          </button>
          {crumbs && crumbs.length ? (
            <nav className="crumbs" aria-label="Breadcrumb">
              {crumbs.map((c, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                  {i > 0 ? <ChevronRight aria-hidden /> : null}
                  {c.current ? (
                    <span className="cur">{c.label}</span>
                  ) : c.href ? (
                    <Link href={c.href}>{c.label}</Link>
                  ) : (
                    <span>{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
          ) : null}
          {topbarLead}
          <div className="grow" />
          {topbarActions}
        </header>
        <div className="scroll">{sheet ? <div className="sheet">{children}</div> : children}</div>
      </div>
    </div>
  );
}
