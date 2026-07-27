# Tasks: Restrict Personal Dashboard Access

## 1. Backend Changes (BLOCKING - Must be done first)

> **Note**: Backend codebase is at `C:\Users\LENOVO\sabari\codebase\Lawsome\Code`

- [x] 1.1 Locate the `GetUserCaseSummary` endpoint handler in the .NET Core API
- [x] 1.2 Add authorization check: compare `userId` parameter with authenticated user's ID from JWT token
- [x] 1.3 Return `403 Forbidden` when `userId` does not match authenticated user
- [ ] 1.4 Update API documentation/swagger to reflect the ownership restriction
- [ ] 1.5 Test backend: Verify API returns 403 when requesting another user's data

## 2. Frontend Hook Enhancement
- [x] 2.1 Modify `useUserRole` hook to expose `currentUserId` from fetched user data

## 3. Frontend Authorization Implementation
- [x] 3.1 Add authorization check in personal dashboard page comparing URL `userId` with `currentUserId`
- [x] 3.2 Display "Access Denied" UI when user attempts to access another user's dashboard
- [x] 3.3 Handle 403 API response gracefully (in case backend check triggers before frontend check)

## 4. Validation
- [ ] 4.1 Manual test: Log in as Legal Expert, navigate to own dashboard, verify access
- [ ] 4.2 Manual test: Log in as Legal Expert, change URL to another user's ID, verify "Access Denied"
- [ ] 4.3 Manual test: Verify API returns 403 when called directly with wrong userId (use Postman/curl)

## 5. Documentation
- [ ] 5.1 Update Permission Matrix to clarify ownership restriction on cases/summary endpoint
