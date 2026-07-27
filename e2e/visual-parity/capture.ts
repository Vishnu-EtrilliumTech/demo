import { type Page, expect } from '@playwright/test';

/**
 * Desktop viewport used for every parity check in the 037-mui-migration
 * feature (spec.md SC-003, research.md Decision 5). Every screen migrated
 * under that feature is compared at this fixed size so "no perceptible
 * difference" has one consistent, reproducible meaning.
 */
export const PARITY_VIEWPORT = { width: 1440, height: 900 };

/**
 * Navigate to `route` and assert its full-page render matches the committed
 * baseline snapshot for `name`.
 *
 * Wraps Playwright's built-in `toHaveScreenshot`, which already gives us the
 * baseline/current pair this task calls for: the first run (or a run with
 * `--update-snapshots`) writes `name-chromium-win32.png` under
 * `e2e/visual-parity/capture.ts-snapshots/` as the baseline; every
 * subsequent run renders the current page and diffs it against that
 * baseline, failing the assertion (with a saved diff image) on any
 * perceptible difference.
 *
 * Usage from a spec file:
 *   import { capture } from './visual-parity/capture';
 *   test('CaseInfoTab desktop parity', async ({ page }) => {
 *     await capture(page, '/organization/.../ecourt/...', 'case-info-tab');
 *   });
 */
export async function capture(page: Page, route: string, name: string): Promise<void> {
  await page.setViewportSize(PARITY_VIEWPORT);
  await page.goto(route);
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
}
