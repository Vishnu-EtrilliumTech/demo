# Data Model: Organization Registration (001)

## Entity: OrganizationRegistrationPayload

The payload sent to `POST /api/v1/organizations` to create a new organization and assign the submitter as OrganizationAdmin.

### Field Table

| Field | Type | Nullable | Source | Notes |
|---|---|---|---|---|
| `name` | `string` | No | User input | Max 100 chars; trimmed before send |
| `description` | `string` | Yes (empty string ok) | User input | Optional, max 500 chars; trimmed before send |
| `phoneNumber` | `string` | No | User input | 10-digit, starts with 6–9; sent as string (API accepts string or number) |
| `emailId` | `string` | No | User input | Valid email format; stored lowercase |
| `segments` | `string[]` | No (min 1) | User input (multi-select) | Current options: `['Legal', 'Insurance']` |
| `administratorName` | `string` | No | User input | Max 100 chars; the submitting user's full name |
| `administratorPhoneNumber` | `string` | No | User input | 10-digit, starts with 6–9 |
| `administratorGender` | `string` | No | User input | One of: `'Male'`, `'Female'`, `'Transgender'` (Non-Binary maps to Transgender) |

### TypeScript Interface

**File**: `src/app/organization/types/index.ts` — ALREADY EXISTS, NO CHANGE NEEDED

```typescript
// Already defined at line 181–190 of src/app/organization/types/index.ts
export interface OrganizationRegistrationPayload {
  name: string;
  description: string;
  phoneNumber: string;
  emailId: string;
  segments: string[];
  administratorName: string;
  administratorPhoneNumber: string;
  administratorGender: string;
}
```

### Form State Interface (NEW — internal to hook)

**File**: `src/app/register/_hooks/useOrgRegistrationForm.ts`

```typescript
export interface OrgRegistrationFormData extends Record<string, unknown> {
  // Organization Details
  orgName: string;
  orgEmail: string;
  orgPhone: string;
  orgDescription: string;
  segments: string[];
  // Administrator Details
  adminName: string;
  adminPhone: string;
  adminGender: string;
  // Read-only (from Keycloak session)
  adminEmail: string;
}
```

---

## Entity: Organization (Response)

The server-created organization returned on successful registration.

### Field Table (response subset used for redirect)

| Field | Type | Nullable | Source | Notes |
|---|---|---|---|---|
| `id` | `number` | No | Server-generated | Used to construct redirect URL `/organization/[id]` |
| `name` | `string` | No | From payload | Org name |
| `emailId` | `string` | No | From payload | Contact email |
| `segments` | `string[]` | No | From payload | Business segments |
| `enabled` | `boolean` | No | Server default | `true` on creation |
| `currentUser.roles` | `string[]` | No | Server-assigned | Contains `'OrganizationAdmin'` |

### TypeScript Interface

**File**: `src/app/organization/types/index.ts` — ALREADY EXISTS, NO CHANGE NEEDED

```typescript
// Already defined at line 153–179 of src/app/organization/types/index.ts
export interface Organization {
  id: number;
  name: string;
  description: string;
  segments: string[];
  phoneNumber: number;
  emailId: string;
  createdDate: string;
  updatedDate: string;
  enabled: boolean;
  currentUser: {
    id: number;
    fullName: string;
    emailId: string;
    enabled: boolean;
    roles: string[];
    registeredDate: string;
    lastLoginDate: string;
    phoneNumber: number;
  };
}
```

---

## Relationships

```
AuthenticatedUser (Keycloak)
    |
    | submits
    v
OrganizationRegistrationPayload
    |
    | POST /api/v1/organizations
    v
Organization (created)
    |
    +-- currentUser.roles = ['OrganizationAdmin']
    |
    +-- id → used for redirect /organization/[id]
```

---

## Validation Rules

| Field | Rule | Error Message |
|---|---|---|
| `orgName` | Required | "Organization name is required." |
| `orgName` | Max 100 chars | "Organization name cannot exceed 100 characters." |
| `orgEmail` | Required | "Contact email is required." |
| `orgEmail` | Valid email format | "Invalid email address format." |
| `orgPhone` | Required | "Contact phone is required." |
| `orgPhone` | `/^[6-9]\d{9}$/` | "Phone number must be a valid 10-digit mobile number." |
| `orgDescription` | Max 500 chars | "Description cannot exceed 500 characters." |
| `segments` | Min 1 item | "At least one segment is required." |
| `adminName` | Required | "Administrator name is required." |
| `adminName` | Max 100 chars | "Administrator name cannot exceed 100 characters." |
| `adminPhone` | Required | "Administrator phone is required." |
| `adminPhone` | `/^[6-9]\d{9}$/` | "Phone number must be a valid 10-digit mobile number." |
| `adminGender` | Required | "Administrator gender is required." |

### Validation Schema (for `useFormValidation`)

```typescript
import { required, email, phone, maxLength, custom } from '@/utils/validation';

const orgRegistrationSchema: ValidationSchema = {
  orgName: { rules: [required('Organization name'), maxLength('Organization name', 100)] },
  orgEmail: { rules: [required('Contact email'), email()] },
  orgPhone: { rules: [required('Contact phone'), phone()] },
  orgDescription: { rules: [maxLength('Description', 500)] },
  segments: {
    rules: [
      custom('At least one segment is required.', (v) => Array.isArray(v) && (v as string[]).length > 0),
    ],
  },
  adminName: { rules: [required('Administrator name'), maxLength('Administrator name', 100)] },
  adminPhone: { rules: [required('Administrator phone'), phone()] },
  adminGender: { rules: [required('Administrator gender')] },
};
```
