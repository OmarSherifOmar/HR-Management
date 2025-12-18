'use client';

import DashboardLayout from '@/app/components/DashboardLayout';
import { useAuth } from '@/app/context/AuthContext';
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, User, Calendar, FileText } from 'lucide-react';

type PendingClearance = {
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
  effectiveDate: Date;
  department: 'IT' | 'Finance' | 'Facilities' | 'HR' | 'LineManager';
  status: 'pending' | 'cleared' | 'issues';
  assignedAssets?: string[];
  outstandingItems?: string[];
};

export default function DepartmentClearancePage() {
  const { user } = useAuth();
  const [pendingClearances, setPendingClearances] = useState<PendingClearance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClearance, setSelectedClearance] = useState<PendingClearance | null>(null);
  const [clearanceNotes, setClearanceNotes] = useState('');
  const [hasIssues, setHasIssues] = useState(false);

  useEffect(() => {
    fetchPendingClearances();
  }, [user]);

  const fetchPendingClearances = async () => {
    try {
      const response = await fetch('http://localhost:3000/offboarding/clearance/my-department', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPendingClearances(data);
      }
    } catch (error) {
      console.error('Error fetching clearances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearanceSubmit = async () => {
    if (!selectedClearance) return;

    try {
      const response = await fetch(
        `http://localhost:3000/offboarding/clearance/${selectedClearance._id}/sign-off`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            status: hasIssues ? 'issues' : 'cleared',
            notes: clearanceNotes,
          }),
        }
      );

      if (response.ok) {
        setSelectedClearance(null);
        setClearanceNotes('');
        setHasIssues(false);
        fetchPendingClearances();
      }
    } catch (error) {
      console.error('Error submitting clearance:', error);
    }
  };

  const getDepartmentName = () => {
    if (user?.role === 'department head') return 'Line Manager';
    if (user?.role === 'IT') return 'IT Department';
    if (user?.role === 'Finance') return 'Finance Department';
    if (user?.role === 'Facilities') return 'Facilities Department';
    return 'Department';
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-600', text: 'Pending Review' },
      cleared: { bg: 'bg-green-600', text: 'Cleared' },
      issues: { bg: 'bg-red-600', text: 'Has Issues' },
    };
    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`${badge.bg} text-white px-3 py-1 rounded-full text-xs font-medium`}>
        {badge.text}
      </span>
    );
  };

  const isDepartmentAuthorized = () => {
    return ['department head', 'IT', 'Finance', 'Facilities'].includes(user?.role || '');
  };

  if (!isDepartmentAuthorized()) {
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
      title="Department Clearance"
      description={`Pending clearances for ${getDepartmentName()}`}
    >
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Pending Clearances</p>
              <p className="text-3xl font-bold text-white">
                {pendingClearances.filter(c => c.status === 'pending').length}
              </p>
            </div>
            <FileText className="text-yellow-500" size={32} />
          </div>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Cleared</p>
              <p className="text-3xl font-bold text-white">
                {pendingClearances.filter(c => c.status === 'cleared').length}
              </p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">With Issues</p>
              <p className="text-3xl font-bold text-white">
                {pendingClearances.filter(c => c.status === 'issues').length}
              </p>
            </div>
            <XCircle className="text-red-500" size={32} />
          </div>
        </div>
      </div>

      {/* Clearance List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Clearance Requests</h3>

        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : pendingClearances.length === 0 ? (
          <div className="bg-[#2a2a2a] rounded-lg p-8 border border-gray-700 text-center">
            <CheckCircle className="mx-auto text-gray-500 mb-3" size={48} />
            <p className="text-gray-400">No pending clearance requests</p>
          </div>
        ) : (
          pendingClearances.map((clearance) => (
            <div
              key={clearance._id}
              className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-white font-semibold text-lg mb-1 flex items-center gap-2">
                    <User size={20} />
                    {clearance.employeeId.firstName} {clearance.employeeId.lastName}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {clearance.employeeId.employeeNumber}
                    {clearance.employeeId.primaryDepartmentId &&
                      ` • ${clearance.employeeId.primaryDepartmentId.name}`
                    }
                  </p>
                </div>
                {getStatusBadge(clearance.status)}
              </div>

              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                  <Calendar size={16} />
                  Last Working Day
                </p>
                <p className="text-white">
                  {new Date(clearance.effectiveDate).toLocaleDateString()}
                </p>
              </div>

              {/* Assigned Assets */}
              {clearance.assignedAssets && clearance.assignedAssets.length > 0 && (
                <div className="mb-4 p-4 bg-[#1a1a1a] rounded-lg border border-gray-700">
                  <p className="text-gray-400 text-sm mb-2 font-medium">Assigned Assets</p>
                  <ul className="list-disc list-inside space-y-1">
                    {clearance.assignedAssets.map((asset, index) => (
                      <li key={index} className="text-gray-300 text-sm">{asset}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Outstanding Items */}
              {clearance.outstandingItems && clearance.outstandingItems.length > 0 && (
                <div className="mb-4 p-4 bg-red-900/20 rounded-lg border border-red-700">
                  <p className="text-red-400 text-sm mb-2 font-medium">Outstanding Items</p>
                  <ul className="list-disc list-inside space-y-1">
                    {clearance.outstandingItems.map((item, index) => (
                      <li key={index} className="text-red-300 text-sm">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              {clearance.status === 'pending' && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setSelectedClearance(clearance)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <CheckCircle size={16} />
                    Process Clearance
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Clearance Modal */}
      {selectedClearance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-lg p-6 max-w-2xl w-full border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">
              Process Clearance - {selectedClearance.employeeId.firstName} {selectedClearance.employeeId.lastName}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Employee Number</p>
                <p className="text-white">{selectedClearance.employeeId.employeeNumber}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Last Working Day</p>
                <p className="text-white">
                  {new Date(selectedClearance.effectiveDate).toLocaleDateString()}
                </p>
              </div>

              {/* Assigned Assets */}
              {selectedClearance.assignedAssets && selectedClearance.assignedAssets.length > 0 && (
                <div className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-700">
                  <p className="text-gray-400 text-sm mb-2 font-medium">Verify Asset Returns</p>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedClearance.assignedAssets.map((asset, index) => (
                      <li key={index} className="text-gray-300 text-sm">{asset}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Issue Checkbox */}
              <div className="flex items-center gap-3 p-4 bg-[#1a1a1a] rounded-lg border border-gray-700">
                <input
                  type="checkbox"
                  id="hasIssues"
                  checked={hasIssues}
                  onChange={(e) => setHasIssues(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 bg-[#2a2a2a] text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="hasIssues" className="text-white font-medium">
                  Report Issues (Missing items, damages, etc.)
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes {hasIssues && <span className="text-red-400">*</span>}
                </label>
                <textarea
                  value={clearanceNotes}
                  onChange={(e) => setClearanceNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows={4}
                  placeholder={hasIssues ? "Describe the issues..." : "Add any comments or notes..."}
                  required={hasIssues}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClearanceSubmit}
                disabled={hasIssues && !clearanceNotes.trim()}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {hasIssues ? 'Submit with Issues' : 'Approve Clearance'}
              </button>
              <button
                onClick={() => {
                  setSelectedClearance(null);
                  setClearanceNotes('');
                  setHasIssues(false);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

