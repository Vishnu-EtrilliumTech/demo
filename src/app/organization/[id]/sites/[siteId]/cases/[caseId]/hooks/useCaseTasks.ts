import { useState, useCallback, useEffect, useRef } from 'react';
import {
  fetchCaseTasks,
  addTaskToCase,
  updateCaseTask,
  deleteCaseTask,
  fetchTaskDocuments,
  addTaskDocument,
  deleteTaskDocument,
  fetchTaskDocument,
  type ListParams
} from '@/app/organization/services/caseapi';
import {
  CaseTask,
  AddCaseTaskRequest,
  UpdateCaseTaskRequest,
  TaskStatus,
  TaskDocument,
  AddTaskDocumentRequest
} from '@/app/organization/types/caseindex';
import type { PagedResponse } from '@/types/pagination';
import { TaskFiltersState } from '../types';
import { formatDateForInput, formatDateForAPI } from '../utils';
import { User } from '@/app/organization/types';
import { useToast } from '@/contexts/ToastContext';
import { useFormValidation } from '@/hooks/useFormValidation';
import { CaseTaskSchemas, TaskDocumentSchemas } from '@/utils/caseValidationSchemas';
import { extractApiErrors } from '@/utils/errorHandler';

export const useCaseTasks = (
  organizationId: string,
  siteId: string,
  caseId: string,
  initialStatusFilter?: string,
  siteUsers?: User[],
  /**
   * Called after a task add/update that assigned a user, since the backend
   * may auto-grant that assignee a contributor record. Lets the page refresh
   * the (separately-owned) contributors list without a full page reload.
   */
  onContributorsChanged?: () => void,
  listParams: ListParams = {}
) => {
  // Stabilize listParams: default `{}` creates a new reference every render,
  // which would cause fetchCaseTasksData to change and trigger an infinite effect loop.
  const listParamsRef = useRef(listParams);
  const listParamsJson = JSON.stringify(listParams);
  useEffect(() => {
    listParamsRef.current = listParams;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listParamsJson]);

  // Task management state
  const [tasks, setTasks] = useState<CaseTask[]>([]);
  const [tasksMeta, setTasksMeta] = useState<PagedResponse<CaseTask> | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [updatingTask, setUpdatingTask] = useState(false);

  // Delete task modal state
  const [deleteTaskModalOpen, setDeleteTaskModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<CaseTask | null>(null);

  // Delete document modal state
  const [deleteDocumentModalOpen, setDeleteDocumentModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ taskId: string; documentId: string; documentName: string } | null>(null);

  const { showSuccess, showError } = useToast();

  // API error states
  const [taskApiErrors, setTaskApiErrors] = useState<string[] | null>(null);
  const [editTaskApiErrors, setEditTaskApiErrors] = useState<string[] | null>(null);
  const [documentApiErrors, setDocumentApiErrors] = useState<string[] | null>(null);

  // Validation hooks
  const addTaskValidation = useFormValidation(CaseTaskSchemas.add);
  const updateTaskValidation = useFormValidation(CaseTaskSchemas.update);
  const documentValidation = useFormValidation(TaskDocumentSchemas.add);
  
  // Task forms
  const [taskForm, setTaskForm] = useState<AddCaseTaskRequest>({
    title: '',
    description: '',
    assignedToId: undefined,
    dueDate: '',
    status: TaskStatus.Open
  });
  
  const [editTaskForm, setEditTaskForm] = useState<UpdateCaseTaskRequest>({
    title: '',
    description: '',
    assignedToId: '',
    dueDate: '',
    status: TaskStatus.Open
  });
  
  // Task filtering and sorting state
  const [taskFilters, setTaskFilters] = useState<TaskFiltersState>({
    assignedToId: '',
    status: initialStatusFilter || '',
    searchQuery: '',
    sortBy: 'dueDate',
    sortOrder: 'asc'
  });
  
  // Task detail view state
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [taskDetailMode, setTaskDetailMode] = useState<'view' | 'edit'>('view');
  const [taskDetailTab, setTaskDetailTab] = useState(0); // 0 = Details, 1 = Documents

  // Task document management state
  const [taskDocuments, setTaskDocuments] = useState<{ [taskId: string]: TaskDocument[] }>({});
  const [loadingDocuments, setLoadingDocuments] = useState<{ [taskId: string]: boolean }>({});
  const [uploadingDocument, setUploadingDocument] = useState<{ [taskId: string]: boolean }>({});

  // Fetch case tasks
  // listParamsJson in deps ensures a re-fetch whenever page/sort/filter params change.
  const fetchCaseTasksData = useCallback(async () => {
    if (!organizationId || !siteId || !caseId) return;
    setLoadingTasks(true);
    try {
      const tasksPage = await fetchCaseTasks(organizationId, siteId, caseId, listParamsRef.current);
      const tasksData = tasksPage.items;
      setTasks(tasksData);
      setTasksMeta(tasksPage);

      // Load document counts for each task
      for (const task of tasksData) {
        try {
          const documents = (await fetchTaskDocuments(organizationId, siteId, caseId, task.id)).items;
          setTaskDocuments(prev => ({ ...prev, [task.id]: documents }));
        } catch (err) {
          console.error(`Error loading documents for task ${task.id}:`, err);
          setTaskDocuments(prev => ({ ...prev, [task.id]: [] }));
        }
      }
    } catch (err: unknown) {
      console.error('Error loading case tasks:', err);
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, siteId, caseId, listParamsJson]);

  // Add new task
  const handleAddTask = useCallback(async () => {
    if (!organizationId || !siteId || !caseId) return;

    // Clear previous errors
    setTaskApiErrors(null);

    // Validate form
    if (!addTaskValidation.validate(taskForm)) {
      return;
    }

    setAddingTask(true);
    try {
      // Convert local datetime to UTC for API
      const taskDataForApi: AddCaseTaskRequest = {
        ...taskForm,
        dueDate: taskForm.dueDate ? formatDateForAPI(taskForm.dueDate) : ''
      };
      // Omit assignedToId entirely when unassigned: the backend's AssignedToId is a
      // non-nullable Guid, so sending "" fails JSON deserialization with a 400 before
      // the request even reaches the controller (unlike an omitted field, which the
      // backend treats as unassigned).
      if (!taskDataForApi.assignedToId) {
        delete taskDataForApi.assignedToId;
      }
      // Omit dueDate entirely when unset: the backend's DueDate is a nullable
      // DateTimeOffset, but System.Text.Json still fails to parse "" as a date, so an
      // empty string 400s the same way an empty-string assignedToId does.
      if (!taskDataForApi.dueDate) {
        delete taskDataForApi.dueDate;
      }
      // Omit the assignee access-level grant when unset or no assignee (US4):
      // the backend defaults to ViewOnly when the field is absent.
      if (
        taskDataForApi.newAssigneeContributorAccessLevel === undefined ||
        !taskDataForApi.assignedToId
      ) {
        delete taskDataForApi.newAssigneeContributorAccessLevel;
      }
      const response = await addTaskToCase(organizationId, siteId, caseId, taskDataForApi);
      setTasks(prev => [...prev, response.data]);
      setShowAddTask(false);
      setTaskForm({
        title: '',
        description: '',
        assignedToId: undefined,
        dueDate: '',
        status: TaskStatus.Open
      });
      addTaskValidation.reset();
      showSuccess('Task added successfully');
      // Assigning a user may auto-grant them as a contributor (backend side
      // effect) — refresh the contributors list so the tab reflects it.
      if (taskDataForApi.assignedToId) {
        onContributorsChanged?.();
      }
    } catch (err: unknown) {
      console.error('Error adding task:', err);
      const errorMessages = extractApiErrors(err);
      setTaskApiErrors(errorMessages);
    } finally {
      setAddingTask(false);
    }
  }, [organizationId, siteId, caseId, taskForm, addTaskValidation, showSuccess, onContributorsChanged]);

  // Update existing task
  const handleUpdateTask = useCallback(async (taskId: string) => {
    if (!organizationId || !siteId || !caseId) return;

    // Clear previous errors
    setEditTaskApiErrors(null);

    // Validate form
    if (!updateTaskValidation.validate(editTaskForm)) {
      return;
    }

    setUpdatingTask(true);
    try {
      // Convert local datetime to UTC for API
      const taskDataForApi = {
        ...editTaskForm,
        dueDate: editTaskForm.dueDate ? formatDateForAPI(editTaskForm.dueDate) : ''
      };
      // Omit the assignee access-level grant when unset or no assignee (US4).
      if (
        taskDataForApi.newAssigneeContributorAccessLevel === undefined ||
        !taskDataForApi.assignedToId
      ) {
        delete taskDataForApi.newAssigneeContributorAccessLevel;
      }
      const response = await updateCaseTask(organizationId, siteId, caseId, taskId, taskDataForApi);
      setTasks(prev => prev.map(task => task.id === taskId ? response.data : task));

      // Always go back to view mode in the tabbed interface
      setTaskDetailMode('view');
      updateTaskValidation.reset();
      showSuccess('Task updated successfully');
      // Reassigning may auto-grant the new assignee as a contributor — refresh.
      if (taskDataForApi.assignedToId) {
        onContributorsChanged?.();
      }
    } catch (err: unknown) {
      console.error('Error updating task:', err);
      const errorMessages = extractApiErrors(err);
      setEditTaskApiErrors(errorMessages);
    } finally {
      setUpdatingTask(false);
    }
  }, [organizationId, siteId, caseId, editTaskForm, updateTaskValidation, showSuccess, onContributorsChanged]);

  // Delete task - show modal
  const handleDeleteTask = useCallback((task: CaseTask) => {
    if (!task) return;
    setTaskToDelete(task);
    setDeleteTaskModalOpen(true);
  }, []);

  // Confirm delete task
  const confirmDeleteTask = useCallback(async () => {
    if (!taskToDelete || !organizationId || !siteId || !caseId) return;

    try {
      await deleteCaseTask(organizationId, siteId, caseId, taskToDelete.id);
      setTasks(prev => prev.filter(task => task.id !== taskToDelete.id));

      // Also remove documents for this task
      setTaskDocuments(prev => {
        const newDocuments = { ...prev };
        delete newDocuments[taskToDelete.id];
        return newDocuments;
      });

      // If the deleted task was selected, clear the selection
      if (selectedTask === taskToDelete.id) {
        setSelectedTask(null);
        setTaskDetailMode('view');
        setTaskDetailTab(0);
      }

      setDeleteTaskModalOpen(false);
      setTaskToDelete(null);
      showSuccess('Task deleted successfully');
    } catch (err: unknown) {
      console.error('Error deleting task:', err);
      const errorMessage = (err as Error).message || 'Failed to delete task. Please try again.';
      showError(errorMessage);
    }
  }, [taskToDelete, organizationId, siteId, caseId, selectedTask, showSuccess, showError]);

  // Close delete task modal
  const handleCloseDeleteTaskModal = useCallback(() => {
    setDeleteTaskModalOpen(false);
    setTaskToDelete(null);
  }, []);

  // Close add task modal - reset form so stale data doesn't persist on reopen
  const handleCloseAddTask = useCallback(() => {
    setShowAddTask(false);
    setTaskForm({
      title: '',
      description: '',
      assignedToId: undefined,
      dueDate: '',
      status: TaskStatus.Open
    });
    setTaskApiErrors(null);
    addTaskValidation.reset();
  }, [addTaskValidation]);

  // Form change handlers
  const handleTaskFormChange = useCallback((field: keyof AddCaseTaskRequest, value: string | number) => {
    setTaskForm(prev => ({ ...prev, [field]: value }));
    addTaskValidation.clearFieldError(field as string);
  }, [addTaskValidation]);

  const handleEditTaskFormChange = useCallback((field: keyof UpdateCaseTaskRequest, value: string | number) => {
    setEditTaskForm(prev => ({ ...prev, [field]: value }));
    updateTaskValidation.clearFieldError(field as string);
  }, [updateTaskValidation]);

  // Task detail handlers
  const handleEditFromDetailView = useCallback((task: CaseTask) => {
    const formattedDate = formatDateForInput(task.dueDate || '');

    setEditTaskForm({
      title: task.title,
      description: task.description ,
      assignedToId: task.assignedToId || '',
      dueDate: formattedDate,
      status: task.status
    });
    setSelectedTask(task.id);
    setTaskDetailMode('edit');
    setTaskDetailTab(0);
  }, []);

  const cancelEditTask = useCallback(() => {
    // Always go back to view mode in the tabbed interface
    setTaskDetailMode('view');
    setEditTaskForm({
      title: '',
      description: '',
      assignedToId: '',
      dueDate: '',
      status: TaskStatus.Open
    });
  }, []);

  // Task document management functions
  const fetchTaskDocumentsData = useCallback(async (taskId: string) => {
    if (!organizationId || !siteId || !caseId) return;
    
    setLoadingDocuments(prev => ({ ...prev, [taskId]: true }));
    try {
      const documentsData = (await fetchTaskDocuments(organizationId, siteId, caseId, taskId)).items;
      setTaskDocuments(prev => ({ ...prev, [taskId]: documentsData }));
    } catch (err: unknown) {
      console.error('Error loading task documents:', err);
      setTaskDocuments(prev => ({ ...prev, [taskId]: [] }));
    } finally {
      setLoadingDocuments(prev => ({ ...prev, [taskId]: false }));
    }
  }, [organizationId, siteId, caseId]);

  const handleDocumentUpload = useCallback(async (taskId: string, file: File) => {
    if (!organizationId || !siteId || !caseId) return;

    // Check file size (1MB = 1048576 bytes)
    if (file.size > 1048576) {
      showError('File size exceeds 1MB limit. Please upload a smaller file.');
      return;
    }

    setUploadingDocument(prev => ({ ...prev, [taskId]: true }));
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1]; // Remove data:mime;base64, prefix
        
        const documentData: AddTaskDocumentRequest = {
          name: file.name,
          content: base64Data,
          remarks: ''
        };
        
        try {
          const response = await addTaskDocument(organizationId, siteId, caseId, taskId, documentData);
          console.log('Document upload response:', response);
          
          // Ensure the document has the right structure
          const newDocument = {
            ...response.data,
            name: response.data.name || file.name,
            createdDate: response.data.createdDate || new Date().toISOString()
          };
          
          setTaskDocuments(prev => ({
            ...prev,
            [taskId]: [...(prev[taskId] || []), newDocument]
          }));
        } catch (err: unknown) {
          console.error('Error uploading document:', err);
          alert(err instanceof Error ? err.message : 'Failed to upload document. Please try again.');
        } finally {
          setUploadingDocument(prev => ({ ...prev, [taskId]: false }));
        }
      };
      reader.readAsDataURL(file);
    } catch (err: unknown) {
      console.error('Error processing file:', err);
      alert('Failed to process file. Please try again.');
      setUploadingDocument(prev => ({ ...prev, [taskId]: false }));
    }
  }, [organizationId, siteId, caseId, showError]);

  // Delete document - show modal
  const handleDeleteDocument = useCallback((taskId: string, documentId: string, documentName: string) => {
    setDocumentToDelete({ taskId, documentId, documentName });
    setDeleteDocumentModalOpen(true);
  }, []);

  // Confirm delete document
  const confirmDeleteDocument = useCallback(async () => {
    if (!documentToDelete || !organizationId || !siteId || !caseId) return;

    try {
      await deleteTaskDocument(organizationId, siteId, caseId, documentToDelete.taskId, documentToDelete.documentId);
      setTaskDocuments(prev => ({
        ...prev,
        [documentToDelete.taskId]: prev[documentToDelete.taskId]?.filter(doc => doc.id !== documentToDelete.documentId) || []
      }));

      setDeleteDocumentModalOpen(false);
      setDocumentToDelete(null);
      showSuccess('Document deleted successfully');
    } catch (err: unknown) {
      console.error('Error deleting document:', err);
      const errorMessage = (err as Error).message || 'Failed to delete document. Please try again.';
      showError(errorMessage);
    }
  }, [documentToDelete, organizationId, siteId, caseId, showSuccess, showError]);

  // Close delete document modal
  const handleCloseDeleteDocumentModal = useCallback(() => {
    setDeleteDocumentModalOpen(false);
    setDocumentToDelete(null);
  }, []);

  const handleDownloadTaskDocument = useCallback(async (taskId: string, documentId: string, fileName: string) => {
    if (!organizationId || !siteId || !caseId) return;
    
    try {
      const documentResponse = await fetchTaskDocument(organizationId, siteId, caseId, taskId, documentId);
      console.log('Task document response for download:', documentResponse);
      
      let contentData = null;
      
      // Handle different response formats
      if (typeof documentResponse.content === 'string') {
        // If it's already a base64 string
        contentData = documentResponse.content;
      } else if (Array.isArray(documentResponse.content)) {
        // If it's a byte array, convert to base64
        const uint8Array = new Uint8Array(documentResponse.content);
        const binaryString = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '');
        contentData = btoa(binaryString);
      } else if (documentResponse.content && typeof documentResponse.content === 'object' && !Array.isArray(documentResponse.content)) {
        // If it's an object with a data property containing byte array
        if ('data' in documentResponse.content && Array.isArray(documentResponse.content.data)) {
          const uint8Array = new Uint8Array(documentResponse.content.data);
          const binaryString = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '');
          contentData = btoa(binaryString);
        }
      }
      
      if (!contentData) {
        alert('Unable to download document - invalid format');
        return;
      }
      
      // Create blob and download
      const byteCharacters = atob(contentData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/octet-stream' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error('Error downloading task document:', err);
      alert(err instanceof Error ? err.message : 'Failed to download document. Please try again.');
    }
  }, [organizationId, siteId, caseId]);

  // Filter and sort tasks
  const getFilteredAndSortedTasks = useCallback(() => {
    let filteredTasks = [...tasks];
    
    // Apply search query filter
    if (taskFilters.searchQuery) {
      const searchLower = taskFilters.searchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter(task => {
        // Search in task title, status, and description
        const matchesTask = task.title.toLowerCase().includes(searchLower) ||
          task.status.toLowerCase().includes(searchLower) ||
          (task.description && task.description.toLowerCase().includes(searchLower));
        
        // Search in assignee name if siteUsers is available
        const assignedUser = siteUsers?.find(user => user.id === task.assignedToId);
        const matchesAssignee = assignedUser?.fullName?.toLowerCase().includes(searchLower);
        
        return matchesTask || matchesAssignee;
      });
    }
    
    // Apply filters
    if (taskFilters.assignedToId) {
      filteredTasks = filteredTasks.filter(task =>
        task.assignedToId === taskFilters.assignedToId
      );
    }
    
    if (taskFilters.status) {
      filteredTasks = filteredTasks.filter(task => 
        task.status === taskFilters.status
      );
    }
    
    // Apply sorting
    filteredTasks.sort((a, b) => {
      let comparison = 0;
      
      switch (taskFilters.sortBy) {
        case 'dueDate':
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      
      return taskFilters.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filteredTasks;
  }, [tasks, taskFilters, siteUsers]);

  // Filter handlers
  const handleFilterChange = useCallback((filterType: string, value: string) => {
    setTaskFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  }, []);

  const handleSort = useCallback((column: 'dueDate' | 'title' | 'status') => {
    const isAsc = taskFilters.sortBy === column && taskFilters.sortOrder === 'asc';
    setTaskFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: isAsc ? 'desc' : 'asc'
    }));
  }, [taskFilters.sortBy, taskFilters.sortOrder]);

  const clearFilters = useCallback(() => {
    setTaskFilters({
      assignedToId: '',
      status: '',
      searchQuery: '',
      sortBy: 'dueDate',
      sortOrder: 'asc'
    });
  }, []);

  const hasActiveFilters = !!(taskFilters.assignedToId || taskFilters.status || taskFilters.searchQuery);

  // Initialize tasks on mount and whenever the page/sort/filter params change
  useEffect(() => {
    if (organizationId && siteId && caseId) {
      fetchCaseTasksData();
    }
  }, [organizationId, siteId, caseId, fetchCaseTasksData]);

  // Update status filter when initialStatusFilter changes
  useEffect(() => {
    if (initialStatusFilter) {
      setTaskFilters(prev => ({
        ...prev,
        status: initialStatusFilter
      }));
    }
  }, [initialStatusFilter]);

  return {
    // State
    tasks,
    tasksMeta,
    loadingTasks,
    showAddTask,
    addingTask,
    updatingTask,
    taskForm,
    editTaskForm,
    taskFilters,
    selectedTask,
    taskDetailMode,
    taskDetailTab,
    taskDocuments,
    loadingDocuments,
    uploadingDocument,
    hasActiveFilters,

    // Delete task modal state
    deleteTaskModalOpen,
    taskToDelete,

    // Delete document modal state
    deleteDocumentModalOpen,
    documentToDelete,

    // Validation errors
    taskErrors: addTaskValidation.errors,
    editTaskErrors: updateTaskValidation.errors,
    documentErrors: documentValidation.errors,

    // API errors
    taskApiErrors,
    editTaskApiErrors,
    documentApiErrors,
    setTaskApiErrors,
    setEditTaskApiErrors,
    setDocumentApiErrors,

    // Computed values
    filteredTasks: getFilteredAndSortedTasks(),

    // Actions
    fetchCaseTasksData,
    handleAddTask,
    handleUpdateTask,
    handleDeleteTask,
    confirmDeleteTask,
    handleCloseDeleteTaskModal,
    handleCloseAddTask,
    handleTaskFormChange,
    handleEditTaskFormChange,
    handleEditFromDetailView,
    cancelEditTask,
    fetchTaskDocumentsData,
    handleDocumentUpload,
    handleDeleteDocument,
    confirmDeleteDocument,
    handleCloseDeleteDocumentModal,
    handleDownloadTaskDocument,
    handleFilterChange,
    handleSort,
    clearFilters,

    // Setters
    setShowAddTask,
    setTaskDetailTab,
    setTaskDetailMode
  };
};