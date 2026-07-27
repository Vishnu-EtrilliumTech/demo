import { useState, useEffect } from 'react';
import { fetchCase, updateCase, fetchSiteUser, fetchSiteUsers, fetchSite } from "@/app/organization/services/api";
import { CaseStatus, Site, User } from "@/app/organization/types";
import { CaseData, EditTitleFormState, EditFormData } from '../types/case';
import { useToast } from '@/contexts/ToastContext';
import { extractFieldErrors } from '@/utils';

interface UseCaseDataReturn {
  // Main case data
  caseData: CaseData | null;
  loading: boolean;
  error: string | null;

  // Related data
  assignedUserData: User | undefined;
  loadingAssignedUser: boolean;
  siteUsers: User[];
  loadingSiteUsers: boolean;
  siteData: Site | undefined;

  // Title editing
  isEditingTitle: boolean;
  isLoadingTitle: boolean;
  editTitleForm: EditTitleFormState;
  setEditTitleForm: (form: EditTitleFormState) => void;
  handleEditTitleClick: () => void;
  handleSaveTitleEdit: () => Promise<void>;
  handleCancelTitleEdit: () => void;
  handleEditTitleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string | number } }) => void;
  titleFieldErrors: Record<string, string>;
  titleEditError: string | null;

  // Overview editing
  isEditing: boolean;
  isLoading: boolean;
  editFormData: EditFormData;
  setEditFormData: (form: EditFormData) => void;
  handleEditClick: () => void;
  handleSaveChanges: () => Promise<void>;
  handleCancelEdit: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  fieldErrors: Record<string, string>;
  editError: string | null;

  // Refresh functions
  refetchCase: () => Promise<void>;
  refetchSiteUsers: () => Promise<void>;
}

export const useCaseData = (
  organizationId: string,
  siteId: string,
  caseId: string
): UseCaseDataReturn => {
  const { showSuccess } = useToast();

  // Core case data state
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Related data state
  const [assignedUserData, setAssignedUserData] = useState<User | undefined>(undefined);
  const [loadingAssignedUser, setLoadingAssignedUser] = useState(false);
  const [siteUsers, setSiteUsers] = useState<User[]>([]);
  const [loadingSiteUsers, setLoadingSiteUsers] = useState(false);
  const [siteData, setSiteData] = useState<Site | undefined>(undefined);

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isLoadingTitle, setIsLoadingTitle] = useState(false);
  const [editTitleForm, setEditTitleForm] = useState<EditTitleFormState>({
    title: '',
    caseNumber: '',
    status: CaseStatus.Open,
    assignedTo: ''
  });
  const [titleFieldErrors, setTitleFieldErrors] = useState<Record<string, string>>({});
  const [titleEditError, setTitleEditError] = useState<string | null>(null);

  // Overview editing state
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    assignedTo: '',
    description: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [editError, setEditError] = useState<string | null>(null);

  // Data fetching functions
  const fetchAssignedUserData = async (assignedToId: string) => {
    if (!organizationId || !siteId || !assignedToId) return;
    
    setLoadingAssignedUser(true);
    try {
      const userData = await fetchSiteUser(organizationId, siteId, assignedToId);
      setAssignedUserData(userData);
    } catch (err: unknown) {
      console.error('Error loading assigned user data:', err);
      setAssignedUserData(undefined);
    } finally {
      setLoadingAssignedUser(false);
    }
  };

  const fetchSiteUsersData = async () => {
    if (!organizationId || !siteId) return;
    
    setLoadingSiteUsers(true);
    try {
      const users = (await fetchSiteUsers(organizationId, siteId)).items;
      setSiteUsers(users);
    } catch (err: unknown) {
      console.error('Error loading site users:', err);
      setSiteUsers([]);
    } finally {
      setLoadingSiteUsers(false);
    }
  };

  const fetchSiteData = async () => {
    if (!organizationId || !siteId) return;
    
    try {
      const site = await fetchSite(organizationId, siteId);
      setSiteData(site);
    } catch (err: unknown) {
      console.error('Error loading site data:', err);
      setSiteData(undefined);
    }
  };

  // Load initial case data
  const loadCaseData = async () => {
    if (!organizationId || !siteId || !caseId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchCase(organizationId, siteId, caseId);
      setCaseData(data);
      
      setEditTitleForm({
        title: data.title,
        caseNumber: data.caseNumber,
        status: data.status,
        assignedTo: data.assignedToId || ''
      });

      setEditFormData({
        assignedTo: data.assignedToId || '',
        description: data.description || ''
      });
      
      // Fetch assigned user data if assignedToId exists
      if (data.assignedToId) {
        await fetchAssignedUserData(data.assignedToId);
      }
      
      // Fetch site users for dropdown
      await fetchSiteUsersData();
      
      // Fetch site data
      await fetchSiteData();
    } catch (err: unknown) {
      console.error('Error loading case data:', err);
      setError((err as Error).message || 'Failed to load case data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Title editing functions
  const handleEditTitleClick = () => {
    setEditTitleForm({
      title: caseData?.title || '',
      caseNumber: caseData?.caseNumber || '',
      status: caseData?.status || CaseStatus.Open,
      assignedTo: caseData?.assignedToId || ''
    });
    setTitleFieldErrors({});
    setTitleEditError(null);
    setIsEditingTitle(true);
  };

  const handleSaveTitleEdit = async () => {
    if (!caseData) return;

    // Clear previous errors
    setTitleFieldErrors({});
    setTitleEditError(null);

    // Basic validation
    const clientErrors: Record<string, string> = {};
    if (!editTitleForm.title.trim()) {
      clientErrors.title = 'Title is required';
    }
    if (!editTitleForm.caseNumber.trim()) {
      clientErrors.caseNumber = 'Case number is required';
    }

    if (Object.keys(clientErrors).length > 0) {
      setTitleFieldErrors(clientErrors);
      return;
    }

    setIsLoadingTitle(true);
    try {
      const updated = await updateCase(
        organizationId,
        siteId,
        caseId,
        {
          title: editTitleForm.title.trim(),
          caseNumber: editTitleForm.caseNumber.trim(),
          cnrNumber: caseData.cnrNumber || '',
          description: caseData.description || '',
          status: editTitleForm.status,
          assignedToId: editTitleForm.assignedTo,
        }
      );

      setCaseData({
        ...caseData,
        title: editTitleForm.title.trim(),
        caseNumber: editTitleForm.caseNumber.trim(),
        status: editTitleForm.status,
        assignedToId: editTitleForm.assignedTo,
        updatedAt: updated.updatedAt
      });

      // If assignedTo changed, fetch the new assigned user data
      if (caseData.assignedToId !== editTitleForm.assignedTo) {
        await fetchAssignedUserData(editTitleForm.assignedTo);
      }

      // Show success message
      showSuccess('Case updated successfully');

      setIsEditingTitle(false);
      setTitleFieldErrors({});
      setTitleEditError(null);
    } catch (error: unknown) {
      console.error('Error updating case:', error);

      // Extract field-specific errors from the API response
      const extractedFieldErrors = extractFieldErrors(error);
      if (Object.keys(extractedFieldErrors).length > 0) {
        setTitleFieldErrors(extractedFieldErrors);
      }

      // Extract general error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to update case. Please try again.';
      setTitleEditError(errorMessage);
    } finally {
      setIsLoadingTitle(false);
    }
  };

  const handleCancelTitleEdit = () => {
    setIsEditingTitle(false);
    setTitleFieldErrors({});
    setTitleEditError(null);
  };

  // Overview editing functions
  const handleEditClick = () => {
    setEditFormData({
      assignedTo: caseData?.assignedToId || '',
      description: caseData?.description || ''
    });
    setFieldErrors({});
    setEditError(null);
    setIsEditing(true);
  };

  const handleSaveChanges = async () => {
    if (!caseData) return;

    // Clear previous errors
    setFieldErrors({});
    setEditError(null);

    setIsLoading(true);
    try {
      const updatedCase = await updateCase(
        organizationId,
        siteId,
        caseId,
        {
          title: caseData.title,
          caseNumber: caseData.caseNumber,
          cnrNumber: caseData.cnrNumber || '',
          description: editFormData.description,
          status: caseData.status,
          assignedToId: editFormData.assignedTo
        }
      );

      // Update case data with the new values
      const newCaseData = {
        ...caseData,
        ...updatedCase,
        assignedToId: editFormData.assignedTo,
        description: editFormData.description
      };
      setCaseData(newCaseData);

      // If assignedTo changed, fetch the new assigned user data
      if (caseData.assignedToId !== editFormData.assignedTo) {
        await fetchAssignedUserData(editFormData.assignedTo);
      }

      // Show success message
      showSuccess('Case updated successfully');

      setIsEditing(false);
      setFieldErrors({});
      setEditError(null);
    } catch (error) {
      console.error('Error updating case:', error);

      // Extract field-specific errors from the API response
      const extractedFieldErrors = extractFieldErrors(error);
      if (Object.keys(extractedFieldErrors).length > 0) {
        setFieldErrors(extractedFieldErrors);
      }

      // Extract general error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to update case. Please try again.';
      setEditError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFieldErrors({});
    setEditError(null);
    setEditFormData({
      assignedTo: caseData?.assignedToId || '',
      description: caseData?.description || ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleEditTitleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string | number } }) => {
    const { name, value } = e.target;
    setEditTitleForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear field error when user starts typing
    if (titleFieldErrors[name]) {
      setTitleFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // Refresh functions
  const refetchCase = async () => {
    await loadCaseData();
  };

  const refetchSiteUsers = async () => {
    await fetchSiteUsersData();
  };

  // Load data on mount and when dependencies change
  // loadCaseData is intentionally not memoized/listed: it's redefined each render
  // and should only re-run when the case identity (org/site/case id) changes.
  useEffect(() => {
    loadCaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, siteId, caseId]);

  return {
    // Main case data
    caseData,
    loading,
    error,
    
    // Related data
    assignedUserData,
    loadingAssignedUser,
    siteUsers,
    loadingSiteUsers,
    siteData,
    
    // Title editing
    isEditingTitle,
    isLoadingTitle,
    editTitleForm,
    setEditTitleForm,
    handleEditTitleClick,
    handleSaveTitleEdit,
    handleCancelTitleEdit,
    handleEditTitleFormChange,
    titleFieldErrors,
    titleEditError,

    // Overview editing
    isEditing,
    isLoading,
    editFormData,
    setEditFormData,
    handleEditClick,
    handleSaveChanges,
    handleCancelEdit,
    handleInputChange,
    fieldErrors,
    editError,

    // Refresh functions
    refetchCase,
    refetchSiteUsers,
  };
};