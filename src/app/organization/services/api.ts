import axios from 'axios';
import { getToken } from '@/services/authServices';
import { Organization, Site, User, Case, Task, Hearing, OrganizationRegistrationPayload, Invoice, AddInvoiceRequest, UpdateInvoiceRequest, UpdateInvoicePaymentStatusRequest, UserBasicInfo, CaseStatus, CaseSummary } from '../types';
import type { PagedResponse, PageRequestParams } from '@/types/pagination';
import { normalizePage } from '@/utils/pagination';

/**
 * Query params accepted by an in-scope list endpoint: paging/sorting plus arbitrary filter keys.
 * Per-domain filter typings (data-model Entity 5) tighten this in a later phase; for now the shape is
 * left open so every list accessor can accept its §6 filters without `any` (Principle I).
 */
export type ListParams = PageRequestParams & Record<string, unknown>;

const ORG_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + '/api/v1/organizations';

export const fetchOrganization = async (
  id: string
): Promise<Organization> => {
  const token = await getToken();
  const response = await axios.get(`${ORG_API_BASE_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  const apiData = response.data;
  const orgPayload = apiData?.data?.data || apiData?.data || apiData;

  if (!orgPayload || typeof orgPayload !== 'object') {
    console.error('Invalid organization data received from API:', orgPayload);
    throw new Error('Invalid organization data received from API');
  }

  return {
    id: orgPayload.id || '',
    name: orgPayload.name || '',
    description: orgPayload.description || '',
    segments: Array.isArray(orgPayload.segments) ? orgPayload.segments : [],
    phoneNumber: orgPayload.phoneNumber || 0,
    emailId: orgPayload.emailId || orgPayload.email || '',
    organizationKey: orgPayload.organizationKey || '',
    createdDate: orgPayload.createdDate || orgPayload.createdAt || new Date().toISOString(),
    updatedDate: orgPayload.updatedDate || new Date().toISOString(),
    enabled: orgPayload.enabled || false,
    currentUser: orgPayload.currentUser || {
      id: '',
      fullName: '',
      emailId: '',
      enabled: false,
      roles: [],
      registeredDate: new Date().toISOString(),
      lastLoginDate: new Date().toISOString(),
      phoneNumber: 0,
    }
  };
};

export const updateOrganization = async (
  id: string,
  data: Partial<Organization>
): Promise<Organization> => {
  const token = await getToken();
  const response = await axios.put(
    `${ORG_API_BASE_URL}/${id}`,
    data,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const apiData = response.data;
  const orgPayload = apiData?.data?.data || apiData?.data || apiData;

  // Per contracts/id-response-contracts.md §2: the organization-update response
  // labels the org's own identifier with a non-standard field name — normalize
  // whichever candidate the backend actually sends into `.id` so callers can
  // keep reading `result.id` without knowing about the quirk.
  const normalizedId = orgPayload?.id || orgPayload?.organizationId || orgPayload?.organizationGuid || id;

  return { ...orgPayload, id: normalizedId };
};

export const fetchOrganizationUsers = async (
  organizationId: string,
  params: ListParams = {}
): Promise<PagedResponse<User>> => {
  const token = await getToken();
  if (process.env.NODE_ENV === 'development' && !token) {
    console.warn('[fetchOrganizationUsers] getToken() returned null — request will likely fail with 401');
  }
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/users`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params,
    }
  );
  if (process.env.NODE_ENV === 'development') {
    console.log('[fetchOrganizationUsers] response.data:', response.data);
  }
  return normalizePage<User>(response.data?.data);
};

export const fetchUser = async (
  organizationId: string,
  userId: string | number
): Promise<User> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/users/${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data?.data || response.data;
};

interface CreateUserPayload {
  fullName: string;
  emailId: string;
  phoneNumber?: string;
  gender?: string;
  roles: string[];
  organizationId: string;
  enabled?: boolean;
}

export const createUser = async (
  organizationId: string,
  userData: Omit<CreateUserPayload, 'organizationId'>
): Promise<User> => {
  try {
    const token = await getToken();
    const payload: CreateUserPayload = {
      ...userData,
      organizationId,
      enabled: true
    };

    const response = await axios.post(
      `${ORG_API_BASE_URL}/${organizationId}/users`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );
    return response.data?.data || response.data;
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (
  organizationId: string,
  userId: string | number,
  userData: Partial<User>
): Promise<User> => {
  const token = await getToken();
  const payload = {
    ...userData,
    enabled: true
  };
  const response = await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/users/${userId}`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    }
  );
  return response.data?.data || response.data;
};

export const fetchSite = async (
  organizationId: string,
  siteId: string
): Promise<Site> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}`,
    { 
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json' 
      }
    }
  );
  return response.data?.data || response.data;
};

export const fetchOrganizationSites = async (
  organizationId: string,
  params: ListParams = {}
): Promise<PagedResponse<Site>> => {
  const token = await getToken();
  if (process.env.NODE_ENV === 'development' && !token) {
    console.warn('[fetchOrganizationSites] getToken() returned null — request will likely fail with 401');
  }
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params,
    }
  );
  if (process.env.NODE_ENV === 'development') {
    console.log('[fetchOrganizationSites] response.data:', response.data);
  }
  return normalizePage<Site>(response.data?.data);
};

export const fetchOrganizationHearings = async (
  organizationId: string,
  params: ListParams = {}
): Promise<PagedResponse<Hearing>> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/hearings`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params,
    }
  );
  return normalizePage<Hearing>(response.data?.data);
}

export const fetchSiteHearings = async (
  organizationId: string,
  siteId: string,
  params: ListParams = {}
): Promise<PagedResponse<Hearing>> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/hearings`,
    {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      params,
    }
  );
  return normalizePage<Hearing>(response.data?.data);
};

export const createSite = async (
  organizationId: string,
  siteData: Partial<Site>
): Promise<Site> => {
  const token = await getToken();
  const response = await axios.post(
    `${ORG_API_BASE_URL}/${organizationId}/sites`,
    siteData,
    { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    }
  );
  return response.data?.data || response.data;
};

export const updateSite = async (
  organizationId: string,
  siteId: string,
  siteData: Partial<Site>
): Promise<Site> => {
  const token = await getToken();
  const response = await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}`,
    siteData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      validateStatus: (status: number) => status === 200 || status === 400,
    }
  );
  if (response.status === 400) {
    const errors = response.data?.errors;
    let errorMessage = 'Failed to update site. Please check your input.';

    // Handle array format: {"data":null,"errors":["message"],"meta":{}}
    if (Array.isArray(errors) && errors.length > 0) {
      errorMessage = errors.join(', ');
    }
    // Handle ASP.NET Core validation format: {"errors":{"FieldName":["error message"]}}
    else if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
      const errorMessages: string[] = [];
      Object.entries(errors).forEach(([, messages]) => {
        if (Array.isArray(messages)) {
          errorMessages.push(...messages);
        }
      });
      if (errorMessages.length > 0) {
        errorMessage = errorMessages.join(', ');
      }
    }
    // Handle title/message format
    else if (response.data?.title || response.data?.message) {
      errorMessage = response.data.title || response.data.message;
    }

    // Create an error that includes the response data for field-specific error handling
    const error = new Error(errorMessage) as Error & { response?: { data: unknown; status: number } };
    error.response = { data: response.data, status: response.status };
    throw error;
  }
  const sitePayload = response.data?.data || response.data;

  // Per contracts/id-response-contracts.md §3: same non-standard identifier
  // field-naming quirk as the organization-update response — normalize
  // whichever candidate the backend sends into `.id` for callers.
  const normalizedId = sitePayload?.id || sitePayload?.siteId || sitePayload?.siteGuid || siteId;

  return { ...sitePayload, id: normalizedId };
};

export const fetchSiteUsers = async (
  organizationId: string,
  siteId: string,
  params: ListParams = {}
): Promise<PagedResponse<User>> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/users`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );
  return normalizePage<User>(response.data?.data);
};

export const fetchSiteUser = async (
  organizationId: string,
  siteId: string,
  userId: string | number
): Promise<User> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/users/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status) => status === 200 || status === 404,
    }
  );
  if (response.status === 404) throw new Error('User not found');
  return response.data?.data || response.data;
};

/**
 * Fetches only the user's full name using the minimal /basic endpoint.
 * Works for both organization users and site users.
 * Returns only { id, fullName } to prevent data leakage.
 */
export const fetchUserBasicInfo = async (
  organizationId: string,
  userId: string
): Promise<UserBasicInfo> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/users/${userId}/basic`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status) => status === 200 || status === 404 || status === 403,
    }
  );
  if (response.status === 404) {
    console.warn(`User ${userId} not found in organization ${organizationId}`);
    return { id: userId, fullName: 'Unknown User' };
  }
  if (response.status === 403) {
    console.warn(`Permission denied to fetch user ${userId} basic info in organization ${organizationId}`);
    return { id: userId, fullName: 'Unknown User' };
  }
  return response.data?.data || response.data;
};

// Update a user at the site level
export const updateSiteUser = async (
  organizationId: string,
  siteId: string,
  userId: string | number,
  userData: Partial<User>
): Promise<User> => {
  const token = await getToken();
  const payload = {
    ...userData,
    enabled: true
  };
  const response = await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/users/${userId}`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data?.data || response.data;
};



export const fetchOrganizationCases = async (
  organizationId: string,
  params: ListParams = {}
): Promise<PagedResponse<Case>> => {
  const token = await getToken();
  if (process.env.NODE_ENV === 'development' && !token) {
    console.warn('[fetchOrganizationCases] getToken() returned null — request will likely fail with 401');
  }
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/cases`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );
  if (process.env.NODE_ENV === 'development') {
    console.log('[fetchOrganizationCases] response.data:', response.data);
  }
  return normalizePage<Case>(response.data?.data);
};

export const fetchSiteCases = async (
  organizationId: string,
  siteId: string,
  params: ListParams = {}
): Promise<PagedResponse<Case>> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );
  return normalizePage<Case>(response.data?.data);
};

// Create a new case for a site
export const createCase = async (
  organizationId: string,
  siteId: string,
  caseData: {
    title: string;
    description?: string;
    caseNumber: string;
    cnrNumber: string;
    assignedToId: string;
  }
): Promise<Case> => {
  const token = await getToken();
  const response = await axios.post(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases`,
    caseData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 201 || status === 400,
    }
  );
  if (response.status !== 201) {
    throw new Error(response.data?.errors?.[0] || 'Failed to create case');
  }
  return response.data?.data || response.data;
};

// Update a case for a site
/**
 * Updates a case with the provided data.
 * @param organizationId - The organization ID
 * @param siteId - The site ID
 * @param caseId - The case ID to update
 * @param caseData - The case data to update, including:
 *   - title: Case title (optional in update)
 *   - description: Case description (optional)
 *   - caseNumber: Case number (required)
 *   - status: Case status (required - Open, InProgress, OnHold, Closed)
 *   - assignedToId: ID of the user assigned to the case (required)
 * @returns Promise<Case> - The updated case data
 */
export const updateCase = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  caseData: {
    title: string;
    description?: string;
    caseNumber: string;
    cnrNumber: string;
    status: CaseStatus;
    assignedToId: string;
  }
): Promise<Case> => {
  const token = await getToken();
  const response = await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}`,
    caseData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 400,
    }
  );
  if (response.status === 400) {
    const errors = response.data?.errors;
    let errorMessage = 'Failed to update case. Please check your input.';

    // Handle array format: {"data":null,"errors":["message"],"meta":{}}
    if (Array.isArray(errors) && errors.length > 0) {
      errorMessage = errors.join(', ');
    }
    // Handle ASP.NET Core validation format: {"errors":{"FieldName":["message"]}}
    else if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
      const errorMessages: string[] = [];
      Object.entries(errors).forEach(([, messages]) => {
        if (Array.isArray(messages)) {
          errorMessages.push(...messages);
        }
      });
      if (errorMessages.length > 0) {
        errorMessage = errorMessages.join(', ');
      }
    }

    // Create error with response data for field-specific error extraction
    const error = new Error(errorMessage) as Error & { response?: { data: unknown; status: number } };
    error.response = { data: response.data, status: response.status };
    throw error;
  }
  return response.data?.data || response.data;
};

// Fetch a single case for a site
export const fetchCase = async (
  organizationId: string,
  siteId: string,
  caseId: string | number
): Promise<Case> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 404,
    }
  );
  if (response.status === 404) throw new Error('Case not found');
  const caseData = response.data?.data || response.data;
  const hasCnrNumber = response.data?.meta?.hasCnrNumber !== 'false';
  return { ...caseData, hasCnrNumber };
};

// Delete a case for a site
export const deleteCase = async (
  organizationId: string,
  siteId: string,
  caseId: string | number
): Promise<void> => {
  const token = await getToken();
  const response = await axios.delete(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 204 || status === 404 || status === 403 || status === 400,
    }
  );
  if (response.status === 404) {
    throw new Error('Case not found');
  }
  if (response.status === 403) {
    throw new Error('Not authorized to delete this case');
  }
  if (response.status === 400) {
    // Extract error message from backend response format: {"data":null,"errors":["message"],"meta":{}}
    const errors = response.data?.errors;
    const errorMessage = (Array.isArray(errors) && errors.length > 0)
      ? errors[0]
      : (response.data?.message || response.data?.error || 'Invalid request. Unable to delete this case.');
    throw new Error(errorMessage);
  }
};

// Delete an organization user
export const deleteOrganizationUser = async (
  organizationId: string,
  userId: string | number
): Promise<void> => {
  const token = await getToken();
  const response = await axios.delete(
    `${ORG_API_BASE_URL}/${organizationId}/users/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 204 || status === 404 || status === 403 || status === 400,
    }
  );
  if (response.status === 404) {
    throw new Error('User not found');
  }
  if (response.status === 403) {
    throw new Error('Not authorized to delete this user');
  }
  if (response.status === 400) {
    // Extract error message from backend response format: {"data":null,"errors":["message"],"meta":{}}
    const errors = response.data?.errors;
    const errorMessage = (Array.isArray(errors) && errors.length > 0)
      ? errors[0]
      : (response.data?.message || response.data?.error || 'Invalid request. Unable to delete this user.');
    throw new Error(errorMessage);
  }
};

// Delete a site
export const deleteSite = async (
  organizationId: string,
  siteId: string | number
): Promise<void> => {
  const token = await getToken();
  const response = await axios.delete(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 204 || status === 404 || status === 403 || status === 400,
    }
  );
  if (response.status === 404) {
    throw new Error('Site not found');
  }
  if (response.status === 403) {
    throw new Error('Not authorized to delete this site');
  }
  if (response.status === 400) {
    // Extract error message from backend response format: {"data":null,"errors":["message"],"meta":{}}
    const errors = response.data?.errors;
    const errorMessage = (Array.isArray(errors) && errors.length > 0)
      ? errors[0]
      : (response.data?.message || response.data?.error || 'Invalid request. Unable to delete this site.');
    throw new Error(errorMessage);
  }
};

// Delete a site user
export const deleteSiteUser = async (
  organizationId: string,
  siteId: string | number,
  userId: string | number
): Promise<void> => {
  const token = await getToken();
  const response = await axios.delete(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/users/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 204 || status === 404 || status === 403 || status === 400,
    }
  );
  if (response.status === 404) {
    throw new Error('User not found');
  }
  if (response.status === 403) {
    throw new Error('Not authorized to delete this user');
  }
  if (response.status === 400) {
    // Extract error message from backend response format: {"data":null,"errors":["message"],"meta":{}}
    const errors = response.data?.errors;
    const errorMessage = (Array.isArray(errors) && errors.length > 0)
      ? errors[0]
      : (response.data?.message || response.data?.error || 'Invalid request. Unable to delete this user.');
    throw new Error(errorMessage);
  }
};

export const registerOrganization = async (
  payload: OrganizationRegistrationPayload
): Promise<{ data: unknown; status: number }> => {
  const token = await getToken();
  const response = await axios.post(
    ORG_API_BASE_URL,
    payload,
    {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      validateStatus: (status) => status === 201 || status === 400,
    }
  );
  return response;
};

export const checkOrgKeyAvailability = async (
  key: string
): Promise<boolean> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/keys/${encodeURIComponent(key)}/availability`,
    {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: (status) => status === 200,
    }
  );
  return response.data?.data?.isAvailable ?? false;
};

export const checkSiteKeyAvailability = async (
  organizationId: string,
  key: string
): Promise<boolean> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/keys/${encodeURIComponent(key)}/availability`,
    {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: (status) => status === 200 || status === 404,
    }
  );
  if (response.status === 404) return false;
  return response.data?.data?.isAvailable ?? false;
};

export const fetchOrganizationByUserEmail = async (
  email: string
): Promise<Organization | null> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/users/${email}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: (status) => status === 200 || status === 404 || status === 403,
    }
  );

  if (response.status === 200) {
    return response.data?.data || null;
  }
  return null;
};

export const fetchLegalExpertByEmail = async (
  email: string
): Promise<User | null> => {
  const token = await getToken();
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  const response = await axios.get(
    `${base}/api/v1/legalexperts/email/${encodeURIComponent(email)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: (status) => status === 200 || status === 404 || status === 403,
    }
  );
  if (response.status === 200) {
    return response.data?.data || response.data || null;
  }
  return null;
};

export const fetchOrganizationUserSites = async (
  organizationId: string,
  userId: string | number,
  params: ListParams = {}
): Promise<PagedResponse<Site>> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/users/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );
  const page = normalizePage<Site>(response.data?.data);
  // Ensure each site has the organizationId
  return {
    ...page,
    items: page.items.map((site) => ({
      ...site,
      organizationId: site.organizationId || organizationId,
    })),
  };
};

export const fetchSiteUserCases = async (
  organizationId: string,
  siteId: string,
  params: ListParams = {}
): Promise<PagedResponse<Case>> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );
  return normalizePage<Case>(response.data?.data);
};

export interface UserCaseSummary {
  cases: Case[];
  caseTasks: Task[];
  caseHearings: Hearing[];
}

// The cases/summary endpoint reports hearing location/notes under different
// field names (`where`/`notes`) than the site/org hearing endpoints
// (`hearingLocation`/`hearingNotes`), and omits `caseName` entirely.
type RawSummaryHearing = Hearing & { where?: string; notes?: string };

export const fetchUserCaseSummary = async (
  organizationId: string | number,
  userId: string | number
): Promise<UserCaseSummary> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/users/${userId}/cases/summary`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  const raw = response.data?.data || response.data || { cases: [], caseTasks: [], caseHearings: [] };
  const cases: Case[] = raw.cases || [];
  const caseLookup = new Map(cases.map((c) => [String(c.id), c]));

  const caseHearings: Hearing[] = (raw.caseHearings || []).map((h: RawSummaryHearing) => {
    const relatedCase = caseLookup.get(String(h.caseId));
    return {
      ...h,
      hearingLocation: h.hearingLocation ?? h.where,
      hearingNotes: h.hearingNotes ?? h.notes,
      caseName: h.caseName || relatedCase?.caseNumber || relatedCase?.caseKey || relatedCase?.title,
    };
  });

  return { cases, caseTasks: raw.caseTasks || [], caseHearings };
};

export const createSiteUser = async (
  organizationId: string,
  siteId: string,
  userData: {
    fullName: string;
    emailId: string;
    phoneNumber: string;
    gender: string;
    roles: string[];
  }
): Promise<unknown> => {
  const token = await getToken();
  const payload = {
    ...userData,
    enabled: true
  };
  const response = await axios.post(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/users`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

// Delete an organization
export const deleteOrganization = async (
  organizationId: string
): Promise<void> => {
  const token = await getToken();
  const response = await axios.delete(
    `${ORG_API_BASE_URL}/${organizationId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 204 || status === 404 || status === 403 || status === 400,
    }
  );
  if (response.status === 404) {
    throw new Error('Organization not found');
  }
  if (response.status === 403) {
    throw new Error('Not authorized to delete this organization');
  }
  if (response.status === 400) {
    // Extract error message from backend response format: {"data":null,"errors":["message"],"meta":{}}
    const errors = response.data?.errors;
    const errorMessage = (Array.isArray(errors) && errors.length > 0)
      ? errors[0]
      : (response.data?.message || response.data?.error || 'Invalid request. Unable to delete this organization.');
    throw new Error(errorMessage);
  }
};

// Invoice API Functions

// Fetch all invoices for a case
export const fetchCaseInvoices = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  params: ListParams = {}
): Promise<PagedResponse<Invoice>> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/invoices`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );
  return normalizePage<Invoice>(response.data?.data);
};

// Fetch a single invoice by ID
export const fetchInvoice = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  invoiceId: string | number
): Promise<Invoice> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/invoices/${invoiceId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status) => status === 200 || status === 404,
    }
  );
  if (response.status === 404) throw new Error('Invoice not found');
  return response.data?.data || response.data;
};

// Add a new invoice to a case
export const addInvoice = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  invoiceData: AddInvoiceRequest
): Promise<Invoice> => {
  const token = await getToken();
  const response = await axios.post(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/invoices`,
    invoiceData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 201 || status === 400,
    }
  );
  if (response.status === 400) {
    throw new Error(response.data?.errors?.[0] || 'Failed to add invoice');
  }
  return response.data?.data || response.data;
};

// Update an existing invoice
export const updateInvoice = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  invoiceId: string | number,
  invoiceData: UpdateInvoiceRequest
): Promise<Invoice> => {
  const token = await getToken();
  const response = await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/invoices/${invoiceId}`,
    invoiceData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 400,
    }
  );
  if (response.status === 400) {
    throw new Error(response.data?.errors?.[0] || 'Failed to update invoice');
  }
  return response.data?.data || response.data;
};

// Update invoice payment status
export const updateInvoicePaymentStatus = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  invoiceId: string | number,
  paymentStatusData: UpdateInvoicePaymentStatusRequest
): Promise<void> => {
  const token = await getToken();
  const response = await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/invoices/${invoiceId}/payment-status`,
    paymentStatusData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 400,
    }
  );
  if (response.status === 400) {
    throw new Error(response.data?.errors?.[0] || 'Failed to update payment status');
  }
};

// Delete an invoice
export const deleteInvoice = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  invoiceId: string | number
): Promise<void> => {
  const token = await getToken();
  const response = await axios.delete(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/invoices/${invoiceId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 204 || status === 404 || status === 403 || status === 400,
    }
  );
  if (response.status === 404) {
    throw new Error('Invoice not found');
  }
  if (response.status === 403) {
    throw new Error('Not authorized to delete this invoice');
  }
  if (response.status === 400) {
    // Extract error message from backend response format: {"data":null,"errors":["message"],"meta":{}}
    const errors = response.data?.errors;
    const errorMessage = (Array.isArray(errors) && errors.length > 0)
      ? errors[0]
      : (response.data?.message || response.data?.error || 'Invalid request. Unable to delete this invoice.');
    throw new Error(errorMessage);
  }
};

// Fetch current user details
export const fetchCurrentUser = async (): Promise<User> => {
  const token = await getToken();
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  const response = await axios.get(
    `${base}/api/v1/users/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status) => status === 200 || status === 404,
    }
  );
  if (response.status === 404) throw new Error('User not found');
  return response.data?.data || response.data;
};

// Fetch AI-powered case summary
export const fetchCaseSummary = async (
  organizationId: string,
  siteId: string,
  caseId: string | number
): Promise<CaseSummary> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/summary`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status) => status === 200 || status === 404 || status === 403,
    }
  );
  if (response.status === 404) throw new Error('Case summary not found');
  if (response.status === 403) throw new Error('Not authorized to view case summary');
  return response.data?.data || response.data;
};

// Send AI chat message for a case
export const sendCaseChatMessage = async (
  organizationId: string,
  siteId: string,
  caseId: string | number,
  message: string
): Promise<{ response: string; timestamp: string }> => {
  const token = await getToken();
  const response = await axios.post(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/chat`,
    { message },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status) => status === 200 || status === 404 || status === 403,
    }
  );
  if (response.status === 404) throw new Error('Case not found');
  if (response.status === 403) throw new Error('Not authorized to chat about this case');
  return response.data?.data || response.data;
};
