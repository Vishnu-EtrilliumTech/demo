# Change: Restrict Personal Dashboard Access to Own User

## Why

A security vulnerability allows users to access other users' personal dashboards by manipulating the `userId` parameter in the URL. A Legal Expert user can view a Site Admin's cases, tasks, and hearings by simply changing the userId in the browser's address bar. This exposes sensitive case data and violates the principle of least privilege.

**Reference**: GitHub Issue #101 - [BUG] The user is able to access the Site Admin Personal Dashboard while logged in as a Legal Expert user login

## Root Cause Analysis

The vulnerability exists at **two levels**:

1. **Backend API (Primary Issue)**: The endpoint `GET /{organizationId}/users/{userId}/cases/summary` allows any authenticated user with a site-level role to fetch ANY user's case summary. The API only checks role-based access (does user have permission to call this endpoint?) but NOT data ownership (is the user requesting their own data?).

2. **Frontend (Secondary Issue)**: The personal dashboard page doesn't verify that the URL `userId` matches the logged-in user before rendering data.

## What Changes

### Backend Changes (Required - blocks frontend fix)
The `.NET Core API` must be updated to enforce that:
- The `/{organizationId}/users/{userId}/cases/summary` endpoint returns data ONLY when `userId` matches the authenticated user's ID
- Return `403 Forbidden` when attempting to access another user's case summary

**Backend codebase**: `C:\Users\LENOVO\sabari\codebase\Lawsome\Code`

### Frontend Changes (After backend fix)
- Add authorization check in personal dashboard comparing URL `userId` against current user's ID
- Display "Access Denied" UI when user attempts to access another user's dashboard (graceful error handling)
- Extend `useUserRole` hook to expose current user's ID for comparison

## Impact

- **Affected backend endpoint**: `GET /api/v1/organizations/{organizationId}/users/{userId}/cases/summary`
- **Affected frontend code**:
  - `src/app/organization/[id]/sites/[siteId]/users/[userId]/page.tsx`
  - `src/hooks/useUserRole.ts`
- **Permission Matrix Update**: Line 24 needs clarification that this endpoint enforces "own user data only"
- **User impact**: Users will only be able to view their own personal dashboard
- **No migration needed**: Security fix, not data change

## Security Note

Frontend validation alone is **insufficient** for security:
- Attackers can bypass frontend by calling the API directly
- Frontend validation is for UX (nice error messages), not security
- Backend must be the source of truth for authorization
