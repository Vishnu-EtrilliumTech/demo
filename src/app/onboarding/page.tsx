"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { BadgeCheck, Check, CircleAlert } from "lucide-react";
import {
  Field,
  Input,
  Textarea,
  Select,
  Button,
  StepperRail,
  WizardProgress,
  useFeatureFlag,
} from "@/design-system";
import { AuthOverlay } from "@/components/auth/AuthOverlay";
import { storeToken, getUserInfo } from "@/services/authServices";
import {
  checkOrgKeyAvailability,
  checkSiteKeyAvailability,
  fetchOrganizationByUserEmail,
  createSite,
} from "@/app/organization/services/api";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { ValidationPatterns } from "@/utils";

const STEPS = [
  { key: "org", label: "Organization", desc: "Firm profile" },
  { key: "branch", label: "First site", desc: "Head office" },
  { key: "done", label: "All set", desc: "Finish" },
];

interface AddressData {
  fullAddress: string;
  locality: string;
  district: string;
  state: string;
  pincode: string;
}

const SEGMENT_OPTIONS = ["Legal", "Insurance"];
const toInt = (s: string) => parseInt(s.replace(/[\s\-+()]/g, ""), 10);
const genderForApi = (g: string) =>
  g === "non-binary" ? "Transgender" : g.charAt(0).toUpperCase() + g.slice(1);

interface Form {
  orgName: string;
  orgEmail: string;
  orgPhone: string;
  orgKey: string;
  segments: string[];
  orgDescription: string;
  adminName: string;
  adminPhone: string;
  adminGender: string;
  branchName: string;
  branchKey: string;
  branchEmail: string;
  branchPhone: string;
  address: string;
  locality: string;
  district: string;
  state: string;
  pincode: string;
  landmark: string;
  branchDescription: string;
}

const EMPTY: Form = {
  orgName: "", orgEmail: "", orgPhone: "", orgKey: "", segments: [], orgDescription: "",
  adminName: "", adminPhone: "", adminGender: "male",
  branchName: "", branchKey: "", branchEmail: "", branchPhone: "",
  address: "", locality: "", district: "", state: "", pincode: "", landmark: "", branchDescription: "",
};

/**
 * Organization onboarding wizard (Phase 2, approved new flow). Creates the org +
 * first branch — team invites are deferred to a later phase (Phase-0 Q9). Wired
 * to the real endpoints: POST /api/auth/register-organization then createSite.
 * Gated by the `onboarding` flag; requires a pending Google credential.
 */
export default function OnboardingPage() {
  const enabled = useFeatureFlag("onboarding");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [credential, setCredential] = useState<string | null>(null);
  const [googleEmail, setGoogleEmail] = useState<string>("");
  const [orgKeyStatus, setOrgKeyStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const [branchKeyStatus, setBranchKeyStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const keyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const branchKeyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      router.replace("/");
      return;
    }
    const cred = sessionStorage.getItem("pending_google_credential");
    if (!cred) return;
    setCredential(cred);
    try {
      const email = jwtDecode<{ email?: string }>(cred).email ?? "";
      setGoogleEmail(email);
      setForm((f) => ({ ...f, orgEmail: f.orgEmail || email }));
    } catch {
      /* ignore */
    }
  }, [enabled, router]);

  // Debounced organization-key availability check.
  useEffect(() => {
    const key = form.orgKey.trim();
    if (keyTimer.current) clearTimeout(keyTimer.current);
    if (!key) { setOrgKeyStatus("idle"); return; }
    setOrgKeyStatus("checking");
    keyTimer.current = setTimeout(async () => {
      try {
        const ok = await checkOrgKeyAvailability(key);
        setOrgKeyStatus(ok ? "available" : "unavailable");
      } catch {
        setOrgKeyStatus("idle");
      }
    }, 600);
    return () => { if (keyTimer.current) clearTimeout(keyTimer.current); };
  }, [form.orgKey]);

  // Debounced branch/site-key availability check (scoped to the current organization).
  useEffect(() => {
    const key = form.branchKey.trim();
    if (branchKeyTimer.current) clearTimeout(branchKeyTimer.current);
    if (!key || !orgId) { setBranchKeyStatus("idle"); return; }
    setBranchKeyStatus("checking");
    branchKeyTimer.current = setTimeout(async () => {
      try {
        const ok = await checkSiteKeyAvailability(orgId, key);
        setBranchKeyStatus(ok ? "available" : "unavailable");
      } catch {
        setBranchKeyStatus("idle");
      }
    }, 600);
    return () => { if (branchKeyTimer.current) clearTimeout(branchKeyTimer.current); };
  }, [form.branchKey, orgId]);

  if (!enabled) return null;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const toggleSegment = (s: string) =>
    setForm((f) => ({
      ...f,
      segments: f.segments.includes(s) ? f.segments.filter((x) => x !== s) : [...f.segments, s],
    }));
  const handleAddressSelect = (a: AddressData) => {
    setForm((f) => ({ ...f, address: a.fullAddress, locality: a.locality, district: a.district, state: a.state, pincode: a.pincode }));
    setErrors((e) => ({ ...e, address: undefined, locality: undefined, district: undefined, state: undefined, pincode: undefined }));
  };

  const req = (v: string) => v.trim().length > 0;
  const emailError = (v: string) =>
    !req(v) ? "Required" : !ValidationPatterns.generalEmail.test(v.trim()) ? "Please enter a valid email address" : undefined;
  const phoneError = (v: string) =>
    !req(v) ? "Required" : !ValidationPatterns.phone.test(v.trim()) ? "Please enter a valid 10-digit Indian phone number" : undefined;

  const getOrgErrors = (): Partial<Record<keyof Form, string>> => {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!req(form.orgName)) e.orgName = "Required";
    e.orgEmail = emailError(form.orgEmail);
    e.orgPhone = phoneError(form.orgPhone);
    if (!req(form.orgKey)) e.orgKey = "Required";
    else if (form.orgKey.trim().length > 5) e.orgKey = "Max 5 characters";
    else if (orgKeyStatus === "unavailable") e.orgKey = "This key is taken";
    else if (orgKeyStatus === "checking") e.orgKey = "Checking availability…";
    if (form.segments.length === 0) e.segments = "Select at least one";
    if (!req(form.orgDescription)) e.orgDescription = "Required";
    if (!req(form.adminName)) e.adminName = "Required";
    e.adminPhone = phoneError(form.adminPhone);
    (Object.keys(e) as (keyof Form)[]).forEach((k) => {
      if (e[k] === undefined) delete e[k];
    });
    return e;
  };

  const getBranchErrors = (): Partial<Record<keyof Form, string>> => {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!req(form.branchName)) e.branchName = "Required";
    if (!req(form.branchKey)) e.branchKey = "Required";
    else if (form.branchKey.trim().length > 5) e.branchKey = "Max 5 characters";
    else if (branchKeyStatus === "unavailable") e.branchKey = "This key is taken";
    else if (branchKeyStatus === "checking") e.branchKey = "Checking availability…";
    e.branchEmail = emailError(form.branchEmail);
    e.branchPhone = phoneError(form.branchPhone);
    if (!req(form.address)) e.address = "Required";
    if (!req(form.locality)) e.locality = "Required";
    if (!req(form.district)) e.district = "Required";
    if (!req(form.state)) e.state = "Required";
    if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = "6-digit pincode";
    if (!req(form.landmark)) e.landmark = "Required";
    if (!req(form.branchDescription)) e.branchDescription = "Required";
    (Object.keys(e) as (keyof Form)[]).forEach((k) => {
      if (e[k] === undefined) delete e[k];
    });
    return e;
  };

  const validateOrg = (): boolean => {
    const e = getOrgErrors();
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateBranch = (): boolean => {
    const e = getBranchErrors();
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isOrgStepValid = Object.keys(getOrgErrors()).length === 0;
  const isBranchStepValid = Object.keys(getBranchErrors()).length === 0;

  const validateOnBlur = (key: keyof Form, value: string, checker: (v: string) => string | undefined) => {
    if (!req(value)) return;
    setErrors((prev) => ({ ...prev, [key]: checker(value) }));
  };

  const registerOrg = async () => {
    if (!validateOrg()) return;
    if (orgId) { setStep(1); return; }
    if (!credential) { setSubmitError("Your Google session expired — please sign up again."); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register-organization`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.orgName.trim(),
          description: form.orgDescription.trim(),
          segments: form.segments,
          phoneNumber: toInt(form.orgPhone),
          emailId: form.orgEmail.trim(),
          organizationKey: form.orgKey.trim(),
          administratorName: form.adminName.trim(),
          administratorPhoneNumber: toInt(form.adminPhone),
          administratorGender: genderForApi(form.adminGender),
          googleIdToken: credential,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSubmitError(err.errors?.[0] || "Organization registration failed.");
        return;
      }
      const data = await res.json();
      const token = data?.data?.token || data?.token;
      if (!token) { setSubmitError("Registration succeeded but no session token was returned."); return; }
      sessionStorage.removeItem("pending_google_credential");
      storeToken(token);

      const info = await getUserInfo();
      const lookupEmail = info?.email || googleEmail;
      const org = lookupEmail ? await fetchOrganizationByUserEmail(lookupEmail) : null;
      if (org) localStorage.setItem("orgData", JSON.stringify(org));
      const newOrgId = org?.id ? String(org.id) : null;
      if (!newOrgId) { setSubmitError("Organization created but could not be resolved — please contact support."); return; }
      setOrgId(newOrgId);
      setStep(1);
    } catch (err) {
      console.error("Organization registration failed:", err);
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitBranch = async () => {
    if (!orgId) { setSubmitError("Missing organization — please go back and continue again."); return; }
    if (!validateBranch()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createSite(orgId, {
        name: form.branchName.trim(),
        siteKey: form.branchKey.trim(),
        emailId: form.branchEmail.trim(),
        phoneNumber: form.branchPhone.trim(),
        address: form.address.trim(),
        locality: form.locality.trim(),
        district: form.district.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        landmark: form.landmark.trim(),
        description: form.branchDescription.trim(),
        enabled: true,
      });
      setStep(2);
    } catch (err) {
      console.error("Site creation failed:", err);
      setSubmitError("Your firm was created, but the first site could not be saved — add it from the dashboard.");
    } finally {
      setSubmitting(false);
    }
  };

  const goDashboard = () =>
    (window.location.href = orgId ? `/organization/${orgId}` : "/auth?role=organizationuser");

  return (
    <AuthOverlay>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 380px) 1fr", minHeight: "100vh" }} className="ob-shell">
        {/* Rail */}
        <aside
          style={{
            background: "linear-gradient(155deg, #131a2b 0%, #1d2740 55%, #22305a 100%)",
            color: "#fff",
            padding: 44,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Image src="/logo-white.png" alt="Lawsome" width={130} height={30} priority />
          <div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 500, margin: "0 0 8px", letterSpacing: "-0.015em" }}>
              Let&apos;s get your firm set up
            </h2>
            <p style={{ color: "var(--ink-rev)", fontSize: 13.5, margin: "0 0 28px" }}>
              A few quick steps to create your workspace.
            </p>
            <StepperRail steps={STEPS} current={step} />
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-rev-dim)" }}>© 2026 eTrillium Technologies LLP</div>
        </aside>

        {/* Content */}
        <main style={{ padding: "40px clamp(24px, 5vw, 64px)", overflow: "auto", maxWidth: 760, width: "100%" }}>
          <WizardProgress current={step} total={STEPS.length} />

          {googleEmail ? (
            <div className="banner" style={{ background: "var(--ok-soft)", marginBottom: 22 }}>
              <span className="bi" style={{ color: "var(--ok)" }}>
                <BadgeCheck aria-hidden />
              </span>
              <div className="t">
                <b style={{ color: "var(--ok-ink)" }}>Signed in with Google</b>
                <span>{googleEmail} · verified</span>
              </div>
            </div>
          ) : null}

          {!credential ? (
            <div className="banner" style={{ background: "var(--warn-soft)", marginBottom: 22 }}>
              <span className="bi" style={{ color: "var(--warn)" }}>
                <CircleAlert aria-hidden />
              </span>
              <div className="t">
                <b style={{ color: "var(--warn-ink)" }}>No active sign-up session</b>
                <span>
                  Start from <Link href="/register?role=organizationuser">Register your organization</Link>.
                </span>
              </div>
            </div>
          ) : null}

          {step === 0 && (
            <>
              <div className="ob-kicker">Step 1 of 3</div>
              <h2 className="ob-h">Your organization</h2>
              <p className="ob-lead">Tell us about your firm. You&apos;ll be the organization admin.</p>
              {submitError ? (
                <div className="banner" style={{ background: "var(--danger-soft)", marginBottom: 18 }}>
                  <span className="bi" style={{ color: "var(--danger)" }}><CircleAlert aria-hidden /></span>
                  <div className="t"><b style={{ color: "var(--danger-ink)" }}>{submitError}</b></div>
                </div>
              ) : null}
              <div className="form-2col">
                <Field label="Firm name" required error={!!errors.orgName} hint={errors.orgName} full>
                  <Input value={form.orgName} onChange={(e) => set("orgName", e.target.value)} placeholder="e.g. Sharma & Associates" />
                </Field>
                <Field label="Organization email" required error={!!errors.orgEmail} hint={errors.orgEmail}>
                  <Input
                    type="email"
                    value={form.orgEmail}
                    onChange={(e) => set("orgEmail", e.target.value)}
                    onBlur={(e) => validateOnBlur("orgEmail", e.target.value, emailError)}
                  />
                </Field>
                <Field label="Organization phone" required error={!!errors.orgPhone} hint={errors.orgPhone}>
                  <Input
                    value={form.orgPhone}
                    onChange={(e) => set("orgPhone", e.target.value)}
                    onBlur={(e) => validateOnBlur("orgPhone", e.target.value, phoneError)}
                    placeholder="10-digit mobile number"
                  />
                </Field>
                <Field
                  label="Organization key"
                  required
                  error={!!errors.orgKey || orgKeyStatus === "unavailable"}
                  hint={
                    errors.orgKey ||
                    (orgKeyStatus === "checking"
                      ? "Checking availability…"
                      : orgKeyStatus === "available"
                        ? "Available — cannot be changed later."
                        : orgKeyStatus === "unavailable"
                          ? "This key is already taken."
                          : "Up to 5 characters, used to number cases.")
                  }
                >
                  <Input value={form.orgKey} maxLength={5} onChange={(e) => set("orgKey", e.target.value)} />
                </Field>
                <Field label="Segments" required error={!!errors.segments} hint={errors.segments} full>
                  <div style={{ display: "flex", gap: 10 }}>
                    {SEGMENT_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`pill ${form.segments.includes(s) ? "pill-brand" : "pill-line"}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => toggleSegment(s)}
                      >
                        {form.segments.includes(s) ? <Check width={13} height={13} /> : null}
                        {s}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Description" required error={!!errors.orgDescription} hint={errors.orgDescription} full>
                  <Textarea value={form.orgDescription} onChange={(e) => set("orgDescription", e.target.value)} />
                </Field>
                <Field label="Your name" required error={!!errors.adminName} hint={errors.adminName}>
                  <Input value={form.adminName} onChange={(e) => set("adminName", e.target.value)} />
                </Field>
                <Field label="Your phone" required error={!!errors.adminPhone} hint={errors.adminPhone}>
                  <Input
                    value={form.adminPhone}
                    onChange={(e) => set("adminPhone", e.target.value)}
                    onBlur={(e) => validateOnBlur("adminPhone", e.target.value, phoneError)}
                    placeholder="10-digit mobile number"
                  />
                </Field>
                <Field label="Gender" required>
                  <Select value={form.adminGender} onChange={(e) => set("adminGender", e.target.value)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-Binary</option>
                  </Select>
                </Field>
              </div>
              <div className="ob-actions">
                <Link className="btn btn-secondary" href="/register?role=organizationuser">Back</Link>
                <Button variant="primary" loading={submitting} disabled={!isOrgStepValid || submitting} onClick={registerOrg}>Continue</Button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="ob-kicker">Step 2 of 3</div>
              <h2 className="ob-h">Your first site</h2>
              <p className="ob-lead">Every case belongs to a site. Start with your head office.</p>
              {submitError ? (
                <div className="banner" style={{ background: "var(--danger-soft)", marginBottom: 18 }}>
                  <span className="bi" style={{ color: "var(--danger)" }}><CircleAlert aria-hidden /></span>
                  <div className="t"><b style={{ color: "var(--danger-ink)" }}>{submitError}</b></div>
                </div>
              ) : null}
              <div className="form-2col">
                <Field label="Site name" required error={!!errors.branchName} hint={errors.branchName}>
                  <Input value={form.branchName} onChange={(e) => set("branchName", e.target.value)} placeholder="Head office" />
                </Field>
                <Field
                  label="Site key"
                  required
                  error={!!errors.branchKey || branchKeyStatus === "unavailable"}
                  hint={
                    errors.branchKey ||
                    (branchKeyStatus === "checking"
                      ? "Checking availability…"
                      : branchKeyStatus === "available"
                        ? "Available — cannot be changed later."
                        : branchKeyStatus === "unavailable"
                          ? "This key is already taken."
                          : "Up to 5 characters, used to number cases.")
                  }
                >
                  <Input value={form.branchKey} maxLength={5} onChange={(e) => set("branchKey", e.target.value)} />
                </Field>
                <Field label="Site email" required error={!!errors.branchEmail} hint={errors.branchEmail}>
                  <Input
                    type="email"
                    value={form.branchEmail}
                    onChange={(e) => set("branchEmail", e.target.value)}
                    onBlur={(e) => validateOnBlur("branchEmail", e.target.value, emailError)}
                  />
                </Field>
                <Field label="Site phone" required error={!!errors.branchPhone} hint={errors.branchPhone}>
                  <Input
                    value={form.branchPhone}
                    onChange={(e) => set("branchPhone", e.target.value)}
                    onBlur={(e) => validateOnBlur("branchPhone", e.target.value, phoneError)}
                    placeholder="10-digit mobile number"
                  />
                </Field>
                <Field label="Address" required error={!!errors.address} hint={errors.address} full>
                  <AddressAutocomplete
                    value={form.address}
                    onChange={(value) => set("address", value)}
                    onPlaceSelect={handleAddressSelect}
                    placeholder="Search for an address"
                    error={errors.address}
                  />
                </Field>
                <Field label="Locality" required error={!!errors.locality} hint={errors.locality}>
                  <Input value={form.locality} onChange={(e) => set("locality", e.target.value)} />
                </Field>
                <Field label="District" required error={!!errors.district} hint={errors.district}>
                  <Input value={form.district} onChange={(e) => set("district", e.target.value)} />
                </Field>
                <Field label="State" required error={!!errors.state} hint={errors.state}>
                  <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
                </Field>
                <Field label="Pincode" required error={!!errors.pincode} hint={errors.pincode}>
                  <Input value={form.pincode} maxLength={6} onChange={(e) => set("pincode", e.target.value)} />
                </Field>
                <Field label="Landmark" required error={!!errors.landmark} hint={errors.landmark} full>
                  <Input value={form.landmark} onChange={(e) => set("landmark", e.target.value)} />
                </Field>
                <Field label="Description" required error={!!errors.branchDescription} hint={errors.branchDescription} full>
                  <Textarea value={form.branchDescription} onChange={(e) => set("branchDescription", e.target.value)} />
                </Field>
              </div>
              <div className="ob-actions">
                <Button variant="secondary" onClick={() => setStep(0)} disabled={submitting}>Back</Button>
                <Button variant="primary" loading={submitting} disabled={!isBranchStepValid || submitting} onClick={submitBranch}>
                  Create workspace
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div className="ei" style={{ margin: "0 auto 20px", background: "var(--ok-soft)", color: "var(--ok)", width: 64, height: 64, borderRadius: 18, display: "grid", placeItems: "center" }}>
                <Check width={30} height={30} />
              </div>
              <h2 className="ob-h" style={{ fontSize: 28 }}>Your workspace is ready</h2>
              <p className="ob-lead">Your firm and first site are set up. Time to add your first case.</p>
              {submitError ? <p style={{ color: "var(--warn-ink)", fontSize: 13 }}>{submitError}</p> : null}
              <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
                <Button variant="primary" onClick={goDashboard}>Go to dashboard</Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthOverlay>
  );
}
