import { CaseTask, CaseHearing } from "@/app/organization/types/caseindex";
import { TaskFiltersState, HearingFiltersState } from "../types/forms";
import { getDateTimeComparison } from "./dateFormatters";

export const filterTasks = (tasks: CaseTask[], filters: TaskFiltersState): CaseTask[] => {
  return tasks.filter(task => {
    const assigneeMatch = !filters.assignedToId || task.assignedToId?.toString() === filters.assignedToId;
    const statusMatch = !filters.status || task.status === filters.status;
    return assigneeMatch && statusMatch;
  });
};

export const sortTasks = (tasks: CaseTask[], sortBy: string, sortOrder: 'asc' | 'desc'): CaseTask[] => {
  const sorted = [...tasks].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'dueDate':
        comparison = getDateTimeComparison(a.dueDate, b.dueDate);
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
  
  return sorted;
};

export const getFilteredAndSortedTasks = (
  tasks: CaseTask[], 
  filters: TaskFiltersState
): CaseTask[] => {
  const filtered = filterTasks(tasks, filters);
  return sortTasks(filtered, filters.sortBy, filters.sortOrder);
};

export const filterHearings = (hearings: CaseHearing[], filters: HearingFiltersState): CaseHearing[] => {
  return hearings.filter(hearing => {
    const assigneeMatch = !filters.assignedToId || hearing.assignedToId?.toString() === filters.assignedToId;
    const statusMatch = !filters.status || hearing.status === filters.status;
    const locationMatch = !filters.location ||
      hearing.courtName?.toLowerCase().includes(filters.location.toLowerCase());
    return assigneeMatch && statusMatch && locationMatch;
  });
};

export const sortHearings = (hearings: CaseHearing[], sortBy: string, sortOrder: 'asc' | 'desc'): CaseHearing[] => {
  const sorted = [...hearings].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'hearingDateTime':
        comparison = getDateTimeComparison(a.hearingDateTime, b.hearingDateTime);
        break;
      case 'location':
        comparison = (a.courtName || '').localeCompare(b.courtName || '');
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
  
  return sorted;
};

export const getFilteredAndSortedHearings = (
  hearings: CaseHearing[], 
  filters: HearingFiltersState
): CaseHearing[] => {
  const filtered = filterHearings(hearings, filters);
  return sortHearings(filtered, filters.sortBy, filters.sortOrder);
};

export const hasActiveFilters = (filters: TaskFiltersState | HearingFiltersState): boolean => {
  if ('location' in filters) {
    // HearingFiltersState
    return !!(filters.assignedToId || filters.status || filters.location);
  } else {
    // TaskFiltersState
    return !!(filters.assignedToId || filters.status);
  }
};

export const clearAllFilters = (isHearing = false) => {
  if (isHearing) {
    return {
      assignedToId: '',
      status: '',
      location: '',
      sortBy: 'hearingDateTime' as const,
      sortOrder: 'asc' as const
    };
  } else {
    return {
      assignedToId: '',
      status: '',
      sortBy: 'dueDate' as const,
      sortOrder: 'asc' as const
    };
  }
};