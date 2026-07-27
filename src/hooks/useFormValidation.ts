import { useState, useCallback } from 'react';
import { ValidationSchema, validateField, validateForm } from '@/utils/validation';

/**
 * Form validation state
 */
interface FormValidationState {
  /**
   * Field-level errors (key: field name, value: error message)
   */
  errors: Record<string, string>;

  /**
   * Whether the form is currently being validated
   */
  isValidating: boolean;

  /**
   * Whether the form has been submitted at least once
   */
  hasSubmitted: boolean;
}

/**
 * Custom hook for form validation with error handling
 * @param schema - Validation schema for the form
 * @returns Form validation utilities and state
 */
export const useFormValidation = (schema: ValidationSchema) => {
  const [state, setState] = useState<FormValidationState>({
    errors: {},
    isValidating: false,
    hasSubmitted: false,
  });

  /**
   * Validates a single field and updates its error state
   * @param fieldName - Name of the field to validate
   * @param value - Value to validate
   * @returns The error message if validation fails, undefined otherwise
   */
  const validateSingleField = useCallback(
    (fieldName: string, value: unknown): string | undefined => {
      const fieldSchema = schema[fieldName];
      if (!fieldSchema) {
        return undefined;
      }

      const error = validateField(value, fieldSchema);

      setState((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          [fieldName]: error || '',
        },
      }));

      return error;
    },
    [schema]
  );

  /**
   * Validates all fields in the form
   * @param values - Form values to validate
   * @returns True if form is valid, false otherwise
   */
  const validate = useCallback(
    (values: Record<string, unknown>): boolean => {
      setState((prev) => ({ ...prev, isValidating: true }));

      const newErrors = validateForm(values, schema);
      const isValid = Object.keys(newErrors).length === 0;

      setState((prev) => ({
        ...prev,
        errors: newErrors,
        isValidating: false,
        hasSubmitted: true,
      }));

      return isValid;
    },
    [schema]
  );

  /**
   * Clears all validation errors
   */
  const clearErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      errors: {},
    }));
  }, []);

  /**
   * Clears error for a specific field
   * @param fieldName - Name of the field to clear error for
   */
  const clearFieldError = useCallback((fieldName: string) => {
    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: '',
      },
    }));
  }, []);

  /**
   * Sets a specific error for a field
   * Useful for setting server-side validation errors
   * @param fieldName - Name of the field
   * @param error - Error message
   */
  const setFieldError = useCallback((fieldName: string, error: string) => {
    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: error,
      },
    }));
  }, []);

  /**
   * Sets multiple field errors at once
   * Useful for setting server-side validation errors
   * @param errors - Record of field names to error messages
   */
  const setErrors = useCallback((errors: Record<string, string>) => {
    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        ...errors,
      },
    }));
  }, []);

  /**
   * Gets the error message for a specific field
   * @param fieldName - Name of the field
   * @returns The error message, or undefined if no error
   */
  const getFieldError = useCallback(
    (fieldName: string): string | undefined => {
      const error = state.errors[fieldName];
      return error || undefined;
    },
    [state.errors]
  );

  /**
   * Checks if a field has an error
   * @param fieldName - Name of the field
   * @returns True if the field has an error
   */
  const hasFieldError = useCallback(
    (fieldName: string): boolean => {
      return Boolean(state.errors[fieldName]);
    },
    [state.errors]
  );

  /**
   * Resets the form validation state
   */
  const reset = useCallback(() => {
    setState({
      errors: {},
      isValidating: false,
      hasSubmitted: false,
    });
  }, []);

  return {
    // State
    errors: state.errors,
    isValidating: state.isValidating,
    hasSubmitted: state.hasSubmitted,

    // Validation functions
    validate,
    validateSingleField,

    // Error management
    clearErrors,
    clearFieldError,
    setFieldError,
    setErrors,
    getFieldError,
    hasFieldError,

    // Reset
    reset,
  };
};
