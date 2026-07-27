import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  CircularProgress
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'warning' | 'danger' | 'info';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  loading = false
}) => {
  const getVariantConfig = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <DeleteIcon color="error" />,
          confirmColor: 'error' as const,
          confirmVariant: 'contained' as const
        };
      case 'warning':
        return {
          icon: <WarningAmberIcon color="warning" />,
          confirmColor: 'warning' as const,
          confirmVariant: 'contained' as const
        };
      case 'info':
        return {
          icon: <InfoIcon color="info" />,
          confirmColor: 'primary' as const,
          confirmVariant: 'contained' as const
        };
      default:
        return {
          icon: <InfoIcon color="info" />,
          confirmColor: 'primary' as const,
          confirmVariant: 'contained' as const
        };
    }
  };

  const { icon, confirmColor, confirmVariant } = getVariantConfig();

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle 
        id="confirm-dialog-title"
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          pb: 1
        }}
      >
        {icon}
        {title}
      </DialogTitle>
      
      <DialogContent>
        <DialogContentText 
          id="confirm-dialog-description"
          sx={{ fontSize: '1rem', lineHeight: 1.6 }}
        >
          {message}
        </DialogContentText>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          color="inherit"
        >
          {cancelText}
        </Button>
        
        <Button
          onClick={onConfirm}
          disabled={loading}
          color={confirmColor}
          variant={confirmVariant}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};