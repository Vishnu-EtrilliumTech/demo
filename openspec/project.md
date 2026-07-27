# Project Context

## Purpose

Lawsome is a comprehensive legal practice management web application designed to help law firms efficiently manage their operations across multiple geographical locations. The platform enables legal professionals to:

- **Manage Multi-Site Operations**: Organize law firm operations across multiple physical locations (sites) with hierarchical structure
- **Track Legal Cases**: Handle complete case lifecycle from initiation to closure with integrated task and hearing management
- **Collaborate Effectively**: Enable team collaboration through case comments, task assignments, and document sharing
- **Serve Clients**: Connect legal professionals (lawyers, chartered accountants, paralegals) with clients seeking legal services
- **Handle Billing**: Generate and track invoices for legal services with payment status management
- **Maintain Records**: Keep detailed records of all legal proceedings, communications, and documentation

The platform serves both B2C (client booking appointments with legal experts) and B2B (organization/firm management) use cases.

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router for file-based routing
- **React 19** - UI library
- **TypeScript** - Type-safe development throughout the codebase
- **Redux Toolkit** - State management with Redux Persist for persistence
- **Material-UI (MUI)** - Component library for UI elements
- **Tailwind CSS** - Utility-first CSS framework for styling
- **CSS Modules** - Component-scoped styling

### Authentication & Authorization
- **Keycloak** - SSO authentication with role-based access control
- **JWT Tokens** - Token-based authentication with automatic refresh

### Data & API
- **Axios** - HTTP client with interceptors for token management
- **REST API** - Backend communication with .NET Core API (separate codebase)
- **Swagger** - API documentation (`src/app/swagger.json`)

### File Management & UI Enhancements
- **React Dropzone** - File upload functionality with drag-and-drop
- **React Image Crop** - Image cropping for profile photos
- **Google Maps API** - Location services and address selection

### Payment Processing
- **Razorpay** - Payment gateway integration for appointment booking

### Build & Development
- **Turbopack** - Fast bundler for development
- **ESLint** - Code linting
- **Yarn** - Package manager

## Project Conventions

### Code Style

#### Naming Conventions
- **Files**: Use PascalCase for React components (`ProfileContent.tsx`), camelCase for utilities (`httpServices.ts`)
- **CSS Modules**: Use `[ComponentName].module.css` pattern
- **Components**: PascalCase for component names
- **Functions/Variables**: camelCase for functions and variables
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Interfaces/Types**: PascalCase with descriptive names (e.g., `UserData`, `FormData`)

#### File Organization
- Co-locate feature-specific components with their pages
- Shared components go in `/components` directory
- Custom hooks use `use` prefix (e.g., `useUserRole`, `useCaseClients`)
- API services centralized in `/services` or feature-specific `/services` directories

#### Component Patterns
- Use functional components with React Hooks
- Prefer controlled components for forms
- Extract custom hooks for reusable logic
- Use TypeScript interfaces for props and state

#### Styling
- CSS Modules for component-scoped styles
- Tailwind for utility classes
- Material-UI for complex components (tables, dialogs, forms)
- Maintain consistent spacing and color schemes across the app

### Architecture Patterns

#### Authentication Flow
- **Keycloak SSO**: Centralized authentication via `src/services/keycloakServices.ts`
- **Token Management**: Automatic token refresh via HTTP interceptors
- **Persistent Sessions**: Tokens stored in localStorage with automatic retry on 401
- **Silent SSO**: Seamless authentication check without user interruption

#### State Management
- **Redux Store**: Global state for `profile`, `legalExpert`, and `client` slices
- **Redux Persist**: Whitelist approach for selective state persistence
- **Store Factory**: `makeStore()` pattern for SSR compatibility
- **Local State**: Component-level state with `useState` for UI-only state

#### API Architecture
- **Centralized HTTP Client**: `src/services/httpServices.ts` with interceptors
- **Feature-Specific Clients**: Organization API client at `src/app/organization/services/api.ts`
- **Type Safety**: All API models defined in `src/app/organization/types/index.ts`
- **Error Handling**: Consistent error extraction and display patterns
- **API Documentation**: Swagger spec at `src/app/swagger.json`

#### Route Structure
```
/ - Landing page
/auth - Authentication handling
/search - Legal expert search with filters
/appointments/* - Multi-step booking flow
/dashboard/* - User dashboard
/profile/* - User profile management
/organization/[id]/* - Multi-tenant organization management
  /sites/[siteId]/* - Site-specific management
    /cases/[caseId]/* - Case details with tabs (tasks, hearings, documents, clients, invoices)
    /users/[userId]/* - User management
```

#### Component Architecture
- **Modular Design**: Reusable tabs, tables, forms, and modals
- **Custom Hooks**: Data fetching and state management abstracted into hooks
- **Error Boundaries**: Graceful error handling
- **Loading States**: Consistent loading indicators across the app
- **Responsive Design**: Mobile-first approach with responsive layouts

#### Data Transformation Patterns
- **Gender Mapping**: UI displays "Non-Binary" while API expects "Transgender"
  - API → UI: `'Transgender'` becomes `'Non-Binary'`
  - UI → API: `'Non-Binary'` becomes `'Transgender'`
- **Date Formatting**: Consistent date formatting using `toLocaleDateString()`
- **Role Display**: User-friendly role names in UI vs API role strings

### Testing Strategy

Currently, the project does not have a comprehensive testing strategy documented. Future testing should include:
- Unit tests for utility functions and custom hooks
- Integration tests for API calls
- Component tests for React components
- End-to-end tests for critical user flows

**Important for AI Agents**:
- **DO NOT** use Playwright MCP or any browser automation tools for UI validation during development
- **DO NOT** attempt automated UI testing via MCP servers
- Manual testing must be performed by the human developer
- AI agents should only verify code correctness through static analysis (file reads, type checking)
- Focus on code review, documentation updates, and suggesting manual test scenarios

### Git Workflow

#### Branching Strategy
- **Main Branch**: `main` - production-ready code
- **Feature Branches**: `feature/[feature-name]` - new features
- **Bugfix Branches**: `bugfix/[issue-description]` - bug fixes

#### Commit Conventions
- Use descriptive commit messages
- Include context about what changed and why
- Reference issue numbers when applicable
- Commits include co-authorship with Claude when AI-assisted

#### Git Configuration
- **User Name**: `creativecoder`
- **User Email**: `creativecoder48@gmail.com`

## Domain Context

### Legal Services Domain
- **Legal Experts**: Lawyers, chartered accountants, paralegals offering services
- **Cases**: Legal matters handled by the firm with status tracking
- **Hearings**: Court appearances scheduled for specific cases
- **Tasks**: Work items within cases with assignees and due dates
- **Clients**: Individuals or entities seeking legal services
- **Invoices**: Billing for legal services rendered

### Multi-Tenant Architecture
- **Organizations**: Top-level entities representing law firms
- **Sites**: Physical office locations within an organization
- **Hierarchical Structure**: Organization → Sites → Cases → Tasks/Hearings/Documents
- **Role-Based Access**: Different permissions at organization, site, and case levels

### User Roles
#### Organization-Level Roles
- **OrganizationAdmin**: Full access to organization and all sites
- **OrganizationClerk**: Administrative support at organization level

#### Site-Level Roles
- **SiteAdmin**: Full access to specific site
- **SiteClerk**: Administrative support at site level
- **SiteSrLegalExpert**: Senior legal professional with elevated permissions
- **SiteLegalExpert**: Legal professional handling cases

#### Case-Level Roles
- **SiteCaseClient**: Client associated with a specific case

### Case Lifecycle
1. **Open**: Case created, initial details captured
2. **InProgress**: Active work on the case
3. **OnHold**: Temporarily paused
4. **Closed**: Case completed

### Task Lifecycle
1. **Open**: Task created but not started
2. **InProgress**: Active work on task
3. **OnHold**: Temporarily paused
4. **Blocked**: Waiting on dependencies
5. **Closed**: Task completed

## Important Constraints

### Technical Constraints
- **Node.js Version**: Must be compatible with Next.js 15 requirements (Node.js 18+)
- **File Upload Size**: Maximum 1MB per file
- **Image Requirements**: Profile photos must be JPEG or PNG format
- **Browser Support**: Modern browsers with ES6+ support
- **Build Process**: User must manually run builds (`yarn build`); don't automate in development

### Business Constraints
- **Authentication Required**: Most features require Keycloak authentication
- **Role-Based Access**: Strict permissions matrix controls feature access
- **Multi-Tenancy**: Organizations are isolated; no cross-organization data access
- **Data Privacy**: Sensitive user information (phone, email) hidden without authentication

### UI/UX Constraints
- **Consistent Styling**: Must match existing Material-UI and Tailwind patterns
- **No Emojis**: Avoid emojis in UI unless explicitly requested
- **Gender Display**: Always show "Non-Binary" in UI (never "Transgender")
- **Responsive Design**: Must work on mobile, tablet, and desktop
- **Loading States**: Always show loading indicators during async operations

### Development Constraints
- **No TypeScript Build Checks**: Don't run `npx tsc --noEmit` unless explicitly requested
- **Manual PRD Updates**: Update `docs/Lawsome_PRD.md` for user-impacting changes
- **API Compatibility**: Frontend must match backend .NET Core API contracts

## External Dependencies

### Authentication
- **Keycloak Server**: External SSO authentication server
  - Environment variable: `NEXT_PUBLIC_AUTH_URL`
  - Realm: `NEXT_PUBLIC_AUTH_REALM`
  - Client ID: `NEXT_PUBLIC_AUTH_CLIENT_ID`

### Backend API
- **Main API**: Legal expert booking and profile management
  - Environment variable: `NEXT_PUBLIC_AUTH_BASE_URI`
  - Technology: .NET Core (separate codebase at `C:\Users\LENOVO\sabari\codebase\Lawsome\Code`)

- **Organization API**: Organization, site, case, and user management
  - Environment variable: `NEXT_PUBLIC_API_BASE_URL`
  - All API models documented in `src/app/organization/types/index.ts`
  - API documentation in `src/app/swagger.json`

### Third-Party Services
- **Google Maps API**: Location services, address autocomplete, and map display
- **Razorpay**: Payment processing for appointment bookings
- **CDN Resources**:
  - Lucide Icons: Icon library for UI elements
  - Flowbite: UI component library (for design iterations)

### Backend API Documentation
- **Swagger Specification**: `src/app/swagger.json` contains complete API documentation
- **Backend Codebase**: Located at `C:\Users\LENOVO\sabari\codebase\Lawsome\Code`
- **Permission Matrix**: Detailed role permissions at `C:\Users\LENOVO\sabari\codebase\Lawsome\Docs\API_Permissions_Matrix.md`

### Development Dependencies
- **Package Manager**: Yarn (v1.x or v2.x)
- **Browser DevTools**: Chrome DevTools recommended for debugging
- **VS Code Extensions**: ESLint, Prettier recommended

## Terminology

### Route Terminology
- **Personal Dashboard**: `/organization/{orgId}/sites/{siteId}/users/{userId}` - Individual user's case view
- **Site Dashboard**: `/organization/{orgId}/sites/{siteId}` - Site-level management interface
- **Org Dashboard**: `/organization/{orgId}` - Organization-level management interface

### Key Concepts
- **Legal Expert**: Professional offering legal services (lawyer, CA, paralegal)
- **Case Client**: Individual or entity receiving legal services for a specific case
- **Site**: Physical office location of a law firm
- **Organization**: Legal entity representing the law firm
- **Hearing**: Scheduled court appearance or legal proceeding
- **Task**: Work item within a case with assignee and status