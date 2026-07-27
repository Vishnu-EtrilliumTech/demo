# Tasks: Update Site Deletion Logic

## 1. Backend Implementation (Lawsome.Api)

- [x] 1.1 Create helper method to classify user as org-level or site-level based on roles
- [x] 1.2 Modify `SitesController.Delete` to check user roles before blocking deletion
- [x] 1.3 Implement cascade deletion logic for all site-related entities in correct order
- [x] 1.4 Wrap cascade deletion in a database transaction for atomicity
- [x] 1.5 Update error message to only mention site-level users when blocking

## 2. Verification

- [ ] 2.1 Test: Site with only org-level users in site_user_map can be deleted
- [ ] 2.2 Test: Site with site-level users in site_user_map is blocked from deletion
- [ ] 2.3 Test: Cascade deletion removes all cases, tasks, comments, documents, hearings, invoices
- [ ] 2.4 Test: Transaction rollback works if any deletion fails
- [ ] 2.5 Test: Deleting site with no users works as before
