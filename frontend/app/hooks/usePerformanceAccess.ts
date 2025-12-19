/**
 * usePerformanceAccess Hook
 * Provides role-based access control for Performance Management features
 */

'use client';

import React, { useContext } from 'react';
import {
  canAccessFeature,
  hasAnyFeature,
  hasAllFeatures,
  getAvailableFeatures,
  isHRRole,
  isManagerRole,
  isEmployeeRole,
  getRoleHierarchyLevel,
  getRoleDisplayName,
  PerformanceFeature,
} from '@/app/utils/performanceAccess';

// Create a context for user role (you'll need to provide this from your auth context)
export interface UsePerformanceAccessOptions {
  userRole: string | null | undefined;
}

export interface UsePerformanceAccessResult {
  // Feature checks
  can: (feature: PerformanceFeature) => boolean;
  canAny: (features: PerformanceFeature[]) => boolean;
  canAll: (features: PerformanceFeature[]) => boolean;

  // Role checks
  isHR: boolean;
  isManager: boolean;
  isEmployee: boolean;

  // Feature lists
  availableFeatures: PerformanceFeature[];

  // Role info
  roleHierarchyLevel: number;
  roleDisplayName: string;
}

/**
 * Hook to check performance management access
 * Usage: const access = usePerformanceAccess({ userRole: user.role });
 */
export function usePerformanceAccess(options: UsePerformanceAccessOptions): UsePerformanceAccessResult {
  const { userRole } = options;

  return {
    can: (feature: PerformanceFeature) => canAccessFeature(userRole, feature),
    canAny: (features: PerformanceFeature[]) => hasAnyFeature(userRole, features),
    canAll: (features: PerformanceFeature[]) => hasAllFeatures(userRole, features),
    isHR: isHRRole(userRole),
    isManager: isManagerRole(userRole),
    isEmployee: isEmployeeRole(userRole),
    availableFeatures: getAvailableFeatures(userRole),
    roleHierarchyLevel: getRoleHierarchyLevel(userRole),
    roleDisplayName: getRoleDisplayName(userRole),
  };
}

/**
 * Component wrapper for access denied
 */
export interface AccessDeniedProps {
  feature?: PerformanceFeature;
  requiredRoles?: string;
}

export function AccessDenied({ feature, requiredRoles }: AccessDeniedProps): React.ReactElement {
  return React.createElement(
    'div',
    { className: 'rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center' },
    React.createElement('h3', { className: 'mb-2 text-lg font-semibold text-red-400' }, 'Access Denied'),
    React.createElement(
      'p',
      { className: 'text-sm text-red-300' },
      feature ? `You don't have permission to access this feature.` : `You don't have permission to view this content.`
    ),
    requiredRoles && React.createElement('p', { className: 'mt-2 text-xs text-red-300' }, `Required: ${requiredRoles}`)
  );
}

/**
 * Component wrapper for conditional rendering based on access
 */
export interface AccessGuardProps {
  feature: PerformanceFeature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  userRole: string | null | undefined;
}

export function AccessGuard({ feature, children, fallback, userRole }: AccessGuardProps): React.ReactElement {
  if (!canAccessFeature(userRole, feature)) {
    return fallback ? (React.isValidElement(fallback) ? fallback : React.createElement(React.Fragment)) : React.createElement(AccessDenied, { feature });
  }

  return React.createElement(React.Fragment, null, children);
}

// Re-export PerformanceFeature
export { PerformanceFeature };

