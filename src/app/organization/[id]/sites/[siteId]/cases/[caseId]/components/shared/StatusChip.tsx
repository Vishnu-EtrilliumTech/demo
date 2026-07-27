import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { TaskStatus, HearingStatus } from '@/app/organization/types/caseindex';
import { CaseStatus } from '@/app/organization/types';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: CaseStatus | TaskStatus | HearingStatus;
  variant?: 'filled' | 'outlined';
}

export const StatusChip: React.FC<StatusChipProps> = ({ 
  status, 
  variant = 'filled',
  ...chipProps 
}) => {
  // Get color and label based on status - matches Tasks Overview styling
  const getStatusConfig = (status: CaseStatus | TaskStatus | HearingStatus) => {
    // Handle undefined/null status
    if (!status) {
      return { color: 'default' as const, label: 'Unknown' };
    }
    
    // Normalize status to handle different enum types
    const normalizedStatus = status.toString().toLowerCase();
    
    switch (normalizedStatus) {
      // Task Status Colors (matching Tasks Overview)
      case 'open':
        return { color: 'default' as const, label: 'Open' };
      case 'inprogress':
      case 'in_progress':
        return { color: 'primary' as const, label: 'In Progress' };
      case 'onhold':
      case 'on_hold':
        return { color: 'warning' as const, label: 'On Hold' };
      case 'blocked':
        return { color: 'error' as const, label: 'Blocked' };
      case 'closed':
        return { color: 'success' as const, label: 'Closed' };
      
      // Hearing Status Colors (matching Tasks Overview pattern)
      case 'scheduled':
        return { color: 'primary' as const, label: 'Scheduled' };
      case 'planninginprogress':
      case 'planning_in_progress':
        return { color: 'info' as const, label: 'Planning In Progress' };
      case 'planned':
        return { color: 'success' as const, label: 'Planned' };
      case 'appeared':
        return { color: 'info' as const, label: 'Appeared' };
      case 'notappeared':
      case 'not_appeared':
        return { color: 'error' as const, label: 'Not Appeared' };
      case 'completed':
        return { color: 'success' as const, label: 'Completed' };
      
      // General Status Colors
      case 'cancelled':
      case 'canceled':
        return { color: 'error' as const, label: 'Cancelled' };
      case 'pending':
        return { color: 'info' as const, label: 'Pending' };
      case 'review':
        return { color: 'warning' as const, label: 'Review' };
      
      default:
        return { color: 'default' as const, label: status.toString() };
    }
  };

  const { color, label } = getStatusConfig(status);

  return (
    <Chip
      label={label}
      color={color}
      variant={variant}
      size="small"
      {...chipProps}
    />
  );
};