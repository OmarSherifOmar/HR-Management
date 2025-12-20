/**
 * Performance Management Access Control Utility
 * Handles role-based authorization for all PM features
 */

export enum PerformanceSystemRole {
  DEPARTMENT_EMPLOYEE = 'department employee',
  DEPARTMENT_HEAD = 'department head',
  HR_MANAGER = 'HR Manager',
  HR_EMPLOYEE = 'HR Employee',
  HR_ADMIN = 'HR Admin',
  SYSTEM_ADMIN = 'System Admin',
}

export enum PerformanceFeature {
  // Template Management
  CREATE_TEMPLATE = 'create_template',
  MANAGE_TEMPLATES = 'manage_templates',
  VIEW_TEMPLATES = 'view_templates',

  // Cycle Management
  CREATE_CYCLE = 'create_cycle',
  MANAGE_CYCLES = 'manage_cycles',
  ACTIVATE_CYCLE = 'activate_cycle',
  CLOSE_CYCLE = 'close_cycle',
  VIEW_CYCLES = 'view_cycles',

  // Assignment Management
  CREATE_ASSIGNMENTS = 'create_assignments',
  BULK_ASSIGN = 'bulk_assign',
  MANAGE_ASSIGNMENTS = 'manage_assignments',
  VIEW_ASSIGNMENTS = 'view_assignments',

  // Appraisal Management
  SUBMIT_APPRAISAL = 'submit_appraisal',
  ACKNOWLEDGE_APPRAISAL = 'acknowledge_appraisal',
  VIEW_MY_APPRAISALS = 'view_my_appraisals',
  TRACK_APPRAISALS = 'track_appraisals',
  PUBLISH_APPRAISALS = 'publish_appraisals',

  // Dispute Management
  CREATE_DISPUTE = 'create_dispute',
  RESOLVE_DISPUTE = 'resolve_dispute',
  VIEW_DISPUTES = 'view_disputes',

  // Reporting
  ARCHIVE_APPRAISALS = 'archive_appraisals',
  VIEW_REPORTS = 'view_reports',
  VIEW_OUTCOME_REPORT = 'view_outcome_report',
}

/**
 * Feature-to-Role mapping
 * Defines which roles can access which features
 */
export const FEATURE_PERMISSIONS: Record<PerformanceFeature, PerformanceSystemRole[]> = {
  // Template Management - HR Manager only
  [PerformanceFeature.CREATE_TEMPLATE]: [
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],
  [PerformanceFeature.MANAGE_TEMPLATES]: [
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],
  [PerformanceFeature.VIEW_TEMPLATES]: [
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.HR_EMPLOYEE,
    PerformanceSystemRole.DEPARTMENT_HEAD,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],

  // Cycle Management
  [PerformanceFeature.CREATE_CYCLE]: [
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.HR_EMPLOYEE,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],
  [PerformanceFeature.MANAGE_CYCLES]: [
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],
  [PerformanceFeature.ACTIVATE_CYCLE]: [
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],
  [PerformanceFeature.CLOSE_CYCLE]: [
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],
  [PerformanceFeature.VIEW_CYCLES]: [
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.HR_EMPLOYEE,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],

  // Assignment Management
  [PerformanceFeature.CREATE_ASSIGNMENTS]: [
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.HR_EMPLOYEE,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],
  [PerformanceFeature.BULK_ASSIGN]: [
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.HR_EMPLOYEE,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],
  [PerformanceFeature.MANAGE_ASSIGNMENTS]: [
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],
  [PerformanceFeature.VIEW_ASSIGNMENTS]: [
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.HR_EMPLOYEE,
    PerformanceSystemRole.DEPARTMENT_HEAD,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],

  // Appraisal Management
  [PerformanceFeature.SUBMIT_APPRAISAL]: [
    PerformanceSystemRole.DEPARTMENT_HEAD,
    PerformanceSystemRole.DEPARTMENT_EMPLOYEE,
  ],
  [PerformanceFeature.ACKNOWLEDGE_APPRAISAL]: [
    PerformanceSystemRole.DEPARTMENT_EMPLOYEE,
    PerformanceSystemRole.DEPARTMENT_HEAD,
  ],
  [PerformanceFeature.VIEW_MY_APPRAISALS]: [
    PerformanceSystemRole.DEPARTMENT_EMPLOYEE,
    PerformanceSystemRole.DEPARTMENT_HEAD,
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.HR_EMPLOYEE,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],
  [PerformanceFeature.TRACK_APPRAISALS]: [
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.HR_EMPLOYEE,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],
  [PerformanceFeature.PUBLISH_APPRAISALS]: [
    PerformanceSystemRole.DEPARTMENT_HEAD,
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.HR_EMPLOYEE,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],

  // Dispute Management
  [PerformanceFeature.CREATE_DISPUTE]: [
    PerformanceSystemRole.DEPARTMENT_EMPLOYEE,
    PerformanceSystemRole.DEPARTMENT_HEAD,
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.HR_EMPLOYEE,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],
  [PerformanceFeature.RESOLVE_DISPUTE]: [
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],
  [PerformanceFeature.VIEW_DISPUTES]: [
    PerformanceSystemRole.DEPARTMENT_EMPLOYEE,
    PerformanceSystemRole.DEPARTMENT_HEAD,
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.HR_EMPLOYEE,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],

  // Reporting
  [PerformanceFeature.ARCHIVE_APPRAISALS]: [
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],
  [PerformanceFeature.VIEW_REPORTS]: [
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],
  [PerformanceFeature.VIEW_OUTCOME_REPORT]: [
    PerformanceSystemRole.DEPARTMENT_EMPLOYEE,
    PerformanceSystemRole.DEPARTMENT_HEAD,
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.HR_EMPLOYEE,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ],
};

/**
 * Check if a user role has permission for a feature
 */
export function canAccessFeature(
  userRole: string | null | undefined,
  feature: PerformanceFeature
): boolean {
  if (!userRole) return false;

  const allowedRoles = FEATURE_PERMISSIONS[feature] || [];
  return allowedRoles.includes(userRole as PerformanceSystemRole);
}

/**
 * Check if a user role has any of the specified features
 */
export function hasAnyFeature(
  userRole: string | null | undefined,
  features: PerformanceFeature[]
): boolean {
  if (!userRole) return false;
  return features.some((feature) => canAccessFeature(userRole, feature));
}

/**
 * Check if a user role has all of the specified features
 */
export function hasAllFeatures(
  userRole: string | null | undefined,
  features: PerformanceFeature[]
): boolean {
  if (!userRole) return false;
  return features.every((feature) => canAccessFeature(userRole, feature));
}

/**
 * Get available features for a role
 */
export function getAvailableFeatures(userRole: string | null | undefined): PerformanceFeature[] {
  if (!userRole) return [];

  return Object.entries(FEATURE_PERMISSIONS)
    .filter(([_, roles]) => roles.includes(userRole as PerformanceSystemRole))
    .map(([feature, _]) => feature as PerformanceFeature);
}

/**
 * Check if user is HR role
 */
export function isHRRole(userRole: string | null | undefined): boolean {
  if (!userRole) return false;
  return [
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.HR_EMPLOYEE,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ].includes(userRole as PerformanceSystemRole);
}

/**
 * Check if user is manager role
 */
export function isManagerRole(userRole: string | null | undefined): boolean {
  if (!userRole) return false;
  return [
    PerformanceSystemRole.DEPARTMENT_HEAD,
    PerformanceSystemRole.HR_MANAGER,
    PerformanceSystemRole.HR_ADMIN,
    PerformanceSystemRole.SYSTEM_ADMIN,
  ].includes(userRole as PerformanceSystemRole);
}

/**
 * Check if user is employee role
 */
export function isEmployeeRole(userRole: string | null | undefined): boolean {
  if (!userRole) return false;
  return [PerformanceSystemRole.DEPARTMENT_EMPLOYEE].includes(userRole as PerformanceSystemRole);
}

/**
 * Get user role hierarchy level (for UI display purposes)
 */
export function getRoleHierarchyLevel(userRole: string | null | undefined): number {
  const hierarchy: Record<PerformanceSystemRole, number> = {
    [PerformanceSystemRole.DEPARTMENT_EMPLOYEE]: 1,
    [PerformanceSystemRole.DEPARTMENT_HEAD]: 2,
    [PerformanceSystemRole.HR_EMPLOYEE]: 3,
    [PerformanceSystemRole.HR_MANAGER]: 4,
    [PerformanceSystemRole.HR_ADMIN]: 5,
    [PerformanceSystemRole.SYSTEM_ADMIN]: 6,
  };

  return hierarchy[userRole as PerformanceSystemRole] || 0;
}

/**
 * Get human-readable role name
 */
export function getRoleDisplayName(userRole: string | null | undefined): string {
  const displayNames: Record<PerformanceSystemRole, string> = {
    [PerformanceSystemRole.DEPARTMENT_EMPLOYEE]: 'Employee',
    [PerformanceSystemRole.DEPARTMENT_HEAD]: 'Manager',
    [PerformanceSystemRole.HR_EMPLOYEE]: 'HR Employee',
    [PerformanceSystemRole.HR_MANAGER]: 'HR Manager',
    [PerformanceSystemRole.HR_ADMIN]: 'HR Admin',
    [PerformanceSystemRole.SYSTEM_ADMIN]: 'System Admin',
  };

  return displayNames[userRole as PerformanceSystemRole] || 'Unknown';
}
