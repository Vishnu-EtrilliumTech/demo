import React from 'react';
import { Box, CircularProgress, Typography, Skeleton } from '@mui/material';

interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'skeleton';
  skeletonRows?: number;
  size?: 'small' | 'medium' | 'large';
  fullHeight?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Loading...", 
  variant = 'spinner',
  skeletonRows = 3,
  size = 'medium',
  fullHeight = false
}) => {
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 56
  };

  if (variant === 'skeleton') {
    return (
      <Box p={2}>
        {Array.from({ length: skeletonRows }).map((_, index) => (
          <Skeleton 
            key={index}
            variant="rectangular" 
            height={40} 
            sx={{ mb: 1, borderRadius: 1 }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center"
      p={4}
      minHeight={fullHeight ? '50vh' : 'auto'}
    >
      <CircularProgress size={sizeMap[size]} />
      <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
        {message}
      </Typography>
    </Box>
  );
};