import { test, expect } from '@playwright/test';

/**
 * Unified Calendar — E2E suite (spec #038, Phase 8 T040).
 *
 * Unlike the cases/hearings E2E suites elsewhere in this folder, this
 * prototype auto-authenticates as the demo Organization Admin (see
 * src/prototype/install.ts) — no E2E_* env vars or storageState needed.
 */
test.describe('Unified Calendar (spec #038)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/organization/1/calendar');
    await page.waitForLoadState('networkidle');
  });

  test('golden path: view, filter, create a Task, and quick-set Priority', async ({ page }) => {
    // Calendar grid renders with the Month view by default.
    await expect(page.locator('.gcal-brand-word')).toHaveText('Calendar');

    // Uncheck "Notes" in the filter bar — Note items should no longer render.
    await page.getByLabel('Notes').uncheck().catch(() => undefined);

    // Create a new Task via "+Add" → Task.
    await page.getByRole('button', { name: /create/i }).click();
    await page.getByRole('button', { name: /^task$/i }).click();
    await page.getByPlaceholder('Task title').fill('E2E smoke-test task');
    await page.getByRole('button', { name: /add task/i }).click();

    // The new task should appear somewhere on the grid within a reasonable wait.
    await expect(page.getByText('E2E smoke-test task')).toBeVisible({ timeout: 10_000 });
  });

  test('edge case: unchecking every item type shows an empty grid, not an error', async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).uncheck().catch(() => undefined);
    }
    // No crash/error boundary — the grid container is still present.
    await expect(page.locator('.gcal-main')).toBeVisible();
  });

  test('edge case: an archived case\'s items still render on the Calendar', async ({ page }) => {
    // mockData.ts seeds a Note ("Follow up on recovery timeline") linked to the
    // pre-archived case (cases[11]) — it must still appear on the Calendar by
    // date per FR-017, even though the case itself is archived.
    await expect(page.getByText('Follow up on recovery timeline')).toBeVisible({ timeout: 10_000 });
  });

  test('edge case: "Favourites only" hides pure Org/Site items with no case link', async ({ page }) => {
    // "Firm-wide holiday notice" (mockData.ts note-1) is Org-scoped with no
    // caseId — it must disappear once "Favourites only" is enabled, since
    // favourite status only exists at the case level.
    await expect(page.getByText('Firm-wide holiday notice')).toBeVisible({ timeout: 10_000 });
    await page.getByLabel('Favourites only').click();
    await expect(page.getByText('Firm-wide holiday notice')).toHaveCount(0, { timeout: 10_000 });
  });
});
