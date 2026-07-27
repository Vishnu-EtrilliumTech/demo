import axios from 'axios';
import { getToken } from '@/services/authServices';
import type { PagedResponse, PageRequestParams } from '@/types/pagination';
import { normalizePage } from '@/utils/pagination';
import type {
  LegalExpertListItem,
  ClientListItem,
  AppointmentListItem,
  PaymentListItem,
  RatingListItem,
  LegalExpertCaseListItem,
  LegalExpertCommunicationListItem,
} from './types';

// Domain service functions for the admin-dashboard in-scope lists (feature 035, §6 matrix).
// Every list endpoint returns the shared `PagedResponse<T>` envelope inside the standard
// `{ data, errors, meta }` wrapper; callers read `.items` and the paging metadata. A 404
// (parent expert/client not found) surfaces as a thrown error so the page can show a not-found
// state (FR-004); an empty list is a normal 200 with `items: []` (FR-003).

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + '/api/v1';

/**
 * Query params accepted by an in-scope admin list endpoint: paging/sorting plus filter keys.
 * Per-domain filter typings (data-model Entity 5) tighten this in a later phase; for now the shape is
 * left open so each accessor can accept its §6 filters without `any` (Principle I).
 */
export type ListParams = PageRequestParams & Record<string, unknown>;

const authHeaders = async () => ({
  Authorization: `Bearer ${await getToken()}`,
  'Content-Type': 'application/json',
});

// ── Legal experts ───────────────────────────────────────────────────────────

export const fetchLegalExperts = async (
  params: ListParams = {}
): Promise<PagedResponse<LegalExpertListItem>> => {
  const response = await axios.get(`${API_BASE_URL}/legalexperts`, {
    headers: await authHeaders(),
    params,
  });
  return normalizePage<LegalExpertListItem>(response.data?.data);
};

export const fetchLegalExpertsWithAppointmentCount = async (
  params: ListParams = {}
): Promise<PagedResponse<LegalExpertListItem>> => {
  const response = await axios.get(`${API_BASE_URL}/legalexperts/appointment-count`, {
    headers: await authHeaders(),
    params,
  });
  return normalizePage<LegalExpertListItem>(response.data?.data);
};

export const fetchLegalExpertsByApprovalStatus = async (
  status: string,
  params: ListParams = {}
): Promise<PagedResponse<LegalExpertListItem>> => {
  const response = await axios.get(
    `${API_BASE_URL}/legalexperts/approved/${encodeURIComponent(status)}`,
    { headers: await authHeaders(), params }
  );
  return normalizePage<LegalExpertListItem>(response.data?.data);
};

export const fetchLegalExpertCases = async (
  legalExpertId: string | number,
  params: ListParams = {}
): Promise<PagedResponse<LegalExpertCaseListItem>> => {
  const response = await axios.get(`${API_BASE_URL}/legalexperts/${legalExpertId}/cases`, {
    headers: await authHeaders(),
    params,
  });
  return normalizePage<LegalExpertCaseListItem>(response.data?.data);
};

export const fetchLegalExpertCommunications = async (
  legalExpertId: string | number,
  params: ListParams = {}
): Promise<PagedResponse<LegalExpertCommunicationListItem>> => {
  const response = await axios.get(`${API_BASE_URL}/legalexperts/${legalExpertId}/communications`, {
    headers: await authHeaders(),
    params,
  });
  return normalizePage<LegalExpertCommunicationListItem>(response.data?.data);
};

// ── Clients ──────────────────────────────────────────────────────────────────

export const fetchClients = async (
  params: ListParams = {}
): Promise<PagedResponse<ClientListItem>> => {
  const response = await axios.get(`${API_BASE_URL}/clients`, {
    headers: await authHeaders(),
    params,
  });
  return normalizePage<ClientListItem>(response.data?.data);
};

// ── Appointments ─────────────────────────────────────────────────────────────

export const fetchPendingAppointments = async (
  params: ListParams = {}
): Promise<PagedResponse<AppointmentListItem>> => {
  const response = await axios.get(`${API_BASE_URL}/appointments/pending`, {
    headers: await authHeaders(),
    params,
  });
  return normalizePage<AppointmentListItem>(response.data?.data);
};

export const fetchPastAppointments = async (
  params: ListParams = {}
): Promise<PagedResponse<AppointmentListItem>> => {
  const response = await axios.get(`${API_BASE_URL}/appointments/past`, {
    headers: await authHeaders(),
    params,
  });
  return normalizePage<AppointmentListItem>(response.data?.data);
};

export const fetchLegalExpertAppointments = async (
  legalExpertId: string | number,
  scope: 'pending' | 'past' | 'bydate',
  params: ListParams = {}
): Promise<PagedResponse<AppointmentListItem>> => {
  const response = await axios.get(
    `${API_BASE_URL}/appointments/legalexperts/${legalExpertId}/${scope}`,
    { headers: await authHeaders(), params }
  );
  return normalizePage<AppointmentListItem>(response.data?.data);
};

export const fetchClientAppointments = async (
  clientId: string | number,
  scope: 'pending' | 'past' | 'bydate',
  params: ListParams = {}
): Promise<PagedResponse<AppointmentListItem>> => {
  const response = await axios.get(
    `${API_BASE_URL}/appointments/clients/${clientId}/${scope}`,
    { headers: await authHeaders(), params }
  );
  return normalizePage<AppointmentListItem>(response.data?.data);
};

// ── Orders / payment settlements ─────────────────────────────────────────────

export const fetchLegalExpertOrders = async (
  legalExpertId: string | number,
  params: ListParams = {}
): Promise<PagedResponse<PaymentListItem>> => {
  const response = await axios.get(`${API_BASE_URL}/orders/legalexperts/${legalExpertId}`, {
    headers: await authHeaders(),
    params,
  });
  return normalizePage<PaymentListItem>(response.data?.data);
};

export const fetchClientOrders = async (
  clientId: string | number,
  params: ListParams = {}
): Promise<PagedResponse<PaymentListItem>> => {
  const response = await axios.get(`${API_BASE_URL}/orders/clients/${clientId}`, {
    headers: await authHeaders(),
    params,
  });
  return normalizePage<PaymentListItem>(response.data?.data);
};

export const fetchLegalExpertPaymentSettlements = async (
  legalExpertId: string | number,
  params: ListParams = {}
): Promise<PagedResponse<PaymentListItem>> => {
  const response = await axios.get(
    `${API_BASE_URL}/paymentsettlements/legalexperts/${legalExpertId}`,
    { headers: await authHeaders(), params }
  );
  return normalizePage<PaymentListItem>(response.data?.data);
};

// ── Ratings ──────────────────────────────────────────────────────────────────

export const fetchLegalExpertRatings = async (
  legalExpertId: string | number,
  params: ListParams = {}
): Promise<PagedResponse<RatingListItem>> => {
  const response = await axios.get(`${API_BASE_URL}/ratings/legalexperts/${legalExpertId}`, {
    headers: await authHeaders(),
    params,
  });
  return normalizePage<RatingListItem>(response.data?.data);
};
