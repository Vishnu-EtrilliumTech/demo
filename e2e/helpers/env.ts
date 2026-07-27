/**
 * Shared E2E environment helpers.
 *
 * These specs exercise authenticated, backend-dependent flows. To run them you
 * must provide a reachable app + a way to authenticate. The repo intentionally
 * keeps credentials out of source — supply them via env vars:
 *
 *   E2E_BASE_URL          Base URL of a running app (defaults to localhost:3000)
 *   E2E_STORAGE_STATE     Path to a Playwright storageState.json with a logged-in session
 *   E2E_CASE_URL          Path to a seeded case detail page, e.g.
 *                         /organization/11111111-1111-1111-1111-111111111111/sites/22222222-2222-2222-2222-222222222222/cases/33333333-3333-3333-3333-333333333333
 *
 * When the required vars are absent the suites self-skip so CI without a
 * backend stays green instead of failing on missing fixtures.
 */
export const E2E_CASE_URL = process.env.E2E_CASE_URL ?? '';
export const E2E_STORAGE_STATE = process.env.E2E_STORAGE_STATE ?? '';
/** URL of a cases-list (or any paged list) page, e.g. /organization/11111111-1111-1111-1111-111111111111/cases */
export const E2E_LIST_URL = process.env.E2E_LIST_URL ?? '';

/** True when enough is configured to run the authenticated case-detail suites. */
export const isCaseE2EConfigured = Boolean(E2E_CASE_URL);
/** True when enough is configured to run the pagination/sorting/filtering suites. */
export const isListE2EConfigured = Boolean(E2E_LIST_URL);
