# API Contracts: Legal Expert Management

**Spec**: [spec.md](../spec.md) | **Plan**: [plan.md](../plan.md)

Base URL: `/api/v1/legalexperts`

---

## POST /api/v1/legalexperts
Register a new legal expert (self-registration or SystemAdmin).

**Auth**: Bearer token (AuthenticatedUser or SystemAdmin)  
**Request**:
```json
{
  "fullName": "string (required, max 100)",
  "emailId": "string (required, must match JWT claim for non-admin)",
  "phoneNumber": "string (required, 10-digit, starts 6–9)",
  "gender": "Male | Female | Transgender",
  "expertTypeId": "number (required, must reference valid ExpertType)"
}
```
**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "string",
    "emailId": "string",
    "phoneNumber": "string",
    "gender": "Male",
    "expertType": { "id": 1, "name": "Lawyer" },
    "status": "PendingApproval",
    "onboardingStage": "Registration",
    "createdAt": "2026-05-15T10:00:00Z"
  },
  "message": "Your legal expert account has been created and is pending approval."
}
```
**Errors**:
- 400: Validation failure (invalid phone, missing required field)
- 401: Unauthenticated
- 403: Email does not match JWT claim (non-admin)
- 409: Email already registered as legal expert

---

## GET /api/v1/legalexperts
List all legal experts (SystemAdmin only).

**Auth**: Bearer token (SystemAdmin)  
**Query params**: `status` (Active|PendingApproval|Inactive), `expertTypeId`, `page` (default 1), `pageSize` (default 20)  
**Response 200**:
```json
{
  "items": [
    {
      "id": 1,
      "fullName": "string",
      "emailId": "string",
      "phoneNumber": "string",
      "expertType": { "id": 1, "name": "Lawyer" },
      "status": "PendingApproval",
      "onboardingStage": "Registration",
      "createdAt": "2026-05-15T10:00:00Z"
    }
  ],
  "totalCount": 50,
  "page": 1,
  "pageSize": 20
}
```
**Errors**: 401, 403 (non-admin)

---

## GET /api/v1/legalexperts/{id}
Get a single legal expert by ID.

**Auth**: Bearer token (SystemAdmin or the expert themselves)  
**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "string",
    "emailId": "string",
    "phoneNumber": "string",
    "gender": "Male",
    "expertType": { "id": 1, "name": "Lawyer" },
    "status": "Active",
    "onboardingStage": "Schedule"
  },
  "message": null
}
```
**Errors**: 401, 403, 404

---

## GET /api/v1/legalexperts/email/{email}
Fetch a legal expert by email (existing endpoint).

**Auth**: Bearer token  
**Response 200**: Same shape as GET /{id}  
**Errors**: 401, 403, 404

---

## PUT /api/v1/legalexperts/{id}
Update a legal expert's profile (own or SystemAdmin).

**Auth**: Bearer token (expert owns record or SystemAdmin)  
**Request**:
```json
{
  "fullName": "string (required, max 100)",
  "phoneNumber": "string (required, 10-digit, starts 6–9)",
  "expertTypeId": "number (required)"
}
```
**Response 200**: Same shape as GET /{id} with updated values  
**Errors**: 400, 401, 403 (not owner or admin), 404

---

## PUT /api/v1/legalexperts/{id}/activate
Activate a pending legal expert (SystemAdmin only).

**Auth**: Bearer token (SystemAdmin)  
**Request**: None  
**Response 200**:
```json
{
  "success": true,
  "data": { "id": 1, "status": "Active" },
  "message": null
}
```
**Errors**: 401, 403, 404

---

## PUT /api/v1/legalexperts/{id}/deactivate
Deactivate an active legal expert (SystemAdmin only).

**Auth**: Bearer token (SystemAdmin)  
**Request**: None  
**Response 200**:
```json
{
  "success": true,
  "data": { "id": 1, "status": "Inactive" },
  "message": null
}
```
**Errors**: 401, 403, 404

---

## DELETE /api/v1/legalexperts/{id}
Permanently delete a legal expert (SystemAdmin only, requires confirmation).

**Auth**: Bearer token (SystemAdmin)  
**Response**: 204 No Content  
**Errors**: 401, 403, 404

---

## GET /api/v1/legalexperts/types
Fetch all valid expert types (reference data).

**Auth**: Bearer token  
**Response 200**:
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Lawyer" },
    { "id": 2, "name": "CA" },
    { "id": 3, "name": "Corporate" }
  ],
  "message": null
}
```
**Errors**: 401

---

## TypeScript Types

```typescript
// src/app/legal-expert/types/index.ts (NEW)

export interface LegalExpertRegistrationRequest {
  fullName: string;
  emailId: string;
  phoneNumber: string;
  gender: 'Male' | 'Female' | 'Transgender';
  expertTypeId: number;
}

export interface UpdateLegalExpertRequest {
  fullName: string;
  phoneNumber: string;
  expertTypeId: number;
}

export type LegalExpertStatus = 'Active' | 'PendingApproval' | 'Inactive';
export type OnboardingStage = 'Registration' | 'PersonalDetails' | 'ProfessionalDetails' | 'Schedule';

export interface ExpertType {
  id: number;
  name: string;
}

export interface LegalExpertDetail {
  id: number;
  fullName: string;
  emailId: string;
  phoneNumber: string;
  gender: 'Male' | 'Female' | 'Transgender';
  expertType: ExpertType;
  status: LegalExpertStatus;
  onboardingStage: OnboardingStage;
  createdAt: string;
}

export interface LegalExpertListItem {
  id: number;
  fullName: string;
  emailId: string;
  phoneNumber: string;
  expertType: ExpertType;
  status: LegalExpertStatus;
  onboardingStage: OnboardingStage;
  createdAt: string;
}
```
