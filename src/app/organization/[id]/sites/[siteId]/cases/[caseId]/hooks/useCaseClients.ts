import { useState, useEffect, useCallback } from 'react';
import { addClientToCase, fetchCaseClients, updateCaseClient, deleteCaseClient, inviteCaseClient, type ListParams } from "@/app/organization/services/caseapi";
import { CaseClient, CaseClientFormData, UpdateCaseClientFormData, GenderAPIType, CaseClientRequest, UpdateCaseClientRequest } from "@/app/organization/types/caseindex";
import type { PagedResponse } from '@/types/pagination';
import { useToast } from '@/contexts/ToastContext';
import { useFormValidation } from '@/hooks/useFormValidation';
import { CaseClientSchemas } from '@/utils/caseValidationSchemas';
import { extractApiErrors } from '@/utils/errorHandler';

interface UseCaseClientsReturn {
  // Client data
  clients: CaseClient[];
  clientsMeta: PagedResponse<CaseClient> | null;
  loadingClients: boolean;
  filteredClients: CaseClient[];

  // Add client state
  showAddClient: boolean;
  setShowAddClient: (show: boolean) => void;
  addingClient: boolean;
  clientForm: CaseClientFormData;
  handleClientFormChange: (field: keyof CaseClientFormData, value: string | number) => void;
  handleAddClient: () => Promise<void>;

  // Edit client state
  editingClientId: string | null;
  setEditingClientId: (id: string | null) => void;
  updatingClient: boolean;
  editClientForm: UpdateCaseClientFormData;
  handleEditClientFormChange: (field: keyof UpdateCaseClientFormData, value: string | number) => void;
  handleUpdateClient: (clientId: string) => Promise<void>;

  // Delete client
  deletingClientId: string | null;
  deleteClientModalOpen: boolean;
  clientToDelete: CaseClient | null;
  handleDeleteClient: (client: CaseClient) => void;
  confirmDeleteClient: () => Promise<void>;
  handleCloseDeleteClientModal: () => void;

  // Invite client
  invitingClientId: string | null;
  handleInviteClient: (clientId: string, clientName: string) => Promise<void>;

  // Detail view management
  selectedClient: string | null;
  setSelectedClient: (id: string | null) => void;
  clientDetailMode: 'view' | 'edit';
  setClientDetailMode: (mode: 'view' | 'edit') => void;
  handleClientRowClick: (clientId: string) => void;
  
  // Search functionality
  clientSearchQuery: string;
  setClientSearchQuery: (query: string) => void;

  // Validation errors
  clientErrors: Record<string, string>;
  editClientErrors: Record<string, string>;
  clientApiErrors: string[] | null;
  editClientApiErrors: string[] | null;
  setClientApiErrors: (errors: string[] | null) => void;
  setEditClientApiErrors: (errors: string[] | null) => void;

  // Refresh
  refetchClients: () => Promise<void>;
}

export const useCaseClients = (
  organizationId: string,
  siteId: string,
  caseId: string,
  listParams: ListParams = {}
): UseCaseClientsReturn => {
  // Client management state
  const [clients, setClients] = useState<CaseClient[]>([]);
  const [clientsMeta, setClientsMeta] = useState<PagedResponse<CaseClient> | null>(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [addingClient, setAddingClient] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientForm, setClientForm] = useState<CaseClientFormData>({
    fullName: '',
    emailId: '',
    phoneNumber: 0,
    gender: 'Male',
    remarks: ''
  });

  // Edit client state
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [updatingClient, setUpdatingClient] = useState(false);
  const [editClientForm, setEditClientForm] = useState<UpdateCaseClientFormData>({
    fullName: '',
    emailId: '',
    phoneNumber: 0,
    gender: 'Male',
    remarks: ''
  });

  // Delete client state
  const [deletingClientId] = useState<string | null>(null);
  const [deleteClientModalOpen, setDeleteClientModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<CaseClient | null>(null);

  // API error states
  const [clientApiErrors, setClientApiErrors] = useState<string[] | null>(null);
  const [editClientApiErrors, setEditClientApiErrors] = useState<string[] | null>(null);

  // Validation hooks
  const addClientValidation = useFormValidation(CaseClientSchemas.add);
  const updateClientValidation = useFormValidation(CaseClientSchemas.update);

  const { showSuccess, showError } = useToast();

  // Invite client state
  const [invitingClientId, setInvitingClientId] = useState<string | null>(null);

  // Client detail view state
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clientDetailMode, setClientDetailMode] = useState<'view' | 'edit'>('view');

  // Function to fetch case clients
  const fetchCaseClientsData = async () => {
    if (!organizationId || !siteId || !caseId) return;
    
    setLoadingClients(true);
    try {
      const clientsPage = await fetchCaseClients(organizationId, siteId, caseId, listParams);
      const clientsData = clientsPage.items;
      const actualClients = clientsData.map((response: unknown) => (response as { data?: CaseClient } & CaseClient).data || response as CaseClient);
      setClients(actualClients);
      setClientsMeta({ ...clientsPage, items: actualClients });
    } catch (err: unknown) {
      console.error('Error loading case clients:', err);
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  // Function to add a client to the case
  const handleAddClient = useCallback(async () => {
    if (!organizationId || !siteId || !caseId) return;

    setClientApiErrors(null);

    if (!addClientValidation.validate(clientForm)) {
      return;
    }

    setAddingClient(true);
    try {
      // Transform "Non-Binary" to "Transgender" for API
      const genderForApi: GenderAPIType = clientForm.gender === 'Non-Binary' ? 'Transgender' : clientForm.gender as GenderAPIType;

      // Build API request, omitting empty/zero optional fields
      const clientDataForApi: CaseClientRequest = {
        fullName: clientForm.fullName,
        gender: genderForApi,
      };

      // Only include emailId if it's not empty
      if (clientForm.emailId && clientForm.emailId.trim() !== '') {
        clientDataForApi.emailId = clientForm.emailId;
      }

      // Only include phoneNumber if it's not 0
      if (clientForm.phoneNumber && clientForm.phoneNumber !== 0) {
        clientDataForApi.phoneNumber = clientForm.phoneNumber;
      }

      // Only include remarks if it's not empty
      if (clientForm.remarks && clientForm.remarks.trim() !== '') {
        clientDataForApi.remarks = clientForm.remarks;
      }

      const response = await addClientToCase(organizationId, siteId, caseId, clientDataForApi);
      setClients(prev => [...prev, response.data]);
      setShowAddClient(false);
      setClientForm({
        fullName: '',
        emailId: '',
        phoneNumber: 0,
        gender: 'Male',
        remarks: ''
      });
      addClientValidation.reset();
      showSuccess('Client added successfully');
    } catch (err: unknown) {
      console.error('Error adding client:', err);
      const errorMessages = extractApiErrors(err);
      setClientApiErrors(errorMessages);
    } finally {
      setAddingClient(false);
    }
  }, [organizationId, siteId, caseId, clientForm, addClientValidation, showSuccess]);

  // Function to update a client
  const handleUpdateClient = useCallback(async (clientId: string) => {
    if (!organizationId || !siteId || !caseId) return;

    setEditClientApiErrors(null);

    if (!updateClientValidation.validate(editClientForm)) {
      return;
    }

    setUpdatingClient(true);
    try {
      // Transform "Non-Binary" to "Transgender" for API
      const genderForApi: GenderAPIType = editClientForm.gender === 'Non-Binary' ? 'Transgender' : editClientForm.gender as GenderAPIType;

      // Build API request, omitting empty/zero optional fields
      const clientDataForApi: UpdateCaseClientRequest = {
        fullName: editClientForm.fullName,
        gender: genderForApi,
      };

      // Only include emailId if it's not empty
      if (editClientForm.emailId && editClientForm.emailId.trim() !== '') {
        clientDataForApi.emailId = editClientForm.emailId;
      }

      // Only include phoneNumber if it's not 0
      if (editClientForm.phoneNumber && editClientForm.phoneNumber !== 0) {
        clientDataForApi.phoneNumber = editClientForm.phoneNumber;
      }

      // Only include remarks if it's not empty
      if (editClientForm.remarks && editClientForm.remarks.trim() !== '') {
        clientDataForApi.remarks = editClientForm.remarks;
      }

      const response = await updateCaseClient(organizationId, siteId, caseId, clientId, clientDataForApi);
      setClients(prev => prev.map(client =>
        client.id === clientId ? response.data : client
      ));
      setEditingClientId(null);
      setClientDetailMode('view');
      setEditClientForm({
        fullName: '',
        emailId: '',
        phoneNumber: 0,
        gender: 'Male',
        remarks: ''
      });
      updateClientValidation.reset();
      showSuccess('Client updated successfully');
    } catch (err: unknown) {
      console.error('Error updating client:', err);
      const errorMessages = extractApiErrors(err);
      setEditClientApiErrors(errorMessages);
    } finally {
      setUpdatingClient(false);
    }
  }, [organizationId, siteId, caseId, editClientForm, updateClientValidation, showSuccess]);

  // Function to delete a client
  const handleDeleteClient = (client: CaseClient) => {
    if (!client) return;

    setClientToDelete(client);
    setDeleteClientModalOpen(true);
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete || !organizationId || !siteId || !caseId) return;

    try {
      await deleteCaseClient(organizationId, siteId, caseId, clientToDelete.id);
      setClients(prev => prev.filter(client => client.id !== clientToDelete.id));

      // If the deleted client was selected, clear the selection
      if (selectedClient === clientToDelete.id) {
        setSelectedClient(null);
        setClientDetailMode('view');
      }

      setDeleteClientModalOpen(false);
      setClientToDelete(null);
      showSuccess('Client deleted successfully');
    } catch (err: unknown) {
      console.error('Error deleting client:', err);
      const errorMessage = (err as Error).message || 'Failed to delete client. Please try again.';
      showError(errorMessage);
    }
  };

  const handleCloseDeleteClientModal = () => {
    setDeleteClientModalOpen(false);
    setClientToDelete(null);
  };

  // Function to invite a client
  const handleInviteClient = async (clientId: string, clientName: string) => {
    if (!organizationId || !siteId || !caseId) return;
    
    if (!confirm(`Send invitation to client "${clientName}"?`)) {
      return;
    }

    setInvitingClientId(clientId);
    try {
      const response = await inviteCaseClient(organizationId, siteId, caseId, clientId);
      alert(`Invitation sent successfully! ${response.isNewClient ? 'New client invitation' : 'Existing client notification'} has been sent.`);
      // Refresh the clients list to get updated invitation status
      await fetchCaseClientsData();
    } catch (err: unknown) {
      console.error('Error inviting client:', err);
      alert((err as Error).message || 'Failed to send invitation. Please try again.');
    } finally {
      setInvitingClientId(null);
    }
  };

  // Function to handle client form changes
  const handleClientFormChange = useCallback((field: keyof CaseClientFormData, value: string | number) => {
    setClientForm((prev: CaseClientFormData) => ({ ...prev, [field]: value }));
    addClientValidation.clearFieldError(field as string);
  }, [addClientValidation]);

  // Function to handle edit client form changes
  const handleEditClientFormChange = useCallback((field: keyof UpdateCaseClientFormData, value: string | number) => {
    setEditClientForm((prev: UpdateCaseClientFormData) => ({ ...prev, [field]: value }));
    updateClientValidation.clearFieldError(field as string);
  }, [updateClientValidation]);

  // Function to handle client row click
  const handleClientRowClick = (clientId: string) => {
    if (selectedClient === clientId && clientDetailMode === 'view') {
      // If same client is clicked and already in view mode, close the detail view
      setSelectedClient(null);
      setClientDetailMode('view');
    } else {
      // Show client details in view mode
      setSelectedClient(clientId);
      setClientDetailMode('view');
    }
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(client => {
    const searchLower = clientSearchQuery.toLowerCase();
    return (
      client.fullName.toLowerCase().includes(searchLower) ||
      client.emailId.toLowerCase().includes(searchLower) ||
      client.phoneNumber.toString().includes(searchLower)
    );
  });

  // Refresh function
  const refetchClients = async () => {
    await fetchCaseClientsData();
  };

  // Load clients on mount and whenever the page/sort/filter params change
  const clientsParamsKey = JSON.stringify(listParams);
  useEffect(() => {
    if (organizationId && siteId && caseId) {
      fetchCaseClientsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, siteId, caseId, clientsParamsKey]);

  return {
    // Client data
    clients,
    clientsMeta,
    loadingClients,
    filteredClients,

    // Add client state
    showAddClient,
    setShowAddClient,
    addingClient,
    clientForm,
    handleClientFormChange,
    handleAddClient,

    // Edit client state
    editingClientId,
    setEditingClientId,
    updatingClient,
    editClientForm,
    handleEditClientFormChange,
    handleUpdateClient,

    // Delete client
    deletingClientId,
    deleteClientModalOpen,
    clientToDelete,
    handleDeleteClient,
    confirmDeleteClient,
    handleCloseDeleteClientModal,

    // Invite client
    invitingClientId,
    handleInviteClient,

    // Detail view management
    selectedClient,
    setSelectedClient,
    clientDetailMode,
    setClientDetailMode,
    handleClientRowClick,

    // Search functionality
    clientSearchQuery,
    setClientSearchQuery,

    // Validation errors
    clientErrors: addClientValidation.errors,
    editClientErrors: updateClientValidation.errors,
    clientApiErrors,
    editClientApiErrors,
    setClientApiErrors,
    setEditClientApiErrors,

    // Refresh
    refetchClients,
  };
};