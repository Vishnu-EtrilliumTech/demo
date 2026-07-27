import { AxiosError } from 'axios';

/**
 * Standard API response structure from backend
 */
export interface ApiResponse<T = unknown> {
  data: T | null;
  errors: string[] | null;
  meta: Record<string, string> | null;
}

/**
 * ASP.NET Core validation error response structure
 */
export interface ValidationErrorResponse {
  errors: Record<string, string[]>;
}

/**
 * Extracts error messages from API error responses
 * @param error - The Axios error object
 * @returns Array of error messages to display to the user
 */
export const extractApiErrors = (error: unknown): string[] => {
  // Handle AxiosError
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<ApiResponse | ValidationErrorResponse>;

    // Extract errors from API response
    const response = axiosError.response?.data;

    // Handle custom API error format (array of errors)
    if (response?.errors && Array.isArray(response.errors) && response.errors.length > 0) {
      return response.errors;
    }

    // Handle ASP.NET Core validation error format (object with field names as keys)
    // Example: { "errors": { "FullName": ["Full Name must be between 2 and 100 characters."] } }
    if (response?.errors && typeof response.errors === 'object' && !Array.isArray(response.errors)) {
      const errorMessages: string[] = [];
      Object.values(response.errors).forEach((messages: unknown) => {
        if (Array.isArray(messages)) {
          errorMessages.push(...messages);
        }
      });
      if (errorMessages.length > 0) {
        return errorMessages;
      }
    }

    // Handle network errors
    if (axiosError.message === 'Network Error') {
      return ['Unable to connect to the server. Please check your internet connection.'];
    }

    // Handle timeout errors
    if (axiosError.code === 'ECONNABORTED') {
      return ['Request timeout. Please try again.'];
    }

    // Handle specific HTTP status codes
    const status = axiosError.response?.status;
    switch (status) {
      case 400:
        return ['Invalid request. Please check your input.'];
      case 401:
        return ['You are not authorized. Please login again.'];
      case 403:
        return ['You do not have permission to perform this action.'];
      case 404:
        return ['The requested resource was not found.'];
      case 409:
        return ['This resource already exists or conflicts with existing data.'];
      case 500:
        return ['An internal server error occurred. Please try again later.'];
      case 503:
        return ['The service is temporarily unavailable. Please try again later.'];
      default:
        return ['An unexpected error occurred. Please try again.'];
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    return [error.message];
  }

  // Handle string errors
  if (typeof error === 'string') {
    return [error];
  }

  // Fallback for unknown error types
  return ['An unexpected error occurred. Please try again.'];
};

/**
 * Extracts field-specific errors from API validation responses
 * Useful for displaying errors inline with form fields
 * @param error - The Axios error object
 * @returns Record of field names to error messages
 */
export const extractFieldErrors = (error: unknown): Record<string, string> => {
  // Get response data from either AxiosError or custom error with response property
  let responseData: ApiResponse | ValidationErrorResponse | undefined;

  if (error && typeof error === 'object') {
    if ('isAxiosError' in error) {
      // Handle AxiosError
      const axiosError = error as AxiosError<ApiResponse | ValidationErrorResponse>;
      responseData = axiosError.response?.data;
    } else if ('response' in error) {
      // Handle custom error with response property (from our API functions)
      const customError = error as { response?: { data?: ApiResponse | ValidationErrorResponse } };
      responseData = customError.response?.data;
    }
  }

  if (!responseData) {
    return {};
  }

  // Handle ASP.NET Core validation error format (object with field names as keys)
  // Example: { "errors": { "FullName": ["Full Name must be between 2 and 100 characters."] } }
  if (responseData?.errors && typeof responseData.errors === 'object' && !Array.isArray(responseData.errors)) {
    const fieldErrors: Record<string, string> = {};

    Object.entries(responseData.errors).forEach(([fieldName, messages]) => {
      if (Array.isArray(messages) && messages.length > 0) {
        // Convert PascalCase to camelCase for matching form field names
        const camelCaseFieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
        // Join multiple error messages with a comma
        fieldErrors[camelCaseFieldName] = messages.join(', ');
      }
    });

    return fieldErrors;
  }

  // Handle custom API error format (array of error messages)
  if (responseData?.errors && Array.isArray(responseData.errors)) {
    const fieldErrors: Record<string, string> = {};

    responseData.errors.forEach((errorMsg: string) => {
      // Try to extract field name from error message
      // Common patterns: "Field name is required", "Field name: error message"
      const colonMatch = errorMsg.match(/^([^:]+):\s*(.+)$/);
      if (colonMatch) {
        const [, fieldName, message] = colonMatch;
        fieldErrors[fieldName.trim()] = message.trim();
      }
    });

    return fieldErrors;
  }

  return {};
};

/**
 * Checks if an error is an authorization error (401 or 403)
 * @param error - The error to check
 * @returns True if the error is an authorization error
 */
export const isAuthError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    return status === 401 || status === 403;
  }
  return false;
};

/**
 * Checks if an error is a validation error (400)
 * @param error - The error to check
 * @returns True if the error is a validation error
 */
export const isValidationError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError;
    return axiosError.response?.status === 400;
  }
  return false;
};

/**
 * Classification of an error raised while loading an in-scope list (pagination/sorting/filtering).
 *
 * - `invalid-filter` (400): bad filter/sort input — surface a user-friendly toast and preserve the
 *   last valid list (FR-015).
 * - `not-found` (404): the parent org/site/case is missing — render a distinct not-found state
 *   (FR-004). NOTE: list endpoints never return 404 for an empty result; an empty page is a 200 with
 *   `items: []` (a valid empty state, FR-003) and must not reach this helper.
 * - `auth` (401): defer to the existing Keycloak refresh/logout flow.
 * - `forbidden` (403): the user lacks permission for this list.
 * - `unknown`: anything else (network, 500, etc.).
 */
export type ListErrorKind = 'invalid-filter' | 'not-found' | 'auth' | 'forbidden' | 'unknown';

export interface ListErrorInfo {
  kind: ListErrorKind;
  /** HTTP status code when available. */
  status?: number;
  /** User-facing messages extracted from the response (falls back to a generic message). */
  messages: string[];
}

/**
 * Classifies a list-load error into one of the three+ states the spec requires lists to distinguish
 * (invalid-filter vs. not-found vs. auth), per research R2/R7. Use the returned `kind` to decide
 * whether to show a filter-validation toast (preserving the last valid list), a not-found state, or
 * to defer to the auth flow.
 *
 * @param error - The error thrown by the service/Axios call.
 * @returns A {@link ListErrorInfo} describing how the list should react.
 */
export const classifyListError = (error: unknown): ListErrorInfo => {
  let status: number | undefined;

  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    status = (error as AxiosError).response?.status;
  } else if (error && typeof error === 'object' && 'response' in error) {
    const customError = error as { response?: { status?: number } };
    status = customError.response?.status;
  }

  const messages = extractApiErrors(error);

  switch (status) {
    case 400:
      return { kind: 'invalid-filter', status, messages };
    case 401:
      return { kind: 'auth', status, messages };
    case 403:
      return { kind: 'forbidden', status, messages };
    case 404:
      return { kind: 'not-found', status, messages };
    default:
      return { kind: 'unknown', status, messages };
  }
};

/**
 * Convenience predicate: was this list error caused by invalid filter/sort input (400)?
 * Such errors should surface a toast while keeping the previously loaded list on screen (FR-015).
 */
export const isInvalidFilterError = (error: unknown): boolean =>
  classifyListError(error).kind === 'invalid-filter';

/**
 * Convenience predicate: did this list request hit a missing parent resource (404)?
 * The list should render a distinct not-found state rather than an empty list (FR-004).
 */
export const isNotFoundError = (error: unknown): boolean =>
  classifyListError(error).kind === 'not-found';

/**
 * Logs error details to console in development mode
 * @param error - The error to log
 * @param context - Additional context about where the error occurred
 */
export const logError = (error: unknown, context?: string): void => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error occurred:', {
      context,
      error,
      timestamp: new Date().toISOString(),
    });
  }
};