import React from 'react';
import { Alert, AlertTitle, IconButton, List, ListItem, ListItemText } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ErrorAlertProps {
  /**
   * Array of error messages to display
   */
  errors: string[] | null;

  /**
   * Optional callback when the alert is dismissed
   */
  onClose?: () => void;

  /**
   * Optional title for the alert
   * @default "Error"
   */
  title?: string;

  /**
   * Severity level of the alert
   * @default "error"
   */
  severity?: 'error' | 'warning' | 'info';

  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * ErrorAlert component for displaying form and API errors
 * Displays errors from backend API responses in a user-friendly format
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  errors,
  onClose,
  title = 'Error',
  severity = 'error',
  className,
}) => {
  // Don't render if no errors
  if (!errors || errors.length === 0) {
    return null;
  }

  // Single error - display inline
  if (errors.length === 1) {
    return (
      <Alert
        severity={severity}
        onClose={onClose}
        className={className}
        sx={{ mb: 2 }}
        action={
          onClose && (
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={onClose}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          )
        }
      >
        <AlertTitle>{title}</AlertTitle>
        {errors[0]}
      </Alert>
    );
  }

  // Multiple errors - display as list
  return (
    <Alert
      severity={severity}
      onClose={onClose}
      className={className}
      sx={{ mb: 2 }}
      action={
        onClose && (
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={onClose}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        )
      }
    >
      <AlertTitle>{title}</AlertTitle>
      <List dense sx={{ py: 0 }}>
        {errors.map((error, index) => (
          <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
            <ListItemText
              primary={`• ${error}`}
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        ))}
      </List>
    </Alert>
  );
};
