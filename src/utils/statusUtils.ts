const STATUS_LABELS: Record<string, string> = {
  // Case / Task shared
  Open: 'Open',
  InProgress: 'In Progress',
  OnHold: 'On Hold',
  Closed: 'Closed',
  Blocked: 'Blocked',
  // Hearing
  Scheduled: 'Scheduled',
  PlanningInProgress: 'Planning In Progress',
  Planned: 'Planned',
  Appeared: 'Appeared',
  NotAppeared: 'Not Appeared',
  Completed: 'Completed',
  // Payment
  None: 'None',
  Pending: 'Pending',
  Failed: 'Failed',
  Paid: 'Paid',
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
