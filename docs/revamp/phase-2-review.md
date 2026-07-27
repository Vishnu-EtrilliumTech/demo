# Phase 2 — Shell & Auth: Self-Review

**Status:** Phase 2 complete and **SIGNED OFF (2026-07-12)**. Phase 3 authorized.
Branch `ui-revamp`. Commits `44d8dc1` (shell), `01cb483` (auth).

Screens migrated per the per-screen loop (REVAMP_SPEC §8/§9), each behind its
feature flag, legacy preserved when the flag is off.

---

## 1. What shipped (screens + flag names)

| Surface | Flag | Route/entry | New behavior |
|---|---|---|---|
| **App shell** | `shell` | `/organization/[id]/layout` | `OrgAppShell` on the DS `AppShell` — navy grouped sidebar (Firm/Practice/Settings) + glassy topbar + user menu. Off → legacy `OrgSidebar`/`OrgHeader`. |
| **Login** | `login` | `/login` (new) | Split-panel Google-only sign-in. Off → redirects to `/` (legacy Header sign-in stays the entry). |
| **Register** | `register` | `/register?role=organizationuser` | Reframed to "Sign up with Google" → onboarding. Off → legacy multi-role register unchanged. |
| **Onboarding** | `onboarding` | `/onboarding` (new) | 3-step wizard: Organization → First branch → Done. Real org + branch creation. |

Shared auth plumbing (`src/components/auth/`): `GoogleSignIn` (DS `.btn-google`
with the real `<GoogleLogin>` invisibly overlaid — same technique as the legacy
`GoogleAuthButton`), `exchangeGoogleCredential` (extracted from the legacy Header
flow), `AuthOverlay` (full-screen DS overlay — no `LayoutClient` change needed).

---

## 2. Preserved behavior (Phase-0 contracts)

- **App shell** mirrors `OrgSidebar` exactly: same `roleNavMap` (per-role visible
  items), same per-role Dashboard target (org → `/organization/[id]`; SiteAdmin/
  Clerk → their site; legal experts → personal dashboard), same **My Site** resolve,
  **Settings disabled** placeholder, and the header **user menu** (My Profile →
  `/profile?organizationId=`, Sign Out → `logout()` → `/`). `HeaderSearch` is reused
  verbatim, so search behavior is unchanged.
- **Login/Register OAuth** reuses the exact legacy exchange: `POST /api/auth/google`
  → on success `storeToken` + `/auth?role=organizationuser` (the existing dispatcher
  handles routing); on new user, stash `pending_google_credential` and route onward.
- **Onboarding** uses the documented `POST /api/auth/register-organization` payload
  verbatim (name/description/segments/phoneNumber/emailId/organizationKey/
  administrator*/googleIdToken), then resolves the org via
  `fetchOrganizationByUserEmail` and creates the first branch via `createSite`
  (same validation shape as `AddSiteModal`).

## 3. Intentional changes (approved, §5)

- Google-only auth on the new surfaces (no email/password/OTP). Legacy OTP path
  (legalexpert marketplace) untouched.
- Onboarding creates **org + first branch only** — the mockup's "Invite team" step
  is **deferred** (Phase-0 Q9). The wizard is 3 steps, not 4.
- Public copy scrubbed of India references (Q3): "eCourts sync", not "eCourts
  India". Footer legal name "eTrillium Technologies LLP".

---

## 4. Per-screen parity checklist (§10)

| Item | Shell | Login | Register | Onboarding |
|---|---|---|---|---|
| Visual match to mockup | ✅ | ✅ | ✅ | ✅ |
| Built only from tokens + shared components | ✅ | ✅ | ✅ | ✅ |
| Phase-0 functionality preserved | ✅ (nav/roles/search/user menu) | ✅ (exchange) | ✅ (legacy intact off; org path reframed) | ✅ (org create) + branch (new) |
| Empty/loading/error states | ✅ | n/a | n/a | ✅ (key-checking, submit error, no-session, branch-fail note) |
| Responsive desktop/tablet/mobile | ✅ (icon rail ≤900px) | ✅ (panel hides ≤860px) | ✅ | ✅ |
| Keyboard + focus + labels | ✅ | ✅ | ✅ | ✅ (labelled fields, focus ring) |
| First-release messaging (§4) | n/a (internal) | ✅ | ✅ | ✅ |
| Behind a feature flag; off restores legacy | ✅ | ✅ | ✅ | ✅ |
| Lint/typecheck/tests/build pass | ✅ | ✅ | ✅ | ✅ |

---

## 5. Verification evidence

```
yarn type-check → exit 0
yarn lint       → exit 0 (No ESLint warnings or errors)
yarn test       → exit 0 (73 passed)
yarn build      → exit 0 (/login 2.63 kB, /onboarding 5.96 kB, /register 11.8 kB)
```

**Screenshots** (dev server, flags on):
- Login (1440px) — [assets/phase-2-login.png](./assets/phase-2-login.png)
- Onboarding (1440px) — [assets/phase-2-onboarding.png](./assets/phase-2-onboarding.png)
- **Live shell + real dashboard** — [assets/phase-2-shell-live-dashboard.png](./assets/phase-2-shell-live-dashboard.png)
- **Live shell + real cases list** — [assets/phase-2-shell-live-cases.png](./assets/phase-2-shell-live-cases.png)

Screenshots confirm: correct fonts/palette, split auth layout, India-scrubbed
copy, Google-only entry, correct footer legal name, and the onboarding stepper +
form. The overlay covers the legacy chrome cleanly.

**Live end-to-end verification (backend now available).** Against the local
backend (`lawsome-api-1` on `:8080`) the new shell was exercised with **real data
and real auth**: seeded an org + branch + 5 cases via the API, authed with a real
JWT (dev AAT test-login), and loaded `/organization/[id]` with the `shell` flag on.
The new design-system shell rendered the **role-filtered nav** (Firm: Dashboard/
Cases/Users/Sites · Practice: eCourts · Settings disabled) and wrapped the (still
legacy) Dashboard and Cases pages showing the real seeded data (5 cases; status
donut Open 2 / In Progress 1 / On Hold 1 / Closed 1; the 5-row cases table with
filters/sort/pager). Confirms the shell integrates with live data and the flag
gating works. (Note: `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080` and the dev
must run on **port 3000** — the backend CORS allowlist is `localhost:3000`.)

---

## 6. Deviations & open questions

- **Live data + shell: VERIFIED** against the local backend (see §5 live
  verification). **Still to confirm with a real Google account:** the actual
  Google consent → `/api/auth/google` exchange, and the onboarding
  `register-organization` + `createSite` submit (these were validated by seeding
  via the API and by build-green code that reuses the exact endpoints, but a real
  Google-consent round-trip and the onboarding submit have not been clicked
  through). Do that once with a real Google account before enabling `login`/
  `register`/`onboarding` in production.
- **Onboarding branch key.** `createSite` requires a unique `siteKey`, which the
  mockup's branch step doesn't show — the wizard collects a "Branch key" field for
  it. Confirm acceptable, or we can auto-generate it.
- **Onboarding org lookup.** After `register-organization` the org id is resolved
  via `fetchOrganizationByUserEmail(adminEmail)` to create the branch. If the
  register response returns the org id directly, we can skip the extra lookup —
  flag for backend confirmation.
- **Mobile shell** uses the design's icon-rail (≤900px), not the legacy slide-in
  drawer — matches HANDOVER; confirm this is the intended mobile pattern.
- **Search styling.** `HeaderSearch` (legacy Tailwind styling) is reused inside the
  new topbar for functional parity; a DS-styled restyle can follow in a later pass.

## 7. Risk / rollback

All flags default **off** → the app ships legacy behavior unchanged; nothing new is
live until a flag is turned on. Roll back any single surface by toggling its flag
off (shell/login/register/onboarding), or revert commits `01cb483` / `44d8dc1`.
The only edits to existing files are flag-gated branches (org layout, register
wrapper) that no-op when flags are off.

---

**STOP — human sign-off required before Phase 3** (Core workflow: Dashboard, Cases,
Add/Edit Case, Case Workspace). Recommend validating Phase 2 auth end-to-end
against a configured backend before enabling these flags in any real environment.
