import axios from 'axios';
import { getToken } from '@/services/authServices';
import { 
  CaseClientRequest, 
  CaseClientResponse, 
  UpdateCaseClientRequest,
  ClientInvitationResponse,
  ClientAcceptInvitationRequest,
  ClientAcceptInvitationResponse,
  CaseTask, 
  CaseTaskResponse, 
  AddCaseTaskRequest, 
  UpdateCaseTaskRequest,
  TaskDocument,
  TaskDocumentResponse,
  AddTaskDocumentRequest,
  UpdateTaskDocumentRemarksRequest,
  CaseDocument,
  CaseDocumentResponse,
  AddCaseDocumentRequest,
  CaseHearing,
  CaseHearingResponse,
  AddCaseHearingRequest,
  UpdateCaseHearingRequest,
  CaseComment,
  AddCaseCommentRequest,
  AddCaseCommentReplyRequest,
  UpdateCaseCommentRequest,
  AddCaseCommentResponse,
  AddCaseCommentReplyResponse,
  CaseTaskComment,
  AddCaseTaskCommentRequest,
  AddCaseTaskCommentReplyRequest,
  UpdateCaseTaskCommentRequest,
  AddCaseTaskCommentResponse,
  AddCaseTaskCommentReplyResponse,
  CaseInvoice,
  CaseInvoiceResponse,
  AddCaseInvoiceRequest,
  UpdateCaseInvoiceRequest,
  UpdateCaseInvoicePaymentStatusRequest,
  CaseContributor,
  ContributorAccessLevel,
  AddCaseContributorRequest,
  UpdateCaseContributorRequest,
  AvailableUser
} from '../types/caseindex';
import type { PagedResponse, PageRequestParams } from '@/types/pagination';
import { normalizePage } from '@/utils/pagination';

const ORG_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + '/api/v1/organizations';

/**
 * Query params accepted by an in-scope case-scoped list endpoint: paging/sorting plus filter keys.
 * Per-domain filter typings (data-model Entity 5) tighten this in a later phase; for now the shape is
 * left open so every list accessor can accept its §6 filters without `any` (Principle I).
 */
export type ListParams = PageRequestParams & Record<string, unknown>;

// TEMPORARY WORKAROUND: Helper function to get appropriate token for task APIs
// This is a temporary solution for the backend bug where task APIs don't work for organization admins
// To use: Set NEXT_PUBLIC_TEMP_TASK_TOKEN environment variable with the working token
// To revert: Simply remove the NEXT_PUBLIC_TEMP_TASK_TOKEN environment variable
const getTaskToken = async (): Promise<string> => {
  // const tempToken = process.env.NEXT_PUBLIC_TEMP_TASK_TOKEN;
  // if (tempToken) {
  //   console.log('Using temporary task token for API calls');
  //   return tempToken;
  // }
  return (await getToken()) || '';
};

export const addClientToCase = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  clientData: CaseClientRequest
): Promise<CaseClientResponse> => {
  const token = await getToken();
  const response = await axios.post(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/caseclients`,
    clientData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 201 || status === 400,
    }
  );
  
  if (response.status !== 201) {
    throw new Error(response.data?.errors?.[0] || 'Failed to add client to case');
  }
  
  return response.data;
};

export const fetchCaseClients = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  params: ListParams = {}
): Promise<PagedResponse<CaseClientResponse>> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/caseclients`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );
  return normalizePage<CaseClientResponse>(response.data?.data);
};

export const fetchCaseClientById = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  clientId: string | number
): Promise<CaseClientResponse> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/caseclients/${clientId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 404,
    }
  );
  
  if (response.status === 404) {
    throw new Error('Client not found');
  }
  
  return response.data?.data || response.data;
};

export const updateCaseClient = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  clientId: string | number,
  clientData: UpdateCaseClientRequest
): Promise<CaseClientResponse> => {
  const token = await getToken();
  const response = await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/caseclients/${clientId}`,
    clientData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 400 || status === 404,
    }
  );
  
  if (response.status !== 200) {
    throw new Error(response.data?.errors?.[0] || 'Failed to update client');
  }
  
  return response.data;
};

export const deleteCaseClient = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  clientId: string | number
): Promise<void> => {
  const token = await getToken();
  const response = await axios.delete(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/caseclients/${clientId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 204 || status === 404,
    }
  );
  
  if (response.status !== 200 && response.status !== 204) {
    throw new Error(response.data?.errors?.[0] || 'Failed to delete client');
  }
};

export const inviteCaseClient = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  clientId: string | number
): Promise<ClientInvitationResponse> => {
  const token = await getToken();
  const response = await axios.post(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/caseclients/${clientId}/invite`,
    {},
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 400,
    }
  );
  
  if (response.status !== 200) {
    throw new Error(response.data?.errors?.[0] || 'Failed to invite client');
  }
  
  return response.data;
};

export const acceptCaseClientInvitation = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  caseClientId: string | number,
  invitationId: string,
  acceptanceData: ClientAcceptInvitationRequest
): Promise<ClientAcceptInvitationResponse> => {
  const token = await getToken();
  const response = await axios.post(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/caseclients/${caseClientId}/invitation/${invitationId}/accept`,
    acceptanceData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 400,
    }
  );
  
  if (response.status !== 200) {
    throw new Error(response.data?.errors?.[0] || 'Failed to accept invitation');
  }
  
  return response.data;
};

// Task management functions
export const fetchCaseTasks = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  params: ListParams = {}
): Promise<PagedResponse<CaseTask>> => {
  const token = await getTaskToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/tasks`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );
  return normalizePage<CaseTask>(response.data?.data);
};

export const addTaskToCase = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  taskData: AddCaseTaskRequest
): Promise<CaseTaskResponse> => {
  const token = await getTaskToken();
  const response = await axios.post(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/tasks`,
    taskData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 201 || status === 400,
    }
  );
  
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.errors?.[0] || 'Failed to add task to case');
  }
  
  return response.data;
};

export const updateCaseTask = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  taskId: string | number,
  taskData: UpdateCaseTaskRequest
): Promise<CaseTaskResponse> => {
  const token = await getTaskToken();
  const response = await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/tasks/${taskId}`,
    taskData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 400,
    }
  );
  
  if (response.status !== 200) {
    throw new Error(response.data?.errors?.[0] || 'Failed to update task');
  }
  
  return response.data;
};

export const deleteCaseTask = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  taskId: string | number
): Promise<void> => {
  const token = await getTaskToken();
  const response = await axios.delete(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/tasks/${taskId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 204 || status === 404,
    }
  );
  
  if (response.status !== 200 && response.status !== 204) {
    throw new Error(response.data?.errors?.[0] || 'Failed to delete task');
  }
};

export const fetchTasksByAssignee = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  assigneeId: string | number,
  params: ListParams = {}
): Promise<PagedResponse<CaseTask>> => {
  const token = await getTaskToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/tasks/assignee/${assigneeId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );
  return normalizePage<CaseTask>(response.data?.data);
};

// Task document management functions
export const fetchTaskDocuments = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  taskId: string | number,
  params: ListParams = {}
): Promise<PagedResponse<TaskDocument>> => {
  const token = await getTaskToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/tasks/${taskId}/documents`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );
  return normalizePage<TaskDocument>(response.data?.data);
};

export const addTaskDocument = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  taskId: string | number,
  documentData: AddTaskDocumentRequest
): Promise<TaskDocumentResponse> => {
  const token = await getTaskToken();
  const response = await axios.post(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/tasks/${taskId}/documents`,
    documentData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 201 || status === 400,
    }
  );
  
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.errors?.[0] || 'Failed to add document to task');
  }
  
  return response.data;
};

export const fetchTaskDocument = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  taskId: string | number,
  documentId: string | number
): Promise<TaskDocument> => {
  const token = await getTaskToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/tasks/${taskId}/documents/${documentId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 404,
    }
  );
  
  if (response.status === 404) {
    throw new Error('Document not found');
  }
  
  return response.data?.data || response.data;
};

export const deleteTaskDocument = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  taskId: string | number,
  documentId: string | number
): Promise<void> => {
  const token = await getTaskToken();
  const response = await axios.delete(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/tasks/${taskId}/documents/${documentId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 204 || status === 404,
    }
  );
  
  if (response.status !== 200 && response.status !== 204) {
    throw new Error(response.data?.errors?.[0] || 'Failed to delete document');
  }
};

export const updateTaskDocumentRemarks = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  taskId: string | number,
  documentId: string | number,
  remarksData: UpdateTaskDocumentRemarksRequest
): Promise<TaskDocumentResponse> => {
  const token = await getTaskToken();
  const response = await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/tasks/${taskId}/documents/${documentId}/remarks`,
    remarksData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 400,
    }
  );
  
  if (response.status !== 200) {
    throw new Error(response.data?.errors?.[0] || 'Failed to update document remarks');
  }
  
  return response.data;
};

// Case document management functions (for case-wide documents)
export const fetchCaseDocuments = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  params: ListParams = {}
): Promise<PagedResponse<CaseDocument>> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/documents`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );
  return normalizePage<CaseDocument>(response.data?.data);
};

export const addCaseDocument = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  documentData: AddCaseDocumentRequest
): Promise<CaseDocumentResponse> => {
  const token = await getTaskToken();
  const response = await axios.post(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/documents`,
    documentData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 201 || status === 400,
    }
  );
  
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.errors?.[0] || 'Failed to add document to case');
  }
  
  return response.data;
};

export const fetchCaseDocument = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  documentId: string | number
): Promise<CaseDocument> => {
  const token = await getTaskToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/documents/${documentId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 404,
    }
  );
  
  if (response.status === 404) {
    throw new Error('Document not found');
  }
  
  return response.data?.data || response.data;
};

export const deleteCaseDocument = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  documentId: string | number
): Promise<void> => {
  const token = await getTaskToken();
  const response = await axios.delete(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/documents/${documentId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 204 || status === 404,
    }
  );
  
  if (response.status !== 200 && response.status !== 204) {
    throw new Error(response.data?.errors?.[0] || 'Failed to delete document');
  }
};

// Case hearing APIs
export const fetchCaseHearings = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  params: ListParams = {}
): Promise<PagedResponse<CaseHearing>> => {
  const token = await getTaskToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/hearings`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );
  return normalizePage<CaseHearing>(response.data?.data);
};

export const addCaseHearing = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  hearingData: AddCaseHearingRequest
): Promise<CaseHearingResponse> => {
  const token = await getTaskToken();
  const response = await axios.post(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/hearings`,
    hearingData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  return response.data;
};

export const fetchCaseHearing = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  hearingId: string | number
): Promise<CaseHearing> => {
  const token = await getTaskToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/hearings/${hearingId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 404,
    }
  );
  
  if (response.status === 404) {
    throw new Error('Hearing not found');
  }
  
  return response.data?.data || response.data;
};

export const updateCaseHearing = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  hearingId: string | number,
  hearingData: UpdateCaseHearingRequest
): Promise<CaseHearingResponse> => {
  const token = await getTaskToken();
  const response = await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/hearings/${hearingId}`,
    hearingData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  return response.data;
};

export const deleteCaseHearing = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  hearingId: string | number
): Promise<void> => {
  const token = await getTaskToken();
  const response = await axios.delete(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/hearings/${hearingId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 204 || status === 404,
    }
  );
  
  if (response.status !== 200 && response.status !== 204) {
    throw new Error(response.data?.errors?.[0] || 'Failed to delete hearing');
  }
};

// Case comment APIs
export const fetchCaseComments = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  params: ListParams = {}
): Promise<PagedResponse<CaseComment>> => {
  const token = await getTaskToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/comments`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );
  return normalizePage<CaseComment>(response.data?.data);
};

export const addCaseComment = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  commentData: AddCaseCommentRequest
): Promise<AddCaseCommentResponse> => {
  const token = await getTaskToken();
  const response = await axios.post(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/comments`,
    commentData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 201 || status === 400,
    }
  );
  
  if (response.status !== 201) {
    throw new Error(response.data?.errors?.[0] || 'Failed to add comment');
  }
  
  return response.data;
};

export const addCaseCommentReply = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  parentCommentId: string,
  replyData: AddCaseCommentReplyRequest
): Promise<AddCaseCommentReplyResponse> => {
  const token = await getTaskToken();
  const response = await axios.post(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/comments/${parentCommentId}/reply`,
    replyData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 201 || status === 400,
    }
  );
  
  if (response.status !== 201) {
    throw new Error(response.data?.errors?.[0] || 'Failed to add reply');
  }
  
  return response.data;
};

export const fetchCaseComment = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  commentId: string
): Promise<CaseComment> => {
  const token = await getTaskToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/comments/${commentId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 404,
    }
  );
  
  if (response.status === 404) {
    throw new Error('Comment not found');
  }
  
  return response.data;
};

export const updateCaseComment = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  commentId: string,
  commentData: UpdateCaseCommentRequest
): Promise<void> => {
  const token = await getTaskToken();
  const response = await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/comments/${commentId}`,
    commentData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 204 || status === 400 || status === 404,
    }
  );
  
  if (response.status !== 204) {
    throw new Error(response.data?.errors?.[0] || 'Failed to update comment');
  }
};

export const deleteCaseComment = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  commentId: string
): Promise<void> => {
  const token = await getTaskToken();
  const response = await axios.delete(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/comments/${commentId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 204 || status === 404,
    }
  );
  
  if (response.status !== 204) {
    throw new Error(response.data?.errors?.[0] || 'Failed to delete comment');
  }
};

// Task comment APIs
export const fetchTaskComments = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  taskId: string | number,
  params: ListParams = {}
): Promise<PagedResponse<CaseTaskComment>> => {
  const token = await getTaskToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/tasks/${taskId}/comments`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );
  return normalizePage<CaseTaskComment>(response.data?.data);
};

export const addTaskComment = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  taskId: string | number,
  commentData: AddCaseTaskCommentRequest
): Promise<AddCaseTaskCommentResponse> => {
  const token = await getTaskToken();
  const response = await axios.post(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/tasks/${taskId}/comments`,
    commentData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 201 || status === 400,
    }
  );
  
  if (response.status !== 201) {
    throw new Error(response.data?.errors?.[0] || 'Failed to add task comment');
  }
  
  console.log('addTaskComment: API response data:', response.data);
  return response.data;
};

export const addTaskCommentReply = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  taskId: string | number,
  parentCommentId: string,
  replyData: AddCaseTaskCommentReplyRequest
): Promise<AddCaseTaskCommentReplyResponse> => {
  const token = await getTaskToken();
  const response = await axios.post(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/tasks/${taskId}/comments/${parentCommentId}/reply`,
    replyData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 201 || status === 400,
    }
  );
  
  if (response.status !== 201) {
    throw new Error(response.data?.errors?.[0] || 'Failed to add task comment reply');
  }
  
  return response.data;
};

export const fetchTaskComment = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  taskId: string | number,
  commentId: string
): Promise<CaseTaskComment> => {
  const token = await getTaskToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/tasks/${taskId}/comments/${commentId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 404,
    }
  );
  
  if (response.status === 404) {
    throw new Error('Task comment not found');
  }
  
  return response.data;
};

export const updateTaskComment = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  taskId: string | number,
  commentId: string,
  commentData: UpdateCaseTaskCommentRequest
): Promise<void> => {
  const token = await getTaskToken();
  const response = await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/tasks/${taskId}/comments/${commentId}`,
    commentData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 204 || status === 400 || status === 404,
    }
  );
  
  if (response.status !== 204) {
    throw new Error(response.data?.errors?.[0] || 'Failed to update task comment');
  }
};

export const deleteTaskComment = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  taskId: string | number,
  commentId: string
): Promise<void> => {
  const token = await getTaskToken();
  const response = await axios.delete(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/tasks/${taskId}/comments/${commentId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 204 || status === 404,
    }
  );
  
  if (response.status !== 204) {
    throw new Error(response.data?.errors?.[0] || 'Failed to delete task comment');
  }
};

// Case invoice APIs
export const fetchCaseInvoices = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  params: ListParams = {}
): Promise<PagedResponse<CaseInvoice>> => {
  const token = await getTaskToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/invoices`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );
  return normalizePage<CaseInvoice>(response.data?.data);
};

export const fetchCaseInvoice = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  invoiceId: string | number
): Promise<CaseInvoice> => {
  const token = await getTaskToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/invoices/${invoiceId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 404,
    }
  );
  
  if (response.status === 404) {
    throw new Error('Invoice not found');
  }
  
  return response.data?.data || response.data;
};

export const addCaseInvoice = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  invoiceData: AddCaseInvoiceRequest
): Promise<CaseInvoiceResponse> => {
  const token = await getTaskToken();
  const response = await axios.post(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/invoices`,
    invoiceData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 201 || status === 400,
    }
  );
  
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.errors?.[0] || 'Failed to add invoice to case');
  }
  
  return response.data;
};

export const updateCaseInvoice = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  invoiceId: string | number,
  invoiceData: UpdateCaseInvoiceRequest
): Promise<CaseInvoiceResponse> => {
  const token = await getTaskToken();
  const response = await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/invoices/${invoiceId}`,
    invoiceData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 400 || status === 404,
    }
  );
  
  if (response.status !== 200) {
    throw new Error(response.data?.errors?.[0] || 'Failed to update invoice');
  }
  
  return response.data;
};

export const updateCaseInvoicePaymentStatus = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  invoiceId: string | number,
  paymentStatusData: UpdateCaseInvoicePaymentStatusRequest
): Promise<void> => {
  const token = await getTaskToken();
  const response = await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/invoices/${invoiceId}/payment-status`,
    paymentStatusData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 400 || status === 404,
    }
  );
  
  if (response.status !== 200) {
    throw new Error(response.data?.errors?.[0] || 'Failed to update payment status');
  }
};

export const deleteCaseInvoice = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  invoiceId: string | number
): Promise<void> => {
  const token = await getTaskToken();
  const response = await axios.delete(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/invoices/${invoiceId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 204 || status === 404,
    }
  );
  
  if (response.status !== 200 && response.status !== 204) {
    throw new Error(response.data?.errors?.[0] || 'Failed to delete invoice');
  }
};

export interface ReferenceCaseItem {
  cnrNumber: string;
  caseDetails: { courtCaseData: Record<string, unknown> } | null;
}

export const fetchReferenceCases = async (
  organizationId: string,
  siteId: string,
  caseId: string
): Promise<ReferenceCaseItem[]> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/referencecases`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 404,
    }
  );
  if (response.status === 404) return [];
  const payload = response.data?.data;
  // New format: { caseId, referenceCases: [{ cnrNumber, caseDetails }] }
  if (Array.isArray(payload?.referenceCases)) {
    return payload.referenceCases.map((item: ReferenceCaseItem) => ({
      cnrNumber: item.cnrNumber,
      caseDetails: item.caseDetails ?? null,
    }));
  }
  // Legacy format: { cnrNumbers: string[] }
  const cnrNumbers: string[] = payload?.cnrNumbers ?? [];
  return cnrNumbers.map((cnr: string) => ({ cnrNumber: cnr, caseDetails: null }));
};

export const deleteReferenceCase = async (
  organizationId: string,
  siteId: string,
  caseId: string,
  cnrNumber: string
): Promise<string> => {
  const token = await getToken();
  const response = await axios.delete(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/referencecases/${encodeURIComponent(cnrNumber)}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data?.data?.message ?? 'Reference case removed successfully';
};

export const addReferenceCase = async (
  organizationId: string,
  siteId: string,
  caseId: string,
  cnrNumber: string
): Promise<string | null> => {
  const token = await getToken();
  const response = await axios.post(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/referencecases/${encodeURIComponent(cnrNumber)}`,
    {},
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 201 || status === 400,
    }
  );
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(
      response.data?.errors?.[0] ||
      response.data?.data?.message ||
      response.data?.message ||
      'Failed to add reference case'
    );
  }
  return response.data?.data?.message ?? null;
};

// ---------------------------------------------------------------------------
// Case contributors (feature 033)
// Maps SiteCaseContributorsController endpoints to the frontend service layer.
// 401 is handled by the shared Axios interceptor (refresh → logout).
// ---------------------------------------------------------------------------

/**
 * The API may serialize `accessLevel` as a string ("Edit" / "ViewOnly" /
 * "View-only") or as the numeric enum value. The UI compares it against the
 * numeric `ContributorAccessLevel` enum, so coerce every contributor to the
 * numeric form here at the service boundary.
 */
const normalizeAccessLevel = (level: unknown): ContributorAccessLevel => {
  if (typeof level === 'number') {
    return level === ContributorAccessLevel.Edit
      ? ContributorAccessLevel.Edit
      : ContributorAccessLevel.ViewOnly;
  }
  if (typeof level === 'string') {
    const normalized = level.trim().toLowerCase().replace(/[-_\s]/g, '');
    if (normalized === 'edit' || normalized === '1') {
      return ContributorAccessLevel.Edit;
    }
  }
  return ContributorAccessLevel.ViewOnly;
};

const normalizeContributor = (contributor: CaseContributor): CaseContributor => ({
  ...contributor,
  accessLevel: normalizeAccessLevel(contributor.accessLevel),
});

export const fetchCaseContributors = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  params: ListParams = {}
): Promise<PagedResponse<CaseContributor>> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/contributors`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );

  const page = normalizePage<CaseContributor>(response.data?.data);
  return { ...page, items: page.items.map(normalizeContributor) };
};

export const addCaseContributor = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  body: AddCaseContributorRequest
): Promise<CaseContributor> => {
  const token = await getToken();
  const response = await axios.post(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/contributors`,
    body,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 201 || status === 400,
    }
  );

  if (response.status !== 201) {
    throw new Error(response.data?.errors?.[0] ?? 'Failed to add contributor');
  }

  return normalizeContributor(response.data?.data);
};

export const updateCaseContributor = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  contributorId: string | number,
  body: UpdateCaseContributorRequest
): Promise<CaseContributor> => {
  const token = await getToken();
  const response = await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/contributors/${contributorId}`,
    body,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 400,
    }
  );

  if (response.status !== 200) {
    throw new Error(response.data?.errors?.[0] ?? 'Failed to update contributor');
  }

  return normalizeContributor(response.data?.data);
};

export const removeCaseContributor = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  contributorId: string | number
): Promise<void> => {
  const token = await getToken();
  const response = await axios.delete(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/contributors/${contributorId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 204,
    }
  );

  if (response.status !== 204) {
    throw new Error(response.data?.errors?.[0] ?? 'Failed to remove contributor');
  }
};

/**
 * Users eligible to be added as contributors to the case (feature 034).
 * The backend already excludes the creator, assignee, existing contributors,
 * and admins, so the picker can render this list as-is. A 404 (org/site/case
 * not found, or case not in the given site) is treated as an empty list.
 */
export const fetchAvailableContributorUsers = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  params: ListParams = {}
): Promise<PagedResponse<AvailableUser>> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/contributors/available-users`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );

  return normalizePage<AvailableUser>(response.data?.data);
};