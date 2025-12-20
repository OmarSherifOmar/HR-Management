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
  payrollManagerId?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    employeeNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function FinanceApprovalPage() {
  const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch(`${URL}/payroll-execution/finance/pending`, {
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

  useEffect(() => {
    fetchPendingApprovals();
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

      const response = await authenticatedFetch(`${URL}/payroll-execution/finance/approve`, {
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
    } catch (err: any) {
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

      const response = await authenticatedFetch(`${URL}/payroll-execution/finance/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payrollRunId: selectedRun._id,
          rejectionReason,
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
    } catch (err: any) {
      setActionError(err.message || 'An error occurred while rejecting the payroll run');
    } finally {
      setActionLoading(false);
    }
  };

  const openApproveModal = (run: PayrollRun) => {
    setSelectedRun(run);
    setActionError(null);
    setShowApproveModal(true);
  };

  const openRejectModal = (run: PayrollRun) => {
    setSelectedRun(run);
    setActionError(null);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  // Role gating: only Finance Staff and System Admin can access this page
  if (!hasRole('FINANCE_STAFF', 'SYSTEM_ADMIN')) {
    return (
      <DashboardLayout title="Finance Approval">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
            <p className="text-gray-600">You do not have permission to access this page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout title="Finance Approval">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Finance Approval">
      <div className="space-y-6 p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Finance Approval</h1>
            <p className="text-gray-600 mt-2">Review and approve payroll runs awaiting finance approval</p>
          </div>
          <button
            onClick={() => fetchPendingApprovals()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Empty State */}
        {payrollRuns.length === 0 && !error && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No Pending Approvals</h3>
            <p className="text-gray-500 mt-2">All payroll runs have been processed.</p>
          </div>
        )}

        {/* Payroll Runs List */}
        {payrollRuns.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Run ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Period</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Entity</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Employees</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Net Pay</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Manager</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payrollRuns.map((run) => (
                    <tr key={run._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{run.runId}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(run.payrollPeriod)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{run.entity}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          {run.employees}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(run.totalnetpay)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {run.payrollManagerId
                          ? `${run.payrollManagerId.firstName || ''} ${run.payrollManagerId.lastName || ''}`.trim() || 'N/A'
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/payroll/execution/review/${run._id}`)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-xs font-medium"
                            title="View details"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                          <button
                            onClick={() => openApproveModal(run)}
                            className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 text-xs font-medium"
                            title="Approve payroll run"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(run)}
                            className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-xs font-medium"
                            title="Reject payroll run"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
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
      {showApproveModal && selectedRun && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Approve Payroll Run</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to approve this payroll run?
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Run ID:</strong> {selectedRun.runId}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Total Net Pay:</strong> {formatCurrency(selectedRun.totalnetpay)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Employees:</strong> {selectedRun.employees}
                </p>
              </div>

              {actionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm mb-4">
                  {actionError}
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end rounded-b-lg">
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveRun}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium flex items-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRun && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Reject Payroll Run</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting this payroll run.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Run ID:</strong> {selectedRun.runId}
                </p>
              </div>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                rows={4}
              />

              {actionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm mb-4">
                  {actionError}
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end rounded-b-lg">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectRun}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-medium flex items-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Reject
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
