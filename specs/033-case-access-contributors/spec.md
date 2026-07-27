# Feature Specification: Case Access Control & Contributors

**Feature Branch**: `033-case-access-contributors`  
**Created**: 2026-06-16  
**Status**: Draft  
**Input**: User description: "We are going to update the current Case exposure to the users. Previously all users of a particular site were able to see all cases and have edit/delete access to the case entity and resources. We are planning to restrict that and have a new feature called contributors introduced. The Contributors tab should be present for each case with existing tabs like hearings, tasks, summary etc. In the tab, people with appropriate rights (admins or case creator or assignee) should be able to add contributors, edit contributor access level or remove contributors. A markdown file describes the backend changes/additions. Create specs for incorporating the same to the frontend. For cases, for users, only cases the particular user has access to will be shown (as an assignee or contributor or created by)."

## Overview

The backend has replaced the previous "any site member can see and edit every case" model with a graded, relationship-based access ladder (None / View / Edit / Full) applied to both the case **entity** and its **resources** (tasks, hearings, documents, comments, invoices, clients). It also adds a new **Case Contributors** capability that lets the people who control a case grant explicit View-only or Edit access to specific site members, and auto-grants contributor access when a task or hearing is assigned to someone outside the core case team.

This specification covers the **frontend** changes needed to support these backend changes:

1. A new **Contributors** tab on the case detail page for listing, adding, editing, and removing contributors — with management controls shown only to authorized users.
2. **Client-side mirroring of the access ladder** so that action controls (edit/delete buttons, add/update forms) are shown, hidden, or disabled to match what the backend will actually permit.
3. Handling the now **row-filtered case list** (users only see cases they have access to) including correct empty-state messaging.
4. An **optional access-level selector** when assigning a task or hearing to a user, so the assigner can choose the contributor access level that is auto-granted.
5. Graceful handling of newly-possible **401 Unauthorized** responses on case-scoped actions.

## Clarifications

### Session 2026-06-16

- Q: How should controls be presented when a user lacks the access level for an action? → A: Hide the controls entirely (no disabled/greyed-out state for permission-based unavailability).
- Q: How should the add-contributor picker handle ineligible members (existing contributors, creator, assignee)? → A: Filter them out of the picker client-side so only eligible members are selectable; backend validation remains the fallback.
- Q: When should the optional assignment access-level control be shown on task/hearing forms? → A: Always show it whenever an assignee is selected (backend no-ops the grant for the creator/assignee).
- Q: Where should the Contributors tab sit in the case detail tab order? → A: Adjacent to the Clients tab, grouping the people-related tabs together.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and manage a case's contributors (Priority: P1)

A case admin (system/org/site admin), the case creator, or the case assignee opens a case, switches to the new **Contributors** tab, sees who currently has explicit access, and can add a site member as a contributor at View-only or Edit level, change an existing contributor's level, or remove a contributor.

**Why this priority**: This is the core new capability the feature introduces and the primary way users restore access for colleagues who can no longer see a case under the restricted model. Without it, the restriction in Story 3 would strand users with no remedy.

**Independent Test**: Sign in as a case creator, open a case, open the Contributors tab, add a site member at Edit, change them to View-only, then remove them — verifying the list updates after each action and the member's case access changes accordingly.

**Acceptance Scenarios**:

1. **Given** an authorized user on a case, **When** they open the Contributors tab, **Then** they see a list of current contributors showing each person's name, email, access level (View-only or Edit), who added them, and when.
2. **Given** an authorized user on the Contributors tab, **When** there are no contributors, **Then** an empty-state message is shown instead of an empty table.
3. **Given** an authorized user, **When** they choose to add a contributor, **Then** they can pick a site member (one who is not already a contributor and is not the creator/assignee) and an access level, and on success the new contributor appears in the list.
4. **Given** an existing contributor, **When** an authorized user changes that contributor's access level, **Then** the displayed level updates to the new value.
5. **Given** an existing contributor, **When** an authorized user removes them and confirms, **Then** the contributor disappears from the list.
6. **Given** an authorized user adds a member who is the case creator or assignee, **When** the backend rejects it, **Then** a clear error message explains they already have access and cannot be added as a contributor.
7. **Given** an authorized user adds a member who is already a contributor, **When** the backend rejects it, **Then** a clear error message explains the member is already a contributor.

---

### User Story 2 - Controls match each user's actual access level (Priority: P1)

A user who can only **view** a case (e.g., a View-only contributor or an Organization Clerk) sees the case and its resources read-only — add/edit/delete buttons on tasks, hearings, documents, comments, invoices, and clients are hidden or disabled — while a user with **Edit** access can add and update resources but cannot delete the case or (for contributors) delete resources, and a user with **Full** access can do everything including delete.

**Why this priority**: Showing controls a user cannot use leads to confusing 401 errors on every click. Mirroring the ladder client-side gives a coherent experience and is explicitly recommended by the backend contract. It is co-critical with Story 1 because adding a contributor is meaningless if the resulting access is not reflected in the UI.

**Independent Test**: Sign in as a View-only contributor and confirm all mutation controls across the case tabs are hidden/disabled; sign in as an Edit contributor and confirm add/update controls appear but delete controls do not; sign in as a site admin and confirm all controls including delete appear.

**Acceptance Scenarios**:

1. **Given** a user with View access to a case, **When** they open any case tab, **Then** create/edit/delete controls for that tab's resources are not available.
2. **Given** a user with Edit access who is a contributor, **When** they open a resource tab, **Then** add and update controls are available but delete controls are not.
3. **Given** a user with Edit access who is the creator, assignee, or a Senior Legal Expert, **When** they open a resource tab, **Then** add, update, and delete controls for resources are available, but the "Delete Case" control is not.
4. **Given** a user with Full access (system/org/site admin), **When** they open the case, **Then** all controls including "Delete Case" and resource deletes are available.
5. **Given** any user, **When** the backend nonetheless returns 401 on a case-scoped action, **Then** a clear, non-crashing error message is shown rather than a raw error.

---

### User Story 3 - Case list shows only accessible cases (Priority: P2)

A legal expert who is neither the creator, assignee, nor contributor of most cases opens the case list and sees only the cases they actually have access to (created by them, assigned to them, where they are a contributor, or where they are a case client), rather than every case in the site.

**Why this priority**: This is the visible outcome of the restriction. The filtering itself happens on the backend, so the frontend change is primarily about correctly rendering the shorter list and explaining it; it depends on the backend list endpoint but not on Stories 1–2.

**Independent Test**: Sign in as a legal expert with access to a small subset of cases and confirm the case list shows only those cases; sign in as a site admin and confirm the full site case list is shown.

**Acceptance Scenarios**:

1. **Given** a user with limited access, **When** they open the case list, **Then** only cases they have access to (as creator, assignee, contributor, or case client) are displayed.
2. **Given** a user whose accessible-case set is empty, **When** they open the case list, **Then** a helpful empty-state message is shown indicating they may need to be added as a contributor, rather than a blank or error screen.
3. **Given** an admin / senior legal expert, **When** they open the case list, **Then** the full set of cases for their scope is shown (unchanged behavior).
4. **Given** a user who opens a case URL they no longer have access to, **When** the case fails to load with 401, **Then** a "you do not have permission to view this case" message is shown.

---

### User Story 4 - Choose contributor access when assigning a task or hearing (Priority: P3)

When a user assigns a task or hearing to a site member who is not already on the core case team, they can optionally choose whether that assignee is auto-granted View-only or Edit access to the case, so the assignee can see the case they were assigned work on.

**Why this priority**: It is a convenience layered on existing assignment flows and degrades gracefully — if no level is chosen the backend defaults to View-only. It is the least critical because assignment still works without any UI change.

**Independent Test**: Create or edit a task assigning it to a member outside the case team, choose "Edit" for their case access, save, and confirm the assignee appears as an Edit contributor on the Contributors tab.

**Acceptance Scenarios**:

1. **Given** a user assigning a task or hearing, **When** they pick an assignee, **Then** they may optionally select the contributor access level (View-only or Edit) to grant that assignee for the case.
2. **Given** the assigner does not choose a level, **When** they save the assignment, **Then** the assignment succeeds and the assignee receives View-only access by default.
3. **Given** an assignee who is the creator or current assignee, **When** the assignment is saved, **Then** no additional contributor access is implied or required (they already have access).
4. **Given** the task/hearing saves but the access grant is reported as failed, **When** the user retries the same assignment, **Then** it succeeds without creating duplicate access (the operation is safe to repeat).

---

### Edge Cases

- A user opens a case via a deep link (e.g., a tab URL) for a case they have no access to → the page shows a permission message, not a crash.
- A contributor removes themselves or is removed while viewing the case → subsequent actions surface a permission error and the user is guided back to the case list.
- The current user is both an admin and a contributor → the highest applicable access level governs the UI.
- A SiteClerk who created a case → does not get creator privileges and may see no management controls (mirrors backend exclusion).
- `createdById` / `assignedToId` of `0` or null → treated as "no creator/assignee" and never matched to user id 0 when computing access.
- The site member list used for adding contributors is empty or still loading → the add control communicates loading/empty state rather than allowing an invalid submission.
- A contributor's access level is changed by another manager while the tab is open → refreshing the list reflects the latest level.
- Adding/removing a contributor briefly fails due to network/permission error → the list is not left in an inconsistent state and the error is surfaced.

## Requirements *(mandatory)*

### Functional Requirements

#### Contributors tab and management

- **FR-001**: The case detail page MUST include a new **Contributors** tab alongside the existing tabs (Overview, eCourts, References, Clients, Tasks, Documents, Hearings, Comments, Invoice), positioned adjacent to the **Clients** tab to group the people-related tabs together, and available to any user who can view the case.
- **FR-002**: The Contributors tab MUST display the list of current contributors for the case, showing for each: full name, email, access level (View-only or Edit), the name of who added them, and the date added.
- **FR-003**: The Contributors tab MUST show an empty-state message when the case has no contributors.
- **FR-004**: Users authorized to manage contributors MUST be able to add a contributor by selecting a site member and an access level (View-only or Edit).
- **FR-005**: The add-contributor selector MUST source candidates from the case's site members and MUST filter out ineligible members client-side — those who are already contributors or who are the case creator/assignee — so only eligible members are selectable. Backend validation remains the fallback: if an ineligible member is somehow submitted, the resulting validation error MUST be surfaced clearly.
- **FR-006**: Users authorized to manage contributors MUST be able to change an existing contributor's access level between View-only and Edit.
- **FR-007**: Users authorized to manage contributors MUST be able to remove a contributor, with a confirmation step before removal.
- **FR-008**: The contributor list MUST refresh to reflect the result after a successful add, update, or remove.
- **FR-009**: Management controls (add / change-level / remove and any "manage contributors" affordance) MUST be shown only when the current user is a system admin, organization admin (org member), site admin (site member), the case creator, or the case assignee; they MUST be hidden for Senior Legal Experts, Organization Clerks, contributors, and case clients even when those users can otherwise edit the case.

#### Client-side access ladder

- **FR-010**: The frontend MUST determine the current user's effective case-entity access level and case-resource access level by mirroring the backend ladder, using the user's roles, the current user id, the case's creator and assignee ids, and the contributor list (matching the current user's id and contributor level).
- **FR-011**: When the user has only View access, the frontend MUST hide all mutation controls (create/edit/delete) for the case entity and its resources (controls are removed, not shown disabled/greyed-out).
- **FR-012**: When the user has Edit access, the frontend MUST allow modify/create actions permitted at that level while hiding actions that require Full access — specifically, the "Delete Case" control MUST be hidden for Edit-level users, and resource delete controls MUST be hidden for Edit **contributors** (who cap at Edit on resources) while remaining available to creators, assignees, and Senior Legal Experts (who have Full resource access).
- **FR-013**: When the user has Full access, the frontend MUST make all controls available, including case deletion and resource deletion.
- **FR-013a**: Controls that are unavailable due to insufficient access MUST be hidden rather than rendered in a disabled/greyed-out state; disabled states remain reserved for transient conditions (e.g., in-flight requests, loading data).
- **FR-014**: The frontend MUST treat resource access as potentially higher than entity access (e.g., a creator/assignee/Senior Legal Expert can fully manage resources including deletes but cannot delete the case itself) and gate resource controls on the resource level, not the entity level.
- **FR-015**: The frontend MUST treat the access ladder's "first match wins" precedence so that, when a user matches multiple rules, the highest applicable access governs the UI.

#### Case list filtering

- **FR-016**: The case list MUST render whatever set of cases the backend returns for the current user without assuming the full site list, correctly handling a shorter list than before.
- **FR-017**: When the returned case list is empty, the case list MUST show a helpful empty-state message that hints the user may need to be added as a contributor to see additional cases.
- **FR-018**: Admins and Senior Legal Experts MUST continue to see the full case list for their scope (no visible regression for these roles).

#### Assignment-time contributor grant

- **FR-019**: The task add/edit and hearing add/edit forms MUST allow the assigner to optionally choose the contributor access level (View-only or Edit) to grant the selected assignee for the case. The control MUST be shown whenever an assignee is selected (it is not conditionally hidden based on whether the assignee is already on the core case team; the backend no-ops the grant for the creator/assignee).
- **FR-020**: The assignment forms MUST submit the chosen access level as an optional value with the task/hearing request; when no level is chosen, the value MUST be omitted so the backend applies its View-only default.
- **FR-021**: The assignment access-level control MUST be presented in a way that makes clear it grants the assignee access to the case, and MUST not block saving when left unset.

#### Error handling

- **FR-022**: Any case-scoped action that returns 401 Unauthorized MUST surface a clear, user-friendly permission message via the standard notification mechanism rather than a raw or crashing error.
- **FR-023**: When a case fails to load because of insufficient access, the case detail page MUST show a "no permission to view this case" message consistent with the existing not-found/permission messaging.
- **FR-024**: Validation errors returned when adding/updating a contributor (already a contributor, not a site member, is creator/assignee) MUST be displayed to the user with their specific cause.

### Key Entities *(include if feature involves data)*

- **Case Contributor**: An explicit grant of access to one case for one site member. Key attributes: contributor record id, the case it belongs to, the member (user id, full name, email), the access level (View-only or Edit), who added them (id and name), and the date added. Unique per (case, member).
- **Contributor Access Level**: A two-value level — View-only or Edit — chosen when granting or updating contributor access. (Distinct from the broader internal access ladder, which the frontend computes but never displays as a number.)
- **Effective Case Access (derived)**: The frontend-computed access the current user has to a case and to its resources (None / View / Edit / Full), derived from roles, identity, creator/assignee ids, and contributor membership. Not returned by the backend; used only to drive UI affordances.
- **Case (existing, extended use)**: Reused with emphasis on `createdById` and `assignedToId`, which participate in access computation.
- **Task / Hearing assignment requests (existing, extended)**: Gain an optional contributor-access-level value applied to the assignee.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An authorized user can add, change the level of, and remove a contributor entirely from the Contributors tab without leaving the case page, and each change is reflected in the list within the same view.
- **SC-002**: 100% of case-resource mutation controls visible to a user correspond to actions the backend will permit for that user (i.e., a correctly-gated UI produces zero "looked enabled but returned 401" outcomes in normal flows).
- **SC-003**: A View-only user sees no enabled create/edit/delete controls across all case tabs; an Edit contributor sees add/update but no delete controls; a Full-access user sees all controls — verifiable by inspection for each role.
- **SC-004**: A restricted user's case list contains only cases they have access to, and when empty shows guidance rather than a blank screen; an admin's case list is unchanged.
- **SC-005**: Assigning a task or hearing to an outside-team member optionally grants the chosen access level, and that member subsequently appears as a contributor at that level; omitting the choice still results in the assignee gaining View-only access.
- **SC-006**: Every newly-possible 401 on case-scoped actions results in a readable permission message and no application crash.
- **SC-007**: Only users who are admins (system/org/site), the case creator, or the case assignee ever see contributor management controls; all other roles never see them.

## Assumptions

- **Roles and identity** are obtained from the existing role hook (`useUserRole`), which already exposes the relevant role flags and the current user id; no new auth mechanism is introduced.
- **Client-side mirroring of the access ladder** is the chosen approach (explicitly recommended by the backend contract) rather than relying solely on optimistic actions plus 401 handling. Backend remains the source of truth; the client computation only drives which controls are shown/enabled.
- The **site member list** needed for adding contributors and for assignment is available via the existing site-users data already loaded on the case detail page.
- **Contributor access level** is sent and received as the numeric enum (`0` = View-only, `1` = Edit); the UI presents human-readable labels ("View-only", "Edit").
- The **Contributors tab** is placed adjacent to the Clients tab (people-related grouping) and follows the existing tab pattern and ordering conventions of the case detail page.
- The **case list filtering** is performed entirely by the backend; the frontend does not implement its own filtering and only adapts rendering and empty states.
- **Auto-contributor on assignment** is handled by the backend after the task/hearing save; the frontend only adds the optional access-level field and does not need to make a separate contributor call for assignments. Retrying an assignment is safe (idempotent).
- The feature targets the **organization → site → case** area of the existing app (the `cases/[caseId]` route and the case list pages) and reuses existing toast/notification, confirmation-dialog, and table/empty-state patterns.
- Mirroring covers the resource controllers in scope: **tasks, hearings, documents, comments, invoices, and clients**.

## Dependencies

- Backend feature "Role-Based Case Access & Case Contributors" must be deployed, including the `case_contributors` table and the `SiteCaseContributorsController` endpoints (list/add/update/remove), the graded authorization on existing case-scoped endpoints, the row-filtered case list endpoint, and the optional `newAssigneeContributorAccessLevel` field on task/hearing add/update requests.
- The existing case detail page, case list pages, task/hearing assignment forms, role hook, notification context, and confirmation dialog are reused and extended.
