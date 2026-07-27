import { useState, useCallback } from 'react';

export interface FormValidation<T> {
  field: keyof T;
  message: string;
}

export interface UseFormStateOptions<T> {
  validation?: (data: T) => FormValidation<T>[];
  onSubmit?: (data: T) => Promise<void> | void;
  resetOnSubmit?: boolean;
}

export const useFormState = <T>(
  initialState: T,
  options: UseFormStateOptions<T> = {}
) => {
  const { validation, onSubmit, resetOnSubmit = false } = options;
  
  // Form state
  const [formData, setFormData] = useState<T>(initialState);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  // Update a single field
  const handleChange = useCallback((field: keyof T, value: string | number | boolean | Date | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Update multiple fields at once
  const setFormFields = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(initialState);
    setIsEditing(false);
    setIsLoading(false);
    setErrors({});
  }, [initialState]);

  // Reset form to new initial state
  const resetToState = useCallback((newState: T) => {
    setFormData(newState);
    setIsEditing(false);
    setIsLoading(false);
    setErrors({});
  }, []);

  // Start editing mode
  const startEditing = useCallback((data?: Partial<T>) => {
    if (data) {
      setFormData(prev => ({ ...prev, ...data }));
    }
    setIsEditing(true);
    setErrors({});
  }, []);

  // Cancel editing mode
  const cancelEditing = useCallback(() => {
    setFormData(initialState);
    setIsEditing(false);
    setErrors({});
  }, [initialState]);

  // Validate form data
  const validateForm = useCallback((): boolean => {
    if (!validation) return true;
    
    const validationErrors = validation(formData);
    
    if (validationErrors.length > 0) {
      const errorMap: Partial<Record<keyof T, string>> = {};
      validationErrors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return false;
    }
    
    setErrors({});
    return true;
  }, [formData, validation]);

  // Submit form
  const submitForm = useCallback(async () => {
    if (!validateForm()) {
      return false;
    }

    if (onSubmit) {
      setIsLoading(true);
      try {
        await onSubmit(formData);
        
        if (resetOnSubmit) {
          resetForm();
        } else {
          setIsEditing(false);
        }
        
        return true;
      } catch (error) {
        console.error('Form submission error:', error);
        return false;
      } finally {
        setIsLoading(false);
      }
    }
    
    return true;
  }, [formData, validateForm, onSubmit, resetOnSubmit, resetForm]);

  // Check if form has changes
  const hasChanges = useCallback((): boolean => {
    return JSON.stringify(formData) !== JSON.stringify(initialState);
  }, [formData, initialState]);

  // Check if form is valid (no errors)
  const isValid = useCallback((): boolean => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  // Get error for specific field
  const getFieldError = useCallback((field: keyof T): string | undefined => {
    return errors[field];
  }, [errors]);

  // Check if field has error
  const hasFieldError = useCallback((field: keyof T): boolean => {
    return Boolean(errors[field]);
  }, [errors]);

  return {
    // Form data and state
    formData,
    isEditing,
    isLoading,
    errors,

    // Computed values
    hasChanges: hasChanges(),
    isValid: isValid(),

    // Form actions
    handleChange,
    setFormFields,
    resetForm,
    resetToState,
    startEditing,
    cancelEditing,
    validateForm,
    submitForm,

    // Utility functions
    getFieldError,
    hasFieldError,

    // State setters
    setFormData,
    setIsEditing,
    setIsLoading,
    setErrors
  };
};

// Specific form hooks for common patterns

// Hook for inline editing patterns
export const useInlineEdit = <T>(
  initialState: T,
  onSave: (data: T) => Promise<void>,
  validation?: (data: T) => FormValidation<T>[]
) => {
  const formState = useFormState(initialState, {
    validation,
    onSubmit: onSave
  });

  const handleEditClick = useCallback(() => {
    formState.startEditing(initialState);
  }, [formState, initialState]);

  const handleSaveClick = useCallback(async () => {
    const success = await formState.submitForm();
    return success;
  }, [formState]);

  const handleCancelClick = useCallback(() => {
    formState.cancelEditing();
  }, [formState]);

  return {
    ...formState,
    handleEditClick,
    handleSaveClick,
    handleCancelClick
  };
};

// Hook for modal/dialog forms
export const useModalForm = <T>(
  initialState: T,
  onSubmit: (data: T) => Promise<void>,
  validation?: (data: T) => FormValidation<T>[]
) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const formState = useFormState(initialState, {
    validation,
    onSubmit: async (data) => {
      await onSubmit(data);
      setIsOpen(false);
    },
    resetOnSubmit: true
  });

  const openModal = useCallback((data?: Partial<T>) => {
    if (data) {
      formState.setFormFields(data);
    }
    setIsOpen(true);
    formState.setIsEditing(true);
  }, [formState]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    formState.resetForm();
  }, [formState]);

  const handleSubmit = useCallback(async () => {
    const success = await formState.submitForm();
    if (success) {
      setIsOpen(false);
    }
    return success;
  }, [formState]);

  return {
    ...formState,
    isOpen,
    openModal,
    closeModal,
    handleSubmit
  };
};