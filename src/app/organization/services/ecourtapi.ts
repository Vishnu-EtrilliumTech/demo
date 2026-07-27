import axios from 'axios';
import { getToken } from '@/services/authServices';
import { CourtDataApiResponse } from '../types/ecourtTypes';
import type { PagedResponse, PageRequestParams } from '@/types/pagination';
import { normalizePage } from '@/utils/pagination';

const ORG_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + '/api/v1/organizations';

/**
 * Query params accepted by an in-scope eCourts list endpoint: paging/sorting plus filter keys.
 * Per-domain filter typings (data-model Entity 5) tighten this in a later phase; for now the shape is
 * left open so each list accessor can accept its §6 filters without `any` (Principle I).
 */
export type ListParams = PageRequestParams & Record<string, unknown>;
const ECOURTS_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + '/api/v1/ecourts';
const COURT_LOCATIONS_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + '/api/v1/court-locations';

export interface CourtLocationSearchResult {
  id: string;
  courtName?: string;
  courtComplexName?: string;
  districtName: string;
  stateName: string;
  isHighCourtOrSupreme: boolean;
  /** Ready-to-render label for the picker dropdown. */
  display: string;
}

/** Unpaged — the backend returns every match for the search so the dropdown isn't capped. */
export const searchCourtLocations = async (
  search: string
): Promise<PagedResponse<CourtLocationSearchResult>> => {
  const token = await getToken();
  const response = await axios.get(COURT_LOCATIONS_API_BASE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    params: { search },
  });
  return normalizePage<CourtLocationSearchResult>(response.data?.data);
};

export interface CourtState {
  code: string;
  name: string;
}

export interface CourtDistrict {
  code: string;
  name: string;
}

export const fetchCauselistStates = async (): Promise<CourtState[]> => {
  const token = await getToken();
  const response = await axios.get(`${ECOURTS_API_BASE_URL}/states`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data?.data ?? [];
};

export const fetchCauselistDistricts = async (stateCode: string): Promise<CourtDistrict[]> => {
  const token = await getToken();
  const response = await axios.get(`${ECOURTS_API_BASE_URL}/states/${stateCode}/districts`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data?.data ?? [];
};

export interface CourtComplex {
  code: string;
  name: string;
}

export interface Court {
  code: string;
  name: string;
}

export const fetchCauselistComplexes = async (stateCode: string, districtCode: string): Promise<CourtComplex[]> => {
  const token = await getToken();
  const response = await axios.get(`${ECOURTS_API_BASE_URL}/districts/${districtCode}/complexes`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    params: { stateCode },
  });
  return response.data?.data ?? [];
};

export const fetchCauselistCourts = async (stateCode: string, districtCode: string, complexCode: string): Promise<Court[]> => {
  const token = await getToken();
  const response = await axios.get(`${ECOURTS_API_BASE_URL}/complexes/${complexCode}/courts`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    params: { stateCode, districtCode },
  });
  return response.data?.data ?? [];
};

export type EcourtsSearchType =
  | 'query'
  | 'party'
  | 'filingNumber'
  | 'fir'
  | 'advocates'
  | 'petitioners'
  | 'judges'
  | 'respondents'
  | 'litigants';

export interface EcourtsSearchParams {
  searchType: EcourtsSearchType;
  searchValue: string;
  caseType?: string;
  caseStatus?: 'pending' | 'disposed';
  stateCode?: string;
  districtCode?: string;
  courtCode?: string;
  filingYear?: string;
  page?: number;
  pageSize?: number;
}

export interface EcourtsSearchResult {
  cnr: string;
  caseType: string;
  caseStatus: string;
  filingDate: string | null;
  nextHearingDate: string | null;
  registrationNumber: string | null;
  registrationDate: string | null;
  decisionDate: string | null;
  judges: string[];
  petitioners: string[];
  respondents: string[];
  petitionerAdvocates: string[];
  courtCode: string;
  judicialSection: string;
  stateCode: string;
  districtCode: number | null;
  caseCategory: string;
}

export const searchEcourts = async (
  organizationId: string,
  params: EcourtsSearchParams
): Promise<PagedResponse<EcourtsSearchResult>> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/ecourts/search`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );
  return normalizePage<EcourtsSearchResult>(response.data?.data);
};

export const fetchCaseCourtData = async (
  organizationId: string,
  cnrNumber: string
): Promise<CourtDataApiResponse | null> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/cnr/${cnrNumber}/courtdata/case`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 404,
    }
  );
  if (!response.data?.data) {
    const apiError = response.data?.errors?.[0];
    throw new Error(apiError ?? 'Case not found.');
  }
  return response.data;
};

export const updateCaseCourtData = async (
  organizationId: string,
  cnrNumber: string
): Promise<CourtDataApiResponse> => {
  const token = await getToken();
  const response = await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/cnr/${cnrNumber}/courtdata`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

export const downloadCourtDocument = async (
  organizationId: string,
  siteId: string,
  caseId: string,
  orderFilename: string
): Promise<Blob> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/courtdata/orders/${encodeURIComponent(orderFilename)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
    }
  );
  return response.data as Blob;
};

export const fetchCnrCourtData = async (
  organizationId: string,
  cnrNumber: string
): Promise<CourtDataApiResponse> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/cnr/${cnrNumber}/courtdata`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      validateStatus: (status: number) => status === 200 || status === 404,
    }
  );
  if (response.status !== 200) {
    const apiError = response.data?.errors?.[0];
    throw new Error(apiError ?? 'Failed to fetch court data');
  }
  return response.data;
};

export const updateCnrCourtData = async (
  organizationId: string,
  cnrNumber: string
): Promise<CourtDataApiResponse> => {
  const token = await getToken();
  const response = await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/cnr/${cnrNumber}/courtdata`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

export const downloadCnrCourtDocument = async (
  organizationId: string,
  cnrNumber: string,
  orderUrl: string
): Promise<Blob> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/cnr/${cnrNumber}/courtdata/files/${encodeURIComponent(orderUrl)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
    }
  );
  return response.data as Blob;
};

export const activateCnrCourtData = async (
  organizationId: string,
  cnrNumber: string,
  remarks?: string
): Promise<{ data: { message: string }; errors: string[]; meta: Record<string, unknown> }> => {
  const token = await getToken();
  const trimmed = remarks?.trim();
  const response = await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/cnr/${cnrNumber}/courtdata/retain`,
    trimmed ? { remarks: trimmed } : {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

export const fetchPersistedEcourtCases = async (
  organizationId: string,
  params: ListParams = {}
): Promise<PagedResponse<import('../types/ecourtTypes').PersistedEcourtCase>> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/courtdata/persisted`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );
  return normalizePage<import('../types/ecourtTypes').PersistedEcourtCase>(response.data?.data);
};

export interface EcourtsQuota {
  organizationId: number;
  monthlyLimit: number;
  consumedCount: number;
  remainingCount: number;
  periodStart: string;
  isExhausted: boolean;
  isWarning: boolean;
  isUnlimited: boolean;
}

export const fetchEcourtsQuota = async (
  organizationId: string
): Promise<EcourtsQuota> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/ecourts/quota`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.data;
};

export const linkCnrCourtData = async (
  organizationId: string,
  siteId: string,
  caseId: string,
  cnrNumber: string
): Promise<void> => {
  const token = await getToken();
  await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/cnr/${encodeURIComponent(cnrNumber)}/linkcourtdata`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
};
export const fetchUnlinkedCases = async (
  organizationId: string,
  params: ListParams = {}
): Promise<PagedResponse<import('../types/ecourtTypes').UnlinkedCase>> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/cases/unlinked`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );
  return normalizePage<import('../types/ecourtTypes').UnlinkedCase>(response.data?.data);
};

export const fetchSearchHistory = async (
  organizationId: string,
  params: ListParams = {}
): Promise<PagedResponse<import('../types/ecourtTypes').SearchHistoryItem>> => {
  const token = await getToken();
  const response = await axios.get(
    `${ORG_API_BASE_URL}/${organizationId}/ecourts/search-history`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    }
  );
  return normalizePage<import('../types/ecourtTypes').SearchHistoryItem>(response.data?.data);
};

export interface UpdateECourtsRemarksResponse {
  success: boolean;
  message: string;
  remarks: string | null;
}

export const updatePersistedCaseRemarks = async (
  organizationId: string,
  cnrNumber: string,
  remarks: string
): Promise<UpdateECourtsRemarksResponse> => {
  const token = await getToken();
  const response = await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/courtdata/persisted/${encodeURIComponent(cnrNumber)}/remarks`,
    { remarks },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data?.data;
};

export interface DeletePersistedECourtsResultItem {
  cnrNumber: string;
  status: 'Deleted' | 'NotFound' | 'Conflict' | 'Forbidden';
  message: string | null;
}

export interface DeletePersistedECourtsResponse {
  success: boolean;
  message: string;
  deletedCount: number;
  failedCount: number;
  results: DeletePersistedECourtsResultItem[];
}

export const deletePersistedEcourtCase = async (
  organizationId: string,
  cnrNumbers: string[]
): Promise<DeletePersistedECourtsResponse> => {
  const token = await getToken();
  try {
    const response = await axios.delete(
      `${ORG_API_BASE_URL}/${organizationId}/courtdata/persisted`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: { cnrNumbers },
      }
    );
    return response.data?.data as DeletePersistedECourtsResponse;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const errors: string[] | undefined = err.response?.data?.errors;
      if (errors && errors.length > 0) {
        throw new Error(errors[0]);
      }
    }
    throw err;
  }
};