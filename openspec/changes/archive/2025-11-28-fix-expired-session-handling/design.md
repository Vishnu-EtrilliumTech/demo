## Context

The application uses Keycloak for authentication:
1. User authenticates via Keycloak SSO
2. Access token and refresh token stored in localStorage
3. HTTP interceptors inject access token into API requests
4. Token refresh happens when access token nears expiration

**Problem**: Keycloak has two independent timeouts:
- **Access Token Lifespan**: When the JWT itself expires (checked via `exp` claim)
- **SSO Session Idle/Max**: When the server-side session expires

When SSO Session expires:
- The access token's `exp` claim may still be in the future (token appears valid)
- The .NET backend validates tokens locally (signature + exp), so API calls succeed
- Keycloak's refresh endpoint rejects the refresh token ("Token is not active")
- User can continue performing actions with the "valid" access token

**Current Code Gap** (in `keycloakServices.ts`):
```typescript
keycloakInstance.onAuthRefreshError = () => {
  clearTokens();  // Clears tokens but doesn't force logout/redirect
};
```

The tokens are cleared, but:
- No redirect to login
- No user notification
- API calls can still be attempted with stale token in memory

## Goals / Non-Goals

### Goals
- Detect when token refresh fails (indicates Keycloak session expired)
- Force complete logout and redirect to login
- Prevent further API calls after session loss detected
- Show user-friendly message before redirect

### Non-Goals
- Changing Keycloak server configuration
- Backend changes to validate session state with Keycloak
- Proactive session validation (polling Keycloak)
- Preserving form data across re-authentication

## Decisions

### Decision 1: Force Logout on Refresh Failure

**When**: `keycloak.updateToken()` throws an error or returns false when refresh is needed

**Action**:
1. Set a flag to prevent further API calls
2. Clear all tokens from localStorage
3. Clear Redux auth state
4. Redirect to Keycloak login page

**Location**: `src/services/keycloakServices.ts`

### Decision 2: HTTP Interceptor Triggers Logout

**When**: API returns 401 AND subsequent token refresh fails

**Action**: Call the forced logout function

**Location**: `src/services/httpServices.ts`

**Rationale**: This catches cases where the access token expired AND the session is gone.

### Decision 3: Single Logout Guard

Use a module-level flag to prevent multiple concurrent logout attempts.

```typescript
let isLoggingOut = false;

export const forceLogout = async () => {
  if (isLoggingOut) return;
  isLoggingOut = true;
  // ... logout logic
};
```

**Rationale**: Multiple failed API calls could trigger multiple logouts simultaneously, causing race conditions.

### Decision 4: Preserve Return URL

When redirecting to login, preserve the current URL so user returns to their page after re-authentication.

```typescript
await keycloak.login({
  redirectUri: window.location.href
});
```

## Alternatives Considered

### Alternative: Periodic Session Health Check
Poll Keycloak periodically to detect session expiration proactively.
- **Rejected**: Adds complexity, extra network calls, and the reactive approach (detect on refresh failure) is sufficient

### Alternative: Backend Session Validation
Have .NET backend call Keycloak introspection endpoint.
- **Rejected**: Requires backend changes, adds latency to every API call

## Risks / Trade-offs

### Risk 1: User Disruption Mid-Operation
- **Mitigation**: This is unavoidable when session expires; clear messaging helps
- **Mitigation**: Preserve return URL for seamless continuation after login

### Risk 2: Login Loop
- **Mitigation**: `isLoggingOut` flag prevents re-triggering
- **Mitigation**: Clear all state before redirect

## Implementation Approach

1. Add `forceLogout()` function to `keycloakServices.ts` with guard flag
2. Update `onAuthRefreshError` to call `forceLogout()`
3. Update `refreshTokens()` to call `forceLogout()` on failure
4. Update `httpServices.ts` 401 handler to call `forceLogout()` when refresh fails
5. Add brief notification before redirect (optional enhancement)

## Migration Plan

No data migration. Pure client-side behavior change.

**Testing**:
1. Login to application
2. Wait for SSO Session Idle timeout (or manually expire session in Keycloak admin)
3. Attempt an action
4. Verify: User is redirected to login, not left in broken state
