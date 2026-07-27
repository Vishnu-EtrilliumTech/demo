import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import AddIcon from '@mui/icons-material/Add';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'compact';
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  actionLabel, 
  onAction, 
  icon,
  variant = 'default'
}) => {
  const defaultIcon = <InboxIcon sx={{ fontSize: variant === 'compact' ? 40 : 64, color: 'text.secondary' }} />;
  
  return (
    <Box 
      textAlign="center" 
      p={variant === 'compact' ? 3 : 6}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: variant === 'compact' ? 'auto' : '300px',
        justifyContent: 'center'
      }}
    >
      <Box mb={variant === 'compact' ? 1 : 2}>
        {icon || defaultIcon}
      </Box>
      
      <Typography 
        variant={variant === 'compact' ? "subtitle1" : "h6"} 
        gutterBottom
        sx={{ fontWeight: 500 }}
      >
        {title}
      </Typography>
      
      <Typography 
        variant="body2" 
        color="text.secondary" 
        mb={actionLabel && onAction ? 3 : 0}
        sx={{ maxWidth: 400, lineHeight: 1.6 }}
      >
        {description}
      </Typography>
      
      {actionLabel && onAction && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAction}
          size={variant === 'compact' ? 'small' : 'medium'}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};