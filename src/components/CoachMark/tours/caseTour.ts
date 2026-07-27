import { Tour } from '@/contexts/CoachMarkContext';

export const caseTour: Tour = {
  id: 'case-tour',
  steps: [
    {
      target: '[data-coach="site-breadcrumb"]',
      title: 'Back to Site',
      message: 'Click here to return to the site page',
      position: 'bottom',
    },
    {
      target: '[data-coach="case-edit-btn"]',
      title: 'Edit Case',
      message: 'Update case details, status, and assignment',
      position: 'left',
    },
    {
      target: '[data-coach="case-overview-tab"]',
      title: 'Case Overview',
      message: 'View case summary and key information',
      position: 'bottom',
    },
    {
      target: '[data-coach="case-clients-tab"]',
      title: 'Clients',
      message: 'Manage clients associated with this case',
      position: 'bottom',
    },
    {
      target: '[data-coach="case-tasks-tab"]',
      title: 'Tasks',
      message: 'Track and manage case-related tasks',
      position: 'bottom',
    },
    {
      target: '[data-coach="case-documents-tab"]',
      title: 'Documents',
      message: 'Upload and manage case documents',
      position: 'bottom',
    },
    {
      target: '[data-coach="case-hearings-tab"]',
      title: 'Hearings',
      message: 'Schedule and track court hearings',
      position: 'bottom',
    },
    {
      target: '[data-coach="case-comments-tab"]',
      title: 'Comments',
      message: 'Collaborate with team through comments',
      position: 'bottom',
    },
    {
      target: '[data-coach="case-invoice-tab"]',
      title: 'Invoice',
      message: 'Manage billing and invoices for this case',
      position: 'bottom',
    },
  ],
};
