'use client';

import DashboardLayout from '@/app/components/DashboardLayout';
import { useAuth } from '@/app/context/AuthContext';
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock, User, Building, DollarSign, Wrench } from 'lucide-react';

type ClearanceItem = {
  department: 'IT' | 'Finance' | 'Facilities' | 'HR' | 'LineManager';
  status: 'pending' | 'cleared' | 'issues';
  clearedBy?: string;
  clearedDate?: Date;
  notes?: string;
};

type OffboardingClearance = {
  _id: string;
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    primaryDepartmentId?: {
      name: string;
    };
  };
  resignationId?: string;
  terminationId?: string;
  effectiveDate: Date;
  clearanceItems: ClearanceItem[];
  overallStatus: 'in_progress' | 'completed' | 'blocked';
  createdAt: Date;
};

export default function ClearanceTrackingPage() {
  const { user } = useAuth();
  const [clearances, setClearances] = useState<OffboardingClearance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClearance, setSelectedClearance] = useState<OffboardingClearance | null>(null);

  useEffect(() => {
    if (user?.role === 'HR Manager' || user?.role === 'HR Admin') {
      fetchClearances();
    }
  }, [user]);

  const fetchClearances = async () => {
    try {
      const response = await fetch('http://localhost:3000/offboarding/clearance', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setClearances(data);
      }
    } catch (error) {
      console.error('Error fetching clearances:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentIcon = (department: string) => {
    const icons = {
      IT: <Wrench className="text-blue-500" size={20} />,
      Finance: <DollarSign className="text-green-500" size={20} />,
      Facilities: <Building className="text-purple-500" size={20} />,
      HR: <User className="text-orange-500" size={20} />,
      LineManager: <User className="text-pink-500" size={20} />,
    };
    return icons[department as keyof typeof icons] || <User size={20} />;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-600', text: 'Pending', icon: <Clock size={14} /> },
      cleared: { bg: 'bg-green-600', text: 'Cleared', icon: <CheckCircle size={14} /> },
      issues: { bg: 'bg-red-600', text: 'Issues', icon: <XCircle size={14} /> },
    };
    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`${badge.bg} text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  const getOverallStatusBadge = (status: string) => {
    const badges = {
      in_progress: { bg: 'bg-blue-600', text: 'In Progress', icon: <Clock size={14} /> },
      completed: { bg: 'bg-green-600', text: 'Completed', icon: <CheckCircle size={14} /> },
      blocked: { bg: 'bg-red-600', text: 'Blocked', icon: <XCircle size={14} /> },
    };
    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`${badge.bg} text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  const calculateProgress = (clearanceItems: ClearanceItem[]) => {
    const total = clearanceItems.length;
    const cleared = clearanceItems.filter(item => item.status === 'cleared').length;
    return Math.round((cleared / total) * 100);
  };

  if (user?.role !== 'HR Manager' && user?.role !== 'HR Admin') {
    return (
      <DashboardLayout title="Access Denied">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
          <p className="text-gray-400">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Clearance Tracking"
      description="Monitor multi-department exit clearances"
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Clearances</p>
              <p className="text-3xl font-bold text-white">{clearances.length}</p>
            </div>
            <Clock className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">In Progress</p>
              <p className="text-3xl font-bold text-white">
                {clearances.filter(c => c.overallStatus === 'in_progress').length}
              </p>
            </div>
            <Clock className="text-yellow-500" size={32} />
          </div>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Completed</p>
              <p className="text-3xl font-bold text-white">
                {clearances.filter(c => c.overallStatus === 'completed').length}
              </p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>
      </div>

      {/* Clearance List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Active Clearances</h3>

        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : clearances.length === 0 ? (
          <div className="bg-[#2a2a2a] rounded-lg p-8 border border-gray-700 text-center">
            <CheckCircle className="mx-auto text-gray-500 mb-3" size={48} />
            <p className="text-gray-400">No active clearance processes</p>
          </div>
        ) : (
          clearances.map((clearance) => (
            <div
              key={clearance._id}
              className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-white font-semibold text-lg mb-1">
                    {clearance.employeeId.firstName} {clearance.employeeId.lastName}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {clearance.employeeId.employeeNumber}
                    {clearance.employeeId.primaryDepartmentId &&
                      ` • ${clearance.employeeId.primaryDepartmentId.name}`
                    }
                  </p>
                </div>
                {getOverallStatusBadge(clearance.overallStatus)}
              </div>

              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-1">Last Working Day</p>
                <p className="text-white">
                  {new Date(clearance.effectiveDate).toLocaleDateString()}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-sm">Clearance Progress</p>
                  <p className="text-white text-sm font-medium">
                    {calculateProgress(clearance.clearanceItems)}%
                  </p>
                </div>
                <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${calculateProgress(clearance.clearanceItems)}%` }}
                  />
                </div>
              </div>

              {/* Department Clearances */}
              <div className="space-y-3">
                <p className="text-gray-400 text-sm font-medium">Department Sign-offs</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {clearance.clearanceItems.map((item, index) => (
                    <div
                      key={index}
                      className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getDepartmentIcon(item.department)}
                          <span className="text-white font-medium">{item.department}</span>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>

                      {item.status === 'cleared' && item.clearedBy && (
                        <div className="mt-2">
                          <p className="text-gray-400 text-xs">
                            Cleared by {item.clearedBy}
                          </p>
                          <p className="text-gray-500 text-xs">
                            on {new Date(item.clearedDate!).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {item.notes && (
                        <div className="mt-2">
                          <p className="text-gray-400 text-xs mb-1">Notes:</p>
                          <p className="text-gray-300 text-xs">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setSelectedClearance(clearance)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  View Details
                </button>
                {clearance.overallStatus === 'completed' && (
                  <button
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Trigger Final Settlement
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal (simplified - you can expand this) */}
      {selectedClearance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-lg p-6 max-w-2xl w-full border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">
              Clearance Details - {selectedClearance.employeeId.firstName} {selectedClearance.employeeId.lastName}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Employee Number</p>
                <p className="text-white">{selectedClearance.employeeId.employeeNumber}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Overall Status</p>
                {getOverallStatusBadge(selectedClearance.overallStatus)}
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Progress</p>
                <p className="text-white text-lg font-semibold">
                  {calculateProgress(selectedClearance.clearanceItems)}% Complete
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedClearance(null)}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

