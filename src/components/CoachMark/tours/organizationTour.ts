import { Tour } from '@/contexts/CoachMarkContext';

export const organizationTour: Tour = {
  id: 'organization-tour',
  steps: [
    {
      target: '[data-coach="profile-menu"]',
      title: 'Your Profile',
      message: 'Access your profile and organization settings here',
      position: 'bottom',
    },
    {
      target: '[data-coach="org-edit-btn"]',
      title: 'Edit Organization',
      message: 'Update your organization details anytime',
      position: 'left',
    },
    {
      target: '[data-coach="org-users-tab"]',
      title: 'Team Members',
      message: 'Manage all your organization members here',
      position: 'bottom',
    },
    {
      target: '[data-coach="org-sites-tab"]',
      title: 'Office Locations',
      message: 'Create and manage your sites',
      position: 'bottom',
    },
  ],
};
