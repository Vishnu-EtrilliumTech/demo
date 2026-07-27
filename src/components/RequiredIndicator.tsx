import React from 'react';
import { Box } from '@mui/material';

interface RequiredIndicatorProps {
  /**
   * Optional CSS class name
   */
  className?: string;

  /**
   * Custom color for the asterisk
   * @default "error.main"
   */
  color?: string;
}

/**
 * RequiredIndicator component for marking required fields
 * Displays a red asterisk (*) to indicate a required field
 */
export const RequiredIndicator: React.FC<RequiredIndicatorProps> = ({
  className,
  color = 'error.main',
}) => {
  return (
    <Box
      component="span"
      sx={{
        color: color,
        ml: 0.5,
        fontWeight: 'bold',
      }}
      className={className}
      aria-label="required"
    >
      *
    </Box>
  );
};
