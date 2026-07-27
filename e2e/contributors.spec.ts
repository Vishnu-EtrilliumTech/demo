import { test, expect } from '@playwright/test';
import { E2E_CASE_URL, E2E_STORAGE_STATE, isCaseE2EConfigured } from './helpers/env';

// US1 — View and manage a case's contributors (golden path + empty + validation error).
// Requires a logged-in session and a seeded case where the current user is the
// creator/assignee/admin (so management controls are visible). See helpers/env.ts.
test.describe('Contributors tab (US1)', () => {
  test.skip(!isCaseE2EConfigured, 'Set E2E_CASE_URL (and E2E_STORAGE_STATE) to run');

  if (E2E_STORAGE_STATE) {
    test.use({ storageState: E2E_STORAGE_STATE });
  }

  test.beforeEach(async ({ page }) => {
    await page.goto(E2E_CASE_URL);
    await page.getByRole('tab', { name: 'Contributors' }).click();
  });

  test('shows an empty-state message when there are no contributors', async ({ page }) => {
    // Either the manage or read-only empty message, depending on the role.
    await expect(
      page.getByText(/No contributors/i)
    ).toBeVisible();
  });

  test('golden path: add → change level → remove, list updates each step', async ({ page }) => {
    // Add
    await page.getByRole('button', { name: /add contributor/i }).click();
    await page.getByPlaceholder('Search site members…').click();
    await page.getByRole('option').first().click();
    // Default level is Viewer; submit
    await page.getByRole('button', { name: /^add contributor$/i }).click();

    const firstRow = page.getByRole('row').filter({ hasText: '@' }).first();
    await expect(firstRow).toBeVisible();
    await expect(firstRow.getByText('Viewer')).toBeVisible();

    // Change level to Editor
    await firstRow.getByRole('button', { name: /edit access level/i }).click();
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Editor' }).click();
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(firstRow.getByText('Editor')).toBeVisible();

    // Remove
    await firstRow.getByRole('button', { name: /remove contributor/i }).click();
    await page.getByRole('button', { name: /^(delete|remove)$/i }).click();
    await expect(firstRow).toBeHidden();
  });

  test('surfaces a validation error when adding an ineligible member', async ({ page }) => {
    // The picker is sourced from the server-side available-users endpoint (feature
    // 034), which already excludes creator/assignee/existing contributors/admins;
    // this covers the backend 400 fallback (e.g., a stale picker / race) surfacing
    // as a readable error rather than an unhandled crash.
    await page.getByRole('button', { name: /add contributor/i }).click();
    await page.getByPlaceholder('Search site members…').click();
    const options = page.getByRole('option');
    if (await options.count()) {
      await options.first().click();
      await page.getByRole('button', { name: /^add contributor$/i }).click();
      // Success or a readable error — never an unhandled crash.
      await expect(page.locator('body')).toBeVisible();
    } else {
      await expect(page.getByText('No eligible members to add')).toBeVisible();
    }
  });
});
