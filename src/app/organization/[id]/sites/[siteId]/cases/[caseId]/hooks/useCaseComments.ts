import { useState, useCallback, useEffect } from 'react';
import {
  fetchCaseComments,
  addCaseComment,
  addCaseCommentReply,
  updateCaseComment,
  deleteCaseComment,
  type ListParams
} from '@/app/organization/services/caseapi';
import {
  CaseComment,
  AddCaseCommentRequest,
  AddCaseCommentReplyRequest,
  UpdateCaseCommentRequest,
  UserType
} from '@/app/organization/types/caseindex';
import type { PagedResponse } from '@/types/pagination';
import { getToken } from '@/services/authServices';
import { useToast } from '@/contexts/ToastContext';
import { classifyListError } from '@/utils/errorHandler';

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

export const useCaseComments = (
  organizationId: string,
  siteId: string,
  caseId: string,
  listParams: ListParams = {}
) => {
  // Comment management state
  const [comments, setComments] = useState<CaseComment[]>([]);
  const [commentsMeta, setCommentsMeta] = useState<PagedResponse<CaseComment> | null>(null);
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

  // Helper function to sort comments by createdAt (latest first)
  const sortCommentsRecursively = useCallback((comments: CaseComment[]): CaseComment[] => {
    return comments
      .map(comment => ({
        ...comment,
        replies: comment.replies ? sortCommentsRecursively(comment.replies) : comment.replies
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, []);

  // Fetch case comments
  const fetchCaseCommentsData = useCallback(async () => {
    if (!organizationId || !siteId || !caseId) {
      console.warn('useCaseComments: Missing required parameters for fetching comments:', { organizationId, siteId, caseId });
      return;
    }

    console.log('useCaseComments: Fetching comments for case:', { organizationId, siteId, caseId });
    setLoadingComments(true);
    try {
      const commentsPage = await fetchCaseComments(organizationId, siteId, caseId, listParams);
      const data = commentsPage.items;
      setCommentsMeta(commentsPage);
      console.log('useCaseComments: Comments fetched successfully, count:', data?.length || 0);
      // Sort comments by createdAt (latest first) and sort replies within each comment
      const sortedComments = data ? sortCommentsRecursively(data) : [];
      setComments(sortedComments);
    } catch (err: unknown) {
      const classified = classifyListError(err);
      if (classified.kind === 'invalid-filter') {
        showError(classified.messages?.[0] ?? 'Invalid filter value — please adjust your filters.');
        // preserve last valid list
      } else {
        console.error('useCaseComments: Error fetching comments:', err);
        setComments([]);
      }
    } finally {
      setLoadingComments(false);
    }
  }, [organizationId, siteId, caseId, sortCommentsRecursively, listParams, showError]);

  // Add new comment
  const handleAddComment = useCallback(async () => {
    if (!organizationId || !siteId || !caseId || !newCommentText.trim()) return;

    setAddingComment(true);
    try {
      const userRole = await getUserRoleFromToken();
      const commentData: AddCaseCommentRequest = {
        comments: newCommentText.trim(),
        commentAddedBy: userRole
      };

      await addCaseComment(organizationId, siteId, caseId, commentData);
      await fetchCaseCommentsData(); // Refetch to get updated data
      setNewCommentText('');
    } catch (err: unknown) {
      console.error('Error adding comment:', err);
      alert(err instanceof Error ? err.message : 'Failed to add comment. Please try again.');
    } finally {
      setAddingComment(false);
    }
  }, [organizationId, siteId, caseId, newCommentText, fetchCaseCommentsData]);

  // Toggle reply input visibility
  const toggleReplyInput = useCallback((parentCommentId: string) => {
    setAddingReply(prev => prev === parentCommentId ? null : parentCommentId);
  }, []);

  // Submit reply to comment
  const handleAddReply = useCallback(async (parentCommentId: string) => {
    if (!organizationId || !siteId || !caseId || !replyTexts[parentCommentId]?.trim()) return;

    try {
      const userRole = await getUserRoleFromToken();
      const replyData: AddCaseCommentReplyRequest = {
        comments: replyTexts[parentCommentId].trim(),
        commentAddedBy: userRole
      };

      await addCaseCommentReply(organizationId, siteId, caseId, parentCommentId, replyData);
      await fetchCaseCommentsData(); // Refetch to get updated data
      setReplyTexts(prev => ({ ...prev, [parentCommentId]: '' }));
      setAddingReply(null); // Hide reply input after successful submission
    } catch (err: unknown) {
      console.error('Error adding reply:', err);
      alert(err instanceof Error ? err.message : 'Failed to add reply. Please try again.');
    }
  }, [organizationId, siteId, caseId, replyTexts, fetchCaseCommentsData]);

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
    if (!organizationId || !siteId || !caseId || !editingCommentId || !editCommentText.trim()) return;

    setUpdatingComment(true);
    try {
      const updateData: UpdateCaseCommentRequest = {
        comments: editCommentText.trim()
      };

      await updateCaseComment(organizationId, siteId, caseId, editingCommentId, updateData);
      await fetchCaseCommentsData(); // Refetch to get updated data
      cancelEditingComment();
    } catch (err: unknown) {
      console.error('Error updating comment:', err);
      alert(err instanceof Error ? err.message : 'Failed to update comment. Please try again.');
    } finally {
      setUpdatingComment(false);
    }
  }, [organizationId, siteId, caseId, editingCommentId, editCommentText, fetchCaseCommentsData, cancelEditingComment]);

  // Delete comment - show modal
  const handleDeleteComment = useCallback((commentId: string) => {
    setCommentToDelete({ id: commentId });
    setDeleteCommentModalOpen(true);
  }, []);

  // Confirm delete comment
  const confirmDeleteComment = useCallback(async () => {
    if (!commentToDelete || !organizationId || !siteId || !caseId) return;

    setDeletingCommentId(commentToDelete.id);
    try {
      await deleteCaseComment(organizationId, siteId, caseId, commentToDelete.id);
      await fetchCaseCommentsData(); // Refetch to get updated data

      setDeleteCommentModalOpen(false);
      setCommentToDelete(null);
      showSuccess('Comment deleted successfully');
    } catch (err: unknown) {
      console.error('Error deleting comment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete comment. Please try again.';
      showError(errorMessage);
    } finally {
      setDeletingCommentId(null);
    }
  }, [commentToDelete, organizationId, siteId, caseId, fetchCaseCommentsData, showSuccess, showError]);

  // Close delete comment modal
  const handleCloseDeleteCommentModal = useCallback(() => {
    setDeleteCommentModalOpen(false);
    setCommentToDelete(null);
  }, []);

  // Set reply text for specific comment
  const setReplyText = useCallback((commentId: string, text: string) => {
    setReplyTexts(prev => ({ ...prev, [commentId]: text }));
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
    if (!organizationId || !siteId || !caseId || !editingReplyId || !editReplyText.trim()) return;

    setUpdatingReply(true);
    try {
      const updateData: UpdateCaseCommentRequest = {
        comments: editReplyText.trim()
      };

      await updateCaseComment(organizationId, siteId, caseId, editingReplyId, updateData);
      await fetchCaseCommentsData(); // Refetch to get updated data
      cancelEditingReply();
    } catch (err: unknown) {
      console.error('Error updating reply:', err);
      alert(err instanceof Error ? err.message : 'Failed to update reply. Please try again.');
    } finally {
      setUpdatingReply(false);
    }
  }, [organizationId, siteId, caseId, editingReplyId, editReplyText, fetchCaseCommentsData, cancelEditingReply]);

  // Delete reply - show modal
  const handleDeleteReply = useCallback((replyId: string, parentId: string) => {
    setReplyToDelete({ id: replyId, parentId });
    setDeleteReplyModalOpen(true);
  }, []);

  // Confirm delete reply
  const confirmDeleteReply = useCallback(async () => {
    if (!replyToDelete || !organizationId || !siteId || !caseId) return;

    setDeletingReplyId(replyToDelete.id);
    try {
      await deleteCaseComment(organizationId, siteId, caseId, replyToDelete.id);
      await fetchCaseCommentsData(); // Refetch to get updated data

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
  }, [replyToDelete, organizationId, siteId, caseId, fetchCaseCommentsData, showSuccess, showError]);

  // Close delete reply modal
  const handleCloseDeleteReplyModal = useCallback(() => {
    setDeleteReplyModalOpen(false);
    setReplyToDelete(null);
  }, []);

  // Auto-fetch comments on mount and whenever the page/sort/filter params change
  useEffect(() => {
    if (organizationId && siteId && caseId) {
      fetchCaseCommentsData();
    }
  }, [organizationId, siteId, caseId, fetchCaseCommentsData]);

  return {
    // State
    comments,
    commentsMeta,
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
    fetchCaseCommentsData,
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