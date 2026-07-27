# Lawsome UI Revamp — Execution Spec & Prompt for Claude Code

> **Purpose of this document.** This is the complete, self-contained brief you
> hand to Claude Code to execute the Lawsome UI revamp. It defines the mission,
> the operating rules, a phased plan with **entry conditions, exit criteria, a
> mandatory self-review gate, and verification steps for every phase**, and a
> ready-to-paste kickoff prompt (§13).
>
> The governing idea: **incremental, verified migration — never a big-bang swap.**
> The agent applies the approved new UI to the existing application **without
> changing what the app does**, one slice at a time, self-reviewing and proving
> each slice before moving on.

---

## 1. Mission

Replace the current Lawsome application UI/UX with the **approved design system
and screen mockups**, screen by screen, in the live codebase — while **preserving
100% of existing functionality**. Presentation and interaction design change;
behavior, data, and features do not (except where the mockups deliberately
introduce a new, approved flow such as Google-only auth and the onboarding
wizard — see §5).

## 2. Source of truth: the approved mockups

The approved design lives as HTML mockups in the Lawsome **design project**
(same Claude account). These are the **pixel-accurate specification** for layout,
spacing, states, copy, and interaction.

- **Do NOT paste mockup HTML into the app.** Rebuild each screen in the app's
  real framework and component model. The HTML is the reference you match, not
  the code you ship.
- The shared stylesheet **`lawsome-ui.css`** is the design system: it holds all
  tokens (color, type, spacing, radius, shadow) and every component pattern.
- **`HANDOVER.md`** carries the design decisions and the first-release messaging
  rules (§4).
- The reference set (screens + `lawsome-ui.css` + `HANDOVER.md` + `public/`
  assets) must be copied into the repo under **`design-reference/`** as the very
  first task, so every implemented screen has a canonical reference beside it and
  the build is reproducible without leaving the repo.

**Reference screens:** Landing, Login, Register, Onboarding, Dashboard, Cases,
Case Workspace - Modern (the approved case-detail reference), Add Case, Branches,
Lawyers, Clients, Organization, eCourts, Cause List, Billing.
Archived / do-not-build: `Landing v1`, `Case Workspace` (old), `Case KPI Strip - Options`.

## 3. Operating rules (non-negotiable)

1. **Branch off latest main.** Start with `git checkout main && git pull`, then
   create an integration branch: `git checkout -b ui-revamp`. All work happens on
   `ui-revamp` (or short-lived per-phase branches merged into it). **Never commit
   to `main`. Never force-push a shared branch.**
2. **No big-bang.** Migrate one screen/slice at a time. The app must build and
   run at every commit.
3. **Feature-flag every migrated screen** so new UI can be toggled per screen and
   rolled back independently. Legacy UI stays until its replacement is verified
   and flagged on.
4. **Preserve behavior.** Never delete a feature to match a mockup. If a mockup
   omits something the app does, keep the functionality, adapt it into the new
   design, and record the discrepancy in the phase review for human decision.
5. **Tokens → components → screens.** Never style a screen ad-hoc. Everything
   inherits from the shared token layer and shared component library.
6. **Small, labeled commits.** One component or one screen per commit, present
   tense, e.g. `feat(ui): rebuild Cases table on shared DataTable`.
7. **Phase gates are hard stops.** At the end of each phase, produce the
   self-review report (§11), run all verifications (§12), and **pause for human
   sign-off before starting the next phase.** Do not roll phases together.
8. **Self-review before every sign-off.** Before marking any screen or phase
   complete, run the self-review checklist and fix everything that fails. A
   step is "done" only when its checklist is fully green.
9. **Honor the first-release messaging rules (§4) on every surface.**
10. **When blocked or ambiguous, stop and ask** rather than guessing — especially
    on data shapes, auth, and anything touching existing business logic.

## 4. First-release messaging rules (must hold on every surface)

- **No pricing** anywhere.
- **AI is roadmap-only.** Never present AI as a shipping feature. Existing AI
  panels stay labeled **"Preview — roadmap, not in first release"** and gated;
  do not wire them to a live model.
- **No country references** on public pages.
- Footer legal name: **"eTrillium Technologies LLP"**.
- **Auth is Google-only** for v1 (no email/password, phone-OTP, or SSO).

## 5. Approved new flows (these DO change behavior — intentionally)

- **Google-only auth.** Login and Register are "Continue with Google". Remove
  email/password/OTP/SSO paths from the UI. Wire real Google OAuth.
- **Onboarding wizard.** After first Google sign-up, run the 4-step wizard:
  Organization → First branch → Invite team → Done. It creates the org, the first
  branch, and sends real team invites, then lands in the populated Dashboard.
- Everywhere else: **match existing functionality**, restyled.

---

## 6. Phase 0 — Discovery & mapping  *(no UI changes yet)*

**Objective.** Understand the current app before touching it, and produce a
concrete map from existing code to the target mockups.

**Tasks.**
- Detect and document the stack: framework, router, state management, styling
  approach, component structure, API/data layer, auth mechanism, test tooling,
  build/CI.
- Copy the reference set into `design-reference/` and commit.
- For **every existing screen/route**, record: its route, the components it uses,
  its data dependencies (queries/mutations/endpoints), and **every user-facing
  behavior** (interactions, forms, validations, permissions/roles, empty/error
  states, edge cases). This is the "functionality contract" that must survive.
- Produce a **mapping table**: existing screen/route → target mockup → shared
  components it will need → data dependencies → risks/unknowns.
- Note any functionality present in the app but absent from the mockups (and vice
  versa) for human decision.

**Deliverable.** `docs/revamp/00-discovery.md` containing the stack summary, the
functionality contract per screen, and the mapping table.

**Entry criteria.** Fresh `ui-revamp` branch off latest `main`; build runs green.

**Exit criteria / self-review gate.**
- [ ] Stack and conventions documented; agent can build, run, lint, and test the app.
- [ ] `design-reference/` committed and complete.
- [ ] Every existing screen has a functionality contract.
- [ ] Mapping table complete; all gaps/discrepancies flagged.
- [ ] No source behavior changed in this phase (diff is docs + reference assets only).

**Verification.** App still builds and runs unchanged; `git diff` touches only
docs/reference. **STOP — human sign-off required before Phase 1.**

## 7. Phase 1 — Foundation  *(tokens + component library skeleton)*

**Objective.** Establish the shared visual foundation everything else composes from.

**Tasks.**
- Port the token layer from `lawsome-ui.css` into the app's theming mechanism
  (CSS variables / Tailwind config / theme object). Tokens become the single
  source of truth — no hard-coded hex/font/px anywhere afterward.
- Load fonts (Fraunces display, Inter body).
- Scaffold the shared component library from the patterns in §3 of the design
  (App shell, auth layout, stat/KPI cards, DataTable, Button, Tag/Badge, form
  fields, Dialog, Tabs, AI-preview panel, step wizard, and the empty/loading/
  error state primitives).
- Stand up a component workbench (Storybook or equivalent) rendering each
  component in its states.
- Add the **feature-flag mechanism** for per-screen rollout.

**Entry criteria.** Phase 0 signed off.

**Exit criteria / self-review gate.**
- [ ] Tokens match `lawsome-ui.css` values exactly (spot-check color/space/type).
- [ ] Each shared component renders in the workbench in all its states.
- [ ] Components are data-driven (props), not hard-coded to one screen.
- [ ] Feature-flag mechanism works (can toggle a placeholder screen).
- [ ] No existing screen visually changed yet (foundation is additive).
- [ ] Lint, typecheck, unit tests, and build all pass.

**Verification.** Workbench screenshots vs mockup components; build/test green;
existing app unaffected. **STOP — human sign-off before Phase 2.**

## 8. Phases 2–5 — Screen migration

Each screen-migration phase follows the **same loop** (defined in §9). Order is by
dependency and traffic:

- **Phase 2 — Shell & auth:** App shell (sidebar, top bar, responsive rail,
  mobile), Login, Register, Onboarding wizard. *(Wire real Google OAuth; build the
  real org/branch/invite creation.)*
- **Phase 3 — Core workflow:** Dashboard, Cases (list + filters + search +
  pagination), Add/Edit Case, Case Workspace - Modern.
- **Phase 4 — Practice:** eCourts, Cause List (court-record sync — spike its data
  source first), Billing.
- **Phase 5 — Admin & settings:** Branches, Lawyers, Clients, Organization. Then
  remove legacy UI/routes once all screens are flagged on and stable.

## 9. The per-screen migration loop (apply to every screen in Phases 2–5)

For each screen:
1. **Read** its reference mockup and its functionality contract from Phase 0.
2. **Rebuild** the screen by composing shared components; wire it to the **existing**
   data/API layer so behavior is preserved.
3. **Add the states the mockup doesn't show:** empty, loading (skeletons), error/
   retry, paginated/large, permission-gated.
4. **Put it behind its feature flag.**
5. **Self-review** against the per-screen checklist (§10). Fix everything red.
6. **Verify** (§12). Commit.
7. Only then move to the next screen.

## 10. Per-screen parity checklist (must be fully green before commit)

- [ ] Visual match to the reference mockup (layout, spacing, type, color, states).
- [ ] Built only from shared tokens + components (no ad-hoc styling).
- [ ] **All Phase-0 functionality for this screen preserved** — every interaction,
      form, validation, permission, and edge case still works.
- [ ] Empty / loading / error / paginated / permission states implemented.
- [ ] Responsive at desktop, tablet, and mobile; scroll/overflow correct with end
      padding; hit targets ≥ 44px on mobile.
- [ ] Keyboard navigation + visible focus states; accessible labels; contrast OK.
- [ ] First-release messaging rules (§4) honored.
- [ ] Behind a feature flag; toggling off restores legacy cleanly.
- [ ] No console errors/warnings; lint, typecheck, unit tests, build all pass.

## 11. Self-review report (produced at every phase boundary)

At the end of each phase, write `docs/revamp/phase-N-review.md` containing:
- **What shipped** — screens/components completed, with their flag names.
- **Checklist results** — the §10 checklist per screen, each item pass/fail with a
  one-line note; and the phase exit criteria.
- **Functionality parity** — explicit confirmation that each screen's Phase-0
  contract is preserved; list anything intentionally changed and why.
- **Verification evidence** — build/test/lint output summary; before/after
  screenshots at desktop + mobile beside the mockup.
- **Deviations & open questions** — any mockup-vs-app discrepancies, any behavior
  that couldn't be preserved as-is, anything needing a human decision.
- **Risk/rollback note** — how to flag off if a problem surfaces.

**The agent does not start the next phase until this report is written, all gates
are green, and a human has signed off.**

## 12. Verification steps (run before every commit and every phase sign-off)

- **Automated:** `lint`, `typecheck`, unit/component tests, full `build` — all
  must pass. Add/adjust tests for migrated components.
- **Behavioral:** manually exercise the screen's Phase-0 functionality contract —
  prove nothing regressed (forms submit, validations fire, permissions gate,
  navigation works).
- **Visual:** compare the running screen to its mockup at desktop, tablet, and
  mobile widths; check every state (empty/loading/error).
- **Runtime:** no console errors or warnings; no network calls failing silently.
- **Flag test:** toggle the feature flag off → legacy screen returns intact; on →
  new screen renders.
- **Regression:** screens already migrated in earlier phases still pass.

## 13. Mocked-in-prototype vs. real-in-production (build these for real)

- **Google sign-in** — real OAuth, consent, session/token, org-membership check.
- **All form submits** — persist to API, validation, server errors, success/redirect.
- **Onboarding** — real org + first-branch creation + email team invites.
- **eCourts / Cause List** — live court-record sync by CNR, hearing ingestion,
  refresh + failure handling (spike the data source before Phase 4).
- **Tables/lists** — real queries, server-side pagination, sort, filter, debounced search.
- **Notifications & ⌘K search** — real data and navigation targets.
- **AI panels** — stay roadmap-only, gated; do **not** wire to a model for v1.

## 14. Definition of done

Every reference screen is rebuilt on the shared token + component layer, wired to
real data with full state coverage, verified against its mockup and passing the
§10 checklist; each phase has a signed-off review; the legacy UI and its routes
are removed; the first-release messaging rules hold everywhere; and `ui-revamp` is
merged to `main` via PR after final review.

---

## 15. Kickoff prompt (paste this to Claude Code to begin)

```
You are executing the Lawsome UI revamp. Read REVAMP_SPEC.md in full and follow
it exactly. Key rules: work on a new `ui-revamp` branch off the latest `main`;
never touch `main` directly; migrate the UI screen by screen (NO big-bang);
preserve 100% of existing functionality; build only from a shared token +
component layer; feature-flag every migrated screen; and honor the first-release
messaging rules (no pricing, AI roadmap-only, no country references, footer
"eTrillium Technologies LLP", Google-only auth).

The approved design is the set of HTML mockups + lawsome-ui.css + HANDOVER.md in
the Lawsome design project (same account). Treat them as the pixel-accurate spec —
rebuild each screen in this app's framework; do NOT paste mockup HTML.

Start with Phase 0 (Discovery & mapping) only:
1. Create the `ui-revamp` branch off the latest main.
2. Detect and document the stack, conventions, data layer, auth, and test tooling.
3. Copy the reference set into design-reference/ and commit.
4. For every existing screen, record its full functionality contract and map it to
   its target mockup and the shared components it will need.
5. Write docs/revamp/00-discovery.md with the stack summary, per-screen
   functionality contracts, and the mapping table.

Make NO UI/source behavior changes in Phase 0 — output is docs + reference assets
only. When Phase 0's exit criteria and self-review gate (see REVAMP_SPEC.md §6)
are all green, produce the self-review, STOP, and wait for my sign-off before
starting Phase 1. Do not roll phases together. If anything is ambiguous —
especially data shapes, auth, or existing business logic — stop and ask me.
```

## 16. How to run the whole engagement

- Give Claude Code the kickoff prompt (§15). It executes Phase 0 and stops.
- Review `docs/revamp/00-discovery.md`. When satisfied, tell it: *"Phase 0 signed
  off — proceed to Phase 1 per REVAMP_SPEC.md, then stop for review."*
- Repeat phase by phase. At each boundary, read the `phase-N-review.md`, spot-check
  the running app against the mockups, then authorize the next phase.
- After the final phase, review and merge `ui-revamp` to `main` via PR.
