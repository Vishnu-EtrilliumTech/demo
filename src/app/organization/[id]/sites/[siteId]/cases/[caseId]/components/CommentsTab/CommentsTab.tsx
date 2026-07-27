import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Reply, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Button, Textarea, LoadingState, EmptyState, Spinner } from '@/design-system';
import { CaseComment } from '@/app/organization/types/caseindex';
import { useCaseComments } from '../../hooks/useCaseComments';
import { DeleteConfirmationModal } from '@/components/modals/DeleteConfirmationModal';
import { formatDisplayDate } from '@/utils';
import { useListQuery } from '@/hooks/useListQuery';
import ListFooterPager from '@/components/ListFooterPager';
import type { CommentListFilters } from '../../types/filterTypes';

interface CommentsTabContainerProps {
  caseId: string;
  siteId: string;
  organizationId: string;
  /** Show add/reply/edit controls (resource ≥ Edit). Defaults to true. */
  canCreateOrEditResource?: boolean;
  /** Show delete controls (resource === Full). Defaults to true. */
  canDeleteResource?: boolean;
}

interface CommentsTabProps {
  canCreateOrEditResource: boolean;
  canDeleteResource: boolean;
  comments: CaseComment[];
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

// ---- token-driven inline styles ---------------------------------------------
const S = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    color: 'var(--text)',
  } as React.CSSProperties,
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    flex: 'none',
    display: 'grid',
    placeItems: 'center',
    background: 'var(--brand-soft)',
    color: 'var(--brand)',
  } as React.CSSProperties,
  headerTitle: { fontSize: 15, fontWeight: 700, lineHeight: 1.2 } as React.CSSProperties,
  headerSub: { fontSize: 12.5, color: 'var(--text-3)' } as React.CSSProperties,

  composer: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    background: 'var(--panel)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)',
    boxShadow: 'var(--sh-sm)',
    padding: 14,
    marginBottom: 20,
  } as React.CSSProperties,
  composerBody: { flex: 1, display: 'flex', flexDirection: 'column', gap: 10 } as React.CSSProperties,
  composerActions: { display: 'flex', justifyContent: 'flex-end' } as React.CSSProperties,

  thread: { marginBottom: 16 } as React.CSSProperties,
  commentRow: { display: 'flex', gap: 11, alignItems: 'flex-start' } as React.CSSProperties,
  bubble: {
    flex: 1,
    minWidth: 0,
    background: 'var(--panel)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r)',
    padding: '12px 14px',
  } as React.CSSProperties,
  replyBubble: {
    flex: 1,
    minWidth: 0,
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r)',
    padding: '10px 12px',
  } as React.CSSProperties,
  bubbleHead: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 } as React.CSSProperties,
  author: { fontSize: 13, fontWeight: 600, color: 'var(--text)' } as React.CSSProperties,
  time: { fontSize: 11.5, color: 'var(--text-3)' } as React.CSSProperties,
  text: { fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5, whiteSpace: 'pre-wrap' } as React.CSSProperties,

  replyToggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    border: 0,
    background: 'transparent',
    color: 'var(--brand)',
    font: 'inherit',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  } as React.CSSProperties,

  repliesWrap: {
    marginTop: 10,
    marginLeft: 26,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    borderLeft: '2px solid var(--divider)',
    paddingLeft: 14,
  } as React.CSSProperties,
  replyComposer: {
    display: 'flex',
    gap: 9,
    alignItems: 'flex-start',
    marginTop: 10,
    marginLeft: 26,
  } as React.CSSProperties,

  editActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 } as React.CSSProperties,

  iconBtn: {
    border: 0,
    background: 'transparent',
    color: 'var(--text-3)',
    cursor: 'pointer',
    padding: 2,
    display: 'inline-grid',
    placeItems: 'center',
    borderRadius: 6,
  } as React.CSSProperties,
  menuBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'transparent',
    border: 0,
    cursor: 'default',
    zIndex: 10,
  } as React.CSSProperties,
  menu: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    right: 0,
    minWidth: 128,
    background: 'var(--panel)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-sm)',
    boxShadow: 'var(--sh)',
    padding: 4,
    zIndex: 11,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  } as React.CSSProperties,
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    border: 0,
    background: 'transparent',
    font: 'inherit',
    fontSize: 13,
    color: 'var(--text)',
    padding: '7px 9px',
    borderRadius: 6,
    cursor: 'pointer',
    textAlign: 'left',
  } as React.CSSProperties,
};

/** Circular initials avatar (self-contained — not dependent on a `.who2` parent). */
function Avatar({ name, size = 26 }: { name?: string; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        flex: 'none',
        display: 'grid',
        placeItems: 'center',
        borderRadius: '50%',
        background: 'var(--brand-soft)',
        color: 'var(--brand)',
        fontSize: Math.round(size * 0.4),
        fontWeight: 700,
        lineHeight: 1,
      }}
      aria-hidden
    >
      {name?.charAt(0)?.toUpperCase() || 'U'}
    </span>
  );
}

const CommentsTabPresentation: React.FC<CommentsTabProps> = ({
  canCreateOrEditResource,
  canDeleteResource,
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
  onSetEditReplyText,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

  // Only top-level comments are rendered; replies nest under their parent.
  const topLevelComments = comments.filter((comment) => comment.parentCommentId === null);

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
        userName: decodedPayload.name || decodedPayload.preferred_username || 'User',
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
  const isCommentAuthor = (
    commentUserGuid: string | undefined,
    currentGuid: string | undefined,
  ): boolean => {
    return currentGuid !== undefined && commentUserGuid !== undefined && commentUserGuid === currentGuid;
  };

  // Author-only edit/delete menu (3-dot). Rendered only when the current user is
  // the author; individual items are gated by resource permissions.
  const renderAuthorMenu = (
    id: string,
    opts: { onEdit: () => void; onDelete: () => void; editDisabled: boolean; deleting: boolean },
  ) => {
    const open = openMenuId === id;
    return (
      <span style={{ position: 'relative', marginLeft: 'auto', display: 'inline-flex' }}>
        <button
          type="button"
          aria-label="Comment actions"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpenMenuId(open ? null : id)}
          style={S.iconBtn}
        >
          <MoreVertical width={15} height={15} aria-hidden />
        </button>
        {open && (
          <>
            <button type="button" aria-hidden tabIndex={-1} onClick={() => setOpenMenuId(null)} style={S.menuBackdrop} />
            <div role="menu" style={S.menu}>
              {canCreateOrEditResource && (
                <button
                  type="button"
                  role="menuitem"
                  disabled={opts.editDisabled}
                  onClick={() => {
                    opts.onEdit();
                    setOpenMenuId(null);
                  }}
                  style={{ ...S.menuItem, opacity: opts.editDisabled ? 0.5 : 1 }}
                >
                  <Pencil width={14} height={14} aria-hidden />
                  Edit
                </button>
              )}
              {canDeleteResource && (
                <button
                  type="button"
                  role="menuitem"
                  disabled={opts.deleting}
                  onClick={() => {
                    opts.onDelete();
                    setOpenMenuId(null);
                  }}
                  style={{ ...S.menuItem, color: 'var(--danger)', opacity: opts.deleting ? 0.5 : 1 }}
                >
                  {opts.deleting ? <Spinner size="sm" /> : <Trash2 width={14} height={14} aria-hidden />}
                  Delete
                </button>
              )}
            </div>
          </>
        )}
      </span>
    );
  };

  // Render a single reply bubble
  const renderReplyItem = (parentCommentId: string) => {
    const ReplyItem = (reply: CaseComment) => {
      const hasActions = isCommentAuthor(reply.userGuid, currentUserGuid);
      const isEditing = editingReplyId === reply.id;

      return (
        <div key={reply.id} style={S.commentRow}>
          <Avatar name={reply.userFullName} size={24} />
          <div style={S.replyBubble}>
            <div style={S.bubbleHead}>
              <span style={S.author}>{reply.userFullName || 'Unknown User'}</span>
              <span style={S.time}>{formatDate(reply.createdAt)}</span>
              {hasActions &&
                renderAuthorMenu(reply.id, {
                  onEdit: () => onStartEditReply(reply.id, reply.comments),
                  onDelete: () => onDeleteReply(reply.id, parentCommentId),
                  editDisabled: editingReplyId !== null || editingCommentId !== null,
                  deleting: deletingReplyId === reply.id,
                })}
            </div>

            {isEditing ? (
              <div>
                <Textarea
                  value={editReplyText}
                  onChange={(e) => onSetEditReplyText(e.target.value)}
                  placeholder="Edit your reply…"
                  rows={2}
                  style={{ minHeight: 64 }}
                />
                <div style={S.editActions}>
                  <Button variant="ghost" onClick={onCancelEditReply}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={onUpdateReply}
                    loading={updatingReply}
                    disabled={!editReplyText.trim()}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div style={S.text}>{reply.comments}</div>
            )}
          </div>
        </div>
      );
    };

    return ReplyItem;
  };

  // Render a single top-level comment (bubble + reply toggle)
  const renderMainComment = (comment: CaseComment) => {
    const hasActions = isCommentAuthor(comment.userGuid, currentUserGuid);
    const isEditing = editingCommentId === comment.id;

    return (
      <div style={S.commentRow}>
        <Avatar name={comment.userFullName} size={32} />
        <div style={S.bubble}>
          <div style={S.bubbleHead}>
            <span style={S.author}>{comment.userFullName || 'Unknown User'}</span>
            <span style={S.time}>{formatDate(comment.createdAt)}</span>
            {hasActions &&
              renderAuthorMenu(comment.id, {
                onEdit: () => onStartEditComment(comment.id, comment.comments),
                onDelete: () => onDeleteComment(comment.id),
                editDisabled: editingCommentId !== null,
                deleting: deletingCommentId === comment.id,
              })}
          </div>

          {isEditing ? (
            <div>
              <Textarea
                value={editCommentText}
                onChange={(e) => onSetEditCommentText(e.target.value)}
                placeholder="Edit your message…"
                rows={2}
                style={{ minHeight: 72 }}
              />
              <div style={S.editActions}>
                <Button variant="ghost" onClick={onCancelEditComment}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={onUpdateComment}
                  loading={updatingComment}
                  disabled={!editCommentText.trim()}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div style={S.text}>{comment.comments}</div>
              {canCreateOrEditResource && (
                <button type="button" style={S.replyToggle} onClick={() => onToggleReply(comment.id)}>
                  <Reply width={14} height={14} aria-hidden />
                  Reply
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Render a complete comment thread (main comment + reply composer + replies)
  const renderCommentThread = (comment: CaseComment) => {
    return (
      <div key={comment.id} style={S.thread}>
        {renderMainComment(comment)}

        {/* Reply composer (appears below the comment when active) */}
        {addingReply === comment.id && (
          <div style={S.replyComposer}>
            <Avatar name={currentUserName} size={24} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Textarea
                value={replyTexts[comment.id] || ''}
                onChange={(e) => onSetReplyText(comment.id, e.target.value)}
                placeholder="Write a reply"
                rows={2}
                style={{ minHeight: 56 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (replyTexts[comment.id]?.trim()) {
                      onAddReply(comment.id);
                    }
                  }
                }}
              />
              <div style={S.composerActions}>
                <Button
                  variant="primary"
                  icon={Send}
                  onClick={() => onAddReply(comment.id)}
                  disabled={!replyTexts[comment.id]?.trim()}
                >
                  Reply
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div style={S.repliesWrap}>{comment.replies.map(renderReplyItem(comment.id))}</div>
        )}
      </div>
    );
  };

  if (loadingComments) {
    return <LoadingState message="Loading comments…" />;
  }

  return (
    <div>
      <div style={S.header}>
        <span style={S.headerIcon}>
          <MessageSquare width={18} height={18} aria-hidden />
        </span>
        <div>
          <div style={S.headerTitle}>Case Discussion</div>
          <div style={S.headerSub}>
            {topLevelComments.length} {topLevelComments.length === 1 ? 'comment' : 'comments'}
          </div>
        </div>
      </div>

      {/* Composer */}
      {canCreateOrEditResource && (
        <div style={S.composer}>
          <Avatar name={currentUserName} size={30} />
          <div style={S.composerBody}>
            <Textarea
              value={newCommentText}
              onChange={(e) => onSetNewCommentText(e.target.value)}
              placeholder="Add a comment"
              rows={2}
              aria-label="Write a comment"
              style={{ minHeight: 72 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (newCommentText.trim() && !addingComment) {
                    onAddComment();
                  }
                }
              }}
            />
            <div style={S.composerActions}>
              <Button
                variant="primary"
                icon={Send}
                onClick={onAddComment}
                loading={addingComment}
                disabled={!newCommentText.trim()}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comment list */}
      {topLevelComments.length > 0 ? (
        topLevelComments.map((comment) => renderCommentThread(comment))
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="No comments yet"
          description={
            canCreateOrEditResource
              ? 'Be the first to share insights, ask questions, or provide updates on this case.'
              : 'No comments have been added for this case.'
          }
        />
      )}

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
export const CommentsTab: React.FC<CommentsTabContainerProps> = ({
  caseId,
  siteId,
  organizationId,
  canCreateOrEditResource = true,
  canDeleteResource = true,
}) => {
  const { params, state, setPage, setPageSize } = useListQuery<CommentListFilters>({
    defaultSort: { sortBy: 'createdDate', sortDirection: 'desc' },
    sortableFields: ['createdDate'],
    filterKeys: [],
  });
  const commentsHook = useCaseComments(organizationId, siteId, caseId, params);
  const meta = commentsHook.commentsMeta;

  return (
    <>
    <CommentsTabPresentation
      canCreateOrEditResource={canCreateOrEditResource}
      canDeleteResource={canDeleteResource}
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
    {meta && meta.totalCount > 0 && (
      <ListFooterPager
        page={state.page}
        pageSize={state.pageSize}
        totalCount={meta.totalCount}
        totalPages={meta.totalPages}
        hasNextPage={meta.hasNextPage}
        hasPreviousPage={meta.hasPreviousPage}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        disabled={commentsHook.loadingComments}
      />
    )}
    </>
  );
};
