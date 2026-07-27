## 1. Core Force Logout Implementation

- [x] 1.1 Add `forceLogout()` function to `keycloakServices.ts` with `isLoggingOut` guard flag
- [x] 1.2 `forceLogout()` must: clear tokens, clear localStorage, redirect to Keycloak login with return URL
- [x] 1.3 Update `onAuthRefreshError` handler to call `forceLogout()` instead of just `clearTokens()`

## 2. Token Refresh Failure Handling

- [x] 2.1 Update `refreshTokens()` function to call `forceLogout()` when refresh fails (via `getToken()`)
- [x] 2.2 Update `onTokenExpired` handler to call `forceLogout()` when refresh fails
- [x] 2.3 Update `setupTokenRefresh()` interval to call `forceLogout()` when refresh fails

## 3. HTTP Interceptor Enhancement

- [x] 3.1 Update `httpServices.ts` response interceptor to call `forceLogout()` when 401 received AND token refresh fails
- [x] 3.2 Ensure interceptor doesn't retry after `forceLogout()` is triggered

## 4. Testing & Verification

- [ ] 4.1 Document manual test scenario: login, wait for session expiry, verify redirect to login
- [ ] 4.2 Verify return URL is preserved after re-authentication
