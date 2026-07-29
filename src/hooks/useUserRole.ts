import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { fetchUser, fetchCurrentUser } from '@/app/organization/services/api';
import { RootState } from '@/app/redux/store/store';

/**
 * Custom hook to fetch and manage all user roles and permissions
 * Handles both organization-level and site-level roles
 * @param organizationId - The ID of the organization
 * @returns Object containing all role information and permission flags
 */
export const useUserRole = (organizationId: string) => {
  const profile = useSelector((state: RootState) => state.profile);
  const [allRoles, setAllRoles] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserRoles = async () => {
      try {
        setIsLoading(true);
        let userId = profile.userId;
        let user = null;

        // If profile.userId is not available, fetch current user from API
        if (!userId) {
          const currentUser = await fetchCurrentUser();
          userId = currentUser?.id;

          // Use the current user data directly since it already has roles
          if (currentUser && currentUser.roles && Array.isArray(currentUser.roles)) {
            user = currentUser;
          }
        }

        // If we don't have user data yet, fetch from organization API
        if (!user && userId && organizationId) {
          user = await fetchUser(organizationId, userId);
        }

        // Set roles from the user data
        if (user && user.roles && Array.isArray(user.roles)) {
          setAllRoles(user.roles);
        }

        // Set current user ID for authorization checks
        if (user && user.id) {
          setCurrentUserId(user.id.toString());
        } else if (userId) {
          setCurrentUserId(userId.toString());
        }
      } catch (error) {
        console.error('Error fetching user roles:', error);
        setAllRoles([]);
        setCurrentUserId(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (organizationId) {
      loadUserRoles();
    }
  }, [organizationId, profile.userId]);

  // Extract organization-level roles
  const organizationRole = allRoles.find(
    (role: string) =>
      role === 'OrganizationAdmin' || role === 'OrganizationClerk'
  ) || null;

  const isOrganizationAdmin = allRoles.includes('OrganizationAdmin');
  const isOrganizationClerk = allRoles.includes('OrganizationClerk');

  // Extract site-level roles
  const siteRoles = allRoles.filter(
    (role: string) =>
      role === 'SiteAdmin' ||
      role === 'SiteClerk' ||
      role === 'SiteSrLegalExpert' ||
      role === 'SiteLegalExpert' ||
      role === 'SiteCaseClient'
  );

  const isSiteAdmin = allRoles.includes('SiteAdmin');
  const isSiteClerk = allRoles.includes('SiteClerk');
  const isSiteSrLegalExpert = allRoles.includes('SiteSrLegalExpert');
  const isSiteLegalExpert = allRoles.includes('SiteLegalExpert');
  const isSiteCaseClient = allRoles.includes('SiteCaseClient');

  // Organization-level permissions
  const canManageOrganizationUsers = isOrganizationAdmin;
  const canViewOrganizationUsers = true; // Both admin and clerk can view
  const canEditOrganizationDetails = isOrganizationAdmin || isOrganizationClerk; // Both admin and clerk can edit org details
  const canManageSites = true; // Both admin and clerk can manage sites
  const canDeleteSites = isOrganizationAdmin; // Only admin can delete sites
  const canEditSites = isOrganizationAdmin || isOrganizationClerk || isSiteAdmin || isSiteClerk; // Legal experts cannot edit sites
  const canViewCases = isOrganizationAdmin || isSiteAdmin || isSiteClerk || isSiteSrLegalExpert || isSiteLegalExpert;
  const canViewHearings = isOrganizationAdmin || isSiteAdmin || isSiteClerk || isSiteSrLegalExpert || isSiteLegalExpert;
  const canEditCases = isOrganizationAdmin || isSiteAdmin || isSiteClerk || isSiteSrLegalExpert || isSiteLegalExpert;
  const canDeleteSiteUsers = isOrganizationAdmin; // Only admin can delete site users (org level)
  const canDeleteCases = isOrganizationAdmin || isSiteAdmin ; // Legal experts cannot delete cases

  // Calendar / Notes / Tasks / Archive permissions (Unified Calendar feature)
  const canViewCalendar = isOrganizationAdmin || isOrganizationClerk || isSiteAdmin || isSiteClerk || isSiteSrLegalExpert || isSiteLegalExpert;
  const canCreateNote = canViewCalendar;
  const canCreateTask = canViewCalendar;
  const canArchiveCase = isOrganizationAdmin || isSiteAdmin;
  const canConfigureCalendarDefaults = isOrganizationAdmin;

  // Site-level permissions
  const canEditSiteUsers = isSiteAdmin || isSiteSrLegalExpert || isSiteLegalExpert;
  const canDeleteSiteUsersAsSiteAdmin = isSiteAdmin;

  return {
    // All roles
    allRoles,
    isLoading,

    // Current user identity
    currentUserId,

    // Organization roles
    organizationRole,
    isOrganizationAdmin,
    isOrganizationClerk,

    // Site roles
    siteRoles,
    isSiteAdmin,
    isSiteClerk,
    isSiteSrLegalExpert,
    isSiteLegalExpert,
    isSiteCaseClient,

    // Organization-level permissions
    canManageOrganizationUsers,
    canViewOrganizationUsers,
    canEditOrganizationDetails,
    canManageSites,
    canEditSites,
    canDeleteSites,
    canViewCases,
    canViewHearings,
    canEditCases,
    canDeleteSiteUsers,
    canDeleteCases,

    // Calendar / Notes / Tasks / Archive permissions
    canViewCalendar,
    canCreateNote,
    canCreateTask,
    canArchiveCase,
    canConfigureCalendarDefaults,

    // Site-level permissions
    canEditSiteUsers,
    canDeleteSiteUsersAsSiteAdmin,
  };
};
