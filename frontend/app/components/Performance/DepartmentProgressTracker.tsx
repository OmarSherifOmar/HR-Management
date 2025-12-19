'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock, Loader } from 'lucide-react';

interface ProgressData {
  departmentId: string;
  departmentInfo: {
    name: string;
  };
  summary: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    completionPercentage: number;
  };
  statusBreakdown: {
    NOT_STARTED: number;
    IN_PROGRESS: number;
    SUBMITTED: number;
    PUBLISHED: number;
    ACKNOWLEDGED: number;
  };
  assignmentsByStatus: {
    [key: string]: Array<{
      assignmentId: string;
      employeeId: string;
      employeeName: string;
      managerId: string;
      managerName: string;
      position: string;
      dueDate?: string;
      assignedAt: string;
      submittedAt?: string;
      publishedAt?: string;
    }>;
  };
}

interface DepartmentProgressTrackerProps {
  userRole: string | null;
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

export default function DepartmentProgressTracker({ userRole, onNotify }: DepartmentProgressTrackerProps) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedStatus, setExpandedStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/org/departments', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch departments');
      const data = await response.json();
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      onNotify?.('Failed to fetch departments', 'error');
    }
  };

  const handleTrackProgress = async () => {
    if (!selectedDepartmentId) {
      onNotify?.('Please select a department', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/performance/assignments/department/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          departmentId: selectedDepartmentId,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch progress data');
      const data = await response.json();
      setProgressData(data);
      onNotify?.('Progress data loaded successfully', 'success');
    } catch (error) {
      console.error('Error tracking progress:', error);
      onNotify?.('Failed to load progress data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'bg-gray-500/20 text-gray-300';
      case 'IN_PROGRESS':
        return 'bg-blue-500/20 text-blue-300';
      case 'SUBMITTED':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'PUBLISHED':
        return 'bg-green-500/20 text-green-300';
      case 'ACKNOWLEDGED':
        return 'bg-purple-500/20 text-purple-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return <AlertCircle className="h-4 w-4" />;
      case 'IN_PROGRESS':
        return <Loader className="h-4 w-4 animate-spin" />;
      case 'PUBLISHED':
        return <CheckCircle className="h-4 w-4" />;
      case 'ACKNOWLEDGED':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };


  const chartData = progressData
    ? [
        {
          name: 'Summary',
          Completed: progressData.summary.completed,
          'In Progress': progressData.summary.inProgress,
          Pending: progressData.summary.pending,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">Department Appraisal Progress</h2>
        <p className="mt-1 text-sm text-gray-400">Track appraisal completion status by department and cycle</p>
      </div>

      {/* Selection Form */}
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Department Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Select Department</label>
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="mt-2 w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">Choose a department...</option>
              {departments.map((dept) => (
                <option key={dept._id || dept.id} value={dept._id || dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Track Button */}
          <div className="flex items-end">
            <button
              onClick={handleTrackProgress}
              disabled={loading || !selectedDepartmentId}
              className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Track Progress'}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Data Display */}
      {progressData && (
        <div className="space-y-6">
          {/* Department Info */}
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            <div>
              <p className="text-xs text-gray-400">Department</p>
              <p className="text-lg font-semibold text-white">{progressData.departmentInfo.name}</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-5">
            <div className="rounded-lg bg-gray-800/50 p-4 border border-gray-700">
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-2xl font-bold text-white">{progressData.summary.total}</p>
            </div>
            <div className="rounded-lg bg-green-900/30 p-4 border border-green-700/50">
              <p className="text-xs text-green-300">Completed</p>
              <p className="text-2xl font-bold text-green-400">{progressData.summary.completed}</p>
              <p className="text-xs text-green-300/70">{progressData.summary.completionPercentage}%</p>
            </div>
            <div className="rounded-lg bg-yellow-900/30 p-4 border border-yellow-700/50">
              <p className="text-xs text-yellow-300">In Progress</p>
              <p className="text-2xl font-bold text-yellow-400">{progressData.summary.inProgress}</p>
            </div>
            <div className="rounded-lg bg-red-900/30 p-4 border border-red-700/50">
              <p className="text-xs text-red-300">Pending</p>
              <p className="text-2xl font-bold text-red-400">{progressData.summary.pending}</p>
            </div>
            <div className="rounded-lg bg-blue-900/30 p-4 border border-blue-700/50">
              <p className="text-xs text-blue-300">Completion</p>
              <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${progressData.summary.completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Status Distribution</h3>
            <div className="space-y-4">
              {/* Pending Bar */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Pending</span>
                  <span className="text-sm font-medium text-red-400">{progressData.summary.pending}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-red-500 h-3 transition-all"
                    style={{
                      width: `${progressData.summary.total > 0 ? (progressData.summary.pending / progressData.summary.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* In Progress Bar */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">In Progress</span>
                  <span className="text-sm font-medium text-yellow-400">{progressData.summary.inProgress}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-yellow-500 h-3 transition-all"
                    style={{
                      width: `${progressData.summary.total > 0 ? (progressData.summary.inProgress / progressData.summary.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Completed Bar */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Completed</span>
                  <span className="text-sm font-medium text-green-400">{progressData.summary.completed}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-green-500 h-3 transition-all"
                    style={{
                      width: `${progressData.summary.total > 0 ? (progressData.summary.completed / progressData.summary.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Status Breakdown</h3>
            <div className="grid gap-3 md:grid-cols-5">
              {Object.entries(progressData.statusBreakdown).map(([status, count]: [string, any]) => (
                <div key={status} className={`rounded-lg p-3 ${getStatusColor(status)}`}>
                  <p className="text-xs font-medium">{status.replace(/_/g, ' ')}</p>
                  <p className="text-2xl font-bold mt-1">{count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Assignments by Status */}
          <div className="space-y-3">
            {Object.entries(progressData.assignmentsByStatus).map(([status, assignments]: [string, any]) => (
              <div key={status} className="rounded-lg border border-gray-700 bg-gray-800/50 overflow-hidden">
                <button
                  onClick={() => setExpandedStatus(expandedStatus === status ? null : status)}
                  className={`w-full flex items-center justify-between p-4 hover:bg-gray-700/50 transition ${getStatusColor(status)}`}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span className="font-medium">{status.replace(/_/g, ' ')}</span>
                    <span className="ml-2 text-sm">({assignments.length})</span>
                  </div>
                  {expandedStatus === status ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {expandedStatus === status && assignments.length > 0 && (
                  <div className="border-t border-gray-700 p-4 space-y-3">
                    {assignments.map((assignment: any, idx: number) => (
                      <div key={assignment.assignmentId} className="flex justify-between items-start p-3 bg-gray-700/30 rounded">
                        <div className="flex-1">
                          <p className="text-white font-medium">{assignment.employeeName}</p>
                          <p className="text-xs text-gray-400">Position: {assignment.position}</p>
                          <p className="text-xs text-gray-400">Manager: {assignment.managerName}</p>
                          {assignment.dueDate && (
                            <p className="text-xs text-gray-400">
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {assignment.publishedAt && (
                            <p className="text-xs text-green-300">
                              Published: {new Date(assignment.publishedAt).toLocaleDateString()}
                            </p>
                          )}
                          {assignment.submittedAt && !assignment.publishedAt && (
                            <p className="text-xs text-yellow-300">
                              Submitted: {new Date(assignment.submittedAt).toLocaleDateString()}
                            </p>
                          )}
                          {!assignment.submittedAt && (
                            <p className="text-xs text-gray-400">Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {expandedStatus === status && assignments.length === 0 && (
                  <div className="p-4 text-center text-gray-400">No assignments in this status</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!progressData && !loading && (
        <div className="text-center py-12 text-gray-400">
          <p>Select a department to view progress</p>
        </div>
      )}
    </div>
  );
}
