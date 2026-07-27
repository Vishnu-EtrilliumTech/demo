# Quickstart: Case Access Control & Contributors

How to build, run, and verify this feature locally.

## Prerequisites

- Backend "Role-Based Case Access & Case Contributors" deployed (the `case_contributors` table exists and `SiteCaseContributorsController` is live). Point `NEXT_PUBLIC_API_BASE_URL` at a dev server that has it (e.g., `https://dev2.lawsome.in`) or local Docker once the table is created.
- Test users covering several roles in one org/site: a SiteAdmin, a SiteSrLegalExpert, a plain SiteLegalExpert (non-creator/assignee), plus a case with a known creator and assignee.

## Run

```bash
npm run dev          # Turbopack dev server
npm run type-check   # tsc --noEmit (Constitution VII gate)
npm run lint         # ESLint
npm run test         # Vitest unit tests (includes access-ladder)
npm run test:e2e     # Playwright (dev server must be running)
```

## Manual verification (maps to spec Success Criteria)

### Contributors tab (US1 / SC-001, SC-007)

1. Sign in as the case **creator** (or a site admin). Open a case → a **Contributors** tab appears next to **Clients**.
2. Empty case → empty-state message shown (not a blank table).
3. **Add**: pick a site member (the picker must NOT list existing contributors, the creator, or the assignee) + choose View-only/Edit → member appears in the list.
4. **Edit level**: change View-only ↔ Edit → row updates.
5. **Remove**: confirm in the dialog → row disappears.
6. Sign in as a **SiteSrLegalExpert** or **OrganizationClerk** or a contributor → the Contributors tab is visible (can view) but **no** add/edit/remove controls appear.

### Access ladder gating (US2 / SC-002, SC-003)

7. **View-only contributor**: open each tab → no create/edit/delete controls anywhere; no "Delete Case".
8. **Edit contributor**: add/update controls on resource tabs appear, but **no delete** controls and **no "Delete Case"**.
9. **Creator / assignee / SrLegalExpert**: resource add/update/**delete** available, but **"Delete Case" hidden** (entity = Edit).
10. **SiteAdmin / OrgAdmin**: everything including "Delete Case" and resource deletes.
11. Force a stale-permission 401 (e.g., remove yourself as contributor in another tab, then act) → a readable permission toast, no crash.

### Case list filtering (US3 / SC-004)

12. Sign in as a legal expert with access to only a couple of cases → the case list shows only those; admins still see the full list.
13. A user with zero accessible cases → empty-state hints they may need to be added as a contributor (not a blank/error screen).
14. Open a case URL you lack access to → "no permission to view this case" message.

### Assignment auto-grant (US4 / SC-005)

15. Create/edit a **task** assigning it to an outside-team member; the case-access **Select** (View-only/Edit) is visible once an assignee is chosen. Choose Edit → save → that member shows as an **Edit** contributor on the Contributors tab.
16. Repeat for a **hearing**, leaving the selector unset → save succeeds and the member appears as **View-only** (backend default).

## Key files touched

- Types: `src/app/organization/types/caseindex.ts`
- Service: `src/app/organization/services/api.ts`
- Access hook: `src/hooks/useCaseAccess.ts` (+ Vitest test)
- Contributor data hook: `…/cases/[caseId]/hooks/useCaseContributors.ts`
- Tab: `…/cases/[caseId]/components/ContributorsTab/`
- Modals: `src/components/modals/AddContributorModal.tsx`, `EditContributorAccessModal.tsx`
- Case page (tab wiring + Delete Case gating): `…/cases/[caseId]/page.tsx`
- Case lists (empty states): `…/[id]/cases/page.tsx`, `…/[id]/sites/[siteId]/page.tsx`
- Task/hearing assignment forms (access-level Select)

## Definition of done

- All three pre-commit gates pass (`type-check`, `lint`, `build`).
- Access-ladder Vitest tests cover all 14 cases in `contracts/access-ladder.md`.
- Playwright E2E covers the Contributors golden path + empty state + a permission edge case.
- No control is shown that the backend would reject for the current user (SC-002).
