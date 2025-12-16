/**
 * Employee Profile Utilities
 * Helper functions for employee profile operations
 */

export const employeeStatusConfig = {
  ACTIVE: {
    label: 'Active',
    color: 'bg-green-600',
    textColor: 'text-green-600',
    bgColor: 'bg-green-600/20',
    description: 'Employee is actively working',
  },
  ON_LEAVE: {
    label: 'On Leave',
    color: 'bg-yellow-600',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-600/20',
    description: 'Employee is on leave',
  },
  SUSPENDED: {
    label: 'Suspended',
    color: 'bg-red-600',
    textColor: 'text-red-600',
    bgColor: 'bg-red-600/20',
    description: 'Employee account is suspended',
  },
  RETIRED: {
    label: 'Retired',
    color: 'bg-gray-600',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-600/20',
    description: 'Employee has retired',
  },
};

/**
 * Format employee name
 */
export const formatEmployeeName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};

/**
 * Get initials from employee name
 */
export const getEmployeeInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date with time
 */
export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone format (basic)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth: string | Date): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

/**
 * Calculate tenure (years of service)
 */
export const calculateTenure = (startDate: string | Date): number => {
  const today = new Date();
  const hire = new Date(startDate);
  let tenure = today.getFullYear() - hire.getFullYear();
  const monthDiff = today.getMonth() - hire.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < hire.getDate())
  ) {
    tenure--;
  }

  return tenure;
};

/**
 * Generate employee avatar URL (using initials)
 */
export const generateAvatarUrl = (
  firstName: string,
  lastName: string,
  backgroundColor: string = '2563eb'
): string => {
  const initials = getEmployeeInitials(firstName, lastName);
  return `https://ui-avatars.com/api/?name=${initials}&background=${backgroundColor}&color=fff`;
};

/**
 * Filter employees by criteria
 */
export interface EmployeeFilterCriteria {
  searchTerm?: string;
  department?: string;
  status?: string;
  minTenure?: number;
  maxTenure?: number;
}

export const filterEmployees = (
  employees: any[],
  criteria: EmployeeFilterCriteria
): any[] => {
  return employees.filter((employee) => {
    // Search term filter
    if (criteria.searchTerm) {
      const search = criteria.searchTerm.toLowerCase();
      const matchesSearch =
        employee.firstName.toLowerCase().includes(search) ||
        employee.lastName.toLowerCase().includes(search) ||
        employee.email.toLowerCase().includes(search) ||
        (employee.jobTitle?.toLowerCase().includes(search) ?? false);

      if (!matchesSearch) return false;
    }

    // Department filter
    if (
      criteria.department &&
      employee.department?.toUpperCase() !==
        criteria.department.toUpperCase()
    ) {
      return false;
    }

    // Status filter
    if (
      criteria.status &&
      employee.status?.toUpperCase() !== criteria.status.toUpperCase()
    ) {
      return false;
    }

    // Tenure filters
    if (employee.startDate) {
      const tenure = calculateTenure(employee.startDate);

      if (
        criteria.minTenure !== undefined &&
        tenure < criteria.minTenure
      ) {
        return false;
      }

      if (
        criteria.maxTenure !== undefined &&
        tenure > criteria.maxTenure
      ) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Sort employees
 */
export type EmployeeSortKey = 'name' | 'department' | 'status' | 'startDate';

export const sortEmployees = (
  employees: any[],
  sortKey: EmployeeSortKey,
  order: 'asc' | 'desc' = 'asc'
): any[] => {
  const sorted = [...employees].sort((a, b) => {
    let compareValue = 0;

    switch (sortKey) {
      case 'name':
        compareValue = `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        );
        break;
      case 'department':
        compareValue = (a.department ?? '').localeCompare(b.department ?? '');
        break;
      case 'status':
        compareValue = (a.status ?? '').localeCompare(b.status ?? '');
        break;
      case 'startDate':
        compareValue = new Date(a.startDate ?? 0).getTime() -
          new Date(b.startDate ?? 0).getTime();
        break;
    }

    return order === 'asc' ? compareValue : -compareValue;
  });

  return sorted;
};

/**
 * Export employees to CSV
 */
export const exportEmployeesToCsv = (employees: any[]): void => {
  const headers = [
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Department',
    'Job Title',
    'Status',
    'Start Date',
  ];

  const rows = employees.map((emp) => [
    emp.firstName,
    emp.lastName,
    emp.email,
    emp.phone || '',
    emp.department || '',
    emp.jobTitle || '',
    emp.status || '',
    emp.startDate ? formatDate(emp.startDate) : '',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${cell}"`).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `employees-${formatDate(new Date())}.csv`;
  link.click();
};

/**
 * Get employee statistics
 */
export interface EmployeeStatistics {
  total: number;
  active: number;
  onLeave: number;
  suspended: number;
  retired: number;
  byDepartment: { [key: string]: number };
  byStatus: { [key: string]: number };
}

export const getEmployeeStatistics = (
  employees: any[]
): EmployeeStatistics => {
  const stats: EmployeeStatistics = {
    total: employees.length,
    active: 0,
    onLeave: 0,
    suspended: 0,
    retired: 0,
    byDepartment: {},
    byStatus: {},
  };

  employees.forEach((emp) => {
    // Count by status
    switch (emp.status?.toUpperCase()) {
      case 'ACTIVE':
        stats.active++;
        break;
      case 'ON_LEAVE':
        stats.onLeave++;
        break;
      case 'SUSPENDED':
        stats.suspended++;
        break;
      case 'RETIRED':
        stats.retired++;
        break;
    }

    // Count by department
    if (emp.department) {
      stats.byDepartment[emp.department] =
        (stats.byDepartment[emp.department] ?? 0) + 1;
    }

    // Count by status
    if (emp.status) {
      stats.byStatus[emp.status] =
        (stats.byStatus[emp.status] ?? 0) + 1;
    }
  });

  return stats;
};
