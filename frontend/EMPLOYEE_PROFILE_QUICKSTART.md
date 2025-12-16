# Employee Profile Frontend - Quick Start Guide

## Overview

This guide will help you get started with the Employee Profile frontend components created for the HR System.

## Features Included

✅ **Employee Directory** - View all employees in a searchable, filterable grid
✅ **Employee Profiles** - Detailed employee information with edit capabilities
✅ **Add Employees** - Create new employee records with form validation
✅ **Statistics Dashboard** - Overview of employees by status
✅ **Search & Filter** - Search by name/email, filter by department/status
✅ **Document Management** - Upload and manage employee documents
✅ **Status Tracking** - Visual status indicators (Active, On Leave, Suspended, Retired)
✅ **Responsive Design** - Works on desktop, tablet, and mobile

## Color Scheme

All components inherit colors from the Dashboard component:

### Primary Colors:
- **Dark Background**: `#1a1a1a` (very dark)
- **Light Background**: `#2a2a2a` (dark gray)
- **Text**: `#ffffff` (white)
- **Borders**: `#333333` (dark gray)

### Status Colors:
- **ACTIVE**: Green (`#16a34a`)
- **ON_LEAVE**: Yellow (`#ca8a04`)
- **SUSPENDED**: Red (`#dc2626`)
- **RETIRED**: Gray (`#4b5563`)

### Accent Colors:
- **Primary**: Blue (`#2563eb`)
- **Hover**: Lighter Blue (`#3b82f6`)
- **Success**: Green (`#10b981`)
- **Warning**: Yellow (`#f59e0b`)

## File Structure

```
frontend/
├── app/
│   ├── components/
│   │   └── EmployeeProfile/           # All employee components
│   │       ├── index.ts               # Main export file
│   │       ├── EmployeeCard.tsx       # Employee card component
│   │       ├── EmployeeListView.tsx   # List view with filters
│   │       ├── EmployeeDetailView.tsx # Detail view
│   │       ├── EmployeeStats.tsx      # Statistics cards
│   │       ├── EmployeeStatusIndicator.tsx # Status badge
│   │       ├── EmployeeDocuments.tsx  # Document manager
│   │       ├── AddEmployeeForm.tsx    # Add employee form
│   │       ├── ContactInfo.tsx        # Contact card
│   │       └── ProfessionalInfo.tsx   # Professional info card
│   ├── dashboard/
│   │   └── employees/                 # Employee pages
│   │       ├── page.tsx               # Main employee directory
│   │       ├── add/
│   │       │   └── page.tsx           # Add employee page
│   │       └── [id]/
│   │           ├── page.tsx           # Employee detail
│   │           └── full/
│   │               └── page.tsx       # Full profile
│   ├── hooks/
│   │   ├── useEmployee.ts            # Single employee hook
│   │   ├── useEmployees.ts           # Multiple employees hook
│   │   └── useEmployeeApi.ts         # API helper hook
│   └── utils/
│       └── employeeUtils.ts           # Utility functions
```

## Quick Start Usage

### 1. Import Components

```tsx
import {
  EmployeeCard,
  EmployeeListView,
  EmployeeStats,
  AddEmployeeForm,
} from '@/app/components/EmployeeProfile';
```

Or import individual components:

```tsx
import EmployeeListView from '@/app/components/EmployeeProfile/EmployeeListView';
```

### 2. Use in Your Page

```tsx
'use client';

import DashboardLayout from '@/app/components/DashboardLayout';
import { EmployeeStats, EmployeeListView } from '@/app/components/EmployeeProfile';

export default function EmployeesPage() {
  return (
    <DashboardLayout
      title="Employees"
      description="Manage all employee profiles"
    >
      <EmployeeStats
        totalEmployees={100}
        activeEmployees={85}
        onLeaveEmployees={10}
        suspendedEmployees={5}
      />

      <EmployeeListView viewType="grid" />
    </DashboardLayout>
  );
}
```

### 3. Use Hooks

```tsx
'use client';

import { useEmployees } from '@/app/hooks/useEmployees';
import { useEffect } from 'react';

export default function MyComponent() {
  const { employees, loading, fetchEmployees } = useEmployees();

  useEffect(() => {
    fetchEmployees({
      searchTerm: '',
      department: 'Engineering',
      status: 'ACTIVE',
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {employees.map((emp) => (
        <div key={emp.id}>{emp.firstName} {emp.lastName}</div>
      ))}
    </div>
  );
}
```

### 4. Use Utility Functions

```tsx
import {
  formatEmployeeName,
  calculateTenure,
  filterEmployees,
  getEmployeeStatistics,
} from '@/app/utils/employeeUtils';

// Format name
const fullName = formatEmployeeName('John', 'Doe'); // "John Doe"

// Calculate tenure
const years = calculateTenure('2020-01-15'); // Years since hire date

// Filter employees
const filtered = filterEmployees(employees, {
  searchTerm: 'John',
  department: 'Engineering',
  status: 'ACTIVE',
});

// Get statistics
const stats = getEmployeeStatistics(employees);
console.log(stats.active); // Number of active employees
```

## Available Routes

- `/dashboard/employees` - Employee directory
- `/dashboard/employees/add` - Add new employee
- `/dashboard/employees/[id]` - Employee detail page
- `/dashboard/employees/[id]/full` - Full employee profile

## API Endpoints Expected

The frontend expects these API endpoints to exist:

```
GET    /api/employees              - Get all employees
POST   /api/employees              - Create employee
GET    /api/employees/:id          - Get employee details
PUT    /api/employees/:id          - Update employee
DELETE /api/employees/:id          - Delete employee
GET    /api/employees/stats        - Get statistics
GET    /api/employees/search       - Search employees
POST   /api/employees/:id/profile-picture - Upload profile pic
POST   /api/employees/:id/documents       - Upload document
```

## Component Props Reference

### EmployeeCard
```tsx
<EmployeeCard
  id="emp-123"
  firstName="John"
  lastName="Doe"
  email="john@example.com"
  phone="123-456-7890"
  address="123 Main St"
  jobTitle="Senior Developer"
  department="Engineering"
  profilePictureUrl="url-to-image"
  status="ACTIVE"
/>
```

### EmployeeListView
```tsx
<EmployeeListView viewType="grid" /> {/* or "list" */}
```

### EmployeeStats
```tsx
<EmployeeStats
  totalEmployees={100}
  activeEmployees={85}
  onLeaveEmployees={10}
  suspendedEmployees={5}
/>
```

### AddEmployeeForm
```tsx
<AddEmployeeForm onCancel={() => router.back()} />
```

### EmployeeStatusIndicator
```tsx
<EmployeeStatusIndicator status="ACTIVE" className="mb-4" />
```

## Styling Notes

- Uses **Tailwind CSS** for styling
- Dark theme with predefined colors
- Responsive design with mobile-first approach
- Icons from **lucide-react**
- Hover effects and smooth transitions
- Focus states for accessibility

## Common Customizations

### Change Colors

To change status colors, edit `app/utils/employeeUtils.ts`:

```tsx
export const employeeStatusConfig = {
  ACTIVE: {
    label: 'Active',
    color: 'bg-custom-color', // Change here
    // ...
  },
  // ...
};
```

### Modify Form Fields

To add/remove form fields, edit `components/EmployeeProfile/AddEmployeeForm.tsx`:

```tsx
<input
  type="text"
  name="customField" // Add here
  value={formData.customField || ''}
  onChange={handleInputChange}
  className="..."
/>
```

### Change Grid Columns

To modify the grid layout, edit component className:

```tsx
{/* Change from lg:grid-cols-3 to lg:grid-cols-4 */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
```

## Troubleshooting

### Components not showing?
1. Ensure `'use client'` is at the top of your file
2. Check that you're importing from the correct paths
3. Verify DashboardLayout is wrapping your content

### API calls failing?
1. Check that backend API endpoints are running
2. Verify CORS settings allow your frontend domain
3. Check browser console for detailed error messages

### Styling issues?
1. Ensure Tailwind CSS is properly configured
2. Check that dark mode is enabled in `next.config.ts`
3. Verify CSS custom variables are defined in `globals.css`

## Next Steps

1. **Configure API endpoints** - Update the API base URL if needed
2. **Add authentication** - Integrate with your auth system
3. **Customize fields** - Add/remove employee fields as needed
4. **Add permissions** - Implement role-based access control
5. **Add more features** - Export to CSV, bulk actions, etc.

## Support

For issues or questions, refer to:
- `EMPLOYEE_PROFILE_COMPONENTS.md` - Detailed component documentation
- `employeeUtils.ts` - Utility function reference
- Backend API documentation

## Version Info

- Next.js: 14+
- React: 18+
- Tailwind CSS: 3+
- TypeScript: 5+
- Lucide React Icons: Latest

---

**Happy coding! 🚀**
