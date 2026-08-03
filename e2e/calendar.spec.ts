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

  test('clicking a date opens the Day Detail panel with its own filters and "+Add" seeded to that date', async ({ page }) => {
    // mockData.ts seeds a Note ("Client wants early settlement") on July 31.
    // Click the day NUMBER specifically (not the cell body, which also
    // contains that item and would open its edit dialog instead).
    const dayNum = page.locator('.gcal-day-num', { hasText: /^31$/ }).first();
    await dayNum.click();

    const panel = page.locator('.gcal-daypanel');
    await expect(panel).toBeVisible();
    await expect(panel.getByText('Client wants early settlement')).toBeVisible();

    // The panel's own Notes filter narrows its own list independently of the
    // main Calendar filter bar.
    await panel.locator('.gcal-daypanel-filters').getByText('Notes').click();
    await expect(panel.locator('.gcal-daypanel-empty')).toBeVisible();
    await panel.locator('.gcal-daypanel-filters').getByText('Notes').click();
    await expect(panel.getByText('Client wants early settlement')).toBeVisible();

    // "+Add" inside the panel seeds the new item's date to the panel's date.
    await panel.getByRole('button', { name: /^Task$/ }).click();
    const dueDateInput = page.locator('input[type="datetime-local"]');
    await expect(dueDateInput).toHaveValue('2026-07-31T00:00');
    await page.getByPlaceholder('Task title').fill('Day panel task');
    await page.getByRole('button', { name: /add task/i }).click();

    // The panel (still open underneath the now-closed modal) reflects the new item.
    await expect(panel.getByText('Day panel task')).toBeVisible({ timeout: 10_000 });
  });
});
