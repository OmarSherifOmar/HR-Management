'use client';

import { useAuth } from '../context/AuthContext';

export enum UserRole {
  DEPARTMENT_EMPLOYEE = 'department employee',
  DEPARTMENT_HEAD = 'department head',
  HR_MANAGER = 'HR Manager',
  HR_EMPLOYEE = 'HR Employee',
  PAYROLL_SPECIALIST = 'Payroll Specialist',
  SYSTEM_ADMIN = 'System Admin',
  LEGAL_POLICY_ADMIN = 'Legal & Policy Admin',
  RECRUITER = 'Recruiter',
  FINANCE_STAFF = 'Finance Staff',
  JOB_CANDIDATE = 'Job Candidate',
  HR_ADMIN = 'HR Admin',
  PAYROLL_MANAGER = 'Payroll Manager',
}

export const ROLE_GROUPS = {
  // Self-service permissions
  ALL_EMPLOYEES: [
    UserRole.DEPARTMENT_EMPLOYEE,
    UserRole.HR_EMPLOYEE,
    UserRole.HR_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.RECRUITER,
    UserRole.FINANCE_STAFF,
    UserRole.PAYROLL_MANAGER,
    UserRole.SYSTEM_ADMIN,
    UserRole.HR_ADMIN,
    UserRole.PAYROLL_SPECIALIST,
    UserRole.LEGAL_POLICY_ADMIN,
  ],
  
  // Manager permissions
  MANAGERS: [
    UserRole.HR_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.SYSTEM_ADMIN,
  ],
  
  // HR/Admin permissions
  HR_STAFF: [
    UserRole.HR_ADMIN,
    UserRole.HR_MANAGER,
    UserRole.SYSTEM_ADMIN,
  ],
  
  // Advanced admin
  ADMINS: [UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN],
};

export function useRole() {
  const { user } = useAuth();

  const userRole = user?.role as UserRole | undefined;

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!userRole) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(userRole);
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!userRole) return false;
    return roles.includes(userRole);
  };

  const hasAllRoles = (roles: UserRole[]): boolean => {
    if (!userRole) return false;
    return roles.includes(userRole);
  };

  const isEmployee = (): boolean => {
    return hasRole(UserRole.DEPARTMENT_EMPLOYEE);
  };

  const isManager = (): boolean => {
    return hasAnyRole(ROLE_GROUPS.MANAGERS);
  };

  const isHRStaff = (): boolean => {
    return hasAnyRole(ROLE_GROUPS.HR_STAFF);
  };

  const isAdmin = (): boolean => {
    return hasAnyRole(ROLE_GROUPS.ADMINS);
  };

  return {
    userRole,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isEmployee,
    isManager,
    isHRStaff,
    isAdmin,
  };
}

// Feature-based access
export function useCanAccess() {
  const role = useRole();

  return {
    // Self-service features (all employees)
    canViewMyProfile: () => role.hasAnyRole(ROLE_GROUPS.ALL_EMPLOYEES),
    canUpdateMyContact: () => role.hasAnyRole(ROLE_GROUPS.ALL_EMPLOYEES),
    canUploadProfilePicture: () => role.hasAnyRole(ROLE_GROUPS.ALL_EMPLOYEES),
    canRequestDataCorrection: () => role.hasAnyRole(ROLE_GROUPS.ALL_EMPLOYEES),

    // Manager features
    canViewTeamMembers: () => role.hasAnyRole(ROLE_GROUPS.MANAGERS),
    canViewTeamSummary: () => role.hasAnyRole(ROLE_GROUPS.MANAGERS),

    // HR/Admin features
    canSearchEmployees: () => role.hasAnyRole(ROLE_GROUPS.HR_STAFF),
    canViewEmployeeDetails: () => role.hasAnyRole(ROLE_GROUPS.HR_STAFF),
    canEditEmployee: () => role.hasAnyRole(ROLE_GROUPS.HR_STAFF),
    canDeactivateEmployee: () => role.hasAnyRole(ROLE_GROUPS.HR_STAFF),
    canAssignRoles: () => role.hasAnyRole(ROLE_GROUPS.HR_STAFF),
    canListChangeRequests: () => role.hasAnyRole(ROLE_GROUPS.HR_STAFF),
    canReviewChangeRequests: () => role.hasAnyRole(ROLE_GROUPS.HR_STAFF),

    // Admin only
    canManageSystemRoles: () => role.isAdmin(),
    canAccessAdminPanel: () => role.isAdmin(),
  };
}
