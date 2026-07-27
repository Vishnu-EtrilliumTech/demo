import { useState, useEffect, useCallback } from 'react';
import {
  fetchCaseContributors,
  addCaseContributor,
  updateCaseContributor,
  removeCaseContributor,
} from '@/app/organization/services/caseapi';
import {
  CaseContributor,
  ContributorAccessLevel,
} from '@/app/organization/types/caseindex';
import { useToast } from '@/contexts/ToastContext';
import { extractApiErrors } from '@/utils/errorHandler';

// Fetch all contributors in one call — contributors are displayed in the
// Overview widget with no pagination UI, so we request a large page.
const FETCH_ALL_PARAMS = { pageSize: 200 };

export interface UseCaseContributorsReturn {
  contributors: CaseContributor[];
  loading: boolean;
  /** Add a contributor. Returns true on success, false on failure (toast shown). */
  addContributor: (
    userId: string,
    accessLevel: ContributorAccessLevel
  ) => Promise<boolean>;
  /** Change a contributor's access level. Returns true on success. */
  updateContributor: (
    contributorId: string,
    accessLevel: ContributorAccessLevel
  ) => Promise<boolean>;
  /** Remove a contributor. Returns true on success. */
  removeContributor: (contributorId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
  /** Whether an add/update/remove mutation is currently in flight. */
  mutating: boolean;
}

/**
 * Data hook for contributor management: list + add + update + remove.
 * Contributors live in the Overview widget; no pagination is shown in the UI
 * so all contributors are fetched in a single call.
 */
export const useCaseContributors = (
  organizationId: string,
  siteId: string,
  caseId: string,
): UseCaseContributorsReturn => {
  const [contributors, setContributors] = useState<CaseContributor[]>([]);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);

  const { showSuccess, showError } = useToast();

  const loadContributors = useCallback(async () => {
    if (!organizationId || !siteId || !caseId) return;
    setLoading(true);
    try {
      const page = await fetchCaseContributors(organizationId, siteId, caseId, FETCH_ALL_PARAMS);
      setContributors(page.items);
    } catch (err: unknown) {
      console.error('Error loading case contributors:', err);
      setContributors([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, siteId, caseId]);

  const refetch = useCallback(async () => {
    await loadContributors();
  }, [loadContributors]);

  const addContributor = useCallback(
    async (userId: string, accessLevel: ContributorAccessLevel): Promise<boolean> => {
      if (!organizationId || !siteId || !caseId) return false;
      setMutating(true);
      try {
        await addCaseContributor(organizationId, siteId, caseId, {
          userId,
          accessLevel,
        });
        await loadContributors();
        showSuccess('Contributor added successfully');
        return true;
      } catch (err: unknown) {
        console.error('Error adding contributor:', err);
        showError(extractApiErrors(err).join(' '));
        return false;
      } finally {
        setMutating(false);
      }
    },
    [organizationId, siteId, caseId, loadContributors, showSuccess, showError]
  );

  const updateContributor = useCallback(
    async (
      contributorId: string,
      accessLevel: ContributorAccessLevel
    ): Promise<boolean> => {
      if (!organizationId || !siteId || !caseId) return false;
      setMutating(true);
      try {
        await updateCaseContributor(organizationId, siteId, caseId, contributorId, {
          accessLevel,
        });
        await loadContributors();
        showSuccess('Contributor access updated');
        return true;
      } catch (err: unknown) {
        console.error('Error updating contributor:', err);
        showError(extractApiErrors(err).join(' '));
        return false;
      } finally {
        setMutating(false);
      }
    },
    [organizationId, siteId, caseId, loadContributors, showSuccess, showError]
  );

  const removeContributor = useCallback(
    async (contributorId: string): Promise<boolean> => {
      if (!organizationId || !siteId || !caseId) return false;
      setMutating(true);
      try {
        await removeCaseContributor(organizationId, siteId, caseId, contributorId);
        await loadContributors();
        showSuccess('Contributor removed');
        return true;
      } catch (err: unknown) {
        console.error('Error removing contributor:', err);
        showError(extractApiErrors(err).join(' '));
        return false;
      } finally {
        setMutating(false);
      }
    },
    [organizationId, siteId, caseId, loadContributors, showSuccess, showError]
  );

  useEffect(() => {
    if (organizationId && siteId && caseId) {
      loadContributors();
    }
  }, [organizationId, siteId, caseId, loadContributors]);

  return {
    contributors,
    loading,
    addContributor,
    updateContributor,
    removeContributor,
    refetch,
    mutating,
  };
};
