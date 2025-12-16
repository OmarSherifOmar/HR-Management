# Employee Profile Frontend - Quick Reference Guide

## 🎯 Quick Start

### 1. Using Role-Based Access in Components

```tsx
import { useCanAccess } from '@/hooks/useRole';
import { RoleBasedAccess, PermissionCheck } from '@/components/Auth/RoleBasedAccess';

export default function MyComponent() {
  const { canViewMyProfile } = useCanAccess();

  return (
    // Option 1: Show with fallback
    <RoleBasedAccess requiredAccess={canViewMyProfile}>
      <MyContent />
    </RoleBasedAccess>

    // Option 2: Silent hide (no fallback)
    // <PermissionCheck requiredAccess={canViewMyProfile}>
    //   <MyContent />
    // </PermissionCheck>
  );
}
```

### 2. Checking Multiple Permissions

```tsx
const { canEditEmployee, canAssignRoles } = useCanAccess();

const canManageEmployee = () => canEditEmployee() && canAssignRoles();

<RoleBasedAccess requiredAccess={canManageEmployee}>
  <EmployeeManager />
</RoleBasedAccess>
```

### 3. Using Role Directly

```tsx
import { useRole } from '@/hooks/useRole';

export default function MyComponent() {
  const { isManager, isAdmin, hasRole } = useRole();

  if (isManager()) {
    return <ManagerView />;
  }
  
  if (hasRole('HR Admin')) {
    return <AdminView />;
  }

  return <EmployeeView />;
}
```

## 📚 Available Hooks

### useRole()

```typescript
const {
  userRole: string,                    // Current user's role
  hasRole: (role) => boolean,         // Check single role
  hasAnyRole: (roles[]) => boolean,   // Check if has any of roles
  hasAllRoles: (roles[]) => boolean,  // Check if has all roles
  isEmployee: () => boolean,          // Is department employee
  isManager: () => boolean,           // Is manager/department head
  isHRStaff: () => boolean,          // Is HR staff
  isAdmin: () => boolean,            // Is system/HR admin
} = useRole();
```

### useCanAccess()

**Self-Service Features:**
```typescript
canViewMyProfile()
canUpdateMyContact()
canUploadProfilePicture()
canRequestDataCorrection()
```

**Manager Features:**
```typescript
canViewTeamMembers()
canViewTeamSummary()
```

**HR/Admin Features:**
```typescript
canSearchEmployees()
canViewEmployeeDetails()
canEditEmployee()
canDeactivateEmployee()
canAssignRoles()
canListChangeRequests()
canReviewChangeRequests()
canManageSystemRoles()
canAccessAdminPanel()
```

## 🔗 Component Imports

```tsx
// Self-Service
import { SelfServiceContactInfo } from '@/components/EmployeeProfile';
import { SelfServiceProfilePicture } from '@/components/EmployeeProfile';
import { SelfServiceChangeRequests } from '@/components/EmployeeProfile';

// Manager
import { ManagerTeamView } from '@/components/EmployeeProfile';

// HR/Admin
import { HREmployeeSearch } from '@/components/EmployeeProfile';
import { HRChangeRequestReview } from '@/components/EmployeeProfile';
import { HRRoleAssignment } from '@/components/EmployeeProfile';

// Auth
import { RoleBasedAccess, PermissionCheck } from '@/components/Auth/RoleBasedAccess';
```

## 🛣️ Routes

| Route | Feature | Requires |
|-------|---------|----------|
| `/dashboard/employee-profile` | Dashboard | Any role |
| `/dashboard/employee-profile/my-contact` | Update Contact | `canUpdateMyContact` |
| `/dashboard/employee-profile/profile-picture` | Upload Picture | `canUploadProfilePicture` |
| `/dashboard/employee-profile/change-requests` | Request Changes | `canRequestDataCorrection` |
| `/dashboard/employee-profile/team` | Team View | `canViewTeamMembers` |
| `/dashboard/employee-profile/search` | Search Employees | `canSearchEmployees` |
| `/dashboard/employee-profile/review-requests` | Review Changes | `canListChangeRequests` |

## 📋 Roles & Permissions

### DEPARTMENT_EMPLOYEE
✓ View own profile
✓ Update contact info
✓ Upload profile picture
✓ Request data corrections

### DEPARTMENT_HEAD
✓ All DEPARTMENT_EMPLOYEE features
✓ View team members
✓ View team summary
✓ Review change requests

### HR_EMPLOYEE
✓ All DEPARTMENT_EMPLOYEE features

### HR_MANAGER
✓ All DEPARTMENT_EMPLOYEE features
✓ All DEPARTMENT_HEAD features
✓ All HR_ADMIN features

### PAYROLL_SPECIALIST
✓ All DEPARTMENT_EMPLOYEE features

### PAYROLL_MANAGER
✓ All DEPARTMENT_EMPLOYEE features

### SYSTEM_ADMIN
✓ All features across all roles

### HR_ADMIN
✓ All HR features
✓ Search employees
✓ Manage employee profiles
✓ Assign roles
✓ Review change requests

### RECRUITER
✓ All DEPARTMENT_EMPLOYEE features

### FINANCE_STAFF
✓ All DEPARTMENT_EMPLOYEE features

### LEGAL_POLICY_ADMIN
✓ All DEPARTMENT_EMPLOYEE features

### JOB_CANDIDATE
✗ No access (profile creation only)

## 🎨 Color Guide

```
Background: #1a1a1a (primary dark)
Cards:      #2a2a2a (secondary dark)
Text:       #ffffff (white), #a1a1a1 (gray)

Primary:    #2563eb (blue)
Success:    #16a34a (green)
Warning:    #ca8a04 (yellow)
Error:      #dc2626 (red)
Accent:     #9333ea (purple)
```

## 🔄 Common Patterns

### Pattern 1: Role-Based Rendering
```tsx
<RoleBasedAccess 
  requiredAccess={() => isManager()}
  fallback={<UnauthorizedMessage />}
>
  <ManagerContent />
</RoleBasedAccess>
```

### Pattern 2: Multiple Permissions
```tsx
<RoleBasedAccess 
  requiredAccess={() => canEditEmployee() && canAssignRoles()}
>
  <AdvancedManagement />
</RoleBasedAccess>
```

### Pattern 3: Conditional Rendering
```tsx
{canViewTeamMembers() && <TeamSection />}
{canSearchEmployees() && <SearchSection />}
{canReviewChangeRequests() && <ReviewSection />}
```

### Pattern 4: Component with Props
```tsx
<HRRoleAssignment 
  employeeId={employeeId}
  onClose={() => setOpen(false)}
/>
```

## 📊 API Base URL

**Development:** `http://localhost:3000`

All endpoints automatically include:
```typescript
{
  method: 'GET|POST|PATCH|PUT',
  credentials: 'include',  // For auth
  headers: {
    'Content-Type': 'application/json'
  }
}
```

## 🔍 Debugging

### Check Current User Role
```tsx
import { useAuth } from '@/context/AuthContext';

const { user } = useAuth();
console.log('User role:', user?.role);
```

### Test Permission
```tsx
import { useCanAccess } from '@/hooks/useRole';

const { canSearchEmployees } = useCanAccess();
console.log('Can search:', canSearchEmployees());
```

### Check All Available Permissions
```tsx
import { useCanAccess } from '@/hooks/useRole';

const access = useCanAccess();
console.table(Object.entries(access).map(([key, fn]) => [key, fn()]));
```

## ⚠️ Common Issues

### Issue: Component not showing
**Solution:** Check `useCanAccess()` returns true for required permission

### Issue: API returns 403 Forbidden
**Solution:** Verify user role has permission for endpoint

### Issue: User sees different features after login
**Solution:** Token might be expired, check `checkTokenValidity()`

### Issue: Component renders then disappears
**Solution:** Check for loading state, ensure API call succeeds

## ✅ Verification Checklist

- [ ] User role is set correctly on login
- [ ] Components render based on role
- [ ] Unauthorized content is hidden
- [ ] API calls include credentials
- [ ] Error messages display correctly
- [ ] Loading states show during requests
- [ ] Navigation links only show accessible routes

## 🎓 Example: Create a New Role-Protected Feature

```tsx
// 1. Add permission check to useCanAccess()
export function useCanAccess() {
  return {
    // ... existing permissions
    canManagePayroll: () => role.hasRole(UserRole.PAYROLL_MANAGER),
  };
}

// 2. Create component
export default function PayrollManager() {
  return (
    <div>Payroll Content</div>
  );
}

// 3. Wrap with RoleBasedAccess
export default function PayrollPage() {
  const { canManagePayroll } = useCanAccess();

  return (
    <RoleBasedAccess requiredAccess={canManagePayroll}>
      <PayrollManager />
    </RoleBasedAccess>
  );
}
```

## 📞 Support

For issues or questions:
1. Check the logs for error messages
2. Verify user role is correct
3. Check API endpoints are responding
4. Review component props
5. Test with different user roles

---

**Last Updated:** December 13, 2025
**Version:** 1.0
