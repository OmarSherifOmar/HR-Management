'use client';

import React, { ReactNode } from 'react';

import { useCanAccess } from '@/app/hooks/useRole';

interface RoleBasedAccessProps {
  children: ReactNode;
  fallback?: ReactNode;
  requiredAccess: () => boolean;
}

export function RoleBasedAccess({
  children,
  fallback,
  requiredAccess,
}: RoleBasedAccessProps) {
  const hasAccess = requiredAccess();

  if (!hasAccess) {
    return fallback ? (
      <>
        {fallback}
      </>
    ) : (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium">Access Denied</p>
        <p className="text-red-600 text-sm">
          You don't have permission to view this content.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

interface PermissionCheckProps {
  children: ReactNode;
  requiredAccess: () => boolean;
}

export function PermissionCheck({ children, requiredAccess }: PermissionCheckProps) {
  if (!requiredAccess()) {
    return null;
  }
  return <>{children}</>;
}
