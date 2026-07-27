import { useState, useCallback } from 'react';
import { 
  fetchTaskDocuments, 
  addTaskDocument, 
  deleteTaskDocument, 
  fetchTaskDocument 
} from '@/app/organization/services/caseapi';
import { 
  TaskDocument, 
  AddTaskDocumentRequest 
} from '@/app/organization/types/caseindex';

export const useTaskDocuments = (
  organizationId: string,
  siteId: string, 
  caseId: string

) => {
  // Task document management state
  const [taskDocuments, setTaskDocuments] = useState<{ [taskId: string]: TaskDocument[] }>({});
  const [loadingDocuments, setLoadingDocuments] = useState<{ [taskId: string]: boolean }>({});
  const [uploadingDocument, setUploadingDocument] = useState<{ [taskId: string]: boolean }>({});

  // Fetch task documents
  const fetchTaskDocumentsData = useCallback(async (taskId: string) => {
    if (!organizationId || !siteId || !caseId) return;
    
    setLoadingDocuments(prev => ({ ...prev, [taskId]: true }));
    try {
      const documentsData = (await fetchTaskDocuments(organizationId, siteId, caseId, taskId)).items;
      setTaskDocuments(prev => ({ ...prev, [taskId]: documentsData }));
    } catch (err: unknown) {
      console.error('Error loading task documents:', err);
      setTaskDocuments(prev => ({ ...prev, [taskId]: [] }));
    } finally {
      setLoadingDocuments(prev => ({ ...prev, [taskId]: false }));
    }
  }, [organizationId, siteId, caseId]);

  // Upload document to task
  const handleDocumentUpload = useCallback(async (taskId: string, file: File) => {
    if (!organizationId || !siteId || !caseId) return;
    
    setUploadingDocument(prev => ({ ...prev, [taskId]: true }));
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1]; // Remove data:mime;base64, prefix
        
        const documentData: AddTaskDocumentRequest = {
          name: file.name,
          content: base64Data,
          remarks: ''
        };
        
        try {
          const response = await addTaskDocument(organizationId, siteId, caseId, taskId, documentData);
          console.log('Document upload response:', response);
          
          // Ensure the document has the right structure
          const newDocument = {
            ...response.data,
            name: response.data.name || file.name,
            createdDate: response.data.createdDate || new Date().toISOString()
          };
          
          setTaskDocuments(prev => ({
            ...prev,
            [taskId]: [...(prev[taskId] || []), newDocument]
          }));
        } catch (err: unknown) {
          console.error('Error uploading document:', err);
          alert(err instanceof Error ? err.message : 'Failed to upload document. Please try again.');
        } finally {
          setUploadingDocument(prev => ({ ...prev, [taskId]: false }));
        }
      };
      reader.readAsDataURL(file);
    } catch (err: unknown) {
      console.error('Error processing file:', err);
      alert('Failed to process file. Please try again.');
      setUploadingDocument(prev => ({ ...prev, [taskId]: false }));
    }
  }, [organizationId, siteId, caseId]);

  // Delete task document
  const handleDeleteDocument = useCallback(async (taskId: string, documentId: string) => {
    if (!organizationId || !siteId || !caseId) return;
    
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await deleteTaskDocument(organizationId, siteId, caseId, taskId, documentId);
      setTaskDocuments(prev => ({
        ...prev,
        [taskId]: prev[taskId]?.filter(doc => doc.id !== documentId) || []
      }));
    } catch (err: unknown) {
      console.error('Error deleting document:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete document. Please try again.');
    }
  }, [organizationId, siteId, caseId]);

  // Download task document
  const handleDownloadTaskDocument = useCallback(async (taskId: string, documentId: string, fileName: string) => {
    if (!organizationId || !siteId || !caseId) return;
    
    try {
      const documentResponse = await fetchTaskDocument(organizationId, siteId, caseId, taskId, documentId);
      console.log('Task document response for download:', documentResponse);
      console.log('Document content:', documentResponse.content);
      console.log('Content type:', typeof documentResponse.content);
      console.log('Is array:', Array.isArray(documentResponse.content));
      
      let contentData = null;
      
      // Handle different content formats
      if (documentResponse.content !== undefined && documentResponse.content !== null) {
        if (Array.isArray(documentResponse.content) && documentResponse.content.length > 0) {
          // Direct byte array
          contentData = new Uint8Array(documentResponse.content);
        } else if (typeof documentResponse.content === 'string' && documentResponse.content.trim() !== '') {
          // Base64 string
          const contentString = documentResponse.content;
          try {
            const base64Data = contentString.includes(',') ? contentString.split(',')[1] : contentString;
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            contentData = bytes;
          } catch (e) {
            console.error('Error decoding base64:', e);
            // If base64 decode fails, show detailed error
            console.error('Base64 content:', contentString.substring(0, 100) + '...');
            alert('Failed to decode document content. The document may be corrupted or in an unsupported format.');
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
          link.download = fileName || documentResponse.name || `document_${documentId}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          console.log('Document downloaded successfully');
        } else {
          console.error('Document download not available in server environment');
        }
      } else {
        console.error('No valid content found for download');
        console.error('Document object:', JSON.stringify(documentResponse, null, 2));
        alert('Document content not available for download. The API may have returned empty content. Check console for details.');
      }
    } catch (err: unknown) {
      console.error('Error downloading task document:', err);
      alert(err instanceof Error ? err.message : 'Failed to download document. Please try again.');
    }
  }, [organizationId, siteId, caseId]);

  // Clear documents for a task when task is deleted
  const clearTaskDocuments = useCallback((taskId: string) => {
    setTaskDocuments(prev => {
      const newDocuments = { ...prev };
      delete newDocuments[taskId];
      return newDocuments;
    });
  }, []);

  // Bulk load documents for multiple tasks
  const loadDocumentsForTasks = useCallback(async (taskIds: string[]) => {
    if (!organizationId || !siteId || !caseId) return;
    
    for (const taskId of taskIds) {
      try {
        const documents = (await fetchTaskDocuments(organizationId, siteId, caseId, taskId)).items;
        setTaskDocuments(prev => ({ ...prev, [taskId]: documents }));
      } catch (err) {
        console.error(`Error loading documents for task ${taskId}:`, err);
        setTaskDocuments(prev => ({ ...prev, [taskId]: [] }));
      }
    }
  }, [organizationId, siteId, caseId]);

  return {
    // State
    taskDocuments,
    loadingDocuments,
    uploadingDocument,

    // Actions
    fetchTaskDocumentsData,
    uploadDocument: handleDocumentUpload,
    deleteDocument: handleDeleteDocument,
    downloadTaskDocument: handleDownloadTaskDocument,
    clearTaskDocuments,
    loadDocumentsForTasks
  };
};