import { useState, useCallback, useEffect } from 'react';
import {
  fetchCaseDocuments,
  addCaseDocument,
  deleteCaseDocument,
  fetchCaseDocument,
  type ListParams
} from '@/app/organization/services/caseapi';
import { fetchUserBasicInfo } from '@/app/organization/services/api';
import {
  CaseDocument,
  AddCaseDocumentRequest
} from '@/app/organization/types/caseindex';
import type { PagedResponse } from '@/types/pagination';
import { useToast } from '@/contexts/ToastContext';
import { classifyListError } from '@/utils/errorHandler';

export const useCaseDocuments = (
  organizationId: string,
  siteId: string,
  caseId: string,
  listParams: ListParams = {}
) => {
  // Case document management state
  const [caseDocuments, setCaseDocuments] = useState<CaseDocument[]>([]);
  const [caseDocumentsMeta, setCaseDocumentsMeta] = useState<PagedResponse<CaseDocument> | null>(null);
  const [loadingCaseDocuments, setLoadingCaseDocuments] = useState(false);
  const [uploadingCaseDocument, setUploadingCaseDocument] = useState(false);

  const { showError } = useToast();

  // Helper function to fetch user name by user ID
  // Uses the unified /basic endpoint that works for both org and site users
  const fetchUserName = useCallback(async (userId: string): Promise<string> => {
    try {
      const user = await fetchUserBasicInfo(organizationId, userId);
      return user.fullName || 'Unknown User da';
    } catch (error) {
      console.error(`Error fetching user details for ID ${userId}:`, error);
      return 'Unknown User da';
    }
  }, [organizationId]);

  // Fetch case documents
  const fetchCaseDocumentsData = useCallback(async () => {
    if (!organizationId || !siteId || !caseId) return;
    
    setLoadingCaseDocuments(true);
    try {
      const documentsPage = await fetchCaseDocuments(organizationId, siteId, caseId, listParams);
      const documentsData = documentsPage.items;
      setCaseDocumentsMeta(documentsPage);

      // Map backend response to expected format and fetch user names
      const mappedDocumentsPromises = documentsData.map(async doc => {
        let uploadedByName = 'Unknown User';
        
        // Fetch user name if createdById is available
        if (doc.createdById) {
          try {
            uploadedByName = await fetchUserName(doc.createdById);
          } catch (error) {
            console.error(`Failed to fetch user name for ID ${doc.createdById}:`, error);
          }
        }
        
        return {
          ...doc,
          // Map new backend fields to legacy UI fields for compatibility
          documentName: doc.name || doc.documentName,
          uploadedById: doc.createdById || doc.uploadedById,
          uploadedAt: doc.createdDate || doc.uploadedAt,
          uploadedByName,
          // Ensure name field is available
          name: doc.name || doc.documentName || `document_${doc.id}`
        };
      });
      
      const mappedDocuments = await Promise.all(mappedDocumentsPromises);
      setCaseDocuments(mappedDocuments);
    } catch (err: unknown) {
      const classified = classifyListError(err);
      if (classified.kind === 'invalid-filter') {
        showError(classified.messages?.[0] ?? 'Invalid filter value — please adjust your filters.');
        // preserve last valid list
      } else {
        console.error('Error loading case documents:', err);
        setCaseDocuments([]);
      }
    } finally {
      setLoadingCaseDocuments(false);
    }
  }, [organizationId, siteId, caseId, fetchUserName, listParams, showError]);

  // Upload case document
  const handleCaseDocumentUpload = useCallback(async (file: File) => {
    if (!organizationId || !siteId || !caseId) return;

    // Check file size (1MB = 1048576 bytes)
    if (file.size > 1048576) {
      showError('File size exceeds 1MB limit. Please upload a smaller file.');
      return;
    }

    setUploadingCaseDocument(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1]; // Remove data:mime;base64, prefix
        
        const documentData: AddCaseDocumentRequest = {
          name: file.name,
          content: base64Data,
          remarks: ''
        };
        
        try {
          const response = await addCaseDocument(organizationId, siteId, caseId, documentData);
          console.log('Case document upload response:', response);

          // Ids are GUID strings — no safe non-colliding placeholder value
          // exists for an optimistic row, so refresh from the server instead
          // of inserting a temporary document (consistent with how
          // Hearings/Comments/Contributors/Invoices already behave).
          await fetchCaseDocumentsData();
        } catch (err: unknown) {
          console.error('Error uploading case document:', err);
          alert(err instanceof Error ? err.message : 'Failed to upload document. Please try again.');
        } finally {
          setUploadingCaseDocument(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: unknown) {
      console.error('Error processing file:', err);
      alert('Failed to process file. Please try again.');
      setUploadingCaseDocument(false);
    }
  }, [organizationId, siteId, caseId, showError, fetchCaseDocumentsData]);

  // Delete case document
  const handleDeleteCaseDocument = useCallback(async (documentId: string) => {
    if (!organizationId || !siteId || !caseId) return;
    
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await deleteCaseDocument(organizationId, siteId, caseId, documentId);
      setCaseDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (err: unknown) {
      console.error('Error deleting case document:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete document. Please try again.');
    }
  }, [organizationId, siteId, caseId]);

  // Download case document
  const handleDownloadCaseDocument = useCallback(async (documentId: string, fileName: string) => {
    if (!organizationId || !siteId || !caseId) return;
    
    try {
      const documentResponse = await fetchCaseDocument(organizationId, siteId, caseId, documentId);
      console.log('Case document response for download:', documentResponse);
      
      let contentData = null;
      
      // Handle different content formats for case documents
      if (documentResponse.content !== undefined && documentResponse.content !== null) {
        if (Array.isArray(documentResponse.content) && documentResponse.content.length > 0) {
          // Direct byte array
          contentData = new Uint8Array(documentResponse.content);
        } else if (typeof documentResponse.content === 'string' && documentResponse.content.trim() !== '') {
          // Base64 string
          try {
            const base64Data = documentResponse.content.includes(',') ? documentResponse.content.split(',')[1] : documentResponse.content;
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            contentData = bytes;
          } catch (e) {
            console.error('Error decoding base64:', e);
            console.error('Base64 content:', documentResponse.content.substring(0, 100) + '...');
            alert('Failed to decode case document content. The document may be corrupted or in an unsupported format.');
            return;
          }
        } else if (documentResponse.content && typeof documentResponse.content === 'object' && !Array.isArray(documentResponse.content) && 'data' in documentResponse.content && Array.isArray(documentResponse.content.data)) {
          // Content wrapped in data property
          contentData = new Uint8Array(documentResponse.content.data);
        }
      }
      
      if (contentData && contentData.length > 0) {
        // Create blob and download
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          const blob = new Blob([contentData]);
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName || documentResponse.name || documentResponse.documentName || `document_${documentId}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          console.log('Case document downloaded successfully');
        } else {
          console.error('Document download not available in server environment');
        }
      } else {
        console.error('No valid content found for case document download');
        console.error('Case document object:', JSON.stringify(documentResponse, null, 2));
        alert('Case document content not available for download. The API may have returned empty content. Check console for details.');
      }
    } catch (err: unknown) {
      console.error('Error downloading case document:', err);
      alert(err instanceof Error ? err.message : 'Failed to download document. Please try again.');
    }
  }, [organizationId, siteId, caseId]);

  // Auto-fetch documents on mount and whenever the page/sort/filter params change
  useEffect(() => {
    if (organizationId && siteId && caseId) {
      fetchCaseDocumentsData();
    }
  }, [organizationId, siteId, caseId, fetchCaseDocumentsData]);

  return {
    // State
    caseDocuments,
    caseDocumentsMeta,
    loadingCaseDocuments,
    uploadingCaseDocument,

    // Actions
    fetchCaseDocumentsData,
    uploadCaseDocument: handleCaseDocumentUpload,
    deleteCaseDocument: handleDeleteCaseDocument,
    downloadCaseDocument: handleDownloadCaseDocument
  };
};