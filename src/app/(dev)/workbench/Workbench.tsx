"use client";

import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Users,
  Contact,
  Landmark,
  CalendarClock,
  ReceiptIndianRupee,
  Settings,
  Bell,
  Search,
  Plus,
  Trash2,
  Download,
  FolderOpen,
  ScrollText,
  Gavel,
  ShieldCheck,
  CircleUser,
  SearchX,
} from "lucide-react";
import {
  LuiRoot,
  Button,
  GoogleButton,
  Pill,
  Field,
  Input,
  Textarea,
  Select,
  Toggle,
  Spinner,
  LoadingState,
  Skeleton,
  EmptyState,
  ErrorState,
  Card,
  StatCard,
  KpiCard,
  Meter,
  LineBar,
  Tabs,
  Dialog,
  DataTable,
  TableFoot,
  AppShell,
  AuthLayout,
  AiPreviewPanel,
  StepWizard,
  StepperRail,
  FeatureGate,
  useFeatureFlag,
  setFlagOverride,
  allFlagKeys,
  type Column,
  type FlagKey,
  type SortDirection,
} from "@/design-system";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 600, color: "#121620", marginBottom: 4 }}>
        {title}
      </h2>
      <div style={{ height: 1, background: "var(--divider)", margin: "0 0 18px" }} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>{children}</div>
    </section>
  );
}

interface Matter {
  id: string;
  title: string;
  no: string;
  status: "Open" | "In Progress" | "On Hold" | "Closed";
  assignee: string;
}

const MATTERS: Matter[] = [
  { id: "1", title: "Mehra Textiles v. State Bank", no: "CS(COMM) 842/2024", status: "In Progress", assignee: "R. Nair" },
  { id: "2", title: "Rao v. Kohli Estates", no: "FA 231/2025", status: "Open", assignee: "S. Mehta" },
  { id: "3", title: "Deccan Power v. Board", no: "APL 88/2025", status: "On Hold", assignee: "K. Raman" },
  { id: "4", title: "State v. Gupta", no: "SC 412/2024", status: "Closed", assignee: "A. Prasad" },
];

const STATUS_TONE = { Open: "warn", "In Progress": "brand", "On Hold": "neutral", Closed: "ok" } as const;

export default function Workbench() {
  const [tab, setTab] = useState("overview");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("title");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [syncOn, setSyncOn] = useState(true);
  const [aiOn, setAiOn] = useState(false);
  const [step, setStep] = useState(1);

  const columns: Column<Matter>[] = [
    {
      key: "title",
      header: "Case",
      sortField: "title",
      render: (r) => (
        <div className="doc">
          <span className="fi">
            <FolderOpen aria-hidden />
          </span>
          {r.title}
        </div>
      ),
    },
    { key: "no", header: "Case No.", sortField: "no", render: (r) => r.no },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Pill tone={STATUS_TONE[r.status]} dot>
          {r.status}
        </Pill>
      ),
    },
    { key: "assignee", header: "Assigned", render: (r) => r.assignee },
  ];

  return (
    <LuiRoot as="main" className="lui-workbench">
      <div style={{ background: "#fff", minHeight: "100vh", padding: "32px clamp(16px, 4vw, 48px)" }}>
        <header style={{ marginBottom: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            <ShieldCheck aria-hidden /> Design system · Phase 1 foundation
          </div>
          <h1 className="title" style={{ marginTop: 0 }}>
            Lawsome UI Workbench
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: 14, marginTop: 8, maxWidth: "62ch" }}>
            Every shared component in its states, rendered from the ported tokens. Dev-only route.
          </p>
        </header>

        <Section title="Feature flags">
          <FlagsPanel />
        </Section>

        <Section title="Buttons">
          <Button variant="primary" icon={Plus}>
            Add Case
          </Button>
          <Button variant="secondary" icon={Download}>
            Export
          </Button>
          <Button variant="ghost">View all</Button>
          <Button variant="danger" icon={Trash2}>
            Delete
          </Button>
          <Button variant="primary" loading>
            Saving
          </Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
          <div style={{ width: 300 }}>
            <GoogleButton>Continue with Google</GoogleButton>
          </div>
        </Section>

        <Section title="Pills / tags">
          <Pill tone="brand">Order</Pill>
          <Pill tone="ok" dot>
            Done
          </Pill>
          <Pill tone="warn" dot>
            In Progress
          </Pill>
          <Pill tone="danger">Overdue</Pill>
          <Pill tone="neutral">Open</Pill>
          <Pill tone="line">Pleading</Pill>
        </Section>

        <Section title="Form fields">
          <div style={{ width: 320 }}>
            <Field label="Case title" required htmlFor="wb-title">
              <Input id="wb-title" placeholder="e.g. Mehra Textiles v. SBI" />
            </Field>
            <Field label="Case type">
              <Select defaultValue="">
                <option value="" disabled>
                  Select type
                </option>
                <option>Commercial Suit</option>
                <option>Writ Petition</option>
              </Select>
            </Field>
          </div>
          <div style={{ width: 320 }}>
            <Field label="CNR number" hint="16-char eCourts identifier.">
              <Input placeholder="DLHC010132452024" />
            </Field>
            <Field label="Email" error hint="Enter a valid email address.">
              <Input defaultValue="not-an-email" />
            </Field>
            <Field label="Notes" full>
              <Textarea placeholder="Add a note…" />
            </Field>
          </div>
          <div className="settings-list" style={{ width: 320 }}>
            <div className="row">
              <span className="txt">
                <b>eCourts auto-sync</b>
                <span>Fetch cause lists &amp; orders daily.</span>
              </span>
              <Toggle checked={syncOn} onChange={setSyncOn} aria-label="eCourts auto-sync" />
            </div>
            <div className="row">
              <span className="txt">
                <b>AI case analysis</b>
                <span>Preview — roadmap, not in first release.</span>
              </span>
              <Toggle checked={aiOn} onChange={setAiOn} aria-label="AI case analysis" />
            </div>
          </div>
        </Section>

        <Section title="States">
          <div style={{ width: 300 }}>
            <Card pad>
              <LoadingState message="Loading cases…" />
            </Card>
          </div>
          <div style={{ width: 300 }}>
            <Card pad>
              <Skeleton rows={4} />
            </Card>
          </div>
          <div style={{ width: 340 }}>
            <Card>
              <EmptyState
                icon={SearchX}
                title="No cases found"
                description="Try adjusting your search or filters."
                action={
                  <Button variant="primary" icon={Plus}>
                    Add Case
                  </Button>
                }
              />
            </Card>
          </div>
          <div style={{ width: 340 }}>
            <Card>
              <ErrorState
                description="Failed to load. Please retry."
                action={<Button variant="secondary">Retry</Button>}
              />
            </Card>
          </div>
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </Section>

        <Section title="Stat cards · KPI · meters">
          <div className="stat-row" style={{ width: "100%" }}>
            <StatCard icon={Briefcase} tone="violet" value="248" label="Total cases" delta={{ value: "+12" }} />
            <StatCard icon={CalendarClock} tone="warn" value="37" label="Upcoming hearings" />
            <StatCard icon={ShieldCheck} tone="ok" value="1,214" label="Resolved cases" delta={{ value: "+9" }} />
            <StatCard icon={Users} value="42" label="Lawyers & staff" delta={{ value: "3", direction: "down" }} />
          </div>
          <div className="kcards" style={{ width: 420 }}>
            <KpiCard icon={Landmark} label="Court" value="High Court" sub="Commercial Div." />
            <KpiCard icon={Gavel} label="Stage" value="Framing of Issues" />
            <KpiCard icon={CircleUser} label="Lead" value="Adv. R. Nair" />
          </div>
          <Card pad className="" >
            <div style={{ width: 320 }}>
              <Meter
                rows={[
                  { label: "In Progress", value: 96, percent: 39, color: "#2b57d6" },
                  { label: "Open", value: 72, percent: 29, color: "#b06f16" },
                  { label: "Closed", value: 46, percent: 18, color: "#0e8a5f" },
                ]}
              />
              <div style={{ marginTop: 16 }}>
                <LineBar percent={73} />
              </div>
            </div>
          </Card>
        </Section>

        <Section title="Tabs">
          <div style={{ width: "100%" }}>
            <Tabs
              items={[
                { key: "overview", label: "Overview", icon: LayoutDashboard },
                { key: "tasks", label: "Tasks", icon: ScrollText, count: 6 },
                { key: "docs", label: "Documents", icon: FolderOpen, count: 14 },
                { key: "ecourts", label: "eCourts", icon: Landmark },
              ]}
              activeKey={tab}
              onChange={setTab}
            />
            <p style={{ color: "var(--text-2)", fontSize: 13.5 }}>Active panel: {tab}</p>
          </div>
        </Section>

        <Section title="Data table + pagination">
          <div style={{ width: "100%" }}>
            <DataTable
              columns={columns}
              rows={MATTERS}
              getRowKey={(r) => r.id}
              onRowClick={() => {}}
              sortBy={sortBy}
              sortDirection={sortDir}
              onSort={(f, d) => {
                setSortBy(f);
                setSortDir(d);
              }}
              empty="No cases found."
              footer={
                <TableFoot count="Showing 1–4 of 248 cases" page={page} totalPages={42} onPageChange={setPage} />
              }
            />
          </div>
        </Section>

        <Section title="Dialog">
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            Open dialog
          </Button>
          <Button variant="danger" icon={Trash2} onClick={() => setDelOpen(true)}>
            Delete confirm
          </Button>
          <Dialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            icon={Plus}
            title="Add case"
            subtitle="Create a new matter in the register"
            footer={
              <>
                <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => setDialogOpen(false)}>
                  Create case
                </Button>
              </>
            }
          >
            <div className="form-2col">
              <Field label="Case title" required full htmlFor="d-title">
                <Input id="d-title" />
              </Field>
              <Field label="Case number">
                <Input />
              </Field>
              <Field label="Site">
                <Select>
                  <option>Delhi HQ</option>
                </Select>
              </Field>
            </div>
          </Dialog>
          <Dialog
            open={delOpen}
            onClose={() => setDelOpen(false)}
            small
            danger
            icon={Trash2}
            title="Delete case?"
            subtitle="This cannot be undone."
            footer={
              <>
                <Button onClick={() => setDelOpen(false)}>Cancel</Button>
                <Button variant="danger" onClick={() => setDelOpen(false)}>
                  Delete case
                </Button>
              </>
            }
          >
            <p className="lead">The matter and its records will be permanently removed.</p>
          </Dialog>
        </Section>

        <Section title="AI preview panel (roadmap-only)">
          <div style={{ width: 360 }}>
            <AiPreviewPanel
              title="AI Case Brief"
              footer={<Button variant="secondary">Export brief</Button>}
            >
              <p>
                Grounded summary with source citations, severity alerts and next-action suggestions —
                always with a verify-the-record disclaimer.
              </p>
            </AiPreviewPanel>
          </div>
        </Section>

        <Section title="Step wizard">
          <div
            style={{
              background: "var(--navy)",
              borderRadius: "var(--r-lg)",
              padding: 24,
              width: 300,
            }}
          >
            <StepperRail
              steps={[
                { key: "org", label: "Organization", desc: "Firm profile" },
                { key: "branch", label: "First site", desc: "Head office" },
                { key: "team", label: "Invite team", desc: "Add members" },
                { key: "done", label: "All set", desc: "Finish" },
              ]}
              current={step}
            />
          </div>
          <div style={{ flex: "1 1 420px", minWidth: 320 }}>
            <StepWizard
              steps={[
                { key: "org", label: "Organization" },
                { key: "branch", label: "First site" },
                { key: "team", label: "Invite team" },
                { key: "done", label: "All set" },
              ]}
              current={step}
              kicker="Step 2 of 4"
              title="Add your first site"
              lead="Every case belongs to a site. Start with your head office."
              actions={
                <>
                  <Button onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
                  <Button variant="primary" onClick={() => setStep((s) => Math.min(3, s + 1))}>
                    Continue
                  </Button>
                </>
              }
            >
              <Field label="Site name" required>
                <Input placeholder="Delhi HQ" />
              </Field>
            </StepWizard>
          </div>
        </Section>

        <Section title="App shell">
          <div style={{ width: "100%", height: 540, borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid var(--border)" }}>
            <AppShell
              className="boxed"
              brand={<b>Lawsome</b>}
              navGroups={[
                {
                  label: "Firm",
                  items: [
                    { key: "dash", label: "Dashboard", icon: LayoutDashboard, active: true },
                    { key: "cases", label: "Cases", icon: Briefcase },
                    { key: "branches", label: "Sites", icon: Building2 },
                    { key: "lawyers", label: "Lawyers", icon: Users },
                    { key: "clients", label: "Clients", icon: Contact },
                  ],
                },
                {
                  label: "Practice",
                  items: [
                    { key: "ecourts", label: "eCourts", icon: Landmark },
                    { key: "cause", label: "Cause List", icon: CalendarClock },
                    { key: "billing", label: "Billing", icon: ReceiptIndianRupee },
                  ],
                },
                { items: [{ key: "settings", label: "Settings", icon: Settings, disabled: true }] },
              ]}
              user={{ name: "Adv. Ritika Nair", meta: "Partner · Delhi", initials: "RN" }}
              crumbs={[{ label: "Sharma & Associates" }, { label: "Dashboard", current: true }]}
              topbarActions={
                <>
                  <div className="searchbox">
                    <Search aria-hidden />
                    <input placeholder="Search cases, CNR, parties…" />
                    <kbd>⌘K</kbd>
                  </div>
                  <button className="icon-btn" aria-label="Notifications">
                    <Bell aria-hidden />
                    <span className="badge">3</span>
                  </button>
                </>
              }
            >
              <div className="page-head">
                <div className="ph-lead">
                  <div className="eyebrow">Firm overview</div>
                  <h1>Dashboard</h1>
                </div>
              </div>
              <div className="stat-row">
                <StatCard icon={Briefcase} tone="violet" value="248" label="Total cases" />
                <StatCard icon={CalendarClock} tone="warn" value="37" label="Upcoming hearings" />
                <StatCard icon={ShieldCheck} tone="ok" value="1,214" label="Resolved" />
                <StatCard icon={Users} value="42" label="Staff" />
              </div>
            </AppShell>
          </div>
        </Section>

        <Section title="Auth layout">
          <div style={{ width: "100%", height: 520, borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid var(--border)" }}>
            <AuthLayout
              className="boxed"
              logo={<b style={{ fontSize: 20, color: "#fff" }}>Lawsome</b>}
              panelHeadline="Run your entire practice from one platform"
              highlights={[
                { icon: Building2, title: "Sites & team", description: "Every matter in one workspace" },
                { icon: Landmark, title: "eCourts sync", description: "Records & cause-list monitoring" },
                { icon: CalendarClock, title: "Hearing reminders", description: "Never miss a date" },
              ]}
              panelFoot="© 2026 eTrillium Technologies LLP"
            >
              <h1>Welcome back</h1>
              <p className="lead">Sign in to your firm&apos;s Lawsome workspace.</p>
              <GoogleButton>Continue with Google</GoogleButton>
              <div className="gnote">Use your firm&apos;s Google Workspace or Gmail account.</div>
              <p className="a-alt">New to Lawsome? Register your organization</p>
            </AuthLayout>
          </div>
        </Section>
      </div>
    </LuiRoot>
  );
}

/** Live demo of the feature-flag mechanism toggling a placeholder screen. */
function FlagsPanel() {
  return (
    <Card pad className="">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {allFlagKeys().map((key) => (
          <FlagToggle key={key} flag={key} />
        ))}
      </div>
      <FeatureGate
        flag="dashboard"
        fallback={
          <div className="banner">
            <span className="bi">
              <LayoutDashboard aria-hidden />
            </span>
            <div className="t">
              <b>Legacy Dashboard (flag off)</b>
              <span>Toggle the “dashboard” flag above to swap in the new UI placeholder.</span>
            </div>
          </div>
        }
      >
        <div className="banner brand">
          <span className="bi">
            <LayoutDashboard aria-hidden />
          </span>
          <div className="t">
            <b>New Dashboard (flag on)</b>
            <span>This placeholder is gated by the “dashboard” feature flag.</span>
          </div>
        </div>
      </FeatureGate>
    </Card>
  );
}

function FlagToggle({ flag }: { flag: FlagKey }) {
  const on = useFeatureFlag(flag);
  return (
    <button
      type="button"
      className={`pill ${on ? "pill-ok" : "pill-neutral"}`}
      style={{ cursor: "pointer", border: 0 }}
      onClick={() => setFlagOverride(flag, !on)}
    >
      <span className="d" />
      {flag}
    </button>
  );
}
