import React from 'react';
import { FormHelperText } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box } from '@mui/material';

interface FieldErrorProps {
  /**
   * Error message to display
   */
  error?: string;

  /**
   * Whether to show an icon with the error
   * @default false
   */
  showIcon?: boolean;

  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * FieldError component for displaying inline field validation errors
 * Used below form fields to show specific validation messages
 */
export const FieldError: React.FC<FieldErrorProps> = ({
  error,
  showIcon = false,
  className,
}) => {
  // Don't render if no error
  if (!error) {
    return null;
  }

  return (
    <FormHelperText error className={className}>
      {showIcon ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ErrorOutlineIcon sx={{ fontSize: 16 }} />
          <span>{error}</span>
        </Box>
      ) : (
        error
      )}
    </FormHelperText>
  );
};
