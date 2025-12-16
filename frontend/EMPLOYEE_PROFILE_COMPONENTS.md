# Employee Profile Frontend Components

This directory contains all frontend components and pages related to the Employee Profile service.

## Directory Structure

```
frontend/
├── app/
│   ├── components/EmployeeProfile/
│   │   ├── EmployeeCard.tsx                 # Card component for employee list view
│   │   ├── EmployeeDetailView.tsx           # Detailed employee profile view
│   │   ├── EmployeeListView.tsx             # Main list view with filtering
│   │   ├── EmployeeStats.tsx                # Statistics dashboard
│   │   ├── EmployeeStatusIndicator.tsx      # Status badge component
│   │   ├── EmployeeDocuments.tsx            # Document management component
│   │   ├── AddEmployeeForm.tsx              # Form to create new employee
│   │   ├── ContactInfo.tsx                  # Contact information card
│   │   └── ProfessionalInfo.tsx             # Professional details card
│   ├── dashboard/employees/
│   │   ├── page.tsx                         # Main employees page
│   │   ├── add/page.tsx                     # Add employee page
│   │   └── [id]/
│   │       ├── page.tsx                     # Employee detail page
│   │       └── full/page.tsx                # Full employee profile page
│   └── hooks/
│       ├── useEmployee.ts                   # Hook for single employee operations
│       ├── useEmployees.ts                  # Hook for multiple employees operations
│       └── useEmployeeApi.ts                # API helper hook
```

## Components Overview

### EmployeeCard
Displays a compact card view of an employee with key information.

**Props:**
- `id`: string - Employee ID
- `firstName`: string - Employee first name
- `lastName`: string - Employee last name
- `email`: string - Employee email
- `phone?`: string - Phone number
- `address?`: string - Address
- `jobTitle?`: string - Job title
- `department?`: string - Department
- `profilePictureUrl?`: string - Profile picture URL
- `status?`: string - Employee status (ACTIVE, ON_LEAVE, SUSPENDED, RETIRED)

**Usage:**
```tsx
<EmployeeCard
  id="emp-123"
  firstName="John"
  lastName="Doe"
  email="john@example.com"
  jobTitle="Senior Developer"
  status="ACTIVE"
/>
```

### EmployeeListView
Main list view component with search, filtering, and sorting capabilities.

**Props:**
- `viewType?`: 'grid' | 'list' - View mode (default: 'grid')

**Features:**
- Search by name or email
- Filter by department and status
- Sort by name, department, or status
- Responsive grid/list layout

**Usage:**
```tsx
<EmployeeListView viewType="grid" />
```

### EmployeeStats
Dashboard statistics component showing employee counts by status.

**Props:**
- `totalEmployees?`: number
- `activeEmployees?`: number
- `onLeaveEmployees?`: number
- `suspendedEmployees?`: number

**Usage:**
```tsx
<EmployeeStats
  totalEmployees={100}
  activeEmployees={85}
  onLeaveEmployees={10}
  suspendedEmployees={5}
/>
```

### AddEmployeeForm
Form component for creating new employees.

**Props:**
- `onCancel?`: () => void - Callback when user cancels

**Features:**
- Personal information fields
- Professional information fields
- Bio/biography textarea
- Form validation
- Error handling

**Usage:**
```tsx
<AddEmployeeForm onCancel={() => router.back()} />
```

### EmployeeDetailView
Detailed employee profile view with edit functionality.

**Props:**
- `employee`: Employee object

**Features:**
- View and edit employee information
- Status indicator
- Profile picture display
- Biography section
- Metadata display (created/updated dates)

### EmployeeStatusIndicator
Status badge component with icon and color coding.

**Props:**
- `status`: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'RETIRED'
- `className?`: string

**Status Colors:**
- ACTIVE: Green
- ON_LEAVE: Yellow
- SUSPENDED: Red
- RETIRED: Gray

### ContactInfo
Card component displaying employee contact information.

**Props:**
- `firstName`: string
- `lastName`: string
- `email`: string
- `phone?`: string
- `address?`: string
- `department?`: string
- `jobTitle?`: string

### ProfessionalInfo
Card component displaying employee professional information.

**Props:**
- `jobTitle?`: string
- `department?`: string
- `startDate?`: string
- `managerId?`: string
- `employeeNumber?`: string
- `contractType?`: string

### EmployeeDocuments
Document management component for uploading and downloading files.

**Props:**
- `employeeId`: string
- `documents?`: Document[]

**Features:**
- Upload documents
- Download documents
- Display upload date
- File type indication

## Hooks

### useEmployee
Hook for managing a single employee's data.

```tsx
const {
  employee,
  loading,
  error,
  fetchEmployee,
  updateEmployee,
  deleteEmployee,
} = useEmployee();

// Fetch an employee
await fetchEmployee('emp-123');

// Update an employee
await updateEmployee('emp-123', { firstName: 'Jane' });

// Delete an employee
await deleteEmployee('emp-123');
```

### useEmployees
Hook for managing multiple employees with filtering.

```tsx
const {
  employees,
  loading,
  error,
  filters,
  fetchEmployees,
  getStatistics,
} = useEmployees();

// Fetch employees with filters
await fetchEmployees({
  searchTerm: 'John',
  department: 'Engineering',
  status: 'ACTIVE',
  sortBy: 'name',
  sortOrder: 'asc',
});

// Get statistics
const stats = await getStatistics();
```

### useEmployeeApi
Hook with API helper methods.

```tsx
const {
  createEmployee,
  uploadProfilePicture,
  searchEmployees,
} = useEmployeeApi();

// Create employee
const newEmployee = await createEmployee({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
});

// Upload profile picture
await uploadProfilePicture('emp-123', file);

// Search employees
const results = await searchEmployees('John');
```

## Pages

### /dashboard/employees
Main employees directory page with statistics and list view.

**Features:**
- Employee statistics
- Employee directory
- Quick add button
- List/grid toggle

### /dashboard/employees/add
Create new employee page.

**Features:**
- Employee creation form
- Form validation
- Success/error handling

### /dashboard/employees/[id]
Basic employee detail page.

**Features:**
- View employee information
- Edit mode toggle
- Status indicator

### /dashboard/employees/[id]/full
Full employee profile page with all details.

**Features:**
- Complete employee profile
- Contact and professional info
- Document management
- Extended metadata
- Edit capabilities

## Color Scheme

The employee profile components inherit colors from the Dashboard component:

- **Background**: `#1a1a1a` (dark), `#2a2a2a` (lighter)
- **Text**: `#ffffff` (white), `#ededed` (off-white)
- **Accent**: Blue (`#2563eb` - blue-600), Green (`#16a34a` - green-600)
- **Borders**: `#333333`

### Status Colors:
- **ACTIVE**: Green (`#16a34a`)
- **ON_LEAVE**: Yellow (`#ca8a04`)
- **SUSPENDED**: Red (`#dc2626`)
- **RETIRED**: Gray (`#4b5563`)

## API Endpoints Expected

The components expect the following API endpoints:

- `GET /api/employees` - Get all employees (with optional filters)
- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee details
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/stats` - Get statistics
- `GET /api/employees/search?query=` - Search employees
- `POST /api/employees/:id/profile-picture` - Upload profile picture
- `POST /api/employees/:id/documents` - Upload document
- `GET /api/employees/:id/documents` - Get documents

## Styling

All components use Tailwind CSS with the following utilities:

- Dark theme with custom color variables
- Responsive grid layouts
- Hover and transition effects
- Form styling with focus states
- Icon integration from `lucide-react`

## Usage Example

### Setting up the employees page

```tsx
import DashboardLayout from '../components/DashboardLayout';
import EmployeeListView from '../components/EmployeeProfile/EmployeeListView';
import EmployeeStats from '../components/EmployeeProfile/EmployeeStats';

export default function EmployeesPage() {
  return (
    <DashboardLayout title="Employees" description="Manage employees">
      <EmployeeStats totalEmployees={100} activeEmployees={85} />
      <EmployeeListView viewType="grid" />
    </DashboardLayout>
  );
}
```

## Notes

- All components are client-side components (marked with `'use client'`)
- Components use React hooks for state management
- API calls use fetch with proper error handling
- Form validation is handled client-side
- Loading states are managed for all async operations
- Responsive design works on mobile, tablet, and desktop

## Future Enhancements

- Add pagination for large employee lists
- Implement advanced filtering
- Add bulk operations (edit, delete)
- Export employee data (CSV, PDF)
- Add employee photo upload with cropping
- Implement role-based access control
- Add employee performance metrics integration
