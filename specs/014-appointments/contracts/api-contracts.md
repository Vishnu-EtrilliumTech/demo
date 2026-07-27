# API Contracts: Appointments

**Spec**: [spec.md](../spec.md) | **Plan**: [plan.md](../plan.md)

Base URL: `/api/v1/appointments`

---

## POST /api/v1/appointments
Book a new appointment.

**Auth**: Bearer token (Client or LegalIndividualExpert)  
**Request**:
```json
{
  "expertId": "string (required)",
  "date": "YYYY-MM-DD (required)",
  "timeSlotId": "string (required)",
  "meetingType": "Online | Offline",
  "addressId": "string | null (required if meetingType=Offline)"
}
```
**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "expertId": "string",
    "expertName": "string",
    "clientId": "string",
    "clientName": "string",
    "date": "YYYY-MM-DD",
    "timeSlot": { "id": "string", "startTime": "09:00", "endTime": "10:00" },
    "meetingType": "Online",
    "videoMeetingLink": "https://meet.example.com/abc123",
    "officeAddress": null,
    "status": "Upcoming",
    "clientDeclined": false,
    "expertDeclined": false,
    "paymentSettlement": {
      "id": "string",
      "dueDate": "YYYY-MM-DD",
      "amount": 3000
    }
  },
  "message": null
}
```
**Errors**:
- 400: Missing required fields; address not selected for Offline; inactive expert
- 401: Unauthenticated
- 403: Unauthorized role
- 409: Time slot no longer available (double-booking)
- 503: Video meeting service unavailable (Online only)

---

## GET /api/v1/appointments/me
Fetch appointments for the authenticated user (Client or Expert).

**Auth**: Bearer token  
**Query params**: `status` (upcoming|past), `page` (default 1), `pageSize` (default 10)  
**Response 200**:
```json
{
  "items": [
    {
      "id": "string",
      "expertId": "string",
      "expertName": "string",
      "clientId": "string",
      "clientName": "string",
      "date": "YYYY-MM-DD",
      "timeSlot": { "id": "string", "startTime": "09:00", "endTime": "10:00" },
      "meetingType": "Online",
      "videoMeetingLink": "string | null",
      "officeAddress": "string | null",
      "status": "Upcoming",
      "clientDeclined": false,
      "expertDeclined": false
    }
  ],
  "totalCount": 5,
  "page": 1,
  "pageSize": 10
}
```
**Errors**: 401

---

## GET /api/v1/appointments
Fetch all appointments (SystemAdmin only).

**Auth**: Bearer token (SystemAdmin)  
**Query params**: `page`, `pageSize`  
**Response 200**: Same list envelope shape as `/appointments/me`  
**Errors**: 401, 403

---

## PUT /api/v1/appointments/{id}/decline
Decline an appointment (client or expert side).

**Auth**: Bearer token (Client or LegalIndividualExpert who owns the appointment, or SystemAdmin)  
**Request**:
```json
{
  "reason": "string (required, non-empty)",
  "declineSide": "Client | Expert"
}
```
**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "status": "Declined",
    "clientDeclined": true,
    "expertDeclined": false,
    "clientDeclineReason": "string",
    "expertDeclineReason": null
  },
  "message": null
}
```
**Errors**:
- 400: Past appointment cannot be declined; empty reason
- 401: Unauthenticated
- 403: Not a participant in this appointment
- 409: Already declined by this side

---

## DELETE /api/v1/appointments/{id}
Delete an appointment record (SystemAdmin only).

**Auth**: Bearer token (SystemAdmin)  
**Response**: 204 No Content  
**Errors**: 401, 403, 404

---

## GET /api/v1/legalexperts/{expertId}/availability
Fetch available time slots for a given expert on a date.

**Auth**: Bearer token  
**Query params**: `date=YYYY-MM-DD (required)`  
**Response 200**:
```json
{
  "success": true,
  "data": [
    { "id": "string", "startTime": "09:00", "endTime": "10:00", "isAvailable": true },
    { "id": "string", "startTime": "10:00", "endTime": "11:00", "isAvailable": true }
  ],
  "message": null
}
```
Note: Only available slots are returned (booked slots excluded).  
**Errors**: 401, 404 (expert not found or inactive)

---

## GET /api/v1/legalexperts/{expertId}/addresses
Fetch registered office addresses for an expert (used for Offline booking).

**Auth**: Bearer token  
**Response 200**:
```json
{
  "success": true,
  "data": [
    { "id": "string", "name": "Main Office", "fullAddress": "123 Legal St, Mumbai" }
  ],
  "message": null
}
```
**Errors**: 401, 404

---

## TypeScript Types

```typescript
// src/app/appointments/types/index.ts (NEW)

export type MeetingType = 'Online' | 'Offline';
export type AppointmentStatus = 'Upcoming' | 'Declined' | 'Completed';
export type DeclineSide = 'Client' | 'Expert';

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

export interface PaymentSettlement {
  id: string;
  dueDate: string;
  amount: number;
}

export interface ExpertAddress {
  id: string;
  name: string;
  fullAddress: string;
}

export interface Appointment {
  id: string;
  expertId: string;
  expertName: string;
  clientId: string;
  clientName: string;
  date: string;
  timeSlot: TimeSlot;
  meetingType: MeetingType;
  videoMeetingLink: string | null;
  officeAddress: string | null;
  status: AppointmentStatus;
  clientDeclined: boolean;
  expertDeclined: boolean;
  clientDeclineReason?: string | null;
  expertDeclineReason?: string | null;
  paymentSettlement?: PaymentSettlement;
}

export interface CreateAppointmentRequest {
  expertId: string;
  date: string;
  timeSlotId: string;
  meetingType: MeetingType;
  addressId: string | null;
}

export interface DeclineAppointmentRequest {
  reason: string;
  declineSide: DeclineSide;
}
```
