import { Tour } from '@/contexts/CoachMarkContext';

export const siteTour: Tour = {
  id: 'site-tour',
  steps: [
    {
      target: '[data-coach="org-breadcrumb"]',
      title: 'Back to Organization',
      message: 'Click here to return to the organization page',
      position: 'bottom',
    },
    {
      target: '[data-coach="site-edit-btn"]',
      title: 'Edit Site',
      message: 'Update site details anytime',
      position: 'left',
    },
    {
      target: '[data-coach="site-users-tab"]',
      title: 'Site Team',
      message: 'Add and manage staff for this location',
      position: 'bottom',
    },
    {
      target: '[data-coach="site-cases-tab"]',
      title: 'Legal Cases',
      message: 'Track all cases handled at this site',
      position: 'bottom',
    },
  ],
};
