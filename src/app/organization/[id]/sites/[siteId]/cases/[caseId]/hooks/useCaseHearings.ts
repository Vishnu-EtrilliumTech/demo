import { useState, useCallback, useEffect, useRef } from 'react';
import {
  fetchCaseHearings,
  addCaseHearing,
  updateCaseHearing,
  deleteCaseHearing,
  type ListParams
} from '@/app/organization/services/caseapi';
import {
  CaseHearing,
  AddCaseHearingRequest,
  UpdateCaseHearingRequest,
  HearingStatus
} from '@/app/organization/types/caseindex';
import type { PagedResponse } from '@/types/pagination';
import { HearingFiltersState } from '../types';
import { formatDateForInput, formatDateForAPI } from '../utils';
import { User } from '@/app/organization/types';
import { useToast } from '@/contexts/ToastContext';
import { useFormValidation } from '@/hooks/useFormValidation';
import { CaseHearingSchemas } from '@/utils/caseValidationSchemas';
import { extractApiErrors, classifyListError } from '@/utils/errorHandler';

export const useCaseHearings = (
  organizationId: string,
  siteId: string,
  caseId: string,
  initialStatusFilter?: string,
  siteUsers?: User[],
  /**
   * Called after a hearing add/update that assigned a user, since the backend
   * may auto-grant that assignee a contributor record. Lets the page refresh
   * the (separately-owned) contributors list without a full page reload.
   */
  onContributorsChanged?: () => void,
  listParams: ListParams = {},
  /**
   * Called after a hearing add/update/delete, so the page can refresh
   * cross-tab metadata that summarizes hearings (the workspace header's
   * per-tab counts and "next hearing" KPI), which this hook doesn't own.
   */
  onHearingsChanged?: () => void
) => {
  // Stabilize listParams: default `{}` creates a new reference every render,
  // which would cause fetchCaseHearingsData to change and trigger an infinite effect loop.
  const listParamsRef = useRef(listParams);
  const listParamsJson = JSON.stringify(listParams);
  useEffect(() => {
    listParamsRef.current = listParams;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listParamsJson]);

  // Hearing management state
  const [hearings, setHearings] = useState<CaseHearing[]>([]);
  const [hearingsMeta, setHearingsMeta] = useState<PagedResponse<CaseHearing> | null>(null);
  const [loadingHearings, setLoadingHearings] = useState(false);
  const [showAddHearing, setShowAddHearing] = useState(false);
  const [addingHearing, setAddingHearing] = useState(false);
  const [updatingHearing, setUpdatingHearing] = useState(false);
  const [deletingHearingId, setDeletingHearingId] = useState<string | null>(null);

  // Delete hearing modal state
  const [deleteHearingModalOpen, setDeleteHearingModalOpen] = useState(false);
  const [hearingToDelete, setHearingToDelete] = useState<CaseHearing | null>(null);

  // API error states
  const [hearingApiErrors, setHearingApiErrors] = useState<string[] | null>(null);
  const [editHearingApiErrors, setEditHearingApiErrors] = useState<string[] | null>(null);

  // Validation hooks
  const addHearingValidation = useFormValidation(CaseHearingSchemas.add);
  const updateHearingValidation = useFormValidation(CaseHearingSchemas.update);

  const { showSuccess, showError } = useToast();

  // Hearing forms
  const [hearingForm, setHearingForm] = useState<AddCaseHearingRequest>({
    assignedToId: '',
    hearingDateTime: '',
    status: HearingStatus.Open,
    courtName: '',
    googleMapLocation: '',
    courtLocationId: '',
    notes: ''
  });

  const [editHearingForm, setEditHearingForm] = useState<UpdateCaseHearingRequest>({
    assignedToId: '',
    hearingDateTime: '',
    status: HearingStatus.Open,
    courtName: '',
    googleMapLocation: '',
    courtLocationId: '',
    notes: ''
  });

  // Store the ID of the hearing being edited
  const [editingHearingId, setEditingHearingId] = useState<string | null>(null);

  // Hearing detail view state
  const [selectedHearing, setSelectedHearing] = useState<string | null>(null);
  const [hearingDetailMode, setHearingDetailMode] = useState<'view' | 'edit'>('view');

  // Hearing filtering and sorting state
  const [hearingFilters, setHearingFilters] = useState<HearingFiltersState>({
    assignedToId: '',
    status: initialStatusFilter || '',
    location: '',
    searchQuery: '',
    sortBy: 'hearingDateTime',
    sortOrder: 'asc'
  });

  // Fetch case hearings
  const fetchCaseHearingsData = useCallback(async () => {
    if (!organizationId || !siteId || !caseId) return;
    
    setLoadingHearings(true);
    try {
      const hearingsPage = await fetchCaseHearings(organizationId, siteId, caseId, listParamsRef.current);
      setHearings(hearingsPage.items);
      setHearingsMeta(hearingsPage);
    } catch (err: unknown) {
      const classified = classifyListError(err);
      if (classified.kind === 'invalid-filter') {
        showError(classified.messages?.[0] ?? 'Invalid filter value — please adjust your filters.');
        // preserve last valid list
      } else {
        console.error('Error fetching hearings:', err);
        setHearings([]);
      }
    } finally {
      setLoadingHearings(false);
    }
  }, [organizationId, siteId, caseId, showError]);

  // Add new hearing
  const handleAddHearing = useCallback(async (onSuccess?: () => void) => {
    if (!organizationId || !siteId || !caseId) return;

    setHearingApiErrors(null);

    if (!addHearingValidation.validate(hearingForm)) {
      return;
    }

    setAddingHearing(true);
    try {
      const hearingDataForApi = {
        ...hearingForm,
        hearingDateTime: hearingForm.hearingDateTime ? formatDateForAPI(hearingForm.hearingDateTime) : ''
      };
      // Omit the assignee access-level grant when unset or no assignee (US4):
      // the backend defaults to ViewOnly when the field is absent.
      if (
        hearingDataForApi.newAssigneeContributorAccessLevel === undefined ||
        !hearingDataForApi.assignedToId
      ) {
        delete hearingDataForApi.newAssigneeContributorAccessLevel;
      }
      // Omit courtLocationId when no court was picked (free-text-only location) —
      // the backend expects a Guid? and rejects an empty string.
      if (!hearingDataForApi.courtLocationId) {
        delete hearingDataForApi.courtLocationId;
      }
      await addCaseHearing(organizationId, siteId, caseId, hearingDataForApi);
      await fetchCaseHearingsData();
      setShowAddHearing(false);
      setHearingForm({
        assignedToId: '',
        hearingDateTime: '',
        status: HearingStatus.Open,
        courtName: '',
        googleMapLocation: '',
        courtLocationId: '',
        notes: ''
      });
      addHearingValidation.reset();
      showSuccess('Hearing added successfully');
      // Assigning a user may auto-grant them as a contributor (backend side
      // effect) — refresh the contributors list so the tab reflects it.
      if (hearingDataForApi.assignedToId) {
        onContributorsChanged?.();
      }
      onHearingsChanged?.();
      onSuccess?.();
    } catch (err: unknown) {
      console.error('Error adding hearing:', err);
      const errorMessages = extractApiErrors(err);
      setHearingApiErrors(errorMessages);
    } finally {
      setAddingHearing(false);
    }
  }, [organizationId, siteId, caseId, hearingForm, addHearingValidation, fetchCaseHearingsData, showSuccess, onContributorsChanged, onHearingsChanged]);

  // Edit hearing (prepare form)
  const handleEditHearing = useCallback((hearing: CaseHearing) => {
    setEditingHearingId(hearing.id);
    setEditHearingForm({
      assignedToId: hearing.assignedToId,
      hearingDateTime: formatDateForInput(hearing.hearingDateTime),
      status: hearing.status,
      courtName: hearing.courtName,
      googleMapLocation: hearing.googleMapLocation || '',
      courtLocationId: hearing.courtLocationId || '',
      notes: hearing.notes || ''
    });
    setHearingDetailMode('edit');
  }, []);

  // Update existing hearing
  const handleUpdateHearing = useCallback(async (onSuccess?: () => void) => {
    if (!organizationId || !siteId || !caseId || !editingHearingId) return;

    setEditHearingApiErrors(null);

    if (!updateHearingValidation.validate(editHearingForm)) {
      return;
    }

    setUpdatingHearing(true);
    try {
      const hearingDataForApi = {
        ...editHearingForm,
        hearingDateTime: editHearingForm.hearingDateTime ? formatDateForAPI(editHearingForm.hearingDateTime) : ''
      };
      // Omit the assignee access-level grant when unset or no assignee (US4).
      if (
        hearingDataForApi.newAssigneeContributorAccessLevel === undefined ||
        !hearingDataForApi.assignedToId
      ) {
        delete hearingDataForApi.newAssigneeContributorAccessLevel;
      }
      // Omit courtLocationId when no court was picked (free-text-only location) —
      // the backend expects a Guid? and rejects an empty string.
      if (!hearingDataForApi.courtLocationId) {
        delete hearingDataForApi.courtLocationId;
      }
      await updateCaseHearing(
        organizationId,
        siteId,
        caseId,
        editingHearingId,
        hearingDataForApi
      );
      await fetchCaseHearingsData();
      setHearingDetailMode('view');
      setEditingHearingId(null);
      setEditHearingForm({
        assignedToId: '',
        hearingDateTime: '',
        status: HearingStatus.Open,
        courtName: '',
        googleMapLocation: '',
        courtLocationId: '',
        notes: ''
      });
      updateHearingValidation.reset();
      showSuccess('Hearing updated successfully');
      // Reassigning may auto-grant the new assignee as a contributor — refresh.
      if (hearingDataForApi.assignedToId) {
        onContributorsChanged?.();
      }
      onHearingsChanged?.();
      onSuccess?.();
    } catch (err: unknown) {
      console.error('Error updating hearing:', err);
      const errorMessages = extractApiErrors(err);
      setEditHearingApiErrors(errorMessages);
    } finally {
      setUpdatingHearing(false);
    }
  }, [organizationId, siteId, caseId, editingHearingId, editHearingForm, updateHearingValidation, fetchCaseHearingsData, showSuccess, onContributorsChanged, onHearingsChanged]);

  // Reset edit hearing state (called when modal closes without save)
  const resetEditHearing = useCallback(() => {
    setEditingHearingId(null);
    setEditHearingForm({
      assignedToId: '',
      hearingDateTime: '',
      status: HearingStatus.Open,
      courtName: '',
      googleMapLocation: '',
      courtLocationId: '',
      notes: ''
    });
    updateHearingValidation.reset();
    setEditHearingApiErrors(null);
    setHearingDetailMode('view');
  }, [updateHearingValidation]);

  // Close add hearing modal - reset form so stale data doesn't persist on reopen
  const handleCloseAddHearing = useCallback(() => {
    setShowAddHearing(false);
    setHearingForm({
      assignedToId: '',
      hearingDateTime: '',
      status: HearingStatus.Open,
      courtName: '',
      googleMapLocation: '',
      courtLocationId: '',
      notes: ''
    });
    setHearingApiErrors(null);
    addHearingValidation.reset();
  }, [addHearingValidation]);

  // Delete hearing - show modal
  const handleDeleteHearing = useCallback((hearing: CaseHearing) => {
    if (!hearing) return;
    setHearingToDelete(hearing);
    setDeleteHearingModalOpen(true);
  }, []);

  // Confirm delete hearing
  const confirmDeleteHearing = useCallback(async () => {
    if (!hearingToDelete || !organizationId || !siteId || !caseId) return;

    setDeletingHearingId(hearingToDelete.id);
    try {
      await deleteCaseHearing(organizationId, siteId, caseId, hearingToDelete.id);
      setHearings(prev => prev.filter(hearing => hearing.id !== hearingToDelete.id));

      if (selectedHearing === hearingToDelete.id) {
        setSelectedHearing(null);
        setHearingDetailMode('view');
      }

      setDeleteHearingModalOpen(false);
      setHearingToDelete(null);
      showSuccess('Hearing deleted successfully');
      onHearingsChanged?.();
    } catch (err: unknown) {
      console.error('Error deleting hearing:', err);
      const errorMessage = (err as Error).message || 'Failed to delete hearing. Please try again.';
      showError(errorMessage);
    } finally {
      setDeletingHearingId(null);
    }
  }, [hearingToDelete, organizationId, siteId, caseId, selectedHearing, showSuccess, showError, onHearingsChanged]);

  // Close delete hearing modal
  const handleCloseDeleteHearingModal = useCallback(() => {
    setDeleteHearingModalOpen(false);
    setHearingToDelete(null);
  }, []);

  // Cancel edit hearing
  const cancelEditHearing = useCallback(() => {
    resetEditHearing();
  }, [resetEditHearing]);

  // Hearing detail handlers
  const handleHearingRowClick = useCallback((hearingId: string) => {
    if (selectedHearing === hearingId && hearingDetailMode === 'view') {
      setSelectedHearing(null);
      setHearingDetailMode('view');
    } else {
      setSelectedHearing(hearingId);
      setHearingDetailMode('view');
    }
  }, [selectedHearing, hearingDetailMode]);

  // Form change handlers
  const handleHearingFormChange = useCallback((field: keyof AddCaseHearingRequest, value: string | number | null) => {
    setHearingForm(prev => ({ ...prev, [field]: value }));
    addHearingValidation.clearFieldError(field as string);
  }, [addHearingValidation]);

  const handleEditHearingFormChange = useCallback((field: keyof UpdateCaseHearingRequest, value: string | number | null) => {
    setEditHearingForm(prev => ({ ...prev, [field]: value }));
    updateHearingValidation.clearFieldError(field as string);
  }, [updateHearingValidation]);

  // Filter and sort hearings
  const getFilteredAndSortedHearings = useCallback(() => {
    let filteredHearings = [...hearings];
    
    if (hearingFilters.searchQuery) {
      const searchLower = hearingFilters.searchQuery.toLowerCase();
      filteredHearings = filteredHearings.filter(hearing => {
        const matchesHearing = hearing.courtName.toLowerCase().includes(searchLower) ||
          hearing.status.toLowerCase().includes(searchLower) ||
          (hearing.notes && hearing.notes.toLowerCase().includes(searchLower));
        
        const assignedUser = siteUsers?.find(user => user.id === hearing.assignedToId);
        const matchesAssignee = assignedUser?.fullName?.toLowerCase().includes(searchLower);
        
        return matchesHearing || matchesAssignee;
      });
    }
    
    if (hearingFilters.assignedToId) {
      filteredHearings = filteredHearings.filter(hearing =>
        hearing.assignedToId === hearingFilters.assignedToId
      );
    }
    
    if (hearingFilters.status) {
      filteredHearings = filteredHearings.filter(hearing => 
        hearing.status === hearingFilters.status
      );
    }
    
    if (hearingFilters.location) {
      filteredHearings = filteredHearings.filter(hearing =>
        hearing.courtName.toLowerCase().includes(hearingFilters.location.toLowerCase())
      );
    }
    
    filteredHearings.sort((a, b) => {
      let comparison = 0;
      
      switch (hearingFilters.sortBy) {
        case 'hearingDateTime':
          const dateA = new Date(a.hearingDateTime).getTime();
          const dateB = new Date(b.hearingDateTime).getTime();
          comparison = dateA - dateB;
          break;
        case 'location':
          comparison = a.courtName.localeCompare(b.courtName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      
      return hearingFilters.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filteredHearings;
  }, [hearings, hearingFilters, siteUsers]);

  // Filter handlers
  const handleHearingFilterChange = useCallback((filterType: string, value: string) => {
    setHearingFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  }, []);

  const handleHearingSort = useCallback((column: 'hearingDateTime' | 'location' | 'status') => {
    const isAsc = hearingFilters.sortBy === column && hearingFilters.sortOrder === 'asc';
    setHearingFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: isAsc ? 'desc' : 'asc'
    }));
  }, [hearingFilters.sortBy, hearingFilters.sortOrder]);

  const clearHearingFilters = useCallback(() => {
    setHearingFilters({
      assignedToId: '',
      status: '',
      location: '',
      searchQuery: '',
      sortBy: 'hearingDateTime',
      sortOrder: 'asc'
    });
  }, []);

  const hasActiveHearingFilters = !!(hearingFilters.assignedToId || hearingFilters.status || hearingFilters.location || hearingFilters.searchQuery);

  useEffect(() => {
    if (organizationId && siteId && caseId) {
      fetchCaseHearingsData();
    }
  }, [organizationId, siteId, caseId, fetchCaseHearingsData]);

  useEffect(() => {
    if (initialStatusFilter) {
      setHearingFilters(prev => ({
        ...prev,
        status: initialStatusFilter
      }));
    }
  }, [initialStatusFilter]);

  return {
    // State
    hearings,
    hearingsMeta,
    loadingHearings,
    showAddHearing,
    addingHearing,
    updatingHearing,
    deletingHearingId,
    hearingForm,
    editHearingForm,
    selectedHearing,
    hearingDetailMode,
    hearingFilters,
    hasActiveHearingFilters,

    // Delete hearing modal state
    deleteHearingModalOpen,
    hearingToDelete,

    // Validation errors
    hearingErrors: addHearingValidation.errors,
    editHearingErrors: updateHearingValidation.errors,
    hearingApiErrors,
    editHearingApiErrors,
    setHearingApiErrors,
    setEditHearingApiErrors,

    // Computed values
    filteredHearings: getFilteredAndSortedHearings(),

    // Actions
    fetchCaseHearingsData,
    handleAddHearing,
    handleCloseAddHearing,
    handleEditHearing,
    handleUpdateHearing,
    handleDeleteHearing,
    confirmDeleteHearing,
    handleCloseDeleteHearingModal,
    cancelEditHearing,
    handleHearingRowClick,
    handleHearingFormChange,
    handleEditHearingFormChange,
    handleHearingFilterChange,
    handleHearingSort,
    clearHearingFilters,
    resetEditHearing,

    // Setters
    setShowAddHearing,
    setSelectedHearing,
    setHearingDetailMode
  };
};