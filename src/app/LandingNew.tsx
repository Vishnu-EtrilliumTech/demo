"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, Check, Building2, FolderOpen, Landmark, CalendarDays, FileText, Receipt,
  Layers, CheckCircle2, LayoutPanelLeft, BellRing, ShieldCheck, Route, Sparkles,
  MessageSquareText, RefreshCw, CalendarClock, Calendar, LayoutDashboard, Users,
  Circle, CircleCheckBig, BadgeCheck,
} from "lucide-react";
import { LuiRoot } from "@/design-system";
import ContactSection from "./ContactSection";
import "./landing.css";

/** Preview scene cycler frames — mirrors the mockup's dashboard→cases→case→eCourts loop. */
const FRAMES: { s: number; n: number; t?: number }[] = [
  { s: 0, n: 0 },
  { s: 1, n: 1 },
  { s: 2, n: 1, t: 0 },
  { s: 2, n: 1, t: 1 },
  { s: 2, n: 1, t: 2 },
  { s: 3, n: 4 },
];
const PV_NAV = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: FolderOpen, label: "Cases" },
  { icon: Building2, label: "Sites" },
  { icon: Users, label: "Lawyers" },
  { icon: Landmark, label: "eCourts" },
];

/** Cycles the hero preview through FRAMES; frozen on scene 0 under reduced-motion. */
function usePreviewCycle(): { s: number; n: number; t: number } {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % FRAMES.length), 2500);
    return () => window.clearInterval(id);
  }, []);
  const fr = FRAMES[i];
  return { s: fr.s, n: fr.n, t: fr.t ?? 0 };
}

const REGISTER_HREF = "/register?role=organizationuser";
const LOGIN_HREF = "/login";

const FEATURES = [
  { icon: Building2, title: "Sites & teams", body: "Model your firm across offices, assign lawyers, clerks and paralegals, and control access with granular roles." },
  { icon: FolderOpen, title: "Case workspace", body: "Parties, tasks, documents, hearings and discussion for every matter — a single source of truth per case." },
  { icon: Landmark, title: "eCourts integration", body: "Link a CNR and pull live case records, cause lists and orders automatically — no more manual checking." },
  { icon: CalendarDays, title: "Cause-list monitoring", body: "Every listed hearing across your firm in one calendar, with reminders before you're due in court." },
  { icon: FileText, title: "Documents & discussion", body: "Keep pleadings, orders and exhibits organized per case, with a threaded discussion for your team." },
  { icon: Receipt, title: "Billing & payments", body: "Raise client invoices, track collections and see outstanding and overdue amounts at a glance." },
];

const BENEFITS = [
  { icon: LayoutPanelLeft, title: "One workspace per matter", body: "Parties, tasks, documents and hearings together — never hunt across folders again." },
  { icon: Building2, title: "Every site, one login", body: "Run all your offices from a single account with role-based access." },
  { icon: BellRing, title: "Never miss a listing", body: "Automatic cause-list monitoring and reminders before every hearing." },
  { icon: ShieldCheck, title: "Enterprise-grade security", body: "Granular permissions and audit trails built for a professional practice." },
];

const ROADMAP = [
  { icon: Sparkles, title: "AI case briefs", body: "Grounded summaries with source citations" },
  { icon: BellRing, title: "Actionable alerts", body: "Severity-ranked, before every hearing" },
  { icon: MessageSquareText, title: "Document Q&A", body: "Ask across all your case filings" },
];

/**
 * Public Landing (marketing funnel). Rebuilt from Landing.html on the DS token
 * layer. First-release messaging (§4): no pricing, AI is roadmap-only ("Preview"),
 * no country wording, Google-only CTAs (→ /register, /login), footer eTrillium.
 */
export default function LandingNew() {
  const scene = usePreviewCycle();
  return (
    <LuiRoot className="lp">
      {/* Nav */}
      <header className="lp-nav">
        <div className="lp-wrap inner">
          <Link className="lb" href="/">
            <Image src="/logo-navy.png" alt="Lawsome" width={130} height={26} priority />
          </Link>
          <nav>
            <Link href="#features">Features</Link>
            <Link href="#ecourts">eCourts</Link>
            <Link href="#workspace">Workspace</Link>
            <Link href="#roadmap">Roadmap</Link>
            <Link href="#contact">Contact</Link>
          </nav>
          <div className="r">
            <Link className="btn btn-ghost" href={LOGIN_HREF}>Sign in</Link>
            <Link className="btn btn-primary" href={REGISTER_HREF}><ArrowRight aria-hidden /> Get early access</Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="lp-hero">
          <div className="lp-hero-bg">
            <div className="grid" />
            <div className="blob b1" />
            <div className="blob b2" />
            <div className="blob b3" />
          </div>
          <div className="lp-wrap inner">
            <div className="lp-htext">
              <div className="lp-justice" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.45" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v18" />
                  <path d="M7 21h10" />
                  <g className="jbeam">
                    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
                    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                  </g>
                </svg>
              </div>
              <span className="lp-badge lp-anim lp-d1"><span className="dot" /> Now in early access</span>
              <h1 className="lp-anim lp-d2">The practice platform built for <em>modern law firms</em></h1>
              <p className="sub lp-anim lp-d3">Manage sites, lawyers, clients and cases in one place — with live eCourts integration that keeps every matter&apos;s record and hearings up to date.</p>
              <div className="cta lp-anim lp-d4">
                <Link className="btn btn-primary" href={REGISTER_HREF}><ArrowRight aria-hidden /> Get early access</Link>
              </div>
              <div className="lp-trust lp-anim lp-d4">
                <span className="t"><Check aria-hidden /> Early access open</span>
                <span className="t"><Check aria-hidden /> No card required</span>
                <span className="t"><Check aria-hidden /> Set up in minutes</span>
              </div>
            </div>

            <div className="lp-hvisual">
              <div className="lp-preview lp-anim lp-d3">
                <div className="bar"><i /><i /><i /></div>
                <div className="shot">
                  <div className="pv-side">
                    <div className="pb"><Image src="/logo-white.png" alt="Lawsome" width={75} height={15} /></div>
                    {PV_NAV.map((item, k) => (
                      <div key={item.label} className={`pi${scene.n === k ? " on" : ""}`}>
                        <item.icon aria-hidden /> {item.label}
                      </div>
                    ))}
                  </div>
                  <div className="pv-main">
                    {/* Scene 0 — dashboard */}
                    <div className={`pv-scene${scene.s === 0 ? " on" : ""}`}>
                      <div className="pv-grid">
                        <div className="pv-stat"><div className="n">248</div><div className="l">Total cases</div></div>
                        <div className="pv-stat"><div className="n">37</div><div className="l">Upcoming hearings</div></div>
                        <div className="pv-stat"><div className="n">1,214</div><div className="l">Resolved</div></div>
                        <div className="pv-stat"><div className="n">42</div><div className="l">Lawyers</div></div>
                      </div>
                      <div className="pv-bars">
                        <div className="bl"><span className="lb">In Progress</span><span className="tk"><span className="f" style={{ width: "78%", background: "var(--brand)" }} /></span></div>
                        <div className="bl"><span className="lb">Open</span><span className="tk"><span className="f" style={{ width: "56%", background: "#0e8a5f" }} /></span></div>
                        <div className="bl"><span className="lb">On Hold</span><span className="tk"><span className="f" style={{ width: "30%", background: "#b06f16" }} /></span></div>
                      </div>
                    </div>

                    {/* Scene 1 — case list */}
                    <div className={`pv-scene${scene.s === 1 ? " on" : ""}`}>
                      <div className="pv-list">
                        <div className="pv-row sel"><span className="a av1">MT</span><span className="nm">Mehra Textiles v. SBI</span><span className="pill pill-warn">In Progress</span></div>
                        <div className="pv-row"><span className="a av2">RK</span><span className="nm">Rao v. Kohli Estates</span><span className="pill pill-brand">Open</span></div>
                        <div className="pv-row"><span className="a av3">DP</span><span className="nm">Deccan Power v. MSEDCL</span><span className="pill pill-warn">In Progress</span></div>
                        <div className="pv-row"><span className="a av4">SG</span><span className="nm">State v. Gupta</span><span className="pill pill-neutral">On Hold</span></div>
                        <div className="pv-row"><span className="a av5">IV</span><span className="nm">In re: Estate of Verma</span><span className="pill pill-brand">Open</span></div>
                      </div>
                    </div>

                    {/* Scene 2 — case detail (tabs cycle) */}
                    <div className={`pv-scene${scene.s === 2 ? " on" : ""}`}>
                      <div className="pv-head">
                        <div className="eb">Commercial Suit</div>
                        <div className="tt">Mehra Textiles v. SBI</div>
                      </div>
                      <div className="pv-tabs">
                        {["Overview", "Tasks", "Documents", "Hearings"].map((tb, k) => (
                          <span key={tb} className={`pv-tab${scene.t === k ? " on" : ""}`}>{tb}</span>
                        ))}
                      </div>
                      <div className={`pv-panel${scene.t === 0 ? " on" : ""}`}>
                        <div className="pv-parties">
                          <div className="p"><span className="a av1">MT</span><span className="nm">Mehra Textiles</span></div>
                          <span className="vs">VS</span>
                          <div className="p" style={{ justifyContent: "flex-end" }}><span className="nm" style={{ textAlign: "right" }}>State Bank of India</span><span className="a av2">SB</span></div>
                        </div>
                        <div className="pv-tiles">
                          <div className="pv-tile"><div className="n">8</div><div className="l">Hearings</div></div>
                          <div className="pv-tile"><div className="n">3</div><div className="l">Orders</div></div>
                          <div className="pv-tile"><div className="n">2</div><div className="l">IAs pending</div></div>
                        </div>
                      </div>
                      <div className={`pv-panel${scene.t === 1 ? " on" : ""}`}>
                        <div className="pv-list">
                          <div className="pv-row"><span className="chk"><Circle aria-hidden /></span><span className="nm">Draft counter-affidavit IA 5120</span><span className="pill pill-warn">Due soon</span></div>
                          <div className="pv-row"><span className="chk"><Circle aria-hidden /></span><span className="nm">Compile exhibits for issues</span><span className="pill pill-neutral">Open</span></div>
                          <div className="pv-row done"><span className="chk"><CircleCheckBig aria-hidden /></span><span className="nm">File rejoinder to WS</span><span className="pill pill-ok">Done</span></div>
                        </div>
                      </div>
                      <div className={`pv-panel${scene.t === 2 ? " on" : ""}`}>
                        <div className="pv-list">
                          <div className="pv-row"><span className="fi"><FileText aria-hidden /></span><span className="nm">Rejoinder — final.pdf</span><span className="sz">412 KB</span></div>
                          <div className="pv-row"><span className="fi"><FileText aria-hidden /></span><span className="nm">Interim order 11-06.pdf</span><span className="sz">288 KB</span></div>
                          <div className="pv-row"><span className="fi"><FileText aria-hidden /></span><span className="nm">Written statement — SBI.pdf</span><span className="sz">1.1 MB</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Scene 3 — eCourts record */}
                    <div className={`pv-scene${scene.s === 3 ? " on" : ""}`}>
                      <div className="pv-tag"><BadgeCheck aria-hidden /> eCourts · Verified live record</div>
                      <div className="pv-rec">
                        <div className="rr"><span className="k">CNR</span><span className="v">DLHC01-013245-2024</span></div>
                        <div className="rr"><span className="k">Court</span><span className="v">High Court</span></div>
                        <div className="rr"><span className="k">Next hearing</span><span className="v">17 Jul 2026</span></div>
                        <div className="rr"><span className="k">Stage</span><span className="v">Framing of issues</span></div>
                        <div className="rr"><span className="k">Interim orders</span><span className="v">3</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lp-float hearing lp-anim lp-d4">
                <div className="lp-bob">
                  <div className="lp-fcard">
                    <div className="k"><CalendarClock aria-hidden /> Next hearing</div>
                    <div className="d">17 Jul 2026</div>
                    <div className="m">High Court · Court 21 · in 6 days</div>
                  </div>
                </div>
              </div>
              <div className="lp-float sync lp-anim lp-d4">
                <div className="lp-bob2">
                  <div className="lp-fcard">
                    <span className="si"><RefreshCw aria-hidden /></span>
                    <div><b>eCourts synced</b><span>2 hours ago</span></div>
                  </div>
                </div>
              </div>
              <div className="lp-float task lp-anim lp-d4">
                <div className="lp-bob3">
                  <div className="lp-fcard">
                    <span className="ci"><Check aria-hidden /></span>
                    <div><b>Rejoinder filed</b><span>K. Raman · just now</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="lp-blk" id="features">
          <div className="lp-wrap">
            <div className="lp-blk-head">
              <div className="eyebrow"><Layers aria-hidden /> One platform</div>
              <h2>Everything your firm runs on, in one place</h2>
              <p>From the organization down to a single interim application — Lawsome keeps your matters, people and deadlines connected.</p>
            </div>
            <div className="lp-feat-grid">
              {FEATURES.map((f) => (
                <div className="lp-feat" key={f.title}>
                  <div className="fi"><f.icon aria-hidden /></div>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* eCourts split */}
        <section className="lp-blk" id="ecourts" style={{ background: "var(--bg)" }}>
          <div className="lp-wrap">
            <div className="lp-split">
              <div className="txt">
                <div className="eyebrow"><Landmark aria-hidden /> eCourts integration</div>
                <h2>Your court record, always in sync</h2>
                <p>Link a case to its 16-digit CNR and Lawsome fetches the live court record — parties, hearing history, interim orders and the next listing — and keeps it current.</p>
                <ul>
                  <li><CheckCircle2 aria-hidden /> Daily cause-list monitoring across all linked cases</li>
                  <li><CheckCircle2 aria-hidden /> Interim orders &amp; judgments imported as they&apos;re uploaded</li>
                  <li><CheckCircle2 aria-hidden /> Hearing reminders pushed to the assigned team</li>
                </ul>
              </div>
              <div className="visual">
                <div className="chip-mono sync" style={{ marginBottom: 14 }}><RefreshCw aria-hidden /> eCourts synced <b>2 hrs ago</b></div>
                <div className="kv" style={{ gridTemplateColumns: "1fr" }}>
                  <div className="row"><span className="k">CNR</span><span className="v">DLHC01-013245-2024</span></div>
                  <div className="row"><span className="k">Court</span><span className="v">High Court</span></div>
                  <div className="row"><span className="k">Next hearing</span><span className="v">17 Jul 2026</span></div>
                  <div className="row"><span className="k">Stage</span><span className="v">Framing of issues</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Workspace split */}
        <section className="lp-blk" id="workspace">
          <div className="lp-wrap">
            <div className="lp-split rev">
              <div className="txt">
                <div className="eyebrow"><FolderOpen aria-hidden /> Case workspace</div>
                <h2>Everything about a matter, on one screen</h2>
                <p>Open any case to see its parties, next hearing, tasks and deadlines, documents and a full team discussion — no more scattered files and spreadsheets.</p>
                <ul>
                  <li><CheckCircle2 aria-hidden /> Petitioner &amp; respondent parties with counsel on record</li>
                  <li><CheckCircle2 aria-hidden /> Tasks with assignees, due dates and status</li>
                  <li><CheckCircle2 aria-hidden /> Threaded discussion with mentions and attachments</li>
                </ul>
              </div>
              <div className="visual">
                <div className="kv" style={{ gridTemplateColumns: "1fr", marginBottom: 8 }}>
                  <div className="row"><span className="k">Matter</span><span className="v">Mehra Textiles v. SBI</span></div>
                  <div className="row"><span className="k">Stage</span><span className="v">Framing of issues</span></div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                  <span className="pill pill-warn"><span className="d" /> In Progress</span>
                  <span className="pill pill-neutral">6 tasks</span>
                  <span className="pill pill-brand">14 documents</span>
                  <span className="pill pill-line">8 hearings</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefit band */}
        <section className="lp-blk lp-band">
          <div className="lp-wrap">
            <div className="cols">
              {BENEFITS.map((b) => (
                <div className="bc" key={b.title}>
                  <div className="bi"><b.icon aria-hidden /></div>
                  <b>{b.title}</b>
                  <p>{b.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="lp-blk lp-roadmap" id="roadmap">
          <div className="lp-wrap">
            <div className="lp-blk-head">
              <div className="eyebrow"><Route aria-hidden /> On the roadmap</div>
              <h2>AI case intelligence is coming</h2>
              <p>We&apos;re building AI that reads your filings and the court record to draft grounded briefs, flag deadlines and answer questions across your documents. It arrives after our first release — early-access firms get it first.</p>
            </div>
            <div className="lp-soon-chips">
              {ROADMAP.map((r) => (
                <div className="lp-soonchip" key={r.title}>
                  <span className="si"><r.icon aria-hidden /></span>
                  <div>
                    <b>{r.title} <span className="tag">Preview</span></b>
                    <span>{r.body}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <ContactSection />

        {/* Final CTA */}
        <section className="lp-blk" style={{ paddingTop: 0 }}>
          <div className="lp-wrap">
            <div className="lp-cta-final">
              <h2>Be among the first firms on Lawsome</h2>
              <p>Join early access and set your firm up in minutes. Bring your sites, team and cases into one place — and shape the product as we build.</p>
              <div className="row">
                <Link className="btn btn-white" href={REGISTER_HREF}><ArrowRight aria-hidden /> Get early access</Link>
                <Link className="btn btn-clear" href={LOGIN_HREF}><Calendar aria-hidden /> Sign in</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-foot-grid">
            <div>
              <div className="fb"><Image src="/logo-navy.png" alt="Lawsome" width={120} height={24} /></div>
              <p className="tl">Practice management for modern law firms. Built around eCourts, from the firm down to a single application.</p>
            </div>
            <div className="col"><h5>Product</h5><Link href="#features">Features</Link><Link href="#ecourts">eCourts</Link><Link href="#workspace">Workspace</Link><Link href="#roadmap">Roadmap</Link></div>
            <div className="col"><h5>Company</h5><Link href={REGISTER_HREF}>Early access</Link><Link href={LOGIN_HREF}>Sign in</Link><Link href="#contact">Contact</Link></div>
            <div className="col"><h5>Legal</h5><Link href="#">Privacy</Link><Link href="#">Terms</Link><Link href="#">Security</Link></div>
          </div>
          <div className="lp-foot-bot">
            <span>© 2026 eTrillium Technologies LLP</span>
            <span>Early access · v1.0</span>
          </div>
        </div>
      </footer>
    </LuiRoot>
  );
}
