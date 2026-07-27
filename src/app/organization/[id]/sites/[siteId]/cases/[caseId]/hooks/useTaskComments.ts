import { useState, useCallback, useEffect } from 'react';
import {
  fetchTaskComments,
  addTaskComment,
  addTaskCommentReply,
  updateTaskComment,
  deleteTaskComment
} from '@/app/organization/services/caseapi';
import {
  CaseTaskComment,
  AddCaseTaskCommentRequest,
  AddCaseTaskCommentReplyRequest,
  UpdateCaseTaskCommentRequest,
  UserType
} from '@/app/organization/types/caseindex';
import { getToken } from '@/services/authServices';
import { useToast } from '@/contexts/ToastContext';

// Helper function to decode JWT token and extract user roles
const getUserRoleFromToken = async (): Promise<UserType> => {
  try {
    const token = await getToken();
    if (!token) {
      console.warn('No token found, defaulting to SiteLegalExpert');
      return UserType.SiteLegalExpert;
    }
    
    // Decode JWT token (simple base64 decode of payload)
    const payload = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payload));
    
    // Extract roles from token (stored in 'realm_access.roles' or 'roles')
    const roles = decodedPayload.realm_access?.roles || decodedPayload.roles || [];
    
    // Map roles to UserType enum
    if (roles.includes('SystemAdmin')) return UserType.SystemAdmin;
    if (roles.includes('OrganizationAdmin')) return UserType.OrganizationAdmin;
    if (roles.includes('SiteAdmin')) return UserType.SiteAdmin;
    if (roles.includes('SiteLegalExpert')) return UserType.SiteLegalExpert;
    if (roles.includes('SiteClerk')) return UserType.SiteClerk;
    if (roles.includes('OrganizationClerk')) return UserType.OrganizationClerk;
    if (roles.includes('SiteCaseClient')) return UserType.SiteCaseClient;
    if (roles.includes('Client')) return UserType.Client;
    if (roles.includes('LegalIndividualExpert')) return UserType.LegalIndividualExpert;
    
    // Default fallback
    console.warn('No matching role found in token, defaulting to SiteLegalExpert. Token roles:', roles);
    return UserType.SiteLegalExpert;
  } catch (error) {
    console.error('Error decoding token for user role:', error);
    return UserType.SiteLegalExpert;
  }
};

export const useTaskComments = (
  organizationId: string,
  siteId: string,
  caseId: string,
  taskId: string | number | null
) => {
  // Comment management state
  const [comments, setComments] = useState<CaseTaskComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const [addingReply, setAddingReply] = useState<string | null>(null); // ID of comment being replied to
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [updatingComment, setUpdatingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // Reply-specific editing states
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [updatingReply, setUpdatingReply] = useState(false);
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null);

  // Delete comment modal state
  const [deleteCommentModalOpen, setDeleteCommentModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<{ id: string; parentId?: string } | null>(null);

  // Delete reply modal state
  const [deleteReplyModalOpen, setDeleteReplyModalOpen] = useState(false);
  const [replyToDelete, setReplyToDelete] = useState<{ id: string; parentId: string } | null>(null);

  const { showSuccess, showError } = useToast();

  // Form states
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [editCommentText, setEditCommentText] = useState('');
  const [editReplyText, setEditReplyText] = useState('');

  // Fetch task comments
  const fetchTaskCommentsData = useCallback(async () => {
    if (!organizationId || !siteId || !caseId || !taskId) {
      console.warn('useTaskComments: Missing required parameters for fetching comments:', { organizationId, siteId, caseId, taskId });
      return;
    }

    console.log('useTaskComments: Fetching comments for task:', { organizationId, siteId, caseId, taskId });
    setLoadingComments(true);
    try {
      const data = (await fetchTaskComments(organizationId, siteId, caseId, taskId)).items;
      console.log('useTaskComments: Comments fetched successfully, count:', data?.length || 0);
      setComments(data || []);
    } catch (err: unknown) {
      console.error('useTaskComments: Error fetching comments:', err);
      if (err instanceof Error) {
        console.error('useTaskComments: Error message:', err.message);
      }
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, [organizationId, siteId, caseId, taskId]);

  // Add new comment
  const handleAddComment = useCallback(async () => {
    if (!organizationId || !siteId || !caseId || !taskId || !newCommentText.trim()) return;

    setAddingComment(true);
    try {
      const userRole = await getUserRoleFromToken();
      const commentData: AddCaseTaskCommentRequest = {
        comments: newCommentText.trim(),
        commentAddedBy: userRole
      };

      await addTaskComment(organizationId, siteId, caseId, taskId, commentData);
      await fetchTaskCommentsData(); // Refetch to get updated data
      setNewCommentText('');
    } catch (err: unknown) {
      console.error('Error adding task comment:', err);
      alert(err instanceof Error ? err.message : 'Failed to add comment. Please try again.');
    } finally {
      setAddingComment(false);
    }
  }, [organizationId, siteId, caseId, taskId, newCommentText, fetchTaskCommentsData]);

  // Add reply to comment
  const handleAddReply = useCallback(async (parentCommentId: string) => {
    if (!organizationId || !siteId || !caseId || !taskId || !replyTexts[parentCommentId]?.trim()) return;

    setAddingReply(parentCommentId);
    try {
      const userRole = await getUserRoleFromToken();
      const replyData: AddCaseTaskCommentReplyRequest = {
        comments: replyTexts[parentCommentId].trim(),
        commentAddedBy: userRole
      };

      await addTaskCommentReply(organizationId, siteId, caseId, taskId, parentCommentId, replyData);
      await fetchTaskCommentsData(); // Refetch to get updated data
      setReplyTexts(prev => ({ ...prev, [parentCommentId]: '' }));
    } catch (err: unknown) {
      console.error('Error adding task comment reply:', err);
      alert(err instanceof Error ? err.message : 'Failed to add reply. Please try again.');
    } finally {
      setAddingReply(null);
    }
  }, [organizationId, siteId, caseId, taskId, replyTexts, fetchTaskCommentsData]);

  // Start editing comment
  const startEditingComment = useCallback((commentId: string, currentText: string) => {
    setEditingCommentId(commentId);
    setEditCommentText(currentText);
  }, []);

  // Cancel editing comment
  const cancelEditingComment = useCallback(() => {
    setEditingCommentId(null);
    setEditCommentText('');
  }, []);

  // Update comment
  const handleUpdateComment = useCallback(async () => {
    if (!organizationId || !siteId || !caseId || !taskId || !editingCommentId || !editCommentText.trim()) return;

    setUpdatingComment(true);
    try {
      const updateData: UpdateCaseTaskCommentRequest = {
        comments: editCommentText.trim()
      };

      await updateTaskComment(organizationId, siteId, caseId, taskId, editingCommentId, updateData);
      await fetchTaskCommentsData(); // Refetch to get updated data
      cancelEditingComment();
    } catch (err: unknown) {
      console.error('Error updating task comment:', err);
      alert(err instanceof Error ? err.message : 'Failed to update comment. Please try again.');
    } finally {
      setUpdatingComment(false);
    }
  }, [organizationId, siteId, caseId, taskId, editingCommentId, editCommentText, fetchTaskCommentsData, cancelEditingComment]);

  // Delete comment - show modal
  const handleDeleteComment = useCallback((commentId: string) => {
    setCommentToDelete({ id: commentId });
    setDeleteCommentModalOpen(true);
  }, []);

  // Confirm delete comment
  const confirmDeleteComment = useCallback(async () => {
    if (!commentToDelete || !organizationId || !siteId || !caseId || !taskId) return;

    setDeletingCommentId(commentToDelete.id);
    try {
      await deleteTaskComment(organizationId, siteId, caseId, taskId, commentToDelete.id);
      await fetchTaskCommentsData(); // Refetch to get updated data

      setDeleteCommentModalOpen(false);
      setCommentToDelete(null);
      showSuccess('Comment deleted successfully');
    } catch (err: unknown) {
      console.error('Error deleting task comment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete comment. Please try again.';
      showError(errorMessage);
    } finally {
      setDeletingCommentId(null);
    }
  }, [commentToDelete, organizationId, siteId, caseId, taskId, fetchTaskCommentsData, showSuccess, showError]);

  // Close delete comment modal
  const handleCloseDeleteCommentModal = useCallback(() => {
    setDeleteCommentModalOpen(false);
    setCommentToDelete(null);
  }, []);

  // Set reply text for specific comment
  const setReplyText = useCallback((commentId: string, text: string) => {
    setReplyTexts(prev => ({ ...prev, [commentId]: text }));
  }, []);

  // Toggle reply input visibility
  const toggleReplyInput = useCallback((parentCommentId: string) => {
    setAddingReply(prev => prev === parentCommentId ? null : parentCommentId);
  }, []);

  // Start editing reply
  const startEditingReply = useCallback((replyId: string, currentText: string) => {
    setEditingReplyId(replyId);
    setEditReplyText(currentText);
    // Cancel any comment editing
    setEditingCommentId(null);
    setEditCommentText('');
  }, []);

  // Cancel editing reply
  const cancelEditingReply = useCallback(() => {
    setEditingReplyId(null);
    setEditReplyText('');
  }, []);

  // Update reply
  const handleUpdateReply = useCallback(async () => {
    if (!organizationId || !siteId || !caseId || !taskId || !editingReplyId || !editReplyText.trim()) return;

    setUpdatingReply(true);
    try {
      const updateData: UpdateCaseTaskCommentRequest = {
        comments: editReplyText.trim()
      };

      await updateTaskComment(organizationId, siteId, caseId, taskId, editingReplyId, updateData);
      await fetchTaskCommentsData(); // Refetch to get updated data
      cancelEditingReply();
    } catch (err: unknown) {
      console.error('Error updating reply:', err);
      alert(err instanceof Error ? err.message : 'Failed to update reply. Please try again.');
    } finally {
      setUpdatingReply(false);
    }
  }, [organizationId, siteId, caseId, taskId, editingReplyId, editReplyText, fetchTaskCommentsData, cancelEditingReply]);

  // Delete reply - show modal
  const handleDeleteReply = useCallback((replyId: string, parentId: string) => {
    setReplyToDelete({ id: replyId, parentId });
    setDeleteReplyModalOpen(true);
  }, []);

  // Confirm delete reply
  const confirmDeleteReply = useCallback(async () => {
    if (!replyToDelete || !organizationId || !siteId || !caseId || !taskId) return;

    setDeletingReplyId(replyToDelete.id);
    try {
      await deleteTaskComment(organizationId, siteId, caseId, taskId, replyToDelete.id);
      await fetchTaskCommentsData(); // Refetch to get updated data

      setDeleteReplyModalOpen(false);
      setReplyToDelete(null);
      showSuccess('Reply deleted successfully');
    } catch (err: unknown) {
      console.error('Error deleting reply:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete reply. Please try again.';
      showError(errorMessage);
    } finally {
      setDeletingReplyId(null);
    }
  }, [replyToDelete, organizationId, siteId, caseId, taskId, fetchTaskCommentsData, showSuccess, showError]);

  // Close delete reply modal
  const handleCloseDeleteReplyModal = useCallback(() => {
    setDeleteReplyModalOpen(false);
    setReplyToDelete(null);
  }, []);

  // Auto-fetch comments when taskId changes only if not already loaded
  useEffect(() => {
    if (taskId && comments.length === 0 && !loadingComments) {
      fetchTaskCommentsData();
    } else if (!taskId) {
      // Clear comments when no task is selected
      setComments([]);
    }
  // Only depend on taskId: including comments.length/loadingComments would re-trigger
  // this fetch forever for any task with zero comments (length stays 0 after each fetch).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  return {
    // State
    comments,
    loadingComments,
    addingComment,
    addingReply,
    editingCommentId,
    updatingComment,
    deletingCommentId,
    editingReplyId,
    updatingReply,
    deletingReplyId,
    newCommentText,
    replyTexts,
    editCommentText,
    editReplyText,

    // Delete comment modal state
    deleteCommentModalOpen,
    commentToDelete,

    // Delete reply modal state
    deleteReplyModalOpen,
    replyToDelete,

    // Actions
    fetchTaskCommentsData,
    handleAddComment,
    toggleReplyInput,
    handleAddReply,
    startEditingComment,
    cancelEditingComment,
    handleUpdateComment,
    handleDeleteComment,
    confirmDeleteComment,
    handleCloseDeleteCommentModal,
    startEditingReply,
    cancelEditingReply,
    handleUpdateReply,
    handleDeleteReply,
    confirmDeleteReply,
    handleCloseDeleteReplyModal,

    // Form setters
    setNewCommentText,
    setReplyText,
    setEditCommentText,
    setEditReplyText,
  };
};