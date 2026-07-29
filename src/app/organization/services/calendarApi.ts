import axios from 'axios';
import { getToken } from '@/services/authServices';
import type {
  CalendarItem,
  CalendarItemType,
  Note,
  AddNoteRequest,
  UpdateNoteRequest,
  OrgTask,
  AddOrgTaskRequest,
  UpdateOrgTaskRequest,
  Priority,
  EcourtsImportResponse,
} from '../types/calendarTypes';

const ORG_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + '/api/v1/organizations';

const authHeaders = async () => ({
  Authorization: `Bearer ${await getToken()}`,
  'Content-Type': 'application/json',
});

export interface CalendarFeedParams {
  from: string;
  to: string;
  siteId?: string;
  favouritesOnly?: boolean;
  types?: CalendarItemType[];
}

export const fetchCalendar = async (
  organizationId: string,
  params: CalendarFeedParams
): Promise<CalendarItem[]> => {
  const headers = await authHeaders();
  const response = await axios.get(`${ORG_API_BASE_URL}/${organizationId}/calendar`, {
    headers,
    params: {
      from: params.from,
      to: params.to,
      siteId: params.siteId,
      favouritesOnly: params.favouritesOnly,
      types: params.types?.join(','),
    },
  });
  return (response.data?.data?.items ?? response.data?.data ?? []) as CalendarItem[];
};

const notesBase = (organizationId: string, siteId?: string) =>
  siteId
    ? `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/notes`
    : `${ORG_API_BASE_URL}/${organizationId}/notes`;

export const addNote = async (
  organizationId: string,
  note: AddNoteRequest,
  siteId?: string
): Promise<Note> => {
  const headers = await authHeaders();
  const response = await axios.post(notesBase(organizationId, siteId), note, { headers });
  return response.data?.data ?? response.data;
};

export const updateNote = async (
  organizationId: string,
  noteId: string,
  note: UpdateNoteRequest,
  siteId?: string
): Promise<Note> => {
  const headers = await authHeaders();
  const response = await axios.put(`${notesBase(organizationId, siteId)}/${noteId}`, note, { headers });
  return response.data?.data ?? response.data;
};

export const fetchNote = async (
  organizationId: string,
  noteId: string,
  siteId?: string
): Promise<Note> => {
  const headers = await authHeaders();
  const response = await axios.get(`${notesBase(organizationId, siteId)}/${noteId}`, { headers });
  return response.data?.data ?? response.data;
};

export const deleteNote = async (
  organizationId: string,
  noteId: string,
  siteId?: string
): Promise<void> => {
  const headers = await authHeaders();
  await axios.delete(`${notesBase(organizationId, siteId)}/${noteId}`, { headers });
};

export const setNotePriority = async (
  organizationId: string,
  noteId: string,
  priority: Priority,
  siteId?: string
): Promise<void> => {
  const headers = await authHeaders();
  await axios.put(`${notesBase(organizationId, siteId)}/${noteId}/priority`, { priority }, { headers });
};

const tasksBase = (organizationId: string, siteId?: string) =>
  siteId
    ? `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/tasks`
    : `${ORG_API_BASE_URL}/${organizationId}/tasks`;

export const addTask = async (
  organizationId: string,
  task: AddOrgTaskRequest,
  siteId?: string
): Promise<OrgTask> => {
  const headers = await authHeaders();
  const response = await axios.post(tasksBase(organizationId, siteId), task, { headers });
  return response.data?.data ?? response.data;
};

export const updateTask = async (
  organizationId: string,
  taskId: string,
  task: UpdateOrgTaskRequest,
  siteId?: string
): Promise<OrgTask> => {
  const headers = await authHeaders();
  const response = await axios.put(`${tasksBase(organizationId, siteId)}/${taskId}`, task, { headers });
  return response.data?.data ?? response.data;
};

export const fetchTask = async (
  organizationId: string,
  taskId: string,
  siteId?: string
): Promise<OrgTask> => {
  const headers = await authHeaders();
  const response = await axios.get(`${tasksBase(organizationId, siteId)}/${taskId}`, { headers });
  return response.data?.data ?? response.data;
};

export const deleteTask = async (
  organizationId: string,
  taskId: string,
  siteId?: string
): Promise<void> => {
  const headers = await authHeaders();
  await axios.delete(`${tasksBase(organizationId, siteId)}/${taskId}`, { headers });
};

export const setTaskPriority = async (
  organizationId: string,
  taskId: string,
  priority: Priority,
  siteId?: string
): Promise<void> => {
  const headers = await authHeaders();
  await axios.put(`${tasksBase(organizationId, siteId)}/${taskId}/priority`, { priority }, { headers });
};

export const setHearingPriority = async (
  organizationId: string,
  siteId: string,
  caseId: string,
  hearingId: string,
  priority: Priority
): Promise<void> => {
  const headers = await authHeaders();
  await axios.put(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/cases/${caseId}/hearings/${hearingId}/priority`,
    { priority },
    { headers }
  );
};

export const updateOrganizationDefaultCalendarItemTypes = async (
  organizationId: string,
  defaultCalendarItemTypes: CalendarItemType[] | null
): Promise<void> => {
  const headers = await authHeaders();
  await axios.put(`${ORG_API_BASE_URL}/${organizationId}`, { defaultCalendarItemTypes }, { headers });
};

export const importEcourtsCases = async (
  organizationId: string,
  siteId: string,
  cnrNumbers: string[]
): Promise<EcourtsImportResponse> => {
  const headers = await authHeaders();
  const response = await axios.post(
    `${ORG_API_BASE_URL}/${organizationId}/sites/${siteId}/ecourts/import`,
    { cnrNumbers },
    { headers }
  );
  return response.data?.data ?? response.data;
};
