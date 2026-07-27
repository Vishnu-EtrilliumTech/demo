import { CaseStatus } from "@/app/organization/types";
import { TaskStatus, HearingStatus } from "@/app/organization/types/caseindex";

export type StatusColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

export const getCaseStatusColor = (status: CaseStatus): StatusColor => {
  switch (status) {
    case CaseStatus.Open:
      return 'warning';
    case CaseStatus.InProgress:
      return 'primary';
    case CaseStatus.Closed:
      return 'success';
    case CaseStatus.OnHold:
      return 'default';
    default:
      return 'default';
  }
};

export const getTaskStatusColor = (status: TaskStatus): StatusColor => {
  switch (status) {
    case TaskStatus.Open:
      return 'default';
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

export const getHearingStatusColor = (status: HearingStatus): StatusColor => {
  switch (status) {
    case HearingStatus.Open:
      return 'default';
    case HearingStatus.Scheduled:
      return 'primary';
    case HearingStatus.PlanningInProgress:
      return 'info';
    case HearingStatus.Planned:
      return 'success';
    case HearingStatus.OnHold:
      return 'warning';
    case HearingStatus.Appeared:
      return 'info';
    case HearingStatus.NotAppeared:
      return 'error';
    case HearingStatus.Completed:
      return 'success';
    default:
      return 'default';
  }
};

export const getStatusColor = (status: CaseStatus | TaskStatus | HearingStatus): StatusColor => {
  // Check which enum the status belongs to and call appropriate function
  if (Object.values(CaseStatus).includes(status as CaseStatus)) {
    return getCaseStatusColor(status as CaseStatus);
  }
  if (Object.values(TaskStatus).includes(status as TaskStatus)) {
    return getTaskStatusColor(status as TaskStatus);
  }
  if (Object.values(HearingStatus).includes(status as HearingStatus)) {
    return getHearingStatusColor(status as HearingStatus);
  }
  return 'default';
};