import { test, expect } from '@playwright/test';
import { E2E_CASE_URL, E2E_STORAGE_STATE, isCaseE2EConfigured } from './helpers/env';

// US4 — Choose contributor access when assigning a task or hearing (SC-005).
// Requires a logged-in admin/creator session on a seeded case with at least one
// outside-team site member available to assign. See helpers/env.ts.
test.describe('Assignment auto-grants contributor access (US4)', () => {
  test.skip(!isCaseE2EConfigured, 'Set E2E_CASE_URL (and E2E_STORAGE_STATE) to run');

  if (E2E_STORAGE_STATE) {
    test.use({ storageState: E2E_STORAGE_STATE });
  }

  test.beforeEach(async ({ page }) => {
    await page.goto(E2E_CASE_URL);
  });

  test('assigning a task at Edit makes the member an Edit contributor', async ({ page }) => {
    await page.getByRole('tab', { name: 'Tasks' }).click();
    await page.getByRole('button', { name: /add task/i }).click();

    await page.getByLabel(/task title/i).fill('E2E auto-grant task');

    // Pick an assignee — the case-access Select appears once one is chosen.
    await page.getByLabel('Assigned To').click();
    await page.getByRole('option').first().click();

    const accessSelect = page.getByLabel('Case Access for Assignee');
    await expect(accessSelect).toBeVisible();
    await accessSelect.click();
    await page.getByRole('option', { name: 'Editor' }).click();

    await page.getByRole('button', { name: /^add task$/i }).click();

    // Verify on the Contributors tab.
    await page.getByRole('tab', { name: 'Contributors' }).click();
    const row = page.getByRole('row').filter({ hasText: '@' }).first();
    await expect(row.getByText('Editor')).toBeVisible();
  });

  test('assigning a hearing without choosing a level grants Viewer (backend default)', async ({ page }) => {
    await page.getByRole('tab', { name: 'Hearings' }).click();
    await page.getByRole('button', { name: /add hearing/i }).click();

    await page.getByLabel('Assigned To').click();
    await page.getByRole('option').filter({ hasNotText: 'Unassigned' }).first().click();

    // Leave the access-level Select unset, then save.
    await expect(page.getByLabel('Case Access for Assignee')).toBeVisible();
    await page.getByRole('button', { name: /^(add hearing|save)$/i }).click();

    await page.getByRole('tab', { name: 'Contributors' }).click();
    const row = page.getByRole('row').filter({ hasText: '@' }).first();
    await expect(row.getByText('Viewer')).toBeVisible();
  });
});
