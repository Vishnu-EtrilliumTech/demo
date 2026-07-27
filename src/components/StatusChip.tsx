"use client";

import { Chip, ChipProps } from '@mui/material';
import { CaseStatus } from '@/app/organization/types';
import { TaskStatus, HearingStatus } from '@/app/organization/types/caseindex';
import { getStatusLabel } from '@/utils';

export type StatusColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

// Standardized status color mappings
export const getCaseStatusColor = (status: CaseStatus): StatusColor => {
  switch (status) {
    case CaseStatus.Open:
      return 'info';
    case CaseStatus.InProgress:
      return 'primary';
    case CaseStatus.Closed:
      return 'success';
    case CaseStatus.OnHold:
      return 'warning';
    default:
      return 'default';
  }
};

export const getTaskStatusColor = (status: string | TaskStatus): StatusColor => {
  if (typeof status === 'string') {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'open':
        return 'info';
      case 'pending':
        return 'warning';
      case 'inprogress':
      case 'in_progress':
      case 'in progress':
        return 'primary';
      case 'closed':
      case 'completed':
      case 'complete':
        return 'success';
      case 'onhold':
      case 'on_hold':
      case 'on hold':
        return 'warning';
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  }
  
  // Handle TaskStatus enum values
  switch (status) {
    case TaskStatus.Open:
      return 'info';
    case TaskStatus.InProgress:
      return 'primary';
    case TaskStatus.Closed:
      return 'success';
    case TaskStatus.OnHold:
      return 'warning';
    case TaskStatus.Blocked:
      return 'error';
    default:
      return 'default';
  }
};

export const getHearingStatusColor = (status: string | HearingStatus): StatusColor => {
  if (typeof status === 'string') {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'open':
        return 'info';
      case 'scheduled':
        return 'primary';
      case 'planninginprogress':
      case 'planning_in_progress':
      case 'planning in progress':
        return 'info';
      case 'planned':
        return 'success';
      case 'onhold':
      case 'on_hold':
      case 'on hold':
        return 'warning';
      case 'appeared':
        return 'success';
      case 'notappeared':
      case 'not_appeared':
      case 'not appeared':
        return 'error';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  }
  
  // Handle HearingStatus enum values
  switch (status) {
    case HearingStatus.Open:
      return 'info';
    case HearingStatus.Scheduled:
      return 'primary';
    case HearingStatus.PlanningInProgress:
      return 'info';
    case HearingStatus.Planned:
      return 'success';
    case HearingStatus.OnHold:
      return 'warning';
    case HearingStatus.Appeared:
      return 'success';
    case HearingStatus.NotAppeared:
      return 'error';
    case HearingStatus.Completed:
      return 'success';
    default:
      return 'default';
  }
};

export const getUserStatusColor = (enabled: boolean): StatusColor => {
  return enabled ? 'success' : 'default';
};

// Generic status color function
export const getGenericStatusColor = (status: string | CaseStatus | TaskStatus | HearingStatus, type: 'case' | 'task' | 'hearing' | 'user' = 'case'): StatusColor => {
  switch (type) {
    case 'case':
      return getCaseStatusColor(status as CaseStatus);
    case 'task':
      return getTaskStatusColor(status as string | TaskStatus);
    case 'hearing':
      return getHearingStatusColor(status as string | HearingStatus);
    default:
      return 'default';
  }
};

// Status Chip Component Props
interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: string | CaseStatus | TaskStatus | HearingStatus | boolean;
  type?: 'case' | 'task' | 'hearing' | 'user';
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'medium';
}

// Main StatusChip Component
export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  type = 'case',
  variant = 'filled',
  size = 'small',
  ...chipProps
}) => {
  let color: StatusColor;
  let displayLabel: string;

  if (type === 'user' && typeof status === 'boolean') {
    color = getUserStatusColor(status);
    displayLabel = status ? 'Active' : 'Inactive';
  } else if (typeof status === 'string') {
    color = getGenericStatusColor(status, type);
    displayLabel = getStatusLabel(status);
  } else {
    color = 'default';
    displayLabel = String(status);
  }

  return (
    <Chip
      {...chipProps}
      label={displayLabel}
      color={color}
      variant={variant}
      size={size}
      sx={{
        fontWeight: 600,
        textTransform: 'capitalize',
        minWidth: size === 'small' ? 70 : 80,
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        letterSpacing: '0.02em',
        borderRadius: size === 'small' ? 1.5 : 2,
        '&.MuiChip-colorDefault': {
          backgroundColor: 'grey.100',
          color: 'grey.700'
        },
        '&.MuiChip-colorInfo': {
          backgroundColor: 'info.50',
          color: 'info.700',
          border: '1px solid',
          borderColor: 'info.200'
        },
        '&.MuiChip-colorSuccess': {
          backgroundColor: 'success.50',
          color: 'success.700',
          border: '1px solid',
          borderColor: 'success.200'
        },
        '&.MuiChip-colorWarning': {
          backgroundColor: 'warning.50',
          color: 'warning.700',
          border: '1px solid',
          borderColor: 'warning.200'
        },
        '&.MuiChip-colorError': {
          backgroundColor: 'error.50',
          color: 'error.700',
          border: '1px solid',
          borderColor: 'error.200'
        },
        '&.MuiChip-colorPrimary': {
          backgroundColor: 'primary.50',
          color: 'primary.700',
          border: '1px solid',
          borderColor: 'primary.200'
        },
        ...chipProps.sx
      }}
    />
  );
};

// Utility function for backward compatibility
export const getStatusColor = (status: CaseStatus | TaskStatus | HearingStatus | string, type?: 'case' | 'task' | 'hearing'): StatusColor => {
  if (typeof status === 'string' && type) {
    return getGenericStatusColor(status, type);
  }
  
  // Try to infer the type from the status value
  if (Object.values(CaseStatus).includes(status as CaseStatus)) {
    return getCaseStatusColor(status as CaseStatus);
  }
  if (typeof status === 'string') {
    return getTaskStatusColor(status);
  }
  
  return 'default';
};

export default StatusChip;