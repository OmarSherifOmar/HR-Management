/**
 * Performance Management Module Main Page
 * Handles user authentication and renders the performance management dashboard
 * with role-based access control
 */

'use client';

import React, { useEffect, useState } from 'react';
import { PerformanceManagement } from '@/app/components/Performance';

interface User {
  id: string;
  employeeId?: string;
  role: string | null;
}

export default function PerformanceManagementPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
        const response = await fetch(`${URL}/api/auth/me`, {
          credentials: 'include',
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('[PerformanceManagementPage] Full user data from /auth/me:', userData);
          console.log('[PerformanceManagementPage] userData keys:', Object.keys(userData));
          
          // Try different field names
          const employeeIdValue = userData.employeeId || userData.id || userData._id || userData.userId;
          console.log('[PerformanceManagementPage] Extracted employeeId:', employeeIdValue);
          
          setUser({
            id: employeeIdValue,
            employeeId: employeeIdValue,
            role: userData.role,
          });
        } else {
          setError('Failed to authenticate');
          setUser(null);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Unable to connect to server');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading Performance Management...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
        <div className="max-w-md w-full rounded-lg border border-red-500/30 bg-red-500/10 p-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-red-400">Authentication Required</h1>
          <p className="mb-4 text-sm text-red-300">{error || 'Please log in to access Performance Management.'}</p>
          <a
            href="/login"
            className="inline-block rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Debug: Show if employeeId is passed */}
        <div className="mb-4 text-xs text-gray-500">
          Debug: user.id={user?.id}, user.employeeId={user?.employeeId}, user.role={user?.role}
        </div>
        <PerformanceManagement userRole={user.role} employeeId={user.employeeId || user.id} />
      </div>
    </div>
  );
}

