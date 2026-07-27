import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Avatar,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  Menu,
  MenuItem,
  Fade
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplyIcon from '@mui/icons-material/Reply';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ForumIcon from '@mui/icons-material/Forum';
import SendIcon from '@mui/icons-material/Send';
import { CaseTaskComment } from '@/app/organization/types/caseindex';
import { User } from '@/app/organization/types';
import { useTaskComments } from '../../hooks/useTaskComments';
import { DeleteConfirmationModal } from '@/components/modals/DeleteConfirmationModal';
import { formatDisplayDate } from '@/utils';
import styles from './TaskCommentsTab.module.css';

interface TaskCommentsTabContainerProps {
  caseId: string;
  siteId: string;
  organizationId: string;
  taskId: string | number;
  siteUsers?: User[];
}

interface TaskCommentsTabProps {
  comments: CaseTaskComment[];
  loadingComments: boolean;
  addingComment: boolean;
  addingReply: string | null;
  editingCommentId: string | null;
  updatingComment: boolean;
  deletingCommentId: string | null;
  editingReplyId: string | null;
  updatingReply: boolean;
  deletingReplyId: string | null;
  newCommentText: string;
  replyTexts: Record<string, string>;
  editCommentText: string;
  editReplyText: string;

  // Delete comment modal state
  deleteCommentModalOpen: boolean;
  commentToDelete: { id: string; parentId?: string } | null;

  // Delete reply modal state
  deleteReplyModalOpen: boolean;
  replyToDelete: { id: string; parentId: string } | null;

  siteUsers?: User[];
  onAddComment: () => void;
  onToggleReply: (commentId: string) => void;
  onAddReply: (commentId: string) => void;
  onStartEditComment: (commentId: string, text: string) => void;
  onCancelEditComment: () => void;
  onUpdateComment: () => void;
  onDeleteComment: (commentId: string) => void;
  onConfirmDeleteComment: () => Promise<void>;
  onCloseDeleteCommentModal: () => void;
  onStartEditReply: (replyId: string, text: string) => void;
  onCancelEditReply: () => void;
  onUpdateReply: () => void;
  onDeleteReply: (replyId: string, parentId: string) => void;
  onConfirmDeleteReply: () => Promise<void>;
  onCloseDeleteReplyModal: () => void;
  onSetNewCommentText: (text: string) => void;
  onSetReplyText: (commentId: string, text: string) => void;
  onSetEditCommentText: (text: string) => void;
  onSetEditReplyText: (text: string) => void;
}

const TaskCommentsTabPresentation: React.FC<TaskCommentsTabProps> = ({
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
  deleteCommentModalOpen,
  deleteReplyModalOpen,
  siteUsers,
  onAddComment,
  onToggleReply,
  onAddReply,
  onStartEditComment,
  onCancelEditComment,
  onUpdateComment,
  onDeleteComment,
  onConfirmDeleteComment,
  onCloseDeleteCommentModal,
  onStartEditReply,
  onCancelEditReply,
  onUpdateReply,
  onDeleteReply,
  onConfirmDeleteReply,
  onCloseDeleteReplyModal,
  onSetNewCommentText,
  onSetReplyText,
  onSetEditCommentText,
  onSetEditReplyText
}) => {
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const messagesArea = document.querySelector(`.${styles.messagesArea}`);
    if (messagesArea) {
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }
  }, [comments.length]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `about ${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `about ${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      const diffInDays = Math.floor(diffInHours / 24);
      return `about ${diffInDays}d ago`;
    } else {
      return formatDisplayDate(dateString);
    }
  };

  const getUserFullName = (comment: CaseTaskComment) => {
    // If userFullName is available and not empty, use it
    if (comment.userFullName && comment.userFullName.trim()) {
      return comment.userFullName;
    }
    
    // Fallback: try to find user in siteUsers by userGuid (matches CommentsTab.tsx's identity field)
    if (siteUsers && comment.userGuid) {
      const user = siteUsers.find(u => u.id === comment.userGuid);
      if (user && user.fullName) {
        return user.fullName;
      }
    }
    
    // Last resort: show Unknown User
    return 'Unknown User';
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      '#EA4234', '#FF6B35', '#F7931E', '#FFD23F',
      '#06D6A0', '#118AB2', '#073B4C', '#8E44AD',
      '#E91E63', '#9C27B0', '#673AB7', '#3F51B5'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const [menuAnchor, setMenuAnchor] = useState<{element: HTMLElement, commentId: string} | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, commentId: string) => {
    setMenuAnchor({ element: event.currentTarget, commentId });
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // Get current user info from JWT token
  const getCurrentUser = useCallback(async () => {
    try {
      const { getToken } = await import('@/services/authServices');
      const token = await getToken();
      if (!token) return { userGuid: undefined, userName: 'User' };

      // Decode JWT token to extract claims
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));

      // Get userGuid from sub claim (JWT user ID)
      const userGuid = decodedPayload.sub;

      return {
        userGuid,
        userName: decodedPayload.name || decodedPayload.preferred_username || 'User'
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return { userGuid: undefined, userName: 'User' };
    }
  }, []);

  // State for current user info
  const [currentUserGuid, setCurrentUserGuid] = useState<string | undefined>(undefined);
  const [currentUserName, setCurrentUserName] = useState('User');

  // Load current user on mount
  useEffect(() => {
    const loadUser = async () => {
      const { userGuid, userName } = await getCurrentUser();
      setCurrentUserGuid(userGuid);
      setCurrentUserName(userName);
    };
    loadUser();
  }, [getCurrentUser]);

  // Check if current user is the author of a comment
  // Compare userGuid from token (sub claim) with userGuid from comment response
  const isCommentAuthor = (commentUserGuid: string | undefined, currentUserGuid: string | undefined): boolean => {
    return currentUserGuid !== undefined && commentUserGuid !== undefined && commentUserGuid === currentUserGuid;
  };

  const renderChatHeader = () => (
    <div className={styles.chatHeader}>
      <div className={styles.chatTitle}>
        <ForumIcon sx={{ fontSize: 24 }} />
        <div>
          <div>Task Discussion</div>
          <div className={styles.chatSubtitle}>
            {comments.length} messages
          </div>
        </div>
      </div>
    </div>
  );

  // Render a single reply item
  const renderReplyItem = (parentCommentId: string) => {
    const ReplyItem = (reply: CaseTaskComment) => {
      const hasActions = isCommentAuthor(reply.userGuid, currentUserGuid);

      return (
    <div key={reply.id} className={styles.replyItem}>
      <Avatar
        className={styles.replyAvatar}
        sx={{
          width: 28,
          height: 28,
          fontSize: '0.75rem',
          bgcolor: getAvatarColor(getUserFullName(reply))
        }}
      >
        {getUserFullName(reply)?.charAt(0)?.toUpperCase() || 'U'}
      </Avatar>
      <div className={styles.replyContent}>
        <div className={styles.replyHeader}>
          <span className={styles.replyAuthor}>{getUserFullName(reply)}</span>
          <span className={styles.replyTime}>{formatDate(reply.createdAt)}</span>
          {hasActions && (
            <IconButton
              size="small"
              onClick={(e) => handleMenuOpen(e, reply.id)}
              sx={{
                color: '#9ca3af',
                padding: '1px',
                marginLeft: 'auto',
                opacity: 0.7
              }}
            >
              <MoreVertIcon sx={{ fontSize: 12 }} />
            </IconButton>
          )}
        </div>
        
        {editingReplyId === reply.id ? (
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              value={editReplyText}
              onChange={(e) => onSetEditReplyText(e.target.value)}
              placeholder="Edit your reply..."
              variant="standard"
              size="small"
              sx={{
                '& .MuiInput-root': {
                  color: 'inherit',
                  fontSize: '0.8rem',
                  '&:before': { borderBottom: '1px solid #ddd' },
                  '&:after': { borderBottom: '2px solid #1976d2' }
                },
                '& .MuiInput-input': {
                  color: 'inherit',
                  fontSize: '0.8rem',
                  lineHeight: '1.4',
                  fontFamily: 'inherit'
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
              <Button
                size="small"
                onClick={onCancelEditReply}
                sx={{ 
                  color: 'inherit',
                  textTransform: 'none', 
                  fontSize: '0.7rem',
                  minHeight: '20px'
                }}
              >
                Cancel
              </Button>
              <Button
                size="small"
                onClick={onUpdateReply}
                disabled={updatingReply || !editReplyText.trim()}
                sx={{ 
                  color: '#1976d2',
                  textTransform: 'none',
                  fontSize: '0.7rem',
                  minHeight: '20px'
                }}
              >
                {updatingReply ? <CircularProgress size={10} sx={{ color: 'inherit' }} /> : 'Save'}
              </Button>
            </Box>
          </Box>
        ) : (
          <div className={styles.replyText}>
            {reply.comments}
          </div>
        )}
      </div>
      
      {/* Reply actions menu */}
      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor?.element && menuAnchor.commentId === reply.id)}
        onClose={handleMenuClose}
        TransitionComponent={Fade}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            borderRadius: '8px',
            minWidth: 100,
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }
        }}
      >
        {isCommentAuthor(reply.userGuid, currentUserGuid) && (
          <>
            <MenuItem
              onClick={() => {
                onStartEditReply(reply.id, reply.comments);
                handleMenuClose();
              }}
              disabled={editingReplyId !== null || editingCommentId !== null}
              sx={{ fontSize: '0.8rem' }}
            >
              <EditIcon sx={{ mr: 1, fontSize: 14 }} />
              Edit
            </MenuItem>
            <MenuItem
              onClick={() => {
                onDeleteReply(reply.id, parentCommentId);
                handleMenuClose();
              }}
              disabled={deletingReplyId === reply.id}
              sx={{ fontSize: '0.8rem', color: '#dc2626' }}
            >
              {deletingReplyId === reply.id ? (
                <CircularProgress size={14} sx={{ mr: 1 }} />
              ) : (
                <DeleteIcon sx={{ mr: 1, fontSize: 14 }} />
              )}
              Delete
            </MenuItem>
          </>
        )}
      </Menu>
    </div>
    );
  };

    return ReplyItem;
  };

  // Render main comment (without replies)
  const renderMainComment = (comment: CaseTaskComment) => {
    const hasActions = isCommentAuthor(comment.userGuid, currentUserGuid);

    return (
    <div className={`${styles.messageItem} other`}>
      <Avatar
        className={styles.messageAvatar}
        sx={{
          bgcolor: getAvatarColor(getUserFullName(comment)),
          width: 32,
          height: 32,
          fontSize: '0.8rem'
        }}
      >
        {getUserFullName(comment)?.charAt(0)?.toUpperCase() || 'U'}
      </Avatar>

      <div className={`${styles.messageBubble} other`}>
        <div className={styles.messageSender}>
          <span>{getUserFullName(comment)}</span>
          <span className={styles.messageTime}>{formatDate(comment.createdAt)}</span>
          {hasActions && (
            <IconButton
              size="small"
              onClick={(e) => handleMenuOpen(e, comment.id)}
              sx={{
                color: '#9ca3af',
                padding: '2px',
                marginLeft: 'auto'
              }}
            >
              <MoreVertIcon sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </div>
        
        {editingCommentId === comment.id ? (
          <Box>
            <TextField
              fullWidth
              multiline
              rows={2}
              value={editCommentText}
              onChange={(e) => onSetEditCommentText(e.target.value)}
              placeholder="Edit your message..."
              variant="standard"
              size="small"
              sx={{
                '& .MuiInput-root': {
                  color: 'inherit',
                  fontSize: '0.875rem',
                  '&:before': { borderBottom: '1px solid #ddd' },
                  '&:after': { borderBottom: '2px solid #1976d2' }
                },
                '& .MuiInput-input': {
                  color: 'inherit',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  fontFamily: 'inherit'
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
              <Button
                size="small"
                onClick={onCancelEditComment}
                sx={{ 
                  color: 'inherit',
                  textTransform: 'none', 
                  fontSize: '0.75rem',
                  minHeight: '24px'
                }}
              >
                Cancel
              </Button>
              <Button
                size="small"
                onClick={onUpdateComment}
                disabled={updatingComment || !editCommentText.trim()}
                sx={{ 
                  color: '#1976d2',
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  minHeight: '24px'
                }}
              >
                {updatingComment ? <CircularProgress size={12} sx={{ color: 'inherit' }} /> : 'Save'}
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <div className={styles.messageText}>
              {comment.comments}
            </div>
            <div className={styles.messageFooter}>
              <button className={styles.replyButton} onClick={() => onToggleReply(comment.id)}>
                <ReplyIcon sx={{ fontSize: 14, marginRight: '4px' }} />
                Reply
              </button>
            </div>
          </>
        )}
      </div>
    </div>
    );
  };

  // Render complete comment thread (main comment + replies + reply input)
  const renderCommentThread = (comment: CaseTaskComment) => {
    return (
      <div key={comment.id} className={styles.commentThread}>
        {/* Main Comment */}
        {renderMainComment(comment)}
        
        {/* Reply Input Area (appears right below main comment when active) */}
        {addingReply === comment.id && (
          <div className={styles.replyInputArea}>
            <div className={styles.replyInput}>
              <Avatar 
                sx={{ 
                  width: 24, 
                  height: 24, 
                  fontSize: '0.7rem',
                  bgcolor: '#1976d2',
                  marginRight: '8px'
                }}
              >
                {currentUserName?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <textarea
                className={styles.replyTextField}
                value={replyTexts[comment.id] || ''}
                onChange={(e) => onSetReplyText(comment.id, e.target.value)}
                placeholder="Write a reply"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (replyTexts[comment.id]?.trim()) {
                      onAddReply(comment.id);
                    }
                  }
                }}
              />
              <button
                className={styles.replySubmitButton}
                onClick={() => onAddReply(comment.id)}
                disabled={!replyTexts[comment.id]?.trim()}
              >
                <SendIcon sx={{ fontSize: 16 }} />
              </button>
            </div>
          </div>
        )}
        
        {/* Replies Section (appears below main comment and reply input) */}
        {comment.replies && comment.replies.length > 0 && (
          <div className={styles.repliesContainer}>
            {comment.replies.map(renderReplyItem(comment.id))}
          </div>
        )}

        
        {/* Actions Menu for this comment thread */}
        <Menu
          anchorEl={menuAnchor?.element}
          open={Boolean(menuAnchor?.element && menuAnchor.commentId === comment.id)}
          onClose={handleMenuClose}
          TransitionComponent={Fade}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              borderRadius: '12px',
              minWidth: 120,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }
          }}
        >
          {isCommentAuthor(comment.userGuid, currentUserGuid) && (
            <>
              <MenuItem
                onClick={() => {
                  onStartEditComment(comment.id, comment.comments);
                  handleMenuClose();
                }}
                disabled={editingCommentId !== null}
                sx={{ fontSize: '0.875rem' }}
              >
                <EditIcon sx={{ mr: 1, fontSize: 16 }} />
                Edit
              </MenuItem>
              <MenuItem
                onClick={() => {
                  onDeleteComment(comment.id);
                  handleMenuClose();
                }}
                disabled={deletingCommentId === comment.id}
                sx={{ fontSize: '0.875rem', color: '#dc2626' }}
              >
                {deletingCommentId === comment.id ? (
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                ) : (
                  <DeleteIcon sx={{ mr: 1, fontSize: 16 }} />
                )}
                Delete
              </MenuItem>
            </>
          )}
        </Menu>
      </div>
    );
  };

  if (loadingComments) {
    return (
      <Box className={styles.commentsContainer}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <div className={styles.commentsContainer}>
      {renderChatHeader()}
      
      <div className={styles.mainContent}>
        <div className={styles.messagesArea}>
          {comments.length > 0 ? (
            comments.map((comment, index) => (
              <Fade in={true} timeout={200 + (index * 100)} key={comment.id}>
                <div>
                  {renderCommentThread(comment)}
                </div>
              </Fade>
            ))
          ) : (
            <div className={styles.emptyState}>
              <ForumIcon className={styles.emptyIcon} />
              <div className={styles.emptyTitle}>
                Start the Task Discussion
              </div>
              <div className={styles.emptyDescription}>
                Be the first to share insights, ask questions, or provide updates on this task.
              </div>
            </div>
          )}
        </div>

        <div className={styles.messageInput}>
          <div className={styles.inputArea}>
            <textarea
              className={styles.messageTextField}
              value={newCommentText}
              onChange={(e) => onSetNewCommentText(e.target.value)}
              placeholder="Add a comment"
              rows={1}
              aria-label="Add a comment"
              aria-describedby="message-input-hint"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (newCommentText.trim() && !addingComment) {
                    onAddComment();
                  }
                }
                // Auto-resize
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          <button
            className={styles.sendButton}
            onClick={onAddComment}
            disabled={addingComment || !newCommentText.trim()}
            aria-label={addingComment ? "Sending message..." : "Send message"}
            type="button"
          >
            {addingComment ? (
              <CircularProgress size={20} sx={{ color: 'white' }} aria-hidden="true" />
            ) : (
              <SendIcon sx={{ fontSize: 20 }} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Delete Comment Modal */}
      <DeleteConfirmationModal
        open={deleteCommentModalOpen}
        onClose={onCloseDeleteCommentModal}
        onConfirm={onConfirmDeleteComment}
        entityType="comment"
      />

      {/* Delete Reply Modal */}
      <DeleteConfirmationModal
        open={deleteReplyModalOpen}
        onClose={onCloseDeleteReplyModal}
        onConfirm={onConfirmDeleteReply}
        entityType="reply"
      />
    </div>
  );
};

// Container component
export const TaskCommentsTab: React.FC<TaskCommentsTabContainerProps> = ({ 
  caseId,
  siteId,
  organizationId,
  taskId,
  siteUsers
}) => {
  const commentsHook = useTaskComments(organizationId, siteId, caseId, taskId);

  return (
    <TaskCommentsTabPresentation
      comments={commentsHook.comments}
      loadingComments={commentsHook.loadingComments}
      addingComment={commentsHook.addingComment}
      addingReply={commentsHook.addingReply}
      editingCommentId={commentsHook.editingCommentId}
      updatingComment={commentsHook.updatingComment}
      deletingCommentId={commentsHook.deletingCommentId}
      editingReplyId={commentsHook.editingReplyId}
      updatingReply={commentsHook.updatingReply}
      deletingReplyId={commentsHook.deletingReplyId}
      newCommentText={commentsHook.newCommentText}
      replyTexts={commentsHook.replyTexts}
      editCommentText={commentsHook.editCommentText}
      editReplyText={commentsHook.editReplyText}
      deleteCommentModalOpen={commentsHook.deleteCommentModalOpen}
      commentToDelete={commentsHook.commentToDelete}
      deleteReplyModalOpen={commentsHook.deleteReplyModalOpen}
      replyToDelete={commentsHook.replyToDelete}
      siteUsers={siteUsers}
      onAddComment={commentsHook.handleAddComment}
      onToggleReply={commentsHook.toggleReplyInput}
      onAddReply={commentsHook.handleAddReply}
      onStartEditComment={commentsHook.startEditingComment}
      onCancelEditComment={commentsHook.cancelEditingComment}
      onUpdateComment={commentsHook.handleUpdateComment}
      onDeleteComment={commentsHook.handleDeleteComment}
      onConfirmDeleteComment={commentsHook.confirmDeleteComment}
      onCloseDeleteCommentModal={commentsHook.handleCloseDeleteCommentModal}
      onStartEditReply={commentsHook.startEditingReply}
      onCancelEditReply={commentsHook.cancelEditingReply}
      onUpdateReply={commentsHook.handleUpdateReply}
      onDeleteReply={commentsHook.handleDeleteReply}
      onConfirmDeleteReply={commentsHook.confirmDeleteReply}
      onCloseDeleteReplyModal={commentsHook.handleCloseDeleteReplyModal}
      onSetNewCommentText={commentsHook.setNewCommentText}
      onSetReplyText={commentsHook.setReplyText}
      onSetEditCommentText={commentsHook.setEditCommentText}
      onSetEditReplyText={commentsHook.setEditReplyText}
    />
  );
};