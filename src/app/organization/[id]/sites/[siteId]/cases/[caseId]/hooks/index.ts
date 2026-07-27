// Main data management hooks
export { useCaseData } from './useCaseData';
export { useCaseClients } from './useCaseClients';
export { useCaseTasks } from './useCaseTasks';
export { useCaseHearings } from './useCaseHearings';
export { useCaseInvoices } from './useCaseInvoices';
export { useCaseContributors } from './useCaseContributors';
export type { UseCaseContributorsReturn } from './useCaseContributors';
export { useAvailableContributorUsers } from './useAvailableContributorUsers';
export type { UseAvailableContributorUsersReturn } from './useAvailableContributorUsers';

// Document management hooks
export { useCaseDocuments } from './useCaseDocuments';
export { useTaskDocuments } from './useTaskDocuments';

// Comment management hooks
export { useTaskComments } from './useTaskComments';

// Generic form hooks
export { 
  useFormState, 
  useInlineEdit, 
  useModalForm,
  type FormValidation,
  type UseFormStateOptions 
} from './useFormState';