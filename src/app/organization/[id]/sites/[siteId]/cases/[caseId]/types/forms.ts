export interface TaskFiltersState {
  assignedToId: string;
  status: string;
  searchQuery?: string;
  sortBy: 'dueDate' | 'title' | 'status';
  sortOrder: 'asc' | 'desc';
}

export interface HearingFiltersState {
  assignedToId: string;
  status: string;
  location: string;
  searchQuery?: string;
  sortBy: 'hearingDateTime' | 'location' | 'status';
  sortOrder: 'asc' | 'desc';
}

export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}