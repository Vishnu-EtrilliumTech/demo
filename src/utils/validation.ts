/**
 * Validation rule types
 */
export type ValidationRule = {
  type: 'required' | 'email' | 'phone' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  message: string;
  value?: number | RegExp;
  validator?: (value: unknown) => boolean;
};

/**
 * Field validation schema
 */
export type FieldSchema = {
  rules: ValidationRule[];
};

/**
 * Form validation schema
 */
export type ValidationSchema = Record<string, FieldSchema>;

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  // Indian phone number pattern: starts with 6-9, followed by 9 digits
  phone: /^[6-9]\d{9}$/,

  // Gmail-only pattern (user login email)
  email: /^[a-zA-Z0-9._%+-]+@gmail\.com$/i,

  // Standard email pattern - any valid email address, not restricted to a specific
  // provider. Used for organization/site emails, which aren't login accounts.
  generalEmail: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // Pincode pattern (Indian)
  pincode: /^\d{6}$/,
} as const;

/**
 * Common validation messages
 */
export const ValidationMessages = {
  required: (fieldName: string) => `${fieldName} is required.`,
  email: 'Only Gmail addresses (@gmail.com) are accepted.',
  generalEmail: 'Please enter a valid email address.',
  phone: 'Not a valid phone number.',
  minLength: (fieldName: string, length: number) =>
    `${fieldName} must be at least ${length} characters.`,
  maxLength: (fieldName: string, length: number) =>
    `${fieldName} cannot exceed ${length} characters.`,
  pattern: (fieldName: string) => `${fieldName} format is invalid.`,
  pincode: 'Invalid pincode.',
} as const;

/**
 * Validates a single field value against its schema
 * @param value - The value to validate
 * @param schema - The field schema containing validation rules
 * @returns Error message if validation fails, undefined otherwise
 */
export const validateField = (value: unknown, schema: FieldSchema): string | undefined => {
  for (const rule of schema.rules) {
    let isValid = true;

    switch (rule.type) {
      case 'required':
        if (typeof value === 'string') {
          isValid = value.trim().length > 0;
        } else if (Array.isArray(value)) {
          isValid = value.length > 0;
        } else {
          isValid = value !== null && value !== undefined;
        }
        break;

      case 'email':
        if (value) {
          isValid = ValidationPatterns.email.test(String(value));
        }
        break;

      case 'phone':
        if (value) {
          isValid = ValidationPatterns.phone.test(String(value));
        }
        break;

      case 'minLength':
        if (value && typeof value === 'string' && typeof rule.value === 'number') {
          isValid = value.length >= rule.value;
        }
        break;

      case 'maxLength':
        if (value && typeof value === 'string' && typeof rule.value === 'number') {
          isValid = value.length <= rule.value;
        }
        break;

      case 'pattern':
        if (value && rule.value instanceof RegExp) {
          isValid = rule.value.test(String(value));
        }
        break;

      case 'custom':
        if (rule.validator) {
          isValid = rule.validator(value);
        }
        break;
    }

    if (!isValid) {
      return rule.message;
    }
  }

  return undefined;
};

/**
 * Validates all fields in a form against the validation schema
 * @param values - Form values to validate
 * @param schema - Validation schema for the form
 * @returns Record of field names to error messages
 */
export const validateForm = (
  values: Record<string, unknown>,
  schema: ValidationSchema
): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.keys(schema).forEach((fieldName) => {
    const error = validateField(values[fieldName], schema[fieldName]);
    if (error) {
      errors[fieldName] = error;
    }
  });

  return errors;
};

/**
 * Helper to create a required field validation rule
 */
export const required = (fieldName: string): ValidationRule => ({
  type: 'required',
  message: ValidationMessages.required(fieldName),
});

/**
 * Helper to create an email validation rule
 */
export const email = (): ValidationRule => ({
  type: 'email',
  message: ValidationMessages.email,
});

/**
 * Helper to create a general email validation rule (any valid email, not
 * restricted to Gmail). Use for organization/site emails, which aren't login
 * accounts — the Gmail restriction only applies to user login emails.
 */
export const generalEmail = (): ValidationRule => ({
  type: 'pattern',
  message: ValidationMessages.generalEmail,
  value: ValidationPatterns.generalEmail,
});

/**
 * Helper to create a phone validation rule
 */
export const phone = (): ValidationRule => ({
  type: 'phone',
  message: ValidationMessages.phone,
});

/**
 * Helper to create a min length validation rule
 */
export const minLength = (fieldName: string, length: number): ValidationRule => ({
  type: 'minLength',
  message: ValidationMessages.minLength(fieldName, length),
  value: length,
});

/**
 * Helper to create a max length validation rule
 */
export const maxLength = (fieldName: string, length: number): ValidationRule => ({
  type: 'maxLength',
  message: ValidationMessages.maxLength(fieldName, length),
  value: length,
});

/**
 * Helper to create a pattern validation rule
 */
export const pattern = (fieldName: string, regex: RegExp, message?: string): ValidationRule => ({
  type: 'pattern',
  message: message || ValidationMessages.pattern(fieldName),
  value: regex,
});

/**
 * Helper to create a custom validation rule
 */
export const custom = (message: string, validator: (value: unknown) => boolean): ValidationRule => ({
  type: 'custom',
  message,
  validator,
});

/**
 * Common validation schemas for reuse across forms
 */
export const CommonSchemas = {
  name: {
    rules: [
      required('Name'),
      maxLength('Name', 100),
    ],
  },

  email: {
    rules: [
      required('Email'),
      email(),
      maxLength('Email', 254),
    ],
  },

  phone: {
    rules: [
      required('Phone number'),
      phone(),
    ],
  },

  description: {
    rules: [
      maxLength('Description', 500),
    ],
  },

  address: {
    rules: [
      required('Address'),
      maxLength('Address', 200),
    ],
  },

  pincode: {
    rules: [
      required('Pincode'),
      pattern('Pincode', ValidationPatterns.pincode, 'Invalid pincode.'),
      maxLength('Pincode', 10),
    ],
  },
} as const;
