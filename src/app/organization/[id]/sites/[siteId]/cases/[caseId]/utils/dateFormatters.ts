// formatDisplayDate/formatDisplayDateTime are re-exported from the shared utility
// to avoid a second, drift-prone copy of the display formatting logic.
export { formatDisplayDate, formatDisplayDateTime } from '@/utils/dateFormatters';

export const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Format to YYYY-MM-DDTHH:MM format required by datetime-local
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

export const getTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Converts a datetime-local input value (local time) to UTC ISO string for API.
 * The datetime-local input gives values like "2024-12-30T01:00" which represent local time.
 * This function converts it to a proper UTC ISO string for the backend.
 */
export const formatDateForAPI = (localDateTimeString: string): string => {
  if (!localDateTimeString) return '';

  try {
    // datetime-local gives us "YYYY-MM-DDTHH:MM" in local time
    // Creating a Date from this string interprets it as local time
    const date = new Date(localDateTimeString);
    if (isNaN(date.getTime())) return '';

    // Convert to ISO string (UTC)
    return date.toISOString();
  } catch (error) {
    console.error('Error formatting date for API:', error);
    return '';
  }
};

export const getDateTimeComparison = (dateA: string | undefined, dateB: string | undefined): number => {
  const timeA = dateA ? new Date(dateA).getTime() : 0;
  const timeB = dateB ? new Date(dateB).getTime() : 0;
  return timeA - timeB;
};