# Employee Profile Frontend - Complete Documentation

## Overview

This documentation covers the complete frontend implementation for the Employee Profile service with comprehensive role-based access control (RBAC). The frontend is designed to show different features and pages based on the user's role, ensuring that employees only see what they're authorized to access.

## Architecture

### Role-Based Access Control (RBAC)

The system is built on a role hierarchy with three main permission groups:

#### 1. **Self-Service Features** (All Authenticated Employees)
- Available to: ALL_EMPLOYEES role group
- Features:
  - View My Profile
  - Update Contact Information
  - Upload Profile Picture
  - Request Data Corrections

#### 2. **Manager Features**
- Available to: MANAGERS role group (HR_MANAGER, DEPARTMENT_HEAD, SYSTEM_ADMIN)
- Features:
  - View Team Members
  - View Team Summary
  - Distribution Analysis (by Job Title, Department, Pay Grade)

#### 3. **HR/Admin Features**
- Available to: HR_STAFF role group (HR_ADMIN, HR_MANAGER, SYSTEM_ADMIN)
- Features:
  - Search Employees
  - View Employee Details
  - Edit Employee Information
  - Deactivate Employees
  - Assign System Roles
  - List Change Requests
  - Review & Approve/Reject Change Requests

## File Structure

```
frontend/app/
├── hooks/
│   └── useRole.ts                    # Role-based authorization hooks
├── components/
│   ├── Auth/
│   │   └── RoleBasedAccess.tsx      # RBAC wrapper components
│   └── EmployeeProfile/
│       ├── SelfService/
│       │   ├── SelfServiceContactInfo.tsx
│       │   ├── SelfServiceProfilePicture.tsx
│       │   └── SelfServiceChangeRequests.tsx
│       ├── Manager/
│       │   └── ManagerTeamView.tsx
│       ├── HR/
│       │   ├── HREmployeeSearch.tsx
│       │   ├── HRChangeRequestReview.tsx
│       │   └── HRRoleAssignment.tsx
│       └── index.ts
└── dashboard/
    └── employee-profile/
        ├── page.tsx                  # Main dashboard
        ├── my-contact/page.tsx       # Contact info page
        ├── profile-picture/page.tsx  # Profile picture page
        ├── change-requests/page.tsx  # Change requests page
        ├── team/page.tsx             # Team management page
        ├── search/page.tsx           # Employee search page
        └── review-requests/page.tsx  # Change request review page
```

## Hooks & Utilities

### useRole Hook

Located in `app/hooks/useRole.ts`, provides role checking functionality:

```typescript
const {
  userRole,           // Current user's role
  hasRole,            // Check single role
  hasAnyRole,         // Check multiple roles
  hasAllRoles,        // Check all roles
  isEmployee,         // Is basic employee
  isManager,          // Is manager
  isHRStaff,          // Is HR staff
  isAdmin,            // Is admin
} = useRole();
```

### useCanAccess Hook

Feature-based access control:

```typescript
const {
  // Self-service
  canViewMyProfile,
  canUpdateMyContact,
  canUploadProfilePicture,
  canRequestDataCorrection,
  
  // Manager
  canViewTeamMembers,
  canViewTeamSummary,
  
  // HR/Admin
  canSearchEmployees,
  canViewEmployeeDetails,
  canEditEmployee,
  canDeactivateEmployee,
  canAssignRoles,
  canListChangeRequests,
  canReviewChangeRequests,
  
  // Admin
  canManageSystemRoles,
  canAccessAdminPanel,
} = useCanAccess();
```

## Components

### RoleBasedAccess Component

Wrapper component that shows content only to authorized users:

```tsx
<RoleBasedAccess 
  requiredAccess={() => canViewMyProfile()}
  fallback={<UnauthorizedMessage />}
>
  <MyProfileContent />
</RoleBasedAccess>
```

### PermissionCheck Component

Simpler component that silently hides content:

```tsx
<PermissionCheck requiredAccess={() => canViewTeamMembers()}>
  <ManagerOnlyContent />
</PermissionCheck>
```

## Self-Service Components

### SelfServiceContactInfo

**Features:**
- View current contact information
- Edit phone number (immediate update)
- Edit address (immediate update)
- Request email change (HR approval required)
- View pending change requests

**API Endpoints:**
- `GET /employees/me` - Fetch current profile
- `PATCH /employees/me/contact` - Update contact info
- `POST /employees/change-requests` - Request email change

**Styling:**
- Dark theme with blue primary color (#2a2a2a background)
- Icon indicators for each field
- Edit/View toggle mode
- Inline error and success messages

### SelfServiceProfilePicture

**Features:**
- Display current profile picture
- Upload new picture with preview
- File validation (image only, max 5MB)
- Drag-and-drop support

**API Endpoints:**
- `POST /employees/me/profile-picture` - Upload picture (base64)

**Styling:**
- Side-by-side layout (current vs. upload)
- Large preview area
- Upload progress feedback
- Clear file format hints

### SelfServiceChangeRequests

**Features:**
- Submit data correction requests
- Select field to change
- Provide old and new values
- Add reason for change
- View request history with status

**API Endpoints:**
- `POST /employees/change-requests` - Submit request
- `GET /employees/change-requests` - View history

**Statuses:**
- PENDING - Awaiting HR review
- APPROVED - HR approved the change
- REJECTED - HR rejected the change

## Manager Components

### ManagerTeamView

**Features:**
- Tabbed interface (Members / Summary)
- Team members table with details
- Distribution statistics:
  - By Job Title
  - By Department
  - By Pay Grade
- Visual progress bars for distribution
- Stats cards showing totals

**API Endpoints:**
- `GET /employees/my-team` - Get team members
- `GET /employees/my-team/summary` - Get team summary

**Styling:**
- Stats cards with icons (blue, green, purple, yellow)
- Responsive table layout
- Color-coded progress bars
- Hover effects on table rows

## HR/Admin Components

### HREmployeeSearch

**Features:**
- Search by name or email
- Filter by department
- Filter by status (ACTIVE, INACTIVE, ON_LEAVE)
- Results table with:
  - Name, Email, Position, Department, Status
  - Action buttons (Edit, Assign Roles, Deactivate)

**API Endpoints:**
- `GET /employees/searchs?name=...&departmentId=...&status=...` - Search

**Actions:**
- Edit Employee (if canEditEmployee)
- Assign Roles (if canAssignRoles)
- Deactivate Employee (if canDeactivateEmployee)

### HRChangeRequestReview

**Features:**
- Filter by status (PENDING, APPROVED, REJECTED, ALL)
- Display change request details:
  - Employee name and number
  - Requested change description
  - Reason
  - Submission date
- Review interface for pending requests:
  - Add optional notes
  - Approve button
  - Reject button

**API Endpoints:**
- `GET /employees/change-requests` - List requests
- `PATCH /employees/change-requests/{id}/review` - Review request

**Styling:**
- Color-coded cards by status (green/approved, red/rejected, yellow/pending)
- Status icons
- Expandable review form
- Transition animations

### HRRoleAssignment

**Features:**
- Fetch current roles for employee
- Display all available roles
- Multi-select checkboxes
- Save updated roles
- Success/error feedback

**API Endpoints:**
- `GET /employees/{id}/roles` - Get current roles
- `PATCH /employees/{id}/roles` - Update roles

**Available Roles:**
- department employee
- department head
- HR Manager
- HR Employee
- Payroll Specialist
- System Admin
- Legal & Policy Admin
- Recruiter
- Finance Staff
- Job Candidate
- HR Admin
- Payroll Manager

## Pages

### Employee Profile Dashboard
**Route:** `/dashboard/employee-profile`
**Features:** Shows all accessible features based on user role
**Sections:**
- My Profile (self-service)
- Team Management (managers)
- HR Administration (HR staff)

### My Contact Information
**Route:** `/dashboard/employee-profile/my-contact`
**Component:** SelfServiceContactInfo

### Profile Picture
**Route:** `/dashboard/employee-profile/profile-picture`
**Component:** SelfServiceProfilePicture

### Change Requests
**Route:** `/dashboard/employee-profile/change-requests`
**Component:** SelfServiceChangeRequests

### Team Management
**Route:** `/dashboard/employee-profile/team`
**Component:** ManagerTeamView

### Employee Search
**Route:** `/dashboard/employee-profile/search`
**Component:** HREmployeeSearch

### Change Request Review
**Route:** `/dashboard/employee-profile/review-requests`
**Component:** HRChangeRequestReview

## Color Scheme

Inherited from DashboardLayout component:

- **Background:** #1a1a1a (very dark)
- **Cards:** #2a2a2a (dark)
- **Borders:** #333333 to #666666
- **Text:** white, gray-400, gray-300
- **Primary Blue:** #2563eb (focus, actions)
- **Success Green:** #16a34a
- **Warning Yellow:** #ca8a04
- **Error Red:** #dc2626
- **Purple Accent:** #9333ea (roles)

## Authorization Mapping

### SELF-SERVICE (All Employees)
```
Roles: DEPARTMENT_EMPLOYEE, HR_EMPLOYEE, HR_MANAGER, DEPARTMENT_HEAD,
       RECRUITER, FINANCE_STAFF, PAYROLL_MANAGER, SYSTEM_ADMIN, 
       HR_ADMIN, PAYROLL_SPECIALIST, LEGAL_POLICY_ADMIN

Features:
✓ Get My Profile (GET /employees/me)
✓ Update Contact Info (PATCH /employees/me/contact)
✓ Upload Profile Picture (POST /employees/me/profile-picture)
✓ Create Change Request (POST /employees/change-requests)
```

### MANAGER FEATURES
```
Roles: HR_MANAGER, DEPARTMENT_HEAD, SYSTEM_ADMIN

Features:
✓ Get Team Members (GET /employees/my-team)
✓ Get Team Summary (GET /employees/my-team/summary)
✓ Review Change Requests (PATCH /employees/change-requests/:id/review)
```

### HR/ADMIN FEATURES
```
Roles: HR_ADMIN, HR_MANAGER, SYSTEM_ADMIN

Features:
✓ Search Employees (GET /employees/searchs)
✓ Get Employee Details (GET /employees/:id)
✓ Edit Employee (PUT /employees/:id)
✓ Deactivate Employee (PATCH /employees/:id/deactivate)
✓ Assign Roles (PATCH /employees/:id/roles)
✓ List Change Requests (GET /employees/change-requests)
✓ Review Change Requests (PATCH /employees/change-requests/:id/review)
```

## API Integration

All components use the authenticated fetch with credentials:

```typescript
fetch('http://localhost:3000/endpoint', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
})
```

### Error Handling
- Try-catch blocks for all API calls
- User-friendly error messages
- Network error recovery
- Validation error display

## State Management

Each component manages its own state:
- Loading states during API calls
- Error messages
- Form data
- UI visibility (modals, tabs, etc.)

## Accessibility Features

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance
- Form validation feedback
- Status indicators

## Testing Recommendations

### Unit Tests
- Test role checking functions
- Test permission checks
- Test component rendering logic

### Integration Tests
- Test API calls with mocked responses
- Test authorization flows
- Test error handling

### E2E Tests
- Test complete user journeys
- Test role-based feature visibility
- Test form submissions

## Future Enhancements

1. **Pagination** - Add pagination to employee search results and change request lists
2. **Sorting** - Add column sorting to tables
3. **Bulk Actions** - Bulk role assignment, employee status updates
4. **Advanced Filters** - More granular search options
5. **Notifications** - Toast notifications for actions
6. **Audit Logging** - Track who made what changes
7. **Export** - Export employee data to CSV/PDF
8. **Profile Completion** - Show profile completion percentage
9. **Department Hierarchy** - Visual org chart
10. **Analytics Dashboard** - Advanced team analytics

## Usage Examples

### Basic Employee Using Self-Service Features
```
User Role: DEPARTMENT_EMPLOYEE
Visible: My Profile, Contact Info, Profile Picture, Change Requests
Hidden: Team Management, HR Administration
```

### Manager
```
User Role: DEPARTMENT_HEAD
Visible: My Profile, Contact Info, Profile Picture, Change Requests, Team Management
Hidden: HR Administration (unless also HR_MANAGER/SYSTEM_ADMIN)
```

### HR Administrator
```
User Role: HR_ADMIN
Visible: All features - Self-Service, Team Management (if also manager), 
         HR Administration
```

### System Administrator
```
User Role: SYSTEM_ADMIN
Visible: All features across all role groups
```

## Environment Variables

None required. API endpoints are hardcoded to `http://localhost:3000`. For production, update the endpoint URLs or move to environment variables.

## Dependencies

- React 18+
- Next.js 14+
- lucide-react (icons)
- Tailwind CSS (styling)

## Notes

- All components are client-side only ('use client')
- Uses Next.js App Router
- Leverages React Hooks for state management
- Fully responsive design
- Dark theme optimized

---

**Created:** December 13, 2025
**Last Updated:** December 13, 2025
