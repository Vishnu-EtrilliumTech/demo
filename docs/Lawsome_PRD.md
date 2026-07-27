# Lawsome - Product Requirements Document (PRD)
## Organization Management System

---

## Document Information

| Field | Details |
|-------|---------|
| **Document Version** | 1.5 |
| **Date** | November 27, 2025 |
| **Status** | Draft |
| **Target Audience** | QA Engineers, Developers, Sales Team |

### Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.5 | November 27, 2025 | Implemented authorship-based authorization for comment actions: Edit and delete buttons are now only visible to the author of each comment/reply. Non-authors can still view comments and add replies, but cannot modify or delete others' comments. This applies to both case-level and task-level comments. |
| 1.4 | November 27, 2025 | Clarified case client requirements: Case clients are informational records only and do not login to the system. Removed all references to client invitation system, client portal access, and client authentication. Updated SiteCaseClient role definition, permission matrix, and case client management documentation accordingly. |
| 1.3 | November 27, 2025 | Updated task due dates and hearing dates to allow past dates. Legal firms can now enter historical records and migrate legacy data. Past dates are supported for both task creation/editing and hearing scheduling/rescheduling. Updated case client requirements: Email ID and Phone Number are now optional fields (only Full Name and Gender are required). |
| 1.2 | November 25, 2025 | Added inline validation error handling for organization edit form. API validation errors (HTTP 400) now display field-specific messages inline, preserving form state instead of showing error page. |
| 1.1 | November 24, 2025 | Removed "Enabled" property from user management UI. All users are now always created and updated as enabled from the UI perspective. Account suspension is not currently a UI feature. |
| 1.0 | October 6, 2025 | Initial version |

---

## Table of Contents

1. [Document Overview](#1-document-overview)
2. [Product Overview](#2-product-overview)
3. [User Roles and Permissions](#3-user-roles-and-permissions)
4. [Organization Management](#4-organization-management)
5. [Site Management](#5-site-management)
6. [Case Management](#6-case-management)
7. [Testing Guidelines](#7-testing-guidelines)
8. [Appendices](#8-appendices)

---

## 1. Document Overview

### 1.1 Introduction

This Product Requirements Document (PRD) provides comprehensive documentation for the Lawsome Organization Management System. Lawsome is a web-based legal services platform designed to help law firms manage their day-to-day operations, including managing multiple sites, tracking cases, handling hearings, managing documents, and processing invoices.

### 1.2 Purpose

The primary purpose of this document is to:
- Provide QA engineers with detailed functional specifications for testing
- Document all features, workflows, and business rules
- Define user roles and their capabilities
- Establish test scenarios and acceptance criteria
- Serve as a reference for product behavior and expected outcomes

### 1.3 Scope

This PRD covers the **Organization Management module** of Lawsome, which includes:
- Organization registration and management
- Site (location) management
- Case lifecycle management
- User management at organization and site levels
- Case-related features: tasks, hearings, documents, clients, comments, and invoices

---

## 2. Product Overview

### 2.1 Product Description

Lawsome is a comprehensive legal practice management application that enables law firms to:
- Organize their operations across multiple geographical locations (sites)
- Manage legal cases from initiation to closure
- Track case-related activities including tasks, hearings, and documentation
- Collaborate with clients and team members through comments and notifications
- Generate and manage invoices for legal services
- Maintain detailed records of all legal proceedings and communications

### 2.2 Key Features

1. **Multi-Site Organization Structure**
   - Hierarchical organization: Organization → Sites → Cases
   - Separate user management at organization and site levels
   - Location-based case assignment and tracking

2. **Comprehensive Case Management**
   - Full case lifecycle tracking (Open → InProgress → OnHold → Closed)
   - Case assignment to legal experts
   - Case details editing and status updates

3. **Task Management**
   - Task creation and assignment within cases
   - Task status tracking (Open, InProgress, OnHold, Blocked, Closed)
   - Task-specific document attachments
   - Task comments and collaboration

4. **Hearing Management**
   - Schedule and track court hearings
   - Hearing rescheduling capability
   - Hearing notes and location tracking

5. **Document Management**
   - Case-level and task-level document uploads
   - Document viewing and deletion controls
   - Support for multiple file types (max 1MB)

6. **Client Management**
   - Add clients to cases (SiteCaseClient role)
   - Client details management

7. **Invoice Management**
   - Invoice creation and tracking
   - Payment status management (None, Pending, Failed, Paid)
   - Invoice editing capability

8. **Comments & Collaboration**
   - Case-level comments with reply functionality
   - Task-level comments with reply functionality
   - Authorship-based action visibility: Edit and delete buttons only visible to comment/reply authors
   - Reply button visible to all users for collaborative discussions
   - Fail-secure behavior: Action buttons hidden when authorship cannot be determined

### 2.3 Technical Stack

| Component | Technology |
|-----------|-----------|
| Frontend Framework | Next.js 15 with React 19 |
| Language | TypeScript |
| State Management | Redux Toolkit + Redux Persist |
| Authentication | Keycloak SSO |
| UI Components | Material-UI + Tailwind CSS |
| HTTP Client | Axios with interceptors |
| Maps Integration | Google Maps API |
| Backend API | .NET Core (separate codebase) |

---

## 3. User Roles and Permissions

### 3.1 Role Hierarchy

Lawsome implements a hierarchical role-based access control system with two main categories:

1. **Organization-Level Roles**
   - OrganizationAdmin
   - OrganizationClerk

2. **Site-Level Roles**
   - SiteAdmin
   - SiteClerk
   - SiteSeniorLegalExpert (SiteSrLegalExpert)
   - SiteLegalExpert

3. **Case-Level Roles**
   - SiteCaseClient

### 3.2 Role Definitions and Permissions

#### 3.2.1 OrganizationAdmin

**Access Level:** Full access to all organization resources

**Capabilities:**
- **Organization Management:**
  - View and update organization details
  - Enable/disable organization (via support team only)

- **Site Management:**
  - Create, read, update, delete (CRUD) sites
  - View all sites under the organization
  - **Deletion Constraint:** Sites cannot be deleted if users are still assigned. All users must be removed from the site before deletion.

- **User Management:**
  - CRUD users at organization level
  - CRUD users at site level
  - Assign roles to users

- **Case Management:**
  - CRUD cases under any site
  - Edit case details and status
  - Reassign cases to different legal experts

- **Within Cases:**
  - CRUD case clients
  - CRUD case tasks
  - CRUD case documents
  - CRUD case hearings
  - CRUD invoices
  - Add/edit/delete comments (own comments only for edit)
  - View all case-related information

**Notes:**
- OrganizationAdmin has the highest level of privileges
- Can access all sites and cases within the organization
- Cannot be restricted to specific sites

#### 3.2.2 OrganizationClerk

**Access Level:** Limited administrative access across all organization resources

**Capabilities:**
- **Organization Management:**
  - View organization details (read-only)
  - Cannot edit or delete organization

- **Site Management:**
  - Create, read, update, delete (CRUD) sites
  - View all sites under the organization
  - Full site management privileges
  - **Deletion Constraint:** Sites cannot be deleted if users are still assigned. All users must be removed from the site before deletion.

- **User Management:**
  - **Organization-Level Users:**
    - View all organization users (read-only)
    - Cannot create, edit, or delete organization-level users
  - **Site-Level Users:**
    - CRUD users at site level
    - Can only assign site-level roles (SiteAdmin, SiteClerk, SiteSrLegalExpert, SiteLegalExpert)
    - Cannot assign organization-level roles (OrganizationAdmin, OrganizationClerk)

- **Case Management:**
  - No access to cases
  - Cannot view, create, edit, or delete cases
  - Cases tab is hidden in UI

- **Within Cases:**
  - No access to any case-related features

**Restrictions:**
- Cannot modify organization details
- Cannot manage organization-level users (add/edit/delete)
- Cannot access any case management features
- Cannot view or manage case-related data (tasks, hearings, documents, invoices, etc.)
- Can only assign site-level roles when creating or editing site users

**Notes:**
- OrganizationClerk is designed for administrative staff who handle site and user management but should not have access to sensitive case information
- All authorization is enforced on the backend API; frontend restrictions are for UX only
- Role validation prevents clerks from escalating privileges by assigning organization-level roles

#### 3.2.3 SiteAdmin

**Access Level:** Full access to assigned site resources

**Capabilities:**
- **Site Access:**
  - Access only to assigned site (cannot access other sites)

- **User Management:**
  - CRUD users within assigned site

- **Case Management:**
  - CRUD cases within assigned site
  - Edit case details and status
  - Reassign cases within site

- **Within Cases:**
  - CRUD case clients
  - CRUD case tasks
  - CRUD case documents
  - CRUD case hearings
  - CRUD invoices
  - Add/edit/delete comments
  - View all case-related information

**Restrictions:**
- Cannot access or manage other sites
- Cannot manage organization-level settings
- Limited to single site assignment

#### 3.2.4 SiteClerk

**Access Level:** Administrative and operational access within assigned site

**Capabilities:**
- **Site Access:**
  - Access only to assigned site (cannot access other sites)
  - View and edit site details

- **User Management:**
  - CRUD users within assigned site
  - Can assign site-level roles (except SiteAdmin role - privilege escalation prevention)
  - Cannot create SiteAdmin users

- **Case Management:**
  - CRUD cases within assigned site
  - Edit case details and status
  - Reassign cases within site
  - Delete cases

- **Within Cases:**
  - CRUD case clients
  - CRUD case tasks
  - CRUD case documents
  - CRUD case hearings
  - CRUD invoices
  - Add/edit/delete comments (own comments only for edit/delete)
  - View all case-related information

- **Dashboard Access:**
  - Access to personal dashboard showing assigned cases, tasks, and hearings

**Restrictions:**
- Cannot create users with SiteAdmin role (privilege escalation prevention)
- Cannot edit other users (only specific site users with restrictions)
- Cannot delete site users
- Cannot access or manage other sites
- Cannot manage organization-level settings
- Limited to single site assignment

**Notes:**
- SiteClerk has similar permissions to SiteAdmin for case management
- Key difference from SiteAdmin: Cannot delete users, cannot create SiteAdmin users
- Designed for administrative staff who handle day-to-day operations but with restricted user management

#### 3.2.5 SiteSeniorLegalExpert (SiteSrLegalExpert)

**Access Level:** Full case and operational access within assigned site

**Capabilities:**
- **Site Access:**
  - Access only to assigned site (cannot access other sites)
  - View site details (read-only)

- **User Management:**
  - CRUD users within assigned site
  - Can assign site-level roles (except SiteAdmin role)
  - Cannot create SiteAdmin users
  - Cannot delete users

- **Case Management:**
  - CRUD cases within assigned site
  - Edit case details and status
  - Reassign cases within site
  - Cannot delete cases (requires SiteAdmin or SiteClerk)

- **Within Cases:**
  - CRUD case clients
  - CRUD case tasks (including delete)
  - CRUD case documents
  - CRUD case hearings
  - CRUD invoices
  - Add/edit/delete comments (own comments only for edit/delete)
  - View all case-related information

- **Dashboard Access:**
  - Access to personal dashboard showing assigned cases, tasks, and hearings

**Restrictions:**
- Cannot delete cases (only SiteAdmin, SiteClerk can delete)
- Cannot create SiteAdmin users
- Cannot delete site users
- Cannot edit site details
- Cannot access or manage other sites
- Cannot manage organization-level settings
- Limited to single site assignment

**Notes:**
- Senior legal experts have elevated permissions compared to SiteLegalExpert
- Can manage users and perform most administrative tasks
- Focused on legal work with additional team management capabilities
- "Senior" designation reflects experience and additional responsibilities

#### 3.2.6 SiteLegalExpert

**Access Level:** Full case and operational access within assigned site

**Capabilities:**
- **Site Access:**
  - Access only to assigned site (cannot access other sites)
  - View site details (read-only)

- **User Management:**
  - CRUD users within assigned site
  - Can assign site-level roles (except SiteAdmin role)
  - Cannot create SiteAdmin users
  - Cannot delete users

- **Case Management:**
  - CRUD cases within assigned site
  - Edit case details and status
  - Reassign cases within site
  - Cannot delete cases (requires SiteAdmin or SiteClerk)

- **Within Cases:**
  - CRUD case clients
  - CRUD case tasks (including delete)
  - CRUD case documents
  - CRUD case hearings
  - CRUD invoices
  - Add/edit/delete comments (own comments only for edit/delete)
  - View all case-related information

- **Dashboard Access:**
  - Access to personal dashboard showing assigned cases, tasks, and hearings

**Restrictions:**
- Cannot delete cases (only SiteAdmin, SiteClerk can delete)
- Cannot create SiteAdmin users
- Cannot delete site users
- Cannot edit site details
- Cannot access or manage other sites
- Cannot manage organization-level settings
- Limited to single site assignment

**Notes:**
- SiteLegalExpert has identical permissions to SiteSeniorLegalExpert in current implementation
- The distinction between Senior and regular Legal Expert may be used for:
  - Experience level designation
  - Billing rates
  - Client assignment preferences
  - Future feature differentiation
- Focused primarily on legal case work with team collaboration capabilities

#### 3.2.7 SiteCaseClient

**Access Level:** Informational record only (no system access)

**Important:** Case clients are informational records only. They do not login to the system and have no portal access. The SiteCaseClient role exists for data modeling purposes but does not grant any active system permissions.

**Notes:**
- Case clients are contact records stored against cases for reference
- No invitation system exists for case clients
- No login, authentication, or portal access for case clients
- Clients are case-specific (assigned per case)

### 3.3 Personal Dashboard Access Control

**Navigation:** `/organization/[organizationId]/sites/[siteId]/users/[userId]`

The Personal Dashboard is a user-specific view that displays cases, tasks, and hearings assigned to a specific site user. This dashboard provides a personalized overview of an individual user's workload within a specific site.

**Access Restrictions:**

Only users with **site-level roles** can access the Personal Dashboard:
- ✓ **SiteAdmin**
- ✓ **SiteClerk**
- ✓ **SiteSrLegalExpert**
- ✓ **SiteLegalExpert**

**Restricted Roles (No Access):**
- ✗ **OrganizationAdmin** - Should use organization dashboard instead
- ✗ **OrganizationClerk** - Should use organization dashboard instead
- ✗ **SiteCaseClient** - No dashboard access

**Behavior:**

1. **Authorized Access:**
   - Users with site-level roles can access their personal dashboard
   - Dashboard shows filtered view of cases, tasks, and hearings assigned to them
   - Users can switch between different sites they are assigned to

2. **Unauthorized Access:**
   - Users without site-level roles will see an "Access Denied" message
   - Error page displays:
     - Block icon with "Access Denied" heading
     - Clear explanation of access requirements
     - List of allowed site-level roles
     - "Go to Organization Dashboard" button for navigation

3. **Authentication Flow & Default Landing Pages:**

   **After login, users are redirected to their default dashboard based on role:**

   - **Organization-level roles** → Organization Dashboard
     - OrganizationAdmin
     - OrganizationClerk

   - **Site Management roles** → Site Dashboard (with access to Personal Dashboard)
     - SiteAdmin
     - SiteClerk

   - **Site Legal Expert roles** → Personal Dashboard
     - SiteSrLegalExpert
     - SiteLegalExpert

   **Note:** While SiteAdmin and SiteClerk default to Site Dashboard, they can still access and navigate to their Personal Dashboard through the navigation menu. This allows them to view their individual workload alongside their site management responsibilities.

**Dashboard Features:**

- **Summary Cards:** Display count of open cases, pending tasks, and upcoming hearings
- **Cases Table:** Shows all cases assigned to the logged-in user with filtering options
- **Pending Tasks List:** Quick view of tasks requiring attention
- **Upcoming Hearings List:** Calendar view of scheduled hearings
- **Site Switcher:** Allows users assigned to multiple sites to switch between site contexts

**Data Filtering:**

The Personal Dashboard displays only data that is directly assigned to the logged-in user:

- **Cases:** Only shows cases where the user is assigned as a team member (via case assignments)
- **Tasks:** Only shows tasks assigned to the user within their assigned cases
- **Hearings:** Only shows hearings for cases the user is assigned to
- **Documents:** Access limited to documents in assigned cases only

This ensures users see only their individual workload and not the entire site's data.

### 3.4 Permission Matrix

This matrix reflects the actual API permissions as defined in the backend authorization system. 

| Feature | OrgAdmin | OrgClerk | SiteAdmin | SiteClerk | SiteSrLegal | SiteLegal | CaseClient |
|---------|----------|----------|-----------|-----------|-------------|-----------|------------|
| **Organization** |
| View org details | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit org details | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Sites** |
| Create site | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View sites (all) | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View site (assigned) | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit site | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete site | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Users** |
| Add org user | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View org users | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Edit org user | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Delete org user | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Add site user | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| View site users | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit site user | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| Delete site user | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Dashboard** |
| Personal dashboard | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| **Cases** |
| Create case | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| View case (all in site) | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| View case (assigned) | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit case | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Delete case | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Change status | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| **Case Clients** |
| Add client | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| View clients | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit client | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Delete client | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| **Tasks** |
| Create task | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| View tasks | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit task | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Delete task | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| **Documents** |
| Upload case doc | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| View case doc | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Delete case doc | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Upload task doc | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Delete task doc | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| **Hearings** |
| Create hearing | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| View hearings | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit hearing | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Delete hearing | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| **Invoices** |
| Create invoice | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| View invoices | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit invoice | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Delete invoice | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| **Comments** |
| Add comment | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| View comments | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit comment | ✓ (own) | ✗ | ✓ (own) | ✓ (own) | ✓ (own) | ✓ (own) | ✗ |
| Delete comment | ✓ (own) | ✗ | ✓ (own) | ✓ (own) | ✓ (own) | ✓ (own) | ✗ |

**Legend:**
- ✓ = Allowed
- ✗ = Not Allowed

**Key Permission Notes:**

1. **OrganizationClerk Restrictions:**
   - Cannot manage organization users (add/edit/delete) - prevents privilege escalation
   - Cannot access any case-related features (cases, tasks, documents, hearings, invoices, comments)
   - Can manage sites and site users only
   - Has read-only access to organization details

2. **Site User Creation Restrictions:**
   - **SiteClerk** cannot create users with **SiteAdmin** role (privilege escalation prevention)
   - **SiteLegalExpert** and **SiteSrLegalExpert** cannot create users with **SiteAdmin** role
   - Only **OrgAdmin**, **OrgClerk**, and **SiteAdmin** can create **SiteAdmin** users

3. **Case Delete Permissions:**
   - Only **OrgAdmin**, **SiteAdmin**, and **SiteClerk** can delete cases
   - Legal experts (both Senior and regular) cannot delete cases

4. **Task Delete Permissions:**
   - All site-level roles can delete tasks (including legal experts)

5. **CaseClient Role:**
   - CaseClient is an informational record only - case clients do not login to the system
   - All CaseClient permissions are ✗ because they have no system access
   - Case clients serve as contact records stored against cases for reference

**Source:** Complete API endpoint permissions are documented in `/Docs/API_Permissions_Matrix.md` in the backend codebase

---

## 4. Organization Management

### 4.1 Organization Registration

#### 4.1.1 Registration Flow

**User Journey:**
1. User navigates to Lawsome home page
2. Clicks "Login/Register" button (top right)
3. Redirected to Keycloak authorization page
4. Clicks "Register" link on auth page
5. Selects "Organization User" as registration type
6. Fills organization registration form
7. Submits form
8. Redirected to success page

#### 4.1.2 Registration Form Fields

**Organization Details:**

| Field | Type | Required | Validation Rules | Example |
|-------|------|----------|------------------|---------|
| Organization Name | Text | Yes | Min 2 characters | "Smith & Associates Law Firm" |
| Organization Description | Textarea | No | Max 500 characters | "Full-service law firm specializing in corporate law" |
| Organization Email | Email | Yes | Valid email format | "contact@smithlaw.com" |
| Organization Phone | Tel | Yes | Min 10 digits, allows spaces, hyphens, parentheses | "+1 (555) 123-4567" |
| Segments | Multi-select | Yes | At least one selected | ["Legal", "Insurance"] |

**Administrator Details:**

| Field | Type | Required | Validation Rules | Example |
|-------|------|----------|------------------|---------|
| Full Name | Text | Yes | Min 2 characters, letters/spaces/hyphens/apostrophes only | "John Smith" |
| Email ID | Email | Yes (auto-filled from Keycloak) | Valid email format, read-only | "john@example.com" |
| Phone Number | Tel | Yes | 10-15 digits | "5551234567" |
| Gender | Select | Yes | Options: Male, Female, Trans gender | "Male" |

#### 4.1.3 Business Rules

1. **Email Uniqueness:** Organization email must be unique in the system
2. **Admin Creation:** First user registered becomes OrganizationAdmin automatically
3. **Organization Status:**
   - **Production:** Organization created in "disabled" state by default
   - **Testing:** Organization enabled by default for faster testing
4. **Keycloak Integration:** User must authenticate via Keycloak before registration
5. **Single Organization:** One administrator can create only one organization (per email)

#### 4.1.4 Post-Registration Process

**Production Environment:**
1. Organization registered in disabled state
2. Admin receives confirmation email 
3. Admin submits required documents to Lawsome support team via email
4. Support team reviews documents
5. Support team enables organization manually
6. Admin receives notification of activation 

**Testing Environment:**
1. Organization registered and immediately enabled
2. Admin can log in and start using the system
3. No document submission required

#### 4.1.5 Validation & Error Handling

**Form Validation Errors:**

| Error Condition | Error Message |
|----------------|---------------|
| Full name empty | "Full name is required" |
| Full name < 2 chars | "Full name must be at least 2 characters" |
| Full name invalid chars | "Full name can only contain letters, spaces, hyphens, and apostrophes" |
| Email empty | "Email is required" |
| Email invalid format | "Please enter a valid email address" |
| Organization name empty | "Organization name is required" |
| Organization email empty | "Organization email is required" |
| Organization email invalid | "Please enter a valid email address" |
| Organization phone empty | "Organization phone is required" |
| Organization phone invalid | "Please enter a valid phone number" |
| No segments selected | "At least one segment must be selected" |
| Gender not selected | "Gender is required" |
| Phone number empty | "Phone number is required" |
| Phone number invalid | "Please enter a valid phone number (10 digits)" |

**API Errors:**
- **Status 201:** Registration successful
- **Status 400:** Validation error from backend
- **Status 500:** Server error - display generic error message

### 4.2 Organization Details Management

#### 4.2.1 View Organization Details

**Navigation:** `/organization/[organizationId]`

**Displayed Information:**
- Organization Name
- Organization Description
- Organization Email
- Organization Phone Number
- Segments (tags/chips display)
- Created Date
- Updated Date
- Enabled Status
- Current User Information (name, email, role)

**Access Control:**
- OrganizationAdmin: Can view
- OrganizationClerk: Can view (read-only)
- Site-level roles: Can view (read-only)
- SiteCaseClient: Cannot view

#### 4.2.2 Edit Organization Details

**Navigation:** Organization details page → Edit button

**Editable Fields:**

| Field | Can Edit | Notes |
|-------|----------|-------|
| Organization Name | ✓ | |
| Organization Description | ✓ | |
| Organization Email | ✓ | Must remain unique |
| Organization Phone | ✓ | |
| Segments | ✓ | Multi-select |
| Enabled Status | ✗ | Only support team can modify |
| Created Date | ✗ | Read-only |
| Administrator | ✗ | Cannot change organization owner |

**Update Flow:**
1. User clicks "Edit" button
2. Form displays with current values pre-populated
3. User modifies fields
4. User clicks "Save" or "Update"
5. System validates input
6. API call to update organization
7. Success message displayed
8. User redirected to organization details page

**Validation Error Handling:**
- If API returns validation errors (HTTP 400), errors are displayed inline above the relevant form fields
- Field-specific error messages help users understand what needs to be corrected
- The form remains in edit mode with all entered data preserved
- Invalid fields are highlighted with red borders
- Users can correct errors and resubmit without losing form state
- Non-validation errors (network errors, server errors) still show the error page with retry option

**Business Rules:**
- Only OrganizationAdmin can edit organization details
- Organization email must remain unique
- At least one segment must be selected
- Changes are immediately reflected across all sites

#### 4.2.3 Enable/Disable Organization

**Current Implementation Status:** Feature not yet implemented

**Intended Behavior (Future):**
- Only Lawsome support team can enable/disable organizations
- When organization is disabled:
  - All users (including admin) cannot log in
  - All sites and cases become inaccessible
  - Data is preserved but read-only
  - Support team can re-enable at any time
- When organization is enabled:
  - All users regain access based on their roles
  - All sites and cases become accessible again

**Testing Note:** This functionality cannot be tested in current version

### 4.3 Organization Users Management

#### 4.3.1 View Organization Users

**Navigation:** `/organization/[organizationId]` → Users Tab

**User List Display:**

| Column | Description | Data Type |
|--------|-------------|-----------|
| Full Name | User's full name | String |
| Email ID | User's email address | Email |
| Phone Number | User's contact number | String |
| Roles | User's assigned roles (badges) | Array of strings |
| Registered Date | When user joined | DateTime |
| Last Login Date | Last access timestamp | DateTime |
| Actions | Edit/Delete buttons | Buttons |

**Features:**
- Sortable columns
- Search/filter functionality
- Pagination (if many users)
- Role badges with color coding

#### 4.3.2 Add Organization User

**Navigation:** Organization users list → "Add User" button

**Form Fields:**

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Full Name | Text | Yes | Min 2 chars | |
| Email ID | Email | Yes | Valid email, unique | |
| Phone Number | Tel | Yes | 10-15 digits | |
| Gender | Select | Yes | Male/Female/Trans gender | |
| Roles | Select | Yes | OrganizationAdmin, OrganizationClerk | Organization-level roles only |

**Note:** The "Enabled" field has been removed from the UI. All users are created as enabled by default. Account suspension is not currently available as a UI feature.

**Business Rules:**
1. Email must be unique within organization
2. At least one role must be assigned
3. Only organization-level roles can be assigned (OrganizationAdmin, OrganizationClerk)
4. Multiple roles can be assigned to same user

**API Endpoint:** `POST /api/v1/organizations/{orgId}/users`

#### 4.3.3 Edit Organization User

**Navigation:** User list → Edit icon/button for specific user

**Editable Fields:**
- Full Name
- Phone Number
- Gender
- Roles (organization-level only)

**Non-Editable Fields:**
- Email ID (system identifier)
- Registered Date
- Last Login Date
- User ID

**Note:** The "Enabled" field has been removed from the UI. All users remain enabled when updated through the UI. Account suspension is not currently available as a UI feature.

**Business Rules:**
1. Cannot remove all roles from user
2. Role changes take effect on next login

**API Endpoint:** `PUT /api/v1/organizations/{orgId}/users/{userId}`

#### 4.3.4 Delete Organization User

**Navigation:** User list → Delete icon/button for specific user

**Confirmation Dialog:**
```
Title: "Delete User"
Message: "Are you sure you want to delete [User Full Name]? This action cannot be undone."
Actions: [Cancel] [Delete]
```

**Business Rules:**
1. Cannot delete self (TBD)
3. Deletion is permanent
4. Associated comments/activities remain but show "Deleted User"(TBD)

**API Endpoint:** `DELETE /api/v1/organizations/{orgId}/users/{userId}`

**Testing Considerations:**
- Test deletion of user with no case assignments
- Test deletion of user with past case assignments
- Test deletion of user with active case assignments
- Verify inability to delete self
- Verify data cleanup after deletion

---

## 5. Site Management

### 5.1 Site Overview

A **Site** represents a physical location or branch of the law firm organization. Sites enable organizations to:
- Manage operations across multiple geographical locations
- Assign users and cases to specific locations
- Track location-specific legal activities
- Maintain separate teams for different offices

**Key Characteristics:**
- Each site belongs to one organization
- Sites can exist without users or cases
- Users can be assigned to only one site
- Cases are always associated with a specific site
- No limit on number of sites per organization

### 5.2 View Sites

#### 5.2.1 Organization-Level Site List

**Navigation:** `/organization/[organizationId]` → Sites Tab

**List Display:**

| Column | Description | Data Type | Notes |
|--------|-------------|-----------|-------|
| Name | Site name | String | Clickable link to site details |
| Description | Brief description | String | Truncated if long |
| Address | Site address | String | Full address |
| District | District name | String | |
| State | State/Province | String | |
| Phone Number | Contact number | String | |
| Email ID | Contact email | Email | |
| Enabled Status | Active/Inactive | Boolean | Badge display **[Planned for Future Implementation]** |
| Created Date | When created | DateTime | |
| Actions | Edit/Delete buttons | Buttons | |

**Features:**
- Sortable columns (Name, Created Date, District, State)
- Search functionality (by name, district, state)
- Filter by status (Enabled/Disabled) **[Planned for Future Implementation]**
- Pagination for large lists
- "Add Site" button (top right)

**Access Control:**
- OrganizationAdmin: View all sites
- OrganizationClerk: View all sites
- SiteAdmin: View only assigned site
- Other site roles: View only assigned site
- SiteCaseClient: Cannot view site list

### 5.3 Create Site

#### 5.3.1 Navigation

- From: `/organization/[organizationId]` → Sites Tab → "Add Site" button
- To: `/organization/[organizationId]/sites/new`

#### 5.3.2 Form Fields

| Field | Type | Required | Validation Rules | Example |
|-------|------|----------|------------------|---------|
| Site Name | Text | Yes | Min 2 chars, max 100 chars | "Downtown Office" |
| Description | Textarea | No | Max 500 chars | "Main office located in city center" |
| Phone Number | Tel | No | 10-15 digits with formatting | "+1 (555) 123-4567" |
| Email ID | Email | No | Valid email format | "downtown@smithlaw.com" |
| Address | Text | Yes | Min 5 chars | "123 Main Street, Suite 100" |
| Locality | Text | No | | "Business District" |
| Landmark | Text | No | | "Near City Hall" |
| District | Text | Yes | | "Manhattan" |
| State | Text | Yes | | "New York" |
| Pincode | Text | Yes | 5-10 alphanumeric | "10001" |
| Latitude | Number | No | Valid coordinate (-90 to 90) | 40.7128 |
| Longitude | Number | No | Valid coordinate (-180 to 180) | -74.0060 |
| Enabled | Checkbox | No | Default: true **[Planned for Future Implementation]** | true |

#### 5.3.3 Address Input Features

**Google Maps Integration:**
- Autocomplete for address field
- Selecting address auto-fills:
  - Locality
  - District
  - State
  - Pincode
  - Latitude
  - Longitude
- Manual override allowed for all fields

#### 5.3.4 Business Rules

1. ~~**Site Name:** Must be unique within organization~~
2. **Address Validation:** Address, District, State, and Pincode are mandatory
3. **Contact Information:** Phone and email are optional but recommended
4. **Geolocation:** Latitude/Longitude optional, auto-populated if using Google Maps
5. **Default Status:** Sites are enabled by default **[Planned for Future Implementation]**
6. **Organization Association:** Site automatically associated with current organization

#### 5.3.5 Creation Flow

1. User clicks "Add Site" button
2. Form displays with empty fields
3. User enters site name
4. User enters address (with or without autocomplete)
5. User fills remaining required fields
6. User optionally adds phone, email, description
7. User clicks "Save" or "Create"
8. System validates all inputs
9. API creates site
10. Success message displayed
11. User redirected to site details page

**API Endpoint:** `POST /api/v1/organizations/{orgId}/sites`

**Success Response:** Status 201, site ID returned

**Error Responses:**
- Status 400: Validation error
- ~~Status 409: Duplicate site name~~
- Status 500: Server error

### 5.4 View Site Details

#### 5.4.1 Navigation

`/organization/[organizationId]/sites/[siteId]`

#### 5.4.2 Site Details Display

**Site Information Section:**
- Site Name (header)
- Description
- Enabled Status (badge) **[Planned for Future Implementation]**
- Created Date
- Updated Date

**Contact Information:**
- Phone Number
- Email Address

**Location Information:**
- Full Address
- Locality
- Landmark
- District
- State
- Pincode
- Map display (if latitude/longitude available)

**Actions:**
- Edit Site button
- Delete Site button (with confirmation)

#### 5.4.3 Site Tabs

The site details page contains tabs for:

1. **Users Tab**
   - List of users assigned to this site
   - Add/Edit/Delete site users
   - Role management

2. **Cases Tab**
   - List of cases under this site
   - Add/Edit/Delete cases
   - Case status overview

### 5.5 Edit Site

#### 5.5.1 Navigation

`/organization/[organizationId]/sites/[siteId]/edit`

#### 5.5.2 Editable Fields

All fields from creation form can be edited:
- Site Name
- Description
- Phone Number
- Email ID
- Address
- Locality
- Landmark
- District
- State
- Pincode
- Latitude
- Longitude
- Enabled status **[Planned for Future Implementation]**

#### 5.5.3 Non-Editable Fields

- Site ID
- Organization ID
- Created Date
- Created By

#### 5.5.4 Edit Flow

1. User navigates to site details
2. Clicks "Edit" button
3. Form loads with current values pre-populated
4. User modifies desired fields
5. Clicks "Save" or "Update"
6. System validates changes
7. API updates site
8. Success message displayed
9. User redirected to site details page

**Business Rules:**
- ~~Site name must remain unique within organization~~
- Cannot change organization association
- Disabling site does not delete users or cases **[Planned for Future Implementation]**
- Changes reflected immediately

**API Endpoint:** `PUT /api/v1/organizations/{orgId}/sites/{siteId}`

**Access Control:**
- OrganizationAdmin: Can edit any site
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: Can edit only assigned site
- Other roles: Cannot edit

### 5.6 Delete Site

#### 5.6.1 Navigation

From site details page or site list → Delete button

#### 5.6.2 Confirmation Dialog

```
Title: "Delete Site"
Message: "Are you sure you want to delete [Site Name]?
         This will also delete all associated users and cases.
         This action cannot be undone."
Actions: [Cancel] [Delete]
```

#### 5.6.3 Business Rules

1. **Cascade Delete:** Deleting site also deletes:
   - All site users
   - All cases under site
   - All case-related data (tasks, hearings, documents, comments, invoices)
2. **Permanent Action:** Deletion is irreversible
3. **Permission Required:** Only OrganizationAdmin can delete sites
4. **Confirmation Required:** Must confirm deletion in dialog

**API Endpoint:** `DELETE /api/v1/organizations/{orgId}/sites/{siteId}`

**Testing Considerations:**
- Delete site with no users or cases
- Delete site with users but no cases
- Delete site with cases but no users
- Delete site with both users and cases
- Verify cascade deletion of all related data
- Verify inability for SiteAdmin to delete their own site

### 5.7 Site Users Management

#### 5.7.1 View Site Users

**Navigation:** `/organization/[organizationId]/sites/[siteId]` → Users Tab

**User List Display:**

| Column | Description | Data Type |
|--------|-------------|-----------|
| Full Name | User's full name | String |
| Email ID | User's email address | Email |
| Phone Number | User's contact number | String |
| Roles | Site roles (badges) | Array of strings |
| Enabled Status | Active/Inactive | Boolean (badge) |
| Registered Date | When user joined | DateTime |
| Last Login Date | Last access | DateTime |
| Actions | Edit/Delete buttons | Buttons |

**Features:**
- Search by name or email
- Filter by role
- Filter by enabled status
- Sortable columns
- Pagination

#### 5.7.2 Add Site User

**Navigation:** Site users list → "Add User" button → `/organization/[organizationId]/sites/[siteId]/users/new`

**Form Fields:**

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Full Name | Text | Yes | Min 2 chars | |
| Email ID | Email | Yes | Valid email, unique | |
| Phone Number | Tel | Yes | 10-15 digits | |
| Gender | Select | Yes | Male/Female/Trans gender | |
| Roles | Select | Yes | Site-level roles only | SiteAdmin, SiteClerk, SiteSrLegalExpert, SiteLegalExpert |

**Note:** The "Enabled" field has been removed from the UI. All users are created as enabled by default. Account suspension is not currently available as a UI feature.

**Available Site Roles:**
- SiteAdmin
- SiteClerk
- SiteSeniorLegalExpert
- SiteLegalExpert

**Business Rules:**
1. Email must be unique within organization
2. User can be assigned to only ONE site
3. At least one site role must be assigned
4. Multiple site roles can be assigned to same user
5. Cannot assign organization-level roles at site level 

**API Endpoint:** `POST /api/v1/organizations/{orgId}/sites/{siteId}/users`

**Access Control:**
- OrganizationAdmin: Can add users to any site
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: Can add users to assigned site only
- Other roles: Cannot add users

#### 5.7.3 Edit Site User

**Navigation:** `/organization/[organizationId]/sites/[siteId]/users/[userId]/edit`

**Editable Fields:**
- Full Name
- Phone Number
- Gender
- Roles (site-level only)

**Non-Editable Fields:**
- Email ID
- Site assignment (cannot move user to different site)
- Registered Date
- Last Login Date

**Note:** The "Enabled" field has been removed from the UI. All users remain enabled when updated through the UI. Account suspension is not currently available as a UI feature.

**Business Rules:**
1. Cannot remove all roles from user
2. Cannot change user's site assignment (must delete and recreate)
3. Role changes take effect on next login

**API Endpoint:** `PUT /api/v1/organizations/{orgId}/sites/{siteId}/users/{userId}`

#### 5.7.4 Delete Site User

**Navigation:** Site user list → Delete button

**Confirmation Dialog:**
```
Title: "Delete User"
Message: "Are you sure you want to delete [User Full Name]? This action cannot be undone."
Actions: [Cancel] [Delete]
```

**Business Rules:**
1. Cannot delete self (TBD)
2. Deletion is permanent
3. Comments/activities remain but show "Deleted User" (TBD)

**API Endpoint:** `DELETE /api/v1/organizations/{orgId}/sites/{siteId}/users/{userId}`

**Access Control:**
- OrganizationAdmin: Can delete any site user
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: Can delete users from assigned site
- Other roles: Cannot delete users

---

## 6. Case Management

### 6.1 Case Overview

A **Case** represents a legal matter being handled by the law firm. Cases are the central entity in Lawsome, containing all information related to a specific legal engagement.

**Key Characteristics:**
- Each case belongs to one site
- Cases track full lifecycle from initiation to closure
- Cases can have multiple clients, tasks, hearings, documents, and invoices
- Cases are assigned to legal experts for handling
- Case status determines current state of legal proceedings

**Case Lifecycle:**
```
Open → InProgress → OnHold → Closed
         ↓           ↓
       (can return to any previous state)
```

### 6.2 Case Core Features

#### 6.2.1 View Cases

**Navigation:** `/organization/[organizationId]/sites/[siteId]` → Cases Tab

**Case List Display:**

| Column | Description | Data Type | Notes |
|--------|-------------|-----------|-------|
| Case Number | Case identifier | String | Manually entered |
| Title | Case title/name | String | Clickable link |
| Description | Brief description | String | Truncated |
| Status | Current status | Enum | Badge with color coding |
| Assigned To | Legal expert name | String | User full name |
| Created By | Creator name | String | User full name |
| Created Date | When created | DateTime | Sortable |
| Modified Date | Last updated | DateTime | Sortable |
| Actions | Edit/Delete buttons | Buttons | |

**Status Badge Colors:**
- Open: Blue
- InProgress: Yellow/Orange
- OnHold: Gray
- Closed: Green

**Features:**
- Search by case number, title, description
- Filter by status
- Filter by assigned user
- Sort by created date, modified date
- Pagination for large lists
- "Add Case" button

**Access Control:**
- OrganizationAdmin: View all cases across all sites
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: View all cases in assigned site
- Site roles: View all cases in assigned site
- SiteCaseClient: View only assigned cases

#### 6.2.2 Create Case

**Navigation:** Site cases list → "Add Case" button → `/organization/[orgId]/sites/[siteId]/cases/new`

**Form Fields:**

| Field | Type | Required | Validation | Example |
|-------|------|----------|------------|---------|
| Title | Text | Yes | Min 5 chars, max 200 chars | "Smith v. Johnson Contract Dispute" |
| Description | Textarea | No | Max 2000 chars | "Client claims breach of contract..." |
| Case Number | Text | No | Optional, max 100 chars | "2025-CIV-001" |
| Status | Select | Yes | Open/InProgress/OnHold/Closed | "Open" |
| Assigned To | Select | Yes | Site users dropdown | Select from legal experts |
| Created By | Auto-filled | N/A | Current user | Read-only |

**Business Rules:**
1. **Case Number:** Manually entered by users; duplicates are allowed across different cases
2. **Default Status:** Cases default to "Open" status
3. **Assignment:** Must assign to a user from the same site
4. **Creator Tracking:** Created By automatically set to current user
5. **Site Association:** Case automatically associated with current site

**Creation Flow:**
1. User clicks "Add Case" button
2. Form displays with empty fields
3. User enters case title (required)
4. User selects assigned user from dropdown
5. User optionally adds description
6. User optionally enters case number
7. User selects initial status (default: Open)
8. User clicks "Create" button
9. System validates inputs
10. API creates case
11. Success message displayed
12. User redirected to case details page

**API Endpoint:** `POST /api/v1/organizations/{orgId}/sites/{siteId}/cases`

**Success Response:** Status 201, case ID returned

**Error Responses:**
- Status 400: Validation error
- Status 500: Server error

#### 6.2.3 View Case Details

**Navigation:** `/organization/[orgId]/sites/[siteId]/cases/[caseId]`

#### Case Details Page Layout

**Case Header Section:**
- Case Number (large, prominent)
- Case Title (editable inline or via edit button)
- Status Badge (clickable to change)
- Assigned To (with user profile)
- Created By
- Created Date
- Modified Date
- Edit Case button
- Delete Case button

**Case Tabs:**
The case details page contains the following tabs:

1. **Overview Tab**
   - Case description
   - Key information summary
   - Recent activity timeline

2. **Clients Tab**
   - List of case clients
   - Add/edit/delete clients
   - Client contact information

3. **Tasks Tab**
   - List of case tasks
   - Add/edit/delete tasks
   - Task status tracking
   - Task assignment
   - Task documents

4. **Documents Tab**
   - Case-level document repository
   - Upload/download/delete documents
   - Document metadata

5. **Hearings Tab**
   - Scheduled court hearings
   - Add/edit/delete hearings
   - Hearing dates and locations
   - Hearing notes

6. **Invoice Tab**
   - Case billing and invoices
   - Add/edit invoices
   - Payment status tracking
   - Invoice document download

7. **Comments Tab**
   - Case-level discussions
   - Add comments
   - Reply to comments
   - Edit own comments

#### 6.2.4 Edit Case

**Navigation:** Case details → Edit button → `/organization/[orgId]/sites/[siteId]/cases/[caseId]/edit`

**Editable Fields:**
- Title
- Description
- Status
- Assigned To
- Case Number (if allowed)

**Non-Editable Fields:**
- Case ID
- Site ID
- Created By
- Created Date
- Modified Date (auto-updated)

**Business Rules:**
1. Case number can only be changed if no conflicts
2. Status change is immediate
3. Modified date updates automatically on save

**API Endpoint:** `PUT /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}`

**Access Control:**
- OrganizationAdmin: Can edit any case
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: Can edit cases in assigned site
- Site roles: Can edit cases in assigned site
- SiteCaseClient: Cannot edit

#### 6.2.5 Delete Case

**Navigation:** Case details → Delete button

**Confirmation Dialog:**
```
Title: "Delete Case"
Message: "Are you sure you want to delete Case [Case Number]: [Title]?
         This will also delete all associated clients, tasks, hearings,
         documents, comments, and invoices. This action cannot be undone."
Actions: [Cancel] [Delete]
```

**Business Rules:**
1. **Cascade Delete:** Deleting case also deletes:
   - All case clients
   - All case tasks (and task documents)
   - All case documents
   - All case hearings
   - All case comments
   - All case invoices
2. **Permanent Action:** Deletion is irreversible

**API Endpoint:** `DELETE /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}`

**Access Control:**
- OrganizationAdmin: Can delete any case
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: Can delete cases in assigned site
- Other roles: Cannot delete

**Testing Considerations:**
- Delete case with no associated data
- Delete case with clients only
- Delete case with tasks and documents
- Delete case with all associated data types
- Verify complete cascade deletion
- Verify audit logging (if implemented)

#### 6.2.6 Change Case Status

**Navigation:** Case details page → Status badge (click to change)

**Available Status Transitions:**

From any status, can change to:
- Open
- InProgress
- OnHold
- Closed

**No Workflow Restrictions:** Status can be changed freely without validation rules

**Status Meanings:**
- **Open:** Case newly created, not yet actively worked on
- **InProgress:** Case actively being handled
- **OnHold:** Case temporarily paused (awaiting information, client response, etc.)
- **Closed:** Case completed/resolved

**Business Rules:**
1. Can close case even with unpaid invoices
2. Can reopen closed cases
3. Status change is immediate
4. All users with edit permissions can change status

**UI Behavior:**
- Click status badge
- Dropdown menu appears with all statuses
- Select new status
- API call updates status
- Badge updates with new color
- Success message displayed

### 6.3 Case Clients Management

#### 6.3.1 View Case Clients

**Navigation:** Case details → Clients Tab

**Client List Display:**

| Column | Description | Data Type | Required |
|--------|-------------|-----------|----------|
| Full Name | Client's name | String | Yes |
| Email ID | Client's email | Email | No (Optional) |
| Phone Number | Client's contact | String | No (Optional) |
| Gender | Client's gender | String | Yes |
| Remarks | Optional notes | String | No (Optional) |
| Actions | Edit/Delete buttons | Buttons | - |

**Implementation Notes:**
- Case clients are informational records only - they do not login to the system
- No invitation system exists for case clients
- No client portal access or authentication
- Case clients serve as contact records for legal matters

**Features:**
- Search by name, email, or phone number
- "Add Client" button
- Client count display
- Edit/Delete actions for each client

#### 6.3.2 Add Case Client

**Navigation:** Clients Tab → "Add Client" button

**Form Fields:**

| Field | Type | Required | Validation | Example |
|-------|------|----------|------------|---------|
| Full Name | Text | Yes | Min 2 chars, max 200 chars | "Jane Doe" |
| Email ID | Email | No | Valid email format if provided | "jane@example.com" |
| Phone Number | Tel | No | Numeric, 10-15 digits if provided | "5551234567" |
| Gender | Select | Yes | Male/Female/Trans gender | "Female" |
| Remarks | Textarea | No | Optional notes about the client | "Primary contact for legal matters" |

**Business Rules:**
1. Only Full Name and Gender are required fields
2. Email and Phone Number are optional - at least one contact method is recommended but not enforced
3. Duplicate email addresses are allowed - multiple clients within the same case can share the same email address (e.g., family members, business partners, or parties using a shared contact)
4. One client can be added to multiple cases
5. Case clients are informational records only - they do not login to the system
6. No invitation system exists for case clients

**Add Flow:**
1. User clicks "Add Client"
2. Modal/form appears
3. User fills client information (Full Name, Email ID, Phone Number, Gender, Remarks)
4. User clicks "Save" or "Add"
5. System validates input
6. API creates case client record
7. Client appears in list
8. Success message displayed: "Client added successfully"

**Access Control:**
- OrganizationAdmin: Can add clients
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: Can add clients
- Site roles: Can add clients
- SiteCaseClient: Cannot add clients

**API Endpoint:** `POST /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/caseclients`

#### 6.3.3 Edit Case Client

**Navigation:** Clients Tab → Edit button for specific client

**Editable Fields:**
- Full Name (Required)
- Email ID (Optional)
- Phone Number (Optional)
- Gender (Required)
- Remarks (Optional)

**Non-Editable Fields:**
- Client ID
- Status

**Business Rules:**
1. Only Full Name and Gender are required fields
2. Email and Phone Number are optional
3. Changes affect only this case's client record

**API Endpoint:** `PUT /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/caseclients/{clientId}`

#### 6.3.4 Delete Case Client

**Navigation:** Clients Tab → Delete button for specific client

**Confirmation Dialog:**
```
Title: "Remove Client"
Message: "Are you sure you want to remove [Client Name] from this case?
         This action cannot be undone."
Actions: [Cancel] [Remove]
```

**Business Rules:**
1. Removes client record from case
2. Can re-add same client later if needed

**API Endpoint:** `DELETE /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/caseclients/{clientId}`

### 6.4 Case Tasks Management

#### 6.4.1 View Case Tasks

**Navigation:** Case details → Tasks Tab

**Task List Display:**

| Column | Description | Data Type |
|--------|-------------|-----------|
| Title | Task title | String |
| Description | Brief description | String (truncated) |
| Status | Current status | Enum |
| Assigned To | User name | String |
| Due Date | Deadline | Date |
| Created By | Creator name | String |
| Created Date | When created | DateTime |
| Modified Date | Last updated | DateTime |
| Actions | Edit/Delete buttons | Buttons |

**Task Status Values:**
- Open
- InProgress
- OnHold
- Blocked
- Closed

**Status Badge Colors:**
- Open: Blue
- InProgress: Yellow/Orange
- OnHold: Gray
- Blocked: Red
- Closed: Green

**Features:**
- Search by title or description
- Filter by status
- Filter by assigned user
- Sort by due date, created date, status
- Overdue tasks highlighted
- Task count by status
- "Add Task" button

**Access Control:**
- OrganizationAdmin: View all tasks
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: View all tasks in site
- Site roles: View all tasks in site
- SiteCaseClient: View all tasks

#### 6.4.2 Create Task

**Navigation:** Tasks Tab → "Add Task" button

**Form Fields:**

| Field | Type | Required | Validation | Example |
|-------|------|----------|------------|---------|
| Title | Text | Yes | Min 5 chars, max 200 chars | "Prepare witness statements" |
| Description | Textarea | No | Max 2000 chars | "Contact witnesses and document statements" |
| Status | Select | Yes | Open/InProgress/OnHold/Blocked/Closed | "Open" |
| Assigned To | Select | Yes | Site users dropdown | Select from site users |
| Due Date | Date Picker | No | Any date (past or future) | "2025-10-15" |

**Business Rules:**
1. **Default Status:** Tasks default to "Open"
2. **Assignment:** Must assign to user from same site
3. **Single Assignment:** Task can only be assigned to one user
4. **Due Date:** Optional, but recommended for tracking. Can be set to past dates to allow legal firms to migrate historical records into the system
5. **Overdue Logic:** Task marked overdue if due date passed and not closed
6. **Creator Tracking:** Created By set to current user
7. **Historical Records:** Past due dates are allowed to support entry of previous records and legacy data migration

**Creation Flow:**
1. User clicks "Add Task"
2. Modal/form appears
3. User fills task details
4. User selects assignee
5. User optionally sets due date
6. User clicks "Create"
7. System validates input
8. API creates task
9. Task appears in list

**API Endpoint:** `POST /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/tasks`

**Access Control:**
- OrganizationAdmin: Can create tasks
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: Can create tasks
- Site roles: Can create tasks
- SiteCaseClient: Cannot create tasks

#### 6.4.3 View Task Details

**Navigation:** Tasks Tab → Click on task title

**Task Details Display:**
- Task Title (header)
- Description (full text)
- Status Badge
- Assigned To (with profile)
- Created By
- Due Date (with overdue indicator if applicable)
- Created Date
- Modified Date
- Edit Task button
- Delete Task button

**Task Actions:**
- Change Status (dropdown or buttons)
- Edit Task Details
- Delete Task
- View Task Documents (see section 6.4.6)
- View Task Comments (see section 6.8)

#### 6.4.4 Edit Task

**Navigation:** Task details → Edit button OR Tasks Tab → Edit icon

**Editable Fields:**
- Title
- Description
- Status
- Assigned To
- Due Date

**Non-Editable Fields:**
- Task ID
- Created By
- Created Date
- Modified Date (auto-updated)

**Business Rules:**
1. Can reassign to different user
2. Status change is immediate
3. Can remove due date by clearing field
4. Modified date updates automatically

**API Endpoint:** `PUT /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/tasks/{taskId}`

**Access Control:**
- OrganizationAdmin: Can edit any task
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: Can edit tasks in site
- Site roles: Can edit tasks
- SiteCaseClient: Cannot edit tasks

#### 6.4.5 Delete Task

**Navigation:** Task details → Delete button OR Tasks Tab → Delete icon

**Confirmation Dialog:**
```
Title: "Delete Task"
Message: "Are you sure you want to delete this task?
         This will also delete all associated task documents and comments.
         This action cannot be undone."
Actions: [Cancel] [Delete]
```

**Business Rules:**
1. **Cascade Delete:** Deleting task also deletes:
   - All task documents
   - All task comments (and replies)
2. **Permanent Action:** Deletion is irreversible
3. **No Restrictions:** Can delete task in any status

**API Endpoint:** `DELETE /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/tasks/{taskId}`

**Access Control:**
- OrganizationAdmin: Can delete any task
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: Can delete tasks in site
- Site roles: Can delete tasks
- SiteCaseClient: Cannot delete tasks

#### 6.4.6 Task Documents

**Navigation:** Task details → Documents section/button

**Document Management:**
Tasks support document attachments similar to case documents.
See Section 6.5 for detailed document management features.

**Key Differences from Case Documents:**
- Task documents are specific to one task
- Deleted when parent task is deleted
- Access controlled by task permissions
- Used for task-specific files (research, drafts, submissions, etc.)

**API Endpoints:**
- Upload: `POST /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/tasks/{taskId}/documents`
- View: `GET /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/tasks/{taskId}/documents`
- Delete: `DELETE /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/tasks/{taskId}/documents/{documentId}`

### 6.5 Document Management

#### 6.5.1 Document Types

Lawsome supports two types of documents:

1. **Case Documents**
   - Associated with entire case
   - Visible to all case participants
   - Persist with case
   - Examples: contracts, agreements, evidence

2. **Task Documents**
   - Associated with specific task
   - Visible to task assignee and case team
   - Deleted with task
   - Examples: research notes, drafts, work product

#### 6.5.2 View Case Documents

**Navigation:** Case details → Documents Tab

**Document List Display:**

| Column | Description | Data Type |
|--------|-------------|-----------|
| File Name | Original filename | String |
| File Type | Extension/MIME type | String |
| File Size | Size in MB/KB | Number |
| Uploaded By | User name | String |
| Uploaded Date | When uploaded | DateTime |
| Remarks | Optional notes | String (truncated) |
| Actions | Download/Delete buttons | Buttons |

**Features:**
- Search by filename
- Filter by file type
- Sort by upload date, size
- "Upload Document" button

#### 6.5.3 Upload Document

**Navigation:** Documents Tab → "Upload Document" button

**Upload Form:**

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| File | File Upload | Yes | Max 1MB, all file types | Drag-drop or browse |
| Remarks | Textarea | No | Max 500 chars | Optional notes about document |

**File Constraints:**
- **Maximum Size:** 1 MB per file
- **Supported Types:** All file types accepted
- **Common Types:** PDF, DOCX, XLSX, JPG, PNG, TXT
- **Multiple Upload:** One file at a time

**Upload Process:**
1. User clicks "Upload Document"
2. Modal/form appears
3. User selects file (drag-drop or browse)
4. File validated for size (< 1MB)
5. User optionally adds remarks
6. User clicks "Upload"
7. File converted to Base64 encoding
8. API uploads document with metadata
9. Document appears in list
10. Success message displayed

**Business Rules:**
1. File size must be less than 1MB
2. Filename preserved from original
3. Duplicate filenames allowed (system adds unique ID)
4. Uploaded By auto-set to current user
5. Documents stored as Base64 encoded content

**API Endpoint:** `POST /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/documents`

**Request Body:**
```json
{
  "documentFileName": "contract.pdf",
  "documentContent": "base64EncodedString",
  "remarks": "Final signed contract"
}
```

**Access Control:**
- OrganizationAdmin: Can upload
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: Can upload
- Site roles: Can upload
- SiteCaseClient: Can upload

#### 6.5.4 Download/View Document

**Navigation:** Documents Tab → Click filename OR Download button

**Download Process:**
1. User clicks filename or download button
2. API retrieves document
3. Base64 content decoded
4. Browser downloads file
5. File opens in default application

**API Endpoint:** `GET /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/documents/{documentId}`

**Access Control:**
- OrganizationAdmin: Can view all documents
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: Can view all documents in site
- Site roles: Can view all documents in site
- SiteCaseClient: Can view all documents in assigned cases

#### 6.5.5 Delete Document

**Navigation:** Documents Tab → Delete button for specific document

**Confirmation Dialog:**
```
Title: "Delete Document"
Message: "Are you sure you want to delete [Filename]?
         This action cannot be undone."
Actions: [Cancel] [Delete]
```

**API Endpoint:** `DELETE /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/documents/{documentId}`

**Access Control:**
- OrganizationAdmin: Can delete any document
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: Can delete any document in site
- Site roles: Can delete any document
- SiteCaseClient: Cannot delete

### 6.6 Hearings Management

#### 6.6.1 View Hearings

**Navigation:** Case details → Hearings Tab

**Hearing List Display:**

| Column | Description | Data Type |
|--------|-------------|-----------|
| Hearing Date & Time | When hearing scheduled | DateTime |
| Location (Where) | Court/venue location | String |
| Status | Hearing status | String |
| Assigned To | Responsible legal expert | String |
| Created By | Who scheduled | String |
| Notes | Hearing notes | String (truncated) |
| Actions | Edit/Delete buttons | Buttons |

**Features:**
- Chronological sorting (upcoming first)
- Filter by status
- Filter by assigned user
- Past hearings highlighted differently
- "Add Hearing" button

**Access Control:**
- OrganizationAdmin: View all hearings
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: View all hearings in site
- Site roles: View all hearings in site
- SiteCaseClient: View all hearings in assigned cases

#### 6.6.2 Add Hearing

**Navigation:** Hearings Tab → "Add Hearing" button

**Form Fields:**

| Field | Type | Required | Validation | Example |
|-------|------|----------|------------|---------|
| Hearing Date & Time | DateTime Picker | Yes | Any date/time (past or future) | "2025-10-15 10:00 AM" |
| Location (Where) | Text | Yes | Min 5 chars | "District Court, Room 301" |
| Status | Text | No | Free text | "Scheduled" |
| Assigned To | Select | Yes | Site users dropdown | Select legal expert |
| Notes | Textarea | No | Max 2000 chars | "Preliminary hearing for motion..." |

**Business Rules:**
1. Hearing date/time can be any date (past or future) to allow legal firms to migrate historical records into the system
2. Must assign to user from same site
3. Status is free-form text field (no enum)
4. Notes are optional
5. Created By auto-set to current user
6. **Historical Records:** Past hearing dates are allowed to support entry of previous records and legacy data migration

**Creation Flow:**
1. User clicks "Add Hearing"
2. Form/modal appears
3. User selects date and time
4. User enters location
5. User selects assigned user
6. User optionally adds status and notes
7. User clicks "Save" or "Add"
8. System validates inputs
9. API creates hearing
10. Hearing appears in list
11. Success message displayed

**API Endpoint:** `POST /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/hearings`

**Access Control:**
- OrganizationAdmin: Can create hearings
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: Can create hearings
- Site roles: Can create hearings
- SiteCaseClient: Cannot create hearings

#### 6.6.3 Edit Hearing

**Navigation:** Hearings Tab → Edit button for specific hearing

**Editable Fields:**
- Hearing Date & Time
- Location (Where)
- Status
- Assigned To
- Notes

**Non-Editable Fields:**
- Hearing ID
- Created By
- Created Date

**Business Rules:**
1. Can reschedule to any date/time (past or future)
2. No restrictions on rescheduling
3. Can reassign to different user
4. Status can be changed freely
5. All changes take effect immediately

**Rescheduling:**
- Hearings can be rescheduled multiple times
- No workflow rules or restrictions
- Past hearings can be edited and rescheduled to any date (supports historical record updates)
- Rescheduling notifies assignee
- Past dates are allowed to support legacy data migration and historical record entry 

**API Endpoint:** `PUT /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/hearings/{hearingId}`

**Access Control:**
- OrganizationAdmin: Can edit any hearing
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: Can edit hearings in site
- Site roles: Can edit hearings
- SiteCaseClient: Cannot edit hearings

#### 6.6.4 Delete Hearing

**Navigation:** Hearings Tab → Delete button for specific hearing

**Confirmation Dialog:**
```
Title: "Delete Hearing"
Message: "Are you sure you want to delete this hearing scheduled for [Date/Time]?
         This action cannot be undone."
Actions: [Cancel] [Delete]
```

**Business Rules:**
1. Can delete hearings at any time (past or future)
2. Deletion is permanent
3. No cascade effects (no sub-entities)

**API Endpoint:** `DELETE /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/hearings/{hearingId}`

**Access Control:**
- OrganizationAdmin: Can delete any hearing
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: Can delete hearings in site
- Site roles: Can delete hearings
- SiteCaseClient: Cannot delete hearings

### 6.7 Invoice Management

#### 6.7.1 View Invoices

**Navigation:** Case details → Invoice Tab

**Invoice List Display:**

| Column | Description | Data Type |
|--------|-------------|-----------|
| Invoice Number | System-generated ID | Number |
| Generated Date | When created | Date |
| Due Date | Payment deadline | Date |
| Amount | Invoice amount | Currency |
| Payment Status | Current status | Enum |
| Payment Received Date | When paid | Date |
| Remarks | Invoice notes | String (truncated) |
| Actions | View/Edit/Delete buttons | Buttons |

**Payment Status Values:**
- None: No payment initiated
- Pending: Awaiting payment
- Failed: Payment attempt failed
- Paid: Payment received

**Status Badge Colors:**
- None: Gray
- Pending: Yellow/Orange
- Failed: Red
- Paid: Green

**Features:**
- Search by invoice number
- Filter by payment status
- Sort by generated date, due date, amount
- Overdue invoices highlighted
- Total amount summary
- "Add Invoice" button

**Access Control:**
- OrganizationAdmin: View all invoices
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: View all invoices in site
- Site roles: View all invoices in site
- SiteCaseClient: Cannot view invoices

#### 6.7.2 Create Invoice

**Navigation:** Invoice Tab → "Add Invoice" button

**Form Fields:**

| Field | Type | Required | Validation | Example |
|-------|------|----------|------------|---------|
| Generated Date | Date Picker | Yes | Any valid date | "2025-10-01" |
| Due Date | Date Picker | Yes | Must be >= Generated Date | "2025-10-31" |
| Amount | Number | Yes | Positive number | 5000.00 |
| Payment Status | Select | Yes | None/Pending/Failed/Paid | "Pending" |
| Invoice File | File Upload | Yes | PDF/Image, max 1MB | Upload invoice PDF |
| Remarks | Textarea | No | Max 500 chars | "Legal fees for contract review" |

**Business Rules:**
1. Due date must be equal to or after generated date
2. Amount must be positive number
3. Payment status defaults to "None" or "Pending"
4. Invoice file required (uploaded as Base64)
5. Invoice file max size 1MB
6. Created By auto-set to current user
7. **No Payment Gateway:** Payment tracking is manual only

**Creation Flow:**
1. User clicks "Add Invoice"
2. Form/modal appears
3. User fills invoice details
4. User uploads invoice file (PDF/image)
5. User selects payment status
6. User optionally adds remarks
7. User clicks "Save" or "Create"
8. System validates inputs
9. File encoded to Base64
10. API creates invoice
11. Invoice appears in list
12. Success message displayed

**API Endpoint:** `POST /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/invoices`

**Request Body:**
```json
{
  "generatedDate": "2025-10-01",
  "dueDate": "2025-10-31",
  "amount": 5000.00,
  "paymentStatus": "Pending",
  "invoiceFileName": "invoice_001.pdf",
  "invoiceContent": "base64EncodedString",
  "remarks": "Legal fees for contract review"
}
```

**Access Control:**
- OrganizationAdmin: Can create invoices
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: Can create invoices
- Site roles: Can create invoices
- SiteCaseClient: Cannot create invoices

#### 6.7.3 Edit Invoice

**Navigation:** Invoice Tab → Edit button for specific invoice

**Editable Fields:**
- Due Date
- Amount
- Payment Status
- Payment Received Date (when marking as paid)
- Invoice File (can replace)
- Remarks

**Non-Editable Fields:**
- Invoice ID/Number
- Generated Date
- Created By
- Case ID

**Business Rules:**
1. **No Validation Rules:** Invoices can be edited freely
2. Can edit even after payment received
3. Can change payment status at any time
4. Due date can be moved earlier or later
5. Amount can be increased or decreased
6. Can replace invoice file

**Payment Status Update:**
- When changing to "Paid", optionally set Payment Received Date
- Payment Received Date can be different from actual date
- No automatic date setting

**API Endpoint:** `PUT /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/invoices/{invoiceId}`

**Access Control:**
- OrganizationAdmin: Can edit any invoice
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: Can edit invoices in site
- Site roles: Can edit invoices
- SiteCaseClient: Cannot edit invoices

#### 6.7.4 Update Payment Status (Quick Action)

**Navigation:** Invoice Tab → Payment Status badge/button

**Quick Status Update Form:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Payment Status | Select | Yes | None/Pending/Failed/Paid |
| Payment Received Date | Date Picker | No | Auto-filled for "Paid" status |

**Business Rules:**
1. Quick action for status change only
2. For "Paid" status, payment received date auto-set to today
3. Can manually override payment received date
4. No other fields changed

**API Endpoint:** `PUT /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/invoices/{invoiceId}/payment-status`

#### 6.7.5 Download Invoice

**Navigation:** Invoice Tab → Click invoice number OR Download icon

**Download Process:**
1. User clicks invoice number/download
2. API retrieves invoice file
3. Base64 content decoded
4. Browser downloads file
5. File opens in PDF viewer or default app

**API Endpoint:** `GET /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/invoices/{invoiceId}`

#### 6.7.6 Delete Invoice

**Navigation:** Invoice Tab → Delete button for specific invoice

**Confirmation Dialog:**
```
Title: "Delete Invoice"
Message: "Are you sure you want to delete Invoice #[Invoice Number]?
         This action cannot be undone."
Actions: [Cancel] [Delete]
```

**Business Rules:**
1. Can delete invoice in any payment status
2. Deletion is permanent
3. No recovery option
4. Can delete even if marked as "Paid"

**API Endpoint:** `DELETE /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/invoices/{invoiceId}`

**Access Control:**
- OrganizationAdmin: Can delete any invoice
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: Can delete invoices in site
- Site roles: Can delete invoices
- SiteCaseClient: Cannot delete invoices

**Testing Considerations:**
- Create invoice with all statuses
- Edit invoice and verify changes
- Update payment status
- Download invoice file
- Delete paid invoice
- Delete unpaid invoice
- Verify no payment gateway integration

### 6.8 Comments Management

#### 6.8.1 Comment System Overview

Lawsome supports threaded comments with reply functionality in two contexts:

1. **Case Comments**
   - Associated with entire case
   - Visible to all case participants
   - Used for case-level discussions

2. **Task Comments**
   - Associated with specific task
   - Visible to task team members
   - Used for task-specific discussions

**Comment Features:**
- Threaded conversations (parent comments + replies)
- Edit own comments
- Delete own comments
- User attribution (name, timestamp)

#### 6.8.2 View Case Comments

**Navigation:** Case details → Comments Tab

**Comment Display Structure:**

```
┌─ Parent Comment ────────────────────┐
│ [User Avatar] John Doe              │
│ 2 hours ago                         │
│                                     │
│ This is the main comment text...    │
│                                     │
│ [Reply] [Edit] [Delete]             │
│                                     │
│   ├─ Reply ─────────────────────┐  │
│   │ [Avatar] Jane Smith         │  │
│   │ 1 hour ago                  │  │
│   │                             │  │
│   │ This is a reply...          │  │
│   │ [Edit] [Delete]             │  │
│   └─────────────────────────────┘  │
│                                     │
│   ├─ Reply ─────────────────────┐  │
│   │ [Avatar] Bob Wilson         │  │
│   │ 30 minutes ago              │  │
│   │                             │  │
│   │ Another reply...            │  │
│   │ [Edit] [Delete]             │  │
│   └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Comment List Features:**
- Chronological order (oldest first or newest first)
- User avatars/initials
- Timestamp (relative: "2 hours ago" or absolute)
- Reply threading (indented)
- Edit/Delete options (only for own comments)
- "Add Comment" text area at top

**Access Control:**
- OrganizationAdmin: View all comments
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: View all comments in site
- Site roles: View all comments in site
- SiteCaseClient: View all comments in assigned cases

#### 6.8.3 Add Case Comment

**Navigation:** Comments Tab → Comment text area → Type and Submit

**Business Rules:**
1. Comment text required (at least 1 character)
2. Comment author auto-set to current user
3. Timestamp auto-set to current time
4. Comment appears immediately after submission

**Add Flow:**
1. User types comment in text area
2. User clicks "Post" or "Submit" button
3. System validates comment text
4. API creates comment
5. Comment appears in list with user's name and timestamp
6. Text area clears
7. Success message displayed (optional)

**API Endpoint:** `POST /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/comments`

**Request Body:**
```json
{
  "commentText": "This is my comment..."
}
```

**Response:**
```json
{
  "id": 123,
  "commentText": "This is my comment...",
  "userId": 456,
  "userFullName": "John Doe",
  "commentAddedBy": 456,
  "createdDate": "2025-10-06T14:30:00Z",
  "parentCommentId": null,
  "replies": []
}
```

**Access Control:**
- OrganizationAdmin: Can add comments
- OrganizationClerk: Cannot access (no case permissions)
- SiteAdmin: Can add comments
- Site roles: Can add comments
- SiteCaseClient: Can add comments

#### 6.8.4 Reply to Comment

**Navigation:** Comments Tab → Parent comment → Reply button

**Reply Process:**

Similar to adding a comment, but creates a nested reply under parent comment.

**Form:**
- Reply text area appears below parent comment
- Same validation as parent comment
- Reply links to parent via `parentCommentId`

**API Endpoint:** `POST /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/comments/{parentCommentId}/reply`

**Request Body:**
```json
{
  "commentText": "This is my reply..."
}
```

**Business Rules:**
1. Reply must have valid parent comment ID
2. Reply inherits case context from parent
3. Reply appears indented under parent

#### 6.8.5 Edit Comment

**Navigation:** Comments Tab → Own comment → Edit button

**Edit Form:**
- Inline edit (text becomes editable)
- OR modal with comment text pre-filled
- Save/Cancel buttons

**Editable Fields:**
- Comment Text only

**Non-Editable Fields:**
- Comment ID
- Author
- Timestamp
- Parent Comment ID (cannot change threading)

**Business Rules:**
1. **Only author can edit their own comments**
2. No moderation - users cannot edit others' comments
3. No edit time limit (can edit anytime)
4. No "edited" indicator

**API Endpoint:** `PUT /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/comments/{commentId}`

**Request Body:**
```json
{
  "commentText": "Updated comment text..."
}
```

**Access Control:**
- Users can only edit their own comments
- No cross-user editing allowed

#### 6.8.6 Delete Comment

**Navigation:** Comments Tab → Own comment → Delete button

**Confirmation Dialog:**
```
Title: "Delete Comment"
Message: "Are you sure you want to delete this comment?
         This action cannot be undone."
Actions: [Cancel] [Delete]
```

**Business Rules:**
1. **Only author can delete their own comments**
2. Deleting parent comment may:
   - Delete all replies (cascade)
3. Deletion is permanent
4. No recovery option

**API Endpoint:** `DELETE /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/comments/{commentId}`

**Access Control:**
- Users can only delete their own comments
- No cross-user deletion allowed
- Admins cannot delete others' comments 

#### 6.8.7 Task Comments

**Navigation:** Task details → Comments section/tab

**Functionality:**
Task comments work identically to case comments, but scoped to a specific task.

**Key Differences:**
- Comments associated with task, not case
- Separate comment thread per task
- Deleted when parent task is deleted
- Same permissions as case comments

**API Endpoints:**
- **View:** `GET /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/tasks/{taskId}/comments`
- **Add:** `POST /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/tasks/{taskId}/comments`
- **Reply:** `POST /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/tasks/{taskId}/comments/{parentCommentId}/reply`
- **Edit:** `PUT /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/tasks/{taskId}/comments/{commentId}`
- **Delete:** `DELETE /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/tasks/{taskId}/comments/{commentId}`

### 6.9 Ask Neeti - AI Chat Assistant

#### 6.9.1 Overview

Lawsome provides **Ask Neeti**, an AI-powered chat assistant on case pages that allows authorized users to ask questions about the case, get legal insights, find similar cases and precedents, and receive context-aware responses based on the full case data.

**Key Characteristics:**
- Floating chat interface accessible from case detail page
- Context-aware responses using full case data (clients, tasks, hearings, documents, invoices, comments)
- **Similar cases & legal precedent recommendations** - Ask Neeti can suggest relevant Indian court cases, landmark judgements, and legal precedents
- **Indian legal expertise** - References to IPC, CPC, CrPC, Evidence Act, and other Indian laws
- **Legal database guidance** - Recommendations for Indian Kanoon, SCC Online, Manupatra, and Westlaw India
- Session-only conversation (not persisted to database)
- Powered by OpenAI GPT models
- **Feature flag controlled** - AI features enabled at the organization level via `NEXT_PUBLIC_AI_ENABLED_ORG_IDS` environment variable (comma-separated list of organization IDs)

#### 6.9.2 Ask Neeti Chat Interface

**Navigation:** Case details page -> Floating chat button (bottom-right corner)

**Chat Features:**
- Floating action button (FAB) with sparkle icon in bottom-right corner
- Slide-in drawer (380px x 500px) from right side when clicked
- "Beta" badge indicating feature is in beta
- Message history display (user and AI messages)
- **Markdown rendering** for AI responses (headings, bold, lists, tables, code blocks)
- Real-time loading indicator with animated typing dots
- Error handling with user-friendly messages
- Close button to dismiss chat

**Sample Prompts (Empty State):**
When no messages exist, users see helpful sample prompts:
- "What are the immediate action items?"
- "Find similar cases and judgements"
- "Key risks and challenges"
- "Case timeline and deadlines"

**Quick Suggestion Chips:**
After conversation starts, quick access chips appear above the input:
- Action items
- Similar cases
- Risks
- Timeline

#### 6.9.3 Send Chat Message

**Interaction:** Type message in input field -> Press Enter or click send button

**Process Flow:**
1. User types message in chat input
2. User submits message (Enter key or send button)
3. Message appears in chat as user message (right-aligned, purple gradient)
4. Loading indicator appears with animated dots
5. System sends message to AI API with full case context
6. AI response appears in chat (left-aligned, with markdown rendering)
7. Loading indicator disappears

**API Endpoint:** POST /api/v1/organizations/{orgId}/sites/{siteId}/cases/{caseId}/chat

**Request Body:**
```json
{
  "message": "What are the immediate action items?"
}
```

**Response:**
```json
{
  "response": "## Immediate Action Items\n\n1. **Review case documents**...",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 6.9.4 Similar Cases & Legal Precedents

**Capabilities:**
Ask Neeti can suggest similar cases when asked questions like:
- "Are there any similar cases with their judgements?"
- "Find top 3 similar cases"
- "What are the relevant precedents?"

**Response Includes:**
- Case name and citation (when known)
- Relevant legal principles
- Why the case is similar to current case
- Disclaimer to verify through official databases

**Example Response:**
```
Based on my legal knowledge, these cases may be relevant. Please verify through official legal databases:

1. **State of Maharashtra v. XYZ** (2018 SCC 123)
   - Relevant for: Property dispute involving succession rights
   - Key principle: Joint family property division

2. **ABC v. State** (2020 AIR SC 456)
   - Similar facts regarding...
```

#### 6.9.5 Access Control

**Feature Flag:**
AI features are controlled via environment variable:
```
NEXT_PUBLIC_AI_ENABLED_CASE_IDS="415,420,425"
```
- Comma-separated list of case IDs
- Chat button hidden for cases not in the list
- AI Summary also hidden for non-enabled cases

**Role-Based Access (for enabled cases):**
- **OrganizationAdmin:** Can access Ask Neeti
- **SystemAdmin:** Can access Ask Neeti
- **All other roles:** Cannot access (chat button hidden)

#### 6.9.6 Session Management

**Conversation Persistence:**
- Conversations are session-only
- Chat history is cleared when user navigates away, refreshes, or closes browser
- No conversation history is stored in the database

#### 6.9.7 Error Handling

Errors are displayed as system messages in the chat with:
- Red error styling
- User-friendly error message
- Error icon indicator

---
n## 7. Testing Guidelines

### 7.1 Testing Objectives

The primary objectives for testing Lawsome Organization Management are to:

1. **Functional Verification:** Ensure all features work as specified
2. **Role-Based Access Control:** Verify permissions are correctly enforced
3. **Data Integrity:** Confirm data persistence and cascade operations
4. **User Experience:** Validate workflows and error handling
5. **Integration:** Test API communication and authentication

### 7.2 Test Environment Setup

#### 7.2.1 Browser Requirements

**Primary Test Browser:**
- Google Chrome (latest stable version)
- Desktop resolution: 1920x1080, 1366x768
- Mobile resolution: 375x667 (iPhone), 360x640 (Android)

**Testing Modes:**
- Desktop mode (full layout)
- Mobile responsive mode (Chrome DevTools)

#### 7.2.2 Test Accounts Required

For comprehensive testing, create the following user accounts:

| Role | Username | Purpose |
|------|----------|---------|
| OrganizationAdmin | org-admin@test.com | Full organization access testing |
| SiteAdmin | site-admin@test.com | Site-level access testing |
| SiteLegalExpert | expert@test.com | Legal expert workflow testing |
| SiteCaseClient | client@test.com | Client portal testing |

#### 7.2.3 Test Data Setup

**Minimum Test Data:**
1. One organization with all details filled
2. At least 2 sites under organization
3. At least 5 users with different roles
4. At least 3 cases with various statuses
5. Sample documents (< 1MB each)
6. Sample invoices in different payment statuses

### 7.3 Testing Approach

#### 7.3.1 Test Categories

1. **Smoke Testing:** Basic functionality after deployment
2. **Functional Testing:** Feature-by-feature verification
3. **Integration Testing:** Cross-module functionality
4. **Security Testing:** Role permissions and data access
5. **Usability Testing:** User experience and workflows
6. **Regression Testing:** Verify no existing features broken

#### 7.3.2 Test Prioritization

**Priority 1 (Critical):**
- User authentication and authorization
- Organization registration
- Case creation and management
- Document upload/download
- Data persistence

**Priority 2 (High):**
- Site management
- User management
- Task management
- Hearing scheduling
- Invoice creation

**Priority 3 (Medium):**
- Comments system
- Client invitations
- Status changes
- Search and filters

**Priority 4 (Low):**
- UI polish
- Sorting and pagination
- Non-critical validations

### 7.4 Key Test Scenarios

#### 7.4.1 Organization Management Test Scenarios

| Scenario ID | Test Case | Expected Result | Priority |
|-------------|-----------|-----------------|----------|
| ORG-001 | Register new organization with valid data | Organization created successfully, admin can log in | P1 |
| ORG-002 | Register organization with duplicate email | Error message displayed | P1 |
| ORG-003 | Edit organization details | Changes saved and reflected | P2 |
| ORG-004 | Add organization-level user | User created and appears in list | P1 |
| ORG-005 | Delete organization user | User removed, cannot log in | P2 |

#### 7.4.2 Site Management Test Scenarios

| Scenario ID | Test Case | Expected Result | Priority |
|-------------|-----------|-----------------|----------|
| SITE-001 | Create site with all required fields | Site created successfully | P1 |
| SITE-002 | Create site with missing required fields | Validation errors displayed | P2 |
| SITE-003 | Edit site location details | Changes saved and reflected | P2 |
| SITE-004 | Delete site with no cases | Site deleted successfully | P2 |
| SITE-005 | Delete site with existing cases | Site and all cases deleted (cascade) | P1 |
| SITE-006 | Add user to site | User created with site-level role | P1 |
| SITE-007 | View site users list | All site users displayed correctly | P2 |

#### 7.4.3 Case Management Test Scenarios

| Scenario ID | Test Case | Expected Result | Priority |
|-------------|-----------|-----------------|----------|
| CASE-001 | Create case with case number | Case created with provided number | P1 |
| CASE-002 | Create case without case number | Case created without case number | P2 |
| CASE-003 | Edit case details | Changes saved correctly | P1 |
| CASE-004 | Change case status to each status | Status updates correctly | P1 |
| CASE-005 | Reassign case to different user | Case reassigned successfully | P2 |
| CASE-006 | Delete case with all related data | Case and all related entities deleted | P1 |
| CASE-007 | Add client to case | Client added successfully | P2 |
| CASE-008 | Invite case client | Invitation email sent, client can accept | P2 |
| CASE-009 | Create task in case | Task created and assigned | P1 |
| CASE-010 | Edit task details | Task updated correctly | P2 |
| CASE-011 | Delete task | Task and task documents deleted | P2 |
| CASE-012 | Upload case document (< 1MB) | Document uploaded successfully | P1 |
| CASE-013 | Upload case document (> 1MB) | Error message displayed | P1 |
| CASE-014 | Download case document | File downloads correctly | P1 |
| CASE-015 | Delete case document | Document removed from list | P2 |
| CASE-016 | Schedule hearing with future date | Hearing created successfully | P2 |
| CASE-017 | Reschedule hearing | Hearing date updated | P2 |
| CASE-018 | Delete hearing | Hearing removed from list | P2 |
| CASE-019 | Create invoice with file | Invoice created with payment status | P2 |
| CASE-020 | Edit invoice payment status to Paid | Status updated with payment date | P2 |
| CASE-021 | Delete paid invoice | Invoice deleted despite paid status | P2 |
| CASE-022 | Add comment to case | Comment appears in list | P2 |
| CASE-023 | Reply to comment | Reply nested under parent | P2 |
| CASE-024 | Edit own comment | Comment updated | P3 |
| CASE-025 | Delete own comment | Comment removed | P3 |
| CASE-026 | Try to edit another user's comment | Edit button not visible/disabled | P2 |

#### 7.4.4 Permission & Security Test Scenarios

| Scenario ID | Test Case | Expected Result | Priority |
|-------------|-----------|-----------------|----------|
| SEC-001 | OrganizationAdmin access all sites | Can view/edit all sites | P1 |
| SEC-002 | SiteAdmin access only assigned site | Cannot view other sites | P1 |
| SEC-003 | SiteCaseClient view only assigned cases | Cannot view other cases | P1 |
| SEC-004 | SiteCaseClient try to create case | Action denied or button not visible | P1 |
| SEC-005 | SiteCaseClient try to delete document | Action denied or button not visible | P1 |
| SEC-006 | User try to edit another's comment | Action denied or button not visible | P2 |
| SEC-007 | Unauthenticated user access case page | Redirected to login | P1 |

#### 7.4.5 Data Validation Test Scenarios

| Scenario ID | Test Case | Expected Result | Priority |
|-------------|-----------|-----------------|----------|
| VAL-001 | Submit form with all required fields empty | Multiple validation errors shown | P1 |
| VAL-002 | Enter invalid email format | Email format error displayed | P2 |
| VAL-003 | Enter phone number with letters | Invalid characters prevented/rejected | P2 |
| VAL-004 | Set due date before generated date (invoice) | Validation error displayed | P2 |
| VAL-005 | Enter negative amount for invoice | Error displayed or value rejected | P2 |

### 7.5 Test Execution Guidelines

#### 7.5.1 Test Data Management

1. **Setup:** Create fresh test data before each test cycle
2. **Isolation:** Use separate test organizations for different testers
3. **Cleanup:** Document which data can be deleted vs must persist
4. **Reset:** Have script/process to reset test environment

#### 7.5.2 Defect Reporting

**Required Information for Bug Reports:**
- Browser and version
- User role being tested
- Steps to reproduce
- Expected result vs actual result
- Screenshots/screen recordings
- Console errors (if any)
- Network request/response details (if applicable)

**Severity Levels:**
- **Critical:** Application crash, data loss, security breach
- **High:** Major feature not working, blocking workflow
- **Medium:** Feature partially working, workaround available
- **Low:** Cosmetic issue, minor inconvenience

#### 7.5.3 Test Coverage Checklist

For each major feature, verify:
- ✓ Create operation works
- ✓ Read/View operation displays correct data
- ✓ Update operation saves changes
- ✓ Delete operation removes data
- ✓ Validation errors display properly
- ✓ Success messages appear
- ✓ Permissions are enforced
- ✓ Data persists after page refresh
- ✓ Mobile responsive layout works
- ✓ Browser back button behavior is correct

### 7.6 Regression Testing

#### 7.6.1 Regression Test Suite

After any code changes, run regression tests for:

1. **Core Workflows:**
   - Organization registration → Site creation → Case creation
   - Add users at org and site level
   - Create case → Add tasks → Upload documents
   - Create invoice → Update payment status

2. **Cross-Module Impact:**
   - Deleting site deletes all cases
   - Deleting case deletes all tasks/documents/comments
   - Deleting task deletes task documents
   - User deletion doesn't break case assignments

3. **Authentication & Authorization:**
   - Login/logout flow
   - Token refresh
   - Permission checks on all protected routes

---

## 8. Appendices

### 8.1 Glossary

| Term | Definition |
|------|------------|
| Organization | Top-level entity representing a law firm |
| Site | Physical location/branch of an organization |
| Case | Legal matter being handled by the firm |
| Task | Work item within a case |
| Hearing | Scheduled court appearance |
| Case Client | Client associated with a specific case (SiteCaseClient role) |
| Legal Expert | Lawyer or legal professional handling cases |
| Invoice | Billing document for legal services |
| Base64 | Encoding format for storing files as text |
| Cascade Delete | Deletion that automatically removes related child entities |

### 8.2 API Summary

#### 8.2.1 Base URLs

- **Organization API:** `{NEXT_PUBLIC_API_BASE_URL}/api/v1/organizations`
- **Authentication:** Keycloak SSO via `NEXT_PUBLIC_AUTH_URL`

#### 8.2.2 Common API Patterns

**Authentication:**
- All API calls require `Authorization: Bearer {token}` header
- Token obtained via Keycloak authentication
- Token automatically refreshed by HTTP interceptors

**Response Status Codes:**
- 200: Success (GET, PUT)
- 201: Created (POST)
- 204: No Content (DELETE, some PUT)
- 400: Bad Request (validation errors)
- 401: Unauthorized (invalid/expired token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (duplicate entity)
- 500: Internal Server Error

**Pagination Parameters (where supported):**
- `page`: Page number (starting from 1)
- `perPage`: Results per page (1-100)

### 8.3 Data Models Summary

#### 8.3.1 Core Entities

**Organization:**
```typescript
{
  id: number,
  name: string,
  description: string,
  segments: string[],
  phoneNumber: number,
  emailId: string,
  enabled: boolean,
  createdDate: string,
  updatedDate: string
}
```

**Site:**
```typescript
{
  id: string,
  name: string,
  description: string,
  address: string,
  district: string,
  state: string,
  pincode: string,
  phoneNumber: string,
  emailId: string,
  latitude: number,
  longitude: number,
  enabled: boolean
}
```

**Case:**
```typescript
{
  id: string,
  title: string,
  description: string,
  caseNumber: string,
  status: "Open" | "InProgress" | "OnHold" | "Closed",
  assignedToId: number,
  createdById: number,
  siteId: number,
  createdDate: string,
  modifiedDate: string
}
```

**Task:**
```typescript
{
  id: string,
  title: string,
  description: string,
  status: "Open" | "InProgress" | "OnHold" | "Blocked" | "Closed",
  assignedToId: number,
  createdById: number,
  dueDate: string,
  caseId: string,
  siteId: number,
  createdDate: string,
  modifiedDate: string
}
```

### 8.4 File Storage Specifications

**Document Storage:**
- Format: Base64 encoded string
- Max Size: 1 MB
- Supported Types: All file types
- Storage Location: Database (as part of document entity)

**File Upload/Download Flow:**
1. Client selects file
2. File read as binary
3. Binary converted to Base64 string
4. Base64 string sent in API request body
5. Server stores Base64 string
6. On download, Base64 decoded back to binary
7. Browser downloads/displays file


