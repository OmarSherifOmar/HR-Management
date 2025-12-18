'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import { authenticatedFetch, useAuth } from '../../../context/AuthContext';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  AlertCircle,
  DollarSign,
  RefreshCw,
  Eye,
  FileText,
  Lock,
  Unlock,
} from 'lucide-react';

interface PayrollRun {
  _id: string;
  runId: string;
  payrollPeriod: string;
  status: string;
  entity: string;
  employees: number;
  exceptions: number;
  totalnetpay: number;
  payrollSpecialistId?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    employeeNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ManagerApprovalPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userRoles = Array.isArray(user?.roles)
    ? user?.roles
    : user?.role
    ? [user.role]
    : [];
  const hasRole = (...allowed: string[]) =>
    userRoles.some((r) => allowed.map((a) => a.toLowerCase()).includes(String(r || '').toLowerCase()));

  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [approvedRuns, setApprovedRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvedError, setApprovedError] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [lockReason, setLockReason] = useState('');
  const [unlockReason, setUnlockReason] = useState('');

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch('http://localhost:3000/payroll-execution/manager/pending', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending approvals');
      }

      const data = await response.json();
      setPayrollRuns(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedRuns = async () => {
    try {
      setApprovedLoading(true);
      setApprovedError(null);
      const response = await authenticatedFetch('http://localhost:3000/payroll-execution/approved-locked', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch approved runs');
      }

      const data = await response.json();
      setApprovedRuns(data);
    } catch (err: any) {
      setApprovedError(err.message || 'An error occurred while fetching approved runs');
    } finally {
      setApprovedLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
    fetchApprovedRuns();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status?: string) => {
    const s = status?.toLowerCase() || '';
    switch (s) {
      case 'draft':
        return 'bg-gray-600 text-white';
      case 'under review':
        return 'bg-blue-600 text-white';
      case 'pending finance approval':
        return 'bg-yellow-600 text-white';
      case 'approved':
        return 'bg-green-600 text-white';
      case 'rejected':
        return 'bg-red-600 text-white';
      case 'locked':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const handleApproveRun = async () => {
    if (!selectedRun) return;

    try {
      setActionLoading(true);
      setActionError(null);

      const response = await authenticatedFetch('http://localhost:3000/payroll-execution/manager/approve', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payrollRunId: selectedRun._id,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to approve payroll run';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      setShowApproveModal(false);
      setSelectedRun(null);
      await fetchPendingApprovals();
      await fetchApprovedRuns();
    } catch (err: any) {
      console.error('Approve payroll error:', err);
      setActionError(err.message || 'An error occurred while approving the payroll run');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRun = async () => {
    if (!selectedRun || !rejectionReason.trim()) return;

    try {
      setActionLoading(true);
      setActionError(null);

      const response = await authenticatedFetch('http://localhost:3000/payroll-execution/manager/reject', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payrollRunId: selectedRun._id,
          rejectionReason: rejectionReason.trim(),
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to reject payroll run';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      setShowRejectModal(false);
      setSelectedRun(null);
      setRejectionReason('');
      await fetchPendingApprovals();
      await fetchApprovedRuns();
    } catch (err: any) {
      console.error('Reject payroll error:', err);
      setActionError(err.message || 'An error occurred while rejecting the payroll run');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLockPayroll = async () => {
    if (!selectedRun || !lockReason.trim()) return;

    try {
      setActionLoading(true);
      setActionError(null);

      const response = await authenticatedFetch('http://localhost:3000/payroll-execution/lock', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payrollRunId: selectedRun._id,
          lockReason: lockReason.trim(),
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to lock payroll run';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      setShowLockModal(false);
      setSelectedRun(null);
      setLockReason('');
      await fetchPendingApprovals();
      await fetchApprovedRuns();
    } catch (err: any) {
      console.error('Lock payroll error:', err);
      setActionError(err.message || 'An error occurred while locking the payroll run');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlockPayroll = async () => {
    if (!selectedRun || !unlockReason.trim() || unlockReason.trim().length < 20) return;

    try {
      setActionLoading(true);
      setActionError(null);

      const response = await authenticatedFetch('http://localhost:3000/payroll-execution/unlock', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payrollRunId: selectedRun._id,
          unlockReason: unlockReason.trim(),
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to unlock payroll run';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      setShowUnlockModal(false);
      setSelectedRun(null);
      setUnlockReason('');
      await fetchPendingApprovals();
      await fetchApprovedRuns();
    } catch (err: any) {
      console.error('Unlock payroll error:', err);
      setActionError(err.message || 'An error occurred while unlocking the payroll run');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (runId: string) => {
    router.push(`/payroll/execution/review/${runId}`);
  };

  const handlePreview = (runId: string) => {
    router.push(`/payroll/execution/preview/${runId}`);
  };

  return (
    <DashboardLayout title="Manager Approvals" description="Review and approve payroll runs pending manager approval">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
            title="Go back"
          >
            <ArrowLeft size={24} className="text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Manager Approvals</h1>
            <p className="text-gray-400 mt-1">Review and approve payroll runs pending manager approval</p>
          </div>
          <div className="ml-auto">
            {hasRole('payroll manager', 'system admin') && (
              <button
                onClick={() => router.push('/payroll/execution/escalations')}
                className="mr-3 flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium"
                title="View escalated irregularities"
              >
                <AlertCircle size={16} />
                Escalations
              </button>
            )}
            <button
              onClick={() => {
                fetchPendingApprovals();
                fetchApprovedRuns();
              }}
              disabled={loading || approvedLoading}
              className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] hover:bg-[#333333] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={18} className={loading || approvedLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900 bg-opacity-20 border border-red-500 text-red-200 px-6 py-4 rounded-lg flex items-start gap-4">
            <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading pending approvals...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && payrollRuns.length === 0 && (
          <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-12 text-center">
            <CheckCircle size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">No pending approvals</p>
            <p className="text-gray-500 text-sm mt-2">All payroll runs are up to date</p>
          </div>
        )}

        {/* Table */}
        {!loading && payrollRuns.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0d0d0d] border-b border-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Run ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Employees
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Exceptions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Total Net Pay
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {payrollRuns.map((run) => (
                    <tr key={run._id} className="hover:bg-[#333333] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-white">{run.runId}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Calendar size={16} />
                          {formatDate(run.payrollPeriod)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-300">{run.entity}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Users size={16} />
                          {run.employees}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {run.exceptions > 0 ? (
                            <>
                              <AlertCircle size={16} className="text-yellow-500" />
                              <span className="text-sm text-yellow-500 font-medium">{run.exceptions}</span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-300">0</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <DollarSign size={16} />
                          {formatCurrency(run.totalnetpay)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(run.status)}`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-300">
                          {(() => {
                            if (!run.payrollSpecialistId || typeof run.payrollSpecialistId !== 'object') {
                              return 'N/A';
                            }
                            const name = `${run.payrollSpecialistId.firstName || ''} ${run.payrollSpecialistId.lastName || ''}`.trim();
                            return name || run.payrollSpecialistId.employeeNumber || 'N/A';
                          })()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePreview(run._id)}
                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                            title="Preview"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleViewDetails(run._id)}
                            className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                            title="Details"
                          >
                            <FileText size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRun(run);
                              setShowApproveModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-green-400 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRun(run);
                              setShowRejectModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                          {run.status?.toLowerCase() === 'approved' && (
                            <button
                              onClick={() => {
                                setSelectedRun(run);
                                setActionError(null);
                                setLockReason('');
                                setShowLockModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-purple-400 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                              title="Lock payroll"
                            >
                              <Lock size={18} />
                            </button>
                          )}
                          {run.status?.toLowerCase() === 'locked' && (
                            <button
                              onClick={() => {
                                setSelectedRun(run);
                                setActionError(null);
                                setUnlockReason('');
                                setShowUnlockModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-orange-400 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                              title="Unlock payroll"
                            >
                              <Unlock size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Approved and Locked Runs Section */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Approved & Locked Payrolls</h2>
            <p className="text-sm text-gray-400 mt-1">Manage approved and locked payroll runs - lock to finalize or unlock for changes</p>
          </div>

          {/* Approved Error Message */}
          {approvedError && (
            <div className="bg-red-900 bg-opacity-20 border border-red-500 text-red-200 px-6 py-4 rounded-lg flex items-start gap-4 mb-6">
              <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm mt-1">{approvedError}</p>
              </div>
            </div>
          )}

          {/* Approved Loading State */}
          {approvedLoading && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading approved payrolls...</p>
              </div>
            </div>
          )}

          {/* Approved Empty State */}
          {!approvedLoading && approvedRuns.length === 0 && (
            <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-12 text-center">
              <CheckCircle size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg">No approved or locked payrolls</p>
              <p className="text-gray-500 text-sm mt-2">Approved payroll runs will appear here</p>
            </div>
          )}

          {/* Approved Payroll Runs Table */}
          {!approvedLoading && approvedRuns.length > 0 && (
            <div className="bg-[#2a2a2a] rounded-lg border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#1a1a1a] border-b border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Run ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Entity
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Employees
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Exceptions
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Net Pay
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {approvedRuns.map((run) => (
                      <tr key={run._id} className="hover:bg-[#333333] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-white">{run.runId}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Calendar size={16} />
                            {formatDate(run.payrollPeriod)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-300">{run.entity}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Users size={16} />
                            {run.employees}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {run.exceptions > 0 ? (
                              <>
                                <AlertCircle size={16} className="text-yellow-500" />
                                <span className="text-sm text-yellow-500 font-medium">{run.exceptions}</span>
                              </>
                            ) : (
                              <span className="text-sm text-gray-300">0</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <DollarSign size={16} />
                            {formatCurrency(run.totalnetpay)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(run.status)}`}>
                            {run.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handlePreview(run._id)}
                              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                              title="Preview"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleViewDetails(run._id)}
                              className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                              title="Details"
                            >
                              <FileText size={18} />
                            </button>
                            {run.status?.toLowerCase() === 'approved' && (
                              <button
                                onClick={() => {
                                  setSelectedRun(run);
                                  setActionError(null);
                                  setLockReason('');
                                  setShowLockModal(true);
                                }}
                                className="p-2 text-gray-400 hover:text-purple-400 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                                title="Lock payroll"
                              >
                                <Lock size={18} />
                              </button>
                            )}
                            {run.status?.toLowerCase() === 'locked' && (
                              <button
                                onClick={() => {
                                  setSelectedRun(run);
                                  setActionError(null);
                                  setUnlockReason('');
                                  setShowUnlockModal(true);
                                }}
                                className="p-2 text-gray-400 hover:text-orange-400 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                                title="Unlock payroll"
                              >
                                <Unlock size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Approve Modal */}
        {showApproveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Approve Payroll Run</h3>
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedRun(null);
                    setActionError(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              {actionError && (
                <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded-lg mb-4">
                  {actionError}
                </div>
              )}

              <div className="bg-blue-600/20 border border-blue-600 text-blue-300 px-4 py-3 rounded-lg mb-6">
                <p className="text-sm font-medium">
                  Are you sure you want to approve this payroll run?
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedRun(null);
                    setActionError(null);
                  }}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] hover:bg-[#333333] text-white rounded-lg transition-colors"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApproveRun}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Reject Payroll Run</h3>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedRun(null);
                    setRejectionReason('');
                    setActionError(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              {actionError && (
                <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded-lg mb-4">
                  {actionError}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection"
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none"
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedRun(null);
                    setRejectionReason('');
                    setActionError(null);
                  }}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] hover:bg-[#333333] text-white rounded-lg transition-colors"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectRun}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={actionLoading || !rejectionReason.trim()}
                >
                  {actionLoading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lock Modal */}
        {showLockModal && selectedRun && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Lock size={24} className="text-purple-400" />
                  Lock Payroll Run
                </h3>
                <button
                  onClick={() => {
                    setShowLockModal(false);
                    setSelectedRun(null);
                    setLockReason('');
                    setActionError(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              {actionError && (
                <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded-lg mb-4">
                  {actionError}
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm text-gray-300 mb-4">
                  Locking this payroll run will prevent unauthorized retroactive changes. This is typically done after final approval and processing.
                </p>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Lock Reason *
                </label>
                <textarea
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder="Explain why you are locking this payroll run"
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowLockModal(false);
                    setSelectedRun(null);
                    setLockReason('');
                    setActionError(null);
                  }}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] hover:bg-[#333333] text-white rounded-lg transition-colors"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLockPayroll}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={actionLoading || !lockReason.trim()}
                >
                  {actionLoading ? 'Locking...' : 'Lock'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unlock Modal */}
        {showUnlockModal && selectedRun && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Unlock size={24} className="text-orange-400" />
                  Unlock Payroll Run
                </h3>
                <button
                  onClick={() => {
                    setShowUnlockModal(false);
                    setSelectedRun(null);
                    setUnlockReason('');
                    setActionError(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              {actionError && (
                <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded-lg mb-4">
                  {actionError}
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm text-gray-300 mb-4">
                  Unlocking this payroll run will allow modifications. This should only be done for exceptional circumstances. A detailed reason is required for audit purposes.
                </p>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Unlock Reason (minimum 20 characters) *
                </label>
                <textarea
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  placeholder="Provide a detailed explanation for unlocking (minimum 20 characters)"
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  {unlockReason.trim().length}/20 characters required
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUnlockModal(false);
                    setSelectedRun(null);
                    setUnlockReason('');
                    setActionError(null);
                  }}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] hover:bg-[#333333] text-white rounded-lg transition-colors"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUnlockPayroll}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={actionLoading || unlockReason.trim().length < 20}
                >
                  {actionLoading ? 'Unlocking...' : 'Unlock'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
