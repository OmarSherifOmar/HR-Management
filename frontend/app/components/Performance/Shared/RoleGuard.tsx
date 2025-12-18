'use client';

import React from 'react';

interface RoleGuardProps {
  allowedRoles: string[];
  userRole: string | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, userRole, children, fallback }: RoleGuardProps) {
  const isAuthorized = userRole && allowedRoles.some((role) => userRole.toLowerCase().includes(role.toLowerCase()));

  if (!isAuthorized) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
        <h3 className="mb-2 text-lg font-semibold text-red-400">Access Denied</h3>
        <p className="text-sm text-red-300">Your role does not have permission to access this feature.</p>
      </div>
    );
  }

  return <>{children}</>;
}
