/**
 * Single source of truth for the case detail page's tab order and indices.
 *
 * The eCourts tab only renders when the case has a CNR number, which shifts the
 * index of every subsequent tab. Centralising the ordered list here (rather than
 * hardcoding `hasCnrNumber ? N : N-1` arithmetic in multiple places) avoids
 * off-by-one regressions when tabs are added or reordered.
 */
export type CaseTabKey =
  | 'overview'
  | 'ecourts'
  | 'references'
  | 'clients'
  | 'tasks'
  | 'documents'
  | 'hearings'
  | 'comments'
  | 'invoice';

/**
 * Returns the ordered list of tab keys actually rendered, in display order.
 * `ecourts` is omitted when the case has no CNR number. Contributors are no
 * longer a tab — a compact indicator renders in the case header and the full
 * management card lives in the Overview tab (see ContributorsWidget).
 */
export function getCaseTabKeys(hasCnrNumber: boolean): CaseTabKey[] {
  const keys: CaseTabKey[] = ['overview'];
  if (hasCnrNumber) keys.push('ecourts');
  keys.push('references', 'clients', 'tasks', 'documents', 'hearings', 'comments', 'invoice');
  return keys;
}

/**
 * Resolves the rendered tab index for a given key, accounting for the optional
 * eCourts tab. Returns -1 if the key is not present in the current layout.
 */
export function getCaseTabIndex(key: CaseTabKey, hasCnrNumber: boolean): number {
  return getCaseTabKeys(hasCnrNumber).indexOf(key);
}
