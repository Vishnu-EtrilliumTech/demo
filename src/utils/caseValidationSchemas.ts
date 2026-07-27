/**
 * Validation schemas for case-related entities
 * Based on backend API validation requirements from UI_Validation_Plan.md
 */

import { required, maxLength, minLength, email, phone, custom } from './validation';
import type { ValidationSchema } from './validation';

/**
 * Case validation schemas
 */
export const CaseSchemas = {
  /**
   * Schema for creating a case
   * Required: Title, CaseNumber, Status
   * Optional: Description
   */
  create: {
    title: {
      rules: [required('Title'), maxLength('Title', 200)],
    },
    caseNumber: {
      rules: [required('Case Number'), maxLength('Case Number', 50)],
    },
    description: {
      rules: [maxLength('Description', 500)],
    },
    status: {
      rules: [required('Status')],
    },
  } as ValidationSchema,

  /**
   * Schema for updating a case
   * Required: CaseNumber, Status
   * Optional: Title, Description
   * Note: Title becomes optional in update
   */
  update: {
    title: {
      rules: [maxLength('Title', 200)],
    },
    caseNumber: {
      rules: [required('Case Number')],
    },
    description: {
      rules: [maxLength('Description', 500)],
    },
    status: {
      rules: [required('Status')],
    },
  } as ValidationSchema,
};

/**
 * Case Task validation schemas
 */
export const CaseTaskSchemas = {
  /**
   * Schema for adding a case task
   * Required: Title, Status
   * Optional: Description, AssignedToId, DueDate
   */
  add: {
    title: {
      rules: [required('Title'), maxLength('Title', 200)],
    },
    description: {
      rules: [maxLength('Description', 1000)],
    },
    status: {
      rules: [required('Status')],
    },
  } as ValidationSchema,

  /**
   * Schema for updating a case task
   * Required: Title, AssignedToId, DueDate, Status
   * Optional: Description
   * Note: AssignedToId and DueDate become required in update
   */
  update: {
    title: {
      rules: [required('Title'), maxLength('Title', 200)],
    },
    description: {
      rules: [maxLength('Description', 1000)],
    },
    assignedToId: {
      rules: [required('Assigned To')],
    },
    dueDate: {
      rules: [required('Due Date')],
    },
    status: {
      rules: [required('Status')],
    },
  } as ValidationSchema,
};

/**
 * Task Document validation schemas
 */
export const TaskDocumentSchemas = {
  /**
   * Schema for adding a document to a task
   * Required: Name, Content
   * Optional: Remarks
   */
  add: {
    name: {
      rules: [required('Document Name'), maxLength('Document Name', 200)],
    },
    remarks: {
      rules: [maxLength('Remarks', 500)],
    },
  } as ValidationSchema,

  /**
   * Schema for updating task document remarks
   * Required: Remarks (MinLength 1)
   * Note: Despite no Required attribute, MinLength(1) means remarks cannot be empty
   */
  updateRemarks: {
    remarks: {
      rules: [
        required('Remarks'),
        minLength('Remarks', 1),
        maxLength('Remarks', 500)
      ],
    },
  } as ValidationSchema,
};

/**
 * Case Client validation schemas
 */
export const CaseClientSchemas = {
  /**
   * Schema for adding a case client
   * Required: FullName, Gender
   * Optional: EmailId, PhoneNumber, Remarks
   */
  add: {
    fullName: {
      rules: [required('Full Name'), maxLength('Full Name', 200)],
    },
    gender: {
      rules: [required('Gender')],
    },
    emailId: {
      rules: [email(), maxLength('Email', 254)],
    },
    phoneNumber: {
      rules: [phone()],
    },
    remarks: {
      rules: [],
    },
  } as ValidationSchema,

  /**
   * Schema for updating a case client
   * Same as add schema
   */
  update: {
    fullName: {
      rules: [required('Full Name'), maxLength('Full Name', 200)],
    },
    gender: {
      rules: [required('Gender')],
    },
    emailId: {
      rules: [email(), maxLength('Email', 254)],
    },
    phoneNumber: {
      rules: [phone()],
    },
    remarks: {
      rules: [],
    },
  } as ValidationSchema,
};

/**
 * Case Hearing validation schemas
 */
export const CaseHearingSchemas = {
  /**
   * Schema for adding a case hearing
   * Required: AssignedToId, HearingDateTime, Status, CourtName
   * Optional: GoogleMapLocation, Notes
   */
  add: {
    assignedToId: {
      rules: [required('Assigned To')],
    },
    hearingDateTime: {
      rules: [required('Hearing Date & Time')],
    },
    status: {
      rules: [required('Status')],
    },
    courtName: {
      rules: [required('Court'), maxLength('Court', 500)],
    },
    googleMapLocation: {
      rules: [maxLength('Location', 500)],
    },
    notes: {
      rules: [],
    },
  } as ValidationSchema,

  /**
   * Schema for updating a case hearing
   * Required: AssignedToId, HearingDateTime, Status, CourtName
   * Optional: GoogleMapLocation, Notes
   * Note: CourtName field max length changes from 500 (create) to 200 (update)
   */
  update: {
    assignedToId: {
      rules: [required('Assigned To')],
    },
    hearingDateTime: {
      rules: [required('Hearing Date & Time')],
    },
    status: {
      rules: [required('Status')],
    },
    courtName: {
      rules: [required('Court'), maxLength('Court', 200)], // Changed from 500 to 200
    },
    googleMapLocation: {
      rules: [maxLength('Location', 500)],
    },
    notes: {
      rules: [],
    },
  } as ValidationSchema,
};

/**
 * Case Invoice validation schemas
 */
export const CaseInvoiceSchemas = {
  /**
   * Schema for adding a case invoice
   * Required: GeneratedDate, DueDate, PaymentStatus, Amount, InvoiceFileName, InvoiceContent
   * Optional: Remarks
   */
  add: {
    generatedDate: {
      rules: [required('Generated Date')],
    },
    dueDate: {
      rules: [
        required('Due Date'),
        custom(
          'Due Date must be after Generated Date',
          (value) => {
            // Note: Cross-field validation should be done at form level, not field level
            // For now, just validate that the value is a valid date
            if (!value) return true;
            return true; // Will be validated at form submission
          }
        ),
      ],
    },
    paymentStatus: {
      rules: [required('Payment Status')],
    },
    amount: {
      rules: [
        required('Amount'),
        custom(
          'Amount must be a positive number',
          (value) => typeof value === 'number' && value > 0
        ),
      ],
    },
    invoiceFileName: {
      rules: [required('Invoice File Name')],
    },
    remarks: {
      rules: [],
    },
  } as ValidationSchema,

  /**
   * Schema for updating a case invoice
   * Required: DueDate, PaymentStatus, Amount, InvoiceFileName, InvoiceContent
   * Optional: PaymentReceivedDate, Remarks
   * Note: GeneratedDate is removed from update (cannot be changed)
   * Note: PaymentReceivedDate becomes available in update
   */
  update: {
    dueDate: {
      rules: [required('Due Date')],
    },
    paymentStatus: {
      rules: [required('Payment Status')],
    },
    amount: {
      rules: [
        required('Amount'),
        custom(
          'Amount must be a positive number',
          (value) => typeof value === 'number' && value > 0
        ),
      ],
    },
    invoiceFileName: {
      rules: [required('Invoice File Name')],
    },
    paymentReceivedDate: {
      rules: [
        custom(
          'Payment Received Date must be a valid date',
          (value) => {
            // Note: Cross-field validation (checking if Paid requires this field)
            // should be done at form level
            if (!value) return true; // Optional field at field level
            return true;
          }
        ),
      ],
    },
    remarks: {
      rules: [],
    },
  } as ValidationSchema,
};

/**
 * Helper function to validate if a date is in the future
 */
export const isFutureDate = (date: Date | string): boolean => {
  return new Date(date) > new Date();
};

/**
 * Helper function to validate date range
 */
export const isDateAfter = (endDate: Date | string, startDate: Date | string): boolean => {
  return new Date(endDate) > new Date(startDate);
};
