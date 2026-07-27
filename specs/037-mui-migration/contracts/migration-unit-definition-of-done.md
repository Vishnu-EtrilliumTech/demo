# Contract: Migration Unit — Definition of Done

Every screen/component migrated under this feature (a "Migration Unit", see data-model.md) MUST
satisfy all of the following before its feature flag can be flipped on / its `*Legacy.tsx`
counterpart removed:

1. **No raw structural HTML** remains as the primary building block (`table`, `ul`/`li`,
   `button`, `input`, `select`, `form`) — replaced by the equivalent MUI component (FR-001).
2. **Desktop visual parity**: side-by-side screenshot at 1440px shows no perceptible difference
   from the pre-migration screen (FR-002, SC-003, research.md Decision 5).
3. **Functional parity**: every field, action, validation rule, and data value present before
   migration is present and working after (FR-003).
4. **Mobile usable at 320–599px**: no horizontal page scroll, no clipped/overlapping content, all
   primary actions reachable without pinch-zoom (FR-005, SC-002).
5. **Responsive checkpoints pass** at 360px, 768px, 1024px, 1440px (User Story 2 Independent Test).
6. **Single styling source**: no remaining Tailwind utility classes on the migrated file; all
   visual styling expressed via the MUI theme/`sx` (FR-009, research.md Decision 4).
7. **Feature-flag gated**: rollout follows the existing flag pattern so the screen is
   independently toggle/rollback-able (FR-010).
8. **Tests updated and passing**: associated Playwright/RTL tests use role/label/test-id
   selectors (not tag/class selectors tied to legacy markup) and pass (FR-011, research.md
   Decision 6).
9. **Quality gates pass**: `tsc --noEmit`, `eslint`, `next build` all succeed with no bypass
   (Constitution Principle VII).

A Migration Unit is not "done" if any item above is unchecked — partial completion stays on the
legacy path behind its flag.
