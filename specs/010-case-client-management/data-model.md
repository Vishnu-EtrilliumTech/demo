# Data Model: Case Client Management

**Branch**: `010-case-client-management` | **Source**: `src/app/organization/types/caseindex.ts`

---

## Entities

### CaseClient

| Field | Type | Notes |
|-------|------|-------|
| `id` | `number` | Backend-assigned |
| `caseId` | `number` | Parent case |
| `fullName` | `string` | Required |
| `emailId` | `string` | Required for invite; optional for record |
| `phoneNumber` | `number` | Optional |
| `gender` | `GenderAPIType` | `Male \| Female \| Transgender` (stored); UI adds `Non-Binary` |
| `remarks` | `string \| null` | Optional notes |
| `invitedOnDate` | `string \| null` | ISO 8601; null = Not Invited |
| `acceptedDate` | `string \| null` | ISO 8601; null = not yet accepted |
| `clientId` | `number \| null` | Platform user ID after acceptance |
| `invitationId` | `string \| null` | UUID; set on invite |
| `invitationExpiryDate` | `string \| null` | ISO 8601 |
| `merged` | `boolean` | True after successful acceptance |

### Derived: Invitation Status

| Condition | Display Label | Chip Color |
|-----------|--------------|-----------|
| `invitedOnDate === null` | Not Invited | Grey |
| `invitedOnDate !== null && acceptedDate === null` | Invited | Blue |
| `acceptedDate !== null` | Accepted | Green |

---

## Create/Update Shapes

### CaseClientRequest (Add)

```typescript
{
  fullName: string;          // required
  emailId?: string;          // required for invite capability
  phoneNumber?: number;      // optional
  gender: GenderAPIType;     // UI maps Non-Binary → Transgender
  remarks?: string;          // optional
}
```

### UpdateCaseClientRequest

```typescript
{
  fullName: string;
  emailId?: string;
  phoneNumber?: number;
  gender: GenderAPIType;
  remarks?: string;
}
```

### ClientAcceptInvitationRequest

```typescript
{
  clientId?: number;    // existing platform user ID if known
  remarks?: string;
}
```

---

## Gender Mapping

| UI Value (`GenderUIOption`) | API Value (`GenderAPIType`) |
|-----------------------------|------------------------------|
| Male | Male |
| Female | Female |
| Transgender | Transgender |
| Non-Binary | Transgender (mapped before API call) |

Default: `Male`

---

## Invitation Lifecycle

```
CaseClient created
  → invitedOnDate = null, acceptedDate = null [Not Invited]

Authorized user clicks "Invite"
  → POST /caseclients/{clientId}/invite
  → invitedOnDate set [Invited]

Client clicks link and accepts
  → POST /caseclients/{clientId}/invitation/{invitationId}/accept
  → acceptedDate set, merged = true, clientId populated [Accepted]
  → Client now has SiteCaseClient role on this case
```

---

## Validation Rules

| Field | Rule |
|-------|------|
| `fullName` | Required; non-empty |
| `emailId` | Required field (spec FR-002); email format |
| `phoneNumber` | Optional; numeric |
| `gender` | Required; default Male |
| Invite button | Disabled if `emailId` is empty or `acceptedDate !== null` |
