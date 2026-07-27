"use client";

import { useEffect, useRef, useState } from "react";
import {
  Scale,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Plus,
  UserPlus,
  Building2,
  Gavel,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Calendar,
  KeyRound,
  FileText,
} from "lucide-react";
import { Button, Pill, Card } from "@/design-system";
import type { Organization } from "@/app/organization/types";
import { formatDisplayDate } from "@/utils";

interface Props {
  organization: Organization;
  branchCount: number;
  welcome: boolean;
  canEdit: boolean;
  canDelete: boolean;
  showAddCase: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddUser: () => void;
  onAddSite: () => void;
  onAddCase: () => void;
}

/** Small click-outside dropdown wrapper. */
function useOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return ref;
}

interface MenuPos {
  top: number;
  right: number;
}

/**
 * Fixed-positioned dropdown style. The hero band has `overflow:hidden` for its
 * decorative circle, which would clip an absolutely-positioned menu — so anchor
 * the menu to the viewport (fixed) using the trigger's measured rect instead.
 */
function menuStyleAt(pos: MenuPos | null): React.CSSProperties {
  return {
    position: "fixed",
    top: pos?.top ?? -9999,
    right: pos?.right ?? 0,
    width: 200,
    zIndex: 60,
    overflow: "hidden",
    boxShadow: "var(--sh-lg)",
  };
}

/**
 * Dashboard hero band — the design-system treatment of the legacy
 * PageHeaderCard org header. Preserves: expandable org details, the 3-dot
 * Edit/Delete menu (RBAC-gated), and the Quick Actions menu (Add User / Site /
 * Case). Presentation only; behaviour matches Phase-0 contract §F.
 */
export default function DashboardHero({
  organization,
  branchCount,
  welcome,
  canEdit,
  canDelete,
  showAddCase,
  onEdit,
  onDelete,
  onAddUser,
  onAddSite,
  onAddCase,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [quickPos, setQuickPos] = useState<MenuPos | null>(null);
  const [orgPos, setOrgPos] = useState<MenuPos | null>(null);
  const quickRef = useOutside(() => setQuickOpen(false));
  const orgRef = useOutside(() => setOrgMenuOpen(false));

  const posFrom = (ref: React.RefObject<HTMLDivElement | null>): MenuPos | null => {
    const r = ref.current?.getBoundingClientRect();
    return r ? { top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) } : null;
  };
  const toggleQuick = () => {
    if (!quickOpen) setQuickPos(posFrom(quickRef));
    setQuickOpen((v) => !v);
  };
  const toggleOrg = () => {
    if (!orgMenuOpen) setOrgPos(posFrom(orgRef));
    setOrgMenuOpen((v) => !v);
  };

  const segments = organization.segments ?? [];

  return (
    <>
      <div className="hero-band">
        <div className="hb-main">
          <span className="org-mark">
            <Scale aria-hidden />
          </span>
          <div style={{ minWidth: 0 }}>
            <h1>{welcome ? `Welcome to ${organization.name}` : organization.name}</h1>
            <div className="meta">
              {segments.length > 0 ? (
                segments.map((s) => (
                  <Pill key={s} tone="line" className="pill-line">
                    {s}
                  </Pill>
                ))
              ) : (
                <span>No segments</span>
              )}
              {organization.createdDate ? (
                <>
                  <span>·</span>
                  <span>Since {formatDisplayDate(organization.createdDate)}</span>
                </>
              ) : null}
              <span>·</span>
              <span>
                {branchCount} site{branchCount === 1 ? "" : "s"}
              </span>
              <span>·</span>
              <button
                type="button"
                className="meta-toggle"
                aria-expanded={expanded}
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "Hide details" : "Details"}
                {expanded ? <ChevronUp width={13} height={13} /> : <ChevronDown width={13} height={13} />}
              </button>
            </div>
          </div>
        </div>

        <div className="hb-actions">
          {canEdit && (
            <div ref={orgRef} style={{ position: "relative" }}>
              <button
                type="button"
                className="icon-btn"
                aria-label="Organization actions"
                aria-haspopup="menu"
                onClick={toggleOrg}
              >
                <MoreVertical width={16} height={16} />
              </button>
              {orgMenuOpen && (
                <div className="card" style={menuStyleAt(orgPos)} role="menu">
                  <button
                    type="button"
                    className="navitem"
                    style={{ color: "var(--text)", borderRadius: 0, padding: "11px 14px", width: "100%" }}
                    onClick={() => {
                      setOrgMenuOpen(false);
                      onEdit();
                    }}
                  >
                    <Pencil width={15} height={15} />
                    Edit organization
                  </button>
                  {canDelete && (
                    <>
                      <div style={{ height: 1, background: "var(--divider)" }} />
                      <button
                        type="button"
                        className="navitem"
                        style={{ color: "var(--danger)", borderRadius: 0, padding: "11px 14px", width: "100%" }}
                        onClick={() => {
                          setOrgMenuOpen(false);
                          onDelete();
                        }}
                      >
                        <Trash2 width={15} height={15} />
                        Delete organization
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div ref={quickRef} style={{ position: "relative" }}>
            <Button variant="secondary" icon={Plus} iconRight={ChevronDown} onClick={toggleQuick}>
              Quick actions
            </Button>
            {quickOpen && (
              <div className="card" style={menuStyleAt(quickPos)} role="menu">
                <button
                  type="button"
                  className="navitem"
                  style={{ color: "var(--text)", borderRadius: 0, padding: "11px 14px", width: "100%" }}
                  onClick={() => {
                    setQuickOpen(false);
                    onAddUser();
                  }}
                >
                  <UserPlus width={15} height={15} />
                  Add user
                </button>
                <button
                  type="button"
                  className="navitem"
                  style={{ color: "var(--text)", borderRadius: 0, padding: "11px 14px", width: "100%" }}
                  onClick={() => {
                    setQuickOpen(false);
                    onAddSite();
                  }}
                >
                  <Building2 width={15} height={15} />
                  Add site
                </button>
                {showAddCase && (
                  <button
                    type="button"
                    className="navitem"
                    style={{ color: "var(--text)", borderRadius: 0, padding: "11px 14px", width: "100%" }}
                    onClick={() => {
                      setQuickOpen(false);
                      onAddCase();
                    }}
                  >
                    <Gavel width={15} height={15} />
                    Add case
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <Card pad className="hero-details-card">
        <div className="hero-details">
          <div className="grp">
            <div className="lbl">Details</div>
            {organization.organizationKey ? (
              <div className="kv">
                <KeyRound aria-hidden />
                <span>
                  Organization key: <b>{organization.organizationKey}</b>
                </span>
              </div>
            ) : null}
            {organization.createdDate ? (
              <div className="kv">
                <Calendar aria-hidden />
                <span>Created {formatDisplayDate(organization.createdDate)}</span>
              </div>
            ) : null}
          </div>
          <div className="grp">
            <div className="lbl">Contact</div>
            <div className="kv">
              <Mail aria-hidden />
              <span>{organization.emailId || "No email provided"}</span>
            </div>
            <div className="kv">
              <Phone aria-hidden />
              <span>{organization.phoneNumber || "No phone provided"}</span>
            </div>
          </div>
          {organization.description ? (
            <div className="grp full">
              <div className="lbl">
                <FileText width={12} height={12} style={{ display: "inline", marginRight: 4, verticalAlign: "-1px" }} />
                Description
              </div>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {organization.description}
              </p>
            </div>
          ) : null}
        </div>
        </Card>
      )}
    </>
  );
}
