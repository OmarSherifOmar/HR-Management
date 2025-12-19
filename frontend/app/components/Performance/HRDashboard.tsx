'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, AlertCircle } from 'lucide-react';
import ProgressTracker from './Shared/ProgressTracker';
import StatusBadge from './Shared/StatusBadge';

interface CycleProgress {
  cycleId: string;
  cycleName: string;
  status: string;
  totalAssignments: number;
  completedAppraisals: number;
  pendingAppraisals: number;
  departments: string[];
}

interface HRDashboardProps {
  userRole: string | null;
  employeeId: string;
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

export default function HRDashboard({ userRole, employeeId, onNotify }: HRDashboardProps) {
  const [cycles, setCycles] = useState<CycleProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDept, setSelectedDept] = useState('all');

  const isHRRole = ['HR Manager', 'HR Admin', 'System Admin'].includes(userRole || '');

  useEffect(() => {
    if (isHRRole) {
      fetchCyclesProgress();
    }
  }, []);

  const fetchCyclesProgress = async () => {
    setLoading(true);
    try {
      // Try to fetch from progress endpoint, fall back to regular cycles endpoint
      let response = await fetch('http://localhost:3000/api/performance/cycles/progress', {
        credentials: 'include',
      }).catch(() => null);

      // If progress endpoint doesn't exist, fetch regular cycles and compute progress
      if (!response || !response.ok) {
        console.log('Progress endpoint not available, fetching regular cycles');
        response = await fetch('http://localhost:3000/api/performance/cycles', {
          credentials: 'include',
        });
      }

      if (!response || !response.ok) {
        throw new Error('Failed to fetch cycle progress');
      }

      const data = await response.json();
      
      // Map cycles to progress format if needed
      const progressData = Array.isArray(data) 
        ? data.map((cycle: any) => ({
            cycleId: cycle._id || cycle.id,
            cycleName: cycle.name,
            status: cycle.status,
            totalAssignments: 0,
            completedAppraisals: 0,
            pendingAppraisals: 0,
            departments: [],
          }))
        : [];
      
      setCycles(progressData);
    } catch (error) {
      console.warn('Error loading dashboard data:', error);
      // Don't show error to user, just log it
      setCycles([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isHRRole) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
        <h3 className="mb-2 text-lg font-semibold text-red-400">Access Denied</h3>
        <p className="text-sm text-red-300">This dashboard is only available to HR roles.</p>
      </div>
    );
  }

  const totalCycles = cycles.length;
  const totalAssignments = cycles.reduce((sum, c) => sum + c.totalAssignments, 0);
  const totalCompleted = cycles.reduce((sum, c) => sum + c.completedAppraisals, 0);
  const overallPercentage = totalAssignments > 0 ? Math.round((totalCompleted / totalAssignments) * 100) : 0;

  const filteredCycles = selectedDept === 'all' ? cycles : cycles.filter((c) => c.departments?.includes(selectedDept));

  const departments = Array.from(new Set(cycles.flatMap((c) => c.departments || [])));

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Cycles</p>
              <p className="mt-2 text-3xl font-bold text-white">{totalCycles}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Assignments</p>
              <p className="mt-2 text-3xl font-bold text-white">{totalAssignments}</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Completed</p>
              <p className="mt-2 text-3xl font-bold text-white">{totalCompleted}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Completion Rate</p>
              <p className="mt-2 text-3xl font-bold text-white">{overallPercentage}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-cyan-500" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Cycle Progress</h3>
          {departments.length > 0 && (
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded bg-gray-700" />
            ))}
          </div>
        ) : filteredCycles.length > 0 ? (
          <div className="space-y-6">
            {filteredCycles.map((cycle) => {
              const percentage =
                cycle.totalAssignments > 0
                  ? Math.round((cycle.completedAppraisals / cycle.totalAssignments) * 100)
                  : 0;

              return (
                <div key={cycle.cycleId} className="space-y-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white">{cycle.cycleName}</h4>
                      <p className="text-xs text-gray-400">{cycle.departments?.join(', ') || 'All Departments'}</p>
                    </div>
                    <StatusBadge status={cycle.status} />
                  </div>

                  <ProgressTracker
                    current={cycle.completedAppraisals}
                    total={cycle.totalAssignments}
                    percentage={percentage}
                    label={`Appraisals: ${cycle.completedAppraisals}/${cycle.totalAssignments}`}
                  />

                  <div className="grid grid-cols-3 gap-4 pt-4 text-sm">
                    <div className="rounded bg-gray-700/50 p-3">
                      <p className="text-gray-400">Completed</p>
                      <p className="mt-1 text-xl font-bold text-green-400">{cycle.completedAppraisals}</p>
                    </div>
                    <div className="rounded bg-gray-700/50 p-3">
                      <p className="text-gray-400">Pending</p>
                      <p className="mt-1 text-xl font-bold text-yellow-400">{cycle.pendingAppraisals}</p>
                    </div>
                    <div className="rounded bg-gray-700/50 p-3">
                      <p className="text-gray-400">Progress</p>
                      <p className="mt-1 text-xl font-bold text-blue-400">{percentage}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3 rounded border border-dashed border-gray-600 py-12">
            <AlertCircle className="h-8 w-8 text-gray-500" />
            <p className="text-sm text-gray-400">No cycles found</p>
          </div>
        )}
      </div>

      {cycles.some((c) => c.status === 'ACTIVE') && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-400 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-yellow-400">Pending Reminders</h4>
              <p className="mt-1 text-sm text-yellow-300">
                {cycles.reduce((sum, c) => sum + c.pendingAppraisals, 0)} appraisals are pending. Send reminders to managers
                to ensure timely completion.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
