# Change: Fix expired session handling to properly enforce logout

## Why

When a Keycloak session expires on the server side (SSO Session Idle/Max timeout), the access token may still be cryptographically valid (signature + exp claim), creating a mismatch:

- **Keycloak API calls fail** with 401 (session expired on server)
- **Backend API calls succeed** (token signature/exp still valid, backend validates locally)
- **User can perform write operations** despite invalid session

This occurs because:
1. Keycloak's SSO Session timeout is independent of access token lifetime
2. The .NET backend validates tokens locally (signature + exp) without checking Keycloak session state
3. The frontend doesn't detect when token refresh fails and force logout

**Evidence from Keycloak logs:**
- `REFRESH_TOKEN_ERROR` with `reason="Token is not active"` - server-side session expired
- `LOGOUT_ERROR` with `error="session_expired"` - session no longer exists
- Users remain able to create resources because backend accepts the still-valid access token

## What Changes

**Approach: Frontend detects Keycloak session loss and forces logout**

1. **Token Refresh Failure Detection**: When `keycloak.updateToken()` fails, recognize this as session expiration
2. **Forced Logout Flow**: Clear all local state and redirect to login when session is lost
3. **Prevent Stale Operations**: When refresh fails, immediately block further API calls
4. **User Notification**: Show clear message that session expired before redirecting

## Impact

- Affected specs: New `session-management` capability
- Affected code:
  - `src/services/keycloakServices.ts` - Detect refresh failure, force logout
  - `src/services/httpServices.ts` - Trigger logout on 401 + refresh failure
  - `src/hooks/userAuth.ts` - Expose session state, handle forced logout
- Security: **IMPROVES** - Users cannot perform actions after Keycloak session expires
- User Experience: Clear redirect to login instead of confusing partial failures
