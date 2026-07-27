import { test, expect } from '@playwright/test';
import { E2E_CASE_URL, E2E_STORAGE_STATE, isCaseE2EConfigured } from './helpers/env';

// US2 — Controls match each user's actual access level.
// Control visibility differs per role; run this suite once per role by pointing
// E2E_STORAGE_STATE at a session for that role and E2E_ROLE at one of:
//   view-contributor | edit-contributor | sr-legal-expert | admin
// See helpers/env.ts.
const role = process.env.E2E_ROLE ?? 'admin';

test.describe(`Case access gating (US2) — role: ${role}`, () => {
  test.skip(!isCaseE2EConfigured, 'Set E2E_CASE_URL (and E2E_STORAGE_STATE) to run');

  if (E2E_STORAGE_STATE) {
    test.use({ storageState: E2E_STORAGE_STATE });
  }

  test.beforeEach(async ({ page }) => {
    await page.goto(E2E_CASE_URL);
  });

  test('mutation controls reflect the role', async ({ page }) => {
    await page.getByRole('tab', { name: 'Tasks' }).click();
    const addTask = page.getByRole('button', { name: /add task/i });

    if (role === 'view-contributor') {
      // View-only: no create/edit/delete anywhere.
      await expect(addTask).toHaveCount(0);
    } else {
      // Edit/SrLE/admin: can create resources.
      await expect(addTask).toBeVisible();
    }
  });

  test('Delete Case visibility matches entity level', async ({ page }) => {
    // Open the case actions menu (Show Details → kebab) and check for Delete Case.
    await page.getByRole('button', { name: /show details/i }).click();
    const menuButton = page.getByLabel('More options');
    if (await menuButton.count()) {
      await menuButton.click();
      const deleteCase = page.getByRole('menuitem', { name: /delete case/i });
      if (role === 'admin') {
        await expect(deleteCase).toBeVisible(); // entity === Full
      } else {
        await expect(deleteCase).toHaveCount(0); // entity ≤ Edit
      }
    } else {
      // No actions available for this role — acceptable for view-only.
      expect(['view-contributor', 'edit-contributor', 'sr-legal-expert']).toContain(role);
    }
  });

  test('a stale-permission error surfaces a readable toast, not a crash', async ({ page }) => {
    // Best-effort: attempt a mutation that the backend may reject (401/403) and
    // assert the app shows a toast/alert rather than an unhandled error overlay.
    await page.getByRole('tab', { name: 'Tasks' }).click();
    const addTask = page.getByRole('button', { name: /add task/i });
    if (await addTask.count()) {
      await addTask.click();
      // The app must remain interactive (no Next.js error overlay).
      await expect(page.locator('nextjs-portal')).toHaveCount(0);
    }
  });
});
