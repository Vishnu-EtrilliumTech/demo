import { CaseStatus } from "@/app/organization/types";
import type { CaseApiAccessLevel } from "@/app/organization/types/caseindex";

export interface CaseData {
  id: string;
  title: string;
  caseNumber: string;
  caseKey?: string;
  cnrNumber?: string;
  status: CaseStatus;
  description?: string;
  assignedToId?: string;
  createdById?: string;
  createdAt: string;
  createdDate?: string;
  updatedAt?: string;
  hasCnrNumber?: boolean;
  /**
   * Calling user's effective access to this case (UI hint). Drives Edit/Delete
   * gating via useCaseAccess. Absent when the backend has not been updated.
   */
  accessLevel?: CaseApiAccessLevel;
}

export interface EditTitleFormState {
  title: string;
  caseNumber: string;
  status: CaseStatus;
  assignedTo: string;
}

export interface EditFormData {
  assignedTo: string;
  description: string;
}