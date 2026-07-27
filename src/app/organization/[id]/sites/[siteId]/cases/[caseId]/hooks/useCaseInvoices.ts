import { useState, useCallback, useEffect, useRef } from 'react';
import {
  fetchCaseInvoices,
  addCaseInvoice,
  updateCaseInvoice,
  deleteCaseInvoice,
  updateCaseInvoicePaymentStatus,
  type ListParams
} from '@/app/organization/services/caseapi';
import {
  CaseInvoice,
  AddCaseInvoiceRequest,
  UpdateCaseInvoiceRequest,
  PaymentStatus
} from '@/app/organization/types/caseindex';
import type { PagedResponse } from '@/types/pagination';
import { useToast } from '@/contexts/ToastContext';
import { useFormValidation } from '@/hooks/useFormValidation';
import { CaseInvoiceSchemas } from '@/utils/caseValidationSchemas';
import { extractApiErrors, classifyListError } from '@/utils/errorHandler';

const getEmptyInvoiceForm = (): AddCaseInvoiceRequest => ({
  generatedDate: new Date().toISOString(),
  dueDate: '',
  paymentStatus: PaymentStatus.Pending,
  amount: 0,
  invoiceFileName: '',
  invoiceContent: '',
  remarks: ''
});

export const useCaseInvoices = (
  organizationId: string,
  siteId: string,
  caseId: string,
  listParams: ListParams = {}
) => {
  // Invoice management state
  const [invoices, setInvoices] = useState<CaseInvoice[]>([]);
  const [invoicesMeta, setInvoicesMeta] = useState<PagedResponse<CaseInvoice> | null>(null);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [addingInvoice, setAddingInvoice] = useState(false);
  const [updatingInvoice, setUpdatingInvoice] = useState(false);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);

  // Delete invoice modal state
  const [deleteInvoiceModalOpen, setDeleteInvoiceModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<CaseInvoice | null>(null);

  // API error states
  const [invoiceApiErrors, setInvoiceApiErrors] = useState<string[] | null>(null);
  const [editInvoiceApiErrors, setEditInvoiceApiErrors] = useState<string[] | null>(null);

  // Validation hook for add invoice
  const addInvoiceValidation = useFormValidation(CaseInvoiceSchemas.add);

  const { showSuccess, showError } = useToast();

  // Ref to store file selection reset function from presentation component
  const fileSelectionResetRef = useRef<(() => void) | null>(null);
  
  // Invoice form for adding
  const [invoiceForm, setInvoiceForm] = useState<AddCaseInvoiceRequest>(getEmptyInvoiceForm);

  // Load invoices
  const loadInvoices = useCallback(async () => {
    if (!organizationId || !siteId || !caseId) return;
    
    setLoadingInvoices(true);
    try {
      const invoicesPage = await fetchCaseInvoices(organizationId, siteId, caseId, listParams);
      setInvoices(invoicesPage.items);
      setInvoicesMeta(invoicesPage);
    } catch (err: unknown) {
      const classified = classifyListError(err);
      if (classified.kind === 'invalid-filter') {
        showError(classified.messages?.[0] ?? 'Invalid filter value — please adjust your filters.');
        // preserve last valid list
      } else {
        console.error('Failed to load invoices:', err);
        setInvoices([]);
      }
    } finally {
      setLoadingInvoices(false);
    }
  }, [organizationId, siteId, caseId, listParams, showError]);

  // Initial load
  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Form handlers for adding invoice
  const handleInvoiceFormChange = useCallback((field: keyof AddCaseInvoiceRequest, value: string | number) => {
    setInvoiceForm(prev => ({ ...prev, [field]: value }));
    addInvoiceValidation.clearFieldError(field as string);
  }, [addInvoiceValidation]);

  // Add invoice operation
  const handleAddInvoice = useCallback(async () => {
    setInvoiceApiErrors(null);

    if (!addInvoiceValidation.validate(invoiceForm)) {
      return;
    }

    const invoiceDataToSubmit = {
      ...invoiceForm
    };

    setAddingInvoice(true);
    try {
      await addCaseInvoice(organizationId, siteId, caseId, invoiceDataToSubmit);
      await loadInvoices();

      // Reset form and close modal
      setInvoiceForm(getEmptyInvoiceForm());
      addInvoiceValidation.reset();

      // Reset file selection state in presentation component
      if (fileSelectionResetRef.current) {
        fileSelectionResetRef.current();
      }

      setShowAddInvoice(false);
      showSuccess('Invoice added successfully');
    } catch (error) {
      console.error('Failed to add invoice:', error);
      const errorMessages = extractApiErrors(error);
      setInvoiceApiErrors(errorMessages);
    } finally {
      setAddingInvoice(false);
    }
  }, [organizationId, siteId, caseId, invoiceForm, addInvoiceValidation, loadInvoices, showSuccess]);

  // Update invoice using modal data (replaces inline edit)
  const handleUpdateInvoiceWithData = useCallback(async (
    invoiceId: string,
    data: {
      amount: number;
      dueDate: string;
      paymentStatus: PaymentStatus;
      remarks: string;
      invoiceContent: string;
      invoiceFileName: string;
    }
  ) => {
    setEditInvoiceApiErrors(null);
    setUpdatingInvoice(true);
    try {
      const updateRequest: UpdateCaseInvoiceRequest = {
        id: invoiceId,
        amount: data.amount,
        dueDate: data.dueDate,
        paymentStatus: data.paymentStatus,
        remarks: data.remarks,
        invoiceContent: data.invoiceContent,
        invoiceFileName: data.invoiceFileName
      };
      await updateCaseInvoice(organizationId, siteId, caseId, invoiceId, updateRequest);
      await loadInvoices();
      showSuccess('Invoice updated successfully');
    } catch (error) {
      console.error('Failed to update invoice:', error);
      const errorMessages = extractApiErrors(error);
      setEditInvoiceApiErrors(errorMessages);
      throw error; // Re-throw so modal can handle if needed
    } finally {
      setUpdatingInvoice(false);
    }
  }, [organizationId, siteId, caseId, loadInvoices, showSuccess]);

  // Delete invoice - show modal
  const handleDeleteInvoice = useCallback((invoice: CaseInvoice) => {
    if (!invoice) return;
    setInvoiceToDelete(invoice);
    setDeleteInvoiceModalOpen(true);
  }, []);

  // Confirm delete invoice
  const confirmDeleteInvoice = useCallback(async () => {
    if (!invoiceToDelete || !organizationId || !siteId || !caseId) return;

    setDeletingInvoiceId(invoiceToDelete.id);
    try {
      await deleteCaseInvoice(organizationId, siteId, caseId, invoiceToDelete.id);
      await loadInvoices();

      setDeleteInvoiceModalOpen(false);
      setInvoiceToDelete(null);
      showSuccess('Invoice deleted successfully');
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete invoice. Please try again.';
      showError(errorMessage);
    } finally {
      setDeletingInvoiceId(null);
    }
  }, [invoiceToDelete, organizationId, siteId, caseId, loadInvoices, showSuccess, showError]);

  // Close delete invoice modal
  const handleCloseDeleteInvoiceModal = useCallback(() => {
    setDeleteInvoiceModalOpen(false);
    setInvoiceToDelete(null);
  }, []);

  // Update payment status directly from table
  const handleUpdatePaymentStatus = useCallback(async (invoiceId: string, paymentStatus: PaymentStatus) => {
    try {
      await updateCaseInvoicePaymentStatus(organizationId, siteId, caseId, invoiceId, { paymentStatus });
      await loadInvoices();
    } catch (error) {
      console.error('Failed to update payment status:', error);
      showError('Failed to update payment status');
    }
  }, [organizationId, siteId, caseId, loadInvoices, showError]);

  // Download invoice file
  const handleDownloadInvoice = useCallback((invoice: CaseInvoice) => {
    try {
      if (!invoice.invoiceContent || invoice.invoiceContent.trim() === '') {
        showError('No invoice file available for download.');
        return;
      }

      try {
        const base64Data = invoice.invoiceContent.includes(',') 
          ? invoice.invoiceContent.split(',')[1] 
          : invoice.invoiceContent;
        
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([bytes]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const fileName = invoice.invoiceFileName || `invoice_${invoice.id}`;
        const fileNameWithExt = fileName.includes('.') 
          ? fileName 
          : `${fileName}.pdf`;
        
        link.download = fileNameWithExt;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error processing invoice file:', error);
        showError('Failed to process invoice file. The file may be corrupted.');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      showError('Failed to download invoice file.');
    }
  }, [showError]);

  // Function to set file selection reset callback
  const setFileSelectionReset = useCallback((resetFn: (() => void) | null) => {
    fileSelectionResetRef.current = resetFn;
  }, []);

  // Handle cancel add invoice
  const handleCancelAddInvoice = useCallback(() => {
    setInvoiceForm(getEmptyInvoiceForm());
    addInvoiceValidation.reset();
    setInvoiceApiErrors(null);
    setShowAddInvoice(false);
  }, [addInvoiceValidation]);

  return {
    // Data
    invoices,
    invoicesMeta,
    loadingInvoices,

    // Forms
    showAddInvoice,
    addingInvoice,
    updatingInvoice,
    deletingInvoiceId,
    invoiceForm,

    // Delete invoice modal state
    deleteInvoiceModalOpen,
    invoiceToDelete,

    // Validation errors
    invoiceErrors: addInvoiceValidation.errors,
    invoiceApiErrors,
    editInvoiceApiErrors,
    setInvoiceApiErrors,
    setEditInvoiceApiErrors,

    // Setters
    setShowAddInvoice,
    setFileSelectionReset,

    // Handlers
    handleInvoiceFormChange,
    handleAddInvoice,
    handleUpdateInvoiceWithData,
    handleDeleteInvoice,
    confirmDeleteInvoice,
    handleCloseDeleteInvoiceModal,
    handleCancelAddInvoice,
    handleUpdatePaymentStatus,
    handleDownloadInvoice,

    // Utils
    loadInvoices
  };
};