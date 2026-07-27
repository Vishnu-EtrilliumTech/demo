import { useState, useEffect, useCallback } from 'react';
import { fetchAvailableContributorUsers } from '@/app/organization/services/caseapi';
import { AvailableUser } from '@/app/organization/types/caseindex';

export interface UseAvailableContributorUsersReturn {
  /** Site members eligible to be added as contributors (server-filtered). */
  availableUsers: AvailableUser[];
  loading: boolean;
  /** Re-fetch the eligible list (e.g. after an add or when opening the picker). */
  refetch: () => Promise<void>;
}

/**
 * Data hook for the "Add contributor" picker (feature 034). Sources the eligible
 * users from the backend `available-users` endpoint, which already excludes the
 * creator, assignee, existing contributors, and admins. Only fetches when
 * `enabled` (i.e. the caller may manage contributors) to avoid an unnecessary
 * call / 401 for view-only users who never see the picker.
 */
export const useAvailableContributorUsers = (
  organizationId: string,
  siteId: string,
  caseId: string,
  enabled: boolean
): UseAvailableContributorUsersReturn => {
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAvailableUsers = useCallback(async () => {
    if (!enabled || !organizationId || !siteId || !caseId) return;
    setLoading(true);
    try {
      const data = (await fetchAvailableContributorUsers(organizationId, siteId, caseId)).items;
      setAvailableUsers(data);
    } catch (err: unknown) {
      console.error('Error loading available contributor users:', err);
      setAvailableUsers([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, organizationId, siteId, caseId]);

  const refetch = useCallback(async () => {
    await loadAvailableUsers();
  }, [loadAvailableUsers]);

  useEffect(() => {
    loadAvailableUsers();
  }, [loadAvailableUsers]);

  return { availableUsers, loading, refetch };
};
