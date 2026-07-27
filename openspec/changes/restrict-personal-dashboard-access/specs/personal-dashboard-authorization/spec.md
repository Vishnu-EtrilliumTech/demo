# personal-dashboard-authorization Specification

## Purpose

Enforce that users can only access their own personal dashboard data, preventing unauthorized access to other users' case data, tasks, and hearings through URL manipulation or direct API calls.

## ADDED Requirements

### Requirement: Backend API Must Enforce Own-User Data Access

**Description:** The API endpoint `GET /api/v1/organizations/{organizationId}/users/{userId}/cases/summary` SHALL only return data when the `userId` parameter matches the authenticated user's ID from the JWT token. When a user attempts to access another user's case summary, the API SHALL return HTTP 403 Forbidden.

**Rationale:**
1. **Defense in depth**: Backend is the authoritative security layer; frontend can be bypassed
2. **Data protection**: Sensitive case assignments must be protected at the data layer
3. **Audit trail**: Backend can log unauthorized access attempts
4. **API security**: Direct API calls (Postman, scripts) must be blocked, not just UI access

**Acceptance Criteria:**
- API extracts authenticated user ID from JWT token
- API compares JWT user ID with `userId` URL parameter
- When IDs match: Return case summary data (HTTP 200)
- When IDs don't match: Return HTTP 403 Forbidden with error message
- Error response includes clear message: "Access denied: You can only view your own case summary"

---

#### Scenario: User requests their own case summary via API

**Given:**
- User is authenticated with JWT token containing user ID `4217`
- User calls `GET /api/v1/organizations/106/users/4217/cases/summary`

**When:**
- API extracts user ID `4217` from JWT token
- API compares with URL parameter `userId=4217`

**Then:**
- IDs match, authorization passes
- API returns HTTP 200 with case summary data
- Response contains user's cases, tasks, and hearings

**Validation:**
- Call API with valid JWT and matching userId
- Verify HTTP 200 response with data

---

#### Scenario: User attempts to access another user's case summary via API

**Given:**
- User is authenticated with JWT token containing user ID `4217`
- User calls `GET /api/v1/organizations/106/users/4214/cases/summary` (different userId)

**When:**
- API extracts user ID `4217` from JWT token
- API compares with URL parameter `userId=4214`

**Then:**
- IDs don't match, authorization fails
- API returns HTTP 403 Forbidden
- Response body contains error message explaining the restriction
- No case data from user `4214` is returned
- Unauthorized access attempt can be logged for security audit

**Validation:**
- Call API with valid JWT but different userId in URL
- Verify HTTP 403 response
- Verify response body contains appropriate error message
- Verify no sensitive data leaked in error response

---

### Requirement: Personal Dashboard Access Must Be Restricted to Own User

**Description:** The personal dashboard page at `/organization/{orgId}/sites/{siteId}/users/{userId}` SHALL only be accessible when the `userId` URL parameter matches the currently authenticated user's ID. This provides a user-friendly access denied message before the API call fails.

**Rationale:**
1. **User experience**: Show clear error message rather than cryptic API error
2. **Performance**: Avoid unnecessary API call that will fail
3. **Consistency**: Match frontend behavior with backend authorization

**Acceptance Criteria:**
- When URL `userId` matches logged-in user's ID, dashboard renders normally
- When URL `userId` does NOT match logged-in user's ID, display "Access Denied" message
- Authorization check occurs after user ID is loaded
- `useUserRole` hook exposes `currentUserId` for comparison
- Loading indicator shown while verifying authorization

---

#### Scenario: User accesses their own personal dashboard

**Given:**
- User is logged in as SiteLegalExpert with user ID `4217`
- User navigates to `/organization/106/sites/191/users/4217`

**When:**
- Personal dashboard page loads
- `useUserRole` hook returns `currentUserId: "4217"`
- Authorization check compares URL userId (`4217`) with currentUserId (`4217`)

**Then:**
- Authorization check passes (IDs match)
- Dashboard renders with user's cases, tasks, and hearings
- User sees their own work items and assigned cases

**Validation:**
- Log in as any site-level user
- Navigate to personal dashboard with your own user ID in URL
- Verify dashboard loads successfully with your data

---

#### Scenario: User attempts to access another user's personal dashboard via URL manipulation

**Given:**
- User is logged in as SiteLegalExpert with user ID `4217`
- User manually changes URL to `/organization/106/sites/191/users/4214`

**When:**
- Personal dashboard page loads
- `useUserRole` hook returns `currentUserId: "4217"`
- Authorization check compares URL userId (`4214`) with currentUserId (`4217`)

**Then:**
- Authorization check fails (IDs do not match)
- "Access Denied" message displayed with clear explanation
- No API call made to fetch other user's data
- User is provided option to navigate to their own dashboard

**Validation:**
- Log in as SiteLegalExpert user
- Manually change the userId in URL to another user's ID
- Verify "Access Denied" page is shown
- Verify no network request made for other user's data

---

#### Scenario: Frontend handles 403 response from backend gracefully

**Given:**
- Frontend authorization check is bypassed (edge case/race condition)
- API call to `fetchUserCaseSummary` is made with wrong userId

**When:**
- Backend returns HTTP 403 Forbidden

**Then:**
- Frontend catches the 403 error
- Displays appropriate "Access Denied" message
- Does not crash or show raw error

**Validation:**
- Temporarily disable frontend check
- Attempt to load another user's dashboard
- Verify graceful error handling when API returns 403

---

### Requirement: useUserRole Hook Must Expose Current User ID

**Description:** The `useUserRole` hook SHALL expose `currentUserId` (the authenticated user's ID) alongside role information. This enables frontend authorization checks comparing the current user against URL parameters.

**Rationale:**
1. **Centralized identity**: Single source of truth for current user's ID
2. **Consistency**: Same pattern as role-based permissions
3. **Reusability**: Other components may need similar authorization checks

**Acceptance Criteria:**
- `useUserRole` hook returns `currentUserId` as a string
- `currentUserId` is populated from the same API call that fetches roles
- `currentUserId` is available after loading completes

---

#### Scenario: Hook provides currentUserId after loading

**Given:**
- User is authenticated and has profile data
- `useUserRole` hook is called with `organizationId`

**When:**
- Hook fetches user data from API
- User data includes `id` field

**Then:**
- Hook returns `currentUserId` with the user's ID as string
- Value matches the authenticated user's ID

**Validation:**
- Inspect `useUserRole` hook return value
- Verify `currentUserId` matches expected user ID
