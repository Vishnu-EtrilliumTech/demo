import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export interface AuthHighlight {
  icon: LucideIcon;
  title: ReactNode;
  description: ReactNode;
}

export interface AuthLayoutProps {
  /** Brand logo for the dark panel (e.g. an <img> or wordmark). */
  logo?: ReactNode;
  panelHeadline: ReactNode;
  highlights?: AuthHighlight[];
  /** Legal line at the foot of the dark panel. */
  panelFoot?: ReactNode;
  /** The form column content (heading, Google button, etc.). */
  children: ReactNode;
  /** Extra classes on the `.auth` grid (e.g. `boxed` to fit a preview). */
  className?: string;
}

/**
 * Split auth layout: dark product panel on the left, form on the right.
 * Panel collapses under 860px. Used by Login and Register (Google-only auth).
 */
export function AuthLayout({ logo, panelHeadline, highlights = [], panelFoot, children, className }: AuthLayoutProps) {
  return (
    <div className={`auth${className ? ` ${className}` : ""}`}>
      <aside className="apanel">
        <Link href="/" className="a-logo">{logo}</Link>
        <div>
          <h2 className="a-head">{panelHeadline}</h2>
          {highlights.length ? (
            <div className="hilites">
              {highlights.map(({ icon: Icon, title, description }, i) => (
                <div className="row" key={i}>
                  <span className="hi">
                    <Icon aria-hidden />
                  </span>
                  <span className="ht">
                    <b>{title}</b>
                    <span>{description}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="a-foot">{panelFoot}</div>
      </aside>
      <section className="aform">
        <div className="a-inner">{children}</div>
      </section>
    </div>
  );
}
