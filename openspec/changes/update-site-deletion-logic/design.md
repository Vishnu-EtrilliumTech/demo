# Design: Site Deletion with Cascade Logic

## Context
The current site deletion endpoint blocks deletion whenever users exist in `site_user_map`, regardless of whether they are org-level or site-level users. Org-level users (OrganizationAdmin, OrganizationClerk) have implicit access to all sites via `OrganizationUserMap` and don't need explicit `site_user_map` entries for authorization.

## Goals
- Allow site deletion when only org-level users are in `site_user_map`
- Block site deletion when site-level users are assigned (preserves current safety)
- Cascade delete all site-related data (cases, tasks, documents, etc.)
- Maintain data integrity with proper deletion order

## Non-Goals
- Changing authorization logic for site access
- Adding soft-delete functionality
- Adding undo/restore capability

## Decisions

### Decision 1: User Role Classification
**What:** Classify users as org-level or site-level based on their `Roles` field.

**How:**
```csharp
// Org-level roles (implicit site access)
var orgLevelRoles = new[] { "OrganizationAdmin", "OrganizationClerk" };

// Site-level roles (explicit site assignment required)
var siteLevelRoles = new[] { "SiteAdmin", "SiteClerk", "SiteLegalExpert", "SiteSrLegalExpert" };
```

A user is considered "site-level" if they have ANY site-level role in their Roles list.

### Decision 2: Cascade Deletion Order
**What:** Delete entities in the correct order to respect foreign key constraints.

**Order (innermost first):**
1. `CaseTaskComment` - comments on tasks
2. `CaseTaskDocument` - documents on tasks
3. `CaseTask` - tasks in cases
4. `CaseClient` - clients in cases
5. `CaseComment` - comments on cases
6. `CaseDocument` - documents in cases
7. `CaseHearing` - hearings in cases
8. `CaseInvoice` - invoices in cases
9. `LegalExpertCaseMap` - legal expert assignments
10. `Case` - the cases themselves
11. `SiteCaseMap` - site-case mapping
12. `SiteUserMap` - site-user mapping (org-level users only)
13. `Site` - finally, the site

### Decision 3: Transaction Handling
**What:** Wrap all deletions in a database transaction.

**Rationale:** If any deletion fails, all changes should be rolled back to prevent orphaned data or partial deletions.

### Decision 4: No Soft Delete
**What:** Use hard delete (permanent removal) for all entities.

**Rationale:**
- Simpler implementation
- Consistent with existing deletion behavior elsewhere in the codebase
- No current requirement for audit trail or restoration

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Accidental deletion of important data | Confirmation dialog in frontend (future enhancement) |
| Long-running deletion for sites with many cases | Run deletion in background or show progress indicator |
| Transaction timeout for large datasets | Consider batched deletion for very large sites |

## Migration Plan
1. Deploy backend changes to SitesController
2. No database migration needed (no schema changes)
3. No frontend changes required (same API contract, just relaxed validation)

## Open Questions
- Should we add a confirmation step in the frontend before cascade deletion?
- Should deletion be logged for audit purposes?
