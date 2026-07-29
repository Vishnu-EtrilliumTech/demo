import { test, expect } from '@playwright/test';

/**
 * eCourts Onboarding Bulk Import — E2E suite (spec #038, Phase 8 T041).
 *
 * This prototype auto-authenticates as the demo Organization Admin (see
 * src/prototype/install.ts) — no E2E_* env vars or storageState needed.
 */
test.describe('eCourts Onboarding Bulk Import (spec #038)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/organization/1/ecourts');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /bulk import/i }).click();
  });

  test('golden path: search by advocate name, multi-select, and import', async ({ page }) => {
    await page.getByPlaceholder(/search eCourts by advocate name/i).fill('Adv. R. Verma');
    await page.getByRole('button', { name: /^search$/i }).click();

    // Mock results render as checkbox rows.
    const rows = page.locator('input[type="checkbox"]');
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
    const rowCount = await rows.count();
    for (let i = 0; i < Math.min(3, rowCount); i++) {
      await rows.nth(i).check();
    }

    await page.getByRole('button', { name: /import selected/i }).click();

    // Each selected row shows its own independent result.
    await expect(page.getByText(/Created|Already Linked|Error/).first()).toBeVisible({ timeout: 10_000 });
  });

  test('edge case: a partial failure does not hide the other rows\' results', async ({ page }) => {
    await page.getByPlaceholder(/search eCourts by advocate name/i).fill('Adv. P. Nair');
    await page.getByRole('button', { name: /^search$/i }).click();

    const rows = page.locator('input[type="checkbox"]');
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      await rows.nth(i).check();
    }
    await page.getByRole('button', { name: /import selected/i }).click();

    // Every row still shows a result — a failed row doesn't blank out the rest.
    await expect(page.getByText(/Created|Already Linked|Error/)).toHaveCount(rowCount, { timeout: 10_000 });
  });
});
