"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Plus,
  UserPlus,
  Gavel,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Calendar,
  KeyRound,
  MapPin,
  FileText,
} from "lucide-react";
import { Button, Card } from "@/design-system";
import type { Site } from "@/app/organization/types";
import { formatDisplayDate } from "@/utils";

interface Props {
  site: Site;
  /** Welcome copy when the site has no cases and no users yet. */
  welcome: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddUser: () => void;
  onAddCase: () => void;
}

/** Small click-outside dropdown wrapper (mirrors DashboardHero). */
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

/** Fixed-anchored dropdown so the overflow-hidden hero band can't clip it. */
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

const fullAddress = (s: Site) => {
  const line = [s.address, s.locality, s.district, s.state].filter(Boolean).join(", ");
  return s.pincode ? `${line} - ${s.pincode}` : line;
};

/**
 * Site (branch) detail header — the design-system treatment of the legacy
 * PageHeaderCard site header. Preserves: expandable site details, the 3-dot
 * Edit/Delete-site menu (RBAC-gated), and the Quick Actions menu (Add User /
 * Add Case). Presentation only.
 */
export default function SiteDetailHead({
  site,
  welcome,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onAddUser,
  onAddCase,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [siteMenuOpen, setSiteMenuOpen] = useState(false);
  const [quickPos, setQuickPos] = useState<MenuPos | null>(null);
  const [sitePos, setSitePos] = useState<MenuPos | null>(null);
  const quickRef = useOutside(() => setQuickOpen(false));
  const siteRef = useOutside(() => setSiteMenuOpen(false));

  const posFrom = (ref: React.RefObject<HTMLDivElement | null>): MenuPos | null => {
    const r = ref.current?.getBoundingClientRect();
    return r ? { top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) } : null;
  };
  const toggleQuick = () => {
    if (!quickOpen) setQuickPos(posFrom(quickRef));
    setQuickOpen((v) => !v);
  };
  const toggleSite = () => {
    if (!siteMenuOpen) setSitePos(posFrom(siteRef));
    setSiteMenuOpen((v) => !v);
  };

  const title = welcome ? `Welcome to ${site.name}` : site.name;

  return (
    <>
      <div className="hero-band">
        <div className="hb-main">
          <span className="org-mark">
            <Building2 aria-hidden />
          </span>
          <div style={{ minWidth: 0 }}>
            <h1>{title}</h1>
            <div className="meta">
              {site.siteKey ? <span>Key {site.siteKey}</span> : null}
              {site.createdDate ? (
                <>
                  {site.siteKey ? <span>·</span> : null}
                  <span>Since {formatDisplayDate(site.createdDate)}</span>
                </>
              ) : null}
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
          {(canEdit || canDelete) && (
            <div ref={siteRef} style={{ position: "relative" }}>
              <button
                type="button"
                className="icon-btn"
                aria-label="Site actions"
                aria-haspopup="menu"
                onClick={toggleSite}
              >
                <MoreVertical width={16} height={16} />
              </button>
              {siteMenuOpen && (
                <div className="card" style={menuStyleAt(sitePos)} role="menu">
                  {canEdit && (
                    <button
                      type="button"
                      className="navitem"
                      style={{ color: "var(--text)", borderRadius: 0, padding: "11px 14px", width: "100%" }}
                      onClick={() => {
                        setSiteMenuOpen(false);
                        onEdit();
                      }}
                    >
                      <Pencil width={15} height={15} />
                      Edit site
                    </button>
                  )}
                  {canDelete && (
                    <>
                      {canEdit ? <div style={{ height: 1, background: "var(--divider)" }} /> : null}
                      <button
                        type="button"
                        className="navitem"
                        style={{ color: "var(--danger)", borderRadius: 0, padding: "11px 14px", width: "100%" }}
                        onClick={() => {
                          setSiteMenuOpen(false);
                          onDelete();
                        }}
                      >
                        <Trash2 width={15} height={15} />
                        Delete site
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
                    onAddCase();
                  }}
                >
                  <Gavel width={15} height={15} />
                  Add case
                </button>
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
              {site.siteKey ? (
                <div className="kv">
                  <KeyRound aria-hidden />
                  <span>
                    Site key: <b>{site.siteKey}</b>
                  </span>
                </div>
              ) : null}
              {site.createdDate ? (
                <div className="kv">
                  <Calendar aria-hidden />
                  <span>Created {formatDisplayDate(site.createdDate)}</span>
                </div>
              ) : null}
            </div>
            <div className="grp">
              <div className="lbl">Contact</div>
              <div className="kv">
                <Mail aria-hidden />
                <span>{site.emailId || "No email provided"}</span>
              </div>
              <div className="kv">
                <Phone aria-hidden />
                <span>{site.phoneNumber || "No phone provided"}</span>
              </div>
            </div>
            <div className="grp">
              <div className="lbl">Address</div>
              <div className="kv">
                <MapPin aria-hidden />
                <span>{fullAddress(site) || "No address provided"}</span>
              </div>
              {site.landmark ? (
                <div className="kv">
                  <MapPin aria-hidden />
                  <span>{site.landmark}</span>
                </div>
              ) : null}
            </div>
            {site.description ? (
              <div className="grp full">
                <div className="lbl">
                  <FileText width={12} height={12} style={{ display: "inline", marginRight: 4, verticalAlign: "-1px" }} />
                  Description
                </div>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {site.description}
                </p>
              </div>
            ) : null}
          </div>
        </Card>
      )}
    </>
  );
}
