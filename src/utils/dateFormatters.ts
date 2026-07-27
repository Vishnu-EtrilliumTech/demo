/**
 * Centralized date formatting utilities for consistent date display across the application.
 * Uses explicit locale (en-IN) to produce the "DD Mon YYYY" reference format
 * (matching the eCourts search history "Searched At" column) regardless of browser settings.
 */

/**
 * Formats a date string for display in "DD Mon YYYY" format (e.g. "09 Jul 2026").
 * Uses en-IN locale for consistent formatting across all users and roles.
 *
 * @param dateString - ISO date string or any valid date format
 * @returns Formatted date string in "DD Mon YYYY" format, or empty string if invalid
 */
export const formatDisplayDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting display date:', error);
    return '';
  }
};

/**
 * Formats a date string for display with time in "DD Mon YYYY, hh:mm AM/PM" format.
 * Uses explicit locale options for consistent formatting across all users and roles.
 *
 * @param dateString - ISO date string or any valid date format
 * @returns Formatted datetime string with 12-hour time, or empty string if invalid
 */
export const formatDisplayDateTime = (dateString: string | undefined | null): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting display date time:', error);
    return '';
  }
};

/**
 * Formats a date for datetime-local input fields (YYYY-MM-DDTHH:MM format).
 *
 * @param dateString - ISO date string or any valid date format
 * @returns Date string in YYYY-MM-DDTHH:MM format for datetime-local inputs
 */
export const formatDateForInput = (dateString: string | undefined | null): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

/**
 * Converts a datetime-local input value (local time) to UTC ISO string for API.
 *
 * @param localDateTimeString - Date string from datetime-local input (YYYY-MM-DDTHH:MM)
 * @returns ISO string in UTC format for backend API
 */
export const formatDateForAPI = (localDateTimeString: string | undefined | null): string => {
  if (!localDateTimeString) return '';

  try {
    const date = new Date(localDateTimeString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString();
  } catch (error) {
    console.error('Error formatting date for API:', error);
    return '';
  }
};

/**
 * Gets the current timestamp as an ISO string.
 *
 * @returns Current timestamp in ISO format
 */
export const getTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Compares two date strings for sorting purposes.
 *
 * @param dateA - First date string
 * @param dateB - Second date string
 * @returns Negative if dateA < dateB, positive if dateA > dateB, 0 if equal
 */
export const getDateTimeComparison = (dateA: string | undefined, dateB: string | undefined): number => {
  const timeA = dateA ? new Date(dateA).getTime() : 0;
  const timeB = dateB ? new Date(dateB).getTime() : 0;
  return timeA - timeB;
};
