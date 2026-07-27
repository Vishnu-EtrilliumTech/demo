## 1. Backend: Add User Validation to Site Deletion

- [x] 1.1 In `SitesController.Delete()`, after site existence check, query `SiteUserMap` for users assigned to the site
- [x] 1.2 If users exist (count > 0), return 400 Bad Request with message: "Cannot delete site. {N} user(s) are still assigned to this site. Please remove all users before deleting the site."
- [x] 1.3 If no users exist, proceed with existing deletion logic

## 2. Testing & Verification

- [ ] 2.1 Test: Attempt to delete site with users → Verify 400 response with correct error message
- [ ] 2.2 Test: Remove all users from site, then delete → Verify successful deletion
- [ ] 2.3 Test: Delete site that never had users → Verify successful deletion (no regression)
- [ ] 2.4 Verify frontend displays backend error message in toast notification

## 3. Documentation

- [x] 3.1 Update API permission matrix if needed
- [x] 3.2 Update PRD with site deletion constraints
