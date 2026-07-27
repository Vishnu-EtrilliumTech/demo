'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export type EntityType =
  | 'user'
  | 'site'
  | 'case'
  | 'client'
  | 'task'
  | 'hearing'
  | 'document'
  | 'organization'
  | 'invoice'
  | 'comment'
  | 'reply'
  | 'contributor';

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  entityType: EntityType;
  entityName?: string;
  customTitle?: string;
  customMessage?: string;
  loading?: boolean;
}

interface EntityConfig {
  title: string;
  message: string;
  cascadeWarning?: string;
}

const entityConfigs: Record<EntityType, EntityConfig> = {
  user: {
    title: 'Delete User',
    message: 'Are you sure you want to delete this user? This action cannot be undone.',
  },
  site: {
    title: 'Delete Site',
    message: 'Are you sure you want to delete this site? This action cannot be undone.',
    cascadeWarning: 'All associated cases, and site-specific data will be permanently removed.',
  },
  case: {
    title: 'Delete Case',
    message: 'Are you sure you want to delete this case? This action cannot be undone.',
    cascadeWarning: 'All associated tasks, hearings, documents, and client information will be permanently removed.',
  },
  client: {
    title: 'Delete Client',
    message: 'Are you sure you want to remove this client from the case? This action cannot be undone.'    
  },
  task: {
    title: 'Delete Task',
    message: 'Are you sure you want to delete this task? This action cannot be undone.',
  },
  hearing: {
    title: 'Delete Hearing',
    message: 'Are you sure you want to delete this hearing? This action cannot be undone.',
    cascadeWarning: 'All associated documents and hearing notes will be permanently removed.',
  },
  document: {
    title: 'Delete Document',
    message: 'Are you sure you want to delete this document? This action cannot be undone.',
  },
  organization: {
    title: 'Delete Organization',
    message: 'Are you sure you want to delete this organization? This action cannot be undone.',
    cascadeWarning: 'All associated sites, users, cases, and organizational data will be permanently removed. This is a critical operation that affects all members of the organization.',
  },
  invoice: {
    title: 'Delete Invoice',
    message: 'Are you sure you want to delete this invoice? This action cannot be undone.',
  },
  comment: {
    title: 'Delete Comment',
    message: 'Are you sure you want to delete this comment? This action cannot be undone.',
  },
  reply: {
    title: 'Delete Reply',
    message: 'Are you sure you want to delete this reply? This action cannot be undone.',
  },
  contributor: {
    title: 'Remove Contributor',
    message: 'Are you sure you want to remove this contributor from the case? They will lose their granted access.',
  },
};

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  entityType,
  entityName,
  customTitle,
  customMessage,
  loading = false,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const config = entityConfigs[entityType];
  const title = customTitle || config.title;
  const message = customMessage || config.message;
  const cascadeWarning = config.cascadeWarning;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      // Modal will be closed by parent component after successful deletion
    } catch (error) {
      // Error handling is done in parent component via toast
      console.error('Delete operation failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting && !loading) {
      onClose();
    }
  };

  const isLoading = isDeleting || loading;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
        },
      }}
    >
      <DialogTitle id="delete-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '8px',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
            }}
          >
            <DeleteIcon sx={{ color: '#dc2626', fontSize: '1.5rem' }} />
          </Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <DialogContentText id="delete-dialog-description" sx={{ mb: 2, color: 'text.primary' }}>
          {message}
        </DialogContentText>

        {entityName && (
          <Box
            sx={{
              p: 2,
              mb: 2,
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.03)',
              border: '1px solid rgba(0, 0, 0, 0.12)',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 0.5 }}>
              {entityType.charAt(0).toUpperCase() + entityType.slice(1)} to delete:
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {entityName}
            </Typography>
          </Box>
        )}

        {cascadeWarning && (
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              p: 2,
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <WarningAmberIcon sx={{ color: '#f59e0b', fontSize: '1.25rem', flexShrink: 0, mt: 0.25 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#92400e', mb: 0.5 }}>
                Warning: Cascade Delete
              </Typography>
              <Typography variant="body2" sx={{ color: '#78350f', lineHeight: 1.5 }}>
                {cascadeWarning}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={isLoading}
          sx={{ textTransform: 'none', fontWeight: 500, borderRadius: '12px', px: 3, color: '#64748b' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isLoading}
          variant="contained"
          startIcon={
            isLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <DeleteIcon />
            )
          }
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '12px',
            px: 3,
            background: 'linear-gradient(135deg, #f87171, #dc2626)',
            boxShadow: 'none',
            '&:hover': {
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
              boxShadow: '0 4px 12px rgba(220,38,38,0.35)',
            },
            '&:disabled': { background: 'linear-gradient(135deg, #fca5a5, #f87171)', color: 'white' },
          }}
        >
          {isLoading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
